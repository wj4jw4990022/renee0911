# 第一人稱互動草圖：酒館吧台對面，勇者舉杯看著你，畫面下緣是你拿酒杯的手
# 用法：python3 firstperson.py 草圖_第一人稱_酒館.png
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw
import sendoff   # 介面字型換粉圓
import mainscreen
from style import *

S = 6                 # 一個像素放大幾倍（草圖是手機 2 倍大）
NW, NH = 130, 144     # 場景原始像素：蓋住地圖那一塊（780×864）
OL = O                # 外框色

# 勇者（照 Kenney 07_01 的顏色）
HAIR, HAIR2 = (189, 108, 74, 255), (118, 59, 54, 255)
SKIN, SKIN2 = (247, 194, 130, 255), (225, 154, 101, 255)
ARM, ARM2 = (192, 203, 220, 255), (139, 155, 180, 255)
EYE = (38, 43, 68, 255)
BLUSH = (240, 138, 138, 255)
MUG, MUG2, FOAM = (176, 112, 62, 255), (122, 74, 42, 255), (255, 252, 240, 255)
SLEEVE, SLEEVE2 = (70, 84, 128, 255), (48, 58, 94, 255)

def outline(layer):
    """在不透明像素外圍加 1 像素深色框（放大後就是粗線）"""
    w, h = layer.size; src = layer.load(); out = layer.copy(); px = out.load()
    for y in range(h):
        for x in range(w):
            if src[x, y][3]: continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                X, Y = x + dx, y + dy
                if 0 <= X < w and 0 <= Y < h and src[X, Y][3]: px[x, y] = OL; break
    return out

def rect(d, x0, y0, x1, y1, c): d.rectangle([x0, y0, x1, y1], fill=c)

def mug(d, x, y, foam=True):
    """木頭啤酒杯：寬 11、高 14，把手在右"""
    rect(d, x, y + 3, x + 9, y + 14, MUG); rect(d, x, y + 3, x + 1, y + 14, MUG2)
    for yy in (y + 6, y + 11): rect(d, x, yy, x + 9, yy, MUG2)   # 鐵箍
    rect(d, x + 10, y + 6, x + 12, y + 6, MUG2); rect(d, x + 12, y + 6, x + 12, y + 11, MUG2); rect(d, x + 10, y + 11, x + 12, y + 11, MUG2)
    if foam: rect(d, x - 1, y, x + 10, y + 3, FOAM); rect(d, x + 2, y - 2, x + 6, y, FOAM)

def hero():
    L = Image.new('RGBA', (NW, NH), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
    ox, oy = 40, 32
    # 身體（盔甲）：肩膀到畫面外，被吧台擋住
    d.polygon([(ox + 4, oy + 52), (ox + 14, oy + 44), (ox + 42, oy + 44), (ox + 52, oy + 52), (ox + 54, oy + 80), (ox + 2, oy + 80)], fill=ARM)
    rect(d, ox + 4, oy + 60, ox + 52, oy + 80, ARM2); rect(d, ox + 6, oy + 54, ox + 50, oy + 58, ARM)
    rect(d, ox + 22, oy + 46, ox + 34, oy + 50, ARM2)                     # 領口
    rect(d, ox + 26, oy + 62, ox + 30, oy + 68, (247, 201, 74, 255))       # 胸前小徽章
    # 舉杯的手臂（他的右手＝畫面左邊）
    d.polygon([(ox + 6, oy + 52), (ox - 4, oy + 40), (ox - 10, oy + 42), (ox + 0, oy + 60)], fill=ARM)
    rect(d, ox - 13, oy + 31, ox - 5, oy + 41, SKIN)                       # 手
    # 頭：Q 版大頭
    d.rounded_rectangle([ox + 8, oy + 6, ox + 48, oy + 46], 8, fill=SKIN)
    rect(d, ox + 10, oy + 40, ox + 46, oy + 46, SKIN2)
    # 頭髮：上面一整片＋兩側＋瀏海鋸齒
    d.rounded_rectangle([ox + 4, oy - 2, ox + 52, oy + 20], 10, fill=HAIR)
    rect(d, ox + 4, oy + 8, ox + 10, oy + 36, HAIR); rect(d, ox + 46, oy + 8, ox + 52, oy + 36, HAIR)
    for k, x in enumerate(range(ox + 10, ox + 46, 6)): rect(d, x, oy + 20, x + 3, oy + 23 + (k % 2) * 3, HAIR)
    rect(d, ox + 6, oy + 2, ox + 30, oy + 5, (214, 140, 98, 255))           # 頭髮亮光
    rect(d, ox + 4, oy + 28, ox + 6, oy + 36, HAIR2); rect(d, ox + 50, oy + 28, ox + 52, oy + 36, HAIR2)
    # 表情：開心的瞇眼（^ ^）、臉紅、張嘴笑
    for ex in (ox + 17, ox + 33):
        rect(d, ex - 1, oy + 29, ex + 1, oy + 31, EYE); rect(d, ex + 1, oy + 27, ex + 5, oy + 28, EYE); rect(d, ex + 5, oy + 29, ex + 7, oy + 31, EYE)
    rect(d, ox + 13, oy + 33, ox + 17, oy + 35, BLUSH); rect(d, ox + 39, oy + 33, ox + 43, oy + 35, BLUSH)
    d.polygon([(ox + 24, oy + 36), (ox + 32, oy + 36), (ox + 30, oy + 41), (ox + 26, oy + 41)], fill=(150, 46, 52, 255))
    rect(d, ox + 26, oy + 39, ox + 30, oy + 40, (236, 120, 130, 255))
    mug(d, ox - 18, oy + 19)                                                # 手上的酒杯
    return outline(L)

def you():
    """你的手：從畫面右下角伸進來，拿著酒杯"""
    L = Image.new('RGBA', (NW, NH), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
    d.polygon([(130, 120), (130, 144), (98, 144), (104, 126), (114, 118)], fill=SLEEVE)   # 袖子
    rect(d, 102, 138, 130, 144, SLEEVE2)
    d.polygon([(104, 126), (100, 118), (106, 110), (114, 112), (116, 120)], fill=SKIN)   # 手掌
    mug(d, 90, 96)
    rect(d, 100, 106, 104, 112, SKIN); rect(d, 100, 112, 103, 116, SKIN2)                  # 握住杯身的手指
    return outline(L)

def tavern():
    L = Image.new('RGBA', (NW, NH), (96, 58, 40, 255)); d = ImageDraw.Draw(L)
    for x in range(0, NW, 12): rect(d, x, 0, x, 100, (80, 47, 32, 255))      # 牆板
    # 燈的暖光（一圈一圈）
    for r, c in ((40, (110, 68, 44, 255)), (26, (126, 80, 50, 255)), (14, (146, 96, 58, 255))):
        d.ellipse([68 - r, 14 - r, 68 + r, 14 + r], fill=c)
    rect(d, 68, 0, 68, 8, OL); d.rectangle([63, 8, 73, 20], fill=(247, 201, 74, 255), outline=OL); rect(d, 65, 10, 71, 12, (255, 240, 170, 255))
    # 酒架兩層、瓶子
    for sy in (34, 60):
        d.rectangle([0, sy, NW - 1, sy + 3], fill=(150, 98, 60, 255), outline=OL)
    bot = [(4, (92, 160, 80)), (12, (200, 120, 50)), (19, (170, 60, 60)), (98, (92, 160, 80)), (106, (230, 200, 90)), (114, (170, 60, 60)), (122, (120, 90, 170))]
    for sy in (34, 60):
        for k, (x, c) in enumerate(bot):
            hh = 11 + (k + sy) % 3 * 2
            d.rectangle([x, sy - hh, x + 5, sy - 1], fill=c + (255,), outline=OL); rect(d, x + 2, sy - hh - 3, x + 3, sy - hh, OL)
            rect(d, x + 1, sy - hh + 3, x + 1, sy - 4, (255, 255, 255, 120))
    return L

def counter(L):
    d = ImageDraw.Draw(L)
    rect(d, 0, 104, NW, NH, (120, 74, 46, 255))                              # 吧台正面
    for x in range(8, NW, 16): rect(d, x, 113, x, NH, (98, 58, 36, 255))
    rect(d, 0, 101, NW, 111, (186, 128, 80, 255)); rect(d, 0, 101, NW, 102, (214, 160, 106, 255))   # 檯面
    rect(d, 0, 100, NW, 100, OL); rect(d, 0, 112, NW, 112, OL)
    d.ellipse([20, 104, 34, 108], fill=(160, 104, 64, 255))                  # 檯面上的水漬

def scene():
    L = tavern()
    L.alpha_composite(hero())
    counter(L)
    L.alpha_composite(you())
    # 舉杯的閃光
    d = ImageDraw.Draw(L)
    for x, y in ((14, 44), (8, 50), (24, 38)): rect(d, x, y, x, y + 2, (255, 240, 170, 255)); rect(d, x - 1, y + 1, x + 1, y + 1, (255, 240, 170, 255))
    return L.resize((NW * S, NH * S), Image.NEAREST)

def page():
    im = mainscreen.main(); d = ImageDraw.Draw(im); W = im.width
    im.alpha_composite(scene(), (0, 96))
    d.rectangle([0, 958, W, 962], fill=O[:3])
    # 左上：在哪裡、做什麼；右上：時間
    box(d, 20, 116, 330, 178, fill=PAPER); iw = icon_c(im, '酒窖', 36, 147, 3); text_c(d, 36 + iw + 12, 147, '酒館・請喝一杯', 16)
    box(d, 600, 116, 760, 178, fill=PAPER); iw = icon_c(im, '時間', 616, 147, 3); text_c(d, 616 + iw + 10, 147, '20:40', 16)
    # 對話區：清掉原本的訊息，換成這段互動
    d.rectangle([0, 1056, W, im.height - 151], fill=PAPER)
    y = 1070
    text_c(d, 20, y + 24, '你', 16, MUTED); text_c(d, 80, y + 24, '「走，今晚我請你喝一杯」', 16)
    d.line([(20, y + 66), (760, y + 66)], fill=(214, 190, 150), width=2); y += 84
    face = Image.open(TD + '07_01.png').convert('RGBA')
    im.alpha_composite(face.resize((48, 48), Image.NEAREST), (20, y)); text_c(d, 80, y + 24, '阿熊', 16, (37, 149, 106))
    text_c(d, 80, y + 72, '「乾杯！老闆今天怎麼突然請客？」', 16)
    d.line([(20, y + 110), (760, y + 110)], fill=(214, 190, 150), width=2); y += 124
    text_c(d, 20, y + 30, '你要說什麼？', 16, MUTED)
    for k, t in enumerate(('你辛苦了', '有事想問你', '慶祝一下')):
        bx = 20 + k * 250; box(d, bx, y + 70, bx + 236, y + 140, border=GOLD); d.rectangle([bx + 3, y + 73, bx + 233, y + 137], outline=O[:3], width=2); text_c(d, bx + 118, y + 105, t, 16, TXT, True)
    cy = y + 186; iw = icon_c(im, '時間', 20, cy, 3); d.rectangle([20 + iw + 12, cy - 14, 640, cy + 14], fill=(230, 220, 195), outline=O[:3], width=3); d.rectangle([20 + iw + 15, cy - 11, 20 + iw + 15 + (640 - 20 - iw - 18) * .8, cy + 11], fill=GOLD)
    text_c(d, 660, cy, '12 秒', 16, TXT)
    return im

if __name__ == '__main__':
    a = page(); out = Image.new('RGBA', (a.width + 40, a.height + 80), (38, 40, 56, 255)); d = ImageDraw.Draw(out)
    text(d, 20, 16, '第一人稱：酒館・請喝一杯', 12, (240, 230, 200)); out.alpha_composite(a, (20, 64))
    out.convert('RGB').resize((out.width // 2, out.height // 2), Image.LANCZOS).save(sys.argv[1])
