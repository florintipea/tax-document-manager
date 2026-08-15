'use client';

import { useState, useEffect } from 'react';
import { liveSecurityProtection } from '@/lib/security/live-protection';
import { Shield, CheckCircle, AlertTriangle, Lock, Eye, ShieldCheck } from 'lucide-react';

export function LiveProtection() {
  const [status, setStatus] = useState<any>(null);
  const [threats, setThreats] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    // Start monitoring
    liveSecurityProtection.startMonitoring();

    // Update status every 5 seconds
    const interval = setInterval(() => {
      const protectionStatus = liveSecurityProtection.getProtectionStatus();
      const recentThreats = liveSecurityProtection.getRecentThreats(5);
      const currentMetrics = liveSecurityProtection.getMetrics();

      setStatus(protectionStatus);
      setThreats(recentThreats);
      setMetrics(currentMetrics);
    }, 5000);

    // Initial load
    const protectionStatus = liveSecurityProtection.getProtectionStatus();
    const recentThreats = liveSecurityProtection.getRecentThreats(5);
    const currentMetrics = liveSecurityProtection.getMetrics();

    setStatus(protectionStatus);
    setThreats(recentThreats);
    setMetrics(currentMetrics);

    return () => {
      clearInterval(interval);
      liveSecurityProtection.stopMonitoring();
    };
  }, []);

  if (!status || !metrics) {
    return <div>Loading security status...</div>;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Live Cybersecurity Protection</h3>
        <p className="text-sm text-gray-600">
          Real-time threat detection and protection monitoring
        </p>
      </div>

      {/* Status Overview */}
      <div className={`p-4 rounded-lg border ${
        status.allSystemsActive ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          {status.allSystemsActive ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          )}
          <span className="font-medium">
            {status.allSystemsActive ? 'All Systems Active' : 'Some Systems Inactive'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-sm text-gray-600">Threats Blocked</p>
            <p className="text-2xl font-bold">{status.threatsBlocked}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Last Scan</p>
            <p className="text-sm font-medium">
              {new Date(status.lastScan).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Protection Systems */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 border rounded-lg flex items-center gap-3 ${
          metrics.firewallStatus === 'active' ? 'border-green-200 bg-green-50' : 'border-gray-200'
        }`}>
          <Shield className={`w-5 h-5 ${
            metrics.firewallStatus === 'active' ? 'text-green-600' : 'text-gray-400'
          }`} />
          <div>
            <p className="font-medium text-sm">Firewall</p>
            <p className="text-xs text-gray-600 capitalize">{metrics.firewallStatus}</p>
          </div>
        </div>

        <div className={`p-4 border rounded-lg flex items-center gap-3 ${
          metrics.intrusionDetection === 'active' ? 'border-green-200 bg-green-50' : 'border-gray-200'
        }`}>
          <Eye className={`w-5 h-5 ${
            metrics.intrusionDetection === 'active' ? 'text-green-600' : 'text-gray-400'
          }`} />
          <div>
            <p className="font-medium text-sm">Intrusion Detection</p>
            <p className="text-xs text-gray-600 capitalize">{metrics.intrusionDetection}</p>
          </div>
        </div>

        <div className={`p-4 border rounded-lg flex items-center gap-3 ${
          metrics.malwareProtection === 'active' ? 'border-green-200 bg-green-50' : 'border-gray-200'
        }`}>
          <ShieldCheck className={`w-5 h-5 ${
            metrics.malwareProtection === 'active' ? 'text-green-600' : 'text-gray-400'
          }`} />
          <div>
            <p className="font-medium text-sm">Malware Protection</p>
            <p className="text-xs text-gray-600 capitalize">{metrics.malwareProtection}</p>
          </div>
        </div>

        <div className={`p-4 border rounded-lg flex items-center gap-3 ${
          metrics.dataEncryption === 'active' ? 'border-green-200 bg-green-50' : 'border-gray-200'
        }`}>
          <Lock className={`w-5 h-5 ${
            metrics.dataEncryption === 'active' ? 'text-green-600' : 'text-gray-400'
          }`} />
          <div>
            <p className="font-medium text-sm">Data Encryption</p>
            <p className="text-xs text-gray-600 capitalize">{metrics.dataEncryption}</p>
          </div>
        </div>
      </div>

      {/* Recent Threats */}
      {threats.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Recent Threats</h4>
          <div className="space-y-2">
            {threats.map((threat) => (
              <div
                key={threat.id}
                className={`p-3 border rounded-lg ${getSeverityColor(threat.severity)}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{threat.type}</p>
                    <p className="text-xs mt-1">{threat.description}</p>
                    <p className="text-xs mt-1 opacity-75">
                      {new Date(threat.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {threat.blocked && (
                    <span className="text-xs bg-white px-2 py-1 rounded">Blocked</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

