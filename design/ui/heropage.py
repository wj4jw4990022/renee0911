# 勇者檔案新版草圖（狀態、個性、生平、寶物）
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw
from style import *
from shop import L
import people, quest, office, settings

NEW = {
 '心願': grid(['...Y...', '..YYY..', 'YYYWYYY', '.YYYYY.', '..Y.Y..', '.Y...Y.']),
 '個性': grid(['...VVV...', '..VVVVV..', '.VVvVvVV.', '.VVVVVVV.', '..VvvvV..', '...VVV...']),
 '生平': grid(['NNNNN.NNNNN', 'NLLLLnLLLLN', 'NLKKLnLKKLN', 'NLLLLnLLLLN', 'NLKKLnLKKLN', 'NLLLLnLLLLN', 'NNNNNnNNNNN']),   # 打開的書
 '經驗': grid(['..G..', '.GGG.', 'GGGGG', '.GGG.', '..G..']),
 '年齡': grid(['.YYYYY.', 'Y.YYY.Y', 'YYYYYYY', 'NNNNNNN', 'NLLLLLN', 'NNNNNNN']),
}
for k, v in NEW.items(): ICON[k] = outline(v)
HERO = Image.open(TD + '08_02.png').convert('RGBA')

def head(sel):
    W, H = 780, 1900; im = Image.new('RGBA', (W, H), PAPER + (255,)); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 86], fill=WOOD); d.rectangle([0, 82, W, 86], fill=WOOD2); text_c(d, 24, 43, '小蓮', 24, (250, 240, 214))
    box(d, W - 92, 12, W - 28, 72); d.line([(W - 74, 28), (W - 46, 56)], fill=O[:3], width=5); d.line([(W - 74, 56), (W - 46, 28)], fill=O[:3], width=5)
    # 勇者卡：大頭像、名字＋錢包、職業／等級／年紀（圖示）、標籤、經驗
    d.rectangle([0, 86, W, 380], fill=(214, 232, 244))
    im.alpha_composite(HERO.resize((176, 176), Image.NEAREST), (30, 110))
    text_c(d, 230, 140, '小蓮', 24); iw = icon_c(im, '金幣', 560, 140, 3); text_c(d, 560 + iw + 8, 140, '30', 24)   # 錢包餘額在名字右邊
    iw = icon_c(im, '戰力', 230, 210, 3); text_c(d, 230 + iw + 8, 210, '戰士', 16); text_c(d, 400, 210, 'Lv1', 16); text_c(d, 500, 210, '18 歲', 16)
    x = 230
    for t, c in (('好奇', (234, 165, 108)), ('謹慎', (234, 165, 108)), ('精緻窮族', (37, 149, 106))):
        w = d.textlength(t, font=FS[12]) + 24; box(d, x, 250, x + w, 298, shadow=False, border=c); text_c(d, x + w / 2, 274, t, 12, c, True); x += w + 12
    iw = icon_c(im, '經驗', 230, 336, 3); d.rectangle([230 + iw + 10, 324, 620, 348], fill=(230, 220, 195), outline=O[:3], width=3); text_c(d, 640, 336, '0/15', 12, MUTED)
    # 四格數值（圖示＋數字）
    for k, (n, v, c) in enumerate((('體力', '80', (37, 149, 106)), ('心情', '65', (214, 150, 40)), ('壓力', '15', RED), ('信任', '55', (40, 96, 160)))):
        x = 24 + k * 184; box(d, x, 408, x + 168, 488); iw = icon_c(im, n, x + 18, 448, 4); text_c(d, x + 18 + iw + 10, 448, v, 24, c)
    for i, (n, lab) in enumerate((('心情', '狀態'), ('個性', '個性'), ('生平', '生平'), ('寶物', '寶物'))):
        x = 24 + i * 184; box(d, x, 514, x + 168, 622, fill=GREEN if i == sel else PAPER); icon_c(im, n, x + 84, 554, 3, True); text_c(d, x + 84, 598, lab, 12, TXT, True)
    return im, d

def p_status():
    im, d = head(0); y = 650
    box(d, 24, y, 756, y + 100); icon_c(im, '心願', L, y + 50, 4); text_c(d, L + 70, y + 50, '沒有特別的心願', 16, MUTED)
    y += 128; box(d, 24, y, 756, y + 190); icon_c(im, '生平', L, y + 44, 3); text_c(d, L + 60, y + 44, '人生目標', 16, MUTED)
    text_c(d, L, y + 100, '精緻窮族', 24); text_c(d, L, y + 152, '買不起未來，就買現在的快樂', 12, MUTED)
    y += 218; box(d, 24, y, 756, y + 100); icon_c(im, '人際', L, y + 50, 4); text_c(d, L + 70, y + 50, '看她現在的樣子', 16); d.polygon([(706, y + 34), (726, y + 50), (706, y + 66)], fill=MUTED)
    return im

def p_person():
    im, d = head(1); y = 650
    box(d, 24, y, 756, y + 360)   # 六角形：個性 6 項，看出來的才有數字
    cx, cy, r = 220, y + 180, 130; pts = [(cx + r * math.cos(math.pi / 2 + k * math.pi / 3), cy - r * math.sin(math.pi / 2 + k * math.pi / 3)) for k in range(6)]
    d.polygon(pts, outline=MUTED, width=3); d.polygon([(cx + (px - cx) * .4, cy + (py - cy) * .4) for px, py in pts], fill=(247, 201, 74), outline=(214, 150, 40), width=3)
    for px, py in pts: text_c(d, cx + (px - cx) * 1.25, cy + (py - cy) * 1.25, '?', 16, MUTED, True)
    iw = icon_c(im, '時間', 430, y + 150, 3); text_c(d, 430 + iw + 10, y + 150, '相處 0 月', 16); text_c(d, 430, y + 210, '越相處，看得越清楚', 12, MUTED)
    y += 388; box(d, 24, y, 756, y + 240)   # 天賦格：沒看出來的是鎖＋還要幾月
    for k in range(6):
        x = L + (k % 3) * 230; yy = y + 30 + (k // 3) * 100; box(d, x, yy, x + 200, yy + 80, shadow=False, fill=PAPER2)
        icon_c(im, '鎖', x + 50, yy + 40, 3, True); iw = icon_c(im, '時間', x + 90, yy + 40, 2); text_c(d, x + 90 + iw + 6, yy + 40, '30月', 12, MUTED)
    y += 268; box(d, 24, y, 756, y + 300); icon_c(im, '心情', L, y + 44, 3); text_c(d, L + 60, y + 44, '最在乎的事', 16)
    for k, m in enumerate((8, 25, 45)):
        cy2 = y + 110 + k * 70; text_c(d, L, cy2, f'{k + 1}', 24, MUTED); icon_c(im, '鎖', L + 60, cy2, 3); iw = icon_c(im, '時間', L + 120, cy2, 2); text_c(d, L + 120 + iw + 6, cy2, f'{m}月', 12, MUTED)
    return im

def p_life():
    im, d = head(2); y = 650
    for k, (n, lab, on) in enumerate((('排程', '年表', 1), ('心情', '回憶', 0), ('危險', '遺憾', 0), ('金幣', '自己買', 0))):   # 「他自己買的」搬到這裡
        x = 24 + k * 184; box(d, x, y, x + 168, y + 80, fill=GREEN if on else PAPER); iw = icon_c(im, n, x + 16, y + 40, 3); text_c(d, x + 16 + iw + 8, y + 40, lab, 12)
    y += 108; box(d, 24, y, 756, y + 170)   # 一生的進度條
    text_c(d, L, y + 44, '18 歲 → 50 歲', 16); d.rectangle([L, y + 84, 736, y + 108], fill=(230, 220, 195), outline=O[:3], width=3); d.rectangle([L + 3, y + 87, L + 40, y + 105], fill=GOLD)
    for k, (n, v) in enumerate((('心情', '40'), ('心願', '0'), ('危險', '1'))): x = L + k * 230; iw = icon_c(im, n, x, y + 140, 3); text_c(d, x + iw + 8, y + 140, v, 16)
    y += 198
    for k, (n, on) in enumerate((('全', 1), ('名聲', 0), ('生病', 0), ('戀人', 0), ('金幣', 0))):   # 篩選：全部、榮耀、受傷、感情、收穫
        x = 24 + k * 148; box(d, x, y, x + 132, y + 72, fill=GREEN if on else PAPER)
        if n == '全': text_c(d, x + 66, y + 36, '全', 16, TXT, True)
        else: icon_c(im, n, x + 66, y + 36, 3, True)
    y += 100; text_c(d, 30, y + 30, '還沒有值得記下的事', 16, MUTED)
    return im

def p_treasure():
    im, d = head(3); y = 650
    import shop, wild; WI = wild.items()
    # 身上：武器、防具（現在穿的）＋寶物 3 格（標題＋每格下面小字）
    box(d, 24, y, 756, y + 270); text_c(d, L, y + 36, '身上', 16)
    slots = [(kt('08_07'), '木匕首'), (shop.ARMOR['布衣'], '布衣')]
    for k, (ic, nm) in enumerate(slots):
        x = L + k * 150; box(d, x, y + 70, x + 130, y + 190, shadow=False, fill=PAPER2); icon_c(im, ic, x + 65, y + 130, 5, True); text_c(d, x + 65, y + 222, nm, 12, TXT, True)
    d.line([(L + 300, y + 70), (L + 300, y + 230)], fill=(214, 190, 150), width=3)
    for k in range(3):
        x = L + 324 + k * 130; d.rectangle([x, y + 70, x + 112, y + 190], outline=(176, 138, 85), width=3)
        g = ICON['寶物'].convert('LA').convert('RGBA'); g.putalpha(g.getchannel('A').point(lambda v: v * 45 // 100)); icon_c(im, g, x + 56, y + 130, 3, True)   # 空格：淡灰寶箱
    text_c(d, L + 324 + 186, y + 222, '寶物 0 / 3', 12, MUTED, True)
    y += 298; box(d, 24, y, 756, y + 110)   # 戰力
    iw = icon_c(im, '戰力', L, y + 55, 4); text_c(d, L + iw + 12, y + 55, '戰力', 16); text_c(d, L + iw + 100, y + 55, '11', 24)
    y += 138; box(d, 24, y, 756, y + 300); text_c(d, L, y + 36, '各區危險（照現在的戰力）', 16)
    for k, (ic, nm, dg, word, col) in enumerate(((WI['bush'], '草原', 0, '安全', (37, 149, 106)), (WI['tree'], '森林', 3, '九死一生', RED), (WI['cactus'], '荒地', 3, '九死一生', RED))):
        cy = y + 100 + k * 70; icon_c(im, ic, L + 20, cy, 2, True); text_c(d, L + 60, cy, nm, 16)
        sx = L + 180
        gs = ICON['危險'].convert('LA').convert('RGBA'); gs.putalpha(gs.getchannel('A').point(lambda v: v * 35 // 100))
        for j in range(3): sx += icon_c(im, '危險' if j < dg else gs, sx, cy, 3) + 4   # 沒到的骷髏淡灰
        text_c(d, L + 330, cy, word, 16, col)
    text_c(d, 30, y + 330, '越危險的地方，越容易撿到寶物', 12, MUTED)
    return im

if __name__ == '__main__':
    ps = [p_status(), p_person(), p_life(), p_treasure()]; W = ps[0].width; Hh = 1700
    out = Image.new('RGBA', (W * 4 + 100, Hh + 80), (38, 40, 56, 255)); d = ImageDraw.Draw(out)
    for i, (p, t) in enumerate(zip(ps, ('狀態', '個性', '生平', '寶物'))): text(d, 20 + i * (W + 20), 16, t, 12, (240, 230, 200)); out.alpha_composite(p.crop((0, 0, W, Hh)), (20 + i * (W + 20), 64))
    out.convert('RGB').resize((out.width // 2, out.height // 2), Image.LANCZOS).save(sys.argv[1])
