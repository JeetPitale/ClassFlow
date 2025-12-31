<?php
require_once __DIR__ . '/backend/config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();

    $sql = "
    CREATE TABLE IF NOT EXISTS syllabus_topics (
        id INT PRIMARY KEY AUTO_INCREMENT,
        teacher_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        weeks VARCHAR(100),
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
        INDEX idx_teacher (teacher_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS syllabus_subtopics (
        id INT PRIMARY KEY AUTO_INCREMENT,
        parent_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES syllabus_topics(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ";

    $conn->exec($sql);
    echo "Syllabus tables created successfully.\n";

} catch (PDOException $e) {
    echo "Error creating tables: " . $e->getMessage() . "\n";
    exit(1);
}
