# TaxDoc Voice Reels (macOS `say` — kostenlos)

**Stimme:** `Anna` (de_DE, System) — kein ElevenLabs / OpenAI / Gemini.
**Musik:** `marketing/audio/taxdoc-calm-piano.aac` (Mixkit Piano Reflections), stark geduckt.

## Outputs

- `marketing/reel-voice-01/taxdoc-voice-01-grenzgaenger.mp4`
- `marketing/reel-voice-02/taxdoc-voice-02-masse.mp4`
- `marketing/reel-voice-03/taxdoc-voice-03-download-chaos.mp4`
- `marketing/reel-voice-04/taxdoc-voice-04-vorher-nachher.mp4`
- `marketing/reel-voice-05/taxdoc-voice-05-wer-sortiert.mp4`

## Neu erzeugen

```bash
say -v '?' | grep -i de   # Stimmen prüfen
.venv-marketing/bin/python marketing/scripts/generate_macos_voice_reels.py
```

## Rechtliches

- Unverbindlich / Beta — keine Steuerberatung.
- Keine Fake-ELSTER-Claims; Abgabe bleibt beim Nutzer.
- Scripts: `VIDEO-1-GRENZGAENGER.md`, `VIDEO-2-MASSE-ABO.md`.
