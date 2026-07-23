# KI-Steuer-Assistent einrichten

Kurzanleitung für den **KI-Steuer-Assistenten** in TaxDoc (Hilfsmittel — **keine Steuerberatung**).

## Wichtig vorab

| Thema | Klarstellung |
|--------|----------------|
| Cursor / Composer | **Nicht** die In-App-KI. Cursor-Zugangsdaten lassen sich **nicht** in TaxDoc einfügen. |
| API-Schlüssel | Sie brauchen einen eigenen Schlüssel bei **OpenAI**, **Anthropic** oder **Google AI**. |
| Wohin mit dem Schlüssel? | Nur in der App: **Einstellungen → KI-Anbieter**. **Niemals** in den Cursor-Chat oder in Git. |
| Rechtliches | Der Assistent ist ein **Hilfsmittel**. Er ersetzt **keinen** Steuerberater (StBerG). Antworten prüfen; keine Haftung für Entscheidungen. |

Live-App (Beta): https://taxdoc-beta.onrender.com

---

## Einmalig: Schlüssel holen und in TaxDoc speichern

### 1. Account in der App

1. Öffnen Sie https://taxdoc-beta.onrender.com  
2. Melden Sie sich an (Admin: die E-Mail aus `ADMIN_EMAIL` auf Render, Passwort aus `ADMIN_PASSWORD` — nicht hier notieren).  
3. Optional: unter **Einstellungen → Steuerprofil** Steuerklasse, Bundesland usw. pflegen (verbessert den Assistenten-Kontext).

### 2. API-Schlüssel beim Anbieter erstellen

Wählen Sie **einen** Anbieter:

- **OpenAI:** https://platform.openai.com/api-keys → Create new secret key  
- **Anthropic (Claude):** https://console.anthropic.com/ → API Keys  
- **Google AI (Gemini):** https://aistudio.google.com/apikey  

Den Schlüssel nur kurz sichtbar halten und **sofort** in TaxDoc einfügen.

### 3. In TaxDoc verbinden

1. **Einstellungen → KI-Anbieter** (`/settings/ai`)  
2. Anbieter wählen → API-Schlüssel einfügen → verbinden  
3. Optional **Verbindung testen**  
4. **KI-Steuer-Assistent** öffnen (`/ai-assistant`) und eine Frage stellen  

Wenn kein Schlüssel hinterlegt ist (und auch kein Server-Fallback), zeigt die Seite einen Hinweis mit Link zu den KI-Anbietern.

---

## Was der Assistent nutzt

- Ihren (oder optional serverweiten) Provider-Schlüssel  
- Land / Sprache  
- **Steuerprofil** (Steuerklasse, Bundesland, Kinder, Veranlagung, …)  
- **Metadaten** der letzten Dokumente (Name, Jahr, Kategorie, Betrag — **keine** Rohdateien im Prompt)

---

## Optional: Server-Fallback (Render)

Nur für Betreiber: in der Render-Umgebung eines der Secrets setzen und neu deployen:

- `OPENAI_API_KEY`  
- `ANTHROPIC_API_KEY`  
- `GOOGLE_AI_API_KEY`  

Nutzer-Schlüssel in den Einstellungen haben Vorrang. Für den Admin-Alltag reicht meist der eigene Schlüssel in der App.

---

## Checkliste

- [ ] OpenAI / Anthropic / Google-Schlüssel erstellt  
- [ ] Schlüssel nur unter **Einstellungen → KI-Anbieter** eingefügt (nicht in Cursor)  
- [ ] Optional Steuerprofil ausgefüllt  
- [ ] Chat unter **KI-Steuer-Assistent** getestet  
- [ ] Klar: Hilfsmittel, keine Steuerberatung  

Weitere Ops-Hinweise: `docs/cloud/CLOUD-HOSTING.txt`
