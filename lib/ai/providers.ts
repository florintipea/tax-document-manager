/**
 * Multi-Provider AI Service
 * Supports OpenAI GPT-4o, Anthropic Claude 3.5, and Google Gemini Pro
 * With intelligent fallback and load balancing
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIResponse } from '@/lib/types';
import { AIConfigurationError } from '@/lib/ai/errors';
import {
  resolveAIConfigForUser,
  isResolvedAIConfigured,
  type ResolvedAIConfig,
} from '@/lib/ai/user-providers';

export type AIProvider = 'openai' | 'anthropic' | 'google';

interface AIConfig {
  openai?: {
    apiKey: string;
    model?: string;
  };
  anthropic?: {
    apiKey: string;
    model?: string;
  };
  google?: {
    apiKey: string;
    model?: string;
  };
}

class MultiProviderAIService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private google: GoogleGenerativeAI | null = null;
  private providers: AIProvider[] = [];
  private currentProviderIndex = 0;
  private models: Partial<Record<AIProvider, string>> = {};

  constructor(config: AIConfig) {
    if (config.openai?.apiKey?.trim()) {
      this.openai = new OpenAI({ apiKey: config.openai.apiKey.trim() });
      this.providers.push('openai');
      if (config.openai.model) this.models.openai = config.openai.model;
    }
    if (config.anthropic?.apiKey?.trim()) {
      this.anthropic = new Anthropic({ apiKey: config.anthropic.apiKey.trim() });
      this.providers.push('anthropic');
      if (config.anthropic.model) this.models.anthropic = config.anthropic.model;
    }
    if (config.google?.apiKey?.trim()) {
      this.google = new GoogleGenerativeAI(config.google.apiKey.trim());
      this.providers.push('google');
      if (config.google.model) this.models.google = config.google.model;
    }
  }

  /**
   * Get response from AI with automatic fallback
   */
  async getResponse(
    prompt: string,
    context?: Record<string, any>
  ): Promise<AIResponse> {
    if (this.providers.length === 0) {
      throw new AIConfigurationError();
    }

    const errors: Error[] = [];

    // Try each provider in order
    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[this.currentProviderIndex % this.providers.length];
      this.currentProviderIndex++;
      
      try {
        const startTime = Date.now();
        let response: AIResponse;
        
        switch (provider) {
          case 'openai':
            response = await this.getOpenAIResponse(prompt, context);
            break;
          case 'anthropic':
            response = await this.getAnthropicResponse(prompt, context);
            break;
          case 'google':
            response = await this.getGoogleResponse(prompt, context);
            break;
          default:
            throw new Error(`Unknown provider: ${provider}`);
        }
        
        response.latency = Date.now() - startTime;
        return response;
      } catch (error) {
        errors.push(error as Error);
        console.error(`Provider ${provider} failed:`, error);
        // Continue to next provider
      }
    }
    
    // All providers failed
    throw new Error(
      `All AI providers failed. Errors: ${errors.map(e => e.message).join(', ')}`
    );
  }

  private async getOpenAIResponse(
    prompt: string,
    context?: Record<string, any>
  ): Promise<AIResponse> {
    if (!this.openai) throw new Error('OpenAI not configured');
    
    const model = this.models.openai || process.env.OPENAI_MODEL || 'gpt-4o';
    const systemPrompt = this.buildSystemPrompt(context);
    
    const completion = await this.openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });
    
    const message = completion.choices[0]?.message?.content || '';
    
    return {
      message,
      confidence: 0.9,
      provider: 'openai',
      model,
      tokensUsed: completion.usage?.total_tokens,
    };
  }

  private async getAnthropicResponse(
    prompt: string,
    context?: Record<string, any>
  ): Promise<AIResponse> {
    if (!this.anthropic) throw new Error('Anthropic not configured');
    
    const model = this.models.anthropic || process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
    const systemPrompt = this.buildSystemPrompt(context);
    
    const message = await this.anthropic.messages.create({
      model,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: prompt },
      ],
    });
    
    const content = message.content[0];
    const text = content.type === 'text' ? content.text : '';
    
    return {
      message: text,
      confidence: 0.9,
      provider: 'anthropic',
      model,
      tokensUsed: message.usage?.input_tokens && message.usage?.output_tokens
        ? message.usage.input_tokens + message.usage.output_tokens
        : undefined,
    };
  }

  private async getGoogleResponse(
    prompt: string,
    context?: Record<string, any>
  ): Promise<AIResponse> {
    if (!this.google) throw new Error('Google not configured');
    
    let modelName = this.models.google || process.env.GOOGLE_MODEL || 'gemini-2.0-flash';
    // Legacy / placeholder IDs are no longer served by Google AI
    if (modelName === 'gemini-pro' || modelName === 'gemini-1.0-pro') {
      modelName = 'gemini-2.0-flash';
    }
    const model = this.google.getGenerativeModel({ model: modelName });
    const systemPrompt = this.buildSystemPrompt(context);
    
    const fullPrompt = `${systemPrompt}\n\nUser: ${prompt}\n\nAssistant:`;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    return {
      message: text,
      confidence: 0.85,
      provider: 'google',
      model: modelName,
    };
  }

  private buildSystemPrompt(context?: Record<string, any>): string {
    let prompt = `You are "KI-Steuer-Assistent" — an educational tax helper inside TaxDoc (a document and estimate app).

CRITICAL LEGAL BOUNDARIES (Germany / StBerG):
- You are NOT a licensed Steuerberater and do NOT provide Steuerberatung.
- You are a Hilfsmittel for information, orientation, and document organization only.
- Never claim to replace a Steuerberater, Finanzamt, or ELSTER binding filing.
- Always remind the user to verify answers and consult a qualified Steuerberater for binding advice.
- Do not invent laws, amounts, or deadlines. If unsure, say so clearly.
- Prefer German tax context when the user's country is DE.

You help with:
- Understanding tax documents and categories
- Rough orientations and estimates (non-binding)
- Organizing documents for a possible tax return
- Deadlines and form orientation (non-binding)
- Pointing users to official sources (BMF, Finanzamt, ELSTER)

Reply in the user's language when known. End substantive answers with a short disclaimer that this is no substitute for Steuerberatung.`;

    if (context) {
      if (context.country) {
        prompt += `\n\nUser's tax country: ${context.country}`;
      }
      if (context.language) {
        prompt += `\nUser's UI language: ${context.language}`;
      }
      if (context.documentCount !== undefined) {
        prompt += `\nDocuments in library: ${context.documentCount}`;
      }

      const profileBits: string[] = [];
      if (context.steuerklasse) profileBits.push(`Steuerklasse: ${context.steuerklasse}`);
      if (context.bundesland) profileBits.push(`Bundesland: ${context.bundesland}`);
      if (context.numberOfChildren !== undefined && context.numberOfChildren !== null) {
        profileBits.push(`Kinder: ${context.numberOfChildren}`);
      }
      if (context.deFilingMode) {
        profileBits.push(
          `Veranlagung: ${context.deFilingMode === 'zusammen' ? 'Zusammenveranlagung' : 'Einzelveranlagung'}`
        );
      }
      if (context.spouseIncome !== undefined && context.spouseIncome !== null && Number(context.spouseIncome) > 0) {
        profileBits.push(`Ehepartner-Einkommen (jährlich, Nutzerangabe): ${context.spouseIncome}`);
      }
      if (context.isCrossBorder === true) profileBits.push('Grenzgänger / Auslandstätigkeit: ja');
      if (context.hasRentalIncome === true) profileBits.push('Vermietung & Verpachtung: ja');
      if (profileBits.length > 0) {
        prompt += `\n\nSteuerprofil (user-provided, may be incomplete):\n- ${profileBits.join('\n- ')}`;
      }

      const docs = context.recentDocuments;
      if (Array.isArray(docs) && docs.length > 0) {
        const lines = docs.slice(0, 10).map((d: Record<string, unknown>) => {
          const parts = [
            String(d.name || d.originalName || 'Dokument'),
            d.year != null ? `Jahr ${d.year}` : null,
            d.taxCategory ? `Kategorie ${d.taxCategory}` : null,
            d.categoryName ? `Ordner ${d.categoryName}` : null,
            d.taxAmount != null ? `Betrag ${d.taxAmount}` : null,
            d.isTaxRelevant === true ? 'steuerrelevant' : null,
          ].filter(Boolean);
          return `- ${parts.join(' | ')}`;
        });
        prompt += `\n\nRecent documents (metadata only, no file contents):\n${lines.join('\n')}`;
      }
    }

    return prompt;
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): AIProvider[] {
    return [...this.providers];
  }
}

function resolvedConfigToAIConfig(config: ResolvedAIConfig): AIConfig {
  return {
    openai: config.openai
      ? { apiKey: config.openai.apiKey, model: config.openai.model }
      : undefined,
    anthropic: config.anthropic
      ? { apiKey: config.anthropic.apiKey, model: config.anthropic.model }
      : undefined,
    google: config.google
      ? { apiKey: config.google.apiKey, model: config.google.model }
      : undefined,
  };
}

export function createAIService(config: AIConfig): MultiProviderAIService {
  return new MultiProviderAIService(config);
}

// Singleton instance for server-wide env keys only
let aiServiceInstance: MultiProviderAIService | null = null;

export function getAIService(): MultiProviderAIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new MultiProviderAIService({
      openai: {
        apiKey: process.env.OPENAI_API_KEY?.trim() || '',
        model: process.env.OPENAI_MODEL,
      },
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY?.trim() || '',
        model: process.env.ANTHROPIC_MODEL,
      },
      google: {
        apiKey: process.env.GOOGLE_AI_API_KEY?.trim() || '',
        model: process.env.GOOGLE_MODEL,
      },
    });
  }
  return aiServiceInstance;
}

export async function getAIServiceForUser(userId: string): Promise<MultiProviderAIService> {
  const resolved = await resolveAIConfigForUser(userId);
  if (!isResolvedAIConfigured(resolved)) {
    throw new AIConfigurationError();
  }
  return createAIService(resolvedConfigToAIConfig(resolved));
}

export default getAIService;
