export interface OnboardingPayload {
  testerEmail: string;
  password: string;
  loginUrl: string;
}

export function buildOnboardingPacket(payload: OnboardingPayload): string {
  return [
    'TaxDoc Beta - Dein Testzugang',
    '',
    `Login URL: ${payload.loginUrl}`,
    `Tester E-Mail: ${payload.testerEmail}`,
    `Passwort: ${payload.password}`,
    '',
    'So startest du:',
    '1) Oeffne die Login-URL und melde dich an.',
    '2) Lade ein Dokument hoch und pruefe die Zuordnung.',
    '3) Oeffne den Steuerrechner oder den ELSTER-Assistenten.',
    '4) Sende Feedback ueber den Feedback-Button in der App.',
    '',
    'Datenschutz-Hinweis:',
    'Deine Daten werden nur fuer die Beta-Betreuung verarbeitet.',
    'Bitte teile diese Zugangsdaten nicht mit anderen.',
    '',
    'Hinweis:',
    'Die Zugangsdaten werden auf der Beta-Seite angezeigt.',
    'E-Mail-Versand ist optional und kann je nach Server-Konfiguration deaktiviert sein.',
  ].join('\n');
}

export async function tryDeliverOnboardingEmail(input: {
  recipientEmail: string;
  recipientName?: string;
  payload: OnboardingPayload;
}): Promise<{ attempted: boolean; delivered: boolean }> {
  const webhookUrl = process.env.BETA_ONBOARDING_EMAIL_WEBHOOK_URL?.trim();
  if (!webhookUrl) return { attempted: false, delivered: false };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: input.recipientEmail,
        name: input.recipientName,
        subject: 'TaxDoc Beta-Zugang',
        text: buildOnboardingPacket(input.payload),
      }),
    });
    return { attempted: true, delivered: response.ok };
  } catch {
    return { attempted: true, delivered: false };
  }
}
