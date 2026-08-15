# Admin Dual-View — Kundenansicht vs Admin-Zentrale

**Stand:** 2026-08-01  
**Kernprinzip:** Zwei klar getrennte Erlebnisse für denselben **Admin**-Account.

---

## Sicherheit (verbindlich)

| Schicht | Regel |
|---------|--------|
| **Middleware** | `/admin/*` → nur `admin` / `super_admin`; sonst Redirect `/dashboard` |
| **APIs** | Jede `/api/admin/*` und Rabatt-Mutation: `getAdminSession()` → 403 für Nicht-Admins |
| **Navbar** | Admin-Links / Glocke / Hub nur bei `isAdmin` (in Kundenansicht ausgeblendet) |
| **Kundenansicht-Leiste** | Nur wenn Session-Rolle Admin; normale Tester sehen sie nie |
| **Rabatte verwalten** | Nur `/admin/preise` + Admin-APIs — nicht in der Kunden-UI |

**Produkt-UI** (Dashboard, Pricing, Belege, …) bleibt für alle Tester normal nutzbar.  
**Admin-Abteilung** (Hub, Insights, Discounts, Dual-View-Toggle) ist **ausschließlich Admin**.

Cookie `taxdoc_kundenansicht` allein gibt keine Rechte — ohne Admin-Rolle keine Admin-UI und keine Admin-APIs.

---

## Modus A — Kundenansicht (nur Admin kann umschalten)

**Zweck:** UX-QA — Produkt genau so erleben wie Kunden.

| | |
|--|--|
| **Start** | Admin-Zentrale → **„Kundenansicht“** oder `/admin/kundenansicht` (Admin-only) |
| **Persistenz** | Cookie + sessionStorage |
| **Chrome** | Kunden-Nav; **keine** Admin-Links |
| **Leiste** | „Admin: Kundenansicht aktiv“ → Admin-Zentrale |

---

## Modus B — Admin-Ansicht

**Zweck:** Ops & Produktiteration — nur Admin.

Einstieg: `/admin`. Unterseiten: `/admin/preise`, Support, Funnel, Reports, …

Details Rabatte: [`ADMIN-INSIGHTS-DISCOUNTS.md`](./ADMIN-INSIGHTS-DISCOUNTS.md)
