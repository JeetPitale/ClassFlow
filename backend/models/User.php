<?php
/**
 * User Model
 * ClassFlow LMS Backend
 */

require_once __DIR__ . '/../config/database.php';

class User
{
    private $conn;
    private $table_name = "users";

    // User properties
    public $id;
    public $email;
    public $password_hash;
    public $name;
    public $role;
    public $phone;
    public $dob;
    public $gender;
    public $address;
    public $enrollment_no;
    public $semester;
    public $profile_photo;

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    /**
     * Find user by email
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
     * Find user by ID
     */
    public function findById($id)
    {
        $query = "SELECT id, email, name, role, phone, dob, gender, address, 
                         enrollment_no, semester, profile_photo, created_at 
                  FROM " . $this->table_name . " WHERE id = :id LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();

        return $stmt->fetch();
    }

    /**
     * Verify password
     */
    public function verifyPassword($password, $hash)
    {
        return password_verify($password, $hash);
    }

    /**
     * Create new user
     */
    public function create()
    {
        $query = "INSERT INTO " . $this->table_name . "
                  (email, password_hash, name, role, phone, dob, gender, address, enrollment_no, semester)
                  VALUES
                  (:email, :password_hash, :name, :role, :phone, :dob, :gender, :address, :enrollment_no, :semester)";

        $stmt = $this->conn->prepare($query);

        // Hash password
        $this->password_hash = password_hash($this->password_hash, PASSWORD_BCRYPT);

        // Bind values
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":password_hash", $this->password_hash);
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":role", $this->role);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":dob", $this->dob);
        $stmt->bindParam(":gender", $this->gender);
        $stmt->bindParam(":address", $this->address);
        $stmt->bindParam(":enrollment_no", $this->enrollment_no);
        $stmt->bindParam(":semester", $this->semester);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    /**
     * Update user
     */
    public function update()
    {
        $query = "UPDATE " . $this->table_name . "
                  SET name = :name, phone = :phone, dob = :dob, gender = :gender,
                      address = :address, enrollment_no = :enrollment_no, semester = :semester
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":dob", $this->dob);
        $stmt->bindParam(":gender", $this->gender);
        $stmt->bindParam(":address", $this->address);
        $stmt->bindParam(":enrollment_no", $this->enrollment_no);
        $stmt->bindParam(":semester", $this->semester);

        return $stmt->execute();
    }

    /**
     * Delete user
     */
    public function delete()
    {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id);

        return $stmt->execute();
    }

    /**
     * Get all users by role
     */
    public function getAllByRole($role)
    {
        $query = "SELECT id, email, name, role, phone, dob, gender, address,
                         enrollment_no, semester, profile_photo, created_at
                  FROM " . $this->table_name . "
                  WHERE role = :role
                  ORDER BY created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":role", $role);
        $stmt->execute();

        return $stmt->fetchAll();
    }
}
