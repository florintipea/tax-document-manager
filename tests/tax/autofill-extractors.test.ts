import { describe, expect, it } from 'vitest';
import { extractPriorElsterProfile } from '@/lib/tax/prior-elster-extract';
import { mergePriorElsterIntoProfile } from '@/lib/tax/autofill-apply';
import { extractMietvertrag } from '@/lib/tax/mietvertrag-extract';
import { extractHausgeld, sumUmlageFromLines } from '@/lib/tax/hausgeld-extract';
import { buildCalculatorDraftFromBelege } from '@/lib/tax/beleg-to-calculator';
import { mapBelegToElster } from '@/lib/tax/beleg-to-elster';
import { normalizeDeBelegCategory } from '@/lib/ai/beleg-sort';

describe('prior ELSTER extract', () => {
  it('extracts IdNr, name, steuerklasse from fictional return text', () => {
    const text = `
Einkommensteuererklärung 2024 Mein ELSTER
Name, Vorname: Mustermann, Max
Identifikationsnummer: 12 345 678 901
Steuernummer: 123/456/78901
Steuerklasse: I
Anschrift: Musterstraße 1, 10115 Berlin
Bruttoarbeitslohn 48000,00 EUR
Lohnsteuer 8200,00 EUR
Anlage V Vermietung und Verpachtung
`;
    const r = extractPriorElsterProfile('ELSTER_Erklaerung_2024.pdf', text);
    expect(r.detected).toBe(true);
    expect(r.idNr).toBe('12345678901');
    expect(r.nachname).toBe('Mustermann');
    expect(r.vorname).toBe('Max');
    expect(r.steuerklasse).toBe('I');
    expect(r.hasRentalIncome).toBe(true);
    expect(r.fieldsUpdated.length).toBeGreaterThan(2);
  });

  it('extracts Kinderzahl and Zusammenveranlagung', () => {
    const text = `
Einkommensteuerbescheid 2023
Identifikationsnummer: 12 345 678 901
Anzahl der Kinder: 2
Zusammenveranlagung Ehegatten
`;
    const r = extractPriorElsterProfile('Steuerbescheid_2023.pdf', text);
    expect(r.detected).toBe(true);
    expect(r.numberOfChildren).toBe(2);
    expect(r.deFilingMode).toBe('zusammen');
  });

  it('merges into empty profile and keeps notice fields', () => {
    const extracted = extractPriorElsterProfile(
      'ELSTER.pdf',
      `Mein ELSTER Einkommensteuererklärung
Name, Vorname: Tester, Tina
Identifikationsnummer: 12 345 678 901
Steuerklasse: III`
    );
    const merged = mergePriorElsterIntoProfile(
      { vorname: null, nachname: null, idNr: null, steuerklasse: 'I' },
      extracted
    );
    expect(merged.data.vorname).toBe('Tina');
    expect(merged.data.nachname).toBe('Tester');
    expect(merged.data.idNr).toBe('12345678901');
    expect(merged.fieldsUpdated).toContain('idNr');
  });
});

describe('mietvertrag extract', () => {
  it('detects Vermieter and monthly rent', () => {
    const text = `
Wohnraummietvertrag
Vermieter: Erika Eigentümer
Mieter: Tom Tester
Mietsache: Beispielweg 12, 80331 München
Kaltmiete: 1.250,00 EUR
Mietbeginn: 01.01.2025
`;
    const r = extractMietvertrag('Mietvertrag_Beispielweg.pdf', text);
    expect(r.isMietvertrag).toBe(true);
    expect(r.shouldUpsertProperty).toBe(true);
    expect(r.monthlyRent).toBe(1250);
    expect(r.address).toMatch(/München|Beispielweg/);
  });

  it('does not upsert Property when role is clearly Mieter', () => {
    const text = `
Mietvertrag
als Mieter: Tom Tester
Vermieter: Firma Wohnbau GmbH
Mietsache: Teststraße 1, 10115 Berlin
Kaltmiete: 900,00 EUR
`;
    const r = extractMietvertrag('Mein_Mietvertrag.pdf', text);
    expect(r.isMietvertrag).toBe(true);
    expect(r.roleHint).toBe('mieter');
    expect(r.shouldUpsertProperty).toBe(false);
  });
});

describe('hausgeld extract', () => {
  it('maps umlagefähige Kosten and Einnahmen', () => {
    const text = `
Hausgeldabrechnung Abrechnungsjahr 2025
Objekt: WE 3 Beispielweg 12
umlagefähige Kosten 3.600,00 EUR
Einnahmen / Vorauszahlungen 3.200,00 EUR
Nachzahlung 400,00 EUR
`;
    const r = extractHausgeld('Hausgeld_2025.pdf', text, 2025);
    expect(r.detected).toBe(true);
    expect(r.isHausgeld).toBe(true);
    expect(r.umlagefaehigAmount).toBe(3600);
    expect(r.incomeAmount).toBe(3200);
    expect(r.shouldApplyToRental).toBe(true);
    expect(sumUmlageFromLines(['Heizung 100,00', 'Müll 50,00'])).toBe(150);
  });
});

describe('beleg categories + calculator', () => {
  it('classifies Mietvertrag and Hausgeld', () => {
    expect(normalizeDeBelegCategory('Mietvertrag_x.pdf')).toBe('Mietvertrag');
    expect(normalizeDeBelegCategory('Hausgeldabrechnung 2025')).toBe(
      'Hausgeldabrechnung'
    );
    expect(mapBelegToElster('Mietvertrag').anlage).toBe('V');
    expect(mapBelegToElster('Hausgeldabrechnung').fieldKey).toBe('v.hausgeld');
  });

  it('builds calculator draft from tax lines + profile', () => {
    const draft = buildCalculatorDraftFromBelege({
      profile: {
        country: 'DE',
        steuerklasse: 'I',
        deFilingMode: 'einzel',
        numberOfChildren: 1,
        hasRentalIncome: true,
      },
      taxLines: [
        { kind: 'income', category: 'gehalt', amount: 52000, needsReview: true },
        { kind: 'expense', category: 'spenden', amount: 200, needsReview: true },
        { kind: 'expense', category: 'werbungskosten', amount: 1800, needsReview: true },
      ],
      rentals: [{ grossRent: 15000, operatingCosts: 3600 }],
    });
    expect(draft.income).toBe('52000');
    expect(draft.needsReview).toBe(true);
    expect(draft.rental.enabled).toBe(true);
    expect(draft.rental.grossRent).toBe(15000);
    const spenden = draft.deductions.find((d) => d.id === 'sonderausgaben');
    expect(spenden?.enabled).toBe(true);
    expect(spenden?.amount).toBe(200);
  });
});
