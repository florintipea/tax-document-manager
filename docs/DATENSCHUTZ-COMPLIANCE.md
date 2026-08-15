# TaxDoc — DSGVO / Datenschutz Compliance

**Status:** Beta-Baseline (technisch umgesetzt). **Keine Rechtsberatung.** Vor Produktivbetrieb Anwalt prüfen.

**Kontakt (Datenschutz / Betroffene):** lf.tipea@gmail.com

---

## Checklist

| # | Thema | Status | Hinweis |
|---|--------|--------|---------|
| 1 | Datenschutz-Seite `/legal/datenschutz` | ✅ Done | Struktur + Zwecke, Speicherdauer, Auftragsverarbeiter, Rechte, Cookies, KI-Keys |
| 2 | Impressum `/legal/impressum` | ✅ Done | Liviu Florin Tipea, Sigismundstrasse 19, 78462 Konstanz; E-Mail lf.tipea@gmail.com; Handelsregister/USt-IdNr. ggf. noch ergänzen |
| 3 | Cookie-/Hinweis-Banner | ✅ Done | Nur notwendige Session-Cookies; Info + Bestätigung (kein Marketing-Tracking) |
| 4 | Speicherdauer (Retention) | ✅ Done (Text) | In Datenschutzerklärung beschrieben — Fristen mit Anwalt finalisieren |
| 5 | KI-API-Keys Speicherung | ✅ Done | AES-256-GCM (`ENCRYPTION_KEY` / Fallback); Keys nicht im Klartext |
| 6 | Logs | ⚠️ Partial | App-Logs ohne bewusstes PII-Dumping; Hosting-Logs (Render) prüfen |
| 7 | Tester-E-Mails / Admin | ✅ Noted | Admin-Rollen + Testphase; Zugriff begrenzen und regelmäßig revuen |
| 8 | Auftragsverarbeiter (Render, KI, Stripe) | ⚠️ Needs lawyer | AV-Verträge / DPA mit Render & ggf. Stripe; KI-Anbieter über Nutzer-Keys |
| 9 | Datenexport (Art. 20) | ✅ Done | `GET /api/user/export` + UI in Einstellungen → Datenschutz |
| 10 | Kontolöschung (Art. 17) | ✅ Done | `DELETE /api/user/delete` (Passwort-Bestätigung) + Dateien löschen |
| 11 | Automatischer Compliance-Check | ✅ Done | `npm run check:compliance` (CI) |
| 12 | Falsche Steuerberater-Claims | ✅ Guard | Script prüft gefährliche Formulierungen |

---

## Done (technisch)

- Legal-Routen und Footer-Links
- Erweiterte Datenschutztexte (DE/EN): Zwecke, Rechtsgrundlagen-Hinweis, Speicherdauer, Subprozessoren, Rechte, Cookies, KI
- Cookie-Hinweis (notwendig)
- Self-service **Datenexport** und **Konto löschen**
- Security-Header (CSP, HSTS, …)
- Verschlüsselte Speicherung von Integrations-/KI-Credentials
- Compliance-Skript + monatlicher Security-Review-Prozess (`docs/SECURITY-MONTHLY.md`)

---

## Lawyer review (required)

1. **Impressum:** ladungsfähige Anschrift hinterlegt; ggf. Handelsregister, USt-IdNr., Verantwortlicher i.S.d. TMG/DDG final prüfen
2. **AV-Vertrag / DPA** mit **Render** (Hosting, Persistenz)
3. **Stripe** (falls Zahlungen live) — Auftragsverarbeitung / SCC falls relevant
4. Finaler Text der Datenschutzerklärung (Rechtsgrundlagen Art. 6 Abs. 1 lit. b/f/a, Speicherdauern, Drittlandtransfers zu KI-Anbietern)
5. Ob Session-Cookie-Hinweis reicht oder Cookie-Banner nach TTDSG anders ausgestaltet werden muss
6. Löschkonzepte vs. steuerliche Aufbewahrungspflichten der Nutzer (Hinweispflicht)

---

## Subprozessoren / Dienste (Stand Beta)

| Dienst | Zweck | Daten | Hinweis |
|--------|-------|-------|---------|
| Render | Hosting, SQLite/Volume, Logs | Account-, App-Daten | AV-Vertrag ausstehend |
| OpenAI / Anthropic / Google | KI (nur wenn Nutzer Key verbindet) | Prompt-/Dokumentausschnitte je Nutzung | Nutzer-Key; Drittland möglich |
| Stripe | Zahlungen (wenn konfiguriert) | Billing-Metadaten | Nur bei Checkout |
| Eigene SQLite + Uploads | Primärspeicher | Profile, Belege | `DATA_DIR` / Volume |

---

## Automatisierung

```bash
npm run check:compliance
```

CI führt den Check bei jedem Push aus. Monatliche Security-Checks: `.github/workflows/security-monthly.yml` und `docs/SECURITY-MONTHLY.md`.

**Nicht Bestandteil:** Angriffs-/Exploit-Simulationen gegen Produktion. Defensive Checks und professioneller Pentest (extern) empfohlen.
