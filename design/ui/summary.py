# 離線回來的摘要（「你不在的這段時間 過了 N 個月」）新版草圖
# 用法：python3 summary.py 草圖_離線摘要.png
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw, ImageFont
import style
from style import *
import people, quest, mainscreen   # 補圖示（近況、打勾、驚嘆）

# v17.74 起介面字型是 jf open 粉圓：草圖也改用粉圓
HUN = os.path.join(style.HERE, '..', 'fonts', 'jf-openhuninn-2.0.ttf')
for k, s in ((12, 28), (16, 32), (24, 44)): style.FS[k] = ImageFont.truetype(HUN, s)
FS = style.FS
W, H = 780, 1560
OKD, MUT = (37, 149, 106), MUTED

def face(im, tile, x, y, s, bg=None):
    if bg: d = ImageDraw.Draw(im); d.rectangle([x, y, x + 16 * s, y + 16 * s], fill=bg)
    f = Image.open(TD + tile + '.png').convert('RGBA').crop((0, 0, 16, 13)); im.alpha_composite(f.resize((16 * s, 13 * s), Image.NEAREST), (x, y + 3 * s))

def tw(d, t, s): b = d.textbbox((0, 0), t, font=FS[s], stroke_width=1); return b[2] - b[0]

def panel(months, greet, tiles, evs, news):
    im = Image.new('RGBA', (W, 2400), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 2400], fill=PAPER2 + (255,)); d.rectangle([0, 0, W, 4], fill=O[:3])
    d.rectangle([0, 4, W, 90], fill=WOOD); d.rectangle([0, 86, W, 90], fill=WOOD2)   # 標題列：時鐘＋過了 N 個月（「你不在的這段時間」收進時鐘的說明框）
    iw = icon_c(im, '時間', 24, 47, 4); text_c(d, 24 + iw + 14, 47, f'過了 {months} 個月', 24, (250, 240, 214))
    box(d, W - 92, 16, W - 28, 78); d.line([(W - 74, 32), (W - 46, 60)], fill=O[:3], width=5); d.line([(W - 74, 60), (W - 46, 32)], fill=O[:3], width=5)
    y = 114
    # 勇者一句話（和出發卡同一套）
    face(im, '07_04', 30, y + 6, 4, (196, 160, 230))
    box(d, 110, y, 110 + tw(d, greet, 16) + 48, y + 76, fill=(255, 250, 240), shadow=False); text_c(d, 134, y + 38, greet, 16)
    y += 104
    # 變化：一格一項（圖示＋數字），三欄
    cw = (W - 48 - 28) // 3
    for i, (ic, v) in enumerate(tiles):
        x = 24 + (i % 3) * (cw + 14); yy = y + (i // 3) * 102
        box(d, x, yy, x + cw, yy + 84)
        if ic == '錢包': face(im, '07_04', x + 16, yy + 10, 4); icon_c(im, '金幣', x + 50, yy + 62, 2); iw = 56   # 他的錢包＝他的臉＋小金幣
        else: iw = icon_c(im, ic, x + 18, yy + 42, 4)
        c = OKD if str(v).startswith('+') or '→' in str(v) else RED if str(v).startswith('-') else MUT
        s = 16 if '→' in str(v) else 24
        text_c(d, x + 18 + iw + 16, yy + 42, v, s, c)   # 數字接在圖示後面
    y += ((len(tiles) + 2) // 3) * 102 + 10
    # 發生的事（和主畫面對話區同樣的訊息樣式）
    if evs:
        y += 6; iw = icon_c(im, '驚嘆', 30, y + 20, 3); text_c(d, 30 + iw + 12, y + 20, '發生的事', 16, MUT); y += 50
        box(d, 24, y, W - 24, y + 24 + len(evs) * 108)
        yy = y + 14
        for k, (gd, t, line) in enumerate(evs):
            icon_c(im, '打勾' if gd else '驚嘆', 46, yy + 24, 3); text_c(d, 90, yy + 24, t, 16, OKD if gd else (214, 120, 30)); text_c(d, 90, yy + 66, line, 16)
            if k < len(evs) - 1: d.line([(44, yy + 98), (W - 44, yy + 98)], fill=(214, 190, 150), width=2)
            yy += 108
        y += 24 + len(evs) * 108 + 24
    if news:
        iw = icon_c(im, '近況', 30, y + 20, 3); text_c(d, 30 + iw + 12, y + 20, '村子裡', 16, MUT); y += 50
        box(d, 24, y, W - 24, y + 20 + len(news) * 60)
        for k, t in enumerate(news): text_c(d, 46, y + 40 + k * 60, t, 16)
        y += 20 + len(news) * 60 + 24
    # 知道了（金框＝現在要按）
    y += 10; box(d, 24, y, W - 24, y + 96, fill=GOLD); d.rectangle([30, y + 6, W - 30, y + 9], fill=(255, 225, 140))
    iw = icon_c(im, '打勾', 0, -100, 4); tot = iw + 16 + tw(d, '知道了', 24); x = W // 2 - tot // 2
    icon_c(im, '打勾', x, y + 48, 4); text_c(d, x + iw + 16, y + 48, '知道了', 24)
    y += 96 + 40
    return im.crop((0, 0, W, y))

def phone(p):   # 面板貼在畫面最下面，上面變暗
    im = Image.new('RGBA', (W, H), (60, 50, 44, 255)); d = ImageDraw.Draw(im)
    text_c(d, 24, 120, '（後面的畫面變暗）', 12, (150, 135, 120))
    im.alpha_composite(p, (0, H - p.height)); return im

def page_a():   # 你截圖的那次：沒什麼事
    return phone(panel(6, '……回來了喔', [('金幣', '-250'), ('名聲', '0'), ('錢包', '-12'), ('心情', '+8'), ('信任', '-2')], [], []))

def page_b():   # 有升級、有事、有村子消息
    return phone(panel(6, '老闆你回來啦！有好多事想跟你說', [('金幣', '+1,240'), ('名聲', '+36'), ('錢包', '+85'), ('心情', '+12'), ('信任', '+5'), ('經驗', 'Lv3→Lv4')],
        [(1, '委託完成', '掃蕩森林的哥布林，拿到 357 金'), (0, '受傷', '在荒地被蠍子螫到，休養 1 個月'), (1, '善行', '救了被史萊姆圍住的商人')],
        ['鐵匠的女兒結婚了', '旅館漲價了']))

if __name__ == '__main__':
    a, b = page_a(), page_b()
    out = Image.new('RGBA', (W * 2 + 60, H + 80), (38, 40, 56, 255)); d = ImageDraw.Draw(out)
    text(d, 20, 16, '沒什麼事（你截圖那次）', 12, (240, 230, 200)); text(d, W + 40, 16, '有升級、有事、有村子消息', 12, (240, 230, 200))
    out.alpha_composite(a, (20, 64)); out.alpha_composite(b, (W + 40, 64))
    out.convert('RGB').resize((out.width // 2, out.height // 2), Image.LANCZOS).save(sys.argv[1])
