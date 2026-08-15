/**
 * Side-effects for batch autofill: profile refresh, Immobilien, Hausgeld, Calculator.
 * All suggestions — user must verify. No ERiC / no auto-submit.
 */

import { db } from '@/lib/db/client';
import {
  extractPriorElsterProfile,
  PROFILE_REFRESH_NOTICE_DE,
} from '@/lib/tax/prior-elster-extract';
import { extractMietvertrag } from '@/lib/tax/mietvertrag-extract';
import { extractHausgeld } from '@/lib/tax/hausgeld-extract';
import {
  buildCalculatorDraftFromBelege,
  type CalculatorAutofillDraft,
} from '@/lib/tax/beleg-to-calculator';
import {
  parseDocumentIdList,
  serializeDocumentIds,
} from '@/lib/tax/elster-preview';

/** Pure merge: prefer filling empty profile fields; overwrite identity when extract is confident. */
export function mergePriorElsterIntoProfile(
  existing: {
    vorname?: string | null;
    nachname?: string | null;
    name?: string | null;
    idNr?: string | null;
    steuernummer?: string | null;
    street?: string | null;
    zip?: string | null;
    city?: string | null;
    steuerklasse?: string | null;
    numberOfChildren?: number | null;
    deFilingMode?: string | null;
    hasRentalIncome?: boolean | null;
    hasCapitalIncome?: boolean | null;
  },
  extracted: ReturnType<typeof extractPriorElsterProfile>
): { data: Record<string, unknown>; fieldsUpdated: string[] } {
  const data: Record<string, unknown> = {};
  const fieldsUpdated: string[] = [];
  const empty = (v: unknown) =>
    v == null || (typeof v === 'string' && v.trim() === '');
  const overwriteOk = extracted.confidence >= 0.5;

  const setStr = (
    key: string,
    value: string | null | undefined,
    current: string | null | undefined
  ) => {
    if (!value) return;
    if (empty(current) || overwriteOk) {
      data[key] = value;
      fieldsUpdated.push(key);
    }
  };

  setStr('vorname', extracted.vorname, existing.vorname);
  setStr('nachname', extracted.nachname, existing.nachname);
  setStr('idNr', extracted.idNr, existing.idNr);
  setStr('steuernummer', extracted.steuernummer, existing.steuernummer);
  setStr('street', extracted.street, existing.street);
  setStr('zip', extracted.zip, existing.zip);
  setStr('city', extracted.city, existing.city);
  setStr('steuerklasse', extracted.steuerklasse, existing.steuerklasse);
  setStr('deFilingMode', extracted.deFilingMode, existing.deFilingMode);

  if (extracted.numberOfChildren != null) {
    const cur = existing.numberOfChildren ?? 0;
    if (cur === 0 || overwriteOk) {
      data.numberOfChildren = extracted.numberOfChildren;
      fieldsUpdated.push('numberOfChildren');
    }
  }
  if (extracted.hasRentalIncome) {
    data.hasRentalIncome = true;
    fieldsUpdated.push('hasRentalIncome');
  }
  if (extracted.hasCapitalIncome) {
    data.hasCapitalIncome = true;
    fieldsUpdated.push('hasCapitalIncome');
  }

  const vor = (data.vorname as string | undefined) || extracted.vorname;
  const nach = (data.nachname as string | undefined) || extracted.nachname;
  if ((vor || nach) && (empty(existing.name) || overwriteOk)) {
    data.name = [vor, nach].filter(Boolean).join(' ');
    if (!fieldsUpdated.includes('name')) fieldsUpdated.push('name');
  }

  if (extracted.employmentIncome != null) {
    fieldsUpdated.push('employmentIncomeHint');
  }
  if (extracted.taxWithheld != null) {
    fieldsUpdated.push('taxWithheldHint');
  }

  return { data, fieldsUpdated };
}

export async function applyPriorElsterProfileRefresh(opts: {
  userId: string;
  fileName: string;
  content?: string | null;
  documentId: string;
}): Promise<{
  applied: boolean;
  notice?: string;
  fieldsUpdated: string[];
  employmentIncomeHint?: number | null;
  taxWithheldHint?: number | null;
  messageDe: string;
}> {
  const extracted = extractPriorElsterProfile(
    opts.fileName,
    opts.content || undefined
  );
  if (!extracted.detected || extracted.fieldsUpdated.length === 0) {
    return {
      applied: false,
      fieldsUpdated: [],
      messageDe: extracted.notesDe,
    };
  }

  const user = await db.user.findUnique({ where: { id: opts.userId } });
  if (!user) {
    return { applied: false, fieldsUpdated: [], messageDe: 'Nutzer nicht gefunden' };
  }

  const merged = mergePriorElsterIntoProfile(user, extracted);
  // Only profile hints — no identity fields readable → still skip DB write
  const substantive = merged.fieldsUpdated.filter(
    (f) => f !== 'employmentIncomeHint' && f !== 'taxWithheldHint'
  );
  if (substantive.length === 0) {
    return {
      applied: false,
      fieldsUpdated: [],
      employmentIncomeHint: extracted.employmentIncome,
      taxWithheldHint: extracted.taxWithheld,
      messageDe: extracted.notesDe,
    };
  }

  await db.user.update({
    where: { id: opts.userId },
    data: {
      ...merged.data,
      profileRefreshNotice: PROFILE_REFRESH_NOTICE_DE,
      profileRefreshedAt: new Date(),
    },
  });

  return {
    applied: true,
    notice: PROFILE_REFRESH_NOTICE_DE,
    fieldsUpdated: merged.fieldsUpdated,
    employmentIncomeHint: extracted.employmentIncome,
    taxWithheldHint: extracted.taxWithheld,
    messageDe: extracted.notesDe,
  };
}

export async function applyMietvertragProperty(opts: {
  userId: string;
  year: number;
  documentId: string;
  fileName: string;
  content?: string | null;
}): Promise<{
  applied: boolean;
  propertyId?: string;
  roleHint?: string;
  messageDe: string;
}> {
  const extracted = extractMietvertrag(opts.fileName, opts.content || undefined);
  if (!extracted.detected) {
    return { applied: false, messageDe: extracted.notesDe };
  }
  if (!extracted.shouldUpsertProperty || !extracted.address) {
    return {
      applied: false,
      roleHint: extracted.roleHint,
      messageDe: extracted.notesDe,
    };
  }

  const existing = await db.property.findMany({
    where: { userId: opts.userId },
    orderBy: { updatedAt: 'desc' },
  });

  const addrNorm = extracted.address.toLowerCase().replace(/\s+/g, ' ').trim();
  let match = existing.find((p) => {
    const ids = parseDocumentIdList(p.documentIds);
    return ids.includes(opts.documentId);
  });
  if (!match) {
    match = existing.find(
      (p) => p.address.toLowerCase().replace(/\s+/g, ' ').trim() === addrNorm
    );
  }

  const docIds = match
    ? Array.from(new Set([...parseDocumentIdList(match.documentIds), opts.documentId]))
    : [opts.documentId];

  const payload = {
    label: extracted.label || match?.label || null,
    address: extracted.address,
    monthlyRent: extracted.monthlyRent ?? match?.monthlyRent ?? null,
    contractStart: extracted.contractStart ?? match?.contractStart ?? null,
    contractEnd: extracted.contractEnd ?? match?.contractEnd ?? null,
    landlordName: extracted.landlordName ?? match?.landlordName ?? null,
    tenantName: extracted.tenantName ?? match?.tenantName ?? null,
    roleHint: extracted.roleHint,
    needsReview: true,
    sourceHint: 'mietvertrag',
    notes:
      `${extracted.notesDe} Quelle: ${opts.fileName}`.slice(0, 4000) || null,
    documentIds: serializeDocumentIds(docIds),
  };

  let propertyId: string;
  if (match) {
    const updated = await db.property.update({
      where: { id: match.id },
      data: payload,
    });
    propertyId = updated.id;
  } else {
    const created = await db.property.create({
      data: { userId: opts.userId, ...payload },
    });
    propertyId = created.id;
  }

  if (extracted.roleHint === 'vermieter' || extracted.monthlyRent) {
    await db.user.update({
      where: { id: opts.userId },
      data: { hasRentalIncome: true },
    });

    if (extracted.monthlyRent && extracted.monthlyRent > 0) {
      const annual = Math.round(extracted.monthlyRent * 12 * 100) / 100;
      const rentals = await db.rentalYearEntry.findMany({
        where: { userId: opts.userId, year: opts.year, propertyId },
      });
      if (rentals.length === 0) {
        await db.rentalYearEntry.create({
          data: {
            userId: opts.userId,
            propertyId,
            year: opts.year,
            objectLabel: extracted.label || extracted.address.slice(0, 80),
            grossRent: annual,
            operatingCosts: 0,
            werbungskosten: 0,
            notes: `KI-Vorschlag aus Mietvertrag (${extracted.monthlyRent} €/Monat × 12) — bitte prüfen.`,
            documentIds: serializeDocumentIds([opts.documentId]),
            needsReview: true,
          },
        });
      } else {
        const r = rentals[0];
        const ids = parseDocumentIdList(r.documentIds);
        if (!ids.includes(opts.documentId)) ids.push(opts.documentId);
        await db.rentalYearEntry.update({
          where: { id: r.id },
          data: {
            grossRent: Math.max(r.grossRent, annual),
            documentIds: serializeDocumentIds(ids),
            needsReview: true,
          },
        });
      }
    }
  }

  return {
    applied: true,
    propertyId,
    roleHint: extracted.roleHint,
    messageDe: extracted.notesDe,
  };
}

export async function applyHausgeldToRental(opts: {
  userId: string;
  year: number;
  documentId: string;
  fileName: string;
  content?: string | null;
}): Promise<{
  applied: boolean;
  nebenkostenId?: string;
  rentalId?: string;
  messageDe: string;
}> {
  const extracted = extractHausgeld(
    opts.fileName,
    opts.content || undefined,
    opts.year
  );
  if (!extracted.detected || !extracted.shouldApplyToRental) {
    return { applied: false, messageDe: extracted.notesDe };
  }

  const year = extracted.year || opts.year;
  const umlage = extracted.umlagefaehigAmount ?? 0;
  const income = extracted.incomeAmount ?? 0;
  const settlement =
    extracted.settlementAmount ??
    (umlage > 0 ? umlage : income > 0 ? income : 0);

  const existingNk = await db.nebenkostenAbrechnung.findMany({
    where: { userId: opts.userId, year },
  });
  let nk = existingNk.find((n) =>
    parseDocumentIdList(n.documentIds).includes(opts.documentId)
  );

  const nkData = {
    year,
    settlementAmount: settlement || umlage || income || 0,
    isNachzahlung: extracted.isNachzahlung ?? true,
    objectLabel: extracted.objectLabel || 'Hausgeld / Nebenkosten',
    notes: extracted.notesDe,
    umlagefaehigAmount: extracted.umlagefaehigAmount ?? null,
    incomeAmount: extracted.incomeAmount ?? null,
    sourceKind: extracted.isHausgeld ? 'hausgeld' : 'nebenkosten',
    needsReview: true,
    documentIds: serializeDocumentIds(
      nk
        ? Array.from(
            new Set([...parseDocumentIdList(nk.documentIds), opts.documentId])
          )
        : [opts.documentId]
    ),
  };

  if (nk) {
    nk = await db.nebenkostenAbrechnung.update({
      where: { id: nk.id },
      data: nkData,
    });
  } else {
    nk = await db.nebenkostenAbrechnung.create({
      data: { userId: opts.userId, ...nkData },
    });
  }

  // Map to V&V rental: umlage → operatingCosts; income → grossRent add
  const rentals = await db.rentalYearEntry.findMany({
    where: { userId: opts.userId, year },
    orderBy: { updatedAt: 'desc' },
  });
  let rental = rentals[0];
  const opAdd = umlage > 0 ? umlage : extracted.isNachzahlung ? settlement : 0;
  const incomeAdd = income > 0 ? income : !extracted.isNachzahlung ? settlement : 0;

  if (!rental && (opAdd > 0 || incomeAdd > 0)) {
    rental = await db.rentalYearEntry.create({
      data: {
        userId: opts.userId,
        year,
        objectLabel: extracted.objectLabel || 'V&V aus Hausgeld',
        grossRent: incomeAdd,
        operatingCosts: opAdd,
        werbungskosten: 0,
        notes: extracted.notesDe,
        documentIds: serializeDocumentIds([opts.documentId]),
        needsReview: true,
      },
    });
  } else if (rental) {
    const ids = parseDocumentIdList(rental.documentIds);
    if (!ids.includes(opts.documentId)) ids.push(opts.documentId);
    rental = await db.rentalYearEntry.update({
      where: { id: rental.id },
      data: {
        operatingCosts: Math.max(rental.operatingCosts, opAdd),
        grossRent: Math.max(rental.grossRent, incomeAdd),
        documentIds: serializeDocumentIds(ids),
        needsReview: true,
        notes: extracted.notesDe,
      },
    });
  }

  await db.user.update({
    where: { id: opts.userId },
    data: { hasRentalIncome: true },
  });

  // Structured tax lines for review trail
  if (opAdd > 0) {
    await ensureCategoryTaxLine({
      userId: opts.userId,
      year,
      documentId: opts.documentId,
      kind: 'expense',
      category: 'werbungskosten',
      label: `Umlagefähige Kosten — ${opts.fileName}`.slice(0, 200),
      amount: opAdd,
    });
  }
  if (incomeAdd > 0) {
    await ensureCategoryTaxLine({
      userId: opts.userId,
      year,
      documentId: opts.documentId,
      kind: 'income',
      category: 'sonstige_einnahmen',
      label: `Einnahmen Hausgeld/NK — ${opts.fileName}`.slice(0, 200),
      amount: incomeAdd,
    });
  }

  return {
    applied: true,
    nebenkostenId: nk.id,
    rentalId: rental?.id,
    messageDe: extracted.notesDe,
  };
}

async function ensureCategoryTaxLine(opts: {
  userId: string;
  year: number;
  documentId: string;
  kind: 'income' | 'expense';
  category: string;
  label: string;
  amount: number;
}) {
  const existing = await db.taxLineEntry.findMany({
    where: { userId: opts.userId, year: opts.year },
  });
  for (const line of existing) {
    if (parseDocumentIdList(line.documentIds).includes(opts.documentId) &&
      line.category === opts.category &&
      line.kind === opts.kind) {
      return;
    }
  }
  await db.taxLineEntry.create({
    data: {
      userId: opts.userId,
      year: opts.year,
      kind: opts.kind,
      category: opts.category,
      label: opts.label,
      amount: opts.amount,
      notes: 'KI-Vorschlag / unverbindlich — bitte prüfen. Keine Auto-Abgabe.',
      documentIds: serializeDocumentIds([opts.documentId]),
      needsReview: true,
    },
  });
}

export async function applyCalculatorFromBelege(opts: {
  userId: string;
  year: number;
  employmentIncomeHint?: number | null;
  taxWithheldHint?: number | null;
  persist?: boolean;
}): Promise<CalculatorAutofillDraft> {
  const user = await db.user.findUnique({
    where: { id: opts.userId },
    select: {
      country: true,
      steuerklasse: true,
      deFilingMode: true,
      spouseIncome: true,
      numberOfChildren: true,
      hasRentalIncome: true,
      isCrossBorder: true,
      calculatorDraft: true,
    },
  });

  const [taxLines, rentals, gg] = await Promise.all([
    db.taxLineEntry.findMany({
      where: { userId: opts.userId, year: opts.year },
    }),
    db.rentalYearEntry.findMany({
      where: { userId: opts.userId, year: opts.year },
    }),
    db.grenzgaengerYearEntry.findUnique({
      where: { userId_year: { userId: opts.userId, year: opts.year } },
    }),
  ]);

  const draft = buildCalculatorDraftFromBelege({
    profile: {
      country: user?.country || 'DE',
      steuerklasse: user?.steuerklasse,
      deFilingMode: user?.deFilingMode,
      spouseIncome: user?.spouseIncome,
      numberOfChildren: user?.numberOfChildren,
      hasRentalIncome: user?.hasRentalIncome,
      isCrossBorder: user?.isCrossBorder || Boolean(gg?.enabled),
      workCountry: gg?.workCountry,
    },
    taxLines: taxLines.map((l) => ({
      kind: l.kind,
      category: l.category,
      amount: l.amount,
      needsReview: l.needsReview,
    })),
    rentals: rentals.map((r) => ({
      grossRent: r.grossRent,
      operatingCosts: r.operatingCosts,
      werbungskosten: r.werbungskosten,
    })),
    employmentIncomeHint: opts.employmentIncomeHint,
    taxWithheldHint: opts.taxWithheldHint,
  });

  if (opts.persist !== false) {
    const persistBody = {
      income: draft.income,
      taxWithheld: draft.taxWithheld,
      steuerklasse: draft.steuerklasse,
      deFilingMode: draft.deFilingMode,
      spouseIncome: draft.spouseIncome,
      deductions: draft.deductions,
      rental: draft.rental,
      crossBorder: draft.crossBorder,
      vorauszahlungen: draft.vorauszahlungen,
      showVorauszahlungen: draft.showVorauszahlungen,
      autofillMeta: {
        year: opts.year,
        disclaimerDe: draft.disclaimerDe,
        sourceSummaryDe: draft.sourceSummaryDe,
        confidenceLabel: draft.confidenceLabel,
        needsReview: true,
        at: new Date().toISOString(),
      },
    };
    await db.user.update({
      where: { id: opts.userId },
      data: { calculatorDraft: JSON.stringify(persistBody) },
    });
  }

  return draft;
}
