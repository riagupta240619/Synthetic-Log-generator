import React, { useState } from 'react';
import { BrainCircuit, Play, Activity, GitCommit, ArrowRight } from 'lucide-react';
import { apiClient } from '../api/client';
import { PageHeader } from './ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface MLGeneratorProps {
  onDatasetCreated: (id: string) => void;
}

export const MLGenerator: React.FC<MLGeneratorProps> = ({ onDatasetCreated }) => {
  const [count, setCount] = useState(120);
  const [datasetName, setDatasetName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const states = [
    { name: 'Reconnaissance', tag: 'RECON', color: 'var(--blue)' },
    { name: 'Initial Access', tag: 'ACCESS', color: 'var(--cyan)' },
    { name: 'Credential Access', tag: 'CRED_SPRAY', color: 'var(--amber)' },
    { name: 'Privilege Escalation', tag: 'PRIV_ESC', color: 'var(--rose)' },
    { name: 'Defense Evasion', tag: 'EVASION', color: 'var(--purple)' },
    { name: 'Data Exfiltration', tag: 'EXFIL', color: 'var(--emerald)' },
  ];

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setSuccessMsg('');
      const res = await apiClient.generateMl({
        count,
        name: datasetName.trim() || undefined,
      });
      setSuccessMsg(`Generated ${res.count} synthetic logs with ML Markov Model!`);
      setTimeout(() => {
        onDatasetCreated(res.dataset_id);
      }, 1000);
    } catch (err: any) {
      alert(`ML generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <PageHeader
        icon={BrainCircuit}
        iconColor="var(--emerald)"
        title="ML Stochastic Sequence &amp; Markov Chain Model"
        subtitle="Simulate probabilistic attacker kill-chains. Rather than hard-coding static steps, this engine utilizes a first-order stochastic transition matrix and exponential inter-arrival distributions."
        badge={<Badge variant="success">Stochastic ML</Badge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Attacker Lifecycle Graph ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem' }}>
                  <Activity style={{ width: '15px', height: '15px', color: 'var(--emerald)' }} />
                  Attacker Lifecycle Markov State Matrix
                </CardTitle>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Sequential states traversed using empirical transition probability weights.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {states.map((st, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.85rem',
                      borderRadius: '10px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '85px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>
                      <span>STAGE {idx + 1}</span>
                      <span style={{ fontWeight: 700, color: st.color }}>{st.tag}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.825rem', color: 'var(--text-heading)', marginTop: '0.35rem' }}>
                      {st.name}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      P(transition) &gt; 0.65
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <span className="pulse-indicator" />
                <span>
                  Stochastic inter-arrival delays: <strong style={{ color: 'var(--text-primary)' }}>Exponential Poisson process (λ = 6s)</strong>
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Parameters Panel ────────────────────────────────────────── */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle style={{ fontSize: '0.85rem' }}>
                Simulation Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Dataset Label
                </label>
                <input
                  type="text"
                  placeholder="ML_Attacker_Sequence"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Sequence Trajectory Length
                  </span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', fontWeight: 700, color: 'var(--emerald)' }}>
                    {count} events
                  </span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={1000}
                  step={10}
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value))}
                  className="accent-emerald-500"
                />
              </div>

              <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', fontSize: '0.725rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>Attacker Dynamics: </span>
                Generates realistic time-drift, retry bursts, and branching operational steps without deterministic script artifacts.
              </div>

              <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <Button
                  variant="primary"
                  size="md"
                  loading={generating}
                  onClick={handleGenerate}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderColor: 'rgba(16, 185, 129, 0.4)',
                  }}
                  icon={<Play style={{ width: '14px', height: '14px' }} />}
                >
                  {generating ? 'Simulating Markov Trajectory...' : `Sample ${count} Transitions`}
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
