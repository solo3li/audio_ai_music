using Microsoft.AspNetCore.Identity;
using NexClone.Backend.Models;
using System;
using System.Security.Cryptography;
using System.Text;

namespace NexClone.Backend.Services
{
    public class DjangoPasswordHasher : PasswordHasher<ApplicationUser>
    {
        public override PasswordVerificationResult VerifyHashedPassword(ApplicationUser user, string hashedPassword, string providedPassword)
        {
            if (hashedPassword.StartsWith("pbkdf2_sha256$"))
            {
                var parts = hashedPassword.Split('$');
                if (parts.Length == 4)
                {
                    var algorithm = parts[0];
                    var iterations = int.Parse(parts[1]);
                    var salt = parts[2];
                    var hashBase64 = parts[3];

                    var saltBytes = Encoding.UTF8.GetBytes(salt);
                    
                    // Django's pbkdf2_sha256 uses HMAC-SHA256
                    using (var deriveBytes = new Rfc2898DeriveBytes(providedPassword, saltBytes, iterations, HashAlgorithmName.SHA256))
                    {
                        byte[] expectedHashBytes = deriveBytes.GetBytes(32); // 256 bits = 32 bytes
                        byte[] actualHashBytes = Convert.FromBase64String(hashBase64);

                        if (CryptographicOperations.FixedTimeEquals(expectedHashBytes, actualHashBytes))
                        {
                            // Password is correct, but needs to be re-hashed using the new ASP.NET Core standard
                            return PasswordVerificationResult.SuccessRehashNeeded;
                        }
                    }
                    return PasswordVerificationResult.Failed;
                }
            }

            // Fallback to default ASP.NET Core hasher
            return base.VerifyHashedPassword(user, hashedPassword, providedPassword);
        }
    }
}
