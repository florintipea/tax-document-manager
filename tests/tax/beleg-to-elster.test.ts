import { describe, expect, it } from 'vitest';
import {
  confidenceLevelFromScore,
  extractEuroAmountHint,
  mapBelegToElster,
  refineAuslandStorageCategory,
} from '@/lib/tax/beleg-to-elster';
import { buildElsterPreview } from '@/lib/tax/elster-preview';

describe('beleg-to-elster mapping', () => {
  it('maps Lohnabrechnung to Anlage N Gehaltsabrechnungen storage', () => {
    const m = mapBelegToElster('Lohnabrechnung');
    expect(m.storageCategory).toBe('Gehaltsabrechnungen');
    expect(m.anlage).toBe('N');
    expect(m.fieldKey).toBe('n.brutto');
    expect(m.taxLineCategory).toBe('gehalt');
    expect(m.needsReviewAlways).toBe(true);
  });

  it('maps Spende to Sonderausgaben', () => {
    const m = mapBelegToElster('Spende');
    expect(m.storageCategory).toBe('Spenden');
    expect(m.anlage).toBe('Sonderausgaben');
    expect(m.taxLineCategory).toBe('spenden');
  });

  it('refines Apotheke from Rechnung text', () => {
    const m = mapBelegToElster('Rechnung', {
      fileName: 'Apotheke_Muster_12,90EUR.pdf',
      content: 'Apotheke Betrag 12,90 EUR',
    });
    expect(m.storageCategory).toBe('Apotheke/Gesundheit');
    expect(m.anlage).toBe('Außergewöhnliche Belastungen');
    expect(m.taxLineCategory).toBe('gesundheit');
  });

  it('refines Ausland storage categories', () => {
    expect(refineAuslandStorageCategory('Quellensteuer_CH_2025.pdf')).toBe(
      'Quellensteuer-Bescheinigung'
    );
    expect(refineAuslandStorageCategory('A1-Bescheinigung.pdf')).toBe(
      'A1-Bescheinigung'
    );
  });

  it('extracts euro amounts from text', () => {
    expect(extractEuroAmountHint('Spende_50,00EUR.pdf')).toBe(50);
    expect(
      extractEuroAmountHint('x.pdf', 'Zuwendungsbestätigung Betrag: 120,50 EUR')
    ).toBe(120.5);
  });

  it('maps confidence levels', () => {
    const m = mapBelegToElster('Spende');
    expect(confidenceLevelFromScore(0.9, true, m)).toBe('high');
    expect(confidenceLevelFromScore(0.6, true, m)).toBe('medium');
    expect(confidenceLevelFromScore(0.9, false, m)).toBe('medium');
  });
});

describe('ELSTER preview with DE beleg categories', () => {
  it('autofills fields from Gehaltsabrechnungen + Spenden with review flags', () => {
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
          id: 'g1',
          name: 'Gehaltsabrechnung_2025_03.pdf',
          year: 2025,
          categoryName: 'Gehaltsabrechnungen',
          taxAmount: 3200,
          aiConfidence: 0.85,
        },
        {
          id: 's1',
          name: 'Spendenquittung_Caritas_50,00EUR.pdf',
          year: 2025,
          categoryName: 'Spenden',
          taxAmount: 50,
          aiConfidence: 0.7,
        },
        {
          id: 'r1',
          name: 'Rechnung_Buero.pdf',
          year: 2025,
          categoryName: 'Rechnungen',
          taxAmount: 89.9,
          aiConfidence: 0.4,
        },
      ],
      properties: [],
      nebenkosten: [],
      rentals: [],
      taxLines: [],
    });

    expect(preview.disclaimerDe).toMatch(/Keine Steuerberatung|keine automatische Abgabe/i);
    expect(preview.fields.some((f) => f.fieldKey === 'n.brutto')).toBe(true);
    expect(preview.fields.some((f) => f.fieldKey === 'sa.spenden')).toBe(true);
    expect(preview.fields.some((f) => f.fieldKey === 'n.werbungskosten')).toBe(true);
    expect(preview.fields.filter((f) => f.source === 'dokumente').every((f) => f.needsReview)).toBe(
      true
    );
    const brutto = preview.fields.find((f) => f.fieldKey === 'n.brutto');
    expect(brutto?.confidence).toBe('high');
    const wk = preview.fields.find((f) => f.fieldKey === 'n.werbungskosten');
    expect(wk?.confidence).toBe('low');
  });
});
