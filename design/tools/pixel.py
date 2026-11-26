# 把高解析度的「像素風插圖」轉成和孤勇者一樣的小尺寸像素圖：縮小、去半透明、減色、加深棕外框
import sys, glob, os
from PIL import Image, ImageDraw
SRC, OUT = (sys.argv[1:3] + [None, None])[:2]
EDGE = (59, 38, 22, 255)
def crop_alpha(im):
    bb = im.getchannel('A').point(lambda a: 255 if a > 40 else 0).getbbox(); return im.crop(bb) if bb else im
def pixelize(im, size, colors=14):
    im = crop_alpha(im.convert('RGBA'))
    w, h = im.size; s = size / max(w, h); nw, nh = max(1, round(w * s)), max(1, round(h * s))
    sm = im.resize((nw, nh), Image.BOX)
    a = sm.getchannel('A').point(lambda v: 255 if v > 110 else 0)
    rgb = Image.new('RGB', sm.size, (0, 0, 0)); rgb.paste(sm.convert('RGB'), mask=a)
    q = rgb.quantize(colors=colors, method=Image.Quantize.MEDIANCUT).convert('RGB')
    can = Image.new('RGBA', (size + 2, size + 2), (0, 0, 0, 0)); ox, oy = (size + 2 - nw) // 2, (size + 2 - nh) // 2
    body = q.convert('RGBA'); body.putalpha(a); can.alpha_composite(body, (ox, oy))
    px = can.load(); W, H = can.size; edge = []
    for y in range(H):
        for x in range(W):
            if px[x, y][3] == 0 and any(0 <= x + dx < W and 0 <= y + dy < H and px[x + dx, y + dy][3] == 255 for dx, dy in ((1,0),(-1,0),(0,1),(0,-1))): edge.append((x, y))
    for x, y in edge: px[x, y] = EDGE
    return can
if __name__ == '__main__':
    size = int(sys.argv[3]) if len(sys.argv) > 3 else 24
    os.makedirs(OUT, exist_ok=True)
    for p in sorted(glob.glob(os.path.join(SRC, '*.png'))):
        im = Image.open(p)
        if im.size[0] > im.size[1] * 2.5: continue   # 連續動畫格另外處理
        pixelize(im, size).save(os.path.join(OUT, os.path.basename(p)))
