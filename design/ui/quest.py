# 任務面板新版草圖（排程、接任務）
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw
from style import *
from shop import phone, L
import people   # 新圖示（一起出任務等）
import wild
WI = wild.items()

NEW = {
 '休息': grid(['N........', 'NLLL.....', 'NLLLRRRRR', 'NNNNNNNNN', 'N.......N']),
 '問號': grid(['.YYYY.', 'YY..YY', '....YY', '...YY.', '..YY..', '......', '..YY..']),
 '放手': grid(['.....KKK.', '....K...K', '....K....', 'YYYYYYY..', 'YYYOYYY..', 'YYYOYYY..', 'yyyyyyy..']),   # 打開的鎖
 '打勾': grid(['......GG', '.....GG.', 'GG..GG..', '.GGGG...', '..GG....']),
 '加號': grid(['..GG..', '..GG..', 'GGGGGG', 'GGGGGG', '..GG..', '..GG..']),
 '往上': grid(['...K...', '..KKK..', '.KKKKK.', 'KKKKKKK', '..KKK..', '..KKK..', '..KKK..']),
 '刪除': grid(['R...R', '.R.R.', '..R..', '.R.R.', 'R...R']),
}
for k, v in NEW.items(): ICON[k] = outline(v)
ZONE = [('休息', ICON['休息'], (89, 168, 255), 0, ''), ('草原', WI['bush'], (111, 207, 151), 0, '×1'), ('森林', WI['tree'], (37, 149, 106), 3, '×2.5'), ('荒地', WI['cactus'], (214, 170, 100), 3, '×2.5')]

def qtabs(im, d, y, sel):
    for i, (n, lab) in enumerate((('排程', '排程'), ('任務', '接任務'))):
        x = 24 + i * 156; box(d, x, y, x + 140, y + 108, fill=GREEN if i == sel else PAPER)
        icon_c(im, n, x + 70, y + 40, 3, True); text_c(d, x + 70, y + 84, lab, 12, TXT, True)

def skulls(im, x, cy, n, s=2):   # 危險度：0＝安全（綠勾），1～3 顆骷髏
    if n == 0: return text_c(d_global, x, cy, '安全', 12, (37, 149, 106))
    w = 0
    for k in range(n): w += icon_c(im, '危險', x + w, cy, s) + 2
    return w

def queue_page():
    global d_global
    im, d = phone('排程', '任務'); d_global = d; qtabs(im, d, 220, 0)
    # 每天去哪：區域小卡（圖示＋名稱＋危險＋收穫倍率）
    y = 356; text_c(d, 30, y + 20, '沒排程時去哪', 16, MUTED)
    for i, (nm, ic, c, dg, mul) in enumerate(ZONE):
        x = 24 + i * 184; box(d, x, y + 50, x + 168, y + 262, fill=(214, 240, 214) if i == 1 else PAPER)
        d.rectangle([x + 3, y + 53, x + 165, y + 66], fill=c)
        icon_c(im, ic, x + 84, y + 106, 4 if nm == '休息' else 3, True); text_c(d, x + 84, y + 158, nm, 16, TXT, True)
        if nm == '休息': icon_c(im, '體力', x + 84, y + 210, 3, True)
        elif dg == 0: text_c(d, x + 84, y + 210, mul, 16, (37, 149, 106), True)
        else:
            sx = x + 84 - (dg * 27) // 2
            for k in range(dg): sx += icon_c(im, '危險', sx, y + 202, 3) + 2
            iw = icon_c(im, '金幣', x + 34, y + 236, 2); text_c(d, x + 34 + iw + 6, y + 236, mul, 12, TXT)
    # 12 個月
    y = 650; box(d, 24, y, 756, y + 120)
    for m in range(12):
        x = 44 + m * 58; c = (89, 168, 255) if m == 2 else (111, 207, 151) if m in (0, 1) else (230, 220, 195)
        d.rectangle([x, y + 22, x + 50, y + 66], fill=c, outline=O[:3], width=2); text_c(d, x + 25, y + 92, str(m + 1), 12, TXT if m else RED, True)
    # 排程：一項一行
    y = 790
    items = [('任務', '清掉田邊的史萊姆', '1～2 月', 0), ('休息', '休息', '3 月', None)]
    for ic, nm, when, dg in items:
        box(d, 24, y, 756, y + 104); icon_c(im, ic, L, y + 52, 4); text_c(d, L + 70, y + 36, nm, 16); iw = icon_c(im, '時間', L + 70, y + 76, 2); text_c(d, L + 70 + iw + 6, y + 76, when, 12, MUTED)
        if dg is not None: text_c(d, L + 260, y + 76, '安全', 12, (37, 149, 106))
        for k, n in enumerate(('往上', '刪除')): bx = 600 + k * 74; box(d, bx, y + 22, bx + 60, y + 82, shadow=False); icon_c(im, n, bx + 30, y + 52, 4, True)
        y += 124
    for k in range(2):   # 空格：大加號
        d.rectangle([24, y, 756, y + 84], outline=(176, 138, 85), width=3); icon_c(im, '加號', 390, y + 42, 4, True); y += 104
    # 自己接任務嗎：三個圖示鈕
    y += 10; text_c(d, 30, y + 34, '自己接任務', 16, MUTED)
    for k, (n, on) in enumerate((('鎖', 0), ('問號', 1), ('放手', 0))):
        bx = 330 + k * 140; box(d, bx, y, bx + 120, y + 68, fill=GREEN if on else PAPER); icon_c(im, n, bx + 60, y + 34, 3, True)
    return im

def qcard(im, d, x, y, kind, zone, mon, title, fame, gold, dg, due):
    c = (122, 86, 168) if kind == '事務所' else (138, 90, 54)
    box(d, x, y, x + 356, y + 300); d.rectangle([x + 3, y + 3, x + 353, y + 60], fill=c)
    icon_c(im, kind if kind == '事務所' else '任務', x + 18, y + 32, 3); text_c(d, x + 70, y + 32, zone, 16, (250, 240, 214)); iw = icon_c(im, '時間', x + 210, y + 32, 2); text_c(d, x + 210 + iw + 6, y + 32, mon, 16, (250, 240, 214))
    text_c(d, x + 18, y + 100, title, 16)
    cy = y + 160
    if fame: iw = icon_c(im, '名聲', x + 18, cy, 3); text_c(d, x + 18 + iw + 6, cy, f'+{fame}', 24); iw2 = icon_c(im, '金幣', x + 180, cy, 3); text_c(d, x + 180 + iw2 + 6, cy, str(gold), 24)
    else: iw = icon_c(im, '金幣', x + 18, cy, 3); text_c(d, x + 18 + iw + 6, cy, str(gold), 24)
    cy = y + 222
    if dg == 0: icon_c(im, '心情', x + 18, cy, 2); text_c(d, x + 56, cy, '不用打', 16, (37, 149, 106))
    else:
        sx = x + 18
        for k in range(dg): sx += icon_c(im, '危險', sx, cy, 3) + 2
        text_c(d, sx + 10, cy, '勝率 95%', 16, (37, 149, 106))
    iw = icon_c(im, '時間', x + 18, y + 272, 2); text_c(d, x + 18 + iw + 6, y + 272, due, 12, RED if due.startswith('1') else MUTED)

def take_page():
    im, d = phone('排程', '任務'); qtabs(im, d, 220, 1)
    y = 356
    for k, (n, cnt, on) in enumerate((('全部', 6, 1), ('任務', 3, 0), ('事務所', 3, 0), ('時間', 0, 0))):   # 篩選：圖示＋數量
        bx = 24 + k * 184; box(d, bx, y, bx + 168, y + 72, fill=GREEN if on else PAPER)
        if n == '全部': text_c(d, bx + 44, y + 36, '全', 16, TXT, True)
        else: icon_c(im, n, bx + 44, y + 36, 3, True)
        text_c(d, bx + 110, y + 36, str(cnt), 24, TXT, True)
    cards = [('事務所', '村子', '1 月', '粉絲見面會', 6, 158, 0, '剩 6 月'), ('事務所', '村子', '1 月', '商會代言', 7, 252, 0, '剩 8 月'),
             ('任務', '草原', '1 月', '清掉田邊的史萊姆', 0, 86, 1, '剩 4 月'), ('任務', '森林', '3 月', '護送商人', 0, 240, 2, '剩 2 月')]
    for i, cd in enumerate(cards): qcard(im, d, 24 + (i % 2) * 376, 460 + (i // 2) * 330, *cd)
    return im

if __name__ == '__main__' and len(sys.argv) == 2:
    a, b = queue_page(), take_page()
    out = Image.new('RGBA', (a.width * 2 + 60, a.height + 80), (38, 40, 56, 255)); d = ImageDraw.Draw(out)
    text(d, 20, 16, '排程', 12, (240, 230, 200)); text(d, a.width + 40, 16, '接任務', 12, (240, 230, 200))
    out.alpha_composite(a, (20, 64)); out.alpha_composite(b, (a.width + 40, 64))
    out.convert('RGB').resize((out.width // 2, out.height // 2), Image.LANCZOS).save(sys.argv[1])

# ---- v2：一頁：上方固定排程，下方挑任務 ----
def slot(im, d, x, y, w, it):
    if it is None:
        d.rectangle([x, y, x + w, y + 132], outline=(176, 138, 85), width=3); icon_c(im, '加號', x + w // 2, y + 66, 4, True); return
    ic, nm, when, col = it
    box(d, x, y, x + w, y + 132, fill=col)
    icon_c(im, ic, x + w // 2, y + 34, 3, True); text_c(d, x + w // 2, y + 76, nm, 12, TXT, True); text_c(d, x + w // 2, y + 112, when, 12, MUTED, True)

def one_page():
    im, d = phone('排程', '任務')
    # 排程（固定在上方）
    y = 214; d.rectangle([0, y, 780, y + 330], fill=PAPER2); d.line([(0, y + 330), (780, y + 330)], fill=WOOD2, width=4)
    text_c(d, 30, y + 34, '排程', 16)
    for k, (n, on) in enumerate((('草原小', 0), ('問號', 1))):   # 少用的兩個設定：沒排程時去哪（現在＝草原）、自己接任務（現在＝先問我）
        bx = 560 + k * 100; box(d, bx, y + 8, bx + 84, y + 64, shadow=False)
        if n == '草原小': icon_c(im, WI['bush'], bx + 42, y + 36, 2, True)
        else: icon_c(im, n, bx + 42, y + 36, 3, True)
    its = [('任務', '史萊姆', '1～2月', (214, 240, 214)), ('休息', '休息', '3月', (205, 225, 245)), None, None]
    for k, it in enumerate(its): slot(im, d, 24 + k * 184, y + 74, 168, it)
    for m in range(12):   # 12 個月小條
        x = 24 + m * 61; c = (89, 168, 255) if m == 2 else (111, 207, 151) if m in (0, 1) else (230, 220, 195)
        d.rectangle([x, y + 228, x + 52, y + 258], fill=c, outline=O[:3], width=2); text_c(d, x + 26, y + 290, str(m + 1), 12, RED if m == 0 else TXT, True)
    # 挑任務
    y = 570
    for k, (n, cnt, on) in enumerate((('全部', 6, 1), ('任務', 3, 0), ('事務所', 3, 0), ('時間', 0, 0))):
        bx = 24 + k * 184; box(d, bx, y, bx + 168, y + 72, fill=GREEN if on else PAPER)
        if n == '全部': text_c(d, bx + 44, y + 36, '全', 16, TXT, True)
        else: icon_c(im, n, bx + 44, y + 36, 3, True)
        text_c(d, bx + 110, y + 36, str(cnt), 24, TXT, True)
    cards = [('事務所', '村子', '1 月', '粉絲見面會', 6, 158, 0, '剩 6 月'), ('事務所', '村子', '1 月', '商會代言', 7, 252, 0, '剩 8 月'),
             ('任務', '草原', '1 月', '清掉田邊的史萊姆', 0, 86, 1, '剩 4 月'), ('任務', '森林', '3 月', '護送商人', 0, 240, 2, '剩 2 月')]
    for i, cd in enumerate(cards):
        x, yy = 24 + (i % 2) * 376, 670 + (i // 2) * 330; qcard(im, d, x, yy, *cd)
        if i == 2: box(d, x + 270, yy + 220, x + 340, yy + 288, fill=(214, 240, 214), shadow=False); icon_c(im, '打勾', x + 305, yy + 254, 3, True)   # 已排進去
        else: box(d, x + 270, yy + 220, x + 340, yy + 288, shadow=False); icon_c(im, '加號', x + 305, yy + 254, 3, True)                         # 排進去
    return im

if __name__ == '__main__' and len(sys.argv) > 2:
    a = one_page(); out = Image.new('RGBA', (a.width + 40, a.height + 80), (38, 40, 56, 255)); d = ImageDraw.Draw(out)
    text(d, 20, 16, '任務（一頁：上面排程、下面挑任務）', 12, (240, 230, 200)); out.alpha_composite(a, (20, 64))
    out.convert('RGB').resize((out.width // 2, out.height // 2), Image.LANCZOS).save(sys.argv[2])
