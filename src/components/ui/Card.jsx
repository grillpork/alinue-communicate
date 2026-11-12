import React from 'react';

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`rounded-3xl border border-gray-100 bg-white p-5 shadow-2xs transition-shadow ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`mb-3 flex flex-col gap-1 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3
      className={`text-base font-bold text-gray-900 tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-xs text-gray-500 leading-normal ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`text-sm text-gray-800 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div
      className={`mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;

