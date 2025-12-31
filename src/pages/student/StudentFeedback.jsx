import { useState, useEffect } from 'react';
import { MessageSquare, Send, CheckCircle, Clock } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { feedbackAPI } from '@/services/api';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function StudentFeedback() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingFeedback, setViewingFeedback] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    message: ''
  });

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
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.subject.trim() || !formData.message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      const response = await feedbackAPI.create(formData);

      if (response.data.success) {
        setSubmitted(true);
        toast.success('Thank you for your feedback!');
        await fetchFeedback();
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewFeedback = () => {
    setSubmitted(false);
    setFormData({ subject: '', message: '' });
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Feedback"
        description="Submit feedback and view admin responses"
      />

      <Tabs defaultValue="submit" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="submit">Submit New</TabsTrigger>
          <TabsTrigger value="history">My Feedback ({feedbackList.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="submit" className="mt-6">
          {submitted ? (
            <div className="max-w-lg mx-auto text-center py-12">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Thank You!</h2>
              <p className="text-muted-foreground mb-6">
                Your feedback has been submitted. We appreciate you taking the time to share your thoughts.
              </p>
              <Button onClick={handleNewFeedback}>
                Submit Another Feedback
              </Button>
            </div>
          ) : (
            <div className="max-w-lg mx-auto">
              <div className="card-elevated p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-lg bg-primary/10">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Student Feedback</h3>
                    <p className="text-sm text-muted-foreground">Help us improve</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="What is your feedback about?"
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Share your thoughts, suggestions, or concerns..."
                      rows={6}
                      className="resize-none"
                      disabled={submitting}
                    />
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">
                      💬 Your feedback will be reviewed by administration.
                    </p>
                  </div>

                  <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
                    <Send className="w-4 h-4 mr-2" />
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p>Loading your feedback...</p>
            </div>
          ) : feedbackList.length === 0 ? (
            <div className="card-elevated p-12 text-center max-w-lg mx-auto">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">No Feedback Yet</h3>
              <p className="text-muted-foreground mb-4">You haven't submitted any feedback</p>
              <Button onClick={() => document.querySelector('[value="submit"]').click()}>
                Submit Your First Feedback
              </Button>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
              {feedbackList.map((feedback, index) => (
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
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Responded
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-warning/10 text-warning flex-shrink-0">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{feedback.message}</p>
                      <div className="text-xs text-muted-foreground">
                        Submitted {format(new Date(feedback.created_at), 'MMM d, yyyy h:mm a')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

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
              <h4 className="text-sm font-medium mb-2">Your Message</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {viewingFeedback?.message}
              </p>
            </div>
            {viewingFeedback?.response ? (
              <div className="bg-success/5 border-l-2 border-success rounded-lg p-4">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Admin Response
                </h4>
                <div className="max-h-64 overflow-y-auto pr-2">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {viewingFeedback.response}
                  </p>
                </div>
                {viewingFeedback.updated_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Responded {format(new Date(viewingFeedback.updated_at), 'MMM d, yyyy h:mm a')}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-muted/50 border border-dashed rounded-lg p-4 text-center">
                <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Waiting for admin response...
                </p>
              </div>
            )}
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