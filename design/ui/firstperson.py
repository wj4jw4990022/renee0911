# 第一人稱互動草圖（Kenney 風格版）：酒館吧台對面，勇者舉杯看著你，右下是你拿酒杯的手
# 勇者＝遊戲裡現在的樣子（kenCanvas 站姿，firstperson/grab_hero.py 從遊戲抓），整張用同一個放大倍數
# 用法：python3 firstperson.py 草圖_第一人稱_酒館.png
import sys, os, json
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from PIL import Image, ImageDraw
import sendoff   # 介面字型換粉圓
import mainscreen
from style import *

S = 22                # 一個像素放大幾倍（草圖是手機 2 倍大 → 手機上 11 倍）
NW, NH = 36, 40       # 場景原始像素：蓋住地圖那一塊（780×864）
TT = HERE + '/../assets/kenney-tiny-town/tiles/'
FP = HERE + '/firstperson/'
def hx(c): return tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
K = {k: hx(v) for k, v in {'#': '#3f2631', 'H': '#bd6c4a', 'h': '#763b36', 'o': '#eaa56c', 'S': '#f7c282', 's': '#e19a65', 'W': '#ffffff', 'w': '#e8eef6',
                           'B': '#4a566e', 'b': '#2e3448'}.items()}

def tile(path): return Image.open(path).convert('RGBA')
def item(path):   # 只留物件本身（去掉透明邊）
    im = tile(path); return im.crop(im.getbbox())

def grid(rows):   # 文字圖 → 小圖（Kenney 調色）
    im = Image.new('RGBA', (max(map(len, rows)), len(rows)), (0, 0, 0, 0)); px = im.load()
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch != '.': px[x, y] = K[ch]
    return im

# 酒杯（Kenney 粗線外框、5 色以內）
MUG = grid(['.WWWW..',
            '#WwwW#.',
            '#oHHo###',
            '#HHHH#.#',
            '#hhhh#.#',
            '#HHHH###',
            '#HHHH#..',
            '######..'])
# 你的手：袖子（深藍）＋手（膚色）握著酒杯，從右下伸進來
HAND = grid(['....SSS..',
             '...#SSS#.',
             '..#SSSs#.',
             '.#BBBBB#.',
             '#BBBBBBB#',
             '#BbBBBBBB',
             '#BbBBBBBB',
             '#BbBBBBBB'])

def emo(name):
    rows = json.load(open(FP + 'emo.json', encoding='utf-8'))[name]
    im = Image.new('RGBA', (len(rows[0]), len(rows)), (0, 0, 0, 0)); px = im.load()
    for y, r in enumerate(rows):
        for x, c in enumerate(r):
            if c: px[x, y] = hx(c)
    return im

def scene(hero_png):
    L = Image.new('RGBA', (NW, NH), K['H']); d = ImageDraw.Draw(L)
    for x in range(3, NW, 6): d.line([(x, 0), (x, 29)], fill=K['h'])          # 木板牆（Kenney 木頭色）
    # 兩層酒架：Tiny Dungeon 的小藥瓶當酒瓶
    for sy, names, xs in ((10, ('10_06', '10_07', '10_05', '10_08'), (1, 5, 28, 32)), (21, ('10_08', '10_05', '10_07', '10_06'), (2, 6, 27, 31))):
        d.rectangle([0, sy, NW, sy + 1], fill=K['o']); d.line([(0, sy + 2), (NW, sy + 2)], fill=K['#'])
        for x, n in zip(xs, names): b = item(TD + n + '.png'); L.alpha_composite(b, (x, sy - b.height))
    # 勇者：遊戲裡的樣子原封不動，站在吧台後面（腳被吧台擋住）
    h = tile(hero_png); h = h.crop(h.getbbox())
    hx0, hy0 = (NW - h.width) // 2, 15
    L.alpha_composite(h, (hx0, hy0))
    L.alpha_composite(MUG, (hx0 - 7, hy0 + 2)); d.rectangle([hx0 - 1, hy0 + 7, hx0, hy0 + 8], fill=K['S'])   # 他舉起的酒杯
    # 吧台
    d.rectangle([0, 32, NW, NH], fill=K['H']); d.rectangle([0, 30, NW, 31], fill=K['o']); d.line([(0, 29), (NW, 29)], fill=K['#']); d.line([(0, 32), (NW, 32)], fill=K['#'])
    for x in range(4, NW, 8): d.line([(x, 33), (x, NH)], fill=K['h'])
    # 你的手和酒杯（右下伸進來）
    L.alpha_composite(MUG, (26, 27)); L.alpha_composite(HAND, (27, 33)); L.alpha_composite(HAND.crop((0, 5, 9, 8)), (27, 40 - 3))
    big = L.resize((NW * S, NH * S), Image.NEAREST)
    # 表情泡泡：Kenney 原圖，照遊戲裡的比例（勇者的 0.5 倍像素）疊在頭的右上
    e = emo('開心'); e = e.resize((e.width * S // 2, e.height * S // 2), Image.NEAREST)
    big.alpha_composite(e, ((hx0 + h.width - 3) * S, hy0 * S - e.height + 2 * S))
    return big.crop((6, 0, 6 + 780, 864))

def page(hero_png, name):
    im = mainscreen.main(); d = ImageDraw.Draw(im); W = im.width
    im.alpha_composite(scene(hero_png), (0, 96))
    d.rectangle([0, 958, W, 962], fill=O[:3])
    box(d, 20, 116, 330, 178, fill=PAPER); iw = icon_c(im, '酒窖', 36, 147, 3); text_c(d, 36 + iw + 12, 147, '酒館・請喝一杯', 16)
    box(d, 600, 116, 760, 178, fill=PAPER); iw = icon_c(im, '時間', 616, 147, 3); text_c(d, 616 + iw + 10, 147, '20:40', 16)
    d.rectangle([0, 1056, W, im.height - 151], fill=PAPER)
    y = 1070
    text_c(d, 20, y + 24, '你', 16, MUTED); text_c(d, 80, y + 24, '「走，今晚我請你喝一杯」', 16)
    d.line([(20, y + 66), (760, y + 66)], fill=(214, 190, 150), width=2); y += 84
    f = tile(hero_png); f = f.crop(f.getbbox()); im.alpha_composite(f.resize((f.width * 3, f.height * 3), Image.NEAREST), (20, y))
    text_c(d, 80, y + 24, name, 16, (37, 149, 106)); text_c(d, 80, y + 72, '「乾杯！老闆今天怎麼突然請客？」', 16)
    d.line([(20, y + 110), (760, y + 110)], fill=(214, 190, 150), width=2); y += 124
    text_c(d, 20, y + 30, '你要說什麼？', 16, MUTED)
    for k, t in enumerate(('你辛苦了', '有事想問你', '慶祝一下')):
        bx = 20 + k * 250; box(d, bx, y + 70, bx + 236, y + 140, border=GOLD); d.rectangle([bx + 3, y + 73, bx + 233, y + 137], outline=O[:3], width=2); text_c(d, bx + 118, y + 105, t, 16, TXT, True)
    cy = y + 186; iw = icon_c(im, '時間', 20, cy, 3); d.rectangle([20 + iw + 12, cy - 14, 640, cy + 14], fill=(230, 220, 195), outline=O[:3], width=3); d.rectangle([20 + iw + 15, cy - 11, 20 + iw + 15 + (640 - 20 - iw - 18) * .8, cy + 11], fill=GOLD)
    text_c(d, 660, cy, '12 秒', 16, TXT)
    return im

if __name__ == '__main__':
    a = page(FP + 'hero_warrior.png', '小美'); b = page(FP + 'hero_mage.png', '阿豪')
    out = Image.new('RGBA', (a.width * 2 + 60, a.height + 80), (38, 40, 56, 255)); d = ImageDraw.Draw(out)
    text(d, 20, 16, '第一人稱：小美（戰士）', 12, (240, 230, 200)); text(d, a.width + 40, 16, '同一畫面換成阿豪（法師）', 12, (240, 230, 200))
    out.alpha_composite(a, (20, 64)); out.alpha_composite(b, (a.width + 40, 64))
    out.convert('RGB').resize((out.width // 2, out.height // 2), Image.LANCZOS).save(sys.argv[1])
