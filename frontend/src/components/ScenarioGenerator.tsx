import React, { useState } from 'react';
import {
  Terminal,
  Play,
  ShieldAlert,
  Sparkles,
  Sliders,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { PageHeader } from './ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface ScenarioGeneratorProps {
  onDatasetCreated: (id: string) => void;
}

export const ScenarioGenerator: React.FC<ScenarioGeneratorProps> = ({ onDatasetCreated }) => {
  const [scenarioName, setScenarioName] = useState('ssh_brute_force');
  const [count, setCount] = useState(150);
  const [datasetName, setDatasetName] = useState('');
  const [anomalyRatio, setAnomalyRatio] = useState(0.85);
  const [attackerIp, setAttackerIp] = useState('185.220.101.5');
  const [compromiseAtEnd, setCompromiseAtEnd] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const scenarios = [
    {
      id: 'ssh_brute_force',
      title: 'SSH Authentication Brute Force & Breach',
      os: 'Linux (sshd)',
      desc: 'Rapid password spraying against invalid and root users, ending with successful authentication and shell spawn.',
      mitre: 'T1110 · T1078',
      color: 'var(--amber)',
    },
    {
      id: 'privilege_escalation',
      title: 'Linux Sudo & Privilege Escalation',
      os: 'Linux (sudo/su)',
      desc: 'User sudo attempts without permissions, repeated password failures, sudo find escape, and root session takeover.',
      mitre: 'T1548.003',
      color: 'var(--rose)',
    },
    {
      id: 'web_attack_sqli',
      title: 'Web Application SQLi & Path Traversal',
      os: 'Web (Nginx/Apache)',
      desc: 'High-volume web requests with SQL injection payloads (UNION SELECT, OR 1=1) and sensitive LFI paths (/etc/passwd, .env).',
      mitre: 'T1190',
      color: 'var(--cyan)',
    },
    {
      id: 'ransomware_staging',
      title: 'Windows Ransomware Defense Evasion',
      os: 'Windows (EventID 4688/4663)',
      desc: 'Execution of vssadmin delete shadows, bcedit recovery disabled, PowerShell encoded commands, and mass file encryption.',
      mitre: 'T1490',
      color: 'var(--purple)',
    },
    {
      id: 'lateral_movement',
      title: 'Windows Lateral Movement (SMB/RPC)',
      os: 'Windows (EventID 4624)',
      desc: 'Network logon (Type 3) across multiple internal workstations and domain controllers using compromised admin credentials.',
      mitre: 'T1021.002',
      color: 'var(--emerald)',
    },
    {
      id: 'benign_baseline',
      title: 'Benign Noise & System Telemetry',
      os: 'Multi-OS Baseline',
      desc: 'Authentic normal noise: routine cron jobs, periodic health checks, benign developer logins, and package manager updates.',
      mitre: 'Normal Operations',
      color: 'var(--blue)',
    },
  ];

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setSuccessMsg('');
      const res = await apiClient.generateScenario({
        scenario_name: scenarioName,
        count,
        name: datasetName.trim() || undefined,
        parameters: {
          anomaly_ratio: anomalyRatio,
          attacker_ip: attackerIp,
          compromise_at_end: compromiseAtEnd,
        },
      });
      setSuccessMsg(`Generated ${res.count} synthetic logs in dataset "${res.name}"!`);
      setTimeout(() => {
        onDatasetCreated(res.dataset_id);
      }, 1000);
    } catch (err: any) {
      alert(`Generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <PageHeader
        icon={Terminal}
        iconColor="var(--amber)"
        title="Event &amp; Scenario-Based Telemetry Engine"
        subtitle="Synthesize deterministic multi-stage attack scenarios with ground-truth causal sequences designed for SIEM rule validation."
        badge={<Badge variant="warning">Ground Truth</Badge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Scenario Selection Grid ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-3">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Select Attack / Security Scenario
            </h3>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              6 Pre-built Causal Chains
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {scenarios.map((s) => {
              const selected = scenarioName === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setScenarioName(s.id)}
                  className={`ui-card ${selected ? 'ui-card-selected' : ''}`}
                  style={{
                    padding: '1.15rem',
                    cursor: 'pointer',
                    borderColor: selected ? 'var(--border-active)' : 'var(--border-default)',
                    background: selected ? 'var(--bg-panel-hover)' : 'var(--bg-card)',
                    boxShadow: selected ? '0 0 0 1px var(--border-active), var(--shadow-sm)' : 'var(--shadow-sm)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: 600,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '6px',
                        background: 'var(--bg-surface)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {s.os}
                    </span>
                    {selected ? (
                      <CheckCircle style={{ width: '16px', height: '16px', color: 'var(--cyan)' }} />
                    ) : (
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid var(--border-default)' }} />
                    )}
                  </div>

                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
                    {s.title}
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '0.75rem' }}>
                    {s.desc}
                  </p>

                  <div style={{ fontSize: '0.6875rem', fontFamily: 'JetBrains Mono, monospace', color: s.color }}>
                    MITRE: {s.mitre}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Tuning Parameters Panel ─────────────────────────────────── */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <Sliders style={{ width: '15px', height: '15px', color: 'var(--cyan)' }} />
                Generation Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Dataset Label (Optional)
                </label>
                <input
                  type="text"
                  placeholder={`Scenario_${scenarioName}`}
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Log Volume
                  </span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', fontWeight: 700, color: 'var(--cyan)' }}>
                    {count} logs
                  </span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={2000}
                  step={10}
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value))}
                  className="accent-cyan-500"
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Attack vs. Benign Noise
                  </span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', fontWeight: 700, color: 'var(--amber)' }}>
                    {Math.round(anomalyRatio * 100)}% Attack
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={anomalyRatio}
                  onChange={(e) => setAnomalyRatio(parseFloat(e.target.value))}
                  className="accent-amber-500"
                />
                <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: 1.4 }}>
                  Blends background production noise to simulate high-traffic SOC telemetry.
                </p>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Simulated Attacker IP
                </label>
                <input
                  type="text"
                  value={attackerIp}
                  onChange={(e) => setAttackerIp(e.target.value)}
                  className="form-input"
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '0.25rem' }}>
                <input
                  type="checkbox"
                  id="compromise"
                  checked={compromiseAtEnd}
                  onChange={(e) => setCompromiseAtEnd(e.target.checked)}
                  className="accent-cyan-500 cursor-pointer"
                  style={{ width: '16px', height: '16px' }}
                />
                <label htmlFor="compromise" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
                  Include final breach &amp; post-exploitation event
                </label>
              </div>

              <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <Button
                  variant="primary"
                  size="md"
                  loading={generating}
                  onClick={handleGenerate}
                  style={{ width: '100%' }}
                  icon={<Play style={{ width: '14px', height: '14px' }} />}
                >
                  {generating ? 'Synthesizing Scenario...' : `Generate ${count} Scenario Logs`}
                </Button>

                {successMsg && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '8px',
                      background: 'var(--badge-success-bg)',
                      border: '1px solid var(--badge-success-border)',
                      color: 'var(--badge-success-text)',
                      fontSize: '0.75rem',
                      textAlign: 'center',
                      fontWeight: 600,
                    }}
                  >
                    {successMsg}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
