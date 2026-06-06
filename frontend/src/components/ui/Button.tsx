import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  className?: string;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyle = "px-6 py-3 rounded-full font-sora font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-to-r from-[#2563EB] to-[#00C9A7] text-white hover:opacity-90 shadow-md hover:shadow-lg active:scale-[0.98]",
    ghost: "bg-transparent border border-cyan-400/20 text-[var(--accent-teal)] hover:bg-cyan-500/10 active:scale-[0.98]",
    danger: "bg-gradient-to-r from-rose-500 to-red-500 text-white hover:opacity-90 shadow-md hover:shadow-lg active:scale-[0.98]"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
