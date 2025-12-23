import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

const Alert = ({ type = 'info', message, onClose }) => {
  // Auto-hide alert after 3 seconds
  useEffect(() => {
    if (onClose && message) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  const bgColor = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200'
  }[type];

  const textColor = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800'
  }[type];

  const Icon = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertCircle,
    info: Info
  }[type];

  return (
    <div className={`${bgColor} border border-current rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 flex items-start space-x-2 sm:space-x-3`}>
      <Icon size={18} className={`${textColor} w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className={`${textColor} text-sm sm:text-base break-words`}>{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`${textColor} hover:opacity-70 transition flex-shrink-0 ml-2 text-lg sm:text-xl`}
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default Alert;
