'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

interface WisoStatus {
  connected: boolean;
  username?: string;
  lastSync?: string | null;
}

export function WISOIntegration() {
  const [status, setStatus] = useState<WisoStatus>({ connected: false });
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    void loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/integrations/wiso');
      if (!response.ok) return;
      const data = await response.json();
      setStatus(data);
      if (data.username) {
        setUsername(data.username);
      }
    } catch (error) {
      console.error('Failed to load WISO status:', error);
    }
  };

  const handleConnect = async () => {
    if (!username || !password) {
      toast.error('Please enter WISO credentials');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/integrations/wiso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect');
      }

      setStatus({ connected: true, username: data.username });
      setPassword('');
      toast.success('Connected to WISO Steuer');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await fetch('/api/integrations/wiso', { method: 'DELETE' });
      setStatus({ connected: false });
      setUsername('');
      setPassword('');
      toast.success('Disconnected from WISO Steuer');
    } catch {
      toast.error('Failed to disconnect');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/integrations/wiso', { method: 'PATCH' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }
      setStatus((current) => ({ ...current, lastSync: data.lastSync }));
      toast.success('Data synced from WISO');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sync error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">WISO Steuer Integration</h3>
        <p className="text-sm text-gray-600">
          Connect your WISO Steuer account to import and sync tax data securely
        </p>
      </div>

      {!status.connected ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">WISO Username</label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter WISO username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">WISO Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter WISO password"
            />
          </div>
          <Button onClick={handleConnect} disabled={loading}>
            {loading ? 'Connecting...' : 'Connect to WISO'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">Connected to WISO Steuer as {status.username}</p>
            {status.lastSync && (
              <p className="text-xs text-green-600 mt-1">
                Last sync: {new Date(status.lastSync).toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSync} disabled={loading}>
              {loading ? 'Syncing...' : 'Sync Data'}
            </Button>
            <Button onClick={handleDisconnect} variant="outline" disabled={loading}>
              Disconnect
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
