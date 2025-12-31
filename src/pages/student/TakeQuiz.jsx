import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function TakeQuiz() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();

    const [quiz, setQuiz] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(null); // Initialize as null to wait for data
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;

            try {
                // 1. Fetch Quiz Details
                const quizRes = await fetch(`http://localhost:8000/api/quizzes/${quizId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const quizData = await quizRes.json();

                if (!quizData.success) {
                    throw new Error(quizData.error || 'Quiz not found');
                }

                // 2. Fetch Questions
                const questionsRes = await fetch(`http://localhost:8000/api/quizzes/${quizId}/questions`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const questionsData = await questionsRes.json();

                if (!questionsData.success) {
                    throw new Error('Failed to load questions');
                }

                const formattedQuestions = questionsData.data.map(q => ({
                    ...q,
                    options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
                    correctAnswer: parseInt(q.correctAnswer),
                    marks: parseInt(q.marks)
                }));

                const fullQuiz = {
                    ...quizData.data,
                    duration: parseInt(quizData.data.duration_minutes), // Ensure int
                    maxMarks: quizData.data.total_marks,
                    questions: formattedQuestions
                };

                setQuiz(fullQuiz);

                // Initialize timer if duration exists
                if (fullQuiz.duration && !isNaN(fullQuiz.duration)) {
                    setTimeLeft(fullQuiz.duration * 60);
                } else {
                    setTimeLeft(0); // Fallback if no duration
                }

            } catch (error) {
                console.error(error);
                toast({ title: "Error", description: error.message, variant: "destructive" });
                navigate('/student/quizzes');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [quizId, token, navigate]);

    // Timer
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(true); // Auto-submit
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    const handleAnswerSelect = (optionIndex) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestionIndex]: optionIndex
        }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setShowConfirmSubmit(true);
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const calculateScore = () => {
        let score = 0;
        quiz.questions.forEach((q, index) => {
            // q.correctAnswer from backend might be 0-indexed integer
            if (answers[index] === q.correctAnswer) {
                score += q.marks;
            }
        });
        return score;
    };

    const handleSubmit = async (autoSubmit = false) => {
        setIsSubmitting(true);
        setShowConfirmSubmit(false);

        try {
            const score = calculateScore();

            const response = await fetch(`http://localhost:8000/api/quizzes/${quizId}/attempt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    score,
                    answers // Send answers to backend
                })
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: autoSubmit ? "Time's Up!" : "Quiz Submitted",
                    description: `You scored ${score} out of ${quiz.maxMarks}`
                });
                navigate('/student/quizzes'); // Redirect to quiz list for now as marks page might mock
            } else {
                throw new Error(data.message || 'Submission failed');
            }

        } catch (error) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to submit quiz. Please try again.',
                variant: 'destructive'
            });
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isLoading) return <div className="p-8 text-center">Loading quiz...</div>;
    if (!quiz) return null;

    const currentQuestion = quiz.questions[currentQuestionIndex];
    // Safety check just in case questions array is empty
    if (!currentQuestion) return <div className="p-8">No questions in this quiz.</div>;

    const progress = ((Object.keys(answers).length) / quiz.questions.length) * 100;

    return (
        <div className="container max-w-3xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-6">
                <Button variant="ghost" onClick={() => navigate('/student/quizzes')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Exit
                </Button>
                <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft !== null && timeLeft < 60 ? 'text-destructive' : 'text-primary'}`}>
                    <Clock className="w-5 h-5" />
                    {timeLeft === null ? '--:--' : formatTime(timeLeft)}
                </div>
            </div>

            <div className="mb-6 space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Progress</span>
                    <span>{Object.keys(answers).length} of {quiz.questions.length} answered</span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            <Card className="min-h-[400px] flex flex-col">
                <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                        <span className="text-sm font-medium text-muted-foreground">
                            Question {currentQuestionIndex + 1} of {quiz.questions.length}
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">
                            {currentQuestion.marks} Marks
                        </span>
                    </div>
                    <h2 className="text-xl font-semibold mt-2">{currentQuestion.question}</h2>
                </CardHeader>

                <CardContent className="flex-1">
                    <RadioGroup
                        value={answers[currentQuestionIndex]?.toString() ?? ""}
                        onValueChange={(val) => handleAnswerSelect(parseInt(val))}
                        className="space-y-3"
                    >
                        {Array.isArray(currentQuestion.options) && currentQuestion.options.map((option, index) => (
                            <div key={index} className={`flex items-center space-x-2 border rounded-lg p-4 transition-colors ${answers[currentQuestionIndex] === index ? 'bg-primary/5 border-primary' : 'hover:bg-muted'}`}>
                                <RadioGroupItem value={index.toString()} id={`opt-${index}`} />
                                <Label htmlFor={`opt-${index}`} className="flex-1 cursor-pointer font-normal">
                                    {option}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </CardContent>

                <CardFooter className="border-t bg-muted/10 p-6 flex justify-between">
                    <Button
                        variant="outline"
                        onClick={handlePrev}
                        disabled={currentQuestionIndex === 0 || isSubmitting}
                    >
                        Previous
                    </Button>

                    <Button
                        onClick={handleNext}
                        disabled={isSubmitting}
                    >
                        {currentQuestionIndex === quiz.questions.length - 1 ? 'Submit Quiz' : 'Next Question'}
                    </Button>
                </CardFooter>
            </Card>

            <AlertDialog open={showConfirmSubmit} onOpenChange={setShowConfirmSubmit}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Submit Quiz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to submit? You have answered {Object.keys(answers).length} out of {quiz.questions.length} questions.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleSubmit(false)}>Submit</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
