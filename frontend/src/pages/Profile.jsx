import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera, Mail, Phone, Building2, Briefcase, CalendarDays, KeyRound, Save, Loader2, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Profile = () => {
  const { user, uploadProfilePicture } = useAuth();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const employee = user?.employee;
  const initials = employee?.firstName 
    ? `${employee.firstName[0]}${employee.lastName?.[0] || ''}`.toUpperCase()
    : user?.email?.[0].toUpperCase();

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be less than 5MB');
      return;
    }

    const compressImage = (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 400;
            const MAX_HEIGHT = 400;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height = Math.round((height *= MAX_WIDTH / width));
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width = Math.round((width *= MAX_HEIGHT / height));
                height = MAX_HEIGHT;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            // Compress to JPEG with 0.8 quality
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          };
        };
      });
    };

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const base64String = await compressImage(file);
      const result = await uploadProfilePicture(base64String);
      
      if (result.success) {
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        setUploadError(result.error);
      }
    } catch (error) {
      setUploadError('Failed to process image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        
        {/* Cover Photo / Header */}
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-violet-600 relative">
          <div className="absolute inset-0 bg-white/10 dark:bg-black/10 mix-blend-overlay"></div>
        </div>

        <div className="px-8 pb-8">
          {/* Avatar Section */}
          <div className="relative flex justify-between items-end -mt-16 mb-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden relative shadow-lg">
                {employee?.profilePicture ? (
                  <img src={employee.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-slate-400 dark:text-slate-500">{initials}</span>
                )}
                
                {/* Upload Overlay */}
                <div 
                  className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-6 h-6 mb-1" />
                      <span className="text-[10px] font-semibold tracking-wider uppercase">Change</span>
                    </>
                  )}
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageSelect} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            
            <div className="flex gap-3">
              <Link to="/dashboard" className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors border border-slate-200 dark:border-slate-700 no-underline cursor-pointer">
                Back to Dashboard
              </Link>
            </div>
          </div>

          {/* Status Messages */}
          {uploadError && (
            <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-medium">
              {uploadError}
            </div>
          )}
          {uploadSuccess && (
            <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-medium">
              Profile picture updated successfully!
            </div>
          )}

          {/* User Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {employee?.firstName ? `${employee.firstName} ${employee.lastName}` : 'No Name Set'}
              </h1>
              <p className="text-sm font-medium text-indigo-500 dark:text-indigo-400 mb-4">
                {employee?.designation || user?.role}
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold border border-slate-200 dark:border-slate-700">
                  {user?.role}
                </span>
                {employee?.employeeCode && (
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[11px] font-mono font-semibold border border-indigo-200 dark:border-indigo-800">
                    {employee.employeeCode}
                  </span>
                )}
                {employee?.status && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800 uppercase">
                    {employee.status}
                  </span>
                )}
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                  <Mail className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Email Address</span>
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {user?.email || 'N/A'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                  <Phone className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Phone Number</span>
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {employee?.phone || 'Not provided'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                  <Building2 className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Department</span>
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {employee?.departmentId?.name || 'Not assigned'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                  <UserIcon className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Reporting Manager</span>
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {employee?.reportingManagerId 
                    ? `${employee.reportingManagerId.firstName} ${employee.reportingManagerId.lastName}`
                    : 'None'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                  <Briefcase className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Employment Type</span>
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                  {employee?.employmentType ? employee.employmentType.replace('_', ' ') : 'N/A'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                  <CalendarDays className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Joining Date</span>
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {employee?.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
