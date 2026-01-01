# ClassFlow - Learning Management System (LMS)

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=Vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)
![Azure](https://img.shields.io/badge/Azure-007FFF?style=for-the-badge&logo=microsoft-azure&logoColor=white)

ClassFlow is a comprehensive Learning Management System designed to streamline educational processes for administrators, teachers, and students. Built with a modern tech stack, it offers a robust platform for managing courses, quizzes, schedules, and more.

## Features

### 🎓 For Students
- **Dashboard**: View upcoming quizzes, assignments, and announcements.
- **My Courses**: Access enrolled courses and syllabus.
- **Quizzes**: Take online quizzes with real-time feedback.
- **Progress Tracking**: Monitor grades and performance.

### 👨‍🏫 For Teachers
- **Course Management**: customized tools for managing assigned courses.
- **Syllabus**: Upload and organize course syllabus.
- **Quiz Creator**: Create and manage quizzes for students.
- **Grading**: Review student submissions and assign grades.

### 🛠️ For Administrators
- **User Management**: Add, remove, and manage students and teachers.
- **System Settings**: Configure global settings for the LMS.
- **Schedule Management**: Organize and publish class schedules.

## Tech Stack

### Frontend
- **Framework**: [React](https://react.dev/) (via [Vite](https://vitejs.dev/))
- **Language**: TypeScript / JavaScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) (Radix UI)
- **State Management**: React Query
- **Routing**: React Router DOM
- **HTTP Client**: Axios

### Backend
- **Language**: PHP
- **Database**: MySQL
- **Server**: Apache / Nginx
- **API**: RESTful API architecture

## Prerequisites

Before running the project, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [PHP](https://www.php.net/) (v8.0 or higher)
- [MySQL](https://www.mysql.com/)
- [Composer](https://getcomposer.org/) (Optional)

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository_url>
cd ClassFlow
```

### 2. Backend Setup
1.  Navigate to the `backend` directory.
    ```bash
    cd backend
    ```
2.  Set up the database:
    - Create a new MySQL database named `classflow_db`.
    - Import the database schema (look for `.sql` files in `migrations` or root).
3.  Configure the database connection:
    - Open `backend/config/database.php` or create a `.env` file.
    - Update the credentials (see [Configuration](#configuration)).
4.  Start the PHP development server:
    ```bash
    php -S localhost:8000
    ```

### 3. Frontend Setup
1.  Navigate to the project root.
    ```bash
    cd ..
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

## Configuration

### Backend Configuration
The backend uses **Environment Variables** for database connection.

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database Hostname | `127.0.0.1` |
| `DB_PORT` | Database Port | `3306` |
| `DB_NAME` | Database Name | `classflow_db` |
| `DB_USER` | Database User | `root` |
| `DB_PASS` | Database Password | *(empty)* |
| `DB_SSL` | Enable SSL (set to `true`) | `false` |
| `DB_SSL_CA` | Path to SSL CA Certificate | `null` |

**Note**: For production environments appropriately set `DB_SSL=true`.

### Frontend Configuration
The frontend communicates with the backend via the API URL defined in `src/services/api.js`.

To change the API endpoint:
1.  Open `src/services/api.js`.
2.  Update the `API_URL` constant:
    ```javascript
    // For Local Development
    const API_URL = 'http://localhost:8000/api';

    // For Production
    // const API_URL = 'https://<your-backend-domain>/api';
    ```

## Folder Structure

```
ClassFlow/
├── backend/            # PHP Backend logic
│   ├── config/         # Database & App Config
│   ├── controllers/    # API Request Handlers
│   ├── database/       # DB Helper Classes
│   ├── models/         # Data Models
│   └── uploads/        # Stored user uploads
├── src/                # React Frontend source
│   ├── components/     # Reusable UI components
│   ├── pages/          # Application views (Student, Teacher, Admin)
│   ├── services/       # API Service definitions (api.js)
│   ├── context/        # React Context (Auth)
│   └── lib/            # Utilities
└── ...
```

## Contributing
1.  Fork the project.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## License
This project is proprietary and intended for educational use.
