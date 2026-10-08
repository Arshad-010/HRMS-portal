import React from 'react';
import { 
  Clock, 
  Calendar, 
  CheckSquare, 
  Shield, 
  Users, 
  Building2, 
  Bell, 
  FileText, 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  KeyRound, 
  Database, 
  UserCheck 
} from 'lucide-react';
import PublicFooter from '../components/common/PublicFooter';

const PageWrapper = ({ title, subtitle, badge, maxWidth = 'max-w-5xl', children }) => (
  <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-white dark:bg-slate-950 transition-colors">
    <div className={`flex-1 py-16 px-4 sm:px-6 lg:px-8 ${maxWidth} mx-auto w-full`}>
      {badge && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-4 border border-indigo-100 dark:border-indigo-500/20">
          {badge}
        </div>
      )}
      <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-3">{title}</h1>
      {subtitle && <p className="text-base text-slate-500 dark:text-slate-400 mb-8">{subtitle}</p>}
      <div className="border-b border-slate-200 dark:border-slate-800 mb-10 pb-2" />
      <div className="text-slate-600 dark:text-slate-300 leading-relaxed space-y-6">
        {children}
      </div>
    </div>
    <PublicFooter />
  </div>
);

export const AboutPage = () => (
  <PageWrapper title="About HRMS Portal">
    <p className="text-lg">
      HRMS Portal brings everyday workforce operations into one centralized system. 
      Employees, managers and administrators can access the information and tools relevant to their responsibilities through role-based access.
    </p>
    <p>
      Our goal is to keep employee information, departments, attendance, leave and workplace activities organized in one system, 
      reducing administrative overhead and providing a unified experience for the entire organization.
    </p>
    <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Built for every role</h3>
      <ul className="space-y-3">
        <li><strong>Employees:</strong> Access attendance, leave, tasks and personal employee information.</li>
        <li><strong>Managers:</strong> Manage team responsibilities, tasks and relevant employee requests.</li>
        <li><strong>HR:</strong> Manage employee information, departments and HR operations.</li>
        <li><strong>Administrators:</strong> Manage the HRMS system, users and organizational configuration.</li>
      </ul>
    </div>
  </PageWrapper>
);

export const FeaturesPage = () => (
  <PageWrapper title="Features">
    <p className="text-lg mb-8">
      Explore the core capabilities of the HRMS Portal designed to manage your workforce efficiently.
    </p>
    <div className="grid md:grid-cols-2 gap-6">
      <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <Users className="w-8 h-8 text-indigo-500 mb-4" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Employee Management</h3>
        <p>Maintain employee information and organizational details in one place securely.</p>
      </div>
      <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <Clock className="w-8 h-8 text-indigo-500 mb-4" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Attendance</h3>
        <p>Track employee attendance and working hours through a centralized system.</p>
      </div>
      <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <Calendar className="w-8 h-8 text-indigo-500 mb-4" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Leave Management</h3>
        <p>Submit, review and manage employee leave requests with role-based access.</p>
      </div>
      <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <CheckSquare className="w-8 h-8 text-indigo-500 mb-4" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Task Management</h3>
        <p>Create, assign and track workplace tasks and their progress across the team.</p>
      </div>
      <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <Building2 className="w-8 h-8 text-indigo-500 mb-4" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Departments</h3>
        <p>Organize and manage structural departments across your organization.</p>
      </div>
      <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <Bell className="w-8 h-8 text-indigo-500 mb-4" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Activity & Notifications</h3>
        <p>Stay informed about important workplace activities and system updates.</p>
      </div>
    </div>
  </PageWrapper>
);

export const PublicAttendancePage = () => (
  <PageWrapper title="Attendance Information">
    <div className="flex items-center gap-3 mb-6 text-indigo-600 dark:text-indigo-400">
      <Clock className="w-8 h-8" />
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Track time and presence</h2>
    </div>
    <p className="text-lg">
      The Attendance module allows employees to log their daily presence and track their working hours accurately. 
    </p>
    <ul className="list-disc pl-5 space-y-2 mt-4">
      <li>Employees can log their daily attendance and view their own historical records.</li>
      <li>Managers and HR administrators can monitor team attendance and review anomalies.</li>
      <li>The system maintains a reliable record of hours worked across different departments.</li>
    </ul>
    <p className="mt-6 text-sm bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
      Note: To view your personal attendance data or manage your team's records, you must log in to the HRMS Portal.
    </p>
  </PageWrapper>
);

export const PublicLeavePage = () => (
  <PageWrapper title="Leave Management Information">
    <div className="flex items-center gap-3 mb-6 text-indigo-600 dark:text-indigo-400">
      <Calendar className="w-8 h-8" />
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Centralized time-off requests</h2>
    </div>
    <p className="text-lg">
      Our Leave Management system centralizes all time-off requests to keep the entire team's availability transparent and organized.
    </p>
    <ul className="list-disc pl-5 space-y-2 mt-4">
      <li>Employees can view their leave balances securely and submit time-off requests.</li>
      <li>Managers receive instant notifications for pending requests in their queue.</li>
      <li>Managers and HR can approve or reject requests directly from their dashboard.</li>
    </ul>
    <p className="mt-6 text-sm bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
      Note: To view your available leave balances or submit a request, you must log in to the HRMS Portal.
    </p>
  </PageWrapper>
);

export const PublicTasksPage = () => (
  <PageWrapper title="Task Management Information">
    <div className="flex items-center gap-3 mb-6 text-indigo-600 dark:text-indigo-400">
      <CheckSquare className="w-8 h-8" />
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Organize responsibilities</h2>
    </div>
    <p className="text-lg">
      The Tasks module helps teams organize their daily responsibilities, assign work, and track progress without needing third-party tools.
    </p>
    <ul className="list-disc pl-5 space-y-2 mt-4">
      <li>Managers can create, assign, and prioritize tasks for specific team members.</li>
      <li>Employees can update task statuses, add notes, and mark work as complete.</li>
      <li>Dashboards provide continuous visibility into project progress and individual workload.</li>
    </ul>
    <p className="mt-6 text-sm bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
      Note: To view your assigned tasks or manage your team's workload, you must log in to the HRMS Portal.
    </p>
  </PageWrapper>
);

export const PrivacyPage = () => (
  <PageWrapper 
    title="Privacy & Data Protection Policy" 
    subtitle="Enterprise Data Governance, Role-Based Access Isolation, and System Cryptographic Safeguards"
    badge="Enterprise Governance &amp; Security"
  >
    <div className="p-6 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 mb-8">
      <div className="flex items-start gap-4">
        <ShieldCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-400 shrink-0 mt-1" />
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Our Privacy Commitment</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            The HRMS Portal processes confidential organizational and employee data under rigorous access boundaries. 
            All stored telemetry and personally identifiable records remain strictly segregated under your organization's tenant jurisdiction.
          </p>
        </div>
      </div>
    </div>

    <div className="grid md:grid-cols-2 gap-6">
      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white m-0">01. Cryptographic Security</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          All passwords are encrypted using salted bcrypt hashing with high work factors. 
          Communications are exclusively transmitted over TLS/HTTPS with stateless JWT session validation.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white m-0">02. Role-Based Access Isolation</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Employees can only view their own punch clocks, leave requests, and task assignments. 
          Managers are restricted to their assigned teams, and financial details are locked to authorized administrators.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white m-0">03. Automated Activity Auditing</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Critical operations such as employee code generation, quota adjustments, and role elevation trigger immutable activity log entries with actor identities.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
            <KeyRound className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white m-0">04. Credential Confidentiality</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Logs and debugging streams explicitly scrub all credentials, API keys, and authorization headers, eliminating inadvertent data leakage.
        </p>
      </div>
    </div>
  </PageWrapper>
);

export const TermsPage = () => (
  <PageWrapper 
    title="Terms & Conditions of Service" 
    subtitle="Enterprise Operational Policies, Guidelines, and Acceptable Usage Rules"
    badge="Enterprise Master Terms"
  >
    <div className="p-6 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 mb-8">
      <div className="flex items-start gap-4">
        <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400 shrink-0 mt-1" />
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Acceptable Use Terms</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            This Human Resource Management System (HRMS) is provided solely for authorized organizational operations. 
            By accessing this portal, users agree to abide by organizational codes of conduct and security standards.
          </p>
        </div>
      </div>
    </div>

    <div className="grid md:grid-cols-2 gap-6">
      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-black">01</span>
          <h3 className="text-base font-bold text-slate-900 dark:text-white m-0">Authorized Personnel Only</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Only actively provisioned employees and contracted personnel are allowed access. Sharing credentials or using third-party proxies is strictly prohibited.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-black">02</span>
          <h3 className="text-base font-bold text-slate-900 dark:text-white m-0">Attendance &amp; Leave Accuracy</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Employees must log daily punch-ins accurately. Submitting fraudulent timesheet punches or unapproved leaves violates organizational policy.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-black">03</span>
          <h3 className="text-base font-bold text-slate-900 dark:text-white m-0">Data Integrity &amp; RBAC Compliance</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Users must not attempt to bypass role boundaries or tamper with API payloads. Any unauthorized elevation attempt is flagged in audit streams.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-black">04</span>
          <h3 className="text-base font-bold text-slate-900 dark:text-white m-0">Maintenance &amp; Audit Rights</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Administrators maintain full rights to audit attendance trends, conduct security sweeps, and update quotas in accordance with organizational policies.
        </p>
      </div>
    </div>
  </PageWrapper>
);

export const ContactPage = () => (
  <PageWrapper title="Contact Information">
    <p className="text-lg">
      If you need assistance with the HRMS Portal, your internal administrators are here to help.
    </p>
    <div className="mt-8 p-6 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 flex items-start gap-4">
      <Shield className="w-8 h-8 text-indigo-600 dark:text-indigo-400 shrink-0" />
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Reach out to your Administrator</h3>
        <p className="text-slate-700 dark:text-slate-300">
          Because this is an internal enterprise application, please contact your company's HR department or internal IT/System Administrator directly for assistance with:
        </p>
        <ul className="list-disc pl-5 mt-3 space-y-1 text-slate-700 dark:text-slate-300">
          <li>Account creation or access issues</li>
          <li>Password resets</li>
          <li>Questions regarding attendance policies or leave approvals</li>
        </ul>
      </div>
    </div>
  </PageWrapper>
);

export const HelpPage = () => (
  <PageWrapper title="Help & Support">
    <p className="text-lg mb-8">
      Frequently asked questions about using the HRMS Portal.
    </p>
    
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">How do I log in?</h3>
        <p className="mt-2">Click the "Login" button in the navigation or footer. Enter the email address and password provided by your system administrator.</p>
      </div>
      
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">How do I access attendance?</h3>
        <p className="mt-2">Once logged in, click on "Attendance" in the sidebar to view your attendance history and log your hours.</p>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">How do I apply for leave?</h3>
        <p className="mt-2">Navigate to the "Leave" section from the sidebar. You can view your current balances and click "Apply for Leave" to submit a request to your manager.</p>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">How do tasks work?</h3>
        <p className="mt-2">The Tasks module allows you to view assignments given to you by your manager. You can update the status of these tasks as you make progress.</p>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">What should I do if I cannot access my account?</h3>
        <p className="mt-2">If you have forgotten your password or your account is locked, please refer to the <a href="/contact" className="text-indigo-600 dark:text-indigo-400 hover:underline">Contact</a> page to reach out to your system administrator.</p>
      </div>
    </div>
  </PageWrapper>
);
