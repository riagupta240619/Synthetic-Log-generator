import React from 'react';

export interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ style?: React.CSSProperties; className?: string }>;
  accentColor?: string;
  badge?: React.ReactNode;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  sub,
  icon: Icon,
  accentColor = 'var(--cyan)',
  badge,
  onClick,
}) => {
  return (
    <div
      className="ui-metric-card"
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
            border: `1px solid color-mix(in srgb, ${accentColor} 25%, transparent)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon style={{ width: '16px', height: '16px', color: accentColor }} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <div
          style={{
            fontSize: '1.85rem',
            fontWeight: 800,
            fontFamily: 'JetBrains Mono, monospace',
            color: 'var(--text-heading)',
            lineHeight: 1.1,
          }}
        >
          {value}
        </div>
        {badge}
      </div>

      {sub && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.4 }}>
          {sub}
        </div>
      )}
    </div>
  );
};
