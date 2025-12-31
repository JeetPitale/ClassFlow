import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Progress } from '@/components/ui/progress';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { BarChart, Users, BookOpen, Clock, Eye, CheckCircle, Circle, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function AdminSyllabusTracking() {
    const [teachersProgress, setTeachersProgress] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();

    // Detailed View State
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [teacherSyllabus, setTeacherSyllabus] = useState({ topics: [], subtopics: [] });
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(null);

    useEffect(() => {
        fetchProgress();
    }, [token]);

    const fetchProgress = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:8000/api/admin/syllabus-progress', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setTeachersProgress(data.data);
            } else {
                toast({ title: 'Error', description: data.message || 'Failed to fetch data', variant: 'destructive' });
            }
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const fetchTeacherSyllabus = async (teacher) => {
        setSelectedTeacher(teacher);
        setDetailsOpen(true);
        setDetailsLoading(true);
        try {
            const response = await fetch(`http://localhost:8000/api/admin/syllabus/${teacher.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setTeacherSyllabus(data.data);
            } else {
                toast({ title: 'Error', description: 'Failed to fetch syllabus details', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
        } finally {
            setDetailsLoading(false);
        }
    };

    const getStatusColor = (percentage) => {
        if (percentage >= 80) return 'text-success';
        if (percentage >= 50) return 'text-warning';
        return 'text-destructive';
    };

    const getProgressBarColor = (percentage) => {
        if (percentage >= 80) return 'bg-success';
        if (percentage >= 50) return 'bg-warning';
        return 'bg-destructive';
    };

    const getParentTitle = (parentId, topics) => {
        return topics.find(t => t.id === parentId)?.title || 'Unknown';
    };

    return (
        <div className="page-container">
            <PageHeader
                title="Teacher Syllabus Tracking"
                description="Monitor course completion status across all teachers"
            />

            <div className="grid gap-6">
                {loading ? (
                    <div className="text-center py-10">Loading progress data...</div>
                ) : teachersProgress.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">No teachers found or no syllabus data available.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teachersProgress.map((item, index) => (
                            <Card key={item.teacher.id} className="card-elevated hover:shadow-lg transition-shadow flex flex-col">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {item.teacher.name.charAt(0)}
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">{item.teacher.name}</CardTitle>
                                                <CardDescription className="text-xs">{item.teacher.email}</CardDescription>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={`${getStatusColor(item.progress_percentage)} border-current bg-transparent`}>
                                            {item.progress_percentage}%
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Completion</span>
                                                <span className="font-medium">
                                                    {item.completed_topics} / {item.total_topics} Topics
                                                </span>
                                            </div>
                                            <Progress value={item.progress_percentage} className="h-2" indicatorClassName={getProgressBarColor(item.progress_percentage)} />
                                        </div>

                                        <div className="pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                <span>Last Updated:</span>
                                            </div>
                                            <span>
                                                {item.last_updated ? format(new Date(item.last_updated), 'MMM d, h:mm a') : 'Never'}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="secondary" className="w-full" onClick={() => fetchTeacherSyllabus(item.teacher)}>
                                        <Eye className="w-4 h-4 mr-2" /> View Details
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Syllabus Details: {selectedTeacher?.name}</DialogTitle>
                        <div className="hidden" id="admin-dialog-desc">View detailed syllabus progress for this teacher</div>
                    </DialogHeader>

                    {detailsLoading ? (
                        <div className="py-10 text-center">Loading syllabus details...</div>
                    ) : (
                        <ScrollArea className="flex-1 overflow-hidden mt-4 pr-4">
                            <div className="space-y-3">
                                {teacherSyllabus.topics.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground">No topics found.</div>
                                ) : (
                                    teacherSyllabus.topics.map(topic => {
                                        const topicSubtopics = teacherSyllabus.subtopics.filter(s => (s.parent_id || s.parentId) === topic.id);
                                        const isExpanded = activeTab === topic.id;

                                        return (
                                            <div key={topic.id} className={cn("border rounded-lg overflow-hidden transition-all", topic.completed ? "bg-success/5 border-success/20" : "bg-card")}>
                                                <div
                                                    className="p-4 flex items-start gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
                                                    onClick={() => setActiveTab(isExpanded ? null : topic.id)}
                                                >
                                                    {topic.completed ? <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" /> : <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />}
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={cn("font-medium", topic.completed && "text-success")}>{topic.title}</span>
                                                                <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">{topic.weeks}</span>
                                                            </div>
                                                            <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">{topic.description}</p>
                                                        <div className="flex items-center gap-4 mt-2">
                                                            <p className="text-xs text-muted-foreground">
                                                                {topicSubtopics.length} subtopics
                                                            </p>
                                                            {topic.created_at && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    Created: {format(new Date(topic.created_at), 'MMM d, yyyy h:mm a')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Subtopics Accordion Body */}
                                                {isExpanded && (
                                                    <div className="border-t bg-muted/30 p-4 space-y-3 pl-12">
                                                        {topicSubtopics.length === 0 ? (
                                                            <p className="text-sm text-muted-foreground italic">No subtopics defined.</p>
                                                        ) : (
                                                            topicSubtopics.map(subtopic => (
                                                                <div key={subtopic.id} className={cn("border rounded p-3 flex items-start gap-3 bg-background", subtopic.completed ? "border-success/20" : "")}>
                                                                    {subtopic.completed ? <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /> : <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />}
                                                                    <div>
                                                                        <span className={cn("text-sm font-medium block", subtopic.completed && "text-success")}>{subtopic.title}</span>
                                                                        <p className="text-xs text-muted-foreground">{subtopic.description}</p>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </ScrollArea>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
