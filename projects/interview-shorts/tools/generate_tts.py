#!/usr/bin/env python3
"""Generate Instagram VO wavs with Gemini TTS (calm explainer default)."""

from __future__ import annotations

import argparse
import os
import re
import sys
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
DEFAULT_STYLE = ROOT / "voice" / "narrator_style.txt"
DEFAULT_OUT_DIR = ROOT / "output" / "vo"
VOICES = (
    "Zephyr",
    "Puck",
    "Charon",
    "Kore",
    "Fenrir",
    "Leda",
    "Orus",
    "Aoede",
    "Callirrhoe",
    "Autonoe",
    "Enceladus",
    "Iapetus",
    "Umbriel",
    "Algieba",
    "Despina",
    "Erinome",
    "Algenib",
    "Rasalgethi",
    "Laomedeia",
    "Achernar",
    "Alnilam",
    "Schedar",
    "Gacrux",
    "Pulcherrima",
    "Achird",
    "Zubenelgenubi",
    "Vindemiatrix",
    "Sadachbia",
    "Sadaltager",
    "Sulafat",
)
MODELS = (
    "gemini-2.5-flash-preview-tts",
    "gemini-2.5-pro-preview-tts",
    "gemini-3.1-flash-tts-preview",
)


def load_dotenv() -> None:
    """Load repo-root or project .env if present (no dependency on python-dotenv)."""
    for path in (REPO / ".env", ROOT / ".env"):
        if not path.is_file():
            continue
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip("'").strip('"')
            os.environ.setdefault(key, value)


def write_wav(path: Path, pcm: bytes, *, rate: int = 24000) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(rate)
        wf.writeframes(pcm)


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", text.strip().lower()).strip("-")
    return slug[:48] or "vo"


def build_prompt(script: str, style: str) -> str:
    style = style.strip()
    script = script.strip()
    if not style:
        return script
    return f"""{style}

#### TRANSCRIPT
{script}
"""


def synthesize(
    *,
    text: str,
    voice: str,
    model: str,
    out_path: Path,
) -> Path:
    from google import genai
    from google.genai import types

    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print(
            "Missing GEMINI_API_KEY (or GOOGLE_API_KEY).\n"
            "1) Create a key at https://aistudio.google.com/apikey\n"
            "2) Copy projects/interview-shorts/.env.example → repo .env\n"
            "3) Paste: GEMINI_API_KEY=your_key",
            file=sys.stderr,
        )
        raise SystemExit(1)

    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=model,
        contents=text,
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name=voice,
                    )
                )
            ),
        ),
    )

    try:
        part = response.candidates[0].content.parts[0]
        data = part.inline_data.data
    except (AttributeError, IndexError, TypeError) as exc:
        print(f"TTS response missing audio data: {response}", file=sys.stderr)
        raise SystemExit(1) from exc

    if isinstance(data, str):
        import base64

        data = base64.b64decode(data)

    write_wav(out_path, data)
    return out_path


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Generate calm explainer VO with Gemini TTS.",
    )
    src = p.add_mutually_exclusive_group(required=False)
    src.add_argument("--text", help="Inline script to speak")
    src.add_argument("--file", type=Path, help="Path to a .txt / .md script file")
    p.add_argument(
        "--voice",
        default="Charon",
        choices=VOICES,
        help="Gemini prebuilt voice (default: Charon — informative)",
    )
    p.add_argument(
        "--model",
        default="gemini-2.5-flash-preview-tts",
        choices=MODELS,
        help="TTS model (flash for shorts; pro for longer VO)",
    )
    p.add_argument(
        "--style-file",
        type=Path,
        default=DEFAULT_STYLE,
        help="Director-style prompt prepended to the transcript",
    )
    p.add_argument(
        "--no-style",
        action="store_true",
        help="Speak the raw transcript only (no narrator style prompt)",
    )
    p.add_argument(
        "--out",
        type=Path,
        help="Output .wav path (default: output/vo/<slug>.wav)",
    )
    p.add_argument(
        "--list-voices",
        action="store_true",
        help="Print available voices and exit",
    )
    return p.parse_args()


def main() -> None:
    args = parse_args()
    if args.list_voices:
        for name in VOICES:
            print(name)
        return

    if not args.text and not args.file:
        print("Provide --text or --file (or --list-voices).", file=sys.stderr)
        raise SystemExit(2)

    load_dotenv()

    if args.file:
        script = args.file.read_text(encoding="utf-8")
        stem = args.file.stem
    else:
        script = args.text
        stem = slugify(script)

    style = ""
    if not args.no_style:
        if not args.style_file.is_file():
            print(f"Style file not found: {args.style_file}", file=sys.stderr)
            raise SystemExit(1)
        style = args.style_file.read_text(encoding="utf-8")

    prompt = build_prompt(script, style)
    out = args.out or (DEFAULT_OUT_DIR / f"{stem}_{args.voice.lower()}.wav")
    if out.suffix.lower() != ".wav":
        out = out.with_suffix(".wav")

    print(f"model={args.model} voice={args.voice}")
    print(f"script_chars={len(script.strip())} → {out}")
    path = synthesize(text=prompt, voice=args.voice, model=args.model, out_path=out)
    seconds = path.stat().st_size / (24000 * 2)
    print(f"wrote {path} (~{seconds:.1f}s mono 24kHz)")


if __name__ == "__main__":
    main()
