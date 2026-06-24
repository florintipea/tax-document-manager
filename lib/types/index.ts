/**
 * Core type definitions for TaxDoc
 */

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: Date | null;
  country: string;
  language: string;
  theme: string;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  userId: string;
  name: string;
  originalName: string;
  categoryId: string | null;
  category: DocumentCategory | null;
  fileUrl: string;
  fileSize: number;
  fileHash: string | null;
  contentHash: string | null;
  mimeType: string;
  thumbnailUrl: string | null;
  year: number;
  date: Date;
  isTaxRelevant: boolean;
  taxAmount: number | null;
  taxCategory: string | null;
  extractedText: string | null;
  extractedData: any;
  aiConfidence: number | null;
  tags: string[];
  notes: string | null;
  isOffline: boolean;
  lastSynced: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  isDefault: boolean;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIResponse {
  message: string;
  provider?: string;
  model?: string;
  tokensUsed?: number;
  latency?: number;
  confidence?: number;
}

export interface SecurityEvent {
  id: string;
  userId: string;
  type: string;
  severity: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  metadata: any;
  resolved: boolean;
  timestamp: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  billingInterval: string | null;
  steuerjahr: number | null;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIInteraction {
  id: string;
  userId: string;
  message: string;
  response: string;
  provider: string;
  model: string;
  tokensUsed: number | null;
  latency: number | null;
  confidence: number | null;
  feedback: string | null;
  context: any;
  createdAt: Date;
}
