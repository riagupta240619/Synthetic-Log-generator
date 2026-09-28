import React, { useState } from 'react';
import { Sparkles, Play, Bot, Zap, MessageSquare, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../api/client';
import { PageHeader } from './ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface LLMGeneratorProps {
  onDatasetCreated: (id: string) => void;
}

export const LLMGenerator: React.FC<LLMGeneratorProps> = ({ onDatasetCreated }) => {
  const [prompt, setPrompt] = useState(
    'Generate 15 Windows PowerShell download cradle events using IEX and base64 encoded strings, followed by privilege escalation.'
  );
  const [count, setCount] = useState(20);
  const [datasetName, setDatasetName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const quickPrompts = [
    {
      title: 'PowerShell Download Cradle',
      text: 'Generate 15 Windows PowerShell download cradle events using IEX and base64 encoded strings, followed by privilege escalation.'
    },
    {
      title: 'SSH Brute Force from Tor Exit',
      text: 'Generate 20 Linux SSH authentication failure logs targeting root from a known Tor exit node IP, followed by successful compromise.'
    },
    {
      title: 'AWS CloudTrail S3 Bucket Exfiltration',
      text: 'Generate 15 AWS CloudTrail events where an attacker assumes an IAM role, modifies PutBucketPolicy to public, and calls GetObject repeatedly.'
    },
    {
      title: 'Web Application SQL Injection & LFI',
      text: 'Generate 20 Nginx HTTP access logs containing SQL injection in URL parameters and path traversal attempts targeting /etc/shadow.'
    }
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    try {
      setGenerating(true);
      setSuccessMsg('');
      const res = await apiClient.generateLlm({
        prompt,
        count,
        name: datasetName.trim() || undefined,
      });
      setSuccessMsg(`Generated ${res.count} synthetic logs with LLM Engine!`);
      setTimeout(() => {
        onDatasetCreated(res.dataset_id);
      }, 1000);
    } catch (err: any) {
      alert(`LLM generation error: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <PageHeader
        icon={Sparkles}
        iconColor="var(--purple)"
        title="LLM-Based Structured Telemetry Generator"
        subtitle="Prompt in natural language for complex cyber attack timelines. Automatically couples to local Ollama (Llama3/Mistral) if running, with intelligent semantic fallback and schema verification."
        badge={<Badge variant="purple">Generative AI</Badge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Prompt & Presets ────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem' }}>
                <MessageSquare style={{ width: '15px', height: '15px', color: 'var(--purple)' }} />
                Natural Language Threat Incident Prompt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the sequence of security events you want to generate..."
                className="form-textarea"
                style={{ resize: 'none', lineHeight: 1.5, fontSize: '0.825rem' }}
              />

              <div style={{ marginTop: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.65rem' }}>
                  Preset Threat Scenarios
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {quickPrompts.map((qp, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPrompt(qp.text)}
                      style={{
                        padding: '0.85rem',
                        textAlign: 'left',
                        borderRadius: '10px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--purple)';
                        (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-panel-hover)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)';
                        (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface)';
                      }}
                    >
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-heading)', display: 'block', marginBottom: '0.25rem' }}>
                        {qp.title}
                      </span>
                      <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {qp.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Engine Parameters Panel ─────────────────────────────────── */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle style={{ fontSize: '0.85rem' }}>
                Engine Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Dataset Label
                </label>
                <input
                  type="text"
                  placeholder="LLM_Generated_Dataset"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Record Volume
                  </span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', fontWeight: 700, color: 'var(--purple)' }}>
                    {count} events
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value))}
                  className="accent-purple-500"
                />
              </div>

              <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', fontSize: '0.725rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span>Engine Pipeline:</span>
                  <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>Active &amp; Grounded</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Schema Enforcer:</span>
                  <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>Pydantic LogEvent</span>
                </div>
              </div>

              <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <Button
                  variant="primary"
                  size="md"
                  disabled={!prompt.trim()}
                  loading={generating}
                  onClick={handleGenerate}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                    borderColor: 'rgba(168, 85, 247, 0.4)',
                  }}
                  icon={<Sparkles style={{ width: '14px', height: '14px' }} />}
                >
                  {generating ? 'Querying LLM Engine...' : 'Generate with LLM'}
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
