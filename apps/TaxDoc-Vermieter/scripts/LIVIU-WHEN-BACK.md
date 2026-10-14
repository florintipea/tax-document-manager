# Was Liviu lokal ausführen muss

Cloud hatte **kein** nutzbares `GITHUB_TOKEN` (nur Repo-scoped Agent-Token für `tax-document-manager`). Secrets nicht in Chat posten.

## A) Soft door + Monorepo-Stand schon auf Branch

```bash
cd /path/to/tax-document-manager
git fetch origin
git checkout cursor/taxdoc-vermieter-2in1-b1ef   # oder main nach Merge
# Review apps/TaxDoc-Vermieter + app/vermieter
```

TaxDoc Beta aktualisieren (wie gewohnt):

```bash
# .env muss GITHUB_TOKEN / GITHUB_USERNAME enthalten
npm run github:push
npm run render:deploy
```

Danach prüfen: `https://taxdoc-beta.onrender.com/vermieter`

## B) Eigenes Repo TaxDoc-Vermieter (bevorzugt langfristig)

```bash
cd /path/to/tax-document-manager/apps/TaxDoc-Vermieter

# Repo anlegen (gh CLI, Account florintipea)
gh repo create florintipea/TaxDoc-Vermieter --private --source=. --remote=origin --description "TaxDoc-Vermieter — Privatvermieter / Haus-und-Grund Pilot (parallel zu TaxDoc)"

# Falls Ordner noch kein git:
git init
git add .
git commit -m "Initial TaxDoc-Vermieter landing, pilot docs, legal"
git branch -M main
git push -u origin main
```

Oder mit dem bestehenden isomorphic-git Flow: Kopie nach eigenem Clone, `GITHUB_REPO=TaxDoc-Vermieter` setzen und pushen.

## C) Render Deploy für Vermieter-App

1. Render Dashboard → New → Blueprint, Repo `TaxDoc-Vermieter` **oder** Monorepo mit Root Directory `apps/TaxDoc-Vermieter`.
2. Service-Name: `taxdoc-vermieter` (siehe `render.yaml`).
3. Nach Live: URL in Soft Door `/vermieter` als optionalen Extern-Link eintragen (ENV oder Hardcode-Update).

## D) FounderBlocks

Datei öffnen: `docs/FOUNDERBLOCKS-DELAY-EMAIL.md`  
Platzhalter `[X Tage / auf DATUM]` ersetzen → senden.

## Nicht nötig in Cloud

- Secrets committen
- TaxDoc zu landlord-only umbauen
