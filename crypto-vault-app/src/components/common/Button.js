// src/components/common/Button.js
import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium',
  fullWidth = false,
  disabled = false,
  className = '',
  icon = null
}) => {
  const baseStyles = "rounded-md font-medium focus:outline-none transition-colors";
  
  const variantStyles = {
    primary: "bg-yellow-500 hover:bg-yellow-600 text-white",
    secondary: "bg-yellow-800 hover:bg-yellow-700 text-white",
    outline: "border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white",
    ghost: "text-yellow-500 hover:bg-yellow-100 dark:hover:bg-gray-800"
  };
  
  const sizeStyles = {
    small: "py-1 px-3 text-sm",
    medium: "py-2 px-6",
    large: "py-3 px-8 text-lg"
  };
  
  const widthStyles = fullWidth ? "w-full" : "";
  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${disabledStyles} ${className}`}
    >
      <div className="flex items-center justify-center">
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </div>
    </button>
  );
};

export default Button;