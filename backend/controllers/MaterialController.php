<?php
require_once __DIR__ . '/../models/Material.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/JWTHandler.php';
require_once __DIR__ . '/../utils/FileStorage.php';

class MaterialController
{
    public static function index()
    {
        $headers = getClassFlowHeaders();
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
        $headers = getClassFlowHeaders();
        $authHeader = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        $token = str_replace('Bearer ', '', $authHeader);

        $decoded = JWTHandler::validateToken($token);

        if (!$decoded || ($decoded['role'] !== 'teacher' && $decoded['role'] !== 'admin')) {
            Response::forbidden('Only teachers can upload materials (Role: ' . ($decoded['role'] ?? 'none') . ')');
        }

        // Handle both JSON and Multipart/Form-Data
        $data = null;
        $fileUrl = '';
        $fileType = 'pdf';

        try {
            if (!empty($_FILES)) {
                // Multipart/Form-Data
                $data = (object) $_POST;

                if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
                    $uploadResult = FileStorage::saveUploadedFile($_FILES['file'], 'materials');
                    $fileUrl = $uploadResult['file_url'];
                    $fileType = $uploadResult['file_type'];
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

                $fileUrl = $data->file_path ?? ($data->file_url ?? '');
                $fileType = $data->file_type ?? 'pdf';
            }

            if (!isset($data->title) || !isset($data->semester)) {
                Response::validationError(['title' => 'Title required', 'semester' => 'Semester required']);
            }

            $material = new Material();
            $material->title = $data->title;
            $material->description = $data->description ?? '';
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
                }

                Response::success($material->findById($material->id), 'Material uploaded successfully', 201);
            } else {
                throw new Exception("Failed to insert material into database.");
            }

        } catch (\Throwable $e) {
            error_log("Material Upload Critical Error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => "Server Error: " . $e->getMessage()
            ]);
            exit();
        }
    }

    public static function update($id)
    {
        $headers = getClassFlowHeaders();
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
        $fileType = $existing['file_type'];

        if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
            FileStorage::deleteFile($existing['file_url']);
            $uploadResult = FileStorage::saveUploadedFile($_FILES['file'], 'materials');
            $fileUrl = $uploadResult['file_url'];
            $fileType = $uploadResult['file_type'];
        }

        $material->id = $id;
        $material->title = $_POST['title'] ?? $existing['title'];
        $material->description = $_POST['description'] ?? $existing['description'];
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
        $headers = getClassFlowHeaders();
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

        FileStorage::deleteFile($existing['file_url']);

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
        $headers = getClassFlowHeaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $decoded = JWTHandler::validateToken($token);

        if (!$decoded) {
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

        // 3. Force Download/View Headers
        $ext = pathinfo($material['file_url'], PATHINFO_EXTENSION) ?: 'pdf';
        $downloadName = preg_replace('/[^a-zA-Z0-9.\-_]/', '_', $material['title']) . '.' . $ext;
        $disposition = (isset($_GET['inline']) && $_GET['inline'] === 'true') ? 'inline' : 'attachment';

        FileStorage::serveFile($material['file_url'], $disposition, $downloadName);
    }
}
