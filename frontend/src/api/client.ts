import { DatasetSummary, DatasetDetail, ValidationReport, WazuhEvaluationSummary } from '../types';

const API_BASE = '/api';
const API_KEY = import.meta.env.VITE_SCENARIO_API_KEY as string | undefined;

function apiHeaders(json = false): HeadersInit {
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
  };
}

async function responseError(res: Response, fallback: string): Promise<Error> {
  const body = await res.json().catch(() => ({}));
  const detail = typeof body.detail === 'string' ? body.detail : undefined;
  return new Error(detail || `${fallback} (HTTP ${res.status})`);
}

export const apiClient = {
  // Datasets
  async listDatasets(): Promise<{ total: number; datasets: DatasetSummary[] }> {
    const res = await fetch(`${API_BASE}/datasets`, { headers: apiHeaders() });
    if (!res.ok) throw await responseError(res, 'Failed to fetch datasets');
    return res.json();
  },

  async getDataset(id: string, limit: number = 200): Promise<DatasetDetail> {
    const res = await fetch(`${API_BASE}/datasets/${id}?limit=${limit}`, { headers: apiHeaders() });
    if (!res.ok) throw await responseError(res, 'Failed to fetch dataset details');
    return res.json();
  },

  async deleteDataset(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/datasets/${id}`, {
      method: 'DELETE',
      headers: apiHeaders(),
    });
    if (!res.ok) throw await responseError(res, 'Failed to delete dataset');
  },

  getExportUrl(id: string, format: string): string {
    return `${API_BASE}/datasets/${id}/export?format=${format}`;
  },

  // Generators
  async generateScenario(data: {
    scenario_name: string;
    count: number;
    name?: string;
    parameters?: Record<string, any>;
  }): Promise<{ dataset_id: string; name: string; count: number; logs?: any[] }> {
    const res = await fetch(`${API_BASE}/generate/scenario`, {
      method: 'POST',
      headers: apiHeaders(true),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await responseError(res, 'Scenario generation failed');
    return res.json();
  },

  async generateCloud(data: {
    provider: string;
    scenario_type?: string;
    count: number;
    name?: string;
    parameters?: Record<string, any>;
  }): Promise<{ dataset_id: string; name: string; count: number }> {
    const res = await fetch(`${API_BASE}/generate/cloud`, {
      method: 'POST',
      headers: apiHeaders(true),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await responseError(res, 'Cloud log generation failed');
    return res.json();
  },

  async generateLlm(data: {
    prompt: string;
    count: number;
    name?: string;
    model?: string;
  }): Promise<{ dataset_id: string; name: string; count: number }> {
    const res = await fetch(`${API_BASE}/generate/llm`, {
      method: 'POST',
      headers: apiHeaders(true),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await responseError(res, 'LLM log generation failed');
    return res.json();
  },

  async generateMl(data: {
    count: number;
    name?: string;
    parameters?: Record<string, any>;
  }): Promise<{ dataset_id: string; name: string; count: number }> {
    const res = await fetch(`${API_BASE}/generate/ml`, {
      method: 'POST',
      headers: apiHeaders(true),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await responseError(res, 'ML sequence generation failed');
    return res.json();
  },

  async uploadAndLearn(
    file: File,
    datasetName?: string,
    syntheticCount: number = 100
  ): Promise<{ dataset_id: string; name: string; count: number; learned_profile: any }> {
    const formData = new FormData();
    formData.append('file', file);
    if (datasetName) formData.append('dataset_name', datasetName);
    formData.append('synthetic_count', syntheticCount.toString());

    const res = await fetch(`${API_BASE}/upload/learn`, {
      method: 'POST',
      headers: apiHeaders(),
      body: formData,
    });
    if (!res.ok) throw await responseError(res, 'File learning failed');
    return res.json();
  },

  // Validation
  async validateDataset(id: string): Promise<ValidationReport> {
    const res = await fetch(`${API_BASE}/validate/${id}`, {
      method: 'POST',
      headers: apiHeaders(),
    });
    if (!res.ok) throw await responseError(res, 'Validation failed');
    return res.json();
  },

  // Wazuh
  async testWazuh(id: string): Promise<WazuhEvaluationSummary> {
    const res = await fetch(`${API_BASE}/wazuh/test/${id}`, {
      method: 'POST',
      headers: apiHeaders(),
    });
    if (!res.ok) throw await responseError(res, 'Wazuh testing failed');
    return res.json();
  },

  async forwardWazuh(
    id: string,
    host?: string,
    port?: number,
    protocol: string = 'udp'
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/wazuh/forward/${id}`, {
      method: 'POST',
      headers: apiHeaders(true),
      body: JSON.stringify({ host, port, protocol }),
    });
    if (!res.ok) throw await responseError(res, 'Wazuh forwarding failed');
    return res.json();
  },

  // System Health
  async checkHealth(): Promise<{ status: string; database: string }> {
    const res = await fetch('/health');
    if (!res.ok) throw await responseError(res, 'Health check failed');
    return res.json();
  }
};
