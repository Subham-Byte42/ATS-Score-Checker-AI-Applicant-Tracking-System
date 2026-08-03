import React from 'react';
import { motion } from 'motion/react';
import { StatItem } from '../types';
import { 
  FileText, 
  CheckCircle2, 
  Target, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';

interface DashboardStatsProps {
  stats?: StatItem[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats = [] }) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'FileText':
        return <FileText className="w-5 h-5 text-[#1877f2]" />;
      case 'CheckCircle2':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'Target':
        return <Target className="w-5 h-5 text-[#1877f2]" />;
      case 'AlertTriangle':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default:
        return <FileText className="w-5 h-5 text-[#1877f2]" />;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {(stats || []).map((stat, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.08, ease: 'easeOut' }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow duration-200 group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              {stat.title}
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#F8FAFC] border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              {getIcon(stat.iconName)}
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              {stat.value}
            </span>
            <div
              className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                stat.isPositive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'bg-rose-50 text-rose-700 border border-rose-200/60'
              }`}
            >
              {stat.isPositive ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              <span>{stat.change}</span>
            </div>
          </div>

          <p className="mt-2 text-xs text-[#64748B] font-medium">
            {stat.description}
          </p>
        </motion.div>
      ))}
    </div>
  );
};

