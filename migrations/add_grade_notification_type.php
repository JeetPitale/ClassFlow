<?php
require_once __DIR__ . '/../backend/config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();

    echo "Altering notifications table to add 'grade' type...\n";

    // Get current enum values might be hard, so we usually just redefine the column with the new complete list.
    // Based on create_notifications.sql:
    // ENUM('announcement', 'assignment', 'material', 'schedule', 'quiz', 'general', 'feedback', 'startup_review', 'startup_submission')

    $query = "ALTER TABLE notifications MODIFY COLUMN type ENUM('announcement', 'assignment', 'material', 'schedule', 'quiz', 'general', 'feedback', 'startup_review', 'startup_submission', 'grade') NOT NULL";

    $stmt = $conn->prepare($query);

    if ($stmt->execute()) {
        echo "Successfully added 'grade' to notifications type ENUM.\n";
    } else {
        echo "Failed to alter table.\n";
        print_r($stmt->errorInfo());
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>