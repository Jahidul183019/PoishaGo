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
    <div className="min-h-screen bg-[#040D1A] flex flex-col items-center justify-center p-6 select-none overflow-hidden">
      <div className="flex flex-col items-center gap-6 animate-[fadeIn_1.2s_ease-out_forwards]">
        {/* Animated Brand Pulse Mark */}
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#2563EB] to-[#00C9A7] flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.4)] animate-[scaleUp_0.8s_ease-out_forwards]">
          <span className="font-sora font-extrabold text-white text-5xl">৳</span>
        </div>

        {/* Branding text details */}
        <div className="text-center">
          <h1 className="font-sora font-extrabold text-4xl text-white tracking-tight">
            Poisha<span className="text-[#00C9A7]">Go</span>
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mt-2">
            The Digital Wallet of Bangladesh
          </p>
        </div>
      </div>

      {/* Loading bottom bar */}
      <div className="absolute bottom-16 w-32 h-1 bg-slate-900 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-500 to-teal-400 w-1/2 rounded-full animate-[progressSlide_2.2s_infinite_linear]" />
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
