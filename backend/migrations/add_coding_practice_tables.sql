CREATE TABLE IF NOT EXISTS `coding_questions` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `difficulty` VARCHAR(50) NOT NULL,
  `created_by_teacher_id` INTEGER NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `coding_submissions` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `question_id` INTEGER NOT NULL,
  `student_id` INTEGER NOT NULL,
  `code` TEXT,
  `status` VARCHAR(50) DEFAULT 'Pending',
  `score` VARCHAR(50) DEFAULT '0/100',
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`question_id`) REFERENCES `coding_questions`(`id`) ON DELETE CASCADE
);
