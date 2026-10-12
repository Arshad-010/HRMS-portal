import React, { useState, useEffect } from 'react';
import {
  Award, TrendingUp, Plus, Calendar, CheckCircle2,
  AlertTriangle, Filter, Search, ChevronRight, User,
  Star, FileText, Download, Shield, Sparkles, Building2,
  Check, X, Eye, Clock, BarChart3, AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area
} from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ScoreBadge from '../components/common/ScoreBadge';
import EmptyState from '../components/common/EmptyState';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { THEME_COLORS, RECHARTS_THEME } from '../constants/themeColors';

export const Performance = () => {
  const { user } = useAuth();
  const isPrivileged = user?.role === 'ADMIN' || user?.role === 'HR';
  const isManager = user?.role === 'MANAGER';

  const [activeTab, setActiveTab] = useState('Overview'); // 'Overview' | 'Cycles' | 'Scorecards' | '9Box'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Overview Data
  const [perfOverview, setPerfOverview] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Create Cycle Modal State
  const [cycleModalOpen, setCycleModalOpen] = useState(false);
  const [newCycle, setNewCycle] = useState({
    title: '',
    cycleType: 'QUARTERLY',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
  });

  // Selected review for scorecard modal
  const [selectedReview, setSelectedReview] = useState(null);

  const fetchPerformanceData = async () => {
    setLoading(true);
    setError('');
    try {
      const [resOverview, resCycles, resReviews] = await Promise.all([
        api.get('/performance/overview'),
        api.get('/performance/cycles'),
        api.get('/performance/reviews'),
      ]);

      if (resOverview.data?.success) setPerfOverview(resOverview.data.data);
      if (resCycles.data?.success) setCycles(resCycles.data.data || []);
      if (resReviews.data?.success) setReviews(resReviews.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  // Handle Cycle Creation
  const handleCreateCycle = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/performance/cycles', newCycle);
      if (res.data?.success) {
        setCycleModalOpen(false);
        fetchPerformanceData();
      }
    } catch (err) {
      alert('Failed to create cycle: ' + (err.response?.data?.message || err.message));
    }
  };

  // 9-Box Grid Categories
  const nineBoxMatrix = [
    [
      { label: 'Enigma / Inconsistent', key: '3-1', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
      { label: 'High Potential', key: '3-2', color: 'bg-sky-500/10 text-sky-500 border-sky-500/20' },
      { label: 'Star / Top Talent', key: '3-3', color: 'bg-violet-500/10 text-violet-500 border-violet-500/20' },
    ],
    [
      { label: 'Dilemma', key: '2-1', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
      { label: 'Core Player', key: '2-2', color: 'bg-sky-500/10 text-sky-500 border-sky-500/20' },
      { label: 'High Performer', key: '2-3', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    ],
    [
      { label: 'At Risk', key: '1-1', color: 'bg-rose-500/15 text-rose-600 border-rose-500/30' },
      { label: 'Effective', key: '1-2', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
      { label: 'Solid Professional', key: '1-3', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    ],
  ];

  const gridData = perfOverview?.nineBoxGrid || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-500/20 mb-1">
            <Award className="w-3.5 h-3.5" />
            <span>Talent &amp; Performance Appraisals</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Performance Intelligence &amp; Scorecards
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Weighted system metrics, managerial calibrations, 9-box potential matrix, and cycle tracking.
          </p>
        </div>

        {isPrivileged && (
          <button
            onClick={() => setCycleModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/25 transition-all cursor-pointer hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Review Cycle</span>
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { key: 'Overview', label: 'Company Overview' },
          { key: '9Box', label: '9-Box Talent Matrix' },
          { key: 'Scorecards', label: `All Appraisals (${reviews.length})` },
          { key: 'Cycles', label: `Review Cycles (${cycles.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Company Overview */}
      {activeTab === 'Overview' && (
        <div className="space-y-6">
          {/* Top 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Company-Wide Average</span>
                <div className="text-3xl font-black text-violet-600 dark:text-violet-400">
                  {perfOverview?.averageScore || 82}/100
                </div>
                <span className="text-[11px] text-emerald-500 font-bold flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3.5 h-3.5" /> +3.2% vs previous quarter
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Completed Reviews</span>
                <div className="text-3xl font-black text-slate-900 dark:text-white">
                  {perfOverview?.totalEvaluations || reviews.length}
                </div>
                <span className="text-[11px] text-slate-400 font-medium block mt-1">
                  Calibrated across active departments
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Personnel Requiring Support</span>
                <div className="text-3xl font-black text-rose-500">
                  {(perfOverview?.atRiskEmployees || []).length}
                </div>
                <span className="text-[11px] text-rose-500 font-bold block mt-1">
                  Development plans recommended
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Top Performers vs At-Risk Leaderboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  Top Performers (Outstanding)
                </span>
                <span className="text-xs text-slate-400">Score &gt;= 88</span>
              </h3>
              <div className="space-y-3">
                {(perfOverview?.topPerformers || []).map((p, idx) => (
                  <div key={p.id || idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-violet-500/10 text-violet-600 font-bold text-xs flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </div>
                      <div className="truncate">
                        <Link to={`/employees/${p.id}`} className="font-bold text-xs text-slate-900 dark:text-white hover:text-sky-500 no-underline block truncate">
                          {p.name}
                        </Link>
                        <span className="text-[11px] text-slate-400 truncate block">{p.designation} &bull; {p.department}</span>
                      </div>
                    </div>
                    <ScoreBadge score={p.score} band={p.band} />
                  </div>
                ))}
              </div>
            </div>

            {/* At Risk Personnel */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  Development &amp; Coaching Pipeline
                </span>
                <span className="text-xs text-slate-400">Score &lt; 65</span>
              </h3>
              <div className="space-y-3">
                {(perfOverview?.atRiskEmployees || []).length === 0 ? (
                  <EmptyState title="No At-Risk Personnel" description="All employees are tracking above acceptable score thresholds." compact={true} />
                ) : (
                  (perfOverview?.atRiskEmployees || []).map((p, idx) => (
                    <div key={p.id || idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-600 font-bold text-xs flex items-center justify-center shrink-0">
                          !
                        </div>
                        <div className="truncate">
                          <Link to={`/employees/${p.id}`} className="font-bold text-xs text-slate-900 dark:text-white hover:text-sky-500 no-underline block truncate">
                            {p.name}
                          </Link>
                          <span className="text-[11px] text-slate-400 truncate block">{p.designation} &bull; {p.department}</span>
                        </div>
                      </div>
                      <ScoreBadge score={p.score} band={p.band} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: 9-Box Talent Matrix */}
      {activeTab === '9Box' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight m-0">9-Box Talent Matrix</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 m-0">
              Evaluates organizational human capital across Performance (horizontal axis) and Potential (vertical axis).
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {nineBoxMatrix.map((row, rIdx) =>
              row.map((box) => {
                const item = gridData[box.key] || { count: 0, employees: [] };
                return (
                  <div
                    key={box.key}
                    className={`p-4 rounded-2xl border ${box.color} flex flex-col justify-between min-h-[160px]`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-xs font-black uppercase tracking-wider">{box.label}</span>
                        <span className="w-6 h-6 rounded-full bg-white/80 dark:bg-slate-800 text-slate-900 dark:text-white font-black text-xs flex items-center justify-center shadow-xs">
                          {item.count}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {(item.employees || []).slice(0, 3).map((emp, i) => (
                          <div key={i} className="text-[11px] font-semibold truncate text-slate-700 dark:text-slate-200">
                            &bull; {emp.name} ({emp.score} pts)
                          </div>
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 block">
                      Pot: {box.key.split('-')[0]} &bull; Perf: {box.key.split('-')[1]}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 3: All Appraisals Table */}
      {activeTab === 'Scorecards' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5 pl-5">Employee</th>
                <th className="p-3.5">Reviewer</th>
                <th className="p-3.5">Cycle</th>
                <th className="p-3.5">Stage</th>
                <th className="p-3.5">Score</th>
                <th className="p-3.5 text-right pr-5">Scorecard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {reviews.map((rev) => (
                <tr key={rev._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3.5 pl-5">
                    <span className="font-bold text-slate-900 dark:text-white block">{rev.employeeId?.firstName} {rev.employeeId?.lastName}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{rev.employeeId?.employeeCode}</span>
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-400">
                    {rev.reviewerId ? `${rev.reviewerId.firstName} ${rev.reviewerId.lastName}` : 'Self & Manager'}
                  </td>
                  <td className="p-3.5 font-medium">{rev.cycleId?.title || 'Q3 2026 Appraisal'}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                      {rev.status}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <ScoreBadge score={rev.finalScore} band={rev.ratingBand} />
                  </td>
                  <td className="p-3.5 text-right pr-5">
                    <button
                      onClick={() => setSelectedReview(rev)}
                      className="px-3 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-600 hover:text-white text-violet-600 dark:text-violet-400 text-xs font-bold transition-all cursor-pointer"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Review Cycles */}
      {activeTab === 'Cycles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cycles.map((cyc) => (
            <div key={cyc._id} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-[10px] uppercase px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-500">
                    {cyc.cycleType}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {cyc.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{cyc.title}</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Window: {new Date(cyc.startDate).toLocaleDateString()} &ndash; {new Date(cyc.endDate).toLocaleDateString()}
                </p>
                <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Scorecard Criteria:</span>
                  {(cyc.scorecardTemplate || []).map((sc, i) => (
                    <div key={i} className="flex justify-between text-[11px]">
                      <span>{sc.criterion}</span>
                      <span className="font-bold text-violet-500">{sc.weight}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scorecard Detailed Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedReview(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Scorecard: {selectedReview.employeeId?.firstName} {selectedReview.employeeId?.lastName}
                </h3>
                <p className="text-xs text-slate-400">{selectedReview.cycleId?.title}</p>
              </div>
              <ScoreBadge score={selectedReview.finalScore} band={selectedReview.ratingBand} />
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Evaluation Criteria &amp; Weighted Ratings</h4>
              <div className="space-y-2">
                {(selectedReview.scores || []).map((sc, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{sc.criterion} ({sc.weight}%)</span>
                      <span className="text-[11px] text-slate-400">Rating: ★ {sc.rating}/5</span>
                    </div>
                    <span className="font-mono font-bold text-violet-500">{sc.weightedScore} pts</span>
                  </div>
                ))}
              </div>

              {selectedReview.managerComments && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white block mb-1">Manager Calibration Notes:</span>
                  <p className="text-slate-500 dark:text-slate-400 m-0 leading-relaxed">{selectedReview.managerComments}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Cycle Modal */}
      {cycleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateCycle} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create Review Cycle</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cycle Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Q4 2026 Executive Review"
                value={newCycle.title}
                onChange={(e) => setNewCycle({ ...newCycle, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={newCycle.startDate}
                  onChange={(e) => setNewCycle({ ...newCycle, startDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={newCycle.endDate}
                  onChange={(e) => setNewCycle({ ...newCycle, endDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button type="button" onClick={() => setCycleModalOpen(false)} className="px-4 py-2 rounded-xl border text-xs font-bold">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold">
                Launch Cycle
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Performance;
