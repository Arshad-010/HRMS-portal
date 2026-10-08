import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { ChatProvider } from './context/ChatContext';

export function AppContent() {
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('hrms_sidebar_collapsed') === 'true';
  });
  
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    localStorage.setItem('hrms_sidebar_collapsed', isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  const isLoginPage = location.pathname === '/login';

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans ${isLoginPage ? 'h-screen overflow-hidden' : ''}`}>
      <Sidebar 
        isMobileOpen={isSidebarMobileOpen} 
        setIsMobileOpen={setIsSidebarMobileOpen}
        isCollapsed={isSidebarCollapsed}
      />
      
      <div className={`flex-1 flex flex-col min-w-0 ${isLoginPage ? 'h-screen overflow-hidden' : ''}`}>
        <Navbar 
          toggleMobileSidebar={() => setIsSidebarMobileOpen(true)}
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <main className={`flex-1 ${isLoginPage ? 'h-[calc(100vh-4rem)] overflow-hidden no-scrollbar' : 'overflow-x-hidden'}`}>
          <AppRoutes />
        </main>
        {isAuthenticated && (
          <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500">
            HRMS Portal &copy; {new Date().getFullYear()} &bull; Enterprise HR Suite
          </footer>
        )}
      </div>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <ChatProvider>
            <AppContent />
          </ChatProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
