<?php
// init_cloud_db.php

echo "Initializing Cloud Database...\n";

// 1. Load credentials
$host = getenv('DB_HOST') ?: '127.0.0.1';
$port = getenv('DB_PORT') ?: '3306';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';
$dbname = getenv('DB_NAME') ?: 'classflow_db';

// SSL Options
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];
if (strpos($host, 'azure.com') !== false || getenv('DB_SSL') === 'true') {
    $caPath = getenv('DB_SSL_CA');
    if ($caPath && file_exists($caPath)) {
        $options[PDO::MYSQL_ATTR_SSL_CA] = $caPath;
    }
    $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
}

function runSqlFile($conn, $filePath)
{
    if (!file_exists($filePath)) {
        echo "❌ File not found: $filePath\n";
        return;
    }
    echo "📄 Running " . basename($filePath) . "...\n";
    $sql = file_get_contents($filePath);
    $queries = explode(';', $sql);

    foreach ($queries as $query) {
        $query = trim($query);
        if (!empty($query)) {
            try {
                $conn->exec($query);
            } catch (PDOException $e) {
                // Ignore innocuous errors like "table exists" or "column exists"
                $msg = $e->getMessage();
                if (strpos($msg, 'already exists') !== false || strpos($msg, 'Duplicate column') !== false) {
                    // echo "   - Skipped (already exists)\n";
                } else {
                    echo "   ⚠️ Warning: " . $msg . "\n";
                }
            }
        }
    }
    echo "   ✅ Done.\n";
}

try {
    // 2. Connect & Create DB
    echo "Connecting to $host...\n";
    $conn = new PDO("mysql:host=$host;port=$port", $user, $pass, $options);

    echo "Creating database '$dbname' if needed...\n";
    $conn->exec("CREATE DATABASE IF NOT EXISTS `$dbname`");
    $conn->exec("USE `$dbname`");

    // 3. Run schema.sql FIRST
    runSqlFile($conn, 'backend/database/schema.sql');

    // 4. Run all other SQL files in backend/database/
    $files = glob('backend/database/*.sql');
    foreach ($files as $file) {
        if (basename($file) === 'schema.sql')
            continue; // Already run
        runSqlFile($conn, $file);
    }

    echo "\n🎉 Database Fully Initialized!\n";

} catch (PDOException $e) {
    echo "❌ Critical Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>