<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Startup.php';
require_once __DIR__ . '/../utils/Response.php';

class StartupController
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

        $database = new Database();
        $db = $database->getConnection();
        $startup = new Startup($db);

        // Filter based on role
        if ($decoded['role'] === 'student') {
            // Students: ONLY see their own ideas
            $stmt = $startup->getByStudentId($decoded['user_id']);
        } else {
            // Admin/Teachers: See all
            // TODO: Add refined permission checks if needed
            $stmt = $startup->getAll();
        }

        $num = $stmt->rowCount();
        $startups_arr = array();

        if ($num > 0) {
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                extract($row);
                $startup_item = array(
                    "id" => $id,
                    "studentId" => $student_id,
                    "studentName" => $student_name,
                    "title" => $title,
                    "category" => $category,
                    "briefDescription" => $brief_description,
                    "problemStatement" => $problem_statement,
                    "solutionOverview" => $solution_overview,
                    "teamSize" => $team_size,
                    "targetMarket" => $target_market,
                    "businessModel" => $business_model,
                    "fundingRequired" => $funding_required,
                    "currentStage" => $current_stage,
                    "tags" => !empty($tags) ? explode(',', $tags) : [],
                    "attachments" => !empty($attachments) ? explode(',', $attachments) : [],
                    "status" => $status,
                    "adminRemarks" => $admin_remarks,
                    "createdAt" => $created_at
                );
                array_push($startups_arr, $startup_item);
            }
        }

        Response::success($startups_arr);
    }

    public static function store()
    {
        $headers = getallheaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $decoded = JWTHandler::validateToken($token);

        if (!$decoded || $decoded['role'] !== 'student') {
            Response::forbidden('Only students can submit startup ideas');
        }

        $database = new Database();
        $db = $database->getConnection();
        $startup = new Startup($db);

        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->title) && !empty($data->category)) {
            // Use ID from token, not from request body
            $startup->student_id = $decoded['user_id'];
            $startup->title = $data->title;
            $startup->category = $data->category;
            $startup->brief_description = $data->briefDescription;
            $startup->problem_statement = $data->problemStatement ?? '';
            $startup->solution_overview = $data->solutionOverview ?? '';
            $startup->team_size = $data->teamSize ?? 1;
            $startup->target_market = $data->targetMarket ?? '';
            $startup->business_model = $data->businessModel ?? '';
            $startup->funding_required = $data->fundingRequired ?? 0;
            $startup->current_stage = $data->currentStage;
            $startup->tags = isset($data->tags) && is_array($data->tags) ? implode(',', $data->tags) : '';
            $startup->attachments = isset($data->attachments) && is_array($data->attachments) ? implode(',', $data->attachments) : '';

            if ($startup->create()) {
                // Notify Admins
                try {
                    require_once __DIR__ . '/../models/Notification.php';

                    // Get all admins
                    $adminQuery = "SELECT id FROM admins";
                    $stmt = $db->prepare($adminQuery);
                    $stmt->execute();

                    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                        $notification = new Notification();
                        $notification->user_id = $row['id'];
                        $notification->user_role = 'admin';
                        $notification->type = 'startup_submission';
                        $notification->title = 'New Startup Idea Submitted';
                        $notification->message = 'A new startup idea "' . substr($startup->title, 0, 50) . '" has been submitted.';
                        $notification->link = '/admin/startups';
                        $notification->create();
                    }
                } catch (Exception $e) {
                    error_log("Failed to notify admins: " . $e->getMessage());
                }

                Response::success(["message" => "Startup idea submitted successfully."]);
            } else {
                Response::error("Unable to submit startup idea.", 503);
            }
        } else {
            Response::error("Incomplete data.", 400);
        }
    }

    public static function review($id)
    {
        // Add auth check for admin if needed, currently just protecting student endpoints heavily
        $database = new Database();
        $db = $database->getConnection();
        $startup = new Startup($db);

        $data = json_decode(file_get_contents("php://input"));

        $startup->id = $id;
        $startup->status = $data->status;
        $startup->admin_remarks = $data->adminRemarks;

        if ($startup->updateStatus()) {
            // Get startup details to send notification
            $startupDetails = $startup->findById($id);

            if ($startupDetails && isset($startupDetails['student_id'])) {
                try {
                    require_once __DIR__ . '/../models/Notification.php';

                    $notification = new Notification();
                    $notification->user_id = $startupDetails['student_id'];
                    $notification->user_role = 'student';
                    $notification->type = 'startup_review';
                    $notification->title = 'Startup Idea Reviewed';
                    $notification->message = 'Your startup idea "' . substr($startupDetails['title'], 0, 50) . '" has been marked as ' . ucfirst($data->status) . '.';
                    $notification->link = '/student/startup';
                    $created = $notification->create();

                    if (!$created) {
                        error_log("Failed to create notification for student: " . $startupDetails['student_id']);
                    }
                } catch (Exception $e) {
                    error_log("Notification error: " . $e->getMessage());
                }
            }
            Response::success(["message" => "Startup idea status updated."]);
        } else {
            Response::error("Unable to update startup idea.", 503);
        }
    }
}
