# ClassFlow Backend - PHP REST API

## Setup Instructions

### 1. Database Setup
```bash
# Create database
mysql -u root -p
CREATE DATABASE classflow_db;
exit;

# Import schema
mysql -u root -p classflow_db < database/schema.sql
```

### 2. Update Database Credentials
Edit `config/database.php` and update:
```php
private $host = "localhost";
private $db_name = "classflow_db";
private $username = "root";  // Your MySQL username
private $password = "";      // Your MySQL password
```

### 3. Update Passwords in Database
The schema includes sample users with placeholder passwords. Update them:
```sql
-- For admin (password: Nxt_shadow@07)
UPDATE users SET password_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' 
WHERE email = 'jeetzo77@admin.in';

-- For student (password: 23CI2020044)
UPDATE users SET password_hash = '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm' 
WHERE email = '23ci2020044@student.edu';

-- For teacher (password: Teacher1)
UPDATE users SET password_hash = '$2y$10$7KIXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/abc' 
WHERE email = 'teacher@lms.in';
```

### 4. Start PHP Server
```bash
cd backend
php -S localhost:8000
```

The API will be available at: `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
  ```json
  {
    "email": "jeetzo77@admin.in",
    "password": "Nxt_shadow@07",
    "role": "admin"
  }
  ```

- `GET /api/auth/me` - Get current user (requires Authorization header)
- `POST /api/auth/logout` - Logout

## Testing

Use Postman or curl to test:
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jeetzo77@admin.in","password":"Nxt_shadow@07","role":"admin"}'

# Get current user (replace TOKEN with actual token)
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

## Next Steps
1. Set up database
2. Test authentication endpoints
3. Proceed with other feature endpoints (announcements, materials, etc.)
