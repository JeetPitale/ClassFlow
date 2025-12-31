ALTER TABLE schedules ADD COLUMN target_audience VARCHAR(255) NULL DEFAULT 'All Students' AFTER type;
