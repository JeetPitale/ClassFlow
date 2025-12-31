import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Users,
  GraduationCap,
  BarChart3,
  Calendar,
  Lightbulb,
  FileText,
  ClipboardList,
  BookOpen,
  Download,
  Upload,
  Award,
  User,
  Rocket,
  X
} from
  'lucide-react';






const adminNavItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
  { to: '/admin/feedback', icon: MessageSquare, label: 'Feedback' },
  { to: '/admin/students', icon: GraduationCap, label: 'Manage Students' },
  { to: '/admin/teachers', icon: Users, label: 'Manage Teachers' },
  { to: '/admin/performance', icon: BarChart3, label: 'Performance' },
  { to: '/admin/schedules', icon: Calendar, label: 'Schedules' },
  { to: '/admin/startups', icon: Lightbulb, label: 'Startup Ideas' },
  { to: '/admin/syllabus-tracking', icon: Award, label: 'Syllabus Tracking' },
  { to: '/admin/profile', icon: User, label: 'Profile' }];


const teacherNavItems = [
  { to: '/teacher', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/teacher/announcements', icon: Megaphone, label: 'Announcements' },
  { to: '/teacher/materials', icon: FileText, label: 'Materials' },
  { to: '/teacher/assignments', icon: ClipboardList, label: 'Assignments' },
  { to: '/teacher/quizzes', icon: BookOpen, label: 'Quizzes' },
  { to: '/teacher/schedule', icon: Calendar, label: 'Schedule' },
  { to: '/teacher/syllabus', icon: Award, label: 'Syllabus Tracking' },
  { to: '/teacher/profile', icon: User, label: 'Profile' }];


const studentNavItems = [
  { to: '/student', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/student/announcements', icon: Megaphone, label: 'Announcements' },
  { to: '/student/feedback', icon: MessageSquare, label: 'Feedback' },
  { to: '/student/marks', icon: Award, label: 'My Marks' },
  { to: '/student/materials', icon: BookOpen, label: 'Materials' },
  { to: '/student/assignments', icon: ClipboardList, label: 'Assignments' },
  { to: '/student/quizzes', icon: BookOpen, label: 'Quizzes' },
  { to: '/student/schedule', icon: Calendar, label: 'Schedule' },
  { to: '/student/startup', icon: Rocket, label: 'My Startup' },
  { to: '/student/performance', icon: BarChart3, label: 'Performance' },
  { to: '/student/profile', icon: User, label: 'Profile' }];


export function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const navItems = user.role === 'admin' ?
    adminNavItems :
    user.role === 'teacher' ?
      teacherNavItems :
      studentNavItems;

  const roleLabels = {
    admin: 'Administrator',
    teacher: 'Teacher',
    student: 'Student'
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen &&
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose} />

      }

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-50 lg:z-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}>

        <div className="h-16 px-4 flex items-center justify-between border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-sidebar-foreground">ClassFlow</h1>
              <p className="text-xs text-muted-foreground">{roleLabels[user.role]}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-md hover:bg-sidebar-accent transition-colors">

            <X className="w-5 h-5 text-sidebar-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-1">
          {navItems.map((item) =>
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => onClose()}
              className={({ isActive }) =>
                cn(
                  'sidebar-item',
                  isActive && 'sidebar-item-active',
                  item.label === 'Performance' && 'opacity-50 pointer-events-none'
                )
              }>

              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          )}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {user.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>);

}