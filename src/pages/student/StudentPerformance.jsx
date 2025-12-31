import { TrendingUp, Award, Target, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const monthlyPerformance = [
  { month: 'Sep', score: 78 },
  { month: 'Oct', score: 82 },
  { month: 'Nov', score: 80 },
  { month: 'Dec', score: 85 },
  { month: 'Jan', score: 88 }];


const subjectPerformance = [
  { subject: 'CS 101', score: 88 },
  { subject: 'Physics', score: 78 },
  { subject: 'Math', score: 85 },
  { subject: 'English', score: 92 }];


const skills = [
  { name: 'Problem Solving', value: 85 },
  { name: 'Critical Thinking', value: 78 },
  { name: 'Communication', value: 90 },
  { name: 'Teamwork', value: 88 },
  { name: 'Time Management', value: 72 }];


export default function StudentPerformance() {
  return (
    <div className="page-container">
      <PageHeader
        title="My Performance"
        description="Track your academic progress and achievements" />


      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Overall GPA"
          value="3.5"
          icon={Award}
          trend={{ value: 0.2, isPositive: true }} />

        <StatCard
          title="Class Rank"
          value="12/85"
          icon={Target}
          description="Top 15%" />



        <StatCard
          title="Assignments"
          value="95%"
          icon={TrendingUp}
          description="Completion rate" />

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Performance Trend */}
        <div className="card-elevated p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Performance Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[60, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} />

                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }} />

              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Performance */}
        <div className="card-elevated p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Subject Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="subject" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
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
      </div>

      {/* Skills Assessment */}
      <div className="card-elevated p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Skills Assessment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {skills.map((skill, index) =>
            <div
              key={skill.name}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}>

              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-foreground">{skill.name}</span>
                <span className={`font-medium ${skill.value >= 85 ? 'text-success' :
                    skill.value >= 70 ? 'text-primary' : 'text-warning'}`
                }>
                  {skill.value}%
                </span>
              </div>
              <Progress value={skill.value} className="h-2" />
            </div>
          )}
        </div>
      </div>
    </div>);

}