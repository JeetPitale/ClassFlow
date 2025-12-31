import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, MapPin, User, Users, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function ScheduleCalendar({ schedules }) {
  // Get current day index (0=Monday, 6=Sunday)
  // new Date().getDay() returns 0=Sunday, 1=Monday
  const today = new Date().getDay();
  const currentDayIndex = (today + 6) % 7;
  const currentDayName = dayNames[currentDayIndex];

  // Group schedules by day
  const groupedSchedules = schedules.reduce((acc, schedule) => {
    // schedule.day_of_week is 1-based (1=Monday)
    const day = dayNames[schedule.day_of_week - 1] || 'Monday';
    if (!acc[day]) acc[day] = [];
    acc[day].push(schedule);
    return acc;
  }, {});

  // Sort schedules within each day by start time
  Object.keys(groupedSchedules).forEach(day => {
    groupedSchedules[day].sort((a, b) => a.start_time.localeCompare(b.start_time));
  });

  // Calculate dates for current week
  const getWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0-6 (Sun-Sat)
    const diffToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Days to subtract to get to Monday

    const monday = new Date(today);
    monday.setDate(today.getDate() - diffToMon);

    return dayNames.map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const datesOfDay = getWeekDates();

  return (
    <Card className="h-full border-none shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold tracking-tight">Weekly Schedule</h3>
            <p className="text-sm text-muted-foreground">
              {schedules.length} classes scheduled this week
            </p>
          </div>
          <div className="p-2 bg-primary/10 rounded-full">
            <CalendarDays className="w-5 h-5 text-primary" />
          </div>
        </div>

        <Tabs defaultValue={currentDayName} className="w-full">
          <TabsList className="grid grid-cols-7 w-full mb-6 bg-muted/50 p-1 h-auto">
            {dayNames.map((day, index) => {
              const dateNum = datesOfDay[index].getDate();
              const isToday = day === currentDayName;

              return (
                <TabsTrigger
                  key={day}
                  value={day}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 px-1 rounded-md transition-all gap-1 h-14",
                    "data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  )}
                >
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                    {day.slice(0, 3)}
                  </span>
                  <span className={cn(
                    "text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors",
                    isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                  )}>
                    {dateNum}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <ScrollArea className="h-[400px] pr-4">
            {dayNames.map(day => {
              const daySchedules = groupedSchedules[day] || [];

              return (
                <TabsContent key={day} value={day} className="mt-0 space-y-4">
                  {daySchedules.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <CalendarDays className="w-6 h-6 opacity-50" />
                      </div>
                      <p>No classes scheduled for {day}</p>
                    </div>
                  ) : (
                    daySchedules.map((schedule, idx) => (
                      <div
                        key={`${day}-${idx}`}
                        className="group relative flex gap-4 p-4 rounded-xl border bg-card hover:bg-accent/5 transition-colors"
                      >
                        {/* Time Column */}
                        <div className="flex flex-col items-center min-w-[4rem] border-r pr-4 space-y-1">
                          <span className="text-sm font-bold text-primary">
                            {schedule.start_time?.slice(0, 5)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            to
                          </span>
                          <span className="text-xs font-medium text-muted-foreground">
                            {schedule.end_time?.slice(0, 5)}
                          </span>
                        </div>

                        {/* Content Column */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold truncate pr-2">
                              {schedule.subject || schedule.title}
                            </h4>
                            <Badge variant="secondary" className="uppercase text-[10px] tracking-wider whitespace-nowrap">
                              {schedule.type || 'Class'}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <User className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{schedule.teacher_name || 'Admin'}</span>
                            </div>
                            {schedule.target_audience && (
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Users className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">{schedule.target_audience}</span>
                              </div>
                            )}
                            {schedule.room_number && (
                              <div className="flex items-center gap-1.5 min-w-0">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">Room {schedule.room_number}</span>
                              </div>
                            )}

                            {/* Fallback location if room_number is missing but location exists (admin created) */}
                            {!schedule.room_number && schedule.location && (
                              <div className="flex items-center gap-1.5 min-w-0">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">{schedule.location}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Decorative side accent */}
                        <div className="absolute left-0 top-4 bottom-4 w-1 bg-primary rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))
                  )}
                </TabsContent>
              );
            })}
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}