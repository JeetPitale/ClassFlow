<?php
require_once __DIR__ . '/config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();

    $stmt = $conn->query("DESCRIBE quizzes");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (in_array('semester', $columns)) {
        echo "Column 'semester' exists.\n";
    } else {
        echo "Column 'semester' MISSING.\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
