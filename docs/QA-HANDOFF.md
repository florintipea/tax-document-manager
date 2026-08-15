# QA Handoff — Cloud + Local (2026-08-01)

## Cloud agent blocker (fixed)

- **Error:** `environment cloud requires exactly one known git remote; found 0`
- **Cause:** Workspace `.git/config` had **no remotes** (system `git` also blocked by Xcode license).
- **Fix:** Single remote via isomorphic-git:
  - `origin` → `https://github.com/florintipea/tax-document-manager.git`
- **Push:** `GITHUB_PUSH_WORKFLOWS=false npm run github:push` succeeded (PAT lacks `workflow` scope; add CI manually via `docs/CI-WORKFLOW-TO-ADD-MANUALLY.yml` if needed).
- Parent can **relaunch cloud** against this repo now.

## Live production

- **URL:** https://taxdoc-beta.onrender.com
- **Deploy:** `npm run render:deploy` → **live** (login-check 200)
- **Health:** `GET /api/health` → 200 `{ ok: true, status: "ready" }`
- Persistent disk: `taxdoc-data` → `/var/data`

## QA status (post-deploy)

| Suite | Result | Notes |
|-------|--------|--------|
| Fictional live QA | **44 PASS / 0 FAIL** | After Render deploy · tester002 · Max Mustermann (fictional) |
| Unit (`npm run test:unit`) | **32 PASS / 0 FAIL** | 10 files |
| ELSTER preview | PASS | **fields=25** anlagen=4 gaps=2 · export checklist 13 |
| AI | Expected | Without BYO key → `AI_NOT_CONFIGURED` |
| Local smoke `:3000` | N/A | Dev server not running; live QA covers production |

Details: `docs/INTERNAL-QA-FICTIONAL-PASS.md`

## ELSTER hardening included in this deploy

1. German errors / non-blocking categories on preview API  
2. Steuererklärung UI shows server error text  
3. Profile gaps / structured-data readiness in preview engine  
4. Ensure missing ELSTER tables on startup  
5. `npm run qa:fictional` regression script  

## Cloud next steps

1. Confirm exactly one remote: `origin` → florintipea/tax-document-manager  
2. Relaunch Cursor cloud agent (PC can be off; Render keeps serving)  
3. Optional: extend PAT with `workflow` scope, then push CI workflows  

## Limits (intentional)

- No fake ELSTER / ERiC submit  
- GDPR delete not run against tester accounts  
- P0-5 calculator precision deferred; P0-7 lawyer pack external  
