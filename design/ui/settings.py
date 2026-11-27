# 設定面板新版草圖
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw
from style import *
from shop import phone, L
import people, quest, office

NEW = {
 '播放': grid(['GG....', 'GGGG..', 'GGGGGG', 'GGGG..', 'GG....']),
 '暫停': grid(['KK.KK', 'KK.KK', 'KK.KK', 'KK.KK', 'KK.KK']),
 '月亮': grid(['..YYY.', '.YYy..', 'YYy...', 'YYy...', 'YYy...', '.YYy..', '..YYY.']),
 '文字': grid(['..DD.......', '.DDDD......', 'DD..DD..DD.', 'DDDDDD.D..D', 'DD..DD.D..D', 'DD..DD..DDD']),
 '飄字': grid(['..G...', '..G...', 'GGGGG.', '..G...', '..G...']),
 '雲端': grid(['...WWW...', '.WWWWWWW.', 'WWWWWWWWW', 'WWWWWWWWK', '.KKKKKKK.']),
 '還原': grid(['.B.KKKK..', 'BB.WWWWK.', 'BBBWWWWWK', '...WWKWWK', 'K..WWKKWK', 'K..WWWWWK', '.KWWWWWK.', '..KKKKK..']),   # 時鐘＋往回的藍箭頭
 '匯出': grid(['....G....', '...GGG...', '..GGGGG..', '.GGGGGGG.', '...GGG...', 'NN.GGG.NN', 'NN.....NN', 'NNNNNNNNN']),   # 往外的箭頭＋盒子
 '匯入': grid(['...BBB...', '...BBB...', '.BBBBBBB.', '..BBBBB..', '...BBB...', 'NN..B..NN', 'NN.....NN', 'NNNNNNNNN']),   # 往裡的箭頭＋盒子
 '手機': grid(['DDDDD', 'DBBBD', 'DBBBD', 'DBBBD', 'DBBBD', 'DDWDD']),
 '重新整理': grid(['..KKKG.', '.K...GG', 'K....GG', 'K......', 'K.....K', '.K...K.', '..KKK..']),
 '說明書': grid(['NNNNNNN', 'NLLnLLN', 'NLLnLLN', 'NLLnLLN', 'NLLnLLN', 'NNNNNNN']),
}
for k, v in NEW.items(): ICON[k] = outline(v)

def seg(im, d, x, cy, opts, sel, w=96):   # 分段選項：一格一個圖示或短字，選中變綠
    for i, o in enumerate(opts):
        bx = x + i * (w + 8); box(d, bx, cy - 32, bx + w, cy + 32, fill=GREEN if i == sel else PAPER, shadow=False)
        if o in ICON: icon_c(im, o, bx + w // 2, cy, 3, True)
        else: text_c(d, bx + w // 2, cy, o, 16, TXT, True)
def toggle(d, x, cy, on):
    d.rectangle([x, cy - 22, x + 96, cy + 22], fill=GREEN if on else (215, 205, 185), outline=O[:3], width=3)
    kx = x + 54 if on else x + 6; d.rectangle([kx, cy - 16, kx + 36, cy + 16], fill=PAPER, outline=O[:3], width=3)
def row(im, d, y, ic, lab, h=96):
    if ic == '文字': box(d, L - 4, y + 22, L + 52, y + 74, shadow=False); text_c(d, L + 24, y + h // 2, 'Aa', 16, TXT, True)
    else: iw = icon_c(im, ic, L, y + h // 2, 4)
    text_c(d, L + 70, y + h // 2, lab, 16); return y + h // 2
def group(im, d, y, title, rows):
    text_c(d, 30, y + 22, title, 12, MUTED); h = 96 * len(rows); box(d, 24, y + 44, 756, y + 44 + h)
    for k in range(1, len(rows)): d.line([(40, y + 44 + 96 * k), (740, y + 44 + 96 * k)], fill=(214, 190, 150), width=2)
    for k, fn in enumerate(rows): fn(y + 44 + 96 * k)
    return y + 44 + h + 24

def settings():
    im0, _ = phone('設定', '設定'); im = Image.new('RGBA', (780, 1900), PAPER + (255,)); im.alpha_composite(im0.crop((0, 0, 780, 200)), (0, 0)); d = ImageDraw.Draw(im)
    y = 220; box(d, 24, y, 756, y + 110)   # 這一代
    icon_c(im, '歷代', L, y + 55, 4); text_c(d, L + 70, y + 36, '第 1 代・阿傑', 16); text_c(d, L + 70, y + 80, '1 年 1 月', 12, MUTED)
    iw = icon_c(im, '雲端', 600, y + 55, 3); icon_c(im, '打勾', 600 + iw + 8, y + 55, 3)
    y = 354
    y = group(im, d, y, '遊戲', [
        lambda yy: (row(im, d, yy, '時間', '速度'), seg(im, d, 400, yy + 48, ['×1', '×3', '×10'], 0)),
        lambda yy: (row(im, d, yy, '設定', '看選單時'), seg(im, d, 400, yy + 48, ['播放', '慢', '暫停'], 1)),
        lambda yy: (row(im, d, yy, '暫停', '暫停'), toggle(d, 612, yy + 48, False)),
    ])
    y = group(im, d, y, '顯示', [
        lambda yy: (row(im, d, yy, '文字', '字的大小'), seg(im, d, 504, yy + 48, ['中', '大'], 0)),
        lambda yy: (row(im, d, yy, '飄字', '飄字'), toggle(d, 612, yy + 48, True)),
    ])
    y = group(im, d, y, '存檔', [
        lambda yy: (row(im, d, yy, '還原', '清除前的進度'), seg(im, d, 612, yy + 48, ['還原 '], -1)),
        lambda yy: (row(im, d, yy, '匯出', '搬家'), seg(im, d, 504, yy + 48, ['匯出 ', '匯入 '], -1)),
    ])
    y = group(im, d, y, 'App', [
        lambda yy: (row(im, d, yy, '手機', '加到主畫面'), icon_c(im, '打勾', 660, yy + 48, 4, True)),
        lambda yy: (row(im, d, yy, '重新整理', '載入最新版'), seg(im, d, 612, yy + 48, ['更新'], -1)),
    ])
    box(d, 24, y + 10, 756, y + 96, fill=(250, 214, 205), border=(160, 40, 44)); icon_c(im, '危險', L, y + 53, 4); text_c(d, L + 70, y + 53, '重新開始', 16, (160, 40, 44))
    return im

if __name__ == '__main__':
    a = settings(); out = Image.new('RGBA', (a.width + 40, a.height + 80), (38, 40, 56, 255)); d = ImageDraw.Draw(out)
    text(d, 20, 16, '設定', 12, (240, 230, 200)); out.alpha_composite(a, (20, 64))
    out.convert('RGB').resize((out.width // 2, out.height // 2), Image.LANCZOS).save(sys.argv[1])
