<?php
/**
 * Student Model
 * ClassFlow LMS Backend
 */

require_once __DIR__ . '/../config/database.php';

class Student
{
    private $conn;
    private $table_name = "students";

    public $id;
    public $email;
    public $password_hash;
    public $name;
    public $phone;
    public $dob;
    public $gender;
    public $address;
    public $enrollment_no;
    public $semester;
    public $department;
    public $profile_photo;

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    /**
     * Get all students
     */
    public function getAll()
    {
        $query = "SELECT id, email, name, phone, dob, gender, address, 
                         enrollment_no, semester, department, profile_photo, created_at
                  FROM " . $this->table_name . "
                  ORDER BY created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Get students by semester
     */
    public function getBySemester($semester)
    {
        $query = "SELECT id, email, name, phone, dob, gender, address,
                         enrollment_no, semester, department, profile_photo, created_at
                  FROM " . $this->table_name . "
                  WHERE semester = :semester
                  ORDER BY created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":semester", $semester);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Find student by ID
     */
    public function findById($id)
    {
        $query = "SELECT id, email, name, phone, dob, gender, address,
                         enrollment_no, semester, department, profile_photo, created_at
                  FROM " . $this->table_name . "
                  WHERE id = :id LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();

        return $stmt->fetch();
    }

    /**
     * Find student by email
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
     * Create new student
     */
    public function create()
    {
        $query = "INSERT INTO " . $this->table_name . "
                  (email, password_hash, name, phone, dob, gender, address, enrollment_no, semester, department)
                  VALUES
                  (:email, :password_hash, :name, :phone, :dob, :gender, :address, :enrollment_no, :semester, :department)";

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
        $stmt->bindParam(":enrollment_no", $this->enrollment_no);
        $stmt->bindParam(":semester", $this->semester);
        $stmt->bindParam(":department", $this->department);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    /**
     * Update student
     */
    public function update()
    {
        $password_set = !empty($this->password_hash);
        if ($password_set) {
            $this->password_hash = password_hash($this->password_hash, PASSWORD_BCRYPT);
        }

        $query = "UPDATE " . $this->table_name . "
                  SET name = :name, email = :email, phone = :phone, dob = :dob, 
                      gender = :gender, address = :address, enrollment_no = :enrollment_no,
                      semester = :semester, department = :department" .
            ($password_set ? ", password_hash = :password_hash" : "") . "
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
        $stmt->bindParam(":enrollment_no", $this->enrollment_no);
        $stmt->bindParam(":semester", $this->semester);
        $stmt->bindParam(":department", $this->department);

        if ($password_set) {
            $stmt->bindParam(":password_hash", $this->password_hash);
        }

        return $stmt->execute();
    }


    /**
     * Delete student
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
