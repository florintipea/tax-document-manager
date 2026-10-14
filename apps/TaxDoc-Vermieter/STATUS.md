# TaxDoc-Vermieter — STATUS

**Stand:** Cloud-Agent Setup (Laptop zu) · Branch `cursor/taxdoc-vermieter-2in1-b1ef`  
**Modell:** 2 Apps, 1 GitHub-Account („2 in 1“)

## Paths

| Was | Pfad |
|-----|------|
| Diese App (monorepo staging) | `apps/TaxDoc-Vermieter/` |
| Landing | `apps/TaxDoc-Vermieter/app/page.tsx` → `/` |
| Pilot-UI | `apps/TaxDoc-Vermieter/app/pilot/page.tsx` → `/pilot` |
| Legal-UI | `apps/TaxDoc-Vermieter/app/legal/page.tsx` → `/legal` |
| Pilot-Doc | `apps/TaxDoc-Vermieter/docs/PILOT-4-WEEKS.md` |
| FounderBlocks Delay-Mail | `apps/TaxDoc-Vermieter/docs/FOUNDERBLOCKS-DELAY-EMAIL.md` |
| Legal-Doc | `apps/TaxDoc-Vermieter/docs/LEGAL.md` |
| Render Blueprint | `apps/TaxDoc-Vermieter/render.yaml` |
| Soft door in TaxDoc | `/vermieter` → `app/vermieter/page.tsx` |
| TaxDoc Haupt-Repo | `florintipea/tax-document-manager` |
| TaxDoc Beta (CTA) | https://taxdoc-beta.onrender.com |
| Ziel Sibling-Repo | `florintipea/TaxDoc-Vermieter` (**noch nicht erstellt** — kein `GITHUB_TOKEN` in Cloud) |

## Build check (Cloud)

- `npm install && npm run build` in `apps/TaxDoc-Vermieter` — OK (/, /pilot, /legal static)
- Local smoke: HTTP 200 on `/`, `/pilot`, `/legal`

## Deploy status

| Ziel | Status |
|------|--------|
| Commit + Push Branch in tax-document-manager | siehe PR / Branch |
| Sibling GitHub-Repo `TaxDoc-Vermieter` | **offen** — Liviu lokal (kein GITHUB_TOKEN in Cloud) |
| Render Service `taxdoc-vermieter` | **offen** — Liviu nach Repo/Blueprint |
| TaxDoc Beta Redeploy für `/vermieter` Soft Door | **offen** — `npm run github:push` / `npm run render:deploy` lokal |

## Next steps für Liviu (Laptop auf)

Vollständige Befehle: `scripts/LIVIU-WHEN-BACK.md`.

1. `.env` mit `GITHUB_TOKEN` + `GITHUB_USERNAME` laden.
2. Optional Sibling-Repo anlegen und Inhalt aus `apps/TaxDoc-Vermieter` pushen.
3. Render: Blueprint `taxdoc-vermieter` **oder** Docker-Service mit Root = App-Ordner.
4. TaxDoc main: Branch mergen + `npm run render:deploy` (damit `/vermieter` live ist).
5. FounderBlocks: Delay-Mail aus `docs/FOUNDERBLOCKS-DELAY-EMAIL.md` anpassen und senden.

## Invariants

- TaxDoc bleibt Full Product (nicht landlord-only).
- TaxDoc-Vermieter = paralleler Track.
- Claims: Hilfsmittel · keine Steuerberatung · kein ELSTER-Auto-Submit.
