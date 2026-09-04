import React from 'react';

interface AtsLogoIconProps {
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showGlow?: boolean;
  animated?: boolean;
}

export const AtsLogoIcon: React.FC<AtsLogoIconProps> = ({ 
  size = 'md', 
  className = '',
  showGlow = false,
  animated = false
}) => {
  let pixelSize = 64;
  if (typeof size === 'number') {
    pixelSize = size;
  } else {
    switch (size) {
      case 'sm': pixelSize = 44; break;
      case 'md': pixelSize = 68; break;
      case 'lg': pixelSize = 96; break;
      case 'xl': pixelSize = 132; break;
    }
  }

  // Expanded width for a more open, non-compact silhouette
  const svgWidth = Math.round(pixelSize * 1.25);
  const svgHeight = Math.round(pixelSize * 0.85);

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {/* Ambient backdrop glow */}
      {showGlow && (
        <div 
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#0284C7] via-[#06B6D4] to-[#10B981] blur-lg opacity-40 animate-pulse pointer-events-none"
          style={{ width: svgWidth * 1.25, height: svgHeight * 1.25 }}
        />
      )}

      {/* Main Vector Line Logo matching exact design with generous width */}
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox="16 16 70 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 overflow-visible drop-shadow-xs"
      >
        <defs>
          {/* Main Arc Gradient (Vivid Blue to Emerald Cyan) */}
          <linearGradient id="ats-dome-grad" x1="20" y1="65" x2="75" y2="25" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>

          {/* Checkmark Gradient (Cyan to Emerald Green) */}
          <linearGradient id="ats-check-grad" x1="50" y1="68" x2="78" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>

          {/* Base Bar Gradient */}
          <linearGradient id="ats-bar-grad" x1="28" y1="70" x2="48" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>

          {/* Glowing Filter for active/loading states */}
          <filter id="ats-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Looping Line Animations */}
          {animated && (
            <style>{`
              @keyframes arcTrace {
                0% { stroke-dashoffset: 200; }
                50% { stroke-dashoffset: 0; }
                100% { stroke-dashoffset: -200; }
              }
              @keyframes checkPulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.06); opacity: 0.85; }
              }
              @keyframes dotPulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.4); opacity: 0.6; }
              }
              .anim-arc-loop {
                stroke-dasharray: 100 100;
                animation: arcTrace 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
              }
              .anim-check-loop {
                transform-origin: 62px 55px;
                animation: checkPulse 1.8s ease-in-out infinite;
              }
              .anim-dot-loop {
                transform-origin: 45px 60px;
                animation: dotPulse 1.2s ease-in-out infinite;
              }
            `}</style>
          )}
        </defs>

        {/* 1. Main Curved Dome Arc */}
        <path
          d="M 28,60 C 28,30 48,22 70,35"
          stroke="url(#ats-dome-grad)"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          filter={animated ? 'url(#ats-glow-filter)' : undefined}
          className={animated ? 'anim-arc-loop' : ''}
        />

        {/* 2. Bottom Left Base Line Bar */}
        <line
          x1="28" y1="70" x2="48" y2="70"
          stroke="url(#ats-bar-grad)"
          strokeWidth="6.5"
          strokeLinecap="round"
        />

        {/* 3. Center Dot */}
        <circle
          cx="45"
          cy="60"
          r="3.5"
          fill="#06B6D4"
          className={animated ? 'anim-dot-loop' : ''}
        />

        {/* 4. Checkmark */}
        <path
          d="M 51,59 L 58,68 L 76,41"
          stroke="url(#ats-check-grad)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter={animated ? 'url(#ats-glow-filter)' : undefined}
          className={animated ? 'anim-check-loop' : ''}
        />
      </svg>
    </div>
  );
};

interface AtsLogoProps {
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
  showSubtitle?: boolean;
  className?: string;
  animated?: boolean;
  onClick?: () => void;
}

export const AtsLogo: React.FC<AtsLogoProps> = ({
  size = 'md',
  variant = 'full',
  showSubtitle = true,
  className = '',
  animated = false,
  onClick,
}) => {
  if (variant === 'icon') {
    return <AtsLogoIcon size={size} className={className} animated={animated} />;
  }

  return (
    <div 
      onClick={onClick}
      className={`inline-flex items-center gap-3.5 select-none group cursor-pointer ${className}`}
    >
      <AtsLogoIcon size={size} animated={animated} />
      <div className="flex items-center gap-2.5 leading-none">
        <span className="font-black text-base sm:text-lg tracking-normal text-[#0F172A] group-hover:text-black transition-colors whitespace-nowrap">
          ATS <span className="text-[#0284C7]">Score</span>{showSubtitle ? ' Checker' : ''}
        </span>
        <span className="px-2 py-0.5 bg-[#10B981]/15 border border-[#10B981]/30 text-[#059669] font-black text-[10px] sm:text-xs rounded-md uppercase tracking-wider shadow-2xs">
          AI
        </span>
      </div>
    </div>
  );
};

export default AtsLogo;

