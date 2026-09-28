import React, { useState } from 'react';
import {
  Database,
  Trash2,
  Eye,
  ShieldCheck,
  Crosshair,
  Search,
  RefreshCw,
  AlertTriangle,
  X,
  ShieldAlert,
} from 'lucide-react';
import { DatasetSummary } from '../types';
import { apiClient } from '../api/client';

interface DatasetManagerProps {
  datasets: DatasetSummary[];
  onRefresh: () => void;
  onViewLogs: (id: string) => void;
  onValidate: (id: string) => void;
  onTestWazuh: (id: string) => void;
}

export const DatasetManager: React.FC<DatasetManagerProps> = ({
  datasets,
  onRefresh,
  onViewLogs,
  onValidate,
  onTestWazuh,
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = datasets.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.id.includes(search.toLowerCase());
    const matchType = filterType === 'all' || d.generator_type === filterType;
    return matchSearch && matchType;
  });

  const requestDelete = (id: string) => {
    setDeleteError(null);
    setDeletingId(id);
  };

  const cancelDelete = () => {
    setDeletingId(null);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await apiClient.deleteDataset(deletingId);
      setDeletingId(null);
      onRefresh();
    } catch (err: any) {
      setDeleteError(err.message || 'Delete operation failed. Please check backend connection.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getEngineBadge = (type: string) => {
    const styles: Record<string, { bg: string; color: string; border: string; label: string }> = {
      scenario:     { bg: 'rgba(249,115,22,0.12)', color: '#f97316', border: 'rgba(249,115,22,0.3)', label: 'Scenario' },
      cloud:        { bg: 'rgba(0,240,255,0.12)',  color: 'var(--cyan)', border: 'rgba(0,240,255,0.3)', label: 'Cloud'    },
      file_learner: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.3)', label: 'Learned'  },
      llm:          { bg: 'rgba(168,85,247,0.12)', color: '#c084fc', border: 'rgba(168,85,247,0.3)', label: 'LLM'      },
      ml:           { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.3)', label: 'ML Markov'},
    };
    const s = styles[type] || { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)', label: type };
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '0.22rem 0.65rem', borderRadius: '9999px',
        fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
        background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      }}>
        {s.label}
      </span>
    );
  };

  const deletingDataset = datasets.find((d) => d.id === deletingId);

  return (
    <div className="space-y-6">

      {/* ── High-Security Delete Confirmation Modal ───────────────────── */}
      {deletingId && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{
              width: '100%',
              maxWidth: '460px',
              background: 'var(--bg-panel)',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              borderRadius: '20px',
              padding: '2rem',
              boxShadow: 'var(--shadow-xl), 0 0 35px rgba(239, 68, 68, 0.18)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top Glowing Danger Accent Stripe */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #ef4444, #f97316)',
              }}
            />

            {/* Danger Icon with Pulsing Halo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.25)',
                }}
              >
                <AlertTriangle style={{ width: '26px', height: '26px', color: '#ef4444' }} />
              </div>
              <div>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: '#ef4444',
                    background: 'rgba(239, 68, 68, 0.12)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                  }}
                >
                  DESTRUCTIVE ACTION
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  Delete Dataset?
                </h3>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              You are about to permanently purge this synthetic dataset. This operation cannot be reversed.
            </p>

            {/* Target Dataset Specification Box */}
            {deletingDataset && (
              <div
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-default)',
                  borderLeft: '4px solid #ef4444',
                  borderRadius: '12px',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  {deletingDataset.name}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.725rem', fontFamily: 'JetBrains Mono, monospace' }}>
                  <span style={{ color: 'var(--accent-primary)', background: 'rgba(14, 165, 233, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                    {deletingDataset.id}
                  </span>
                  <span style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                    {deletingDataset.count.toLocaleString()} logs
                  </span>
                  <span style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px', textTransform: 'capitalize' }}>
                    {deletingDataset.generator_type}
                  </span>
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.4 }}>
                  ⚠️ Logs, schema verification results, and Wazuh test telemetry will be wiped from MongoDB.
                </div>
              </div>
            )}

            {/* Error banner if delete fails */}
            {deleteError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  marginBottom: '1.25rem',
                  fontSize: '0.8rem',
                  color: '#fca5a5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <ShieldAlert style={{ width: '16px', height: '16px', flexShrink: 0, color: '#ef4444' }} />
                <span>{deleteError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                onClick={cancelDelete}
                disabled={deleteLoading}
                className="btn btn-secondary"
                style={{ padding: '0.65rem 1.25rem', borderRadius: '10px' }}
              >
                <X style={{ width: '14px', height: '14px' }} />
                Cancel &amp; Keep
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="btn btn-danger"
                style={{
                  padding: '0.65rem 1.4rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                }}
              >
                {deleteLoading ? (
                  <>
                    <RefreshCw style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                    Deleting Dataset…
                  </>
                ) : (
                  <>
                    <Trash2 style={{ width: '15px', height: '15px' }} />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header Banner ────────────────────────────────────────── */}
      <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(0, 240, 255, 0.12)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Database style={{ width: '20px', height: '20px', color: 'var(--cyan)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-heading)', letterSpacing: '-0.01em' }}>
                Synthetic Datasets Repository
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Inspect, benchmark, export, and evaluate generated cybersecurity event streams.
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="badge badge-info" style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem' }}>
            {datasets.length} Datasets Stored
          </div>
          <button onClick={onRefresh} className="btn btn-secondary" style={{ padding: '0.55rem 1rem' }}>
            <RefreshCw style={{ width: '14px', height: '14px' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Search & Filter Controls ──────────────────────────────────── */}
      <div className="glass-panel" style={{ padding: '1.1rem 1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search
            style={{
              width: '16px',
              height: '16px',
              color: 'var(--text-muted)',
              position: 'absolute',
              left: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
          <input
            type="text"
            placeholder="Search datasets by title, scenario name, or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.4rem', fontSize: '0.825rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Engine:
          </span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="form-select"
            style={{ fontSize: '0.8rem', minWidth: '170px' }}
          >
            <option value="all">All Engines ({datasets.length})</option>
            <option value="scenario">Scenario Engine</option>
            <option value="cloud">Cloud Audit</option>
            <option value="file_learner">File Pattern Learner</option>
            <option value="llm">LLM Structured</option>
            <option value="ml">ML Markov</option>
          </select>
        </div>
      </div>

      {/* ── Main Data Table ───────────────────────────────────────────── */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Database style={{ width: '40px', height: '40px', margin: '0 auto 1rem', opacity: 0.35, color: 'var(--cyan)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              No Datasets Found
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {search || filterType !== 'all'
                ? 'Try adjusting your search query or engine filter.'
                : 'Select an engine from the navigation menu above to generate your first synthetic dataset.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="soc-table">
              <thead>
                <tr>
                  <th>Dataset / ID</th>
                  <th>Engine</th>
                  <th>Volume</th>
                  <th>Verification</th>
                  <th>Wazuh Alerts</th>
                  <th>Export</th>
                  <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id}>
                    {/* Dataset Name & ID */}
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-heading)' }}>
                        {d.name}
                      </div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {d.id} &nbsp;·&nbsp; {d.created_at}
                      </div>
                    </td>

                    {/* Generator Type & Source */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getEngineBadge(d.generator_type)}
                        <span style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                          {d.log_source}
                        </span>
                      </div>
                    </td>

                    {/* Log Volume */}
                    <td>
                      <span
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: 'var(--cyan)',
                          background: 'var(--bg-chip)',
                          border: '1px solid var(--border-subtle)',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '8px',
                          display: 'inline-block',
                        }}
                      >
                        {d.count.toLocaleString()} logs
                      </span>
                    </td>

                    {/* Schema Verification */}
                    <td>
                      {d.validation_score != null ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span
                            style={{
                              fontSize: '0.825rem',
                              fontWeight: 800,
                              color: d.validation_score >= 90 ? 'var(--emerald)' : 'var(--amber)',
                            }}
                          >
                            {d.validation_score}%
                          </span>
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              color: 'var(--text-muted)',
                              textTransform: 'capitalize',
                              background: 'var(--bg-surface)',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                            }}
                          >
                            {d.validation_status}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending Check</span>
                      )}
                    </td>

                    {/* Wazuh SIEM Status */}
                    <td>
                      {d.wazuh_tested ? (
                        <span className="badge badge-high" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Crosshair style={{ width: '12px', height: '12px' }} />
                          {d.wazuh_alerts_count} Alerts
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Not Evaluated</span>
                      )}
                    </td>

                    {/* Export Formats */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem' }}>
                        <a
                          href={apiClient.getExportUrl(d.id, 'json')}
                          download
                          title="Download as JSON"
                          style={{
                            padding: '0.25rem 0.55rem',
                            borderRadius: '6px',
                            background: 'var(--bg-surface)',
                            color: 'var(--cyan)',
                            border: '1px solid var(--border-subtle)',
                            textDecoration: 'none',
                            fontWeight: 600,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          JSON
                        </a>
                        <a
                          href={apiClient.getExportUrl(d.id, 'csv')}
                          download
                          title="Download as CSV"
                          style={{
                            padding: '0.25rem 0.55rem',
                            borderRadius: '6px',
                            background: 'var(--bg-surface)',
                            color: 'var(--emerald)',
                            border: '1px solid var(--border-subtle)',
                            textDecoration: 'none',
                            fontWeight: 600,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          CSV
                        </a>
                        <a
                          href={apiClient.getExportUrl(d.id, 'syslog_rfc3164')}
                          download
                          title="Download as Syslog RFC3164"
                          style={{
                            padding: '0.25rem 0.55rem',
                            borderRadius: '6px',
                            background: 'var(--bg-surface)',
                            color: 'var(--amber)',
                            border: '1px solid var(--border-subtle)',
                            textDecoration: 'none',
                            fontWeight: 600,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          Syslog
                        </a>
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.45rem' }}>
                        {/* View Logs */}
                        <button
                          onClick={() => onViewLogs(d.id)}
                          title="Inspect Telemetry Logs"
                          style={{
                            padding: '0.5rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--cyan)',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--cyan)';
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 10px var(--cyan-glow)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)';
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                          }}
                        >
                          <Eye style={{ width: '15px', height: '15px' }} />
                        </button>

                        {/* Validate Schema */}
                        <button
                          onClick={() => onValidate(d.id)}
                          title="Verify Pydantic Schema"
                          style={{
                            padding: '0.5rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--emerald)',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--emerald)';
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 10px var(--emerald-glow)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)';
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                          }}
                        >
                          <ShieldCheck style={{ width: '15px', height: '15px' }} />
                        </button>

                        {/* Test in Wazuh */}
                        <button
                          onClick={() => onTestWazuh(d.id)}
                          title="Evaluate Against Wazuh SIEM Rules"
                          style={{
                            padding: '0.5rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--rose)',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--rose)';
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 10px var(--rose-glow)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)';
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                          }}
                        >
                          <Crosshair style={{ width: '15px', height: '15px' }} />
                        </button>

                        {/* Delete Dataset */}
                        <button
                          onClick={() => requestDelete(d.id)}
                          title="Permanently Delete Dataset"
                          style={{
                            padding: '0.5rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: deletingId === d.id ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-surface)',
                            border: deletingId === d.id ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                            color: '#ef4444',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239, 68, 68, 0.2)';
                            (e.currentTarget as HTMLButtonElement).style.borderColor = '#ef4444';
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.35)';
                          }}
                          onMouseLeave={(e) => {
                            if (deletingId !== d.id) {
                              (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface)';
                              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)';
                              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                            }
                          }}
                        >
                          <Trash2 style={{ width: '15px', height: '15px' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
