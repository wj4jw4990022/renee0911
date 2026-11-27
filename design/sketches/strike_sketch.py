# 草圖動畫：罷工（地方事務所門口舉抗議牌）、接外快（廣場擺小攤子）
import sys, math, random
sys.path.insert(0, '/home/claude/sk_arena'); sys.path.insert(0, '/home/claude/dw/design/rooms'); sys.path.insert(0, '/home/claude/dw/design/wild')
from PIL import Image, ImageDraw, ImageFont
import rooms as R, arena as A, plaza as PL
W, VH, TOP = 260, 170, 56
FONT = '/home/claude/sk_gate/cubic11.ttf'
T, flip, put, shadow = A.T, A.flip, A.put, A.shadow
O = (63, 38, 49)
ANGRY = None
CX = 130

def bg(bld):
    im = PL.bg(); b = Image.open(bld).convert('RGBA')
    d = ImageDraw.Draw(im); d.rectangle([CX - 45, 70, CX + 45, 116], fill=(111, 154, 72))   # 蓋掉廣場
    rnd = random.Random(9)
    for _ in range(60): d.point((rnd.randrange(CX - 45, CX + 45), rnd.randrange(70, 116)), fill=(126, 171, 82))
    im.alpha_composite(b, (CX - b.width // 2, 116 - b.height)); return im

def placard():   # 抗議牌：木棍＋白板，紅字「No!」（遊戲裡用 Cubic11 寫）
    def f(d):
        d.rectangle([11, 13, 12, 26], fill=R.BR)
        d.rectangle([0, 0, 23, 13], fill=(250, 240, 214, 255))
    im = R.shape(24, 27, f); p = im.load(); RD_ = (214, 52, 44, 255)
    GL = ['##...##.......##',   # 手繪像素字「No!」（2 像素粗）
          '###..##.......##',
          '####.##..###..##',
          '##.####.##.##.##',
          '##..###.##.##.##',
          '##...##.##.##...',
          '##...##..###..##']
    for y, row in enumerate(GL):
        for x, c in enumerate(row):
            if c == '#': p[6 + x, 6 + y] = RD_
    return im

def angry_emo():   # 生氣：紅色怒氣符號（遊戲裡用 Kenney 表情泡泡「生氣」）
    im = Image.new('RGBA', (9, 9)); d = ImageDraw.Draw(im); R_ = (232, 69, 55)
    for a, b, c, e in ((1, 3, 3, 1), (5, 1, 7, 3), (1, 5, 3, 7), (5, 7, 7, 5)): d.line([(a, b), (c, e)], fill=R_, width=2)
    return im

def strike(im, t):
    hx, y = CX + 2, 144; p = t % 1.0; up = 3 if p < .5 else 0; step = 1 if int(t / .5) % 2 else 0   # 牌子上下舉、腳跺地
    pl = placard(); shadow(im, hx, y); put(im, T('08_02'), hx, y, step)
    im.alpha_composite(pl, (hx - 6, y - 16 - 22 - up))
    if int(t / 1.5) % 2 == 0: im.alpha_composite(angry_emo().resize((14, 14), Image.NEAREST), (hx - 14, y - 30))
    # 路人經過，停下來看一下
    k = (t / 3.6) % 1; px = CX - 80 + k * 160
    if abs(px - hx) < 22: px = hx - 22 if px < hx else hx + 22
    shadow(im, px, 150); put(im, T('08_04') if px < hx else flip(T('08_04')), px, 150)

def stall():   # 小攤子：紅白條紋遮雨棚、兩支柱子、木頭攤台、上面擺藥水和蘋果
    def f(d):
        d.rectangle([2, 8, 3, 30], fill=R.BR); d.rectangle([44, 8, 45, 30], fill=R.BR)
        for i in range(12): d.rectangle([i * 4, 0, i * 4 + 3, 7], fill=(232, 69, 55, 255) if i % 2 == 0 else (250, 240, 214, 255))
        d.polygon([(0, 7), (47, 7), (47, 9), (0, 9)], fill=(160, 40, 44, 255))
        d.rectangle([0, 24, 47, 30], fill=R.BR); d.rectangle([0, 24, 47, 25], fill=R.OR)
        for x in range(5, 46, 8): d.line([(x, 26), (x, 29)], fill=R.BRd)
    return R.shape(48, 31, f)

def side(im, t):
    sx, y = CX - 62, 136; s = stall()
    hx = sx; put(im, T('08_02'), hx, y - 5)    # 勇者站在攤子後面，露出上半身
    put(im, s, sx, y + 4)
    for i, (n, dx) in enumerate((('09_05', -21), ('09_07', -13), ('09_06', 10))): g = A.T(n).crop((3, 2, 13, 15)); im.alpha_composite(g, (sx + dx, y + 4 - 31 + 2 + 24 - g.height))   # 貨品擺在攤台兩邊
    # 客人：走過來 → 停下買 → 投幣（金色小點跳）→ 走開
    P = 2.4; k = int(t / P); p = (t % P) / P; n = ['07_01', '08_03', '09_04', '07_04'][k % 4]
    if p < .35: cx = sx + 66 - p / .35 * 34
    elif p < .7: cx = sx + 32
    else: cx = sx + 32 + (p - .7) / .3 * 50
    shadow(im, cx, 146); put(im, flip(T(n)) if p < .7 else T(n), cx, 146)
    if .4 < p < .6:
        d = ImageDraw.Draw(im); q = (p - .4) / .2; cy = 124 - math.sin(q * math.pi) * 6; d.rectangle([cx - 10 - q * 6, cy, cx - 8 - q * 6, cy + 2], fill=(247, 201, 74), outline=O)

def panel(kind, t):
    if kind == 'strike': im = bg('/home/claude/sk_arena/office_1.png'); strike(im, t)
    else: im = bg('/home/claude/sk_arena/stage.png'); side(im, t)
    return im.crop((0, TOP, W, VH))

if __name__ == '__main__':
    S = 3; f = ImageFont.truetype(FONT, 22); frames = []; VH2 = VH - TOP
    names = [('strike', '罷工：事務所門口舉抗議牌、跺腳、頭上生氣'), ('side', '接外快：廣場邊擺小攤子，路人來買')]
    for i in range(36):
        t = i * .1; out = Image.new('RGBA', (W * S + 20, 2 * (VH2 * S + 40) + 10), (38, 40, 56, 255)); d = ImageDraw.Draw(out)
        for j, (k, cap) in enumerate(names):
            y = 6 + j * (VH2 * S + 40); d.text((10, y), cap, font=f, fill=(230, 230, 230)); out.alpha_composite(panel(k, t).resize((W * S, VH2 * S), Image.NEAREST), (10, y + 32))
        frames.append(out.convert('P', palette=Image.ADAPTIVE, colors=255))
    frames[0].save(sys.argv[1], save_all=True, append_images=frames[1:], duration=100, loop=0)
    frames[12].convert('RGB').save(sys.argv[1].replace('.gif', '.png'))
