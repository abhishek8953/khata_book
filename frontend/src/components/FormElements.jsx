import React from 'react';

export const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseStyles = 'font-semibold rounded-lg transition duration-200 flex items-center justify-center space-x-1 sm:space-x-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeStyles = {
    sm: 'px-2 sm:px-3 py-1 text-xs sm:text-sm',
    md: 'px-3 sm:px-4 py-2 text-sm sm:text-base',
    lg: 'px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg'
  };

  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    secondary: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100'
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Input = ({ label, error, className = '', ...props }) => {
  return (
    <div className={`mb-3 sm:mb-4 ${className}`}>
      {label && <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">{label}</label>}
      <input
        className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
          error ? 'border-red-500 focus:ring-red-500' : ''
        }`}
        {...props}
      />
      {error && <p className="text-red-500 text-xs sm:text-sm mt-1">{error}</p>}
    </div>
  );
};

export const Select = ({ label, options, error, className = '', ...props }) => {
  return (
    <div className={`mb-3 sm:mb-4 ${className}`}>
      {label && <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">{label}</label>}
      <select
        className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
          error ? 'border-red-500 focus:ring-red-500' : ''
        }`}
        {...props}
      >
        <option value="">Select...</option>
        {options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-xs sm:text-sm mt-1">{error}</p>}
    </div>
  );
};

export const Textarea = ({ label, error, className = '', ...props }) => {
  return (
    <div className={`mb-3 sm:mb-4 ${className}`}>
      {label && <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">{label}</label>}
      <textarea
        className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none ${
          error ? 'border-red-500 focus:ring-red-500' : ''
        }`}
        rows="4"
        {...props}
      />
      {error && <p className="text-red-500 text-xs sm:text-sm mt-1">{error}</p>}
    </div>
  );
};

export const Checkbox = ({ label, className = '', ...props }) => {
  return (
    <div className={`mb-3 sm:mb-4 flex items-center ${className}`}>
      <input
        type="checkbox"
        className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 cursor-pointer"
        {...props}
      />
      {label && <label className="ml-2 sm:ml-3 text-sm sm:text-base font-medium text-gray-700 cursor-pointer">{label}</label>}
    </div>
  );
};
