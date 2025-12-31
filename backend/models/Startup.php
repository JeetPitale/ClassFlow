<?php

class Startup
{
    private $conn;
    private $table_name = "startups";

    public $id;
    public $student_id;
    public $title;
    public $category;
    public $brief_description;
    public $problem_statement;
    public $solution_overview;
    public $team_size;
    public $target_market;
    public $business_model;
    public $funding_required;
    public $current_stage;
    public $tags;
    public $attachments;
    public $status;
    public $admin_remarks;
    public $created_at;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function create()
    {
        $query = "INSERT INTO " . $this->table_name . "
                SET
                    student_id = :student_id,
                    title = :title,
                    category = :category,
                    brief_description = :brief_description,
                    problem_statement = :problem_statement,
                    solution_overview = :solution_overview,
                    team_size = :team_size,
                    target_market = :target_market,
                    business_model = :business_model,
                    funding_required = :funding_required,
                    current_stage = :current_stage,
                    tags = :tags,
                    attachments = :attachments,
                    status = 'pending'";

        $stmt = $this->conn->prepare($query);

        // Sanitize and bind
        $this->student_id = htmlspecialchars(strip_tags($this->student_id));
        $this->title = htmlspecialchars(strip_tags($this->title));
        $this->category = htmlspecialchars(strip_tags($this->category));
        $this->brief_description = htmlspecialchars(strip_tags($this->brief_description));
        $this->problem_statement = htmlspecialchars(strip_tags($this->problem_statement));
        $this->solution_overview = htmlspecialchars(strip_tags($this->solution_overview));
        $this->team_size = htmlspecialchars(strip_tags($this->team_size));
        $this->target_market = htmlspecialchars(strip_tags($this->target_market));
        $this->business_model = htmlspecialchars(strip_tags($this->business_model));
        $this->funding_required = htmlspecialchars(strip_tags($this->funding_required));
        $this->current_stage = htmlspecialchars(strip_tags($this->current_stage));
        $this->tags = htmlspecialchars(strip_tags($this->tags));
        $this->attachments = htmlspecialchars(strip_tags($this->attachments));

        $stmt->bindParam(":student_id", $this->student_id);
        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":category", $this->category);
        $stmt->bindParam(":brief_description", $this->brief_description);
        $stmt->bindParam(":problem_statement", $this->problem_statement);
        $stmt->bindParam(":solution_overview", $this->solution_overview);
        $stmt->bindParam(":team_size", $this->team_size);
        $stmt->bindParam(":target_market", $this->target_market);
        $stmt->bindParam(":business_model", $this->business_model);
        $stmt->bindParam(":funding_required", $this->funding_required);
        $stmt->bindParam(":current_stage", $this->current_stage);
        $stmt->bindParam(":tags", $this->tags);
        $stmt->bindParam(":attachments", $this->attachments);

        if ($stmt->execute()) {
            return true;
        }

        return false;
    }

    public function getByStudentId($student_id)
    {
        $query = "SELECT s.*, st.name as student_name 
                  FROM " . $this->table_name . " s
                  JOIN students st ON s.student_id = st.id
                  WHERE s.student_id = ?
                  ORDER BY s.created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $student_id);
        $stmt->execute();

        return $stmt;
    }

    public function getAll()
    {
        $query = "SELECT s.*, st.name as student_name 
                  FROM " . $this->table_name . " s
                  JOIN students st ON s.student_id = st.id
                  ORDER BY s.created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt;
    }

    public function updateStatus()
    {
        $query = "UPDATE " . $this->table_name . "
                  SET
                    status = :status,
                    admin_remarks = :admin_remarks
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        $this->status = htmlspecialchars(strip_tags($this->status));
        $this->admin_remarks = htmlspecialchars(strip_tags($this->admin_remarks));
        $this->id = htmlspecialchars(strip_tags($this->id));

        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":admin_remarks", $this->admin_remarks);
        $stmt->bindParam(":id", $this->id);

        if ($stmt->execute()) {
            return true;
        }

        return false;
    }

    public function findById($id)
    {
        $query = "SELECT s.*, st.name as student_name 
                  FROM " . $this->table_name . " s
                  JOIN students st ON s.student_id = st.id
                  WHERE s.id = ?
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $id);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
