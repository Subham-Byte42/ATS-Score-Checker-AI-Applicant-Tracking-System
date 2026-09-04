import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AtsLogoIcon } from './AtsLogo';

interface BrandedLoadingScreenProps {
  message?: string;
  subMessage?: string;
  fullScreen?: boolean;
  inline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BrandedLoadingScreen: React.FC<BrandedLoadingScreenProps> = ({
  message = 'Analyzing Resume...',
  subMessage = 'Extracting skills, formatting, and keyword matches',
  fullScreen = true,
  inline = false,
  size = 'md',
  className = '',
}) => {
  // Animated dots index state (0, 1, 2)
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
    }, 450);
    return () => clearInterval(interval);
  }, []);

  const dotsText = '.'.repeat(dotCount);

  // Logo sizes for different contexts
  let iconPixelSize = 64;
  if (size === 'sm') iconPixelSize = 40;
  if (size === 'lg') iconPixelSize = 88;

  const content = (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`flex flex-col items-center justify-center text-center select-none ${
        inline ? 'py-6 px-4' : 'p-8 max-w-md w-full mx-auto'
      } ${className}`}
    >
      {/* Central Animated Logo Container */}
      <div className="relative mb-6 flex items-center justify-center">
        {/* Soft Blue Radial Pulse Glow */}
        <motion.div
          animate={{
            scale: [0.9, 1.25, 0.9],
            opacity: [0.25, 0.55, 0.25],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute w-36 h-36 rounded-full bg-[#3B82F6]/20 blur-2xl pointer-events-none"
        />

        {/* Light Red Radial Glow Secondary Pulse */}
        <motion.div
          animate={{
            scale: [1.1, 0.85, 1.1],
            opacity: [0.15, 0.4, 0.15],
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.4,
          }}
          className="absolute w-32 h-32 rounded-full bg-[#FF4D4F]/15 blur-xl pointer-events-none"
        />

        {/* Subtle Outer Orbit Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute rounded-full border-2 border-dashed border-[#3B82F6]/20"
          style={{
            width: iconPixelSize + 36,
            height: iconPixelSize + 36,
          }}
        />

        {/* Floating & Breathing Line Logo Icon with Looping Line Animations */}
        <motion.div
          animate={{
            y: [-4, 4, -4],
            scale: [0.98, 1.05, 0.98],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative z-10 p-4 bg-white/80 backdrop-blur-md rounded-full shadow-[0_12px_36px_rgba(59,130,246,0.15)] border border-slate-100/90 flex items-center justify-center"
        >
          <AtsLogoIcon size={iconPixelSize} animated={true} showGlow={true} />
        </motion.div>
      </div>

      {/* Brand Title Text */}
      <div className="flex items-center justify-center gap-1.5 text-xs font-black tracking-wider uppercase text-slate-400 mb-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
        <span>ATS Score Checker AI</span>
      </div>

      {/* Main Animated Status Text */}
      <h3 className="text-lg sm:text-xl font-black text-[#1F2937] tracking-tight flex items-center justify-center gap-0.5 min-h-[28px]">
        <span>{message}</span>
        <span className="inline-block w-6 text-left font-extrabold text-[#3B82F6]">{dotsText}</span>
      </h3>

      {/* Optional Subtitle Message */}
      {subMessage && (
        <p className="text-xs sm:text-sm text-[#6B7280] font-medium max-w-xs mt-1.5 leading-relaxed">
          {subMessage}
        </p>
      )}

      {/* Subtle Progress Track Indicator */}
      <div className="w-48 h-1 bg-slate-100 rounded-full mt-6 overflow-hidden relative">
        <motion.div
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-full h-full bg-gradient-to-r from-[#3B82F6] via-[#60A5FA] to-[#FF4D4F] rounded-full"
        />
      </div>
    </motion.div>
  );

  if (fullScreen) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 bg-white flex items-center justify-center p-4">
          {content}
        </div>
      </AnimatePresence>
    );
  }

  return content;
};

export default BrandedLoadingScreen;
