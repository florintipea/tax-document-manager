#!/usr/bin/env python3
"""Generate short TaxDoc Instagram/Facebook Reels (7–12s, 1080×1920)."""

from __future__ import annotations

import math
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[2]
MARKETING = ROOT / "marketing"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
W, H = 1080, 1920
FPS = 30

# Brand (from reel-03 slides + app manifest)
NAVY_TOP = (0, 32, 88)
NAVY_MID = (1, 48, 128)
NAVY_BOT = (0, 22, 64)
GREEN = (101, 187, 100)
GREEN_DIM = (72, 148, 78)
WHITE = (255, 255, 255)
OFF_WHITE = (230, 236, 245)
MUTED = (160, 180, 210)
CHAOS_TOP = (48, 18, 28)
CHAOS_BOT = (22, 8, 16)
TRUST_TOP = (0, 40, 72)
TRUST_BOT = (0, 28, 58)

FONT_BOLD = Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf")
FONT_BLACK = Path("/System/Library/Fonts/Supplemental/Arial Black.ttf")
FONT_REG = Path("/System/Library/Fonts/Supplemental/Arial.ttf")
# Soft piano bed — Mixkit "Piano Reflections" (Ahjay Stelino), commercial OK
# See marketing/audio/LICENSE.txt — NOT the old tense bed
BED = MARKETING / "audio" / "taxdoc-calm-piano.aac"
BED_VOLUME = 0.22  # duck under text; soft trust vibe


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size)


def gradient(top: tuple[int, int, int], bot: tuple[int, int, int], mid: tuple[int, int, int] | None = None) -> Image.Image:
    img = Image.new("RGB", (W, H))
    px = img.load()
    mid = mid or tuple((a + b) // 2 for a, b in zip(top, bot))
    for y in range(H):
        t = y / (H - 1)
        if t < 0.45:
            u = t / 0.45
            c = tuple(int(top[i] + (mid[i] - top[i]) * u) for i in range(3))
        else:
            u = (t - 0.45) / 0.55
            c = tuple(int(mid[i] + (bot[i] - mid[i]) * u) for i in range(3))
        for x in range(W):
            # soft radial lift toward center
            dx = (x - W / 2) / (W / 2)
            dy = (y - H * 0.42) / (H / 2)
            lift = max(0.0, 1.0 - math.sqrt(dx * dx + dy * dy) * 0.55) * 18
            px[x, y] = tuple(min(255, int(c[i] + lift)) for i in range(3))
    return img


def draw_dots(draw: ImageDraw.ImageDraw, origin: tuple[int, int], color: tuple[int, int, int] = (70, 110, 160)) -> None:
    ox, oy = origin
    for i in range(4):
        for j in range(4):
            draw.ellipse([ox + i * 18, oy + j * 18, ox + i * 18 + 6, oy + j * 18 + 6], fill=color)


def draw_logo_mark(draw: ImageDraw.ImageDraw, cx: int, cy: int, scale: float = 1.0) -> None:
    s = int(28 * scale)
    # simple document + green check
    left, top = cx - s, cy - int(s * 1.15)
    right, bot = cx + s, cy + int(s * 1.15)
    draw.rounded_rectangle([left, top, right, bot], radius=8, outline=WHITE, width=4)
    # fold
    fold = int(14 * scale)
    draw.polygon([(right - fold, top), (right, top + fold), (right - fold, top + fold)], outline=WHITE)
    # check
    pts = [
        (cx - int(10 * scale), cy + int(2 * scale)),
        (cx - int(2 * scale), cy + int(12 * scale)),
        (cx + int(14 * scale), cy - int(12 * scale)),
    ]
    draw.line(pts, fill=GREEN, width=max(4, int(5 * scale)))


def text_size(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.ImageFont) -> tuple[int, int]:
    box = draw.textbbox((0, 0), text, font=fnt)
    return box[2] - box[0], box[3] - box[1]


def centered_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    y: int,
    fnt: ImageFont.ImageFont,
    fill: tuple[int, int, int],
    max_width: int = 960,
) -> int:
    """Draw centered text; returns bottom y."""
    tw, th = text_size(draw, text, fnt)
    x = (W - tw) // 2
    # slight shadow for punch
    draw.text((x + 3, y + 3), text, font=fnt, fill=(0, 0, 0))
    draw.text((x, y), text, font=fnt, fill=fill)
    return y + th


def multiline_centered(
    draw: ImageDraw.ImageDraw,
    lines: list[tuple[str, ImageFont.ImageFont, tuple[int, int, int]]],
    start_y: int,
    gap: int = 18,
) -> int:
    y = start_y
    for text, fnt, fill in lines:
        y = centered_text(draw, text, y, fnt, fill) + gap
    return y


def pill(draw: ImageDraw.ImageDraw, text: str, cy: int, fnt: ImageFont.ImageFont) -> None:
    tw, th = text_size(draw, text, fnt)
    pad_x, pad_y = 36, 18
    box = [
        (W - tw) // 2 - pad_x,
        cy - th // 2 - pad_y,
        (W + tw) // 2 + pad_x,
        cy + th // 2 + pad_y,
    ]
    draw.rounded_rectangle(box, radius=40, outline=GREEN, width=4)
    draw.text(((W - tw) // 2, cy - th // 2 - 2), text, font=fnt, fill=GREEN)


def cta_box(draw: ImageDraw.ImageDraw, lines: list[tuple[str, ImageFont.ImageFont, tuple[int, int, int]]], cy: int) -> None:
    box_h = 320
    box = [90, cy - box_h // 2, W - 90, cy + box_h // 2]
    draw.rounded_rectangle(box, radius=28, outline=(90, 150, 210), width=3, fill=(0, 28, 78))
    y = cy - box_h // 2 + 48
    for text, fnt, fill in lines:
        y = centered_text(draw, text, y, fnt, fill) + 14


def brand_header(draw: ImageDraw.ImageDraw, compact: bool = False) -> None:
    draw_logo_mark(draw, W // 2 - 90, 110 if not compact else 90, 0.85)
    f = font(FONT_BOLD, 48 if not compact else 40)
    tw, th = text_size(draw, "TaxDoc", f)
    draw.text((W // 2 - 50, 110 - th // 2 if not compact else 90 - th // 2), "TaxDoc", font=f, fill=WHITE)
    if not compact:
        tag = font(FONT_REG, 22)
        centered_text(draw, "EINFACH. DIGITAL. STEUERN.", 165, tag, MUTED)


def save(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG", optimize=True)
    print(f"  wrote {path.relative_to(ROOT)}")


# ─── Reel 04: Chaos → Ordnung ───────────────────────────────────────────────

def reel04_slides(out: Path) -> list[tuple[Path, float]]:
    slides: list[tuple[Path, float]] = []

    # 1 Hook — stop scroll (~2.0s)
    img = gradient(CHAOS_TOP, CHAOS_BOT, (70, 24, 36))
    draw = ImageDraw.Draw(img)
    draw_dots(draw, (860, 80), (120, 60, 80))
    # abstract paper chaos bars
    for i, (x, y, ww, hh, ang_color) in enumerate(
        [
            (180, 1280, 280, 40, (240, 230, 220)),
            (520, 1340, 320, 36, (220, 210, 200)),
            (240, 1420, 260, 32, (200, 190, 180)),
            (480, 1480, 300, 34, (230, 220, 210)),
            (200, 1560, 340, 30, (210, 200, 190)),
        ]
    ):
        draw.rounded_rectangle([x, y, x + ww, y + hh], radius=6, fill=ang_color)
    brand_header(draw, compact=True)
    y = multiline_centered(
        draw,
        [
            ("Belege-", font(FONT_BLACK, 120), WHITE),
            ("CHAOS?", font(FONT_BLACK, 140), GREEN),
        ],
        520,
        gap=8,
    )
    centered_text(draw, "PDFs · Zettel · Ordner", y + 40, font(FONT_BOLD, 42), OFF_WHITE)
    centered_text(draw, "überall.", y + 100, font(FONT_BOLD, 42), OFF_WHITE)
    p = out / "slide-01-hook.png"
    save(img, p)
    slides.append((p, 2.0))

    # 2 Solution — one message (~5.0s)
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
        520,
        gap=20,
    )
    draw.rectangle([340, y + 20, 740, y + 26], fill=GREEN)
    multiline_centered(
        draw,
        [
            ("Hochladen.", font(FONT_BOLD, 48), WHITE),
            ("KI sortiert.", font(FONT_BOLD, 48), WHITE),
            ("Überblick behalten.", font(FONT_BOLD, 48), WHITE),
        ],
        y + 70,
        gap=16,
    )
    centered_text(draw, "DE-first · Belege digital", 1680, font(FONT_REG, 32), MUTED)
    p = out / "slide-02-solution.png"
    save(img, p)
    slides.append((p, 5.0))

    # 3 CTA (~3.0s)
    img = gradient(NAVY_TOP, NAVY_BOT, NAVY_MID)
    draw = ImageDraw.Draw(img)
    draw_dots(draw, (860, 80))
    brand_header(draw)
    multiline_centered(
        draw,
        [
            ("Beta gratis", font(FONT_BLACK, 88), GREEN),
            ("testen.", font(FONT_BLACK, 88), WHITE),
        ],
        380,
        gap=6,
    )
    cta_box(
        draw,
        [
            ("Link in Bio", font(FONT_BOLD, 40), WHITE),
            ("→ beta-anfrage", font(FONT_BLACK, 56), GREEN),
            ("taxdoc-beta.onrender.com", font(FONT_REG, 28), MUTED),
        ],
        980,
    )
    centered_text(draw, "Kein Abo-Zwang · Feedback willkommen", 1480, font(FONT_REG, 30), OFF_WHITE)
    centered_text(draw, "TaxDoc Beta · jetzt starten", 1700, font(FONT_BOLD, 34), WHITE)
    p = out / "slide-03-cta.png"
    save(img, p)
    slides.append((p, 3.0))
    return slides


# ─── Reel 05: Datenschutz / eigene Keys ─────────────────────────────────────

def reel05_slides(out: Path) -> list[tuple[Path, float]]:
    slides: list[tuple[Path, float]] = []

    img = gradient(TRUST_TOP, TRUST_BOT, (0, 48, 96))
    draw = ImageDraw.Draw(img)
    draw_dots(draw, (860, 80), (50, 100, 140))
    brand_header(draw, compact=True)
    # lock-ish shield
    cx, cy = W // 2, 430
    draw.ellipse([cx - 70, cy - 70, cx + 70, cy + 70], outline=GREEN, width=6)
    draw.rounded_rectangle([cx - 28, cy - 10, cx + 28, cy + 36], radius=8, outline=WHITE, width=4)
    draw.arc([cx - 22, cy - 36, cx + 22, cy], 0, 180, fill=WHITE, width=4)
    y = multiline_centered(
        draw,
        [
            ("Deine Daten.", font(FONT_BLACK, 96), WHITE),
            ("Deine Keys.", font(FONT_BLACK, 96), GREEN),
        ],
        620,
        gap=10,
    )
    centered_text(draw, "Kein Blindvertrauen nötig.", y + 50, font(FONT_BOLD, 40), OFF_WHITE)
    p = out / "slide-01-hook.png"
    save(img, p)
    slides.append((p, 2.2))

    img = gradient(NAVY_TOP, NAVY_BOT, NAVY_MID)
    draw = ImageDraw.Draw(img)
    draw_dots(draw, (860, 80))
    brand_header(draw)
    y = multiline_centered(
        draw,
        [
            ("Eigene AI-Keys.", font(FONT_BLACK, 72), WHITE),
            ("Bleiben bei dir.", font(FONT_BLACK, 64), GREEN),
        ],
        480,
        gap=24,
    )
    draw.rectangle([300, y + 10, 780, y + 16], fill=GREEN)
    multiline_centered(
        draw,
        [
            ("Du bringst den Key.", font(FONT_BOLD, 44), WHITE),
            ("TaxDoc hilft bei Belegen.", font(FONT_BOLD, 44), WHITE),
            ("Hilfsmittel — kein ELSTER-Submit.", font(FONT_BOLD, 36), MUTED),
        ],
        y + 60,
        gap=22,
    )
    p = out / "slide-02-trust.png"
    save(img, p)
    slides.append((p, 5.0))

    img = gradient(NAVY_TOP, NAVY_BOT, NAVY_MID)
    draw = ImageDraw.Draw(img)
    draw_dots(draw, (860, 80))
    brand_header(draw)
    multiline_centered(
        draw,
        [
            ("Vertrauen testen?", font(FONT_BLACK, 64), WHITE),
            ("Beta gratis.", font(FONT_BLACK, 80), GREEN),
        ],
        400,
        gap=16,
    )
    cta_box(
        draw,
        [
            ("Link in Bio", font(FONT_BOLD, 40), WHITE),
            ("→ beta-anfrage", font(FONT_BLACK, 56), GREEN),
            ("taxdoc-beta.onrender.com", font(FONT_REG, 28), MUTED),
        ],
        1000,
    )
    centered_text(draw, "TaxDoc Beta · Datenschutz zuerst", 1680, font(FONT_BOLD, 32), WHITE)
    p = out / "slide-03-cta.png"
    save(img, p)
    slides.append((p, 2.8))
    return slides


# ─── Reel 06: Direct CTA ────────────────────────────────────────────────────

def reel06_slides(out: Path) -> list[tuple[Path, float]]:
    slides: list[tuple[Path, float]] = []

    img = gradient(NAVY_TOP, NAVY_BOT, (8, 56, 140))
    draw = ImageDraw.Draw(img)
    draw_dots(draw, (860, 80))
    brand_header(draw, compact=True)
    y = multiline_centered(
        draw,
        [
            ("Steuer-", font(FONT_BLACK, 120), WHITE),
            ("STRESS?", font(FONT_BLACK, 140), GREEN),
        ],
        540,
        gap=4,
    )
    centered_text(draw, "Unterlagen stapeln sich.", y + 50, font(FONT_BOLD, 42), OFF_WHITE)
    centered_text(draw, "Erklärung wartet.", y + 110, font(FONT_BOLD, 42), OFF_WHITE)
    p = out / "slide-01-hook.png"
    save(img, p)
    slides.append((p, 2.0))

    img = gradient(NAVY_TOP, NAVY_BOT, NAVY_MID)
    draw = ImageDraw.Draw(img)
    draw_dots(draw, (860, 80))
    brand_header(draw)
    pill(draw, "BETA · KOSTENLOS", 260, font(FONT_BOLD, 28))
    y = multiline_centered(
        draw,
        [
            ("Beta gratis", font(FONT_BLACK, 96), WHITE),
            ("testen.", font(FONT_BLACK, 96), GREEN),
        ],
        520,
        gap=8,
    )
    draw.rectangle([360, y + 20, 720, y + 26], fill=GREEN)
    multiline_centered(
        draw,
        [
            ("Belege sammeln.", font(FONT_BOLD, 48), WHITE),
            ("KI sortiert.", font(FONT_BOLD, 48), WHITE),
            ("Kein Abo-Zwang.", font(FONT_BOLD, 48), WHITE),
        ],
        y + 70,
        gap=18,
    )
    p = out / "slide-02-offer.png"
    save(img, p)
    slides.append((p, 4.5))

    img = gradient(NAVY_TOP, NAVY_BOT, NAVY_MID)
    draw = ImageDraw.Draw(img)
    draw_dots(draw, (860, 80))
    brand_header(draw)
    multiline_centered(
        draw,
        [
            ("Jetzt.", font(FONT_BLACK, 100), WHITE),
            ("Link in Bio.", font(FONT_BLACK, 72), GREEN),
        ],
        420,
        gap=12,
    )
    cta_box(
        draw,
        [
            ("→ beta-anfrage", font(FONT_BLACK, 56), GREEN),
            ("taxdoc-beta.onrender.com", font(FONT_REG, 28), MUTED),
            ("15 Sekunden · fertig", font(FONT_BOLD, 34), WHITE),
        ],
        1000,
    )
    centered_text(draw, "Hilfsmittel · keine Steuerberatung", 1580, font(FONT_REG, 30), MUTED)
    centered_text(draw, "TaxDoc Beta · Zugang holen", 1700, font(FONT_BOLD, 34), WHITE)
    p = out / "slide-03-cta.png"
    save(img, p)
    slides.append((p, 3.0))
    return slides


def concat_mp4(slides: list[tuple[Path, float]], silent: Path, with_music: Path | None) -> None:
    """Build MP4 from stills via ffmpeg concat demuxer."""
    work = silent.parent / "_ffmpeg_work"
    work.mkdir(exist_ok=True)
    list_file = work / "concat.txt"
    lines = []
    for path, dur in slides:
        # escape for concat demuxer
        lines.append(f"file '{path.resolve()}'")
        lines.append(f"duration {dur}")
    # last frame must be listed again without duration for concat demuxer
    lines.append(f"file '{slides[-1][0].resolve()}'")
    list_file.write_text("\n".join(lines) + "\n")

    total = sum(d for _, d in slides)
    cmd = [
        FFMPEG,
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        str(list_file),
        "-vf",
        f"fps={FPS},format=yuv420p",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-r",
        str(FPS),
        "-t",
        f"{total:.2f}",
        "-movflags",
        "+faststart",
        str(silent),
    ]
    subprocess.run(cmd, check=True, capture_output=True)

    if with_music and BED.exists():
        # Soft bed: low volume + gentle fade in/out so text stays primary
        fade_out_start = max(0.5, total - 1.2)
        cmd_m = [
            FFMPEG,
            "-y",
            "-i",
            str(silent),
            "-stream_loop",
            "-1",
            "-i",
            str(BED),
            "-filter_complex",
            (
                f"[1:a]volume={BED_VOLUME},"
                f"afade=t=in:st=0:d=0.8,"
                f"afade=t=out:st={fade_out_start:.2f}:d=1.2[a]"
            ),
            "-map",
            "0:v",
            "-map",
            "[a]",
            "-t",
            f"{total:.2f}",
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            "-shortest",
            "-movflags",
            "+faststart",
            str(with_music),
        ]
        subprocess.run(cmd_m, check=True, capture_output=True)

    # cleanup work list only
    list_file.unlink(missing_ok=True)
    try:
        work.rmdir()
    except OSError:
        pass


def write_captions(folder: Path, reel_id: int, concept: str, caption_ig: str, caption_fb: str, boost_note: str) -> None:
    (folder / "CAPTION-IG.txt").write_text(caption_ig.strip() + "\n", encoding="utf-8")
    (folder / "CAPTION-FB.txt").write_text(caption_fb.strip() + "\n", encoding="utf-8")
    (folder / "BOOST-HINWEIS.md").write_text(
        f"# Reel #{reel_id} — Boost-Hinweis\n\n"
        f"**Konzept:** {concept}\n\n"
        f"{boost_note.strip()}\n\n"
        f"**Traffic-Ziel:** https://taxdoc-beta.onrender.com/beta-anfrage\n"
        f"**CTA-Button:** Mehr erfahren\n",
        encoding="utf-8",
    )


def main() -> None:
    specs = [
        (
            4,
            "Chaos Belege → Ordnung",
            reel04_slides,
            """Belege-Chaos? TaxDoc schafft Ordnung.
Hochladen → KI sortiert → Überblick.
Beta gratis — kein Abo-Zwang.
🧪 Link in Bio → beta-anfrage
#steuererklärung #steuertipps #betatest #deutschland #finanztipps #selbstständig""",
            """Belege-Chaos? TaxDoc hilft, Dokumente zu sammeln und mit KI zu sortieren — als Hilfsmittel, nicht als Steuerberatung.
Beta kostenlos testen:
https://taxdoc-beta.onrender.com/beta-anfrage""",
            "**Zuerst boostén:** stärkstes Problem/Solution-Creative für Cold Traffic (PAS). "
            "Hohe Stop-Scroll-Chance durch „Belege-CHAOS?“.",
        ),
        (
            5,
            "Datenschutz / eigene AI-Keys",
            reel05_slides,
            """Deine Daten. Deine Keys.
TaxDoc: eigene AI-Keys — bleiben bei dir.
Hilfsmittel für Belege, kein ELSTER-Submit.
🧪 Beta gratis · Link in Bio → beta-anfrage
#datenschutz #steuern #betatest #deutschland #finanztipps #ki""",
            """Datenschutz zuerst: Bei TaxDoc bringst du deine eigenen AI-Keys mit.
Belege digital organisieren — Beta kostenlos:
https://taxdoc-beta.onrender.com/beta-anfrage""",
            "Gut als **zweite Ad** für skeptisches DE-Publikum / Retargeting. "
            "Nicht zuerst boostén — Trust-Winkel konvertiert oft später.",
        ),
        (
            6,
            "Steuerstress? Beta gratis",
            reel06_slides,
            """Steuerstress?
Beta gratis testen — Belege sammeln, KI sortiert.
Kein Abo-Zwang. Link in Bio → beta-anfrage
🧪 TaxDoc Beta
#steuererklärung #steuertipps #betatest #deutschland #finanztipps #taxdoc""",
            """Steuerstress? TaxDoc Beta kostenlos testen.
Belege sammeln · KI sortiert · Überblick.
https://taxdoc-beta.onrender.com/beta-anfrage""",
            "Starkes **Offer-Creative** — parallel zu Reel 04 testen. "
            "Oft gute CTR wenn Hook greift; Boost #2 nach Chaos-Reel.",
        ),
    ]

    summary_boost = MARKETING / "reel-short-BOOST-REIHENFOLGE.md"
    lines = [
        "# Kurze Reels — welche zuerst als Meta-Ad boostén?\n",
        "**Ziel:** Traffic → https://taxdoc-beta.onrender.com/beta-anfrage\n",
        "**Insight:** Alte Reels (~22 s) werden übersprungen (viele Impressions, kaum 3-Sekunden-Views).\n",
        "Neue Creatives: **~10 s**, Hook in Sekunde 1, ein Message, CTA letzte ~3 s.\n",
        "## Reihenfolge\n",
        "1. **Zuerst: Reel 04** (`marketing/reel-04/taxdoc-reel-04-music.mp4`) — Chaos→Ordnung (PAS). "
        "Bester Thumb-Stop für Cold Traffic.\n",
        "2. **Dann: Reel 06** — Direkt-CTA „Steuerstress? / Beta gratis“. Offer-Klarheit.\n",
        "3. **Danach: Reel 05** — Datenschutz/Keys. Trust / Warm Audience.\n",
        "## Setup\n",
        "- Ziel: **Traffic** · CTA **Mehr erfahren** · URL `/beta-anfrage`\n",
        "- Creative: `*-music.mp4` (Sound-on) oder stumm + IG-Audio\n",
        "- Claims fair: Hilfsmittel, Beta, kein Steuerberater, kein Fake-ELSTER-Submit\n",
    ]
    summary_boost.write_text("\n".join(lines), encoding="utf-8")

    for num, concept, builder, cap_ig, cap_fb, boost in specs:
        folder = MARKETING / f"reel-{num:02d}"
        folder.mkdir(parents=True, exist_ok=True)
        print(f"\n=== Reel {num}: {concept} ===")
        slides = builder(folder)
        silent = folder / f"taxdoc-reel-{num:02d}.mp4"
        music = folder / f"taxdoc-reel-{num:02d}-music.mp4"
        concat_mp4(slides, silent, music)
        write_captions(folder, num, concept, cap_ig, cap_fb, boost)
        total = sum(d for _, d in slides)
        print(f"  MP4 {silent.name} + music · {total:.1f}s")

    print("\nDone. Boost order →", summary_boost.relative_to(ROOT))


if __name__ == "__main__":
    main()
