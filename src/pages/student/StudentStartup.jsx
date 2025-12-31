import { useState, useEffect } from 'react';
import { mockStartupIdeas } from '@/data/mockData';
import { Lightbulb, Upload, CheckCircle, Clock, Paperclip, X } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

import { format } from 'date-fns';

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


export default function StudentStartup() {
  /*
  const [myIdeas, setMyIdeas] = useState(
    mockStartupIdeas.filter(idea => idea.studentId === 's1')
  );
  */
  const [myIdeas, setMyIdeas] = useState([]);
  const [selectedIdea, setSelectedIdea] = useState(null);

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
        setMyIdeas(data.data);
      }
    } catch (error) {
      console.error('Error fetching ideas:', error);
      toast({ title: 'Error', description: 'Failed to load startup ideas', variant: 'destructive' });
    }
  };

  const [formData, setFormData] = useState({
    title: '',
    teamSize: '',
    category: '',
    briefDescription: '',
    problemStatement: '',
    solutionOverview: '',
    targetMarket: '',
    businessModel: '',
    fundingRequired: '',
    currentStage: '',
    tags: ''
  });

  const [attachments, setAttachments] = useState([]);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.category || !formData.briefDescription || !formData.problemStatement || !formData.currentStage) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    const newIdea = {
      // Student ID is handled by backend via token
      title: formData.title,
      teamSize: parseInt(formData.teamSize) || 1,
      category: formData.category,
      briefDescription: formData.briefDescription,
      problemStatement: formData.problemStatement,
      solutionOverview: formData.solutionOverview,
      targetMarket: formData.targetMarket,
      businessModel: formData.businessModel,
      fundingRequired: parseFloat(formData.fundingRequired) || 0,
      currentStage: formData.currentStage,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      attachments: attachments.map((f) => f.name)
    };

    try {
      const token = localStorage.getItem('classflow_token');
      if (!token) {
        toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
        return;
      }

      const response = await fetch('http://localhost:8000/api/startups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newIdea),
      });

      const data = await response.json();

      if (data.success) {
        toast({ title: 'Success', description: 'Your startup idea has been submitted!' });
        fetchIdeas(); // Refresh list

        // Reset form
        setFormData({
          title: '',
          teamSize: '',
          category: '',
          briefDescription: '',
          problemStatement: '',
          solutionOverview: '',
          targetMarket: '',
          businessModel: '',
          fundingRequired: '',
          currentStage: '',
          tags: ''
        });
        setAttachments([]);
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to submit idea', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error submitting idea:', error);
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
    reviewed: Lightbulb,
    approved: CheckCircle,
    rejected: Clock
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Startup Ideas"
        description="Submit your innovative startup ideas for review" />


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Submit Form */}
        <div className="card-elevated p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-lg bg-warning/10">
              <Lightbulb className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Submit New Idea</h3>
              <p className="text-sm text-muted-foreground">Share your entrepreneurial vision</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Idea Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Give your idea a catchy name" />

              </div>

              <div className="space-y-2">
                <Label htmlFor="teamSize">Team Size</Label>
                <Input
                  id="teamSize"
                  type="number"
                  min="1"
                  value={formData.teamSize}
                  onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                  placeholder="Number of team members" />

              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) =>
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Current Stage *</Label>
                <Select value={formData.currentStage} onValueChange={(v) => setFormData({ ...formData, currentStage: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) =>
                      <SelectItem key={stage.value} value={stage.value}>{stage.label}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="briefDescription">Brief Description *</Label>
              <Textarea
                id="briefDescription"
                value={formData.briefDescription}
                onChange={(e) => setFormData({ ...formData, briefDescription: e.target.value })}
                placeholder="Briefly describe your idea in 2-3 sentences"
                rows={2} />

            </div>

            <div className="space-y-2">
              <Label htmlFor="problemStatement">Problem Statement *</Label>
              <Textarea
                id="problemStatement"
                value={formData.problemStatement}
                onChange={(e) => setFormData({ ...formData, problemStatement: e.target.value })}
                placeholder="What problem does your idea solve?"
                rows={3} />

            </div>

            <div className="space-y-2">
              <Label htmlFor="solutionOverview">Solution Overview</Label>
              <Textarea
                id="solutionOverview"
                value={formData.solutionOverview}
                onChange={(e) => setFormData({ ...formData, solutionOverview: e.target.value })}
                placeholder="How does your solution work?"
                rows={3} />

            </div>

            <div className="space-y-2">
              <Label htmlFor="targetMarket">Target Market</Label>
              <Input
                id="targetMarket"
                value={formData.targetMarket}
                onChange={(e) => setFormData({ ...formData, targetMarket: e.target.value })}
                placeholder="Who are your target customers?" />

            </div>

            <div className="space-y-2">
              <Label htmlFor="businessModel">Business Model</Label>
              <Textarea
                id="businessModel"
                value={formData.businessModel}
                onChange={(e) => setFormData({ ...formData, businessModel: e.target.value })}
                placeholder="How will your startup make money?"
                rows={2} />

            </div>

            <div className="space-y-2">
              <Label htmlFor="fundingRequired">Funding Required (₹)</Label>
              <Input
                id="fundingRequired"
                type="number"
                min="0"
                value={formData.fundingRequired}
                onChange={(e) => setFormData({ ...formData, fundingRequired: e.target.value })}
                placeholder="Estimated funding needed" />

            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="AI, FinTech, Healthcare, etc." />

            </div>

            <div className="space-y-2">
              <Label>Attachments (Optional)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="attachments" />

                <label htmlFor="attachments" className="cursor-pointer">
                  <Paperclip className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload files</p>
                </label>
              </div>
              {attachments.length > 0 &&
                <div className="flex flex-wrap gap-2 mt-2">
                  {attachments.map((file, index) =>
                    <Badge key={index} variant="secondary" className="gap-1">
                      {file.name}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeAttachment(index)} />
                    </Badge>
                  )}
                </div>
              }
            </div>

            <Button className="w-full" onClick={handleSubmit}>
              <Upload className="w-4 h-4 mr-2" />
              Submit Idea
            </Button>
          </div>
        </div>

        {/* My Ideas */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">My Submitted Ideas</h2>
          <div className="space-y-4">
            {myIdeas.map((idea, index) => {
              const StatusIcon = statusIcons[idea.status];

              return (
                <div
                  key={idea.id}
                  className="card-elevated p-5 animate-slide-up cursor-pointer hover:border-primary/50 transition-colors"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => setSelectedIdea(idea)}
                >

                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className={statusColors[idea.status]}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {idea.status}
                    </Badge>
                    <Badge variant="outline">{categories.find((c) => c.value === idea.category)?.label}</Badge>
                    <Badge variant="outline">{stages.find((s) => s.value === idea.currentStage)?.label}</Badge>
                  </div>
                  <h4 className="font-medium text-foreground">{idea.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{idea.briefDescription}</p>

                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-muted-foreground">
                    <div><span className="font-medium">Team Size:</span> {idea.teamSize}</div>
                    <div><span className="font-medium">Funding:</span> ₹{idea.fundingRequired.toLocaleString()}</div>
                  </div>

                  {idea.tags.length > 0 &&
                    <div className="flex flex-wrap gap-1 mt-2">
                      {idea.tags.map((tag, i) =>
                        <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                      )}
                    </div>
                  }

                  {idea.adminRemarks &&
                    <div className="bg-muted/50 rounded-lg p-3 mt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Admin Feedback</p>
                      <p className="text-sm text-foreground">{idea.adminRemarks}</p>
                    </div>
                  }
                  <p className="text-xs text-muted-foreground mt-3">
                    Submitted {format(new Date(idea.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>);

            })}
          </div>
        </div>
      </div>

      <Dialog open={!!selectedIdea} onOpenChange={(open) => !open && setSelectedIdea(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {selectedIdea?.title}
              {selectedIdea && (
                <Badge variant="secondary" className={statusColors[selectedIdea.status]}>
                  {selectedIdea.status}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Submitted on {selectedIdea && format(new Date(selectedIdea.createdAt), 'PPP')}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[60vh] pr-4">
            {selectedIdea && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h4 className="font-medium flex items-center gap-2">
                    <Badge variant="outline">{categories.find((c) => c.value === selectedIdea.category)?.label}</Badge>
                    <Badge variant="outline">{stages.find((s) => s.value === selectedIdea.currentStage)?.label}</Badge>
                  </h4>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-1">Brief Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedIdea.briefDescription}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Team Size</h4>
                    <p className="text-sm text-muted-foreground">{selectedIdea.teamSize} members</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Funding Required</h4>
                    <p className="text-sm text-muted-foreground">₹{selectedIdea.fundingRequired.toLocaleString()}</p>
                  </div>
                  {selectedIdea.targetMarket && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Target Market</h4>
                      <p className="text-sm text-muted-foreground">{selectedIdea.targetMarket}</p>
                    </div>
                  )}
                </div>

                {selectedIdea.problemStatement && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Problem Statement</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedIdea.problemStatement}</p>
                  </div>
                )}

                {selectedIdea.solutionOverview && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Solution Overview</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedIdea.solutionOverview}</p>
                  </div>
                )}

                {selectedIdea.businessModel && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Business Model</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedIdea.businessModel}</p>
                  </div>
                )}

                {selectedIdea.tags && selectedIdea.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedIdea.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedIdea.attachments && selectedIdea.attachments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Attachments</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedIdea.attachments.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 border rounded-md text-sm text-muted-foreground">
                          <Paperclip className="w-4 h-4" />
                          {file}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedIdea.adminRemarks && (
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="text-sm font-semibold mb-1">Admin Feedback</h4>
                    <p className="text-sm">{selectedIdea.adminRemarks}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>);

}