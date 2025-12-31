<?php
require_once __DIR__ . '/config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $sql = file_get_contents(__DIR__ . '/database/create_startups_table.sql');

    $db->exec($sql);
    echo "Table 'startups' created successfully.";
} catch (PDOException $e) {
    echo "Error creating table: " . $e->getMessage();
}
