import { useState, useEffect } from 'react';
import { Plus, Megaphone, Trash2, Edit2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { announcementAPI } from '@/services/api';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminAnnouncements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingAnnouncement, setViewingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    target_audience: 'all'
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await announcementAPI.getAll();
      if (response.data.success) {
        setAnnouncements(response.data.data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!formData.title?.trim() || !formData.content?.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);

      if (editingId) {
        const response = await announcementAPI.update(editingId, formData);
        if (response.data.success) {
          toast.success('Announcement updated successfully!');
        }
      } else {
        const response = await announcementAPI.create(formData);
        if (response.data.success) {
          toast.success('Announcement published successfully!');
        }
      }

      setFormData({ title: '', content: '', target_audience: 'all' });
      setEditingId(null);
      setIsDialogOpen(false);
      await fetchAnnouncements();
    } catch (error) {
      console.error('Submit error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to save announcement';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (announcement) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      target_audience: announcement.target_audience
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await announcementAPI.delete(id);
      if (response.data.success) {
        toast.success('Announcement deleted successfully!');
        await fetchAnnouncements();
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete announcement');
    }
  };

  const handleNewAnnouncement = () => {
    setEditingId(null);
    setFormData({ title: '', content: '', target_audience: 'all' });
    setIsDialogOpen(true);
  };

  const audienceLabels = {
    all: 'Everyone',
    teacher: 'Teachers',
    student: 'Students'
  };

  const audienceColors = {
    all: 'bg-primary/10 text-primary',
    teacher: 'bg-info/10 text-info',
    student: 'bg-success/10 text-success'
  };

  // Split announcements into received and sent
  const receivedAnnouncements = announcements.filter(a =>
    a.target_audience === 'all' || a.target_audience === 'admin' || a.created_by_id !== user?.id
  );

  const sentAnnouncements = announcements.filter(a =>
    a.created_by_role === 'admin' && a.created_by_id === user?.id
  );

  const AnnouncementCard = ({ announcement, showActions = false }) => {
    return (
      <div
        className="card-elevated p-5 animate-slide-up cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => !showActions && setViewingAnnouncement(announcement)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4 flex-1 min-w-0">
            <div className="p-2.5 rounded-lg bg-primary/10 flex-shrink-0">
              <Megaphone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-foreground truncate">
                  {announcement.title}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${audienceColors[announcement.target_audience]}`}>
                  {audienceLabels[announcement.target_audience]}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {announcement.content}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>By {announcement.creator_name || 'Admin'}</span>
                <span>•</span>
                <span>{format(new Date(announcement.created_at), 'MMM d, yyyy h:mm a')}</span>
              </div>
            </div>
          </div>
          {showActions && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-primary"
                onClick={() => handleEdit(announcement)}
                title="Edit announcement"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(announcement.id)}
                title="Delete announcement"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <p>Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Announcements"
        description="Create and manage announcements for teachers and students"
        action={
          <Button onClick={handleNewAnnouncement}>
            <Plus className="w-4 h-4 mr-2" />
            New Announcement
          </Button>
        }
      />

      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="received">Received ({receivedAnnouncements.length})</TabsTrigger>
          <TabsTrigger value="sent">Sent ({sentAnnouncements.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-4 mt-6">
          {receivedAnnouncements.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No received announcements</p>
            </div>
          ) : (
            receivedAnnouncements.map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} showActions={false} />
            ))
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4 mt-6">
          {sentAnnouncements.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No sent announcements yet. Create your first one!</p>
            </div>
          ) : (
            sentAnnouncements.map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} showActions={true} />
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Announcement' : 'Create Announcement'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update your announcement details' : 'Publish a new announcement to your selected audience'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Announcement title"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your announcement here..."
                  rows={4}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select
                  value={formData.target_audience}
                  onValueChange={(value) => setFormData({ ...formData, target_audience: value })}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="teacher">Teachers Only</SelectItem>
                    <SelectItem value="student">Students Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingId(null);
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
              >
                {submitting ? (editingId ? 'Updating...' : 'Publishing...') : (editingId ? 'Update' : 'Publish')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Announcement Dialog */}
      <Dialog open={!!viewingAnnouncement} onOpenChange={() => setViewingAnnouncement(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Megaphone className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <DialogTitle>{viewingAnnouncement?.title}</DialogTitle>
                <DialogDescription>
                  <span className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${audienceColors[viewingAnnouncement?.target_audience]}`}>
                      {audienceLabels[viewingAnnouncement?.target_audience]}
                    </span>
                  </span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Content</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {viewingAnnouncement?.content}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-1">Posted By</h4>
                <p className="text-muted-foreground">{viewingAnnouncement?.creator_name || 'Admin'}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Posted On</h4>
                <p className="text-muted-foreground">
                  {viewingAnnouncement && format(new Date(viewingAnnouncement.created_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingAnnouncement(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}