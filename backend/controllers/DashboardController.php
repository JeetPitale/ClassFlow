<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/JWTHandler.php';

class DashboardController
{
    public static function getStats()
    {
        // Auth Check
        $headers = getallheaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $decoded = JWTHandler::validateToken($token);

        if (!$decoded || ($decoded['role'] !== 'admin')) {
            Response::error('Unauthorized', 401);
            return;
        }

        $database = new Database();
        $db = $database->getConnection();

        $stats = [
            'totalStudents' => 0,
            'totalTeachers' => 0,
            'monthlyAnnouncements' => 0,
            'pendingFeedback' => 0,
            'averageScore' => 0,
            'recentAnnouncements' => [],
            'thisWeekSchedule' => []
        ];

        try {
            // 1. Total Students
            $stmt = $db->query("SELECT COUNT(*) FROM students");
            $stats['totalStudents'] = $stmt->fetchColumn();

            // 2. Total Teachers
            $stmt = $db->query("SELECT COUNT(*) FROM teachers");
            $stats['totalTeachers'] = $stmt->fetchColumn();

            // 3. Announcements (This Month)
            $stmt = $db->query("SELECT COUNT(*) FROM announcements WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())");
            $stats['monthlyAnnouncements'] = $stmt->fetchColumn();

            // 4. Pending Feedback
            $stmt = $db->query("SELECT COUNT(*) FROM feedback WHERE status = 'pending'");
            $stats['pendingFeedback'] = $stmt->fetchColumn();

            // 5. Student Performance (Avg Quiz Score %)
            // Handle division by zero if total_marks is 0 or no attempts
            $stmt = $db->query("SELECT AVG((score / total_marks) * 100) FROM quiz_attempts WHERE total_marks > 0");
            $avgScore = $stmt->fetchColumn();
            $stats['averageScore'] = $avgScore ? round($avgScore, 1) : 0;

            // 6. Recent Announcements (Limit 5)
            $stmt = $db->query("SELECT title, created_at, created_by_role FROM announcements ORDER BY created_at DESC LIMIT 5");
            $recentAnnouncements = $stmt->fetchAll(PDO::FETCH_ASSOC);
            // Map created_by logic if needed, usually title/date is enough
            $stats['recentAnnouncements'] = $recentAnnouncements;

            // 7. Weekly Schedule (Next 7 days)
            $stmt = $db->query("SELECT * FROM schedules WHERE schedule_date BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY) ORDER BY schedule_date ASC, schedule_time ASC");
            $stats['thisWeekSchedule'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        } catch (PDOException $e) {
            error_log("Dashboard stats error: " . $e->getMessage());
            Response::error('Failed to fetch dashboard stats');
            return;
        }

        Response::success($stats);
    }
    public static function getStudentStats()
    {
        $headers = getallheaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $decoded = JWTHandler::validateToken($token);

        if (!$decoded || ($decoded['role'] !== 'student')) {
            Response::error('Unauthorized', 401);
            return;
        }

        $userId = $decoded['user_id'];
        $database = new Database();
        $db = $database->getConnection();

        $stats = [
            'overallGrade' => 0,
            'assignmentsDue' => 0,
            'materialsCount' => 0,
            'upcomingAssignments' => [],
            'recentAnnouncements' => [],
            'weeklySchedule' => [],
            'progress' => [
                'assignments' => 0,
                'quizzes' => 0
            ]
        ];

        try {
            // Get Student Semester
            $stmt = $db->prepare("SELECT semester FROM students WHERE id = :id");
            $stmt->execute([':id' => $userId]);
            $semester = $stmt->fetchColumn();

            if (!$semester) {
                Response::error('Student profile not found');
                return;
            }

            // 1. Overall Grade (Avg of specific Assignment marks + Quiz scores)
            // Simplified: Average of percentage scores from both tables
            $query = "
                SELECT AVG(percentage) as overall_avg FROM (
                    SELECT (marks_obtained / total_marks) * 100 as percentage 
                    FROM assignment_submissions s 
                    JOIN assignments a ON s.assignment_id = a.id 
                    WHERE s.student_id = :sid1 AND s.status = 'graded' AND a.total_marks > 0
                    UNION ALL
                    SELECT (score / total_marks) * 100 as percentage 
                    FROM quiz_attempts 
                    WHERE student_id = :sid2 AND total_marks > 0
                ) as scores
            ";
            $stmt = $db->prepare($query);
            $stmt->execute([':sid1' => $userId, ':sid2' => $userId]);
            $stats['overallGrade'] = round($stmt->fetchColumn() ?: 0);

            // 2. Assignments Due (This week, not submitted)
            // Logic: Due date > NOW and Due date <= NOW + 7 days AND id NOT IN (submissions for user)
            $query = "
                SELECT COUNT(*) FROM assignments 
                WHERE semester = :semester 
                AND due_date > NOW() 
                AND due_date <= DATE_ADD(NOW(), INTERVAL 7 DAY)
                AND id NOT IN (SELECT assignment_id FROM assignment_submissions WHERE student_id = :sid)
            ";
            $stmt = $db->prepare($query);
            $stmt->execute([':semester' => $semester, ':sid' => $userId]);
            $stats['assignmentsDue'] = $stmt->fetchColumn();

            // 3. Materials Available (For Semester)
            $stmt = $db->prepare("SELECT COUNT(*) FROM materials WHERE semester = :semester");
            $stmt->execute([':semester' => $semester]);
            $stats['materialsCount'] = $stmt->fetchColumn();

            // 4. Upcoming Assignments (Next 3)
            $query = "
                SELECT id, title, description, due_date as dueDate, total_marks as maxMarks 
                FROM assignments 
                WHERE semester = :semester AND due_date >= NOW()
                ORDER BY due_date ASC 
                LIMIT 3
            ";
            $stmt = $db->prepare($query);
            $stmt->execute([':semester' => $semester]);
            $stats['upcomingAssignments'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // 5. Recent Announcements (Limit 2)
            $stmt = $db->query("SELECT id, title, content, created_at as createdAt FROM announcements ORDER BY created_at DESC LIMIT 2");
            $stats['recentAnnouncements'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // 6. Progress Calculation
            // Assignment Completion Rate
            $stmt = $db->prepare("SELECT COUNT(*) FROM assignments WHERE semester = :semester");
            $stmt->execute([':semester' => $semester]);
            $totalAssignments = $stmt->fetchColumn();

            $stmt = $db->prepare("SELECT COUNT(DISTINCT assignment_id) FROM assignment_submissions WHERE student_id = :sid");
            $stmt->execute([':sid' => $userId]);
            $submittedAssignments = $stmt->fetchColumn();

            $stats['progress']['assignments'] = ($totalAssignments > 0) ? round(($submittedAssignments / $totalAssignments) * 100) : 0;

            // Quiz Completion Rate (Approximation: Attempts vs Total Quizzes)
            // Note: Quizzes don't strictly have 'semester' in simplified schema usually, but let's assume all available are target. 
            // Or if simplified schema lacks quiz semester, we count all.
            $stmt = $db->query("SELECT COUNT(*) FROM quizzes"); // Assuming simplified, all quizzes visible
            $totalQuizzes = $stmt->fetchColumn();

            $stmt = $db->prepare("SELECT COUNT(DISTINCT quiz_id) FROM quiz_attempts WHERE student_id = :sid");
            $stmt->execute([':sid' => $userId]);
            $attemptedQuizzes = $stmt->fetchColumn();

            $stats['progress']['quizzes'] = ($totalQuizzes > 0) ? round(($attemptedQuizzes / $totalQuizzes) * 100) : 0;

            // 7. Weekly Schedule
            // Match Schedule model logic: 'Everyone', 'Students', or 'Students (Sem X)'
            // Fetch for the entire current week (Monday to Sunday) to match frontend Calendar view
            $semesterSpecific = "Students (Sem " . $semester . ")";
            $query = "
                SELECT * FROM schedules 
                WHERE (target_audience = 'Everyone' 
                    OR target_audience = 'Students' 
                    OR target_audience = :semester_specific)
                AND YEARWEEK(schedule_date, 1) = YEARWEEK(CURDATE(), 1)
                ORDER BY schedule_date ASC, schedule_time ASC
            ";
            $stmt = $db->prepare($query);
            $stmt->execute([':semester_specific' => $semesterSpecific]);
            $stats['weeklySchedule'] = $stmt->fetchAll(PDO::FETCH_ASSOC);


        } catch (PDOException $e) {
            error_log("Student dashboard stats error: " . $e->getMessage());
            Response::error('Failed to fetch dashboard stats');
            return;
        }

        Response::success($stats);
    }
    public static function getTeacherStats()
    {
        $headers = getallheaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $decoded = JWTHandler::validateToken($token);

        if (!$decoded || ($decoded['role'] !== 'teacher')) {
            Response::error('Unauthorized', 401);
            return;
        }

        $userId = $decoded['user_id'];
        $database = new Database();
        $db = $database->getConnection();

        $stats = [
            'materialsCount' => 0,
            'activeAssignments' => 0,
            'quizzesCreated' => 0,
            'pendingGrading' => 0,
            'recentSubmissions' => [],
            'classPerformance' => [
                'average' => 0,
                'submissionRate' => 0
            ],
            'weeklySchedule' => []
        ];

        try {
            // 1. Materials Uploaded (Strictly by this teacher)
            $stmt = $db->prepare("SELECT COUNT(*) FROM materials WHERE uploaded_by_teacher_id = :uid");
            $stmt->execute([':uid' => $userId]);
            $stats['materialsCount'] = $stmt->fetchColumn();

            // 2. Active Assignments (Created by this teacher)
            $stmt = $db->prepare("SELECT COUNT(*) FROM assignments WHERE created_by_teacher_id = :uid AND due_date >= CURRENT_DATE()");
            $stmt->execute([':uid' => $userId]);
            $stats['activeAssignments'] = $stmt->fetchColumn();

            // 3. Quizzes Created (Created by this teacher)
            $stmt = $db->prepare("SELECT COUNT(*) FROM quizzes WHERE created_by_teacher_id = :uid");
            $stmt->execute([':uid' => $userId]);
            $stats['quizzesCreated'] = $stmt->fetchColumn();

            // 4. Pending Grading (Submissions for THIS teacher's assignments)
            $query = "
                SELECT COUNT(*) FROM assignment_submissions s
                JOIN assignments a ON s.assignment_id = a.id
                WHERE a.created_by_teacher_id = :uid 
                AND (s.status = 'submitted' OR s.status = 'pending')
            ";
            $stmt = $db->prepare($query);
            $stmt->execute([':uid' => $userId]);
            $stats['pendingGrading'] = $stmt->fetchColumn();

            // 5. Recent Submissions (For THIS teacher's assignments)
            $query = "
                SELECT s.id, s.submitted_at as submittedAt, s.marks_obtained as marks, 
                       u.name as studentName, a.title as assignmentTitle
                FROM assignment_submissions s
                JOIN students u ON s.student_id = u.id
                JOIN assignments a ON s.assignment_id = a.id
                WHERE a.created_by_teacher_id = :uid
                ORDER BY s.submitted_at DESC
                LIMIT 5
            ";
            $stmt = $db->prepare($query);
            $stmt->execute([':uid' => $userId]);
            $stats['recentSubmissions'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // 6. Class Performance
            // Class Average (Avg marks of all graded submissions for THIS teacher)
            $query = "
                SELECT AVG((marks_obtained / total_marks) * 100) 
                FROM assignment_submissions s 
                JOIN assignments a ON s.assignment_id = a.id 
                WHERE a.created_by_teacher_id = :uid 
                AND s.status = 'graded' AND a.total_marks > 0
            ";
            $stmt = $db->prepare($query);
            $stmt->execute([':uid' => $userId]);
            $avg = $stmt->fetchColumn();
            $stats['classPerformance']['average'] = $avg ? round($avg) : 0;

            // Submission Rate (Weekly for THIS teacher's assignments)
            $stmt = $db->prepare("SELECT COUNT(*) FROM assignments WHERE created_by_teacher_id = :uid AND due_date BETWEEN DATE_SUB(NOW(), INTERVAL 7 DAY) AND NOW()");
            $stmt->execute([':uid' => $userId]);
            $recentAssignmentsCount = $stmt->fetchColumn();

            if ($recentAssignmentsCount > 0) {
                // Active students (submitted to ME in last 7 days) / Total Students (submitted to ME ever)
                $stmt = $db->prepare("SELECT COUNT(DISTINCT student_id) FROM assignment_submissions s JOIN assignments a ON s.assignment_id = a.id WHERE a.created_by_teacher_id = :uid");
                $stmt->execute([':uid' => $userId]);
                $myTotalStudents = $stmt->fetchColumn();

                if ($myTotalStudents > 0) {
                    $stmt = $db->prepare("SELECT COUNT(DISTINCT student_id) FROM assignment_submissions s JOIN assignments a ON s.assignment_id = a.id WHERE a.created_by_teacher_id = :uid AND s.submitted_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
                    $stmt->execute([':uid' => $userId]);
                    $myActiveStudents = $stmt->fetchColumn();
                    $stats['classPerformance']['submissionRate'] = round(($myActiveStudents / $myTotalStudents) * 100);
                } else {
                    $stats['classPerformance']['submissionRate'] = 0;
                }
            } else {
                $stats['classPerformance']['submissionRate'] = 0;
            }

            // 7. Weekly Schedule (Keep generic as schedules are shared/admin managed usually)
            $query = "
                SELECT * FROM schedules 
                WHERE (target_audience = 'Everyone' OR target_audience = 'Teachers')
                AND YEARWEEK(schedule_date, 1) = YEARWEEK(CURDATE(), 1)
                ORDER BY schedule_date ASC, schedule_time ASC
            ";
            $stmt = $db->prepare($query);
            $stmt->execute();
            $stats['weeklySchedule'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        } catch (PDOException $e) {
            error_log("Teacher dashboard stats error: " . $e->getMessage());
            Response::error('Failed to fetch dashboard stats');
            return;
        }

        Response::success($stats);
    }
}
