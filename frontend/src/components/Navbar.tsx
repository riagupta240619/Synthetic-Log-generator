import React from 'react';
import {
  ShieldAlert,
  Layers,
  Terminal,
  Cloud,
  UploadCloud,
  Sparkles,
  BrainCircuit,
  Database,
  Crosshair,
  Server,
  Moon,
  Sun,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  systemStatus: { status: string; database: string } | null;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  systemStatus,
  theme,
  onToggleTheme,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard',       icon: Layers      },
    { id: 'scenarios', label: 'Scenario Engine', icon: Terminal    },
    { id: 'cloud',     label: 'Cloud Audit',     icon: Cloud       },
    { id: 'upload',    label: 'File Learner',    icon: UploadCloud },
    { id: 'llm',       label: 'LLM Generator',  icon: Sparkles    },
    { id: 'ml',        label: 'ML Markov',       icon: BrainCircuit},
    { id: 'datasets',  label: 'Datasets',        icon: Database    },
    { id: 'wazuh',     label: 'Wazuh Detection', icon: Crosshair   },
  ];

  return (
    <header className="navbar-root">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
          
          {/* Brand Logo & Title */}
          <div
            onClick={() => setActiveTab('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '9px',
                background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
              }}
            >
              <ShieldAlert style={{ width: '18px', height: '18px', color: '#ffffff' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
                  SYNTHO<span style={{ color: 'var(--cyan)' }}>SEC</span>
                </span>
                <span
                  style={{
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '9999px',
                    background: 'var(--bg-chip)',
                    color: 'var(--cyan)',
                    border: '1px solid var(--border-hover)',
                  }}
                >
                  v1.0
                </span>
              </div>
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1 }}>
                Synthetic Cyber Telemetry Platform
              </p>
            </div>
          </div>

          {/* Right Header Controls: Status & Theme */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {/* System Status Pill */}
            <div
              className="hidden lg:flex"
              style={{
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.3rem 0.75rem',
                borderRadius: '9999px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.75rem',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="pulse-indicator" />
                <span style={{ color: 'var(--text-secondary)' }}>
                  API:{' '}
                  <strong style={{ color: 'var(--emerald)' }}>
                    {systemStatus?.status === 'ok' ? 'Online' : 'Active'}
                  </strong>
                </span>
              </div>
              <span style={{ color: 'var(--border-default)' }}>|</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Server style={{ width: '13px', height: '13px', color: 'var(--cyan)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>
                  DB:{' '}
                  <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                    {systemStatus?.database || 'Local'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Theme Toggle Button */}
            <button
              className="theme-toggle"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              <span className="theme-toggle-thumb">
                {theme === 'dark' ? (
                  <Moon style={{ width: '11px', height: '11px', color: '#ffffff' }} />
                ) : (
                  <Sun style={{ width: '11px', height: '11px', color: '#ffffff' }} />
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Row */}
        <nav
          style={{
            display: 'flex',
            gap: '0.35rem',
            overflowX: 'auto',
            paddingBottom: '0.65rem',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '0.45rem',
            scrollbarWidth: 'none',
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`nav-tab${isActive ? ' active' : ''}`}
              >
                <Icon
                  style={{
                    width: '14px',
                    height: '14px',
                    color: isActive ? 'var(--cyan)' : 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
