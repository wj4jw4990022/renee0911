# 任務出發卡新版草圖（點任務卡跳出的「選同伴、排進排程」）
# 用法：python3 sendoff.py 草圖_出發卡.png
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw, ImageFont
import style
from style import *
import people, quest   # 補圖示（生病、一起出任務、加號、打勾）

# v17.74 起介面字型是 jf open 粉圓：草圖也改用粉圓
HUN = os.path.join(style.HERE, '..', 'fonts', 'jf-openhuninn-2.0.ttf')
for k, s in ((12, 28), (16, 32), (24, 44)): style.FS[k] = ImageFont.truetype(HUN, s)
FS = style.FS
W, H = 780, 1560
ORANGE, OKD = (214, 120, 30), (37, 149, 106)

def face(im, tile, x, y, s, bg=None):
    if bg: d = ImageDraw.Draw(im); d.rectangle([x, y, x + 16 * s, y + 16 * s], fill=bg)
    f = Image.open(TD + tile + '.png').convert('RGBA').crop((0, 0, 16, 13)); im.alpha_composite(f.resize((16 * s, 13 * s), Image.NEAREST), (x, y + 3 * s))

def base():
    im = Image.new('RGBA', (W, H), (60, 50, 44, 255)); d = ImageDraw.Draw(im)
    text_c(d, 24, 120, '（後面的畫面變暗）', 12, (150, 135, 120))
    y0 = 250; d.rectangle([0, y0, W, H], fill=PAPER2 + (255,)); d.rectangle([0, y0, W, y0 + 4], fill=O[:3])
    d.rectangle([0, y0 + 4, W, y0 + 90], fill=WOOD); d.rectangle([0, y0 + 86, W, y0 + 90], fill=WOOD2)   # 標題列（和其他面板一樣）
    icon_c(im, '任務', 24, y0 + 47, 4); text_c(d, 84, y0 + 47, '出發前', 24, (250, 240, 214))
    box(d, W - 92, y0 + 16, W - 28, y0 + 78); d.line([(W - 74, y0 + 32), (W - 46, y0 + 60)], fill=O[:3], width=5); d.line([(W - 74, y0 + 60), (W - 46, y0 + 32)], fill=O[:3], width=5)
    return im, d, y0 + 112

def card(im, d, y, ag, zone, dur, due, title, fame, gold, cut, dg, win):
    c = (122, 86, 168) if ag else (138, 90, 54)
    box(d, 24, y, 756, y + 290); d.rectangle([27, y + 3, 753, y + 62], fill=c)
    iw = icon_c(im, '事務所' if ag else '任務', 46, y + 33, 3); text_c(d, 46 + iw + 12, y + 33, zone, 16, (250, 240, 214))
    iw = icon_c(im, '時間', 240, y + 33, 3); text_c(d, 240 + iw + 10, y + 33, dur, 16, (250, 240, 214))
    if due: iw = icon_c(im, '時間', 560, y + 33, 3); text_c(d, 560 + iw + 10, y + 33, due, 16, (255, 200, 190))
    text_c(d, 46, y + 106, title, 24)
    cy = y + 172; x = 46
    if fame: x += icon_c(im, '名聲', x, cy, 4) + 10; x += text_c(d, x, cy, f'+{fame}', 24) + 30
    x += icon_c(im, '金幣', x, cy, 4) + 10; x += text_c(d, x, cy, gold, 24) + 30
    iw = icon_c(im, '事務所', x, cy, 3); text_c(d, x + iw + 8, cy, cut, 16, MUTED)   # 你拿幾 %（點圖示看說明）
    cy = y + 240
    if dg == 0: iw = icon_c(im, '心情', 46, cy, 3); text_c(d, 46 + iw + 10, cy, '不用打', 16, OKD)
    else:
        sx = 46
        if dg < 0: sx += text_c(d, sx, cy, '安全', 16, OKD) + 14
        else:
            for k in range(dg): sx += icon_c(im, '危險', sx, cy, 3) + 4
        text_c(d, 734, cy, f'勝率 {win}', 24, OKD if dg <= 1 else RED, False) if False else None
        b = d.textbbox((0, 0), f'勝率 {win}', font=FS[24], stroke_width=1); text_c(d, 734 - (b[2] - b[0]), cy, f'勝率 {win}', 24, OKD if dg <= 1 else RED)
    return y + 318

def members(im, d, y, comp, picks, solo):
    text_c(d, 30, y + 22, '出發', 16, MUTED); y += 52
    # 勇者
    box(d, 24, y, 380, y + 150, fill=(232, 222, 246))
    face(im, '07_01', 46, y + 27, 6, (240, 150, 110)); text_c(d, 164, y + 50, '大熊', 24); iw = icon_c(im, '戰力', 164, y + 104, 3); text_c(d, 164 + iw + 10, y + 104, '63', 24)
    # 同伴
    if solo:
        d.rectangle([400, y, 756, y + 150], outline=(176, 138, 85), width=3); text_c(d, 578, y + 75, '一個人去', 16, MUTED, True)
    elif comp:
        nm, tile, pw, cost = comp
        box(d, 400, y, 756, y + 150, fill=(214, 240, 214))
        face(im, tile, 422, y + 27, 6, (90, 110, 90)); text_c(d, 540, y + 40, nm, 24)
        iw = icon_c(im, '戰力', 540, y + 84, 3); text_c(d, 540 + iw + 8, y + 84, pw, 16, OKD)
        if cost: iw2 = icon_c(im, '金幣', 540, y + 122, 3); text_c(d, 540 + iw2 + 8, y + 122, cost, 16)
        box(d, 694, y + 12, 742, y + 60, shadow=False); icon_c(im, '刪除', 718, y + 36, 4, True)   # 拿掉同伴
    else:
        d.rectangle([400, y, 756, y + 150], outline=(176, 138, 85), width=3); icon_c(im, '加號', 578, y + 54, 5, True); text_c(d, 578, y + 112, '選同伴', 16, MUTED, True)
    y += 176
    if picks:   # 可以一起去的人：頭像小卡，點了放進上面
        for i, (nm, tile, pw, cost, on) in enumerate(picks):
            x = 24 + (i % 4) * 184; yy = y + (i // 4) * 150
            box(d, x, yy, x + 168, yy + 128, fill=(214, 240, 214) if on else PAPER)
            face(im, tile, x + 14, yy + 16, 3, (205, 190, 160)); text_c(d, x + 72, yy + 36, nm, 16)
            text_c(d, x + 72, yy + 76, pw, 16, OKD)
            if cost: iw = icon_c(im, '金幣', x + 72, yy + 108, 2); text_c(d, x + 72 + iw + 6, yy + 108, cost, 12)
        y += ((len(picks) + 3) // 4) * 150 + 6
    return y

def state(im, d, y, items):   # 他現在的狀況：圖示＋兩三個字
    x = 24
    for ic, t, c in items:
        tw = d.textbbox((0, 0), t, font=FS[16], stroke_width=1); w = 30 + 34 + (tw[2] - tw[0]) + 20
        box(d, x, y, x + w, y + 60, shadow=False); iw = icon_c(im, ic, x + 16, y + 30, 3); text_c(d, x + 16 + iw + 10, y + 30, t, 16, c); x += w + 14
    return y + 84

def say(im, d, y, t):
    face(im, '07_01', 30, y + 6, 4, (240, 150, 110))
    tw = d.textbbox((0, 0), t, font=FS[16], stroke_width=1); w = tw[2] - tw[0] + 48
    box(d, 110, y, 110 + w, y + 76, fill=(255, 250, 240), shadow=False); text_c(d, 134, y + 38, t, 16)
    return y + 100

def go_btn(im, d, y, t='排進排程'):
    box(d, 24, y, 756, y + 96, fill=GOLD, border=O[:3]); d.rectangle([30, y + 6, 750, y + 9], fill=(255, 225, 140))
    iw = icon_c(im, '排程', 0, -100, 4); b = d.textbbox((0, 0), t, font=FS[24], stroke_width=1); tot = iw + 16 + b[2] - b[0]; x = 390 - tot // 2
    icon_c(im, '排程', x, y + 48, 4); text_c(d, x + iw + 16, y + 48, t, 24)

def page_a():   # 委託：可以帶同伴（選了鐵牙）
    im, d, y = base()
    y = card(im, d, y, False, '森林', '約 3 月', '', '掃蕩森林的哥布林', 0, '357', '30%', -1, '97%')
    y = members(im, d, y, ('鐵牙', '07_03', '+40%', '380'),
                [('阿桃', '07_02', '+10%', '', 0), ('阿福', '07_00', '+10%', '', 0), ('艾琳', '07_04', '+20%', '', 0), ('小豆', '07_05', '+30%', '', 0), ('鐵牙', '07_03', '+40%', '380', 1)], False)
    y = state(im, d, y, [('體力', '有點累', ORANGE), ('生病', '跛腳', ORANGE), ('照顧', '×2', TXT)])
    y = say(im, d, y, '輕鬆啦')
    go_btn(im, d, max(y, 1430)); return im

def page_b():   # 事務所任務：不用打、一個人去
    im, d, y = base()
    y = card(im, d, y, True, '村子', '1 月', '剩 6 月', '粉絲見面會', 6, '158', '10%', 0, '')
    y = members(im, d, y, None, [], True)
    y = state(im, d, y, [('體力', '精神好', OKD), ('照顧', '×2', TXT)])
    y = say(im, d, y, '小事一樁！')
    go_btn(im, d, 1430); return im

if __name__ == '__main__':
    a, b = page_a(), page_b()
    out = Image.new('RGBA', (W * 2 + 60, H + 80), (38, 40, 56, 255)); d = ImageDraw.Draw(out)
    text(d, 20, 16, '委託（可以帶同伴）', 12, (240, 230, 200)); text(d, W + 40, 16, '事務所任務（不用打、一個人去）', 12, (240, 230, 200))
    out.alpha_composite(a, (20, 64)); out.alpha_composite(b, (W + 40, 64))
    out.convert('RGB').resize((out.width // 2, out.height // 2), Image.LANCZOS).save(sys.argv[1])
