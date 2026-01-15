<?php
/**
 * Complete API Router
 */

// API Configuration: Disable HTML error output, log errors instead
// API Configuration: Disable HTML error output, log errors instead
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/config/cors.php';

// Load .env (TEMPORARY: FOR LOCAL DEV ONLY)
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0)
            continue;
        list($name, $value) = explode('=', $line, 2);
        putenv(trim($name) . '=' . trim($value));
    }
}

require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/StudentController.php';
require_once __DIR__ . '/controllers/TeacherController.php';
require_once __DIR__ . '/controllers/AnnouncementController.php';
require_once __DIR__ . '/controllers/MaterialController.php';
require_once __DIR__ . '/controllers/AssignmentController.php';
require_once __DIR__ . '/controllers/QuizController.php';
require_once __DIR__ . '/controllers/OtherControllers.php';
require_once __DIR__ . '/controllers/StartupController.php';
require_once __DIR__ . '/controllers/NotificationController.php';
require_once __DIR__ . '/controllers/DashboardController.php';
require_once __DIR__ . '/controllers/SyllabusController.php';
require_once __DIR__ . '/controllers/ProfileController.php';
require_once __DIR__ . '/utils/Response.php';

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = str_replace('/backend', '', str_replace('/index.php', '', $uri));

// Auth
if ($method === 'POST' && $uri === '/api/auth/login')
    AuthController::login();
elseif ($method === 'GET' && $uri === '/api/auth/me')
    AuthController::me();
elseif ($method === 'POST' && $uri === '/api/auth/logout')
    AuthController::logout();

// Students
elseif ($method === 'GET' && $uri === '/api/students')
    StudentController::index();
elseif ($method === 'GET' && preg_match('/^\/api\/students\/(\d+)$/', $uri, $m))
    StudentController::show($m[1]);
elseif ($method === 'POST' && $uri === '/api/students')
    StudentController::store();
elseif ($method === 'PUT' && preg_match('/^\/api\/students\/(\d+)$/', $uri, $m))
    StudentController::update($m[1]);
elseif ($method === 'DELETE' && preg_match('/^\/api\/students\/(\d+)$/', $uri, $m))
    StudentController::destroy($m[1]);

// Teachers
elseif ($method === 'GET' && $uri === '/api/teachers')
    TeacherController::index();
elseif ($method === 'GET' && preg_match('/^\/api\/teachers\/(\d+)$/', $uri, $m))
    TeacherController::show($m[1]);
elseif ($method === 'POST' && $uri === '/api/teachers')
    TeacherController::store();
elseif ($method === 'PUT' && preg_match('/^\/api\/teachers\/(\d+)$/', $uri, $m))
    TeacherController::update($m[1]);
elseif ($method === 'DELETE' && preg_match('/^\/api\/teachers\/(\d+)$/', $uri, $m))
    TeacherController::destroy($m[1]);

// Announcements
elseif ($method === 'GET' && $uri === '/api/announcements')
    AnnouncementController::index();
elseif ($method === 'GET' && preg_match('/^\/api\/announcements\/(\d+)$/', $uri, $m))
    AnnouncementController::show($m[1]);
elseif ($method === 'POST' && $uri === '/api/announcements')
    AnnouncementController::store();
elseif ($method === 'PUT' && preg_match('/^\/api\/announcements\/(\d+)$/', $uri, $m))
    AnnouncementController::update($m[1]);
elseif ($method === 'DELETE' && preg_match('/^\/api\/announcements\/(\d+)$/', $uri, $m))
    AnnouncementController::destroy($m[1]);

// Materials
elseif ($method === 'GET' && $uri === '/api/materials')
    MaterialController::index();
elseif ($method === 'POST' && $uri === '/api/materials')
    MaterialController::store();
elseif ($method === 'DELETE' && preg_match('/^\/api\/materials\/(\d+)$/', $uri, $m))
    MaterialController::destroy($m[1]);
elseif ($method === 'GET' && preg_match('/^\/api\/materials\/(\d+)\/download$/', $uri, $m))
    MaterialController::download($m[1]);

// Assignments
elseif ($method === 'GET' && $uri === '/api/assignments')
    AssignmentController::index();
elseif ($method === 'GET' && preg_match('/^\/api\/assignments\/(\d+)$/', $uri, $m))
    AssignmentController::show($m[1]);
elseif ($method === 'POST' && $uri === '/api/assignments')
    AssignmentController::store();
elseif ($method === 'POST' && preg_match('/^\/api\/assignments\/(\d+)\/update$/', $uri, $m))
    AssignmentController::update($m[1]);
elseif ($method === 'DELETE' && preg_match('/^\/api\/assignments\/(\d+)$/', $uri, $m))
    AssignmentController::destroy($m[1]);
elseif ($method === 'GET' && preg_match('/^\/api\/assignments\/(\d+)\/submissions$/', $uri, $m))
    AssignmentController::getSubmissions($m[1]);
elseif ($method === 'POST' && preg_match('/^\/api\/assignments\/(\d+)\/submit$/', $uri, $m))
    AssignmentController::submit($m[1]);
elseif ($method === 'GET' && $uri === '/api/assignments/my-submissions')
    AssignmentController::mySubmissions();
elseif ($method === 'PUT' && preg_match('/^\/api\/assignments\/submissions\/(\d+)\/grade$/', $uri, $m))
    AssignmentController::grade($m[1]);
elseif ($method === 'POST' && preg_match('/^\/api\/assignments\/(\d+)\/grade-student$/', $uri, $m))
    AssignmentController::gradeStudent($m[1]);

// Quizzes
elseif ($method === 'GET' && $uri === '/api/quizzes')
    QuizController::index();
elseif ($method === 'GET' && preg_match('/^\/api\/quizzes\/(\d+)$/', $uri, $m))
    QuizController::show($m[1]);
elseif ($method === 'POST' && $uri === '/api/quizzes')
    QuizController::store();
elseif ($method === 'PUT' && preg_match('/^\/api\/quizzes\/(\d+)$/', $uri, $m))
    QuizController::update($m[1]);
elseif ($method === 'DELETE' && preg_match('/^\/api\/quizzes\/(\d+)$/', $uri, $m))
    QuizController::destroy($m[1]);
elseif ($method === 'GET' && preg_match('/^\/api\/quizzes\/(\d+)\/questions$/', $uri, $m))
    QuizController::getQuestions($m[1]);
elseif ($method === 'POST' && preg_match('/^\/api\/quizzes\/(\d+)\/questions$/', $uri, $m))
    QuizController::addQuestion($m[1]);
elseif ($method === 'POST' && preg_match('/^\/api\/quizzes\/(\d+)\/questions\/bulk$/', $uri, $m))
    QuizController::bulkAddQuestions($m[1]);
elseif ($method === 'DELETE' && preg_match('/^\/api\/quizzes\/(\d+)\/questions\/(\d+)$/', $uri, $m))
    QuizController::deleteQuestion($m[1], $m[2]);
elseif ($method === 'PUT' && preg_match('/^\/api\/quizzes\/(\d+)\/questions\/(\d+)$/', $uri, $m))
    QuizController::updateQuestion($m[1], $m[2]);
elseif ($method === 'POST' && preg_match('/^\/api\/quizzes\/(\d+)\/attempt$/', $uri, $m))
    QuizController::submitAttempt($m[1]);
elseif ($method === 'GET' && $uri === '/api/student/quiz-attempts')
    QuizController::myAttempts();
elseif ($method === 'GET' && $uri === '/api/teacher/quiz-history')
    QuizController::history();

// Syllabus Routes
elseif ($method === 'GET' && $uri === '/api/syllabus')
    SyllabusController::index();
elseif ($method === 'POST' && $uri === '/api/syllabus/topics')
    SyllabusController::storeTopic();
elseif ($method === 'PUT' && preg_match('/^\/api\/syllabus\/topics\/(\d+)$/', $uri, $m))
    SyllabusController::updateTopic($m[1]);
elseif ($method === 'DELETE' && preg_match('/^\/api\/syllabus\/topics\/(\d+)$/', $uri, $m))
    SyllabusController::deleteTopic($m[1]);
elseif ($method === 'PATCH' && preg_match('/^\/api\/syllabus\/topics\/(\d+)\/toggle$/', $uri, $m))
    SyllabusController::toggleTopic($m[1]);
elseif ($method === 'POST' && $uri === '/api/syllabus/subtopics')
    SyllabusController::storeSubtopic();
elseif ($method === 'PUT' && preg_match('/^\/api\/syllabus\/subtopics\/(\d+)$/', $uri, $m))
    SyllabusController::updateSubtopic($m[1]);
elseif ($method === 'DELETE' && preg_match('/^\/api\/syllabus\/subtopics\/(\d+)$/', $uri, $m))
    SyllabusController::deleteSubtopic($m[1]);
elseif ($method === 'PATCH' && preg_match('/^\/api\/syllabus\/subtopics\/(\d+)\/toggle$/', $uri, $m))
    SyllabusController::toggleSubtopic($m[1]);

// Admin Syllabus Tracking
elseif ($method === 'GET' && $uri === '/api/admin/syllabus-progress')
    SyllabusController::adminProgress();
elseif ($method === 'GET' && preg_match('/^\/api\/admin\/syllabus\/(\d+)$/', $uri, $m))
    SyllabusController::getTeacherSyllabus($m[1]);

// Schedules
elseif ($method === 'GET' && $uri === '/api/schedules')
    ScheduleController::index();
elseif ($method === 'POST' && $uri === '/api/schedules')
    ScheduleController::store();
elseif ($method === 'DELETE' && preg_match('/^\/api\/schedules\/(\d+)$/', $uri, $m))
    ScheduleController::destroy($m[1]);

// Feedback
elseif ($method === 'GET' && $uri === '/api/feedback')
    FeedbackController::index();
elseif ($method === 'POST' && $uri === '/api/feedback')
    FeedbackController::store();
elseif ($method === 'PUT' && preg_match('/^\/api\/feedback\/(\d+)\/respond$/', $uri, $m))
    FeedbackController::respond($m[1]);

// Startup Ideas
elseif ($method === 'GET' && $uri === '/api/startups')
    StartupController::index();
elseif ($method === 'POST' && $uri === '/api/startups')
    StartupController::store();
elseif ($method === 'PUT' && preg_match('/^\/api\/startups\/(\d+)\/review$/', $uri, $m))
    StartupController::review($m[1]);

// Notifications
elseif ($method === 'GET' && $uri === '/api/notifications')
    NotificationController::index();
elseif ($method === 'GET' && $uri === '/api/notifications/unread-count')
    NotificationController::unreadCount();
elseif ($method === 'PUT' && preg_match('/^\/api\/notifications\/(\d+)\/read$/', $uri, $m))
    NotificationController::markAsRead($m[1]);
elseif ($method === 'PUT' && $uri === '/api/notifications/mark-all-read')
    NotificationController::markAllAsRead();
elseif ($method === 'DELETE' && preg_match('/^\/api\/notifications\/(\d+)$/', $uri, $m))
    NotificationController::destroy($m[1]);

// Admin Dashboard
elseif ($method === 'GET' && $uri === '/api/dashboard/student-stats')
    DashboardController::getStudentStats();
elseif ($method === 'GET' && $uri === '/api/dashboard/teacher-stats')
    DashboardController::getTeacherStats();
elseif ($method === 'GET' && $uri === '/api/dashboard/stats')
    DashboardController::getStats();
// Profile
elseif ($method === 'PUT' && $uri === '/api/profile/update')
    ProfileController::updateProfile();
elseif ($method === 'PUT' && $uri === '/api/profile/change-password')
    ProfileController::changePassword();
elseif ($method === 'PUT' && $uri === '/api/auth/password') // Alias for flexibility
    ProfileController::changePassword();
elseif ($method === 'GET' && $uri === '/debug-dashboard') {
    require_once __DIR__ . '/debug_dashboard.php';
    exit;
} else
    Response::notFound('Route not found: ' . $method . ' ' . $uri);
