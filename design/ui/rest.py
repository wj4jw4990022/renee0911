# 剩下的舊樣式分頁草圖：人際（事務所、歷代、近況）、事務所（旗下、競爭下方）、勇者檔案生平（回憶、遺憾）
# 用法：python3 rest.py 草圖_人際分頁.png 草圖_旗下與生平.png
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw
import sendoff, mainscreen, heropage, office, people, quest   # 粉圓字型、圖示
from style import *
from sendoff import FS, face, OKD, ORANGE
W = 780
PURP = (106, 79, 176)

def ph(h=1500):
    im = Image.new('RGBA', (W, h), PAPER2 + (255,)); return im, ImageDraw.Draw(im)
def chip(im, d, x, cy, t, fill, col, size=12):
    tw = d.textbbox((0, 0), t, font=FS[size], stroke_width=1)[2]; box(d, x, cy - 22, x + tw + 28, cy + 22, fill=fill, shadow=False); text_c(d, x + 14, cy, t, size, col); return tw + 28
def lvl(d, x, cy, n, tot=3, col=RED):
    for k in range(tot): d.rectangle([x + k * 30, cy - 9, x + k * 30 + 24, cy + 9], fill=col if k < n else (220, 205, 175), outline=O[:3], width=2)
def sec(d, y, t, right=None):
    text_c(d, 30, y, t, 16, MUTED)
def crop(im, y): return im.crop((0, 0, W, y + 30))

# ---------- 人際・事務所：旗下藝人之間的交情 ----------
def rel_page():
    im, d = ph(); y = 20; sec(d, y + 10, '勇者之間的交情')
    pairs = [('07_01', '小花', '07_03', '小虎', 'mentor', 62), ('07_01', '小花', '07_02', '阿月', 'rival', -35), ('07_03', '小虎', '07_02', '阿月', None, 12)]
    y += 44
    for fa, na, fb, nb, t, v in pairs:
        box(d, 24, y, 756, y + 150)
        face(im, fa, 44, y + 20, 4, (240, 150, 110)); text_c(d, 44 + 32, y + 112, na, 12, TXT, True)
        face(im, fb, 220, y + 20, 4, (205, 190, 160)); text_c(d, 220 + 32, y + 112, nb, 12, TXT, True)
        ic = '幫忙' if t == 'mentor' else '對手' if t == 'rival' else '空心'; icon_c(im, ic, 164, y + 54, 4, True)
        lab = {'mentor': '師徒', 'rival': '競爭對手', None: '普通'}[t]; text_c(d, 330, y + 40, lab, 16, OKD if v >= 30 else RED if v <= -30 else TXT)
        # 交情：中間為 0 的長條（左紅右綠）
        bx0, bx1, cy = 330, 560, y + 96; d.rectangle([bx0, cy - 10, bx1, cy + 10], fill=(230, 220, 195), outline=O[:3], width=3); mid = (bx0 + bx1) // 2
        if v >= 0: d.rectangle([mid, cy - 7, mid + int((bx1 - mid - 3) * v / 100), cy + 7], fill=GREEN)
        else: d.rectangle([mid + int((mid - bx0 - 3) * v / 100), cy - 7, mid, cy + 7], fill=RED)
        d.line([(mid, cy - 14), (mid, cy + 14)], fill=O[:3], width=2); text_c(d, 580, cy, str(v), 16, MUTED)
        if v < 0: box(d, 640, y + 46, 736, y + 104, fill=PAPER, border=GOLD, shadow=False); icon_c(im, '說話', 688, y + 75, 3, True)   # 調解
        y += 176
    text_c(d, 30, y + 6, '一起出任務會拉近距離；調解用「談談」（和主力共用時間）', 12, MUTED)
    return crop(im, y + 20)

# ---------- 人際・歷代：一代一張卡，中間寫怎麼接班 ----------
def wall_page():
    im, d = ph(); y = 20
    gens = [('07_04', '阿傑', '戰死', RED, (248, 214, 207), '第 1 代・戰士・Lv9・31 歲', 45, '在荒地被木乃伊圍攻，沒有等到救援'),
            ('07_01', '小花', '安穩退休', OKD, (214, 240, 214), '第 2 代・盜賊・Lv14・46 歲', 82, '帶出了徒弟小虎，留在村子裡生活')]
    links = ['阿傑的徒弟', '小花的徒弟']
    for i, (fc, nm, end, ec, eb, info, hp, why) in enumerate(gens):
        box(d, 24, y, 756, y + 210)
        face(im, fc, 44, y + 24, 5, (205, 190, 160)); text_c(d, 150, y + 42, nm, 24); chip(im, d, 150 + 110, y + 42, end, eb, ec, 12)
        text_c(d, 150, y + 92, info, 12, MUTED)
        iw = icon_c(im, '心情', 150, y + 136, 3); text_c(d, 150 + iw + 8, y + 136, f'幸福 {hp}', 16, OKD if hp >= 70 else ORANGE)
        text_c(d, 44, y + 182, why, 12)
        y += 210
        d.line([(110, y + 6), (110, y + 50)], fill=O[:3], width=4); text_c(d, 130, y + 28, links[i], 12, PURP)   # 接班的線
        y += 56
    box(d, 24, y, 756, y + 120, fill=(255, 236, 170)); face(im, '07_03', 44, y + 22, 5, (240, 150, 110)); text_c(d, 150, y + 40, '小虎', 24); chip(im, d, 260, y + 40, '現在', GOLD, TXT, 12); text_c(d, 150, y + 90, '第 3 代・盜賊・Lv4・21 歲', 12, MUTED)
    return crop(im, y + 120)

# ---------- 人際・近況：村子裡的消息 ----------
def news_page():
    im, d = ph(); y = 20; sec(d, y + 10, '村子近況'); y += 44
    items = [('近況', '第 16 年勇者大賞揭曉', '2 月前'), ('對手', '金獅事務所的雷恩打倒了沙漠巨蟲', '4 月前'), ('打勾', '小雯的病好了', '6 月前'), ('驚嘆', '酒館老闆娘阿桃生病了', '9 月前'), ('心情', '小豆和麵包店的小麥開始交往', '12 月前')]
    box(d, 24, y, 756, y + 88 * len(items) + 12)
    for k, (ic, t, ago) in enumerate(items):
        cy = y + 50 + k * 88; icon_c(im, ic, 46, cy, 3); text_c(d, 100, cy, t, 16); b = d.textbbox((0, 0), ago, font=FS[12], stroke_width=1); text_c(d, 734 - (b[2] - b[0]), cy, ago, 12, MUTED)
        if k < len(items) - 1: d.line([(46, cy + 44), (734, cy + 44)], fill=(220, 200, 165), width=2)
    return crop(im, y + 88 * len(items) + 12)

# ---------- 事務所・旗下 ----------
def artists_page():
    im, d = ph(1700); y = 20
    sec(d, y + 10, '旗下藝人'); x = 200
    for k in range(3):   # 名額三格：有人＝人像、空的＝加號、還沒開放＝鎖
        box(d, x + k * 84, y - 14, x + k * 84 + 68, y + 38, fill=(214, 240, 214) if k < 2 else (215, 205, 185), shadow=False); icon_c(im, '人際' if k < 2 else '鎖', x + k * 84 + 34, y + 12, 3, True)
    iw = icon_c(im, '下降', 470, y + 12, 3); text_c(d, 470 + iw + 8, y + 12, '25/月・每位', 12, RED); y += 64
    # 收起來的卡
    def card(y, fc, nm, st, stc, stb, job, pol, mood, stress, trust, msg):
        box(d, 24, y, 756, y + 200)
        face(im, fc, 44, y + 22, 5, (205, 190, 160)); d.ellipse([110, y + 22, 128, y + 40], fill=stc, outline=O[:3], width=2)
        text_c(d, 150, y + 40, nm, 24); chip(im, d, 260, y + 40, st, stb, stc if stc != GOLD else TXT, 12)
        iw = icon_c(im, '戰力', 150, y + 88, 2); text_c(d, 150 + iw + 6, y + 88, job, 12, MUTED); chip(im, d, 420, y + 88, pol, (232, 222, 246), PURP, 12)
        x = 150
        for ic, v, c in (('心情', mood, GREEN), ('壓力', stress, RED), ('信任', trust, (89, 168, 255))):
            iw = icon_c(im, ic, x, y + 134, 2); d.rectangle([x + iw + 6, y + 126, x + iw + 106, y + 142], fill=(230, 220, 195), outline=O[:3], width=2); d.rectangle([x + iw + 9, y + 129, x + iw + 9 + int(94 * v / 100), y + 139], fill=c); x += iw + 130
        text_c(d, 44, y + 178, msg, 12, MUTED); icon_c(im, '往上', 720, y + 40, 3, True) if False else None
        return y + 226
    y = card(y, '07_02', '阿月', '心情不錯', OKD, (214, 240, 214), '弓手 Lv7', '穩定賺錢', 72, 30, 64, '這個月：在草原打了 12 隻哥布林，賺 180 金')
    # 展開的卡：三個圖示分頁＋「安排」
    box(d, 24, y, 756, y + 860)
    face(im, '07_03', 44, y + 22, 5, (205, 190, 160)); d.ellipse([110, y + 22, 128, y + 40], fill=GOLD, outline=O[:3], width=2)
    text_c(d, 150, y + 40, '小虎', 24); chip(im, d, 260, y + 40, '有點累', (255, 236, 170), (150, 100, 10), 12)
    iw = icon_c(im, '戰力', 150, y + 88, 2); text_c(d, 150 + iw + 6, y + 88, '盜賊 Lv4', 12, MUTED); chip(im, d, 420, y + 88, '衝名聲', (232, 222, 246), PURP, 12)
    yy = y + 130
    for k, (ic, lab) in enumerate((('心情', '狀況'), ('排程', '安排'), ('事務所', '人事'))):
        bx = 44 + k * 136; box(d, bx, yy, bx + 120, yy + 96, fill=GREEN if k == 1 else PAPER, shadow=False); icon_c(im, ic, bx + 60, yy + 34, 3, True); text_c(d, bx + 60, yy + 74, lab, 12, TXT, True)
    yy += 130; text_c(d, 44, yy, '方針', 16, MUTED); yy += 40
    for k, (ic, lab) in enumerate((('金幣', '穩定賺錢'), ('名聲', '衝名聲'), ('休息', '休養'), ('一起出任務', '跟著主力'))):
        bx = 44 + k * 172; box(d, bx, yy, bx + 156, yy + 96, fill=GREEN if k == 1 else PAPER, shadow=False); icon_c(im, ic, bx + 78, yy + 34, 3, True); text_c(d, bx + 78, yy + 74, lab, 12, TXT, True)
    yy += 140; text_c(d, 44, yy, '抽成', 16, MUTED)
    box(d, 160, yy - 30, 220, yy + 30, shadow=False); text_c(d, 190, yy, '−', 24, TXT, True); text_c(d, 280, yy, '30%', 24, TXT, True); box(d, 340, yy - 30, 400, yy + 30, shadow=False); text_c(d, 370, yy, '＋', 24, TXT, True); text_c(d, 430, yy, '還算合理', 12, MUTED)
    yy += 70; text_c(d, 44, yy, '互動（和主力共用時間）', 16, MUTED); yy += 40
    for k, (ic, lab, note) in enumerate((('上升', '打氣', ''), ('金幣', '請吃飯', '30 金'), ('說話', '談談', '還要 2 月'))):
        bx = 44 + k * 232; g = note.startswith('還要'); box(d, bx, yy, bx + 212, yy + 96, fill=(215, 205, 185) if g else PAPER, border=(150, 140, 130) if g else O[:3], shadow=False)
        icon_c(im, ic, bx + 40, yy + 48, 3, True); text_c(d, bx + 76, yy + 34, lab, 16, (150, 140, 130) if g else TXT); text_c(d, bx + 76, yy + 70, note, 12, MUTED) if note else None
    yy += 136; text_c(d, 44, yy, '指派事務所任務', 16, MUTED); yy += 36
    box(d, 44, yy, 736, yy + 100, shadow=False); icon_c(im, '事務所', 66, yy + 50, 3); text_c(d, 120, yy + 32, '粉絲見面會', 16); iw = icon_c(im, '名聲', 120, yy + 72, 2); text_c(d, 120 + iw + 6, yy + 72, '+6', 12); icon_c(im, '加號', 700, yy + 50, 3, True)
    return crop(im, y + 860)

# ---------- 事務所・競爭（下方）：接下來＋比賽紀錄 ----------
def comp_page():
    im, d = ph(); y = 20; sec(d, y + 10, '接下來'); y += 40
    for k, (ic, n, m, note) in enumerate((('對手', '武鬥大會報名', '3 月', 'Lv3 以上'), ('對手', '武鬥大會', '5 月', '要先報名'), ('代表作', '年度勇者大賞', '7 月', '地方階段才入圍'))):
        x = 24 + k * 248; box(d, x, y, x + 228, y + 200)
        icon_c(im, ic, x + 114, y + 40, 4, True); text_c(d, x + 114, y + 92, n, 12, TXT, True)
        iw = icon_c(im, '時間', 0, -100, 3); b = d.textbbox((0, 0), m, font=FS[24], stroke_width=1); xx = x + 114 - (iw + 8 + b[2] - b[0]) // 2; icon_c(im, '時間', xx, y + 136, 3); text_c(d, xx + iw + 8, y + 136, m, 24)
        text_c(d, x + 114, y + 178, note, 12, MUTED, True)
    y += 230
    for k, (ic, v, n) in enumerate((('金牌', '0', '武鬥大會冠軍'), ('代表作', '0', '大賞得獎'))):
        x = 24 + k * 372; box(d, x, y, x + 352, y + 76); ic_ = ic if ic in ICON else '名聲'; iw = icon_c(im, ic_, x + 18, y + 38, 3); text_c(d, x + 18 + iw + 10, y + 38, v, 24); text_c(d, x + 120, y + 38, n, 12, MUTED)
    y += 110; sec(d, y, '比賽紀錄'); y += 34
    recs = [('對手', '第 12 年武鬥大會', '8 強'), ('代表作', '第 15 年勇者大賞', '入圍')]
    box(d, 24, y, 756, y + 80 * len(recs) + 12)
    for k, (ic, n, r) in enumerate(recs):
        cy = y + 46 + k * 80; icon_c(im, ic, 46, cy, 3); text_c(d, 100, cy, n, 16); chip(im, d, 600, cy, r, (232, 222, 246), PURP, 12)
    return crop(im, y + 80 * len(recs) + 12)

# ---------- 勇者檔案・生平・回憶 ----------
def mem_page():
    im, d = ph(); y = 20
    for k, (ic, lab) in enumerate((('時間', '年表'), ('心情', '回憶'), ('空心', '遺憾'), ('金幣', '自己買'))):
        bx = 24 + k * 186; box(d, bx, y, bx + 170, y + 64, fill=GREEN if k == 1 else PAPER, shadow=False); iw = icon_c(im, ic, bx + 18, y + 32, 3); text_c(d, bx + 18 + iw + 8, y + 32, lab, 12)
    y += 90; text_c(d, 30, y + 10, '他記得的事會影響他怎麼看你', 12, MUTED); y += 44
    groups = [('信任', '感激你的事', OKD, [('你在醜聞時力挺他', '17 歲'), ('你花大錢請神官救回他', '20 歲')]), ('壓力', '心裡的結', RED, [('你叫他現在不能回家', '19 歲')]), ('生平', '人生的記憶', PURP, [('第一次打倒哥布林王', '18 歲')])]
    for ic, n, c, its in groups:
        iw = icon_c(im, ic, 30, y + 20, 3); text_c(d, 30 + iw + 10, y + 20, f'{n}', 16, c); text_c(d, 30 + iw + 10 + d.textbbox((0, 0), n, font=FS[16], stroke_width=1)[2] + 14, y + 20, f'×{len(its)}', 16, MUTED); y += 48
        box(d, 24, y, 756, y + 72 * len(its) + 12)
        for k, (t, a) in enumerate(its): cy = y + 42 + k * 72; text_c(d, 46, cy, t, 16); b = d.textbbox((0, 0), a, font=FS[12], stroke_width=1); text_c(d, 734 - (b[2] - b[0]), cy, a, 12, MUTED)
        y += 72 * len(its) + 40
    return crop(im, y - 20)

# ---------- 勇者檔案・生平・遺憾 ----------
def regret_page():
    im, d = ph(1700); y = 20
    for k, (ic, lab) in enumerate((('時間', '年表'), ('心情', '回憶'), ('空心', '遺憾'), ('金幣', '自己買'))):
        bx = 24 + k * 186; box(d, bx, y, bx + 170, y + 64, fill=GREEN if k == 2 else PAPER, shadow=False); iw = icon_c(im, ic, bx + 18, y + 32, 3); text_c(d, bx + 18 + iw + 8, y + 32, lab, 12)
    y += 96; box(d, 24, y, 756, y + 150)
    iw = icon_c(im, '心情', 50, y + 60, 5); text_c(d, 50 + iw + 16, y + 60, '40', 24, ORANGE); text_c(d, 220, y + 60, '如果現在結束，他的幸福感', 12, MUTED)
    d.rectangle([50, y + 104, 730, y + 126], fill=(230, 220, 195), outline=O[:3], width=3); d.rectangle([53, y + 107, 53 + int(674 * .4), y + 123], fill=ORANGE)
    y += 180
    rg = [(3, '沒有勇氣過忠於自己的人生', '照自己的意思過的日子，大約占 0%', '放寬「自己接任務」、少硬排他不想做的事'), (0, '工作太拼命', '一生中有 0% 的日子在工作', ''),
          (3, '沒有和朋友保持聯絡', '走到最後，身邊沒有知心的人', '讓他交朋友：請客、帶朋友一起出任務')]
    for lv, n, why, fix in rg:
        hgt = 170 if fix else 124; box(d, 24, y, 756, y + hgt)
        icon_c(im, '打勾' if lv == 0 else '打叉', 46, y + 40, 3); text_c(d, 100, y + 40, n, 16); lvl(d, 640, y + 40, lv, 3, RED)
        text_c(d, 100, y + 86, why, 12, MUTED)
        if fix: iw = icon_c(im, '上升', 100, y + 130, 2); text_c(d, 100 + iw + 8, y + 130, fix, 12, OKD)
        y += hgt + 20
    return crop(im, y - 20)

def sheet(pages, labels, out):
    Hm = max(p.height for p in pages); o = Image.new('RGBA', (len(pages) * (W + 20) + 20, Hm + 80), (38, 40, 56, 255)); dd = ImageDraw.Draw(o)
    for i, (p, l) in enumerate(zip(pages, labels)): text(dd, 20 + i * (W + 20), 16, l, 12, (240, 230, 200)); o.alpha_composite(p, (20 + i * (W + 20), 64))
    o.convert('RGB').resize((o.width // 2, o.height // 2), Image.LANCZOS).save(out)

if __name__ == '__main__':
    sheet([rel_page(), wall_page(), news_page()], ['人際・事務所（勇者之間的交情）', '人際・歷代', '人際・近況'], sys.argv[1])
    sheet([artists_page(), comp_page(), mem_page(), regret_page()], ['事務所・旗下（上：收起、下：展開「安排」）', '事務所・競爭（下方）', '勇者檔案・生平・回憶', '勇者檔案・生平・遺憾'], sys.argv[2])
