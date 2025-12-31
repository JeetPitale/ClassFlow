<?php
require_once __DIR__ . '/backend/config/Database.php';

$database = new Database();
$db = $database->getConnection();

function describeTable($db, $table)
{
    echo "Table: $table\n";
    $query = "DESCRIBE $table";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo $col['Field'] . " | " . $col['Type'] . " | " . $col['Null'] . "\n";
    }
    echo "\n";
}

describeTable($db, 'assignments');
describeTable($db, 'assignment_submissions');
?>