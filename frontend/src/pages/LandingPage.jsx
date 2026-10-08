import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Clock, Calendar, CheckSquare, Bell, ArrowRight, CheckCircle, Shield, ArrowUpRight, Building2, Lock, UserCog
} from 'lucide-react';
import PublicFooter from '../components/common/PublicFooter';

export const LandingPage = () => {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center pt-24 pb-24 px-4 sm:px-6 lg:px-8 text-center max-w-7xl mx-auto w-full">
        <div className="inline-flex items-center justify-center px-3 py-1 mb-8 text-xs font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-500/10 rounded-full border border-indigo-100 dark:border-indigo-500/20">
          HRMS PORTAL
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 max-w-3xl">
          Manage your workforce <br className="hidden md:block"/> in one place.
        </h1>
        <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          A centralized platform for managing employees, attendance, leave, tasks and organizational activity.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto">
          <Link to="/login" className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2">
            Login to HRMS <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/features" className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-all flex items-center justify-center gap-2">
            Explore Features
          </Link>
        </div>
      </section>



      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 rounded-3xl mb-12 mt-4 scroll-mt-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Everything you need to manage your workforce</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard icon={Users} title="Employee Management" description="Maintain employee information and organizational details in one place." />
          <FeatureCard icon={Clock} title="Attendance" description="Track employee attendance and working hours through a centralized system." />
          <FeatureCard icon={Calendar} title="Leave Management" description="Submit, review and manage employee leave requests with role-based access." />
          <FeatureCard icon={CheckSquare} title="Task Management" description="Create, assign and track workplace tasks and their progress." />
          <FeatureCard icon={Building2} title="Departments" description="Organize and manage structural departments across your organization." />
          <FeatureCard icon={Bell} title="Activity & Notifications" description="Stay informed about important workplace activities and system updates." />
        </div>
      </section>

      {/* Role-based Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Built for every role</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <RoleCard title="EMPLOYEES" description="Access attendance, leave, tasks and personal employee information." />
          <RoleCard title="MANAGERS" description="Manage team responsibilities, tasks and relevant employee requests." />
          <RoleCard title="HR" description="Manage employee information, departments and HR operations." />
          <RoleCard title="ADMIN" description="Manage the HRMS system, users and organizational configuration." />
        </div>
      </section>

      {/* Information Blocks (Self Service & Security) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-200 dark:border-slate-800">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-start">
          <div>
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 border border-indigo-100 dark:border-indigo-500/20">
              <UserCog className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Employee self-service</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Employees can access their own HR information and complete everyday tasks without relying on manual HR processes for every request.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300"><CheckCircle className="w-4 h-4 text-indigo-500" /> View profile and departments</li>
              <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300"><CheckCircle className="w-4 h-4 text-indigo-500" /> Track attendance and hours</li>
              <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300"><CheckCircle className="w-4 h-4 text-indigo-500" /> Request and review leave</li>
              <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300"><CheckCircle className="w-4 h-4 text-indigo-500" /> View and complete tasks</li>
              <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300"><CheckCircle className="w-4 h-4 text-indigo-500" /> Receive system notifications</li>
            </ul>
          </div>
          <div>
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 border border-indigo-100 dark:border-indigo-500/20">
              <Lock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Security & Access</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Role-based access helps ensure users can access the HRMS features and information relevant to their responsibilities. Authenticated sessions keep organizational data properly restricted based on backend authorization controls.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 text-center max-w-3xl mx-auto w-full border-t border-slate-200 dark:border-slate-800">
        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600 dark:text-indigo-400">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">Ready to access your workspace?</h2>
        <p className="text-lg text-slate-500 dark:text-slate-400 mb-10">Log in to continue to your HRMS portal.</p>
        <Link to="/login" className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-600/20">
          Login to HRMS <ArrowUpRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-500/30 dark:hover:border-indigo-400/30 transition-colors group h-full">
    <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors border border-slate-100 dark:border-slate-700 group-hover:border-indigo-100 dark:group-hover:border-indigo-500/20">
      <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
    </div>
    <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
  </div>
);

const RoleCard = ({ title, description }) => (
  <div className="flex flex-col items-center text-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-black/20 transition-all h-full">
    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-5 border border-slate-100 dark:border-slate-700">
      <CheckCircle className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
    </div>
    <h3 className="text-sm font-bold tracking-widest text-slate-900 dark:text-white mb-3 uppercase">{title}</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
  </div>
);

export default LandingPage;
