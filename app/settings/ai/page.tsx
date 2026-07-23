'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Bot,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  X,
  ArrowLeft,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loading } from '@/components/ui/loading';
import { useI18n } from '@/lib/i18n/provider';
import toast from 'react-hot-toast';

type ProviderId = 'openai' | 'anthropic' | 'google' | 'custom';

interface ProviderConnection {
  id: string;
  provider: ProviderId;
  connectionType: 'api_key' | 'oauth';
  model: string | null;
  label: string | null;
  isActive: boolean;
  connectedAt: string;
  hasApiKey: boolean;
  hasOAuth: boolean;
  keyUnreadable?: boolean;
  keyPreview: string | null;
}

interface ProvidersResponse {
  connections: ProviderConnection[];
  serverProviders: Record<string, boolean>;
  oauth: {
    google: { available: boolean; mode: string };
  };
}

const PROVIDER_META: Record<
  Exclude<ProviderId, 'custom'>,
  { nameKey: string; descKey: string; keyUrl: string; stepsKey: string; color: string }
> = {
  openai: {
    nameKey: 'aiProviders.openai.name',
    descKey: 'aiProviders.openai.desc',
    keyUrl: 'https://platform.openai.com/api-keys',
    stepsKey: 'aiProviders.openai.steps',
    color: 'emerald',
  },
  anthropic: {
    nameKey: 'aiProviders.anthropic.name',
    descKey: 'aiProviders.anthropic.desc',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    stepsKey: 'aiProviders.anthropic.steps',
    color: 'orange',
  },
  google: {
    nameKey: 'aiProviders.google.name',
    descKey: 'aiProviders.google.desc',
    keyUrl: 'https://aistudio.google.com/apikey',
    stepsKey: 'aiProviders.google.steps',
    color: 'blue',
  },
};

export function AIProvidersSettings() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<ProviderConnection[]>([]);
  const [serverProviders, setServerProviders] = useState<Record<string, boolean>>({});
  const [connectModal, setConnectModal] = useState<ProviderId | null>(null);
  const [modalStep, setModalStep] = useState(1);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  const loadProviders = async () => {
    try {
      const response = await fetch('/api/ai/providers');
      if (!response.ok) throw new Error('Failed to load');
      const data = (await response.json()) as ProvidersResponse;
      setConnections(data.connections);
      setServerProviders(data.serverProviders);
    } catch {
      toast.error(t('aiProviders.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProviders();
  }, []);

  useEffect(() => {
    const oauth = searchParams.get('oauth');
    if (oauth === 'success') toast.success(t('aiProviders.oauthVerified'));
    if (oauth === 'not_configured') toast(t('aiProviders.oauthNotConfigured'), { icon: 'ℹ️' });
    if (oauth === 'error' || oauth === 'failed') toast.error(t('aiProviders.oauthFailed'));
  }, [searchParams, t]);

  const getConnection = (provider: ProviderId) =>
    connections.find(
      (c) => c.provider === provider && (c.hasApiKey || c.hasOAuth || c.keyUnreadable)
    );

  const openConnect = (provider: ProviderId) => {
    setConnectModal(provider);
    setModalStep(1);
    setApiKey('');
    setModel('');
    setCustomLabel('');
  };

  const closeModal = () => {
    setConnectModal(null);
    setModalStep(1);
    setApiKey('');
  };

  const handleConnect = async () => {
    if (!connectModal || !apiKey.trim()) {
      toast.error(t('aiProviders.apiKeyRequired'));
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/ai/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: connectModal,
          apiKey: apiKey.trim(),
          model: model.trim() || undefined,
          label: connectModal === 'custom' ? customLabel.trim() : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Connect failed');

      setConnections(data.connections);
      toast.success(t('aiProviders.connected'));
      closeModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('aiProviders.connectFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisconnect = async (provider: ProviderId) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/ai/providers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Disconnect failed');

      setConnections(data.connections);
      toast.success(t('aiProviders.disconnected'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('aiProviders.disconnectFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleTest = async (provider: ProviderId) => {
    if (provider === 'custom') return;
    setTesting(provider);
    try {
      const response = await fetch('/api/ai/providers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', provider }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Test failed');
      toast.success(t('aiProviders.testSuccess'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('aiProviders.testFailed'));
    } finally {
      setTesting(null);
    }
  };

  const handleGoogleOAuth = async () => {
    try {
      const response = await fetch('/api/ai/oauth/google');
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
        return;
      }
      openConnect('google');
    } catch {
      openConnect('google');
    }
  };

  const renderProviderCard = (provider: Exclude<ProviderId, 'custom'>) => {
    const meta = PROVIDER_META[provider];
    const connection = getConnection(provider);
    const connected = Boolean(connection?.hasApiKey);
    const keyUnreadable = Boolean(connection?.keyUnreadable);
    const serverFallback = serverProviders[provider];

    return (
      <div
        key={provider}
        className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
              <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{t(meta.nameKey)}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t(meta.descKey)}</p>
              {connected && connection?.keyPreview && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-mono">
                  {connection.keyPreview}
                </p>
              )}
              {keyUnreadable && (
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                  {t('aiProviders.keyUnreadable')}
                </p>
              )}
              {!connected && !keyUnreadable && serverFallback && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  {t('aiProviders.serverFallback')}
                </p>
              )}
            </div>
          </div>
          {connected && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t('aiProviders.connectedBadge')}
            </span>
          )}
          {keyUnreadable && !connected && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-full">
              <AlertCircle className="w-3.5 h-3.5" />
              {t('aiProviders.reconnectBadge')}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {!connected ? (
            <>
              <Button size="sm" onClick={() => openConnect(provider)} disabled={submitting}>
                {keyUnreadable ? t('aiProviders.reconnect') : t('aiProviders.connect')}
              </Button>
              {provider === 'google' && !keyUnreadable && (
                <Button size="sm" variant="outline" onClick={handleGoogleOAuth} disabled={submitting}>
                  {t('aiProviders.googleOAuth')}
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTest(provider)}
                disabled={testing === provider}
                leftIcon={testing === provider ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
              >
                {t('aiProviders.test')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openConnect(provider)}
                disabled={submitting}
              >
                {t('aiProviders.updateKey')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDisconnect(provider)}
                disabled={submitting}
              >
                {t('aiProviders.disconnect')}
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return <Loading variant="spinner" size="md" text={t('common.loading')} />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900 dark:text-amber-100 space-y-2">
            <p className="font-medium">{t('aiProviders.limitationsTitle')}</p>
            <p>{t('aiProviders.notebookLmLimitation')}</p>
            <a
              href="https://notebooklm.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-amber-800 dark:text-amber-200 underline"
            >
              notebooklm.google.com
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <p>{t('aiProviders.oauthLimitation')}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {renderProviderCard('openai')}
        {renderProviderCard('anthropic')}
        {renderProviderCard('google')}
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white">{t('aiProviders.custom.title')}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('aiProviders.custom.desc')}</p>
        <div className="mt-4">
          {getConnection('custom') ? (
            <div className="flex items-center justify-between">
              <span className="text-sm">{getConnection('custom')?.label}</span>
              <Button size="sm" variant="outline" onClick={() => handleDisconnect('custom')}>
                {t('aiProviders.disconnect')}
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => openConnect('custom')}>
              {t('aiProviders.custom.connect')}
            </Button>
          )}
        </div>
      </div>

      {connectModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            aria-label={t('common.cancel')}
            onClick={closeModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-lg rounded-lg bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {connectModal === 'custom'
                    ? t('aiProviders.custom.connect')
                    : t(`aiProviders.${connectModal}.connectTitle`)}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {connectModal !== 'custom' && modalStep === 1 && (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t(`aiProviders.${connectModal}.connectIntro`)}
                  </p>
                  <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-2 list-decimal list-inside">
                    {(t(`aiProviders.${connectModal}.steps`) as string).split('|').map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                  <a
                    href={PROVIDER_META[connectModal].keyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {t('aiProviders.openProviderSite')}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={closeModal}>
                      {t('common.cancel')}
                    </Button>
                    <Button onClick={() => setModalStep(2)}>{t('aiProviders.nextStep')}</Button>
                  </div>
                </>
              )}

              {(connectModal === 'custom' || modalStep === 2) && (
                <>
                  {connectModal === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('aiProviders.custom.label')}</label>
                      <Input
                        value={customLabel}
                        onChange={(e) => setCustomLabel(e.target.value)}
                        placeholder={t('aiProviders.custom.labelPlaceholder')}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('aiProviders.apiKeyLabel')}</label>
                    <Input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={t('aiProviders.apiKeyPlaceholder')}
                      autoComplete="off"
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('aiProviders.encryptionNote')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t('aiProviders.modelLabel')} ({t('common.optional')})
                    </label>
                    <Input
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder={t(`aiProviders.${connectModal === 'custom' ? 'openai' : connectModal}.modelPlaceholder`)}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    {connectModal !== 'custom' && (
                      <Button variant="outline" onClick={() => setModalStep(1)}>
                        {t('common.back')}
                      </Button>
                    )}
                    <Button onClick={handleConnect} isLoading={submitting}>
                      {t('aiProviders.connect')}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AISettingsPage() {
  const { t } = useI18n();

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('aiProviders.backToSettings')}
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {t('aiProviders.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{t('aiProviders.subtitle')}</p>
        </div>

        <AIProvidersSettings />
      </div>
    </AuthenticatedLayout>
  );
}
