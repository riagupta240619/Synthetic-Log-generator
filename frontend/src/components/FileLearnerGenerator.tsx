import React, { useState, useRef } from 'react';
import { UploadCloud, Sparkles, FileCode, CheckCircle2, FileText, X } from 'lucide-react';
import { apiClient } from '../api/client';
import { PageHeader } from './ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface FileLearnerGeneratorProps {
  onDatasetCreated: (id: string) => void;
}

export const FileLearnerGenerator: React.FC<FileLearnerGeneratorProps> = ({ onDatasetCreated }) => {
  const [file, setFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState('');
  const [count, setCount] = useState(150);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!datasetName) {
        setDatasetName(`Learned_${selected.name.split('.')[0]}`);
      }
    }
  };

  const handleLearnAndSynthesize = async () => {
    if (!file) {
      alert('Please select a reference log file (JSON, CSV, or Syslog/TXT)');
      return;
    }

    try {
      setLoading(true);
      setSuccessMsg('');
      const res = await apiClient.uploadAndLearn(file, datasetName, count);
      setProfile(res.learned_profile);
      setSuccessMsg(`Learned data schema from ${file.name} and generated ${res.count} synthetic logs!`);
      setTimeout(() => {
        onDatasetCreated(res.dataset_id);
      }, 1500);
    } catch (err: any) {
      alert(`Learning failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <PageHeader
        icon={UploadCloud}
        iconColor="var(--blue)"
        title="Log Pattern Learner &amp; Synthesizer"
        subtitle="Upload reference log files (JSON, CSV, or Syslog). The engine analyzes field distributions, categorical types, and inter-arrival intervals to synthesize statistically aligned records."
        badge={<Badge variant="primary">Statistical Learning</Badge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Upload & Inspection Zone ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--border-default)',
              borderRadius: '16px',
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'var(--bg-card)',
              transition: 'all 0.15s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '220px',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--cyan)';
              (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-panel-hover)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-default)';
              (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card)';
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,.jsonl,.csv,.txt,.log"
              style={{ display: 'none' }}
            />

            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'var(--bg-chip)',
                color: 'var(--cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <FileCode style={{ width: '24px', height: '24px' }} />
            </div>

            {file ? (
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-heading)' }}>
                  {file.name}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {(file.size / 1024).toFixed(1)} KB &nbsp;·&nbsp; Ready for pattern extraction
                </p>
                <div style={{ marginTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.725rem', color: 'var(--cyan)', fontWeight: 600 }}>
                    Click to choose a different file
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  Click to browse or drop reference logs here
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Supports JSON, JSONL, CSV, and Syslog/TXT format files
                </p>
              </div>
            )}
          </div>

          {/* Supported Ingestion Formats */}
          <Card>
            <CardHeader>
              <CardTitle style={{ fontSize: '0.85rem' }}>
                Supported Log Formats &amp; Ingestion Protocols
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div style={{ padding: '0.85rem', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--cyan)', fontWeight: 700, fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>
                    JSON / JSONL
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.725rem', lineHeight: 1.4, display: 'block' }}>
                    Arbitrary nested SIEM objects, audit events, and API telemetry.
                  </span>
                </div>

                <div style={{ padding: '0.85rem', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--emerald)', fontWeight: 700, fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>
                    CSV Tabular
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.725rem', lineHeight: 1.4, display: 'block' }}>
                    Firewall, network flow, web proxy, and endpoint records with header columns.
                  </span>
                </div>

                <div style={{ padding: '0.85rem', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--amber)', fontWeight: 700, fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>
                    Syslog / TXT
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.725rem', lineHeight: 1.4, display: 'block' }}>
                    Standard RFC 3164 / 5424 auth, kernel, daemon, and system facility lines.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Synthesis Parameters Panel ──────────────────────────────── */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle style={{ fontSize: '0.85rem' }}>
                Synthesis Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Dataset Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Synthetic_Learned_Auth"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Output Event Volume
                  </span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', fontWeight: 700, color: 'var(--cyan)' }}>
                    {count} logs
                  </span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={1500}
                  step={10}
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value))}
                  className="accent-cyan-500"
                />
              </div>

              <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', fontSize: '0.725rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>Privacy Note: </span>
                Real PII and usernames are anonymized and substituted with statistically equivalent synthetic counterparts.
              </div>

              <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <Button
                  variant="primary"
                  size="md"
                  disabled={!file}
                  loading={loading}
                  onClick={handleLearnAndSynthesize}
                  style={{ width: '100%' }}
                  icon={<Sparkles style={{ width: '14px', height: '14px' }} />}
                >
                  {loading ? 'Learning Patterns & Synthesizing...' : 'Learn Pattern & Synthesize'}
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
