# TaxDoc-Vermieter

Separater Pilot-Track für **Privatvermieter / Haus-und-Grund** — parallel zu [TaxDoc](https://github.com/florintipea/tax-document-manager), nicht als Rewrite.

- Landing: `/`
- 4-Wochen-Pilot: `/pilot` + `docs/PILOT-4-WEEKS.md`
- FounderBlocks Delay-Mail: `docs/FOUNDERBLOCKS-DELAY-EMAIL.md`
- Legal: `/legal` + `docs/LEGAL.md`
- Product/Beta-CTA: https://taxdoc-beta.onrender.com

## Local

```bash
cd apps/TaxDoc-Vermieter   # or repo root if extracted
npm install
npm run dev                # http://localhost:3010
```

## Deploy (Render)

`render.yaml` defines service `taxdoc-vermieter` (Docker, Frankfurt).  
Root directory must be this app if the Blueprint is connected from the monorepo.

## Sibling repo (preferred long-term)

See `STATUS.md` and `scripts/LIVIU-WHEN-BACK.md` for creating `florintipea/TaxDoc-Vermieter` with the local `GITHUB_TOKEN`.
