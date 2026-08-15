import { describe, expect, it } from 'vitest';
import { buildElsterPreview } from '@/lib/tax/elster-preview';

describe('buildElsterPreview', () => {
  it('maps Grenzgänger to Anlage AUS fields with prüfen flags', () => {
    const preview = buildElsterPreview({
      year: 2025,
      profile: {
        country: 'DE',
        isCrossBorder: true,
        deFilingMode: 'einzel',
        steuerklasse: 'I',
        vorname: 'Max',
        nachname: 'Mustermann',
      },
      documents: [
        {
          id: 'd1',
          name: 'Lohnausweis CH.pdf',
          year: 2025,
          categoryName: 'Lohnausweis Ausland',
          taxAmount: 72000,
        },
      ],
      properties: [],
      nebenkosten: [],
      rentals: [],
      taxLines: [],
      grenzgaenger: {
        id: 'g1',
        year: 2025,
        enabled: true,
        workCountry: 'CH',
        residenceCountry: 'DE',
        foreignEmploymentIncome: 72000,
        foreignWithholdingTax: 8000,
        commutingKmOneWay: 45,
        commutingDays: 220,
        socialInsuranceCountry: 'CH',
        dbaMethodHint: 'anrechnung',
        documentIds: ['d1'],
        needsReview: true,
      },
    });

    expect(preview.anlagen.some((a) => a.anlage === 'AUS')).toBe(true);
    const ausFields = preview.fields.filter((f) => f.anlage === 'AUS');
    expect(ausFields.length).toBeGreaterThan(0);
    expect(ausFields.every((f) => f.needsReview)).toBe(true);
    expect(preview.disclaimerDe).toMatch(/Keine Steuerberatung/);
    expect(preview.gaps.some((g) => g.id === 'gap-cross-border')).toBe(true);
  });

  it('maps rental and health docs with review notes', () => {
    const preview = buildElsterPreview({
      year: 2025,
      profile: {
        country: 'DE',
        hasRentalIncome: true,
        vorname: 'Max',
        nachname: 'Mustermann',
      },
      documents: [
        {
          id: 'h1',
          name: 'Apotheke.pdf',
          year: 2025,
          categoryName: 'Apotheke/Gesundheit',
          taxAmount: 120,
        },
      ],
      properties: [],
      nebenkosten: [],
      rentals: [
        {
          id: 'r1',
          year: 2025,
          objectLabel: 'Wohnung 1',
          grossRent: 12000,
          operatingCosts: 2000,
          werbungskosten: 500,
          afaAmount: 1500,
          documentIds: [],
          needsReview: true,
        },
      ],
      taxLines: [],
    });

    expect(preview.fields.some((f) => f.anlage === 'V' && f.fieldKey.includes('miete'))).toBe(
      true
    );
    expect(preview.gaps.some((g) => g.id === 'gap-agb-threshold')).toBe(true);
  });

  it('flags sum mismatches and builds validation summary', () => {
    const preview = buildElsterPreview({
      year: 2025,
      profile: {
        country: 'DE',
        steuerklasse: 'I',
        vorname: 'Max',
        nachname: 'Mustermann',
      },
      documents: [
        {
          id: 'd1',
          name: 'Gehalt.pdf',
          year: 2025,
          categoryName: 'Gehaltsabrechnungen',
          taxAmount: 1000,
        },
        {
          id: 'd2',
          name: 'Gehalt.pdf',
          year: 2025,
          categoryName: 'Gehaltsabrechnungen',
          taxAmount: 1000,
        },
      ],
      properties: [],
      nebenkosten: [],
      rentals: [],
      taxLines: [
        {
          id: 't1',
          year: 2025,
          category: 'gehalt',
          kind: 'income',
          amount: 2500,
          label: 'Gehalt',
          documentIds: ['d1'],
          needsReview: false,
        },
      ],
    });

    expect(preview.validation).toBeDefined();
    expect(preview.validation.duplicateDocumentIds.length).toBeGreaterThan(0);
    expect(preview.validation.warnGapCount).toBeGreaterThan(0);
    expect(preview.fields.some((f) => f.needsReview)).toBe(true);
  });

  it('flags incomplete DE profile without crashing', () => {
    const preview = buildElsterPreview({
      year: 2025,
      profile: { country: 'DE', steuerklasse: 'I' },
      documents: [],
      properties: [],
      nebenkosten: [],
      rentals: [],
      taxLines: [],
    });
    expect(preview.fields.length).toBeGreaterThan(0);
    expect(preview.validation).toBeDefined();
    expect(preview.gaps.some((g) => g.id === 'pflicht-profil-name')).toBe(true);
    expect(preview.gaps.some((g) => g.id === 'no-docs')).toBe(true);
  });
});
