<?php
require_once __DIR__ . '/../models/Assignment.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/JWTHandler.php';

class AssignmentController
{
    public static function index()
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        $token = str_replace('Bearer ', '', $authHeader);
        $decoded = JWTHandler::validateToken($token);

        if (!$decoded) {
            Response::unauthorized('Invalid or missing authentication token');
        }

        $assignment = new Assignment();
        $assignments = [];

        if ($decoded['role'] === 'student') {
            // Get Student details to check semester
            require_once __DIR__ . '/../models/Student.php';
            $studentModel = new Student();
            $student = $studentModel->findById($decoded['user_id']);

            if ($student) {
                $assignments = $assignment->getBySemester($student['semester']);
            }
        } elseif ($decoded['role'] === 'teacher') {
            // Teachers see ONLY their own assignments
            $assignments = $assignment->getByTeacher($decoded['user_id']);
        } elseif ($decoded['role'] === 'admin') {
            // Admins see all
            $assignments = $assignment->getAll();
        } else {
            Response::forbidden('Access denied');
        }

        Response::success($assignments);
    }

    public static function show($id)
    {
        $assignment = new Assignment();
        $data = $assignment->findById($id);
        if (!$data)
            Response::notFound('Assignment not found');
        Response::success($data);
    }

    public static function store()
    {
        $headers = getallheaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $decoded = JWTHandler::validateToken($token);
        if (!$decoded || $decoded['role'] !== 'teacher') {
            Response::forbidden('Only teachers can create assignments');
        }

        // Handle multipart/form-data (cannot use file_get_contents for POST data)
        // DEBUG
        error_log("POST: " . print_r($_POST, true));
        error_log("FILES: " . print_r($_FILES, true));

        $title = $_POST['title'] ?? null;
        $due_date = $_POST['due_date'] ?? null;

        if (!$title || !$due_date) {
            Response::validationError(['title' => 'Title required', 'due_date' => 'Due date required']);
        }

        $assignment = new Assignment();
        $assignment->title = $title;
        $assignment->description = $_POST['description'] ?? '';
        $assignment->due_date = $due_date;
        $assignment->total_marks = $_POST['total_marks'] ?? 100;
        $assignment->created_by_teacher_id = $decoded['user_id'];
        $assignment->semester = $_POST['semester'] ?? null;
        $assignment->attachment_path = null;

        // Handle File Upload
        if (isset($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = __DIR__ . '/../uploads/assignments/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $fileExtension = pathinfo($_FILES['attachment']['name'], PATHINFO_EXTENSION);
            $fileName = uniqid() . '_' . time() . '.' . $fileExtension;
            $targetPath = $uploadDir . $fileName;

            if (move_uploaded_file($_FILES['attachment']['tmp_name'], $targetPath)) {
                // Store relative path or full URL depending on your setup. 
                // Here preserving relative path structure for serving.
                // Assuming your server serves 'uploads' directory at root
                $assignment->attachment_path = '/uploads/assignments/' . $fileName;
            }
        }

        if ($assignment->create()) {
            Response::success($assignment->findById($assignment->id), 'Assignment created successfully', 201);
        } else {
            Response::error('Failed to create assignment');
        }
    }

    public static function update($id)
    {
        $headers = getallheaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $decoded = JWTHandler::validateToken($token);
        if (!$decoded)
            Response::unauthorized('Invalid token');

        // Handle POST form data
        $title = $_POST['title'] ?? null;
        $due_date = $_POST['due_date'] ?? null;

        $assignment = new Assignment();
        $existing = $assignment->findById($id);
        if (!$existing)
            Response::notFound('Assignment not found');

        $assignment->id = $id;
        $assignment->title = $title ?? $existing['title'];
        $assignment->description = $_POST['description'] ?? $existing['description'];
        $assignment->due_date = $due_date ?? $existing['due_date'];
        $assignment->total_marks = $_POST['total_marks'] ?? $existing['total_marks'];
        $assignment->semester = $_POST['semester'] ?? $existing['semester'];
        $assignment->attachment_path = $existing['attachment_path']; // Default to existing

        // Handle File Upload if provided
        if (isset($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = __DIR__ . '/../uploads/assignments/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $fileName = $id . '_' . time() . '.' . pathinfo($_FILES['attachment']['name'], PATHINFO_EXTENSION);
            $targetPath = $uploadDir . $fileName;

            if (move_uploaded_file($_FILES['attachment']['tmp_name'], $targetPath)) {
                $assignment->attachment_path = 'uploads/assignments/' . $fileName;
            }
        }

        if ($assignment->update()) {
            Response::success($assignment->findById($id), 'Assignment updated successfully');
        } else {
            Response::error('Failed to update assignment');
        }
    }

    public static function destroy($id)
    {
        $assignment = new Assignment();
        if (!$assignment->findById($id))
            Response::notFound('Assignment not found');
        $assignment->id = $id;
        if ($assignment->delete()) {
            Response::success(null, 'Assignment deleted successfully');
        } else {
            Response::error('Failed to delete assignment');
        }
    }

    public static function getSubmissions($id)
    {
        $assignment = new Assignment();
        $submissions = $assignment->getSubmissions($id);
        Response::success($submissions);
    }

    public static function submit($id)
    {
        $headers = getallheaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $decoded = JWTHandler::validateToken($token);
        if (!$decoded || $decoded['role'] !== 'student') {
            Response::forbidden('Only students can submit assignments');
        }

        $data = json_decode(file_get_contents("php://input"));
        $assignment = new Assignment();
        if ($assignment->submitAssignment($id, $decoded['user_id'], $data->submission_text ?? '', $data->file_path ?? null)) {
            Response::success(null, 'Assignment submitted successfully', 201);
        } else {
            Response::error('Failed to submit assignment');
        }
    }

    public static function grade($submission_id)
    {
        $headers = getallheaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $decoded = JWTHandler::validateToken($token);
        if (!$decoded || $decoded['role'] !== 'teacher') {
            Response::forbidden('Only teachers can grade assignments');
        }

        $data = json_decode(file_get_contents("php://input"));
        $assignment = new Assignment();

        // Fetch submission details for notification
        $submission = $assignment->getSubmission($submission_id);

        if ($assignment->gradeSubmission($submission_id, $data->marks ?? 0, $data->feedback ?? '')) {
            // Trigger notification
            if ($submission) {
                require_once __DIR__ . '/../utils/NotificationHelper.php';
                NotificationHelper::createAssignmentGradeNotification(
                    $submission['student_id'],
                    $submission['assignment_title'],
                    $data->marks ?? 0
                );
            }
            Response::success(null, 'Assignment graded successfully');
        } else {
            Response::error('Failed to grade assignment');
        }
    }

    public static function mySubmissions()
    {
        $headers = getallheaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $decoded = JWTHandler::validateToken($token);

        if (!$decoded || $decoded['role'] !== 'student') {
            Response::forbidden('Access denied');
        }

        $assignment = new Assignment();
        $submissions = $assignment->getStudentSubmissions($decoded['user_id']);
        Response::success($submissions);
    }

    public static function gradeStudent($assignment_id)
    {
        try {
            $headers = getallheaders();
            $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
            $decoded = JWTHandler::validateToken($token);
            if (!$decoded || $decoded['role'] !== 'teacher') {
                Response::forbidden('Only teachers can grade assignments');
            }

            $data = json_decode(file_get_contents("php://input"));
            if (!isset($data->student_id)) {
                Response::validationError(['student_id' => 'Student ID is required']);
            }

            $assignment = new Assignment();

            // Check if submission exists
            $submission = $assignment->findStudentSubmission($assignment_id, $data->student_id);

            if (!$submission) {
                // Create placeholder submission
                $result = $assignment->submitAssignment($assignment_id, $data->student_id, 'Teacher Manual Grading', null);
                if (!$result) {
                    throw new Exception("Failed to create placeholder submission");
                }
                $submission = $assignment->findStudentSubmission($assignment_id, $data->student_id);
                if (!$submission) {
                    throw new Exception("Details not found after creating submission");
                }
            }

            if ($assignment->gradeSubmission($submission['id'], $data->marks ?? 0, $data->feedback ?? '')) {
                // Trigger notification
                require_once __DIR__ . '/../utils/NotificationHelper.php';
                // We need title
                $asgn = $assignment->findById($assignment_id);
                if ($asgn) {
                    NotificationHelper::createAssignmentGradeNotification(
                        $data->student_id,
                        $asgn['title'],
                        $data->marks ?? 0
                    );
                }
                Response::success(null, 'Grade saved successfully');
            } else {
                Response::error('Failed to save grade');
            }
        } catch (Exception $e) {
            error_log("Grade Error: " . $e->getMessage());
            Response::serverError("Server Error: " . $e->getMessage());
        }
    }
}
