<?php
/**
 * Teacher Model
 * ClassFlow LMS Backend
 */

require_once __DIR__ . '/../config/database.php';

class Teacher
{
    private $conn;
    private $table_name = "teachers";

    public $id;
    public $email;
    public $password_hash;
    public $name;
    public $phone;
    public $dob;
    public $gender;
    public $address;
    public $subject_specialization;
    public $qualification;
    public $experience_years;
    public $profile_photo;

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    /**
     * Get all teachers
     */
    public function getAll()
    {
        $query = "SELECT id, email, name, phone, dob, gender, address,
                         subject_specialization, qualification, experience_years,
                         profile_photo, created_at
                  FROM " . $this->table_name . "
                  ORDER BY created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Find teacher by ID
     */
    public function findById($id)
    {
        $query = "SELECT id, email, name, phone, dob, gender, address,
                         subject_specialization, qualification, experience_years,
                         profile_photo, created_at
                  FROM " . $this->table_name . "
                  WHERE id = :id LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();

        return $stmt->fetch();
    }

    /**
     * Find teacher by email
     */
    public function findByEmail($email)
    {
        $query = "SELECT * FROM " . $this->table_name . " WHERE email = :email LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $email);
        $stmt->execute();

        return $stmt->fetch();
    }

    /**
     * Create new teacher
     */
    public function create()
    {
        $query = "INSERT INTO " . $this->table_name . "
                  (email, password_hash, name, phone, dob, gender, address,
                   subject_specialization, qualification, experience_years)
                  VALUES
                  (:email, :password_hash, :name, :phone, :dob, :gender, :address,
                   :subject_specialization, :qualification, :experience_years)";

        $stmt = $this->conn->prepare($query);

        // Hash password
        $this->password_hash = password_hash($this->password_hash, PASSWORD_BCRYPT);

        // Bind values - convert empty strings to NULL for dates
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":password_hash", $this->password_hash);
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":phone", $this->phone);
        $dob = empty($this->dob) ? null : $this->dob;
        $stmt->bindParam(":dob", $dob);
        $stmt->bindParam(":gender", $this->gender);
        $stmt->bindParam(":address", $this->address);
        $stmt->bindParam(":subject_specialization", $this->subject_specialization);
        $stmt->bindParam(":qualification", $this->qualification);
        $stmt->bindParam(":experience_years", $this->experience_years);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    /**
     * Update teacher
     */
    public function update()
    {
        $query = "UPDATE " . $this->table_name . "
                  SET name = :name, email = :email, phone = :phone, dob = :dob,
                      gender = :gender, address = :address,
                      subject_specialization = :subject_specialization,
                      qualification = :qualification,
                      experience_years = :experience_years
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":phone", $this->phone);
        $dob = empty($this->dob) ? null : $this->dob;
        $stmt->bindParam(":dob", $dob);
        $stmt->bindParam(":gender", $this->gender);
        $stmt->bindParam(":address", $this->address);
        $stmt->bindParam(":subject_specialization", $this->subject_specialization);
        $stmt->bindParam(":qualification", $this->qualification);
        $stmt->bindParam(":experience_years", $this->experience_years);

        return $stmt->execute();
    }

    /**
     * Delete teacher
     */
    public function delete()
    {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id);

        return $stmt->execute();
    }

    /**
     * Verify password
     */
    public function verifyPassword($password, $hash)
    {
        return password_verify($password, $hash);
    }
}
