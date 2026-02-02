<?php

class RateLimiter
{
    private static $limit = 100; // Requests per minute
    private static $interval = 60; // Time window in seconds
    private static $storageDir;

    public static function handle()
    {
        // Skip rate limiting for OPTIONS requests (CORS preflight)
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            return;
        }

        self::$storageDir = sys_get_temp_dir() . '/classflow_rate_limit';

        if (!file_exists(self::$storageDir)) {
            mkdir(self::$storageDir, 0777, true);
        }

        $ip = self::getClientIp();
        $file = self::$storageDir . '/' . md5($ip) . '.json';

        $data = ['count' => 0, 'startTime' => time()];

        if (file_exists($file)) {
            $content = @file_get_contents($file);
            if ($content) {
                $decoded = json_decode($content, true);
                if (is_array($decoded)) {
                    $data = $decoded;
                }
            }
        }

        $currentTime = time();

        // Reset if window has passed
        if (!isset($data['startTime']) || $currentTime - $data['startTime'] > self::$interval) {
            $data['count'] = 0;
            $data['startTime'] = $currentTime;
        }

        $data['count']++;

        // Save immediately, suppress errors
        @file_put_contents($file, json_encode($data));

        if ($data['count'] > self::$limit) {
            self::abort();
        }
    }

    private static function getClientIp()
    {
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            return $_SERVER['HTTP_CLIENT_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            return $_SERVER['HTTP_X_FORWARDED_FOR'];
        } else {
            return $_SERVER['REMOTE_ADDR'];
        }
    }

    private static function abort()
    {
        header('HTTP/1.1 429 Too Many Requests');
        header('Content-Type: application/json');
        header('Retry-After: ' . self::$interval);
        echo json_encode([
            'status' => 'error',
            'message' => 'Too many requests. Please try again later.'
        ]);
        exit;
    }
}
