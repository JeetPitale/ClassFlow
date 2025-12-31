<?php
require_once 'backend/config/database.php';

$database = new Database();
$conn = $database->getConnection();

$stmt = $conn->query("SELECT * FROM assignments");
$assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($assignments, JSON_PRETTY_PRINT);
