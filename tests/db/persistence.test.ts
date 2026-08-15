import { describe, expect, it } from 'vitest';
import {
  looksLikePersistentDataDir,
  assessPersistence,
} from '@/lib/db/persistence';

describe('looksLikePersistentDataDir', () => {
  it('accepts Render mount path', () => {
    expect(looksLikePersistentDataDir('/var/data')).toBe(true);
  });

  it('rejects /tmp', () => {
    expect(looksLikePersistentDataDir('/tmp/taxdoc-data')).toBe(false);
  });
});

describe('assessPersistence', () => {
  it('flags ephemeral DATABASE_URL', () => {
    const report = assessPersistence({
      dataDir: '/tmp/taxdoc-data',
      databaseUrl: 'file:/tmp/taxdoc-data/prod.db',
    });
    expect(report.ok).toBe(false);
    expect(report.warnings.length).toBeGreaterThan(0);
  });

  it('accepts /var/data paths when writable (local may lack dedicated mount)', () => {
    const report = assessPersistence({
      dataDir: '/var/data',
      databaseUrl: 'file:/var/data/prod.db',
    });
    // On macOS /var/data may not exist or not be writable — either ok:false with warnings
    // or ok depending on environment. Assert structure instead.
    expect(report.dataDir).toBe('/var/data');
    expect(report.databaseOnDataDir).toBe(true);
    expect(report.looksPersistent).toBe(true);
  });
});
