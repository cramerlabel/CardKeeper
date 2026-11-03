"""Generates the app icon, adaptive icon layers, splash image and favicon into ./assets.

Run from the repo root: python3 scripts/generate-assets.py  (requires Pillow)
"""

import math
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ASSETS = Path(__file__).resolve().parent.parent / "assets"

FELT = (11, 61, 46)
FELT_LIGHT = (24, 96, 74)
FELT_DARK = (7, 42, 32)
GOLD = (227, 181, 74)
GOLD_DARK = (185, 143, 46)
CREAM = (247, 241, 225)
CARD_EDGE = (214, 205, 180)

SS = 2  # supersampling factor for smooth edges
SIZE = 1024


def draw_spade(draw, cx, cy, width, fill):
    """Spade centred on (cx, cy): a heart curve (point up) with a flared stem."""
    k = width / 32
    body = []
    for i in range(361):
        t = math.radians(i)
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        body.append((cx + x * k, cy + y * k))
    draw.polygon(body, fill=fill)
    draw.polygon(
        [
            (cx - 1.6 * k, cy + 6 * k),
            (cx + 1.6 * k, cy + 6 * k),
            (cx + 4.8 * k, cy + 17.5 * k),
            (cx - 4.8 * k, cy + 17.5 * k),
        ],
        fill=fill,
    )


def rounded_card(size, fill, edge, radius):
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=edge)
    inset = 6 * SS
    d.rounded_rectangle(
        (inset, inset, size[0] - 1 - inset, size[1] - 1 - inset), radius=radius - inset, fill=fill
    )
    return img


def emblem(scale=1.0, mono=False):
    """Two fanned cards with a gold spade, on a transparent canvas of SIZE x SIZE."""
    s = SIZE * SS
    canvas = Image.new("RGBA", (s, s), (0, 0, 0, 0))

    card_w, card_h = int(300 * SS * scale), int(420 * SS * scale)
    radius = int(34 * SS * scale)
    spade_w = 190 * SS * scale

    def place(card, angle, dx, dy):
        rotated = card.rotate(angle, resample=Image.BICUBIC, expand=True)
        x = int(s / 2 + dx * SS * scale - rotated.width / 2)
        y = int(s / 2 + dy * SS * scale - rotated.height / 2)
        if not mono:
            pad = int(40 * SS * scale)  # room for the blur so the shadow isn't clipped to a box
            shadow = Image.new("RGBA", (rotated.width + 2 * pad, rotated.height + 2 * pad), (0, 0, 0, 0))
            mask = Image.new("L", shadow.size, 0)
            mask.paste(rotated.getchannel("A").point(lambda a: int(a * 0.35)), (pad, pad))
            shadow.putalpha(mask.filter(ImageFilter.GaussianBlur(14 * SS * scale)))
            canvas.alpha_composite(shadow, (x - pad, y - pad + int(10 * SS * scale)))
        canvas.alpha_composite(rotated, (x, y))

    if mono:
        white = (255, 255, 255, 255)
        place(rounded_card((card_w, card_h), white, white, radius), 14, 62, 6)
        front = rounded_card((card_w, card_h), white, white, radius)
        # Punch the spade out of the front card so the glyph still reads in a single-colour icon.
        hole = Image.new("L", front.size, 0)
        draw_spade(ImageDraw.Draw(hole), card_w / 2, card_h / 2, spade_w, 255)
        front.putalpha(ImageChops.subtract(front.getchannel("A"), hole))
        place(front, -9, -48, 0)
    else:
        place(rounded_card((card_w, card_h), (232, 224, 200, 255), CARD_EDGE, radius), 14, 62, 6)
        front = rounded_card((card_w, card_h), CREAM + (255,), CARD_EDGE, radius)
        draw_spade(ImageDraw.Draw(front), card_w / 2, card_h / 2, spade_w, GOLD_DARK)
        highlight = Image.new("RGBA", front.size, (0, 0, 0, 0))
        draw_spade(
            ImageDraw.Draw(highlight), card_w / 2 - 3 * SS, card_h / 2 - 3 * SS, spade_w * 0.96, GOLD
        )
        front.alpha_composite(highlight)
        place(front, -9, -48, 0)

    return canvas.resize((SIZE, SIZE), Image.LANCZOS)


def felt_background(size=SIZE):
    """Radial felt gradient: lighter in the centre, darker at the edges."""
    img = Image.new("RGB", (size, size), FELT)
    px = img.load()
    c = (size - 1) / 2
    maxd = math.hypot(c, c)
    for y in range(size):
        for x in range(size):
            t = min(1.0, math.hypot(x - c, y - c) / maxd) ** 1.4
            px[x, y] = tuple(round(a + (b - a) * t) for a, b in zip(FELT_LIGHT, FELT_DARK))
    return img


def main():
    bg = felt_background()

    icon = bg.convert("RGBA")
    icon.alpha_composite(emblem(scale=1.3))
    icon.convert("RGB").save(ASSETS / "icon.png")

    bg.save(ASSETS / "android-icon-background.png")

    # Adaptive layers: keep the artwork inside the central 66% safe zone.
    emblem(scale=0.95).save(ASSETS / "android-icon-foreground.png")
    emblem(scale=0.95, mono=True).save(ASSETS / "android-icon-monochrome.png")

    # Splash: transparent emblem; the felt colour comes from the splash plugin's backgroundColor.
    emblem(scale=1.3).save(ASSETS / "splash-icon.png")

    icon.convert("RGB").resize((96, 96), Image.LANCZOS).save(ASSETS / "favicon.png")


if __name__ == "__main__":
    main()
