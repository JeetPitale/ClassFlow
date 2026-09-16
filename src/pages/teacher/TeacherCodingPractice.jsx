import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Code, Trash2, Pencil, Users, CheckCircle, XCircle, Loader2, ListTree, Database } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';

export default function TeacherCodingPractice() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create/Edit Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    difficulty: 'Easy',
    description: '',
    time_limit: 2.0,
    memory_limit: 256000,
    category_tags: '[]'
  });

  // Test Cases Dialog State
  const [testCasesOpen, setTestCasesOpen] = useState(false);
  const [testCases, setTestCases] = useState([]);
  const [loadingTestCases, setLoadingTestCases] = useState(false);
  const [newTestCase, setNewTestCase] = useState({ input_data: '', expected_output: '', is_hidden: true, weight: 10 });
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // Submissions Dialog State
  const [submissionsOpen, setSubmissionsOpen] = useState(false);
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
    setFormData({ title: '', difficulty: 'Easy', description: '', time_limit: 2.0, memory_limit: 256000, category_tags: '[]' });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (question) => {
    setEditingId(question.id);
    setFormData({ 
      title: question.title, 
      difficulty: question.difficulty, 
      description: question.description,
      time_limit: question.time_limit || 2.0,
      memory_limit: question.memory_limit || 256000,
      category_tags: question.category_tags || '[]'
    });
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

  const handleViewTestCases = async (question) => {
    setSelectedQuestion(question);
    setTestCasesOpen(true);
    fetchTestCases(question.id);
  };

  const fetchTestCases = async (id) => {
    setLoadingTestCases(true);
    try {
      const res = await codingPracticeAPI.getTestCases(id);
      if (res.data.success) setTestCases(res.data.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load testcases.', variant: 'destructive' });
    } finally {
      setLoadingTestCases(false);
    }
  };

  const handleAddTestCase = async () => {
    if (!newTestCase.input_data || !newTestCase.expected_output) {
      toast({ title: 'Error', description: 'Input and output required.', variant: 'destructive' });
      return;
    }
    try {
      const res = await codingPracticeAPI.addTestCase(selectedQuestion.id, newTestCase);
      if (res.data.success) {
        toast({ title: 'Success', description: 'Test case added.' });
        setNewTestCase({ input_data: '', expected_output: '', is_hidden: true, weight: 10 });
        fetchTestCases(selectedQuestion.id);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add testcase.', variant: 'destructive' });
    }
  };

  const handleDeleteTestCase = async (id) => {
    try {
      const res = await codingPracticeAPI.deleteTestCase(id);
      if (res.data.success) {
        toast({ title: 'Success', description: 'Testcase deleted.' });
        fetchTestCases(selectedQuestion.id);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete testcase.', variant: 'destructive' });
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
              <CardContent className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="gap-2 flex-1" onClick={() => handleViewTestCases(question)}>
                  <Database className="h-4 w-4" /> Test Cases
                </Button>
                <Button variant="outline" size="sm" className="gap-2 flex-1" onClick={() => handleViewSubmissions(question)}>
                  <Users className="h-4 w-4" /> Subs
                </Button>
                <div className="flex gap-2 w-full mt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenEdit(question)}>
                    <Pencil className="h-4 w-4 text-primary mr-2" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDelete(question.id)}>
                    <Trash2 className="h-4 w-4 text-destructive mr-2" /> Delete
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.difficulty}
                  onChange={e => setFormData({...formData, difficulty: e.target.value})}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Time Limit (seconds)</Label>
                <Input 
                  type="number"
                  step="0.1"
                  value={formData.time_limit}
                  onChange={e => setFormData({...formData, time_limit: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description & Constraints (Markdown Supported)</Label>
              <Textarea 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Describe the problem, input format, and constraints..."
                rows={8}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingId ? 'Save Changes' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Cases Dialog */}
      <Dialog open={testCasesOpen} onOpenChange={setTestCasesOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Test Cases: {selectedQuestion?.title}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-4 border-r pr-4">
              <h3 className="font-semibold text-sm">Add New Test Case</h3>
              <div className="space-y-2">
                <Label>Input Data</Label>
                <Textarea value={newTestCase.input_data} onChange={e => setNewTestCase({...newTestCase, input_data: e.target.value})} className="font-mono text-xs" rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Expected Output</Label>
                <Textarea value={newTestCase.expected_output} onChange={e => setNewTestCase({...newTestCase, expected_output: e.target.value})} className="font-mono text-xs" rows={3} />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="hidden" checked={newTestCase.is_hidden} onCheckedChange={(c) => setNewTestCase({...newTestCase, is_hidden: c})} />
                  <label htmlFor="hidden" className="text-sm">Hidden Test Case</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Label>Weight</Label>
                  <Input type="number" value={newTestCase.weight} onChange={e => setNewTestCase({...newTestCase, weight: parseInt(e.target.value)})} className="w-20" />
                </div>
              </div>
              <Button className="w-full" onClick={handleAddTestCase}>Add Test Case</Button>
            </div>
            
            <div className="space-y-4 pl-4">
              <h3 className="font-semibold text-sm">Existing Test Cases ({testCases.length})</h3>
              <ScrollArea className="h-[400px]">
                {loadingTestCases ? (
                  <div className="flex justify-center p-4"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground"/></div>
                ) : (
                  <div className="space-y-3">
                    {testCases.map((tc, idx) => (
                      <Card key={tc.id} className="p-3 text-sm relative">
                        <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-destructive" onClick={() => handleDeleteTestCase(tc.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="flex gap-2 items-center mb-2">
                          <span className="font-bold">Test Case #{idx + 1}</span>
                          <Badge variant={tc.is_hidden ? 'secondary' : 'default'}>{tc.is_hidden ? 'Hidden' : 'Visible'}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <span className="text-xs text-muted-foreground block">Input:</span>
                            <pre className="bg-muted p-1 rounded text-xs overflow-x-auto">{tc.input_data}</pre>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">Expected:</span>
                            <pre className="bg-muted p-1 rounded text-xs overflow-x-auto">{tc.expected_output}</pre>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
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
