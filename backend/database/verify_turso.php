<?php
/**
 * Verify Turso Database Data
 */

$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        putenv(trim($name) . '=' . trim($value));
    }
}

require_once __DIR__ . '/../config/database.php';
$database = new Database();
$turso = $database->getConnection();

$tables = [
    'admins',
    'teachers',
    'students',
    'announcements',
    'materials',
    'assignments',
    'assignment_submissions',
    'quizzes',
    'quiz_questions',
    'quiz_attempts',
    'schedules',
    'feedback',
    'startup_ideas',
    'startups',
    'syllabus_topics',
    'syllabus_subtopics',
    'notifications'
];

echo "Database verification results:\n";
echo str_pad("Table", 25) . " | " . "Count\n";
echo str_repeat("-", 35) . "\n";

foreach ($tables as $table) {
    try {
        $stmt = $turso->prepare("SELECT COUNT(*) as cnt FROM $table");
        $stmt->execute();
        $row = $stmt->fetch();
        $count = $row ? $row['cnt'] : 0;
        echo str_pad($table, 25) . " | " . $count . "\n";
    } catch (Exception $e) {
        echo str_pad($table, 25) . " | ERROR: " . $e->getMessage() . "\n";
    }
}
