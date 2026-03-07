import React from 'react';

export default function Button({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'gold';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}) {
  const variants = {
    primary: 'bg-burger-black text-white hover:bg-black shadow-lg shadow-black/5',
    secondary: 'bg-zinc-100 text-burger-black hover:bg-zinc-200',
    outline: 'border-2 border-burger-black text-burger-black hover:bg-burger-black hover:text-white',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
    ghost: 'bg-transparent text-zinc-600 hover:bg-zinc-100',
    gold: 'bg-burger-orange text-white hover:bg-burger-red shadow-lg shadow-burger-orange/20',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-8 py-4 rounded-2xl font-black uppercase tracking-tight transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
