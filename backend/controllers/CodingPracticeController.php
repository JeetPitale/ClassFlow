<?php
require_once __DIR__ . '/../models/CodingQuestion.php';
require_once __DIR__ . '/../models/CodingSubmission.php';
require_once __DIR__ . '/../models/CodingTestCase.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/JWTHandler.php';
require_once __DIR__ . '/../utils/Judge0.php';
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
        $question->time_limit = $data->time_limit ?? 2.0;
        $question->memory_limit = $data->memory_limit ?? 256000;
        $question->category_tags = $data->category_tags ?? '[]';
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
        $question->time_limit = $data->time_limit ?? 2.0;
        $question->memory_limit = $data->memory_limit ?? 256000;
        $question->category_tags = $data->category_tags ?? '[]';

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

    public static function mySubmissions()
    {
        $decoded = self::checkAuth();
        if ($decoded['role'] !== 'student') {
            Response::forbidden('Only students can view their submissions');
        }

        $submission = new CodingSubmission();
        $submissions = $submission->getByStudent($decoded['user_id']);
        
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
        $submission->language_id = $data->language_id ?? 71;

        // Fetch test cases
        $testcaseModel = new CodingTestCase();
        $testcases = $testcaseModel->getByQuestion($id, true);
        
        $submission->total_testcases = count($testcases);
        $passed = 0;
        
        // Mocking Judge0 execution since we are in dev mode
        $isPassed = rand(0, 1) == 1; 
        if ($isPassed) {
            $passed = $submission->total_testcases;
        } else {
            $passed = rand(0, max(0, $submission->total_testcases - 1));
        }
        
        $submission->testcases_passed = $passed;
        $submission->status = ($passed === $submission->total_testcases) ? 'Passed' : 'Failed';
        $submission->score = $passed . '/' . $submission->total_testcases;
        $submission->runtime = rand(10, 50) / 100;
        $submission->memory_used = rand(1000, 5000);

        if ($submission->create()) {
            Response::success(['message' => 'Code submitted successfully', 'status' => $submission->status, 'score' => $submission->score]);
        } else {
            Response::error('Failed to submit code');
        }
    }

    public static function runSample($id)
    {
        $decoded = self::checkAuth();
        if ($decoded['role'] !== 'student') {
            Response::forbidden('Only students can run sample code');
        }

        $data = json_decode(file_get_contents("php://input"));
        if (empty($data->code)) {
            Response::validationError(['code' => 'Code is required']);
        }

        $testcaseModel = new CodingTestCase();
        $visibleTestcases = $testcaseModel->getByQuestion($id, false);
        
        // Mock execution for sample cases
        $results = [];
        foreach($visibleTestcases as $tc) {
            $results[] = [
                'input' => $tc['input_data'],
                'expected' => $tc['expected_output'],
                'actual' => $tc['expected_output'], // Mocking correct output
                'passed' => true
            ];
        }
        
        Response::success(['results' => $results]);
    }

    public static function getTestCases($id)
    {
        $decoded = self::checkAuth();
        if ($decoded['role'] !== 'teacher') {
            Response::forbidden('Only teachers can view testcases directly');
        }

        $testcaseModel = new CodingTestCase();
        $testcases = $testcaseModel->getByQuestion($id, true);
        Response::success($testcases);
    }

    public static function storeTestCase($id)
    {
        $decoded = self::checkAuth();
        if ($decoded['role'] !== 'teacher') {
            Response::forbidden('Only teachers can add testcases');
        }

        $data = json_decode(file_get_contents("php://input"));
        
        if (empty($data->input_data) || empty($data->expected_output)) {
            Response::validationError(['input_data' => 'Input is required', 'expected_output' => 'Output is required']);
        }

        $testcase = new CodingTestCase();
        $testcase->question_id = $id;
        $testcase->input_data = $data->input_data;
        $testcase->expected_output = $data->expected_output;
        $testcase->is_hidden = $data->is_hidden ? 1 : 0;
        $testcase->weight = $data->weight ?? 10;

        if ($testcase->create()) {
            Response::success(['message' => 'Testcase added successfully']);
        } else {
            Response::error('Failed to add testcase');
        }
    }

    public static function deleteTestCase($tc_id)
    {
        $decoded = self::checkAuth();
        if ($decoded['role'] !== 'teacher') {
            Response::forbidden('Only teachers can delete testcases');
        }

        $testcase = new CodingTestCase();
        $testcase->id = $tc_id;
        if ($testcase->delete()) {
            Response::success(['message' => 'Testcase deleted successfully']);
        } else {
            Response::error('Failed to delete testcase');
        }
    }
}
