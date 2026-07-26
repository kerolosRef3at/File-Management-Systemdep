// js/shared/utils.js
/**
 * Security Utility Functions
 */

/**
 * Escapes HTML special characters in a string to prevent DOM-based XSS attacks.
 */
export function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Sanitizes file names to prevent Path Traversal attacks (CWE-22) and invalid path characters.
 */
export function sanitizeFileName(name) {
    if (!name) return 'unnamed_file';
    return String(name)
        .replace(/\.\./g, '')           // Remove path traversal
        .replace(/[\/\\]/g, '_')        // Remove path separators
        .replace(/[\x00-\x1f]/g, '')    // Remove control characters
        .replace(/[<>:"|?*]/g, '_')     // Remove invalid filesystem chars
        .trim();
}

/**
 * Validates files on the client-side before upload (CWE-434).
 */
export const ALLOWED_EXTENSIONS = [
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.dwg', '.dxf',
    '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp',
    '.mp4', '.avi', '.mov', '.mkv',
    '.zip', '.rar', '.7z',
    '.txt', '.csv', '.json'
];

export const BLOCKED_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js',
    '.msi', '.dll', '.scr', '.com', '.pif', '.hta',
    '.php', '.asp', '.aspx', '.jsp', '.cgi', '.py',
    '.jar', '.war', '.ear'
];

export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export function validateFile(file) {
    const errors = [];
    if (!file) {
        return { valid: false, errors: ['No file selected'] };
    }

    const fileName = file.name || '';
    const ext = '.' + fileName.split('.').pop().toLowerCase();
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    
    // Block double extension attacks (e.g., invoice.pdf.exe)
    if (baseName.includes('.')) {
        const innerExt = '.' + baseName.split('.').pop().toLowerCase();
        if (BLOCKED_EXTENSIONS.includes(innerExt)) {
            errors.push('Double extension attack detected.');
        }
    }
    
    // Check blocked extensions
    if (BLOCKED_EXTENSIONS.includes(ext)) {
        errors.push(`Executable or script file type (${ext}) is strictly prohibited.`);
    }
    
    // Check allowed extensions
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        errors.push(`File format (${ext}) is not supported.`);
    }
    
    // Check file size limit
    if (file.size > MAX_FILE_SIZE) {
        errors.push(`File size exceeds maximum limit of 500MB.`);
    }
    
    // Check for 0-byte empty files
    if (file.size === 0) {
        errors.push('Empty files (0 bytes) are not allowed.');
    }
    
    return { valid: errors.length === 0, errors };
}

/**
 * General string input sanitizer to strip unsafe HTML tags.
 */
export function sanitizeInput(input, maxLength = 255) {
    if (!input) return '';
    return String(input)
        .trim()
        .replace(/[<>'"]/g, '')
        .substring(0, maxLength);
}
