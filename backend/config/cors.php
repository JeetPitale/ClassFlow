<?php
/**
 * CORS Configuration
 * Allow cross-origin requests from React frontend
 */

// Allow from any origin
header("Access-Control-Allow-Origin: *");

// Allow specific headers
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Allow specific methods
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS");

// Set content type to JSON
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight requests
// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit();
}
