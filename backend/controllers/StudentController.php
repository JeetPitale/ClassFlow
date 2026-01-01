<?php
/**
 * Student Controller
 * Handles student management operations
 */

require_once __DIR__ . '/../models/Student.php';
require_once __DIR__ . '/../utils/Response.php';

class StudentController
{
    /**
     * Get all students
     */
    public static function index()
    {
        $student = new Student();
        $students = $student->getAll();

        Response::success($students);
    }

    /**
     * Get student by ID
     */
    public static function show($id)
    {
        $student = new Student();
        $studentData = $student->findById($id);

        if (!$studentData) {
            Response::notFound('Student not found');
        }

        Response::success($studentData);
    }

    /**
     * Create new student
     */
    public static function store()
    {
        $data = json_decode(file_get_contents("php://input"));

        // Validate required fields
        if (
            !isset($data->name) || !isset($data->email) || !isset($data->password) ||
            !isset($data->enrollment_no) || !isset($data->semester)
        ) {
            Response::validationError([
                'name' => 'Name is required',
                'email' => 'Email is required',
                'password' => 'Password is required',
                'enrollment_no' => 'Enrollment number is required',
                'semester' => 'Semester is required'
            ]);
        }

        $student = new Student();

        // Check if email already exists
        if ($student->findByEmail($data->email)) {
            Response::error('Email already exists', 409);
        }

        // Set student properties
        $student->name = $data->name;
        $student->email = $data->email;
        $student->password_hash = $data->password;
        $student->phone = isset($data->phone) ? $data->phone : null;
        $student->dob = isset($data->dob) ? $data->dob : null;
        $student->gender = isset($data->gender) ? $data->gender : null;
        $student->address = isset($data->address) ? $data->address : null;
        $student->enrollment_no = $data->enrollment_no;
        $student->semester = $data->semester;
        $student->department = isset($data->department) ? $data->department : null;

        if ($student->create()) {
            $studentData = $student->findById($student->id);
            Response::success($studentData, 'Student created successfully', 201);
        } else {
            Response::error('Failed to create student');
        }
    }

    /**
     * Update student
     */
    public static function update($id)
    {
        $data = json_decode(file_get_contents("php://input"));

        $student = new Student();
        $existingStudent = $student->findById($id);

        if (!$existingStudent) {
            Response::notFound('Student not found');
        }

        // Update properties
        $student->id = $id;
        $student->name = isset($data->name) ? $data->name : $existingStudent['name'];
        $student->email = isset($data->email) ? $data->email : $existingStudent['email'];
        $student->phone = isset($data->phone) ? $data->phone : $existingStudent['phone'];
        $student->dob = isset($data->dob) ? $data->dob : $existingStudent['dob'];
        $student->gender = isset($data->gender) ? $data->gender : $existingStudent['gender'];
        $student->address = isset($data->address) ? $data->address : $existingStudent['address'];
        $student->enrollment_no = isset($data->enrollment_no) ? $data->enrollment_no : $existingStudent['enrollment_no'];
        $student->semester = isset($data->semester) ? $data->semester : $existingStudent['semester'];
        $student->department = isset($data->department) ? $data->department : $existingStudent['department'];

        // Handle password update
        if (isset($data->password) && !empty($data->password)) {
            $student->password_hash = $data->password;
        }

        if ($student->update()) {
            $updatedStudent = $student->findById($id);
            Response::success($updatedStudent, 'Student updated successfully');
        } else {
            Response::error('Failed to update student');
        }
    }

    /**
     * Delete student
     */
    public static function destroy($id)
    {
        $student = new Student();

        if (!$student->findById($id)) {
            Response::notFound('Student not found');
        }

        $student->id = $id;

        if ($student->delete()) {
            Response::success(null, 'Student deleted successfully');
        } else {
            Response::error('Failed to delete student');
        }
    }
}
