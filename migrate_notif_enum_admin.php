<?php
require_once 'backend/config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $sql = "ALTER TABLE notifications MODIFY COLUMN type ENUM('announcement', 'assignment', 'material', 'schedule', 'quiz', 'general', 'feedback', 'startup_review', 'startup_submission') NOT NULL";

    $db->exec($sql);
    echo "Successfully updated notifications type ENUM.\n";

} catch (PDOException $e) {
    echo "Error updating ENUM: " . $e->getMessage() . "\n";
}
