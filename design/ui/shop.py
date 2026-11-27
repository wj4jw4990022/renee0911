# 花錢面板新版草圖（裝備、照顧兩頁＋點圖示的說明框）
import sys
import os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw
from style import *

ARMOR = {   # 防具圖也統一粗外框
 '布衣': grid(['.LL...LL.', 'LLLLLLLLL', 'LLLLLLLLL', '.LLLLLLL.', '.LLLLLLL.', '.LLLLLLL.', '.LLLLLLL.']),
 '皮甲': grid(['.NN...NN.', 'NNNNNNNNN', 'NNnNNNnNN', '.NNNNNNN.', '.NnnnnnN.', '.NNNNNNN.', '.NNNNNNN.']),
}
ARMOR = {k: outline(v) for k, v in ARMOR.items()}
SMITH = Image.open(TD + '07_04.png').convert('RGBA')

L = 44            # 左邊界（卡片內）
def phone(title_icon, title):
    W, H = 390 * 2, 700 * 2; im = Image.new('RGBA', (W, H), PAPER + (255,)); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 110], fill=(150, 200, 230)); text_c(d, 24, 55, '（地圖）', 12, (90, 120, 150))
    d.rectangle([0, 110, W, 196], fill=WOOD); d.rectangle([0, 192, W, 196], fill=WOOD2)
    icon_c(im, title_icon, 24, 152, 4); text_c(d, 84, 152, title, 24, (250, 240, 214))
    box(d, W - 92, 122, W - 28, 182); d.line([(W - 74, 138), (W - 46, 166)], fill=O[:3], width=5); d.line([(W - 74, 166), (W - 46, 138)], fill=O[:3], width=5)
    return im, d

def tabs(im, d, y, sel, grey=()):
    for i, (n, lab) in enumerate((('戰力', '裝備'), ('照顧', '照顧'), ('商隊', '商隊'))):
        x = 24 + i * 126; g = lab in grey; c = (150, 140, 130) if g else TXT
        box(d, x, y, x + 110, y + 108, fill=GREEN if i == sel else (215, 205, 185) if g else PAPER, border=(150, 140, 130) if g else O[:3])
        ic = ICON[n].convert('LA').convert('RGBA') if g else ICON[n]
        icon_c(im, ic, x + 55, y + 38, 3, True); text_c(d, x + 55, y + 84, lab, 12, c, True)

def status(im, d, y):   # 金幣、每月開銷、撐幾個月（圖示和數字都對齊中線）
    for i, (n, v, c) in enumerate((('金幣', '500', TXT), ('下降', '10/月', RED), ('時間', '50 月', TXT))):
        x = 24 + i * 248; box(d, x, y, x + 228, y + 72); iw = icon_c(im, n, x + 14, y + 36, 4); text_c(d, x + 14 + iw + 10, y + 36, v, 24, c)

def price_btn(im, d, x, cy, price, w=210):
    box(d, x, cy - 36, x + w, cy + 36); iw = icon_c(im, '金幣', x + 14, cy, 4); text_c(d, x + 14 + iw + 10, cy, price, 24)

def gear_card(im, d, y, cat, cur, nxt, cur_n, nxt_n, stat, a, b, price, left):
    box(d, 24, y, 756, y + 330)
    cw = icon_c(im, cat, L, y + 42, 5)
    for k in range(4): d.rectangle([L + cw + 14 + k * 34, y + 30, L + cw + 38 + k * 34, y + 54], fill=GOLD if k < 1 else (220, 205, 175), outline=O[:3], width=2)   # 等級 1/4
    for j, (ic, nm) in enumerate(((cur, cur_n), (nxt, nxt_n))):
        x = L + j * 400
        icon_c(im, ic, x + 145, y + 124, 6, True); text_c(d, x + 145, y + 190, nm, 24, TXT, True)
    text_c(d, L + 345, y + 139, '→', 24, MUTED, True)
    cy = y + 268; iw = icon_c(im, stat, L, cy, 5); tx = L + iw + 14; w = text_c(d, tx, cy, f'{a} → ', 24); text_c(d, tx + w + 6, cy, str(b), 24, (37, 149, 106))
    price_btn(im, d, 756 - 20 - 230, cy, price, 230)

def tip(im, d, x, y, n, title, line):   # 點圖示跳出的說明框
    w = 700; box(d, x, y, x + w, y + 110, fill=(255, 252, 238)); d.polygon([(x + 40, y + 110), (x + 64, y + 110), (x + 46, y + 130)], fill=O[:3]); d.polygon([(x + 44, y + 107), (x + 60, y + 107), (x + 47, y + 120)], fill=(255, 252, 238))
    icon_c(im, n, x + 20, y + 34, 4); text_c(d, x + 76, y + 34, title, 24); text_c(d, x + 20, y + 84, line, 12, MUTED)

def shop_gear():
    im, d = phone('金幣', '花錢'); tabs(im, d, 220, 0, grey=('商隊',)); status(im, d, 352)
    box(d, 24, 448, 756, 528); im.alpha_composite(SMITH.resize((48, 48), Image.NEAREST), (L, 464)); icon_c(im, '鐵匠', L + 60, 488, 3); text_c(d, L + 110, 488, '「最近鐵很貴！」', 16, MUTED)
    gear_card(im, d, 552, '戰力', kt('08_07'), kt('08_08'), '木匕首', '鐵匕首', '戰力', 11, 18, '317', 183)
    gear_card(im, d, 920, '防具', ARMOR['布衣'], ARMOR['皮甲'], '布衣', '皮甲', '防具', '×1', '×1.4', '240', 260)
    tip(im, d, 30, 552 + 268 - 40 - 136, '戰力', '戰力', '打怪的強度。越高，打得越快、越不容易受傷。')
    return im

CARE = [('照顧', '看醫生', [('心情', '+'), ('體力', '+')], '100', '現在不用'), ('戰力', '教練特訓 2 月', [('上升', '經驗')], '190', ''), ('金幣', '給零用錢', [('心情', '+')], '100', '')]
def shop_care():
    im, d = phone('金幣', '花錢'); tabs(im, d, 220, 1, grey=('商隊',)); status(im, d, 352)
    y = 452; H = 180
    for n, nm, eff, price, note in CARE:   # 一列一項：左圖示置中、名稱＋效果、右邊價錢（補充小字在價錢正下方）
        box(d, 24, y, 756, y + H); cy = y + H // 2
        icon_c(im, n, L + 30, cy, 6, True)
        text_c(d, L + 96, y + 52, nm, 24)
        x = L + 96
        for e, sgn in eff: w = icon_c(im, e, x, y + 124, 5); text_c(d, x + w + 8, y + 124, sgn, 24, (37, 149, 106)); x += 150
        bx = 756 - 20 - 210; price_btn(im, d, bx, cy if not note else y + 70, price)
        if note: text_c(d, bx + 105, y + 140, note, 12, MUTED, True)
        y += H + 24
    return im

if __name__ == '__main__':
    a, b = shop_gear(), shop_care()
    out = Image.new('RGBA', (a.width * 2 + 60, a.height + 80), (38, 40, 56, 255)); d = ImageDraw.Draw(out)
    text(d, 20, 16, '裝備（示意：點「戰力」跳出說明）', 12, (240, 230, 200)); text(d, a.width + 40, 16, '照顧（一列一項）', 12, (240, 230, 200))
    out.alpha_composite(a, (20, 64)); out.alpha_composite(b, (a.width + 40, 64))
    out.convert('RGB').resize((out.width // 2, out.height // 2), Image.LANCZOS).save(sys.argv[1])
