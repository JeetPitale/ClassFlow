import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CheckCircle, Circle, Plus, Edit, Trash2, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function TeacherSyllabus() {
  const [syllabus, setSyllabus] = useState([]);
  const [subtopics, setSubtopics] = useState([]);
  const [activeTab, setActiveTab] = useState('main');
  const { token } = useAuth();

  // Dialog states
  const [topicDialogOpen, setTopicDialogOpen] = useState(false);
  const [subtopicDialogOpen, setSubtopicDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSubtopicDialogOpen, setDeleteSubtopicDialogOpen] = useState(false);

  // Edit states
  const [editingTopic, setEditingTopic] = useState(null);
  const [editingSubtopic, setEditingSubtopic] = useState(null);
  const [deletingTopicId, setDeletingTopicId] = useState(null);
  const [deletingSubtopicId, setDeletingSubtopicId] = useState(null);

  // Form states
  const [topicForm, setTopicForm] = useState({ title: '', description: '', weeks: '' });
  const [subtopicForm, setSubtopicForm] = useState({ parentId: '', title: '', description: '' });

  const completedCount = syllabus.filter((item) => item.completed).length;
  // Prevent division by zero
  const progress = syllabus.length > 0 ? (completedCount / syllabus.length * 100) : 0;

  const fetchData = async () => {
    try {
      const response = await fetch('https://classflow-backend-jeet.azurewebsites.net/api/syllabus', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSyllabus(data.data.topics);
        setSubtopics(data.data.subtopics);
      }
    } catch (error) {
      console.error('Failed to fetch syllabus:', error);
      toast({ title: 'Error', description: 'Failed to fetch syllabus data', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const toggleComplete = async (id) => {
    try {
      const response = await fetch(`https://classflow-backend-jeet.azurewebsites.net/api/syllabus/topics/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setSyllabus(syllabus.map((item) =>
          item.id === id ? { ...item, completed: !item.completed } : item
        ));
      } else {
        throw new Error('Failed to toggle');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const toggleSubtopicComplete = async (id) => {
    try {
      const response = await fetch(`https://classflow-backend-jeet.azurewebsites.net/api/syllabus/subtopics/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setSubtopics(subtopics.map((item) =>
          item.id === id ? { ...item, completed: !item.completed } : item
        ));
      } else {
        throw new Error('Failed to toggle');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  // Topic CRUD
  const openTopicDialog = (topic) => {
    if (topic) {
      setEditingTopic(topic);
      setTopicForm({ title: topic.title, description: topic.description, weeks: topic.weeks });
    } else {
      setEditingTopic(null);
      setTopicForm({ title: '', description: '', weeks: '' });
    }
    setTopicDialogOpen(true);
  };

  const saveTopic = async () => {
    if (!topicForm.title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }

    try {
      const url = editingTopic
        ? `https://classflow-backend-jeet.azurewebsites.net/api/syllabus/topics/${editingTopic.id}`
        : 'https://classflow-backend-jeet.azurewebsites.net/api/syllabus/topics';
      const method = editingTopic ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(topicForm)
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: editingTopic ? 'Topic updated' : 'Topic added' });
        fetchData();
        setTopicDialogOpen(false);
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Operation failed', variant: 'destructive' });
    }
  };

  const confirmDeleteTopic = (id) => {
    setDeletingTopicId(id);
    setDeleteDialogOpen(true);
  };

  const deleteTopic = async () => {
    if (!deletingTopicId) return;
    try {
      const response = await fetch(`https://classflow-backend-jeet.azurewebsites.net/api/syllabus/topics/${deletingTopicId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast({ title: 'Success', description: 'Topic deleted' });
        fetchData();
      } else {
        toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Operation failed', variant: 'destructive' });
    }
    setDeleteDialogOpen(false);
    setDeletingTopicId(null);
  };

  // Subtopic CRUD
  const openSubtopicDialog = (subtopic) => {
    if (subtopic) {
      setEditingSubtopic(subtopic);
      setSubtopicForm({ parentId: subtopic.parent_id || subtopic.parentId, title: subtopic.title, description: subtopic.description });
    } else {
      setEditingSubtopic(null);
      setSubtopicForm({ parentId: syllabus[0]?.id || '', title: '', description: '' });
    }
    setSubtopicDialogOpen(true);
  };

  const saveSubtopic = async () => {
    if (!subtopicForm.title.trim() || !subtopicForm.parentId) {
      toast({ title: 'Error', description: 'Parent topic and title are required', variant: 'destructive' });
      return;
    }

    try {
      const url = editingSubtopic
        ? `https://classflow-backend-jeet.azurewebsites.net/api/syllabus/subtopics/${editingSubtopic.id}`
        : 'https://classflow-backend-jeet.azurewebsites.net/api/syllabus/subtopics';
      const method = editingSubtopic ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(subtopicForm)
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: editingSubtopic ? 'Subtopic updated' : 'Subtopic added' });
        fetchData();
        setSubtopicDialogOpen(false);
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Operation failed', variant: 'destructive' });
    }
  };

  const confirmDeleteSubtopic = (id) => {
    setDeletingSubtopicId(id);
    setDeleteSubtopicDialogOpen(true);
  };

  const deleteSubtopic = async () => {
    if (!deletingSubtopicId) return;

    try {
      const response = await fetch(`https://classflow-backend-jeet.azurewebsites.net/api/syllabus/subtopics/${deletingSubtopicId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast({ title: 'Success', description: 'Subtopic deleted' });
        fetchData();
      } else {
        toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Operation failed', variant: 'destructive' });
    }
    setDeleteSubtopicDialogOpen(false);
    setDeletingSubtopicId(null);
  };

  const getParentTitle = (parentId) => {
    return syllabus.find((s) => s.id === parentId)?.title || 'Unknown';
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Syllabus Tracking"
        description="Track your course progress and covered topics" />


      {/* Progress Overview */}
      <div className="card-elevated p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">Course Progress</h3>
            <p className="text-sm text-muted-foreground">
              {completedCount} of {syllabus.length} topics completed
            </p>
          </div>
          <div className="text-2xl font-bold text-primary">
            {Math.round(progress)}%
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="main">Main Topics</TabsTrigger>
          <TabsTrigger value="subtopics">Subtopics</TabsTrigger>
        </TabsList>

        <TabsContent value="main" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openTopicDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Topic
            </Button>
          </div>

          <div className="space-y-3">
            {syllabus.map((item, index) =>
              <div
                key={item.id}
                className={cn(
                  'card-elevated p-5 transition-all duration-200 animate-slide-up',
                  item.completed && 'bg-success/5 border-success/20'
                )}
                style={{ animationDelay: `${index * 50}ms` }}>

                <div className="flex items-start gap-4">
                  <button
                    className={cn(
                      'hidden sm:block mt-0.5 rounded-full transition-colors',
                      item.completed ? 'text-success' : 'text-muted-foreground hover:text-primary'
                    )}
                    onClick={() => toggleComplete(item.id)}>

                    {item.completed ?
                      <CheckCircle className="w-6 h-6" /> :

                      <Circle className="w-6 h-6" />
                    }
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={cn(
                        'font-medium',
                        item.completed ? 'text-success' : 'text-foreground'
                      )}>
                        {item.title}
                      </h4>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded whitespace-nowrap">
                        {item.weeks}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-xs text-muted-foreground">
                        {subtopics.filter((s) => (s.parent_id || s.parentId) === item.id).length} subtopics
                      </p>
                      {item.created_at && (
                        <p className="text-xs text-muted-foreground">
                          Created: {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openTopicDialog(item)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => confirmDeleteTopic(item.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="subtopics" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openSubtopicDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Subtopic
            </Button>
          </div>

          <div className="space-y-3">
            {subtopics.map((item, index) =>
              <div
                key={item.id}
                className={cn(
                  'card-elevated p-5 transition-all duration-200 animate-slide-up',
                  item.completed && 'bg-success/5 border-success/20'
                )}
                style={{ animationDelay: `${index * 50}ms` }}>

                <div className="flex items-start gap-4">
                  <button
                    className={cn(
                      'mt-0.5 rounded-full transition-colors',
                      item.completed ? 'text-success' : 'text-muted-foreground hover:text-primary'
                    )}
                    onClick={() => toggleSubtopicComplete(item.id)}>

                    {item.completed ?
                      <CheckCircle className="w-6 h-6" /> :

                      <Circle className="w-6 h-6" />
                    }
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col items-start gap-1 mb-1 sm:flex-row sm:items-center sm:gap-2">
                      <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded flex items-center gap-1 max-w-full overflow-hidden">
                        <span className="truncate max-w-[150px]">{getParentTitle(item.parent_id || item.parentId)}</span>
                        <ChevronRight className="w-3 h-3 flex-shrink-0" />
                      </span>
                      <h4 className={cn(
                        'font-medium',
                        item.completed ? 'text-success' : 'text-foreground'
                      )}>
                        {item.title}
                      </h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openSubtopicDialog(item)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => confirmDeleteSubtopic(item.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Topic Dialog */}
      <Dialog open={topicDialogOpen} onOpenChange={setTopicDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTopic ? 'Edit Topic' : 'Add New Topic'}</DialogTitle>
            <div className="hidden" id="topic-desc">Fill in the details for the topic</div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={topicForm.title}
                onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                placeholder="Topic title" />

            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={topicForm.description}
                onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                placeholder="Topic description" />

            </div>
            <div className="space-y-2">
              <Label>Weeks</Label>
              <Input
                value={topicForm.weeks}
                onChange={(e) => setTopicForm({ ...topicForm, weeks: e.target.value })}
                placeholder="e.g., Week 1-2" />

            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTopicDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveTopic}>{editingTopic ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subtopic Dialog */}
      <Dialog open={subtopicDialogOpen} onOpenChange={setSubtopicDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubtopic ? 'Edit Subtopic' : 'Add New Subtopic'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Parent Topic</Label>
              <Select
                value={subtopicForm.parentId ? subtopicForm.parentId.toString() : ''}
                onValueChange={(value) => setSubtopicForm({ ...subtopicForm, parentId: value })}>

                <SelectTrigger>
                  <SelectValue placeholder="Select parent topic" />
                </SelectTrigger>
                <SelectContent>
                  {syllabus.map((topic) =>
                    <SelectItem key={topic.id} value={topic.id.toString()}>
                      {topic.title}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={subtopicForm.title}
                onChange={(e) => setSubtopicForm({ ...subtopicForm, title: e.target.value })}
                placeholder="Subtopic title" />

            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={subtopicForm.description}
                onChange={(e) => setSubtopicForm({ ...subtopicForm, description: e.target.value })}
                placeholder="Subtopic description" />

            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubtopicDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveSubtopic}>{editingSubtopic ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Topic Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Topic?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this topic and all its subtopics. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteTopic} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Subtopic Confirmation */}
      <AlertDialog open={deleteSubtopicDialogOpen} onOpenChange={setDeleteSubtopicDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subtopic?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this subtopic. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSubtopic} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);

}