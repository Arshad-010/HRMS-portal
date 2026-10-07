import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  DollarSign,
  Shield,
  Clock,
  HeartHandshake,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPrivileged = user?.role === 'ADMIN' || user?.role === 'HR';

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEmployee = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/employees/${id}`);
        setEmployee(response.data.data);
      } catch (err) {
        setError(err.message || 'Failed to retrieve employee profile');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-xs text-slate-500 dark:text-slate-400">Loading employee profile...</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 max-w-md mx-auto mb-6">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-400" />
          <h3 className="font-semibold text-sm">Error Loading Profile</h3>
          <p className="text-xs mt-1">{error || 'Employee not found'}</p>
        </div>
        <button
          onClick={() => navigate('/employees')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
        </button>
      </div>
    );
  }

  const roleColors = {
    ADMIN: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    HR: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
    MANAGER: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    EMPLOYEE: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  };

  const statusColors = {
    ACTIVE: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    ON_LEAVE: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    PROBATION: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    TERMINATED: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    RESIGNED: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Link
          to="/employees"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Employees Directory
        </Link>
      </div>

      {/* Hero Banner Card */}
      <div className="bg-gradient-to-r from-white dark:from-slate-900 via-indigo-950/40 to-slate-100 dark:to-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 mb-8 backdrop-blur-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center text-3xl font-bold shadow-xl shadow-indigo-500/25 flex-shrink-0">
              {employee.firstName?.[0] || 'E'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {employee.firstName} {employee.lastName}
                </h2>
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {employee.employeeCode}
                </span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                {employee.designation} &bull; {employee.departmentId?.name || 'Department Unassigned'}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${roleColors[employee.userId?.role] || roleColors.EMPLOYEE}`}>
                  Role: {employee.userId?.role || 'EMPLOYEE'}
                </span>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusColors[employee.status] || statusColors.ACTIVE}`}>
                  Status: {employee.status}
                </span>
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                  {employee.employmentType?.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Email Address:</span>
                <span className="font-mono font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  {employee.userId?.email || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Contact Phone:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  {employee.phone || 'Not provided'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Gender:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 capitalize">
                  {employee.gender?.toLowerCase().replace(/_/g, ' ') || 'Unspecified'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Date of Birth:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : 'Not provided'}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Residential Address:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                  {employee.address?.city
                    ? `${employee.address.street || ''}, ${employee.address.city}, ${employee.address.state || ''} ${employee.address.country || ''}`
                    : 'No address recorded'}
                </span>
              </div>
            </div>
          </div>

          {/* Professional & Organization Details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              Professional &amp; Employment Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Department:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  {employee.departmentId?.name} ({employee.departmentId?.code})
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Designation:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{employee.designation}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Joining Date:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {new Date(employee.joiningDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Employment Type:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {employee.employmentType?.replace('_', ' ')}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Reporting Manager:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {employee.reportingManagerId ? (
                    <Link
                      to={`/employees/${employee.reportingManagerId._id}`}
                      className="text-indigo-400 hover:underline"
                    >
                      {employee.reportingManagerId.firstName} {employee.reportingManagerId.lastName} (
                      {employee.reportingManagerId.employeeCode}) &bull; {employee.reportingManagerId.designation}
                    </Link>
                  ) : (
                    'Direct Executive / No reporting manager'
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-indigo-400" />
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Contact Name:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {employee.emergencyContact?.name || 'Not provided'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Relationship:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {employee.emergencyContact?.relationship || 'Not provided'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Emergency Phone:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {employee.emergencyContact?.phone || 'Not provided'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Quotas & Compensation */}
        <div className="space-y-6">
          {/* Annual Leave Balances */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              Annual Leave Balances
            </h3>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Casual</span>
                <p className="text-xl font-bold text-indigo-400 mt-1">
                  {employee.leaveBalances?.casual ?? 12}
                </p>
                <span className="text-[9px] text-slate-500">days</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Sick</span>
                <p className="text-xl font-bold text-emerald-400 mt-1">
                  {employee.leaveBalances?.sick ?? 10}
                </p>
                <span className="text-[9px] text-slate-500">days</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Paid</span>
                <p className="text-xl font-bold text-amber-400 mt-1">
                  {employee.leaveBalances?.paid ?? 12}
                </p>
                <span className="text-[9px] text-slate-500">days</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 text-center">
              Leave balance allowances for 2026 calendar year.
            </p>
          </div>

          {/* Compensation Card (STRICTLY ADMIN & HR ONLY) */}
          {isPrivileged && (
            <div className="bg-white dark:bg-slate-900 border border-indigo-950/50 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Compensation (Restricted)
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  RBAC Authorized
                </span>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Annual Base Salary:</span>
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                    ${Number(employee.salary || 0).toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Compensation information is restricted to authorized HR and Administrator roles.
                </p>
              </div>
            </div>
          )}

          {/* Account Security Overview */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 backdrop-blur-sm text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              Account Security
            </h3>
            <div className="space-y-2.5 text-slate-700 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Account Active:</span>
                <span className={`font-semibold ${employee.userId?.isActive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {employee.userId?.isActive ? 'Yes' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Assigned Role:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{employee.userId?.role || 'EMPLOYEE'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Last Login:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {employee.userId?.lastLogin ? new Date(employee.userId.lastLogin).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;
