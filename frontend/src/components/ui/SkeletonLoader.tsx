import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'avatar' | 'rectangle';
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({ 
  className = '', 
  variant = 'text' 
}) => {
  let shapeClass = 'w-full h-4';
  
  if (variant === 'avatar') {
    shapeClass = 'w-12 h-12 rounded-full shrink-0';
  } else if (variant === 'card') {
    shapeClass = 'w-full h-32 rounded-2xl';
  } else if (variant === 'rectangle') {
    shapeClass = 'w-full h-20 rounded-xl';
  }

  return (
    <div className={`relative overflow-hidden bg-slate-300/10 rounded overflow-hidden leading-none ${shapeClass} ${className}`}>
      {/* Absolute shimmer motion overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-400/10 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
      
      {/* Fallback inline custom styles for the shimmer keyframes if class isn't injected */}
      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};

export default SkeletonLoader;
