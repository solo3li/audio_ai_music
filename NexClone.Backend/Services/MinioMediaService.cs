using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Minio;
using Minio.DataModel.Args;
using NexClone.Backend.Models;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace NexClone.Backend.Services
{
    public class MinioMediaService : IMediaService
    {
        private IMinioClient _minioClient;
        private string _defaultBucket;
        private string _region;
        private readonly ApplicationDbContext _context;

        public MinioMediaService(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _defaultBucket = "nexmedia"; // Will be overridden if set in DB
        }

        private async Task EnsureClientInitializedAsync()
        {
            if (_minioClient != null) return;

            var appSettings = await _context.AppSettings.ToListAsync();
            var dbEndpoint = appSettings.FirstOrDefault(s => s.Key == "S3.Endpoint")?.Value;
            var dbAccessKey = appSettings.FirstOrDefault(s => s.Key == "S3.AccessKey")?.Value;
            var dbSecretKey = appSettings.FirstOrDefault(s => s.Key == "S3.SecretKey")?.Value;
            var dbRegion = appSettings.FirstOrDefault(s => s.Key == "S3.Region")?.Value;
            var dbBucketName = appSettings.FirstOrDefault(s => s.Key == "S3.BucketName")?.Value;

            var endpoint = !string.IsNullOrWhiteSpace(dbEndpoint) ? dbEndpoint : "s3.eu-north-1.amazonaws.com";
            var accessKey = !string.IsNullOrWhiteSpace(dbAccessKey) ? dbAccessKey : (Environment.GetEnvironmentVariable("AWS_ACCESS_KEY_ID") ?? "YOUR_AWS_ACCESS_KEY");
            var secretKey = !string.IsNullOrWhiteSpace(dbSecretKey) ? dbSecretKey : (Environment.GetEnvironmentVariable("AWS_SECRET_ACCESS_KEY") ?? "YOUR_AWS_SECRET_KEY");
            var region = !string.IsNullOrWhiteSpace(dbRegion) ? dbRegion : "eu-north-1";
            _region = region;
            
            _defaultBucket = !string.IsNullOrWhiteSpace(dbBucketName) ? dbBucketName : "nexmedia-ai-files";

            _minioClient = new MinioClient()
                .WithEndpoint(endpoint)
                .WithCredentials(accessKey, secretKey)
                .WithRegion(region)
                .WithSSL(true)
                .Build();
        }

        public async Task<string> UploadFileAsync(IFormFile file, string bucketName = null)
        {
            await EnsureClientInitializedAsync();
            var objectName = $"{Guid.NewGuid()}_{file.FileName}";

            using var stream = file.OpenReadStream();
            
            return await UploadFileAsync(stream, objectName, file.ContentType, bucketName);
        }

        public async Task<string> UploadFileAsync(Stream stream, string objectName, string contentType, string bucketName = null)
        {
            await EnsureClientInitializedAsync();
            
            string actualObjectName = string.IsNullOrWhiteSpace(bucketName) || bucketName == _defaultBucket ? objectName : $"{bucketName}/{objectName}";

            var bucketExistsArgs = new BucketExistsArgs().WithBucket(_defaultBucket);
            bool found = await _minioClient.BucketExistsAsync(bucketExistsArgs).ConfigureAwait(false);
            if (!found)
            {
                var makeBucketArgs = new MakeBucketArgs().WithBucket(_defaultBucket).WithLocation(_region);
                await _minioClient.MakeBucketAsync(makeBucketArgs).ConfigureAwait(false);
            }

            var putObjectArgs = new PutObjectArgs()
                .WithBucket(_defaultBucket)
                .WithObject(actualObjectName)
                .WithStreamData(stream)
                .WithObjectSize(stream.Length)
                .WithContentType(contentType);

            await _minioClient.PutObjectAsync(putObjectArgs).ConfigureAwait(false);

            return actualObjectName;
        }

        public async Task<byte[]> DownloadFileAsync(string objectName, string bucketName = null)
        {
            await EnsureClientInitializedAsync();
            using var memoryStream = new MemoryStream();

            var getObjectArgs = new GetObjectArgs()
                .WithBucket(_defaultBucket)
                .WithObject(objectName)
                .WithCallbackStream(stream =>
                {
                    stream.CopyTo(memoryStream);
                });

            await _minioClient.GetObjectAsync(getObjectArgs).ConfigureAwait(false);

            return memoryStream.ToArray();
        }

        public async Task<string> GetFileUrlAsync(string objectName, string bucketName = null)
        {
            await EnsureClientInitializedAsync();

            // AWS S3 Virtual-Hosted Style URL
            var publicEndpoint = $"{_defaultBucket}.s3.{_region}.amazonaws.com";
            
            return $"https://{publicEndpoint}/{objectName}";
        }

        public async Task<string> GeneratePresignedUploadUrlAsync(string objectName, string contentType, string bucketName = null)
        {
            await EnsureClientInitializedAsync();

            string actualObjectName = string.IsNullOrWhiteSpace(bucketName) || bucketName == _defaultBucket ? objectName : $"{bucketName}/{objectName}";

            var presignedPutObjectArgs = new PresignedPutObjectArgs()
                .WithBucket(_defaultBucket)
                .WithObject(actualObjectName)
                .WithExpiry(60 * 60); // 1 hour expiry

            return await _minioClient.PresignedPutObjectAsync(presignedPutObjectArgs).ConfigureAwait(false);
        }
    }
}
