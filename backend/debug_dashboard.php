<?php
require_once __DIR__ . '/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "<h1>Teachers</h1>";
$stmt = $db->query("SELECT id, email, name FROM teachers");
echo "<pre>";
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
echo "</pre>";

echo "<h1>Quizzes</h1>";
$stmt = $db->query("SELECT id, title, created_by_teacher_id FROM quizzes");
echo "<pre>";
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
echo "</pre>";

echo "<h1>Materials</h1>";
$stmt = $db->query("SELECT id, title, uploaded_by_teacher_id FROM materials");
echo "<pre>";
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
echo "</pre>";

echo "<h1>Assignments</h1>";
$stmt = $db->query("SELECT id, title, created_by_teacher_id FROM assignments");
echo "<pre>";
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
echo "</pre>";
