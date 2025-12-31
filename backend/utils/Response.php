<?php
/**
 * Response Utility
 * Standardized JSON responses
 */

class Response
{
    /**
     * Send success response
     */
    public static function success($data = null, $message = "Success", $statusCode = 200)
    {
        http_response_code($statusCode);
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data
        ]);
        exit();
    }

    /**
     * Send error response
     */
    public static function error($message = "Error", $statusCode = 400, $errors = null)
    {
        http_response_code($statusCode);
        echo json_encode([
            'success' => false,
            'message' => $message,
            'errors' => $errors
        ]);
        exit();
    }

    /**
     * Send unauthorized response
     */
    public static function unauthorized($message = "Unauthorized")
    {
        self::error($message, 401);
    }

    /**
     * Send forbidden response
     */
    public static function forbidden($message = "Forbidden")
    {
        self::error($message, 403);
    }

    /**
     * Send not found response
     */
    public static function notFound($message = "Not found")
    {
        self::error($message, 404);
    }

    /**
     * Send validation error response
     */
    public static function validationError($errors, $message = "Validation failed")
    {
        self::error($message, 422, $errors);
    }
}
