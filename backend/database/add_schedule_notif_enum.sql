ALTER TABLE notifications MODIFY COLUMN type ENUM('assignment', 'quiz', 'material', 'announcement', 'feedback', 'startup_review', 'startup_submission', 'schedule') NOT NULL;
