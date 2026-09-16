<?php
require_once __DIR__ . '/../models/CodingQuestion.php';
require_once __DIR__ . '/../models/CodingSubmission.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/JWTHandler.php';

class CodingPracticeController
{
    private static function checkAuth()
    {
        $headers = getClassFlowHeaders();
        $authHeader = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        $token = str_replace('Bearer ', '', $authHeader);
        $decoded = JWTHandler::validateToken($token);

        if (!$decoded) {
            Response::unauthorized('Invalid or missing authentication token');
        }
        return $decoded;
    }

    public static function index()
    {
        $decoded = self::checkAuth();
        $questionModel = new CodingQuestion();
        
        if ($decoded['role'] === 'student') {
            $questions = $questionModel->getAll();
            Response::success($questions);
        } elseif ($decoded['role'] === 'teacher') {
            $questions = $questionModel->getByTeacher($decoded['user_id']);
            Response::success($questions);
        } elseif ($decoded['role'] === 'admin') {
            $questions = $questionModel->getAll();
            Response::success($questions);
        } else {
            Response::forbidden('Access denied');
        }
    }

    public static function store()
    {
        $decoded = self::checkAuth();
        if ($decoded['role'] !== 'teacher') {
            Response::forbidden('Only teachers can create coding questions');
        }

        $data = json_decode(file_get_contents("php://input"));
        
        if (empty($data->title) || empty($data->description)) {
            Response::validationError(['title' => 'Title is required', 'description' => 'Description is required']);
        }

        $question = new CodingQuestion();
        $question->title = $data->title;
        $question->description = $data->description;
        $question->difficulty = $data->difficulty ?? 'Easy';
        $question->created_by_teacher_id = $decoded['user_id'];

        if ($question->create()) {
            Response::success(['message' => 'Question created successfully']);
        } else {
            Response::error('Failed to create question');
        }
    }

    public static function update($id)
    {
        $decoded = self::checkAuth();
        if ($decoded['role'] !== 'teacher') {
            Response::forbidden('Only teachers can edit coding questions');
        }

        $data = json_decode(file_get_contents("php://input"));
        
        if (empty($data->title) || empty($data->description)) {
            Response::validationError(['title' => 'Title is required', 'description' => 'Description is required']);
        }

        $question = new CodingQuestion();
        $existing = $question->findById($id);
        
        if (!$existing) {
            Response::notFound('Question not found');
        }
        if ($existing['created_by_teacher_id'] != $decoded['user_id']) {
            Response::forbidden('You can only edit your own questions');
        }

        $question->id = $id;
        $question->title = $data->title;
        $question->description = $data->description;
        $question->difficulty = $data->difficulty ?? 'Easy';

        if ($question->update()) {
            Response::success(['message' => 'Question updated successfully']);
        } else {
            Response::error('Failed to update question');
        }
    }

    public static function delete($id)
    {
        $decoded = self::checkAuth();
        if ($decoded['role'] !== 'teacher') {
            Response::forbidden('Only teachers can delete coding questions');
        }

        $question = new CodingQuestion();
        $existing = $question->findById($id);
        
        if (!$existing) {
            Response::notFound('Question not found');
        }
        if ($existing['created_by_teacher_id'] != $decoded['user_id']) {
            Response::forbidden('You can only delete your own questions');
        }

        $question->id = $id;
        if ($question->delete()) {
            Response::success(['message' => 'Question deleted successfully']);
        } else {
            Response::error('Failed to delete question');
        }
    }

    public static function submissions($id)
    {
        $decoded = self::checkAuth();
        if ($decoded['role'] !== 'teacher') {
            Response::forbidden('Only teachers can view submissions');
        }

        $question = new CodingQuestion();
        $existing = $question->findById($id);
        
        if (!$existing) {
            Response::notFound('Question not found');
        }
        if ($existing['created_by_teacher_id'] != $decoded['user_id']) {
            Response::forbidden('You can only view submissions for your own questions');
        }

        $submission = new CodingSubmission();
        $submissions = $submission->getByQuestion($id);
        
        Response::success($submissions);
    }

    public static function submit($id)
    {
        $decoded = self::checkAuth();
        if ($decoded['role'] !== 'student') {
            Response::forbidden('Only students can submit answers');
        }

        $data = json_decode(file_get_contents("php://input"));
        
        if (empty($data->code)) {
            Response::validationError(['code' => 'Code is required']);
        }

        $submission = new CodingSubmission();
        $submission->question_id = $id;
        $submission->student_id = $decoded['user_id'];
        $submission->code = $data->code;
        
        // Mock a grading system (since we don't have a real compiler integration yet)
        $isPassed = rand(0, 1) == 1; // 50% chance of passing for demonstration
        $submission->status = $isPassed ? 'Passed' : 'Failed';
        $submission->score = $isPassed ? '100/100' : rand(10, 80) . '/100';

        if ($submission->create()) {
            Response::success(['message' => 'Code submitted successfully', 'status' => $submission->status, 'score' => $submission->score]);
        } else {
            Response::error('Failed to submit code');
        }
    }
}
