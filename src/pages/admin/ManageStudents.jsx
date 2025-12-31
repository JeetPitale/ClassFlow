import { useState, useEffect } from 'react';
import { Plus, Search, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { studentAPI } from '@/services/api';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    dob: '',
    gender: '',
    address: '',
    semester: '',
    enrollment_no: '',
    department: ''
  });

  // Fetch students from API
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getAll();
      if (response.data.success) {
        setStudents(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      (selectedSemester === 'all' || String(student.semester) === String(selectedSemester)) &&
      (student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.enrollment_no && student.enrollment_no.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const handleOpenDialog = (student) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        name: student.name,
        email: student.email,
        password: '',
        phone: student.phone || '',
        dob: student.dob || '',
        gender: student.gender || '',
        address: student.address || '',
        semester: student.semester || '',
        enrollment_no: student.enrollment_no || '',
        department: student.department || ''
      });
    } else {
      setEditingStudent(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        dob: '',
        gender: '',
        address: '',
        semester: '',
        enrollment_no: '',
        department: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || (!editingStudent && !formData.password)) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingStudent) {
        // Update existing student
        const response = await studentAPI.update(editingStudent.id, formData);
        if (response.data.success) {
          toast.success('Student updated successfully');
          fetchStudents();
        }
      } else {
        // Create new student
        const response = await studentAPI.create(formData);
        if (response.data.success) {
          toast.success('Student added successfully');
          fetchStudents();
        }
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving student:', error);
      toast.error(error.response?.data?.message || 'Failed to save student');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
      const response = await studentAPI.delete(id);
      if (response.data.success) {
        toast.success('Student deleted successfully');
        fetchStudents();
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to delete student');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (student) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {student.name.charAt(0)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{student.name}</span>
            <span className="text-xs text-muted-foreground">{student.enrollment_no}</span>
          </div>
        </div>
      )
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (student) => (
        <div className="flex flex-col text-sm">
          <span>{student.email}</span>
          <span className="text-muted-foreground">{student.phone}</span>
        </div>
      )
    },
    {
      key: 'semester',
      header: 'Sem',
      render: (student) => <span className="font-medium">Sem {student.semester}</span>
    },
    {
      key: 'details',
      header: 'Details',
      render: (student) => (
        <div className="flex flex-col text-xs text-muted-foreground">
          <span>{student.gender}, {student.dob}</span>
          <span className="truncate max-w-[150px]" title={student.address}>{student.address}</span>
        </div>
      )
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (student) => (
        <span className="text-muted-foreground">
          {format(new Date(student.created_at), 'MMM d, yyyy')}
        </span>
      )
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (student) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleOpenDialog(student)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => handleDelete(student.id)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <p>Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Manage Students"
        description="Add, edit, or remove students from the system"
        action={
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        }
      />

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 max-w-sm"
        />
      </div>

      {/* Table */}
      <Tabs defaultValue="all" onValueChange={(val) => setSelectedSemester(val)}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <TabsTrigger key={sem} value={String(sem)}>Sem {sem}</TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-0">
          <DataTable
            columns={columns}
            data={filteredStudents}
            keyExtractor={(student) => student.id}
            emptyMessage="No students found"
          />
        </TabsContent>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
          <TabsContent key={sem} value={String(sem)} className="mt-0">
            <DataTable
              columns={columns}
              data={filteredStudents}
              keyExtractor={(student) => student.id}
              emptyMessage={`No students found in Semester ${sem}`}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStudent ? 'Edit Student' : 'Add New Student'}
            </DialogTitle>
            <DialogDescription>
              {editingStudent ?
                'Update the student information below.' :
                'Fill in the details to add a new student.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="enrollment_no">Enrollment Number *</Label>
                <Input
                  id="enrollment_no"
                  value={formData.enrollment_no}
                  onChange={(e) => setFormData({ ...formData, enrollment_no: e.target.value })}
                  placeholder="ENR001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">Semester *</Label>
                <select
                  id="semester"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@student.edu"
                />
              </div>
            </div>

            {!editingStudent && (
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Computer Science"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <textarea
                id="address"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter full address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingStudent ? 'Save Changes' : 'Add Student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}