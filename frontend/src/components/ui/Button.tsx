import React from 'react';
import { RefreshCw } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  style,
  ...props
}) => {
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '0.4rem 0.75rem', fontSize: '0.75rem', borderRadius: '8px' },
    md: { padding: '0.55rem 1rem', fontSize: '0.8125rem', borderRadius: '10px' },
    lg: { padding: '0.75rem 1.35rem', fontSize: '0.9rem', borderRadius: '12px' },
  };

  return (
    <button
      className={`btn btn-${variant} ${className}`}
      disabled={disabled || loading}
      style={{
        ...sizeStyles[size],
        ...style,
      }}
      {...props}
    >
      {loading ? (
        <RefreshCw style={{ width: size === 'sm' ? 12 : 14, height: size === 'sm' ? 12 : 14, animation: 'spin 1s linear infinite' }} />
      ) : icon ? (
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
