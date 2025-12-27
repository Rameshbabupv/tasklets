import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export function Input({ label, error, icon, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <input
          className={`
            block w-full rounded-lg border-0 py-3
            ${icon ? 'pl-10' : 'pl-4'} pr-4
            text-slate-900 dark:text-white
            ring-1 ring-inset ring-slate-300 dark:ring-slate-600
            placeholder:text-slate-400
            focus:ring-2 focus:ring-inset focus:ring-primary
            bg-slate-50 dark:bg-slate-900
            text-sm
            ${error ? 'ring-red-500' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  )
}
