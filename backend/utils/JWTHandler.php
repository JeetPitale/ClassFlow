<?php
/**
 * JWT Handler
 * Token generation and validation
 */

class JWTHandler
{
    private static $secret_key = "your-secret-key-change-this-in-production";
    private static $algorithm = 'HS256';

    /**
     * Generate JWT token
     */
    public static function generateToken($userId, $email, $role)
    {
        $issuedAt = time();
        $expirationTime = $issuedAt + (60 * 60 * 24); // 24 hours

        $payload = [
            'iat' => $issuedAt,
            'exp' => $expirationTime,
            'user_id' => $userId,
            'email' => $email,
            'role' => $role
        ];

        return self::encode($payload);
    }

    /**
     * Validate and decode JWT token
     */
    public static function validateToken($token)
    {
        try {
            $decoded = self::decode($token);

            // Check if token is expired
            if ($decoded['exp'] < time()) {
                return false;
            }

            return $decoded;
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Encode payload to JWT
     */
    private static function encode($payload)
    {
        $header = json_encode(['typ' => 'JWT', 'alg' => self::$algorithm]);

        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode(json_encode($payload));

        $signature = hash_hmac(
            'sha256',
            $base64UrlHeader . "." . $base64UrlPayload,
            self::$secret_key,
            true
        );
        $base64UrlSignature = self::base64UrlEncode($signature);

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    /**
     * Decode JWT token
     */
    private static function decode($jwt)
    {
        $tokenParts = explode('.', $jwt);

        if (count($tokenParts) !== 3) {
            throw new Exception('Invalid token format');
        }

        $header = base64_decode($tokenParts[0]);
        $payload = base64_decode($tokenParts[1]);
        $signatureProvided = $tokenParts[2];

        // Verify signature
        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode($payload);
        $signature = hash_hmac(
            'sha256',
            $base64UrlHeader . "." . $base64UrlPayload,
            self::$secret_key,
            true
        );
        $base64UrlSignature = self::base64UrlEncode($signature);

        if ($base64UrlSignature !== $signatureProvided) {
            throw new Exception('Invalid signature');
        }

        return json_decode($payload, true);
    }

    /**
     * Base64 URL encode
     */
    private static function base64UrlEncode($data)
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
