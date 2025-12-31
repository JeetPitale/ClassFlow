import { useState, useEffect } from 'react';
import { Menu, Bell, LogOut, ChevronDown, Clock, Megaphone, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '@/services/api';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();

      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getAll();
      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      if (response.data.success) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      await notificationAPI.markAsRead(notification.id);

      // Navigate to link
      if (notification.link) {
        navigate(notification.link);
      }

      // Refresh data
      await fetchNotifications();
      await fetchUnreadCount();
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      toast.success('All notifications marked as read');
      await fetchNotifications();
      await fetchUnreadCount();
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'announcement':
        return <Megaphone className="w-4 h-4 text-primary shrink-0" />;
      case 'assignment':
        return <Bell className="w-4 h-4 text-info shrink-0" />;
      case 'material':
        return <Bell className="w-4 h-4 text-success shrink-0" />;
      case 'quiz':
        return <Bell className="w-4 h-4 text-warning shrink-0" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground shrink-0" />;
    }
  };

  const unreadNotifications = notifications.filter(n => !n.is_read);

  return (
    <header className="h-16 bg-card border-b border-border px-4 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md hover:bg-muted transition-colors">
          <Menu className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Digital Clock */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-md border border-border">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <div className="flex flex-col items-end leading-none">
            <span className="text-xs text-muted-foreground font-medium">
              {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <span className="text-sm font-medium font-mono">
              {time.toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2">
              <DropdownMenuLabel>Notifications ({unreadCount})</DropdownMenuLabel>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-auto p-1 text-xs" onClick={handleMarkAllAsRead}>
                  Mark all read
                </Button>
              )}
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-[400px] overflow-y-auto">
              {unreadNotifications.length > 0 ? (
                unreadNotifications.slice(0, 10).map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {getNotificationIcon(notification.type)}
                      <span className="font-medium text-sm truncate flex-1">{notification.title}</span>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-primary rounded-full shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 w-full">
                      {notification.message}
                    </p>
                    <span className="text-[10px] text-muted-foreground self-end mt-1">
                      {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                    </span>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No new notifications
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user?.name?.charAt(0)}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground font-normal">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}