import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
    // Content-Type is handled automatically by axios (json for objects, multipart for FormData)
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('classflow_token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('classflow_token');
            localStorage.removeItem('classflow_user');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

// Auth APIs
export const authAPI = {
    login: (email, password, role) => api.post('/auth/login', { email, password, role }),
    logout: () => api.post('/auth/logout'),
    getCurrentUser: () => api.get('/auth/me'),
};

// Student APIs
export const studentAPI = {
    getAll: () => api.get('/students'),
    getById: (id) => api.get(`/students/${id}`),
    create: (data) => api.post('/students', data),
    update: (id, data) => api.put(`/students/${id}`, data),
    delete: (id) => api.delete(`/students/${id}`),
};

// Teacher APIs
export const teacherAPI = {
    getAll: () => api.get('/teachers'),
    getById: (id) => api.get(`/teachers/${id}`),
    create: (data) => api.post('/teachers', data),
    update: (id, data) => api.put(`/teachers/${id}`, data),
    delete: (id) => api.delete(`/teachers/${id}`),
};

// Announcement APIs
export const announcementAPI = {
    getAll: () => api.get('/announcements'),
    getById: (id) => api.get(`/announcements/${id}`),
    create: (data) => api.post('/announcements', data),
    update: (id, data) => api.put(`/announcements/${id}`, data),
    delete: (id) => api.delete(`/announcements/${id}`),
};

// Material APIs
export const materialAPI = {
    getAll: () => api.get('/materials'),
    getBySemester: (semester) => api.get(`/materials?semester=${semester}`),
    create: (data) => api.post('/materials', data),
    delete: (id) => api.delete(`/materials/${id}`),
};

// Assignment APIs
export const assignmentAPI = {
    getAll: () => api.get('/assignments'),
    getBySemester: (semester) => api.get(`/assignments?semester=${semester}`),
    getById: (id) => api.get(`/assignments/${id}`),
    create: (data) => api.post('/assignments', data),
    update: (id, data) => api.post(`/assignments/${id}/update`, data),
    delete: (id) => api.delete(`/assignments/${id}`),
    getSubmissions: (id) => api.get(`/assignments/${id}/submissions`),
    submit: (id, data) => api.post(`/assignments/${id}/submit`, data),
    grade: (submissionId, data) => api.put(`/assignments/submissions/${submissionId}/grade`, data),
    gradeStudent: (assignmentId, data) => api.post(`/assignments/${assignmentId}/grade-student`, data),
    getMySubmissions: () => api.get('/assignments/my-submissions'),
};

// Quiz APIs
export const quizAPI = {
    getAll: () => api.get('/quizzes'),
    getBySemester: (semester) => api.get(`/quizzes?semester=${semester}`),
    getById: (id) => api.get(`/quizzes/${id}`),
    create: (data) => api.post('/quizzes', data),
    delete: (id) => api.delete(`/quizzes/${id}`),
    getQuestions: (id) => api.get(`/quizzes/${id}/questions`),
    submitAttempt: (id, data) => api.post(`/quizzes/${id}/attempt`, data),
    getMyAttempts: () => api.get('/student/quiz-attempts'),
};

// Schedule APIs
export const scheduleAPI = {
    getAll: () => api.get('/schedules'),
    getBySemester: (semester) => api.get(`/schedules?semester=${semester}`),
    create: (data) => api.post('/schedules', data),
    delete: (id) => api.delete(`/schedules/${id}`),
};

// Feedback APIs
export const feedbackAPI = {
    getAll: () => api.get('/feedback'),
    create: (data) => api.post('/feedback', data),
    respond: (id, response) => api.put(`/feedback/${id}/respond`, { response }),
};

// Startup Idea APIs
export const startupAPI = {
    getAll: () => api.get('/startups'),
    create: (data) => api.post('/startups', data),
    review: (id, status, feedback) => api.put(`/startups/${id}/review`, { status, feedback }),
};

// Notification APIs
export const notificationAPI = {
    getAll: () => api.get('/notifications'),
    getUnreadCount: () => api.get('/notifications/unread-count'),
    markAsRead: (id) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/mark-all-read'),
    delete: (id) => api.delete(`/notifications/${id}`),
};

// Profile APIs
export const profileAPI = {
    updateProfile: (data) => api.put('/profile/update', data),
    changePassword: (data) => api.put('/profile/change-password', data),
};

export default api;
