'use client';

export interface SubmitReportInput {
  type: 'feedback' | 'error' | 'bug';
  title?: string;
  message: string;
  pageUrl?: string;
  stackTrace?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
}

export async function submitReport(input: SubmitReportInput): Promise<boolean> {
  try {
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...input,
        pageUrl: input.pageUrl || (typeof window !== 'undefined' ? window.location.href : undefined),
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
