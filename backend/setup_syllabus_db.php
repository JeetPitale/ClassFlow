<?php
require_once __DIR__ . '/config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();

    $queries = [
        "CREATE TABLE IF NOT EXISTS syllabus_topics (
            id INT AUTO_INCREMENT PRIMARY KEY,
            teacher_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            weeks VARCHAR(100),
            completed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
        )",
        "CREATE TABLE IF NOT EXISTS syllabus_subtopics (
            id INT AUTO_INCREMENT PRIMARY KEY,
            parent_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            completed BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (parent_id) REFERENCES syllabus_topics(id) ON DELETE CASCADE
        )"
    ];

    foreach ($queries as $query) {
        $conn->exec($query);
        echo "Table created/verified successfully.\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>