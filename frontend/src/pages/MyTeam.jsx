import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import {
  Users, Search, MessageSquare, Mail, Building2,
  AlertCircle, Briefcase, ChevronRight, Phone, CheckSquare, Clock
} from 'lucide-react';
import SkeletonLoader from '../components/common/SkeletonLoader';

const MyTeam = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { startDirectConversation, selectConversation, onlineUsers } = useChat();
  
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('legacy');
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamTasks, setTeamTasks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const teamsRes = await api.get('/teams/my-teams').catch(() => null);
        const explicitTeams = teamsRes?.data?.success ? teamsRes.data.data : [];
        setTeams(explicitTeams);

        if (explicitTeams.length > 0) {
          setSelectedTeamId(explicitTeams[0]._id);
        } else {
          setSelectedTeamId('legacy');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load team data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchTeamDetails = async () => {
      if (!selectedTeamId) return;
      
      setLoading(true);
      try {
        const queryStr = selectedTeamId !== 'legacy' ? `?teamId=${selectedTeamId}` : '';
        
        let membersData = [];
        if (selectedTeamId === 'legacy') {
          const res = await api.get('/employees/team').catch(() => null);
          membersData = res?.data?.success ? res.data.data : [];
        } else {
          const selected = teams.find(t => t._id === selectedTeamId);
          if (selected) {
            const membersList = [...(selected.members || [])];
            if (selected.teamLeadId && !membersList.some(m => m._id === selected.teamLeadId._id)) {
              membersList.unshift(selected.teamLeadId);
            }
            membersData = membersList;
          }
        }
        setTeamMembers(membersData);

        const tasksRes = await api.get(`/tasks/team-summary${queryStr}`).catch(() => null);

        if (tasksRes?.data?.success) {
          setTeamTasks(tasksRes.data.data);
        } else {
          setTeamTasks(null);
        }
      } catch (err) {
        console.error('Failed to load team details', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamDetails();
  }, [selectedTeamId, teams]);

  const handleTeamChange = (e) => {
    setSelectedTeamId(e.target.value);
  };

  const handleMessage = async (memberUserId) => {
    if (!memberUserId) return;
    try {
      const conv = await startDirectConversation(memberUserId);
      if (conv) {
        selectConversation(conv._id);
        navigate('/chat');
      }
    } catch (err) {
      console.error('Failed to start chat:', err);
      // Fallback redirect if something goes wrong
      navigate('/chat');
    }
  };

  const filteredMembers = teamMembers.filter((m) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const name = `${m.firstName} ${m.lastName}`.toLowerCase();
    const code = m.employeeCode?.toLowerCase() || '';
    const desig = m.designation?.toLowerCase() || '';
    return name.includes(term) || code.includes(term) || desig.includes(term);
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#090d16] p-4 sm:p-6 lg:p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            My Team
            <span className="ml-2 px-2.5 py-0.5 text-xs font-bold bg-slate-100 text-slate-600 dark:text-slate-400 dark:bg-slate-800 dark:text-slate-400 rounded-full">
              {teamMembers.length} Members
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 pl-13">
            Collaborate and connect with your team members
          </p>
        </div>
        {teams.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Selected Team:</span>
            <select
              value={selectedTeamId}
              onChange={handleTeamChange}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {teams.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
              <option value="legacy">Reporting Line (Default)</option>
            </select>
          </div>
        )}
      </div>

      {/* Split View: Team Work */}
      {(!loading && teamTasks) && (
        <div className="grid grid-cols-1 gap-6 mb-6">
          {/* Team Work Summary Widget */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-indigo-500" />
                  Team Tasks
                </h2>
                <button
                  onClick={() => navigate('/tasks')}
                  className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
                >
                  View Tasks <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">Total Assigned</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{teamTasks.TOTAL}</p>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                  <p className="text-sm text-amber-600 dark:text-amber-500 mb-1 font-medium flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> To Do
                  </p>
                  <p className="text-2xl font-black text-amber-700 dark:text-amber-400">{teamTasks.TODO}</p>
                </div>
                <div className="p-4 bg-sky-50 dark:bg-sky-900/10 rounded-2xl border border-sky-100 dark:border-sky-900/30">
                  <p className="text-sm text-sky-600 dark:text-sky-500 mb-1 font-medium flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" /> In Progress
                  </p>
                  <p className="text-2xl font-black text-sky-700 dark:text-sky-400">{teamTasks.IN_PROGRESS}</p>
                </div>
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                  <p className="text-sm text-emerald-600 dark:text-emerald-500 mb-1 font-medium flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4" /> Completed
                  </p>
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{teamTasks.COMPLETED}</p>
                </div>
              </div>
              
              {/* Progress Bar */}
              {teamTasks.TOTAL > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                    <span>Team Progress</span>
                    <span>{Math.round((teamTasks.COMPLETED / teamTasks.TOTAL) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden flex">
                    <div 
                      className="bg-emerald-500 h-full transition-all" 
                      style={{ width: `${(teamTasks.COMPLETED / teamTasks.TOTAL) * 100}%` }} 
                      title="Completed"
                    />
                    <div 
                      className="bg-sky-500 h-full transition-all" 
                      style={{ width: `${(teamTasks.IN_PROGRESS / teamTasks.TOTAL) * 100}%` }} 
                      title="In Progress"
                    />
                    <div 
                      className="bg-amber-500 h-full transition-all" 
                      style={{ width: `${(teamTasks.TODO / teamTasks.TOTAL) * 100}%` }} 
                      title="To Do"
                    />
                  </div>
                </div>
              )}
            </div>
        </div>
      )}

      {/* Toolbar & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, role or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 dark:text-slate-200"
          />
        </div>
      </div>

      {/* Content */}
      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 h-[280px]">
              <SkeletonLoader />
            </div>
          ))}
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <Users className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            No Team Members Found
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
            {search ? 'We couldn\'t find anyone matching your search.' : 'You do not have any team members assigned yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMembers.map((member) => {
            const isManager = member._id === user?.employeeId || member.userId?.role === 'MANAGER';
            // Wait, to properly know if someone is YOUR manager, we check if their ID matches your manager ID.
            // But since we just fetch the team, anyone who has the manager role or is explicitly the manager will do.
            const initials = `${member.firstName.charAt(0)}${member.lastName?.charAt(0) || ''}`.toUpperCase();

            return (
              <div 
                key={member._id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col relative group transition-all duration-300 hover:shadow-lg hover:border-indigo-500/30"
              >
                {/* Role Badge */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 dark:text-slate-400 dark:bg-slate-800 dark:text-slate-400 rounded-full">
                    {member.userId?.role || 'EMPLOYEE'}
                  </span>
                  {member._id === user?.employeeId && (
                    <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full">
                      You
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 mb-5 relative">
                  <div className="relative">
                    {member.profilePicture ? (
                      <img 
                        src={member.profilePicture} 
                        alt={member.firstName}
                        className="w-16 h-16 rounded-2xl object-cover shadow-sm"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xl flex items-center justify-center shadow-sm">
                        {initials}
                      </div>
                    )}
                    {member.userId?._id && onlineUsers?.has(member.userId._id) && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full z-10 shadow-sm" title="Online" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-16">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight truncate">
                      {member.firstName} {member.lastName}
                    </h3>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-1 truncate">
                      {member.designation}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {member.employeeCode}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 mb-6 flex-1">
                  <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{member.departmentId?.name || 'No Department'}</span>
                  </div>
                  {member.userId?.email && (
                    <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{member.userId.email}</span>
                    </div>
                  )}
                  {member.phone && (user?.role === 'ADMIN' || user?.role === 'HR' || member._id === user?.employeeId) && (
                    <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{member.phone}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleMessage(member.userId?._id)}
                  className="w-full bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800/50 dark:hover:bg-indigo-500/10 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 font-semibold text-sm py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-500/20"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyTeam;
