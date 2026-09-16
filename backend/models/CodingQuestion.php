<?php
require_once __DIR__ . '/../config/database.php';

class CodingQuestion
{
    private $conn;
    private $table_name = "coding_questions";

    public $id;
    public $title;
    public $description;
    public $difficulty;
    public $time_limit = 2.0;
    public $memory_limit = 256000;
    public $category_tags = '[]';
    public $created_by_teacher_id;
    public $updated_at;

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    public function getAll()
    {
        $query = "SELECT * FROM " . $this->table_name . " ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getByTeacher($teacher_id)
    {
        $query = "SELECT * FROM " . $this->table_name . " WHERE created_by_teacher_id = :teacher_id ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":teacher_id", $teacher_id);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findById($id)
    {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = :id LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create()
    {
        $query = "INSERT INTO " . $this->table_name . "
                (title, description, difficulty, time_limit, memory_limit, category_tags, created_by_teacher_id)
                VALUES
                (:title, :description, :difficulty, :time_limit, :memory_limit, :category_tags, :created_by_teacher_id)";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":difficulty", $this->difficulty);
        $stmt->bindParam(":time_limit", $this->time_limit);
        $stmt->bindParam(":memory_limit", $this->memory_limit);
        $stmt->bindParam(":category_tags", $this->category_tags);
        $stmt->bindParam(":created_by_teacher_id", $this->created_by_teacher_id);

        return $stmt->execute();
    }

    public function update()
    {
        $query = "UPDATE " . $this->table_name . "
                SET title = :title,
                    description = :description,
                    difficulty = :difficulty,
                    time_limit = :time_limit,
                    memory_limit = :memory_limit,
                    category_tags = :category_tags
                WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":difficulty", $this->difficulty);
        $stmt->bindParam(":time_limit", $this->time_limit);
        $stmt->bindParam(":memory_limit", $this->memory_limit);
        $stmt->bindParam(":category_tags", $this->category_tags);
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
