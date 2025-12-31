<?php
/**
 * Quiz Model
 */

require_once __DIR__ . '/../config/database.php';

class Quiz
{
    private $conn;
    private $table_name = "quizzes";
    private $questions_table = "quiz_questions";
    private $attempts_table = "quiz_attempts";

    public $id;
    public $title;
    public $description;
    public $duration_minutes;
    public $total_marks;
    public $created_by_teacher_id;
    public $semester;

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    public function getAll()
    {
        $query = "SELECT q.*, t.name as teacher_name,
                  (SELECT COUNT(*) FROM " . $this->questions_table . " WHERE quiz_id = q.id) as question_count
                  FROM " . $this->table_name . " q
                  LEFT JOIN teachers t ON q.created_by_teacher_id = t.id
                  ORDER BY q.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getBySemester($semester)
    {
        $query = "SELECT q.*, t.name as teacher_name,
                  (SELECT COUNT(*) FROM " . $this->questions_table . " WHERE quiz_id = q.id) as question_count
                  FROM " . $this->table_name . " q
                  LEFT JOIN teachers t ON q.created_by_teacher_id = t.id
                  WHERE q.semester = :semester
                  ORDER BY q.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":semester", $semester);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function findById($id)
    {
        $query = "SELECT q.*, t.name as teacher_name
                  FROM " . $this->table_name . " q
                  LEFT JOIN teachers t ON q.created_by_teacher_id = t.id
                  WHERE q.id = :id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function create()
    {
        $query = "INSERT INTO " . $this->table_name . "
                  (title, description, duration_minutes, total_marks, created_by_teacher_id, semester)
                  VALUES (:title, :description, :duration_minutes, :total_marks, :created_by_teacher_id, :semester)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":duration_minutes", $this->duration_minutes);
        $stmt->bindParam(":total_marks", $this->total_marks);
        $stmt->bindParam(":created_by_teacher_id", $this->created_by_teacher_id);
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
                      duration_minutes = :duration_minutes,
                      total_marks = :total_marks,
                      semester = :semester
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":duration_minutes", $this->duration_minutes);
        $stmt->bindParam(":total_marks", $this->total_marks);
        $stmt->bindParam(":semester", $this->semester);
        $stmt->bindParam(":id", $this->id);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function delete()
    {
        // Delete questions first
        $query = "DELETE FROM " . $this->questions_table . " WHERE quiz_id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id);
        $stmt->execute();

        // Delete quiz
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id);
        return $stmt->execute();
    }

    public function getQuestions($quiz_id)
    {
        $query = "SELECT * FROM " . $this->questions_table . " WHERE quiz_id = :quiz_id ORDER BY id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":quiz_id", $quiz_id);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function addQuestion($quiz_id, $question, $options, $correct_answer, $marks)
    {
        $query = "INSERT INTO " . $this->questions_table . "
                  (quiz_id, question_text, options_json, correct_answer, marks, question_type)
                  VALUES (:quiz_id, :question, :options, :correct_answer, :marks, 'multiple_choice')";
        $stmt = $this->conn->prepare($query);

        $optionsJson = is_string($options) ? $options : json_encode($options);

        $stmt->bindParam(":quiz_id", $quiz_id);
        $stmt->bindParam(":question", $question);
        $stmt->bindParam(":options", $optionsJson);
        $stmt->bindParam(":correct_answer", $correct_answer);
        $stmt->bindParam(":marks", $marks);

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function addQuestions($quiz_id, $questions)
    {
        try {
            $this->conn->beginTransaction();
            $ids = [];

            $query = "INSERT INTO " . $this->questions_table . "
                      (quiz_id, question_text, options_json, correct_answer, marks, question_type)
                      VALUES (:quiz_id, :question, :options, :correct_answer, :marks, 'multiple_choice')";
            $stmt = $this->conn->prepare($query);

            foreach ($questions as $q) {
                $optionsJson = is_string($q['options']) ? $q['options'] : json_encode($q['options']);

                $stmt->bindValue(":quiz_id", $quiz_id);
                $stmt->bindValue(":question", $q['question']);
                $stmt->bindValue(":options", $optionsJson);
                $stmt->bindValue(":correct_answer", $q['correctAnswer']);
                $stmt->bindValue(":marks", $q['marks']);

                if ($stmt->execute()) {
                    $ids[] = $this->conn->lastInsertId();
                }
            }

            $this->conn->commit();
            return $ids;
        } catch (Exception $e) {
            $this->conn->rollBack();
            return false;
        }
    }

    public function submitAttempt($quiz_id, $student_id, $score, $answers)
    {
        $query = "INSERT INTO " . $this->attempts_table . "
                  (quiz_id, student_id, score, answers_json, submitted_at)
                  VALUES (:quiz_id, :student_id, :score, :answers, NOW())";
        $stmt = $this->conn->prepare($query);

        $answersJson = json_encode($answers);

        $stmt->bindParam(":quiz_id", $quiz_id);
        $stmt->bindParam(":student_id", $student_id);
        $stmt->bindParam(":score", $score);
        $stmt->bindParam(":answers", $answersJson);

        return $stmt->execute();
    }

    public function getStudentAttempts($student_id)
    {
        $query = "SELECT qa.*, q.title as quiz_title, q.total_marks as max_marks, q.duration_minutes
                  FROM " . $this->attempts_table . " qa
                  JOIN " . $this->table_name . " q ON qa.quiz_id = q.id
                  WHERE qa.student_id = :student_id
                  ORDER BY qa.submitted_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":student_id", $student_id);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getTeacherQuizAttempts($teacher_id)
    {
        $query = "SELECT qa.*, q.title as quiz_title, s.name as student_name, q.total_marks as max_marks
                  FROM " . $this->attempts_table . " qa
                  JOIN " . $this->table_name . " q ON qa.quiz_id = q.id
                  JOIN students s ON qa.student_id = s.id
                  WHERE q.created_by_teacher_id = :teacher_id
                  ORDER BY qa.submitted_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":teacher_id", $teacher_id);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function gradeQuiz($quiz_id, $student_answers)
    {
        $questions = $this->getQuestions($quiz_id);
        $totalScore = 0;
        $answers = (array) $student_answers;

        foreach ($questions as $index => $question) {
            // student_answers uses index-based keys from frontend
            if (isset($answers[$index])) {
                // correct_answer in DB is int (index of option)
                if (intval($answers[$index]) === intval($question['correct_answer'])) {
                    $totalScore += intval($question['marks']);
                }
            }
        }
        return $totalScore;
    }
    public function deleteQuestion($id)
    {
        error_log("Attempting to delete question with ID: " . $id);
        $query = "DELETE FROM " . $this->questions_table . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $result = $stmt->execute();
        if (!$result) {
            error_log("Delete failed: " . print_r($stmt->errorInfo(), true));
        }
        return $result;
    }
    public function updateQuestion($question_id, $question, $options, $correct_answer, $marks)
    {
        $query = "UPDATE " . $this->questions_table . "
                  SET question_text = :question, 
                      options_json = :options, 
                      correct_answer = :correct_answer, 
                      marks = :marks
                  WHERE id = :id";
        $stmt = $this->conn->prepare($query);

        $optionsJson = is_string($options) ? $options : json_encode($options);

        $stmt->bindParam(":id", $question_id);
        $stmt->bindParam(":question", $question);
        $stmt->bindParam(":options", $optionsJson);
        $stmt->bindParam(":correct_answer", $correct_answer);
        $stmt->bindParam(":marks", $marks);

        return $stmt->execute();
    }
}
