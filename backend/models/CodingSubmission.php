<?php
require_once __DIR__ . '/../config/database.php';

class CodingSubmission
{
    private $conn;
    private $table_name = "coding_submissions";

    public $id;
    public $question_id;
    public $student_id;
    public $code;
    public $status;
    public $score;
    public $submitted_at;

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    public function getByQuestion($question_id)
    {
        $query = "SELECT s.*, st.name as studentName 
                  FROM " . $this->table_name . " s
                  JOIN students st ON s.student_id = st.id
                  WHERE s.question_id = :question_id 
                  ORDER BY s.submitted_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":question_id", $question_id);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getByStudent($student_id)
    {
        $query = "SELECT * FROM " . $this->table_name . " WHERE student_id = :student_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":student_id", $student_id);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create()
    {
        $query = "INSERT INTO " . $this->table_name . "
                (question_id, student_id, code, status, score)
                VALUES
                (:question_id, :student_id, :code, :status, :score)";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":question_id", $this->question_id);
        $stmt->bindParam(":student_id", $this->student_id);
        $stmt->bindParam(":code", $this->code);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":score", $this->score);

        return $stmt->execute();
    }
}
