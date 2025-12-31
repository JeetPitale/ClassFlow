import { useState, useEffect } from 'react';
import { Award, FileText, TrendingUp, Clock } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { ScheduleCalendar } from '@/components/ui/schedule-calendar';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function StudentDashboard() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    overallGrade: 0,
    assignmentsDue: 0,
    materialsCount: 0,
    upcomingAssignments: [],
    recentAnnouncements: [],
    weeklySchedule: [],
    progress: {
      assignments: 0,
      quizzes: 0
    }
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/dashboard/student-stats', {
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
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchStats();
    }
  }, [token]);

  if (loading) {
    return <div className="p-8 text-center">Loading dashboard...</div>;
  }

  // Transform schedule for calendar component
  const scheduleEvents = stats.weeklySchedule.map(s => {
    const date = new Date(s.schedule_date);
    const dayOfWeek = date.getDay() || 7; // Convert 0 (Sun) to 7
    const startTime = s.schedule_time.substring(0, 5);
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = (hours + 1) % 24;
    const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    return {
      id: s.id,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      subject: s.title,
      teacher_name: s.location, // Using location/room as secondary info
      room_number: ''
    };
  });

  return (
    <div className="page-container">
      <PageHeader
        title="Student Dashboard"
        description="Track your progress, assignments, and upcoming schedules"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Overall Grade"
          value={`${stats.overallGrade}%`}
          icon={Award}
          trend={{ value: 0, isPositive: true }}
          description="Average Score"
        />

        <StatCard
          title="Assignments Due"
          value={stats.assignmentsDue}
          icon={Clock}
          description="This week"
        />

        <StatCard
          title="Materials Available"
          value={stats.materialsCount}
          icon={FileText}
          description="In your semester"
        />



      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Assignments */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Upcoming Assignments</h2>
            <div className="space-y-3">
              {stats.upcomingAssignments.length > 0 ? (
                stats.upcomingAssignments.map((assignment, index) => (
                  <div
                    key={assignment.id}
                    className="card-elevated p-4 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">{assignment.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {assignment.description}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-medium text-foreground">
                          {format(new Date(assignment.dueDate), 'MMM d')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {assignment.maxMarks} marks
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                  <p>No upcoming assignments due soon.</p>
                </div>
              )}
            </div>
          </div>

          {/* Announcements */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Announcements</h2>
            <div className="space-y-3">
              {stats.recentAnnouncements.length > 0 ? (
                stats.recentAnnouncements.map((announcement, index) => (
                  <div
                    key={announcement.id}
                    className="card-elevated p-4 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <h4 className="font-medium text-foreground">{announcement.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {announcement.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(announcement.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                  <p>No recent announcements.</p>
                </div>
              )}
            </div>
          </div>

          {/* Academic Progress */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Academic Progress</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card-elevated p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium text-foreground">Assignment Completion</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Submitted</span>
                    <span className="font-medium text-foreground">{stats.progress.assignments}%</span>
                  </div>
                  <Progress value={stats.progress.assignments} className="h-2" />
                </div>
              </div>
              <div className="card-elevated p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-info/10">
                    <TrendingUp className="w-5 h-5 text-info" />
                  </div>
                  <span className="font-medium text-foreground">Quiz Completion</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Attempted</span>
                    <span className="font-medium text-foreground">{stats.progress.quizzes}%</span>
                  </div>
                  <Progress value={stats.progress.quizzes} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Sidebar */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Weekly Schedule</h2>
          <ScheduleCalendar schedules={scheduleEvents} />
        </div>
      </div>
    </div>
  );
}