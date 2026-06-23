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
            var dbEndpoint = appSettings.FirstOrDefault(s => s.Key == "Minio.Endpoint")?.Value;
            var dbAccessKey = appSettings.FirstOrDefault(s => s.Key == "Minio.AccessKey")?.Value;
            var dbSecretKey = appSettings.FirstOrDefault(s => s.Key == "Minio.SecretKey")?.Value;
            var dbRegion = appSettings.FirstOrDefault(s => s.Key == "S3.Region")?.Value;
            var dbBucketName = appSettings.FirstOrDefault(s => s.Key == "Minio.BucketName")?.Value;

            var endpoint = !string.IsNullOrWhiteSpace(dbEndpoint) ? dbEndpoint : "minio:9000";
            var accessKey = !string.IsNullOrWhiteSpace(dbAccessKey) ? dbAccessKey : "minioadmin";
            var secretKey = !string.IsNullOrWhiteSpace(dbSecretKey) ? dbSecretKey : "minioadmin";
            var region = !string.IsNullOrWhiteSpace(dbRegion) ? dbRegion : "eu-north-1";
            _region = region;
            
            _defaultBucket = !string.IsNullOrWhiteSpace(dbBucketName) ? dbBucketName : "nexmedia";

            bool useSSL = endpoint.Contains("amazonaws.com") || endpoint.StartsWith("https");

            _minioClient = new MinioClient()
                .WithEndpoint(endpoint.Replace("http://", "").Replace("https://", ""))
                .WithCredentials(accessKey, secretKey)
                .WithRegion(region)
                .WithSSL(useSSL)
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

            // Use localhost:9000 for local development so the frontend can access it
            var publicEndpoint = "localhost:9000";
            
            return $"http://{publicEndpoint}/{_defaultBucket}/{objectName}";
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
