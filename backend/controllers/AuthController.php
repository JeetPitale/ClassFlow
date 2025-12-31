<?php
/**
 * Authentication Controller
 * Handles login, logout, and user session with separate user tables
 */

require_once __DIR__ . '/../models/Student.php';
require_once __DIR__ . '/../models/Teacher.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/JWTHandler.php';

class AuthController
{
    /**
     * Login user (checks against appropriate table based on role)
     */
    public static function login()
    {
        // Get posted data
        $data = json_decode(file_get_contents("php://input"));

        // Validate input  
        if (!isset($data->email) || !isset($data->password) || !isset($data->role)) {
            Response::validationError([
                'email' => 'Email is required',
                'password' => 'Password is required',
                'role' => 'Role is required'
            ]);
        }

        $userData = null;
        $model = null;

        // Check user based on role
        try {
            switch ($data->role) {
                case 'admin':
                    $database = new Database();
                    $conn = $database->getConnection();
                    $stmt = $conn->prepare("SELECT * FROM admins WHERE email = :email LIMIT 1");
                    $stmt->bindParam(":email", $data->email);
                    $stmt->execute();
                    $userData = $stmt->fetch();
                    break;

                case 'teacher':
                    $model = new Teacher();
                    $userData = $model->findByEmail($data->email);
                    break;

                case 'student':
                    $model = new Student();
                    $userData = $model->findByEmail($data->email);
                    break;

                default:
                    Response::error('Invalid role', 400);
            }

            if (!$userData) {
                Response::error('Invalid credentials', 401);
            }

            // Verify password
            if (!password_verify($data->password, $userData['password_hash'])) {
                Response::error('Invalid credentials', 401);
            }

            // Generate JWT token
            $token = JWTHandler::generateToken(
                $userData['id'],
                $userData['email'],
                $data->role
            );

            // Remove password from response
            unset($userData['password_hash']);

            // Add role to user data
            $userData['role'] = $data->role;

            // Send response
            Response::success([
                'token' => $token,
                'user' => $userData
            ], 'Login successful');

        } catch (PDOException $e) {
            Response::error('Database connection error: ' . $e->getMessage(), 500);
        } catch (Exception $e) {
            Response::error('Login failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get current authenticated user
     */
    public static function me()
    {
        // Get auth token from header
        $headers = getallheaders();
        $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

        if (empty($authHeader)) {
            Response::unauthorized('No token provided');
        }

        // Extract token
        $token = str_replace('Bearer ', '', $authHeader);

        // Validate token
        $decoded = JWTHandler::validateToken($token);

        if (!$decoded) {
            Response::unauthorized('Invalid or expired token');
        }

        // Get user data based on role
        $userData = null;

        switch ($decoded['role']) {
            case 'admin':
                $database = new Database();
                $conn = $database->getConnection();
                $stmt = $conn->prepare("SELECT id, email, name, phone, dob, gender, address, profile_photo, created_at FROM admins WHERE id = :id LIMIT 1");
                $stmt->bindParam(":id", $decoded['user_id']);
                $stmt->execute();
                $userData = $stmt->fetch();
                break;

            case 'teacher':
                $teacher = new Teacher();
                $userData = $teacher->findById($decoded['user_id']);
                break;

            case 'student':
                $student = new Student();
                $userData = $student->findById($decoded['user_id']);
                break;
        }

        if (!$userData) {
            Response::notFound('User not found');
        }

        $userData['role'] = $decoded['role'];
        Response::success($userData);
    }

    /**
     * Logout (Frontend handles token removal)
     */
    public static function logout()
    {
        Response::success(null, 'Logged out successfully');
    }
}
