"""Liquid-glass carousel: 3 slides (1080x1350) cut from one continuous 3240x1350 scene.

Usage: python3 -I make_slides_glass.py OUT_DIR [data.json]
data.json: {"date": "Oct 22", "total": 65, "picks": [["Meta", "Full posting title", "Short title"], ... 5 items]}
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from scipy import ndimage as ndi

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)

DATE = "Oct 21"
TOTAL = 65
PICKS = [
    ("Meta", "Research Scientist Intern, Robotics"),
    ("LinkedIn", "Software Engineer Intern"),
    ("Uber", "Software Engineer Intern"),
    ("NVIDIA", "Software Intern, Embedded Systems"),
    ("Apple", "Machine Learning Research Intern, Speech Translation"),
]
if len(sys.argv) > 2:
    with open(sys.argv[2]) as fh:
        cfg = json.load(fh)
    DATE, TOTAL = cfg["date"], int(cfg["total"])
    # a pick is [company, title] or [company, title, shorter title to show on the slide]
    PICKS = [(p[0], p[2] if len(p) > 2 else p[1]) for p in cfg["picks"]]
assert len(PICKS) == 5

W, H = 1080, 1350
PW = W * 3
FONT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")
rng = np.random.default_rng(7)


def F(weight, size):
    return ImageFont.truetype(f"{FONT_DIR}/Bricolage-{weight}.ttf", size)


WARM = (255, 244, 234)

# ------------------------------------------------------------------ scene
yy, xx = np.mgrid[0:H, 0:PW].astype(np.float32)
scene = np.zeros((H, PW, 3), np.float32)
scene[:] = np.array([0.105, 0.028, 0.045], np.float32)


def screen(base, color, mask):
    c = np.array(color, np.float32)
    return 1 - (1 - base) * (1 - mask[..., None] * c)


def orb(cx, cy, r, color, k):
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / r
    m = np.clip(1 - d, 0, 1) ** 1.7 * k
    return m


ORBS = [
    (790, 470, 660, (1.00, 0.60, 0.10), 0.95),   # amber, behind the number
    (110, 1260, 520, (1.00, 0.28, 0.34), 0.50),
    (140, 120, 430, (1.00, 0.40, 0.28), 0.55),
    (1500, 330, 640, (1.00, 0.20, 0.36), 0.75),  # rose
    (2020, 1040, 620, (1.00, 0.38, 0.08), 0.80), # tangerine
    (2470, 390, 600, (0.88, 0.10, 0.22), 0.85),  # crimson
    (2720, 800, 560, (1.00, 0.68, 0.16), 0.90),  # amber behind the slab
]
for cx, cy, r, col, k in ORBS:
    scene = screen(scene, col, orb(cx, cy, r, col, k))

# thin light streaks, give the glass something to bend
for x0, y0, ang, length, width, a in [
    (500, 700, -28, 1500, 9, 0.22),
    (1700, 560, -28, 1700, 14, 0.18),
    (2500, 900, -28, 1400, 8, 0.22),
    (900, 1180, -28, 900, 6, 0.16),
]:
    th = np.deg2rad(ang)
    dx, dy = xx - x0, yy - y0
    along = dx * np.cos(th) + dy * np.sin(th)
    perp = -dx * np.sin(th) + dy * np.cos(th)
    m = np.exp(-(perp / width) ** 2) * np.exp(-(along / length) ** 2) * a
    scene = screen(scene, (1.0, 0.86, 0.72), m)

# rings: crisp edges that the glass will visibly warp
ring = Image.new("L", (PW, H), 0)
rd = ImageDraw.Draw(ring)
for cx, cy, r, wd, a in [(1100, 700, 295, 5, 120), (3120, 1130, 190, 4, 90), (1650, 1180, 260, 4, 90)]:
    rd.ellipse([cx - r, cy - r, cx + r, cy + r], outline=a, width=wd)
ring = np.asarray(ring.filter(ImageFilter.GaussianBlur(1.2)), np.float32) / 255
scene = screen(scene, (1.0, 0.80, 0.55), ring)

# the big number, drawn into the scene so the lens can bend it
num_font_size = 780
nf = F(300, num_font_size)
text = str(TOTAL)
bb = nf.getbbox(text)
target_w = 880
nf = F(300, int(num_font_size * target_w / (bb[2] - bb[0])))
bb = nf.getbbox(text)
numlayer = Image.new("L", (PW, H), 0)
nx = 70 - bb[0]
ny = 150 - bb[1]
ImageDraw.Draw(numlayer).text((nx, ny), text, font=nf, fill=245)
numa = np.asarray(numlayer, np.float32) / 255
scene = scene * (1 - numa[..., None]) + np.array(WARM, np.float32) / 255 * numa[..., None]
NUM_BOTTOM = 150 + (bb[3] - bb[1])


# ------------------------------------------------------------------ glass
def glass(bg, box, radius, tint, tint_a, blur, bezel, strength, ca=0.05, mag=1.0,
          shadow=0.35, margin=160):
    x0, y0, x1, y1 = box
    X0, Y0 = max(0, int(x0 - margin)), max(0, int(y0 - margin))
    X1, Y1 = min(bg.shape[1], int(x1 + margin)), min(bg.shape[0], int(y1 + margin))
    sub = bg[Y0:Y1, X0:X1].copy()
    h, w = sub.shape[:2]
    gy_, gx_ = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy = (x0 + x1) / 2 - X0, (y0 + y1) / 2 - Y0
    hw, hh = (x1 - x0) / 2, (y1 - y0) / 2
    qx, qy = np.abs(gx_ - cx) - (hw - radius), np.abs(gy_ - cy) - (hh - radius)
    out = np.sqrt(np.maximum(qx, 0) ** 2 + np.maximum(qy, 0) ** 2) + np.minimum(np.maximum(qx, qy), 0) - radius
    sd = -out  # positive inside
    alpha = np.clip(sd + 0.5, 0, 1)

    # soft drop shadow under the slab
    sh = ndi.gaussian_filter(np.roll((sd > 0).astype(np.float32), 26, axis=0), 30)
    sub = sub * (1 - shadow * sh[..., None])

    # edge normals
    g_y, g_x = np.gradient(ndi.gaussian_filter(sd, 1.5))
    gn = np.sqrt(g_x ** 2 + g_y ** 2) + 1e-6
    nix, niy = g_x / gn, g_y / gn  # points inward

    t = np.clip(sd / bezel, 0, 1)
    prof = (1 - t) ** 2.2
    base_x = cx + (gx_ - cx) / mag
    base_y = cy + (gy_ - cy) / mag

    chans = []
    for c, k in enumerate((1 - ca, 1.0, 1 + ca)):
        px = base_x - nix * prof * strength * k
        py = base_y - niy * prof * strength * k
        chans.append(ndi.map_coordinates(sub[..., c], [py, px], order=1, mode="nearest"))
    g = np.stack(chans, -1)
    if blur > 0:
        g = ndi.gaussian_filter(g, (blur, blur, 0))

    tc = np.array(tint, np.float32)
    g = g * (1 - tint_a) + tc * tint_a
    g = g + 0.035  # faint veil

    # light on the rim: bright top-left, faint bottom-right
    light = np.array([-0.55, -0.83], np.float32)
    facing = (-nix) * light[0] + (-niy) * light[1]
    rim = np.exp(-(np.maximum(sd, 0) / 2.1) ** 2)
    hl = rim * (0.10 + 0.90 * np.clip(facing, 0, 1) ** 1.4) + rim * 0.30 * np.clip(-facing, 0, 1) ** 2
    glow = np.exp(-(np.maximum(sd, 0) / 16) ** 2) * 0.12 * (0.4 + 0.6 * np.clip(facing, 0, 1))
    g = 1 - (1 - g) * (1 - np.clip(hl + glow, 0, 1)[..., None] * np.array([1.0, 0.96, 0.92], np.float32))

    res = sub * (1 - alpha[..., None]) + g * alpha[..., None]
    bg[Y0:Y1, X0:X1] = res
    return bg


# slide 1: a clear lens over the number
lens_d = 470
lens_c = (700, 610)
scene = glass(scene, (lens_c[0] - lens_d / 2, lens_c[1] - lens_d / 2, lens_c[0] + lens_d / 2, lens_c[1] + lens_d / 2),
              radius=lens_d / 2, tint=(1, 0.9, 0.8), tint_a=0.04, blur=1.2, bezel=62, strength=58, ca=0.07, mag=1.22)

# slide 2: one smoked sheet holding all five postings
SHEET = (W + 60, 300, W + 1020, 1250)
scene = glass(scene, SHEET, radius=78, tint=(0.06, 0.012, 0.02), tint_a=0.34, blur=13, bezel=46, strength=44, ca=0.05)

# slide 3: a clear slab that holds the keyword
SLAB = (2 * W + 80, 740, 2 * W + 800, 960)
scene = glass(scene, SLAB, radius=34, tint=(1, 0.92, 0.85), tint_a=0.07, blur=2.5, bezel=38, strength=44, ca=0.08)

# grain keeps gradients from banding
scene += rng.normal(0, 0.010, scene.shape).astype(np.float32)
scene = np.clip(scene, 0, 1)
pano = Image.fromarray((scene * 255 + 0.5).astype(np.uint8), "RGB")


# ------------------------------------------------------------------ type
def put(img, xy, s, font, fill=WARM, alpha=1.0, shadow=0.45, anchor="ls", blur=7):
    w, h = img.size
    if shadow:
        sh = Image.new("L", (w, h), 0)
        ImageDraw.Draw(sh).text((xy[0], xy[1] + 4), s, font=font, fill=int(255 * shadow), anchor=anchor)
        sh = sh.filter(ImageFilter.GaussianBlur(blur))
        img.paste(Image.new("RGB", (w, h), (20, 4, 8)), (0, 0), sh)
    layer = Image.new("L", (w, h), 0)
    ImageDraw.Draw(layer).text(xy, s, font=font, fill=int(255 * alpha), anchor=anchor)
    img.paste(Image.new("RGB", (w, h), fill), (0, 0), layer)


def fit_font(weight, size, text, maxw):
    while F(weight, size).getlength(text) > maxw and size > 22:
        size -= 1
    return F(weight, size)


# slide 1
s1 = pano.crop((0, 0, W, H))
put(s1, (80, 112), DATE, F(400, 40), alpha=0.85, shadow=0)
put(s1, (80, 1000), "new tech internships", F(500, 82))
put(s1, (80, 1092), "posted today.", F(500, 82))
put(s1, (80, 1228), "Swipe for a look at five of them.", F(300, 40), alpha=0.78)
s1.save(f"{OUT}/slide_1_cover.png")

# slide 2
s2 = pano.crop((W, 0, 2 * W, H))
put(s2, (80, 205), "Five to apply to today", F(600, 78))
sx0, sy0, sx1, sy1 = 60, 300, 1020, 1250
row_h = (sy1 - sy0 - 60) / 5
d2 = ImageDraw.Draw(s2, "RGBA")
for i, (co, role) in enumerate(PICKS):
    top = sy0 + 30 + i * row_h
    put(s2, (sx0 + 66, int(top + 84)), co, fit_font(600, 56, co, 780), shadow=0.35, blur=5)
    put(s2, (sx0 + 66, int(top + 132)), role, fit_font(300, 33, role, 780), alpha=0.82, shadow=0.35, blur=5)
    if i < 4:
        ly = int(top + row_h - 2)
        d2.line([(sx0 + 66, ly), (sx1 - 66, ly)], fill=(255, 235, 220, 46), width=2)
        d2.line([(sx0 + 66, ly + 2), (sx1 - 66, ly + 2)], fill=(0, 0, 0, 40), width=1)
s2.save(f"{OUT}/slide_2_picks.png")

# slide 3
s3 = pano.crop((2 * W, 0, 3 * W, H))
put(s3, (80, 370), f"Want all {TOTAL}", F(500, 148))
put(s3, (80, 520), "postings?", F(500, 148))
put(s3, (80, 690), "Comment", F(300, 54), alpha=0.9)
slab_cx = (SLAB[0] + SLAB[2]) / 2 - 2 * W
slab_cy = (SLAB[1] + SLAB[3]) / 2
put(s3, (slab_cx, slab_cy + 4), "POSTINGS", F(700, 104), anchor="mm", shadow=0.4, blur=6)
put(s3, (80, 1040), "and I'll send you today's full list.", F(300, 46), alpha=0.9)
put(s3, (80, 1228), "Follow for a new drop every day.", F(500, 44))
s3.save(f"{OUT}/slide_3_cta.png")
# smaller JPEG copies are what gets hosted and posted
for name in ("slide_1_cover", "slide_2_picks", "slide_3_cta"):
    Image.open(f"{OUT}/{name}.png").convert("RGB").save(f"{OUT}/{name}.jpg", quality=90, optimize=True)
print("ok")
