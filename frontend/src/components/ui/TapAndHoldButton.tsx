import React, { useState, useEffect, useRef } from 'react';

interface TapAndHoldButtonProps {
  onComplete: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  duration?: number;
  className?: string;
  id?: string;
}

export const TapAndHoldButton: React.FC<TapAndHoldButtonProps> = ({
  onComplete,
  disabled = false,
  children,
  duration = 1500, // 1.5 seconds default
  className = '',
  id,
}) => {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();
  const isCompletedRef = useRef(false);

  const startHold = (e: React.MouseEvent | React.TouchEvent) => {
    // Only allow left clicks
    if ('button' in e && e.button !== 0) return;
    if (disabled || isCompletedRef.current) return;
    
    // We don't preventDefault here because it might block input focus/blur
    // But we do need to ensure touch actions don't scroll if they drag.
    // CSS touch-none handles that.
    
    setIsHolding(true);
    setProgress(0);
    startTimeRef.current = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const currentProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(currentProgress);

      if (currentProgress < 100) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsHolding(false);
        isCompletedRef.current = true;
        setProgress(100);
        onComplete();
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const cancelHold = () => {
    if (disabled || isCompletedRef.current) return;
    
    setIsHolding(false);
    setProgress(0);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Reset completion state if button is re-enabled
  useEffect(() => {
    if (!disabled) {
      isCompletedRef.current = false;
      setProgress(0);
    }
  }, [disabled]);

  return (
    <div
      id={id}
      className={`relative overflow-hidden rounded-full cursor-pointer touch-none select-none transition-all duration-300 shadow-md ${
        disabled ? 'opacity-50 cursor-not-allowed shadow-none' : 'hover:shadow-lg active:scale-[0.98]'
      } ${className}`}
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      onTouchCancel={cancelHold}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Background/Base Button */}
      <div className="absolute inset-0 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-full dark:bg-slate-800"></div>
      
      {/* Progress Fill */}
      <div 
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#2563EB] to-[#00C9A7] rounded-full transition-none"
        style={{ width: `${progress}%` }}
      ></div>

      {/* Ripple Animation Indicator when holding */}
      {isHolding && progress < 100 && (
        <div 
          className="absolute inset-0 bg-white/20 dark:bg-white/10 animate-pulse rounded-full"
        ></div>
      )}

      {/* Content */}
      <div 
        className={`relative z-10 flex items-center justify-center w-full px-6 py-4 font-sora font-semibold text-sm transition-colors duration-200 ${
          progress > 40 ? 'text-white' : 'text-[var(--text-primary)]'
        }`}
      >
        {isHolding && progress < 100 ? 'Hold to Confirm...' : children}
      </div>
    </div>
  );
};

export default TapAndHoldButton;
