#!/usr/bin/env python3
# ロゴから3匹のキャラだけを透過で切り抜く。
# 縁から繋がっているクリーム背景だけを消すので、キャラ内部の白は残る。
from PIL import Image, ImageDraw
import sys, os

SRC = "public/character/logo.png"
OUT = "public/character/trio.png"
# 文字や桜・竹を除外して、3匹の周辺だけをクロップ（left, top, right, bottom）
BOX = tuple(int(x) for x in (sys.argv[1].split(",") if len(sys.argv) > 1 else "420,60,985,475".split(",")))
THRESH = int(sys.argv[2]) if len(sys.argv) > 2 else 42

img = Image.open(SRC).convert("RGBA")
crop = img.crop(BOX)
w, h = crop.size
rgb = crop.convert("RGB")
bg = rgb.getpixel((2, 2))
FILL = (255, 0, 255)

def creamish(p):
    return abs(p[0]-bg[0]) + abs(p[1]-bg[1]) + abs(p[2]-bg[2]) < 70

# 4辺から多数の種点でフラッドフィル（縁続きのクリームだけを塗りつぶす）
step = 8
seeds = []
for x in range(0, w, step):
    seeds += [(x, 0), (x, h-1)]
for y in range(0, h, step):
    seeds += [(0, y), (w-1, y)]
for s in seeds:
    if creamish(rgb.getpixel(s)):
        ImageDraw.floodfill(rgb, s, FILL, thresh=THRESH)

out = crop.copy()
src_px = rgb.load()
dst_px = out.load()
removed = 0
for y in range(h):
    for x in range(w):
        if src_px[x, y] == FILL:
            r, g, b, a = dst_px[x, y]
            dst_px[x, y] = (r, g, b, 0)
            removed += 1

# 余白をトリミング（透明部分を詰める）
bbox = out.getbbox()
if bbox:
    out = out.crop(bbox)
out.save(OUT)
print(f"saved {OUT} size={out.size} removed={removed}/{w*h}px")
