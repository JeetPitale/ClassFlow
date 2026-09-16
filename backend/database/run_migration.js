const fs = require('fs');
const path = require('path');
const https = require('https');

// Read .env
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...value] = line.split('=');
    env[key.trim()] = value.join('=').trim();
  }
});

const urlStr = env.TURSO_DB_URL.replace('libsql://', 'https://') + '/v2/pipeline';
const url = new URL(urlStr);
const token = env.TURSO_AUTH_TOKEN;

const sqlPath = path.join(__dirname, '../migrations/update_coding_practice_tables.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');

const statements = sqlContent.split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

const requests = statements.map(sql => ({
  type: "execute",
  stmt: { sql }
}));
requests.push({ type: "close" });

const req = https.request(url, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(data);
  });
});

req.on('error', e => console.error(e));
req.write(JSON.stringify({ requests }));
req.end();
