# 草圖動畫：廣場（代言、綜藝、見粉絲），村子路面＋噴水池廣場
import sys, math, random
sys.path.insert(0, '/home/claude/sk_arena'); sys.path.insert(0, '/home/claude/dw/design/rooms'); sys.path.insert(0, '/home/claude/dw/design/wild')
from PIL import Image, ImageDraw, ImageFont
import rooms as R, arena as A
W, VH, TOP = 260, 170, 56
FONT = '/home/claude/sk_gate/cubic11.ttf'
EMO = {k: Image.open(f'/home/claude/sk_arena/emo_{k}.png').convert('RGBA') for k in ('開心', '戀愛')}
T, flip, put, shadow, WHITE = A.T, A.flip, A.put, A.shadow, A.WHITE
CX = 130

def bg():
    im = Image.new('RGBA', (W, VH), (111, 154, 72, 255)); d = ImageDraw.Draw(im); rnd = random.Random(5)
    for _ in range(500): d.point((rnd.randrange(W), rnd.randrange(VH)), fill=rnd.choice([(126, 171, 82), (95, 138, 62), (134, 182, 90)]))
    d.rectangle([0, 116, W, 152], fill=(184, 154, 110)); d.rectangle([0, 116, W, 117], fill=(163, 134, 92)); d.rectangle([0, 151, W, 152], fill=(163, 134, 92))
    for r, y in enumerate(range(120, 150, 6)):
        for x in range((r % 2) * 5, W, 10): d.rectangle([x + 1, y + 1, x + 8, y + 4], fill=(196, 167, 122) if (x + y) % 3 else (191, 162, 116))
    p = Image.open('/home/claude/sk_arena/stage.png').convert('RGBA'); im.alpha_composite(p, (CX - p.width // 2, 116 - p.height))
    return im

def billboard():   # 代言看板：木框、兩支腳、紅色橫條；海報中間貼勇者的大頭貼（遊戲裡用勇者當下的臉）
    def f(d):
        d.rectangle([3, 25, 4, 36], fill=R.BR); d.rectangle([27, 25, 28, 36], fill=R.BR)
        d.rectangle([0, 0, 31, 26], fill=R.BR); d.rectangle([2, 2, 29, 24], fill=(250, 240, 214, 255))
        d.rectangle([2, 2, 29, 5], fill=(232, 69, 55, 255))                       # 上方紅色橫條
        d.rectangle([7, 7, 24, 23], fill=(142, 198, 240, 255))                    # 大頭貼的藍底
        for x, y in ((4, 9), (26, 12), (4, 19)): d.rectangle([x, y, x + 1, y + 1], fill=(247, 201, 74, 255))   # 小星星
    bb = R.shape(32, 37, f)
    face = T('08_02').crop((0, 0, 16, 15)); bb.alpha_composite(face, (2 + 2 + 7, 2 + 7 + 1))   # 勇者頭像（頭＋肩膀）
    return bb
def camera_man():
    sp = T('07_01').copy(); d = ImageDraw.Draw(sp); d.rectangle([10, 8, 15, 12], fill=(38, 43, 68)); d.rectangle([14, 9, 15, 10], fill=(139, 155, 180)); d.rectangle([11, 7, 12, 7], fill=(38, 43, 68)); return sp
def host():
    sp = T('08_01').copy() if False else T('07_04').copy(); d = ImageDraw.Draw(sp)
    d.rectangle([2, 7, 3, 11], fill=(63, 38, 49)); d.rectangle([1, 5, 4, 7], fill=(139, 155, 180)); d.point((2, 5), fill=(192, 203, 220))   # 麥克風
    return sp
def emo(im, k, x, yb, a=1.0):
    e = EMO[k].crop(EMO[k].getbbox())
    if a < 1: e = e.copy(); e.putalpha(e.getchannel('A').point(lambda v: round(v * a)))
    im.alpha_composite(e, (round(x - e.width // 2), round(yb - e.height)))
def tag(im, s, x, y): A.tag(im, s, x, y)

CROWD = ['07_01', '08_03', '08_04', '09_04', '07_04']
def crowd(im, t, xs, y, emo_k=None):
    for i, dx in enumerate(xs):
        x = CX + dx; n = CROWD[i % 5]; sp = T(n); k = int(t * 5 + i * 1.7) % 6; hop = 2 if k == 0 else 1 if k == 1 else 0
        shadow(im, x, y, 5); put(im, sp, x, y, hop)
        if emo_k and (int(t / .9) + i * 2) % 7 == 0: emo(im, emo_k, x + 2, y - 17)

def endorse(im, t):   # 代言：看板在人行道、勇者在看板前換姿勢、攝影師拍照閃光
    put(im, billboard(), CX + 58, 121)
    pose = int(t / 1.2) % 3; hx = CX + 30; sp = T('08_02')
    sp = flip(sp) if pose == 1 else sp; hop = 2 if (t % 1.2) < .12 else 0
    shadow(im, hx, 134); put(im, sp, hx, 134, hop)
    if pose == 2: d = ImageDraw.Draw(im); d.rectangle([hx + 7, 116, hx + 8, 120], fill=(247, 194, 130)); d.point((hx + 7, 115), fill=(63, 38, 49))   # 比讚
    cm = camera_man(); shadow(im, CX - 22, 140); put(im, cm, CX - 22, 140)
    if (t % 1.2) < .15:   # 閃光
        d = ImageDraw.Draw(im); fx, fy = CX - 14, 129
        for a, b in ((0, -5), (0, 5), (-5, 0), (5, 0), (-3, -3), (3, 3), (-3, 3), (3, -3)): d.line([(fx, fy), (fx + a, fy + b)], fill=(255, 255, 255))
        d.rectangle([fx - 1, fy - 1, fx + 1, fy + 1], fill=(255, 255, 255))
    crowd(im, t, [-70, -56, -42, 52, 66, 80], 162)

def variety(im, t):   # 綜藝：主持人拿麥克風、勇者做動作（轉身、跳）、觀眾冒「開心」
    p = t % 2.0; hx = CX + 4; sp = T('08_02'); hop = 0
    if p < .5: sp = flip(sp) if int(p / .12) % 2 else sp           # 轉圈
    elif p < .8: hop = [0, 3, 5, 5, 3, 0][min(5, int((p - .5) / .05))]   # 跳
    shadow(im, hx, 134); put(im, sp, hx, 134, hop)
    h = host(); shadow(im, CX + 28, 134); put(im, flip(h), CX + 28, 134)
    crowd(im, t, [-66, -52, -38, -24, 30, 44, 58, 72], 162, '開心')

def meet(im, t):   # 見粉絲：路人排隊，一個一個上前握手簽名，離開時冒愛心
    hx = CX - 8; shadow(im, hx, 140); put(im, T('08_02'), hx, 140)
    P = 1.8; k = int(t / P); p = (t % P) / P
    # 已經見完、往下走開的那一位
    lx, ly = hx + 18 + p * 4, 140 + p * 30   # 見完的往前（畫面下方）走掉
    if p < .6: shadow(im, lx, ly, 5); put(im, T(CROWD[(k - 1) % 5]), lx, ly); emo(im, '戀愛', lx + 2, ly - 17 - p * 8, 1 - p / .6)
    # 隊伍：第一個在勇者面前，後面往前補
    for i in range(6):
        x = hx + 18 + i * 13 + 13 * (1 - min(1, p / .34)); n = CROWD[(k + i) % 5]
        shadow(im, x, 140, 5); put(im, flip(T(n)), x, 140)
    if .4 < p < .8:   # 握手、簽名
        d = ImageDraw.Draw(im); d.rectangle([hx + 7, 132, hx + 9, 133], fill=(247, 194, 130))
        d.rectangle([hx + 9, 125, hx + 14, 130], fill=(255, 255, 255), outline=(63, 38, 49)); d.line([(hx + 10, 127), (hx + 13, 128)], fill=(63, 38, 49))
    tag(im, '粉絲見面會', CX, 62)

def panel(kind, t):
    im = bg(); {'endorse': endorse, 'variety': variety, 'meet': meet}[kind](im, t); return im.crop((0, TOP, W, VH))

if __name__ == '__main__':
    S = 3; f = ImageFont.truetype(FONT, 22); frames = []; VH2 = VH - TOP
    names = [('endorse', '代言：看板、勇者換姿勢、攝影師閃光、路人圍觀'), ('variety', '綜藝：主持人拿麥克風、勇者轉圈跳、觀眾冒「開心」'), ('meet', '見粉絲：排隊、握手簽名、離開時冒愛心')]
    for i in range(36):
        t = i * .1; out = Image.new('RGBA', (W * S + 20, 3 * (VH2 * S + 40) + 10), (38, 40, 56, 255)); d = ImageDraw.Draw(out)
        for j, (k, cap) in enumerate(names):
            y = 6 + j * (VH2 * S + 40); d.text((10, y), cap, font=f, fill=(230, 230, 230)); out.alpha_composite(panel(k, t).resize((W * S, VH2 * S), Image.NEAREST), (10, y + 32))
        frames.append(out.convert('P', palette=Image.ADAPTIVE, colors=255))
    frames[0].save(sys.argv[1], save_all=True, append_images=frames[1:], duration=100, loop=0)
    frames[9].convert('RGB').save(sys.argv[1].replace('.gif', '.png'))
