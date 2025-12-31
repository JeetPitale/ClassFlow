<?php
/**
 * Notification Helper
 * Utility functions for creating notifications
 */

require_once __DIR__ . '/../models/Notification.php';
require_once __DIR__ . '/../models/Student.php';
require_once __DIR__ . '/../models/Teacher.php';

class NotificationHelper
{
    /**
     * Create notifications for announcement
     */
    public static function createAnnouncementNotification($announcement)
    {
        $notification = new Notification();
        $notification->type = 'announcement';
        $notification->title = 'New Announcement: ' . $announcement['title'];
        $notification->message = substr($announcement['content'], 0, 100) . (strlen($announcement['content']) > 100 ? '...' : '');

        // Determine link based on role
        $targetAudience = $announcement['target_audience'];

        // Get all users that should be notified
        $usersToNotify = [];

        if ($targetAudience === 'all' || $targetAudience === 'student') {
            // Notify all students
            $studentModel = new Student();
            $students = $studentModel->getAll();
            foreach ($students as $student) {
                $usersToNotify[] = [
                    'id' => $student['id'],
                    'role' => 'student',
                    'link' => '/student/announcements'
                ];
            }
        }

        if ($targetAudience === 'all' || $targetAudience === 'teacher') {
            // Notify all teachers
            $teacherModel = new Teacher();
            $teachers = $teacherModel->getAll();
            foreach ($teachers as $teacher) {
                $usersToNotify[] = [
                    'id' => $teacher['id'],
                    'role' => 'teacher',
                    'link' => '/teacher/announcements'
                ];
            }
        }

        // Create notification for each user
        foreach ($usersToNotify as $user) {
            $notification->user_id = $user['id'];
            $notification->user_role = $user['role'];
            $notification->link = $user['link'];
            $notification->create();
        }

        return count($usersToNotify);
    }

    /**
     * Create notifications for assignment
     */
    public static function createAssignmentNotification($assignment)
    {
        $notification = new Notification();
        $notification->type = 'assignment';
        $notification->title = 'New Assignment: ' . $assignment['title'];
        $notification->message = 'Due: ' . date('M d, Y', strtotime($assignment['due_date']));
        $notification->link = '/student/assignments';

        // Notify all students in the same semester
        $studentModel = new Student();
        $students = $studentModel->getBySemester($assignment['semester']);

        foreach ($students as $student) {
            $notification->user_id = $student['id'];
            $notification->user_role = 'student';
            $notification->create();
        }

        return count($students);
    }

    /**
     * Create notifications for material
     */
    public static function createMaterialNotification($material)
    {
        $notification = new Notification();
        $notification->type = 'material';
        $notification->title = 'New Study Material: ' . $material['title'];
        $notification->message = $material['description'] ? substr($material['description'], 0, 100) : 'New material uploaded';
        $notification->link = '/student/materials';

        // Notify all students in the same semester
        $studentModel = new Student();
        $students = $studentModel->getBySemester($material['semester']);

        foreach ($students as $student) {
            $notification->user_id = $student['id'];
            $notification->user_role = 'student';
            $notification->create();
        }

        return count($students);
    }

    /**
     * Create notifications for quiz
     */
    public static function createQuizNotification($quiz)
    {
        $notification = new Notification();
        $notification->type = 'quiz';
        $notification->title = 'New Quiz Available: ' . $quiz['title'];
        $notification->message = 'Duration: ' . $quiz['duration_minutes'] . ' minutes';
        $notification->link = '/student/quizzes';

        // Notify all students in the same semester
        $studentModel = new Student();
        $students = $studentModel->getBySemester($quiz['semester']);

        foreach ($students as $student) {
            $notification->user_id = $student['id'];
            $notification->user_role = 'student';
            $notification->create();
        }

        return count($students);
    }
    /**
     * Create notifications for assignment grade
     */
    public static function createAssignmentGradeNotification($studentId, $assignmentTitle, $marks)
    {
        $notification = new Notification();
        $notification->user_id = $studentId;
        $notification->user_role = 'student';
        $notification->type = 'grade';
        $notification->title = 'Assignment Graded: ' . $assignmentTitle;
        $notification->message = 'You received ' . $marks . ' marks.';
        $notification->link = '/student/marks';
        return $notification->create();
    }

    /**
     * Create notifications for quiz grade
     */
    public static function createQuizGradeNotification($studentId, $quizTitle, $score, $totalMarks)
    {
        $notification = new Notification();
        $notification->user_id = $studentId;
        $notification->user_role = 'student';
        $notification->type = 'grade';
        $notification->title = 'Quiz Graded: ' . $quizTitle;
        $notification->message = 'You scored ' . $score . '/' . $totalMarks . '.';
        $notification->link = '/student/marks'; // Or direct to quiz review if possible
        return $notification->create();
    }
}
