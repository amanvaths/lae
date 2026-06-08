#!/usr/bin/env python3
"""Generate a branded LAE coin face texture -> public/lae-coin.png (1024x1024 RGBA).

This is a stand-in so the 3D coin works out of the box. Replace
public/lae-coin.png with the official artwork (square, transparent outside the
circle) and the 3D coin picks it up automatically.
"""
import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

S = 2  # supersample factor
SIZE = 1024
W = SIZE * S
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "public", "lae-coin.png")
os.makedirs(os.path.dirname(OUT), exist_ok=True)

ARIAL_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
ARIAL_BLACK = "/System/Library/Fonts/Supplemental/Arial Black.ttf"


def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.truetype(ARIAL_BOLD, size)


# Gold tones
GOLD_HI = (255, 232, 150)
GOLD = (240, 196, 78)
GOLD_D = (176, 124, 28)
GOLD_DD = (120, 80, 14)
DARK = (18, 12, 6)
DARK2 = (40, 28, 12)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def radial_disc(cx, cy, r, c_in, c_out):
    """Return an RGBA image of a radial-gradient filled circle."""
    img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    px = img.load()
    r2 = r * r
    for y in range(int(cy - r), int(cy + r) + 1):
        for x in range(int(cx - r), int(cx + r) + 1):
            dx, dy = x - cx, y - cy
            d2 = dx * dx + dy * dy
            if d2 <= r2:
                t = math.sqrt(d2) / r
                px[x, y] = lerp(c_in, c_out, t) + (255,)
    return img


def main():
    img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx = cy = W / 2

    R = W / 2 - 6 * S            # outer edge
    rim_in = R - 70 * S          # inner edge of gold rim
    face = rim_in - 10 * S       # dark face radius

    # --- outer gold rim (angular shading for metallic feel) ---
    for i in range(360):
        a0 = math.radians(i)
        a1 = math.radians(i + 1.5)
        # vary brightness around the ring for a brushed-metal look
        shade = 0.5 + 0.5 * math.sin(a0 * 1.0 + 0.6)
        col = lerp(GOLD_D, GOLD_HI, shade)
        d.pieslice([cx - R, cy - R, cx + R, cy + R],
                   math.degrees(a0), math.degrees(a1), fill=col + (255,))
    # reeded (milled) outer edge ticks
    for i in range(220):
        a = math.radians(i * 360 / 220)
        x0 = cx + math.cos(a) * (R - 2 * S)
        y0 = cy + math.sin(a) * (R - 2 * S)
        x1 = cx + math.cos(a) * R
        y1 = cy + math.sin(a) * R
        d.line([x0, y0, x1, y1], fill=GOLD_DD + (255,), width=max(1, S))

    # carve inner area: dark face disc with radial gradient
    disc = radial_disc(cx, cy, rim_in, DARK2, (8, 5, 2))
    img.alpha_composite(disc)

    # rim inner bevel lines
    d.ellipse([cx - rim_in, cy - rim_in, cx + rim_in, cy + rim_in],
              outline=GOLD_HI + (255,), width=3 * S)
    d.ellipse([cx - face, cy - face, cx + face, cy + face],
              outline=GOLD_D + (220,), width=2 * S)

    # faint circuit traces on the face
    import random
    random.seed(7)
    for _ in range(60):
        a = random.uniform(0, 2 * math.pi)
        rr = random.uniform(face * 0.18, face * 0.92)
        x0 = cx + math.cos(a) * rr
        y0 = cy + math.sin(a) * rr
        # right-angle traces
        seg = random.choice([1, -1]) * random.uniform(20, 70) * S
        if random.random() < 0.5:
            d.line([x0, y0, x0 + seg, y0], fill=GOLD_DD + (90,), width=max(1, S))
            d.ellipse([x0 + seg - 3 * S, y0 - 3 * S, x0 + seg + 3 * S, y0 + 3 * S],
                      fill=GOLD_D + (110,))
        else:
            d.line([x0, y0, x0, y0 + seg], fill=GOLD_DD + (90,), width=max(1, S))
            d.ellipse([x0 - 3 * S, y0 + seg - 3 * S, x0 + 3 * S, y0 + seg + 3 * S],
                      fill=GOLD_D + (110,))

    # --- circular text ---
    def arc_text(text, radius, mid_deg, total_deg, fsize, bottom=False):
        f = font(ARIAL_BOLD, fsize)
        n = len(text)
        if n == 0:
            return
        step = total_deg / max(n - 1, 1)
        start = mid_deg - total_deg / 2
        for i, ch in enumerate(text):
            ang = start + i * step  # degrees, 0 = +x (right), CCW positive screen-down
            # position (screen coords: y grows downward)
            theta = math.radians(ang)
            x = cx + math.cos(theta) * radius
            y = cy + math.sin(theta) * radius
            # glyph image
            bbox = f.getbbox(ch)
            gw = max(bbox[2] - bbox[0], 1) + 8 * S
            gh = max(bbox[3] - bbox[1], 1) + 8 * S
            gimg = Image.new("RGBA", (gw, gh), (0, 0, 0, 0))
            gd = ImageDraw.Draw(gimg)
            gd.text((4 * S - bbox[0], 4 * S - bbox[1]), ch, font=f, fill=GOLD_HI + (255,))
            # rotation so text sits tangent to circle
            if bottom:
                rot = -(ang - 90)
            else:
                rot = -(ang + 90)
            gimg = gimg.rotate(rot, expand=True, resample=Image.BICUBIC)
            img.alpha_composite(gimg, (int(x - gimg.width / 2), int(y - gimg.height / 2)))

    band_r = (rim_in + face) / 2 + 18 * S
    arc_text("DECENTRALISED  •  SECURE  •  TRANSPARENT",
             band_r, -90, 150, 30 * S, bottom=False)
    arc_text("POWERED BY BLOCKCHAIN  •  COMMUNITY DRIVEN",
             band_r, 90, 150, 30 * S, bottom=True)

    # side stars
    fstar = font(ARIAL_BOLD, 40 * S)
    for ang in (180, 0):
        theta = math.radians(ang)
        x = cx + math.cos(theta) * band_r
        y = cy + math.sin(theta) * band_r
        d.text((x, y), "★", font=fstar, fill=GOLD_HI + (255,), anchor="mm")

    # --- center LAE monogram (beveled) ---
    fmono = font(ARIAL_BLACK, 300 * S)
    # shadow
    d.text((cx + 5 * S, cy - 40 * S + 6 * S), "LAE", font=fmono, fill=(0, 0, 0, 200), anchor="mm")
    # gold fill
    d.text((cx, cy - 40 * S), "LAE", font=fmono, fill=GOLD + (255,), anchor="mm")
    # top highlight
    d.text((cx, cy - 40 * S - 3 * S), "LAE", font=font(ARIAL_BLACK, 300 * S), fill=(0, 0, 0, 0), anchor="mm")

    # underline + label
    fl = font(ARIAL_BOLD, 64 * S)
    d.text((cx, cy + 150 * S), "LAE", font=fl, fill=GOLD_HI + (255,), anchor="mm")
    d.line([cx - 150 * S, cy + 150 * S, cx - 70 * S, cy + 150 * S], fill=GOLD_D + (255,), width=3 * S)
    d.line([cx + 70 * S, cy + 150 * S, cx + 150 * S, cy + 150 * S], fill=GOLD_D + (255,), width=3 * S)

    # subtle top-light sheen overlay
    sheen = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sheen)
    sd.ellipse([cx - R, cy - R - R * 0.5, cx + R, cy + R * 0.2],
               fill=(255, 255, 255, 26))
    mask = Image.new("L", (W, W), 0)
    ImageDraw.Draw(mask).ellipse([cx - R, cy - R, cx + R, cy + R], fill=255)
    sheen.putalpha(Image.composite(sheen.split()[3], Image.new("L", (W, W), 0), mask))
    sheen = sheen.filter(ImageFilter.GaussianBlur(20 * S))
    img.alpha_composite(sheen)

    # downscale (AA)
    img = img.resize((SIZE, SIZE), Image.LANCZOS)
    img.save(OUT)
    print("Wrote", os.path.normpath(OUT), img.size)


if __name__ == "__main__":
    main()
