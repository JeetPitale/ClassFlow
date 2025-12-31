<?php
/**
 * Database Configuration
 * ClassFlow LMS Backend
 */

class Database
{
    private $host = "127.0.0.1";  // Use 127.0.0.1 instead of localhost on Mac
    private $port = "3306";
    private $db_name = "classflow_db";
    private $username = "root";
    private $password = "";  // Empty password for XAMPP/MAMP default
    private $conn;

    /**
     * Get database connection
     */
    public function getConnection()
    {
        $this->conn = null;

        // Use standard TCP connection first, it is more reliable across different setups (MAMP/XAMPP/Brew)
        $this->conn = new PDO(
            "mysql:host=" . $this->host . ";port=" . $this->port . ";dbname=" . $this->db_name,
            $this->username,
            $this->password
        );
        $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->conn->exec("set names utf8mb4");

        return $this->conn;
    }
}
