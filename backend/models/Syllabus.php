<?php
/**
 * Syllabus Model
 */

require_once __DIR__ . '/../config/database.php';

class Syllabus
{
    private $conn;
    private $topics_table = "syllabus_topics";
    private $subtopics_table = "syllabus_subtopics";

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    // Get all syllabus data for a teacher
    public function getFullSyllabus($teacher_id)
    {
        // Fetch topics
        $query = "SELECT * FROM " . $this->topics_table . " WHERE teacher_id = :teacher_id ORDER BY created_at ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":teacher_id", $teacher_id);
        $stmt->execute();
        $topics = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch subtopics
        // Optimization: Fetch all subtopics for these topics in one go if possible, or iterate.
        // For simplicity, let's fetch all subtopics for this teacher's topics.
        // Suboptimized but clear:
        $topicIds = array_column($topics, 'id');
        if (empty($topicIds)) {
            return ['topics' => [], 'subtopics' => []];
        }

        $placeholders = implode(',', array_fill(0, count($topicIds), '?'));
        $query = "SELECT * FROM " . $this->subtopics_table . " WHERE parent_id IN ($placeholders) ORDER BY id ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute($topicIds);
        $subtopics = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'topics' => $topics,
            'subtopics' => $subtopics
        ];
    }

    // Topic CRUD
    public function createTopic($teacher_id, $title, $description, $weeks)
    {
        $query = "INSERT INTO " . $this->topics_table . " (teacher_id, title, description, weeks) VALUES (:teacher_id, :title, :description, :weeks)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":teacher_id", $teacher_id);
        $stmt->bindParam(":title", $title);
        $stmt->bindParam(":description", $description);
        $stmt->bindParam(":weeks", $weeks);

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function updateTopic($id, $title, $description, $weeks)
    {
        $query = "UPDATE " . $this->topics_table . " SET title = :title, description = :description, weeks = :weeks WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":title", $title);
        $stmt->bindParam(":description", $description);
        $stmt->bindParam(":weeks", $weeks);
        $stmt->bindParam(":id", $id);
        return $stmt->execute();
    }

    public function deleteTopic($id)
    {
        $query = "DELETE FROM " . $this->topics_table . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        return $stmt->execute();
    }

    public function toggleTopicComplete($id)
    {
        $query = "UPDATE " . $this->topics_table . " SET completed = NOT completed WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        return $stmt->execute();
    }

    // Subtopic CRUD
    public function createSubtopic($parent_id, $title, $description)
    {
        $query = "INSERT INTO " . $this->subtopics_table . " (parent_id, title, description) VALUES (:parent_id, :title, :description)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":parent_id", $parent_id);
        $stmt->bindParam(":title", $title);
        $stmt->bindParam(":description", $description);

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function updateSubtopic($id, $title, $description, $parent_id)
    {
        $query = "UPDATE " . $this->subtopics_table . " SET title = :title, description = :description, parent_id = :parent_id WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":title", $title);
        $stmt->bindParam(":description", $description);
        $stmt->bindParam(":parent_id", $parent_id);
        $stmt->bindParam(":id", $id);
        return $stmt->execute();
    }

    public function deleteSubtopic($id)
    {
        $query = "DELETE FROM " . $this->subtopics_table . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        return $stmt->execute();
    }

    public function toggleSubtopicComplete($id)
    {
        $query = "UPDATE " . $this->subtopics_table . " SET completed = NOT completed WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        return $stmt->execute();
    }

    // Admin Aggregation
    public function getAllTeachersProgress()
    {
        // Get all teachers
        $query = "SELECT id, name, email FROM teachers";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $results = [];

        foreach ($teachers as $teacher) {
            // Count total topics and completed topics
            $query = "SELECT COUNT(*) as total, SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed FROM " . $this->topics_table . " WHERE teacher_id = :teacher_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":teacher_id", $teacher['id']);
            $stmt->execute();
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);

            // Fetch last update time (optional, but good for UI)
            $query = "SELECT MAX(created_at) as last_updated FROM " . $this->topics_table . " WHERE teacher_id = :teacher_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":teacher_id", $teacher['id']);
            $stmt->execute();
            $dateStats = $stmt->fetch(PDO::FETCH_ASSOC);


            $results[] = [
                'teacher' => $teacher,
                'total_topics' => $stats['total'] ?? 0,
                'completed_topics' => $stats['completed'] ?? 0,
                'progress_percentage' => ($stats['total'] > 0) ? round(($stats['completed'] / $stats['total']) * 100) : 0,
                'last_updated' => $dateStats['last_updated'] ?? null
            ];
        }

        return $results;
    }
}
?>