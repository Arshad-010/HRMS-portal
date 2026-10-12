import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { X, Search } from 'lucide-react';
import api from '../../api/axios';

const NewConversationModal = ({ isOpen, onClose, onStart }) => {
  const { startDirectConversation } = useChat();
  const { user } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Fetch all employees to chat with
      const res = await api.get('/employees');
      if (res.data.success) {
        // Filter out the current user
        const otherUsers = res.data.data.filter(emp => emp.user && emp.user._id !== user._id);
        setUsers(otherUsers);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(emp => {
    const fullName = `${emp.firstName} ${emp.lastName || ''}`.toLowerCase();
    const designation = (emp.designation || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || designation.includes(search);
  });

  const handleStartChat = async (userId) => {
    try {
      setActionLoading(true);
      const conversation = await startDirectConversation(userId);
      onClose();
      if (onStart) onStart(conversation._id);
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('Failed to start conversation.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Message</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search colleagues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 dark:text-slate-200 placeholder:text-slate-500 dark:text-slate-400"
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
          {loading ? (
            <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">Loading directory...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">No colleagues found.</div>
          ) : (
            filteredUsers.map(emp => (
              <button
                key={emp._id}
                disabled={actionLoading}
                onClick={() => handleStartChat(emp.user._id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0">
                  {emp.firstName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {emp.firstName} {emp.lastName}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {emp.designation || 'Employee'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default NewConversationModal;
