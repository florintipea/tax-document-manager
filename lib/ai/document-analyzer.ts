/**
 * AI-Powered Document Analyzer
 * Automatically detects tax relevance and categorizes documents
 */

import { getAIService } from './providers';

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
          ? 'Use German categories such as Mietverträge, Rechnungen, Gehaltsabrechnungen, Kontoauszüge, Steuerdokumente, Versicherungen, Belege, Sonstiges'
          : 'Use categories such as W-2 Forms, 1099 Forms, Receipts, Invoices, Bank Statements, Pay Stubs, Other';

      const prompt = `Analyze this tax document for country ${country} and provide JSON with:
1. isTaxRelevant: boolean
2. category: string (${categoryHint})
3. taxCategory: string or null (income, deduction, rental, insurance, etc.)
4. taxAmount: number or null
5. year: number or null
6. confidence: number 0-1
7. suggestions: string[]

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
          analysis = this.fallbackAnalysis(fileName, country, fileContent);
        }
      } catch {
        analysis = this.fallbackAnalysis(fileName, country, fileContent);
      }

      return {
        isTaxRelevant: analysis.isTaxRelevant ?? false,
        category: analysis.category || this.inferCategory(fileName, country, fileContent),
        taxCategory: analysis.taxCategory || undefined,
        taxAmount: analysis.taxAmount || undefined,
        year: analysis.year || this.extractYear(fileName, fileContent),
        confidence: analysis.confidence || 0.5,
        suggestions: analysis.suggestions || [],
        extractedText: fileContent?.substring(0, 5000),
        extractedData: analysis as unknown as Record<string, unknown>,
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
    const searchText = `${fileName} ${fileContent || ''}`.toLowerCase();
    const category = this.inferCategory(fileName, country, fileContent);
    const isTaxRelevant = this.isTaxRelevantText(searchText, country);

    return {
      isTaxRelevant,
      category,
      taxCategory: this.inferTaxCategory(category, country),
      year: this.extractYear(fileName, fileContent),
      confidence: fileContent ? 0.75 : 0.65,
      suggestions: isTaxRelevant
        ? country === 'DE'
          ? ['Dokument für die Steuererklärung prüfen']
          : ['Review this document for tax filing']
        : [],
    };
  }

  private static isTaxRelevantText(text: string, country: string): boolean {
    const common = ['tax', 'invoice', 'receipt', 'salary', 'income', 'deduction', 'bank', 'insurance'];

    const german = [
      'steuer',
      'finanzamt',
      'rechnung',
      'beleg',
      'quittung',
      'mietvertrag',
      'miete',
      'wohnraum',
      'gehalt',
      'lohn',
      'gehaltsabrechnung',
      'kontoauszug',
      'versicherung',
      'werbungskosten',
      'elster',
      'bescheid',
    ];

    const us = ['w-2', 'w2', '1099', 'irs', 'pay stub', 'withholding'];

    const keywords = country === 'DE' ? [...common, ...german] : [...common, ...us];
    return keywords.some((keyword) => text.includes(keyword));
  }

  private static inferCategory(
    fileName: string,
    country: string,
    fileContent?: string
  ): string {
    const text = `${fileName} ${fileContent || ''}`.toLowerCase();

    if (country === 'DE') {
      if (text.includes('mietvertrag') || text.includes('wohnraum') || text.includes('miete')) {
        return 'Mietverträge';
      }
      if (text.includes('gehaltsabrechnung') || text.includes('lohn') || text.includes('gehalt')) {
        return 'Gehaltsabrechnungen';
      }
      if (text.includes('kontoauszug') || text.includes('bank') || text.includes('sparkasse')) {
        return 'Kontoauszüge';
      }
      if (text.includes('steuer') || text.includes('finanzamt') || text.includes('bescheid')) {
        return 'Steuerdokumente';
      }
      if (text.includes('versicherung')) {
        return 'Versicherungen';
      }
      if (text.includes('rechnung') || text.includes('quittung')) {
        return 'Rechnungen';
      }
      if (text.includes('beleg')) {
        return 'Belege';
      }
      return 'Sonstiges';
    }

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

  private static inferTaxCategory(category: string, country: string): string | undefined {
    if (country === 'DE') {
      if (category === 'Mietverträge') return 'rental';
      if (category === 'Gehaltsabrechnungen') return 'income';
      if (category === 'Rechnungen' || category === 'Belege') return 'deduction';
      if (category === 'Steuerdokumente') return 'tax';
      if (category === 'Versicherungen') return 'insurance';
    }

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
