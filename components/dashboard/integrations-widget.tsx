'use client';

import { useState, useEffect } from 'react';
import { Plug, Shield, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import Link from 'next/link';
import { wisoService } from '@/lib/integrations/wiso';
import { notebookLMService } from '@/lib/integrations/notebook-lm';
import { liveSecurityProtection } from '@/lib/security/live-protection';
import { useI18n } from '@/lib/i18n/provider';

interface SecurityStatus {
  allSystemsActive?: boolean;
  threatsBlocked?: number;
}

export function IntegrationsWidget() {
  const { t } = useI18n();
  const [wisoConnected, setWisoConnected] = useState(() => wisoService.isConnected());
  const [notebookLMConnected, setNotebookLMConnected] = useState(() =>
    notebookLMService.isConnected()
  );
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(() =>
    liveSecurityProtection.getProtectionStatus()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setWisoConnected(wisoService.isConnected());
      setNotebookLMConnected(notebookLMService.isConnected());
      const newStatus = liveSecurityProtection.getProtectionStatus();
      setSecurityStatus(newStatus);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 gap-2">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Plug className="w-5 h-5 shrink-0" />
          {t('integrations.widgetTitle')}
        </h2>
        <Link href="/settings/integrations">
          <span className="text-sm text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap">
            {t('common.manage')}
          </span>
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center gap-3 min-w-0">
            {wisoConnected ? (
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-gray-400 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {t('integrations.wiso')}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {wisoConnected ? t('common.connected') : t('common.notConnected')}
              </p>
            </div>
          </div>
          {wisoConnected ? (
            <Wifi className="w-4 h-4 text-green-600 shrink-0" />
          ) : (
            <WifiOff className="w-4 h-4 text-gray-400 shrink-0" />
          )}
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center gap-3 min-w-0">
            {notebookLMConnected ? (
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-gray-400 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {t('integrations.notebookLM')}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {notebookLMConnected ? t('common.connected') : t('common.notConnected')}
              </p>
            </div>
          </div>
          {notebookLMConnected ? (
            <Wifi className="w-4 h-4 text-green-600 shrink-0" />
          ) : (
            <WifiOff className="w-4 h-4 text-gray-400 shrink-0" />
          )}
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center gap-3 min-w-0">
            {securityStatus?.allSystemsActive ? (
              <Shield className="w-5 h-5 text-green-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {t('integrations.liveSecurity')}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {securityStatus?.allSystemsActive
                  ? t('integrations.allSystemsActive')
                  : t('integrations.someSystemsInactive')}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-medium text-gray-900 dark:text-white">
              {securityStatus?.threatsBlocked || 0}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t('integrations.threatsBlocked')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
