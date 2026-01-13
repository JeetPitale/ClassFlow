import { useState, useEffect } from 'react';
import { Plus, FileText, Image, Music, Link, Trash2, Download } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileUpload } from '@/components/ui/file-upload';
import { Badge } from '@/components/ui/badge';
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
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from
  '@/components/ui/select';

import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { materialAPI } from '@/services/api';

const typeIcons = {
  pdf: FileText,
  doc: FileText,
  slides: FileText,
  image: Image,
  audio: Music,
  link: Link
};

const typeColors = {
  pdf: 'bg-destructive/10 text-destructive',
  doc: 'bg-info/10 text-info',
  slides: 'bg-warning/10 text-warning',
  image: 'bg-success/10 text-success',
  audio: 'bg-purple-500/10 text-purple-500',
  link: 'bg-primary/10 text-primary'
};

const acceptedFileTypes = {
  pdf: '.pdf',
  doc: '.doc,.docx',
  slides: '.ppt,.pptx',
  image: '.jpg,.jpeg,.png,.gif',
  audio: '.mp3,.wav,.ogg'
};

const allAcceptedTypes = Object.values(acceptedFileTypes).join(',');

export default function TeacherMaterials() {
  const [materials, setMaterials] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const [materialToDelete, setMaterialToDelete] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'pdf',
    url: '',
    semester: '1'
  });

  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    fetchMaterials();
  }, [token]);

  const fetchMaterials = async () => {
    try {
      const response = await fetch('https://classflow-backend-jeet.azurewebsites.net/api/materials', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMaterials(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch materials:', error);
      toast({ title: 'Error', description: 'Failed to load materials', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleFilesSelected = (files) => {
    if (files.length > 0) {
      const file = files[0];
      const extension = '.' + file.name.split('.').pop().toLowerCase();

      // Auto-detect type
      let detectedType = null;
      for (const [type, extensions] of Object.entries(acceptedFileTypes)) {
        if (extensions.split(',').includes(extension)) {
          detectedType = type;
          break;
        }
      }

      if (detectedType && detectedType !== formData.type) {
        setFormData(prev => ({ ...prev, type: detectedType }));
        toast({
          title: "Type Detected",
          description: `Switched to ${detectedType.toUpperCase()} based on file.`
        });
      }
    }
    setSelectedFiles(files);
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      toast({ title: 'Error', description: 'Please enter a title', variant: 'destructive' });
      return;
    }

    // In a real app, we would upload the file here and get a URL/path
    // For now, we'll just use the file name as the path if a file is selected
    const filePath = selectedFiles.length > 0 ? selectedFiles[0].name : formData.url;

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('semester', formData.semester);

      // ... (inside handleSubmit)

      if (formData.type === 'link') {
        formDataToSend.append('file_path', formData.url);
        formDataToSend.append('file_type', 'link');
      } else if (selectedFiles.length > 0) {
        formDataToSend.append('file', selectedFiles[0]);
      } else {
        toast({ title: 'Error', description: 'Please select a file or enter a URL', variant: 'destructive' });
        return;
      }

      const response = await materialAPI.create(formDataToSend);

      if (response.data.success) {
        setMaterials([response.data.data, ...materials]);
        setFormData({ title: '', description: '', type: 'pdf', url: '', semester: '1' });
        setSelectedFiles([]);
        setIsDialogOpen(false);
        toast({ title: 'Success', description: 'Material uploaded successfully' });
      } else {
        toast({ title: 'Error', description: response.data.message || 'Failed to upload', variant: 'destructive' });
      }
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to upload material', variant: 'destructive' });
    }
  };

  const confirmDelete = async () => {
    if (!materialToDelete) return;

    try {
      const response = await fetch(`https://classflow-backend-jeet.azurewebsites.net/api/materials/${materialToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setMaterials(materials.filter((m) => m.id !== materialToDelete));
        toast({ title: 'Success', description: 'Material deleted' });
      } else {
        toast({ title: 'Error', description: 'Failed to delete material', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete material', variant: 'destructive' });
    } finally {
      setMaterialToDelete(null);
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Course Materials"
        description="Upload and manage learning materials for your students"
        action={
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Upload Material
          </Button>
        } />


      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.length === 0 && !loading ? (
          <p className="text-muted-foreground col-span-full">No materials found.</p>
        ) : (
          materials
            .filter(material => {
              // Frontend Strict Isolation
              if (!token) return false;
              try {
                const parts = token.split('.');
                if (parts.length !== 3) return false; // Invalid JWT format
                const userData = JSON.parse(atob(parts[1]));
                if (userData.role === 'admin') return true;
                return String(material.uploaded_by_teacher_id) === String(userData.user_id);
              } catch (e) {
                console.error("Error parsing token for material isolation:", e);
                return false;
              }
            })
            .map((material, index) => {
              const Icon = typeIcons[material.file_type] || FileText;

              return (
                <div
                  key={material.id}
                  className="card-elevated p-5 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}>

                  <div className="flex items-start gap-4">
                    <div className={`hidden sm:block p-2.5 rounded-lg ${typeColors[material.file_type] || 'bg-gray-100'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-foreground truncate max-w-[70%]">{material.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          Sem {material.semester}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {material.description}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="secondary" className={typeColors[material.file_type] || 'bg-gray-100'}>
                          {(material.file_type || 'Unknown').toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {material.created_at ? format(new Date(material.created_at), 'MMM d, yyyy') : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                    <span className="text-xs text-muted-foreground flex-1">
                      Uploaded by: {material.teacher_name || 'Unknown'}
                    </span>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    {/* Only show delete if user is admin or owner */}
                    {/* Note: We need user from context. Assuming useAuth provides { user } */}
                    {(token && (JSON.parse(atob(token.split('.')[1])).role === 'admin' || String(JSON.parse(atob(token.split('.')[1])).user_id) === String(material.uploaded_by_teacher_id))) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setMaterialToDelete(material.id)}>

                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>);

            }))}
      </div>

      <AlertDialog open={!!materialToDelete} onOpenChange={() => setMaterialToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the material.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Material</DialogTitle>
            <DialogDescription>
              Upload course materials for your students to access.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Material title" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester">Target Semester *</Label>
              <Select
                value={formData.semester}
                onValueChange={(value) => setFormData({ ...formData, semester: value })}
              >
                <SelectTrigger id="semester">
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the material"
                rows={2} />

            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => {
                  setFormData({ ...formData, type: value });
                  setSelectedFiles([]); // Clear files when type changes
                }
                }>

                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="doc">Word Document</SelectItem>
                  <SelectItem value="slides">Slides/Presentation</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="link">External Link</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.type === 'link' ?
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..." />

              </div> :

              <FileUpload
                accept={allAcceptedTypes}
                onFilesSelected={handleFilesSelected} />

            }
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Upload Material
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);

}