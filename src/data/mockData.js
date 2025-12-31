/**
 * Mock Data - Legacy Support Only
 * This file is kept for backward compatibility with components not yet updated to use the API.
 * As components are updated to use the backend API, data from this file will be removed.
 */

// Empty arrays - all data now comes from backend API
export const mockAdmins = [];
export const mockStudents = [];
export const mockTeachers = [];

// Legacy mock data for features not yet connected to backend
// These will be removed as components are updated

// Empty arrays - all data now comes from backend API
export const mockAnnouncements = [];
export const mockMaterials = [];
export const mockAssignments = [];
export const mockQuizzes = [];
export const mockSchedules = [];
export const mockFeedback = [];
export const mockStartupIdeas = [];
export const mockPerformance = [];
export const mockSubmissions = [];
export const mockAttempts = [];
export const mockQuizSubmissions = [];
export const mockQuizResults = [];
export const mockGrades = [];
export const mockAssignmentReviews = [];
export const mockQuizAttempts = [];
export const mockMarks = [];
export const mockEvents = [];
export const mockNotifications = [];

// Course data (if needed for dropdowns/selectors)
export const mockCourses = [
  { id: 'c1', name: 'Computer Science', code: 'CS101' },
  { id: 'c2', name: 'Mathematics', code: 'MATH101' },
  { id: 'c3', name: 'Physics', code: 'PHY101' }
];

// Semesters (for filtering)
export const semesters = [
  { value: 1, label: 'Semester 1' },
  { value: 2, label: 'Semester 2' },
  { value: 3, label: 'Semester 3' },
  { value: 4, label: 'Semester 4' },
  { value: 5, label: 'Semester 5' },
  { value: 6, label: 'Semester 6' },
  { value: 7, label: 'Semester 7' },
  { value: 8, label: 'Semester 8' }
];

// Departments
export const departments = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Mechanical',
  'Civil',
  'Electrical'
];

// Gender options
export const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
];

export default {
  mockAdmins,
  mockStudents,
  mockTeachers,
  mockAnnouncements,
  mockMaterials,
  mockAssignments,
  mockQuizzes,
  mockSchedules,
  mockFeedback,
  mockStartupIdeas,
  mockCourses,
  semesters,
  departments,
  genderOptions
};