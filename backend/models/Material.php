<?php
/**
 * Material Model
 * ClassFlow LMS Backend
 */

require_once __DIR__ . '/../config/database.php';

class Material
{
    private $conn;
    private $table_name = "materials";

    public $id;
    public $title;
    public $description;
    public $file_path;
    public $file_url;
    public $file_type;
    public $uploaded_by_teacher_id;
    public $semester;

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    public function getAll()
    {
        $query = "SELECT m.*, t.name as teacher_name
                  FROM " . $this->table_name . " m
                  LEFT JOIN teachers t ON m.uploaded_by_teacher_id = t.id
                  ORDER BY m.created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getBySemester($semester)
    {
        $query = "SELECT m.*, t.name as teacher_name
                  FROM " . $this->table_name . " m
                  LEFT JOIN teachers t ON m.uploaded_by_teacher_id = t.id
                  WHERE m.semester = :semester
                  ORDER BY m.created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":semester", $semester);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getByTeacher($teacher_id)
    {
        $query = "SELECT m.*, t.name as teacher_name
                  FROM " . $this->table_name . " m
                  LEFT JOIN teachers t ON m.uploaded_by_teacher_id = t.id
                  WHERE m.uploaded_by_teacher_id = :teacher_id
                  ORDER BY m.created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":teacher_id", $teacher_id);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function findById($id)
    {
        $query = "SELECT m.*, t.name as teacher_name
                  FROM " . $this->table_name . " m
                  LEFT JOIN teachers t ON m.uploaded_by_teacher_id = t.id
                  WHERE m.id = :id LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function create()
    {
        $query = "INSERT INTO " . $this->table_name . "
                  (title, description, file_path, file_url, file_type, uploaded_by_teacher_id, semester)
                  VALUES (:title, :description, :file_path, :file_url, :file_type, :uploaded_by_teacher_id, :semester)";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":file_path", $this->file_path);
        $stmt->bindParam(":file_url", $this->file_url);
        $stmt->bindParam(":file_type", $this->file_type);
        $stmt->bindParam(":uploaded_by_teacher_id", $this->uploaded_by_teacher_id);
        $stmt->bindParam(":semester", $this->semester);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    public function update()
    {
        $query = "UPDATE " . $this->table_name . "
                  SET title = :title,
                      description = :description,
                      file_path = :file_path,
                      file_url = :file_url,
                      file_type = :file_type,
                      semester = :semester
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":file_path", $this->file_path);
        $stmt->bindParam(":file_url", $this->file_url);
        $stmt->bindParam(":file_type", $this->file_type);
        $stmt->bindParam(":semester", $this->semester);
        $stmt->bindParam(":id", $this->id);

        return $stmt->execute();
    }

    public function delete()
    {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id);
        return $stmt->execute();
    }
}
