import React, { useState, useRef, useEffect } from 'react';
import { 
  LogIn, 
  UserPlus,
  FileCheck2,
  LogOut,
  User,
  Bell,
  CheckCircle2,
  X,
  AlertCircle,
  Sparkles,
  LayoutDashboard,
  Eye,
  FileText,
  ArrowRight,
  Undo2
} from 'lucide-react';
import { ProfileModal } from './ProfileModal';
import { AtsLogo } from './AtsLogo';
import { ResumeRecord } from '../types';

interface NavbarProps {
  user?: { name: string; email: string } | null;
  currentPage?: 'landing' | 'home' | 'dashboard';
  userRole?: 'personal' | 'recruiter';
  personalUser?: { name: string; email: string } | null;
  recruiterUser?: { name: string; email: string } | null;
  resumes?: ResumeRecord[];
  onSelectResume?: (resume: ResumeRecord) => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onOpenUpload?: () => void;
  onNavigate?: (sectionId: string) => void;
  onSelectPage?: (page: 'landing' | 'home' | 'dashboard') => void;
  onSelectLanding?: () => void;
  onSwitchRole?: (role: 'personal' | 'recruiter') => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentPage = 'home',
  userRole = 'personal',
  personalUser,
  recruiterUser,
  resumes = [],
  onSelectResume,
  onOpenAuth,
  onNavigate,
  onSelectPage,
  onSelectLanding,
  onSwitchRole,
  onLogout,
}) => {
  const [activeNav, setActiveNav] = useState(currentPage === 'dashboard' ? 'dashboard' : 'home');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [hasUnreadNotification, setHasUnreadNotification] = useState(true);
  const [navProfilePic, setNavProfilePic] = useState<string | null>(null);
  const [showNavbarLogoutConfirm, setShowNavbarLogoutConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync unread notification indicator if resumes exist
  useEffect(() => {
    if (resumes && resumes.length > 0) {
      setHasUnreadNotification(true);
    }
  }, [resumes?.length]);

  // Sync profile pic from localStorage
  useEffect(() => {
    const loadPic = () => {
      if (user?.email) {
        const pic = localStorage.getItem(`user_profile_pic_${user.email}`);
        setNavProfilePic(pic);
      } else {
        setNavProfilePic(null);
      }
    };

    loadPic();

    window.addEventListener('profile_pic_updated', loadPic);
    return () => {
      window.removeEventListener('profile_pic_updated', loadPic);
    };
  }, [user]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (navId: string) => {
    setActiveNav(navId);
    if (navId === 'dashboard') {
      if (onSelectPage) onSelectPage('dashboard');
      return;
    }
    if (navId === 'home' || navId === 'features' || navId === 'how-it-works') {
      if (onSelectPage) onSelectPage('home');
    }
    if (onNavigate) {
      onNavigate(navId);
    } else {
      const el = document.getElementById(navId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'how-it-works', label: 'How it Works' },
  ];

  const userInitial = user
    ? (user.name ? user.name.charAt(0) : user.email.charAt(0)).toUpperCase()
    : 'U';

  return (
    <>
      <header className="sticky top-2 sm:top-3 z-40 w-full px-2 sm:px-4 lg:px-6 transition-all">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_4px_20px_rgb(15,23,42,0.06)] rounded-[22px] px-3 sm:px-6 py-2.5 sm:py-3">
          <div className="flex items-center justify-between gap-4">
            
            {/* Logo & Previous on Left */}
            <div className="flex items-center gap-2 sm:gap-3">
              {onSelectLanding && (
                <button
                  type="button"
                  onClick={onSelectLanding}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200 transition-all cursor-pointer shadow-2xs group"
                  title="Return to previous page / portal selection"
                >
                  <Undo2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600 group-hover:-translate-x-0.5 transition-transform" />
                  <span className="hidden sm:inline">Previous</span>
                </button>
              )}
              <AtsLogo 
                size="md"
                onClick={() => {
                  if (onSelectLanding) onSelectLanding();
                  else handleNavClick('home');
                }}
              />
            </div>

            {/* Navigation in Center - Only shown on home/logged-out state */}
            {!user && (
              <nav className="hidden md:flex items-center gap-1 bg-slate-100/70 p-1 rounded-2xl border border-slate-200/80">
                {navItems.map((item) => {
                  const isActive = (currentPage === 'home' && activeNav === item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? 'text-slate-900 bg-white shadow-xs font-black'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            )}

            {/* Login / Dashboard / Profile Button on Right */}
            <div className="flex items-center gap-3 shrink-0">
              {user ? (
                /* Logged In State: Dashboard Quick Toggle, Notifications & User Avatar */
                <div className="flex items-center gap-2.5">
                  
                  {/* Dashboard toggle button */}
                  <button
                    onClick={() => handleNavClick('dashboard')}
                    className={`hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                      currentPage === 'dashboard'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 text-teal-400" />
                    <span>Dashboard</span>
                  </button>

                  {/* Notification Bell */}
                  <button
                    onClick={() => {
                      setIsNotificationsOpen(true);
                      setHasUnreadNotification(false);
                    }}
                    className="relative p-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-all cursor-pointer"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {hasUnreadNotification && (
                      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-teal-600 ring-2 ring-white rounded-full"></span>
                    )}
                  </button>

                  {/* Profile Avatar Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsDropdownOpen((prev) => !prev)}
                      className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-sm active:scale-95 transition-all cursor-pointer ring-2 ring-slate-200 focus:outline-none relative overflow-hidden"
                      aria-label="User Account Menu"
                      title={user.name || 'User Profile'}
                    >
                      {navProfilePic ? (
                        <img src={navProfilePic} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{userInitial}</span>
                      )}
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-3 w-64 rounded-[20px] bg-white border border-slate-200 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                        {/* User Header Info */}
                        <div className="px-4 py-3.5 border-b border-slate-100 bg-slate-50/80 rounded-t-[20px]">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                              userRole === 'recruiter'
                                ? 'bg-indigo-100/80 text-indigo-800 border-indigo-200'
                                : 'bg-blue-100/80 text-blue-800 border-blue-200'
                            }`}>
                              {userRole === 'recruiter' ? 'Recruiter ID' : 'Personal ID'}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-bold">Active</span>
                          </div>
                          <p className="text-xs font-black text-slate-900 truncate">{user.name}</p>
                          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{user.email}</p>
                        </div>

                        <div className="py-1">
                          {/* Profile & Settings */}
                          <button
                            onClick={() => {
                              setIsDropdownOpen(false);
                              if (onSelectPage) onSelectPage('dashboard');
                              setIsProfileModalOpen(true);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer text-left"
                          >
                            <User className="w-4 h-4 text-slate-500" />
                            <span>Profile & Account</span>
                          </button>

                          {/* Notifications */}
                          <button
                            onClick={() => {
                              setIsDropdownOpen(false);
                              setIsNotificationsOpen(true);
                              setHasUnreadNotification(false);
                            }}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer text-left"
                          >
                            <div className="flex items-center gap-3">
                              <Bell className="w-4 h-4 text-slate-500" />
                              <span>Notifications</span>
                            </div>
                            {hasUnreadNotification && (
                              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                            )}
                          </button>
                        </div>

                        {/* Logout */}
                        <div className="pt-1 border-t border-slate-100">
                          <button
                            onClick={() => {
                              setIsDropdownOpen(false);
                              setShowNavbarLogoutConfirm(true);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                          >
                            <LogOut className="w-4 h-4 text-rose-500" />
                            <span>Log Out of {userRole === 'recruiter' ? 'Recruiter ID' : 'Personal ID'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Public Logged Out State: Login / Dashboard Sign Up Buttons */
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenAuth('login')}
                    className="flex items-center gap-1.5 px-4 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-bold text-xs sm:text-sm rounded-2xl transition-all cursor-pointer"
                  >
                    <LogIn className="w-4 h-4 text-slate-500" />
                    <span>{userRole === 'recruiter' ? 'Recruiter Log In' : 'Log In'}</span>
                  </button>

                  <button
                    onClick={() => onOpenAuth('signup')}
                    className={`flex items-center gap-1.5 px-4 sm:px-5 py-2.5 text-white font-extrabold text-xs sm:text-sm rounded-2xl transition-all cursor-pointer shadow-md active:scale-98 ${
                      userRole === 'recruiter'
                        ? 'bg-indigo-600 hover:bg-indigo-700'
                        : 'bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    <UserPlus className="w-4 h-4 text-teal-400" />
                    <span>{userRole === 'recruiter' ? 'Recruiter Sign Up' : 'Get Started'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      {user && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={user}
          onLogout={() => {
            setIsProfileModalOpen(false);
            if (onLogout) onLogout();
          }}
        />
      )}

      {/* Notifications Modal */}
      {isNotificationsOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsNotificationsOpen(false)}
        >
          <div 
            className="bg-white rounded-[24px] max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden relative p-6 space-y-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-slate-100 text-slate-800 rounded-2xl">
                  <Bell className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">Notifications</h3>
                    {resumes && resumes.length > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-teal-100 text-teal-800">
                        {resumes.length} {resumes.length === 1 ? 'report' : 'reports'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Resume analysis alerts & report links</p>
                </div>
              </div>
              <button 
                onClick={() => setIsNotificationsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {resumes && resumes.length > 0 ? (
                resumes.map((resume, idx) => (
                  <div 
                    key={resume.id || `notif-res-${idx}`}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/90 rounded-2xl transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="p-2 bg-teal-50 border border-teal-200/80 text-teal-700 rounded-xl shrink-0 mt-0.5">
                          <FileCheck2 className="w-4 h-4 text-teal-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-black text-slate-900">
                              Resume Analysed
                            </p>
                            <span className="text-[10px] px-2 py-0.5 bg-teal-100 text-teal-800 font-black rounded-md">
                              {resume.atsScore ?? 80}% ATS Score
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                            {resume.candidateName ? `${resume.candidateName} • ` : ''}{resume.targetRole || 'Software Engineer'}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                            File: {resume.fileName || 'Resume.pdf'}
                          </p>
                          <span className="text-[10px] text-slate-400 font-semibold mt-0.5 inline-block">
                            {resume.uploadDate || 'Just now'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-200/70">
                      <span className="text-[11px] text-teal-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Report Ready
                      </span>
                      <button
                        onClick={() => {
                          if (onSelectResume) onSelectResume(resume);
                          setIsNotificationsOpen(false);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer group"
                      >
                        <Eye className="w-3.5 h-3.5 text-teal-400" />
                        <span>View Report</span>
                        <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl text-center space-y-2">
                  <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center mx-auto">
                    <FileText className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">No Resumes Analysed Yet</p>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium leading-relaxed max-w-xs mx-auto">
                      Scan or upload your resume to receive real-time ATS compatibility scores and full analysis reports.
                    </p>
                  </div>
                </div>
              )}

              {/* System readiness notification */}
              <div className="p-3 bg-slate-50/60 border border-slate-200/60 rounded-2xl flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800">ATS Gemini AI Model Ready</p>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Keyword scanner, section compliance auditor, and multi-format parser active.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 shrink-0 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => setIsNotificationsOpen(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Close Notifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal Overlay for Navbar */}
      {showNavbarLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[20px] p-6 max-w-xs w-full text-center shadow-2xl border border-slate-200">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-extrabold text-slate-900 mb-1">Are you sure to exit?</h4>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed font-medium">You will need to log in again to access your ATS Dashboard.</p>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNavbarLogoutConfirm(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowNavbarLogoutConfirm(false);
                  if (onLogout) onLogout();
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Yes, Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

