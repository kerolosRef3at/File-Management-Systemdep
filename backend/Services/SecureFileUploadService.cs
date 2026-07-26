using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security;
using System.Threading.Tasks;
using FileManagement.Api.Helpers;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace FileManagement.Api.Services
{
    public interface ISecureFileUploadService
    {
        Task<(string StorageFileName, string OriginalFileName, long FileSize)> ProcessUploadAsync(IFormFile file, string userId);
    }

    public class SecureFileUploadService : ISecureFileUploadService
    {
        private readonly ILogger<SecureFileUploadService> _logger;
        private const long MaxFileSize = 500 * 1024 * 1024; // 500 MB

        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".pdf", ".docx", ".xlsx", ".pptx", ".dwg", ".dxf",
            ".jpg", ".jpeg", ".png", ".gif", ".mp4", ".zip", ".rar", ".7z", ".txt", ".csv"
        };

        private static readonly HashSet<string> DangerousExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".exe", ".dll", ".bat", ".cmd", ".ps1", ".aspx", ".php", ".js", ".vbs", ".msi", ".jar", ".sh", ".py"
        };

        private static readonly Dictionary<string, List<byte[]>> MagicNumbers = new()
        {
            { ".pdf", new() { new byte[] { 0x25, 0x50, 0x44, 0x46 } } },
            { ".png", new() { new byte[] { 0x89, 0x50, 0x4E, 0x47 } } },
            { ".jpg", new() { new byte[] { 0xFF, 0xD8, 0xFF } } },
            { ".jpeg", new() { new byte[] { 0xFF, 0xD8, 0xFF } } },
            { ".zip", new() { new byte[] { 0x50, 0x4B, 0x03, 0x04 } } }
        };

        public SecureFileUploadService(ILogger<SecureFileUploadService> logger)
        {
            _logger = logger;
        }

        public async Task<(string StorageFileName, string OriginalFileName, long FileSize)> ProcessUploadAsync(IFormFile file, string userId)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("Uploaded file payload is empty.");

            if (file.Length > MaxFileSize)
                throw new SecurityException("File size exceeds 500MB limit.");

            string rawFileName = Path.GetFileName(file.FileName);
            string extension = Path.GetExtension(rawFileName).ToLowerInvariant();

            // 1. Extension Validation
            if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension) || DangerousExtensions.Contains(extension))
            {
                _logger.LogWarning("SECURITY ALERT: Prohibited extension {Ext} upload attempt by User {UserId}", extension, userId);
                throw new SecurityException("Prohibited or unsupported file extension.");
            }

            // 2. Double Extension Prevention
            string fileNameWithoutExt = Path.GetFileNameWithoutExtension(rawFileName);
            if (fileNameWithoutExt.Contains('.'))
            {
                string innerExtension = Path.GetExtension(fileNameWithoutExt).ToLowerInvariant();
                if (DangerousExtensions.Contains(innerExtension))
                {
                    _logger.LogWarning("SECURITY ALERT: Double extension attack detected ({FileName}) by User {UserId}", rawFileName, userId);
                    throw new SecurityException("Double extension pattern prohibited.");
                }
            }

            // 3. Binary Magic Number Signature Check
            using (var stream = file.OpenReadStream())
            using (var reader = new BinaryReader(stream))
            {
                var headerBytes = reader.ReadBytes(8);
                if (MagicNumbers.TryGetValue(extension, out var signatures))
                {
                    bool isValidMagic = signatures.Any(sig => headerBytes.Take(sig.Length).SequenceEqual(sig));
                    if (!isValidMagic)
                    {
                        _logger.LogWarning("SECURITY ALERT: Magic byte signature mismatch for file {FileName} by User {UserId}", rawFileName, userId);
                        throw new SecurityException("File binary signature validation failed.");
                    }
                }
            }

            // 4. Random GUID Storage Naming Outside wwwroot
            string storageFileName = $"{Guid.NewGuid():N}{extension}";
            string destinationPath = FilePathHelper.ResolveSafeFilePath(storageFileName);

            using (var destinationStream = new FileStream(destinationPath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
            {
                await file.CopyToAsync(destinationStream);
            }

            _logger.LogInformation("File successfully stored. User: {UserId}, StorageFileName: {StorageName}", userId, storageFileName);
            return (storageFileName, rawFileName, file.Length);
        }
    }
}
