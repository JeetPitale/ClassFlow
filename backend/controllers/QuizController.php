<?php
require_once __DIR__ . '/../models/Quiz.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/JWTHandler.php';

class QuizController
{
    public static function index()
    {
        $headers = getallheaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $decoded = JWTHandler::validateToken($token);

        $quiz = new Quiz();
        $quizzes = [];

        if ($decoded && $decoded['role'] === 'student') {
            require_once __DIR__ . '/../models/Student.php';
            $studentModel = new Student();
            $student = $studentModel->findById($decoded['user_id']);

            if ($student) {
                // Assuming Quiz model has getBySemester method (which I verified it does)
                $quizzes = $quiz->getBySemester($student['semester']);
            }
        } else {
            // Teachers and Admins see all quizzes
            $quizzes = $quiz->getAll();
        }

        Response::success($quizzes);
    }

    public static function store()
    {
        try {
            $headers = getallheaders();
            $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
            $decoded = JWTHandler::validateToken($token);
            if (!$decoded || $decoded['role'] !== 'teacher') {
                Response::forbidden('Only teachers can create quizzes');
            }

            $data = json_decode(file_get_contents("php://input"));

            if (!isset($data->title) || !isset($data->duration) || !isset($data->maxMarks)) {
                Response::error('Missing required fields');
                return;
            }

            $quiz = new Quiz();
            $quiz->title = $data->title;
            $quiz->description = $data->description ?? '';
            $quiz->duration_minutes = $data->duration;
            $quiz->total_marks = $data->maxMarks;
            $quiz->semester = $data->semester ?? 1;
            $quiz->created_by_teacher_id = $decoded['user_id'];

            if ($quiz->create()) {
                Response::success(['id' => $quiz->id], 'Quiz created successfully', 201);
            } else {
                Response::error('Failed to create quiz');
            }
        } catch (Exception $e) {
            error_log("Error in store quiz: " . $e->getMessage());
            Response::error('Failed to create quiz: ' . $e->getMessage(), 500);
        }
    }

    public static function show($id)
    {
        $quiz = new Quiz();
        $data = $quiz->findById($id);
        if (!$data)
            Response::notFound('Quiz not found');
        Response::success($data);
    }

    public static function update($id)
    {
        $headers = getallheaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $decoded = JWTHandler::validateToken($token);
        if (!$decoded || $decoded['role'] !== 'teacher') {
            Response::forbidden('Only teachers can update quizzes');
        }

        $data = json_decode(file_get_contents("php://input"));
        $quiz = new Quiz();
        $existing = $quiz->findById($id);

        if (!$existing) {
            Response::notFound('Quiz not found');
        }

        // Ideally check ownership here: if ($existing['created_by_teacher_id'] != $decoded['user_id']) Response::forbidden();

        $quiz->id = $id;
        $quiz->title = $data->title ?? $existing['title'];
        $quiz->description = $data->description ?? $existing['description'];
        $quiz->duration_minutes = $data->duration ?? $existing['duration_minutes'];
        $quiz->total_marks = $data->maxMarks ?? $existing['total_marks'];
        $quiz->semester = $data->semester ?? $existing['semester'];

        if ($quiz->update()) {
            Response::success(null, 'Quiz updated successfully');
        } else {
            Response::error('Failed to update quiz');
        }
    }

    public static function destroy($id)
    {
        $quiz = new Quiz();
        if (!$quiz->findById($id))
            Response::notFound('Quiz not found');
        $quiz->id = $id;
        if ($quiz->delete()) {
            Response::success(null, 'Quiz deleted successfully');
        } else {
            Response::error('Failed to delete quiz');
        }
    }

    public static function getQuestions($id)
    {
        $quiz = new Quiz();
        $questions = $quiz->getQuestions($id);

        $mappedQuestions = array_map(function ($q) {
            return [
                'id' => $q['id'],
                'quiz_id' => $q['quiz_id'],
                'question' => $q['question_text'], // Map question_text to question
                'options' => json_decode($q['options_json']), // Decode JSON options
                'correctAnswer' => $q['correct_answer'], // CamelCase
                'marks' => $q['marks']
            ];
        }, $questions);

        Response::success($mappedQuestions);
    }

    public static function addQuestion($quiz_id)
    {
        try {
            $headers = getallheaders();
            $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
            $decoded = JWTHandler::validateToken($token);
            if (!$decoded || $decoded['role'] !== 'teacher') {
                Response::forbidden('Only teachers can add questions');
            }

            $data = json_decode(file_get_contents("php://input"));

            if (!isset($data->question) || !isset($data->options) || !isset($data->correctAnswer) || !isset($data->marks)) {
                Response::error('Missing required fields');
                return;
            }

            $quiz = new Quiz();
            // Verify quiz ownership/existence if needed

            $questionId = $quiz->addQuestion(
                $quiz_id,
                $data->question,
                $data->options,
                $data->correctAnswer,
                $data->marks
            );

            if ($questionId) {
                // Return the full question object
                Response::success([
                    'id' => $questionId,
                    'question' => $data->question,
                    'options' => $data->options,
                    'correct_answer' => $data->correctAnswer,
                    'marks' => $data->marks
                ], 'Question added successfully', 201);
            } else {
                Response::error('Failed to add question');
            }
        } catch (Exception $e) {
            error_log("Error in addQuestion: " . $e->getMessage());
            Response::error('Failed to add question: ' . $e->getMessage(), 500);
        }
    }

    public static function submitAttempt($id)
    {
        try {
            $headers = getallheaders();
            $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
            $decoded = JWTHandler::validateToken($token);
            if (!$decoded || $decoded['role'] !== 'student') {
                Response::forbidden('Only students can take quizzes');
            }

            $data = json_decode(file_get_contents("php://input"));
            $quiz = new Quiz();
            $answers = $data->answers ?? [];

            // Server-side grading
            $calculatedScore = $quiz->gradeQuiz($id, $answers);

            // Fetch quiz total marks for validation
            $quizDetails = $quiz->findById($id);
            if ($quizDetails) {
                $totalMarks = intval($quizDetails['total_marks']);
                if ($calculatedScore > $totalMarks) {
                    $calculatedScore = $totalMarks;
                }
            }

            // Pass answers along with score
            if ($quiz->submitAttempt($id, $decoded['user_id'], $calculatedScore, $answers)) {

                // Trigger notification
                if ($quizDetails) {
                    require_once __DIR__ . '/../utils/NotificationHelper.php';
                    NotificationHelper::createQuizGradeNotification(
                        $decoded['user_id'],
                        $quizDetails['title'],
                        $calculatedScore,
                        $quizDetails['total_marks']
                    );
                }

                Response::success(['score' => $calculatedScore], 'Quiz submitted successfully', 201);
            } else {
                Response::error('Failed to submit quiz');
            }
        } catch (\Throwable $e) {
            error_log("Error in submitAttempt: " . $e->getMessage());
            Response::error('Failed to submit quiz: ' . $e->getMessage(), 500);
        }
    }

    public static function myAttempts()
    {
        $headers = getallheaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $decoded = JWTHandler::validateToken($token);

        if (!$decoded || $decoded['role'] !== 'student') {
            Response::forbidden('Access denied');
        }

        $quiz = new Quiz();
        $attempts = $quiz->getStudentAttempts($decoded['user_id']);
        Response::success($attempts);
    }

    public static function history()
    {
        $headers = getallheaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $decoded = JWTHandler::validateToken($token);

        if (!$decoded || $decoded['role'] !== 'teacher') {
            Response::forbidden('Access denied');
        }

        $quiz = new Quiz();
        $attempts = $quiz->getTeacherQuizAttempts($decoded['user_id']); // user_id is teacher_id here
        Response::success($attempts);
    }
    public static function bulkAddQuestions($quizId)
    {
        $headers = getallheaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $decoded = JWTHandler::validateToken($token);

        if (!$decoded || $decoded['role'] !== 'teacher') {
            Response::forbidden('Only teachers can add questions');
        }

        $data = json_decode(file_get_contents("php://input"), true);
        if (!is_array($data)) {
            Response::error('Invalid data format. Expected array of questions.');
            return;
        }

        $quiz = new Quiz();

        // Transform keys if necessary or assume frontend sends correct format.
        // Frontend sends: { question, options: [], correctAnswer, marks }
        // Model expects: same keys roughly

        if ($quiz->addQuestions($quizId, $data)) {
            Response::success(['count' => count($data)], 'Questions added successfully', 201);
        } else {
            Response::error('Failed to add questions');
        }
    }
    public static function deleteQuestion($quizId, $questionId)
    {
        $headers = getallheaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $decoded = JWTHandler::validateToken($token);

        if (!$decoded || $decoded['role'] !== 'teacher') {
            Response::forbidden('Only teachers can delete questions');
        }

        $quiz = new Quiz();
        if ($quiz->deleteQuestion($questionId)) {
            Response::success(null, 'Question deleted successfully');
        } else {
            // In production, don't expose DB errors, but for debug:
            Response::error('Failed to delete question. DB Error.');
        }
    }
    public static function updateQuestion($quizId, $questionId)
    {
        $headers = getallheaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $decoded = JWTHandler::validateToken($token);

        if (!$decoded || $decoded['role'] !== 'teacher') {
            Response::forbidden('Only teachers can update questions');
        }

        $data = json_decode(file_get_contents("php://input"));
        if (!isset($data->question) || !isset($data->options) || !isset($data->correctAnswer) || !isset($data->marks)) {
            Response::error('Missing required fields');
            return;
        }

        $quiz = new Quiz();

        // Optimize: Verify quiz ownership if needed here

        if ($quiz->updateQuestion($questionId, $data->question, $data->options, $data->correctAnswer, $data->marks)) {
            Response::success(null, 'Question updated successfully');
        } else {
            Response::error('Failed to update question');
        }
    }
}
