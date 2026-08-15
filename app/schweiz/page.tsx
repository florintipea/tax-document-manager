'use client';

import { KeywordLanding } from '@/components/growth/keyword-landing';

/** Social trigger: SCHWEIZ → CH Grenzgänger Quick-Check immediately */
export default function SchweizPage() {
  return (
    <KeywordLanding
      titleKey="keyword.schweiz.title"
      subtitleKey="keyword.schweiz.subtitle"
      triggerLabel="SCHWEIZ"
      defaultMode="grenzgaenger"
      defaultWorkCountry="CH"
      alsoKey="grenzgaengerPublic.alsoArbeitnehmer"
      alsoHref="/rechner"
    />
  );
}
