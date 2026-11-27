# 主畫面新版草圖
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw
from style import *
from shop import L
import people, quest, office, settings, heropage

NEW = {
 '鈴鐺': grid(['...YY...', '..YYYY..', '.YYWYYY.', '.YYYYYY.', '.YYYYYY.', 'YYYYYYYY', '...yy...']),
 '跟拍': grid(['..KKKKK..', '.K..K..K.', 'K...K...K', 'KKKKRKKKK', 'K...K...K', '.K..K..K.', '..KKKKK..']),
 '快轉': grid(['G..G..', 'GG.GG.', 'GGGGGG', 'GG.GG.', 'G..G..']),
 '說話': grid(['WWWWWWW', 'WKWKWKW', 'WWWWWWW', '.WW....', 'W......']),
 '驚嘆': grid(['RR', 'RR', 'RR', 'RR', '..', 'RR']),
 '村子': grid(['...R...', '..RRR..', '.RRRRR.', 'RRRRRRR', '.LLLLL.', '.LNNLL.', '.LNNLL.']),
 '互動': grid(['.SS...SS.', 'SSSS.SSSS', 'SSSSSSSSS', '.SSSSSSS.', '..BBBBB..']),
}
for k, v in NEW.items(): ICON[k] = outline(v)
HERO = Image.open(TD + '08_02.png').convert('RGBA')

def main():
    W, H = 780, 1688; im = Image.new('RGBA', (W, H), PAPER + (255,)); d = ImageDraw.Draw(im)
    # 上方木條：日期、金幣、名聲、暫停、速度
    d.rectangle([0, 0, W, 96], fill=WOOD); d.rectangle([0, 92, W, 96], fill=WOOD2)
    text_c(d, 20, 48, '11年3月 4:00', 16, (250, 240, 214))
    box(d, 300, 16, 560, 80, fill=(60, 40, 28), border=GOLD, shadow=False); iw = icon_c(im, '金幣', 314, 48, 3); text_c(d, 314 + iw + 8, 48, '717', 16, (250, 240, 214)); iw2 = icon_c(im, '名聲', 450, 48, 3); text_c(d, 450 + iw2 + 8, 48, '52', 16, (250, 240, 214))
    for k, n in enumerate(('暫停', '快轉')): bx = 584 + k * 92; box(d, bx, 16, bx + 76, 80, shadow=False); icon_c(im, n, bx + 38, 48, 3, True)
    # 地圖
    d.rectangle([0, 96, W, 960], fill=(150, 200, 230)); d.rectangle([0, 600, W, 960], fill=(111, 154, 72)); d.rectangle([0, 760, W, 860], fill=(196, 167, 122))
    im.alpha_composite(HERO.resize((64, 64), Image.NEAREST), (360, 750))
    # 勇者卡（小）：頭像＋名字＋三個小條（圖示）
    box(d, 20, 116, 420, 236)
    im.alpha_composite(HERO.resize((80, 80), Image.NEAREST), (34, 134)); icon_c(im, '開心' if False else '心情', 108, 140, 2)   # 表情不疊在臉上，放頭像右上
    text_c(d, 140, 152, '大熊', 16); text_c(d, 232, 152, 'Lv9', 12, MUTED)
    for k, (n, f, c) in enumerate((('體力', .7, GREEN), ('心情', .8, (247, 201, 74)), ('壓力', .3, RED))):
        x = 140 + k * 92; icon_c(im, n, x, 204, 2); d.rectangle([x + 26, 196, x + 84, 212], fill=(230, 220, 195), outline=O[:3], width=2); d.rectangle([x + 28, 198, x + 28 + 54 * f, 210], fill=c)
    # 右上：鈴鐺、跟拍
    for k, n in enumerate(('鈴鐺', '跟拍')):
        bx = 664; by = 116 + k * 100; box(d, bx, by, bx + 92, by + 84); icon_c(im, n, bx + 46, by + 42, 4, True)
    d.ellipse([736, 104, 772, 140], fill=RED, outline=O[:3], width=3); text_c(d, 754, 122, '2', 12, (255, 255, 255), True)
    # 現在在做什麼
    box(d, 20, 884, 420, 944); iw = icon_c(im, '休息', 36, 914, 3); text_c(d, 36 + iw + 12, 914, '在家睡覺', 16)
    # 對話區：篩選圖示、訊息、選項
    d.rectangle([0, 960, W, H], fill=PAPER)
    for k, n in enumerate(('全', '說話', '驚嘆', '村子')):
        bx = 20 + k * 110; box(d, bx, 980, bx + 96, 1040, fill=GREEN if k == 0 else PAPER, shadow=False)
        if n == '全': text_c(d, bx + 48, 1010, '全', 16, TXT, True)
        else: icon_c(im, n, bx + 48, 1010, 3, True)
    box(d, 580, 980, 760, 1040, shadow=False); iw = icon_c(im, '互動', 596, 1010, 3); text_c(d, 596 + iw + 8, 1010, '互動', 12)   # 跟勇者互動
    msgs = [('驚嘆', '心願落空', '大熊一直想去森林冒險，最後沒能實現', (234, 165, 108)), ('打勾', '善行', '救了被史萊姆圍住的商人，拿到 66 金謝禮', (37, 149, 106))]
    y = 1070
    for ic, t, line, c in msgs:
        icon_c(im, ic, 36, y + 24, 3); text_c(d, 80, y + 24, t, 16, c); text_c(d, 80, y + 72, line, 16, TXT); d.line([(20, y + 110), (760, y + 110)], fill=(214, 190, 150), width=2); y += 124
    # 問題＋三個選項（金框＝現在要按）
    text_c(d, 20, y + 30, '「我們先從草原開始，可以嗎？」', 16)
    for k, t in enumerate(('當然', '嗯', '賺錢要緊')):
        bx = 20 + k * 250; box(d, bx, y + 70, bx + 236, y + 140, border=GOLD); d.rectangle([bx + 3, y + 73, bx + 233, y + 137], outline=O[:3], width=2); text_c(d, bx + 118, y + 105, t, 16, TXT, True)
    # 限時回答：時鐘＋倒數條＋秒數（時間到他自己決定）
    cy = y + 186; iw = icon_c(im, '時間', 20, cy, 3); d.rectangle([20 + iw + 12, cy - 14, 640, cy + 14], fill=(230, 220, 195), outline=O[:3], width=3); d.rectangle([20 + iw + 15, cy - 11, 20 + iw + 15 + (640 - 20 - iw - 18) * .6, cy + 11], fill=GOLD)
    text_c(d, 660, cy, '9 秒', 16, TXT)
    # 底部五鈕
    d.rectangle([0, H - 150, W, H], fill=WOOD)
    for k, (n, lab) in enumerate((('金幣', '花錢'), ('人際', '人際'), ('排程', '任務'), ('事務所', '事務所'), ('設定', '設定'))):
        cx = 78 + k * 156
        icon_c(im, n, cx, H - 96, 4, True); text_c(d, cx, H - 40, lab, 12, (250, 240, 214), True)   # 五顆一樣大，任務不特別突出
    return im

if __name__ == '__main__':
    a = main(); out = Image.new('RGBA', (a.width + 40, a.height + 80), (38, 40, 56, 255)); d = ImageDraw.Draw(out)
    text(d, 20, 16, '主畫面', 12, (240, 230, 200)); out.alpha_composite(a, (20, 64))
    out.convert('RGB').resize((out.width // 2, out.height // 2), Image.LANCZOS).save(sys.argv[1])
