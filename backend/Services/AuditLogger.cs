using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace FileManagement.Api.Services
{
    public interface ISecureAuditLogger
    {
        Task LogEventAsync(string userId, string action, string resourceId, string details = null);
    }

    public class SecureAuditLogger : ISecureAuditLogger
    {
        private readonly ILogger<SecureAuditLogger> _logger;

        public SecureAuditLogger(ILogger<SecureAuditLogger> logger)
        {
            _logger = logger;
        }

        public Task LogEventAsync(string userId, string action, string resourceId, string details = null)
        {
            _logger.LogInformation(
                "AUDIT LOG | Timestamp: {Timestamp} | User: {UserId} | Action: {Action} | Resource: {Resource} | Details: {Details}",
                DateTime.UtcNow.ToString("o"),
                userId ?? "ANONYMOUS",
                action,
                resourceId ?? "N/A",
                details ?? "N/A"
            );
            return Task.CompletedTask;
        }
    }
}
