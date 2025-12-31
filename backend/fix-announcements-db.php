<?php
/**
 * Fix Announcements Database Schema
 * Run this file once to fix the target_audience column
 */

try {
    $db = new PDO(
        'mysql:unix_socket=/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock;dbname=classflow_db',
        'root',
        ''
    );

    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Fixing announcements table...\n";

    // Fix the ENUM to use singular values
    $db->exec("ALTER TABLE announcements MODIFY COLUMN target_audience ENUM('all', 'student', 'teacher') DEFAULT 'all'");

    echo "✅ SUCCESS! Database fixed.\n";
    echo "The target_audience column now accepts: 'all', 'student', 'teacher'\n";
    echo "\nYou can now create announcements for specific audiences!\n";

} catch (PDOException $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo "\nPlease make sure:\n";
    echo "1. XAMPP MySQL is running\n";
    echo "2. The database 'classflow_db' exists\n";
}
