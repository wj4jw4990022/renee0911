# 屋裡的小窗格（v17.47 定案，Kenney Q 版、家具 2 像素粗線）：租屋、自己的房子、診所、酒館
# python3 rooms.py <輸出資料夾>：輸出遊戲用的圖（tools/build_art.py 會呼叫）；python3 rooms.py --sketch x.gif：草圖
import sys, math, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'wild'))
from PIL import Image, ImageDraw, ImageFont
import wild
TT, TD = wild.TT, wild.TD
FONT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cubic11.ttf')   # 只有草圖用（遊戲裡用 Cubic11 網頁字型）
# Kenney 色盤
O = (63, 38, 49, 255); BR = (189, 108, 74, 255); BRd = (118, 59, 54, 255); OR = (234, 165, 108, 255); SK = (247, 194, 130, 255)
GY = (192, 203, 220, 255); GYd = (139, 155, 180, 255); NV = (82, 96, 124, 255); NVd = (38, 43, 68, 255); GR = (37, 149, 106, 255); GRl = (67, 225, 179, 255)
RD = (232, 69, 55, 255); RDd = (160, 40, 44, 255); PU = (155, 76, 163, 255); PUl = (209, 118, 208, 255); WH = (244, 238, 224, 255); YL = (247, 201, 74, 255)
SW, SH_ = 100, 54

def outline(im):   # 外面加一圈 1 像素深色外框（和 Kenney 一樣）
    w, h = im.width + 2, im.height + 2; src = Image.new('RGBA', (w, h)); src.alpha_composite(im, (1, 1)); out = src.copy(); p = src.load(); q = out.load()
    for y in range(h):
        for x in range(w):
            if p[x, y][3] == 0 and any(0 <= x + a < w and 0 <= y + b < h and p[x + a, y + b][3] for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))): q[x, y] = O
    return out
def shape(w, h, fn, thin=False):
    im = Image.new('RGBA', (w, h)); d = ImageDraw.Draw(im); fn(d); return outline(im) if thin else outline(outline(im))
def kt(n, src=TD): return wild.tile(n, src)
def put(sc, im, x, y_bottom): sc.alpha_composite(im, (round(x), round(y_bottom) - im.height))
def lying(n):   # Kenney 小人躺下：頭朝左，眼睛瞇著（眼睛上半格塗成膚色、下半格改成一條橫線）
    im = kt(n); p = im.load(); K = (38, 43, 68)
    eyes = [(x, y) for y in range(16) for x in range(16) if p[x, y][:3] == K and y < 10]
    if eyes:
        top = min(y for x, y in eyes); skin = p[eyes[0][0] - 1, top]
        for x, y in eyes: p[x, y] = skin if y == top else O
        xs = sorted({x for x, y in eyes}); mid = (xs[0] + xs[-1]) / 2
        for x in xs: p[int(x - 1 if x < mid else x + 1), top + 1] = O   # 往外多一格，變成瞇眼的橫線
    return im.rotate(90, expand=True)
def blanket(w, c, cd, patch=False):   # 蓋在身上的被子：從脖子蓋到腳，手不露出來，只露頭
    hi = WH if c == WH else tuple(min(255, v + 40) for v in c[:3]) + (255,)
    def f(d):
        d.rounded_rectangle([0, 0, w - 1, 17], radius=5, fill=c); d.rectangle([0, 12, w - 1, 17], fill=c); d.rectangle([0, 0, 5, 17], fill=c)   # 靠頭那邊方角，蓋住肩膀
        d.line([(3, 1), (w - 6, 1)], fill=hi); d.line([(0, 14), (w - 1, 14)], fill=cd); d.rectangle([0, 16, w - 1, 17], fill=cd)
        if patch: d.rectangle([w - 11, 5, w - 6, 9], fill=(214, 190, 140, 255)); d.point((w - 11, 5), fill=O); d.point((w - 6, 9), fill=O)   # 補丁
    return shape(w, 16, f)

# ---- 家具（補畫，Kenney 色盤＋1 像素外框） ----
def bed(blanket, blanket_d, w=34, big=False):
    def f(d):
        hb = 12 if big else 9
        d.rectangle([0, 0, 3, hb + 8], fill=BR); d.rectangle([1, 1, 2, hb + 7], fill=OR)          # 床頭
        d.rectangle([4, hb - 2, w - 1, hb + 3], fill=blanket); d.rectangle([4, hb + 2, w - 1, hb + 3], fill=blanket_d)   # 被子
        d.rectangle([5, hb - 5, 12, hb - 2], fill=WH); d.line([(5, hb - 2), (12, hb - 2)], fill=GY)   # 枕頭
        d.rectangle([4, hb + 4, w - 1, hb + 6], fill=BR); d.line([(4, hb + 6), (w - 1, hb + 6)], fill=BRd)   # 床架
        d.rectangle([4, hb + 7, 5, hb + 8], fill=BRd); d.rectangle([w - 2, hb + 7, w - 1, hb + 8], fill=BRd)   # 床腳
    return shape(w, (12 if big else 9) + 9, f)
def clinic_bed(w=36):
    def f(d):
        d.rectangle([0, 0, 2, 16], fill=GYd); d.rectangle([w - 3, 4, w - 1, 16], fill=GYd)
        d.rectangle([3, 7, w - 4, 11], fill=WH); d.line([(3, 11), (w - 4, 11)], fill=GY)
        d.rectangle([4, 4, 10, 7], fill=WH); d.rectangle([3, 12, w - 4, 13], fill=GY); d.rectangle([4, 14, 5, 16], fill=GYd); d.rectangle([w - 6, 14, w - 5, 16], fill=GYd)
    return shape(w, 17, f)
def iv():
    def f(d):
        d.rectangle([3, 0, 9, 7], fill=(200, 232, 248, 255)); d.rectangle([4, 4, 8, 7], fill=(140, 200, 236, 255)); d.line([(6, 8), (6, 30)], fill=GYd); d.rectangle([2, 30, 10, 31], fill=GYd)
    return shape(12, 32, f)
def table(w=22, top=OR, leg=BR):
    def f(d): d.rectangle([0, 0, w - 1, 2], fill=top); d.line([(0, 2), (w - 1, 2)], fill=leg); d.rectangle([1, 3, 2, 10], fill=leg); d.rectangle([w - 3, 3, w - 2, 10], fill=leg)
    return shape(w, 11, f)
def mug():
    def f(d): d.rectangle([0, 0, 4, 5], fill=YL); d.rectangle([0, 0, 4, 1], fill=WH)
    m = shape(5, 6, f); g = Image.new('RGBA', (m.width + 3, m.height)); g.alpha_composite(m, (0, 0)); dd = ImageDraw.Draw(g)
    dd.rectangle([m.width - 1, 3, m.width + 1, 7], outline=O)   # 握把
    return g
def counter(w):
    def f(d):
        d.rectangle([0, 0, w - 1, 3], fill=OR); d.line([(0, 3), (w - 1, 3)], fill=BR); d.rectangle([0, 4, w - 1, 15], fill=BR)
        for x in range(6, w - 2, 10): d.line([(x, 5), (x, 14)], fill=BRd)
    return shape(w, 18, f)
def shelf(w):
    def f(d): d.rectangle([0, 0, w - 1, 1], fill=BR); d.line([(0, 1), (w - 1, 1)], fill=BRd)
    return shape(w, 2, f)
def crib():
    def f(d):
        d.rectangle([0, 0, 1, 11], fill=OR); d.rectangle([16, 0, 17, 11], fill=OR); d.rectangle([2, 6, 15, 9], fill=(140, 200, 236, 255)); d.rectangle([2, 10, 15, 11], fill=OR)
        for x in (4, 7, 10, 13): d.line([(x, 2), (x, 9)], fill=OR)
        d.rectangle([3, 4, 6, 6], fill=SK)
    return shape(18, 12, f)
def rug(w):
    def f(d): d.rectangle([0, 0, w - 1, 3], fill=RD); d.rectangle([2, 1, w - 3, 2], fill=YL); d.rectangle([4, 1, w - 5, 2], fill=RD)
    return shape(w, 4, f)
def lamp():
    def f(d): d.polygon([(1, 5), (9, 5), (7, 0), (3, 0)], fill=YL); d.rectangle([4, 6, 6, 9], fill=BR); d.rectangle([2, 10, 8, 11], fill=BR)
    return shape(11, 12, f)
def cross():
    def f(d): d.rectangle([0, 0, 13, 13], fill=WH); d.rectangle([5, 2, 8, 11], fill=RD); d.rectangle([2, 5, 11, 8], fill=RD)
    return shape(14, 14, f)
def stool():
    def f(d): d.rectangle([0, 0, 7, 1], fill=OR); d.rectangle([1, 2, 1, 6], fill=BR); d.rectangle([6, 2, 6, 6], fill=BR)
    return shape(8, 7, f)
def frame_pic():
    def f(d): d.rectangle([0, 0, 13, 10], fill=BR); d.rectangle([2, 2, 11, 8], fill=(140, 200, 236, 255)); d.polygon([(2, 8), (6, 4), (9, 7), (11, 5), (11, 8)], fill=GR)
    return shape(14, 11, f)

# ---- 牆、地板 ----
def wall_tiles(sc, names, y0=0, y1=44):
    for y in range(y0, y1, 16):
        for x in range(0, SW, 16): sc.alpha_composite(kt(names, TT), (x, y))
def plain_wall(sc, c, c2, y1=44, stripe=None):
    d = ImageDraw.Draw(sc); d.rectangle([0, 0, SW, y1], fill=c)
    if stripe:
        for x in range(4, SW, stripe): d.line([(x, 0), (x, y1)], fill=c2)
    d.rectangle([0, y1 - 3, SW, y1], fill=c2)   # 踢腳板
def floor(sc, c, c2, y0=44):
    d = ImageDraw.Draw(sc); d.rectangle([0, y0, SW, SH_], fill=c); d.line([(0, y0), (SW, y0)], fill=O)
    for i, x in enumerate(range(0, SW, 12)): d.line([(x + (i % 2) * 6, y0 + 1), (x + (i % 2) * 6, SH_)], fill=c2)
    d.line([(0, y0 + 5), (SW, y0 + 5)], fill=c2)
def window(sc, x, y, night=True):
    def f(d):
        d.rectangle([0, 0, 15, 13], fill=BR); d.rectangle([2, 2, 13, 11], fill=(27, 35, 64, 255) if night else (142, 198, 240, 255)); d.line([(7, 2), (7, 11)], fill=BR); d.line([(2, 6), (13, 6)], fill=BR)
        if night: d.rectangle([10, 3, 12, 5], fill=(243, 230, 166, 255)); d.point((4, 4), fill=WH)
        else: d.rectangle([3, 3, 5, 4], fill=WH)
    sc.alpha_composite(shape(16, 14, f), (x, y))
def zz(d, x, y, t):
    f = ImageFont.truetype(FONT, 11); k = t % 3
    d.text((x, y - k), 'z', font=f, fill=(207, 216, 255));
    if k: d.text((x + 6, y - 7 - k), 'Z', font=f, fill=(207, 216, 255))

HERO, HERO2 = '08_02', '08_03'

def shabby(sc):   # 租屋的破舊感：牆面剝落、裂縫、蜘蛛網、木板翹起、漏水滴到水桶
    d = ImageDraw.Draw(sc)
    WD = (150, 92, 60, 255)
    for x0, y0, w, h in ((30, 6, 9, 6), (52, 28, 7, 5), (8, 30, 5, 4)):   # 剝落露出的底色
        d.rectangle([x0, y0, x0 + w, y0 + h], fill=(176, 150, 112, 255)); d.rectangle([x0, y0, x0 + w, y0 + h], outline=WD)
    for pts in (((60, 0), (62, 4), (61, 8), (64, 12), (63, 17)), ((22, 14), (25, 17), (24, 21))): d.line(pts, fill=O)   # 裂縫
    for i in range(7): d.line([(0, i * 2), (12 - i * 2, 0)], fill=(220, 220, 220, 150))   # 角落蜘蛛網
    d.line([(0, 0), (9, 9)], fill=(220, 220, 220, 170))
def bucket():
    def f(d): d.rectangle([0, 1, 7, 7], fill=GYd); d.rectangle([1, 1, 6, 2], fill=(110, 170, 220, 255)); d.line([(0, 4), (7, 4)], fill=NV)
    return shape(8, 8, f)
def sc_sleep(t):   # 租屋：舊木牆、窄床、小檯燈，牆面剝落、窗戶破一角、漏水
    sc = Image.new('RGBA', (SW, SH_)); wall_tiles(sc, '06_01'); floor(sc, (118, 59, 54, 255), (96, 46, 44, 255)); shabby(sc)
    d = ImageDraw.Draw(sc); d.polygon([(44, 45), (56, 45), (56, 43)], fill=(150, 80, 60, 255)); d.line([(44, 45), (56, 43)], fill=O)   # 翹起的地板
    window(sc, 74, 8); d.polygon([(86, 11), (90, 11), (90, 15)], fill=(60, 70, 100, 255)); d.line([(86, 11), (90, 15)], fill=WH)   # 窗玻璃破一角
    b = bed((122, 140, 106, 255), (90, 104, 80, 255)); put(sc, b, 6, 48)
    put(sc, lying(HERO), 9, 38)       # 勇者躺在床上（頭在枕頭）
    put(sc, blanket(26, (122, 140, 106, 255), (90, 104, 80, 255), patch=True), 19, 42)   # 舊被子有補丁，從脖子蓋到腳
    put(sc, stool(), 50, 48); put(sc, lamp(), 48, 41)
    put(sc, bucket(), 66, 49); drip = (t * 3) % 30
    if drip < 24: d.rectangle([69, 2 + drip, 69, 3 + drip], fill=(140, 200, 236, 255))   # 天花板漏水
    zz(d, 24, 12, t); return sc

def sc_rest(t):   # 自己的房子：石牆、大床、地毯、掛畫，勇者在桌邊
    sc = Image.new('RGBA', (SW, SH_)); wall_tiles(sc, '06_05'); floor(sc, BR, BRd)
    window(sc, 74, 8, night=False); put(sc, frame_pic(), 34, 22)
    put(sc, bed(RD, RDd, 38, big=True), 4, 48); put(sc, rug(36), 44, 51)
    put(sc, table(22), 62, 48); put(sc, mug(), 66, 38); put(sc, crib(), 80, 48)
    bob = (t // 4) % 2
    put(sc, kt(HERO), 50, 48 - bob)
    return sc

def sc_clinic(t):   # 診所：白牆、病床、點滴、醫生
    sc = Image.new('RGBA', (SW, SH_)); plain_wall(sc, (223, 230, 234, 255), (184, 194, 200, 255), stripe=10); floor(sc, (184, 194, 200, 255), (160, 170, 180, 255))
    put(sc, cross(), 66, 22); window(sc, 82, 8, night=False)
    cb = clinic_bed(); put(sc, cb, 8, 48)
    put(sc, lying(HERO), 10, 38)
    put(sc, blanket(24, WH, GY), 20, 43)   # 白被單，從脖子蓋到腳
    d = ImageDraw.Draw(sc); d.rectangle([11, 25, 12, 34], fill=WH); d.point((11, 28), fill=RD)   # 頭上纏繃帶
    put(sc, iv(), 46, 48); put(sc, kt('08_04'), 62, 48)    # 醫生（不具名）
    return sc

def sc_tavern(t):   # 酒館：吧台、酒瓶、酒保、客人，勇者舉杯
    sc = Image.new('RGBA', (SW, SH_)); wall_tiles(sc, '06_01'); floor(sc, (96, 46, 44, 255), (74, 36, 34, 255))
    for x in (6, 30, 54): put(sc, shelf(18), x, 14)
    for i, n in enumerate(['09_05', '09_06', '09_07', '09_08', '09_06', '09_07', '09_07', '09_05', '09_08']): put(sc, kt(n).crop((3, 2, 13, 15)), 6 + (i % 3) * 6 + (i // 3) * 24, 13)
    window(sc, 80, 8)
    put(sc, kt('07_04'), 22, 34)    # 酒保（站在吧台後面）
    put(sc, counter(60), 2, 48)
    for x in (10, 44): put(sc, mug(), x, 32)
    put(sc, stool(), 70, 48); put(sc, stool(), 86, 48)
    up = (t // 7) % 2
    put(sc, kt(HERO), 66, 44); put(sc, mug(), 78, 34 - up * 3)
    put(sc, kt('07_02'), 84, 44)    # 客人
    if up: ImageDraw.Draw(sc).text((62, 20), '♪', font=ImageFont.truetype(FONT, 11), fill=(243, 200, 106))
    return sc

CAP = {'sleep': '勇者睡得很熟', 'rest': '勇者在家休息', 'clinic': '勇者躺在診所的病床上', 'tavern': '勇者在酒館喝一杯'}
def pip(scene, cap):   # 和遊戲一樣：200×130 金框，場景放大 2 倍，下方說明列
    W0, H0 = 200, 130; im = Image.new('RGBA', (W0 + 6, H0 + 6), (217, 180, 90, 255)); im.paste((43, 34, 56, 255), (3, 3, W0 + 3, H0 + 3))
    im.alpha_composite(scene.resize((SW * 2, SH_ * 2), Image.NEAREST), (3, 3))
    d = ImageDraw.Draw(im); d.rectangle([3, 111, W0 + 2, H0 + 2], fill=(26, 20, 36)); f = ImageFont.truetype(FONT, 11); w = d.textlength(cap, font=f); d.text((3 + W0 / 2 - w / 2, 115), cap, font=f, fill=(232, 220, 176)); return im

def sheet(t):
    S = 2; items = [('租屋・睡覺', sc_sleep), ('自己的房子・休息', sc_rest), ('診所・住院', sc_clinic), ('酒館', sc_tavern)]
    keys = ['sleep', 'rest', 'clinic', 'tavern']
    out = Image.new('RGBA', (2 * (206 * S + 20) + 20, 2 * (136 * S + 40) + 20), (38, 40, 56, 255)); d = ImageDraw.Draw(out); f = ImageFont.truetype(FONT, 22)
    for i, ((n, fn), k) in enumerate(zip(items, keys)):
        x = 20 + (i % 2) * (206 * S + 20); y = 10 + (i // 2) * (136 * S + 40)
        d.text((x, y), n, font=f, fill=(230, 230, 230)); out.alpha_composite(pip(fn(t), CAP[k]).resize((206 * S, 136 * S), Image.NEAREST), (x, y + 30))
    return out


# ---- 遊戲用：背景（100×54，不含窗戶、家具、人）＋每個家具一張（左上角就是畫的位置，座標寫在 map.js 的 PIP_DRAW） ----
def win_img(night, broken):
    sc = Image.new('RGBA', (24, 22)); window(sc, 0, 0, night)
    if broken:
        d = ImageDraw.Draw(sc); d.polygon([(12, 3), (16, 3), (16, 7)], fill=(60, 70, 100, 255)); d.line([(12, 3), (16, 7)], fill=WH)
    return sc.crop(sc.getbbox())
def bg_rent():
    sc = Image.new('RGBA', (SW, SH_)); wall_tiles(sc, '06_01'); floor(sc, (118, 59, 54, 255), (96, 46, 44, 255)); shabby(sc)
    d = ImageDraw.Draw(sc); d.polygon([(44, 45), (56, 45), (56, 43)], fill=(150, 80, 60, 255)); d.line([(44, 45), (56, 43)], fill=O); return sc
def bg_house():
    sc = Image.new('RGBA', (SW, SH_)); wall_tiles(sc, '06_05'); floor(sc, BR, BRd); return sc
def bg_clinic():
    sc = Image.new('RGBA', (SW, SH_)); plain_wall(sc, (223, 230, 234, 255), (184, 194, 200, 255), stripe=10); floor(sc, (184, 194, 200, 255), (160, 170, 180, 255)); return sc
def bg_tavern():
    sc = Image.new('RGBA', (SW, SH_)); wall_tiles(sc, '06_01'); floor(sc, (96, 46, 44, 255), (74, 36, 34, 255))
    for x in (6, 30, 54): put(sc, shelf(18), x, 14)
    for i, n in enumerate(['09_05', '09_06', '09_07', '09_08', '09_06', '09_07', '09_07', '09_05', '09_08']): put(sc, kt(n).crop((3, 2, 13, 15)), 6 + (i % 3) * 6 + (i // 3) * 24, 13)
    return sc
def flask():
    im = kt('09_06'); return im.crop(im.getbbox())
def dummy():   # 稻草人（特訓用）：木柱、橫桿、稻草頭和身體、綁繩
    def f(d):
        d.rectangle([7, 4, 8, 26], fill=BR); d.rectangle([0, 9, 15, 11], fill=BR)
        d.ellipse([3, 0, 12, 8], fill=(234, 196, 110, 255)); d.rectangle([4, 10, 11, 19], fill=(234, 196, 110, 255))
        d.line([(4, 13), (11, 13)], fill=BRd); d.line([(4, 17), (11, 17)], fill=BRd); d.point((6, 4), fill=O); d.point((9, 4), fill=O)
    return shape(16, 27, f)
def billboard():   # 代言看板：木框、兩支腳、紅色橫條、淺藍大頭貼底、三顆小星星
    def f(d):
        d.rectangle([3, 25, 4, 36], fill=BR); d.rectangle([27, 25, 28, 36], fill=BR)
        d.rectangle([0, 0, 31, 26], fill=BR); d.rectangle([2, 2, 29, 24], fill=(250, 240, 214, 255))
        d.rectangle([2, 2, 29, 5], fill=RD); d.rectangle([7, 7, 24, 23], fill=(142, 198, 240, 255))
        for x, y in ((4, 9), (26, 12), (4, 19)): d.rectangle([x, y, x + 1, y + 1], fill=YL)
    return shape(32, 37, f)
def cam_man():   # 攝影師：路人拿相機
    sp = kt('07_01').copy(); d = ImageDraw.Draw(sp); d.rectangle([10, 8, 15, 12], fill=NVd); d.rectangle([14, 9, 15, 10], fill=GYd); d.rectangle([11, 7, 12, 7], fill=NVd); return sp
def host():   # 主持人：拿麥克風
    sp = kt('07_04').copy(); d = ImageDraw.Draw(sp); d.rectangle([2, 7, 3, 11], fill=O); d.rectangle([1, 5, 4, 7], fill=GYd); d.point((2, 5), fill=GY); return sp
def items():
    RB, RBd = (122, 140, 106, 255), (90, 104, 80, 255)
    return {
      'bg_rent':bg_rent(), 'bg_house':bg_house(), 'bg_clinic':bg_clinic(), 'bg_tavern':bg_tavern(),
      'win_d':win_img(False, False), 'win_n':win_img(True, False), 'winR_d':win_img(False, True), 'winR_n':win_img(True, True),
      'bed_rent':bed(RB, RBd), 'bed_house':bed(RD, RDd, 38, big=True), 'bed_clinic':clinic_bed(),
      'blk_rent':blanket(26, RB, RBd, patch=True), 'blk_house':blanket(30, RD, RDd), 'blk_clinic':blanket(24, WH, GY),
      'stool':stool(), 'lamp':lamp(), 'bucket':bucket(), 'table':table(22), 'mug':mug(), 'crib':crib(), 'rug':rug(36), 'pic':frame_pic(),
      'cross':cross(), 'iv':iv(), 'counter':counter(60), 'flask':flask(),
      'doctor':kt('08_04'), 'barkeep':kt('07_04'), 'patron':kt('07_02'),
      # v17.49 鬥技場：對手、教練、觀眾（不具名路人，Kenney 原圖）、稻草人
      'foe_viking':kt('07_03'), 'foe_knight':kt('08_01'), 'foe_archer':kt('09_04'), 'coach':kt('07_02'),
      'cw0':kt('07_01'), 'cw1':kt('08_03'), 'cw2':kt('08_04'), 'cw3':kt('09_04'), 'cw4':kt('07_04'),
      'dummy':dummy(),
      # v17.51 廣場：代言看板（大頭貼在遊戲裡貼：看板左上角往右 11、往下 10，16×15）、攝影師、主持人
      'billboard':billboard(), 'cam_man':cam_man(), 'host':host(),
    }
if __name__ == '__main__':
    if sys.argv[1] == '--sketch':
        out = sys.argv[2]; fr = [sheet(t).convert('P', palette=Image.ADAPTIVE, colors=255) for t in range(14)]
        fr[0].save(out, save_all=True, append_images=fr[1:], duration=250, loop=0)
    else:
        out = sys.argv[1]; os.makedirs(out, exist_ok=True)
        for k, im in items().items(): im.save(f'{out}/{k}.png')
        print('ok')
