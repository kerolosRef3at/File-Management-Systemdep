using System;
using System.IO;
using System.Security;

namespace FileManagement.Api.Helpers
{
    public static class FilePathHelper
    {
        private static readonly string RootStoragePath = Path.GetFullPath(@"C:\AppStorage\ProtectedFiles\");

        public static string GetRootStoragePath()
        {
            if (!Directory.Exists(RootStoragePath))
            {
                Directory.CreateDirectory(RootStoragePath);
            }
            return RootStoragePath;
        }

        public static string ResolveSafeFilePath(string storageFileName)
        {
            if (string.IsNullOrWhiteSpace(storageFileName))
            {
                throw new ArgumentException("Storage filename cannot be empty.");
            }

            // Strip path characters, retaining only filename
            string safeFileName = Path.GetFileName(storageFileName);
            string fullPath = Path.GetFullPath(Path.Combine(RootStoragePath, safeFileName));

            // Verify canonical path starts within RootStoragePath
            if (!fullPath.StartsWith(RootStoragePath, StringComparison.OrdinalIgnoreCase))
            {
                throw new SecurityException("Directory Traversal attempt detected.");
            }

            return fullPath;
        }
    }
}
