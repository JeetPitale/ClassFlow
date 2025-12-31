import { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, Clock, Send } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { feedbackAPI } from '@/services/api';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminFeedback() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  const pendingFeedback = feedbackList.filter((f) => !f.response);
  const reviewedFeedback = feedbackList.filter((f) => f.response);

  const handleReview = (feedback) => {
    setSelectedFeedback(feedback);
    setRemarks(feedback.response || '');
    setIsDialogOpen(true);
  };

  const handleSubmitRemarks = async () => {
    console.log('Submit button clicked!');
    console.log('Selected feedback:', selectedFeedback);
    console.log('Remarks:', remarks);

    if (!selectedFeedback || !remarks.trim()) {
      toast.error('Please enter remarks');
      return;
    }

    try {
      setSubmitting(true);
      console.log('Calling API with ID:', selectedFeedback.id, 'Remarks:', remarks);

      const response = await feedbackAPI.respond(selectedFeedback.id, remarks);
      console.log('API Response:', response);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);

      if (response.data && (response.data.success || response.status === 200)) {
        toast.success('Review submitted successfully');
        setIsDialogOpen(false);
        setSelectedFeedback(null);
        setRemarks('');
        await fetchFeedback();
      } else {
        toast.error('Unexpected response');
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Failed to submit review: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const FeedbackCard = ({ feedback, showReviewButton = false }) => (
    <div className="card-elevated p-5">
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-lg bg-muted flex-shrink-0">
          <MessageSquare className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium">{feedback.subject}</h3>
            {feedback.response ? (
              <Badge variant="secondary" className="bg-success/10 text-success">
                <CheckCircle className="w-3 h-3 mr-1" />
                Reviewed
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-warning/10 text-warning">
                <Clock className="w-3 h-3 mr-1" />
                Pending
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2">{feedback.message}</p>
          {feedback.response && (
            <div className="bg-muted/50 rounded-lg p-3 mt-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Admin Remarks</p>
              <p className="text-sm text-foreground">{feedback.response}</p>
            </div>
          )}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>By {feedback.student_name || 'Student'}</span>
              <span>•</span>
              <span>{format(new Date(feedback.created_at), 'MMM d, yyyy h:mm a')}</span>
            </div>
            {showReviewButton && (
              <Button size="sm" onClick={() => handleReview(feedback)}>
                <Send className="w-4 h-4 mr-2" />
                Review
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

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
        title="Feedback Review"
        description="Review and respond to student feedback"
      />

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            Pending ({pendingFeedback.length})
          </TabsTrigger>
          <TabsTrigger value="reviewed" className="gap-2">
            <CheckCircle className="w-4 h-4" />
            Reviewed ({reviewedFeedback.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingFeedback.length === 0 ? (
            <div className="card-elevated p-12 text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-success mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">All caught up!</h3>
              <p className="text-muted-foreground">No pending feedback to review.</p>
            </div>
          ) : (
            pendingFeedback.map((feedback) => (
              <FeedbackCard key={feedback.id} feedback={feedback} showReviewButton />
            ))
          )}
        </TabsContent>

        <TabsContent value="reviewed" className="space-y-4">
          {reviewedFeedback.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No reviewed feedback yet</p>
            </div>
          ) : (
            reviewedFeedback.map((feedback) => (
              <FeedbackCard key={feedback.id} feedback={feedback} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Feedback</DialogTitle>
            <DialogDescription>
              Add your remarks to this feedback.
            </DialogDescription>
          </DialogHeader>
          {selectedFeedback && (
            <div className="py-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Subject</h4>
                <p className="text-sm text-muted-foreground">{selectedFeedback.subject}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-2">Message</h4>
                <p className="text-sm text-foreground">{selectedFeedback.message}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Your Remarks *</label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add your remarks here..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmitRemarks} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}