import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  registration: UseFormRegisterReturn;
  icon?: React.ReactNode;
}

const InputField: React.FC<InputFieldProps> = ({ 
  label, 
  error, 
  registration, 
  icon, 
  className = "", 
  ...props 
}) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-sm font-medium text-slate-700 ml-1">
        {label}
      </label>
      <div className="relative group">
        <input
          {...registration}
          {...props}
          className={`w-full px-4 py-2.5 rounded-lg border bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 ${
            error 
              ? 'border-red-300 focus:border-red-500' 
              : 'border-slate-200 hover:border-slate-300 focus:border-primary-500'
          } ${icon ? 'pl-10' : ''} ${className}`}
        />
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors">
            {icon}
          </div>
        )}
      </div>
      
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5 mt-1 text-red-500 text-xs font-medium ml-1"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InputField;