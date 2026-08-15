'use client';

import { KeywordLanding } from '@/components/growth/keyword-landing';

/** Social trigger: GRENZE → Grenzgänger Quick-Check immediately */
export default function GrenzePage() {
  return (
    <KeywordLanding
      titleKey="keyword.grenze.title"
      subtitleKey="keyword.grenze.subtitle"
      triggerLabel="GRENZE"
      defaultMode="grenzgaenger"
      alsoKey="grenzgaengerPublic.alsoArbeitnehmer"
      alsoHref="/rechner"
    />
  );
}
