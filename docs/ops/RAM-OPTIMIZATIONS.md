# RAM optimizations (Render Starter ~512 MB)

Goal: **same features and extraction quality**, lower peak heap.
Large batches may run more serially / in packets; results still complete.

Live: https://taxdoc-beta.onrender.com

## NODE_OPTIONS = 384

`NODE_OPTIONS=--max-old-space-size=384` is set in:

- `Dockerfile`
- `render.yaml`
- `scripts/start-production.sh` (default if unset)
- `scripts/render-deploy.mjs` (ensures env on deploy)

**Why 384 (not higher):** Render Starter / Free have **512 MB RSS**. V8 heap is only
part of RSS (native pdf.js worker, SQLite/Prisma, Next.js, OS). Raising the heap
toward 512 MB increases OOM-killer risk. 384 MB leaves headroom for non-JS memory.

Do **not** raise this without upgrading the instance type.

## What changed (this pass)

| Area | Change |
|------|--------|
| Document list / detail / upload responses | Never return `extractedText` / `extractedData` by default (`formatDocumentResponse`) |
| Batch autofill | Metadata-only candidate query; **fetch text per doc**; **concurrency 1**; clear text after each file |
| Reanalyze | Load IDs first, then one document at a time (no bulk `extractedText`) |
| Duplicate detection | Exact `fileHash` / `contentHash` queries first; text similarity capped (200); legacy disk hash streamed (≤40) |
| PDF extract | Page-limited (`first: 40`, env `PDF_EXTRACT_MAX_PAGES`) + char cap; parser `destroy()` |
| Analyze / upload | Skip full PDF re-read when text exists; drop `Buffer` after write/extract |
| File download | **Stream** from disk (`createReadStream`) instead of `readFile` into heap |
| Rate-limit memory map | `TtlMap` with max keys + TTL prune (`lib/utils/ttl-map.ts`) |
| Notebook LM sync | Slim `select` (only fields needed for sync) |
| ELSTER preview docs | Cap `take: 500`, no heavy columns |
| Next.js | `serverExternalPackages`: `pdf-parse`, `pdfjs-dist` |

## Already in place (prior OOM pass)

- Upload / batch packet caps (`uploadLimits`)
- Skip tester re-sync on every restart (flag file)
- In-memory rate-limit key cap
- List API omits heavy columns
- Health exposes `heapUsedMb` / `heapTotalMb`

## If OOM emails continue

Code hardenings reduce peaks; they do **not** replace RAM under real multi-user load
or pathological huge PDFs.

→ Upgrade Render instance to **Standard (2 GB)** in dashboard → Settings → Instance Type.
Do not rely on Free/Starter for production multi-user traffic.

See also: `docs/cloud/CLOUD-HOSTING.txt` → “Memory / OOM on Starter”.
