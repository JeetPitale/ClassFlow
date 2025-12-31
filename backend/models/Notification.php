<?php
/**
 * Notification Model
 * ClassFlow LMS Backend
 */

require_once __DIR__ . '/../config/database.php';

class Notification
{
    private $conn;
    private $table_name = "notifications";

    public $id;
    public $user_id;
    public $user_role;
    public $type;
    public $title;
    public $message;
    public $link;
    public $is_read;

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    /**
     * Create notification
     */
    public function create()
    {
        $query = "INSERT INTO " . $this->table_name . "
                  (user_id, user_role, type, title, message, link)
                  VALUES
                  (:user_id, :user_role, :type, :title, :message, :link)";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":user_role", $this->user_role);
        $stmt->bindParam(":type", $this->type);
        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":message", $this->message);
        $stmt->bindParam(":link", $this->link);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    /**
     * Get notifications for a specific user
     */
    public function getByUser($userId, $role, $limit = 50)
    {
        $query = "SELECT * FROM " . $this->table_name . "
                  WHERE user_id = :user_id AND user_role = :role
                  ORDER BY created_at DESC
                  LIMIT :limit";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $userId, PDO::PARAM_INT);
        $stmt->bindParam(":role", $role);
        $stmt->bindParam(":limit", $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Get unread count for user
     */
    public function getUnreadCount($userId, $role)
    {
        $query = "SELECT COUNT(*) as count FROM " . $this->table_name . "
                  WHERE user_id = :user_id 
                  AND user_role = :role 
                  AND is_read = FALSE";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $userId, PDO::PARAM_INT);
        $stmt->bindParam(":role", $role);
        $stmt->execute();

        $row = $stmt->fetch();
        return $row['count'];
    }

    /**
     * Mark notification as read
     */
    public function markAsRead($id)
    {
        $query = "UPDATE " . $this->table_name . "
                  SET is_read = TRUE
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * Mark all notifications as read for a user
     */
    public function markAllAsRead($userId, $role)
    {
        $query = "UPDATE " . $this->table_name . "
                  SET is_read = TRUE
                  WHERE user_id = :user_id AND user_role = :role";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $userId, PDO::PARAM_INT);
        $stmt->bindParam(":role", $role);

        return $stmt->execute();
    }

    /**
     * Delete notification
     */
    public function delete($id)
    {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * Get notification by ID
     */
    public function findById($id)
    {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = :id LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetch();
    }
}
