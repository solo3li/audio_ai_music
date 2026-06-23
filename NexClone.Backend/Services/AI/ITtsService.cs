using System.IO;
using System.Threading.Tasks;

namespace NexClone.Backend.Services.AI
{
    public interface ITtsService
    {
        Task<(Stream AudioStream, string ContentType, string FileExtension)> GenerateAudioAsync(
            string text, 
            string language, 
            string voiceName, 
            string styleInstruction);
    }
}
