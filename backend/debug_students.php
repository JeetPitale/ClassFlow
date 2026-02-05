<?php
require_once __DIR__ . '/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "<h1>Students</h1>";
try {
    $stmt = $db->query("SELECT id, email, name, enrollment_no, semester FROM students");
    echo "<pre>";
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
    echo "</pre>";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
