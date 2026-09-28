import React from 'react';
import {
  Layers,
  Terminal,
  Cloud,
  UploadCloud,
  Sparkles,
  BrainCircuit,
  ShieldCheck,
  Crosshair,
  ArrowUpRight,
  Database,
  Eye,
  Activity,
  Plus,
} from 'lucide-react';
import { DatasetSummary } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { MetricCard } from './ui/MetricCard';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';

interface DashboardOverviewProps {
  datasets: DatasetSummary[];
  onSelectTab: (tab: string) => void;
  onViewLogs: (id: string) => void;
  onValidate: (id: string) => void;
  onTestWazuh: (id: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  datasets,
  onSelectTab,
  onViewLogs,
  onValidate,
  onTestWazuh,
}) => {
  const totalLogs = datasets.reduce((a, d) => a + (d.count || 0), 0);
  const totalWazuhAlerts = datasets.reduce((a, d) => a + (d.wazuh_alerts_count || 0), 0);
  const validated = datasets.filter((d) => d.validation_score != null);
  const avgScore =
    validated.length > 0
      ? (validated.reduce((a, d) => a + (d.validation_score || 0), 0) / validated.length).toFixed(1)
      : '100.0';

  const engineCards = [
    {
      id: 'scenarios',
      title: 'Scenario Engine',
      desc: 'Deterministic multi-stage attack scenarios including SSH brute force, sudo abuse, and ransomware.',
      icon: Terminal,
      color: 'var(--amber)',
      badge: 'Linux · Windows',
    },
    {
      id: 'cloud',
      title: 'Cloud Audit Logs',
      desc: 'Realistic AWS CloudTrail, Azure Activity, and GCP Audit logs without real cloud accounts.',
      icon: Cloud,
      color: 'var(--cyan)',
      badge: 'AWS · Azure · GCP',
    },
    {
      id: 'upload',
      title: 'File Pattern Learner',
      desc: 'Upload reference logs (JSON, CSV, Syslog) to model distributions and synthesize new records.',
      icon: UploadCloud,
      color: 'var(--blue)',
      badge: 'JSON · CSV · Syslog',
    },
    {
      id: 'llm',
      title: 'LLM Incident Generator',
      desc: 'Prompt in natural language for complex threat incidents with automatic Pydantic schema validation.',
      icon: Sparkles,
      color: 'var(--purple)',
      badge: 'Natural Language',
    },
    {
      id: 'ml',
      title: 'ML Markov Chain Model',
      desc: 'Stochastic kill-chain sequence transitions with realistic Poisson inter-arrival delays.',
      icon: BrainCircuit,
      color: 'var(--emerald)',
      badge: 'Markov Trajectory',
    },
  ];

  return (
    <div className="space-y-8">
      {/* ── Hero Platform Command Center ──────────────────────────────── */}
      <div className="hero-banner">
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '720px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', marginBottom: '1rem' }}>
            <Badge variant="primary" dot>
              Ground Truth Telemetry Studio
            </Badge>
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)',
              fontWeight: 900,
              color: 'var(--text-heading)',
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
              marginBottom: '0.75rem',
            }}
          >
            Synthetic Cybersecurity Log Platform{' '}
            <span className="gradient-text-cyan">&amp; Wazuh SIEM Evaluator</span>
          </h1>

          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              maxWidth: '620px',
              marginBottom: '1.25rem',
            }}
          >
            Synthesize authentic, event-aware security event sequences across Linux, Windows, Web, and Multi-Cloud
            infrastructures. Benchmark detection coverage and SIEM rules against verified ground-truth scenarios offline.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              size="md"
              icon={<Plus style={{ width: '14px', height: '14px' }} />}
              onClick={() => onSelectTab('scenarios')}
            >
              Generate Synthetic Logs
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={<Database style={{ width: '14px', height: '14px' }} />}
              onClick={() => onSelectTab('datasets')}
            >
              View Repository ({datasets.length})
            </Button>
          </div>
        </div>
      </div>

      {/* ── Key Metrics (KPIs) ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Generated Datasets"
          value={datasets.length}
          sub="Stored in MongoDB for export & SIEM tests"
          icon={Database}
          accentColor="var(--cyan)"
          onClick={() => onSelectTab('datasets')}
        />
        <MetricCard
          label="Total Synthetic Logs"
          value={totalLogs.toLocaleString()}
          sub="Chronologically coherent event records"
          icon={Terminal}
          accentColor="var(--emerald)"
        />
        <MetricCard
          label="Schema Integrity"
          value={`${avgScore}%`}
          sub="Verified against Pydantic schema rules"
          icon={ShieldCheck}
          accentColor="var(--amber)"
        />
        <MetricCard
          label="Wazuh SIEM Alerts"
          value={totalWazuhAlerts}
          sub="Triggered across active detection rules"
          icon={Crosshair}
          accentColor="var(--rose)"
          onClick={() => onSelectTab('wazuh')}
        />
      </div>

      {/* ── Modular Generation Engines ─────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity style={{ width: '16px', height: '16px', color: 'var(--cyan)' }} />
              Modular Telemetry Engines
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              Choose a generation strategy to synthesize tailored security events.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {engineCards.map((eng) => {
            const Icon = eng.icon;
            return (
              <Card
                key={eng.id}
                hover
                onClick={() => onSelectTab(eng.id)}
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1.25rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '9px',
                        background: `color-mix(in srgb, ${eng.color} 12%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${eng.color} 25%, transparent)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon style={{ width: '18px', height: '18px', color: eng.color }} />
                    </div>
                    <ArrowUpRight style={{ width: '16px', height: '16px', color: 'var(--text-muted)' }} />
                  </div>

                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
                    {eng.title}
                  </h3>
                  <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                    {eng.desc}
                  </p>
                </div>

                <div>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.55rem',
                      borderRadius: '9999px',
                      background: `color-mix(in srgb, ${eng.color} 10%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${eng.color} 25%, transparent)`,
                      color: eng.color,
                    }}
                  >
                    {eng.badge}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── Recent Synthetic Datasets Feed ────────────────────────────── */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers style={{ width: '16px', height: '16px', color: 'var(--cyan)' }} />
              Recent Synthetic Datasets
            </CardTitle>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              Latest generated datasets available for inspection, export, and testing.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectTab('datasets')}
          >
            View all ({datasets.length}) →
          </Button>
        </CardHeader>

        {datasets.length === 0 ? (
          <EmptyState
            icon={Database}
            title="No Datasets Generated Yet"
            description="Launch one of the telemetry engines above to create your first synthetic security dataset."
            action={
              <Button
                variant="primary"
                size="sm"
                icon={<Plus style={{ width: '13px', height: '13px' }} />}
                onClick={() => onSelectTab('scenarios')}
              >
                Synthesize First Dataset
              </Button>
            }
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="soc-table">
              <thead>
                <tr>
                  <th>Dataset Name</th>
                  <th>Engine</th>
                  <th>Volume</th>
                  <th>Integrity Score</th>
                  <th>Wazuh Alerts</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {datasets.slice(0, 6).map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-heading)' }}>
                        {d.name}
                      </div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {d.id} &nbsp;·&nbsp; {d.created_at}
                      </div>
                    </td>
                    <td>
                      <Badge variant="secondary" size="sm">
                        {d.generator_type}
                      </Badge>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.775rem', color: 'var(--cyan)' }}>
                        {d.count.toLocaleString()} logs
                      </span>
                    </td>
                    <td>
                      {d.validation_score != null ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.8rem', color: d.validation_score >= 90 ? 'var(--emerald)' : 'var(--amber)' }}>
                            {d.validation_score}%
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>({d.validation_status})</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Pending</span>
                      )}
                    </td>
                    <td>
                      {d.wazuh_tested ? (
                        <Badge variant="danger" size="sm">
                          {d.wazuh_alerts_count} alerts
                        </Badge>
                      ) : (
                        <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Untested</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Inspect Telemetry Logs"
                          onClick={() => onViewLogs(d.id)}
                          style={{ padding: '0.35rem 0.6rem' }}
                        >
                          <Eye style={{ width: '14px', height: '14px', color: 'var(--cyan)' }} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Validate Schema"
                          onClick={() => onValidate(d.id)}
                          style={{ padding: '0.35rem 0.6rem' }}
                        >
                          <ShieldCheck style={{ width: '14px', height: '14px', color: 'var(--emerald)' }} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Test Against Wazuh"
                          onClick={() => onTestWazuh(d.id)}
                          style={{ padding: '0.35rem 0.6rem' }}
                        >
                          <Crosshair style={{ width: '14px', height: '14px', color: 'var(--rose)' }} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
