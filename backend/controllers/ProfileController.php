<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/JWTHandler.php';

class ProfileController
{
    private static function getUserIdAndRole()
    {
        $headers = getallheaders();
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
        // uploads directory
        $targetDir = __DIR__ . '/../../uploads/profiles/';
        if (!file_exists($targetDir)) {
            mkdir($targetDir, 0777, true);
        }

        // Extract image data
        $image_parts = explode(";base64,", $base64String);
        $image_type_aux = explode("image/", $image_parts[0]);
        $image_type = $image_type_aux[1];
        $image_base64 = base64_decode($image_parts[1]);

        // Generate filename
        $fileName = $role . '_' . $userId . '_' . time() . '.' . $image_type;
        $file = $targetDir . $fileName;

        file_put_contents($file, $image_base64);

        // Return relative URL for storage
        // Assuming uploads is visible to public or served via PHP
        // Actually, simple PHP serving needs a way to access it. 
        // For 'php -S', 'uploads' folder in root is accessible if router script allows or direct file access.
        // My root is 'backend/'. 'uploads' is '../uploads'?
        // The server is at 'backend/index.php'.
        // If I serve from 'backend/', the uploads folder is typically outside 'backend' in my structure? 
        // Filesystem: `/Users/jeetpitale/ClassFlow/crest-edu-main/backend/controllers`
        // My code puts it in `../../uploads/profiles/`. That is `crest-edu-main/uploads/profiles/`.
        // If serving from `crest-edu-main/backend`, `../uploads` is not web-accessible directly if DocumentRoot is `backend`.
        // But the user runs `php -S localhost:8000 -t backend/`.
        // So `http://localhost:8000/` maps to `backend/`.
        // `backend` folder contains `index.php`.
        // `uploads` is OUTSIDE `backend`.
        // So `http://localhost:8000/../uploads` is unreachable.
        // I should move `uploads` INSIDE `backend/uploads` OR serve from root.

        // I'll put uploads in `backend/uploads/profiles/`.
        $targetDir = __DIR__ . '/../uploads/profiles/';
        if (!file_exists($targetDir)) {
            mkdir($targetDir, 0777, true);
        }
        $file = $targetDir . $fileName;
        file_put_contents($file, $image_base64);

        return '/uploads/profiles/' . $fileName;
        // NOTE: Frontend connecting to `http://localhost:8000/uploads/profiles/...` will works if `index.php` handles static files or `php -S` does.
        // `php -S` handles static files if they exist.
    }
}
