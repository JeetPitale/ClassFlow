import { useState, useEffect } from 'react';
import { Users, GraduationCap, Megaphone, MessageSquare, Calendar, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { ScheduleCalendar } from '@/components/ui/schedule-calendar';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    monthlyAnnouncements: 0,
    pendingFeedback: 0,
    averageScore: 0,
    recentAnnouncements: [],
    thisWeekSchedule: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('classflow_token');
        if (!token) return;

        const response = await fetch('https://classflow-backend-jeet.azurewebsites.net/api/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        toast({ title: 'Error', description: 'Failed to load dashboard data', variant: 'destructive' });
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="page-container">
      <PageHeader
        title="Admin Dashboard"
        description="Overview of your learning management system" />


      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={GraduationCap}
          trend={{ value: 12, isPositive: true }} />

        <StatCard
          title="Total Teachers"
          value={stats.totalTeachers}
          icon={Users}
          trend={{ value: 5, isPositive: true }} />

        <StatCard
          title="Announcements"
          value={stats.monthlyAnnouncements}
          icon={Megaphone}
          description="This month" />

        <StatCard
          title="Pending Feedback"
          value={stats.pendingFeedback}
          icon={MessageSquare}
          description="Awaiting review" />

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Announcements */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Recent Announcements</h2>
          <div className="space-y-3">
            {stats.recentAnnouncements.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent announcements.</p>
            ) : (
              stats.recentAnnouncements.map((announcement, index) =>
                <div
                  key={index}
                  className="card-elevated p-4 animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}>

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">
                        {announcement.title}
                      </h3>
                      {/* Dashboard API doesn't return content potentially to save bandwidth, checks controller */}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(announcement.created_at || announcement.createdAt), 'MMM d, yyyy')}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          /* Simplification: Controller didn't return target_audience? Checking controller again. */
                          'bg-primary/10 text-primary'}`
                        }>
                          Announcement
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Quick Stats */}
          <h2 className="text-lg font-semibold text-foreground mt-8">Performance Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card-elevated p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <span className="font-medium text-foreground">Student Performance</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Average Score</span>
                  <span className="font-medium text-foreground">{stats.averageScore}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-success rounded-full" style={{ width: `${stats.averageScore}%` }} />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Calendar */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Weekly Schedule</h2>
          {/* Map backend snake_case to frontend expected props if Component expects camelCase */}
          <ScheduleCalendar schedules={stats.thisWeekSchedule.map(s => {
            const date = new Date(s.schedule_date);
            const dayOfWeek = date.getDay() || 7; // 0 is Sunday, map to 7? or component expects 1-7.
            // Component uses dayNames[schedule.day_of_week - 1]. dayNames starts with Monday (index 0).
            // JS getDay(): 0=Sun, 1=Mon... 6=Sat.
            // Component: 1 -> Monday. So Mon(1) -> 1. Sun(0) -> 7.

            // Fix time format HH:mm:ss -> HH:mm
            const startTime = s.schedule_time.substring(0, 5);
            // Mock end time (+1 hour)
            const [hours, minutes] = startTime.split(':').map(Number);
            const endHours = (hours + 1) % 24;
            const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

            return {
              id: s.id,
              day_of_week: dayOfWeek === 0 ? 7 : dayOfWeek, // Convert Sun=0 to 7. Mon=1 to 1.
              start_time: startTime,
              end_time: endTime,
              subject: s.title,
              teacher_name: s.type, // Reuse this field for type
              room_number: s.location
            };
          })} />
        </div>
      </div>
    </div>);
}