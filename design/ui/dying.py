# 瀕死新版草圖（勇者倒下、要老闆在 15 秒內決定怎麼救）
# 用法：python3 dying.py 草圖_瀕死.png
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw
import sendoff, mainscreen   # 粉圓字型、說話／驚嘆圖示
from style import *
from sendoff import FS, OKD
import wild
WI = wild.items()
W, H = 780, 1640

def scene(im, d):   # 上方：倒下的地方（這裡是森林，調暗＋紅色暗角），勇者躺在地上、眼睛閉著
    sc = Image.new('RGBA', (W, 600), (34, 40, 38, 255)); g = ImageDraw.Draw(sc)
    g.rectangle([0, 400, W, 600], fill=(58, 50, 40))
    for i, x in enumerate(range(-30, W, 120)):   # 遠處的樹（剪影）
        t = WI['tree']; t = t.resize((t.width * 5, t.height * 5), Image.NEAREST); sc.alpha_composite(t, (x, 400 - t.height + (i % 2) * 20))
    sc = Image.blend(sc, Image.new('RGBA', sc.size, (20, 16, 20, 255)), .55)
    sp = Image.open(TD + '07_01.png').convert('RGBA').rotate(90, expand=True); sc.alpha_composite(sp.resize((128, 128), Image.NEAREST), (326, 412))
    v = Image.new('RGBA', sc.size, (0, 0, 0, 0)); vg = ImageDraw.Draw(v)
    for k in range(40): vg.rectangle([k * 4, k * 4, W - k * 4, 600 - k * 4], outline=(120, 10, 20, 150 - k * 4), width=4)   # 紅色暗角
    sc.alpha_composite(v); im.alpha_composite(sc, (0, 0))
    box(d, 190, 70, 590, 190, fill=PAPER); text_c(d, 390, 112, '小晴倒下了', 24, RED, True); text_c(d, 390, 160, '在森林被哥布林圍攻', 12, MUTED, True)

def page():
    im = Image.new('RGBA', (W, H), PAPER2 + (255,)); d = ImageDraw.Draw(im)
    scene(im, d)
    # 心跳＋還能撐幾秒
    y = 640; pts = [(40, y + 40), (250, y + 40), (270, y + 30), (290, y + 40), (320, y + 40), (340, y), (362, y + 76), (384, y + 22), (400, y + 40), (560, y + 40)]
    d.line(pts, fill=RED, width=6, joint='curve')
    iw = icon_c(im, '時間', 590, y + 40, 4); text_c(d, 590 + iw + 12, y + 40, '0:13', 24, RED)
    # 他說的話
    y = 760; box(d, 24, y, 756, y + 110, fill=(255, 250, 240))
    d.rectangle([44, y - 22, 44 + 130, y + 24], fill=WOOD, outline=O[:3], width=3); text_c(d, 109, y + 1, '小晴', 16, (250, 240, 214), True)
    text_c(d, 52, y + 66, '老闆……對不起，我好像回不去了', 16)
    # 選項 1：請神官（紅十字）＋價錢鈕
    y = 910
    box(d, 24, y, 756, y + 140, fill=PAPER, border=GOLD); d.rectangle([27, y + 3, 753, y + 137], outline=O[:3], width=2)
    icon_c(im, '生病', 48, y + 70, 5); text_c(d, 120, y + 46, '請神官緊急救治', 16); text_c(d, 120, y + 96, '一定活下來，但會重傷臥床', 12, MUTED)
    box(d, 540, y + 34, 730, y + 106, shadow=False); iw = icon_c(im, '金幣', 556, y + 70, 4); text_c(d, 556 + iw + 10, y + 70, '320', 24)
    # 選項 2：大喊求救（說話）＋朋友數
    y += 166
    box(d, 24, y, 756, y + 140, fill=PAPER, border=GOLD); d.rectangle([27, y + 3, 753, y + 137], outline=O[:3], width=2)
    icon_c(im, '說話', 48, y + 70, 5); text_c(d, 120, y + 46, '大喊求救', 16); text_c(d, 120, y + 96, '看運氣：朋友越多，越可能有人來', 12, MUTED)
    iw = icon_c(im, '人際', 600, y + 70, 4); text_c(d, 600 + iw + 10, y + 70, '×3', 24)
    # 選項 3：陪他走完最後一段（虛線、不顯眼）
    y += 166
    d.rectangle([24, y, 756, y + 96], outline=(176, 138, 85), width=3)
    for x in range(30, 750, 24): d.line([(x, y), (x + 10, y)], fill=PAPER2, width=4); d.line([(x, y + 96), (x + 10, y + 96)], fill=PAPER2, width=4)
    icon_c(im, '空心', 48, y + 48, 4); text_c(d, 120, y + 48, '陪她走完最後一段', 16, MUTED)
    return im.crop((0, 0, W, y + 140))

if __name__ == '__main__':
    a = page(); out = Image.new('RGBA', (W + 40, a.height + 80), (38, 40, 56, 255)); d = ImageDraw.Draw(out)
    text(d, 20, 16, '瀕死（15 秒內決定）', 12, (240, 230, 200)); out.alpha_composite(a, (20, 64))
    out.convert('RGB').resize((out.width // 2, out.height // 2), Image.LANCZOS).save(sys.argv[1])
