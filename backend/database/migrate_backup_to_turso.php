<?php
/**
 * Import Database from SQL Backup to Turso
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

echo "Starting database import from my_backup.sql to Turso...\n";

$backupFile = __DIR__ . '/../../my_backup.sql';
if (!file_exists($backupFile) || filesize($backupFile) === 0) {
    echo "ERROR: my_backup.sql is empty or does not exist at $backupFile.\n";
    echo "Please ensure the backup file is copied there first.\n";
    exit(1);
}

require_once __DIR__ . '/../config/database.php';
$database = new Database();
$turso = $database->getConnection();

try {
    // 1. Disable foreign keys during import
    $turso->exec("PRAGMA foreign_keys = OFF");

    // 2. Read full file content
    $sqlContent = file_get_contents($backupFile);
    
    // 3. Parse SQL into separate statements using string-aware splitting
    echo "Parsing SQL backup file...\n";
    $statements = [];
    $current = '';
    $inString = false;
    $stringChar = '';
    $len = strlen($sqlContent);
    
    for ($i = 0; $i < $len; $i++) {
        $char = $sqlContent[$i];
        
        // Handle escaped characters inside strings
        if ($char === '\\' && $i + 1 < $len) {
            $current .= $char . $sqlContent[$i + 1];
            $i++;
            continue;
        }
        
        // Track string open/close
        if (($char === "'" || $char === '"') && !$inString) {
            $inString = true;
            $stringChar = $char;
        } elseif ($char === $stringChar && $inString) {
            $inString = false;
        }
        
        $current .= $char;
        
        // Split on semicolon outside strings
        if ($char === ';' && !$inString) {
            $statements[] = trim($current);
            $current = '';
        }
    }
    if (trim($current) !== '') {
        $statements[] = trim($current);
    }

    echo "Found " . count($statements) . " SQL statements.\n";

    $clearedTables = [];
    $insertCount = 0;
    $successCount = 0;

    foreach ($statements as $stmt) {
        $stmt = trim($stmt);
        if (empty($stmt)) continue;

        // We only care about INSERT statements (case-insensitive)
        if (stripos($stmt, 'INSERT INTO') === 0) {
            // Extract table name
            if (preg_match('/INSERT\s+INTO\s+[`"]?(\w+)[`"]?/i', $stmt, $matches)) {
                $tableName = $matches[1];
                
                // Clear the table once before inserting new data
                if (!in_array($tableName, $clearedTables)) {
                    echo "Clearing table: $tableName...\n";
                    try {
                        $turso->exec("DELETE FROM $tableName");
                    } catch (Exception $e) {
                        echo "Warning: could not clear $tableName (it might not exist yet): " . $e->getMessage() . "\n";
                    }
                    $clearedTables[] = $tableName;
                }
                
                // Clean MySQL backticks -> SQLite double quotes or no quotes
                $cleanStmt = str_replace('`', '', $stmt);
                
                // Translate MySQL escaped quotes to SQLite standard (double single-quote '')
                // But only if we have escaped single quotes (\')
                $cleanStmt = str_replace("\\'", "''", $cleanStmt);
                $cleanStmt = str_replace('\\"', '"', $cleanStmt);
                
                try {
                    $insertCount++;
                    $turso->exec($cleanStmt);
                    $successCount++;
                } catch (Exception $e) {
                    echo "Failed to execute INSERT on $tableName: " . $e->getMessage() . "\n";
                    echo "Statement snippet: " . substr($cleanStmt, 0, 200) . "...\n";
                }
            }
        }
    }
    
    // Re-enable foreign keys
    $turso->exec("PRAGMA foreign_keys = ON");
    echo "\n🎉 Data import completed successfully!\n";
    echo "Total INSERT statements: $insertCount\n";
    echo "Successfully imported: $successCount\n";
    
} catch (Exception $e) {
    // Make sure we re-enable foreign keys on fail
    try {
        $turso->exec("PRAGMA foreign_keys = ON");
    } catch (Exception $ex) {}
    echo "\n❌ Import Failed: " . $e->getMessage() . "\n";
    exit(1);
}
