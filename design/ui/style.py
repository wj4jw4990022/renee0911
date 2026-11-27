# 介面風格樣張：粗線外框、Q 版、圖示代替文字
import sys
sys.path.insert(0, '/home/claude/dw/design/rooms'); sys.path.insert(0, '/home/claude/dw/design/wild')
from PIL import Image, ImageDraw, ImageFont
import wild
TD = wild.TD
FONT = '/home/claude/sk_gate/cubic11.ttf'
O = (63, 38, 49, 255)
C = {'Y': (247, 201, 74), 'y': (214, 150, 40), 'W': (255, 255, 255), 'R': (232, 69, 55), 'r': (160, 40, 44), 'B': (67, 160, 220), 'b': (40, 96, 160),
     'G': (67, 200, 120), 'g': (37, 149, 106), 'N': (189, 108, 74), 'n': (118, 59, 54), 'K': (192, 203, 220), 'k': (139, 155, 180), 'P': (240, 120, 160), 'p': (190, 70, 110),
     'S': (247, 194, 130), 's': (225, 154, 101), 'V': (155, 76, 163), 'v': (209, 118, 208), 'D': (82, 96, 124), 'L': (250, 240, 214)}

def outline(im):
    w, h = im.width + 2, im.height + 2; src = Image.new('RGBA', (w, h)); src.alpha_composite(im, (1, 1)); out = src.copy(); p = src.load(); q = out.load()
    for y in range(h):
        for x in range(w):
            if not p[x, y][3] and any(0 <= x + a < w and 0 <= y + b < h and p[x + a, y + b][3] for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))): q[x, y] = O
    return out
def grid(rows):   # 文字圖 → 圖示（外框自動加）
    h, w = len(rows), max(len(r) for r in rows); im = Image.new('RGBA', (w, h)); p = im.load()
    for y, r in enumerate(rows):
        for x, c in enumerate(r):
            if c == 'O': p[x, y] = O
            elif c in C: p[x, y] = C[c] + (255,)
    return outline(im)
def kt(n): im = Image.open(TD + n + '.png').convert('RGBA'); return im.crop(im.getbbox())

ICON = {
 '金幣': grid(['..yyyyy...', '.yYYYYYy..', 'yYYWYYYYy.', 'yYWyyyYYy.', 'yYYyYYYYy.', 'yYYyyyYYy.', 'yYYYYyYYy.', 'yYYyyyYYy.', '.yYYYYYy..', '..yyyyy...']),
 '名聲': grid(['....Y....', '....Y....', '...YYY...', 'YYYYWYYYY', '.YYWYYYy.', '..YYYYy..', '..YYyYy..', '.YYy.yYy.', '.Yy...yY.']),
 '心情': grid(['.RR...RR.', 'RWRR.RRRr', 'RWRRRRRRr', 'RRRRRRRRr', '.RRRRRRr.', '..RRRRr..', '...RRr...', '....r....']),
 '體力': grid(['....YYY', '...YYy.', '..YYy..', '.YYYYYY', '....YYy', '...YYy.', '..YYy..', '.YYy...', '.Yy....']),
 '壓力': grid(['..KKKK...', '.KWKKKKK.', 'KWKKKKKKk', 'KKKKKKKKk', '.kkkkkkk.', '...B..B..', '..B..B...', '.B..B....']),
 '信任': grid(['.SS...SS.', 'SSSs.sSSS', 'SSSSsSSSS', '.SSSSSSS.', '..SSSSS..', '...SSS...', '....S....']),
 '戰力': kt('08_08'),
 '防具': grid(['...KKKKK...', '..KNNnNNk..', '.KNNNnNNNk.', 'KNNNNnNNNNk', 'KnnnKKKnnnk', 'KNNKWKkNNNk', 'KnnnKkknnnk', 'KNNNNnNNNNk', '.kNNNnNNNk.', '..kNNnNNk..', '...kkkkk...']),   # 木頭圓盾：鐵邊、木板紋、中間鐵釘
 '照顧': kt('09_07'),
 '商隊': grid(['..LLLLLLL...', '.LLLLLLLLL..', '.LLLLLLLLL..', 'NNNNNNNNNNN.', 'NnNNNNNNNnN.', 'NNNNNNNNNNN.', '.nn....nn...', 'nKKn..nKKn..', '.nn....nn...']),
 '時間': grid(['..KKKKK..', '.KWWWWWK.', 'KWWWOWWWk', 'KWWWOWWWk', 'KWWWOOOWk', 'KWWWWWWWk', '.KWWWWWk.', '..kkkkk..']),
 '排程': grid(['.R.....R.', 'RRRRRRRRR', 'LLLLLLLLL', 'LNLNLNLNL', 'LLLLLLLLL', 'LNLNLGLNL', 'LLLLLLLLL', 'LNLNLNLNL', 'LLLLLLLLL']),
 '任務': grid(['NNLLLLLNN', '.NLLLLLN.', '.LDDDDDL.', '.LLLLLLL.', '.LDDDDL..', '.LLLLLLL.', '.LDDDDDL.', '.NLLLLLN.', 'NNLLLLLNN']),
 '危險': grid(['.WWWWW.', 'WWWWWWW', 'WkkWkkW', 'WkkWkkW', 'WWWkWWW', '.WWWWW.', '.WkWkW.']),
 '人際': grid(['..SS..SS.', '.SSSSSSSS', '.SSSSSSSS', '..SS..SS.', '.BBBBRRRR', 'BBBBBRRRR', 'BBBBBRRRR']),
 '事務所': grid(['....R....', '...RRR...', '..RRRRR..', '.RRRRRRR.', 'RRRRRRRRR', '.LLLLLLL.', '.LBLLNNL.', '.LLLLNNL.', '.LLLLNNL.']),
 '設定': grid(['...KK...', '.K.KK.K.', '..KKKK..', 'KKKkkKKK', 'KKKkkKKK', '..KKKK..', '.K.KK.K.', '...KK...']),
 '上升': grid(['...G...', '..GGG..', '.GGGGG.', 'GGGGGGG', '..GGG..', '..GGG..', '..GGG..']),
 '下降': grid(['..RRR..', '..RRR..', '..RRR..', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...']),
 '鎖': grid(['..KKK..', '.K...K.', '.K...K.', 'YYYYYYY', 'YYYOYYY', 'YYYOYYY', 'yyyyyyy']),
 '寶物': kt('07_05'),
 '鐵匠': kt('09_09'),
}

KENNEY = {'戰力', '照顧', '寶物', '鐵匠'}   # Kenney 原圖：維持原樣
ICON = {k: v if k in KENNEY else outline(v) for k, v in ICON.items()}   # 自己畫的圖示統一粗外框（兩圈深色框）
FS = {12: ImageFont.truetype(FONT, 28), 16: ImageFont.truetype(FONT, 32), 24: ImageFont.truetype(FONT, 44)}   # 草圖是手機 2 倍大：小字 14、一般 16、標題數字 22（點陣字 2 倍最清楚）
PAPER, PAPER2, WOOD, WOOD2 = (251, 240, 210), (243, 224, 178), (138, 90, 54), (106, 66, 40)
GOLD, GREEN, RED, TXT, MUTED = (242, 193, 78), (111, 207, 151), (232, 69, 55), (59, 38, 22), (122, 90, 58)

def box(d, x0, y0, x1, y1, fill=PAPER, border=O[:3], w=3, shadow=True):   # 粗線外框（缺角），下方 3px 陰影
    if shadow: d.rectangle([x0 + 6, y0 + 6, x1 + 6, y1 + 6], fill=(74, 47, 27, 150))   # 陰影：右下 6、深棕半透明（v2 加重）
    d.rectangle([x0, y0 + w, x1, y1 - w], fill=border); d.rectangle([x0 + w, y0, x1 - w, y1], fill=border)
    d.rectangle([x0 + w, y0 + w, x1 - w, y1 - w], fill=fill)
    d.line([(x0 + w, y0 + w), (x1 - w, y0 + w)], fill=tuple(min(255, c + 18) for c in fill))
def text_c(d, x, cy, t, size=16, fill=TXT, center_x=False):   # 以中線 cy 垂直置中（center_x：x 是水平中心）
    b = d.textbbox((0, 0), t, font=FS[size], stroke_width=1); w, h = b[2] - b[0], b[3] - b[1]
    d.text((x - (w / 2 if center_x else 0) - b[0], cy - h / 2 - b[1]), t, font=FS[size], fill=fill, stroke_width=1, stroke_fill=fill); return w
def icon_c(im, n, x, cy, s=3, center_x=False):
    ic = ICON[n] if isinstance(n, str) else n; w, h = ic.width * s, ic.height * s
    im.alpha_composite(ic.resize((w, h), Image.NEAREST), (round(x - (w / 2 if center_x else 0)), round(cy - h / 2))); return w
def icon(im, n, x, y, s=2): ic = ICON[n]; im.alpha_composite(ic.resize((ic.width * s, ic.height * s), Image.NEAREST), (x, y)); return ic.width * s
def text(d, x, y, t, size=16, fill=TXT): d.text((x, y), t, font=FS[size], fill=fill, stroke_width=1, stroke_fill=fill); return d.textlength(t, font=FS[size])   # 一律加粗

def sheet():
    W = 780; im = Image.new('RGBA', (W, 1460), (38, 40, 56, 255)); d = ImageDraw.Draw(im)
    y = 20; text(d, 24, y, '介面風格樣張', 24, (240, 230, 200)); text(d, 24, y + 34, '粗線外框・Q 版・圖示代替文字', 16, (200, 190, 160)); y += 80
    # 1 顏色
    box(d, 20, y, W - 20, y + 150); text(d, 40, y + 16, '顏色', 16)
    sw = [(PAPER, '底'), (PAPER2, '卡片'), (WOOD, '木條'), (O[:3], '外框'), (GOLD, '現在要按'), (GREEN, '好事'), (RED, '警告'), (MUTED, '次要字')]
    for i, (c, n) in enumerate(sw):
        x = 40 + i * 88; box(d, x, y + 48, x + 64, y + 100, fill=c, shadow=False); text(d, x, y + 108, n, 12, TXT)
    y += 176
    # 2 外框、按鈕、分頁
    box(d, 20, y, W - 20, y + 250); text(d, 40, y + 16, '外框・按鈕・分頁', 16)
    box(d, 40, y + 52, 230, y + 104); text(d, 62, y + 68, '一般按鈕', 16)
    box(d, 260, y + 52, 450, y + 104, border=GOLD, fill=PAPER); d.rectangle([263, y + 55, 447, y + 101], outline=O[:3]); text(d, 282, y + 68, '現在要按', 16)
    box(d, 480, y + 52, 670, y + 104, fill=(220, 210, 190), border=(150, 140, 130)); text(d, 502, y + 68, '不能按', 16, (150, 140, 130))
    # 分頁：圖示＋小字
    for i, (n, on) in enumerate((('戰力', 1), ('照顧', 0), ('商隊', 0))):
        x = 40 + i * 110; box(d, x, y + 130, x + 96, y + 224, fill=GREEN if on else PAPER)
        icon(im, n, x + 26, y + 142, 3); text(d, x + 28, y + 196, ['裝備', '照顧', '商隊'][i], 12)
    text(d, 380, y + 150, '分頁＝大圖示＋12px 小字', 12, MUTED); text(d, 380, y + 172, '選中的那頁變綠', 12, MUTED); text(d, 380, y + 194, '商隊不在時整顆變灰', 12, MUTED)
    y += 276
    # 3 數字標籤
    box(d, 20, y, W - 20, y + 170); text(d, 40, y + 16, '數字標籤（圖示＋數字，不寫字）', 16)
    chips = [('金幣', '500'), ('名聲', '52'), ('心情', '65'), ('體力', '80'), ('壓力', '15'), ('信任', '55')]
    for i, (n, v) in enumerate(chips):
        x = 40 + (i % 3) * 240; yy = y + 52 + (i // 3) * 56; box(d, x, yy, x + 210, yy + 44, shadow=False); icon(im, n, x + 10, yy + 5, 3); text(d, x + 56, yy + 10, v, 24, TXT)
    y += 196
    # 4 圖示
    box(d, 20, y, W - 20, y + 420); text(d, 40, y + 16, '圖示（Kenney 色盤＋深色外框；武器、藥水、寶箱、鐵槌用 Kenney 原圖）', 16)
    names = [n for n in ICON]
    for i, n in enumerate(names):
        x = 40 + (i % 6) * 120; yy = y + 56 + (i // 6) * 90; ic = ICON[n]; s = 3
        im.alpha_composite(ic.resize((ic.width * s, ic.height * s), Image.NEAREST), (x + 30 - ic.width * s // 2 + 20, yy)); text(d, x + 30 - len(n) * 6 + 20, yy + 52, n, 12)
    y += 446
    # 5 字
    box(d, 20, y, W - 20, y + 120); text(d, 40, y + 16, '字：點陣字只用在標題、數字、按鈕（12／16／24）；說明一行內講完', 16)
    text(d, 40, y + 56, '24 標題', 24); text(d, 220, y + 62, '16 按鈕', 16); text(d, 380, y + 66, '12 小字', 12)
    return im.crop((0, 0, W, y + 140))

if __name__ == '__main__':
    sheet().save(sys.argv[1])
