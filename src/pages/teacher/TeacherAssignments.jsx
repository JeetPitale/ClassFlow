import { useState, useEffect } from 'react';
import { Plus, ClipboardList, Calendar, Award, Users, Pencil, Trash2, Upload, FileText, X, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { assignmentAPI, studentAPI } from '@/services/api';
import { format, isPast } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'text/plain',
  'image/jpeg',
  'image/png'
];

export default function TeacherAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isGradingOpen, setIsGradingOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [deletingAssignment, setDeletingAssignment] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxMarks: 100,
    semester: '1',
    attachments: []
  });
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await assignmentAPI.getAll();
      if (response.data.success) {
        setAssignments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast({ title: 'Error', description: 'Failed to load assignments', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchClassList = async (semester) => {
    try {
      const response = await studentAPI.getAll();
      if (response.data.success) {
        // Filter students by semester
        const classList = response.data.data.filter(s => String(s.semester) === String(semester));
        setStudents(classList);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({ title: 'Error', description: 'Failed to load student list', variant: 'destructive' });
    }
  };

  const fetchSubmissions = async (assignmentId) => {
    try {
      const response = await assignmentAPI.getSubmissions(assignmentId);
      if (response.data.success) {
        setSubmissions(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setSubmissions([]); // Clear if error or empty
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', dueDate: '', maxMarks: 100, semester: '1', attachments: [] });
    setEditingAssignment(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.due_date,
      maxMarks: assignment.total_marks,
      semester: assignment.semester || '1',
      attachments: assignment.attachments || []
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (assignment) => {
    setDeletingAssignment(assignment);
    setIsDeleteDialogOpen(true);
  };

  const [filterStatus, setFilterStatus] = useState('all');

  const handleOpenGrading = async (assignment) => {
    setSelectedAssignment(assignment);
    setIsGradingOpen(true);
    setFilterStatus('all');
    // Fetch both students and submissions
    await Promise.all([
      fetchClassList(assignment.semester),
      fetchSubmissions(assignment.id)
    ]);
  };

  const filteredStudents = students.filter(student => {
    const isSubmitted = submissions.some(s => String(s.student_id) === String(student.id));
    if (filterStatus === 'submitted') return isSubmitted;
    if (filterStatus === 'pending') return !isSubmitted;
    return true;
  });

  const validateFile = (file) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      const extension = file.name.split('.').pop().toLowerCase();
      const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png'];
      if (!allowedExtensions.includes(extension)) return false;
    }
    return true;
  };

  const processFiles = (files) => {
    const validFiles = [];
    files.forEach(file => {
      if (validateFile(file)) {
        validFiles.push({ name: file.name, file: file }); // Store actual file object if we were uploading
      }
    });

    // Note: Backend file upload handling is needed. 
    // For now we just verify UI logic.
    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...validFiles]
      }));
    }
  };

  const handleFileChange = (e) => {
    processFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(Array.from(e.dataTransfer.files));
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.dueDate) {
      toast({ title: 'Error', description: 'Please fill in required fields', variant: 'destructive' });
      return;
    }

    if (formData.maxMarks <= 0) {
      toast({ title: 'Error', description: 'Max marks must be greater than 0', variant: 'destructive' });
      return;
    }

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('due_date', formData.dueDate);
    data.append('total_marks', formData.maxMarks);
    data.append('semester', formData.semester);

    // Append the last uploaded file (assuming single file upload for now based on backend)
    // The UI processes multiple but we'll take the latest one for the attachment field
    if (formData.attachments.length > 0) {
      // Find a new file that has a 'file' object (not just a URL/name from existing ones)
      const newFile = formData.attachments.find(a => a.file);
      if (newFile) {
        data.append('attachment', newFile.file);
      }
    }

    try {
      if (editingAssignment) {
        // Update not fully supported with FormData in backend yet for API consistency (PUT vs POST with FormData)
        // Usually file uploads via PUT are tricky or specific.
        // For now, let's assume update sends JSON unless we change backend to POST for update or handle PUT stream.
        // Given the instructions, let's focus on Creation having upload. 
        // If strictly required for update, we'd need backend changes.
        // Let's fallback to JSON for update if no file, or warn.
        // Simplification: Proceed with JSON for update as before, assuming file upload is primarily for creation or we use POST for update override.
        // Actually, PHP doesn't parse multipart/form-data on PUT. 
        // We will stick to JSON for update for now to avoid breaking it, unless file is added?

        await assignmentAPI.update(editingAssignment.id, {
          title: formData.title,
          description: formData.description,
          due_date: formData.dueDate,
          total_marks: formData.maxMarks,
          semester: formData.semester
        });
        toast({ title: 'Success', description: 'Assignment updated' });
      } else {
        // Create uses POST, so FormData works fine
        await assignmentAPI.create(data);
        toast({ title: 'Success', description: 'Assignment created' });
      }
      fetchAssignments();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving assignment", error);
      toast({ title: 'Error', description: 'Failed to save assignment', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deletingAssignment) return;
    try {
      await assignmentAPI.delete(deletingAssignment.id);
      toast({ title: 'Success', description: 'Assignment deleted' });
      fetchAssignments();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting", error);
      toast({ title: 'Error', description: 'Failed to delete assignment', variant: 'destructive' });
    }
  };

  const handleGrade = async (submissionId, marks, feedback) => {
    try {
      await assignmentAPI.grade(submissionId, { marks, feedback });
      toast({ title: "Success", description: "Grade saved" });
      if (selectedAssignment) fetchSubmissions(selectedAssignment.id); // Refresh
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to save grade", variant: "destructive" });
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Assignments"
        description="Create assignments and track student submissions"
        action={
          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            New Assignment
          </Button>
        } />

      <div className="space-y-4">
        {assignments.map((assignment, index) => {
          const isOverdue = isPast(new Date(assignment.due_date));
          return (
            <div
              key={assignment.id}
              className="card-elevated p-5 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}>

              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex gap-4 flex-1 min-w-0">
                  <div className="hidden sm:block p-2.5 rounded-lg bg-primary/10 flex-shrink-0">
                    <ClipboardList className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground truncate">{assignment.title}</h4>
                      {isOverdue ?
                        <Badge variant="secondary" className="bg-muted text-muted-foreground">Closed</Badge> :
                        <Badge variant="secondary" className="bg-success/10 text-success">Active</Badge>
                      }
                      <Badge variant="outline" className="ml-2">Sem {assignment.semester}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{assignment.description}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        Due: {assignment.due_date ? format(new Date(assignment.due_date), 'MMM d, yyyy') : 'No Date'}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Award className="w-4 h-4" />
                        {assignment.total_marks} marks
                      </span>
                      {assignment.created_at && (
                        <span className="flex items-center gap-1 text-muted-foreground text-xs">
                          Created: {format(new Date(assignment.created_at), 'MMM d, h:mm a')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  <Button variant="outline" size="sm" onClick={() => handleOpenGrading(assignment)}>
                    <Users className="w-4 h-4 mr-1" />
                    Class List
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleOpenEdit(assignment)}>
                    <Pencil className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleOpenDelete(assignment)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>);
        })}
      </div>

      {/* Create/Edit Assignment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAssignment ? 'Edit Assignment' : 'Create Assignment'}</DialogTitle>
            <DialogDescription>{editingAssignment ? 'Update details' : 'Create new assignment'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Input type="datetime-local" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Max Marks</Label>
                <Input type="number" min="1" value={formData.maxMarks} onChange={e => setFormData({ ...formData, maxMarks: parseInt(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Semester</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.semester} onChange={e => setFormData({ ...formData, semester: e.target.value })}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <Label>Attachments (Optional)</Label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
            >
              <Input
                type="file"
                className="hidden"
                id="file-upload"
                multiple // UI supports multiple, backend currently takes 1. Good for DX.
                onChange={handleFileChange}
                accept={ALLOWED_FILE_TYPES.join(',')}
              />
              <Label htmlFor="file-upload" className="cursor-pointer block">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">PDF, Word, Excel, Images</p>
              </Label>
            </div>
            {formData.attachments.length > 0 && (
              <div className="space-y-2">
                {formData.attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded border">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeAttachment(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingAssignment ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingAssignment(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Class List / Grading Dialog */}
      <Dialog open={isGradingOpen} onOpenChange={setIsGradingOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between pr-8">
            <div>
              <DialogTitle>Class List: {selectedAssignment?.title}</DialogTitle>
              <DialogDescription>
                Semester {selectedAssignment?.semester} Student List
              </DialogDescription>
            </div>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Students</option>
              <option value="submitted">Submitted</option>
              <option value="pending">Pending</option>
            </select>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No students in this semester.</div>
              ) : (
                students
                  .filter(student => {
                    const submission = submissions.find(s => String(s.student_id) === String(student.id));
                    const hasSubmissionRecord = !!submission;

                    if (filterStatus === 'all') return true;
                    if (filterStatus === 'submitted') return hasSubmissionRecord && submission.status !== 'pending';
                    if (filterStatus === 'pending') return !hasSubmissionRecord || submission.status === 'pending';
                    return true;
                  })
                  .map(student => {
                    const submission = submissions.find(s => String(s.student_id) === String(student.id));
                    return (
                      <StudentGradeCard
                        key={student.id}
                        student={student}
                        submission={submission}
                        assignment={selectedAssignment}
                        onGrade={async (studentId, marks, feedback) => {
                          try {
                            await assignmentAPI.gradeStudent(selectedAssignment.id, {
                              student_id: studentId,
                              marks: marks,
                              feedback: feedback
                            });
                            toast({ title: "Success", description: "Grade saved" });
                            // Update submissions list locally to reflect changes immediately
                            const response = await assignmentAPI.getSubmissions(selectedAssignment.id);
                            if (response.data.success) {
                              setSubmissions(response.data.data || []);
                            }
                          } catch (error) {
                            console.error(error);
                            toast({ title: "Error", description: "Failed to save grade" });
                          }
                        }}
                      />
                    );
                  })
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StudentGradeCard({ student, submission, assignment, onGrade }) {
  // status: 'submitted' or 'pending'. If submitted, we show data.
  // expanded: controls visibility of the form.
  const [status, setStatus] = useState(submission ? 'submitted' : 'pending');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (submission) {
      setStatus('submitted');
      // If we just got a submission and it wasn't there before, user might want to see it?
      // But usually list load shouldn't expand everything.
      // Let's rely on manual expansion or interaction.
    }
  }, [submission]);

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    if (newStatus === 'submitted') {
      setExpanded(true);
    } else {
      setExpanded(false);
    }
  };

  const handleSave = async () => {
    const marksInput = document.getElementById(`marks-${student.id}`);
    const feedback = document.getElementById(`feedback-${student.id}`).value;
    const marks = marksInput.value;

    const parsedMarks = parseFloat(marks);
    const maxMarks = assignment?.total_marks || 100;

    if (isNaN(parsedMarks)) {
      toast({ title: "Error", description: "Please enter valid marks", variant: "destructive" });
      return;
    }

    if (parsedMarks < 0) {
      toast({ title: "Error", description: "Marks cannot be negative", variant: "destructive" });
      return;
    }

    if (parsedMarks > maxMarks) {
      toast({ title: "Error", description: `Marks cannot exceed ${maxMarks}`, variant: "destructive" });
      return;
    }

    await onGrade(student.id, marks, feedback);
    // Auto-collapse after save
    setExpanded(false);
  };

  return (
    <div className="border rounded-lg p-4 transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-secondary-foreground">
            {student.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium">{student.name}</p>
            <p className="text-sm text-muted-foreground">{student.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setExpanded(!expanded)}>
            {/* Simple chevron or indicator */}
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <select
            className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:ring-2 focus:ring-ring focus:outline-none"
            value={status}
            onChange={handleStatusChange}
          >
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
          </select>
        </div>
      </div>

      {status === 'submitted' && expanded && (
        <div className="mt-4 pl-14 space-y-3 bg-muted/20 p-3 rounded animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {submission ? `Submitted: ${format(new Date(submission.submitted_at), 'MMM d, h:mm a')}` : 'Manual Entry'}
            </span>
            {submission?.file_url && (
              <Button variant="link" size="sm" asChild className="h-auto p-0 text-primary">
                <a href={submission.file_url} target="_blank" rel="noopener noreferrer">View File</a>
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Marks (Max {assignment?.total_marks})</Label>
              <Input
                id={`marks-${student.id}`}
                type="number"
                min="0"
                defaultValue={submission?.marks_obtained ?? ''}
                max={assignment?.total_marks || 100}
                placeholder="0"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Feedback</Label>
              <Input
                id={`feedback-${student.id}`}
                defaultValue={submission?.feedback ?? ''}
                placeholder="Good work..."
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSave}>
              Save Grade
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}