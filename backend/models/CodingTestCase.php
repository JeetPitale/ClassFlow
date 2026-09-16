<?php
require_once __DIR__ . '/../config/database.php';

class CodingTestCase
{
    private $conn;
    private $table_name = "coding_testcases";

    public $id;
    public $question_id;
    public $input_data;
    public $expected_output;
    public $is_hidden = 1;
    public $weight = 10;
    public $created_at;

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    public function getByQuestion($question_id, $include_hidden = true)
    {
        $query = "SELECT * FROM " . $this->table_name . " WHERE question_id = :question_id";
        if (!$include_hidden) {
            $query .= " AND is_hidden = 0";
        }
        $query .= " ORDER BY created_at ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":question_id", $question_id);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create()
    {
        $query = "INSERT INTO " . $this->table_name . "
                (question_id, input_data, expected_output, is_hidden, weight)
                VALUES
                (:question_id, :input_data, :expected_output, :is_hidden, :weight)";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":question_id", $this->question_id);
        $stmt->bindParam(":input_data", $this->input_data);
        $stmt->bindParam(":expected_output", $this->expected_output);
        $stmt->bindParam(":is_hidden", $this->is_hidden);
        $stmt->bindParam(":weight", $this->weight);

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
