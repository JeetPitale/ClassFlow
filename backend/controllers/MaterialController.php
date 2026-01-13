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
                    $uploadDir = __DIR__ . '/../uploads/';

                    // Fix: Ensure directory exists and is writable
                    if (!file_exists($uploadDir)) {
                        if (!@mkdir($uploadDir, 0777, true)) {
                            $error = error_get_last();
                            error_log("Failed to create upload directory: " . $uploadDir . " Error: " . ($error['message'] ?? ''));
                            Response::error("Server configuration error: Cannot create upload directory.");
                            return;
                        }
                    }

                    $fileName = time() . '_' . basename($_FILES['file']['name']);
                    $targetPath = $uploadDir . $fileName;

                    if (!@move_uploaded_file($_FILES['file']['tmp_name'], $targetPath)) {
                        $error = error_get_last();
                        error_log("Failed to move uploaded file. Dest: $targetPath. Error: " . ($error['message'] ?? ''));
                        Response::error("Failed to save file. Check server permissions.");
                        return;
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
                    // Handle upload errors explicitly
                    $errorMessages = [
                        UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize',
                        UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE',
                        UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
                        UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder',
                        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
                        UPLOAD_ERR_EXTENSION => 'File upload stopped by extension',
                    ];
                    $errorCode = $_FILES['file']['error'];
                    $msg = $errorMessages[$errorCode] ?? 'Unknown upload error';
                    Response::error("File upload failed: $msg");
                    return;
                }
            } else {
                // Check if post_max_size was exceeded (causing empty $_POST and $_FILES)
                if ($_SERVER['REQUEST_METHOD'] === 'POST' && (empty($_SERVER['CONTENT_LENGTH']) || empty($_POST)) && empty($_FILES)) {
                    $contentLength = $_SERVER['CONTENT_LENGTH'] ?? 0;
                    if ($contentLength > 0) {
                        Response::error('File too large (exceeds post_max_size)');
                        return;
                    }
                }

                // JSON fallback
                $input = file_get_contents("php://input");
                $data = json_decode($input);
                if (json_last_error() !== JSON_ERROR_NONE && empty($_POST)) {
                    // If not JSON and not POST data, we have no data
                    Response::error('Invalid request data: ' . json_last_error_msg());
                    return;
                }

                if (!$data)
                    $data = (object) []; // Ensure object to avoid null property access

                $fileUrl = $data->file_path ?? '';
                $filePath = $data->file_path ?? '';
                $fileType = $data->file_type ?? 'pdf';
            }
        } catch (\Throwable $e) {
            error_log("Material Upload Critical Error: " . $e->getMessage());
            // Force 500 status code
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => "Server Error: " . $e->getMessage(),
                'trace' => $e->getTraceAsString() // Optional: helpful for debugging, remove in prod if sensitive
            ]);
            exit();
        }

        if (!isset($data->title) || !isset($data->semester)) {
            Response::validationError(['title' => 'Title required', 'semester' => 'Semester required']);
        }

        $material = new Material();
        $material->title = $data->title;
        $material->description = $data->description ?? '';
        $material->file_path = $filePath;
        $material->file_url = $fileUrl;
        $material->file_type = $fileType;
        $material->uploaded_by_teacher_id = $decoded['user_id'];
        $material->semester = $data->semester;

        if ($material->create()) {
            // Trigger notification
            require_once __DIR__ . '/../utils/NotificationHelper.php';
            NotificationHelper::createMaterialNotification($material->findById($material->id));

            Response::success($material->findById($material->id), 'Material uploaded successfully', 201);
        } else {
            Response::error('Failed to upload material');
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
        // $material['file_path'] should be the absolute server path from previous step
        $filePath = $material['file_path'];

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
