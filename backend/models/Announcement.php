<?php
/**
 * Announcement Model
 * ClassFlow LMS Backend
 */

require_once __DIR__ . '/../config/database.php';

class Announcement
{
    private $conn;
    private $table_name = "announcements";

    public $id;
    public $title;
    public $content;
    public $created_by_role;
    public $created_by_id;
    public $target_audience;

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    /**
     * Get all announcements
     */
    public function getAll()
    {
        $query = "SELECT a.*, 
                  CASE 
                    WHEN a.created_by_role = 'admin' THEN ad.name
                    WHEN a.created_by_role = 'teacher' THEN t.name
                  END as creator_name
                  FROM " . $this->table_name . " a
                  LEFT JOIN admins ad ON a.created_by_role = 'admin' AND a.created_by_id = ad.id
                  LEFT JOIN teachers t ON a.created_by_role = 'teacher' AND a.created_by_id = t.id
                  ORDER BY a.created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Get announcements by target audience
     * For teachers/admins: also includes announcements they created
     * For students: only shows announcements targeted to them
     */
    public function getByAudience($audience, $userId = null, $userRole = null)
    {
        // For students: only show announcements targeted to them or all
        if ($audience === 'student') {
            $query = "SELECT a.*, 
                      CASE 
                        WHEN a.created_by_role = 'admin' THEN ad.name
                        WHEN a.created_by_role = 'teacher' THEN t.name
                      END as creator_name
                      FROM " . $this->table_name . " a
                      LEFT JOIN admins ad ON a.created_by_role = 'admin' AND a.created_by_id = ad.id
                      LEFT JOIN teachers t ON a.created_by_role = 'teacher' AND a.created_by_id = t.id
                      WHERE (a.target_audience = :audience OR a.target_audience = 'all')
                      ORDER BY a.created_at DESC";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":audience", $audience);
            $stmt->execute();

            return $stmt->fetchAll();
        }

        // For teachers/admins: show announcements targeted to them, all, AND announcements they created
        if ($userId && $userRole) {
            $query = "SELECT a.*, 
                      CASE 
                        WHEN a.created_by_role = 'admin' THEN ad.name
                        WHEN a.created_by_role = 'teacher' THEN t.name
                      END as creator_name
                      FROM " . $this->table_name . " a
                      LEFT JOIN admins ad ON a.created_by_role = 'admin' AND a.created_by_id = ad.id
                      LEFT JOIN teachers t ON a.created_by_role = 'teacher' AND a.created_by_id = t.id
                      WHERE (a.target_audience = :audience OR a.target_audience = 'all'
                             OR (a.created_by_role = :user_role AND a.created_by_id = :user_id))
                      ORDER BY a.created_at DESC";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":audience", $audience);
            $stmt->bindParam(":user_role", $userRole);
            $stmt->bindParam(":user_id", $userId, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetchAll();
        }

        // Fallback: just filter by audience
        $query = "SELECT a.*, 
                  CASE 
                    WHEN a.created_by_role = 'admin' THEN ad.name
                    WHEN a.created_by_role = 'teacher' THEN t.name
                  END as creator_name
                  FROM " . $this->table_name . " a
                  LEFT JOIN admins ad ON a.created_by_role = 'admin' AND a.created_by_id = ad.id
                  LEFT JOIN teachers t ON a.created_by_role = 'teacher' AND a.created_by_id = t.id
                  WHERE a.target_audience = :audience OR a.target_audience = 'all'
                  ORDER BY a.created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":audience", $audience);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Create announcement
     */
    public function create()
    {
        $query = "INSERT INTO " . $this->table_name . "
                  (title, content, created_by_role, created_by_id, target_audience)
                  VALUES
                  (:title, :content, :created_by_role, :created_by_id, :target_audience)";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":content", $this->content);
        $stmt->bindParam(":created_by_role", $this->created_by_role);
        $stmt->bindParam(":created_by_id", $this->created_by_id);
        $stmt->bindParam(":target_audience", $this->target_audience);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    /**
     * Get announcement by ID
     */
    public function findById($id)
    {
        $query = "SELECT a.*, 
                  CASE 
                    WHEN a.created_by_role = 'admin' THEN ad.name
                    WHEN a.created_by_role = 'teacher' THEN t.name
                  END as creator_name
                  FROM " . $this->table_name . " a
                  LEFT JOIN admins ad ON a.created_by_role = 'admin' AND a.created_by_id = ad.id
                  LEFT JOIN teachers t ON a.created_by_role = 'teacher' AND a.created_by_id = t.id
                  WHERE a.id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetch();
    }

    /**
     * Update announcement
     */
    public function update($id)
    {
        $query = "UPDATE " . $this->table_name . "
                  SET title = :title, content = :content, target_audience = :target_audience
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":content", $this->content);
        $stmt->bindParam(":target_audience", $this->target_audience);
        $stmt->bindParam(":id", $id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * Delete announcement
     */
    public function delete($id)
    {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id, PDO::PARAM_INT);

        return $stmt->execute();
    }
}
