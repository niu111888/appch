#!/usr/bin/env python3
# キャラクターシートから各キャラを自動検出して個別に透過切り抜き＋一覧を作る。
from PIL import Image, ImageDraw, ImageFont
import numpy as np
from collections import deque
import os

SRC = "public/character/sheet1.png"
OUTDIR = "public/character/cut"
os.makedirs(OUTDIR, exist_ok=True)

img = Image.open(SRC).convert("RGBA")
W, H = img.size
rgb = img.convert("RGB")
bg = rgb.getpixel((3, 3))
SENT = (255, 0, 255)

def creamish(p):
    return abs(p[0]-bg[0]) + abs(p[1]-bg[1]) + abs(p[2]-bg[2]) < 72

# 縁から繋がったクリームを塗りつぶし（=背景）
for x in range(0, W, 6):
    for s in [(x, 0), (x, H-1)]:
        if creamish(rgb.getpixel(s)):
            ImageDraw.floodfill(rgb, s, SENT, thresh=46)
for y in range(0, H, 6):
    for s in [(0, y), (W-1, y)]:
        if creamish(rgb.getpixel(s)):
            ImageDraw.floodfill(rgb, s, SENT, thresh=46)

arr = np.array(rgb)
fg = ~np.all(arr == SENT, axis=2)

# 透過RGBA（背景alpha0）
rgba = np.array(img)
rgba[np.all(arr == SENT, axis=2), 3] = 0
cut_full = Image.fromarray(rgba, "RGBA")

# 1/4縮小で連結成分検出
f = 4
small = fg[::f, ::f]
sh, sw = small.shape
visited = np.zeros_like(small, dtype=bool)
comps = []
for yy in range(sh):
    for xx in range(sw):
        if small[yy, xx] and not visited[yy, xx]:
            q = deque([(yy, xx)]); visited[yy, xx] = True
            minx = maxx = xx; miny = maxy = yy; area = 0
            while q:
                cy, cx = q.popleft(); area += 1
                minx = min(minx, cx); maxx = max(maxx, cx)
                miny = min(miny, cy); maxy = max(maxy, cy)
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = cy+dy, cx+dx
                    if 0 <= ny < sh and 0 <= nx < sw and small[ny, nx] and not visited[ny, nx]:
                        visited[ny, nx] = True; q.append((ny, nx))
            comps.append((area, minx*f, miny*f, (maxx+1)*f, (maxy+1)*f))

# キャラらしい大きさのものだけ（小さい装飾・文字を除外）
comps = [c for c in comps if c[0] > 700]
comps.sort(reverse=True)
comps = comps[:14]

cells = []
for i, (area, x0, y0, x1, y1) in enumerate(comps):
    pad = 8
    bx = (max(0, x0-pad), max(0, y0-pad), min(W, x1+pad), min(H, y1+pad))
    c = cut_full.crop(bx)
    bb = c.getbbox()
    if bb:
        c = c.crop(bb)
    c.save(f"{OUTDIR}/char_{i}.png")
    print(i, "area", area, "box", bx, "size", c.size)
    cells.append((i, c))

# コンタクトシート（クリーム地に番号つきで並べる）
cols = 5
cw, ch = 260, 260
rows = (len(cells) + cols - 1) // cols
sheet = Image.new("RGB", (cols*cw, rows*ch), (245, 238, 222))
d = ImageDraw.Draw(sheet)
for idx, (i, c) in enumerate(cells):
    cc = c.copy(); cc.thumbnail((230, 200))
    px = (idx % cols)*cw; py = (idx // cols)*ch
    sheet.paste(cc, (px + (cw-cc.width)//2, py + (ch-cc.height)//2 + 14), cc)
    d.text((px+10, py+8), f"#{i}", fill=(150, 50, 60))
sheet.save("out/_charsheet.png")
print("contact:", "out/_charsheet.png")
