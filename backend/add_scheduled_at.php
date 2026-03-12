<?php
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

require_once __DIR__ . '/config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();

    // Add scheduled_at to quizzes
    $conn->exec("ALTER TABLE quizzes ADD COLUMN scheduled_at DATETIME NULL DEFAULT NULL AFTER description");
    echo "Added scheduled_at to quizzes\n";

    // Add scheduled_at to assignments
    $conn->exec("ALTER TABLE assignments ADD COLUMN scheduled_at DATETIME NULL DEFAULT NULL AFTER description");
    echo "Added scheduled_at to assignments\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
