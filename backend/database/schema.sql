-- ClassFlow LMS Database Schema (Updated with Separate User Tables)
-- Database: classflow_db

-- Drop existing tables if they exist
DROP TABLE IF EXISTS quiz_attempts;
DROP TABLE IF EXISTS quiz_questions;
DROP TABLE IF EXISTS quizzes;
DROP TABLE IF EXISTS assignment_submissions;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS materials;
DROP TABLE IF EXISTS announcements;
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS startup_ideas;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS admins;

-- Admins Table
CREATE TABLE admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    dob DATE,
    gender ENUM('male', 'female', 'other'),
    address TEXT,
    profile_photo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Teachers Table
CREATE TABLE teachers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    dob DATE,
    gender ENUM('male', 'female', 'other'),
    address TEXT,
    subject_specialization VARCHAR(255),
    qualification VARCHAR(255),
    experience_years INT,
    profile_photo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Students Table
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    dob DATE,
    gender ENUM('male', 'female', 'other'),
    address TEXT,
    enrollment_no VARCHAR(50) UNIQUE NOT NULL,
    semester INT NOT NULL,
    department VARCHAR(100),
    profile_photo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_enrollment_no (enrollment_no),
    INDEX idx_semester (semester)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Announcements Table (can be created by admin or teacher)
CREATE TABLE announcements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    target_audience ENUM('all', 'students', 'teachers') DEFAULT 'all',
    created_by_role ENUM('admin', 'teacher') NOT NULL,
    created_by_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_target_audience (target_audience),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Materials Table (uploaded by teachers)
CREATE TABLE materials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    course VARCHAR(100),
    semester INT,
    uploaded_by_teacher_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by_teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    INDEX idx_semester (semester),
    INDEX idx_course (course)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Assignments Table (created by teachers)
CREATE TABLE assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATETIME NOT NULL,
    total_marks INT NOT NULL,
    course VARCHAR(100),
    semester INT,
    created_by_teacher_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    INDEX idx_semester (semester),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Assignment Submissions Table (submitted by students)
CREATE TABLE assignment_submissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    submission_text TEXT,
    file_url VARCHAR(500),
    marks_obtained INT,
    feedback TEXT,
    status ENUM('pending', 'graded') DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP NULL,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_submission (assignment_id, student_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Quizzes Table (created by teachers)
CREATE TABLE quizzes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL,
    total_marks INT NOT NULL,
    course VARCHAR(100),
    semester INT,
    created_by_teacher_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    INDEX idx_semester (semester)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Quiz Questions Table
CREATE TABLE quiz_questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    quiz_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('multiple_choice', 'true_false', 'short_answer') NOT NULL,
    options_json TEXT,
    correct_answer TEXT NOT NULL,
    marks INT NOT NULL,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Quiz Attempts Table (by students)
CREATE TABLE quiz_attempts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    quiz_id INT NOT NULL,
    student_id INT NOT NULL,
    answers_json TEXT NOT NULL,
    score INT,
    total_marks INT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP NULL,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_student_quiz (student_id, quiz_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Schedules Table (created by admin)
CREATE TABLE schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    schedule_date DATE NOT NULL,
    schedule_time TIME NOT NULL,
    location VARCHAR(255),
    type ENUM('class', 'exam', 'event', 'meeting') DEFAULT 'class',
    created_by_admin_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    INDEX idx_schedule_date (schedule_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Feedback Table (submitted by students, responded by admin)
CREATE TABLE feedback (
    id INT PRIMARY KEY AUTO_INCREMENT,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(100),
    status ENUM('pending', 'reviewed', 'resolved') DEFAULT 'pending',
    response TEXT,
    student_id INT NOT NULL,
    responded_by_admin_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (responded_by_admin_id) REFERENCES admins(id) ON DELETE SET NULL,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Startup Ideas Table (submitted by students, reviewed by admin)
CREATE TABLE startup_ideas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    feedback TEXT,
    student_id INT NOT NULL,
    reviewed_by_admin_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by_admin_id) REFERENCES admins(id) ON DELETE SET NULL,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Syllabus Topics Table
CREATE TABLE syllabus_topics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    weeks VARCHAR(100),
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    INDEX idx_teacher (teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Syllabus Subtopics Table
CREATE TABLE syllabus_subtopics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    parent_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES syllabus_topics(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert Initial Admin
INSERT INTO admins (email, password_hash, name, phone, dob, gender, address) VALUES
('jeetzo77@admin.in', '$2y$10$vFZ7EKZJmW5FqZ9KqvLb4uKhxJTqXB5YvMH5p7Vc.N7HJY5Z6ZKZm', 'Alex Administrator', '9876543210', '1985-06-15', 'male', '456 Admin Street, City Center');

-- Insert Sample Teacher
INSERT INTO teachers (email, password_hash, name, phone, dob, gender, address, subject_specialization, qualification, experience_years) VALUES
('teacher@lms.in', '$2y$10$7KIXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/abc', 'Jane Teacher', '9988776655', '1980-03-20', 'female', '789 Teacher Ave', 'Computer Science', 'M.Tech', 5);

-- Insert Sample Student
INSERT INTO students (email, password_hash, name, phone, dob, gender, address, enrollment_no, semester, department) VALUES
('23ci2020044@student.edu', '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm', 'John Smith', '1234567890', '2000-01-01', 'male', '123 Student Ln', 'ENR001', 1, 'Computer Science');
