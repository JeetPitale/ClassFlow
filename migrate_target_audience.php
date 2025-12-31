<?php
require_once __DIR__ . '/backend/config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $sql = file_get_contents(__DIR__ . '/backend/database/add_target_audience.sql');
    $stmt = $db->prepare($sql);
    $stmt->execute();
    echo "Migration successful: Added target_audience column.\n";

} catch (PDOException $e) {
    if (strpos($e->getMessage(), "Duplicate column name") !== false) {
        echo "Column already exists.\n";
    } else {
        echo "Migration failed: " . $e->getMessage() . "\n";
    }
}
