import { useState, useEffect } from 'react';
import { Code, Terminal, Loader2, Play, CheckCircle2, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Editor from '@monaco-editor/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { codingPracticeAPI } from '@/services/api';
import { useTheme } from 'next-themes';

export default function StudentCodingPractice() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Submit Dialog State
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [codeContent, setCodeContent] = useState('');
  const [language, setLanguage] = useState(71); // Default Python in Judge0
  
  const [submitting, setSubmitting] = useState(false);
  const [runningSample, setRunningSample] = useState(false);
  const [sampleResults, setSampleResults] = useState(null);

  const { toast } = useToast();
  const { theme } = useTheme();

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isSubmitOpen) {
        toast({ 
          title: 'Warning', 
          description: 'Tab switch detected! Auto-submitting your code.', 
          variant: 'destructive' 
        });
        handleSubmitCode();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isSubmitOpen, codeContent, selectedQuestion]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await codingPracticeAPI.getAll();
      if (response.data.success) {
        setQuestions(response.data.data);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load coding questions.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSubmit = (question) => {
    setSelectedQuestion(question);
    setCodeContent('# Write your python code here...\n\ndef solution():\n    pass\n');
    setSampleResults(null);
    setIsSubmitOpen(true);
  };

  const handleRunSample = async () => {
    if (!codeContent.trim()) {
      toast({ title: 'Error', description: 'Code cannot be empty.', variant: 'destructive' });
      return;
    }

    setRunningSample(true);
    setSampleResults(null);
    try {
      const response = await codingPracticeAPI.runSample(selectedQuestion.id, { code: codeContent, language_id: language });
      if (response.data.success) {
        setSampleResults(response.data.data.results);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Execution failed.', variant: 'destructive' });
    } finally {
      setRunningSample(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!codeContent.trim()) {
      toast({ title: 'Error', description: 'Please write some code before submitting.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const response = await codingPracticeAPI.submit(selectedQuestion.id, { code: codeContent, language_id: language });
      if (response.data.success) {
        const { status, score } = response.data.data;
        toast({ 
          title: 'Code Evaluated', 
          description: `Status: ${status} | Score: ${score}`,
          variant: status === 'Passed' ? 'default' : 'destructive'
        });
        setIsSubmitOpen(false);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to submit code.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const getLanguageString = (id) => {
    const map = { 71: 'python', 63: 'javascript', 62: 'java', 54: 'cpp' };
    return map[id] || 'python';
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Coding Assessments" 
        description="Enhance your programming skills with real-time feedback." 
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
                <CardDescription className="line-clamp-2 mt-2 text-sm">
                  {question.description}
                </CardDescription>
                <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                  <span>⏱ {question.time_limit}s</span>
                  <span>💾 {Math.round(question.memory_limit/1024)}MB</span>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full gap-2" onClick={() => handleOpenSubmit(question)}>
                  <Play className="h-4 w-4" />
                  Solve Challenge
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Code IDE Dialog */}
      <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] max-h-[95vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between pr-8">
              <DialogTitle className="text-xl flex items-center gap-2">
                <Code className="h-5 w-5 text-primary"/> {selectedQuestion?.title}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <select 
                  className="text-sm bg-background border rounded px-2 py-1"
                  value={language}
                  onChange={(e) => setLanguage(parseInt(e.target.value))}
                >
                  <option value={71}>Python</option>
                  <option value={63}>JavaScript</option>
                  <option value={62}>Java</option>
                  <option value={54}>C++</option>
                </select>
                <Button variant="outline" onClick={handleRunSample} disabled={runningSample || submitting}>
                  {runningSample ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Play className="h-4 w-4 mr-2"/>}
                  Run Code
                </Button>
                <Button onClick={handleSubmitCode} disabled={submitting || runningSample}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
                  Submit
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel: Description */}
            <div className="w-1/3 border-r p-6 overflow-y-auto bg-muted/30">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <h3>Problem Description</h3>
                <div className="whitespace-pre-wrap">{selectedQuestion?.description}</div>
                
                <h4 className="mt-6">Constraints</h4>
                <ul>
                  <li>Time Limit: {selectedQuestion?.time_limit}s</li>
                  <li>Memory Limit: {Math.round(selectedQuestion?.memory_limit/1024)}MB</li>
                </ul>
              </div>
              
              {/* Sample Execution Results */}
              {sampleResults && (
                <div className="mt-8 border-t pt-4">
                  <h4 className="font-semibold mb-4">Execution Results</h4>
                  <div className="space-y-4">
                    {sampleResults.map((res, idx) => (
                      <div key={idx} className={`p-3 rounded-md border ${res.passed ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                        <div className="flex items-center gap-2 mb-2 font-medium">
                          {res.passed ? <CheckCircle2 className="h-4 w-4 text-green-500"/> : <XCircle className="h-4 w-4 text-red-500"/>}
                          Test Case {idx + 1}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          <div>
                            <span className="text-muted-foreground">Expected:</span>
                            <pre className="mt-1 p-1 bg-background rounded">{res.expected}</pre>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Actual:</span>
                            <pre className="mt-1 p-1 bg-background rounded">{res.actual}</pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Right Panel: Editor */}
            <div className="w-2/3 h-full">
              <Editor
                height="100%"
                language={getLanguageString(language)}
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                value={codeContent}
                onChange={setCodeContent}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
