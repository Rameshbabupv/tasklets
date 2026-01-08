import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700 ${paddingStyles[padding]} ${className}`}
    >
      {children}
    </div>
  )
}
