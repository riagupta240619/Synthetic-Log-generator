import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  RefreshCw,
  X,
  FileCheck2,
  Clock,
  Globe2,
  AlertCircle
} from 'lucide-react';
import { ValidationReport } from '../types';
import { apiClient } from '../api/client';
import { Badge, Button } from './ui';

interface ValidationViewerProps {
  datasetId: string;
  onClose: () => void;
}

export const ValidationViewer: React.FC<ValidationViewerProps> = ({ datasetId, onClose }) => {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runValidation();
  }, [datasetId]);

  const runValidation = async () => {
    try {
      setLoading(true);
      const res = await apiClient.validateDataset(datasetId);
      setReport(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        background: 'rgba(3, 7, 18, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '56rem',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-default)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
          animation: 'modal-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
        }}
      >
        {/* Header */}
        <div 
          style={{
            padding: '1.1rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div 
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
              }}
            >
              <ShieldCheck style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 650, color: 'var(--text-primary)', letterSpacing: '-0.015em' }}>
                  Pydantic Schema & Temporal Integrity Report
                </h3>
                <Badge variant={report?.score && report.score >= 90 ? 'success' : report?.score && report.score >= 70 ? 'warning' : 'danger'} dot>
                  {report?.status ? report.status.toUpperCase() : 'AUDITING'}
                </Badge>
              </div>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Target Dataset ID: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: 500 }}>{datasetId}</span>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Button 
              variant="outline"
              size="sm"
              onClick={runValidation}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Re-audit
            </Button>
            <button 
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.45rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.background = 'var(--bg-subtle-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <X style={{ width: '18px', height: '18px' }} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '14rem', gap: '0.75rem', color: 'var(--text-muted)' }}>
              <RefreshCw className="animate-spin" style={{ width: '28px', height: '28px', color: 'var(--accent-primary)' }} />
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Evaluating schema structure, timestamp monotonicity, and IP semantics...
              </p>
            </div>
          ) : !report ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Failed to load validation report. Please re-run the audit.
            </div>
          ) : (
            <>
              {/* Score Banner KPI Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                <div 
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '12px',
                    padding: '1rem 1.15rem',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Overall Score
                  </div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 750, color: report.score >= 90 ? '#10b981' : report.score >= 70 ? '#f59e0b' : '#ef4444', marginTop: '0.2rem', letterSpacing: '-0.02em' }}>
                    {report.score}%
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Integrity Rating: <span style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--text-secondary)' }}>{report.status}</span>
                  </div>
                </div>

                <div 
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '12px',
                    padding: '1rem 1.15rem',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Total Validated
                  </div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 750, color: 'var(--text-primary)', marginTop: '0.2rem', letterSpacing: '-0.02em' }}>
                    {report.total_logs}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#10b981', marginTop: '0.25rem', fontWeight: 550 }}>
                    {report.valid_logs} conform strictly to schema
                  </div>
                </div>

                <div 
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '12px',
                    padding: '1rem 1.15rem',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Critical Errors
                  </div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 750, color: report.issues_summary.critical > 0 ? '#ef4444' : 'var(--text-primary)', marginTop: '0.2rem', letterSpacing: '-0.02em' }}>
                    {report.issues_summary.critical}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Malformed structure / syntax
                  </div>
                </div>

                <div 
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '12px',
                    padding: '1rem 1.15rem',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Warnings
                  </div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 750, color: report.issues_summary.warning > 0 ? '#f59e0b' : 'var(--text-primary)', marginTop: '0.2rem', letterSpacing: '-0.02em' }}>
                    {report.issues_summary.warning}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Temporal or format anomalies
                  </div>
                </div>
              </div>

              {/* Integrity Checks Grid */}
              <div 
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '12px',
                  padding: '1.15rem',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Automated Integrity Verification Checks
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  <div 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.75rem 0.85rem',
                      borderRadius: '8px',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {report.validation_checks.schema_structure ? (
                      <CheckCircle2 style={{ width: '18px', height: '18px', color: '#10b981', flexShrink: 0 }} />
                    ) : (
                      <XCircle style={{ width: '18px', height: '18px', color: '#ef4444', flexShrink: 0 }} />
                    )}
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Pydantic Schema Compliant
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Type safety & field validation</div>
                    </div>
                  </div>

                  <div 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.75rem 0.85rem',
                      borderRadius: '8px',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {report.validation_checks.temporal_ordering ? (
                      <CheckCircle2 style={{ width: '18px', height: '18px', color: '#10b981', flexShrink: 0 }} />
                    ) : (
                      <AlertTriangle style={{ width: '18px', height: '18px', color: '#f59e0b', flexShrink: 0 }} />
                    )}
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Chronological Monotonicity
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Strict ascending timestamps</div>
                    </div>
                  </div>

                  <div 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.75rem 0.85rem',
                      borderRadius: '8px',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {report.validation_checks.ip_address_validity ? (
                      <CheckCircle2 style={{ width: '18px', height: '18px', color: '#10b981', flexShrink: 0 }} />
                    ) : (
                      <AlertTriangle style={{ width: '18px', height: '18px', color: '#f59e0b', flexShrink: 0 }} />
                    )}
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Syntactic IP Address Valid
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Valid IPv4/IPv6 octet formats</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Findings */}
              <div 
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '12px',
                  padding: '1.15rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                    Detailed Findings ({report.issues.length})
                  </div>
                  {report.issues.length === 0 && (
                    <Badge variant="success" dot>Zero Validation Errors</Badge>
                  )}
                </div>

                {report.issues.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '240px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                    {report.issues.map((issue, idx) => {
                      const isCritical = issue.severity === 'critical';
                      const isWarning = issue.severity === 'warning';
                      const accentColor = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#3b82f6';
                      const bgTint = isCritical ? 'rgba(239, 68, 68, 0.08)' : isWarning ? 'rgba(245, 158, 11, 0.08)' : 'rgba(59, 130, 246, 0.08)';
                      const borderTint = isCritical ? 'rgba(239, 68, 68, 0.25)' : isWarning ? 'rgba(245, 158, 11, 0.25)' : 'rgba(59, 130, 246, 0.25)';

                      return (
                        <div 
                          key={idx}
                          style={{
                            padding: '0.75rem 0.85rem',
                            borderRadius: '8px',
                            background: bgTint,
                            border: `1px solid ${borderTint}`,
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                            fontSize: '0.78rem',
                          }}
                        >
                          <span 
                            style={{
                              marginTop: '0.1rem',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.4rem',
                              borderRadius: '4px',
                              background: 'var(--bg-panel)',
                              border: '1px solid var(--border-default)',
                              color: accentColor,
                              textTransform: 'uppercase',
                              letterSpacing: '0.02em',
                            }}
                          >
                            Log #{issue.log_index}
                          </span>
                          <div style={{ flex: 1, color: 'var(--text-primary)' }}>
                            <span style={{ fontWeight: 650, color: accentColor }}>{issue.field}: </span>
                            <span>{issue.description}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div 
                    style={{
                      padding: '1.5rem',
                      textAlign: 'center',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.06)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      color: '#10b981',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                    }}
                  >
                    ✓ All generated log records strictly conform to the expected Pydantic schema model with monotonically ascending timestamps and valid network parameters.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div 
          style={{
            padding: '0.85rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            background: 'var(--bg-subtle)',
          }}
        >
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Report
          </Button>
        </div>
      </div>
    </div>
  );
};
