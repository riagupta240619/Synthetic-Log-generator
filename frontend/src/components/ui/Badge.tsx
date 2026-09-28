import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'purple' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  style,
}) => {
  const variantStyles: Record<string, { bg: string; color: string; border: string; dotColor: string }> = {
    primary:   { bg: 'var(--badge-primary-bg)',   color: 'var(--badge-primary-text)',   border: 'var(--badge-primary-border)',   dotColor: 'var(--cyan)' },
    secondary: { bg: 'var(--badge-secondary-bg)', color: 'var(--badge-secondary-text)', border: 'var(--badge-secondary-border)', dotColor: 'var(--text-muted)' },
    success:   { bg: 'var(--badge-success-bg)',   color: 'var(--badge-success-text)',   border: 'var(--badge-success-border)',   dotColor: 'var(--emerald)' },
    warning:   { bg: 'var(--badge-warning-bg)',   color: 'var(--badge-warning-text)',   border: 'var(--badge-warning-border)',   dotColor: 'var(--amber)' },
    danger:    { bg: 'var(--badge-danger-bg)',    color: 'var(--badge-danger-text)',    border: 'var(--badge-danger-border)',    dotColor: 'var(--rose)' },
    purple:    { bg: 'var(--badge-purple-bg)',    color: 'var(--badge-purple-text)',    border: 'var(--badge-purple-border)',    dotColor: 'var(--purple)' },
    neutral:   { bg: 'var(--badge-neutral-bg)',   color: 'var(--badge-neutral-text)',   border: 'var(--badge-neutral-border)',   dotColor: 'var(--text-muted)' },
  };

  const v = variantStyles[variant] || variantStyles.neutral;
  const padding = size === 'sm' ? '0.15rem 0.45rem' : '0.22rem 0.65rem';
  const fontSize = size === 'sm' ? '0.65rem' : '0.725rem';

  return (
    <span
      className={`ui-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding,
        borderRadius: '9999px',
        fontSize,
        fontWeight: 600,
        letterSpacing: '0.02em',
        background: v.bg,
        color: v.color,
        border: `1px solid ${v.border}`,
        whiteSpace: 'nowrap',
        lineHeight: 1.2,
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: v.dotColor,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
};
