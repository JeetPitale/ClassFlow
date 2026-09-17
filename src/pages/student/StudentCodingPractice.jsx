import { useState, useEffect, useRef, useCallback } from 'react';
import { Code, Terminal, Loader2, Play, CheckCircle2, XCircle, Clock, Timer, FileText } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [programOutput, setProgramOutput] = useState('');
  const [lastSubmission, setLastSubmission] = useState(null);
  const [activeTab, setActiveTab] = useState('description'); // 'description' | 'output'

  // Timer State
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const timerRef = useRef(null);
  const isTimerPausedRef = useRef(false);
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

    // Stop timer on submission
    setIsTimerPaused(true);
    isTimerPausedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);

    setSubmitting(true);
    submittingRef.current = true;

    try {
      const response = await codingPracticeAPI.submit(currentQuestion.id, {
        code: currentCode,
        language_id: currentLang
      });

      if (response.data.success) {
        const { status, score, output } = response.data.data;
        if (output) setProgramOutput(output);
        setLastSubmission(response.data.data);
        setActiveTab('output');
        toast({
          title: isAuto ? 'Auto-Submitted on Tab Switch' : 'Code Evaluated',
          description: `Status: ${status} | Score: ${score}`,
          variant: status === 'Passed' ? 'default' : 'destructive'
        });
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

  // Tab switch detection - stops timer and auto-submits immediately
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isSubmitOpenRef.current) {
        // Freeze/stop timer when tab is switched
        setIsTimerPaused(true);
        isTimerPausedRef.current = true;
        if (timerRef.current) clearInterval(timerRef.current);

        if (!autoSubmittedRef.current && !submittingRef.current) {
          autoSubmittedRef.current = true;
          toast({
            title: '⚠️ Tab Switch Detected!',
            description: 'Timer stopped and your code has been automatically submitted.',
            variant: 'destructive'
          });
          handleSubmitCode(true);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleSubmitCode, toast]);

  // Timer countdown effect - halts if isTimerPaused or time expired
  useEffect(() => {
    if (!isSubmitOpen || timeLeft <= 0 || isTimerPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsTimerPaused(true);
          isTimerPausedRef.current = true;
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
  }, [isSubmitOpen, timeLeft > 0, isTimerPaused, handleSubmitCode, toast]);

  // Cleanup timer when dialog closes
  useEffect(() => {
    if (!isSubmitOpen) {
      clearInterval(timerRef.current);
      autoSubmittedRef.current = false;
      setIsTimerPaused(false);
      isTimerPausedRef.current = false;
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
    setProgramOutput('');
    setLastSubmission(null);
    setActiveTab('description');
    autoSubmittedRef.current = false;
    setIsTimerPaused(false);
    isTimerPausedRef.current = false;
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
    setActiveTab('output');
    try {
      const response = await codingPracticeAPI.runSample(currentQuestion.id, {
        code: currentCode,
        language_id: currentLang
      });
      if (response.data.success) {
        setSampleResults(response.data.data.results || []);
        setProgramOutput(response.data.data.output || '');
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
                <div className={`flex items-center gap-1.5 font-mono text-lg font-bold px-3 py-1 rounded-md border ${isTimerPaused ? 'bg-red-500/10 border-red-500/30 text-red-500' : getTimerColor()} ${!isTimerPaused && timeLeft <= 60 ? 'bg-red-500/10 border-red-500/30' : !isTimerPaused && timeLeft <= 300 ? 'bg-orange-500/10 border-orange-500/30' : !isTimerPaused ? 'bg-green-500/10 border-green-500/30' : ''}`}>
                  <Timer className="h-4 w-4" />
                  {formatTime(timeLeft)}
                  {isTimerPaused && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold ml-1 bg-red-500/20 px-1.5 py-0.5 rounded">
                      Stopped
                    </span>
                  )}
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
            {/* Left Panel: Description & Output Tabs */}
            <div className="w-1/3 border-r flex flex-col overflow-hidden bg-muted/20">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <div className="p-3 border-b bg-background/50 flex-shrink-0">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="description" className="flex items-center gap-1.5 text-xs">
                      <FileText className="h-3.5 w-3.5" /> Problem
                    </TabsTrigger>
                    <TabsTrigger value="output" className="flex items-center gap-1.5 text-xs relative">
                      <Terminal className="h-3.5 w-3.5" /> Output
                      {(programOutput || (sampleResults && sampleResults.length > 0) || lastSubmission) && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ml-1" />
                      )}
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="description" className="flex-1 p-6 overflow-y-auto m-0">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <h3>Problem Description</h3>
                    <div className="whitespace-pre-wrap">{selectedQuestion?.description}</div>

                    <h4 className="mt-6">Constraints</h4>
                    <ul>
                      <li>Time Limit: {selectedQuestion?.time_limit}s</li>
                      <li>Memory Limit: {Math.round(selectedQuestion?.memory_limit / 1024)}MB</li>
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="output" className="flex-1 p-5 overflow-y-auto m-0 space-y-4">
                  {runningSample ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                      <Loader2 className="h-7 w-7 animate-spin text-primary" />
                      <p className="text-sm">Running your code...</p>
                    </div>
                  ) : submitting ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                      <Loader2 className="h-7 w-7 animate-spin text-primary" />
                      <p className="text-sm">Submitting & evaluating test cases...</p>
                    </div>
                  ) : (programOutput || (sampleResults && sampleResults.length > 0) || lastSubmission) ? (
                    <>
                      {/* Program Stdout / Console Output */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm flex items-center gap-1.5">
                            <Terminal className="h-4 w-4 text-emerald-500" />
                            Program Output (stdout)
                          </h4>
                          <span className="text-[11px] text-muted-foreground font-mono">Exit Code: 0</span>
                        </div>
                        <div className="rounded-lg bg-zinc-950 text-zinc-100 p-3.5 font-mono text-xs border border-zinc-800 shadow-inner overflow-x-auto min-h-[60px]">
                          <pre className="whitespace-pre-wrap leading-relaxed">{programOutput ? programOutput : "(No output printed)"}</pre>
                        </div>
                      </div>

                      {/* Submission Result Header (if submitted) */}
                      {lastSubmission && (
                        <div className={`p-4 rounded-lg border ${lastSubmission.status === 'Passed' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm">Submission Status</span>
                            <Badge variant={lastSubmission.status === 'Passed' ? 'default' : 'destructive'}>
                              {lastSubmission.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>Score: <strong className="font-mono">{lastSubmission.score}</strong></div>
                            <div>Runtime: <strong className="font-mono">{lastSubmission.runtime || 0.05}s</strong></div>
                          </div>
                        </div>
                      )}

                      {/* Sample Test Cases Results */}
                      {sampleResults && sampleResults.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm mb-3">Test Cases Results</h4>
                          <div className="space-y-3">
                            {sampleResults.map((res, idx) => (
                              <div key={idx} className={`p-3 rounded-md border ${res.passed ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                <div className="flex items-center justify-between mb-2 font-medium text-xs">
                                  <span className="flex items-center gap-1.5">
                                    {res.passed ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-red-500" />}
                                    Test Case {idx + 1}
                                  </span>
                                  <Badge variant={res.passed ? 'outline' : 'destructive'} className="text-[10px] h-4">
                                    {res.passed ? 'PASSED' : 'FAILED'}
                                  </Badge>
                                </div>
                                <div className="space-y-1.5 text-xs font-mono">
                                  {res.input && res.input !== 'None' && (
                                    <div>
                                      <span className="text-muted-foreground text-[10px]">Input:</span>
                                      <pre className="p-1 bg-background/80 rounded text-[11px] overflow-x-auto">{res.input}</pre>
                                    </div>
                                  )}
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <span className="text-muted-foreground text-[10px]">Expected:</span>
                                      <pre className="p-1 bg-background/80 rounded text-[11px] overflow-x-auto">{res.expected}</pre>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground text-[10px]">Actual:</span>
                                      <pre className="p-1 bg-background/80 rounded text-[11px] overflow-x-auto">{res.actual}</pre>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
                      <Terminal className="h-10 w-10 stroke-1 text-muted-foreground/60" />
                      <div>
                        <p className="font-medium text-foreground text-sm">No Output Yet</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">Click "Run Code" or "Submit" to execute your program and see stdout & test case evaluation here.</p>
                      </div>
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs mt-2" onClick={handleRunSample} disabled={runningSample || submitting}>
                        <Play className="h-3.5 w-3.5" /> Run Code Now
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
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
