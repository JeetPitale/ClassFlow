import { assignmentAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { ClipboardList, Calendar, Award, FileText } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function StudentAssignments() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const response = await assignmentAPI.getAll();
                if (response.data.success) {
                    setAssignments(response.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch assignments", error);
                toast({ title: "Error", description: "Failed to load assignments", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchAssignments();
        }
    }, [user, toast]);

    // Filter locally by semester if the API returns all
    const studentAssignments = assignments.filter(a => !user?.semester || a.semester == user.semester);

    return (
        <div className="page-container">
            <PageHeader
                title="My Assignments"
                description="View and submit your course assignments"
            />


            <div className="grid gap-6">
                {studentAssignments.length > 0 ? (
                    studentAssignments.map((assignment, index) => {
                        return (
                            <div
                                key={assignment.id}
                                className="card-elevated p-6 animate-slide-up cursor-pointer hover:border-primary/50 transition-colors"
                                style={{ animationDelay: `${index * 50}ms` }}
                                onClick={() => {
                                    setSelectedAssignment(assignment);
                                    setIsDialogOpen(true);
                                }}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-foreground">{assignment.title}</h3>
                                                </div>
                                                <p className="text-muted-foreground line-clamp-2">{assignment.description}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4" />
                                                Due: {assignment.due_date ? format(new Date(assignment.due_date), 'MMM d, yyyy h:mm a') : 'No Date'}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Award className="w-4 h-4" />
                                                {assignment.total_marks} Marks
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center text-muted-foreground p-8">
                        No assignments found for your semester.
                    </div>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedAssignment?.title}</DialogTitle>
                        <DialogDescription>
                            Assignment Details
                        </DialogDescription>
                    </DialogHeader>
                    {selectedAssignment && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Description</h4>
                                <p className="text-base leading-relaxed">{selectedAssignment.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-muted/30 rounded-lg">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-xs font-medium uppercase">Due Date</span>
                                    </div>
                                    <p className="font-medium">
                                        {selectedAssignment.due_date ? format(new Date(selectedAssignment.due_date), 'PPP p') : 'No Date'}
                                    </p>
                                </div>
                                <div className="p-3 bg-muted/30 rounded-lg">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <Award className="w-4 h-4" />
                                        <span className="text-xs font-medium uppercase">Total Marks</span>
                                    </div>
                                    <p className="font-medium">{selectedAssignment.total_marks}</p>
                                </div>
                            </div>

                            {selectedAssignment.attachment_path && (
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Attachments</h4>
                                    <div className="flex flex-wrap gap-2">
                                        <a
                                            href={`http://localhost:8000/${selectedAssignment.attachment_path}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="no-underline"
                                        >
                                            <Badge variant="secondary" className="py-2 px-3 flex items-center gap-2 hover:bg-muted cursor-pointer transition-colors">
                                                <FileText className="w-4 h-4" />
                                                Download Attachment
                                            </Badge>
                                        </a>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 flex justify-end">
                                <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
