# 草圖動畫：鬥技場（任務對打、武鬥大會、特訓），村子路面＋鬥技場建築
import sys, math, random
sys.path.insert(0, '/home/claude/dw/design/rooms'); sys.path.insert(0, '/home/claude/dw/design/wild')
from PIL import Image, ImageDraw, ImageFont
import rooms as R, wild
TD = wild.TD; W, VH = 260, 170
FONT = '/home/claude/sk_gate/cubic11.ttf'
O = (63, 38, 49)
def T(n): return Image.open(TD + n + '.png').convert('RGBA')
def recolor(im, fn):
    im = im.copy(); p = im.load()
    for y in range(im.height):
        for x in range(im.width):
            c = p[x, y]
            if c[3] and c[:3] != O: p[x, y] = fn(c)
    return im
WHITE = lambda im: recolor(im, lambda c: (255, 255, 255, 255))
RED = lambda im: recolor(im, lambda c: tuple(round(c[i] * .55 + (255, 74, 74)[i] * .45) for i in range(3)) + (255,))
def flip(im): return im.transpose(Image.FLIP_LEFT_RIGHT)

def bg(tour=False):
    im = Image.new('RGBA', (W, VH), (111, 154, 72, 255)); d = ImageDraw.Draw(im); rnd = random.Random(5)
    for _ in range(500): d.point((rnd.randrange(W), rnd.randrange(VH)), fill=rnd.choice([(126, 171, 82), (95, 138, 62), (134, 182, 90)]))
    d.rectangle([0, 116, W, 152], fill=(184, 154, 110)); d.rectangle([0, 116, W, 117], fill=(163, 134, 92)); d.rectangle([0, 151, W, 152], fill=(163, 134, 92))
    for r, y in enumerate(range(120, 150, 6)):
        for x in range((r % 2) * 5, W, 10): d.rectangle([x + 1, y + 1, x + 8, y + 4], fill=(196, 167, 122) if (x + y) % 3 else (191, 162, 116))
    a = Image.open('/home/claude/dw/design/buildings/village/arena.png').convert('RGBA'); im.alpha_composite(a, (130 - a.width // 2, 116 - a.height))
    d.rectangle([125, 100, 134, 116], fill=(168, 135, 94)); d.rectangle([126, 100, 133, 116], fill=(184, 154, 110))   # 小徑
    if tour:   # 武鬥大會：彩旗串＋兩支大旗
        for i in range(27):
            x = 4 + i * 9.6; y = 86 + math.sin(i / 26 * math.pi) * -6 + (i % 2)
            c = [(232, 69, 55), (247, 201, 74), (67, 160, 220), (67, 225, 179)][i % 4]
            d.polygon([(x, y), (x + 6, y), (x + 3, y + 5)], fill=c, outline=O)
        d.line([(4, 86), (W - 4, 86)], fill=O)
        for fx in (60, 200):
            d.rectangle([fx, 70, fx + 1, 116], fill=O); d.polygon([(fx + 2, 70), (fx + 16, 74), (fx + 2, 80)], fill=(232, 69, 55), outline=O)
    return im

def put(im, sp, x, foot, hop=0): im.alpha_composite(sp, (round(x) - sp.width // 2, round(foot) - sp.height - hop))
def shadow(im, x, y, w=6): o = Image.new('RGBA', im.size); ImageDraw.Draw(o).ellipse([x - w, y - 2, x + w, y + 1], fill=(0, 0, 0, 50)); im.alpha_composite(o)

CROWD = ['07_01', '08_03', '08_04', '09_04', '07_04', '07_01', '08_03', '09_04']
def crowd(im, t, rows):
    for r, (y, xs) in enumerate(rows):
        for i, x in enumerate(xs):
            n = CROWD[(i + r * 3) % len(CROWD)]; sp = T(n)
            sp = sp if x > 130 else flip(sp)   # 面向場中
            k = int(t * 5 + i * 1.7 + r) % 6; hop = 2 if k == 0 else 1 if k == 1 else 0   # 歡呼：輪流跳一下
            shadow(im, x, y, 5); put(im, sp, x, y, hop)

def fight(im, t, foe_n, HX=112, FX=148, Y=142):
    """一回合 1.2 秒：勇者踏步揮擊 → 對手閃白擊退 →（對手回擊 → 勇者閃紅後退）"""
    hero, foe = T('08_02'), flip(T(foe_n)); sw = T('08_08').rotate(-60, Image.NEAREST)
    r = int(t / 1.2); p = t % 1.2; hx, fx, fo, he, sword = HX, FX, foe, hero, False
    if .1 < p < .38: hx += 3; sword = True
    if .3 < p < .52: fo = WHITE(foe) if p < .42 else foe; fx += 2
    if r % 2 == 1 and .65 < p < .95: fx -= 4 if p < .8 else 2   # 對手回擊（隔一回合一次）
    if r % 2 == 1 and .75 < p < 1.0: he = RED(hero); hx -= 2
    shadow(im, hx, Y); shadow(im, fx, Y)
    put(im, he, hx, Y); put(im, fo, fx, Y)
    if sword: im.alpha_composite(sw, (hx + 2, Y - 19))
    if .3 < p < .42:   # 命中的小星
        d = ImageDraw.Draw(im); cx, cy = fx - 6, Y - 10
        for a, b in ((0, -3), (0, 3), (-3, 0), (3, 0)): d.line([(cx, cy), (cx + a, cy + b)], fill=(255, 246, 160))

def dummy():
    def f(d):
        d.rectangle([7, 4, 8, 26], fill=R.BR)                      # 柱子
        d.rectangle([0, 9, 15, 11], fill=R.BR)                     # 橫桿（手）
        d.ellipse([3, 0, 12, 8], fill=(234, 196, 110, 255))        # 稻草頭
        d.rectangle([4, 10, 11, 19], fill=(234, 196, 110, 255))    # 稻草身
        d.line([(4, 13), (11, 13)], fill=R.BRd); d.line([(4, 17), (11, 17)], fill=R.BRd)   # 綁繩
        d.point((6, 4), fill=O); d.point((9, 4), fill=O)
    return R.shape(16, 27, f)

def train(im, t):
    hero = T('08_02'); sw = T('08_08').rotate(-60, Image.NEAREST); dm = dummy(); coach = T('07_02')
    p = t % 1.0; hx, sword, tilt = 116, False, 0
    if .1 < p < .35: hx += 3; sword = True
    if .3 < p < .55: tilt = 8 if p < .42 else 4
    shadow(im, hx, 142); put(im, hero, hx, 142)
    if sword: im.alpha_composite(sw, (hx + 2, 142 - 19))
    shadow(im, 140, 142, 7); d2 = dm.rotate(-tilt, Image.NEAREST, center=(dm.width // 2, dm.height - 1)); put(im, d2, 140, 143)
    if .3 < p < .45:   # 稻草飛出來
        d = ImageDraw.Draw(im)
        for i in range(4): k = (p - .3) / .15; d.point((142 + i * 2 + k * 4, 126 - i + k * (i - 1) * 3), fill=(234, 196, 110))
    shadow(im, 168, 140); put(im, coach, 168, 140)
    if int(t / 2) % 2 == 0:   # 教練偶爾點頭：「好！」
        f = ImageFont.truetype(FONT, 11); d = ImageDraw.Draw(im); d.rectangle([160, 108, 177, 121], fill=(255, 255, 255), outline=O); d.text((163, 109), '好', font=f, fill=O)

def tag(im, s, x, y, c=(242, 193, 78)):
    f = ImageFont.truetype(FONT, 11); d = ImageDraw.Draw(im); w = d.textlength(s, font=f)
    d.rectangle([x - w / 2 - 3, y - 1, x + w / 2 + 2, y + 12], fill=(26, 20, 36)); d.text((x - w / 2, y), s, font=f, fill=c)

def panel(kind, t):
    im = bg(kind == 'tour')
    if kind == 'arena':
        crowd(im, t, [(122, [86, 98, 162, 174]), (164, [70, 84, 98, 112, 148, 162, 176, 190])])
        fight(im, t, '07_03')
    elif kind == 'tour':
        crowd(im, t, [(122, [62, 74, 86, 98, 162, 174, 186, 198]), (164, [40, 54, 68, 82, 96, 110, 150, 164, 178, 192, 206, 220])])
        fight(im, t, '08_01'); tag(im, '武鬥大會・八強', 130, 58)
    else:
        crowd(im, t, [(164, [92, 106, 176])]); train(im, t)
    return im.crop((0, 56, W, VH))

if __name__ == '__main__':
    S = 3; f = ImageFont.truetype(FONT, 22); frames = []
    names = [('arena', '鬥技場任務：對手（路人）＋觀眾歡呼'), ('tour', '武鬥大會：彩旗、大旗、觀眾多一排'), ('train', '特訓：打稻草人、教練在旁邊')]
    for i in range(30):
        t = i * .1; VH2 = VH - 56; out = Image.new('RGBA', (W * S + 20, 3 * (VH2 * S + 40) + 10), (38, 40, 56, 255)); d = ImageDraw.Draw(out)
        for j, (k, cap) in enumerate(names):
            y = 6 + j * (VH2 * S + 40); d.text((10, y), cap, font=f, fill=(230, 230, 230)); out.alpha_composite(panel(k, t).resize((W * S, VH2 * S), Image.NEAREST), (10, y + 32))
        frames.append(out.convert('P', palette=Image.ADAPTIVE, colors=255))
    frames[0].save(sys.argv[1], save_all=True, append_images=frames[1:], duration=100, loop=0)
    frames[3].convert('RGB').save(sys.argv[1].replace('.gif', '.png'))
