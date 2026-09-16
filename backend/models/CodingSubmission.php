<?php
require_once __DIR__ . '/../config/database.php';

class CodingSubmission
{
    private $conn;
    private $table_name = "coding_submissions";
    private $last_error;

    public $id;
    public $question_id;
    public $student_id;
    public $code;
    public $status;
    public $score;
    public $language_id = 71;
    public $runtime;
    public $memory_used;
    public $testcases_passed = 0;
    public $total_testcases = 0;
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
        $query = "SELECT s.*, q.title as question_title 
                  FROM " . $this->table_name . " s
                  JOIN coding_questions q ON s.question_id = q.id
                  WHERE s.student_id = :student_id 
                  ORDER BY s.submitted_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":student_id", $student_id);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create()
    {
        $query = "INSERT INTO " . $this->table_name . "
                (question_id, student_id, code, status, score, language_id, runtime, memory_used, testcases_passed, total_testcases)
                VALUES
                (:question_id, :student_id, :code, :status, :score, :language_id, :runtime, :memory_used, :testcases_passed, :total_testcases)";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":question_id", $this->question_id);
        $stmt->bindParam(":student_id", $this->student_id);
        $stmt->bindParam(":code", $this->code);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":score", $this->score);
        $stmt->bindParam(":language_id", $this->language_id);
        $stmt->bindParam(":runtime", $this->runtime);
        $stmt->bindParam(":memory_used", $this->memory_used);
        $stmt->bindParam(":testcases_passed", $this->testcases_passed);
        $stmt->bindParam(":total_testcases", $this->total_testcases);

        if ($stmt->execute()) {
            return true;
        }
        $this->last_error = $stmt->errorInfo();
        return false;
    }

    public function getLastError() {
        return $this->last_error;
    }
}
