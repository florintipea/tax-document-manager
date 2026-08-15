export class AIConfigurationError extends Error {
  readonly code = 'AI_NOT_CONFIGURED' as const;

  constructor() {
    super('No AI providers configured');
    this.name = 'AIConfigurationError';
  }
}

export function isAIConfigurationError(error: unknown): error is AIConfigurationError {
  return error instanceof AIConfigurationError;
}
