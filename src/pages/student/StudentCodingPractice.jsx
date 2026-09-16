import { useState, useEffect } from 'react';
import { Code, Terminal, Loader2, Play } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { codingPracticeAPI } from '@/services/api';

export default function StudentCodingPractice() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Submit Dialog State
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [codeContent, setCodeContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      toast({ title: 'Error', description: 'Failed to load coding questions.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSubmit = (question) => {
    setSelectedQuestion(question);
    setCodeContent('// Write your code here...\n');
    setIsSubmitOpen(true);
  };

  const handleSubmitCode = async () => {
    if (!codeContent.trim() || codeContent.trim() === '// Write your code here...') {
      toast({ title: 'Error', description: 'Please write some code before submitting.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const response = await codingPracticeAPI.submit(selectedQuestion.id, { code: codeContent });
      if (response.data.success) {
        toast({ 
          title: 'Code Submitted', 
          description: `Status: ${response.data.data.status} | Score: ${response.data.data.score}`
        });
        setIsSubmitOpen(false);
      }
    } catch (error) {
      console.error('Error submitting code:', error);
      toast({ title: 'Error', description: 'Failed to submit code.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Coding Practice" 
        description="Enhance your programming skills with coding challenges and exercises." 
      />

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {questions.map(question => (
            <Card key={question.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-primary" />
                    {question.title}
                  </CardTitle>
                  <Badge variant={question.difficulty === 'Easy' ? 'default' : question.difficulty === 'Medium' ? 'secondary' : 'destructive'}>
                    {question.difficulty}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2 mt-2 text-sm text-foreground/80">
                  {question.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full gap-2" onClick={() => handleOpenSubmit(question)}>
                  <Play className="h-4 w-4" />
                  Solve Challenge
                </Button>
              </CardContent>
            </Card>
          ))}
          {questions.length === 0 && (
            <div className="col-span-full text-center py-10 text-muted-foreground">
              No coding challenges available at the moment.
            </div>
          )}
        </div>
      )}

      {/* Submit Code Dialog */}
      <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Solve: {selectedQuestion?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
              {selectedQuestion?.description}
            </div>
            <div className="space-y-2">
              <Textarea 
                value={codeContent}
                onChange={e => setCodeContent(e.target.value)}
                placeholder="Write your solution here..."
                className="font-mono text-sm h-[300px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubmitOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmitCode} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit Solution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
