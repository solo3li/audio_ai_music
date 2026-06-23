using NexClone.Backend.Models.Payments;
using System.Threading.Tasks;

namespace NexClone.Backend.Services.Payments
{
    public interface IPaymentService
    {
        Task<PaymentResult> CreatePaymobIntentAsync(int planId, string userId, string userEmail, string userFirstName, string userLastName, string phoneNumber);
    }
}
