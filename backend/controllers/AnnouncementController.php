<?php
/**
 * Announcement Controller
 * Handles announcement CRUD operations
 */

require_once __DIR__ . '/../models/Announcement.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/JWTHandler.php';
require_once __DIR__ . '/../utils/NotificationHelper.php';

class AnnouncementController
{
    /**
     * Get all announcements or filter by audience
     */
    public static function index()
    {
        $headers = getallheaders();
        $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
        $token = str_replace('Bearer ', '', $authHeader);
        $decoded = JWTHandler::validateToken($token);

        if (!$decoded) {
            Response::unauthorized('Invalid token');
        }

        $announcement = new Announcement();

        // If student/teacher, filter by their role (and include their own created announcements)
        if (in_array($decoded['role'], ['student', 'teacher'])) {
            $announcements = $announcement->getByAudience($decoded['role'], $decoded['user_id'], $decoded['role']);
        } else {
            // Admins see all
            $announcements = $announcement->getAll();
        }

        Response::success($announcements);
    }

    /**
     * Get announcement by ID
     */
    public static function show($id)
    {
        $announcement = new Announcement();
        $data = $announcement->findById($id);

        if (!$data) {
            Response::notFound('Announcement not found');
        }

        Response::success($data);
    }

    /**
     * Create new announcement
     */
    public static function store()
    {
        $headers = getallheaders();
        $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
        $token = str_replace('Bearer ', '', $authHeader);
        $decoded = JWTHandler::validateToken($token);

        if (!$decoded) {
            Response::unauthorized('Invalid token');
        }

        // Only admins and teachers can create announcements
        if (!in_array($decoded['role'], ['admin', 'teacher'])) {
            Response::forbidden('Only admins and teachers can create announcements');
        }

        $data = json_decode(file_get_contents("php://input"));

        if (!isset($data->title) || !isset($data->content)) {
            Response::validationError([
                'title' => 'Title is required',
                'content' => 'Content is required'
            ]);
        }

        $announcement = new Announcement();
        $announcement->title = $data->title;
        $announcement->content = $data->content;
        $announcement->created_by_role = $decoded['role'];
        $announcement->created_by_id = $decoded['user_id'];
        $announcement->target_audience = isset($data->target_audience) ? $data->target_audience : 'all';

        if ($announcement->create()) {
            $newAnnouncement = $announcement->findById($announcement->id);

            // Create notifications for relevant users
            NotificationHelper::createAnnouncementNotification($newAnnouncement);

            Response::success($newAnnouncement, 'Announcement created successfully', 201);
        } else {
            Response::error('Failed to create announcement');
        }
    }

    /**
     * Update announcement
     */
    public static function update($id)
    {
        $headers = getallheaders();
        $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
        $token = str_replace('Bearer ', '', $authHeader);
        $decoded = JWTHandler::validateToken($token);

        if (!$decoded) {
            Response::unauthorized('Invalid token');
        }

        $data = json_decode(file_get_contents("php://input"));

        $announcement = new Announcement();
        $existing = $announcement->findById($id);

        if (!$existing) {
            Response::notFound('Announcement not found');
        }

        // Check if user owns this announcement
        if ($existing['created_by_id'] != $decoded['user_id'] || $existing['created_by_role'] != $decoded['role']) {
            if ($decoded['role'] !== 'admin') {
                Response::forbidden('You can only edit your own announcements');
            }
        }

        $announcement->id = $id;
        $announcement->title = isset($data->title) ? $data->title : $existing['title'];
        $announcement->content = isset($data->content) ? $data->content : $existing['content'];
        $announcement->target_audience = isset($data->target_audience) ? $data->target_audience : $existing['target_audience'];

        if ($announcement->update($id)) {
            $updated = $announcement->findById($id);
            Response::success($updated, 'Announcement updated successfully');
        } else {
            Response::error('Failed to update announcement');
        }
    }

    /**
     * Delete announcement
     */
    public static function destroy($id)
    {
        $headers = getallheaders();
        $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
        $token = str_replace('Bearer ', '', $authHeader);
        $decoded = JWTHandler::validateToken($token);

        if (!$decoded) {
            Response::unauthorized('Invalid token');
        }

        $announcement = new Announcement();
        $existing = $announcement->findById($id);

        if (!$existing) {
            Response::notFound('Announcement not found');
        }

        // Check if user owns this announcement
        if ($existing['created_by_id'] != $decoded['user_id'] || $existing['created_by_role'] != $decoded['role']) {
            if ($decoded['role'] !== 'admin') {
                Response::forbidden('You can only delete your own announcements');
            }
        }

        $announcement->id = $id;

        if ($announcement->delete($id)) {
            Response::success(null, 'Announcement deleted successfully');
        } else {
            Response::error('Failed to delete announcement');
        }
    }
}
