import { useState, useEffect } from 'react';
import { Megaphone } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { announcementAPI } from '@/services/api';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function StudentAnnouncements() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingAnnouncement, setViewingAnnouncement] = useState(null);

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
                description="View important announcements and updates"
            />

            <div className="space-y-4">
                {announcements.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No announcements yet.</p>
                    </div>
                ) : (
                    announcements.map((announcement, index) => (
                        <div
                            key={announcement.id}
                            className="card-elevated p-5 animate-slide-up cursor-pointer hover:shadow-lg transition-shadow"
                            style={{ animationDelay: `${index * 50}ms` }}
                            onClick={() => setViewingAnnouncement(announcement)}
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 rounded-lg bg-primary/10 flex-shrink-0">
                                    <Megaphone className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-foreground mb-1">
                                        {announcement.title}
                                    </h3>
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
                        </div>
                    ))
                )}
            </div>

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
                            <p className="text-muted-foreground">{viewingAnnouncement?.creator_name || 'Admin'}</p>
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
