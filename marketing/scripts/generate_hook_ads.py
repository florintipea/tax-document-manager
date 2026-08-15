#!/usr/bin/env python3
"""Generate 5 short TaxDoc hook ads (8–12s, 1080×1920) from worldclass playbook.

Reuses reel-04 visual pipeline + Mixkit calm piano bed.
Output: marketing/reel-hook-01 … 05
"""

from __future__ import annotations

import sys
from pathlib import Path

# Import shared helpers from generate_short_reels
SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from generate_short_reels import (  # noqa: E402
    BED,
    CHAOS_BOT,
    CHAOS_TOP,
    FONT_BLACK,
    FONT_BOLD,
    FONT_REG,
    GREEN,
    MARKETING,
    MUTED,
    NAVY_BOT,
    NAVY_MID,
    NAVY_TOP,
    OFF_WHITE,
    ROOT,
    WHITE,
    brand_header,
    centered_text,
    concat_mp4,
    cta_box,
    draw_dots,
    font,
    gradient,
    multiline_centered,
    pill,
    save,
)

from PIL import Image, ImageDraw  # noqa: E402


BASE_URL = "https://taxdoc-beta.onrender.com/beta-anfrage"
UTM_BASE = "utm_source=meta&utm_medium=paid&utm_campaign=beta_14d"


def chaos_bars(draw: ImageDraw.ImageDraw) -> None:
    for x, y, ww, hh, color in [
        (180, 1280, 280, 40, (240, 230, 220)),
        (520, 1340, 320, 36, (220, 210, 200)),
        (240, 1420, 260, 32, (200, 190, 180)),
        (480, 1480, 300, 34, (230, 220, 210)),
        (200, 1560, 340, 30, (210, 200, 190)),
    ]:
        draw.rounded_rectangle([x, y, x + ww, y + hh], radius=6, fill=color)


def order_icons(draw: ImageDraw.ImageDraw, cy: int = 1180) -> None:
    labels = ["Upload", "KI", "Überblick"]
    gap = 320
    start_x = 540 - gap
    for i, label in enumerate(labels):
        cx = start_x + i * gap
        draw.ellipse([cx - 48, cy - 48, cx + 48, cy + 48], outline=GREEN, width=5)
        f = font(FONT_BOLD, 28 if len(label) > 6 else 32)
        from generate_short_reels import text_size

        tw, th = text_size(draw, label, f)
        draw.text((cx - tw // 2, cy - th // 2 - 2), label, font=f, fill=WHITE)
        if i < 2:
            draw.line([cx + 58, cy, cx + gap - 58, cy], fill=MUTED, width=3)


def slide_solution_upload(out: Path, subtitle: str = "Hochladen. KI sortiert. Überblick.") -> tuple[Path, float]:
    img = gradient(NAVY_TOP, NAVY_BOT, NAVY_MID)
    draw = ImageDraw.Draw(img)
    draw_dots(draw, (860, 80))
    brand_header(draw)
    pill(draw, "HILFSMITTEL · KEINE STEUERBERATUNG", 250, font(FONT_BOLD, 22))
    y = multiline_centered(
        draw,
        [
            ("TaxDoc", font(FONT_BLACK, 96), WHITE),
            ("schafft Ordnung.", font(FONT_BLACK, 64), GREEN),
        ],
        480,
        gap=18,
    )
    draw.rectangle([340, y + 16, 740, y + 22], fill=GREEN)
    lines = [(p.strip() + ("" if p.strip().endswith(".") else "."), font(FONT_BOLD, 44), WHITE) for p in subtitle.split(".") if p.strip()]
    if not lines:
        lines = [
            ("Hochladen.", font(FONT_BOLD, 48), WHITE),
            ("KI sortiert.", font(FONT_BOLD, 48), WHITE),
            ("Überblick behalten.", font(FONT_BOLD, 48), WHITE),
        ]
    multiline_centered(draw, lines[:3], y + 60, gap=16)
    centered_text(draw, "DE-first · Belege digital", 1680, font(FONT_REG, 32), MUTED)
    p = out / "slide-02-solution.png"
    save(img, p)
    return p, 4.5


def slide_cta(out: Path, line1: str = "Beta gratis", line2: str = "testen.", footer: str = "Kein Abo-Zwang · Feedback willkommen") -> tuple[Path, float]:
    img = gradient(NAVY_TOP, NAVY_BOT, NAVY_MID)
    draw = ImageDraw.Draw(img)
    draw_dots(draw, (860, 80))
    brand_header(draw)
    multiline_centered(
        draw,
        [
            (line1, font(FONT_BLACK, 80), GREEN),
            (line2, font(FONT_BLACK, 72), WHITE),
        ],
        380,
        gap=8,
    )
    cta_box(
        draw,
        [
            ("→ beta-anfrage", font(FONT_BLACK, 56), GREEN),
            ("taxdoc-beta.onrender.com", font(FONT_REG, 28), MUTED),
            ("In ~30 Sek. anfragen", font(FONT_BOLD, 32), WHITE),
        ],
        980,
    )
    centered_text(draw, footer, 1480, font(FONT_REG, 30), OFF_WHITE)
    centered_text(draw, "TaxDoc Beta · jetzt starten", 1700, font(FONT_BOLD, 34), WHITE)
    p = out / "slide-03-cta.png"
    save(img, p)
    return p, 3.0


# ─── Hook builders ───────────────────────────────────────────────────────────


def hook01_download(out: Path) -> list[tuple[Path, float]]:
    slides: list[tuple[Path, float]] = []

    # Hook 0–2
    img = gradient(CHAOS_TOP, CHAOS_BOT, (70, 24, 36))
    draw = ImageDraw.Draw(img)
    draw_dots(draw, (860, 80), (120, 60, 80))
    chaos_bars(draw)
    brand_header(draw, compact=True)
    y = multiline_centered(
        draw,
        [
            ("Steuer-PDFs im", font(FONT_BLACK, 64), WHITE),
            ("Download-", font(FONT_BLACK, 92), WHITE),
            ("CHAOS?", font(FONT_BLACK, 120), GREEN),
        ],
        420,
        gap=6,
    )
    centered_text(draw, "Suchen. Tippen. Verlieren.", y + 36, font(FONT_BOLD, 40), OFF_WHITE)
    p = out / "slide-01-hook.png"
    save(img, p)
    slides.append((p, 2.0))

    # Agitate 2–4 (short beat)
    img = gradient(CHAOS_TOP, CHAOS_BOT, (55, 20, 30))
    draw = ImageDraw.Draw(img)
    brand_header(draw, compact=True)
    multiline_centered(
        draw,
        [
            ("Suchen.", font(FONT_BLACK, 88), WHITE),
            ("Tippen.", font(FONT_BLACK, 88), WHITE),
            ("Verlieren.", font(FONT_BLACK, 88), GREEN),
        ],
        620,
        gap=20,
    )
    p = out / "slide-01b-agitate.png"
    save(img, p)
    slides.append((p, 2.0))

    slides.append(slide_solution_upload(out, "Hochladen. KI sortiert. Überblick."))
    slides.append(slide_cta(out, "Beta gratis", "→ Link", "Kein Abo-Zwang · Hilfsmittel, keine Beratung."))
    return slides


def hook02_before_after(out: Path) -> list[tuple[Path, float]]:
    slides: list[tuple[Path, float]] = []

    img = gradient(CHAOS_TOP, CHAOS_BOT, (70, 24, 36))
    draw = ImageDraw.Draw(img)
    chaos_bars(draw)
    brand_header(draw, compact=True)
    multiline_centered(
        draw,
        [
            ("Vorher:", font(FONT_BOLD, 56), OFF_WHITE),
            ("Schuhkarton.", font(FONT_BLACK, 110), WHITE),
        ],
        560,
        gap=12,
    )
    p = out / "slide-01-hook.png"
    save(img, p)
    slides.append((p, 2.0))

    img = gradient(NAVY_TOP, NAVY_BOT, NAVY_MID)
    draw = ImageDraw.Draw(img)
    draw_dots(draw, (860, 80))
    brand_header(draw, compact=True)
    multiline_centered(
        draw,
        [
            ("Nachher:", font(FONT_BOLD, 56), MUTED),
            ("ein Ort.", font(FONT_BLACK, 120), GREEN),
        ],
        520,
        gap=12,
    )
    centered_text(draw, "TaxDoc · Belege digital", 820, font(FONT_BOLD, 40), OFF_WHITE)
    p = out / "slide-01b-after.png"
    save(img, p)
    slides.append((p, 2.5))

    img = gradient(NAVY_TOP, NAVY_BOT, NAVY_MID)
    draw = ImageDraw.Draw(img)
    brand_header(draw)
    pill(draw, "BETA · KOSTENLOS TESTEN", 260, font(FONT_BOLD, 26))
    multiline_centered(
        draw,
        [
            ("Upload · KI · Überblick", font(FONT_BLACK, 52), WHITE),
        ],
        520,
        gap=10,
    )
    order_icons(draw, 900)
    centered_text(draw, "Fair: du prüfst selbst.", 1200, font(FONT_BOLD, 36), OFF_WHITE)
    p = out / "slide-02-proof.png"
    save(img, p)
    slides.append((p, 3.0))

    slides.append(slide_cta(out, "Beta gratis", "anfragen.", "Fair: du prüfst selbst."))
    return slides


def hook03_selbststaendig(out: Path) -> list[tuple[Path, float]]:
    slides: list[tuple[Path, float]] = []

    img = gradient(CHAOS_TOP, CHAOS_BOT, (60, 22, 34))
    draw = ImageDraw.Draw(img)
    brand_header(draw, compact=True)
    y = multiline_centered(
        draw,
        [
            ("Selbstständig", font(FONT_BLACK, 72), WHITE),
            ("& Belege", font(FONT_BLACK, 88), WHITE),
            ("überall?", font(FONT_BLACK, 110), GREEN),
        ],
        480,
        gap=8,
    )
    centered_text(draw, "Ganzjährig — nicht nur im März.", y + 40, font(FONT_BOLD, 36), OFF_WHITE)
    p = out / "slide-01-hook.png"
    save(img, p)
    slides.append((p, 2.2))

    img = gradient(NAVY_TOP, NAVY_BOT, NAVY_MID)
    draw = ImageDraw.Draw(img)
    brand_header(draw)
    multiline_centered(
        draw,
        [
            ("Ganzjährig,", font(FONT_BLACK, 72), WHITE),
            ("nicht nur im März.", font(FONT_BLACK, 56), GREEN),
        ],
        560,
        gap=16,
    )
    centered_text(draw, "Belege stapeln sich das ganze Jahr.", 820, font(FONT_BOLD, 36), OFF_WHITE)
    p = out / "slide-01b-pain.png"
    save(img, p)
    slides.append((p, 2.5))

    img = gradient(NAVY_TOP, NAVY_BOT, NAVY_MID)
    draw = ImageDraw.Draw(img)
    draw_dots(draw, (860, 80))
    brand_header(draw)
    pill(draw, "HILFSMITTEL · KEINE STEUERBERATUNG", 250, font(FONT_BOLD, 22))
    multiline_centered(
        draw,
        [
            ("TaxDoc Beta", font(FONT_BLACK, 80), WHITE),
            ("hält Unterlagen", font(FONT_BLACK, 64), WHITE),
            ("zusammen.", font(FONT_BLACK, 64), GREEN),
        ],
        480,
        gap=12,
    )
    multiline_centered(
        draw,
        [
            ("Hochladen.", font(FONT_BOLD, 48), WHITE),
            ("KI zuordnen.", font(FONT_BOLD, 48), WHITE),
            ("Überblick behalten.", font(FONT_BOLD, 48), WHITE),
        ],
        900,
        gap=16,
    )
    p = out / "slide-02-solution.png"
    save(img, p)
    slides.append((p, 4.0))
    slides.append(slide_cta(out, "Jetzt Beta", "anfragen", "Kein Steuerberater-Ersatz."))
    return slides


def hook04_ugc(out: Path) -> list[tuple[Path, float]]:
    slides: list[tuple[Path, float]] = []

    img = gradient(NAVY_TOP, NAVY_BOT, (8, 56, 140))
    draw = ImageDraw.Draw(img)
    brand_header(draw, compact=True)
    y = multiline_centered(
        draw,
        [
            ("Wer sortiert", font(FONT_BLACK, 80), WHITE),
            ("eigentlich", font(FONT_BLACK, 80), WHITE),
            ("eure Belege?", font(FONT_BLACK, 88), GREEN),
        ],
        480,
        gap=10,
    )
    centered_text(draw, "Ehrlich gefragt.", y + 40, font(FONT_BOLD, 36), MUTED)
    p = out / "slide-01-hook.png"
    save(img, p)
    slides.append((p, 2.2))

    img = gradient(CHAOS_TOP, CHAOS_BOT, (55, 20, 30))
    draw = ImageDraw.Draw(img)
    brand_header(draw, compact=True)
    multiline_centered(
        draw,
        [
            ("Genau.", font(FONT_BLACK, 100), WHITE),
            ("Niemand.", font(FONT_BLACK, 110), GREEN),
        ],
        620,
        gap=16,
    )
    p = out / "slide-01b-twist.png"
    save(img, p)
    slides.append((p, 2.3))

    img = gradient(NAVY_TOP, NAVY_BOT, NAVY_MID)
    draw = ImageDraw.Draw(img)
    brand_header(draw)
    pill(draw, "DESHALB: TAXDOC BETA", 260, font(FONT_BOLD, 26))
    multiline_centered(
        draw,
        [
            ("Hochladen", font(FONT_BOLD, 56), WHITE),
            ("→ KI sortiert", font(FONT_BOLD, 56), WHITE),
            ("→ Überblick", font(FONT_BOLD, 56), GREEN),
        ],
        520,
        gap=22,
    )
    centered_text(draw, "Feedback willkommen.", 1100, font(FONT_BOLD, 36), OFF_WHITE)
    p = out / "slide-02-demo.png"
    save(img, p)
    slides.append((p, 4.0))

    slides.append(slide_cta(out, "Beta gratis", "holen.", "Feedback willkommen."))
    return slides


def hook05_offer_trust(out: Path) -> list[tuple[Path, float]]:
    slides: list[tuple[Path, float]] = []

    img = gradient(NAVY_TOP, NAVY_BOT, (8, 56, 140))
    draw = ImageDraw.Draw(img)
    brand_header(draw, compact=True)
    multiline_centered(
        draw,
        [
            ("Beta gratis.", font(FONT_BLACK, 96), GREEN),
            ("Kein Abo-Druck.", font(FONT_BLACK, 72), WHITE),
        ],
        540,
        gap=16,
    )
    p = out / "slide-01-hook.png"
    save(img, p)
    slides.append((p, 2.0))

    img = gradient(NAVY_TOP, NAVY_BOT, NAVY_MID)
    draw = ImageDraw.Draw(img)
    brand_header(draw)
    pill(draw, "DOKUMENTE SORTIEREN — HILFSMITTEL", 250, font(FONT_BOLD, 22))
    multiline_centered(
        draw,
        [
            ("Belege · KI · Schätzung", font(FONT_BLACK, 52), WHITE),
        ],
        520,
        gap=10,
    )
    order_icons(draw, 820)
    centered_text(draw, "Hilfsmittel — keine Beratung.", 1100, font(FONT_BOLD, 34), OFF_WHITE)
    p = out / "slide-02-what.png"
    save(img, p)
    slides.append((p, 3.5))

    img = gradient(NAVY_TOP, NAVY_BOT, (0, 36, 80))
    draw = ImageDraw.Draw(img)
    brand_header(draw, compact=True)
    multiline_centered(
        draw,
        [
            ("Abgabe über dich", font(FONT_BLACK, 64), WHITE),
            ("(z. B. Mein ELSTER)", font(FONT_BOLD, 44), MUTED),
        ],
        620,
        gap=18,
    )
    centered_text(draw, "Klarer Disclaimer. Kein Fake-Submit.", 900, font(FONT_BOLD, 34), OFF_WHITE)
    p = out / "slide-02b-guard.png"
    save(img, p)
    slides.append((p, 2.5))

    slides.append(slide_cta(out, "→ beta-anfrage", "In 30 Sek.", "Beta gratis · kein Abo-Druck."))
    return slides


HOOKS = [
    {
        "id": 1,
        "slug": "download",
        "folder": "reel-hook-01",
        "concept": "Download-Ordner (PAS / Specificity)",
        "builder": hook01_download,
        "utm_content": "hook1_download",
        "caption_ig": """Steuer-PDFs im Download-Chaos?
Suchen. Tippen. Verlieren.
TaxDoc: hochladen, sortieren, Überblick.
Beta gratis — kein Abo-Zwang. Hilfsmittel, keine Beratung.
🧪 Link in Bio → beta-anfrage
#steuererklärung #steuertipps #betatest #deutschland #selbstständig #finanztipps""",
        "caption_fb": """Steuer-PDFs im Download-Ordner vergraben?
TaxDoc Beta: Belege hochladen, KI hilft beim Sortieren, Überblick statt Chaos.
Hilfsmittel — keine Steuerberatung. Beta kostenlos.
{url}""",
    },
    {
        "id": 2,
        "slug": "before_after",
        "folder": "reel-hook-02",
        "concept": "Before / After (Chaos → Ordnung)",
        "builder": hook02_before_after,
        "utm_content": "hook2_before_after",
        "caption_ig": """Vorher: Schuhkarton.
Nachher: ein Ort.
TaxDoc Beta — Upload · KI · Überblick.
Fair: du prüfst selbst. Beta gratis.
🧪 Link in Bio → beta-anfrage
#steuererklärung #ordnung #betatest #deutschland #finanztipps #taxdoc""",
        "caption_fb": """Vorher: Schuhkarton, Zettel, PDFs überall.
Nachher: ein Ort für deine Steuerunterlagen.
TaxDoc Beta kostenlos testen:
{url}""",
    },
    {
        "id": 3,
        "slug": "selbststaendig",
        "folder": "reel-hook-03",
        "concept": "Selbstständig? (Nische)",
        "builder": hook03_selbststaendig,
        "utm_content": "hook3_selbststaendig",
        "caption_ig": """Selbstständig & Belege überall?
Ganzjährig — nicht nur im März.
TaxDoc Beta hält Unterlagen zusammen.
Kein Steuerberater-Ersatz. Jetzt Beta anfragen.
🧪 Link in Bio → beta-anfrage
#selbstständig #freelancer #steuererklärung #betatest #deutschland #belege""",
        "caption_fb": """Selbstständig — und Belege das ganze Jahr verstreut?
TaxDoc Beta hält Dokumente an einem Ort. Hilfsmittel, kein Berater-Ersatz.
Beta gratis:
{url}""",
    },
    {
        "id": 4,
        "slug": "ugc",
        "folder": "reel-hook-04",
        "concept": "UGC-Frage (Native)",
        "builder": hook04_ugc,
        "utm_content": "hook4_ugc",
        "caption_ig": """Wer sortiert eigentlich eure Belege?
Genau. Niemand.
Deshalb: TaxDoc Beta — hochladen, KI sortiert, Überblick.
Beta gratis. Feedback willkommen.
🧪 Link in Bio → beta-anfrage
#steuererklärung #belege #betatest #deutschland #finanztipps #taxdoc""",
        "caption_fb": """Wer sortiert eigentlich eure Belege? Genau — niemand.
Deshalb TaxDoc Beta: Belege digital sortieren. Hilfsmittel, keine Beratung.
{url}""",
    },
    {
        "id": 5,
        "slug": "offer",
        "folder": "reel-hook-05",
        "concept": "Offer + Trust (Warm / Retarget)",
        "builder": hook05_offer_trust,
        "utm_content": "hook5_offer",
        "caption_ig": """Beta gratis. Kein Abo-Druck.
Belege · KI · Schätzung — Hilfsmittel.
Abgabe über dich (z. B. Mein ELSTER).
→ beta-anfrage · in 30 Sek. anfragen
🧪 TaxDoc Beta
#steuererklärung #betatest #deutschland #finanztipps #elster #taxdoc""",
        "caption_fb": """Beta gratis. Kein Abo-Druck.
TaxDoc: Dokumente sortieren — Hilfsmittel, keine Steuerberatung.
Abgabe bleibt bei dir. In ~30 Sekunden anfragen:
{url}""",
    },
]


def write_meta(folder: Path, hook: dict, total: float, url: str) -> None:
    (folder / "CAPTION-IG.txt").write_text(hook["caption_ig"].strip() + "\n", encoding="utf-8")
    (folder / "CAPTION-FB.txt").write_text(hook["caption_fb"].format(url=url).strip() + "\n", encoding="utf-8")
    (folder / "UTM.txt").write_text(
        f"# Ziel-URL mit UTM (Ads Manager → Website-URL)\n{url}\n",
        encoding="utf-8",
    )
    (folder / "BOOST-HINWEIS.md").write_text(
        f"""# Hook {hook['id']} — {hook['concept']}

**MP4 (mit Piano):** `{folder.name}/taxdoc-hook-{hook['id']:02d}-music.mp4`  
**Dauer:** ~{total:.1f}s · 1080×1920 · Mixkit Calm Piano beibehalten  
**Ziel-URL:**  
`{url}`

**CTA-Button:** Mehr erfahren / Jetzt anmelden  
**Primärtext:** siehe `marketing/ads/ad-*-*.txt` (D/E/F für 1–3; G/H für 4–5)

**Playbook:** `docs/ADS-WORLDCLASS-PLAYBOOK-DE.md` §3.2 Hook {hook['id']}
""",
        encoding="utf-8",
    )
    (folder / "ANLEITUNG-POSTEN.md").write_text(
        f"""# Hook {hook['id']} posten / als Ad nutzen

1. Upload: `taxdoc-hook-{hook['id']:02d}-music.mp4` (Piano behalten — nicht stumm ersetzen).
2. Caption: `CAPTION-IG.txt` bzw. Ads: Primärtext aus `marketing/ads/`.
3. Link: Inhalt von `UTM.txt`.
4. Meta: Conversions → Lead (siehe `marketing/META-14-DAY-LAUNCH.md`).
""",
        encoding="utf-8",
    )


def main() -> None:
    if not BED.exists():
        raise SystemExit(f"Missing piano bed: {BED}")

    print(f"Audio bed: {BED.name} (Mixkit calm piano)")
    index_lines = [
        "# TaxDoc Hook Ads 01–05 (Worldclass Playbook)\n",
        "**Audio:** Mixkit Soft-Piano (`marketing/audio/taxdoc-calm-piano.aac`) — beibehalten.\n",
        "**Format:** 1080×1920 · ~8–12 s · Big-Text Hook Sekunde 0–1.\n",
        "**Landing:** https://taxdoc-beta.onrender.com/beta-anfrage\n",
        "**Launch-Klicks:** `marketing/META-14-DAY-LAUNCH.md`\n",
        "\n| Hook | Ordner | MP4 | UTM content |\n|------|--------|-----|-------------|\n",
    ]

    for hook in HOOKS:
        folder = MARKETING / hook["folder"]
        folder.mkdir(parents=True, exist_ok=True)
        url = f"{BASE_URL}?{UTM_BASE}&utm_content={hook['utm_content']}"
        print(f"\n=== Hook {hook['id']}: {hook['concept']} ===")
        slides = hook["builder"](folder)
        # Cap total ~12s if builders overshoot
        total = sum(d for _, d in slides)
        if total > 12.2:
            scale = 11.5 / total
            slides = [(p, round(d * scale, 2)) for p, d in slides]
            total = sum(d for _, d in slides)
        silent = folder / f"taxdoc-hook-{hook['id']:02d}.mp4"
        music = folder / f"taxdoc-hook-{hook['id']:02d}-music.mp4"
        concat_mp4(slides, silent, music)
        write_meta(folder, hook, total, url)
        print(f"  → {music.relative_to(ROOT)} · {total:.1f}s")
        index_lines.append(
            f"| {hook['id']} | `{hook['folder']}/` | `taxdoc-hook-{hook['id']:02d}-music.mp4` | `{hook['utm_content']}` |\n"
        )

    index_path = MARKETING / "ads" / "hooks" / "README.md"
    index_path.parent.mkdir(parents=True, exist_ok=True)
    index_path.write_text("".join(index_lines) + "\n", encoding="utf-8")
    print("\nDone. Index →", index_path.relative_to(ROOT))


if __name__ == "__main__":
    main()
