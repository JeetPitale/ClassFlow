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
        } else {
            // Teachers and Admins see all materials
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

        if (!empty($_FILES)) {
            // Multipart/Form-Data
            $data = (object) $_POST;

            if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
                $uploadDir = __DIR__ . '/../uploads/';
                if (!file_exists($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }

                $fileName = time() . '_' . basename($_FILES['file']['name']);
                $targetPath = $uploadDir . $fileName;

                if (move_uploaded_file($_FILES['file']['tmp_name'], $targetPath)) {
                    $fileUrl = '/uploads/' . $fileName; // Public URL
                    $filePath = $targetPath;            // System path

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
                } else {
                    Response::error('Failed to move uploaded file');
                }
            }
        } else {
            // JSON fallback (for links or metadata only)
            $data = json_decode(file_get_contents("php://input"));
            $fileUrl = $data->file_path ?? '';
            $filePath = $data->file_path ?? '';
            $fileType = $data->file_type ?? 'pdf';
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
        if (!$material->findById($id))
            Response::notFound('Material not found');

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
