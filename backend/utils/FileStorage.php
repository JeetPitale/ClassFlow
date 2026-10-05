<?php
/**
 * File Storage Utility
 * ClassFlow LMS Backend - Cloud & Serverless Compatible Storage
 * 
 * Supports both local filesystem storage (dev) and Turso Database BLOB/Base64 storage (Vercel serverless).
 */

require_once __DIR__ . '/../config/database.php';

class FileStorage
{
    private static $tableCreated = false;

    /**
     * Ensure the file_storage table exists in the database
     */
    public static function ensureTableExists()
    {
        if (self::$tableCreated) {
            return;
        }

        try {
            $database = new Database();
            $conn = $database->getConnection();
            if ($conn) {
                $conn->exec("CREATE TABLE IF NOT EXISTS file_storage (
                    file_path VARCHAR(255) PRIMARY KEY,
                    file_name VARCHAR(255),
                    mime_type VARCHAR(100),
                    file_size INTEGER,
                    file_data LONGTEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )");
                self::$tableCreated = true;
            }
        } catch (Exception $e) {
            error_log("Failed to ensure file_storage table: " . $e->getMessage());
        }
    }

    /**
     * Get local temporary storage directory
     */
    public static function getTempDir($subFolder = '')
    {
        $dir = sys_get_temp_dir() . '/classflow_uploads' . ($subFolder ? '/' . trim($subFolder, '/') : '');
        if (!is_dir($dir)) {
            @mkdir($dir, 0777, true);
        }
        return $dir;
    }

    /**
     * Detect friendly file type category
     */
    public static function detectFileType($fileName)
    {
        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $typeMap = [
            'pdf' => 'pdf',
            'doc' => 'doc',
            'docx' => 'doc',
            'ppt' => 'slides',
            'pptx' => 'slides',
            'xls' => 'spreadsheet',
            'xlsx' => 'spreadsheet',
            'jpg' => 'image',
            'jpeg' => 'image',
            'png' => 'image',
            'gif' => 'image',
            'webp' => 'image',
            'svg' => 'image',
            'mp3' => 'audio',
            'wav' => 'audio',
            'mp4' => 'video',
            'zip' => 'archive',
            'txt' => 'text'
        ];
        return $typeMap[$ext] ?? 'pdf';
    }

    /**
     * Save an uploaded file from $_FILES
     */
    public static function saveUploadedFile($fileArray, $subFolder = 'materials')
    {
        if (!isset($fileArray['tmp_name']) || !file_exists($fileArray['tmp_name'])) {
            throw new Exception("Invalid uploaded file");
        }

        self::ensureTableExists();

        $originalName = basename($fileArray['name']);
        $sanitizedOriginal = preg_replace('/[^a-zA-Z0-9._-]/', '_', $originalName);
        $uniqueName = time() . '_' . $sanitizedOriginal;
        $fileUrl = '/uploads/' . trim($subFolder, '/') . '/' . $uniqueName;

        $mimeType = mime_content_type($fileArray['tmp_name']) ?: ($fileArray['type'] ?? 'application/octet-stream');
        $fileSize = filesize($fileArray['tmp_name']);
        $rawContent = file_get_contents($fileArray['tmp_name']);
        $base64Data = base64_encode($rawContent);

        // 1. Try local dev directory if writable
        $localDir = dirname(__DIR__) . '/uploads/' . trim($subFolder, '/') . '/';
        $localSaved = false;
        if (!is_dir($localDir)) {
            @mkdir($localDir, 0777, true);
        }
        if (is_dir($localDir) && is_writable($localDir)) {
            $localTarget = $localDir . $uniqueName;
            if (@file_put_contents($localTarget, $rawContent) !== false) {
                $localSaved = true;
            }
        }

        // 2. Cache in /tmp directory
        $tempDir = self::getTempDir($subFolder);
        $tempTarget = $tempDir . '/' . $uniqueName;
        @file_put_contents($tempTarget, $rawContent);

        // 3. Persist in Database (Turso / SQLite) for cross-serverless persistence
        try {
            $database = new Database();
            $conn = $database->getConnection();
            if ($conn) {
                $stmt = $conn->prepare("INSERT OR REPLACE INTO file_storage 
                    (file_path, file_name, mime_type, file_size, file_data, created_at) 
                    VALUES (:file_path, :file_name, :mime_type, :file_size, :file_data, CURRENT_TIMESTAMP)");
                
                $stmt->bindParam(':file_path', $fileUrl);
                $stmt->bindParam(':file_name', $originalName);
                $stmt->bindParam(':mime_type', $mimeType);
                $stmt->bindParam(':file_size', $fileSize);
                $stmt->bindParam(':file_data', $base64Data);
                $stmt->execute();
            }
        } catch (Exception $e) {
            error_log("Failed to persist file in DB: " . $e->getMessage());
            // If local was not saved and DB failed, throw
            if (!$localSaved && !file_exists($tempTarget)) {
                throw new Exception("Failed to save uploaded file: " . $e->getMessage());
            }
        }

        return [
            'file_url' => $fileUrl,
            'file_name' => $uniqueName,
            'original_name' => $originalName,
            'file_type' => self::detectFileType($originalName),
            'mime_type' => $mimeType,
            'size' => $fileSize
        ];
    }

    /**
     * Save base64 encoded data (e.g., avatar image)
     */
    public static function saveBase64($base64String, $subFolder = 'profiles', $fileNamePrefix = 'file')
    {
        self::ensureTableExists();

        $imageType = 'png';
        $base64Data = $base64String;

        if (strpos($base64String, ';base64,') !== false) {
            $parts = explode(';base64,', $base64String);
            $typeParts = explode('image/', $parts[0]);
            if (isset($typeParts[1])) {
                $imageType = $typeParts[1];
            }
            $base64Data = $parts[1];
        }

        $rawContent = base64_decode($base64Data);
        $uniqueName = $fileNamePrefix . '_' . time() . '.' . $imageType;
        $fileUrl = '/uploads/' . trim($subFolder, '/') . '/' . $uniqueName;
        $mimeType = 'image/' . $imageType;
        $fileSize = strlen($rawContent);

        // Save local
        $localDir = dirname(__DIR__) . '/uploads/' . trim($subFolder, '/') . '/';
        if (!is_dir($localDir)) {
            @mkdir($localDir, 0777, true);
        }
        if (is_dir($localDir) && is_writable($localDir)) {
            @file_put_contents($localDir . $uniqueName, $rawContent);
        }

        // Cache temp
        $tempDir = self::getTempDir($subFolder);
        @file_put_contents($tempDir . '/' . $uniqueName, $rawContent);

        // Persist DB
        try {
            $database = new Database();
            $conn = $database->getConnection();
            if ($conn) {
                $stmt = $conn->prepare("INSERT OR REPLACE INTO file_storage 
                    (file_path, file_name, mime_type, file_size, file_data, created_at) 
                    VALUES (:file_path, :file_name, :mime_type, :file_size, :file_data, CURRENT_TIMESTAMP)");
                
                $stmt->bindParam(':file_path', $fileUrl);
                $stmt->bindParam(':file_name', $uniqueName);
                $stmt->bindParam(':mime_type', $mimeType);
                $stmt->bindParam(':file_size', $fileSize);
                $stmt->bindParam(':file_data', $base64Data);
                $stmt->execute();
            }
        } catch (Exception $e) {
            error_log("Failed to persist base64 file in DB: " . $e->getMessage());
        }

        return $fileUrl;
    }

    /**
     * Retrieve file binary data and metadata
     */
    public static function getFile($fileUrl)
    {
        $cleanUrl = '/' . ltrim($fileUrl, '/');

        // 1. Check local project directory
        $localPath = dirname(__DIR__) . $cleanUrl;
        if (file_exists($localPath) && is_file($localPath)) {
            return [
                'content' => file_get_contents($localPath),
                'mime_type' => mime_content_type($localPath) ?: 'application/octet-stream',
                'file_name' => basename($localPath),
                'size' => filesize($localPath)
            ];
        }

        // 2. Check temp directory
        $tempPath = sys_get_temp_dir() . '/classflow_uploads/' . str_replace('/uploads/', '', $cleanUrl);
        if (file_exists($tempPath) && is_file($tempPath)) {
            return [
                'content' => file_get_contents($tempPath),
                'mime_type' => mime_content_type($tempPath) ?: 'application/octet-stream',
                'file_name' => basename($tempPath),
                'size' => filesize($tempPath)
            ];
        }

        // 3. Fetch from DB
        self::ensureTableExists();
        try {
            $database = new Database();
            $conn = $database->getConnection();
            if ($conn) {
                $stmt = $conn->prepare("SELECT * FROM file_storage WHERE file_path = :file_path LIMIT 1");
                $stmt->bindParam(':file_path', $cleanUrl);
                $stmt->execute();
                $row = $stmt->fetch();

                if ($row && !empty($row['file_data'])) {
                    $raw = base64_decode($row['file_data']);
                    // Cache to temp
                    @mkdir(dirname($tempPath), 0777, true);
                    @file_put_contents($tempPath, $raw);

                    return [
                        'content' => $raw,
                        'mime_type' => $row['mime_type'] ?: 'application/octet-stream',
                        'file_name' => $row['file_name'] ?: basename($cleanUrl),
                        'size' => $row['file_size'] ?: strlen($raw)
                    ];
                }
            }
        } catch (Exception $e) {
            error_log("Failed to get file from DB: " . $e->getMessage());
        }

        return null;
    }

    /**
     * Directly stream/serve file to client with headers
     */
    public static function serveFile($fileUrl, $disposition = 'attachment', $customFilename = null)
    {
        $file = self::getFile($fileUrl);
        if (!$file) {
            http_response_code(404);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'File not found on server']);
            exit();
        }

        $fileName = $customFilename ?: $file['file_name'];
        $cleanFileName = preg_replace('/[^a-zA-Z0-9.\-_]/', '_', $fileName);

        // Ensure clean buffer
        if (ob_get_level()) {
            ob_end_clean();
        }

        header('Content-Description: File Transfer');
        header('Content-Type: ' . $file['mime_type']);
        header('Content-Disposition: ' . $disposition . '; filename="' . $cleanFileName . '"');
        header('Expires: 0');
        header('Cache-Control: public, max-age=86400, must-revalidate');
        header('Pragma: public');
        header('Content-Length: ' . strlen($file['content']));

        echo $file['content'];
        exit();
    }

    /**
     * Delete file from disk and database
     */
    public static function deleteFile($fileUrl)
    {
        if (empty($fileUrl)) return;
        $cleanUrl = '/' . ltrim($fileUrl, '/');

        // Delete local
        $localPath = dirname(__DIR__) . $cleanUrl;
        if (file_exists($localPath)) {
            @unlink($localPath);
        }

        // Delete temp
        $tempPath = sys_get_temp_dir() . '/classflow_uploads/' . str_replace('/uploads/', '', $cleanUrl);
        if (file_exists($tempPath)) {
            @unlink($tempPath);
        }

        // Delete from DB
        try {
            self::ensureTableExists();
            $database = new Database();
            $conn = $database->getConnection();
            if ($conn) {
                $stmt = $conn->prepare("DELETE FROM file_storage WHERE file_path = :file_path");
                $stmt->bindParam(':file_path', $cleanUrl);
                $stmt->execute();
            }
        } catch (Exception $e) {
            error_log("Failed to delete file from DB: " . $e->getMessage());
        }
    }
}
