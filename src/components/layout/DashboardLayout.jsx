import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';






export function DashboardLayout({ requiredRole }) {
  const { user, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (user?.role !== requiredRole) {
    return <Navigate to={`/${user?.role}`} replace />;
  }

  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
        <footer className="border-t bg-background px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-foreground font-semibold">
            <p>© 2025 ClassFlow. All rights reserved.</p>
            <p>Developed by Mustafa Khericha & Jeet Pitale</p>
          </div>
        </footer>
      </div>
    </div>);


}