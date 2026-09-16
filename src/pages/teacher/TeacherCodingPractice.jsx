import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Code, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function TeacherCodingPractice() {
  const [questions, setQuestions] = useState([
    { id: 1, title: 'Two Sum', difficulty: 'Easy', description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.' }
  ]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    difficulty: 'Easy',
    description: ''
  });
  const { toast } = useToast();

  const handleCreate = () => {
    if (!formData.title || !formData.description) {
      toast({ title: 'Error', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }
    const newQuestion = {
      id: Date.now(),
      ...formData
    };
    setQuestions([...questions, newQuestion]);
    setIsDialogOpen(false);
    setFormData({ title: '', difficulty: 'Easy', description: '' });
    toast({ title: 'Success', description: 'Coding question created successfully.' });
  };

  const handleDelete = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
    toast({ title: 'Success', description: 'Question deleted successfully.' });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Coding Practice Management" 
        description="Create and manage coding challenges for students." 
        action={
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Question
          </Button>
        }
      />

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
            <CardContent className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => handleDelete(question.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {questions.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground">
            No coding questions created yet.
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Coding Question</DialogTitle>
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
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
