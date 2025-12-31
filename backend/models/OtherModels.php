<?php
/**
 * Schedule, Feedback, and Startup Idea Models
 */

require_once __DIR__ . '/../config/database.php';

class Schedule
{
    private $conn;
    private $table_name = "schedules";

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    public function getAll()
    {
        $query = "SELECT * FROM " . $this->table_name . " ORDER BY schedule_date, schedule_time";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getForStudent($semester)
    {
        // Matches "Everyone", "Students", or specific semester "Students (Sem X)"
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE target_audience = 'Everyone' 
                     OR target_audience = 'Students' 
                     OR target_audience = :semester_specific
                  ORDER BY schedule_date, schedule_time";

        $semesterSpecific = "Students (Sem " . $semester . ")";

        $stmt = $this->conn->prepare($query);
        $stmt->execute([':semester_specific' => $semesterSpecific]);
        return $stmt->fetchAll();
    }

    public function getForTeacher()
    {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE target_audience = 'Everyone' 
                     OR target_audience = 'Teachers'
                  ORDER BY schedule_date, schedule_time";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function create($data)
    {
        // Get admin ID from JWT
        $headers = getallheaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $decoded = JWTHandler::validateToken($token);
        $adminId = $decoded ? $decoded['user_id'] : null;

        $query = "INSERT INTO " . $this->table_name . "
                  (title, description, schedule_date, schedule_time, location, type, target_audience, created_by_admin_id)
                  VALUES (:title, :description, :schedule_date, :schedule_time, :location, :type, :target_audience, :created_by_admin_id)";
        $stmt = $this->conn->prepare($query);
        if (
            $stmt->execute([
                ':title' => $data->title,
                ':description' => $data->description ?? '',
                ':schedule_date' => $data->schedule_date,
                ':schedule_time' => $data->schedule_time,
                ':location' => $data->location ?? '',
                ':type' => $data->type ?? 'class',
                ':target_audience' => $data->target_audience ?? 'All Students',
                ':created_by_admin_id' => $adminId
            ])
        ) {
            $this->sendScheduleNotifications($data);
            return true;
        }
        return false;
    }

    private function sendScheduleNotifications($data)
    {
        try {
            $audience = $data->target_audience ?? 'Everyone';
            $title = "New Schedule: " . $data->title;
            // Format message: "Math Class on 2024-12-30 at 10:00"
            $message = "New schedule added for " . $data->schedule_date . " at " . $data->schedule_time;

            // Recipients array: ['role' => 'student', 'ids' => [1, 2...]]
            $recipients = [];

            // 1. Fetch Teachers if audience is Everyone or Teachers
            if ($audience === 'Everyone' || $audience === 'Teachers') {
                $stmt = $this->conn->query("SELECT id FROM teachers");
                $teacherIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
                foreach ($teacherIds as $id) {
                    $recipients[] = ['id' => $id, 'role' => 'teacher', 'link' => '/teacher/assignments']; // Dashboard link
                }
            }

            // 2. Fetch Students
            if ($audience === 'Everyone' || $audience === 'Students' || strpos($audience, 'Students (Sem') === 0) {
                if (strpos($audience, 'Students (Sem') === 0) {
                    // Extract semester: "Students (Sem 3)" -> 3
                    preg_match('/Sem (\d+)/', $audience, $matches);
                    $semester = $matches[1] ?? null;
                    if ($semester) {
                        $stmt = $this->conn->prepare("SELECT id FROM students WHERE semester = ?");
                        $stmt->execute([$semester]);
                        $studentIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
                    } else {
                        $studentIds = [];
                    }
                } else {
                    // All students
                    $stmt = $this->conn->query("SELECT id FROM students");
                    $studentIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
                }

                foreach ($studentIds as $id) {
                    $recipients[] = ['id' => $id, 'role' => 'student', 'link' => '/student/dashboard'];
                }
            }

            // 3. Batch insert notifications
            if (!empty($recipients)) {
                $insertQuery = "INSERT INTO notifications (user_id, user_role, type, title, message, link) VALUES (:user_id, :user_role, 'schedule', :title, :message, :link)";
                $stmt = $this->conn->prepare($insertQuery);

                foreach ($recipients as $recipient) {
                    $stmt->execute([
                        ':user_id' => $recipient['id'],
                        ':user_role' => $recipient['role'],
                        ':title' => $title,
                        ':message' => $message,
                        ':link' => $recipient['link']
                    ]);
                }
            }

        } catch (Exception $e) {
            error_log("Failed to send schedule notifications: " . $e->getMessage());
        }
    }

    public function delete($id)
    {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([':id' => $id]);
    }
}

class Feedback
{
    private $conn;
    private $table_name = "feedback";

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    public function getAll()
    {
        $query = "SELECT f.*, s.name as student_name FROM " . $this->table_name . " f
                  LEFT JOIN students s ON f.student_id = s.id
                  ORDER BY f.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getByStudentId($studentId)
    {
        $query = "SELECT f.*, s.name as student_name FROM " . $this->table_name . " f
                  LEFT JOIN students s ON f.student_id = s.id
                  WHERE f.student_id = :student_id
                  ORDER BY f.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([':student_id' => $studentId]);
        return $stmt->fetchAll();
    }

    public function create($student_id, $subject, $message)
    {
        $query = "INSERT INTO " . $this->table_name . " (student_id, subject, message) 
                  VALUES (:student_id, :subject, :message)";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([
            ':student_id' => $student_id,
            ':subject' => $subject,
            ':message' => $message
        ]);
    }

    public function findById($id)
    {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([':id' => $id]);
        return $stmt->fetch();
    }

    public function respond($id, $response)
    {
        $query = "UPDATE " . $this->table_name . " SET response = :response, status = 'reviewed' WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([':id' => $id, ':response' => $response]);
    }
}

class StartupIdea
{
    private $conn;
    private $table_name = "startup_ideas";

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    public function getAll()
    {
        $query = "SELECT si.*, s.name as student_name FROM " . $this->table_name . " si
                  LEFT JOIN students s ON si.student_id = s.id
                  ORDER BY si.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function create($student_id, $idea_title, $description, $category)
    {
        $query = "INSERT INTO " . $this->table_name . " (student_id, idea_title, description, category)
                  VALUES (:student_id, :idea_title, :description, :category)";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([
            ':student_id' => $student_id,
            ':idea_title' => $idea_title,
            ':description' => $description,
            ':category' => $category
        ]);
    }

    public function updateStatus($id, $status, $feedback)
    {
        $query = "UPDATE " . $this->table_name . " 
                  SET status = :status, admin_feedback = :feedback, reviewed_at = NOW() 
                  WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([':id' => $id, ':status' => $status, ':feedback' => $feedback]);
    }
}
