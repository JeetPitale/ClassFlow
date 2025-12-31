import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

// Pages
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import ViewOnlyProfile from "./pages/ViewOnlyProfile";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminFeedback from "./pages/admin/AdminFeedback";
import ManageStudents from "./pages/admin/ManageStudents";
import ManageTeachers from "./pages/admin/ManageTeachers";
import AdminPerformance from "./pages/admin/AdminPerformance";
import AdminSchedules from "./pages/admin/AdminSchedules";
import AdminStartups from "./pages/admin/AdminStartups";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminSyllabusTracking from "./pages/admin/AdminSyllabusTracking";

// Teacher Pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherAnnouncements from "./pages/teacher/TeacherAnnouncements";
import TeacherMaterials from "./pages/teacher/TeacherMaterials";
import TeacherAssignments from "./pages/teacher/TeacherAssignments";
import TeacherQuizzes from "./pages/teacher/TeacherQuizzes";
import TeacherFeedback from "./pages/teacher/TeacherFeedback";
import TeacherSchedule from "./pages/teacher/TeacherSchedule";
import TeacherSyllabus from "./pages/teacher/TeacherSyllabus";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentAnnouncements from "./pages/student/StudentAnnouncements";
import StudentFeedback from "./pages/student/StudentFeedback";
import StudentMarks from "./pages/student/StudentMarks";
import StudentMaterials from "./pages/student/StudentMaterials";
import StudentAssignments from "./pages/student/StudentAssignments";
import StudentSchedule from "./pages/student/StudentSchedule";
import StudentStartup from "./pages/student/StudentStartup";
import StudentPerformance from "./pages/student/StudentPerformance";
import StudentQuizzes from "./pages/student/StudentQuizzes";
import TakeQuiz from "./pages/student/TakeQuiz";

const queryClient = new QueryClient();

const App = () =>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Login />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<DashboardLayout requiredRole="admin" />}>
              <Route index element={<AdminDashboard />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="feedback" element={<AdminFeedback />} />
              <Route path="students" element={<ManageStudents />} />
              <Route path="teachers" element={<ManageTeachers />} />
              {/* <Route path="performance" element={<AdminPerformance />} /> */}
              <Route path="schedules" element={<AdminSchedules />} />
              <Route path="startups" element={<AdminStartups />} />
              <Route path="syllabus-tracking" element={<AdminSyllabusTracking />} />
              <Route path="profile" element={<AdminProfile />} />
            </Route>

            {/* Teacher Routes */}
            <Route path="/teacher" element={<DashboardLayout requiredRole="teacher" />}>
              <Route index element={<TeacherDashboard />} />
              <Route path="announcements" element={<TeacherAnnouncements />} />
              <Route path="materials" element={<TeacherMaterials />} />
              <Route path="assignments" element={<TeacherAssignments />} />
              <Route path="quizzes" element={<TeacherQuizzes />} />
              <Route path="schedule" element={<TeacherSchedule />} />
              <Route path="syllabus" element={<TeacherSyllabus />} />
              <Route path="profile" element={<ViewOnlyProfile />} />
            </Route>

            {/* Student Routes */}
            <Route path="/student" element={<DashboardLayout requiredRole="student" />}>
              <Route index element={<StudentDashboard />} />
              <Route path="announcements" element={<StudentAnnouncements />} />
              <Route path="feedback" element={<StudentFeedback />} />
              <Route path="marks" element={<StudentMarks />} />
              <Route path="materials" element={<StudentMaterials />} />
              <Route path="assignments" element={<StudentAssignments />} />
              <Route path="quizzes" element={<StudentQuizzes />} />
              <Route path="quiz/:quizId" element={<TakeQuiz />} />
              <Route path="schedule" element={<StudentSchedule />} />
              <Route path="startup" element={<StudentStartup />} />
              {/* <Route path="performance" element={<StudentPerformance />} /> */}
              <Route path="profile" element={<ViewOnlyProfile />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>;


export default App;