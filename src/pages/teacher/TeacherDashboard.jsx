import { useState, useEffect } from 'react';
import { FileText, ClipboardList, BookOpen, Users, TrendingUp, MessageSquare } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { ScheduleCalendar } from '@/components/ui/schedule-calendar';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function TeacherDashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    materialsCount: 0,
    activeAssignments: 0,
    quizzesCreated: 0,
    pendingGrading: 0,
    recentSubmissions: [],
    classPerformance: {
      average: 0,
      submissionRate: 0
    },
    weeklySchedule: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('https://classflow-backend-jeet.azurewebsites.net/api/dashboard/teacher-stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        toast.error('Failed to load dashboard data');
      }
    };

    if (token) {
      fetchStats();
    }
  }, [token]);

  const recentSubmissions = stats.recentSubmissions || [];

  return (
    <div className="page-container">
      <PageHeader
        title="Teacher Dashboard"
        description="Manage your courses, materials, and student submissions" />


      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Materials Uploaded"
          value={stats.materialsCount}
          icon={FileText}
          trend={{ value: 8, isPositive: true }} />

        <StatCard
          title="Active Assignments"
          value={stats.activeAssignments}
          icon={ClipboardList} />

        <StatCard
          title="Quizzes Created"
          value={stats.quizzesCreated}
          icon={BookOpen} />

        <StatCard
          title="Pending Grading"
          value={stats.pendingGrading}
          icon={MessageSquare}
          description="Submissions to review" />

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Submissions */}
        <div className="lg:col-span-2 space-y-4">


          {/* Quick Stats */}
          <h2 className="text-lg font-semibold text-foreground mt-8">Class Performance</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card-elevated p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <span className="font-medium text-foreground">Class Average</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Assignments</span>
                  <span className="font-medium text-foreground">{stats.classPerformance.average}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-success rounded-full" style={{ width: `${stats.classPerformance.average}%` }} />
                </div>
              </div>
            </div>
            <div className="card-elevated p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-foreground">Submission Rate</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">This Week</span>
                  <span className="font-medium text-foreground">{stats.classPerformance.submissionRate}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${stats.classPerformance.submissionRate}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">My Schedule</h2>
          <ScheduleCalendar
            schedules={stats.weeklySchedule.map(s => {
              const date = new Date(s.schedule_date);
              const dayOfWeek = date.getDay() || 7; // Convert 0 (Sun) to 7 for consistency if needed, or matched component logic (1=Mon)
              // Component expects day_of_week 1=Mon...7=Sun based on previous usage or check logic.
              // Assuming standard JS getDay: 0=Sun, 1=Mon.
              // If Component uses index-1 map:
              // dayNames = ['Monday', ...]. dayNames[schedule.day_of_week - 1].
              // So if Monday (1), index 0. Correct.
              // If Sunday (0), we need 7.

              const startTime = s.schedule_time.substring(0, 5);
              const [hours, minutes] = startTime.split(':').map(Number);
              const endHours = (hours + 1) % 24;
              const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

              return {
                ...s,
                id: s.id,
                day_of_week: dayOfWeek === 0 ? 7 : dayOfWeek,
                start_time: startTime,
                end_time: endTime,
                subject: s.title,
                type: s.type || 'Class',
                room_number: s.location,
                teacher_name: s.type // Or actual teacher name if available, keeping 'type' as fallback
              };
            })} />

        </div>
      </div>
    </div>);

}