'use client';

import { WISOIntegration } from '@/components/integrations/wiso-integration';
import { NotebookLMIntegration } from '@/components/integrations/notebook-lm-integration';
import { LiveProtection } from '@/components/security/live-protection';
import { EnhancedTaxAdvisorSharing } from '@/components/tax-advisor/enhanced-sharing';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { useI18n } from '@/lib/i18n/provider';

export default function IntegrationsPage() {
  const { t } = useI18n();

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gray-900 dark:text-white">
          {t('integrations.title')}
        </h1>

        <div className="space-y-6 sm:space-y-8">
          <section className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <WISOIntegration />
          </section>

          <section className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <NotebookLMIntegration />
          </section>

          <section className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <EnhancedTaxAdvisorSharing />
          </section>

          <section className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <LiveProtection />
          </section>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
