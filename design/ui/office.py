# 事務所面板新版草圖（概況、競爭、設施）
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw
from style import *
from shop import phone, L, price_btn
import people, quest

NEW = {
 '口碑': grid(['.....S...', '....SS...', '....SS...', '...SSS...', 'BB.SSSSSS', 'BBSSSSSSs', 'BBSSSSSSs', 'BBSSSSSs.', 'BB.ssss..']),   # 豎大拇指＋藍袖口
 '代表作': grid(['YYYYYYY', 'YWYYYYy', '.YYYYy.', '..YYy..', '...Y...', '..yyy..', '.NNNNN.']),
 '打叉': grid(['RR...RR', '.RR.RR.', '..RRR..', '.RR.RR.', 'RR...RR']),
 '盯動向': grid(['..KKKKK..', '.KWWWWWK.', 'KWWBBBWWk', 'KWBDDBBWk', 'KWWBBBWWk', '.kWWWWWk.', '..kkkkk..']),
 '挖客戶': grid(['..S.S.S..', '..S.S.S..', 'S.SSSSS..', 'SSSSSSS..', '.SSSSSS..', '..SSSS...', '..BBBB...']),
 '爆料': grid(['......R', '....RRR', 'KKRRRRR', 'KKRRRRR', '....RRR', '......R', '.......']),
 '醫務室': grid(['.WWWWW.', 'WWWRWWW', 'WWWRWWW', 'WRRRRRW', 'WWWRWWW', 'WWWRWWW', '.WWWWW.']),
 '訓練室': grid(['KK.....KK', 'KK.....KK', 'KKKKKKKKK', 'KK.....KK', 'KK.....KK']),
 '情報站': grid(['.KKK.KKK.', 'KBWBKBWBK', 'KBBBKBBBK', '.KKK.KKK.']),
 '金牌': grid(['R...B', 'RR.BB', '.RBB.', '.YYY.', 'YYWYY', 'YYYYy', 'YYYYy', '.yyy.']),
 '銀牌': grid(['R...B', 'RR.BB', '.RBB.', '.KKK.', 'KKWKK', 'KKKKk', 'KKKKk', '.kkk.']),
 '銅牌': grid(['R...B', 'RR.BB', '.RBB.', '.NNN.', 'NNWNN', 'NNNNn', 'NNNNn', '.nnn.']),
}
for k, v in NEW.items(): ICON[k] = outline(v)
ICON['酒窖'] = kt('06_10')
OFFICE = Image.open(os.path.dirname(os.path.abspath(__file__)) + '/office_1.png').convert('RGBA')

def otabs(im, d, y, sel):
    for i, (n, lab) in enumerate((('事務所', '概況'), ('人際', '旗下'), ('對手', '競爭'), ('設定', '設施'))):
        x = 24 + i * 184; box(d, x, y, x + 168, y + 108, fill=GREEN if i == sel else PAPER)
        icon_c(im, n, x + 84, y + 40, 3, True); text_c(d, x + 84, y + 84, lab, 12, TXT, True)

def bar(d, x, y, w, h, frac, col, bg=(230, 220, 195)):
    d.rectangle([x, y, x + w, y + h], fill=bg, outline=O[:3], width=3); d.rectangle([x + 3, y + 3, x + 3 + (w - 6) * frac, y + h - 3], fill=col)

def overview():
    im, d = phone('事務所', '事務所'); otabs(im, d, 220, 0)
    y = 356; box(d, 24, y, 756, y + 300)
    text_c(d, L, y + 50, '無名小事務所', 24); text_c(d, L, y + 100, '1 / 15', 16, MUTED)
    bar(d, L + 120, y + 86, 560, 28, 1 / 15, GOLD)
    text_c(d, L, y + 170, '升格', 16)   # 升格條件：圖示＋進度，沒達到打叉、達到打勾
    for k, (n, v, ok) in enumerate((('名聲', '0/60', 0), ('代表作', '0/0', 1))):
        x = L + 110 + k * 260; iw = icon_c(im, n, x, y + 170, 3); text_c(d, x + iw + 8, y + 170, v, 16); icon_c(im, '打勾' if ok else '打叉', x + iw + 120, y + 170, 3)
    iw = icon_c(im, '上升', L, y + 240, 3); text_c(d, L + iw + 10, y + 240, '可以簽公會合約', 16, (37, 149, 106))
    y = 690   # 四格數字
    for k, (n, v, c) in enumerate((('金幣', '500', TXT), ('名聲', '0', TXT), ('口碑', '60', TXT), ('下降', '10/月', RED))):
        x = 24 + (k % 2) * 376; yy = y + (k // 2) * 96; box(d, x, yy, x + 356, yy + 76); iw = icon_c(im, n, x + 16, yy + 38, 4); text_c(d, x + 16 + iw + 12, yy + 38, v, 24, c)
    y = 900; box(d, 24, y, 756, y + 150)   # 口碑條：惡名 ← → 良心
    iw = icon_c(im, '口碑', L, y + 40, 3); text_c(d, L + iw + 10, y + 40, '60 / 100', 16)
    icon_c(im, '危險', L, y + 104, 3)
    CELLS = [(232, 69, 55), (236, 100, 60), (240, 135, 65), (245, 170, 70), (247, 201, 74), (215, 210, 90), (170, 210, 110), (130, 210, 130), (111, 207, 151), (67, 190, 120)]
    for i, c in enumerate(CELLS): x0 = L + 50 + i * 56; d.rectangle([x0, y + 88, x0 + 52, y + 120], fill=c, outline=O[:3], width=3)
    d.polygon([(L + 50 + 6 * 56 - 2, y + 82), (L + 50 + 6 * 56 - 12, y + 68), (L + 50 + 6 * 56 + 8, y + 68)], fill=O[:3])
    icon_c(im, '心情', L + 630, y + 104, 3)
    y = 1080; box(d, 24, y, 756, y + 290)   # 收支：近 6 個月「賺 − 花」，上面數字、下面月份
    iw = icon_c(im, '金幣', L, y + 40, 3); text_c(d, L + iw + 10, y + 40, '每月淨賺', 16)
    for k, (c, t) in enumerate(((GREEN, '賺'), (RED, '賠'))): bx = 520 + k * 110; d.rectangle([bx, y + 28, bx + 24, y + 52], fill=c, outline=O[:3], width=2); text_c(d, bx + 34, y + 40, t, 12)
    base = y + 180
    for k, (v, m) in enumerate(((30, 6), (-10, 7), (50, 8), (80, 9), (-20, 10), (60, 11))):
        x = L + 40 + k * 108; h = abs(v) * .9
        d.rectangle([x, base - h if v > 0 else base, x + 64, base if v > 0 else base + h], fill=GREEN if v > 0 else RED, outline=O[:3], width=2)
        text_c(d, x + 32, (base - h - 22) if v > 0 else (base + h + 20), f'{v:+d}', 12, (37, 149, 106) if v > 0 else RED, True)
        text_c(d, x + 32, y + 256, f'{m}月', 12, MUTED, True)
    d.line([(L + 20, base), (L + 680, base)], fill=O[:3], width=3)
    return im

def compete():
    im, d = phone('事務所', '事務所'); otabs(im, d, 220, 2)
    y = 356; box(d, 24, y, 756, y + 150, fill=(214, 240, 214))   # 自己的名次（線上排名開放前：預設 100 家事務所）
    text_c(d, L, y + 46, '你的事務所', 16); w = text_c(d, L, y + 104, '第 37 名', 24, (37, 149, 106)); text_c(d, L + w + 12, y + 108, '/ 100', 16, MUTED)
    iw = icon_c(im, '名聲', 540, y + 104, 4); text_c(d, 540 + iw + 12, y + 104, '12', 24)
    rows = [(1, '金獅事務所', 980, 0), (2, '銀月經紀社', 870, 0), (3, '北境傭兵團', 760, 0), None, (36, '小橋事務所', 13, 0), (37, '你的事務所', 12, 1), (38, '藍鵲工作室', 11, 0)]
    y = 540; box(d, 24, y, 756, y + 40 + 76 * len(rows))   # 前三名＋我前後各一名
    for k, r in enumerate(rows):
        cy = y + 56 + k * 76
        if r is None:
            for j in range(3): d.rectangle([380 + j * 24, cy - 4, 388 + j * 24, cy + 4], fill=MUTED)
            continue
        rk, nm, v, me = r; c = (37, 149, 106) if me else TXT
        if me: d.rectangle([30, cy - 32, 750, cy + 32], fill=(214, 240, 214))
        text_c(d, L, cy, f'第 {rk} 名', 16, c); text_c(d, L + 170, cy, nm, 16, c); iw = icon_c(im, '名聲', 560, cy, 3); text_c(d, 560 + iw + 10, cy, str(v), 24)
    return im

def facility():
    im, d = phone('事務所', '事務所'); otabs(im, d, 220, 3)
    rows = [('醫務室', [('休息', '-1月')], 800), ('訓練室', [('上升', '+12%')], 700), ('休息室', [('壓力', '-4')], 600), ('情報站', [('任務', '+1')], 900), ('酒窖', [('心情', '+40%')], 500)]
    y = 356
    for n, eff, p in rows:
        box(d, 24, y, 756, y + 150); icon_c(im, n if n != '休息室' else '休息', L + 30, y + 75, 5 if n != '酒窖' else 4, True)
        text_c(d, L + 96, y + 44, n, 16)
        for k in range(3): d.rectangle([L + 260 + k * 34, y + 32, L + 284 + k * 34, y + 56], fill=(220, 205, 175), outline=O[:3], width=2)   # 等級 0/3
        x = L + 96
        for e, v in eff: iw = icon_c(im, e, x, y + 108, 3); text_c(d, x + iw + 8, y + 108, v, 24, (37, 149, 106))
        price_btn(im, d, 756 - 20 - 210, y + 75, str(p))
        y += 174
    return im

if __name__ == '__main__':
    ps = [overview(), compete(), facility()]; W = ps[0].width
    out = Image.new('RGBA', (W * 3 + 80, ps[0].height + 80), (38, 40, 56, 255)); d = ImageDraw.Draw(out)
    for i, (p, t) in enumerate(zip(ps, ('概況', '競爭', '設施'))): text(d, 20 + i * (W + 20), 16, t, 12, (240, 230, 200)); out.alpha_composite(p, (20 + i * (W + 20), 64))
    out.convert('RGB').resize((out.width // 2, out.height // 2), Image.LANCZOS).save(sys.argv[1])
