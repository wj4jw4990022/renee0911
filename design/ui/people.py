# 人際面板新版草圖（身邊、人情帳＋點頭像的說明框）
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw
from style import *
from shop import phone, L, price_btn

NEW = {   # 人際要用的新圖示（自己畫，兩圈粗框）
 '歷代': grid(['Y...Y...Y', 'YY.YYY.YY', 'YYYYRYYYY', 'YYYYYYYYy', 'yyyyyyyyy']),
 '近況': grid(['LLLLLLLLLk', 'LDDDDLKKLk', 'LDDDDLLLLk', 'LLLLLLKKLk', 'LKKKKKKKLk', 'LLLLLLLLLk', 'LKKKKKKKLk', 'kkkkkkkkkk']),
 '人情帳': grid(['NNNNNNNNk', 'NLLLLLLNk', 'NLKKKKLNk', 'NLLLLLLNk', 'NLKKYYLNk', 'NLLLYYLNk', 'NLLLLLLNk', 'NNNNNNNNk']),
 '空心': grid(['.KK...KK.', 'KLLK.KLLk', 'KLLLKLLLk', 'KLLLLLLLk', '.KLLLLLk.', '..KLLLk..', '...KLk...', '....k....']),
 '戀人': grid(['.PP...PP.', 'PWPP.PPPp', 'PWPPPPPPp', 'PPPPPPPPp', '.PPPPPPp.', '..PPPPp..', '...PPp...', '....p....']),
 '對手': grid(['K.......K', '.K.....K.', '..K...K..', '...K.K...', '....K....', '...K.K...', '.NK...KN.', 'NN.....NN']),
 '生病': grid(['.WWW.', 'WWRWW', 'WRRRW', 'WWRWW', '.WWW.']),
 '一起出任務': grid(['..SS..K..', '.SSSS.K..', '.SSSS.K..', '..SS..K..', '.BBBBNNN.', 'BBBBBBK..', 'BBBBBB...']),
 '幫忙': grid(['SS....SS.', 'SSS..SSS.', '.SSSSSS..', '..SSSS...', '...SS....']),
}
for k, v in NEW.items(): ICON[k] = outline(v)

PEOPLE = [('阿樂', '08_03', 3, (208, 96, 122)), ('艾琳修女', '08_04', 2, (138, 138, 138)), ('小鈴', '08_03', 2, (192, 138, 48)), ('小雯', '08_03', 1, (154, 90, 128)),
          ('老吳', '07_02', 1, (122, 74, 42)), ('老陳', '07_04', 0, (90, 90, 90)), ('小豆', '07_01', 'love', (154, 90, 128)), ('阿桃', '08_03', 0, (154, 90, 128)),
          ('馬可', '07_03', '?', (74, 74, 58)), ('鐵娜', '08_00', 0, (106, 58, 58)), ('阿福', '07_01', 1, (74, 122, 90)), ('阿哲', '09_04', 0, (63, 110, 160)),
          ('鐵牙', '07_04', 1, (90, 90, 90)), ('亞斯', '08_01', 'rival', (138, 58, 58))]
SICK = {'老吳'}

def ptabs(im, d, y, sel):
    for i, (n, lab) in enumerate((('人際', '身邊'), ('事務所', '事務所'), ('歷代', '歷代'), ('近況', '近況'), ('人情帳', '人情帳'))):
        x = 20 + i * 150; box(d, x, y, x + 136, y + 108, fill=GREEN if i == sel else PAPER)
        icon_c(im, n, x + 68, y + 40, 3, True); text_c(d, x + 68, y + 84, lab, 12, TXT, True)

def rel_icons(im, x, cy, rel):   # 關係：愛心數（0～3）、戀人、對手、來路不明
    if rel == 'love': return icon_c(im, '戀人', x, cy, 3, True)
    if rel == 'rival': return icon_c(im, '對手', x, cy, 3, True)
    if rel == '?': return icon_c(im, ICON['空心'], x, cy, 3, True)
    w = ICON['心情'].width * 2; x0 = x - (3 * w + 8) / 2
    for k in range(3): icon_c(im, '心情' if k < rel else '空心', x0 + k * (w + 4), cy, 2)

def person(im, d, x, y, nm, tile, rel, bg):
    ring = (232, 138, 168) if rel == 'love' else RED if rel == 'rival' else GREEN if rel in (2, 3) else (150, 140, 130)
    box(d, x, y, x + 168, y + 230, fill=PAPER)
    d.rectangle([x + 20, y + 16, x + 148, y + 144], fill=ring); d.rectangle([x + 26, y + 22, x + 142, y + 138], fill=bg)   # 頭像底色＝職業色，外圈＝關係色
    face = Image.open(TD + tile + '.png').convert('RGBA').crop((0, 0, 16, 13)); im.alpha_composite(face.resize((112, 91), Image.NEAREST), (x + 28, y + 46))
    if nm in SICK: icon_c(im, '生病', x + 142, y + 22, 4, True)
    text_c(d, x + 84, y + 170, nm if len(nm) <= 3 else nm[:3], 16, TXT, True)
    rel_icons(im, x + 84, y + 206, rel)

def people_near():
    im, d = phone('人際', '人際'); ptabs(im, d, 220, 0)
    for i, (nm, tile, rel, bg) in enumerate(PEOPLE[:12]):
        person(im, d, 24 + (i % 4) * 184, 356 + (i // 4) * 252, nm, tile, rel, bg)
    # 點頭像的說明框示意（點「小豆」）
    x, y = 60, 356 + 252 + 236
    box(d, x, y, x + 660, y + 300, fill=(255, 252, 238)); d.polygon([(x + 404, y), (x + 432, y), (x + 416, y - 22)], fill=O[:3])
    face = Image.open(TD + '07_01.png').convert('RGBA'); im.alpha_composite(face.resize((96, 96), Image.NEAREST), (x + 24, y + 24))
    text_c(d, x + 140, y + 50, '小豆', 24); icon_c(im, '戀人', x + 270, y + 50, 4, True)
    for k, (n, lab) in enumerate((('金幣', '請客'), ('心情', '聊天'), ('寶物', '送禮'))):   # 互動：圖示＋小字
        bx = x + 140 + k * 168; box(d, bx, y + 110, bx + 150, y + 204); icon_c(im, n, bx + 75, y + 142, 3, True); text_c(d, bx + 75, y + 182, lab, 12, TXT, True)
    text_c(d, x + 24, y + 250, '交情 82・戀人', 16, MUTED)
    return im

def people_ledger():
    im, d = phone('人際', '人際'); ptabs(im, d, 220, 4)
    rows = [('金幣', '欠錢', [('老吳', '80', '2 月')]), ('幫忙', '答應幫忙', [('找回小貓', '', '3 月')]), ('生病', '生病中', [('老吳', '', '2 月')]),
            ('一起出任務', '可以一起出任務', [('鐵牙', '+40%', '105')])]
    y = 356
    for ic, lab, items in rows:   # 每組一張卡：左邊大圖示＋標題，下面一人一行
        h = 96 + 84 * len(items); box(d, 24, y, 756, y + h)
        icon_c(im, ic, L, y + 48, 4); text_c(d, L + 70, y + 48, lab, 16)
        for j, (nm, a, b) in enumerate(items):
            cy = y + 120 + j * 84; text_c(d, L + 70, cy, nm, 24)
            if ic == '金幣': iw = icon_c(im, '金幣', 470, cy, 3); text_c(d, 470 + iw + 8, cy, a, 24); icon_c(im, '時間', 620, cy, 3); text_c(d, 668, cy, b, 16)
            elif ic == '一起出任務': iw = icon_c(im, '戰力', 420, cy, 3); text_c(d, 420 + iw + 8, cy, a, 24, (37, 149, 106)); iw = icon_c(im, '金幣', 580, cy, 3); text_c(d, 580 + iw + 8, cy, b, 24)
            else: icon_c(im, '時間', 620, cy, 3); text_c(d, 668, cy, b, 16)
        y += h + 26
    return im

if __name__ == '__main__':
    a, b = people_near(), people_ledger()
    out = Image.new('RGBA', (a.width * 2 + 60, a.height + 80), (38, 40, 56, 255)); d = ImageDraw.Draw(out)
    text(d, 20, 16, '身邊（示意：點「小豆」跳出互動）', 12, (240, 230, 200)); text(d, a.width + 40, 16, '人情帳', 12, (240, 230, 200))
    out.alpha_composite(a, (20, 64)); out.alpha_composite(b, (a.width + 40, 64))
    out.convert('RGB').resize((out.width // 2, out.height // 2), Image.LANCZOS).save(sys.argv[1])
