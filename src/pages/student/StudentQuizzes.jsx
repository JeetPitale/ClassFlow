import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { mockQuizzes, mockQuizSubmissions } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function StudentQuizzes() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState([]);
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]);

    const fetchData = async () => {
        try {
            // Fetch Quizzes
            const quizzesRes = await fetch('https://classflow-backend-jeet.azurewebsites.net/api/quizzes', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const quizzesData = await quizzesRes.json();

            // Fetch My Attempts
            const attemptsRes = await fetch('https://classflow-backend-jeet.azurewebsites.net/api/student/quiz-attempts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const attemptsData = await attemptsRes.json();

            if (quizzesData.success) {
                const formattedQuizzes = quizzesData.data.map(q => ({
                    ...q,
                    duration: q.duration_minutes,
                    maxMarks: q.total_marks,
                    questions: Array(q.question_count).fill(null) // Dummy array to satisfy quiz.questions.length check
                }));
                setQuizzes(formattedQuizzes);
            }
            if (attemptsData.success) {
                setAttempts(attemptsData.data);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter pending quizzes: Quizzes that are not in attempts list
    const completedQuizIds = new Set(attempts.map(a => a.quiz_id));
    const pendingQuizzes = quizzes.filter(q => !completedQuizIds.has(q.id));

    const completedQuizzes = attempts.map(attempt => {
        // Find quiz details if available in main list, or use partial data from attempt
        const quiz = quizzes.find(q => q.id === attempt.quiz_id) || {
            title: attempt.quiz_title,
            description: 'Completed',
            duration: attempt.duration_minutes,
            maxMarks: attempt.max_marks || attempt.total_marks || 0,
            questions: [] // Fallback
        };
        return {
            ...quiz,
            submission: {
                marks: attempt.score,
                date: attempt.submitted_at
            }
        };
    });


    const QuizCard = ({ quiz, isCompleted = false, submission = null }) => (
        <div className="card-elevated animate-slide-up">
            <div className="p-6 flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-semibold">{quiz.title}</h3>
                                <Badge variant="secondary" className={isCompleted ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}>
                                    {isCompleted ? 'Completed' : 'Pending'}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground">{quiz.description}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {quiz.duration} Minutes
                        </div>
                        <div className="flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-primary" />
                            {quiz.questions?.length || 0} Questions
                        </div>
                        <div className="flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4" />
                            {quiz.maxMarks} Marks
                        </div>
                    </div>
                </div>

                <div className="flex flex-col justify-center min-w-[200px] gap-3 pt-4 md:pt-0 md:border-l md:pl-6">
                    {isCompleted ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Score:</span>
                                <span className="font-semibold text-success">{submission.marks} / {quiz.maxMarks}</span>
                            </div>

                        </div>
                    ) : (
                        <Button
                            className="w-full"
                            size="lg"
                            onClick={() => navigate(`/student/quiz/${quiz.id}`)}
                        >
                            Start Quiz
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="page-container">
            <PageHeader
                title="Quizzes"
                description="Take quizzes to test your knowledge"
            />

            <Tabs defaultValue="available" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="available" className="gap-2">
                        <BookOpen className="w-4 h-4" />
                        Teacher Quizzes
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Completed
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="available" className="space-y-6">
                    {pendingQuizzes.length > 0 ? (
                        pendingQuizzes.map((quiz) => (
                            <QuizCard key={quiz.id} quiz={quiz} />
                        ))
                    ) : (
                        <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg">
                            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No new quizzes from your teachers at the moment.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="history" className="space-y-6">
                    {completedQuizzes.length > 0 ? (
                        completedQuizzes.map((item, idx) => (
                            <QuizCard
                                key={idx}
                                quiz={item}
                                isCompleted={true}
                                submission={item.submission}
                            />
                        ))
                    ) : (
                        <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg">
                            <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>You haven't completed any quizzes yet.</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
