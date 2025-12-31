import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { feedbackAPI } from '@/services/api';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function TeacherFeedback() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingFeedback, setViewingFeedback] = useState(null);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const response = await feedbackAPI.getAll();
      if (response.data.success) {
        setFeedbackList(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <p>Loading feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Student Feedback"
        description="View and respond to student feedback"
      />

      <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
        <p className="text-sm text-muted-foreground">
          Review feedback submitted by students to help improve your teaching.
        </p>
      </div>

      <div className="space-y-4">
        {feedbackList.length === 0 ? (
          <div className="card-elevated p-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">No Feedback Yet</h3>
            <p className="text-muted-foreground">Students haven't submitted any feedback</p>
          </div>
        ) : (
          feedbackList.map((feedback, index) => (
            <div
              key={feedback.id}
              className="card-elevated p-5 animate-slide-up cursor-pointer hover:shadow-lg transition-shadow"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => setViewingFeedback(feedback)}
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-muted flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium truncate">{feedback.subject}</h3>
                    {feedback.response ? (
                      <Badge variant="secondary" className="bg-success/10 text-success flex-shrink-0">
                        Responded
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-muted text-muted-foreground flex-shrink-0">
                        Pending
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{feedback.message}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>By {feedback.student_name || 'Student'}</span>
                    <span>•</span>
                    <span>{format(new Date(feedback.created_at), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View Feedback Dialog */}
      <Dialog open={!!viewingFeedback} onOpenChange={() => setViewingFeedback(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <DialogTitle>{viewingFeedback?.subject}</DialogTitle>
                <DialogDescription className="mt-1">
                  Submitted {viewingFeedback && format(new Date(viewingFeedback.created_at), 'MMM d, yyyy h:mm a')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Student Message</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {viewingFeedback?.message}
              </p>
            </div>
            {viewingFeedback?.admin_response && (
              <div className="bg-primary/5 border-l-2 border-primary rounded-lg p-4">
                <h4 className="text-sm font-medium mb-2">Admin Response</h4>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {viewingFeedback.admin_response}
                </p>
                {viewingFeedback.responded_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Responded {format(new Date(viewingFeedback.responded_at), 'MMM d, yyyy h:mm a')}
                  </p>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-1">Submitted By</h4>
                <p className="text-muted-foreground">{viewingFeedback?.student_name || 'Student'}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Status</h4>
                <p className="text-muted-foreground">
                  {viewingFeedback?.admin_response ? 'Responded' : 'Pending Review'}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingFeedback(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}