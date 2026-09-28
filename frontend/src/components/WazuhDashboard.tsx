import React, { useState, useEffect } from 'react';
import { 
  Crosshair, 
  ShieldAlert, 
  Send, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Terminal,
  ExternalLink,
  Target
} from 'lucide-react';
import { WazuhEvaluationSummary, DatasetSummary } from '../types';
import { apiClient } from '../api/client';
import { PageHeader } from './ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { MetricCard } from './ui/MetricCard';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';

interface WazuhDashboardProps {
  selectedDatasetId?: string | null;
  datasets: DatasetSummary[];
}

export const WazuhDashboard: React.FC<WazuhDashboardProps> = ({ selectedDatasetId, datasets }) => {
  const [activeDatasetId, setActiveDatasetId] = useState<string>(selectedDatasetId || (datasets[0]?.id ?? ''));
  const [evaluation, setEvaluation] = useState<WazuhEvaluationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Forwarding state
  const [forwardHost, setForwardHost] = useState('127.0.0.1');
  const [forwardPort, setForwardPort] = useState(514);
  const [forwardProtocol, setForwardProtocol] = useState<'udp' | 'tcp'>('udp');
  const [forwardStatus, setForwardStatus] = useState<any>(null);
  const [forwarding, setForwarding] = useState(false);

  useEffect(() => {
    if (selectedDatasetId) {
      setActiveDatasetId(selectedDatasetId);
    }
  }, [selectedDatasetId]);

  useEffect(() => {
    if (activeDatasetId) {
      runEvaluation(activeDatasetId);
    }
  }, [activeDatasetId]);

  const runEvaluation = async (id: string) => {
    try {
      setLoading(true);
      const res = await apiClient.testWazuh(id);
      setEvaluation(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleForward = async () => {
    if (!activeDatasetId) return;
    try {
      setForwarding(true);
      setForwardStatus(null);
      const res = await apiClient.forwardWazuh(activeDatasetId, forwardHost, forwardPort, forwardProtocol);
      setForwardStatus(res);
    } catch (err: any) {
      setForwardStatus({ success: false, message: err.message });
    } finally {
      setForwarding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header & Dataset Selector ───────────────────────────── */}
      <PageHeader
        icon={Crosshair}
        iconColor="var(--rose)"
        title="Wazuh Detection &amp; SIEM Evaluation Center"
        subtitle="Benchmark synthetic logs against Wazuh decoders and detection rulesets, measure telemetry coverage, and stream live packets over Syslog."
        badge={<Badge variant="danger">SIEM Validation</Badge>}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Evaluate Dataset:
            </span>
            <select
              value={activeDatasetId}
              onChange={(e) => setActiveDatasetId(e.target.value)}
              className="form-select"
              style={{ fontSize: '0.8rem', minWidth: '220px' }}
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.count} logs)
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              size="sm"
              loading={loading}
              onClick={() => runEvaluation(activeDatasetId)}
              title="Re-run Wazuh Rules Evaluation"
              style={{ padding: '0.45rem 0.75rem' }}
            >
              <RefreshCw style={{ width: '13px', height: '13px' }} />
            </Button>
          </div>
        }
      />

      {loading ? (
        <Card style={{ padding: '3.5rem', textAlign: 'center' }}>
          <RefreshCw style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite', color: 'var(--cyan)', margin: '0 auto 1rem' }} />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-heading)' }}>
            Evaluating Security Ruleset
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Running Wazuh decoders, rule matching, and MITRE ATT&amp;CK tactic correlation...
          </p>
        </Card>
      ) : !evaluation ? (
        <EmptyState
          icon={Crosshair}
          title="No Evaluation Selected"
          description="Select a synthetic dataset from the dropdown above to test against Wazuh SIEM detection rules."
        />
      ) : (
        <>
          {/* ── 4 Telemetry Detection KPI Cards ──────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Detection Coverage"
              value={`${evaluation.detection_rate}%`}
              sub={`${evaluation.total_alerts_generated} alerts triggered from ${evaluation.total_logs_analyzed} logs`}
              icon={Crosshair}
              accentColor="var(--cyan)"
            />
            <MetricCard
              label="High / Critical Alerts"
              value={evaluation.high_severity_alerts}
              sub="Level 10-15 (Ransomware, Escalation, Root)"
              icon={ShieldAlert}
              accentColor="var(--rose)"
            />
            <MetricCard
              label="Medium Alerts"
              value={evaluation.medium_severity_alerts}
              sub="Level 6-9 (Failed Logins, Sudo attempts)"
              icon={AlertCircle}
              accentColor="var(--amber)"
            />
            <MetricCard
              label="MITRE ATT&CK Tactics"
              value={evaluation.mitre_tactics_detected.length}
              sub={evaluation.mitre_tactics_detected.join(', ') || 'No tactics mapped'}
              icon={Target}
              accentColor="var(--purple)"
            />
          </div>

          {/* ── Top Rules & Syslog Forwarder ─────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Rules */}
            <div className="lg:col-span-2">
              <Card style={{ height: '100%' }}>
                <CardHeader>
                  <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem' }}>
                    <Target style={{ width: '15px', height: '15px', color: 'var(--cyan)' }} />
                    Top Triggered Wazuh Rulesets
                  </CardTitle>
                  <Badge variant="primary" size="sm">
                    {evaluation.top_rules_triggered.length} Rules Active
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {evaluation.top_rules_triggered.map((rule, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.85rem',
                        borderRadius: '10px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span
                          style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '0.725rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '6px',
                            background: 'var(--badge-primary-bg)',
                            color: 'var(--cyan)',
                            border: '1px solid var(--badge-primary-border)',
                          }}
                        >
                          Rule {rule.rule_id}
                        </span>
                        <span style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-heading)' }}>
                          {rule.description}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.725rem',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontWeight: 700,
                          background: 'var(--bg-card)',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border-default)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {rule.count} hits
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Live Forwarder */}
            <div>
              <Card style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <CardHeader>
                  <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem' }}>
                    <Send style={{ width: '15px', height: '15px', color: 'var(--emerald)' }} />
                    Live Syslog Forwarder
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    Stream these synthetic logs directly to your local or remote Wazuh Manager over Syslog port 514.
                  </p>

                  <div>
                    <label style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                      Wazuh Host / IP
                    </label>
                    <input
                      type="text"
                      value={forwardHost}
                      onChange={(e) => setForwardHost(e.target.value)}
                      className="form-input"
                      placeholder="127.0.0.1 or wazuh-manager"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                        Port
                      </label>
                      <input
                        type="number"
                        value={forwardPort}
                        onChange={(e) => setForwardPort(parseInt(e.target.value) || 514)}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                        Protocol
                      </label>
                      <select
                        value={forwardProtocol}
                        onChange={(e) => setForwardProtocol(e.target.value as any)}
                        className="form-select"
                      >
                        <option value="udp">UDP (Standard)</option>
                        <option value="tcp">TCP</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ paddingTop: '0.5rem' }}>
                    <Button
                      variant="primary"
                      size="md"
                      disabled={forwarding}
                      loading={forwarding}
                      onClick={handleForward}
                      style={{ width: '100%' }}
                      icon={<Send style={{ width: '13px', height: '13px' }} />}
                    >
                      {forwarding ? 'Sending Syslog Packets...' : 'Forward to Wazuh Socket'}
                    </Button>

                    {forwardStatus && (
                      <div
                        style={{
                          marginTop: '0.65rem',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          fontSize: '0.725rem',
                          background: forwardStatus.success ? 'var(--badge-success-bg)' : 'var(--badge-danger-bg)',
                          border: `1px solid ${forwardStatus.success ? 'var(--badge-success-border)' : 'var(--badge-danger-border)'}`,
                          color: forwardStatus.success ? 'var(--badge-success-text)' : 'var(--badge-danger-text)',
                        }}
                      >
                        {forwardStatus.message}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ── Triggered Wazuh Alert Stream ─────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <ShieldAlert style={{ width: '15px', height: '15px', color: 'var(--amber)' }} />
                Triggered Wazuh Alert Stream ({evaluation.alerts.length})
              </CardTitle>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                Showing top matches
              </span>
            </CardHeader>
            <div style={{ overflowX: 'auto', maxHeight: '420px', overflowY: 'auto' }}>
              <table className="soc-table">
                <thead>
                  <tr>
                    <th>Rule / Level</th>
                    <th>MITRE ATT&CK</th>
                    <th>User / IP</th>
                    <th>Alert Description</th>
                    <th>Raw Match Telemetry</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluation.alerts.slice(0, 100).map((alert, idx) => (
                    <tr key={idx}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 700, color: 'var(--cyan)' }}>
                          Rule {alert.rule_id}
                        </div>
                        <span
                          className={`badge mt-1 ${alert.level >= 10 ? 'badge-critical' : alert.level >= 6 ? 'badge-medium' : 'badge-info'}`}
                          style={{ marginTop: '0.2rem' }}
                        >
                          Level {alert.level}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {alert.mitre ? (
                          <div>
                            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.725rem', color: 'var(--purple)', fontWeight: 600 }}>
                              {alert.mitre.id}
                            </div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                              {alert.mitre.tactic}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                        {alert.user && <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{alert.user}</div>}
                        {alert.source_ip && <div style={{ color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>{alert.source_ip}</div>}
                        {!alert.user && !alert.source_ip && <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {alert.description}
                      </td>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: '380px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={alert.raw_log}>
                          {alert.raw_log}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
