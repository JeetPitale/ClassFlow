<?php
/**
 * Notification Controller
 * Handles notification-related API requests
 */

require_once __DIR__ . '/../models/Notification.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/JWTHandler.php';

class NotificationController
{
    /**
     * Get current user's notifications
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

        $notification = new Notification();
        $notifications = $notification->getByUser($decoded['user_id'], $decoded['role']);

        Response::success($notifications);
    }

    /**
     * Get unread count for current user
     */
    public static function unreadCount()
    {
        $headers = getallheaders();
        $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
        $token = str_replace('Bearer ', '', $authHeader);
        $decoded = JWTHandler::validateToken($token);

        if (!$decoded) {
            Response::unauthorized('Invalid token');
        }

        $notification = new Notification();
        $count = $notification->getUnreadCount($decoded['user_id'], $decoded['role']);

        Response::success(['count' => (int) $count]);
    }

    /**
     * Mark notification as read
     */
    public static function markAsRead($id)
    {
        $headers = getallheaders();
        $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
        $token = str_replace('Bearer ', '', $authHeader);
        $decoded = JWTHandler::validateToken($token);

        if (!$decoded) {
            Response::unauthorized('Invalid token');
        }

        $notification = new Notification();
        $existing = $notification->findById($id);

        if (!$existing) {
            Response::notFound('Notification not found');
        }

        // Verify ownership
        if ($existing['user_id'] != $decoded['user_id'] || $existing['user_role'] != $decoded['role']) {
            Response::forbidden('Not your notification');
        }

        if ($notification->markAsRead($id)) {
            Response::success(null, 'Marked as read');
        } else {
            Response::error('Failed to update');
        }
    }

    /**
     * Mark all notifications as read
     */
    public static function markAllAsRead()
    {
        $headers = getallheaders();
        $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
        $token = str_replace('Bearer ', '', $authHeader);
        $decoded = JWTHandler::validateToken($token);

        if (!$decoded) {
            Response::unauthorized('Invalid token');
        }

        $notification = new Notification();

        if ($notification->markAllAsRead($decoded['user_id'], $decoded['role'])) {
            Response::success(null, 'All marked as read');
        } else {
            Response::error('Failed to update');
        }
    }

    /**
     * Delete notification
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

        $notification = new Notification();
        $existing = $notification->findById($id);

        if (!$existing) {
            Response::notFound('Notification not found');
        }

        // Verify ownership
        if ($existing['user_id'] != $decoded['user_id'] || $existing['user_role'] != $decoded['role']) {
            Response::forbidden('Not your notification');
        }

        if ($notification->delete($id)) {
            Response::success(null, 'Notification deleted');
        } else {
            Response::error('Failed to delete');
        }
    }
}
