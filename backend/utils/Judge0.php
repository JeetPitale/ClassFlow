<?php
class Judge0
{
    private static $baseUrl = 'https://judge0-ce.p.rapidapi.com';
    private static $host = 'judge0-ce.p.rapidapi.com';
    // Mocking an API key or relying on public instance for demo. 
    // In production, put this in .env
    private static $apiKey = 'YOUR_RAPIDAPI_KEY'; 

    public static function submitBatch($submissions)
    {
        // For local development without a real API key, we will mock the response.
        // A real implementation would make a POST to /submissions/batch?base64_encoded=true
        $results = [];
        foreach ($submissions as $sub) {
            $isCorrect = true; // Simple mock logic
            $token = bin2hex(random_bytes(16));
            $results[] = [
                'token' => $token,
                'status' => ['id' => 3, 'description' => 'Accepted'],
                'stdout' => base64_encode($sub['expected_output'] ?? 'Mock output'),
                'time' => 0.05,
                'memory' => 1280
            ];
        }
        return $results;
    }
}
