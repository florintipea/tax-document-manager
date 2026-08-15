# Admin — Insights, Preise & Rabatte

**Stand:** 2026-08-01  
**Zugang:** Rolle `admin` / `super_admin` **nur** (z. B. lf.tipea@gmail.com).  
**Beta-Tester / Kunden:** sehen Produkt-UI, **nicht** Admin-Hub, Insights, Rabatt-Verwaltung oder Dual-View-Toggle.

**Dual-View + Security:** [`ADMIN-DUAL-VIEW.md`](./ADMIN-DUAL-VIEW.md)

## URLs (Admin-only)

| Bereich | URL |
|---------|-----|
| **Admin-Zentrale** | `/admin` |
| Preise & Rabatte | `/admin/preise` |
| Kundenansicht starten | `/admin/kundenansicht` |
| Bestehend | `/admin/support`, `/admin/beta-funnel`, … |

Öffentliche Produkt-URLs (alle Nutzer): `/`, `/pricing`, `/dashboard`, `/documents`, …  

## Enforcement

1. Middleware: Non-Admin auf `/admin/*` → `/dashboard`  
2. APIs: `getAdminSession()` auf allen `/api/admin/*` inkl. Promos & User-Discounts  
3. UI: Navbar-Admin-Chrome nur `isAdmin && !customerView`  
4. Kundenansicht-Leiste nur bei Admin-Session  

## Rabatt-Logik (Anzeige)

`/api/pricing/effective` — liest Rabatte (read); Mutationen nur Admin-APIs. Beta/Free bleibt 0 €.

## Modelle

- **PromoCampaign** — globale Aktion: `percentOff` und/oder `amountOff`, `startsAt`/`endsAt`, optional `code`, `active`
- **UserDiscount** — persönlicher Rabatt pro Nutzer (E-Mail), optional Ablauf, Grund

Migration: `prisma/migrations/20260801140000_promo_user_discounts/`

## APIs (nur Admin)

- `GET /api/admin/insights` — KPI-Aggregation + Verbesserungs-Hinweise im Hub
- `GET/POST /api/admin/promos`, `PATCH/DELETE /api/admin/promos/[id]`
- `GET/POST /api/admin/user-discounts`, `PATCH/DELETE /api/admin/user-discounts/[id]`

Öffentlich (angemeldet optional):

- `GET /api/pricing/effective?market=DE&code=BETA20` — Listenpreise nach Rabatt

## Rabatt-Logik

`lib/billing/discounts.ts`: aktiver User-Rabatt + gültige Promo. Bester Rabatt gewinnt. Anzeige auf `/pricing` inkl. Streichpreis. Beta/Free bleibt 0 €.

## Test — beide Modi

### Modus B (Admin)
1. Als Admin `/admin` → dunkler Header, KPIs, Signale, Werkzeuge  
2. `/admin/preise` → Aktion + Nutzer-Rabatt anlegen  
3. Bestehende Tools (Support, Funnel) über Hub öffnen  

### Modus A (Kunde)
1. Auf `/admin` → **„Jetzt als Kunde browsen“**  
2. Nav ohne Admin-Links; Hilfe-Chat sichtbar  
3. `/pricing`, `/documents`, `/steuererklaerung` wie Kunde  
4. Leiste **Admin-Zentrale** → zurück zu `/admin` (Kundenmodus aus)  

## Nicht enthalten (bewusst)

- Kein volles BI-Studio  
- Stripe-Coupon-Sync später  
