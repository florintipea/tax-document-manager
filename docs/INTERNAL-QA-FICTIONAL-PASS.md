# Internal QA — Fictional Pass

**Datum:** 2026-08-09T14:11:20.772Z
**Base:** https://taxdoc-beta.onrender.com
**Account:** `tester002@taxdoc.test` (Tester)

## Persona (fiktiv)

- **Name:** Max Mustermann
- **Steuernummer:** `12/345/67890` (fiktiv)
- **IdNr:** `12345678901` (11 Ziffern, fiktiv — keine echte IdNr)
- **Adresse:** Musterstraße 12, 80331 München
- **Grenzgänger:** Wohnsitz DE, Arbeit AT, Einkommen 2025: 54 000 € (fiktiv)
- **Kein** ELSTER-/ERiC-Submit

## Ergebnisse

| Bereich | Status | Detail |
|---|---|---|
| public:/ | PASS | GET / → 200 |
| public:/pricing | PASS | GET /pricing → 200 |
| public:/trust | PASS | GET /trust → 200 |
| public:/beta | PASS | GET /beta → 200 |
| public:/beta-anfrage | PASS | GET /beta-anfrage → 200 |
| public:/legal/impressum | PASS | GET /legal/impressum → 200 |
| public:/legal/datenschutz | PASS | GET /legal/datenschutz → 200 |
| public:/auth/login | PASS | GET /auth/login → 200 |
| public:/api/health | PASS | GET /api/health → 200 |
| pricing:effective | PASS | GET /api/pricing/effective → 200 |
| auth | PASS | Logged in as tester002@taxdoc.test |
| admin:reject | PASS | Non-admin blocked (403) |
| onboarding | PASS | POST /api/user/onboarding → 200 |
| steuerprofil | PASS | PATCH /api/user/settings → 200 |
| steuerprofil:persist | PASS | Max Mustermann + fiktive IdNr persisted |
| dashboard:finance | PASS | GET /api/dashboard/finance → 200 |
| documents:list | PASS | GET /api/documents?year=2025 → 200 |
| documents:upload | PASS | POST /api/documents/upload → 200 |
| categories | PASS | GET /api/categories → 200 |
| elster:grenzgaenger | PASS | PUT /api/elster/grenzgaenger → 200 |
| elster:entries | PASS | POST /api/elster/entries → 201 |
| elster:properties | PASS | POST /api/elster/properties → 201 |
| elster:rental | PASS | POST /api/elster/rental → 201 |
| elster:nebenkosten | PASS | POST /api/elster/nebenkosten → 201 |
| elster:preview | PASS | fields=57 anlagen=4 gaps=2 |
| elster:batch-autofill | PASS | ok=6 error=0 taxLines=0 review=56 |
| elster:export | PASS | checklist items=13 |
| calculator | PASS | POST /api/tax/calculate → 200 |
| ai:chat | PASS | Graceful AI_NOT_CONFIGURED without BYO key |
| ai:status | PASS | GET /api/ai/status → 200 |
| support:get | PASS | GET /api/support/thread → 200 |
| support:post | PASS | POST /api/support/thread → 200 |
| gdpr:export | PASS | GET /api/user/export → 200 |
| billing | PASS | GET /api/billing → 200 |
| page:/dashboard | PASS | GET /dashboard → 200 |
| page:/documents | PASS | GET /documents → 200 |
| page:/calculator | PASS | GET /calculator → 200 |
| page:/steuererklaerung | PASS | GET /steuererklaerung → 200 |
| page:/grenzgaenger | PASS | GET /grenzgaenger → 200 |
| page:/interview | PASS | GET /interview → 200 |
| page:/settings | PASS | GET /settings → 200 |
| page:/ai-assistant | PASS | GET /ai-assistant → 200 |
| page:/support | PASS | GET /support → 200 |
| page:/tax-forms | PASS | GET /tax-forms → 200 |
| beta:validation | PASS | Invalid email rejected |

## Bekannte Limits

- KI-Chat braucht BYO API-Key → ohne Key erwarteter 503 `AI_NOT_CONFIGURED`
- Kein Fake-ELSTER-Submit / ERiC
- GDPR-Delete bewusst nicht gegen Tester-Accounts ausgeführt
- Beta-Slot-Vergabe nicht mit echten Invites spammt (nur Validierung getestet)
