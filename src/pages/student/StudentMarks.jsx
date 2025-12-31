import { useState, useEffect } from 'react';
import { Award, ClipboardList, BookOpen, Eye, CheckCircle, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { assignmentAPI, quizAPI } from '@/services/api';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function StudentMarks() {
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [quizSubmissions, setQuizSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assignmentsRes, quizzesRes] = await Promise.all([
        assignmentAPI.getMySubmissions(),
        quizAPI.getMyAttempts()
      ]);
      setSubmissions(assignmentsRes.data.data || []);
      setQuizSubmissions(quizzesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching marks:', error);
      toast({
        title: "Error",
        description: "Failed to load marks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const assignmentAvg = submissions.length > 0 ?
    Math.round(submissions.reduce((sum, s) => sum + (Number(s.marks_obtained) || 0), 0) / submissions.length) :
    0;

  const quizAvg = quizSubmissions.length > 0 ?
    Math.round(
      quizSubmissions.reduce((sum, q) => sum + Math.min((Number(q.score) / Number(q.max_marks) * 100), 100), 0) / quizSubmissions.length
    ) : 0;

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'text-success';
    if (percentage >= 80) return 'text-primary';
    if (percentage >= 70) return 'text-info';
    if (percentage >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getGradeBadge = (percentage) => {
    if (percentage >= 90) return { grade: 'A', color: 'bg-success/10 text-success' };
    if (percentage >= 80) return { grade: 'B', color: 'bg-primary/10 text-primary' };
    if (percentage >= 70) return { grade: 'C', color: 'bg-info/10 text-info' };
    if (percentage >= 60) return { grade: 'D', color: 'bg-warning/10 text-warning' };
    return { grade: 'F', color: 'bg-destructive/10 text-destructive' };
  };

  const openQuizReview = (submission) => {
    quizAPI.getQuestions(submission.quiz_id).then(res => {
      const questions = res.data.data || [];
      const answers = JSON.parse(submission.answers_json || '{}');

      const reviewQuiz = {
        title: submission.quiz_title,
        marks: submission.score,
        maxMarks: submission.max_marks,
        questions: questions.map((q, i) => ({
          ...q,
          studentAnswer: answers[i] !== undefined ? parseInt(answers[i]) : null,
          correctAnswer: parseInt(q.correctAnswer)
        }))
      };
      setSelectedQuiz(reviewQuiz);
      setReviewDialogOpen(true);
    }).catch(err => {
      console.error(err);
      toast({ title: "Error", description: "Could not load quiz details for review", variant: "destructive" });
    });
  };

  if (loading) {
    return <div className="p-8 text-center">Loading marks...</div>;
  }

  return (
    <div className="page-container">
      <PageHeader
        title="My Marks"
        description="View your assignment and quiz scores" />

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Overall Average"
          value={`${Math.round((assignmentAvg + quizAvg) / (submissions.length > 0 && quizSubmissions.length > 0 ? 2 : (submissions.length > 0 || quizSubmissions.length > 0 ? 1 : 1)))}%`}
          icon={Award}
          trend={{ value: 5, isPositive: true }} />

        <StatCard
          title="Assignment Average"
          value={`${assignmentAvg}%`}
          icon={ClipboardList} />

        <StatCard
          title="Quiz Average"
          value={`${quizAvg}%`}
          icon={BookOpen} />

      </div>

      <Tabs defaultValue="assignments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="assignments" className="gap-2">
            <ClipboardList className="w-4 h-4" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Quizzes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          {submissions.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">No assignments submitted yet.</div>
          ) : (
            submissions.map((submission, index) => {
              const percentage = submission.marks_obtained !== null ?
                Math.round(Number(submission.marks_obtained) / Number(submission.max_marks || 100) * 100) : 0;
              const grade = getGradeBadge(percentage);

              return (
                <div
                  key={submission.id}
                  className="card-elevated p-5 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}>

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground">{submission.assignment_title}</h4>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-xs text-muted-foreground">
                          Submitted {format(new Date(submission.submitted_at), 'MMM d, yyyy')}
                        </span>
                        {submission.feedback &&
                          <span className="text-xs text-muted-foreground">
                            • "{submission.feedback}"
                          </span>
                        }
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                      {submission.marks_obtained !== null ?
                        <>
                          <div className="flex items-center gap-2 justify-end">
                            <span className={`text-2xl font-bold ${getGradeColor(percentage)}`}>
                              {submission.marks_obtained}
                            </span>
                            <span className="text-muted-foreground">/ {submission.max_marks}</span>
                          </div>
                          <Badge variant="secondary" className={grade.color}>
                            Grade: {grade.grade}
                          </Badge>
                        </> :

                        <Badge variant="secondary" className="bg-warning/10 text-warning">
                          Pending
                        </Badge>
                      }
                    </div>
                  </div>
                </div>);
            })
          )}
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-4">
          {quizSubmissions.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">No quizzes attempted yet.</div>
          ) : (
            quizSubmissions.map((submission, index) => {
              const percentage = Math.min(Math.round(Number(submission.score) / Number(submission.max_marks) * 100), 100);
              const grade = getGradeBadge(percentage);

              return (
                <div
                  key={submission.id}
                  className="card-elevated p-5 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}>

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground">{submission.quiz_title}</h4>
                      <span className="text-xs text-muted-foreground">
                        Completed {format(new Date(submission.submitted_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2 justify-end">
                        <span className={`text-2xl font-bold ${getGradeColor(percentage)}`}>
                          {submission.score}
                        </span>
                        <span className="text-muted-foreground">/ {submission.max_marks}</span>
                      </div>
                      <Badge variant="secondary" className={grade.color}>
                        {percentage}%
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => openQuizReview(submission)}>
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                    </div>
                  </div>
                </div>);
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Quiz Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quiz Review: {selectedQuiz?.title}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Review your answers and the correct solutions for this quiz.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              {selectedQuiz?.questions.map((q, index) => {
                const isCorrect = q.studentAnswer === q.correctAnswer;
                return (
                  <div
                    key={q.id}
                    className={cn(
                      'p-4 rounded-lg border',
                      isCorrect ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'
                    )}>

                    <div className="flex items-start gap-3">
                      {isCorrect ?
                        <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" /> :

                        <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      }
                      <div className="flex-1">
                        <p className="font-medium text-foreground mb-3">
                          Q{index + 1}. {q.question}
                        </p>
                        <div className="space-y-2">
                          {q.options.map((option, optIndex) =>
                            <div
                              key={optIndex}
                              className={cn(
                                'px-3 py-2 rounded text-sm',
                                optIndex === q.correctAnswer && 'bg-success/20 text-success font-medium',
                                optIndex === q.studentAnswer && optIndex !== q.correctAnswer && 'bg-destructive/20 text-destructive font-medium',
                                optIndex !== q.correctAnswer && optIndex !== q.studentAnswer && 'bg-muted/50 text-muted-foreground'
                              )}>

                              <span className="mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                              {option}
                              {optIndex === q.correctAnswer &&
                                <span className="ml-2 text-xs">(Correct Answer)</span>
                              }
                              {optIndex === q.studentAnswer && optIndex !== q.correctAnswer &&
                                <span className="ml-2 text-xs">(Your Answer)</span>
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>);

              })}

              {!selectedQuiz?.questions || selectedQuiz.questions.length === 0 && (
                <p className="text-muted-foreground text-center">Questions not found.</p>
              )}
            </div>
          </ScrollArea>
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Correct: {selectedQuiz?.questions?.filter((q) => q.studentAnswer === q.correctAnswer).length || 0} / {selectedQuiz?.questions?.length || 0}
            </div>
            <Badge className={getGradeBadge(selectedQuiz ? (Number(selectedQuiz.marks) / Number(selectedQuiz.maxMarks) * 100) : 0).color}>
              Score: {selectedQuiz?.marks}/{selectedQuiz?.maxMarks}
            </Badge>
          </div>
        </DialogContent>
      </Dialog>
    </div>);
}