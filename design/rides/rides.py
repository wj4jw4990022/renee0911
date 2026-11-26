# 馬、驛馬車（v17.39 定案）：照勇者的 Kenney Tiny Q 版畫法，側面朝右，1 像素深色外框、平塗兩階
# 用法：python3 rides.py <輸出資料夾>   → horse_run_0..3、horse_runF_0..3（騎馬時蓋在勇者前面的那層）、horse_stand、coach_0..3
# 勇者的馬：棕色，跳躍式跑法（前腳一起往前、後腳一起往後蹬高）；拉車的馬：灰白色，走路
import sys, os, math
from PIL import Image, ImageDraw
OUT = '#3f2631'
BROWN = {'H':'#bd6c4a','h':'#763b36','o':'#eaa56c','k':'#262b44','#':OUT}
GRAY  = {'H':'#c0cbdc','h':'#8b9bb4','o':'#ffffff','k':'#52607c','#':OUT}
BASE = [
"..............kk......",
".............kkHo.....",
"............kkHHHHo...",
"............kHHHkHHH..",
"............kHHHHHHHH.",
"...........kkHHHHHhhh.",
"...........kHHHH..hh..",
"..k.oooooookHHHH......",
".kkHHHHHHHHHHHHH......",
".kkHHHHHHHHHHHHH......",
"..kHHHHHHHHHHHHH......",
"..khHHHHHHHHHHHh......",
"...hhhhhhhhhhhhh......",
]
def outline(g):
    Hh = len(g); W = len(g[0]); o = [r[:] for r in g]
    for y in range(Hh):
        for x in range(W):
            if g[y][x] is None and any(0 <= x+a < W and 0 <= y+b < Hh and g[y+b][x+a] for a, b in ((1,0),(-1,0),(0,1),(0,-1))): o[y][x] = '#'
    return o
def img(grid, cm):
    im = Image.new('RGBA', (len(grid[0]), len(grid)))
    for y, r in enumerate(grid):
        for x, c in enumerate(r):
            if c: im.putpixel((x, y), tuple(int(cm.get(c, c)[i:i+2], 16) for i in (1, 3, 5)) + (255,))
    return im
# 走路：對角兩腳一起前後（拉車的馬、站著的馬用第 0 格）
def walk(f, pad=2):
    W = len(BASE[0]) + pad*2; Hh = len(BASE) + 4 + pad*2
    g = [[None]*W for _ in range(Hh)]; bob = 1 if f in (1, 3) else 0
    for y, row in enumerate(BASE):
        for x, ch in enumerate(row):
            if ch != '.': g[y+pad+bob][x+pad] = ch
    sw = [(1,-1),(0,0),(-1,1),(0,0)][f]
    for (x, o, c) in ((6, sw[1], 'h'), (12, sw[0], 'h'), (3, sw[0], 'H'), (15, sw[1], 'H')):
        for y in range(13+bob, 16):
            for xx in (x+o, x+o+1): g[y+pad][xx+pad] = c
        for xx in (x+o, x+o+1): g[16+pad][xx+pad] = 'k'
    return outline(g)
# 跑：收腳 → 後腳往後上方蹬 → 伸展騰空 → 前腳落地
GAIT = [(-2, 2, 1, 0), (1, -3, 1, 1), (3, -5, 0, 3), (1, 1, 1, 0)]   # 前腳位移、後腳位移、身體高度（0＝騰空最高）、後蹄抬高
RUN_PAD = 2; RUN_X = RUN_PAD + 2
def run(f):
    fo, bo, lift, kick = GAIT[f]; pad = RUN_PAD
    W = len(BASE[0]) + pad*2 + 4; Hh = len(BASE) + 4 + pad*2 + 2
    g = [[None]*W for _ in range(Hh)]; oy = pad + lift
    for y, row in enumerate(BASE):
        for x, ch in enumerate(row):
            if ch != '.': g[y+oy][x+RUN_X] = ch
    top = 13 + oy
    for (x, o, c) in ((6, bo - (1 if bo else 0), 'h'), (12, fo - (1 if fo > 0 else 0), 'h'), (3, bo, 'H'), (15, fo, 'H')):
        L = 4; rise = kick if x in (3, 6) else 0
        for i in range(L):
            y = top + i - round(rise * (i+1) / L); s = round(o * (i+1) / L); xx = x + RUN_X + s
            for d in (0, 1):
                if 0 <= y < Hh and 0 <= xx+d < W: g[y][xx+d] = 'k' if i == L-1 else c
    return outline(g), lift
def coach(f):
    # 車廂：紅身、木頭車頂、金邊、兩扇窗；大木輪輻條「十／X」交替；前面接灰白馬（走路）
    BODY = [
    ".....yyyyyyyyyyyyyyyyy......",
    "....hhhhhhhhhhhhhhhhhhh.....",
    "....hHHHHHHHHHHHHHHHHHh.....",
    "....rrrrrrrrrrrrrrrrrrr.....",
    "....rrhhhhhrrrrrhhhhhrr.....",
    "....rrhgggGrrrrrhgggGrr.....",
    "....rrhgGGGrrrrrhgGGGrr.....",
    "....rrhGGGGrrrrrhGGGGrr.....",
    "....rrrrrrrrrrrrrrrrrrrHHHHH",
    "....RRyRRRRRRRRRRRRRyRRhhhhh",
    "....RRRRRRRRRRRRRRRRRRR.....",
    ".....hhhhhhhhhhhhhhhhh......",
    ]
    CM = {'r':'#e84537','R':'#a8322a','h':'#763b36','H':'#bd6c4a','o':'#eaa56c','y':'#f2c14e','k':'#262b44','#':OUT,'g':'#9fd0ff','G':'#5a8ac0'}
    W, Hh = 32, 22; g = [[None]*W for _ in range(Hh)]; b = f % 2
    for y, row in enumerate(BODY):
        for x, ch in enumerate(row):
            if ch != '.': g[y+2+b][x+1] = ch
    for cx in (9, 21):
        cy = 16
        for dy in range(-4, 5):
            for dx in range(-4, 5):
                r = math.hypot(dx, dy)
                if r <= 4.3: g[cy+dy][cx+dx] = 'h' if r > 3.2 else None
        a0 = [0, 45][f % 2]
        for a in (a0, a0+90):
            for k in (range(-3, 4) if a0 == 0 else range(-2, 3)):
                g[cy+round(math.sin(math.radians(a))*k)][cx+round(math.cos(math.radians(a))*k)] = 'o'
        g[cy][cx] = 'y'
    cb = img(outline(g), CM)
    im = Image.new('RGBA', (62, 36)); hz = img(walk(f), GRAY); lift = 1 if f in (1, 3) else 0
    im.alpha_composite(cb, (0, 8)); d = ImageDraw.Draw(im)
    d.line((30, 19+b, 34, 22+lift), fill=(63, 38, 49)); d.line((30, 20+b, 34, 23+lift), fill=(118, 59, 54))   # 車轅
    im.alpha_composite(hz, (30, 10))
    return im
def foot_crop(im, bottom):
    return im.crop((0, 0, im.width, bottom + 1))
if __name__ == '__main__':
    out = sys.argv[1]; os.makedirs(out, exist_ok=True)
    for f in range(4):
        g, lift = run(f); im = img(g, BROWN)
        FOOT = 16 + RUN_PAD + 1 + 1   # 著地時蹄的那一列下面的外框
        im = foot_crop(im, FOOT); im.save(f'{out}/horse_run_{f}.png')
        # 騎馬時蓋在勇者前面：馬背以下（BASE 第 8 列起）＋脖子和頭（BASE 第 12 欄起）
        fr = im.copy(); p = fr.load()
        for y in range(fr.height):
            for x in range(fr.width):
                if not (y >= 8 + RUN_PAD + lift or x >= 12 + RUN_X): p[x, y] = (0, 0, 0, 0)
        fr.save(f'{out}/horse_runF_{f}.png')
        cimg = coach(f); bb = cimg.getbbox(); cimg.crop((0, 0, cimg.width, bb[3])).save(f'{out}/coach_{f}.png')
    st = img(walk(0), BROWN); st.crop((0, 0, st.width, st.getbbox()[3])).save(f'{out}/horse_stand.png')
    print('ok')
