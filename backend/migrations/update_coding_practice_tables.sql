-- Update coding_questions
ALTER TABLE `coding_questions` ADD COLUMN `time_limit` FLOAT DEFAULT 2.0;
ALTER TABLE `coding_questions` ADD COLUMN `memory_limit` INTEGER DEFAULT 256000;
ALTER TABLE `coding_questions` ADD COLUMN `category_tags` TEXT DEFAULT '[]';

-- Create coding_testcases
CREATE TABLE IF NOT EXISTS `coding_testcases` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `question_id` INTEGER NOT NULL,
  `input_data` TEXT NOT NULL,
  `expected_output` TEXT NOT NULL,
  `is_hidden` BOOLEAN DEFAULT 1,
  `weight` INTEGER DEFAULT 10,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`question_id`) REFERENCES `coding_questions`(`id`) ON DELETE CASCADE
);

-- Update coding_submissions
ALTER TABLE `coding_submissions` ADD COLUMN `language_id` INTEGER DEFAULT 71; -- 71 is typically Python in Judge0
ALTER TABLE `coding_submissions` ADD COLUMN `runtime` FLOAT DEFAULT NULL;
ALTER TABLE `coding_submissions` ADD COLUMN `memory_used` INTEGER DEFAULT NULL;
ALTER TABLE `coding_submissions` ADD COLUMN `testcases_passed` INTEGER DEFAULT 0;
ALTER TABLE `coding_submissions` ADD COLUMN `total_testcases` INTEGER DEFAULT 0;
