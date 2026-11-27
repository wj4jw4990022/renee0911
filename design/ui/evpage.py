# 大事件整頁新版草圖（家書、醜聞、告白……要老闆做決定的大事）
# 用法：python3 evpage.py 草圖_大事件.png
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw
import sendoff   # 粉圓字型、頭像
import mainscreen   # 驚嘆圖示
from style import *
from sendoff import FS, face, OKD, ORANGE
W, H = 780, 1800

def bubble(im, d, x, y):   # 表情泡泡（遊戲裡用 Kenney 表情）：放大，約勇者頭的大小
    w, h = 140, 116
    box(d, x, y, x + w, y + h, fill=(255, 255, 255), shadow=False); d.polygon([(x + 20, y + h - 4), (x + 50, y + h - 4), (x + 12, y + h + 34)], fill=O[:3]); d.polygon([(x + 26, y + h - 6), (x + 44, y + h - 6), (x + 18, y + h + 22)], fill=(255, 255, 255))
    icon_c(im, '壓力', x + w // 2, y + h // 2, 7, True)

def page(kind, tag, left, who, text_, trust, lv, opts, sec, scene):
    im = Image.new('RGBA', (W, H), PAPER2 + (255,)); d = ImageDraw.Draw(im)
    # 上方場景：事件色的背景＋大大的勇者（正面 Q 版）＋表情泡泡
    d.rectangle([0, 0, W, 560], fill=scene); d.rectangle([0, 430, W, 560], fill=tuple(max(0, c - 22) for c in scene))
    for k in range(6): d.rectangle([0, 430 + k * 4, W, 431 + k * 4], fill=tuple(max(0, c - 10) for c in scene))
    sp = Image.open(TD + '07_01.png').convert('RGBA'); im.alpha_composite(sp.resize((176, 176), Image.NEAREST), (302, 290))
    bubble(im, d, 470, 150)
    # 左上：事件標籤（驚嘆＋事件名＋誰），右上：還剩幾個月要回答
    box(d, 24, 70, 24 + 300, 132, fill=PAPER); iw = icon_c(im, '驚嘆' if '驚嘆' in ICON else '危險', 44, 101, 3); text_c(d, 44 + iw + 12, 101, f'{tag}・{who}', 16)
    box(d, 560, 70, 756, 132, fill=PAPER); iw = icon_c(im, '時間', 580, 101, 3); text_c(d, 580 + iw + 10, 101, f'剩 {left} 月', 16)
    # 他說的話：粗框紙卡＋木條名牌
    y = 600; box(d, 24, y, 756, y + 170, fill=(255, 250, 240))
    d.rectangle([44, y - 22, 44 + 130, y + 24], fill=WOOD, outline=O[:3], width=3); text_c(d, 109, y + 1, who, 16, (250, 240, 214), True)
    yy = y + 62
    for line in text_:
        text_c(d, 52, yy, line, 16); yy += 48
    # 信任：他說了多少（點圖示看說明）
    y = 806; iw = icon_c(im, '信任', 30, y, 3); text_c(d, 30 + iw + 8, y, str(trust), 16)
    text_c(d, 30 + iw + 60, y, ['看不出後果', '只透露大概', '把話說清楚了'][lv], 12, MUTED)
    # 選項：一顆一張卡（金框＝現在要按），下面一行後果
    y = 850
    for o, hint in opts:
        h_ = 120 if hint else 84
        box(d, 24, y, 756, y + h_, fill=PAPER, border=GOLD); d.rectangle([27, y + 3, 753, y + h_ - 3], outline=O[:3], width=2)
        text_c(d, 52, y + 42, o, 16)
        if hint: text_c(d, 52, y + 88, hint, 12, OKD if lv == 2 else ORANGE)
        y += h_ + 20
    # 限時：和主畫面一樣的時鐘＋倒數條
    y += 10; iw = icon_c(im, '時間', 30, y + 20, 3); d.rectangle([30 + iw + 14, y + 8, 640, y + 32], fill=(230, 220, 195), outline=O[:3], width=3)
    d.rectangle([30 + iw + 17, y + 11, 30 + iw + 17 + int((637 - 30 - iw - 17) * sec / 20), y + 29], fill=GOLD); text_c(d, 670, y + 20, f'{sec} 秒', 16)
    # 晚點再回答：小按鈕
    y += 70; box(d, 250, y, 530, y + 70, shadow=False); text_c(d, 390, y + 35, '晚點再回答', 16, MUTED, True)
    return im.crop((0, 0, W, max(y + 110, 1400)))

if __name__ == '__main__':
    a = page('family', '家書', 2, '石頭', ['老闆，我媽病得很重……我想回家幾天。', '可是排程上還有工作'], 75, 2,
             [('馬上回去，工作我來處理', '回家 4 個月、信任 +8'), ('做完手上的工作再回去', '一半機率沒趕上：心情 -30、信任 -10'), ('現在不行', '信任 -20 以上，一半機率家人就這樣走了')], 18, (40, 62, 78))
    b = page('scandal', '醜聞', 3, '石頭', ['……老闆，對不起，又上新聞了'], 50, 1,
             [('讓他公開道歉', '名聲少扣一些，他可能不服氣'), ('花 1,200 金壓新聞', '之後可能又爆出來'), ('公開和他切割', '他會非常受傷，可能離開'), ('力挺到底', '名聲扣多一點，他會很感激')], 12, (70, 46, 52))
    Hm = max(a.height, b.height); out = Image.new('RGBA', (W * 2 + 60, Hm + 80), (38, 40, 56, 255)); d = ImageDraw.Draw(out)
    text(d, 20, 16, '家書（信任 75：把話說清楚）', 12, (240, 230, 200)); text(d, W + 40, 16, '醜聞（信任 50：只透露大概）', 12, (240, 230, 200))
    out.alpha_composite(a, (20, 64)); out.alpha_composite(b, (W + 40, 64))
    out.convert('RGB').resize((out.width // 2, out.height // 2), Image.LANCZOS).save(sys.argv[1])
