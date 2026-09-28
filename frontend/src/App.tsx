import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { ScenarioGenerator } from './components/ScenarioGenerator';
import { CloudLogGenerator } from './components/CloudLogGenerator';
import { FileLearnerGenerator } from './components/FileLearnerGenerator';
import { LLMGenerator } from './components/LLMGenerator';
import { MLGenerator } from './components/MLGenerator';
import { DatasetManager } from './components/DatasetManager';
import { WazuhDashboard } from './components/WazuhDashboard';
import { LogViewerModal } from './components/LogViewerModal';
import { ValidationViewer } from './components/ValidationViewer';
import { DatasetSummary } from './types';
import { apiClient } from './api/client';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [systemStatus, setSystemStatus] = useState<{ status: string; database: string } | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Modals
  const [viewingDatasetId, setViewingDatasetId] = useState<string | null>(null);
  const [validatingDatasetId, setValidatingDatasetId] = useState<string | null>(null);
  const [wazuhTargetDatasetId, setWazuhTargetDatasetId] = useState<string | null>(null);

  // Apply theme to <html> element so all CSS vars cascade correctly
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('synthosec-theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [dsRes, healthRes] = await Promise.all([
        apiClient.listDatasets().catch(() => ({ total: 0, datasets: [] })),
        apiClient.checkHealth().catch(() => null),
      ]);
      setDatasets(dsRes.datasets);
      setSystemStatus(healthRes);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  const handleDatasetCreated = async (id: string) => {
    await fetchInitialData();
    setViewingDatasetId(id);
  };

  const handleViewLogs = (id: string) => { setViewingDatasetId(id); };
  const handleValidate = (id: string) => { setValidatingDatasetId(id); };
  const handleTestWazuh = (id: string) => { setWazuhTargetDatasetId(id); setActiveTab('wazuh'); };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemStatus={systemStatus}
        theme={theme}
        onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardOverview
            datasets={datasets}
            onSelectTab={setActiveTab}
            onViewLogs={handleViewLogs}
            onValidate={handleValidate}
            onTestWazuh={handleTestWazuh}
          />
        )}
        {activeTab === 'scenarios' && (
          <ScenarioGenerator onDatasetCreated={handleDatasetCreated} />
        )}
        {activeTab === 'cloud' && (
          <CloudLogGenerator onDatasetCreated={handleDatasetCreated} />
        )}
        {activeTab === 'upload' && (
          <FileLearnerGenerator onDatasetCreated={handleDatasetCreated} />
        )}
        {activeTab === 'llm' && (
          <LLMGenerator onDatasetCreated={handleDatasetCreated} />
        )}
        {activeTab === 'ml' && (
          <MLGenerator onDatasetCreated={handleDatasetCreated} />
        )}
        {activeTab === 'datasets' && (
          <DatasetManager
            datasets={datasets}
            onRefresh={fetchInitialData}
            onViewLogs={handleViewLogs}
            onValidate={handleValidate}
            onTestWazuh={handleTestWazuh}
          />
        )}
        {activeTab === 'wazuh' && (
          <WazuhDashboard
            selectedDatasetId={wazuhTargetDatasetId}
            datasets={datasets}
          />
        )}
      </main>

      {/* Modals */}
      {viewingDatasetId && (
        <LogViewerModal
          datasetId={viewingDatasetId}
          onClose={() => setViewingDatasetId(null)}
          onRunValidation={(id) => { setViewingDatasetId(null); setValidatingDatasetId(id); }}
          onRunWazuh={(id) => { setViewingDatasetId(null); handleTestWazuh(id); }}
        />
      )}
      {validatingDatasetId && (
        <ValidationViewer
          datasetId={validatingDatasetId}
          onClose={() => { setValidatingDatasetId(null); fetchInitialData(); }}
        />
      )}

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '1.25rem',
        textAlign: 'center',
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
        background: 'var(--bg-nav)',
        backdropFilter: 'blur(12px)',
        letterSpacing: '0.05em',
      }}>
        <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>SYNTHO</span>
        <span style={{ fontWeight: 700 }}>SEC</span>
        {' '}— Synthetic Cybersecurity Log Platform & Wazuh Testing Center &nbsp;·&nbsp; v1.0
      </footer>
    </div>
  );
};
