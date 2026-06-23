using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace NexClone.Backend.Services
{
    public interface IMediaService
    {
        Task<string> UploadFileAsync(IFormFile file, string bucketName = null);
        Task<string> UploadFileAsync(System.IO.Stream stream, string objectName, string contentType, string bucketName = null);
        Task<byte[]> DownloadFileAsync(string objectName, string bucketName = null);
        Task<string> GetFileUrlAsync(string objectName, string bucketName = null);
        Task<string> GeneratePresignedUploadUrlAsync(string objectName, string contentType, string bucketName = null);
    }
}
