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
  AlertCircle
} from 'lucide-react';
import { ProfileModal } from './ProfileModal';

interface NavbarProps {
  user?: { name: string; email: string } | null;
  currentPage?: 'home' | 'dashboard';
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onOpenUpload?: () => void;
  onNavigate?: (sectionId: string) => void;
  onSelectPage?: (page: 'home' | 'dashboard') => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentPage = 'home',
  onOpenAuth,
  onOpenUpload,
  onNavigate,
  onSelectPage,
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
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={() => handleNavClick(user ? 'dashboard' : 'home')}
            >
              <div className="w-10 h-10 rounded-xl bg-[#1877f2] flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xl tracking-tight text-slate-900">
                    ATS <span className="text-[#1877f2]">Score Checker</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium -mt-1">
                  AI Applicant Tracking System
                </p>
              </div>
            </div>

            {/* Nav Links - ONLY shown when user is NOT logged in */}
            {!user && (
              <nav className="hidden md:flex items-center gap-8">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`text-sm font-semibold transition-all cursor-pointer border-b-2 py-1 ${
                      (currentPage === 'dashboard' && item.id === 'dashboard') || (currentPage === 'home' && activeNav === item.id)
                        ? 'text-[#1877f2] border-[#1877f2]'
                        : 'text-slate-600 border-transparent hover:text-[#1877f2]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            )}

            {/* Action Area / Profile Icon */}
            <div className="flex items-center gap-3">
              {user ? (
                /* Logged In State: User Avatar or Initial Icon with Dropdown */
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                    className="w-10 h-10 rounded-full bg-[#1877f2] hover:bg-[#0866ff] text-white flex items-center justify-center font-bold text-base shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer ring-2 ring-blue-100 focus:outline-none relative overflow-hidden"
                    aria-label="User Account Menu"
                    title={user.name || 'User Profile'}
                  >
                    {navProfilePic ? (
                      <img src={navProfilePic} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{userInitial}</span>
                    )}
                    {hasUnreadNotification && (
                      <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 border-2 border-white rounded-full"></span>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200/90 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      {/* User Header Info: ONLY Name, NO email */}
                      <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
                        <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                      </div>

                      <div className="py-1">
                        {/* Profile option */}
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            if (onSelectPage) onSelectPage('dashboard');
                            setIsProfileModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#1877f2] transition-colors cursor-pointer text-left"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          <span>Profile</span>
                        </button>

                        {/* Notifications option */}
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            setIsNotificationsOpen(true);
                            setHasUnreadNotification(false);
                          }}
                          className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#1877f2] transition-colors cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-2.5">
                            <Bell className="w-4 h-4 text-slate-400" />
                            <span>Notifications</span>
                          </div>
                          {hasUnreadNotification && (
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          )}
                        </button>
                      </div>

                      {/* Logout option */}
                      <div className="pt-1 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            setShowNavbarLogoutConfirm(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Public Logged Out State */
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenAuth('login')}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-slate-700 hover:text-[#1877f2] hover:bg-slate-100 font-semibold text-sm rounded-xl transition-all cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Log In</span>
                  </button>

                  <button
                    onClick={() => onOpenAuth('signup')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 font-semibold text-sm rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Sign Up</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl max-w-md w-full border border-slate-200/90 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-[#1877f2] rounded-xl">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Notifications</h3>
                  <p className="text-xs text-slate-500 font-medium">Recent account activity & ATS system updates</p>
                </div>
              </div>
              <button 
                onClick={() => setIsNotificationsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#1877f2] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Account Verified</p>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Your welcome confirmation email was successfully sent via SMTP.
                  </p>
                  <span className="text-[10px] text-slate-400 font-medium mt-1 inline-block">Just now</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3">
                <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-900">ATS Analyzer Ready</p>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    You can upload PDF or DOCX resumes and check match scores instantly.
                  </p>
                  <span className="text-[10px] text-slate-400 font-medium mt-1 inline-block">10 mins ago</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsNotificationsOpen(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer mt-2"
            >
              Close Notifications
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal Overlay for Navbar */}
      {showNavbarLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl border border-slate-200/90 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-1">Are you sure to exit?</h4>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">You will need to log in again to access your ATS Dashboard.</p>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNavbarLogoutConfirm(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowNavbarLogoutConfirm(false);
                  if (onLogout) onLogout();
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer shadow-sm"
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



