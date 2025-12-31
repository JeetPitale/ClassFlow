
import { BarChart3, TrendingUp, Users, GraduationCap } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockPerformance, mockStudents, mockTeachers } from '@/data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminPerformance() {
  const studentPerformance = mockPerformance.filter((p) => p.userRole === 'student');
  const teacherPerformance = mockPerformance.filter((p) => p.userRole === 'teacher');

  const studentChartData = mockStudents.map((student) => {
    const metrics = studentPerformance.filter((p) => p.userId === student.id);
    const avgScore = metrics.length > 0 ?
    metrics.reduce((sum, m) => sum + m.value / m.maxValue * 100, 0) / metrics.length :
    0;
    return {
      name: student.name.split(' ')[0],
      score: Math.round(avgScore)
    };
  });

  const gradeDistribution = [
  { name: 'A (90-100)', value: 2, color: 'hsl(var(--success))' },
  { name: 'B (80-89)', value: 2, color: 'hsl(var(--primary))' },
  { name: 'C (70-79)', value: 1, color: 'hsl(var(--info))' },
  { name: 'D (60-69)', value: 0, color: 'hsl(var(--warning))' },
  { name: 'F (<60)', value: 0, color: 'hsl(var(--destructive))' }];


  return (
    <div className="page-container">
      <PageHeader
        title="Performance Tracking"
        description="Monitor student and teacher performance metrics" />


      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Avg Student Score"
          value="85%"
          icon={GraduationCap}
          trend={{ value: 5, isPositive: true }} />

        <StatCard
          title="Teacher Rating"
          value="4.5/5"
          icon={Users}
          trend={{ value: 3, isPositive: true }} />

        <StatCard
          title="Pass Rate"
          value="96%"
          icon={TrendingUp}
          description="Above 60%" />

        <StatCard
          title="Top Performers"
          value={2}
          icon={BarChart3}
          description="Above 90%" />

      </div>

      <Tabs defaultValue="students" className="space-y-6">
        <TabsList>
          <TabsTrigger value="students" className="gap-2">
            <GraduationCap className="w-4 h-4" />
            Students
          </TabsTrigger>
          <TabsTrigger value="teachers" className="gap-2">
            <Users className="w-4 h-4" />
            Teachers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Student Scores</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studentChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} />

                    <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Grade Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gradeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value">

                      {gradeDistribution.map((entry, index) =>
                      <Cell key={`cell-${index}`} fill={entry.color} />
                      )}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} />

                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 justify-center mt-4">
                {gradeDistribution.map((grade) =>
                <div key={grade.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: grade.color }} />
                    <span className="text-xs text-muted-foreground">{grade.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Student Performance Table */}
          <div className="card-elevated overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Detailed Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Student</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Assignments</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Quizzes</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Overall</th>
                  </tr>
                </thead>
                <tbody>
                  {mockStudents.map((student) => {
                    const metrics = studentPerformance.filter((p) => p.userId === student.id);
                    const assignmentScore = metrics.find((m) => m.metric === 'Assignment Average')?.value || 0;
                    const quizScore = metrics.find((m) => m.metric === 'Quiz Average')?.value || 0;
                    const overall = Math.round((assignmentScore + quizScore) / 2);

                    return (
                      <tr key={student.id} className="border-b border-border table-row-hover">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {student.name.charAt(0)}
                              </span>
                            </div>
                            <span className="font-medium text-foreground">{student.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground">{assignmentScore}%</td>
                        <td className="p-4 text-muted-foreground">{quizScore}%</td>
                        <td className="p-4">
                          <span className={`font-medium ${overall >= 80 ? 'text-success' : overall >= 60 ? 'text-warning' : 'text-destructive'}`}>
                            {overall}%
                          </span>
                        </td>
                      </tr>);

                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="teachers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockTeachers.map((teacher) => {
              const metrics = teacherPerformance.filter((p) => p.userId === teacher.id);

              return (
                <div key={teacher.id} className="card-elevated p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-info">
                        {teacher.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{teacher.name}</h4>
                      <p className="text-xs text-muted-foreground">{teacher.email}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {metrics.map((metric) =>
                    <div key={metric.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{metric.metric}</span>
                          <span className="font-medium text-foreground">
                            {metric.value}/{metric.maxValue}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${metric.value / metric.maxValue * 100}%` }} />

                        </div>
                      </div>
                    )}
                  </div>
                </div>);

            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>);

}