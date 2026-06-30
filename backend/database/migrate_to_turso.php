<?php
/**
 * Turso Database Migration Script
 * Converts MySQL schema to SQLite/libSQL and applies it via HTTP API
 */

// Load .env
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        putenv(trim($name) . '=' . trim($value));
    }
}

$db_url = getenv('TURSO_DB_URL') ?: 'libsql://database-rose-mountain-vercel-icfg-oi3nf3jvh2rsjghg56ah9nsp.aws-us-east-1.turso.io';
$db_token = getenv('TURSO_AUTH_TOKEN');

if (empty($db_token)) {
    echo "ERROR: TURSO_AUTH_TOKEN is not set in backend/.env. Please configure it first.\n";
    exit(1);
}

$http_url = str_replace('libsql://', 'https://', $db_url);
echo "Connecting to Turso: {$http_url}\n";

// Helper to execute a query on Turso
function executeQuery($url, $token, $sql, $baton = null) {
    $request = [
        'type' => 'execute',
        'stmt' => ['sql' => $sql]
    ];
    $payload = [
        'requests' => [$request]
    ];
    if ($baton) {
        $payload['baton'] = $baton;
    } else {
        $payload['requests'][] = ['type' => 'close'];
    }

    $ch = curl_init($url . '/v2/pipeline');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        return ['success' => false, 'error' => "HTTP $httpCode: $response"];
    }

    $resData = json_decode($response, true);
    if (isset($resData['results'][0]['type']) && $resData['results'][0]['type'] === 'error') {
        return ['success' => false, 'error' => $resData['results'][0]['error']['message']];
    }

    return [
        'success' => true, 
        'baton' => isset($resData['baton']) ? $resData['baton'] : null,
        'result' => isset($resData['results'][0]['result']) ? $resData['results'][0]['result'] : null
    ];
}

// Convert MySQL SQL dialect to SQLite SQL dialect
function convertMySQLToSQLite($sql) {
    $sql = preg_replace('/^\s*--.*$/m', '', $sql);
    
    $statements = [];
    $current = '';
    
    $inString = false;
    $stringChar = '';
    $len = strlen($sql);
    
    for ($i = 0; $i < $len; $i++) {
        $char = $sql[$i];
        
        if ($char === '\\' && $i + 1 < $len) {
            $current .= $char . $sql[$i + 1];
            $i++;
            continue;
        }
        
        if (($char === "'" || $char === '"') && !$inString) {
            $inString = true;
            $stringChar = $char;
        } elseif ($char === $stringChar && $inString) {
            $inString = false;
        }
        
        $current .= $char;
        
        if ($char === ';' && !$inString) {
            $statements[] = trim($current);
            $current = '';
        }
    }
    
    if (trim($current) !== '') {
        $statements[] = trim($current);
    }

    $converted = [];
    
    foreach ($statements as $stmt) {
        if (empty($stmt)) continue;
        
        if (stripos($stmt, 'DROP TABLE') === 0) {
            $converted[] = $stmt;
            continue;
        }
        
        if (stripos($stmt, 'CREATE TABLE') === 0) {
            preg_match('/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i', $stmt, $m);
            $tableName = isset($m[1]) ? $m[1] : '';
            
            $stmt = preg_replace('/\)\s*ENGINE\s*=\s*\w+(?:\s+DEFAULT\s+CHARSET\s*=\s*\w+)?(?:\s+COLLATE\s*=\s*[\w_]+)?\s*;/i', ');', $stmt);
            
            $stmt = preg_replace('/INT\s+PRIMARY\s+KEY\s+AUTO_INCREMENT/i', 'INTEGER PRIMARY KEY AUTOINCREMENT', $stmt);
            
            $stmt = preg_replace('/ENUM\([^)]+\)/i', 'TEXT', $stmt);
            
            $stmt = preg_replace('/ON\s+UPDATE\s+CURRENT_TIMESTAMP/i', '', $stmt);
            
            $lines = explode("\n", $stmt);
            $newLines = [];
            
            foreach ($lines as $line) {
                $trimmed = trim($line);
                
                if (preg_match('/^\s*(?:INDEX|KEY)\s+(\w+)\s*\(([^)]+)\)/i', $trimmed, $im)) {
                    $idxName = $im[1];
                    $idxCols = $im[2];
                    $converted[] = "CREATE INDEX IF NOT EXISTS {$idxName} ON {$tableName} ({$idxCols});";
                    continue;
                }
                
                if (preg_match('/^\s*UNIQUE\s+(?:KEY\s+)?\w+\s*\(([^)]+)\)/i', $trimmed)) {
                    $line = preg_replace('/UNIQUE\s+(?:KEY\s+)?\w+\s*\(([^)]+)\)/i', 'UNIQUE (\1)', $line);
                }
                
                $newLines[] = $line;
            }
            
            $stmt = implode("\n", $newLines);
            $stmt = preg_replace('/,\s*(\r?\n\s*\)\s*;)/i', '\1', $stmt);
            
            $converted[] = $stmt;
        } else {
            $stmt = preg_replace('/NOW\(\)/i', 'CURRENT_TIMESTAMP', $stmt);
            $converted[] = $stmt;
        }
    }
    
    return $converted;
}

// 1. Read files
$schemaSql = file_get_contents(__DIR__ . '/schema.sql');
$notificationsSql = file_get_contents(__DIR__ . '/create_notifications.sql');
$migrationsSql = file_get_contents(__DIR__ . '/../migrations/add_attachment_column.sql');

// 2. Convert schemas
echo "Converting schemas to SQLite/libSQL...\n";
$schemaStatements = convertMySQLToSQLite($schemaSql);
$notificationStatements = convertMySQLToSQLite($notificationsSql);

$migrationStatements = [];
if (!empty($migrationsSql)) {
    $cleanMig = preg_replace('/AFTER\s+\w+/i', '', $migrationsSql);
    $migrationStatements = convertMySQLToSQLite($cleanMig);
}

$allStatements = array_merge(
    $schemaStatements, 
    $notificationStatements,
    $migrationStatements
);

echo "Total converted SQL statements: " . count($allStatements) . "\n";

// 3. Execute on Turso
$successCount = 0;
$failCount = 0;

foreach ($allStatements as $stmt) {
    $stmt = trim($stmt);
    if (empty($stmt)) continue;
    
    echo "\nRunning: " . substr($stmt, 0, 100) . (strlen($stmt) > 100 ? "..." : "") . "\n";
    
    $res = executeQuery($http_url, $db_token, $stmt);
    if ($res['success']) {
        echo "SUCCESS\n";
        $successCount++;
    } else {
        if (stripos($stmt, 'DROP TABLE') === 0) {
            echo "SKIPPED (Drop failed, table probably does not exist: {$res['error']})\n";
        } else {
            echo "FAILED: {$res['error']}\n";
            $failCount++;
        }
    }
}

echo "\nMigration finished!\n";
echo "Successfully executed: {$successCount} statements.\n";
echo "Failed: {$failCount} statements.\n";

if ($failCount > 0) {
    exit(1);
} else {
    exit(0);
}
