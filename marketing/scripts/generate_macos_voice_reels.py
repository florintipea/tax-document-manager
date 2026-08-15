#!/usr/bin/env python3
"""Generate TaxDoc social videos with free macOS German TTS (say).

No ElevenLabs / OpenAI / Gemini audio — only system voice + Mixkit piano bed.
Outputs: marketing/reel-voice-01 … and optional short hook voice clips.
"""

from __future__ import annotations

import shutil
import subprocess
import sys
import wave
from pathlib import Path

import imageio_ffmpeg
from PIL import Image, ImageDraw

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from generate_short_reels import (  # noqa: E402
    BED,
    BED_VOLUME,
    CHAOS_BOT,
    CHAOS_TOP,
    FONT_BLACK,
    FONT_BOLD,
    FONT_REG,
    FPS,
    GREEN,
    MARKETING,
    MUTED,
    NAVY_BOT,
    NAVY_MID,
    NAVY_TOP,
    OFF_WHITE,
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

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
VOICE = "Anna"  # macOS de_DE — clear, free, built-in
BED_UNDER_VOICE = 0.14  # duck further when spoken VO is present
ROOT = MARKETING.parent


def run(cmd: list[str]) -> None:
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(
            f"Command failed ({r.returncode}): {' '.join(cmd)}\n"
            f"stdout:\n{r.stdout}\nstderr:\n{r.stderr}"
        )


def say_to_wav(text: str, out_wav: Path, voice: str = VOICE) -> float:
    """Synthesize German speech via macOS `say`, return duration seconds."""
    out_wav.parent.mkdir(parents=True, exist_ok=True)
    aiff = out_wav.with_suffix(".aiff")
    # Data format: AIFF-C / LEI16 so ffmpeg/wave can read reliably
    # Default AIFF-C from `say`; ffmpeg normalizes to WAV for mixing.
    run(["say", "-v", voice, "-o", str(aiff), text])
    run(
        [
            FFMPEG,
            "-y",
            "-i",
            str(aiff),
            "-acodec",
            "pcm_s16le",
            "-ar",
            "22050",
            "-ac",
            "1",
            str(out_wav),
        ]
    )
    aiff.unlink(missing_ok=True)
    with wave.open(str(out_wav), "rb") as w:
        frames = w.getnframes()
        rate = w.getframerate()
        dur = frames / float(rate)
    if dur < 0.3:
        raise RuntimeError(f"Voice file too short ({dur:.2f}s): {out_wav}")
    return dur


def wav_to_m4a(wav: Path, m4a: Path) -> None:
    run(
        [
            FFMPEG,
            "-y",
            "-i",
            str(wav),
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            str(m4a),
        ]
    )


def mux_voice_and_bed(silent_mp4: Path, voice_wav: Path, out_mp4: Path, total: float) -> None:
    """Mux silent video + spoken VO + ducked Mixkit piano bed."""
    fade_out_start = max(0.5, total - 1.2)
    if BED.exists():
        fc = (
            f"[1:a]volume=1.0,apad=pad_dur=0.4[vox];"
            f"[2:a]volume={BED_UNDER_VOICE},"
            f"afade=t=in:st=0:d=0.6,"
            f"afade=t=out:st={fade_out_start:.2f}:d=1.0[bed];"
            f"[bed][vox]amix=inputs=2:duration=first:dropout_transition=0[a]"
        )
        cmd = [
            FFMPEG,
            "-y",
            "-i",
            str(silent_mp4),
            "-i",
            str(voice_wav),
            "-stream_loop",
            "-1",
            "-i",
            str(BED),
            "-filter_complex",
            fc,
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
            "160k",
            "-movflags",
            "+faststart",
            str(out_mp4),
        ]
    else:
        cmd = [
            FFMPEG,
            "-y",
            "-i",
            str(silent_mp4),
            "-i",
            str(voice_wav),
            "-map",
            "0:v",
            "-map",
            "1:a",
            "-t",
            f"{total:.2f}",
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "160k",
            "-shortest",
            "-movflags",
            "+faststart",
            str(out_mp4),
        ]
    run(cmd)


def split_durations(weights: list[float], total: float, min_each: float = 1.6) -> list[float]:
    """Distribute total seconds by relative weights (voice-synced slides)."""
    wsum = sum(weights) or 1.0
    raw = [max(min_each, total * (w / wsum)) for w in weights]
    scale = total / sum(raw)
    return [round(d * scale, 2) for d in raw]


def slide_hook_lines(out: Path, name: str, lines: list[tuple[str, int, tuple]], bg="navy", subtitle: str | None = None) -> Path:
    if bg == "chaos":
        img = gradient(CHAOS_TOP, CHAOS_BOT, (70, 24, 36))
    else:
        img = gradient(NAVY_TOP, NAVY_BOT, NAVY_MID)
    draw = ImageDraw.Draw(img)
    draw_dots(draw, (860, 80))
    brand_header(draw, compact=True)
    y = multiline_centered(
        draw,
        [(t, font(FONT_BLACK if sz >= 64 else FONT_BOLD, sz), c) for t, sz, c in lines],
        480 if len(lines) <= 3 else 400,
        gap=10,
    )
    if subtitle:
        centered_text(draw, subtitle, y + 48, font(FONT_BOLD, 36), OFF_WHITE)
    p = out / name
    save(img, p)
    return p


def build_grenzgaenger_slides(out: Path, durs: list[float]) -> list[tuple[Path, float]]:
    slides: list[tuple[Path, float]] = []
    p = slide_hook_lines(
        out,
        "slide-01-hook.png",
        [
            ("Wohnst du in", 56, WHITE),
            ("Deutschland und", 56, WHITE),
            ("arbeitest in der", 56, WHITE),
            ("Schweiz oder", 64, WHITE),
            ("Österreich?", 72, GREEN),
        ],
        bg="chaos",
        subtitle="Grenzgänger DE / CH / AT",
    )
    slides.append((p, durs[0]))

    img = gradient(NAVY_TOP, NAVY_BOT, NAVY_MID)
    draw = ImageDraw.Draw(img)
    draw_dots(draw, (860, 80))
    brand_header(draw)
    pill(draw, "HILFSMITTEL · KEINE STEUERBERATUNG", 240, font(FONT_BOLD, 22))
    multiline_centered(
        draw,
        [
            ("Auslandsbelege", font(FONT_BLACK, 64), WHITE),
            ("an einem Ort.", font(FONT_BLACK, 64), GREEN),
        ],
        420,
        gap=12,
    )
    multiline_centered(
        draw,
        [
            ("Schweizer Lohnabrechnungen", font(FONT_BOLD, 40), OFF_WHITE),
            ("Ansässigkeitsbescheinigung", font(FONT_BOLD, 40), OFF_WHITE),
            ("bereit für die Steuererklärung", font(FONT_BOLD, 36), MUTED),
        ],
        780,
        gap=18,
    )
    centered_text(draw, "Unverbindlich · Orientierung, keine Beratung", 1580, font(FONT_REG, 28), MUTED)
    p = out / "slide-02-body.png"
    save(img, p)
    slides.append((p, durs[1]))

    img = gradient(NAVY_TOP, NAVY_BOT, NAVY_MID)
    draw = ImageDraw.Draw(img)
    brand_header(draw)
    multiline_centered(
        draw,
        [
            ("Kommentier", font(FONT_BLACK, 64), WHITE),
            ("GRENZE", font(FONT_BLACK, 110), GREEN),
        ],
        420,
        gap=8,
    )
    cta_box(
        draw,
        [
            ("kostenlose Beta", font(FONT_BLACK, 48), WHITE),
            ("Link in der Bio", font(FONT_BOLD, 36), MUTED),
            ("taxdoc-beta.onrender.com/grenze", font(FONT_REG, 26), GREEN),
        ],
        980,
    )
    centered_text(draw, "Keine Steuerberatung · du bleibst verantwortlich", 1580, font(FONT_REG, 28), MUTED)
    p = out / "slide-03-cta.png"
    save(img, p)
    slides.append((p, durs[2]))
    return slides


def build_masse_slides(out: Path, durs: list[float]) -> list[tuple[Path, float]]:
    slides: list[tuple[Path, float]] = []
    p = slide_hook_lines(
        out,
        "slide-01-hook.png",
        [
            ("Warum für die", 56, WHITE),
            ("Beleg-Ablage ein", 56, WHITE),
            ("teures Jahres-Abo", 64, WHITE),
            ("abschließen?", 72, GREEN),
        ],
        bg="chaos",
    )
    slides.append((p, durs[0]))

    img = gradient(NAVY_TOP, NAVY_BOT, NAVY_MID)
    draw = ImageDraw.Draw(img)
    draw_dots(draw, (860, 80))
    brand_header(draw)
    pill(draw, "KEIN ABO-ZWANG · UNVERBINDLICH", 250, font(FONT_BOLD, 24))
    multiline_centered(
        draw,
        [
            ("Foto hochladen.", font(FONT_BLACK, 56), WHITE),
            ("KI erstellt Übersicht.", font(FONT_BLACK, 52), GREEN),
            ("Stress sparen.", font(FONT_BLACK, 56), WHITE),
        ],
        480,
        gap=18,
    )
    centered_text(draw, "Homeoffice · Fahrtkosten · Handwerker", 1100, font(FONT_BOLD, 34), OFF_WHITE)
    centered_text(draw, "Hilfsmittel — keine Steuerberatung", 1580, font(FONT_REG, 28), MUTED)
    p = out / "slide-02-body.png"
    save(img, p)
    slides.append((p, durs[1]))

    img = gradient(NAVY_TOP, NAVY_BOT, NAVY_MID)
    draw = ImageDraw.Draw(img)
    brand_header(draw)
    multiline_centered(
        draw,
        [
            ("Unverbindliche Beta", font(FONT_BLACK, 56), GREEN),
            ("jetzt kostenlos", font(FONT_BLACK, 64), WHITE),
            ("testen.", font(FONT_BLACK, 72), WHITE),
        ],
        400,
        gap=10,
    )
    cta_box(
        draw,
        [
            ("→ Link in der Bio", font(FONT_BLACK, 48), GREEN),
            ("beta-anfrage", font(FONT_BOLD, 40), WHITE),
            ("Feedback willkommen", font(FONT_REG, 30), MUTED),
        ],
        1000,
    )
    centered_text(draw, "Keine Steuerberatung · Verantwortung bleibt bei dir", 1580, font(FONT_REG, 28), MUTED)
    p = out / "slide-03-cta.png"
    save(img, p)
    slides.append((p, durs[2]))
    return slides


def reuse_existing_hook_slides(hook_dir: Path, durs: list[float]) -> list[tuple[Path, float]]:
    """Pair existing PNGs in order with new durations."""
    pngs = sorted(hook_dir.glob("slide-*.png"))
    if not pngs:
        raise FileNotFoundError(f"No slides in {hook_dir}")
    # Match length: stretch last or trim
    if len(pngs) >= len(durs):
        pngs = pngs[: len(durs)]
    else:
        while len(pngs) < len(durs):
            pngs.append(pngs[-1])
    return list(zip(pngs, durs))


def build_one(
    folder: Path,
    filename: str,
    voice_text: str,
    slides_builder,
    section_weights: list[float],
    caption_ig: str,
    note: str,
) -> Path:
    folder.mkdir(parents=True, exist_ok=True)
    voice_wav = folder / "voice-anna.wav"
    voice_m4a = folder / "voice-anna.m4a"
    silent = folder / f"{filename.replace('.mp4', '')}-silent.mp4"
    final = folder / filename

    dur = say_to_wav(voice_text, voice_wav)
    wav_to_m4a(voice_wav, voice_m4a)
    # pad a touch so last CTA isn't cut
    total = dur + 0.35
    durs = split_durations(section_weights, total)
    slides = slides_builder(folder, durs)
    # ensure slide sum matches total
    diff = total - sum(d for _, d in slides)
    if abs(diff) > 0.01:
        path, d = slides[-1]
        slides[-1] = (path, round(d + diff, 2))

    concat_mp4(slides, silent, None)
    mux_voice_and_bed(silent, voice_wav, final, total)

    (folder / "VOICEOVER.txt").write_text(voice_text.strip() + "\n", encoding="utf-8")
    (folder / "CAPTION-IG.txt").write_text(caption_ig.strip() + "\n", encoding="utf-8")
    (folder / "README.md").write_text(
        f"# {filename}\n\n"
        f"**Stimme:** macOS `say -v {VOICE}` (kostenlos, lokal)\n"
        f"**Musik:** Mixkit Piano Reflections (geduckt unter VO)\n"
        f"**Dauer:** ~{total:.1f}s\n\n"
        f"{note.strip()}\n\n"
        f"Neu erzeugen: ` .venv-marketing/bin/python marketing/scripts/generate_macos_voice_reels.py `\n",
        encoding="utf-8",
    )
    silent.unlink(missing_ok=True)
    return final


def main() -> None:
    outputs: list[Path] = []

    # ── Video 1: Grenzgänger ───────────────────────────────────────────────
    vo1 = (
        "Wohnst du in Deutschland und arbeitest in der Schweiz oder Österreich? "
        "Grenzgänger verlieren oft den Überblick über ihre Auslandsbelege. "
        "TaxDoc hilft dir, Schweizer Lohnabrechnungen und die Ansässigkeitsbescheinigung "
        "an einem Ort zu ordnen – damit bei der Steuererklärung alles bereitsteht. "
        "Kommentier Grenze für die kostenlose Beta. Link in der Bio."
    )
    cap1 = (
        "Wohnst du in DE und arbeitest in CH/AT?\n"
        "TaxDoc ordnet Auslandsbelege an einem Ort — unverbindlich.\n"
        "Kommentier GRENZE · Link in Bio\n"
        "Hilfsmittel, keine Steuerberatung.\n"
        "#grenzgänger #steuererklärung #betatest #schweiz #österreich #taxdoc"
    )
    out1 = build_one(
        MARKETING / "reel-voice-01",
        "taxdoc-voice-01-grenzgaenger.mp4",
        vo1,
        build_grenzgaenger_slides,
        [1.0, 2.4, 1.1],
        cap1,
        "Quelle: marketing/scripts/VIDEO-1-GRENZGAENGER.md — rechtssicher, unverbindlich.",
    )
    outputs.append(out1)

    # ── Video 2: Masse / Abo ───────────────────────────────────────────────
    vo2 = (
        "Warum für die Beleg-Ablage ein teures Jahres-Abo abschließen? "
        "Wenn du deine Belege für Homeoffice, Fahrtkosten oder Handwerker übers Jahr "
        "einfach sortieren willst, brauchst du keinen Abo-Zwang. "
        "Lade das Foto einfach in TaxDoc hoch, lass die KI die Übersicht erstellen "
        "und spare dir den Stress. "
        "Teste die unverbindliche Beta jetzt kostenlos über den Link in der Bio."
    )
    cap2 = (
        "Warum teures Jahres-Abo für Beleg-Ablage?\n"
        "TaxDoc: Foto hochladen · KI-Übersicht · kein Abo-Zwang.\n"
        "Unverbindliche Beta — Link in Bio\n"
        "Hilfsmittel, keine Steuerberatung.\n"
        "#steuererklärung #homeoffice #betatest #deutschland #belege #taxdoc"
    )
    out2 = build_one(
        MARKETING / "reel-voice-02",
        "taxdoc-voice-02-masse.mp4",
        vo2,
        build_masse_slides,
        [1.0, 2.6, 1.2],
        cap2,
        "Quelle: marketing/scripts/VIDEO-2-MASSE-ABO.md — unverbindlich, kein Abo-Zwang.",
    )
    outputs.append(out2)

    # ── Short hooks 01 / 02 / 04 (reuse existing visuals) ───────────────────
    short_vos = [
        (
            "03",
            "taxdoc-voice-03-download-chaos.mp4",
            MARKETING / "reel-hook-01",
            (
                "Steuer-PDFs im Download-Chaos? Suchen. Tippen. Verlieren. "
                "TaxDoc: hochladen, sortieren, Überblick. "
                "Beta gratis — kein Abo-Zwang. Hilfsmittel, keine Beratung. Link in der Bio."
            ),
            [1.0, 1.0, 1.8, 1.2],
            "Kurz-Hook aus reel-hook-01 — macOS Anna + Mixkit.",
        ),
        (
            "04",
            "taxdoc-voice-04-vorher-nachher.mp4",
            MARKETING / "reel-hook-02",
            (
                "Vorher: Schuhkarton. Nachher: ein Ort. "
                "TaxDoc Beta — Upload, KI, Überblick. "
                "Fair: du prüfst selbst. Beta gratis. Link in der Bio."
            ),
            [1.0, 1.1, 1.4, 1.2],
            "Kurz-Hook aus reel-hook-02 — macOS Anna + Mixkit.",
        ),
        (
            "05",
            "taxdoc-voice-05-wer-sortiert.mp4",
            MARKETING / "reel-hook-04",
            (
                "Wer sortiert eigentlich eure Belege? Genau. Niemand. "
                "Deshalb: TaxDoc Beta — hochladen, KI sortiert, Überblick. "
                "Beta gratis. Feedback willkommen. Link in der Bio."
            ),
            [1.2, 1.0, 1.6, 1.2],
            "Kurz-Hook aus reel-hook-04 — macOS Anna + Mixkit.",
        ),
    ]

    for num, fname, hook_src, vo, weights, note in short_vos:
        folder = MARKETING / f"reel-voice-{num}"
        # copy caption from source if present
        src_cap = hook_src / "CAPTION-IG.txt"
        caption = src_cap.read_text(encoding="utf-8") if src_cap.exists() else vo

        def builder(out: Path, durs: list[float], src=hook_src) -> list[tuple[Path, float]]:
            # Prefer freshly copied slides into voice folder for self-contained package
            for png in sorted(src.glob("slide-*.png")):
                dest = out / png.name
                if not dest.exists():
                    shutil.copy2(png, dest)
            return reuse_existing_hook_slides(out, durs)

        path = build_one(folder, fname, vo, builder, weights, caption, note)
        outputs.append(path)

    # Master README
    master = MARKETING / "reel-voice-README.md"
    lines = [
        "# TaxDoc Voice Reels (macOS `say` — kostenlos)",
        "",
        f"**Stimme:** `{VOICE}` (de_DE, System) — kein ElevenLabs / OpenAI / Gemini.",
        "**Musik:** `marketing/audio/taxdoc-calm-piano.aac` (Mixkit Piano Reflections), stark geduckt.",
        "",
        "## Outputs",
        "",
    ]
    for p in outputs:
        lines.append(f"- `{p.relative_to(ROOT)}`")
    lines += [
        "",
        "## Neu erzeugen",
        "",
        "```bash",
        "say -v '?' | grep -i de   # Stimmen prüfen",
        ".venv-marketing/bin/python marketing/scripts/generate_macos_voice_reels.py",
        "```",
        "",
        "## Rechtliches",
        "",
        "- Unverbindlich / Beta — keine Steuerberatung.",
        "- Keine Fake-ELSTER-Claims; Abgabe bleibt beim Nutzer.",
        "- Scripts: `VIDEO-1-GRENZGAENGER.md`, `VIDEO-2-MASSE-ABO.md`.",
        "",
    ]
    master.write_text("\n".join(lines), encoding="utf-8")
    print("Done:")
    for p in outputs:
        print(" ", p)


if __name__ == "__main__":
    main()
