import { taxCountries, getLocaleByCountry, type TaxCountry } from '@/lib/i18n/config';

export interface DefaultCategory {
  name: string;
  icon: string;
  color: string;
}

const US_CATEGORIES: DefaultCategory[] = [
  { name: 'W-2 Forms', icon: '📄', color: '#3B82F6' },
  { name: '1099 Forms', icon: '📋', color: '#10B981' },
  { name: 'Receipts', icon: '🧾', color: '#F59E0B' },
  { name: 'Invoices', icon: '📝', color: '#8B5CF6' },
  { name: 'Bank Statements', icon: '🏦', color: '#EF4444' },
  { name: 'Pay Stubs', icon: '💼', color: '#06B6D4' },
  { name: 'Medical Expenses', icon: '🏥', color: '#EC4899' },
  { name: 'Other', icon: '📁', color: '#6B7280' },
];

const DE_CATEGORIES: DefaultCategory[] = [
  { name: 'Mietverträge', icon: '🏠', color: '#3B82F6' },
  { name: 'Rechnungen', icon: '🧾', color: '#F59E0B' },
  { name: 'Gehaltsabrechnungen', icon: '💼', color: '#10B981' },
  { name: 'Kontoauszüge', icon: '🏦', color: '#EF4444' },
  { name: 'Steuerdokumente', icon: '📑', color: '#8B5CF6' },
  { name: 'Versicherungen', icon: '🛡️', color: '#06B6D4' },
  { name: 'Belege', icon: '📎', color: '#EC4899' },
  { name: 'Sonstiges', icon: '📁', color: '#6B7280' },
];

const CA_CATEGORIES: DefaultCategory[] = [
  { name: 'T4 Slips', icon: '📄', color: '#3B82F6' },
  { name: 'Receipts', icon: '🧾', color: '#F59E0B' },
  { name: 'Invoices', icon: '📝', color: '#8B5CF6' },
  { name: 'Bank Statements', icon: '🏦', color: '#EF4444' },
  { name: 'Pay Stubs', icon: '💼', color: '#10B981' },
  { name: 'Other', icon: '📁', color: '#6B7280' },
];

export function getDefaultCategoriesForCountry(country: string): DefaultCategory[] {
  if (country === 'DE') return DE_CATEGORIES;
  if (country === 'CA') return CA_CATEGORIES;
  return US_CATEGORIES;
}

export function getSuggestedLanguageForCountry(country: string): string {
  if (country in taxCountries) {
    const locale = getLocaleByCountry(country as TaxCountry);
    return locale.split('-')[0];
  }
  return 'en';
}

export async function ensureDefaultCategories(
  db: {
    documentCategory: {
      findFirst: (args: {
        where: { name: string; userId: null };
      }) => Promise<{ id: string } | null>;
      create: (args: {
        data: DefaultCategory & { isDefault: boolean };
      }) => Promise<{ id: string }>;
    };
  },
  country: string
): Promise<void> {
  const categories = getDefaultCategoriesForCountry(country);

  for (const category of categories) {
    const existing = await db.documentCategory.findFirst({
      where: { name: category.name, userId: null },
    });

    if (!existing) {
      await db.documentCategory.create({
        data: {
          ...category,
          isDefault: true,
        },
      });
    }
  }
}

export async function findOrCreateCategory(
  db: {
    documentCategory: {
      findFirst: (args: {
        where: { name: string; userId: null };
      }) => Promise<{ id: string } | null>;
      create: (args: {
        data: { name: string; isDefault: boolean; icon?: string; color?: string };
      }) => Promise<{ id: string }>;
    };
  },
  categoryName: string,
  country: string
): Promise<string> {
  const defaults = getDefaultCategoriesForCountry(country);
  const matchedDefault = defaults.find(
    (item) => item.name.toLowerCase() === categoryName.toLowerCase()
  );

  const name = matchedDefault?.name || categoryName;

  let category = await db.documentCategory.findFirst({
    where: { name, userId: null },
  });

  if (!category) {
    category = await db.documentCategory.create({
      data: {
        name,
        isDefault: true,
        icon: matchedDefault?.icon,
        color: matchedDefault?.color,
      },
    });
  }

  return category.id;
}
