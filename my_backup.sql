-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Dec 31, 2025 at 07:36 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `classflow_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `address` text DEFAULT NULL,
  `profile_photo` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `email`, `password_hash`, `name`, `phone`, `dob`, `gender`, `address`, `profile_photo`, `created_at`, `updated_at`) VALUES
(1, 'jeetzo77@admin.in', '$2y$10$vFZ7EKZJmW5FqZ9KqvLb4uKhxJTqXB5YvMH5p7Vc.N7HJY5Z6ZKZm', 'Alex Administrator', '9876543210', '1985-06-15', 'male', '456 Admin Street, City Center', NULL, '2025-12-31 16:48:02', '2025-12-31 16:48:02');

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

CREATE TABLE `announcements` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `target_audience` enum('all','student','teacher') DEFAULT 'all',
  `created_by_role` enum('admin','teacher') NOT NULL,
  `created_by_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `assignments`
--

CREATE TABLE `assignments` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `due_date` datetime NOT NULL,
  `total_marks` int(11) NOT NULL,
  `course` varchar(100) DEFAULT NULL,
  `semester` int(11) DEFAULT NULL,
  `created_by_teacher_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `assignment_submissions`
--

CREATE TABLE `assignment_submissions` (
  `id` int(11) NOT NULL,
  `assignment_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `submission_text` text DEFAULT NULL,
  `file_url` varchar(500) DEFAULT NULL,
  `marks_obtained` int(11) DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `status` enum('pending','graded') DEFAULT 'pending',
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `graded_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `feedback`
--

CREATE TABLE `feedback` (
  `id` int(11) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `status` enum('pending','reviewed','resolved') DEFAULT 'pending',
  `response` text DEFAULT NULL,
  `student_id` int(11) NOT NULL,
  `responded_by_admin_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `materials`
--

CREATE TABLE `materials` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `file_url` varchar(500) NOT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `course` varchar(100) DEFAULT NULL,
  `semester` int(11) DEFAULT NULL,
  `uploaded_by_teacher_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `user_role` enum('admin','teacher','student') NOT NULL,
  `type` enum('announcement','assignment','material','schedule','quiz','general','feedback','startup_review','startup_submission','grade') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `link` varchar(255) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `user_role`, `type`, `title`, `message`, `link`, `is_read`, `created_at`) VALUES
(1, 2, 'student', 'announcement', 'New Announcement: Hello It\'s Second', 'Second Try In medicine, \"para\" (or \"-para\") primarily refers to parity, meaning the number of pregna...', '/student/announcements', 1, '2025-12-28 07:51:33'),
(2, 1, 'student', 'announcement', 'New Announcement: Hello It\'s Second', 'Second Try In medicine, \"para\" (or \"-para\") primarily refers to parity, meaning the number of pregna...', '/student/announcements', 1, '2025-12-28 07:51:33'),
(3, 2, 'teacher', 'announcement', 'New Announcement: Hello It\'s Second', 'Second Try In medicine, \"para\" (or \"-para\") primarily refers to parity, meaning the number of pregna...', '/teacher/announcements', 1, '2025-12-28 07:51:33'),
(4, 1, 'teacher', 'announcement', 'New Announcement: Hello It\'s Second', 'Second Try In medicine, \"para\" (or \"-para\") primarily refers to parity, meaning the number of pregna...', '/teacher/announcements', 0, '2025-12-28 07:51:33'),
(5, 2, 'student', 'announcement', 'New Announcement: Hello ', 'Sended By Teavher', '/student/announcements', 1, '2025-12-28 07:55:17'),
(6, 1, 'student', 'announcement', 'New Announcement: Hello ', 'Sended By Teavher', '/student/announcements', 1, '2025-12-28 07:55:17'),
(7, 2, 'student', 'announcement', 'New Announcement: hello ', 'Students', '/student/announcements', 1, '2025-12-28 08:17:41'),
(8, 1, 'student', 'announcement', 'New Announcement: hello ', 'Students', '/student/announcements', 1, '2025-12-28 08:17:41'),
(9, 1, 'student', 'feedback', 'Test', 'Testing feedback notifications', '/student/feedback', 1, '2025-12-28 10:43:42'),
(10, 2, 'student', 'feedback', 'Feedback Response Received', 'Admin has responded to your feedback: \"jvkrbvv...\"', '/student/feedback', 1, '2025-12-28 10:44:44'),
(11, 1, 'student', 'feedback', 'Feedback Response Received', 'Admin has responded to your feedback: \"h...\"', '/student/feedback', 1, '2025-12-29 12:20:20'),
(12, 1, 'student', 'startup_review', 'Startup Idea Reviewed', 'Your startup idea \"Test Persistent Idea\" has been marked as Approved.', '/student/startup', 1, '2025-12-30 00:16:00'),
(13, 1, 'student', 'startup_review', 'Startup Idea Reviewed', 'Your startup idea \"vnlkfv\" has been marked as Rejected.', '/student/startup', 0, '2025-12-30 00:18:12'),
(14, 1, 'student', 'startup_review', 'Startup Idea Reviewed', 'Your startup idea \"Keevo\" has been marked as Rejected.', '/student/startup', 0, '2025-12-30 00:18:16'),
(15, 1, 'student', 'startup_review', 'Startup Idea Reviewed', 'Your startup idea \"Test Persistent Idea\" has been marked as Rejected.', '/student/startup', 0, '2025-12-30 00:18:24'),
(16, 2, 'student', 'announcement', 'New Announcement: hello trail 3', '3', '/student/announcements', 0, '2025-12-30 00:28:55'),
(17, 1, 'student', 'announcement', 'New Announcement: hello trail 3', '3', '/student/announcements', 0, '2025-12-30 00:28:55'),
(18, 1, 'student', 'feedback', 'Feedback Response Received', 'Admin has responded to your feedback: \"fbdb...\"', '/student/feedback', 1, '2025-12-30 00:34:04'),
(19, 1, 'student', 'startup_review', 'Startup Idea Reviewed', 'Your startup idea \"Keevo\" has been marked as Approved.', '/student/startup', 1, '2025-12-30 00:42:18'),
(20, 2, 'teacher', 'schedule', 'New Schedule: noti', 'New schedule added for 2025-12-30 at 10:36', '/teacher/assignments', 0, '2025-12-30 01:06:17'),
(21, 1, 'teacher', 'schedule', 'New Schedule: noti', 'New schedule added for 2025-12-30 at 10:36', '/teacher/assignments', 0, '2025-12-30 01:06:17'),
(22, 2, 'student', 'schedule', 'New Schedule: noti', 'New schedule added for 2025-12-30 at 10:36', '/student/dashboard', 0, '2025-12-30 01:06:17'),
(23, 1, 'student', 'schedule', 'New Schedule: noti', 'New schedule added for 2025-12-30 at 10:36', '/student/dashboard', 1, '2025-12-30 01:06:17'),
(24, 1, 'student', 'grade', 'Quiz Graded: sixth', 'You scored 4/20.', '/student/marks', 1, '2025-12-30 20:43:17'),
(25, 1, 'student', 'grade', 'Assignment Graded: first', 'You received 56 marks.', '/student/marks', 1, '2025-12-30 21:42:30'),
(26, 1, 'student', 'grade', 'Assignment Graded: first', 'You received 56 marks.', '/student/marks', 1, '2025-12-30 21:42:43'),
(27, 1, 'student', 'grade', 'Assignment Graded: first', 'You received 56 marks.', '/student/marks', 1, '2025-12-30 21:44:55'),
(28, 1, 'student', 'grade', 'Assignment Graded: second', 'You received 99 marks.', '/student/marks', 1, '2025-12-30 21:59:59'),
(29, 1, 'student', 'grade', 'Quiz Graded: hello', 'You scored 20/50.', '/student/marks', 0, '2025-12-30 22:02:22'),
(30, 2, 'student', 'schedule', 'New Schedule: Spark Quest', 'New schedule added for 2025-12-31 at 14:35', '/student/dashboard', 0, '2025-12-31 05:05:38'),
(31, 1, 'student', 'schedule', 'New Schedule: Spark Quest', 'New schedule added for 2025-12-31 at 14:35', '/student/dashboard', 0, '2025-12-31 05:05:38'),
(32, 3, 'student', 'announcement', 'New Announcement: Hello', 'hello students', '/student/announcements', 0, '2025-12-31 14:13:24'),
(33, 2, 'student', 'announcement', 'New Announcement: Hello', 'hello students', '/student/announcements', 0, '2025-12-31 14:13:24'),
(34, 1, 'student', 'announcement', 'New Announcement: Hello', 'hello students', '/student/announcements', 0, '2025-12-31 14:13:24'),
(35, 3, 'teacher', 'announcement', 'New Announcement: Teachers ', 'Hello Teachers', '/teacher/announcements', 1, '2025-12-31 14:13:42'),
(36, 2, 'teacher', 'announcement', 'New Announcement: Teachers ', 'Hello Teachers', '/teacher/announcements', 0, '2025-12-31 14:13:42'),
(37, 1, 'teacher', 'announcement', 'New Announcement: Teachers ', 'Hello Teachers', '/teacher/announcements', 0, '2025-12-31 14:13:42'),
(38, 3, 'student', 'announcement', 'New Announcement: Everyone', 'Hello Everyone', '/student/announcements', 0, '2025-12-31 14:15:36'),
(39, 2, 'student', 'announcement', 'New Announcement: Everyone', 'Hello Everyone', '/student/announcements', 0, '2025-12-31 14:15:36'),
(40, 1, 'student', 'announcement', 'New Announcement: Everyone', 'Hello Everyone', '/student/announcements', 0, '2025-12-31 14:15:36'),
(41, 3, 'teacher', 'announcement', 'New Announcement: Everyone', 'Hello Everyone', '/teacher/announcements', 1, '2025-12-31 14:15:36'),
(42, 2, 'teacher', 'announcement', 'New Announcement: Everyone', 'Hello Everyone', '/teacher/announcements', 0, '2025-12-31 14:15:36'),
(43, 1, 'teacher', 'announcement', 'New Announcement: Everyone', 'Hello Everyone', '/teacher/announcements', 0, '2025-12-31 14:15:36'),
(44, 3, 'student', 'announcement', 'New Announcement: Hello ALL ', 'ALL', '/student/announcements', 1, '2025-12-31 14:20:03'),
(45, 2, 'student', 'announcement', 'New Announcement: Hello ALL ', 'ALL', '/student/announcements', 0, '2025-12-31 14:20:03'),
(46, 1, 'student', 'announcement', 'New Announcement: Hello ALL ', 'ALL', '/student/announcements', 0, '2025-12-31 14:20:03'),
(47, 1, 'admin', 'feedback', 'New Feedback Received', 'New feedback submitted: \"Hello...\"', '/admin/feedback', 1, '2025-12-31 14:20:45'),
(48, 3, 'student', 'feedback', 'Feedback Response Received', 'Admin has responded to your feedback: \"Hello...\"', '/student/feedback', 1, '2025-12-31 14:22:30'),
(49, 2, 'student', 'schedule', 'New Schedule: For Every', 'New schedule added for 2025-12-31 at 23:57', '/student/dashboard', 0, '2025-12-31 14:23:32'),
(50, 1, 'student', 'schedule', 'New Schedule: For Every', 'New schedule added for 2025-12-31 at 23:57', '/student/dashboard', 0, '2025-12-31 14:23:32'),
(51, 3, 'student', 'schedule', 'New Schedule: For Every', 'New schedule added for 2025-12-31 at 23:57', '/student/dashboard', 0, '2025-12-31 14:23:32'),
(52, 3, 'teacher', 'schedule', 'New Schedule: For Teachers', 'New schedule added for 2025-12-31 at 00:58', '/teacher/assignments', 1, '2025-12-31 14:23:52'),
(53, 2, 'teacher', 'schedule', 'New Schedule: For Teachers', 'New schedule added for 2025-12-31 at 00:58', '/teacher/assignments', 0, '2025-12-31 14:23:52'),
(54, 1, 'teacher', 'schedule', 'New Schedule: For Teachers', 'New schedule added for 2025-12-31 at 00:58', '/teacher/assignments', 0, '2025-12-31 14:23:52'),
(55, 1, 'student', 'schedule', 'New Schedule: For Sem six', 'New schedule added for 2025-12-31 at 21:57', '/student/dashboard', 0, '2025-12-31 14:24:16'),
(56, 3, 'student', 'schedule', 'New Schedule: For Sem six', 'New schedule added for 2025-12-31 at 21:57', '/student/dashboard', 0, '2025-12-31 14:24:16'),
(57, 2, 'student', 'schedule', 'New Schedule: For sem 1', 'New schedule added for 2025-12-31 at 23:58', '/student/dashboard', 0, '2025-12-31 14:24:44'),
(58, 3, 'teacher', 'schedule', 'New Schedule: rhkvk', 'New schedule added for 2025-12-23 at 00:00', '/teacher/assignments', 0, '2025-12-31 14:25:33'),
(59, 2, 'teacher', 'schedule', 'New Schedule: rhkvk', 'New schedule added for 2025-12-23 at 00:00', '/teacher/assignments', 0, '2025-12-31 14:25:33'),
(60, 1, 'teacher', 'schedule', 'New Schedule: rhkvk', 'New schedule added for 2025-12-23 at 00:00', '/teacher/assignments', 0, '2025-12-31 14:25:33'),
(61, 2, 'student', 'schedule', 'New Schedule: rhkvk', 'New schedule added for 2025-12-23 at 00:00', '/student/dashboard', 0, '2025-12-31 14:25:33'),
(62, 1, 'student', 'schedule', 'New Schedule: rhkvk', 'New schedule added for 2025-12-23 at 00:00', '/student/dashboard', 0, '2025-12-31 14:25:33'),
(63, 3, 'student', 'schedule', 'New Schedule: rhkvk', 'New schedule added for 2025-12-23 at 00:00', '/student/dashboard', 0, '2025-12-31 14:25:33'),
(64, 1, 'admin', 'startup_submission', 'New Startup Idea Submitted', 'A new startup idea \"hello\" has been submitted.', '/admin/startups', 0, '2025-12-31 14:27:26'),
(65, 3, 'student', 'startup_review', 'Startup Idea Reviewed', 'Your startup idea \"hello\" has been marked as Approved.', '/student/startup', 1, '2025-12-31 14:27:46'),
(66, 2, 'student', 'material', 'New Study Material: hello', 'New material uploaded', '/student/materials', 0, '2025-12-31 14:30:27'),
(67, 3, 'student', 'material', 'New Study Material: sem 6', 'New material uploaded', '/student/materials', 1, '2025-12-31 14:30:43'),
(68, 1, 'student', 'material', 'New Study Material: sem 6', 'New material uploaded', '/student/materials', 0, '2025-12-31 14:30:43'),
(69, 3, 'student', 'grade', 'Assignment Graded: sem 6', 'You received 55 marks.', '/student/marks', 0, '2025-12-31 14:33:39'),
(70, 3, 'student', 'grade', 'Assignment Graded: sem 6', 'You received 50 marks.', '/student/marks', 1, '2025-12-31 14:33:45'),
(71, 1, 'student', 'grade', 'Assignment Graded: sem 6', 'You received 50 marks.', '/student/marks', 0, '2025-12-31 14:33:52'),
(72, 2, 'student', 'grade', 'Assignment Graded: sem 1', 'You received 98 marks.', '/student/marks', 1, '2025-12-31 14:34:04'),
(73, 2, 'student', 'grade', 'Quiz Graded: jgvdksjgv', 'You scored 10/50.', '/student/marks', 0, '2025-12-31 14:43:32'),
(74, 3, 'student', 'grade', 'Assignment Graded: sem 6', 'You received 50 marks.', '/student/marks', 0, '2025-12-31 14:47:08'),
(75, 2, 'student', 'grade', 'Assignment Graded: sem 1', 'You received 100 marks.', '/student/marks', 0, '2025-12-31 14:47:59');

-- --------------------------------------------------------

--
-- Table structure for table `quizzes`
--

CREATE TABLE `quizzes` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `duration_minutes` int(11) NOT NULL,
  `total_marks` int(11) NOT NULL,
  `course` varchar(100) DEFAULT NULL,
  `semester` int(11) DEFAULT NULL,
  `created_by_teacher_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quiz_attempts`
--

CREATE TABLE `quiz_attempts` (
  `id` int(11) NOT NULL,
  `quiz_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `answers_json` text NOT NULL,
  `score` int(11) DEFAULT NULL,
  `total_marks` int(11) DEFAULT NULL,
  `started_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `submitted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quiz_questions`
--

CREATE TABLE `quiz_questions` (
  `id` int(11) NOT NULL,
  `quiz_id` int(11) NOT NULL,
  `question_text` text NOT NULL,
  `question_type` enum('multiple_choice','true_false','short_answer') NOT NULL,
  `options_json` text DEFAULT NULL,
  `correct_answer` text NOT NULL,
  `marks` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `schedules`
--

CREATE TABLE `schedules` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `schedule_date` date NOT NULL,
  `schedule_time` time NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `type` enum('class','exam','event','meeting') DEFAULT 'class',
  `target_audience` varchar(255) DEFAULT 'All Students',
  `created_by_admin_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `startups`
--

CREATE TABLE `startups` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `brief_description` text NOT NULL,
  `problem_statement` text DEFAULT NULL,
  `solution_overview` text DEFAULT NULL,
  `team_size` int(11) DEFAULT 1,
  `target_market` text DEFAULT NULL,
  `business_model` text DEFAULT NULL,
  `funding_required` decimal(10,2) DEFAULT 0.00,
  `current_stage` varchar(50) DEFAULT NULL,
  `tags` text DEFAULT NULL,
  `attachments` text DEFAULT NULL,
  `status` enum('pending','reviewed','approved','rejected') DEFAULT 'pending',
  `admin_remarks` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `startups`
--

INSERT INTO `startups` (`id`, `student_id`, `title`, `category`, `brief_description`, `problem_statement`, `solution_overview`, `team_size`, `target_market`, `business_model`, `funding_required`, `current_stage`, `tags`, `attachments`, `status`, `admin_remarks`, `created_at`, `updated_at`) VALUES
(1, 1, 'Test Persistent Idea', 'tech', 'Test persistent', '', '', 1, '', '', 0.00, 'idea', '', '', 'rejected', 'Approved after fixing notification bug.', '2025-12-29 12:46:40', '2025-12-30 00:18:24'),
(2, 1, 'Keevo', 'social', 'Keevo is a smart productivity and learning assistant designed to help students manage tasks, studies, and daily routines efficiently. It combines planning, reminders, and AI-powered assistance into one simple and user-friendly platform.', 'Students often struggle with managing assignments, study schedules, and productivity due to the use of multiple disconnected apps. This leads to poor time management, missed deadlines, and reduced academic performance.', 'Keevo provides a unified platform where students can plan tasks, track assignments, receive smart reminders, and get AI-based study assistance. The system simplifies daily workflows and helps users stay organized and focused.', 1, 'College and university students  School students (higher secondary)  Self-learners and competitive exam aspirants', 'Keevo will follow a freemium model, offering core features for free and premium subscriptions for advanced AI features, analytics, and personalized study assistance. Additional revenue can be generated through institutional licensing.', 200000.00, 'idea', '', '', 'approved', 'good', '2025-12-29 23:58:41', '2025-12-30 00:42:18'),
(3, 1, 'vnlkfv', 'finance', 'fvsvdfs', 'fdvfdv', 'vfdbfd', 2, 'fdbvdf', 'bgfbdf', 456666.00, 'prototype', 'rvds', '0a44629d37baac769ef6c76323143cfc.jpg', 'rejected', 'you can do better', '2025-12-30 00:02:40', '2025-12-30 00:18:12'),
(4, 3, 'hello', 'education', 'refreg', 'trhrgr', 'rtr', 2, '', '', 2000.00, 'prototype', '', '', 'approved', '', '2025-12-31 14:27:26', '2025-12-31 14:27:46');

-- --------------------------------------------------------

--
-- Table structure for table `startup_ideas`
--

CREATE TABLE `startup_ideas` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `feedback` text DEFAULT NULL,
  `student_id` int(11) NOT NULL,
  `reviewed_by_admin_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `address` text DEFAULT NULL,
  `enrollment_no` varchar(50) NOT NULL,
  `semester` int(11) NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  `profile_photo` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `email`, `password_hash`, `name`, `phone`, `dob`, `gender`, `address`, `enrollment_no`, `semester`, `department`, `profile_photo`, `created_at`, `updated_at`) VALUES
(1, '23ci2020044@student.edu', '$2y$12$aSrrkNynvSSNhXasoPQFhuSOvg/nQd.BdN4lB69iEVCRgj/PddtiW', 'Jeet Pitale', '09558611538', '2005-11-07', 'male', 'Paldi', '23CI2020044', 6, 'IMCA', NULL, '2025-12-27 08:09:42', '2025-12-29 12:18:26'),
(2, '23ci2020015@student.edu', '$2y$12$WuctVxqF0k4XkwK6euzhJuygmCDYpUE3ywD2407aN.BR967.xPtxm', 'Mustafa Khericha', '7862873504', '2006-06-06', 'male', 'Kalupur', '23CI2020015', 1, 'IMCA', NULL, '2025-12-27 22:22:21', '2025-12-30 00:52:37'),
(3, '23ci2020055@student.edu', '$2y$12$k5oUCpUE0F5lKYrhYwTkCOhOkG/bk2/ri9bGXm5UIQs8jNcFClO9i', 'Tanish', '09558611538', '2025-12-31', 'male', '12/A Bhramshtriya Soc-2,\nNarayan Nagar Road , Paldi Ahm-7', '23CI2020055', 6, 'IMCA', NULL, '2025-12-31 14:11:20', '2025-12-31 14:11:20');

-- --------------------------------------------------------

--
-- Table structure for table `syllabus_subtopics`
--

CREATE TABLE `syllabus_subtopics` (
  `id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `completed` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `syllabus_subtopics`
--

INSERT INTO `syllabus_subtopics` (`id`, `parent_id`, `title`, `description`, `completed`) VALUES
(5, 4, 'vrefvr', 'rev', 1),
(6, 4, 'vrev', 'vrevrev', 1),
(7, 4, 'rvrev', 'fdvfdv', 0);

-- --------------------------------------------------------

--
-- Table structure for table `syllabus_topics`
--

CREATE TABLE `syllabus_topics` (
  `id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `weeks` varchar(100) DEFAULT NULL,
  `completed` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `syllabus_topics`
--

INSERT INTO `syllabus_topics` (`id`, `teacher_id`, `title`, `description`, `weeks`, `completed`, `created_at`) VALUES
(4, 3, 'ML', 'rrklege,', '23', 1, '2025-12-31 14:28:38'),
(5, 3, 'java', '', '2', 0, '2025-12-31 14:29:02');

-- --------------------------------------------------------

--
-- Table structure for table `teachers`
--

CREATE TABLE `teachers` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `address` text DEFAULT NULL,
  `subject_specialization` varchar(255) DEFAULT NULL,
  `qualification` varchar(255) DEFAULT NULL,
  `experience_years` int(11) DEFAULT NULL,
  `profile_photo` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `teachers`
--

INSERT INTO `teachers` (`id`, `email`, `password_hash`, `name`, `phone`, `dob`, `gender`, `address`, `subject_specialization`, `qualification`, `experience_years`, `profile_photo`, `created_at`, `updated_at`) VALUES
(1, 'teacher@lms.in', '$2y$12$C4ochU8TFv3rUrYEMxHo6.v99NlyQP2OCw6tTEoGfH.cJMz4JSc4.', 'Jane Teacher', '9988776655', '1980-03-20', 'female', '789 Teacher Ave', 'Computer Science', 'M.Tech', 5, NULL, '2025-12-27 08:09:42', '2025-12-27 08:41:28'),
(2, 'prof.miller@edu.com', '$2y$12$xCgzJcPxVWMfKO1dhWGgv.ypkmi0idil8YgfC6I7Vw80TddMnEBcG', 'Jeet Teacher', '09558611538', '2012-05-27', 'male', '12/A Bhramshtriya Soc-2,\nNarayan Nagar Road , Paldi Ahm-7', 'red', 'Second Year Completed', -35, NULL, '2025-12-27 22:26:23', '2025-12-28 09:09:15'),
(3, 'krupapanchal0915@gmail.com', '$2y$12$EXFbPF3qQsb0jvx/OdF9TO2CwH7wxuNLe02iMantaPYkYufNF6YXG', 'Krupa Teacher', '09558611538', '2025-12-09', 'female', 'PALGHAR Maharashtra', 'fbdb', 'Second Year Completed', 4, NULL, '2025-12-31 14:12:16', '2025-12-31 14:12:16');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `role` enum('admin','teacher','student') NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `address` text DEFAULT NULL,
  `enrollment_no` varchar(50) DEFAULT NULL,
  `semester` int(11) DEFAULT NULL,
  `profile_photo` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `name`, `role`, `phone`, `dob`, `gender`, `address`, `enrollment_no`, `semester`, `profile_photo`, `created_at`, `updated_at`) VALUES
(1, 'jeetzo77@admin.in', '$2y$10$vFZ7EKZJmW5FqZ9KqvLb4uKhxJTqXB5YvMH5p7Vc.N7HJY5Z6ZKZm', 'Alex Administrator', 'admin', '9876543210', '1985-06-15', 'male', '456 Admin Street, City Center', NULL, NULL, NULL, '2025-12-27 08:03:13', '2025-12-27 08:03:13'),
(3, 'teacher@lms.in', '$2y$10$7KIXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/abc', 'Jane Teacher', 'teacher', '9988776655', '1980-03-20', 'female', '789 Teacher Ave', NULL, NULL, NULL, '2025-12-27 08:03:13', '2025-12-27 08:03:13');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`);

--
-- Indexes for table `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_target_audience` (`target_audience`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `assignments`
--
ALTER TABLE `assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by_teacher_id` (`created_by_teacher_id`),
  ADD KEY `idx_semester` (`semester`),
  ADD KEY `idx_due_date` (`due_date`);

--
-- Indexes for table `assignment_submissions`
--
ALTER TABLE `assignment_submissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_submission` (`assignment_id`,`student_id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `feedback`
--
ALTER TABLE `feedback`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `responded_by_admin_id` (`responded_by_admin_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `materials`
--
ALTER TABLE `materials`
  ADD PRIMARY KEY (`id`),
  ADD KEY `uploaded_by_teacher_id` (`uploaded_by_teacher_id`),
  ADD KEY `idx_semester` (`semester`),
  ADD KEY `idx_course` (`course`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`,`user_role`),
  ADD KEY `idx_read` (`is_read`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indexes for table `quizzes`
--
ALTER TABLE `quizzes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by_teacher_id` (`created_by_teacher_id`),
  ADD KEY `idx_semester` (`semester`);

--
-- Indexes for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `quiz_id` (`quiz_id`),
  ADD KEY `idx_student_quiz` (`student_id`,`quiz_id`);

--
-- Indexes for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `quiz_id` (`quiz_id`);

--
-- Indexes for table `schedules`
--
ALTER TABLE `schedules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by_admin_id` (`created_by_admin_id`),
  ADD KEY `idx_schedule_date` (`schedule_date`);

--
-- Indexes for table `startups`
--
ALTER TABLE `startups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`);

--
-- Indexes for table `startup_ideas`
--
ALTER TABLE `startup_ideas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `reviewed_by_admin_id` (`reviewed_by_admin_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `enrollment_no` (`enrollment_no`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_enrollment_no` (`enrollment_no`),
  ADD KEY `idx_semester` (`semester`);

--
-- Indexes for table `syllabus_subtopics`
--
ALTER TABLE `syllabus_subtopics`
  ADD PRIMARY KEY (`id`),
  ADD KEY `parent_id` (`parent_id`);

--
-- Indexes for table `syllabus_topics`
--
ALTER TABLE `syllabus_topics`
  ADD PRIMARY KEY (`id`),
  ADD KEY `teacher_id` (`teacher_id`);

--
-- Indexes for table `teachers`
--
ALTER TABLE `teachers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `announcements`
--
ALTER TABLE `announcements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `assignments`
--
ALTER TABLE `assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `assignment_submissions`
--
ALTER TABLE `assignment_submissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `feedback`
--
ALTER TABLE `feedback`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `materials`
--
ALTER TABLE `materials`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=76;

--
-- AUTO_INCREMENT for table `quizzes`
--
ALTER TABLE `quizzes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `schedules`
--
ALTER TABLE `schedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `startups`
--
ALTER TABLE `startups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `startup_ideas`
--
ALTER TABLE `startup_ideas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `syllabus_subtopics`
--
ALTER TABLE `syllabus_subtopics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `syllabus_topics`
--
ALTER TABLE `syllabus_topics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `teachers`
--
ALTER TABLE `teachers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `assignments`
--
ALTER TABLE `assignments`
  ADD CONSTRAINT `assignments_ibfk_1` FOREIGN KEY (`created_by_teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `assignment_submissions`
--
ALTER TABLE `assignment_submissions`
  ADD CONSTRAINT `assignment_submissions_ibfk_1` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `assignment_submissions_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `feedback`
--
ALTER TABLE `feedback`
  ADD CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `feedback_ibfk_2` FOREIGN KEY (`responded_by_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `materials`
--
ALTER TABLE `materials`
  ADD CONSTRAINT `materials_ibfk_1` FOREIGN KEY (`uploaded_by_teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quizzes`
--
ALTER TABLE `quizzes`
  ADD CONSTRAINT `quizzes_ibfk_1` FOREIGN KEY (`created_by_teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  ADD CONSTRAINT `quiz_attempts_ibfk_1` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `quiz_attempts_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  ADD CONSTRAINT `quiz_questions_ibfk_1` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `schedules`
--
ALTER TABLE `schedules`
  ADD CONSTRAINT `schedules_ibfk_1` FOREIGN KEY (`created_by_admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `startups`
--
ALTER TABLE `startups`
  ADD CONSTRAINT `startups_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `startup_ideas`
--
ALTER TABLE `startup_ideas`
  ADD CONSTRAINT `startup_ideas_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `startup_ideas_ibfk_2` FOREIGN KEY (`reviewed_by_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `syllabus_subtopics`
--
ALTER TABLE `syllabus_subtopics`
  ADD CONSTRAINT `syllabus_subtopics_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `syllabus_topics` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `syllabus_topics`
--
ALTER TABLE `syllabus_topics`
  ADD CONSTRAINT `syllabus_topics_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
