
import React from 'react';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div {...props} className={`bg-white rounded-2xl shadow-sm border border-orange-50 p-6 ${className}`}>
    {children}
  </div>
);

export const Button: React.FC<{ 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  className?: string;
  disabled?: boolean;
  // Added type prop to support HTML button types
  type?: 'button' | 'submit' | 'reset';
}> = ({ children, onClick, variant = 'primary', className = '', disabled, type = 'button' }) => {
  const variants = {
    primary: 'bg-honey text-chocolate-dark hover:bg-honey-dark font-bold',
    secondary: 'bg-chocolate text-white hover:bg-chocolate-dark font-semibold',
    outline: 'border-2 border-honey text-chocolate-dark hover:bg-honey-light font-bold',
    danger: 'bg-red-500 text-white hover:bg-red-600 font-semibold'
  };

  return (
    <button 
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`px-6 py-2.5 rounded-full transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export const Input: React.FC<{
  label?: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}> = ({ label, type = 'text', value, onChange, placeholder, className = '' }) => (
  <div className={`flex flex-col gap-2 ${className}`}>
    {label && <label className="text-chocolate-light font-semibold text-sm">{label}</label>}
    <input 
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="bg-orange-50/50 border border-orange-100 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-honey-light transition-all text-chocolate"
    />
  </div>
);

// Added className prop to fix Type error when Badge is used with custom classes in views
export const Badge: React.FC<{ children: React.ReactNode; color?: 'green' | 'blue' | 'yellow' | 'red'; className?: string }> = ({ children, color = 'blue', className = '' }) => {
  const colors = {
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-100 text-red-700',
  };
  return <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${colors[color]} ${className}`}>{children}</span>;
};
