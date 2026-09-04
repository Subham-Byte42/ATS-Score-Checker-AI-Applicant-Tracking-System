import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Upload, 
  Sparkles, 
  History, 
  LogOut,
  AlertCircle,
  Undo2
} from 'lucide-react';

export type SidebarNavId = 'home' | 'upload' | 'suggestions' | 'history';

interface SidebarProps {
  activeItem: SidebarNavId;
  onSelectItem: (item: SidebarNavId) => void;
  onLogout: () => void;
  onBack?: () => void;
  user?: { name: string; email: string } | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeItem,
  onSelectItem,
  onLogout,
  onBack,
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navItems = [
    { id: 'home' as SidebarNavId, label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'upload' as SidebarNavId, label: 'Upload Resume', icon: Upload, badge: 'Scanner' },
    { id: 'suggestions' as SidebarNavId, label: 'AI Chat Advisor', icon: Sparkles, badge: 'Gemini' },
    { id: 'history' as SidebarNavId, label: 'Scan History', icon: History, badge: null },
  ];

  return (
    <>
      <aside className="w-full md:w-64 bg-white rounded-3xl border border-slate-200/80 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.03)] shrink-0 flex flex-col justify-between self-start md:sticky md:top-24 md:h-[calc(100vh-7rem)] z-30 transition-all">
        <div className="space-y-4">
          {/* Previous Page Button */}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-black text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all cursor-pointer shadow-2xs active:scale-98 group"
              title="Return to previous page"
            >
              <div className="p-1 rounded-xl bg-white border border-slate-200 text-slate-600 group-hover:text-teal-600 group-hover:border-teal-200 shadow-2xs transition-colors">
                <Undo2 className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">Previous Page</span>
            </button>
          )}

          {/* Section Header */}
          <div className="px-3 pt-1 flex items-center justify-between">
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
              Navigation
            </p>
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectItem(item.id)}
                  className={`w-full group relative flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'text-slate-900 bg-slate-100 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Active Left Indicator */}
                    {isActive && (
                      <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full bg-teal-600" />
                    )}

                    <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-slate-900 text-teal-400 shadow-xs' 
                        : 'text-slate-400 group-hover:text-slate-700 group-hover:scale-110'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full transition-colors ${
                      isActive 
                        ? 'bg-teal-50 text-teal-700 border border-teal-200' 
                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-rose-600 hover:bg-rose-50/80 transition-all cursor-pointer group"
          >
            <div className="p-1.5 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-110 transition-transform">
              <LogOut className="w-4 h-4" />
            </div>
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal Overlay */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl border border-slate-200/90 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-1">Are you sure to exit?</h4>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">You will need to log in again to access your ATS Dashboard.</p>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
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


