import { describe, expect, it } from 'vitest';
import {
  classifyBelegRules,
  normalizeDeBelegCategory,
  categoryLabelDe,
} from '@/lib/ai/beleg-sort';

describe('beleg-sort (truthful KI Sortierhilfe)', () => {
  it('classifies Lohnabrechnung from filename', () => {
    const r = classifyBelegRules('Gehaltsabrechnung_2025_03.pdf');
    expect(r.category).toBe('Lohnabrechnung');
    expect(r.method).toBe('rules');
    expect(r.isTaxRelevant).toBe(true);
  });

  it('classifies Spende from content', () => {
    const r = classifyBelegRules('scan.pdf', 'Spendenquittung über 50 Euro an Caritas');
    expect(r.category).toBe('Spende');
  });

  it('classifies Fahrt', () => {
    const r = classifyBelegRules('fahrtenbuch-pendeln.xlsx'.replace('.xlsx', '.pdf'), 'Pendeln 45 km Entfernungspauschale');
    expect(r.category).toBe('Fahrt');
  });

  it('classifies Auslandsbeleg for CH Lohnausweis', () => {
    const r = classifyBelegRules('Lohnausweis_CH_2025.pdf', 'Quellensteuer Schweiz Ansässigkeitsbescheinigung');
    expect(r.category).toBe('Auslandsbeleg');
  });

  it('classifies Rechnung', () => {
    const r = classifyBelegRules('Apotheke_Rechnung.pdf', 'Quittung 12,90 EUR');
    expect(r.category).toBe('Rechnung');
  });

  it('falls back to Sonstiges without signals', () => {
    const r = classifyBelegRules('foto_urlaub.jpg');
    expect(r.category).toBe('Sonstiges');
  });

  it('normalizes legacy category names', () => {
    expect(normalizeDeBelegCategory('Gehaltsabrechnungen')).toBe('Lohnabrechnung');
    expect(normalizeDeBelegCategory('Rechnungen')).toBe('Rechnung');
    expect(categoryLabelDe('Lohnabrechnung')).toMatch(/Lohnabrechnung/);
  });
});
