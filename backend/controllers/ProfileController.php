<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/JWTHandler.php';

class ProfileController
{
    private static function getUserIdAndRole()
    {
        $headers = getClassFlowHeaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $decoded = JWTHandler::validateToken($token);

        if (!$decoded) {
            Response::error('Unauthorized', 401);
            exit;
        }

        return $decoded;
    }

    public static function updateProfile()
    {
        $decoded = self::getUserIdAndRole();
        $userId = $decoded['user_id'];
        $role = $decoded['role'];

        $data = json_decode(file_get_contents("php://input"));

        // Handle Profile Photo (Base64)
        $profilePhotoUrl = null;
        if (!empty($data->profilePhoto)) {
            // Check if it's a new base64 image or existing URL
            if (strpos($data->profilePhoto, 'data:image') === 0) {
                $profilePhotoUrl = self::uploadBase64Image($data->profilePhoto, $userId, $role);
            }
        }

        $database = new Database();
        $db = $database->getConnection();

        try {
            // Update logic based on role
            $table = '';
            if ($role === 'admin')
                $table = 'admins';
            elseif ($role === 'teacher')
                $table = 'teachers';
            elseif ($role === 'student')
                $table = 'students';
            else {
                Response::error('Invalid role');
                return;
            }

            // Prepare query dynamically based on provided fields
            // Assuming only Name and Email for now as per UI
            // But preserving existing photo if not updated
            $query = "UPDATE $table SET name = :name, email = :email";
            $params = [
                ':name' => $data->fullName,
                ':email' => $data->email,
                ':id' => $userId
            ];

            if ($profilePhotoUrl) {
                $query .= ", profile_photo = :profile_photo";
                $params[':profile_photo'] = $profilePhotoUrl;
            }

            $query .= " WHERE id = :id";

            $stmt = $db->prepare($query);

            if ($stmt->execute($params)) {
                // Fetch updated user to return
                $stmt = $db->prepare("SELECT id, name, email, profile_photo FROM $table WHERE id = :id");
                $stmt->execute([':id' => $userId]);
                $updatedUser = $stmt->fetch(PDO::FETCH_ASSOC);
                $updatedUser['role'] = $role; // Add role back

                Response::success($updatedUser, 'Profile updated successfully');
            } else {
                Response::error('Failed to update profile');
            }

        } catch (PDOException $e) {
            error_log("Profile Update Error: " . $e->getMessage());
            Response::error('Database error: ' . $e->getMessage());
        }
    }

    public static function changePassword()
    {
        $decoded = self::getUserIdAndRole();
        $userId = $decoded['user_id'];
        $role = $decoded['role'];

        $data = json_decode(file_get_contents("php://input"));

        if (empty($data->currentPassword) || empty($data->newPassword)) {
            Response::error('Current and new password are required');
            return;
        }

        $database = new Database();
        $db = $database->getConnection();

        $table = match ($role) {
            'admin' => 'admins',
            'teacher' => 'teachers',
            'student' => 'students',
            default => null
        };

        if (!$table) {
            Response::error('Invalid role');
            return;
        }

        // Verify current password
        $stmt = $db->prepare("SELECT password_hash FROM $table WHERE id = :id");
        $stmt->execute([':id' => $userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || !password_verify($data->currentPassword, $user['password_hash'])) {
            Response::error('Incorrect current password', 400);
            return;
        }

        // Update password
        $newHash = password_hash($data->newPassword, PASSWORD_DEFAULT);
        $updateStmt = $db->prepare("UPDATE $table SET password_hash = :password_hash WHERE id = :id");

        if ($updateStmt->execute([':password_hash' => $newHash, ':id' => $userId])) {
            Response::success(null, 'Password changed successfully');
        } else {
            Response::error('Failed to update password');
        }
    }

    private static function uploadBase64Image($base64String, $userId, $role)
    {
        require_once __DIR__ . '/../utils/FileStorage.php';
        return FileStorage::saveBase64($base64String, 'profiles', $role . '_' . $userId);
    }
}
