<?php
require_once __DIR__ . '/../models/Syllabus.php';
require_once __DIR__ . '/../utils/JWTHandler.php';
require_once __DIR__ . '/../utils/Response.php';

class SyllabusController
{
    public static function index()
    {
        error_log("SyllabusController::index called");
        try {
            $user = self::authenticate();
            error_log("User authenticated: " . json_encode($user));

            $teacherId = $user['user_id'] ?? null;

            if (!$teacherId) {
                throw new Exception("Teacher ID missing from token");
            }

            error_log("Fetching syllabus for teacher ID: " . $teacherId);

            $syllabus = new Syllabus();
            $data = $syllabus->getFullSyllabus($teacherId);

            error_log("Syllabus fetched successfully");
            Response::success($data);
        } catch (Throwable $e) {
            error_log("Error in SyllabusController::index: " . $e->getMessage());
            error_log($e->getTraceAsString());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public static function storeTopic()
    {
        try {
            $user = self::authenticate();
            $data = json_decode(file_get_contents("php://input"));

            if (!isset($data->title)) {
                Response::error('Title is required');
                return;
            }

            $syllabus = new Syllabus();
            $id = $syllabus->createTopic($user['user_id'], $data->title, $data->description ?? '', $data->weeks ?? '');

            if ($id) {
                Response::success(['id' => $id], 'Topic added successfully');
            } else {
                Response::error('Failed to add topic');
            }
        } catch (Throwable $e) {
            error_log("Error in storeTopic: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public static function updateTopic($id)
    {
        try {
            self::authenticate();
            $data = json_decode(file_get_contents("php://input"));

            $syllabus = new Syllabus();
            if ($syllabus->updateTopic($id, $data->title, $data->description, $data->weeks)) {
                Response::success(null, 'Topic updated successfully');
            } else {
                Response::error('Failed to update topic');
            }
        } catch (Throwable $e) {
            error_log("Error in updateTopic: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public static function deleteTopic($id)
    {
        try {
            self::authenticate();
            $syllabus = new Syllabus();
            if ($syllabus->deleteTopic($id)) {
                Response::success(null, 'Topic deleted successfully');
            } else {
                Response::error('Failed to delete topic');
            }
        } catch (Throwable $e) {
            error_log("Error in deleteTopic: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public static function toggleTopic($id)
    {
        try {
            self::authenticate();
            $syllabus = new Syllabus();
            if ($syllabus->toggleTopicComplete($id)) {
                Response::success(null, 'Topic status updated');
            } else {
                Response::error('Failed to update status');
            }
        } catch (Throwable $e) {
            error_log("Error in toggleTopic: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // Subtopic Methods
    public static function storeSubtopic()
    {
        try {
            self::authenticate();
            $data = json_decode(file_get_contents("php://input"));

            if (!isset($data->title) || !isset($data->parentId)) {
                Response::error('Title and Parent ID are required');
                return;
            }

            $syllabus = new Syllabus();
            $id = $syllabus->createSubtopic($data->parentId, $data->title, $data->description ?? '');

            if ($id) {
                Response::success(['id' => $id], 'Subtopic added successfully');
            } else {
                Response::error('Failed to add subtopic');
            }
        } catch (Throwable $e) {
            error_log("Error in storeSubtopic: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public static function updateSubtopic($id)
    {
        try {
            self::authenticate();
            $data = json_decode(file_get_contents("php://input"));

            $syllabus = new Syllabus();
            if ($syllabus->updateSubtopic($id, $data->title, $data->description, $data->parentId)) {
                Response::success(null, 'Subtopic updated successfully');
            } else {
                Response::error('Failed to update subtopic');
            }
        } catch (Throwable $e) {
            error_log("Error in updateSubtopic: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public static function deleteSubtopic($id)
    {
        try {
            self::authenticate();
            $syllabus = new Syllabus();
            if ($syllabus->deleteSubtopic($id)) {
                Response::success(null, 'Subtopic deleted successfully');
            } else {
                Response::error('Failed to delete subtopic');
            }
        } catch (Throwable $e) {
            error_log("Error in deleteSubtopic: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public static function toggleSubtopic($id)
    {
        try {
            self::authenticate();
            $syllabus = new Syllabus();
            if ($syllabus->toggleSubtopicComplete($id)) {
                Response::success(null, 'Subtopic status updated');
            } else {
                Response::error('Failed to update status');
            }
        } catch (Throwable $e) {
            error_log("Error in toggleSubtopic: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // Admin Methods
    public static function adminProgress()
    {
        $user = self::authenticate();
        if ($user['role'] !== 'admin') {
            Response::forbidden("Access denied: Admins only");
            return;
        }

        $syllabus = new Syllabus();
        $data = $syllabus->getAllTeachersProgress();
        Response::success($data);
    }

    public static function getTeacherSyllabus($teacherId)
    {
        $user = self::authenticate();
        if ($user['role'] !== 'admin') {
            Response::forbidden("Access denied: Admins only");
            return;
        }

        $syllabus = new Syllabus();
        $data = $syllabus->getFullSyllabus($teacherId);
        Response::success($data);
    }

    private static function authenticate()
    {
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $authHeader = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        $token = str_replace('Bearer ', '', $authHeader);

        $decoded = JWTHandler::validateToken($token);

        if (!$decoded) {
            Response::unauthorized();
            exit;
        }
        return $decoded;
    }
}
?>