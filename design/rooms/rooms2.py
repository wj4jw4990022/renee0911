# 屋裡小窗格第二批（v17.55 定案）（事務所、紮營、臥底／失聯、地下夜班、私事、回老家）
import sys, math, random
import os; _D = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, _D); sys.path.insert(0, os.path.join(_D, '..', 'wild'))
from PIL import Image, ImageDraw, ImageFont
import rooms as R, wild
from rooms import *   # 色盤、shape、put、kt、window、floor…
FONT = os.path.join(_D, 'cubic11.ttf')
HERO = '08_02'
def flip(im): return im.transpose(Image.FLIP_LEFT_RIGHT)
def dark(im, k=.45, tint=(20, 24, 48)):
    im = im.copy(); p = im.load()
    for y in range(im.height):
        for x in range(im.width):
            c = p[x, y]
            if c[3]: p[x, y] = tuple(round(c[i] * (1 - k) + tint[i] * k) for i in range(3)) + (c[3],)
    return im

# ---------- 事務所：奶油色牆、委託告示板、書架、辦公桌（文件、羽毛筆）、櫃檯小姐 ----------
def board():
    def f(d):
        d.rectangle([0, 0, 29, 19], fill=BR); d.rectangle([2, 2, 27, 17], fill=(214, 170, 110, 255))
        for x, y, c in ((4, 4, WH), (12, 3, (250, 230, 160, 255)), (20, 5, WH), (6, 11, (250, 230, 160, 255)), (15, 10, WH), (22, 12, WH)):
            d.rectangle([x, y, x + 5, y + 5], fill=c); d.point((x + 2, y), fill=RD)
    return shape(30, 20, f)
def bookshelf():
    def f(d):
        d.rectangle([0, 0, 17, 25], fill=BR)
        for r, y in enumerate((2, 10, 18)):
            d.rectangle([2, y, 15, y + 5], fill=BRd)
            for i, c in enumerate([RD, NV, GR, YL, PU, RD]):
                if (i + r) % 5: d.rectangle([2 + i * 2 + (i > 2), y + 1 + (i + r) % 2, 3 + i * 2 + (i > 2), y + 5], fill=c)
    return shape(18, 26, f)
def desk():
    def f(d):
        d.rectangle([0, 0, 33, 3], fill=OR); d.rectangle([0, 3, 33, 12], fill=BR); d.rectangle([3, 5, 14, 10], fill=BRd); d.rectangle([8, 7, 9, 8], fill=YL)
    return shape(34, 13, f)
def papers():
    def f(d): d.rectangle([0, 2, 6, 5], fill=WH); d.rectangle([1, 0, 7, 3], fill=WH); d.line([(2, 1), (6, 1)], fill=GY); d.rectangle([11, 1, 13, 4], fill=NVd); d.line([(14, 0), (16, -3)], fill=WH)
    return shape(17, 6, f, thin=True)
def sc_office(t):
    sc = Image.new('RGBA', (SW, SH_)); plain_wall(sc, (236, 222, 190, 255), (206, 186, 146, 255), stripe=None); floor(sc, BR, BRd)
    put(sc, board(), 6, 28); put(sc, bookshelf(), 78, 46); window(sc, 40, 6, night=False)
    put(sc, kt('08_03'), 60, 36)          # 櫃檯小姐（不具名）
    put(sc, desk(), 50, 49); put(sc, papers(), 56, 35)
    put(sc, kt(HERO), 30, 48)             # 勇者站在桌前
    d = ImageDraw.Draw(sc)
    if (t // 4) % 2: d.rectangle([66, 30, 66, 33], fill=O)   # 櫃檯小姐在寫字（筆一動一動）
    return sc

# ---------- 紮營：夜空、月亮、星星、遠處樹影、帳篷、營火、勇者睡袋 ----------
def tent():
    def f(d):
        d.polygon([(0, 22), (17, 0), (34, 22)], fill=(110, 140, 80, 255)); d.polygon([(17, 0), (34, 22), (24, 22)], fill=(80, 108, 60, 255))
        d.polygon([(12, 22), (17, 9), (22, 22)], fill=(38, 43, 68, 255)); d.line([(17, 0), (17, 22)], fill=(60, 80, 44, 255))
    return shape(35, 23, f)
def campfire(t):
    im = Image.new('RGBA', (18, 18)); d = ImageDraw.Draw(im); k = t % 3
    d.polygon([(3, 6 + k % 2), (9, 0 + k), (15, 6 + (k + 1) % 2), (13, 12), (5, 12)], fill=(240, 138, 48, 255))
    d.polygon([(6, 8), (9, 3 + k), (12, 8), (11, 12), (7, 12)], fill=(247, 210, 90, 255))
    out = Image.new('RGBA', (22, 22)); out.alpha_composite(outline(outline(im)), (0, 0))
    logs = shape(16, 4, lambda d: (d.line([(0, 3), (15, 0)], fill=BR, width=2), d.line([(0, 0), (15, 3)], fill=BRd, width=2)))
    out.alpha_composite(logs, (1, 13)); return out
def bedroll(c=(170, 80, 60, 255), cd=(120, 52, 40, 255)):
    return blanket(22, c, cd)
def sc_camp(t):
    sc = Image.new('RGBA', (SW, SH_), (20, 28, 52, 255)); d = ImageDraw.Draw(sc)
    for i in range(14):
        if (t // 2 + i) % 5: d.point(((i * 37) % 100, (i * 13) % 28), fill=WH)
    d.ellipse([82, 4, 89, 11], fill=(243, 230, 166)); d.ellipse([85, 3, 91, 10], fill=(20, 28, 52))
    IT = wild.items()
    for x in (-4, 14, 70, 90): put(sc, dark(IT['treeM'], .55), x, 40)
    d.rectangle([0, 38, SW, SH_], fill=(42, 58, 36));
    for i in range(30): d.point(((i * 29) % 100, 40 + (i * 7) % 14), fill=(56, 76, 46))
    put(sc, tent(), 74, 44)
    f = campfire(t); put(sc, f, 52, 50)
    glow = Image.new('RGBA', sc.size); ImageDraw.Draw(glow).ellipse([34, 34, 74, 54], fill=(240, 160, 60, 36 + (t % 2) * 10)); sc.alpha_composite(glow)
    put(sc, lying(HERO), 9, 49)          # 勇者躺在睡袋裡
    put(sc, bedroll(), 18, 53)
    zz(d, 18, 22, t); return sc

# ---------- 臥底／失聯：夜晚巷子、磚牆、路燈、木箱，牆角探出的兜帽身影、頭上「？」 ----------
def lamp_post():
    def f(d): d.rectangle([3, 6, 4, 40], fill=NVd); d.rectangle([0, 0, 7, 6], fill=NV); d.rectangle([1, 1, 6, 5], fill=(243, 220, 130, 255))
    return shape(8, 41, f)
def crate():
    def f(d): d.rectangle([0, 0, 13, 11], fill=BR); d.rectangle([1, 1, 12, 10], fill=OR); d.line([(1, 1), (12, 10)], fill=BR); d.line([(1, 10), (12, 1)], fill=BR)
    return shape(14, 12, f)
def sc_spy(t, gone=False):
    sc = Image.new('RGBA', (SW, SH_), (22, 20, 34, 255)); d = ImageDraw.Draw(sc)
    for y in range(0, 44, 6):
        for x in range((y // 6 % 2) * 6, SW, 12): d.rectangle([x, y, x + 10, y + 4], fill=(48, 40, 52))
    d.rectangle([0, 44, SW, SH_], fill=(36, 34, 44)); d.line([(0, 44), (SW, 44)], fill=O)
    put(sc, lamp_post(), 66, 46)
    gl = Image.new('RGBA', sc.size); ImageDraw.Draw(gl).polygon([(70, 10), (54, 46), (88, 46)], fill=(243, 220, 130, 40 + (t % 3 == 0) * 10)); sc.alpha_composite(gl)
    put(sc, crate(), 20, 48); put(sc, crate(), 30, 48); put(sc, crate(), 26, 37)
    if not gone:
        peek = (t // 5) % 2   # 兜帽身影從木箱後面探頭
        hood = dark(kt('09_03'), .35); sc.alpha_composite(hood.crop((0, 0, 16, 11)), (36, 26 - peek * 2))
        put(sc, crate(), 30, 48)
    f = ImageFont.truetype(FONT, 11); qy = 8 + (t % 2)
    d.text((47 if not gone else 44, qy), '?', font=f, fill=(243, 200, 106)); return sc

# ---------- 地下夜班：昏暗地下室、吊燈光錐、牌桌（紙牌、金幣）、兜帽男、勇者 ----------
def card_table():
    def f(d):
        d.rectangle([0, 0, 23, 3], fill=(40, 110, 70, 255)); d.rectangle([2, 4, 3, 10], fill=BRd); d.rectangle([20, 4, 21, 10], fill=BRd)
        d.rectangle([0, 3, 23, 4], fill=BRd)
    return shape(24, 11, f)
def sc_ug(t):
    sc = Image.new('RGBA', (SW, SH_), (16, 15, 22, 255)); d = ImageDraw.Draw(sc)
    for y in range(0, 44, 8):
        for x in range((y // 8 % 2) * 8, SW, 16): d.rectangle([x, y, x + 14, y + 6], fill=(30, 28, 38))
    d.rectangle([0, 44, SW, SH_], fill=(28, 26, 34)); d.line([(0, 44), (SW, 44)], fill=O)
    fl = .4 if t % 7 == 3 else 1
    gl = Image.new('RGBA', sc.size); ImageDraw.Draw(gl).polygon([(50, 8), (26, 46), (74, 46)], fill=(240, 192, 96, round(56 * fl))); sc.alpha_composite(gl)
    d.line([(50, 0), (50, 5)], fill=GYd); d.rectangle([46, 5, 54, 9], fill=(243, 200, 106)); d.rectangle([46, 5, 54, 9], outline=O)
    put(sc, flip(kt(HERO)), 22, 46); put(sc, kt('09_03'), 64, 46)   # 勇者、兜帽男（不具名）在牌桌兩邊
    put(sc, card_table(), 36, 50)
    for x, c in ((42, WH), (46, WH), (54, YL), (57, YL)): d.rectangle([x, 35, x + 2, 37], fill=c); d.rectangle([x, 35, x + 2, 37], outline=O)
    put(sc, shape(10, 10, lambda dd: (dd.rectangle([0, 1, 9, 9], fill=BR), dd.rectangle([0, 0, 9, 2], fill=OR))), 84, 48)   # 木箱
    return sc

# ---------- 私事：夜晚、民宅外牆、拉上窗簾的亮窗、門把掛「請勿打擾」小牌 ----------
def curtain_window(t):
    def f(d):
        d.rectangle([0, 0, 25, 19], fill=BR); d.rectangle([2, 2, 23, 17], fill=(250, 220, 140, 255))
        d.rectangle([2, 2, 10, 17], fill=(200, 90, 110, 255)); d.rectangle([15, 2, 23, 17], fill=(200, 90, 110, 255))
        for x in (4, 7, 18, 21): d.line([(x, 3), (x, 16)], fill=(160, 64, 84, 255))
    return shape(26, 20, f)
def door_sign():
    def f(d):
        d.rectangle([0, 0, 15, 27], fill=BRd); d.rectangle([2, 2, 13, 27], fill=BR); d.rectangle([11, 14, 12, 15], fill=YL)
        d.line([(7, 6), (4, 10)], fill=O); d.line([(8, 6), (11, 10)], fill=O); d.rectangle([3, 10, 12, 15], fill=WH)   # 掛牌
        d.rectangle([5, 12, 6, 13], fill=RD); d.rectangle([9, 12, 10, 13], fill=RD)
    return shape(16, 28, f)
def sc_private(t):
    sc = Image.new('RGBA', (SW, SH_), (27, 35, 64, 255)); d = ImageDraw.Draw(sc)
    for i in range(8): d.point(((i * 41) % 100, (i * 7) % 8), fill=WH)
    for y in range(6, 50, 16):
        for x in range(0, 100, 16): sc.alpha_composite(dark(kt('06_01', TT), .35), (x, y))
    d.rectangle([0, 48, SW, SH_], fill=(40, 44, 60)); d.line([(0, 48), (SW, 48)], fill=O)
    gl = Image.new('RGBA', sc.size); ImageDraw.Draw(gl).ellipse([10, 6, 64, 44], fill=(250, 220, 140, 26 + (t % 4 == 0) * 10)); sc.alpha_composite(gl)
    put(sc, curtain_window(t), 24, 34)
    put(sc, door_sign(), 66, 50)
    if (t // 6) % 2: d.rectangle([33, 22, 37, 30], fill=(120, 60, 80))   # 窗簾後面的人影晃一下
    return sc

# ---------- 回老家：白天、鄉下小屋、屋外木桌吃飯（盤子冒煙）、爸媽（不具名） ----------
def cottage():   # 鄉下小屋：奶油色牆、木梁、紅屋頂、煙囪、門、窗
    def f(d):
        d.rectangle([30, 0, 34, 8], fill=(150, 90, 70, 255))                                   # 煙囪
        d.polygon([(0, 16), (8, 4), (38, 4), (46, 16)], fill=RD); d.line([(8, 6), (38, 6)], fill=(250, 120, 100, 255))   # 紅屋頂
        d.rectangle([0, 16, 46, 17], fill=RDd)
        d.rectangle([3, 18, 43, 36], fill=(236, 222, 190, 255)); d.line([(3, 18), (43, 18)], fill=BR)
        d.rectangle([6, 22, 15, 29], fill=BR); d.rectangle([7, 23, 14, 28], fill=(142, 198, 240, 255)); d.line([(10, 23), (10, 28)], fill=BR)   # 窗
        d.rectangle([24, 24, 33, 36], fill=BR); d.rectangle([25, 25, 32, 36], fill=OR); d.point((31, 31), fill=YL)   # 門
    return shape(47, 37, f)
def picnic():
    def f(d):
        d.rectangle([0, 0, 35, 2], fill=OR); d.rectangle([0, 2, 35, 3], fill=BR); d.rectangle([3, 4, 4, 7], fill=BR); d.rectangle([31, 4, 32, 7], fill=BR)
    return shape(36, 8, f)
def dish():
    def f(d): d.ellipse([0, 1, 7, 4], fill=WH); d.rectangle([2, 0, 5, 1], fill=(234, 165, 108, 255))
    return shape(8, 5, f, thin=True)
def sc_visit(t):
    sc = Image.new('RGBA', (SW, SH_), (142, 198, 240, 255)); d = ImageDraw.Draw(sc)
    d.ellipse([84, 4, 93, 13], fill=(247, 210, 90)); d.ellipse([84, 4, 93, 13], outline=O)
    d.rectangle([0, 34, SW, SH_], fill=(111, 154, 72)); d.line([(0, 34), (SW, 34)], fill=(80, 120, 52))
    for i in range(24): d.point(((i * 31) % 100, 36 + (i * 11) % 17), fill=(134, 182, 90))
    put(sc, cottage(), 2, 46)
    for i in range(3):   # 煙囪冒煙
        k = (t + i * 3) % 9; d.rectangle([34 + k // 3, 6 - k * 1, 36 + k // 3, 8 - k * 1], fill=(220, 220, 220))
    put(sc, flip(kt(HERO)), 50, 46); put(sc, kt('07_02'), 66, 46); put(sc, flip(kt('08_04')), 82, 46)   # 勇者、爸爸、媽媽站在桌子後面
    put(sc, picnic(), 52, 53)
    for x in (55, 69, 84): put(sc, dish(), x, 46)
    k = t % 2
    for x in (58, 72, 87): d.point((x, 39 - k), fill=WH); d.point((x + 1, 37 - k), fill=WH)   # 熱騰騰
    return sc

SCENES = [('事務所', sc_office, '大熊在事務所'), ('紮營', sc_camp, '大熊在野外紮營過夜'), ('臥底', lambda t: sc_spy(t), '臥底中，行蹤不明'),
          ('失聯', lambda t: sc_spy(t, True), '大熊不知道去了哪裡'), ('地下夜班', sc_ug, '地下夜班'), ('私事', sc_private, '私事，不便打擾'), ('回老家', sc_visit, '大熊回老家，和家人一起吃飯')]
def sheet(t):
    S = 2; cols = 2; rows = (len(SCENES) + 1) // 2
    out = Image.new('RGBA', (cols * (206 * S + 20) + 20, rows * (136 * S + 40) + 20), (38, 40, 56, 255)); d = ImageDraw.Draw(out); f = ImageFont.truetype(FONT, 22)
    for i, (n, fn, cap) in enumerate(SCENES):
        x = 20 + (i % 2) * (206 * S + 20); y = 10 + (i // 2) * (136 * S + 40)
        d.text((x, y), n, font=f, fill=(230, 230, 230)); out.alpha_composite(R.pip(fn(t), cap).resize((206 * S, 136 * S), Image.NEAREST), (x, y + 30))
    return out
# ---- 遊戲用：不會動的部分做成背景／家具；會動的（星星、營火、探頭、燈光、煙、人）在 map.js 畫 ----
def items2():
    def base(fn):
        sc = Image.new('RGBA', (SW, SH_)); fn(sc); return sc
    def office_bg(sc):
        plain_wall(sc, (236, 222, 190, 255), (206, 186, 146, 255)); floor(sc, BR, BRd)
        put(sc, board(), 6, 28); put(sc, bookshelf(), 78, 46); put(sc, kt('08_03'), 60, 36); put(sc, desk(), 50, 49); put(sc, papers(), 56, 35)
    def camp_bg(sc):
        d = ImageDraw.Draw(sc); d.rectangle([0, 0, SW, SH_], fill=(20, 28, 52)); d.ellipse([82, 4, 89, 11], fill=(243, 230, 166)); d.ellipse([85, 3, 91, 10], fill=(20, 28, 52))
        IT = wild.items()
        for x in (-4, 14, 70, 90): put(sc, dark(IT['treeM'], .55), x, 40)
        d.rectangle([0, 38, SW, SH_], fill=(42, 58, 36))
        for i in range(30): d.point(((i * 29) % 100, 40 + (i * 7) % 14), fill=(56, 76, 46))
        put(sc, tent(), 74, 44)
    def alley_bg(sc):
        d = ImageDraw.Draw(sc); d.rectangle([0, 0, SW, SH_], fill=(22, 20, 34))
        for y in range(0, 44, 6):
            for x in range((y // 6 % 2) * 6, SW, 12): d.rectangle([x, y, x + 10, y + 4], fill=(48, 40, 52))
        d.rectangle([0, 44, SW, SH_], fill=(36, 34, 44)); d.line([(0, 44), (SW, 44)], fill=O)
        put(sc, lamp_post(), 66, 46)
        gl = Image.new('RGBA', sc.size); ImageDraw.Draw(gl).polygon([(70, 10), (54, 46), (88, 46)], fill=(243, 220, 130, 40)); sc.alpha_composite(gl)
        put(sc, crate(), 20, 48); put(sc, crate(), 30, 48); put(sc, crate(), 26, 37)
    def ug_bg(sc):
        d = ImageDraw.Draw(sc); d.rectangle([0, 0, SW, SH_], fill=(16, 15, 22))
        for y in range(0, 44, 8):
            for x in range((y // 8 % 2) * 8, SW, 16): d.rectangle([x, y, x + 14, y + 6], fill=(30, 28, 38))
        d.rectangle([0, 44, SW, SH_], fill=(28, 26, 34)); d.line([(0, 44), (SW, 44)], fill=O)
        d.line([(50, 0), (50, 5)], fill=GYd); d.rectangle([46, 5, 54, 9], fill=(243, 200, 106)); d.rectangle([46, 5, 54, 9], outline=O)
        put(sc, shape(10, 10, lambda dd: (dd.rectangle([0, 1, 9, 9], fill=BR), dd.rectangle([0, 0, 9, 2], fill=OR))), 84, 48)
    def ctable():   # 牌桌＋紙牌、金幣（畫在人前面）
        sc = Image.new('RGBA', (SW, SH_)); put(sc, card_table(), 36, 50); d = ImageDraw.Draw(sc)
        for x, c in ((42, WH), (46, WH), (54, YL), (57, YL)): d.rectangle([x, 35, x + 2, 37], fill=c); d.rectangle([x, 35, x + 2, 37], outline=O)
        return sc.crop(sc.getbbox())
    def private_bg(sc):
        d = ImageDraw.Draw(sc); d.rectangle([0, 0, SW, SH_], fill=(27, 35, 64))
        for i in range(8): d.point(((i * 41) % 100, (i * 7) % 8), fill=WH)
        for y in range(6, 50, 16):
            for x in range(0, 100, 16): sc.alpha_composite(dark(kt('06_01', TT), .35), (x, y))
        d.rectangle([0, 48, SW, SH_], fill=(40, 44, 60)); d.line([(0, 48), (SW, 48)], fill=O)
        gl = Image.new('RGBA', sc.size); ImageDraw.Draw(gl).ellipse([10, 6, 64, 44], fill=(250, 220, 140, 26)); sc.alpha_composite(gl)
        put(sc, curtain_window(0), 24, 34); put(sc, door_sign(), 66, 50)
    def visit_bg(sc):
        d = ImageDraw.Draw(sc); d.rectangle([0, 0, SW, SH_], fill=(142, 198, 240)); d.ellipse([84, 4, 93, 13], fill=(247, 210, 90)); d.ellipse([84, 4, 93, 13], outline=O)
        d.rectangle([0, 34, SW, SH_], fill=(111, 154, 72)); d.line([(0, 34), (SW, 34)], fill=(80, 120, 52))
        for i in range(24): d.point(((i * 31) % 100, 36 + (i * 11) % 17), fill=(134, 182, 90))
        put(sc, cottage(), 2, 46)
    def hood():
        return dark(kt('09_03'), .35).crop((0, 0, 16, 11))
    return {'bg_office':base(office_bg), 'bg_camp':base(camp_bg), 'bg_alley':base(alley_bg), 'bg_ug':base(ug_bg), 'bg_private':base(private_bg), 'bg_visit':base(visit_bg),
            'fire0':campfire(0), 'fire1':campfire(1), 'fire2':campfire(2), 'bedroll':bedroll(), 'crate':crate(), 'hood':hood(), 'hooded':kt('09_03'), 'ctable':ctable(),
            'picnic':picnic(), 'dish':dish(), 'dad':kt('07_02'), 'mom':flip(kt('08_04'))}
if __name__ == '__main__':
    fr = [sheet(t).convert('P', palette=Image.ADAPTIVE, colors=255) for t in range(14)]
    fr[0].save(sys.argv[1], save_all=True, append_images=fr[1:], duration=250, loop=0)
    sheet(5).convert('RGB').save(sys.argv[1].replace('.gif', '.png'))
