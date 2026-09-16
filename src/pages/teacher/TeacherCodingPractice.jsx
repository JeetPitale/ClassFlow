import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Code, Trash2, Pencil, Users, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { codingPracticeAPI } from '@/services/api';

export default function TeacherCodingPractice() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create/Edit Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    difficulty: 'Easy',
    description: ''
  });

  // Submissions Dialog State
  const [submissionsOpen, setSubmissionsOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await codingPracticeAPI.getAll();
      if (response.data.success) {
        setQuestions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({ title: 'Error', description: 'Failed to load questions.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ title: '', difficulty: 'Easy', description: '' });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (question) => {
    setEditingId(question.id);
    setFormData({ title: question.title, difficulty: question.difficulty, description: question.description });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description) {
      toast({ title: 'Error', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }
    
    try {
      if (editingId) {
        const res = await codingPracticeAPI.update(editingId, formData);
        if (res.data.success) {
          toast({ title: 'Success', description: 'Coding question updated successfully.' });
          fetchQuestions();
        }
      } else {
        const res = await codingPracticeAPI.create(formData);
        if (res.data.success) {
          toast({ title: 'Success', description: 'Coding question created successfully.' });
          fetchQuestions();
        }
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving question:', error);
      toast({ title: 'Error', description: 'Failed to save question.', variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await codingPracticeAPI.delete(id);
      if (res.data.success) {
        toast({ title: 'Success', description: 'Question deleted successfully.' });
        fetchQuestions();
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({ title: 'Error', description: 'Failed to delete question.', variant: 'destructive' });
    }
  };

  const handleViewSubmissions = async (question) => {
    setSelectedQuestion(question);
    setSubmissionsOpen(true);
    setLoadingSubmissions(true);
    try {
      const res = await codingPracticeAPI.getSubmissions(question.id);
      if (res.data.success) {
        setSubmissions(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({ title: 'Error', description: 'Failed to fetch submissions.', variant: 'destructive' });
    } finally {
      setLoadingSubmissions(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="section-title">Coding Practice Management</h1>
          <p className="section-subtitle mb-0">Create and manage coding challenges for students.</p>
        </div>
        <div className="flex-shrink-0 mt-1">
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Question
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {questions.map(question => (
            <Card key={question.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Code className="h-5 w-5 text-primary" />
                    {question.title}
                  </CardTitle>
                  <Badge variant={question.difficulty === 'Easy' ? 'default' : question.difficulty === 'Medium' ? 'secondary' : 'destructive'}>
                    {question.difficulty}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2 mt-2">
                  {question.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-between items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => handleViewSubmissions(question)}>
                  <Users className="h-4 w-4" />
                  Submissions
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEdit(question)}>
                    <Pencil className="h-4 w-4 text-primary" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(question.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {questions.length === 0 && (
            <div className="col-span-full text-center py-10 text-muted-foreground">
              No coding questions created yet.
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Coding Question' : 'Create Coding Question'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Question Title</Label>
              <Input 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. Two Sum" 
              />
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.difficulty}
                onChange={e => setFormData({...formData, difficulty: e.target.value})}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Describe the problem, input format, and constraints..."
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingId ? 'Save Changes' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Submissions Dialog */}
      <Dialog open={submissionsOpen} onOpenChange={setSubmissionsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submissions: {selectedQuestion?.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[300px] mt-4 rounded-md border p-4">
            {loadingSubmissions ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                No submissions yet.
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                    <div>
                      <p className="font-medium text-sm">{sub.studentName}</p>
                      <p className="text-xs text-muted-foreground">Submitted: {new Date(sub.submitted_at).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{sub.score}</Badge>
                      <div className="flex items-center gap-1">
                        {sub.status === 'Passed' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                        <span className={`text-sm font-medium ${sub.status === 'Passed' ? 'text-green-500' : 'text-destructive'}`}>
                          {sub.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
