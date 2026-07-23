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
      profile: { country: 'DE', hasRentalIncome: true },
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
});
