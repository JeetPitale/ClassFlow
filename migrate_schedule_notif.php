<?php
require_once __DIR__ . '/backend/config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $sql = file_get_contents(__DIR__ . '/backend/database/add_schedule_notif_enum.sql');
    $db->exec($sql);
    echo "Migration successful: Added 'schedule' to notifications type enum.\n";

} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
