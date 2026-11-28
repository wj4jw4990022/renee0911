# 第一人稱互動草圖 v2：酒館吧台對面，勇者看著你舉杯
# 勇者＝遊戲裡同一個 Kenney 小人（從遊戲匯出的 16×16），近看時用 Scale2x 放大 8 倍＋柔和明暗＋清楚的表情
# 景深：背景、你的手模糊，焦點在勇者臉上
# 用法：python3 firstperson.py <勇者16x16.png> 草圖_第一人稱_酒館.png
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage
import sendoff   # 介面字型換粉圓
import mainscreen
from style import *

S = 4                     # 場景原始像素放大幾倍（草圖是手機 2 倍大）
NW, NH = 195, 216         # 場景原始像素＝蓋住地圖那一塊（780×864）
OUT = (63, 38, 49)        # Kenney 外框色
EYE = (38, 43, 68)
SKIN_K, SKIN_J = (248, 214, 182), (226, 169, 142)

# ---------- 近看的勇者 ----------
def epx(a):
    h, w = a.shape[:2]; P = np.pad(a, ((1, 1), (1, 1), (0, 0)), mode='edge')
    A, B, C, D, E = P[:-2, 1:-1], P[1:-1, :-2], P[1:-1, 2:], P[2:, 1:-1], P[1:-1, 1:-1]
    eq = lambda x, y: np.all(x == y, axis=-1)[..., None]
    out = np.zeros((h * 2, w * 2, a.shape[2]), a.dtype)
    out[0::2, 0::2] = np.where(eq(B, A) & ~eq(A, C) & ~eq(B, D), A, E)
    out[0::2, 1::2] = np.where(eq(A, C) & ~eq(A, B) & ~eq(C, D), C, E)
    out[1::2, 0::2] = np.where(eq(B, D) & ~eq(A, B) & ~eq(D, C), B, E)
    out[1::2, 1::2] = np.where(eq(D, C) & ~eq(B, D) & ~eq(A, C), D, E)
    return out

def same(a, c): return np.all(a[..., :3] == c, axis=-1)

def hd_bust(sprite16):
    """16×14（頭到腰）→ 128×112：形狀不變，只是變細緻"""
    a = np.array(sprite16.convert('RGBA').crop((0, 0, 16, 14)))
    for _ in range(3): a = epx(a)
    a = a.astype(float); al = a[..., 3] > 0; h, w = al.shape
    skin = same(a, SKIN_K) | same(a, SKIN_J); eyes = same(a, EYE)
    a[skin | eyes, :3] = SKIN_K                                     # 臉先鋪成一塊，等一下畫表情
    face = skin | eyes
    # 每個色塊：上亮下暗＋靠邊稍暗（柔和的立體感）
    for c in {tuple(int(v) for v in x) for x in a[al & ~face, :3]}:
        lab, n = ndimage.label(al & ~face & same(a, c))
        for k in range(1, n + 1):
            r = lab == k; ys, xs = np.nonzero(r)
            if len(ys) < 10: continue
            t = (np.arange(h)[:, None] - ys.min()) / max(1, np.ptp(ys) + 1); u = (np.arange(w)[None, :] - xs.min()) / max(1, np.ptp(xs) + 1)
            dk = sum(c) < 200
            g = (1.20 if dk else 1.10) - (.32 if dk else .22) * t + .08 * (u - .5) - .10 * np.clip(1 - ndimage.distance_transform_edt(r) / 5, 0, 1)
            a[r, :3] = np.clip(a[r, :3] * g[r][:, None], 0, 255)
    ys, xs = np.nonzero(face)
    t = (np.arange(h)[:, None] - ys.min()) / (np.ptp(ys) + 1)
    g = 1.03 - .10 * t - .08 * np.clip(1 - ndimage.distance_transform_edt(face) / 7, 0, 1)
    a[face, :3] = np.clip(a[face, :3] * g[face][:, None], 0, 255)
    a = np.concatenate([a] + [a[-8:]] * 4, axis=0); al = a[..., 3] > 0        # 身體往下延伸（被吧台擋住）
    ring = ndimage.binary_dilation(al, iterations=2) & ~al          # 最外圈加深色細線
    a[ring] = (40, 22, 32, 255)
    return Image.fromarray(a.astype(np.uint8))

def expr(img, kind):
    """在近看的臉上畫表情（眼睛原本在 x 48–56、80–88，y 56–72）"""
    im = img.copy(); d = ImageDraw.Draw(im, 'RGBA'); E = EYE + (255,)
    L, R, Y = 52, 84, 64
    def eye(cx, look=0):
        d.ellipse([cx - 5 + look, Y - 9, cx + 5 + look, Y + 9], fill=E)
        d.ellipse([cx - 1 + look, Y - 7, cx + 3 + look, Y - 3], fill=(255, 255, 255, 255))
        d.rectangle([cx - 3 + look, Y + 4, cx - 2 + look, Y + 5], fill=(110, 120, 170, 255))
    def blush(a=150): [d.ellipse([cx - 9, Y + 9, cx + 9, Y + 15], fill=(240, 120, 130, a)) for cx in (L - 6, R + 6)]
    if kind == 'happy':
        for cx in (L, R): d.arc([cx - 8, Y - 6, cx + 8, Y + 8], 200, 340, fill=E, width=4)
        blush(); d.chord([60, 71, 76, 85], 0, 180, fill=(150, 46, 52, 255)); d.ellipse([64, 78, 72, 84], fill=(236, 120, 130, 255))
    elif kind == 'calm':
        eye(L); eye(R); d.arc([62, 72, 74, 80], 20, 160, fill=(150, 70, 70, 255), width=2)
    elif kind == 'shy':
        eye(L, -3); eye(R, -3); blush(220); d.line([(63, 78), (73, 78)], fill=(150, 70, 70, 255), width=2)
    elif kind == 'angry':
        eye(L); eye(R)
        d.line([(L - 9, Y - 16), (L + 6, Y - 10)], fill=OUT + (255,), width=4); d.line([(R + 9, Y - 16), (R - 6, Y - 10)], fill=OUT + (255,), width=4)
        d.arc([60, 76, 76, 88], 200, 340, fill=(150, 46, 52, 255), width=3)
    elif kind == 'sad':
        eye(L); eye(R)
        d.line([(L - 8, Y - 11), (L + 6, Y - 16)], fill=OUT + (255,), width=3); d.line([(R + 8, Y - 11), (R - 6, Y - 16)], fill=OUT + (255,), width=3)
        d.arc([62, 77, 74, 86], 200, 340, fill=(150, 70, 70, 255), width=2)
        d.ellipse([L - 6, Y + 8, L - 1, Y + 16], fill=(140, 200, 255, 230))
    return im

# ---------- 場景 ----------
def lin(d, xy, c, w=2): d.line(xy, fill=c, width=w)

def mug_hd(scale=1):
    """高解析的木頭啤酒杯（Kenney 風：粗外框＋平塗＋一點明暗）"""
    W, H = 30 * scale, 36 * scale; im = Image.new('RGBA', (W + 16 * scale, H + 8 * scale), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    s = scale; ox, oy = 2 * s, 6 * s
    d.rounded_rectangle([ox + 26 * s, oy + 8 * s, ox + 38 * s, oy + 24 * s], 5 * s, outline=OUT, width=4 * s)          # 把手
    d.rectangle([ox, oy + 4 * s, ox + 28 * s, oy + 34 * s], fill=(178, 114, 64), outline=OUT, width=2 * s)
    d.rectangle([ox + 2 * s, oy + 6 * s, ox + 7 * s, oy + 32 * s], fill=(204, 140, 84))
    d.rectangle([ox + 21 * s, oy + 6 * s, ox + 26 * s, oy + 32 * s], fill=(140, 86, 48))
    for yy in (12, 26): d.rectangle([ox, oy + yy * s, ox + 28 * s, oy + (yy + 2) * s], fill=(110, 112, 128))
    d.ellipse([ox - 3 * s, oy - 4 * s, ox + 31 * s, oy + 10 * s], fill=(255, 250, 236), outline=OUT, width=2 * s)       # 泡沫
    d.ellipse([ox + 4 * s, oy - 8 * s, ox + 18 * s, oy + 4 * s], fill=(255, 252, 244), outline=OUT, width=2 * s)
    return im

def hands_with_mug(bust):
    """他雙手捧杯在胸前"""
    b = bust.copy(); m = mug_hd(1); b2 = Image.new('RGBA', (b.width, b.height + 8), (0, 0, 0, 0)); b2.alpha_composite(b, (0, 0))
    b2.alpha_composite(m, (46, 92)); d = ImageDraw.Draw(b2)
    for x in (40, 72):
        d.rounded_rectangle([x, 116, x + 16, 130], 6, fill=SKIN_K, outline=OUT, width=2); d.line([(x + 4, 123), (x + 12, 123)], fill=SKIN_J, width=2)
    return b2

def tavern():
    L = Image.new('RGBA', (NW, NH), (98, 60, 42, 255)); d = ImageDraw.Draw(L)
    for x in range(0, NW, 18): lin(d, [(x, 0), (x, 150)], (80, 47, 32), 2)
    for sy in (52, 92):
        d.rectangle([0, sy, NW, sy + 5], fill=(150, 98, 60), outline=OUT)
        for k, x in enumerate(list(range(4, 50, 10)) + list(range(146, 195, 10))):
            c = [(92, 160, 80), (200, 120, 50), (170, 60, 60), (230, 200, 90), (120, 90, 170)][(k + sy) % 5]; hh = 16 + (k * 7 + sy) % 3 * 4
            d.rectangle([x, sy - hh, x + 7, sy - 1], fill=c, outline=OUT); d.rectangle([x + 2, sy - hh - 5, x + 5, sy - hh], fill=OUT)
    return L

def blur(L, r): return L.filter(ImageFilter.GaussianBlur(r))

def bokeh(L, pts):
    o = Image.new('RGBA', L.size, (0, 0, 0, 0)); d = ImageDraw.Draw(o)
    for x, y, r, c, a in pts: d.ellipse([x - r, y - r, x + r, y + r], fill=c + (a,))
    L.alpha_composite(blur(o, 3))

def scene(sprite16, kind='happy'):
    W, H = NW * S, NH * S
    bg = tavern().resize((W, H), Image.NEAREST); bg = blur(bg, 12)                         # 遠：很糊
    bokeh(bg, [(380, 70, 46, (255, 214, 120), 120), (380, 70, 22, (255, 240, 190), 150), (96, 180, 26, (150, 220, 120), 70), (690, 300, 30, (255, 200, 110), 80),
               (60, 330, 20, (240, 120, 100), 70), (720, 140, 18, (200, 170, 255), 70), (250, 40, 14, (255, 230, 160), 90), (560, 60, 16, (255, 230, 160), 90)])
    light = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(light).ellipse([150, -260, 610, 260], fill=(255, 210, 140, 60)); bg.alpha_composite(blur(light, 40))
    hero = hands_with_mug(expr(hd_bust(sprite16), kind)).resize((128 * 4 // 1 * 1 // 1, 136 * 4), Image.NEAREST) if False else hands_with_mug(expr(hd_bust(sprite16), kind))
    hero = hero.resize((hero.width * 4, hero.height * 4), Image.NEAREST)                  # 焦點：清楚
    bg.alpha_composite(hero, ((W - hero.width) // 2 - 20, 70))
    # 吧台（比他近一點：微糊）
    ct = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(ct)
    d.rectangle([0, 560, W, H], fill=(120, 74, 46)); [d.rectangle([x, 610, x + 6, H], fill=(98, 58, 36)) for x in range(40, W, 90)]
    d.rectangle([0, 548, W, 604], fill=(186, 128, 80)); d.rectangle([0, 548, W, 556], fill=(220, 168, 112)); d.rectangle([0, 600, W, 606], fill=OUT); d.rectangle([0, 544, W, 548], fill=OUT)
    bg.alpha_composite(blur(ct, 2))
    # 你的手（最近：糊）
    hd_ = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(hd_)
    d.polygon([(W, 700), (W, H), (560, H), (590, 760), (650, 700)], fill=(70, 84, 128), outline=OUT); d.polygon([(W, 780), (W, H), (600, H), (620, 800)], fill=(52, 62, 98))
    m = mug_hd(3); hd_.alpha_composite(m, (520, 560))
    d.polygon([(W, 720), (W, H), (600, H), (640, 800), (700, 740)], fill=(70, 84, 128), outline=OUT, width=6)
    d.rounded_rectangle([600, 660, 700, 770], 30, fill=SKIN_K, outline=OUT, width=6)        # 握住杯子的手（從右下伸進來）
    for y in (680, 708, 736): d.rounded_rectangle([566, y, 624, y + 24], 12, fill=SKIN_K, outline=OUT, width=5)
    bg.alpha_composite(blur(hd_, 7))
    # 暗角（人眼的感覺）
    v = Image.new('L', (W, H), 0); ImageDraw.Draw(v).ellipse([-120, -140, W + 120, H + 160], fill=255); v = v.filter(ImageFilter.GaussianBlur(90))
    dark = Image.new('RGBA', (W, H), (30, 16, 20, 150)); dark.putalpha(Image.eval(v, lambda p: int((255 - p) * .55)))
    bg.alpha_composite(dark)
    return bg

def compare(sprite16):
    """遠看 vs 近看＋表情"""
    W, H = 760, 1688; im = Image.new('RGBA', (W, H), PAPER2 + (255,)); d = ImageDraw.Draw(im)
    text_c(d, 30, 50, '遠看（地圖上，原本的小人）', 16)
    im.alpha_composite(sprite16.resize((64, 64), Image.NEAREST), (40, 90)); im.alpha_composite(sprite16.resize((128, 128), Image.NEAREST), (140, 58))
    text_c(d, 30, 250, '近看（第一人稱）：同一個人，變細緻', 16)
    b = hd_bust(sprite16); b = b.crop((0, 0, b.width, 116)); im.alpha_composite(b.resize((b.width * 2, b.height * 2), Image.NEAREST), (40, 290))
    im.alpha_composite(expr(b, 'calm').resize((b.width * 2, b.height * 2), Image.NEAREST), (400, 290))
    text_c(d, 40, 540, '原圖直接放大', 12, MUTED); text_c(d, 400, 540, '加上表情', 12, MUTED)
    text_c(d, 30, 620, '表情（近看才看得清楚）', 16)
    for k, (kd, n) in enumerate((('happy', '開心'), ('shy', '害羞'), ('angry', '生氣'), ('sad', '難過'))):
        x, y = 40 + (k % 2) * 360, 670 + (k // 2) * 330
        e = expr(b, kd); im.alpha_composite(e.resize((e.width * 2, e.height * 2), Image.NEAREST), (x, y)); text_c(d, x + 110, y + 250, n, 16, TXT, True)
    return im

def page(sprite16):
    im = mainscreen.main(); d = ImageDraw.Draw(im); W = im.width
    im.alpha_composite(scene(sprite16), (0, 96)); d.rectangle([0, 958, W, 962], fill=O[:3])
    box(d, 20, 116, 330, 178, fill=PAPER); iw = icon_c(im, '酒窖', 36, 147, 3); text_c(d, 36 + iw + 12, 147, '酒館・請喝一杯', 16)
    box(d, 600, 116, 760, 178, fill=PAPER); iw = icon_c(im, '時間', 616, 147, 3); text_c(d, 616 + iw + 10, 147, '20:40', 16)
    d.rectangle([0, 1056, W, im.height - 151], fill=PAPER); y = 1070
    text_c(d, 20, y + 24, '你', 16, MUTED); text_c(d, 80, y + 24, '「走，今晚我請你喝一杯」', 16)
    d.line([(20, y + 66), (760, y + 66)], fill=(214, 190, 150), width=2); y += 84
    im.alpha_composite(sprite16.resize((48, 48), Image.NEAREST), (20, y)); text_c(d, 80, y + 24, '小滿', 16, (37, 149, 106))
    text_c(d, 80, y + 72, '「乾杯！老闆今天怎麼突然請客？」', 16)
    d.line([(20, y + 110), (760, y + 110)], fill=(214, 190, 150), width=2); y += 124
    text_c(d, 20, y + 30, '你要說什麼？', 16, MUTED)
    for k, t in enumerate(('你辛苦了', '有事想問你', '慶祝一下')):
        bx = 20 + k * 250; box(d, bx, y + 70, bx + 236, y + 140, border=GOLD); d.rectangle([bx + 3, y + 73, bx + 233, y + 137], outline=O[:3], width=2); text_c(d, bx + 118, y + 105, t, 16, TXT, True)
    cy = y + 186; iw = icon_c(im, '時間', 20, cy, 3); d.rectangle([20 + iw + 12, cy - 14, 640, cy + 14], fill=(230, 220, 195), outline=O[:3], width=3); d.rectangle([20 + iw + 15, cy - 11, 20 + iw + 15 + (640 - 20 - iw - 18) * .8, cy + 11], fill=GOLD)
    text_c(d, 660, cy, '12 秒', 16, TXT)
    return im

if __name__ == '__main__':
    sp = Image.open(sys.argv[1]).convert('RGBA'); sp = sp.crop(sp.getbbox()) if sp.width > 16 else sp
    a = page(sp); c = compare(sp)
    out = Image.new('RGBA', (a.width + c.width + 60, a.height + 80), (38, 40, 56, 255)); d = ImageDraw.Draw(out)
    text(d, 20, 16, '第一人稱：酒館・請喝一杯', 12, (240, 230, 200)); text(d, a.width + 40, 16, '同一個勇者：遠看 vs 近看', 12, (240, 230, 200))
    out.alpha_composite(a, (20, 64)); out.alpha_composite(c, (a.width + 40, 64))
    out.convert('RGB').resize((out.width // 2, out.height // 2), Image.LANCZOS).save(sys.argv[2])
