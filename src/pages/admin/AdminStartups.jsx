import { useState, useEffect } from 'react';
import { Lightbulb, Clock, CheckCircle, XCircle, Eye, Users, IndianRupee, Target } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from
  '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { mockStartupIdeas } from '@/data/mockData';

import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const categories = [
  { value: 'tech', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'finance', label: 'Finance' },
  { value: 'ecommerce', label: 'E-Commerce' },
  { value: 'social', label: 'Social Impact' },
  { value: 'other', label: 'Other' }];


const stages = [
  { value: 'idea', label: 'Idea Stage' },
  { value: 'prototype', label: 'Prototype' },
  { value: 'mvp', label: 'MVP' },
  { value: 'launched', label: 'Launched' },
  { value: 'scaling', label: 'Scaling' }];


export default function AdminStartups() {
  const [ideas, setIdeas] = useState([]);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch ideas from backend
  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    try {
      const token = localStorage.getItem('classflow_token');
      if (!token) return;

      const response = await fetch('http://localhost:8000/api/startups', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setIdeas(data.data);
      }
    } catch (error) {
      console.error('Error fetching ideas:', error);
      toast({ title: 'Error', description: 'Failed to load startup ideas', variant: 'destructive' });
    }
  };

  const pendingIdeas = ideas.filter((i) => i.status === 'pending');
  const reviewedIdeas = ideas.filter((i) => i.status !== 'pending');

  const handleReview = (idea) => {
    setSelectedIdea(idea);
    setRemarks(idea.adminRemarks || '');
    setIsDialogOpen(true);
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedIdea) return;

    try {
      const token = localStorage.getItem('classflow_token');
      if (!token) {
        toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
        return;
      }

      const response = await fetch(`http://localhost:8000/api/startups/${selectedIdea.id}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: status,
          adminRemarks: remarks
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: `Idea ${status === 'approved' ? 'approved' : 'rejected'} successfully`
        });
        fetchIdeas(); // Refresh local list
        setIsDialogOpen(false);
        setSelectedIdea(null);
        setRemarks('');
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to update status', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error updating idea:', error);
      toast({ title: 'Error', description: 'Failed to connect to server', variant: 'destructive' });
    }
  };

  const statusColors = {
    pending: 'bg-warning/10 text-warning',
    reviewed: 'bg-info/10 text-info',
    approved: 'bg-success/10 text-success',
    rejected: 'bg-destructive/10 text-destructive'
  };

  const statusIcons = {
    pending: Clock,
    reviewed: Eye,
    approved: CheckCircle,
    rejected: XCircle
  };

  const IdeaCard = ({ idea, showActions = false, showEdit = false }) => {
    const StatusIcon = statusIcons[idea.status];

    return (
      <div className="card-elevated p-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-warning/10 flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="font-medium text-foreground">{idea.title}</h4>
              <Badge variant="secondary" className={statusColors[idea.status]}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {idea.status}
              </Badge>
              <Badge variant="outline">{categories.find((c) => c.value === idea.category)?.label}</Badge>
              <Badge variant="outline">{stages.find((s) => s.value === idea.currentStage)?.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{idea.briefDescription}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="w-3 h-3" />
                Team: {idea.teamSize}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <IndianRupee className="w-3 h-3" />
                {idea.fundingRequired.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Target className="w-3 h-3" />
                {idea.targetMarket?.slice(0, 30)}...
              </div>
            </div>

            {idea.tags.length > 0 &&
              <div className="flex flex-wrap gap-1 mb-3">
                {idea.tags.map((tag, i) =>
                  <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                )}
              </div>
            }

            {idea.adminRemarks &&
              <div className="bg-muted/50 rounded-lg p-3 mb-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Admin Remarks</p>
                <p className="text-sm text-foreground">{idea.adminRemarks}</p>
              </div>
            }
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                <span>By {idea.studentName}</span>
                <span className="mx-2">•</span>
                <span>{format(new Date(idea.createdAt), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex gap-2">
                {showActions &&
                  <Button size="sm" onClick={() => handleReview(idea)}>
                    Review
                  </Button>
                }
                {showEdit &&
                  <Button size="sm" variant="outline" onClick={() => handleReview(idea)}>
                    Edit
                  </Button>
                }
              </div>
            </div>
          </div>
        </div>
      </div>);

  };

  return (
    <div className="page-container">
      <PageHeader
        title="Startup Ideas"
        description="Review and manage startup ideas submitted by students" />


      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            Pending ({pendingIdeas.length})
          </TabsTrigger>
          <TabsTrigger value="reviewed" className="gap-2">
            <CheckCircle className="w-4 h-4" />
            Reviewed ({reviewedIdeas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingIdeas.length === 0 ?
            <div className="card-elevated p-12 text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-success mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">All reviewed!</h3>
              <p className="text-muted-foreground">No pending startup ideas to review.</p>
            </div> :

            pendingIdeas.map((idea) =>
              <IdeaCard key={idea.id} idea={idea} showActions />
            )
          }
        </TabsContent>

        <TabsContent value="reviewed" className="space-y-4">
          {reviewedIdeas.map((idea) =>
            <IdeaCard key={idea.id} idea={idea} showEdit />
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Review Startup Idea</DialogTitle>
            <DialogDescription>
              Review this idea and provide your feedback.
            </DialogDescription>
          </DialogHeader>
          {selectedIdea &&
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="py-4 space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-foreground">{selectedIdea.title}</h4>
                    <Badge variant="outline">{categories.find((c) => c.value === selectedIdea.category)?.label}</Badge>
                    <Badge variant="outline">{stages.find((s) => s.value === selectedIdea.currentStage)?.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">By {selectedIdea.studentName}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-foreground mb-1">Team Size</p>
                    <p className="text-muted-foreground">{selectedIdea.teamSize} members</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Funding Required</p>
                    <p className="text-muted-foreground">₹{selectedIdea.fundingRequired.toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <p className="font-medium text-foreground mb-1">Brief Description</p>
                  <p className="text-sm text-muted-foreground">{selectedIdea.briefDescription}</p>
                </div>

                <div>
                  <p className="font-medium text-foreground mb-1">Problem Statement</p>
                  <p className="text-sm text-muted-foreground">{selectedIdea.problemStatement}</p>
                </div>

                <div>
                  <p className="font-medium text-foreground mb-1">Solution Overview</p>
                  <p className="text-sm text-muted-foreground">{selectedIdea.solutionOverview}</p>
                </div>

                <div>
                  <p className="font-medium text-foreground mb-1">Target Market</p>
                  <p className="text-sm text-muted-foreground">{selectedIdea.targetMarket}</p>
                </div>

                <div>
                  <p className="font-medium text-foreground mb-1">Business Model</p>
                  <p className="text-sm text-muted-foreground">{selectedIdea.businessModel}</p>
                </div>

                {selectedIdea.tags.length > 0 &&
                  <div>
                    <p className="font-medium text-foreground mb-1">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedIdea.tags.map((tag, i) =>
                        <Badge key={i} variant="outline">{tag}</Badge>
                      )}
                    </div>
                  </div>
                }

                {selectedIdea.attachments && selectedIdea.attachments.length > 0 &&
                  <div>
                    <p className="font-medium text-foreground mb-1">Attachments</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedIdea.attachments.map((file, i) =>
                        <Badge key={i} variant="secondary">{file}</Badge>
                      )}
                    </div>
                  </div>
                }

                <div className="space-y-2 pt-2 border-t">
                  <label className="text-sm font-medium text-foreground">Your Remarks</label>
                  <Textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Add your remarks here..."
                    rows={3} />

                </div>
              </div>
            </ScrollArea>
          }
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleUpdateStatus('rejected')}>

              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button onClick={() => handleUpdateStatus('approved')}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);

}