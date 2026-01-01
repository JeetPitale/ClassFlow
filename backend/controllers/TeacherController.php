<?php
/**
 * Teacher Controller  
 * Handles teacher management operations
 */

require_once __DIR__ . '/../models/Teacher.php';
require_once __DIR__ . '/../utils/Response.php';

class TeacherController
{
    /**
     * Get all teachers
     */
    public static function index()
    {
        $teacher = new Teacher();
        $teachers = $teacher->getAll();

        Response::success($teachers);
    }

    /**
     * Get teacher by ID
     */
    public static function show($id)
    {
        $teacher = new Teacher();
        $teacherData = $teacher->findById($id);

        if (!$teacherData) {
            Response::notFound('Teacher not found');
        }

        Response::success($teacherData);
    }

    /**
     * Create new teacher
     */
    public static function store()
    {
        $data = json_decode(file_get_contents("php://input"));

        //Validate required fields
        if (!isset($data->name) || !isset($data->email) || !isset($data->password)) {
            Response::validationError([
                'name' => 'Name is required',
                'email' => 'Email is required',
                'password' => 'Password is required'
            ]);
        }

        $teacher = new Teacher();

        // Check if email already exists
        if ($teacher->findByEmail($data->email)) {
            Response::error('Email already exists', 409);
        }

        // Set teacher properties
        $teacher->name = $data->name;
        $teacher->email = $data->email;
        $teacher->password_hash = $data->password;
        $teacher->phone = isset($data->phone) ? $data->phone : null;
        $teacher->dob = isset($data->dob) ? $data->dob : null;
        $teacher->gender = isset($data->gender) ? $data->gender : null;
        $teacher->address = isset($data->address) ? $data->address : null;
        $teacher->subject_specialization = isset($data->subject_specialization) ? $data->subject_specialization : null;
        $teacher->qualification = isset($data->qualification) ? $data->qualification : null;
        $teacher->experience_years = isset($data->experience_years) ? $data->experience_years : null;

        if ($teacher->create()) {
            $teacherData = $teacher->findById($teacher->id);
            Response::success($teacherData, 'Teacher created successfully', 201);
        } else {
            Response::error('Failed to create teacher');
        }
    }

    /**
     * Update teacher
     */
    public static function update($id)
    {
        $data = json_decode(file_get_contents("php://input"));

        $teacher = new Teacher();
        $existingTeacher = $teacher->findById($id);

        if (!$existingTeacher) {
            Response::notFound('Teacher not found');
        }

        // Update properties
        $teacher->id = $id;
        $teacher->name = isset($data->name) ? $data->name : $existingTeacher['name'];
        $teacher->email = isset($data->email) ? $data->email : $existingTeacher['email'];
        $teacher->phone = isset($data->phone) ? $data->phone : $existingTeacher['phone'];
        $teacher->dob = isset($data->dob) ? $data->dob : $existingTeacher['dob'];
        $teacher->gender = isset($data->gender) ? $data->gender : $existingTeacher['gender'];
        $teacher->address = isset($data->address) ? $data->address : $existingTeacher['address'];
        $teacher->subject_specialization = isset($data->subject_specialization) ? $data->subject_specialization : $existingTeacher['subject_specialization'];
        $teacher->qualification = isset($data->qualification) ? $data->qualification : $existingTeacher['qualification'];
        $teacher->experience_years = isset($data->experience_years) ? $data->experience_years : $existingTeacher['experience_years'];

        // Handle password update
        if (isset($data->password) && !empty($data->password)) {
            $teacher->password_hash = $data->password;
        }

        if ($teacher->update()) {
            $updatedTeacher = $teacher->findById($id);
            Response::success($updatedTeacher, 'Teacher updated successfully');
        } else {
            Response::error('Failed to update teacher');
        }
    }

    /**
     * Delete teacher
     */
    public static function destroy($id)
    {
        $teacher = new Teacher();

        if (!$teacher->findById($id)) {
            Response::notFound('Teacher not found');
        }

        $teacher->id = $id;

        if ($teacher->delete()) {
            Response::success(null, 'Teacher deleted successfully');
        } else {
            Response::error('Failed to delete teacher');
        }
    }
}
