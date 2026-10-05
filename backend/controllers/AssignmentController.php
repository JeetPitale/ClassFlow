<?php
require_once __DIR__ . '/../models/Assignment.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/JWTHandler.php';
require_once __DIR__ . '/../utils/FileStorage.php';

class AssignmentController
{
    public static function index()
    {
        $headers = getClassFlowHeaders();
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
        $headers = getClassFlowHeaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $decoded = JWTHandler::validateToken($token);
        if (!$decoded || $decoded['role'] !== 'teacher') {
            Response::forbidden('Only teachers can create assignments');
        }

        // Handle POST form data
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
        $assignment->scheduled_at = !empty($_POST['scheduled_at']) ? date('Y-m-d H:i:s', strtotime($_POST['scheduled_at'])) : null;
        $assignment->attachment_path = null;

        // Handle File Upload
        if (isset($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
            try {
                $uploadResult = FileStorage::saveUploadedFile($_FILES['attachment'], 'assignments');
                $assignment->attachment_path = $uploadResult['file_url'];
            } catch (Exception $e) {
                error_log("Failed to save assignment attachment: " . $e->getMessage());
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
        $headers = getClassFlowHeaders();
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
        $assignment->scheduled_at = isset($_POST['scheduled_at']) ? (!empty($_POST['scheduled_at']) ? date('Y-m-d H:i:s', strtotime($_POST['scheduled_at'])) : null) : $existing['scheduled_at'];
        $assignment->attachment_path = $existing['attachment_path']; // Default to existing

        // Handle File Upload if provided
        if (isset($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
            try {
                if (!empty($existing['attachment_path'])) {
                    FileStorage::deleteFile($existing['attachment_path']);
                }
                $uploadResult = FileStorage::saveUploadedFile($_FILES['attachment'], 'assignments');
                $assignment->attachment_path = $uploadResult['file_url'];
            } catch (Exception $e) {
                error_log("Failed to update assignment attachment: " . $e->getMessage());
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
        $existing = $assignment->findById($id);
        if (!$existing)
            Response::notFound('Assignment not found');
            
        if (!empty($existing['attachment_path'])) {
            FileStorage::deleteFile($existing['attachment_path']);
        }

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
        $headers = getClassFlowHeaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $decoded = JWTHandler::validateToken($token);
        if (!$decoded || $decoded['role'] !== 'student') {
            Response::forbidden('Only students can submit assignments');
        }

        $filePath = null;
        if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
            $uploadResult = FileStorage::saveUploadedFile($_FILES['file'], 'submissions');
            $filePath = $uploadResult['file_url'];
        }

        $submissionText = $_POST['submission_text'] ?? '';
        if (empty($submissionText) && empty($filePath)) {
            $input = json_decode(file_get_contents("php://input"));
            if ($input) {
                $submissionText = $input->submission_text ?? '';
                $filePath = $input->file_path ?? null;
            }
        }

        $assignment = new Assignment();
        if ($assignment->submitAssignment($id, $decoded['user_id'], $submissionText, $filePath)) {
            Response::success(null, 'Assignment submitted successfully', 201);
        } else {
            Response::error('Failed to submit assignment');
        }
    }

    public static function grade($submission_id)
    {
        $headers = getClassFlowHeaders();
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
        $headers = getClassFlowHeaders();
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
            $headers = getClassFlowHeaders();
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
