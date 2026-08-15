/**
 * Rule-based support chatbot for TaxDoc beta.
 * Escalates on help/problem keywords → admin notification.
 * Keeps StBerG disclaimer — no tax advice claims.
 */

const ESCALATION_PATTERNS = [
  /\bhilfe\b/i,
  /\bhelp\b/i,
  /\bproblem\b/i,
  /\bfunktioniert\s+nicht\b/i,
  /\bgeht\s+nicht\b/i,
  /\berror\b/i,
  /\bfehler\b/i,
  /\bstuck\b/i,
  /\bfeststeck/i,
  /\bsupport\b/i,
  /\badmin\b/i,
  /\bmensch\b/i,
  /\bmitarbeiter\b/i,
];

const FAQ: Array<{ patterns: RegExp[]; answer: string }> = [
  {
    patterns: [/login|anmeld|passwort|zugang|einlog/i],
    answer:
      'Login: Öffne /auth/login und nutze die Tester-E-Mail sowie das Passwort aus deiner Beta-Anfrage. Zugangsdaten findest du auch in der heruntergeladenen Anleitung. Bei Problemen schreib „Hilfe“ — dann wird ein Admin benachrichtigt.',
  },
  {
    patterns: [/dokument|upload|hochladen|scan/i],
    answer:
      'Dokumente: Gehe zu „Dokumente“ und lade PDF/Fotos hoch. TaxDoc ordnet sie grob zu — bitte immer prüfen. Das ist ein Hilfsmittel, keine Steuerberatung (§ 5 StBerG).',
  },
  {
    patterns: [/steuerrechner|rechner|berechn/i],
    answer:
      'Steuerrechner: Unter „Steuerrechner“ siehst du Schätzungen. Ergebnisse sind unverbindlich und ersetzen keinen Steuerberater.',
  },
  {
    patterns: [/elster|steuererklä|erklaerung|erklärung/i],
    answer:
      'ELSTER-Assistent: Unter „Steuererklärung“ kannst du Daten vorbereiten. Die finale Abgabe erfolgt über ELSTER / deinen Berater — TaxDoc gibt keine verbindliche Steuerberatung.',
  },
  {
    patterns: [/onboarding|tour|einführung|einfuehrung|wie\s+funktioniert/i],
    answer:
      'Kurze Einführung: Nach dem ersten Login erscheint eine Tour (überspringbar). Du kannst sie jederzeit überspringen — und unter /support Hilfe holen.',
  },
  {
    patterns: [/datenschutz|daten|privacy|lösch|loesch/i],
    answer:
      'Datenschutz: Beta-Daten dienen der Betreuung. Details: /legal/datenschutz. Du kannst unter Einstellungen deine Daten exportieren.',
  },
];

const DEFAULT_ANSWER =
  'Ich bin der TaxDoc-Hilfe-Bot (regelbasiert). Tipps: 1) Dokumente hochladen 2) Steuerrechner prüfen 3) Feedback senden. Schreib „Hilfe“ oder „Problem“, wenn du stecken bleibst — dann wird ein Admin in der App benachrichtigt.\n\nHinweis: TaxDoc ist ein Hilfsmittel, keine Steuerberatung.';

export function shouldEscalate(message: string): boolean {
  return ESCALATION_PATTERNS.some((p) => p.test(message));
}

export function getBotReply(message: string): { reply: string; escalate: boolean } {
  const escalate = shouldEscalate(message);
  if (escalate) {
    return {
      escalate: true,
      reply:
        'Verstanden — ich habe einen Admin benachrichtigt. Du kannst hier weiter schreiben; die Antwort erscheint in diesem Chat.\n\nHinweis: TaxDoc ersetzt keine steuerliche Beratung.',
    };
  }

  for (const entry of FAQ) {
    if (entry.patterns.some((p) => p.test(message))) {
      return { reply: entry.answer, escalate: false };
    }
  }

  return { reply: DEFAULT_ANSWER, escalate: false };
}

export function buildWelcomeMessage(input: {
  testerEmail?: string;
  loginUrl?: string;
  assignedToName?: string;
}): string {
  const name = input.assignedToName ? `Hallo ${input.assignedToName}` : 'Hallo';
  const login = input.loginUrl || '/auth/login';
  const emailHint = input.testerEmail
    ? `\nDein Tester-Login: ${input.testerEmail}`
    : '';

  return [
    `${name} — willkommen bei TaxDoc Beta!`,
    '',
    'Kurz-Tipps zum Start:',
    `1) Einloggen: ${login}${emailHint}`,
    '2) Passwort: wie auf der Beta-Erfolgsseite angezeigt',
    '3) Dokument hochladen und Zuordnung prüfen',
    '4) Steuerrechner oder ELSTER-Assistent ausprobieren',
    '5) Feedback-Button nutzen — oder hier chatten',
    '',
    'Schreib einfach, wenn etwas unklar ist. Bei „Hilfe“ / „Problem“ wird ein Admin benachrichtigt.',
    '',
    'Rechtlicher Hinweis: TaxDoc ist ein Hilfsmittel zur Organisation und Schätzung — keine Steuerberatung im Sinne des StBerG.',
  ].join('\n');
}
