import React, { useState } from 'react';
import { Cloud, Play, Shield, Server, Lock, CheckCircle } from 'lucide-react';
import { apiClient } from '../api/client';
import { PageHeader } from './ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface CloudLogGeneratorProps {
  onDatasetCreated: (id: string) => void;
}

export const CloudLogGenerator: React.FC<CloudLogGeneratorProps> = ({ onDatasetCreated }) => {
  const [provider, setProvider] = useState<'aws' | 'azure' | 'gcp'>('aws');
  const [scenarioType, setScenarioType] = useState('privilege_escalation');
  const [count, setCount] = useState(100);
  const [datasetName, setDatasetName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const cloudConfigs = {
    aws: {
      name: 'AWS CloudTrail',
      badge: 'AWS Audit',
      color: 'var(--amber)',
      description: 'Generates JSON formatted CloudTrail events tracking IAM modifications, ConsoleLogin anomalies, S3 bucket policy changes, and trail tampering.',
      scenarios: [
        { id: 'privilege_escalation', title: 'IAM Backdoor & Admin Policy Attachment', desc: 'CreateUser -> AttachUserPolicy (AdministratorAccess) -> ConsoleLogin from suspicious IP.' },
        { id: 'data_exposure', title: 'Public S3 Bucket Policy Exposure', desc: 'PutBucketPolicy granting public wildcard Principal "*" on financial and customer records.' },
        { id: 'defense_evasion', title: 'CloudTrail Audit Log Tampering', desc: 'Attacker executes StopLogging and DeleteTrail to conceal malicious operations.' }
      ]
    },
    azure: {
      name: 'Azure Activity Logs',
      badge: 'Azure Monitor',
      color: 'var(--blue)',
      description: 'Generates Azure Resource Manager Activity Logs simulating RBAC role assignments, KeyVault secret exfiltration, and resource deletion.',
      scenarios: [
        { id: 'privilege_escalation', title: 'RBAC Subscription Owner Role Assignment', desc: 'Unauthorized roleAssignment write elevating attacker service principal to subscription Owner.' },
        { id: 'secret_harvesting', title: 'Azure KeyVault Mass Secret Retrieval', desc: 'High frequency read operations against production database connection strings in KeyVault.' },
        { id: 'resource_destruction', title: 'Virtual Machine & Storage Destruction', desc: 'Destructive deletion events targeting critical enterprise infrastructure.' }
      ]
    },
    gcp: {
      name: 'Google Cloud (GCP) Audit Logs',
      badge: 'Cloud Audit',
      color: 'var(--emerald)',
      description: 'Generates GCP Cloud Audit Logs with protoPayload entries simulating IAM service account key generation and firewall adjustments.',
      scenarios: [
        { id: 'persistence_key', title: 'Service Account Key Backdoor Persistence', desc: 'iam.admin.v1.CreateServiceAccountKey executed to export offline credentials.' },
        { id: 'firewall_breach', title: 'VPC Firewall Rule Ingress Exposure', desc: 'compute.firewalls.insert opening 0.0.0.0/0 ingress to internal database cluster.' }
      ]
    }
  };

  const currentConfig = cloudConfigs[provider];

  const handleProviderChange = (p: 'aws' | 'azure' | 'gcp') => {
    setProvider(p);
    setScenarioType(cloudConfigs[p].scenarios[0].id);
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setSuccessMsg('');
      const res = await apiClient.generateCloud({
        provider,
        scenario_type: scenarioType,
        count,
        name: datasetName.trim() || undefined,
      });
      setSuccessMsg(`Generated ${res.count} ${provider.toUpperCase()} cloud audit logs!`);
      setTimeout(() => {
        onDatasetCreated(res.dataset_id);
      }, 1000);
    } catch (err: any) {
      alert(`Cloud log generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <PageHeader
        icon={Cloud}
        iconColor="var(--cyan)"
        title="Cloud Infrastructure &amp; Audit Log Generator"
        subtitle="Synthesize realistic AWS CloudTrail, Azure Activity, and GCP Cloud Audit records without requiring live enterprise cloud accounts."
        badge={<Badge variant="primary">Multi-Cloud</Badge>}
      />

      {/* ── Cloud Provider Selector Tabs ─────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {(['aws', 'azure', 'gcp'] as const).map((p) => {
          const cfg = cloudConfigs[p];
          const isActive = provider === p;
          return (
            <button
              key={p}
              onClick={() => handleProviderChange(p)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                border: `1px solid ${isActive ? 'var(--border-active)' : 'var(--border-default)'}`,
                background: isActive ? 'var(--bg-card)' : 'var(--bg-surface)',
                color: isActive ? 'var(--text-heading)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.825rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: cfg.color,
                }}
              />
              {cfg.name}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Provider Scenarios ───────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle style={{ fontSize: '0.9rem' }}>
                  {currentConfig.name} Security Events
                </CardTitle>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {currentConfig.description}
                </p>
              </div>
              <Badge variant="neutral" size="sm">
                {currentConfig.badge}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentConfig.scenarios.map((sc) => {
                const isSelected = scenarioType === sc.id;
                return (
                  <div
                    key={sc.id}
                    onClick={() => setScenarioType(sc.id)}
                    style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      border: `1px solid ${isSelected ? 'var(--border-active)' : 'var(--border-subtle)'}`,
                      background: isSelected ? 'var(--bg-panel-hover)' : 'var(--bg-surface)',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
                        {sc.title}
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                        {sc.desc}
                      </p>
                    </div>
                    {isSelected ? (
                      <CheckCircle style={{ width: '18px', height: '18px', color: 'var(--cyan)', flexShrink: 0, marginTop: '2px' }} />
                    ) : (
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1px solid var(--border-default)', flexShrink: 0, marginTop: '2px' }} />
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* ── Settings Panel ──────────────────────────────────────────── */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle style={{ fontSize: '0.85rem' }}>
                Cloud Synthesis Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Dataset Label (Optional)
                </label>
                <input
                  type="text"
                  placeholder={`Cloud_${provider.toUpperCase()}_${scenarioType}`}
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
                    {count} events
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={1000}
                  step={10}
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value))}
                  className="accent-cyan-500"
                />
              </div>

              <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>Audit Schema: </span>
                Produces native {provider.toUpperCase()} JSON payloads conforming to standard SIEM ingestion decoders.
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
                  {generating ? 'Generating Cloud Events...' : `Generate ${count} ${provider.toUpperCase()} Logs`}
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
