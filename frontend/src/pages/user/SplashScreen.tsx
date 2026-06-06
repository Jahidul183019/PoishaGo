import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 select-none overflow-hidden">
      <div className="flex flex-col items-center gap-6 animate-[fadeIn_1.2s_ease-out_forwards]">
        {/* Animated Brand Pulse Mark */}
        <div className="w-40 h-40 flex items-center justify-center animate-[scaleUp_0.8s_ease-out_forwards]">
          <img src="/logo.png" alt="PoishaGo Logo" className="w-full h-full object-contain" />
        </div>

        {/* Branding text details */}
        <div className="text-center mt-2">
          <h1 className="font-sora font-extrabold text-5xl text-[var(--text-primary)] tracking-tight">
            Poisha<span className="text-[#00C9A7]">Go</span>
          </h1>
          <p className="text-sm font-mono uppercase tracking-widest text-[var(--text-secondary)] mt-3">
            The Digital Wallet of Bangladesh
          </p>
        </div>
      </div>

      {/* Loading bottom bar */}
      <div className="absolute bottom-16 w-32 h-1 bg-[var(--border)] rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#2563EB] to-[#00C9A7] w-1/2 rounded-full animate-[progressSlide_2.2s_infinite_linear]" />
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.5); }
          to { transform: scale(1.0); }
        }
        @keyframes progressSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
