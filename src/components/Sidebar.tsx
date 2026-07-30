import React, { useState } from 'react';
import { 
  Home, 
  FileText,
  Upload, 
  Sparkles, 
  History, 
  LogOut,
  AlertCircle
} from 'lucide-react';

export type SidebarNavId = 'home' | 'upload' | 'suggestions' | 'history';

interface SidebarProps {
  activeItem: SidebarNavId;
  onSelectItem: (item: SidebarNavId) => void;
  onLogout: () => void;
  user?: { name: string; email: string } | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeItem,
  onSelectItem,
  onLogout,
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navItems = [
    { id: 'home' as SidebarNavId, label: 'Home', icon: Home },
    { id: 'upload' as SidebarNavId, label: 'Upload resume', icon: Upload },
    { id: 'suggestions' as SidebarNavId, label: 'AI Chatbot', icon: Sparkles },
    { id: 'history' as SidebarNavId, label: 'History', icon: History },
  ];

  return (
    <>
      <aside className="w-full md:w-60 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs shrink-0 flex flex-col justify-between self-start md:sticky md:top-24 md:h-[calc(100vh-7rem)] z-30">
        <div className="space-y-4">
          {/* Navigation Section Title */}
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 pt-1">
            Menu
          </p>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectItem(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'text-[#1877f2] font-bold bg-blue-50/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#1877f2]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Logout Option at bottom */}
        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50/80 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal Overlay */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl border border-slate-200/90 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-1">Are you sure to exit?</h4>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">You will need to log in again to access your ATS Dashboard.</p>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
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
