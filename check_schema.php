<?php
require_once 'backend/config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();

    $stmt = $conn->prepare("DESCRIBE assignments");
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($columns, JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>