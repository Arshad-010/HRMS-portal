import React, { useState, useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';

export function App() {
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('hrms_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('hrms_sidebar_collapsed', isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans">
            <Sidebar 
              isMobileOpen={isSidebarMobileOpen} 
              setIsMobileOpen={setIsSidebarMobileOpen}
              isCollapsed={isSidebarCollapsed}
            />
            
            <div className="flex-1 flex flex-col min-w-0">
              <Navbar 
                toggleMobileSidebar={() => setIsSidebarMobileOpen(true)}
                isCollapsed={isSidebarCollapsed}
                toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              />
              <main className="flex-1 overflow-x-hidden">
                <AppRoutes />
              </main>
              <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500">
                HRMS Portal &copy; {new Date().getFullYear()} &bull; Enterprise HR Suite
              </footer>
            </div>
          </div>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
