import { useState, useEffect } from 'react';
import { Plus, Megaphone, Trash2, Edit2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { announcementAPI } from '@/services/api';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function TeacherAnnouncements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingAnnouncement, setViewingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '' });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await announcementAPI.getAll();
      if (response.data.success) {
        setAnnouncements(response.data.data);
      }
    } catch (error) {
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
        const response = await announcementAPI.update(editingId, {
          ...formData,
          target_audience: 'student'
        });
        if (response.data.success) {
          toast.success('Announcement updated!');
        }
      } else {
        const response = await announcementAPI.create({
          ...formData,
          target_audience: 'student'
        });
        if (response.data.success) {
          toast.success('Announcement posted to students!');
        }
      }

      setFormData({ title: '', content: '' });
      setEditingId(null);
      setIsDialogOpen(false);
      await fetchAnnouncements();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to save announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (announcement) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      content: announcement.content
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await announcementAPI.delete(id);
      if (response.data.success) {
        toast.success('Announcement deleted!');
        await fetchAnnouncements();
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete announcement');
    }
  };

  const handleNewAnnouncement = () => {
    setEditingId(null);
    setFormData({ title: '', content: '' });
    setIsDialogOpen(true);
  };

  // Split announcements into received and sent
  const receivedAnnouncements = announcements.filter(a =>
    (a.target_audience === 'all' || a.target_audience === 'teacher') &&
    !(a.created_by_role === 'teacher' && a.created_by_id === user?.id)
  );

  const sentAnnouncements = announcements.filter(a =>
    a.created_by_role === 'teacher' && a.created_by_id === user?.id
  );

  const AnnouncementCard = ({ announcement, showActions = false }) => {
    return (
      <div
        className="card-elevated p-5 animate-slide-up cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => !showActions && setViewingAnnouncement(announcement)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4 flex-1">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Megaphone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium">{announcement.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{announcement.content}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                <span>
                  {showActions ? 'Posted' : 'By ' + (announcement.creator_name || 'Unknown')} {format(new Date(announcement.created_at), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
            </div>
          </div>
          {showActions && (
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
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

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <PageHeader
        title="Announcements"
        description="Post announcements to your students"
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
            <p className="text-center text-muted-foreground py-8">No received announcements</p>
          ) : (
            receivedAnnouncements.map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} showActions={false} />
            ))
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4 mt-6">
          {sentAnnouncements.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No sent announcements yet</p>
          ) : (
            sentAnnouncements.map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} showActions={true} />
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update your announcement to students' : 'Post an announcement to your students'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Announcement title" disabled={submitting} />
              </div>
              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea id="content" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder="Write your announcement..." rows={4} disabled={submitting} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); setEditingId(null); }} disabled={submitting}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? (editingId ? 'Updating...' : 'Posting...') : (editingId ? 'Update' : 'Post')}</Button>
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
                <DialogDescription className="mt-1">
                  Posted {viewingAnnouncement && format(new Date(viewingAnnouncement.created_at), 'MMM d, yyyy h:mm a')}
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
            <div className="text-sm">
              <h4 className="font-medium mb-1">Posted By</h4>
              <p className="text-muted-foreground">{viewingAnnouncement?.creator_name || 'Unknown'}</p>
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