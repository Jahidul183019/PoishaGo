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
      className={`relative overflow-hidden cursor-pointer touch-none select-none transition-all duration-300 bg-[var(--bg-secondary)] border-t border-[var(--border)] ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'
      } ${className}`}
      // Break out of typical modal padding by using negative margins
      // Use negative margins to touch the edges of the modal
      style={{ 
        WebkitTapHighlightColor: 'transparent',
        // Creating the gentle bKash-style top curve
        borderTopLeftRadius: '50% 20px',
        borderTopRightRadius: '50% 20px',
        width: 'calc(100% + 3rem)',
        marginLeft: '-1.5rem',
        marginBottom: '-3rem',
        marginTop: '1rem',
        paddingTop: '1.5rem',
        paddingBottom: '2.5rem',
      }}
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      onTouchCancel={cancelHold}
    >
      
      {/* Progress Fill - uses the brand gradient */}
      <div 
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#2563EB] to-[#00C9A7] transition-none"
        style={{ width: `${progress}%` }}
      ></div>

      {/* Ripple Animation Indicator when holding */}
      {isHolding && progress < 100 && (
        <div 
          className="absolute inset-0 bg-[var(--text-primary)] opacity-10 animate-pulse"
        ></div>
      )}

      {/* Content */}
      <div className={`relative z-10 flex flex-col items-center justify-center w-full px-6 font-sora transition-colors duration-200 ${progress > 40 ? 'text-white' : 'text-[var(--text-primary)]'}`}>
        <img 
          src="/logo.png" 
          alt="PoishaGo" 
          className="w-12 h-12 object-contain mb-3" 
        />
        <span className="text-base md:text-lg font-medium tracking-wide text-center">
          {isHolding && progress < 100 ? 'Hold to Confirm...' : `Tap and hold to confirm`}
        </span>
      </div>
    </div>
  );
};

export default TapAndHoldButton;
