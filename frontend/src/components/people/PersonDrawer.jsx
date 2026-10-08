import React, { useState, useEffect } from 'react';
import {
  X, User, Briefcase, Key, Check, AlertCircle,
  Upload, Sparkles, Send, Shield, Building2
} from 'lucide-react';
import api from '../../api/axios';

export const PersonDrawer = ({ isOpen, onClose, onSuccess, initialRole = 'EMPLOYEE' }) => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Basic info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    photoPreview: null,
    // Step 2: Job details
    role: initialRole,
    departmentId: '',
    designation: '',
    reportingManagerId: '',
    joiningDate: new Date().toISOString().slice(0, 10),
    salary: '',
    employmentType: 'FULL_TIME',
    // Step 3: Account & permissions
    password: `Emp@${Math.floor(1000 + Math.random() * 9000)}!`,
    sendInviteEmail: true,
  });

  useEffect(() => {
    if (initialRole) {
      setFormData(prev => ({ ...prev, role: initialRole }));
    }
  }, [initialRole]);

  // Load departments and managers
  useEffect(() => {
    if (!isOpen) return;
    const fetchMetadata = async () => {
      try {
        const [deptRes, empRes] = await Promise.all([
          api.get('/departments'),
          api.get('/employees?limit=100'),
        ]);
        if (deptRes.data?.success) {
          const depts = deptRes.data.data || [];
          setDepartments(depts);
          if (depts.length > 0 && !formData.departmentId) {
            setFormData(prev => ({ ...prev, departmentId: depts[0]._id }));
          }
        }
        if (empRes.data?.success) {
          const allEmps = empRes.data.data.employees || [];
          // Filter managers and admins
          const mgrs = allEmps.filter(e => e.userId?.role === 'MANAGER' || e.userId?.role === 'ADMIN');
          setManagers(mgrs.length > 0 ? mgrs : allEmps);
        }
      } catch (err) {
        console.error('Failed to load drawer metadata:', err);
      }
    };
    fetchMetadata();
  }, [isOpen]);

  if (!isOpen) return null;

  const validateStep1 = () => {
    if (!formData.firstName.trim()) return 'First name is required.';
    if (!formData.lastName.trim()) return 'Last name is required.';
    if (!formData.email.trim() || !formData.email.includes('@')) return 'A valid corporate email address is required.';
    return '';
  };

  const validateStep2 = () => {
    if (!formData.departmentId) return 'Please select a department.';
    if (!formData.designation.trim()) return 'Designation is required.';
    return '';
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      const err = validateStep1();
      if (err) return setError(err);
      setStep(2);
    } else if (step === 2) {
      const err = validateStep2();
      if (err) return setError(err);
      setStep(3);
    }
  };

  const handleBack = () => {
    setError('');
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        departmentId: formData.departmentId,
        designation: formData.designation.trim(),
        employmentType: formData.employmentType,
        joiningDate: formData.joiningDate,
        salary: formData.salary ? Number(formData.salary) : 0,
        phone: formData.phone.trim(),
        reportingManagerId: formData.reportingManagerId || undefined,
        status: 'ACTIVE',
      };

      const res = await api.post('/employees', payload);
      if (res.data?.success) {
        onSuccess(res.data.data);
        onClose();
      } else {
        setError(res.data?.message || 'Failed to create employee profile.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error creating profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full animate-slide-reveal">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white m-0">Add New Personnel</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0">Step {step} of 3: {step === 1 ? 'Personal Profile' : step === 2 ? 'Job & Department' : 'Access & Credentials'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-step progress bar */}
        <div className="px-6 pt-4 pb-2 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          {[
            { num: 1, label: 'Basic Info', icon: User },
            { num: 2, label: 'Job Details', icon: Briefcase },
            { num: 3, label: 'Account', icon: Key },
          ].map((s) => {
            const Icon = s.icon;
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div key={s.num} className="flex-1 flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>
                  {isCompleted ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span className={`text-xs font-semibold hidden sm:inline ${isCurrent ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Drawer Body Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maya"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sharma"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Corporate Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="maya.sharma@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Profile Photo</label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-sky-500 transition-colors">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Drag photo here or browse image</p>
                  <span className="text-[10px] text-slate-400">PNG, JPG, WebP up to 2MB</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Job Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">System Access Role *</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { role: 'EMPLOYEE', label: 'Employee', desc: 'Standard staff' },
                    { role: 'MANAGER', label: 'Manager', desc: 'Team approvals' },
                    { role: 'HR', label: 'HR Team', desc: 'People admin' },
                  ].map((r) => (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: r.role })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        formData.role === r.role
                          ? 'bg-sky-500/10 border-sky-500 text-sky-600 dark:text-sky-400 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-black">{r.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Department *</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  >
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Designation / Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead Software Engineer"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Reporting Manager</label>
                <select
                  value={formData.reportingManagerId}
                  onChange={(e) => setFormData({ ...formData, reportingManagerId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="">No Direct Manager (Top Level)</option>
                  {managers.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.firstName} {m.lastName} &bull; {m.designation} ({m.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Joining Date</label>
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Annual Salary (INR, optional)</label>
                  <input
                    type="number"
                    placeholder="e.g. 950000"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Account & Credentials */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Provisioning Summary</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      An atomic sequential employee code will be automatically assigned. A login account with {formData.role} role permissions will be activated immediately.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Temporary Generated Password</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, password: `Emp@${Math.floor(1000 + Math.random() * 9000)}!` })}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Regenerate
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Send className="w-4 h-4 text-sky-500" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Send Welcome &amp; Invite Email</div>
                    <div className="text-[11px] text-slate-400">Includes secure link and temporary access key</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.sendInviteEmail}
                  onChange={(e) => setFormData({ ...formData, sendInviteEmail: e.target.checked })}
                  className="w-4 h-4 text-sky-500 rounded focus:ring-sky-500 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-md shadow-sky-500/25 transition-all cursor-pointer"
            >
              Continue to Step {step + 1}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-md shadow-sky-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Provisioning Account...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirm &amp; Provision Person</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonDrawer;
