<?php
require_once __DIR__ . '/../models/OtherModels.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/JWTHandler.php';

class ScheduleController
{
    public static function index()
    {
        $headers = getallheaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $decoded = JWTHandler::validateToken($token);

        if (!$decoded) {
            Response::error('Unauthorized', 401);
            return;
        }

        $schedule = new Schedule();
        $schedules = [];

        if ($decoded['role'] === 'student') {
            require_once __DIR__ . '/../models/Student.php';
            $studentModel = new Student();
            $student = $studentModel->findById($decoded['user_id']);
            $currentSemester = $student['semester'] ?? 1;
            $schedules = $schedule->getForStudent($currentSemester);
        } elseif ($decoded['role'] === 'teacher') {
            $schedules = $schedule->getForTeacher();
        } else {
            // Admin sees all
            $schedules = $schedule->getAll();
        }

        Response::success($schedules);
    }

    public static function store()
    {
        $data = json_decode(file_get_contents("php://input"));
        $schedule = new Schedule();
        if ($schedule->create($data)) {
            Response::success(null, 'Schedule created successfully', 201);
        } else {
            Response::error('Failed to create schedule');
        }
    }

    public static function destroy($id)
    {
        $schedule = new Schedule();
        if ($schedule->delete($id)) {
            Response::success(null, 'Schedule deleted successfully');
        } else {
            Response::error('Failed to delete schedule');
        }
    }
}

class FeedbackController
{
    public static function index()
    {
        // Get JWT token
        $headers = getallheaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $decoded = JWTHandler::validateToken($token);

        if (!$decoded) {
            Response::error('Unauthorized', 401);
            return;
        }

        $feedback = new Feedback();

        // Students only see their own feedback for privacy
        // Admin/Teacher see all feedback
        if ($decoded['role'] === 'student') {
            $feedbacks = $feedback->getByStudentId($decoded['user_id']);
        } else {
            $feedbacks = $feedback->getAll();
        }

        Response::success($feedbacks);
    }

    public static function store()
    {
        $headers = getallheaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $decoded = JWTHandler::validateToken($token);
        if (!$decoded || $decoded['role'] !== 'student') {
            Response::forbidden('Only students can submit feedback');
        }

        $data = json_decode(file_get_contents("php://input"));
        $feedback = new Feedback();
        if ($feedback->create($decoded['user_id'], $data->subject ?? '', $data->message ?? '')) {
            // Notify Admins
            try {
                require_once __DIR__ . '/../models/Notification.php';
                $database = new Database();
                $db = $database->getConnection();

                // Get all admins
                $adminQuery = "SELECT id FROM admins";
                $stmt = $db->prepare($adminQuery);
                $stmt->execute();

                while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    $notification = new Notification();
                    $notification->user_id = $row['id'];
                    $notification->user_role = 'admin';
                    $notification->type = 'feedback';
                    $notification->title = 'New Feedback Received';
                    $notification->message = 'New feedback submitted: "' . substr($data->subject ?? '', 0, 50) . '..."';
                    $notification->link = '/admin/feedback';
                    $notification->create();
                }
            } catch (Exception $e) {
                error_log("Failed to notify admins: " . $e->getMessage());
            }

            Response::success(null, 'Feedback submitted successfully', 201);
        } else {
            Response::error('Failed to submit feedback');
        }
    }

    public static function respond($id)
    {
        $data = json_decode(file_get_contents("php://input"));
        $feedback = new Feedback();

        if ($feedback->respond($id, $data->response ?? '')) {
            // Get the feedback details to send notification
            $feedbackDetails = $feedback->findById($id);

            if ($feedbackDetails && isset($feedbackDetails['student_id'])) {
                try {
                    // Load Notification model
                    require_once __DIR__ . '/../models/Notification.php';

                    // Create notification for the student
                    $notification = new Notification();
                    $notification->user_id = $feedbackDetails['student_id'];
                    $notification->user_role = 'student';
                    $notification->type = 'feedback';
                    $notification->title = 'Feedback Response Received';
                    $notification->message = 'Admin has responded to your feedback: "' . substr($feedbackDetails['subject'], 0, 50) . '..."';
                    $notification->link = '/student/feedback';
                    $created = $notification->create();

                    if (!$created) {
                        error_log("Failed to create notification for student: " . $feedbackDetails['student_id']);
                    }
                } catch (Exception $e) {
                    error_log("Notification error: " . $e->getMessage());
                }
            }

            Response::success(null, 'Response sent successfully');
        } else {
            Response::error('Failed to send response');
        }
    }
}


