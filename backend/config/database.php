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
    /**
     * Get database connection
     */
    public function getConnection()
    {
        $this->conn = null;

        // Load configuration from environment variables or use defaults
        // This allows easy switching to Azure without changing code
        $db_host = getenv('DB_HOST') ?: $this->host;
        $db_port = getenv('DB_PORT') ?: $this->port;
        $db_name = getenv('DB_NAME') ?: $this->db_name;
        $db_user = getenv('DB_USER') ?: $this->username;
        $db_pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : $this->password;

        try {
            // Azure Database for MySQL requires SSL
            // If the host contains 'azure', we force SSL options
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ];

            // Check if we are connecting to Azure (simple heuristic or explicit env var)
            if (strpos($db_host, 'azure.com') !== false || getenv('DB_SSL') === 'true') {
                $item_ssl_ca = getenv('DB_SSL_CA');
                if ($item_ssl_ca) {
                    $options[PDO::MYSQL_ATTR_SSL_CA] = $item_ssl_ca;
                }
                $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false; // Disable verification for dev/easier setup if cert not present
            }

            $this->conn = new PDO(
                "mysql:host=" . $db_host . ";port=" . $db_port . ";dbname=" . $db_name,
                $db_user,
                $db_pass,
                $options
            );
            $this->conn->exec("set names utf8mb4");
        } catch (PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }

        return $this->conn;
    }
}
