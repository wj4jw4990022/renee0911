# 第一人稱互動草圖（Kenney 風格版）：酒館吧台對面，勇者舉杯看著你，右下是你拿酒杯的手
# 勇者＝遊戲裡現在的樣子（kenCanvas 站姿，firstperson/grab_hero.py 從遊戲抓），整張用同一個放大倍數
# 用法：python3 firstperson.py 草圖_第一人稱_酒館.png
import sys, os, json
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from PIL import Image, ImageDraw
import sendoff   # 介面字型換粉圓
import mainscreen
from style import *

S = 32                # 臉部特寫：一個像素放大幾倍（草圖是手機 2 倍大 → 手機上 16 倍）
NW, NH = 25, 27       # 場景原始像素：蓋住地圖那一塊（780×864）
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

# ---------- 表情：直接改遊戲小人臉上的幾個像素（Kenney 風格，眼睛 1×2、嘴 1 格） ----------
EYE = hx('#262b44'); DARK = K['#']; PINK = hx('#e8708a'); TEAR = hx('#5ca0e8'); MOUTH = hx('#c0504a')
def mix(c, t, a): return tuple(round(c[i] * (1 - a) + t[i] * a) for i in range(3)) + (255,)

def face_info(im):
    px = im.load(); E = [(x, y) for y in range(11) for x in range(im.width) if px[x, y] == EYE]
    xs = sorted({x for x, _ in E}); ty = min(y for _, y in E)
    lx, rx = xs[0], xs[-1]; skin = px[lx + 1, ty + 1]
    return lx, rx, ty, skin

def express(im, kind):
    im = im.copy(); px = im.load(); lx, rx, ty, skin = face_info(im); mx, my = (lx + rx) // 2, ty + 2
    def put(x, y, c):
        if 0 <= x < im.width and 0 <= y < im.height and px[x, y][3]: px[x, y] = c
    def eyes_off():
        for x in (lx, rx):
            for y in (ty, ty + 1): put(x, y, skin)
    def tint(t, a):   # 整張臉換色（生氣變紅、喝醉變粉）
        for y in range(12):
            for x in range(im.width):
                if px[x, y][:3] == skin[:3]: px[x, y] = mix(skin, t, a)
    if kind == '開心':
        eyes_off()
        for x in (lx, rx): put(x, ty, EYE); put(x - 1, ty + 1, EYE); put(x + 1, ty + 1, EYE)      # ^ ^
        put(mx - 1, my, DARK); put(mx, my, MOUTH); put(mx + 1, my, DARK); put(mx, my + 1, DARK)   # 張嘴笑
        put(lx - 1, ty + 2, PINK); put(rx + 1, ty + 2, PINK)
    elif kind == '害羞':
        tint(hx('#f49696'), .25); eyes_off()
        for x in (lx, rx): put(x, ty + 1, EYE); put(x - 1, ty + 1, EYE) if x == lx else put(x + 1, ty + 1, EYE)   # 眼睛往下看
        for x in (lx - 1, lx, rx, rx + 1): put(x, ty + 2, PINK)
        put(mx, my + 1, MOUTH)
    elif kind == '生氣':
        tint(hx('#f07a6a'), .28)
        put(lx, ty, skin); put(lx + 1, ty, EYE); put(rx, ty, skin); put(rx - 1, ty, EYE)          # 眼角往內壓 \ /
        put(lx - 1, ty - 1, EYE); put(rx + 1, ty - 1, EYE)
        for x in (mx - 1, mx, mx + 1): put(x, my + 1, DARK)                                         # 抿嘴
    elif kind == '難過':
        put(lx, ty, skin); put(lx - 1, ty, EYE); put(rx, ty, skin); put(rx + 1, ty, EYE)          # 眼角往下垂 / \
        put(lx, ty + 2, TEAR); put(lx, ty + 3, TEAR); put(rx, ty + 2, TEAR)                          # 眼淚
        put(mx, my, DARK); put(mx - 1, my + 1, DARK); put(mx + 1, my + 1, DARK)                     # 嘴角往下
    elif kind == '喝醉':
        tint(hx('#f49696'), .35); eyes_off()
        for x in (lx - 1, lx, rx, rx + 1): put(x, ty + 1, EYE)                                     # 瞇成一條線
        for x in (lx - 1, lx, rx, rx + 1): put(x, ty + 2, PINK)
        put(mx - 1, my + 1, DARK); put(mx, my, DARK); put(mx + 1, my + 1, DARK)                     # 波浪嘴
    elif kind == '驚訝':
        put(lx, ty - 1, EYE); put(rx, ty - 1, EYE)                                                   # 眼睛睜大
        put(mx, my, DARK); put(mx, my + 1, DARK)                                                     # 嘴巴張開 O
    return im

def hero_img(hero_png):
    h = tile(hero_png); return h.crop(h.getbbox())

def scene(hero_png, kind='開心', emote='開心'):
    L = Image.new('RGBA', (NW, NH), K['H']); d = ImageDraw.Draw(L)
    for x in range(2, NW, 6): d.line([(x, 0), (x, NH)], fill=K['h'])            # 木板牆
    d.rectangle([0, 6, NW, 6], fill=K['o']); d.line([(0, 7), (NW, 7)], fill=K['#'])   # 酒架（後面，只露一截）
    for x, n in zip((0, 21), ('10_06', '10_07')): b = item(TD + n + '.png'); L.alpha_composite(b, (x, 6 - b.height))
    h = express(hero_img(hero_png), kind)
    hx0, hy0 = (NW - h.width) // 2, 6
    L.alpha_composite(h, (hx0, hy0))
    L.alpha_composite(MUG, (0, hy0 + 4)); d.rectangle([hx0 - 1, hy0 + 8, hx0, hy0 + 9], fill=K['S'])   # 他舉起的酒杯
    # 吧台（只到畫面最下面幾格）
    d.rectangle([0, 21, NW, NH], fill=K['H']); d.rectangle([0, 19, NW, 20], fill=K['o']); d.line([(0, 18), (NW, 18)], fill=K['#']); d.line([(0, 21), (NW, 21)], fill=K['#'])
    for x in range(4, NW, 8): d.line([(x, 22), (x, NH)], fill=K['h'])
    L.alpha_composite(MUG, (18, 16)); L.alpha_composite(HAND, (19, 22))          # 你的手和酒杯
    big = L.resize((NW * S, NH * S), Image.NEAREST)
    if emote:   # Kenney 表情泡泡（勇者的一半像素），頭的右上
        e = emo(emote); e = e.resize((e.width * 12, e.height * 12), Image.NEAREST)
        big.alpha_composite(e, (NW * S - e.width - 10, 100))
    out = Image.new('RGBA', (780, 864), K['H']); out.alpha_composite(big, ((780 - big.width) // 2, 0)); return out

def sheet(heroes):
    kinds = ['普通', '開心', '害羞', '生氣', '難過', '喝醉', '驚訝']; C = 20; cw = 16 * C + 40
    out = Image.new('RGBA', (cw * len(kinds) + 40, 80 + len(heroes) * (11 * C + 70)), PAPER + (255,)); d = ImageDraw.Draw(out)
    for i, k in enumerate(kinds): text_c(d, 20 + i * cw + cw // 2, 40, k, 16, TXT, True)
    for j, hp in enumerate(heroes):
        for i, k in enumerate(kinds):
            f = express(hero_img(hp), k).crop((0, 0, 16, 11)); f = f.resize((16 * C, 11 * C), Image.NEAREST)
            x, y = 20 + i * cw + 20, 80 + j * (11 * C + 70)
            box(d, x - 10, y - 10, x + f.width + 10, y + f.height + 10, fill=(214, 160, 110)); out.alpha_composite(f, (x, y))
    return out

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
    a = page(FP + 'hero_warrior.png', '小美')
    out = Image.new('RGBA', (a.width + 40, a.height + 80), (38, 40, 56, 255)); d = ImageDraw.Draw(out)
    text(d, 20, 16, '臉部特寫：小美（開心）', 12, (240, 230, 200)); out.alpha_composite(a, (20, 64))
    out.convert('RGB').resize((out.width // 2, out.height // 2), Image.LANCZOS).save(sys.argv[1])
    sh = sheet([FP + 'hero_warrior.png', FP + 'hero_mage.png'])
    o2 = Image.new('RGBA', (sh.width + 40, sh.height + 80), (38, 40, 56, 255)); d = ImageDraw.Draw(o2)
    text(d, 20, 16, '表情：只改小人臉上的幾個像素（上：小美，下：阿豪）', 12, (240, 230, 200)); o2.alpha_composite(sh, (20, 64))
    o2.convert('RGB').resize((o2.width // 2, o2.height // 2), Image.LANCZOS).save(sys.argv[1].replace('酒館', '表情'))
