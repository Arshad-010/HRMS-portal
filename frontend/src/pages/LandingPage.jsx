import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  Calendar, 
  CheckSquare, 
  Bell, 
  ArrowRight, 
  CheckCircle, 
  Shield, 
  ArrowUpRight, 
  Building2, 
  Lock, 
  UserCog,
  FileText,
  Mail,
  HelpCircle,
  Sparkles,
  Zap,
  CheckCircle2,
  X,
  ChevronRight,
  ShieldCheck,
  Award,
  Layers,
  HeartHandshake,
  Briefcase
} from 'lucide-react';
import PublicFooter from '../components/common/PublicFooter';

export const LandingPage = () => {
  // Modal states for Terms & Conditions and Privacy Policy
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Scroll reveal triggers for blocks and features (Requirement 5)
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const [rolesVisible, setRolesVisible] = useState(false);
  const featuresRef = useRef(null);
  const rolesRef = useRef(null);

  useEffect(() => {
    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (entry.target.id === 'features') {
            setFeaturesVisible(true);
          }
          if (entry.target.id === 'roles') {
            setRolesVisible(true);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
      rootMargin: '40px',
    });

    if (featuresRef.current) observer.observe(featuresRef.current);
    if (rolesRef.current) observer.observe(rolesRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-white dark:bg-slate-950 transition-colors">
      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center pt-20 pb-20 px-4 sm:px-6 lg:px-8 text-center max-w-7xl mx-auto w-full overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-8 text-xs font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-500/10 rounded-full border border-indigo-100 dark:border-indigo-500/20 shadow-sm animate-pulse-glow">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Next-Gen Workforce Operating System</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 max-w-4xl leading-[1.1]">
          Manage your workforce <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 dark:from-indigo-400 dark:via-violet-400 dark:to-cyan-400 bg-clip-text text-transparent">
            seamlessly in one place.
          </span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          A centralized, role-based platform designed for employees, managers, and HR administrators to streamline attendance, leave, tasks, and audit logs.
        </p>

        {/* Dual Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center w-full sm:w-auto">
          <Link
            to="/login?portal=user"
            className="w-full sm:w-auto px-7 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <Users className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span>Employee Login</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            to="/login?portal=admin"
            className="w-full sm:w-auto px-7 py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-sm rounded-xl transition-all border border-slate-700/80 shadow-md hover:-translate-y-0.5 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <Shield className="w-4 h-4 text-indigo-400 transition-transform group-hover:rotate-12" />
            <span>Admin Portal</span>
            <ArrowUpRight className="w-4 h-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </section>

      {/* Features Grid Section (Requirement 5: Scroll animation and interesting vibrant icons) */}
      <section ref={featuresRef} id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full scroll-mt-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Core Modules
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
            Everything you need to orchestrate workforce operations
          </h2>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Engineered with strict RBAC access controls, high-speed MongoDB persistence, and intuitive self-service workflows.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard 
            index={0}
            isVisible={featuresVisible}
            icon={Users}
            badge="Directory & Profiles"
            theme="purple"
            title="Employee Management" 
            description="Complete directory with sequential codes, departmental mappings, designations, and secure role-based salary visibility."
            linkTo="/features"
          />
          <FeatureCard 
            index={1}
            isVisible={featuresVisible}
            icon={Clock}
            badge="Digital Punch Clock"
            theme="emerald"
            title="Time & Attendance" 
            description="Live digital punch-in/out, automated work hours calculation, UTC midnight normalization, and team attendance monitoring."
            linkTo="/attendance"
          />
          <FeatureCard 
            index={2}
            isVisible={featuresVisible}
            icon={Calendar}
            badge="Multi-Quota Approval"
            theme="amber"
            title="Leave Management" 
            description="Centralized leave request queues, automatic quota tracking (Casual, Sick, Earned, Unpaid), and atomic balance restoration."
            linkTo="/leave"
          />
          <FeatureCard 
            index={3}
            isVisible={featuresVisible}
            icon={CheckSquare}
            badge="Milestones & Statuses"
            theme="cyan"
            title="Task Management" 
            description="Interactive task assignments, priority levels (Urgent, High, Medium, Low), overdue calculations, and completed timestamps."
            linkTo="/tasks"
          />
          <FeatureCard 
            index={4}
            isVisible={featuresVisible}
            icon={Building2}
            badge="Organizational Structure"
            theme="fuchsia"
            title="Departments & Teams" 
            description="Structural departments with normalized codes, manager delegations, member tallies, and soft deactivation protection."
            linkTo="/features"
          />
          <FeatureCard 
            index={5}
            isVisible={featuresVisible}
            icon={Bell}
            badge="Live Notifications"
            theme="rose"
            isLive={true}
            title="Activity & Notifications" 
            description="Real-time in-app notification center, unread counter badges, and immutable audit logs capturing every critical HR mutation."
            linkTo="/features"
          />
        </div>
      </section>

      {/* Role-based Section (Requirement 5: Scroll animation and distinct role icons) */}
      <section ref={rolesRef} id="roles" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-200 dark:border-slate-800/80">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> Access Hierarchy
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
            Built for every organizational role
          </h2>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Every user receives tailored views and permissions that mirror their exact responsibilities.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <RoleCard 
            index={0}
            isVisible={rolesVisible}
            icon={Users}
            title="EMPLOYEES" 
            roleColor="emerald"
            badge="Self Service"
            description="Access your personal attendance, log daily punches, request time off, and track assigned work milestones."
          />
          <RoleCard 
            index={1}
            isVisible={rolesVisible}
            icon={Briefcase}
            title="MANAGERS" 
            roleColor="blue"
            badge="Team Oversight"
            description="Review direct report leave applications, monitor team attendance rates, and assign department tasks."
          />
          <RoleCard 
            index={2}
            isVisible={rolesVisible}
            icon={HeartHandshake}
            title="HR LEADERS" 
            roleColor="pink"
            badge="Talent & Ops"
            description="Onboard employees, configure departments, manage company-wide leave quotas, and oversee records."
          />
          <RoleCard 
            index={3}
            isVisible={rolesVisible}
            icon={ShieldCheck}
            title="ADMINISTRATORS" 
            roleColor="purple"
            badge="Total Control"
            description="Manage organizational configuration, provision user accounts, inspect immutable audit logs, and maintain security."
          />
        </div>
      </section>

      {/* About & Mission Section (Moved from top navbar to bottom) */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-200 dark:border-slate-800">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider border border-indigo-100 dark:border-indigo-500/20">
              <HeartHandshake className="w-3.5 h-3.5 text-indigo-500" />
              <span>About HRMS Portal</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              A unified platform to eliminate administrative friction
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
              HRMS Portal was engineered to replace fragmented spreadsheets, manual email approvals, and disconnected trackers with a single source of truth. By unifying Attendance, Leave Balances, Task Delegations, and Real-Time Notifications, organizations can operate with complete transparency and speed.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="block text-2xl font-black text-indigo-600 dark:text-indigo-400">100%</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">RBAC Isolated Data</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="block text-2xl font-black text-indigo-600 dark:text-indigo-400">&lt; 50ms</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">High Performance API</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-500" />
              Enterprise Architecture Highlights
            </h3>
            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Atomic Employee Codes:</strong> Guaranteed concurrency-safe sequential code generator (EMP-1001, EMP-1002).</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Automated Quota Balancing:</strong> Leave deduction on approval and instant balance restoration upon cancellation.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Immutable Audit Stream:</strong> Complete tracking of all department, employee, and task lifecycle mutations.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Zero Credential Leakage:</strong> Strict masking prevents passwords and session tokens from ever entering logs.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Contact & Support Section (Moved from top navbar to bottom) */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-200 dark:border-slate-800">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wider">
            <Mail className="w-3.5 h-3.5 text-indigo-500" /> Contact &amp; Help
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
            Need Support or System Assistance?
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            Our administrator and help desk channels are available to assist with onboarding and accounts.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center hover:border-indigo-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-100 dark:border-indigo-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">HR Administration</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">For employee onboarding, leave queries &amp; records</p>
            <span className="text-xs font-mono font-medium text-indigo-600 dark:text-indigo-400">admin@hrms.portal</span>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center hover:border-indigo-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto mb-4 border border-violet-100 dark:border-violet-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">IT &amp; Access Support</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">For credentials reset, login issues &amp; role grants</p>
            <span className="text-xs font-mono font-medium text-violet-600 dark:text-violet-400">support@hrms.portal</span>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center hover:border-indigo-500/40 transition-colors sm:col-span-2 lg:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-4 border border-teal-100 dark:border-teal-500/20">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Knowledge &amp; FAQ</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Review step-by-step guides for common tasks</p>
            <Link to="/help" className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline">
              Open Help Center &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Terms & Conditions and Privacy Policy Section (Requirement 4) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-200 dark:border-slate-800">
        <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Enterprise Trust, Compliance &amp; Governance
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              HRMS Portal strictly adheres to organizational confidentiality standards, salted bcrypt hashing, stateless JWT validation, and encrypted data transport.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowTermsModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>Terms &amp; Conditions</span>
            </button>

            <button
              onClick={() => setShowPrivacyModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Privacy Policy</span>
            </button>
          </div>
        </div>
      </section>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setShowTermsModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white m-0">Terms &amp; Conditions</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 m-0">Operational Guidelines and Acceptable Usage Policy</p>
              </div>
            </div>

            <div className="overflow-y-auto pr-2 space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
              <p><strong>1. Authorized Enterprise Use:</strong> This Human Resource Management System (HRMS) is intended exclusively for authorized organizational personnel. Unauthorized access attempts are monitored and logged.</p>
              <p><strong>2. Account &amp; Credential Confidentiality:</strong> Users are solely responsible for maintaining the confidentiality of their passwords. Sharing credentials with unauthorized colleagues is strictly prohibited.</p>
              <p><strong>3. Accurate Attendance &amp; Leave Reporting:</strong> Employees must accurately log their daily attendance and work hours. Submitting fraudulent punches or time-off claims violates internal company policies.</p>
              <p><strong>4. Role-Based Data Isolation:</strong> Attempting to bypass role-based access controls (RBAC) to view unpermitted salary records, employee files, or private departmental details constitutes a violation of these terms.</p>
              <p><strong>5. Modifications &amp; System Maintenance:</strong> Administrators reserve the right to audit activities, update software workflows, and adjust departmental quotas in accordance with executive policy.</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer transition-colors shadow-md shadow-indigo-600/20"
              >
                Close Terms
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white m-0">Privacy &amp; Data Protection Policy</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 m-0">How Employee Records &amp; Logs are Governed</p>
              </div>
            </div>

            <div className="overflow-y-auto pr-2 space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
              <p><strong>1. Personal Data Confidentiality:</strong> All employee information, including contact details, emergency contacts, attendance records, and leave requests, is encrypted and restricted by backend authorization filters.</p>
              <p><strong>2. Salary &amp; Financial Security:</strong> Compensation data is strictly restricted from general Employee and Manager access. Only authorized Human Resource personnel and Administrators have salary visibility.</p>
              <p><strong>3. Zero Third-Party Tracking:</strong> HRMS Portal does not track user behavior with third-party advertising cookies or external analytics beacons. Session identifiers exist solely to maintain secure authentication.</p>
              <p><strong>4. Audit Log Sanitization:</strong> Our Activity Log service automatically purges sensitive tokens, passwords, and authorization headers from audit entries, preventing accidental exposure.</p>
              <p><strong>5. Retention &amp; Rights:</strong> Deactivated employee records are archived securely in accordance with company compliance requirements and can be purged upon authorized administrative review.</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer transition-colors shadow-md shadow-emerald-600/20"
              >
                Close Privacy Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <PublicFooter />
    </div>
  );
};

// Enhanced Feature Card with vibrant colorful icons, glowing badges, 3D hover and scroll reveal (Requirement 5)
const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  badge, 
  theme = 'indigo', 
  isLive = false, 
  linkTo,
  index = 0,
  isVisible = true 
}) => {
  const themeStyles = {
    purple: {
      gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
      shadow: '0 10px 25px -4px rgba(99, 102, 241, 0.45)',
      badgeBg: 'rgba(99, 102, 241, 0.1)',
      badgeText: '#6366F1',
      badgeBorder: 'rgba(99, 102, 241, 0.3)',
      borderHover: 'rgba(99, 102, 241, 0.5)',
    },
    emerald: {
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      shadow: '0 10px 25px -4px rgba(16, 185, 129, 0.45)',
      badgeBg: 'rgba(16, 185, 129, 0.1)',
      badgeText: '#059669',
      badgeBorder: 'rgba(16, 185, 129, 0.3)',
      borderHover: 'rgba(16, 185, 129, 0.5)',
    },
    amber: {
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)',
      shadow: '0 10px 25px -4px rgba(245, 158, 11, 0.45)',
      badgeBg: 'rgba(245, 158, 11, 0.1)',
      badgeText: '#D97706',
      badgeBorder: 'rgba(217, 119, 6, 0.3)',
      borderHover: 'rgba(245, 158, 11, 0.5)',
    },
    cyan: {
      gradient: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
      shadow: '0 10px 25px -4px rgba(14, 165, 233, 0.45)',
      badgeBg: 'rgba(14, 165, 233, 0.1)',
      badgeText: '#0284C7',
      badgeBorder: 'rgba(2, 132, 199, 0.3)',
      borderHover: 'rgba(14, 165, 233, 0.5)',
    },
    fuchsia: {
      gradient: 'linear-gradient(135deg, #D946EF 0%, #A855F7 100%)',
      shadow: '0 10px 25px -4px rgba(217, 70, 239, 0.45)',
      badgeBg: 'rgba(217, 70, 239, 0.1)',
      badgeText: '#C026D3',
      badgeBorder: 'rgba(192, 38, 211, 0.3)',
      borderHover: 'rgba(217, 70, 239, 0.5)',
    },
    rose: {
      gradient: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
      shadow: '0 10px 25px -4px rgba(244, 63, 94, 0.45)',
      badgeBg: 'rgba(244, 63, 94, 0.1)',
      badgeText: '#E11D48',
      badgeBorder: 'rgba(225, 29, 72, 0.3)',
      borderHover: 'rgba(244, 63, 94, 0.5)',
    },
    indigo: {
      gradient: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
      shadow: '0 10px 25px -4px rgba(99, 102, 241, 0.45)',
      badgeBg: 'rgba(99, 102, 241, 0.1)',
      badgeText: '#4F46E5',
      badgeBorder: 'rgba(79, 70, 229, 0.3)',
      borderHover: 'rgba(99, 102, 241, 0.5)',
    },
  };

  const style = themeStyles[theme] || themeStyles.indigo;

  return (
    <Link
      to={linkTo || '#'}
      className={`group p-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl flex flex-col justify-between no-underline h-full transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-2xl cursor-pointer ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
      style={{
        transitionDelay: `${index * 80}ms`,
      }}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-5">
          {/* Animated Vibrant Icon Box with high visual interest */}
          <div 
            className="w-13 h-13 rounded-2xl flex items-center justify-center text-white transition-all duration-300 group-hover:scale-115 group-hover:rotate-6 shrink-0"
            style={{
              background: style.gradient,
              boxShadow: style.shadow,
            }}
          >
            <Icon className="w-6 h-6 text-white drop-shadow-md transition-transform duration-300 group-hover:scale-105" />
          </div>

          {/* Badge */}
          {badge && (
            <span 
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-xs"
              style={{
                backgroundColor: style.badgeBg,
                color: style.badgeText,
                borderColor: style.badgeBorder,
              }}
            >
              {isLive && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping mr-0.5" />}
              {badge}
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed m-0">
          {description}
        </p>
      </div>

      <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        <span>Explore module</span>
        <ChevronRight className="w-4 h-4 transform transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
};

// Enhanced Role Card with interactive hover, vibrant gradient icons and scroll cascade
const RoleCard = ({ 
  title, 
  description, 
  icon: Icon = Users, 
  roleColor = 'indigo', 
  badge, 
  index = 0, 
  isVisible = true 
}) => {
  const roleThemes = {
    emerald: {
      gradient: 'linear-gradient(135deg, #10B981, #059669)',
      shadow: '0 8px 20px -4px rgba(16, 185, 129, 0.45)',
    },
    blue: {
      gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
      shadow: '0 8px 20px -4px rgba(59, 130, 246, 0.45)',
    },
    pink: {
      gradient: 'linear-gradient(135deg, #EC4899, #BE185D)',
      shadow: '0 8px 20px -4px rgba(236, 72, 153, 0.45)',
    },
    purple: {
      gradient: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
      shadow: '0 8px 20px -4px rgba(139, 92, 246, 0.45)',
    },
  };

  const theme = roleThemes[roleColor] || roleThemes.emerald;

  return (
    <div 
      className={`group flex flex-col items-center text-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl hover:border-indigo-500/40 dark:hover:border-indigo-400/40 hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 ease-out h-full ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
      style={{
        transitionDelay: `${index * 100}ms`,
      }}
    >
      <div 
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 text-white shadow-md transition-all duration-300 group-hover:scale-115 group-hover:rotate-6"
        style={{
          background: theme.gradient,
          boxShadow: theme.shadow,
        }}
      >
        <Icon className="w-6 h-6 text-white drop-shadow-sm" />
      </div>
      {badge && (
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
          {badge}
        </span>
      )}
      <h3 className="text-sm font-black tracking-widest text-slate-900 dark:text-white mb-3 uppercase">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed m-0">
        {description}
      </p>
    </div>
  );
};

export default LandingPage;
