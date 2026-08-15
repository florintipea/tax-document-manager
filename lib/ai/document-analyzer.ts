/**
 * AI-Powered Document Analyzer
 * Automatically detects tax relevance and categorizes documents
 */

import { getAIService } from './providers';
import {
  classifyBelegRules,
  deBelegCategoryHint,
  normalizeDeBelegCategory,
  categoryLabelDe,
  type BelegSortMethod,
} from './beleg-sort';
import {
  extractEuroAmountHint,
  mapBelegToElster,
} from '@/lib/tax/beleg-to-elster';

export interface DocumentAnalysis {
  isTaxRelevant: boolean;
  category: string;
  taxCategory?: string;
  taxAmount?: number;
  year?: number;
  extractedText?: string;
  extractedData?: Record<string, unknown>;
  confidence: number;
  suggestions?: string[];
  /** How the category was determined — for truthful UI */
  sortMethod?: BelegSortMethod;
  categoryLabelDe?: string;
}

interface AnalyzeOptions {
  country?: string;
  language?: string;
}

export class DocumentAnalyzer {
  static async analyzeDocument(
    fileName: string,
    fileContent?: string,
    mimeType?: string,
    options: AnalyzeOptions = {}
  ): Promise<DocumentAnalysis> {
    const country = options.country || 'US';

    try {
      const providers =
        process.env.OPENAI_API_KEY ||
        process.env.ANTHROPIC_API_KEY ||
        process.env.GOOGLE_AI_API_KEY;

      if (!providers) {
        return this.fallbackAnalysis(fileName, country, fileContent);
      }

      const aiService = getAIService();
      const categoryHint =
        country === 'DE'
          ? `Use exactly one of these German categories: ${deBelegCategoryHint()}`
          : 'Use categories such as W-2 Forms, 1099 Forms, Receipts, Invoices, Bank Statements, Pay Stubs, Other';

      const prompt = `Analyze this tax document for country ${country} and provide JSON with:
1. isTaxRelevant: boolean
2. category: string (${categoryHint})
3. taxCategory: string or null (income, deduction, rental, insurance, foreign, etc.)
4. taxAmount: number or null
5. year: number or null
6. confidence: number 0-1
7. suggestions: string[] (short, helpful, not legal advice)

Document name: ${fileName}
File type: ${mimeType || 'unknown'}
Language hint: ${options.language || 'auto'}

${fileContent ? `Document content preview: ${fileContent.substring(0, 2000)}` : ''}

Respond ONLY with valid JSON.`;

      const response = await aiService.getResponse(prompt, {
        documentName: fileName,
        mimeType: mimeType || 'unknown',
        country,
      });

      let analysis: DocumentAnalysis;
      try {
        const jsonMatch = response.message.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          return this.fallbackAnalysis(fileName, country, fileContent);
        }
      } catch {
        return this.fallbackAnalysis(fileName, country, fileContent);
      }

      const belegCategory =
        country === 'DE'
          ? normalizeDeBelegCategory(analysis.category || fileName)
          : analysis.category || this.inferCategoryUs(fileName, fileContent);

      const mapping =
        country === 'DE'
          ? mapBelegToElster(belegCategory, {
              fileName,
              content: fileContent,
            })
          : null;

      const category =
        country === 'DE' && mapping
          ? mapping.storageCategory
          : belegCategory;

      const amountFromAi =
        typeof analysis.taxAmount === 'number' && analysis.taxAmount > 0
          ? analysis.taxAmount
          : undefined;
      const amountHint =
        amountFromAi ??
        (country === 'DE' ? extractEuroAmountHint(fileName, fileContent) : undefined);

      return {
        isTaxRelevant:
          analysis.isTaxRelevant ??
          (country === 'DE' ? belegCategory !== 'Sonstiges' : false),
        category,
        categoryLabelDe:
          country === 'DE' ? categoryLabelDe(belegCategory) : undefined,
        taxCategory:
          analysis.taxCategory || mapping?.taxLineCategory || undefined,
        taxAmount: amountHint,
        year: analysis.year || this.extractYear(fileName, fileContent),
        confidence: analysis.confidence || 0.5,
        suggestions: [
          ...(analysis.suggestions || []),
          ...(country === 'DE'
            ? ['KI-Vorschlag / unverbindlich — bitte prüfen. Keine Auto-Abgabe.']
            : []),
        ],
        extractedText: fileContent?.substring(0, 5000),
        extractedData: analysis as unknown as Record<string, unknown>,
        sortMethod: 'ai',
      };
    } catch (error) {
      console.error('Document analysis error:', error);
      return this.fallbackAnalysis(fileName, country, fileContent);
    }
  }

  private static fallbackAnalysis(
    fileName: string,
    country: string,
    fileContent?: string
  ): DocumentAnalysis {
    if (country === 'DE') {
      const sorted = classifyBelegRules(fileName, fileContent);
      const mapping = mapBelegToElster(sorted.category, {
        fileName,
        content: fileContent,
      });
      const amountHint = extractEuroAmountHint(fileName, fileContent);
      return {
        isTaxRelevant: sorted.isTaxRelevant,
        category: mapping.storageCategory,
        categoryLabelDe: sorted.categoryLabelDe,
        taxCategory: sorted.taxCategory || mapping.taxLineCategory || undefined,
        taxAmount: amountHint,
        year: sorted.year,
        confidence: sorted.confidence,
        suggestions: [
          ...sorted.suggestions,
          'KI-Vorschlag / unverbindlich — bitte prüfen. Keine Auto-Abgabe.',
        ],
        sortMethod: 'rules',
        extractedText: fileContent?.substring(0, 5000),
      };
    }

    const category = this.inferCategoryUs(fileName, fileContent);
    const searchText = `${fileName} ${fileContent || ''}`.toLowerCase();
    const isTaxRelevant = this.isTaxRelevantTextUs(searchText);

    return {
      isTaxRelevant,
      category,
      taxCategory: this.inferTaxCategoryUs(category),
      year: this.extractYear(fileName, fileContent),
      confidence: fileContent ? 0.75 : 0.65,
      suggestions: isTaxRelevant ? ['Review this document for tax filing'] : [],
      sortMethod: 'rules',
    };
  }

  private static isTaxRelevantTextUs(text: string): boolean {
    const keywords = [
      'tax',
      'invoice',
      'receipt',
      'salary',
      'income',
      'deduction',
      'bank',
      'insurance',
      'w-2',
      'w2',
      '1099',
      'irs',
      'pay stub',
      'withholding',
    ];
    return keywords.some((keyword) => text.includes(keyword));
  }

  private static inferCategoryUs(fileName: string, fileContent?: string): string {
    const text = `${fileName} ${fileContent || ''}`.toLowerCase();

    if (text.includes('w-2') || text.includes('w2')) return 'W-2 Forms';
    if (text.includes('1099')) return '1099 Forms';
    if (text.includes('receipt')) return 'Receipts';
    if (text.includes('invoice') || text.includes('bill')) return 'Invoices';
    if (text.includes('bank') || text.includes('statement')) return 'Bank Statements';
    if (text.includes('pay') || text.includes('salary')) return 'Pay Stubs';
    if (text.includes('medical') || text.includes('health')) return 'Medical Expenses';
    if (text.includes('charity') || text.includes('donation')) return 'Charitable Donations';

    return 'Other';
  }

  private static inferTaxCategoryUs(category: string): string | undefined {
    if (category.includes('W-2') || category.includes('Pay')) return 'income';
    if (category.includes('1099')) return 'income';
    if (category.includes('Receipt') || category.includes('Invoice')) return 'deduction';
    return undefined;
  }

  private static extractYear(fileName: string, fileContent?: string): number {
    const combined = `${fileName} ${fileContent || ''}`;
    const yearMatch = combined.match(/\b(20\d{2})\b/);
    return yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
  }
}
