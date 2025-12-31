import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Clock, MapPin, Trash2, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { scheduleAPI } from '@/services/api';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    schedule_date: '',
    schedule_time: '',
    location: '',
    type: 'class',
    target_audience: 'Everyone'
  });
  const [audienceType, setAudienceType] = useState('Everyone');
  const [semester, setSemester] = useState('1');
  const [scheduleToDelete, setScheduleToDelete] = useState(null);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await scheduleAPI.getAll();
      if (response.data) {
        // Handle both response formats
        const schedulesData = response.data.data || response.data || [];
        setSchedules(Array.isArray(schedulesData) ? schedulesData : []);
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
      toast.error('Failed to load schedules');
      setSchedules([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.schedule_date || !formData.schedule_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await scheduleAPI.create(formData);
      toast.success('Schedule created successfully');
      setIsDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        schedule_date: '',
        schedule_time: '',
        location: '',
        type: 'class',
        target_audience: ''
      });
      await fetchSchedules();
    } catch (error) {
      console.error('Failed to create schedule:', error);
      toast.error('Failed to create schedule');
    }
  };

  const confirmDelete = async () => {
    if (!scheduleToDelete) return;

    try {
      await scheduleAPI.delete(scheduleToDelete);
      toast.success('Schedule deleted successfully');
      setScheduleToDelete(null);
      await fetchSchedules();
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      toast.error('Failed to delete schedule');
    }
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setFormData({ ...formData, schedule_date: format(date, 'yyyy-MM-dd') });
    setIsDialogOpen(true);
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

  // Get day name from index (0 = Sunday)
  const getDayName = (index) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[index];
  };

  // Start from Sunday
  const firstDayOfMonth = monthStart.getDay();
  const calendarDays = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }

  // Add all days of the month
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
        title="Schedule Management"
        description="View and manage class schedules"
      />

      {/* Calendar Header */}
      <div className="card-elevated p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-primary" />
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-4">
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
            <Button onClick={() => {
              setSelectedDate(null);
              setFormData({
                title: '',
                description: '',
                schedule_date: '',
                schedule_time: '',
                location: '',
                type: 'class',
                type: 'class',
                target_audience: 'Everyone'
              });
              setAudienceType('Everyone');
              setSemester('Every');
              setIsDialogOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Schedule
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

            return (
              <div
                key={day.toString()}
                className={`aspect-square border rounded-lg p-2 cursor-pointer transition-all hover:shadow-md ${isCurrentMonth ? 'bg-background' : 'bg-muted/30'
                  } ${isToday ? 'ring-2 ring-primary' : ''}`}
                onClick={() => handleDateClick(day)}
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

      {/* Schedule Details for Selected Date */}
      {selectedDate && getSchedulesForDate(selectedDate).length > 0 && (
        <div className="card-elevated p-6">
          <h3 className="text-lg font-semibold mb-4">
            Schedules for {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          <div className="space-y-3">
            {getSchedulesForDate(selectedDate).map((schedule) => (
              <div key={schedule.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
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
                      {schedule.target_audience && (
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {schedule.target_audience}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setScheduleToDelete(schedule.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AlertDialog open={!!scheduleToDelete} onOpenChange={(open) => !open && setScheduleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the schedule.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add/Edit Schedule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Schedule</DialogTitle>
            <DialogDescription>
              Create a new schedule entry
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Mathematics Class"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="class">Class</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.schedule_date}
                  onChange={(e) => setFormData({ ...formData, schedule_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.schedule_time}
                  onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Room 101"
              />
            </div>

            <div className="space-y-2">
              <Label>Target Audience</Label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Select
                    value={audienceType}
                    onValueChange={(val) => {
                      setAudienceType(val);
                      let newAudience = val;
                      if (val === 'Students') newAudience = 'Students';
                      setFormData(prev => ({ ...prev, target_audience: newAudience }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Everyone">Everyone</SelectItem>
                      <SelectItem value="Teachers">Teachers</SelectItem>
                      <SelectItem value="Students">Students</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {audienceType === 'Students' && (
                  <div className="w-[120px]">
                    <Select
                      value={semester}
                      onValueChange={(val) => {
                        setSemester(val);
                        if (val === 'Every') {
                          setFormData(prev => ({ ...prev, target_audience: 'Students' }));
                        } else {
                          setFormData(prev => ({ ...prev, target_audience: `Students (Sem ${val})` }));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sem" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Every">Every</SelectItem>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                          <SelectItem key={sem} value={sem.toString()}>Sem {sem}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Create Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}