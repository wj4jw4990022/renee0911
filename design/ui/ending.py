# 結局新版草圖：兩頁——①他的一生（結局、遺憾、年表）②選下一位勇者
# 用法：python3 ending.py 草圖_結局.png
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw
import sendoff, mainscreen, heropage, office   # 粉圓字型、圖示（個性、生平、心願、歷代……）
from style import *
from sendoff import FS, face, OKD, ORANGE
import wild
WI = wild.items()
W, H = 780, 2400

def head(im, d, t, ic):
    d.rectangle([0, 0, W, 90], fill=WOOD); d.rectangle([0, 86, W, 90], fill=WOOD2); icon_c(im, ic, 24, 45, 4); text_c(d, 84, 45, t, 24, (250, 240, 214))

def grave(im, d, x, y):   # 墓碑（自己畫，粗框）
    g = grid(['..KKKKK..', '.KKKKKKK.', 'KKKKOKKKk', 'KKOOOOOKk', 'KKKKOKKKk', 'KKKKOKKKk', 'KKKKKKKKk', 'KKKKKKKKk', 'kkkkkkkkk'])
    g = outline(g); im.alpha_composite(g.resize((g.width * 12, g.height * 12), Image.NEAREST), (x, y))

def life():
    im = Image.new('RGBA', (W, H), PAPER2 + (255,)); d = ImageDraw.Draw(im)
    head(im, d, '第 1 代・生平', '歷代')
    # 場景：戰死＝墓碑＋花；退休＝坐在家門口；離開＝背影走遠（這張畫戰死）
    d.rectangle([0, 90, W, 470], fill=(150, 190, 215)); d.rectangle([0, 360, W, 470], fill=(98, 160, 92))
    for i, x in enumerate((40, 600, 680)): t = WI['tree']; im.alpha_composite(t.resize((t.width * 5, t.height * 5), Image.NEAREST), (x, 360 - t.height * 5 + 10))
    grave(im, d, 330, 240)
    for k, x in enumerate((300, 452)): fl = WI['bush']; im.alpha_composite(fl.resize((fl.width * 3, fl.height * 3), Image.NEAREST), (x, 380))
    # 名字卡
    y = 500; box(d, 24, y, 756, y + 170)
    face(im, '07_01', 46, y + 24, 7, (240, 150, 110))
    text_c(d, 180, y + 50, '小花', 24); box(d, 330, y + 26, 450, y + 74, fill=(248, 214, 207), shadow=False); text_c(d, 390, y + 50, '戰死', 16, RED, True)
    iw = icon_c(im, '戰力', 180, y + 118, 3); text_c(d, 180 + iw + 8, y + 118, '盜賊・Lv12・34 歲', 16, MUTED)
    # 怎麼走的
    y += 196; box(d, 24, y, 756, y + 90, fill=(255, 250, 240), shadow=False); text_c(d, 46, y + 45, '在森林被哥布林圍攻，在經紀人的陪伴下離世', 16)
    # 三格數字
    y += 116
    for k, (ic, v, c) in enumerate((('危險', '340', TXT), ('人際', '0', TXT), ('心情', '40', ORANGE))):
        x = 24 + k * 248; box(d, x, y, x + 228, y + 76); iw = icon_c(im, ic, x + 16, y + 38, 4); text_c(d, x + 16 + iw + 12, y + 38, v, 24, c)
    # 個性、最在乎、人生目標
    y += 104
    rows = [('個性', '老實・敏感・外向・記仇・保守'), ('心願', '最在乎：地位・儲蓄・安寧'), ('生平', '人生目標：精緻窮族（對你說的是孝順拉扯族）')]
    box(d, 24, y, 756, y + 60 * len(rows) + 20)
    for k, (ic, t) in enumerate(rows): iw = icon_c(im, ic, 46, y + 40 + k * 60, 3); text_c(d, 46 + iw + 12, y + 40 + k * 60, t, 12)
    y += 60 * len(rows) + 70
    # 臨終的遺憾
    text_c(d, 30, y, '臨終的遺憾', 16, MUTED); iw = icon_c(im, '心情', 600, y, 3); text_c(d, 600 + iw + 8, y, '幸福 40', 16, ORANGE); y += 34
    rg = [(2, '沒有勇氣過忠於自己的人生', '照自己的意思過的日子，大約占 0%'), (0, '工作太拼命', '一生中有 0% 的日子在工作'), (0, '沒有勇氣表達自己的感受', '她說出口的話，你回應了 100%'),
          (2, '沒有和朋友保持聯絡', '走到最後，身邊沒有知心的人'), (1, '沒有讓自己更快樂', '大部分的日子都悶悶不樂')]
    box(d, 24, y, 756, y + 96 * len(rg) + 10)
    for k, (lv, n, why) in enumerate(rg):
        yy = y + 10 + k * 96
        if lv == 0: icon_c(im, '打勾', 46, yy + 40, 4)
        elif lv == 1: text_c(d, 50, yy + 40, '△', 16, ORANGE)
        else: icon_c(im, '打叉', 46, yy + 40, 4) if '打叉' in ICON else text_c(d, 50, yy + 40, '✕', 16, RED)
        text_c(d, 104, yy + 26, n, 16); text_c(d, 104, yy + 62, why, 12, MUTED)
        if k < len(rg) - 1: d.line([(46, yy + 92), (734, yy + 92)], fill=(220, 200, 165), width=2)
    y += 96 * len(rg) + 50
    text_c(d, 30, y, '你從她身上賺到的錢，和她過得幸不幸福，是兩回事。', 12, MUTED); y += 70
    # 人生年表
    text_c(d, 30, y, '人生年表', 16, MUTED); y += 30
    tl = [('18', '當上勇者，加入你的事務所'), ('22', '第一次打倒哥布林王'), ('27', '和小雯開始交往'), ('34', '在森林被哥布林圍攻，倒下了')]
    box(d, 24, y, 756, y + 64 * len(tl) + 16)
    for k, (a, t) in enumerate(tl): yy = y + 40 + k * 64; text_c(d, 46, yy, f'{a} 歲', 16, MUTED); text_c(d, 150, yy, t, 16)
    y += 64 * len(tl) + 46
    # 選下一位勇者
    box(d, 24, y, 756, y + 96, fill=GOLD); iw = icon_c(im, '歷代', 0, -200, 4); b = d.textbbox((0, 0), '選下一位勇者', font=FS[24], stroke_width=1); x = 390 - (iw + 16 + b[2] - b[0]) // 2
    icon_c(im, '歷代', x, y + 48, 4); text_c(d, x + iw + 16, y + 48, '選下一位勇者', 24)
    return im.crop((0, 0, W, y + 130))

def pick_page():
    im = Image.new('RGBA', (W, H), PAPER2 + (255,)); d = ImageDraw.Draw(im)
    head(im, d, '第 2 代', '歷代')
    y = 116; text_c(d, 30, y + 20, '繼承', 16, MUTED)
    x = 120
    for ic, t in (('戰力', '鐵製匕首'), ('寶物', '幸運草')):
        tw = d.textbbox((0, 0), t, font=FS[16], stroke_width=1)[2]; box(d, x, y - 6, x + 70 + tw, y + 46, shadow=False); iw = icon_c(im, ic, x + 14, y + 20, 3); text_c(d, x + 14 + iw + 10, y + 20, t, 16); x += 70 + tw + 16
    y += 76
    cands = [('07_03', '小虎', '小花的徒弟', '親眼看著師父倒下', '盜賊', ['熱血', '好奇'], '自稱證照進修族', ''),
             ('07_02', '阿月', '公會介紹的新人', '', '弓手', ['懶散', '忠誠'], '自稱斜槓副業族', ''),
             ('07_04', '小楓', '從別村來的流浪者', '', '戰士', ['貪財', '謹慎'], '自稱健康優先族', '天才')]
    for fc, nm, tag, sub, cls, tr, goal, perk in cands:
        box(d, 24, y, 756, y + 250)
        face(im, fc, 46, y + 26, 7, (205, 190, 160))
        text_c(d, 180, y + 44, nm, 24); tw = d.textbbox((0, 0), tag, font=FS[12], stroke_width=1)[2]; box(d, 300, y + 22, 300 + tw + 32, y + 66, fill=(232, 222, 246), shadow=False); text_c(d, 316, y + 44, tag, 12, (106, 79, 176))
        if sub: text_c(d, 180, y + 88, sub, 12, RED)
        cy = y + 134; x = 180; iw = icon_c(im, '戰力', x, cy, 3); x += iw + 8 + text_c(d, x + iw + 8, cy, cls, 16) + 24
        for t in tr: iw = icon_c(im, '個性', x, cy, 3); x += iw + 6 + text_c(d, x + iw + 6, cy, t, 16) + 18
        cy = y + 190; iw = icon_c(im, '心願', 180, cy, 3); text_c(d, 180 + iw + 8, cy, goal, 12, MUTED)
        if perk: box(d, 440, cy - 22, 540, cy + 22, fill=(255, 236, 170), shadow=False); text_c(d, 490, cy, perk, 12, (150, 100, 10), True)
        box(d, 600, y + 160, 734, y + 226, fill=PAPER, border=GOLD, shadow=False); d.rectangle([603, y + 163, 731, y + 223], outline=O[:3], width=2); text_c(d, 667, y + 193, '就是他', 16, TXT, True)
        y += 276
    return im.crop((0, 0, W, y + 20))

if __name__ == '__main__':
    a, b = life(), pick_page(); Hm = max(a.height, b.height)
    out = Image.new('RGBA', (W * 2 + 60, Hm + 80), (38, 40, 56, 255)); d = ImageDraw.Draw(out)
    text(d, 20, 16, '① 他的一生（可往下捲）', 12, (240, 230, 200)); text(d, W + 40, 16, '② 按「選下一位勇者」之後', 12, (240, 230, 200))
    out.alpha_composite(a, (20, 64)); out.alpha_composite(b, (W + 40, 64))
    out.convert('RGB').resize((out.width // 2, out.height // 2), Image.LANCZOS).save(sys.argv[1])
