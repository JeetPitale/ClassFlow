import { useState, useEffect } from 'react';
import { Plus, Search, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
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
import { teacherAPI } from '@/services/api';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ManageTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    dob: '',
    gender: '',
    address: '',
    subject_specialization: '',
    qualification: '',
    experience_years: ''
  });

  // Fetch teachers from API
  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await teacherAPI.getAll();
      if (response.data.success) {
        setTeachers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDialog = (teacher) => {
    setFormErrors({});
    if (teacher) {
      setEditingTeacher(teacher);
      setFormData({
        name: teacher.name,
        email: teacher.email,
        password: '',
        phone: teacher.phone || '',
        dob: teacher.dob || '',
        gender: teacher.gender || '',
        address: teacher.address || '',
        subject_specialization: teacher.subject_specialization || '',
        qualification: teacher.qualification || '',
        experience_years: teacher.experience_years || ''
      });
    } else {
      setEditingTeacher(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        dob: '',
        gender: '',
        address: '',
        subject_specialization: '',
        qualification: '',
        experience_years: ''
      });
    }
    setIsDialogOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name) errors.name = 'Full name is required';
    if (!formData.email) errors.email = 'Email address is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email address is invalid';

    if (!editingTeacher && !formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password && formData.password.length && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      if (editingTeacher) {
        // Update existing teacher
        const response = await teacherAPI.update(editingTeacher.id, formData);
        if (response.data.success) {
          toast.success('Teacher updated successfully');
          fetchTeachers();
          setIsDialogOpen(false);
        }
      } else {
        // Create new teacher
        const response = await teacherAPI.create(formData);
        if (response.data.success) {
          toast.success('Teacher added successfully');
          fetchTeachers();
          setIsDialogOpen(false);
        }
      }
    } catch (error) {
      console.error('Error saving teacher:', error);
      const message = error.response?.data?.message || 'Failed to save teacher';
      toast.error(message);

      if (error.response?.status === 409) {
        setFormErrors(prev => ({ ...prev, email: 'Email already exists' }));
      }
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return;

    try {
      const response = await teacherAPI.delete(id);
      if (response.data.success) {
        toast.success('Teacher deleted successfully');
        fetchTeachers();
      }
    } catch (error) {
      console.error('Error deleting teacher:', error);
      toast.error('Failed to delete teacher');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (teacher) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center">
            <span className="text-sm font-medium text-info">
              {teacher.name.charAt(0)}
            </span>
          </div>
          <span className="font-medium text-foreground">{teacher.name}</span>
        </div>
      )
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (teacher) => (
        <div className="flex flex-col text-sm">
          <span>{teacher.email}</span>
          <span className="text-muted-foreground">{teacher.phone}</span>
        </div>
      )
    },
    {
      key: 'details',
      header: 'Details',
      render: (teacher) => (
        <div className="flex flex-col text-xs text-muted-foreground">
          <span>{teacher.subject_specialization || 'Not specified'}</span>
          <span>{teacher.qualification || 'Not specified'}</span>
        </div>
      )
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (teacher) => (
        <span className="text-muted-foreground">
          {format(new Date(teacher.created_at), 'MMM d, yyyy')}
        </span>
      )
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (teacher) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleOpenDialog(teacher)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => handleDelete(teacher.id)}>
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
          <p>Loading teachers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Manage Teachers"
        description="Add, edit, or remove teachers from the system"
        action={
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Teacher
          </Button>
        }
      />

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search teachers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 max-w-sm"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredTeachers}
        keyExtractor={(teacher) => teacher.id}
        emptyMessage="No teachers found"
      />

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
            </DialogTitle>
            <DialogDescription>
              {editingTeacher ?
                'Update the teacher information below.' :
                'Fill in the details to add a new teacher.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className={formErrors.name ? "text-destructive" : ""}>Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="John Doe"
                  className={formErrors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {formErrors.name && <p className="text-xs text-destructive mt-1">{formErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className={formErrors.email ? "text-destructive" : ""}>Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="john@teacher.com"
                  className={formErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {formErrors.email && <p className="text-xs text-destructive mt-1">{formErrors.email}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className={formErrors.password ? "text-destructive" : ""}>
                {editingTeacher ? 'Password (leave blank to keep current)' : 'Password *'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder={editingTeacher ? "Enter new password" : "Enter password"}
                className={formErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {formErrors.password && <p className="text-xs text-destructive mt-1">{formErrors.password}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleInputChange('dob', e.target.value)}
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
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject Specialization</Label>
                <Input
                  id="subject"
                  value={formData.subject_specialization}
                  onChange={(e) => handleInputChange('subject_specialization', e.target.value)}
                  placeholder="e.g., Computer Science"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qualification">Qualification</Label>
                <Input
                  id="qualification"
                  value={formData.qualification}
                  onChange={(e) => handleInputChange('qualification', e.target.value)}
                  placeholder="e.g., M.Tech, PhD"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Experience (Years)</Label>
                <Input
                  id="experience"
                  type="number"
                  value={formData.experience_years}
                  onChange={(e) => handleInputChange('experience_years', e.target.value)}
                  placeholder="5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <textarea
                id="address"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter full address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingTeacher ? 'Save Changes' : 'Add Teacher'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}