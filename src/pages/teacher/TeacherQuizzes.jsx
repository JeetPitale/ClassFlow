import { useState, useRef, useEffect } from 'react';
import { Plus, BookOpen, Clock, Award, Users, Pencil, Trash2, Upload, History, ListPlus, CheckCircle, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from
  '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from
  '@/components/ui/alert-dialog';
import Papa from 'papaparse';
import { mockQuizzes, mockQuizSubmissions } from '@/data/mockData';

import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from
  '@/components/ui/select';

// Mock quiz history data


export default function TeacherQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  // const [quizHistory] = useState(mockQuizSubmissions); // Replaced with API data
  const [quizHistory, setQuizHistory] = useState([]);
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [deletingQuiz, setDeletingQuiz] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const fileInputRef = useRef(null);
  const { token, user } = useAuth();

  const [quizFormData, setQuizFormData] = useState({
    title: '',
    description: '',
    duration: 30,
    maxMarks: 25,
    semester: '1'
  });

  const [questionFormData, setQuestionFormData] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    marks: 5
  });

  const resetQuizForm = () => {
    setQuizFormData({ title: '', description: '', duration: 30, maxMarks: 25, semester: '1' });
    setEditingQuiz(null);
  };

  const resetQuestionForm = () => {
    setQuestionFormData({ question: '', options: ['', '', '', ''], correctAnswer: 0, marks: 5 });
    setEditingQuestion(null);
  };

  const handleOpenCreateQuiz = () => {
    resetQuizForm();
    setIsQuizDialogOpen(true);
  };

  const handleOpenEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setQuizFormData({
      title: quiz.title || '',
      description: quiz.description || '',
      duration: quiz.duration || 30,
      maxMarks: quiz.maxMarks || 25,
      semester: quiz.semester ? quiz.semester.toString() : '1'
    });
    setIsQuizDialogOpen(true);
  };

  const handleOpenDeleteQuiz = (quiz) => {
    setDeletingQuiz(quiz);
    setIsDeleteDialogOpen(true);
  };

  const handleOpenQuestions = async (quiz) => {
    // Initialize with empty questions to prevent crash
    setSelectedQuiz({ ...quiz, questions: [] });
    resetQuestionForm();
    setIsQuestionDialogOpen(true);

    try {
      const response = await fetch(`https://classflow-backend-jeet.azurewebsites.net/api/quizzes/${quiz.id}/questions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSelectedQuiz(prev => prev ? { ...prev, questions: data.data } : null);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch questions', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchQuizzes();
    fetchHistory();
  }, [token]);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('https://classflow-backend-jeet.azurewebsites.net/api/quizzes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        // Map backend snake_case to frontend camelCase expectations for display
        const mappedQuizzes = data.data.map(q => ({
          ...q,
          duration: q.duration_minutes || 0,
          maxMarks: q.total_marks || 0,
          semester: q.semester || '1',
          createdAt: q.created_at // Map backend created_at to frontend createdAt
        }));
        setQuizzes(mappedQuizzes);
      }
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch('https://classflow-backend-jeet.azurewebsites.net/api/teacher/quiz-history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const mappedHistory = data.data.map(h => ({
          id: h.id,
          studentName: h.student_name,
          quizTitle: h.quiz_title,
          submittedAt: h.submitted_at,
          marks: h.score,
          maxMarks: h.max_marks,
          quizId: h.quiz_id
        }));
        setQuizHistory(mappedHistory);
      }
    } catch (error) {
      console.error("Failed to fetch history", error);
    }
  };

  const handleQuizSubmit = async () => {
    if (!quizFormData.title) {
      toast({ title: 'Error', description: 'Please enter a title', variant: 'destructive' });
      return;
    }

    if (quizFormData.duration <= 0) {
      toast({ title: 'Error', description: 'Duration must be greater than 0', variant: 'destructive' });
      return;
    }

    if (quizFormData.maxMarks <= 0) {
      toast({ title: 'Error', description: 'Max marks must be greater than 0', variant: 'destructive' });
      return;
    }

    try {
      const url = editingQuiz
        ? `https://classflow-backend-jeet.azurewebsites.net/api/quizzes/${editingQuiz.id}`
        : 'https://classflow-backend-jeet.azurewebsites.net/api/quizzes';

      const method = editingQuiz ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(quizFormData)
      });

      const data = await response.json();

      if (data.success) {
        toast({ title: 'Success', description: editingQuiz ? 'Quiz updated' : 'Quiz created' });
        fetchQuizzes();
        resetQuizForm();
        setIsQuizDialogOpen(false);
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Operation failed', variant: 'destructive' });
    }
  };

  const handleDeleteQuiz = async () => {
    if (!deletingQuiz) return;

    try {
      const response = await fetch(`https://classflow-backend-jeet.azurewebsites.net/api/quizzes/${deletingQuiz.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setQuizzes(quizzes.filter((q) => q.id !== deletingQuiz.id));
        setIsDeleteDialogOpen(false);
        setDeletingQuiz(null);
        toast({ title: 'Success', description: 'Quiz deleted successfully' });
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to delete quiz', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete quiz', variant: 'destructive' });
    }
  };

  const handleAddQuestion = async () => {
    if (!selectedQuiz || !questionFormData.question || questionFormData.options.some((o) => !o.trim())) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    if (questionFormData.marks <= 0) {
      toast({ title: 'Error', description: 'Marks must be positive', variant: 'destructive' });
      return;
    }

    try {
      let url, method, body;

      if (editingQuestion) {
        url = `https://classflow-backend-jeet.azurewebsites.net/api/quizzes/${selectedQuiz.id}/questions/${editingQuestion.id}`;
        method = 'PUT';
        body = JSON.stringify(questionFormData);

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body
        });
        const data = await response.json();

        if (data.success) {
          const newQuestion = {
            id: editingQuestion.id,
            question: questionFormData.question,
            options: questionFormData.options,
            correctAnswer: questionFormData.correctAnswer,
            marks: questionFormData.marks
          };

          setQuizzes(quizzes.map((q) =>
            q.id === selectedQuiz.id ?
              { ...q, questions: q.questions.map((qq) => qq.id === editingQuestion.id ? { ...newQuestion } : qq) } :
              q
          ));
          setSelectedQuiz((prev) => prev ? {
            ...prev,
            questions: prev.questions.map((qq) => qq.id === editingQuestion.id ? { ...newQuestion } : qq)
          } : null);

          toast({ title: 'Success', description: 'Question updated successfully' });
          resetQuestionForm();
        } else {
          toast({ title: 'Error', description: data.message || 'Failed to update question', variant: 'destructive' });
        }
      } else {
        url = `https://classflow-backend-jeet.azurewebsites.net/api/quizzes/${selectedQuiz.id}/questions`;
        method = 'POST';
        body = JSON.stringify(questionFormData);

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body
        });
        const data = await response.json();

        if (data.success) {
          // Update local state with real ID from backend
          const newQuestion = {
            ...data.data,
            // Ensure local state matches view expectations
            id: data.data.id,
            question: data.data.question,
            options: data.data.options,
            correctAnswer: data.data.correct_answer,
            marks: data.data.marks
          };

          setSelectedQuiz((prev) => prev ? { ...prev, questions: [...prev.questions, newQuestion] } : null);

          // Also update main quizzes list count if needed
          setQuizzes(quizzes.map((q) =>
            q.id === selectedQuiz.id ?
              { ...q, question_count: (q.question_count || 0) + 1 } :
              q
          ));

          toast({ title: 'Success', description: 'Question added successfully' });
          resetQuestionForm();
        } else {
          toast({ title: 'Error', description: data.message || 'Failed to add question', variant: 'destructive' });
        }
      }
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    }
  };



  const handleDeleteQuestion = async (questionId) => {
    if (!selectedQuiz) return;
    console.log("Deleting question ID:", questionId); // Debug logging

    try {
      const response = await fetch(`https://classflow-backend-jeet.azurewebsites.net/api/quizzes/${selectedQuiz.id}/questions/${questionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setQuizzes(quizzes.map((q) =>
          q.id === selectedQuiz.id ?
            { ...q, questions: q.questions.filter((qq) => qq.id !== questionId) } :
            q
        ));
        setSelectedQuiz((prev) => prev ? { ...prev, questions: prev.questions.filter((qq) => qq.id !== questionId) } : null);
        toast({ title: 'Success', description: 'Question deleted' });
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to delete question', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete question', variant: 'destructive' });
    }
  };

  // New: Handle local changes in the expanded list
  const handleLocalQuestionChange = (questionId, field, value, optionIndex = null) => {
    setSelectedQuiz(prev => {
      if (!prev) return null;
      return {
        ...prev,
        questions: prev.questions.map(q => {
          if (q.id !== questionId) return q;

          if (field === 'options' && optionIndex !== null) {
            const newOptions = [...q.options];
            newOptions[optionIndex] = value;
            return { ...q, options: newOptions };
          }

          return { ...q, [field]: value };
        })
      };
    });
  };

  // New: Save an individual question from the list
  const handleSaveQuestion = async (question) => {
    if (question.marks <= 0) {
      toast({ title: 'Error', description: 'Marks must be positive', variant: 'destructive' });
      return;
    }
    try {
      const url = `https://classflow-backend-jeet.azurewebsites.net/api/quizzes/${selectedQuiz.id}/questions/${question.id}`;
      const body = JSON.stringify({
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
        marks: question.marks
      });

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body
      });
      const data = await response.json();

      if (data.success) {
        toast({ title: 'Success', description: 'Question saved successfully' });
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to save question', variant: 'destructive' });
      }
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedQuiz) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        // Parse CSV or JSON format
        let questions = [];

        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          questions = parsed.map((q, i) => ({
            id: `qq${Date.now()}${i}`,
            question: q.question,
            options: q.options || [],
            correctAnswer: q.correctAnswer || 0,
            marks: q.marks || 5
          }));
        } else if (file.name.endsWith('.csv')) {
          // Use PapaParse for robust CSV parsing
          Papa.parse(file, {
            header: true, // Use header row to identify columns
            skipEmptyLines: true,
            complete: (results) => {
              if (results.errors.length > 0) {
                console.error("CSV Errors:", results.errors);
                toast({ title: 'Error', description: 'CSV Error: ' + results.errors[0].message, variant: 'destructive' });
                return;
              }

              // 1. First pass: Collect all potential answers to form a "Distractor Pool"
              const allAnswers = results.data
                .map(row => {
                  const keys = Object.keys(row);
                  // Look for "Answer", "Correct Answer", "Correct"
                  const key = keys.find(k => k.toLowerCase().includes('correct') || k.toLowerCase().includes('answer'));
                  return key ? row[key] : null;
                })
                .filter(a => a && a.toString().trim().length > 0);

              // Remove duplicates to ensure variety
              const uniqueAnswers = [...new Set(allAnswers)];

              const parsedQuestions = results.data.map((row, i) => {
                const keys = Object.keys(row);
                const getVal = (search) => {
                  const key = keys.find(k => k.toLowerCase().includes(search.toLowerCase()));
                  return key ? row[key] : '';
                };

                const questionText = getVal('question') || row[keys[0]] || '';
                let correctText = getVal('correct') || getVal('answer') || '';

                // If correct answer is numeric (index), map it if we can; 
                // but for this auto-gen feature we expect text answers usually.

                let options = [];
                let correctIndex = 0;
                let marks = parseInt(getVal('mark') || row[keys[keys.length - 1]]) || 5;

                // Check if explicit options are provided
                const opt1 = getVal('option 1') || getVal('option a');

                if (opt1) {
                  // Standard mode: Options provided
                  options = [
                    opt1,
                    getVal('option 2') || getVal('option b') || '',
                    getVal('option 3') || getVal('option c') || '',
                    getVal('option 4') || getVal('option d') || ''
                  ];
                  // Improved Logic: Check for text match FIRST, then fallback to index
                  // This prevents answers like "1995" being interpreted as index 1995
                  const textMatchIndex = options.findIndex(o => o.toString().trim().toLowerCase() === correctText.toString().trim().toLowerCase());

                  if (textMatchIndex !== -1) {
                    correctIndex = textMatchIndex;
                  } else {
                    // Fallback: Try to parse as index (0-based or 1-based)
                    const parsedIdx = parseInt(correctText);
                    if (!isNaN(parsedIdx)) {
                      if (parsedIdx >= 0 && parsedIdx < options.length) {
                        correctIndex = parsedIdx; // Assume 0-based
                      } else if (parsedIdx === options.length) {
                        correctIndex = parsedIdx - 1; // Assume 1-based for max value
                        // E.g. answer is 4, options length 4. (Index 3).
                      } else if (parsedIdx >= 1 && parsedIdx <= options.length) {
                        correctIndex = parsedIdx - 1; // Assume 1-based
                      }
                    }
                  }
                } else {
                  // SMART MODE: Generate options from pool
                  // 1. Correct option is required
                  if (!correctText) correctText = "Answer"; // Fallback

                  // 2. Pick 3 random distractors from uniqueAnswers (excluding correct one)
                  const distractors = uniqueAnswers.filter(a => a !== correctText);

                  // Shuffle distractors
                  const shuffledDistractors = distractors.sort(() => 0.5 - Math.random());

                  // Take first 3, or fill with placeholders if not enough
                  const selectedDistractors = shuffledDistractors.slice(0, 3);
                  while (selectedDistractors.length < 3) {
                    selectedDistractors.push(`Option ${selectedDistractors.length + 2}`);
                  }

                  // Combine and shuffle
                  options = [correctText, ...selectedDistractors];
                  options.sort(() => 0.5 - Math.random());

                  // Find the new index of the correct answer
                  correctIndex = options.findIndex(o => o === correctText);
                }

                return {
                  // id: `qq${Date.now()}${i}`, // Don't generate ID here, wait for backend
                  question: questionText,
                  options: options,
                  correctAnswer: correctIndex,
                  marks: marks
                };
              });

              if (parsedQuestions.length > 0) {
                // Send to backend
                fetch(`https://classflow-backend-jeet.azurewebsites.net/api/quizzes/${selectedQuiz.id}/questions/bulk`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify(parsedQuestions)
                })
                  .then(res => res.json())
                  .then(data => {
                    if (data.success) {
                      // Refresh questions from backend to get real IDs
                      fetch(`https://classflow-backend-jeet.azurewebsites.net/api/quizzes/${selectedQuiz.id}/questions`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                      })
                        .then(res => res.json())
                        .then(qData => {
                          if (qData.success) {
                            setSelectedQuiz(prev => prev ? { ...prev, questions: qData.data } : null);
                            // Update main list count
                            setQuizzes(quizzes.map(q =>
                              q.id === selectedQuiz.id ?
                                { ...q, question_count: (q.question_count || 0) + parsedQuestions.length } :
                                q
                            ));
                            toast({ title: 'Success', description: `${parsedQuestions.length} questions imported and saved` });
                          }
                        });
                    } else {
                      toast({ title: 'Error', description: data.message || 'Failed to save questions', variant: 'destructive' });
                    }
                  })
                  .catch(err => {
                    console.error(err);
                    toast({ title: 'Error', description: 'Failed to upload questions', variant: 'destructive' });
                  });
              }
            },
            error: (err) => {
              toast({ title: 'Error', description: 'Failed to parse file: ' + err.message, variant: 'destructive' });
            }
          });
          return; // Papa.parse is async, so we return here and handle state inside callback
        }

        if (questions.length > 0) {
          setQuizzes(quizzes.map((q) =>
            q.id === selectedQuiz.id ?
              { ...q, questions: [...q.questions, ...questions] } :
              q
          ));
          setSelectedQuiz((prev) => prev ? { ...prev, questions: [...prev.questions, ...questions] } : null);
          toast({ title: 'Success', description: `${questions.length} questions imported` });
        }
      } catch {
        toast({ title: 'Error', description: 'Failed to parse file', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const updateOptionValue = (index, value) => {
    const newOptions = [...questionFormData.options];
    newOptions[index] = value;
    setQuestionFormData({ ...questionFormData, options: newOptions });
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Quizzes & Tests"
        description="Create and manage quizzes for your courses"
        action={
          <Button onClick={handleOpenCreateQuiz}>
            <Plus className="w-4 h-4 mr-2" />
            New Quiz
          </Button>
        } />


      <Tabs defaultValue="quizzes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="quizzes" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Active Quizzes
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" />
            Test History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quizzes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes
              .filter(quiz => {
                if (!user) return false;
                if (user.role === 'admin') return true;
                return String(quiz.created_by_teacher_id) === String(user.id);
              })
              .map((quiz, index) =>
                <div
                  key={quiz.id}
                  className="card-elevated p-5 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}>

                  <div className="flex items-start gap-4 mb-4">
                    <div className="hidden sm:block p-2.5 rounded-lg bg-info/10 flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-info" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-foreground truncate max-w-[70%]">{quiz.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          Sem {quiz.semester}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {quiz.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mb-4">
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="w-3 h-3" />
                      {quiz.duration} min
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Award className="w-3 h-3" />
                      {quiz.maxMarks} marks
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Users className="w-3 h-3" />
                      {quiz.question_count || 0} questions
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      {(() => {
                        try {
                          const date = new Date(quiz.createdAt);
                          return !isNaN(date.getTime()) ? format(date, 'MMM d, yyyy') : 'N/A';
                        } catch { return 'N/A'; }
                      })()}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenQuestions(quiz)}>
                        <ListPlus className="w-4 h-4" />
                      </Button>
                      {(user && (user.role === 'admin' || user.id === quiz.created_by_teacher_id)) && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleOpenEditQuiz(quiz)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => handleOpenDeleteQuiz(quiz)}>

                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="card-elevated overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Student</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Quiz</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Submitted</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Score</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {quizHistory.map((submission) => {
                    const maxMarks = submission.maxMarks || 25;
                    const percentage = submission.marks / maxMarks * 100;

                    return (
                      <tr key={submission.id} className="border-b border-border table-row-hover">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-info">
                                {submission.studentName.charAt(0)}
                              </span>
                            </div>
                            <span className="font-medium text-foreground">{submission.studentName}</span>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground">{submission.quizTitle}</td>
                        <td className="p-4 text-muted-foreground">
                          {(() => {
                            try {
                              const date = new Date(submission.submittedAt);
                              return !isNaN(date.getTime()) ? format(date, 'MMM d, h:mm a') : 'N/A';
                            } catch { return 'N/A'; }
                          })()}
                        </td>
                        <td className="p-4">
                          <span className={`font-medium ${percentage >= 80 ? 'text-success' :
                            percentage >= 60 ? 'text-warning' : 'text-destructive'}`
                          }>
                            {submission.marks}/{maxMarks}
                          </span>
                        </td>
                        <td className="p-4">
                          {percentage >= 60 ?
                            <Badge variant="secondary" className="bg-success/10 text-success gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Passed
                            </Badge> :

                            <Badge variant="secondary" className="bg-destructive/10 text-destructive gap-1">
                              <XCircle className="w-3 h-3" />
                              Failed
                            </Badge>
                          }
                        </td>
                      </tr>);

                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Quiz Dialog */}
      <Dialog open={isQuizDialogOpen} onOpenChange={(open) => {
        setIsQuizDialogOpen(open);
        if (!open) resetQuizForm();
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingQuiz ? 'Edit Quiz' : 'Create Quiz'}</DialogTitle>
            <DialogDescription>
              {editingQuiz ? 'Update quiz details.' : 'Create a new quiz. You can add questions after creation.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={quizFormData.title}
                onChange={(e) => setQuizFormData({ ...quizFormData, title: e.target.value })}
                placeholder="Quiz title" />

            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={quizFormData.description}
                onChange={(e) => setQuizFormData({ ...quizFormData, description: e.target.value })}
                placeholder="Brief description of the quiz"
                rows={2} />

            </div>
            <div className="space-y-2">
              <Label htmlFor="semester">Target Semester *</Label>
              <Select
                value={quizFormData.semester}
                onValueChange={(value) => setQuizFormData({ ...quizFormData, semester: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={quizFormData.duration}
                  onChange={(e) => setQuizFormData({ ...quizFormData, duration: parseInt(e.target.value) })} />

              </div>
              <div className="space-y-2">
                <Label htmlFor="maxMarks">Max Marks</Label>
                <Input
                  id="maxMarks"
                  type="number"
                  min="1"
                  value={quizFormData.maxMarks}
                  onChange={(e) => setQuizFormData({ ...quizFormData, maxMarks: parseInt(e.target.value) })} />

              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuizDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleQuizSubmit}>{editingQuiz ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Questions Management Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={(open) => {
        setIsQuestionDialogOpen(open);
        if (!open) {
          resetQuestionForm();
          setSelectedQuiz(null);
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Questions - {selectedQuiz?.title}</DialogTitle>
            <DialogDescription>
              Add questions manually or upload from file (JSON/CSV)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Existing Questions - Expanded Editable View */}
            {selectedQuiz && selectedQuiz.questions.length > 0 &&
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">Existing Questions ({selectedQuiz.questions.length})</h4>
                  <p className="text-xs text-muted-foreground">Edit questions directly and click save</p>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {selectedQuiz.questions.map((q, i) => {
                    const isOwner = user && (user.role === 'admin' || String(user.id) === String(selectedQuiz.created_by_teacher_id));
                    return (
                      <div key={q.id} className="border border-border p-4 rounded-lg space-y-4 bg-card/50">

                        {/* Question Header & Actions */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <Label className="text-xs text-muted-foreground">Question {i + 1}</Label>
                            <Textarea
                              value={q.question}
                              onChange={(e) => handleLocalQuestionChange(q.id, 'question', e.target.value)}
                              className="min-h-[60px]"
                              disabled={!isOwner}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 -mt-1"
                            onClick={() => handleDeleteQuestion(q.id)}
                            disabled={!isOwner}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Options */}
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Options (Select correct answer)</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {q.options.map((opt, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correctAnswer-${q.id}`}
                                  checked={parseInt(q.correctAnswer) === optIndex}
                                  onChange={() => handleLocalQuestionChange(q.id, 'correctAnswer', optIndex)}
                                  className="w-4 h-4 accent-primary flex-shrink-0"
                                  disabled={!isOwner}
                                />
                                <Input
                                  value={opt}
                                  onChange={(e) => handleLocalQuestionChange(q.id, 'options', e.target.value, optIndex)}
                                  className="h-9"
                                  disabled={!isOwner}
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Footer: Marks & Save */}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2 w-32">
                            <Label className="text-xs whitespace-nowrap">Marks</Label>
                            <Input
                              type="number"
                              min="1"
                              value={q.marks}
                              onChange={(e) => handleLocalQuestionChange(q.id, 'marks', parseInt(e.target.value) || 0)}
                              className="h-8"
                              disabled={!isOwner}
                            />
                          </div>
                          <Button size="sm" onClick={() => handleSaveQuestion(q)} className="gap-2" disabled={!isOwner}>
                            <CheckCircle className="w-3 h-3" />
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            }

            {/* Upload Section */}
            <div className="flex items-center gap-4 p-4 border border-dashed border-border rounded-lg">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv"
                onChange={handleFileUpload}
                className="hidden" />

              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={!(user && selectedQuiz && (user.role === 'admin' || String(user.id) === String(selectedQuiz.created_by_teacher_id)))}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Questions
              </Button>
              <span className="text-sm text-muted-foreground">JSON or CSV format</span>
            </div>

            {/* Add Question Form */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-foreground">
                Add New Question
              </h4>
              <div className="space-y-2">
                <Label>Question *</Label>
                <Textarea
                  value={questionFormData.question}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, question: e.target.value })}
                  placeholder="Enter your question"
                  rows={2}
                  disabled={!(user && selectedQuiz && (user.role === 'admin' || String(user.id) === String(selectedQuiz.created_by_teacher_id)))}
                />

              </div>
              <div className="space-y-2">
                <Label>Options *</Label>
                <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2">
                  {questionFormData.options.map((option, i) =>
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updateOptionValue(i, e.target.value)}
                        placeholder={`Option ${i + 1}`}
                        disabled={!(user && selectedQuiz && (user.role === 'admin' || String(user.id) === String(selectedQuiz.created_by_teacher_id)))}
                      />

                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={parseInt(questionFormData.correctAnswer) === i}
                        onChange={() => setQuestionFormData({ ...questionFormData, correctAnswer: i })}
                        className="w-4 h-4 accent-primary"
                        disabled={!(user && selectedQuiz && (user.role === 'admin' || String(user.id) === String(selectedQuiz.created_by_teacher_id)))}
                      />

                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Select the correct answer</p>
              </div>
              <div className="w-32">
                <Label>Marks</Label>
                <Input
                  type="number"
                  min="1"
                  value={questionFormData.marks}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, marks: parseInt(e.target.value) })}
                  disabled={!(user && selectedQuiz && (user.role === 'admin' || String(user.id) === String(selectedQuiz.created_by_teacher_id)))}
                />

              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    console.log("Add Question Clicked");
                    console.log("Form Data:", questionFormData);
                    handleAddQuestion();
                  }}
                  disabled={!(user && selectedQuiz && (user.role === 'admin' || String(user.id) === String(selectedQuiz.created_by_teacher_id)))}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Question
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Quiz Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingQuiz?.title}"? This will also delete all questions and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingQuiz(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuiz}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">

              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);

}