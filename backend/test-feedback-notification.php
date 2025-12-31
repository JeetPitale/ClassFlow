<?php
// Test script to verify feedback notification creation
require_once __DIR__ . '/models/Notification.php';
require_once __DIR__ . '/models/OtherModels.php';

echo "=== Testing Feedback Notification Creation ===\n\n";

// Test 1: Check if we can create any notification
echo "Test 1: Creating a test notification...\n";
$testNotif = new Notification();
$testNotif->user_id = 1; // Assuming student ID 1 exists
$testNotif->user_role = 'student';
$testNotif->type = 'test';
$testNotif->title = 'Test Notification';
$testNotif->message = 'This is a test';
$testNotif->link = '/test';

$result = $testNotif->create();
echo $result ? "✅ Test notification created successfully\n" : "❌ Failed to create test notification\n";
echo "\n";

// Test 2: Get feedback and check student_id
echo "Test 2: Checking feedback data...\n";
$feedback = new Feedback();
$allFeedback = $feedback->getAll();

if (empty($allFeedback)) {
    echo "❌ No feedback found in database\n";
} else {
    echo "✅ Found " . count($allFeedback) . " feedback entries\n";
    foreach ($allFeedback as $fb) {
        echo "  - ID: {$fb['id']}, Student ID: {$fb['student_id']}, Subject: {$fb['subject']}\n";
        echo "    Has response: " . (!empty($fb['response']) ? 'YES' : 'NO') . "\n";
    }
}
echo "\n";

// Test 3: Try to create a notification for first feedback
if (!empty($allFeedback)) {
    $firstFeedback = $allFeedback[0];
    echo "Test 3: Creating notification for feedback ID: {$firstFeedback['id']}\n";

    $notif = new Notification();
    $notif->user_id = $firstFeedback['student_id'];
    $notif->user_role = 'student';
    $notif->type = 'feedback';
    $notif->title = 'Feedback Response Received';
    $notif->message = 'Admin has responded to your feedback';
    $notif->link = '/student/feedback';

    $created = $notif->create();
    echo $created ? "✅ Feedback notification created successfully!\n" : "❌ Failed to create feedback notification\n";

    if (!$created) {
        // Try to get PDO error
        $errorInfo = $notif->conn->errorInfo();
        echo "PDO Error: " . print_r($errorInfo, true) . "\n";
    }
}

echo "\n=== Test Complete ===\n";
?>