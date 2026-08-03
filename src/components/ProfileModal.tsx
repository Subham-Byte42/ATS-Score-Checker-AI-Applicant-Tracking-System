import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Clock, LogOut, X, Camera, Trash2, AlertCircle, Lock, Loader2, ShieldAlert } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { name: string; email: string };
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogout
}) => {
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Delete Account states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [lastVisited] = useState<string>(() => {
    const now = new Date();
    return `Today at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.email) {
      const savedPic = localStorage.getItem(`user_profile_pic_${user.email}`);
      if (savedPic) {
        setProfilePic(savedPic);
      }
    }
  }, [user]);

  if (!isOpen) return null;

  const initialLetter = user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        setProfilePic(base64Data);
        if (user?.email) {
          localStorage.setItem(`user_profile_pic_${user.email}`, base64Data);
          window.dispatchEvent(new Event('profile_pic_updated'));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setProfilePic(null);
    if (user?.email) {
      localStorage.removeItem(`user_profile_pic_${user.email}`);
      window.dispatchEvent(new Event('profile_pic_updated'));
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmExit = () => {
    setShowLogoutConfirm(false);
    onClose();
    onLogout();
  };

  const handleDeleteAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');

    if (!deletePassword) {
      setDeleteError('Please enter your password to confirm account deletion.');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          password: deletePassword,
        }),
      });

      const data = await response.json();
      setIsDeleting(false);

      if (!response.ok) {
        setDeleteError(data.message || 'Failed to delete account. Please verify your password.');
        return;
      }

      // Clear profile picture from localStorage
      if (user?.email) {
        localStorage.removeItem(`user_profile_pic_${user.email}`);
      }

      setShowDeleteConfirm(false);
      onClose();
      onLogout();
    } catch (err: any) {
      setIsDeleting(false);
      setDeleteError('Network error deleting account. Please try again.');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-3xl max-w-md w-full border border-slate-200/90 shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Background */}
        <div className="h-28 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-4 flex justify-end">
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Card Body */}
        <div className="px-6 pb-6 relative">
          {/* Avatar Icon / Profile Picture option */}
          <div className="-mt-12 mb-5 flex justify-between items-end">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-[#1877f2] text-white flex items-center justify-center text-3xl font-extrabold shadow-lg shadow-blue-500/30 ring-4 ring-white overflow-hidden">
                {profilePic ? (
                  <img src={profilePic} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{initialLetter}</span>
                )}
              </div>

              {/* Upload Overlay Badge */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-2 bg-slate-900 hover:bg-[#1877f2] text-white rounded-xl shadow-md ring-2 ring-white transition-all cursor-pointer group-hover:scale-105"
                title="Change profile picture"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            <div className="flex flex-col items-end gap-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-[#1877f2] hover:underline flex items-center gap-1 cursor-pointer bg-blue-50 px-2.5 py-1 rounded-lg"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{profilePic ? 'Change Photo' : 'Upload Photo'}</span>
              </button>
              {profilePic && (
                <button
                  onClick={handleRemovePhoto}
                  className="text-[11px] font-medium text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove Photo</span>
                </button>
              )}
            </div>
          </div>

          {/* User Fields Displayed (ONLY Username, Mail, Last Visited separated by transparent lines) */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200/60 p-4 space-y-0 text-xs">
            {/* Username */}
            <div className="py-3 flex items-center justify-between border-b border-slate-200/50">
              <span className="text-slate-500 font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" /> Username
              </span>
              <span className="font-bold text-slate-900 text-sm">{user.name}</span>
            </div>

            {/* Mail */}
            <div className="py-3 flex items-center justify-between border-b border-slate-200/50">
              <span className="text-slate-500 font-medium flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" /> Mail
              </span>
              <span className="font-semibold text-slate-800">{user.email}</span>
            </div>

            {/* Last Visited */}
            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-500 font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" /> Last Visited
              </span>
              <span className="font-semibold text-slate-700">{lastVisited}</span>
            </div>
          </div>

          {/* Logout & Close Buttons */}
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleLogoutClick}
              className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>

          {/* Delete Account Link / Button */}
          <div className="mt-4 pt-3 border-t border-slate-200/60 flex justify-center">
            <button
              onClick={() => {
                setDeletePassword('');
                setDeleteError('');
                setShowDeleteConfirm(true);
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1.5 hover:underline cursor-pointer group"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500 group-hover:scale-110 transition-transform" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>

        {/* Confirmation Exit / Logout Alert Modal Overlay */}
        {showLogoutConfirm && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-6 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl p-5 max-w-xs w-full text-center shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">Are you sure to exit?</h4>
              <p className="text-xs text-slate-500 mb-5">You will need to log in again to access your ATS Dashboard.</p>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmExit}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  Yes, Exit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Account Security Password Confirmation Modal Overlay */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-xs z-50 flex items-center justify-center p-5 animate-in fade-in duration-150">
            <div 
              className="bg-white rounded-2xl p-5 max-w-sm w-full text-center shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">Delete Your Account?</h4>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                This action will permanently remove your account and data directly from the database. For security, please enter your password to confirm.
              </p>

              <form onSubmit={handleDeleteAccountSubmit} className="space-y-3">
                <div className="text-left">
                  <label htmlFor="delete-account-password" className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Enter Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      id="delete-account-password"
                      type="password"
                      autoComplete="current-password"
                      value={deletePassword}
                      onChange={(e) => {
                        setDeletePassword(e.target.value);
                        setDeleteError('');
                      }}
                      placeholder="Your account password"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-900 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all outline-hidden"
                      required
                    />
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500 leading-tight flex items-center justify-between">
                    <span>For Google accounts, use your email address as password:</span>
                    <button
                      type="button"
                      onClick={() => setDeletePassword(user.email)}
                      className="text-blue-600 hover:underline font-medium cursor-pointer shrink-0 ml-1"
                    >
                      Fill Email
                    </button>
                  </div>
                </div>

                {deleteError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-1.5 text-left animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{deleteError}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletePassword('');
                      setDeleteError('');
                    }}
                    disabled={isDeleting}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDeleting || !deletePassword}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Account</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

