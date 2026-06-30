<?php
/**
 * Database Configuration
 * ClassFlow LMS Backend - Turso (libSQL) Version
 */

if (!class_exists('Database')) {
    class LibSQLPDOStatement
    {
        private $db;
        private $sql;
        private $binds = [];
        private $resultRows = [];
        private $resultCols = [];
        private $currentRowIndex = 0;
        private $affectedRows = 0;

        public function __construct($db, $sql)
        {
            $this->db = $db;
            $this->sql = $sql;
        }

        public function bindParam($parameter, &$variable, $data_type = PDO::PARAM_STR, $length = null, $driver_options = null)
        {
            $this->binds[$parameter] = &$variable;
            return true;
        }

        public function bindValue($parameter, $value, $data_type = PDO::PARAM_STR)
        {
            $this->binds[$parameter] = $value;
            return true;
        }

        public function execute($input_parameters = null)
        {
            $this->currentRowIndex = 0;
            $this->resultRows = [];
            $this->resultCols = [];

            $params = $this->binds;
            if (is_array($input_parameters)) {
                foreach ($input_parameters as $key => $val) {
                    $params[$key] = $val;
                }
            }

            // Translate MySQL query dialect to SQLite query dialect
            $translatedSql = $this->db->translateSql($this->sql);

            $namedArgs = [];
            $args = [];

            foreach ($params as $name => $val) {
                $type = 'text';
                if (is_int($val)) {
                    $type = 'integer';
                } elseif (is_float($val)) {
                    $type = 'float';
                } elseif (is_null($val)) {
                    $type = 'null';
                }

                $cleanName = ltrim($name, ':');

                if (is_numeric($name)) {
                    $args[] = ['type' => $type, 'value' => (string)$val];
                } else {
                    $namedArgs[] = [
                        'name' => $cleanName,
                        'value' => ['type' => $type, 'value' => $val !== null ? (string)$val : null]
                    ];
                }
            }

            $stmtObj = [
                'sql' => $translatedSql
            ];
            if (!empty($namedArgs)) {
                $stmtObj['named_args'] = $namedArgs;
            }
            if (!empty($args)) {
                $stmtObj['args'] = $args;
            }

            $response = $this->db->executeStatement($stmtObj);

            if (isset($response['error'])) {
                throw new PDOException("LibSQL Query Error: " . $response['error']['message']);
            }

            if (isset($response['response']['result'])) {
                $result = $response['response']['result'];
                $this->resultCols = isset($result['cols']) ? $result['cols'] : [];
                $this->resultRows = isset($result['rows']) ? $result['rows'] : [];
                $this->affectedRows = isset($result['affected_row_count']) ? $result['affected_row_count'] : 0;

                if (isset($result['last_insert_rowid'])) {
                    $this->db->setLastInsertId($result['last_insert_rowid']);
                }
            }

            return true;
        }

        public function fetch($fetch_style = PDO::FETCH_ASSOC)
        {
            if ($this->currentRowIndex >= count($this->resultRows)) {
                return false;
            }

            $row = $this->resultRows[$this->currentRowIndex++];
            $mappedRow = [];

            foreach ($this->resultCols as $idx => $col) {
                $colName = $col['name'];
                $valObj = $row[$idx];

                $val = null;
                if (isset($valObj['value'])) {
                    $val = $valObj['value'];
                    if ($valObj['type'] === 'integer') {
                        $val = (int)$val;
                    } elseif ($valObj['type'] === 'float') {
                        $val = (float)$val;
                    } elseif ($valObj['type'] === 'null') {
                        $val = null;
                    }
                }

                $mappedRow[$colName] = $val;
            }

            return $mappedRow;
        }

        public function fetchColumn($column_number = 0)
        {
            $row = $this->fetch();
            if ($row === false) {
                return false;
            }
            $values = array_values($row);
            return isset($values[$column_number]) ? $values[$column_number] : null;
        }

        public function fetchAll($fetch_style = PDO::FETCH_ASSOC)
        {
            $rows = [];
            while ($row = $this->fetch($fetch_style)) {
                $rows[] = $row;
            }
            return $rows;
        }

        public function rowCount()
        {
            return $this->affectedRows;
        }
    }

    class LibSQLPDO
    {
        private $url;
        private $token;
        private $baton = null;
        private $lastInsertId = null;

        public function __construct($url, $token)
        {
            $this->url = $url;
            $this->token = $token;
        }

        public function setLastInsertId($id)
        {
            $this->lastInsertId = $id;
        }

        public function lastInsertId()
        {
            return $this->lastInsertId;
        }

        public function prepare($sql)
        {
            return new LibSQLPDOStatement($this, $sql);
        }

        public function query($sql)
        {
            $stmt = $this->prepare($sql);
            $stmt->execute();
            return $stmt;
        }

        public function exec($sql)
        {
            if (stripos(trim($sql), 'set names') === 0) {
                return 0;
            }
            $stmt = $this->prepare($sql);
            $stmt->execute();
            return $stmt->rowCount();
        }

        public function beginTransaction()
        {
            $this->exec("BEGIN TRANSACTION");
            return true;
        }

        public function commit()
        {
            $this->exec("COMMIT");
            $this->baton = null;
            return true;
        }

        public function rollBack()
        {
            $this->exec("ROLLBACK");
            $this->baton = null;
            return true;
        }

        public function translateSql($sql)
        {
            // Replace MySQL CURDATE() -> 'now'
            $sql = preg_replace('/CURDATE\(\)/i', "'now'", $sql);
            
            // Replace MySQL YEARWEEK(column, 1) -> strftime('%Y-%W', column)
            $sql = preg_replace('/YEARWEEK\(([^,]+),\s*1\)/i', "strftime('%Y-%W', $1)", $sql);

            // Replace MySQL DATE_SUB(NOW(), INTERVAL 7 DAY) -> datetime('now', '-7 days')
            $sql = preg_replace('/DATE_SUB\(\s*NOW\(\)\s*,\s*INTERVAL\s*(\d+)\s*DAY\s*\)/i', "datetime('now', '-\$1 days')", $sql);
            
            // Replace MySQL DATE_ADD(NOW(), INTERVAL 7 DAY) -> datetime('now', '+7 days')
            $sql = preg_replace('/DATE_ADD\(\s*NOW\(\)\s*,\s*INTERVAL\s*(\d+)\s*DAY\s*\)/i', "datetime('now', '+\$1 days')", $sql);
            
            // Replace MySQL DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY) -> date('now', '+7 days')
            $sql = preg_replace('/DATE_ADD\(\s*CURRENT_DATE\(\)\s*,\s*INTERVAL\s*(\d+)\s*DAY\s*\)/i', "date('now', '+\$1 days')", $sql);
            
            // Replace MySQL NOW() -> CURRENT_TIMESTAMP
            $sql = preg_replace('/NOW\(\)/i', 'CURRENT_TIMESTAMP', $sql);
            
            // Replace MySQL CURRENT_DATE() -> CURRENT_DATE
            $sql = preg_replace('/CURRENT_DATE\(\)/i', 'CURRENT_DATE', $sql);
            
            // Replace MONTH(created_at) -> strftime('%m', created_at)
            $sql = preg_replace('/MONTH\(([^)]+)\)/i', "strftime('%m', \$1)", $sql);
            
            // Replace YEAR(created_at) -> strftime('%Y', created_at)
            $sql = preg_replace('/YEAR\(([^)]+)\)/i', "strftime('%Y', \$1)", $sql);
            
            return $sql;
        }

        public function executeStatement($stmtObj)
        {
            $url = $this->url . '/v2/pipeline';
            
            $request = [
                'type' => 'execute',
                'stmt' => $stmtObj
            ];
            
            $payload = [
                'requests' => [
                    $request
                ]
            ];
            
            if ($this->baton !== null) {
                $payload['baton'] = $this->baton;
            }
            
            if ($this->baton === null && stripos($stmtObj['sql'], 'BEGIN') === false) {
                $payload['requests'][] = ['type' => 'close'];
            }

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $this->token,
                'Content-Type: application/json'
            ]);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            
            if (curl_errno($ch)) {
                $err = curl_error($ch);
                curl_close($ch);
                return ['error' => ['message' => $err]];
            }
            
            curl_close($ch);
            
            if ($httpCode !== 200) {
                $errObj = json_decode($response, true);
                $msg = isset($errObj['error']) ? $errObj['error'] : $response;
                return ['error' => ['message' => "HTTP $httpCode: " . (is_array($msg) ? json_encode($msg) : $msg)]];
            }
            
            $resData = json_decode($response, true);
            if (!$resData) {
                return ['error' => ['message' => 'Invalid JSON response: ' . $response]];
            }
            
            if (isset($resData['baton'])) {
                $this->baton = $resData['baton'];
            }
            if (isset($resData['baton']) && $resData['baton'] === null) {
                $this->baton = null;
            }
            
            if (isset($resData['results'][0])) {
                $firstResult = $resData['results'][0];
                if (isset($firstResult['type']) && $firstResult['type'] === 'error') {
                    return ['error' => ['message' => $firstResult['error']['message']]];
                }
                return $firstResult;
            }
            
            return ['error' => ['message' => 'Empty pipeline results']];
        }
    }

    class Database
    {
        private static $connectionInstance = null;

        public function getConnection()
        {
            if (self::$connectionInstance !== null) {
                return self::$connectionInstance;
            }

            // Load env variables
            $db_url = getenv('CLASSFLOW_TURSO_DB_URL') ?: getenv('TURSO_DB_URL') ?: 'libsql://database-rose-mountain-vercel-icfg-oi3nf3jvh2rsjghg56ah9nsp.aws-us-east-1.turso.io';
            $db_token = getenv('CLASSFLOW_TURSO_AUTH_TOKEN') ?: getenv('TURSO_AUTH_TOKEN') ?: '';

            // Convert libsql:// to https://
            $http_url = str_replace('libsql://', 'https://', $db_url);

            self::$connectionInstance = new LibSQLPDO($http_url, $db_token);
            return self::$connectionInstance;
        }
    }
}
