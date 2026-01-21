<?php
require_once __DIR__ . '/../models/Material.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/JWTHandler.php';

class MaterialController
{
    public static function index()
    {
        $headers = getallheaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $decoded = JWTHandler::validateToken($token);

        $material = new Material();
        $materials = [];

        if ($decoded && $decoded['role'] === 'student') {
            require_once __DIR__ . '/../models/Student.php';
            $studentModel = new Student();
            $student = $studentModel->findById($decoded['user_id']);

            if ($student) {
                $materials = $material->getBySemester($student['semester']);
            }
        } elseif ($decoded && $decoded['role'] === 'teacher') {
            // Teachers see ONLY their own materials
            $materials = $material->getByTeacher($decoded['user_id']);
        } else {
            // Admins see all
            $materials = $material->getAll();
        }

        Response::success($materials);
        // Deployment Trigger: v2 - Force update
    }

    public static function store()
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        $token = str_replace('Bearer ', '', $authHeader);

        $decoded = JWTHandler::validateToken($token);

        // Debug logging
        if (!$decoded) {
            error_log("Token validation failed. Token: " . substr($token, 0, 10) . "...");
        } else {
            error_log("User Role: " . $decoded['role']);
        }

        if (!$decoded || ($decoded['role'] !== 'teacher' && $decoded['role'] !== 'admin')) {
            Response::forbidden('Only teachers can upload materials (Role: ' . ($decoded['role'] ?? 'none') . ')');
        }

        // Handle both JSON and Multipart/Form-Data
        $data = null;
        $fileUrl = '';
        $filePath = '';
        $fileType = 'pdf';

        try {
            if (!empty($_FILES)) {
                // Multipart/Form-Data
                $data = (object) $_POST;

                if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
                    // Define absolute path to uploads directory at the project root level (sibling of controllers, etc)
                    // __DIR__ is .../backend/controllers
                    // we want .../backend/uploads
                    // Use dirname(__DIR__) to get the parent directory (backend root)
                    $uploadDir = dirname(__DIR__) . '/uploads/';

                    // Create directory if it doesn't exist
                    if (!is_dir($uploadDir)) {
                        if (!mkdir($uploadDir, 0777, true)) {
                            error_log("Failed to create upload directory: " . $uploadDir);
                        }
                    }

                    // Try to ensure it is writable
                    @chmod($uploadDir, 0777);

                    if (!is_writable($uploadDir)) {
                        error_log("Upload directory is not writable: " . $uploadDir);
                        // We continue to see if move_uploaded_file works anyway, sometimes is_writable is false positive on some setups
                    }

                    $fileName = time() . '_' . basename($_FILES['file']['name']);
                    // sanitize filename
                    $fileName = preg_replace('/[^a-zA-Z0-9._-]/', '', $fileName);

                    $targetPath = $uploadDir . $fileName;

                    if (!move_uploaded_file($_FILES['file']['tmp_name'], $targetPath)) {
                        // Detailed error for debugging
                        $error = error_get_last();
                        throw new Exception("Failed to move uploaded file to: " . $targetPath . " (Error: " . ($error['message'] ?? 'Unknown') . ")");
                    }

                    $fileUrl = '/uploads/' . $fileName;
                    $filePath = $targetPath;

                    // Detect file type
                    $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
                    $typeMap = [
                        'pdf' => 'pdf',
                        'doc' => 'doc',
                        'docx' => 'doc',
                        'ppt' => 'slides',
                        'pptx' => 'slides',
                        'jpg' => 'image',
                        'jpeg' => 'image',
                        'png' => 'image',
                        'mp3' => 'audio',
                        'wav' => 'audio'
                    ];
                    $fileType = $typeMap[$ext] ?? 'pdf';

                } elseif (isset($_FILES['file']) && $_FILES['file']['error'] !== UPLOAD_ERR_NO_FILE) {
                    // Map error code to message
                    $errorCode = $_FILES['file']['error'];
                    $errorMessages = [
                        UPLOAD_ERR_INI_SIZE => 'The uploaded file exceeds the upload_max_filesize directive in php.ini',
                        UPLOAD_ERR_FORM_SIZE => 'The uploaded file exceeds the MAX_FILE_SIZE directive that was specified in the HTML form',
                        UPLOAD_ERR_PARTIAL => 'The uploaded file was only partially uploaded',
                        UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder',
                        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
                        UPLOAD_ERR_EXTENSION => 'File upload stopped by extension',
                    ];
                    throw new Exception("File upload failed: " . ($errorMessages[$errorCode] ?? 'Unknown error'));
                }
            } else {
                // Check content length for exceeding post_max_size
                if ($_SERVER['REQUEST_METHOD'] === 'POST' && (empty($_SERVER['CONTENT_LENGTH']) || empty($_POST)) && empty($_FILES)) {
                    $contentLength = $_SERVER['CONTENT_LENGTH'] ?? 0;
                    if ($contentLength > 0) {
                        throw new Exception('File too large (exceeds post_max_size in php.ini)');
                    }
                }

                // JSON fallback
                $input = file_get_contents("php://input");
                $data = json_decode($input);
                if (json_last_error() !== JSON_ERROR_NONE && empty($_POST)) {
                    throw new Exception('Invalid request data: ' . json_last_error_msg());
                }

                if (!$data)
                    $data = (object) [];

                $fileUrl = $data->file_path ?? '';
                $filePath = $data->file_path ?? '';
                $fileType = $data->file_type ?? 'pdf';
            }

            // --- MOVED INSIDE TRY-CATCH ---
            if (!isset($data->title) || !isset($data->semester)) {
                // Manually throw to be caught by catch block, or just return Response::validationError (which exits)
                // Response::validationError calls exit(), so it is fine.
                Response::validationError(['title' => 'Title required', 'semester' => 'Semester required']);
            }

            $material = new Material();
            $material->title = $data->title;
            // Handle null description safely
            $material->description = $data->description ?? '';
            // $material->file_path = $filePath; // Not used in DB
            $material->file_url = $fileUrl;
            $material->file_type = $fileType;
            $material->uploaded_by_teacher_id = $decoded['user_id'];
            $material->semester = $data->semester;

            if ($material->create()) {
                // Trigger notification
                try {
                    require_once __DIR__ . '/../utils/NotificationHelper.php';
                    NotificationHelper::createMaterialNotification($material->findById($material->id));
                } catch (\Throwable $nErr) {
                    error_log("Notification Error: " . $nErr->getMessage());
                    // Don't fail the upload if notification fails
                }

                Response::success($material->findById($material->id), 'Material uploaded successfully', 201);
            } else {
                throw new Exception("Failed to insert material into database.");
            }

        } catch (\Throwable $e) {
            error_log("Material Upload Critical Error: " . $e->getMessage());
            error_log("Trace: " . $e->getTraceAsString());

            // Force 500 status code
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => "Server Error: " . $e->getMessage(),
                // 'trace' => $e->getTraceAsString() // Keep trace for debugging this specific issue
            ]);
            exit();
        }
    }

    public static function update($id)
    {
        $headers = getallheaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $decoded = JWTHandler::validateToken($token);

        if (!$decoded || $decoded['role'] !== 'teacher') {
            Response::forbidden('Only teachers can update materials');
        }

        // Handle POST/Multipart
        $data = (object) $_POST;
        $material = new Material();
        $existing = $material->findById($id);

        if (!$existing) {
            Response::notFound('Material not found');
        }

        if ($existing['uploaded_by_teacher_id'] != $decoded['user_id']) {
            Response::forbidden('You can only update materials you uploaded');
        }

        // Handle File Update
        $fileUrl = $existing['file_url'];
        $filePath = realpath(__DIR__ . '/../') . $fileUrl; // Reconstruct path
        $fileType = $existing['file_type'];

        if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = dirname(__DIR__) . '/uploads/';

            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            @chmod($uploadDir, 0777);

            $fileName = time() . '_' . basename($_FILES['file']['name']);
            $fileName = preg_replace('/[^a-zA-Z0-9._-]/', '', $fileName);
            $targetPath = $uploadDir . $fileName;

            if (move_uploaded_file($_FILES['file']['tmp_name'], $targetPath)) {
                // Remove old file
                if (file_exists($filePath)) {
                    unlink($filePath);
                }
                $filePath = $targetPath;
                $fileUrl = '/uploads/' . $fileName;

                // Update type
                $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
                $typeMap = ['pdf' => 'pdf', 'doc' => 'doc', 'docx' => 'doc', 'ppt' => 'slides', 'pptx' => 'slides', 'jpg' => 'image', 'png' => 'image'];
                $fileType = $typeMap[$ext] ?? 'pdf';
            }
        }

        $material->id = $id;
        $material->title = $_POST['title'] ?? $existing['title'];
        $material->description = $_POST['description'] ?? $existing['description'];
        // $material->file_path = $filePath; // Not used in DB
        $material->file_url = $fileUrl;
        $material->file_type = $fileType;
        $material->semester = $_POST['semester'] ?? $existing['semester'];

        if ($material->update()) {
            Response::success($material->findById($id), 'Material updated successfully');
        } else {
            Response::error('Failed to update material');
        }
    }

    public static function destroy($id)
    {
        $headers = getallheaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $decoded = JWTHandler::validateToken($token);
        if (!$decoded)
            Response::unauthorized('Invalid token');

        $material = new Material();
        $existing = $material->findById($id);

        if (!$existing)
            Response::notFound('Material not found');

        // Enforce ownership: Only Admin or the Original Uploader can delete
        if ($decoded['role'] !== 'admin' && $existing['uploaded_by_teacher_id'] != $decoded['user_id']) {
            Response::forbidden('You can only delete materials you uploaded');
        }

        $material->id = $id;
        if ($material->delete()) {
            Response::success(null, 'Material deleted successfully');
        } else {
            Response::error('Failed to delete material');
        }
    }

    public static function download($id)
    {
        // 1. Validate Token (Allow students, teachers, admins)
        $headers = getallheaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $decoded = JWTHandler::validateToken($token);

        if (!$decoded) {
            // For download links, sometimes token is passed in query param if headers aren't possible
            // But here we rely on the frontend ensuring the user is logged in. 
            // If opening in new tab, headers might be tricky. 
            // Let's check query param 'token' as fallback
            $token = $_GET['token'] ?? '';
            $decoded = JWTHandler::validateToken($token);

            if (!$decoded) {
                http_response_code(401);
                die('Unauthorized');
            }
        }

        // 2. Get Material
        $materialModel = new Material();
        $material = $materialModel->findById($id);

        if (!$material) {
            http_response_code(404);
            die('Material not found');
        }

        // 3. Verify File Exists
        // $material['file_path'] might be missing from DB, reconstruct it
        $filePath = realpath(__DIR__ . '/../') . $material['file_url'];

        if (!file_exists($filePath)) {
            // Try relative if absolute fails (backward compatibility)
            $relativeConfig = __DIR__ . '/../' . $filePath;
            if (file_exists($relativeConfig)) {
                $filePath = $relativeConfig;
            } else {
                http_response_code(404);
                die('File not found on server');
            }
        }

        // 4. Force Download Headers
        $fileName = basename($filePath);
        // Clean filename for header
        $downloadName = preg_replace('/[^a-zA-Z0-9.\-_]/', '_', $material['title']) . '.' . pathinfo($filePath, PATHINFO_EXTENSION);

        header('Content-Description: File Transfer');
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . $downloadName . '"');
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
        header('Content-Length: ' . filesize($filePath));

        // 5. Output File
        readfile($filePath);
        exit;
    }
}
