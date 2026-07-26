using System;
using System.IO;
using System.Security.Claims;
using System.Threading.Tasks;
using FileManagement.Api.Helpers;
using FileManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Logging;

namespace FileManagement.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class FilesController : ControllerBase
    {
        private readonly ISecureFileUploadService _uploadService;
        private readonly IFileRepository _fileRepository;
        private readonly ISecureAuditLogger _auditLogger;
        private readonly ILogger<FilesController> _logger;

        public FilesController(
            ISecureFileUploadService uploadService,
            IFileRepository fileRepository,
            ISecureAuditLogger auditLogger,
            ILogger<FilesController> logger)
        {
            _uploadService = uploadService;
            _fileRepository = fileRepository;
            _auditLogger = auditLogger;
            _logger = logger;
        }

        [HttpPost("upload")]
        [EnableRateLimiting("UploadPolicy")]
        [RequestSizeLimit(524_288_000)] // 500MB
        public async Task<IActionResult> UploadFile(IFormFile file, [FromQuery] string departmentCode)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var (storageName, originalName, size) = await _uploadService.ProcessUploadAsync(file, userId);

            var record = await _fileRepository.CreateFileMetadataAsync(new FileMetadataRecord
            {
                Id = Guid.NewGuid(),
                OriginalFileName = originalName,
                StorageFileName = storageName,
                ContentType = file.ContentType,
                FileSize = size,
                OwnerUserId = userId,
                DepartmentCode = departmentCode?.ToUpperInvariant() ?? "GENERAL",
                UploadedAt = DateTime.UtcNow
            });

            await _auditLogger.LogEventAsync(userId, "FILE_UPLOAD", record.Id.ToString());
            return Ok(new { FileId = record.Id, FileName = record.OriginalFileName });
        }

        [HttpGet("download/{fileId:guid}")]
        [EnableRateLimiting("DownloadPolicy")]
        public async Task<IActionResult> DownloadFile(Guid fileId)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var currentUserRole = User.FindFirstValue(ClaimTypes.Role);
            var currentUserDept = User.FindFirstValue("DepartmentCode");

            var metadata = await _fileRepository.GetByIdAsync(fileId);
            if (metadata == null)
            {
                return NotFound("Requested file does not exist.");
            }

            // IDOR Protection: Validate Ownership and Department Isolation
            bool isOwner = metadata.OwnerUserId == currentUserId;
            bool isSameDepartment = string.Equals(metadata.DepartmentCode, currentUserDept, StringComparison.OrdinalIgnoreCase);
            bool isSupervisor = string.Equals(currentUserRole, "Supervisor", StringComparison.OrdinalIgnoreCase);

            if (!isSupervisor && !isOwner && !isSameDepartment)
            {
                await _auditLogger.LogEventAsync(currentUserId, "UNAUTHORIZED_DOWNLOAD_ATTEMPT", fileId.ToString());
                return Forbid(); // 403 Forbidden
            }

            string safeFullPath = FilePathHelper.ResolveSafeFilePath(metadata.StorageFileName);
            if (!System.IO.File.Exists(safeFullPath))
            {
                return NotFound("Physical file missing on disk.");
            }

            await _auditLogger.LogEventAsync(currentUserId, "FILE_DOWNLOAD", fileId.ToString());
            return PhysicalFile(safeFullPath, metadata.ContentType ?? "application/octet-stream", metadata.OriginalFileName);
        }
    }

    public interface IFileRepository
    {
        Task<FileMetadataRecord> GetByIdAsync(Guid id);
        Task<FileMetadataRecord> CreateFileMetadataAsync(FileMetadataRecord record);
    }

    public class FileMetadataRecord
    {
        public Guid Id { get; set; }
        public string OriginalFileName { get; set; }
        public string StorageFileName { get; set; }
        public string ContentType { get; set; }
        public long FileSize { get; set; }
        public string OwnerUserId { get; set; }
        public string DepartmentCode { get; set; }
        public DateTime UploadedAt { get; set; }
    }
}
