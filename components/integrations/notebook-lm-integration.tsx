'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

interface NotebookSummary {
  id: string;
  name: string;
  documentCount: number;
  lastSync?: string | null;
}

export function NotebookLMIntegration() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [notebookName, setNotebookName] = useState('');
  const [notebooks, setNotebooks] = useState<NotebookSummary[]>([]);

  useEffect(() => {
    void loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/integrations/notebook-lm');
      if (!response.ok) return;
      const data = await response.json();
      setConnected(Boolean(data.connected));
      setNotebooks(data.notebooks || []);
    } catch (error) {
      console.error('Failed to load Notebook LM status:', error);
    }
  };

  const handleConnect = async () => {
    if (!apiKey) {
      toast.error('Please enter Notebook LM API key');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/integrations/notebook-lm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect');
      }

      setConnected(true);
      setApiKey('');
      await loadStatus();
      toast.success('Connected to Notebook LM');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await fetch('/api/integrations/notebook-lm', { method: 'DELETE' });
      setConnected(false);
      setNotebooks([]);
      toast.success('Disconnected from Notebook LM');
    } catch {
      toast.error('Failed to disconnect');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotebook = async () => {
    if (!notebookName) {
      toast.error('Please enter notebook name');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/integrations/notebook-lm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-notebook', name: notebookName }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create notebook');
      }

      setNotebookName('');
      await loadStatus();
      toast.success('Notebook created');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Create error');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncDocuments = async (notebookId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/integrations/notebook-lm', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notebookId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync documents');
      }

      await loadStatus();
      toast.success(`Synced ${data.documentCount} documents`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sync error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Notebook LM Integration</h3>
        <p className="text-sm text-gray-600">
          Connect to Google Notebook LM for AI-powered document analysis
        </p>
      </div>

      {!connected ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Notebook LM API Key</label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter Notebook LM API key"
            />
          </div>
          <Button onClick={handleConnect} disabled={loading}>
            {loading ? 'Connecting...' : 'Connect to Notebook LM'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">Connected to Notebook LM</p>
          </div>

          <div className="flex gap-2">
            <Input
              value={notebookName}
              onChange={(e) => setNotebookName(e.target.value)}
              placeholder="New notebook name"
            />
            <Button onClick={handleCreateNotebook} disabled={loading}>
              Create Notebook
            </Button>
          </div>

          {notebooks.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Your Notebooks</h4>
              {notebooks.map((notebook) => (
                <div
                  key={notebook.id}
                  className="p-3 border rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{notebook.name}</p>
                    <p className="text-xs text-gray-500">
                      {notebook.documentCount} documents
                      {notebook.lastSync
                        ? ` • Last sync ${new Date(notebook.lastSync).toLocaleString()}`
                        : ''}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSyncDocuments(notebook.id)}
                    disabled={loading}
                  >
                    Sync Documents
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button onClick={handleDisconnect} variant="outline" disabled={loading}>
            Disconnect
          </Button>
        </div>
      )}
    </div>
  );
}
