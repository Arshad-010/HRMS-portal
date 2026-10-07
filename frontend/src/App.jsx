import React from 'react';
import Navbar from './components/layout/Navbar';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';

export function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">
          <AppRoutes />
        </main>
        <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
          HRMS Portal &copy; {new Date().getFullYear()} &bull; Architecture Foundation
        </footer>
      </div>
    </AuthProvider>
  );
}

export default App;
