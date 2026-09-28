import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Search, 
  Copy, 
  Check, 
  FileJson, 
  FileSpreadsheet, 
  Terminal,
  ShieldCheck,
  Crosshair,
  ExternalLink,
  Code
} from 'lucide-react';
import { DatasetDetail, LogEvent } from '../types';
import { apiClient } from '../api/client';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface LogViewerModalProps {
  datasetId: string;
  onClose: () => void;
  onRunValidation: (id: string) => void;
  onRunWazuh: (id: string) => void;
}

export const LogViewerModal: React.FC<LogViewerModalProps> = ({
  datasetId,
  onClose,
  onRunValidation,
  onRunWazuh,
}) => {
  const [dataset, setDataset] = useState<DatasetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'raw' | 'json'>('table');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, [datasetId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getDataset(datasetId, 300);
      setDataset(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = dataset?.logs.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.message?.toLowerCase().includes(q) ||
      l.source_ip?.toLowerCase().includes(q) ||
      l.username?.toLowerCase().includes(q) ||
      l.event_type?.toLowerCase().includes(q) ||
      l.severity?.toLowerCase().includes(q)
    );
  }) || [];

  const handleCopy = () => {
    if (!dataset?.logs) return;
    navigator.clipboard.writeText(JSON.stringify(dataset.logs, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSeverityBadge = (sev: string) => {
    const s = sev?.toLowerCase();
    if (s === 'critical') return <Badge variant="danger" size="sm">Critical</Badge>;
    if (s === 'high')     return <Badge variant="warning" size="sm">High</Badge>;
    if (s === 'medium')   return <Badge variant="warning" size="sm">Medium</Badge>;
    if (s === 'low')      return <Badge variant="primary" size="sm">Low</Badge>;
    return <Badge variant="neutral" size="sm">Info</Badge>;
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '72rem',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--border-default)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-lg), var(--shadow-inset-top)',
          overflow: 'hidden',
        }}
      >
        {/* ── Modal Header ────────────────────────────────────────────── */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-table-head)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'var(--bg-chip)',
                color: 'var(--cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-hover)',
              }}
            >
              <Terminal style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
                  {dataset?.name || 'Loading Dataset Telemetry...'}
                </h3>
                {dataset?.count && (
                  <Badge variant="primary" size="sm">
                    {dataset.count} logs
                  </Badge>
                )}
              </div>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.15rem' }}>
                Source: <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{dataset?.log_source}</span>
                {' '}· Engine: <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{dataset?.generator_type}</span>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Button
              variant="secondary"
              size="sm"
              icon={<ShieldCheck style={{ width: '13px', height: '13px', color: 'var(--emerald)' }} />}
              onClick={() => onRunValidation(datasetId)}
            >
              Validate
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Crosshair style={{ width: '13px', height: '13px', color: 'var(--rose)' }} />}
              onClick={() => onRunWazuh(datasetId)}
            >
              Test in Wazuh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              style={{ padding: '0.35rem 0.5rem', marginLeft: '0.25rem' }}
            >
              <X style={{ width: '16px', height: '16px' }} />
            </Button>
          </div>
        </div>

        {/* ── Toolbar & Filters ───────────────────────────────────────── */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            background: 'var(--bg-surface)',
            flexShrink: 0,
          }}
        >
          {/* View mode segmented tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-card)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
            {(['table', 'raw', 'json'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: viewMode === mode ? 'var(--bg-surface-elevated)' : 'transparent',
                  color: viewMode === mode ? 'var(--text-heading)' : 'var(--text-secondary)',
                  fontWeight: viewMode === mode ? 700 : 500,
                  fontSize: '0.75rem',
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  boxShadow: viewMode === mode ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {mode === 'table' ? 'Event Grid' : mode === 'raw' ? 'Raw Syslog' : 'JSON Object'}
              </button>
            ))}
          </div>

          {/* Search box & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'flex-end', minWidth: '260px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '240px' }}>
              <Search style={{ width: '13px', height: '13px', color: 'var(--text-muted)', position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Filter logs by IP, event..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2rem', paddingRight: '0.5rem', fontSize: '0.75rem', height: '32px' }}
              />
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              icon={copied ? <Check style={{ width: '12px', height: '12px', color: 'var(--emerald)' }} /> : <Copy style={{ width: '12px', height: '12px' }} />}
              style={{ height: '32px' }}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>

            {/* Quick Export Downloads */}
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <a
                href={apiClient.getExportUrl(datasetId, 'json')}
                download
                className="btn btn-secondary"
                style={{ height: '32px', padding: '0 0.55rem', fontSize: '0.725rem', fontFamily: 'JetBrains Mono, monospace' }}
              >
                JSON
              </a>
              <a
                href={apiClient.getExportUrl(datasetId, 'csv')}
                download
                className="btn btn-secondary"
                style={{ height: '32px', padding: '0 0.55rem', fontSize: '0.725rem', fontFamily: 'JetBrains Mono, monospace' }}
              >
                CSV
              </a>
              <a
                href={apiClient.getExportUrl(datasetId, 'syslog_rfc3164')}
                download
                className="btn btn-secondary"
                style={{ height: '32px', padding: '0 0.55rem', fontSize: '0.725rem', fontFamily: 'JetBrains Mono, monospace' }}
              >
                Syslog
              </a>
            </div>
          </div>
        </div>

        {/* ── Content View Area ───────────────────────────────────────── */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {loading ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Terminal style={{ width: '32px', height: '32px', animation: 'pulse-ring 1.5s infinite', margin: '0 auto 0.75rem', color: 'var(--cyan)' }} />
              <p style={{ fontSize: '0.85rem' }}>Loading synthetic event sequence...</p>
            </div>
          ) : viewMode === 'table' ? (
            <table className="soc-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>#</th>
                  <th>Timestamp</th>
                  <th>Event Type</th>
                  <th>Severity</th>
                  <th>Source IP</th>
                  <th>User</th>
                  <th>Raw Message &amp; Telemetry Payload</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => (
                  <tr key={idx}>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {idx + 1}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
                      {log.timestamp}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-heading)' }}>
                        {log.event_type}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {getSeverityBadge(log.severity)}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.725rem', color: 'var(--amber)' }}>
                      {log.source_ip || '—'}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.75rem', color: 'var(--purple)', fontWeight: 600 }}>
                      {log.username || '—'}
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.725rem', color: 'var(--text-primary)', maxWidth: '500px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.message}>
                        {log.message}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : viewMode === 'raw' ? (
            <div style={{ padding: '1rem 1.5rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', lineHeight: 1.7, color: 'var(--text-primary)' }}>
              {filteredLogs.map((l, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', padding: '0.2rem 0' }}>
                  <span style={{ color: 'var(--text-muted)', userSelect: 'none', width: '35px', textAlign: 'right', flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <span style={{ wordBreak: 'break-all' }}>{l.message}</span>
                </div>
              ))}
            </div>
          ) : (
            <pre style={{ margin: 0, padding: '1rem 1.5rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', lineHeight: 1.6, color: 'var(--text-code)' }}>
              {JSON.stringify(filteredLogs, null, 2)}
            </pre>
          )}
        </div>

        {/* ── Modal Footer Status Bar ─────────────────────────────────── */}
        <div
          style={{
            padding: '0.65rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-table-head)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.725rem',
            color: 'var(--text-muted)',
            flexShrink: 0,
          }}
        >
          <span>
            Displaying <strong style={{ color: 'var(--text-primary)' }}>{filteredLogs.length}</strong> of{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{dataset?.logs.length || 0}</strong> records
          </span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            ID: {datasetId}
          </span>
        </div>
      </div>
    </div>
  );
};
