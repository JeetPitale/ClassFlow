import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { scheduleAPI } from '@/services/api';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';

export default function TeacherSchedule() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await scheduleAPI.getAll();
      if (response.data) {
        const schedulesData = response.data.data || response.data || [];
        setSchedules(Array.isArray(schedulesData) ? schedulesData : []);
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
      toast.error('Failed to load schedules');
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  // Get calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get schedules for a specific date
  const getSchedulesForDate = (date) => {
    return schedules.filter(schedule =>
      isSameDay(parseISO(schedule.schedule_date), date)
    );
  };

  const typeColors = {
    class: 'bg-blue-500',
    exam: 'bg-red-500',
    event: 'bg-purple-500',
    meeting: 'bg-green-500'
  };

  const typeLabels = {
    class: 'Class',
    exam: 'Exam',
    event: 'Event',
    meeting: 'Meeting'
  };

  const getDayName = (index) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[index];
  };

  const firstDayOfMonth = monthStart.getDay();
  const calendarDays = [];

  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }

  calendarDays.push(...daysInMonth);

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <p>Loading schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Schedule"
        description="View class schedules and events"
      />

      {/* Calendar */}
      <div className="card-elevated p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-primary" />
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentMonth(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
            <div key={dayIndex} className="text-center font-medium text-muted-foreground py-2">
              {getDayName(dayIndex)}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const daySchedules = getSchedulesForDate(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <div
                key={day.toString()}
                className={`aspect-square border rounded-lg p-2 cursor-pointer transition-all hover:shadow-md ${isCurrentMonth ? 'bg-background' : 'bg-muted/30'
                  } ${isToday ? 'ring-2 ring-primary' : ''} ${isSelected ? 'bg-primary/10' : ''}`}
                onClick={() => setSelectedDate(day)}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : 'text-foreground'}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1 overflow-hidden">
                  {daySchedules.slice(0, 3).map((schedule) => (
                    <div
                      key={schedule.id}
                      className={`text-xs px-1 py-0.5 rounded text-white truncate ${typeColors[schedule.type]}`}
                      title={schedule.title}
                    >
                      {schedule.title}
                    </div>
                  ))}
                  {daySchedules.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{daySchedules.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedule Details */}
      {selectedDate && getSchedulesForDate(selectedDate).length > 0 && (
        <div className="card-elevated p-6">
          <h3 className="text-lg font-semibold mb-4">
            Schedules for {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          <div className="space-y-3">
            {getSchedulesForDate(selectedDate).map((schedule) => (
              <div key={schedule.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium">{schedule.title}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full text-white ${typeColors[schedule.type]}`}>
                    {typeLabels[schedule.type]}
                  </span>
                </div>
                {schedule.description && (
                  <p className="text-sm text-muted-foreground mb-2">{schedule.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {schedule.schedule_time}
                  </span>
                  {schedule.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {schedule.location}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}