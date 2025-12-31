<?php
/**
 * Assignment Model
 */

require_once __DIR__ . '/../config/database.php';

class Assignment
{
    private $conn;
    private $table_name = "assignments";
    private $submissions_table = "assignment_submissions";

    public $id;
    public $title;
    public $description;
    public $due_date;
    public $total_marks;
    public $created_by_teacher_id;
    public $semester;

    public $attachment_path;

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    public function getAll()
    {
        $query = "SELECT a.*, t.name as teacher_name
                  FROM " . $this->table_name . " a
                  LEFT JOIN teachers t ON a.created_by_teacher_id = t.id
                  ORDER BY a.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getBySemester($semester)
    {
        $query = "SELECT a.*, t.name as teacher_name
                  FROM " . $this->table_name . " a
                  LEFT JOIN teachers t ON a.created_by_teacher_id = t.id
                  WHERE a.semester = :semester
                  ORDER BY a.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":semester", $semester);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function findById($id)
    {
        $query = "SELECT a.*, t.name as teacher_name
                  FROM " . $this->table_name . " a
                  LEFT JOIN teachers t ON a.created_by_teacher_id = t.id
                  WHERE a.id = :id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function create()
    {
        $query = "INSERT INTO " . $this->table_name . "
                  (title, description, due_date, total_marks, created_by_teacher_id, semester, attachment_path)
                  VALUES (:title, :description, :due_date, :total_marks, :created_by_teacher_id, :semester, :attachment_path)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":due_date", $this->due_date);
        $stmt->bindParam(":total_marks", $this->total_marks);
        $stmt->bindParam(":created_by_teacher_id", $this->created_by_teacher_id);
        $stmt->bindParam(":semester", $this->semester);
        $stmt->bindParam(":attachment_path", $this->attachment_path);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    public function update()
    {
        $query = "UPDATE " . $this->table_name . "
                  SET title = :title, description = :description, due_date = :due_date, 
                      total_marks = :total_marks, semester = :semester, attachment_path = :attachment_path
                  WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":due_date", $this->due_date);
        $stmt->bindParam(":total_marks", $this->total_marks);
        $stmt->bindParam(":semester", $this->semester);
        $stmt->bindParam(":attachment_path", $this->attachment_path);
        return $stmt->execute();
    }

    public function delete()
    {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id);
        return $stmt->execute();
    }

    public function getSubmissions($assignment_id)
    {
        $query = "SELECT s.*, st.name as student_name, st.enrollment_no
                  FROM " . $this->submissions_table . " s
                  LEFT JOIN students st ON s.student_id = st.id
                  WHERE s.assignment_id = :assignment_id
                  ORDER BY s.submitted_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":assignment_id", $assignment_id);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function submitAssignment($assignment_id, $student_id, $submission_text, $file_path = null)
    {
        $query = "INSERT INTO " . $this->submissions_table . "
                  (assignment_id, student_id, submission_text, file_url, submitted_at)
                  VALUES (:assignment_id, :student_id, :submission_text, :file_path, NOW())";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":assignment_id", $assignment_id);
        $stmt->bindParam(":student_id", $student_id);
        $stmt->bindParam(":submission_text", $submission_text);
        $stmt->bindParam(":file_path", $file_path);
        return $stmt->execute();
    }

    public function getStudentSubmissions($student_id)
    {
        $query = "SELECT s.*, 
                  a.title as assignment_title, 
                  a.total_marks as max_marks,
                  a.due_date
                  FROM " . $this->submissions_table . " s
                  JOIN " . $this->table_name . " a ON s.assignment_id = a.id
                  WHERE s.student_id = :student_id
                  ORDER BY s.submitted_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":student_id", $student_id);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function findStudentSubmission($assignment_id, $student_id)
    {
        $query = "SELECT * FROM " . $this->submissions_table . "
                  WHERE assignment_id = :assignment_id AND student_id = :student_id
                  LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":assignment_id", $assignment_id);
        $stmt->bindParam(":student_id", $student_id);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function gradeSubmission($submission_id, $marks, $feedback)
    {
        $query = "UPDATE " . $this->submissions_table . "
                  SET marks_obtained = :marks, feedback = :feedback, status = 'graded', graded_at = NOW()
                  WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $submission_id);
        $stmt->bindParam(":marks", $marks);
        $stmt->bindParam(":feedback", $feedback);
        return $stmt->execute();
    }
    public function getSubmission($submission_id)
    {
        $query = "SELECT s.*, a.title as assignment_title 
                  FROM " . $this->submissions_table . " s
                  JOIN " . $this->table_name . " a ON s.assignment_id = a.id
                  WHERE s.id = :id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $submission_id);
        $stmt->execute();
        return $stmt->fetch();
    }
}
