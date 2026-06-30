<?php
/**
 * Direct Migration Script: Azure MySQL to Turso libSQL
 */

$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        putenv(trim($name) . '=' . trim($value));
    }
}

echo "Starting data migration from Azure MySQL to Turso...\n";

try {
    // 1. Connect to Azure MySQL Database
    $mysqlHost = 'classflow-db-jeet.mysql.database.azure.com';
    $mysqlUser = 'jeetzo';
    $mysqlPass = 'Nxt_Shadow@07';
    $mysqlDb   = 'classflow_db';
    
    echo "Connecting to Azure MySQL ($mysqlHost)...";
    $mysql = new PDO(
        "mysql:host=$mysqlHost;dbname=$mysqlDb;port=3306;charset=utf8mb4",
        $mysqlUser,
        $mysqlPass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 10
        ]
    );
    echo " Connected!\n";

    // 2. Connect to Turso Database
    echo "Connecting to Turso Database...";
    require_once __DIR__ . '/../config/database.php';
    $database = new Database();
    $turso = $database->getConnection();
    echo " Connected!\n";

    // 3. Define Tables to Migrate (ordered by dependency)
    $tables = [
        'admins',
        'teachers',
        'students',
        'announcements',
        'materials',
        'assignments',
        'assignment_submissions',
        'quizzes',
        'quiz_questions',
        'quiz_attempts',
        'schedules',
        'feedback',
        'startup_ideas',
        'startups',
        'syllabus_topics',
        'syllabus_subtopics',
        'notifications'
    ];

    // Disable foreign key constraints during copy to avoid order conflicts
    $turso->exec("PRAGMA foreign_keys = OFF");

    foreach ($tables as $table) {
        echo "\nMigrating table [$table]...\n";

        // Fetch schema columns in Turso to avoid inserting non-existent fields
        try {
            $colsStmt = $turso->query("PRAGMA table_info($table)");
            $tursoCols = array_map(function($c) { return $c['name']; }, $colsStmt->fetchAll());
        } catch (Exception $e) {
            echo "Skipping $table: " . $e->getMessage() . "\n";
            continue;
        }

        // Fetch data from MySQL
        try {
            $stmt = $mysql->query("SELECT * FROM $table");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            echo "No table '$table' exists in Azure or failed to fetch: " . $e->getMessage() . "\n";
            continue;
        }

        if (empty($rows)) {
            echo "No rows found in Azure MySQL for [$table].\n";
            continue;
        }

        // Clear existing local data in Turso for clean slate
        $turso->exec("DELETE FROM $table");

        // Filter keys to ensure they exist in Turso schema
        $firstRow = $rows[0];
        $validColumns = array_intersect(array_keys($firstRow), $tursoCols);

        if (empty($validColumns)) {
            echo "No matching columns between MySQL and Turso for [$table].\n";
            continue;
        }

        // Build insert statement
        $colList = implode(', ', $validColumns);
        $placeholders = implode(', ', array_map(function($c) { return ":$c"; }, $validColumns));
        $insertQuery = "INSERT INTO $table ($colList) VALUES ($placeholders)";
        $insertStmt = $turso->prepare($insertQuery);

        $count = 0;
        foreach ($rows as $row) {
            // Filter row data to only contain valid columns
            $filteredRow = array_intersect_key($row, array_flip($validColumns));
            
            // Execute on Turso
            $insertStmt->execute($filteredRow);
            $count++;
        }

        echo "Successfully copied $count rows for [$table].\n";
    }

    // Re-enable foreign key constraints
    $turso->exec("PRAGMA foreign_keys = ON");
    echo "\n🎉 Migration completed successfully!\n";

} catch (Exception $e) {
    echo "\n❌ Migration Failed: " . $e->getMessage() . "\n";
}
