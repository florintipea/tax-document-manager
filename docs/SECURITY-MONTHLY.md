# TaxDoc — Monatlicher Security-Review (defensiv)

**Ziel:** Starke Baseline + kontinuierliche Überwachung.  
**Klarstellung:** Keine App ist „100 %“ oder „1000 %“ sicher. Pen-Tests mit Angriffswerkzeugen gegen Produktion sind **außerhalb** dieses Agenten-/Repo-Prozesses. Bei Bedarf externen Professionellen beauftragen.

---

## Automatisiert (wöchentlich / monatlich via GitHub Actions)

| Check | Befehl / Job | Zweck |
|-------|----------------|-------|
| Produktions-Dependencies | `npm audit --omit=dev` | Bekannte CVEs |
| Veraltete Pakete | `npm outdated` (Report) | Patch-Planung |
| Compliance | `npm run check:compliance` | Legal-Routen, Export/Delete, Header |
| Lint (optional) | `npm run lint` | Codequalität |
| Typecheck (optional) | `npx tsc --noEmit` | Typfehler |

Workflow: `.github/workflows/security-monthly.yml`  
CI-Push: `.github/workflows/ci.yml` (Compliance + Audit)

---

## Manueller Monats-Checklist (OWASP-Stil, **ohne** Exploits)

1. **Dependencies:** `npm outdated`, sinnvolle Updates (bes. `next`, Auth, Prisma)
2. **Render-Env:** Secrets rotieren bei Verdacht; `NEXTAUTH_SECRET`, `ENCRYPTION_KEY`, Admin-Passwörter; keine Secrets in Logs
3. **Zugriff:** Admin-Konten, Tester-E-Mails, Testphase-Flags prüfen
4. **Logs:** Render-Logs auf Anomalien (ohne unnötige PII)
5. **Auth:** Login-Lockout, 2FA, Session-Cookies (HttpOnly/Secure) noch aktiv?
6. **Upload:** Magic-Byte-/MIME-Checks, Größenlimits
7. **SQLite / `DATA_DIR`:** Persistentes Volume, Backups, Dateirechte
8. **KI-Keys:** Nur verschlüsselt; Nutzer kann Keys entfernen
9. **Headers:** CSP/HSTS über Live-Response stichprobenartig prüfen (`curl -I`)
10. **DSGVO:** Export/Löschen manuell testen; Impressum-Adresse hinterlegt (Handelsregister/USt ggf. offen)

### OWASP Top 10 — defensive Fragen (kein Exploit)

| Thema | Frage |
|-------|--------|
| Broken Access Control | Geschützte Routen ohne Session erreichbar? Admin nur für Admins? |
| Cryptographic Failures | Secrets in Repo? Keys im Klartext in DB? |
| Injection | Zod-Validierung an APIs? SQL nur via Prisma? |
| Insecure Design | Rate Limits an Login/AI/Upload? |
| Security Misconfiguration | `poweredByHeader` aus? Debug in Prod aus? |
| Vulnerable Components | `npm audit` monatlich? |
| Auth Failures | Lockout, 2FA, starke Passwort-Hashes (bcrypt)? |
| Integrity | Dependencies aus Lockfile (`npm ci`)? |
| Logging | Fehler geloggt ohne Secrets? |
| SSRF | Keine ungeprüften URL-Fetches aus User-Input? |

---

## Explizit out of scope für diesen Prozess

- Schreiben oder Ausführen von Exploits / PoCs / Malware  
- Angriffe auf Production (`taxdoc-beta.onrender.com`) oder lokale Endpoints mit Attack-Payloads  
- „Red Team“-Simulationen mit aktuellen Angriffsmethoden  

**Empfehlung:** Einmal jährlich (oder vor Go-Live) professionellen Penetrationstest durch einen Dienstleister.

---

## Nach dem Review

- Findings in Issues tracken  
- Kritische Patches zeitnah deployen  
- `docs/DATENSCHUTZ-COMPLIANCE.md` aktualisieren, wenn sich Subprozessoren ändern  
