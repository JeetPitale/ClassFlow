import { useState, useEffect, useRef, useCallback } from 'react';
import { Code, Terminal, Loader2, Play, CheckCircle2, XCircle, Clock, Timer } from 'lucide-react';
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

const LANGUAGE_TEMPLATES = {
  71: `# Python 3
def solution():
    # Write your solution here
    pass

if __name__ == '__main__':
    solution()
`,
  63: `// JavaScript (Node.js)
function solution() {
    // Write your solution here
}

solution();
`,
  62: `// Java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        // Write your solution here
        Scanner scanner = new Scanner(System.in);
    }
}
`,
  54: `// C++
#include <iostream>
using namespace std;

int main() {
    // Write your solution here
    return 0;
}
`
};

export default function StudentCodingPractice() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Submit Dialog State
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [codeContent, setCodeContent] = useState(LANGUAGE_TEMPLATES[71]);
  const [language, setLanguage] = useState(71); // Default Python in Judge0
  const [codesByLanguage, setCodesByLanguage] = useState({ ...LANGUAGE_TEMPLATES });

  const [submitting, setSubmitting] = useState(false);
  const [runningSample, setRunningSample] = useState(false);
  const [sampleResults, setSampleResults] = useState(null);

  // Timer State
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);
  const autoSubmittedRef = useRef(false);

  // Refs for callbacks & listeners
  const codeContentRef = useRef(codeContent);
  const languageRef = useRef(language);
  const selectedQuestionRef = useRef(selectedQuestion);
  const isSubmitOpenRef = useRef(isSubmitOpen);
  const submittingRef = useRef(submitting);

  const { toast } = useToast();
  const { theme } = useTheme();

  useEffect(() => {
    codeContentRef.current = codeContent;
  }, [codeContent]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    selectedQuestionRef.current = selectedQuestion;
  }, [selectedQuestion]);

  useEffect(() => {
    isSubmitOpenRef.current = isSubmitOpen;
  }, [isSubmitOpen]);

  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleSubmitCode = useCallback(async (isAuto = false) => {
    const currentCode = codeContentRef.current;
    const currentQuestion = selectedQuestionRef.current;
    const currentLang = languageRef.current;

    if (!currentQuestion) return;

    if (!currentCode || !currentCode.trim()) {
      if (!isAuto) {
        toast({ title: 'Error', description: 'Please write some code before submitting.', variant: 'destructive' });
      }
      return;
    }

    if (submittingRef.current) return;

    clearInterval(timerRef.current);
    setSubmitting(true);
    submittingRef.current = true;

    try {
      const response = await codingPracticeAPI.submit(currentQuestion.id, {
        code: currentCode,
        language_id: currentLang
      });

      if (response.data.success) {
        const { status, score } = response.data.data;
        toast({
          title: isAuto ? 'Auto-Submitted on Tab Switch' : 'Code Evaluated',
          description: `Status: ${status} | Score: ${score}`,
          variant: status === 'Passed' ? 'default' : 'destructive'
        });
        setIsSubmitOpen(false);
      } else {
        toast({
          title: 'Submission Error',
          description: response.data.message || 'Submission failed.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Failed to submit code.';
      toast({
        title: 'Submission Error',
        description: msg,
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  }, [toast]);

  // Tab switch detection - auto-submit immediately
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isSubmitOpenRef.current && !autoSubmittedRef.current && !submittingRef.current) {
        autoSubmittedRef.current = true;
        toast({
          title: '⚠️ Tab Switch Detected!',
          description: 'You switched tabs. Your code is being automatically submitted.',
          variant: 'destructive'
        });
        handleSubmitCode(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleSubmitCode, toast]);

  // Timer countdown effect
  useEffect(() => {
    if (!isSubmitOpen || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (!autoSubmittedRef.current && !submittingRef.current) {
            autoSubmittedRef.current = true;
            toast({
              title: "⏰ Time's Up!",
              description: 'Your code has been auto-submitted.',
              variant: 'destructive'
            });
            handleSubmitCode(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isSubmitOpen, timeLeft > 0, handleSubmitCode, toast]);

  // Cleanup timer when dialog closes
  useEffect(() => {
    if (!isSubmitOpen) {
      clearInterval(timerRef.current);
      autoSubmittedRef.current = false;
    }
  }, [isSubmitOpen]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeLeft <= 60) return 'text-red-500 animate-pulse';
    if (timeLeft <= 300) return 'text-orange-500';
    return 'text-green-500';
  };

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
    const initialTemplates = { ...LANGUAGE_TEMPLATES };
    setCodesByLanguage(initialTemplates);
    setLanguage(71);
    setCodeContent(initialTemplates[71]);
    codeContentRef.current = initialTemplates[71];
    languageRef.current = 71;
    selectedQuestionRef.current = question;
    setSampleResults(null);
    autoSubmittedRef.current = false;
    const timeLimitSeconds = Math.max(parseInt(question.time_limit) || 120, 60);
    setTimeLeft(timeLimitSeconds);
    setIsSubmitOpen(true);
  };

  const handleCodeChange = (newVal) => {
    const updated = newVal ?? '';
    setCodeContent(updated);
    codeContentRef.current = updated;
    setCodesByLanguage(prev => ({
      ...prev,
      [languageRef.current]: updated
    }));
  };

  const handleLanguageChange = (newLangId) => {
    const langId = parseInt(newLangId);
    setLanguage(langId);
    languageRef.current = langId;
    const nextCode = codesByLanguage[langId] !== undefined ? codesByLanguage[langId] : (LANGUAGE_TEMPLATES[langId] || '');
    setCodeContent(nextCode);
    codeContentRef.current = nextCode;
  };

  const handleRunSample = async () => {
    const currentCode = codeContentRef.current;
    const currentQuestion = selectedQuestionRef.current;
    const currentLang = languageRef.current;

    if (!currentCode || !currentCode.trim()) {
      toast({ title: 'Error', description: 'Code cannot be empty.', variant: 'destructive' });
      return;
    }

    setRunningSample(true);
    setSampleResults(null);
    try {
      const response = await codingPracticeAPI.runSample(currentQuestion.id, {
        code: currentCode,
        language_id: currentLang
      });
      if (response.data.success) {
        setSampleResults(response.data.data.results);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Execution failed.', variant: 'destructive' });
    } finally {
      setRunningSample(false);
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
                  <span>💾 {Math.round(question.memory_limit / 1024)}MB</span>
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
                <Code className="h-5 w-5 text-primary" /> {selectedQuestion?.title}
              </DialogTitle>
              <div className="flex items-center gap-3">
                {/* Countdown Timer */}
                <div className={`flex items-center gap-1.5 font-mono text-lg font-bold px-3 py-1 rounded-md border ${getTimerColor()} ${timeLeft <= 60 ? 'bg-red-500/10 border-red-500/30' : timeLeft <= 300 ? 'bg-orange-500/10 border-orange-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                  <Timer className="h-4 w-4" />
                  {formatTime(timeLeft)}
                </div>

                <select
                  className="text-sm bg-background border rounded px-2 py-1"
                  value={language}
                  onChange={(e) => handleLanguageChange(parseInt(e.target.value))}
                >
                  <option value={71}>Python</option>
                  <option value={63}>JavaScript</option>
                  <option value={62}>Java</option>
                  <option value={54}>C++</option>
                </select>
                <Button variant="outline" onClick={handleRunSample} disabled={runningSample || submitting}>
                  {runningSample ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  Run Code
                </Button>
                <Button onClick={() => handleSubmitCode(false)} disabled={submitting || runningSample}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
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
                  <li>Memory Limit: {Math.round(selectedQuestion?.memory_limit / 1024)}MB</li>
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
                          {res.passed ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
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
                onChange={handleCodeChange}
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
