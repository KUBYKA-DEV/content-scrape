
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'cyan' | 'purple' | 'none';
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = "", 
  glowColor = 'none' 
}) => {
  const glowClass = glowColor === 'cyan' 
    ? 'accent-glow-cyan' 
    : glowColor === 'purple' 
    ? 'accent-glow-purple' 
    : '';

  return (
    <div className={`glass rounded-[24px] p-6 transition-all duration-300 ${glowClass} ${className}`}>
      {children}
    </div>
  );
};
