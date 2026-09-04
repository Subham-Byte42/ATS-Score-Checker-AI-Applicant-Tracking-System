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
  const getIcon = (name: string, isPositive: boolean) => {
    let IconComponent = FileText;
    if (name === 'CheckCircle2') IconComponent = CheckCircle2;
    if (name === 'Target') IconComponent = Target;
    if (name === 'AlertTriangle') IconComponent = AlertTriangle;

    const bgClass = isPositive 
      ? 'bg-[#4F7CFF]/10 text-[#4F7CFF]' 
      : 'bg-rose-50 text-[#FF6B6B]';

    return (
      <div className={`w-11 h-11 rounded-2xl ${bgClass} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
        <IconComponent className="w-5.5 h-5.5" />
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {(stats || []).map((stat, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.08, ease: 'easeOut' }}
          className="bg-white p-5 sm:p-6 rounded-[20px] border border-[#EEF2F7] soft-shadow hover-soft-shadow group relative overflow-hidden"
        >
          {/* Subtle Ambient Blob */}
          <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-[#4F7CFF]/5 blur-xl group-hover:bg-[#4F7CFF]/10 transition-colors pointer-events-none" />

          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[11px] font-extrabold text-[#6B7280] uppercase tracking-wider">
              {stat.title}
            </span>
            {getIcon(stat.iconName, stat.isPositive)}
          </div>

          <div className="flex items-baseline justify-between gap-2 relative z-10">
            <span className="text-2xl sm:text-3xl font-black text-[#1F2937] tracking-tight">
              {stat.value}
            </span>
            <div
              className={`flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full ${
                stat.isPositive
                  ? 'bg-[#7EDCC3]/20 text-[#1F2937] border border-[#7EDCC3]/30'
                  : 'bg-rose-50 text-[#FF6B6B] border border-rose-200'
              }`}
            >
              {stat.isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-[#4F7CFF]" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-[#FF6B6B]" />
              )}
              <span>{stat.change}</span>
            </div>
          </div>

          <p className="mt-2.5 text-xs text-[#6B7280] font-medium relative z-10">
            {stat.description}
          </p>
        </motion.div>
      ))}
    </div>
  );
};
