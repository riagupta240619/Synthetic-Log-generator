export interface DatasetSummary {
  id: string;
  name: string;
  description?: string;
  generator_type: 'scenario' | 'file_learner' | 'llm' | 'ml' | 'cloud';
  log_source: string;
  scenario_name?: string;
  count: number;
  created_at: string;
  file_formats_available: string[];
  schema_fields: string[];
  validation_status?: 'unvalidated' | 'passed' | 'warning' | 'failed';
  validation_score?: number | null;
  wazuh_tested: boolean;
  wazuh_alerts_count: number;
}

export interface LogEvent {
  id: string;
  timestamp: string;
  source: string;
  event_type: string;
  severity: 'informational' | 'low' | 'medium' | 'high' | 'critical' | string;
  status: 'success' | 'failure' | 'attempt' | 'error' | string;
  source_ip?: string;
  destination_ip?: string;
  username?: string;
  action?: string;
  message: string;
  details?: Record<string, any>;
  [key: string]: any;
}

export interface DatasetDetail extends DatasetSummary {
  logs: LogEvent[];
  truncated?: boolean;
  learned_profile?: Record<string, any>;
}

export interface ValidationIssue {
  log_index: number;
  field: string;
  issue_type: string;
  severity: 'critical' | 'warning' | 'info';
  description: string;
}

export interface ValidationReport {
  dataset_id: string;
  total_logs: number;
  valid_logs: number;
  invalid_logs: number;
  score: number;
  status: 'passed' | 'warning' | 'failed';
  issues_summary: {
    critical: number;
    warning: number;
    info: number;
  };
  issues: ValidationIssue[];
  validation_checks: {
    schema_structure: boolean;
    timestamp_format: boolean;
    temporal_ordering: boolean;
    ip_address_validity: boolean;
    status_coherence: boolean;
  };
}

export interface WazuhAlert {
  id: string;
  timestamp: string;
  rule_id: string;
  level: number;
  description: string;
  groups: string[];
  mitre?: {
    id: string;
    tactic: string;
    technique: string;
  };
  source_ip?: string;
  user?: string;
  raw_log: string;
  full_log_matched: string;
}

export interface WazuhEvaluationSummary {
  dataset_id: string;
  total_logs_analyzed: number;
  total_alerts_generated: number;
  detection_rate: number;
  high_severity_alerts: number;
  medium_severity_alerts: number;
  low_severity_alerts: number;
  top_rules_triggered: Array<{
    rule_id: string;
    count: number;
    description: string;
  }>;
  mitre_tactics_detected: string[];
  alerts: WazuhAlert[];
  evaluated_at: string;
}
