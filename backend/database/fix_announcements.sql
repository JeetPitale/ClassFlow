-- Fix target_audience ENUM to match frontend values
ALTER TABLE announcements 
MODIFY COLUMN target_audience ENUM('all', 'student', 'teacher') DEFAULT 'all';
