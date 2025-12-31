<?php
require_once 'backend/config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();

    $sql = file_get_contents('backend/migrations/add_attachment_column.sql');
    $conn->exec($sql);

    echo "Migration executed successfully.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>