import { db } from '@/lib/db/client';
import {
  buildElsterPreview,
  parseDocumentIdList,
  type ElsterPreviewResult,
} from '@/lib/tax/elster-preview';

export async function loadElsterPreviewForUser(
  userId: string,
  year: number
): Promise<ElsterPreviewResult | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      country: true,
      steuerklasse: true,
      bundesland: true,
      deFilingMode: true,
      numberOfChildren: true,
      spouseIncome: true,
      hasRentalIncome: true,
      isCrossBorder: true,
    },
  });

  if (!user) return null;

  const [documents, properties, nebenkosten, rentals, taxLines, grenzgaenger] =
    await Promise.all([
      db.document.findMany({
        where: { userId, year },
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.property.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } }),
      db.nebenkostenAbrechnung.findMany({
        where: { userId, year },
        orderBy: { updatedAt: 'desc' },
      }),
      db.rentalYearEntry.findMany({
        where: { userId, year },
        orderBy: { updatedAt: 'desc' },
      }),
      db.taxLineEntry.findMany({
        where: { userId, year },
        orderBy: { updatedAt: 'desc' },
      }),
      db.grenzgaengerYearEntry.findUnique({
        where: { userId_year: { userId, year } },
      }),
    ]);

  return buildElsterPreview({
    year,
    profile: user,
    documents: documents.map((d) => ({
      id: d.id,
      name: d.name,
      year: d.year,
      taxAmount: d.taxAmount,
      aiConfidence: d.aiConfidence,
      isTaxRelevant: d.isTaxRelevant,
      categoryName: d.category?.name ?? null,
      taxCategory: d.taxCategory,
      notes: d.notes,
    })),
    properties: properties.map((p) => ({
      ...p,
      documentIds: parseDocumentIdList(p.documentIds),
    })),
    nebenkosten: nebenkosten.map((n) => ({
      ...n,
      documentIds: parseDocumentIdList(n.documentIds),
    })),
    rentals: rentals.map((r) => ({
      ...r,
      documentIds: parseDocumentIdList(r.documentIds),
    })),
    taxLines: taxLines.map((t) => ({
      ...t,
      documentIds: parseDocumentIdList(t.documentIds),
    })),
    grenzgaenger: grenzgaenger
      ? {
          ...grenzgaenger,
          documentIds: parseDocumentIdList(grenzgaenger.documentIds),
        }
      : null,
  });
}

export function yearFromSearchParams(raw: string | null): number | null {
  if (!raw) return null;
  const year = parseInt(raw, 10);
  if (Number.isNaN(year) || year < 2000 || year > 2100) return null;
  return year;
}
