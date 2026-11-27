# 草圖（v17.87 討論）：休閒（釣魚、看書）＋新任務（鐵匠鋪試刀、公會新人教練、慈善義賣、王都晚宴、採集藥草、夜間巡邏、秋收、抓小偷）
# python3 tasks_sketch.py 草圖_新任務.png
import sys, os, random
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'rooms')); sys.path.insert(0, os.path.join(HERE, '..', 'wild'))
from PIL import Image, ImageDraw, ImageFont
import rooms as R, wild
HUN = os.path.join(HERE, '..', 'fonts', 'jf-openhuninn-2.0.ttf')
W, VH = 260, 170
O, BR, BRd, SK, WH, YL, RD, GY, GYd, NVd = R.O, R.BR, R.BRd, R.SK, R.WH, R.YL, R.RD, R.GY, R.GYd, R.NVd
WI = wild.items()
EMO = os.path.join(HERE, '..', 'emotes')
def T(n): return R.kt(n)
def flip(im): return im.transpose(Image.FLIP_LEFT_RIGHT)
def P(im, sp, cx, yb, left=False, dy=0):   # 人：腳底中心 (cx, yb)
    sp = flip(sp) if left else sp; d = ImageDraw.Draw(im); d.rectangle([cx - 5, yb, cx + 5, yb + 1], fill=(0, 0, 0, 60))
    im.alpha_composite(sp, (round(cx - sp.width / 2), round(yb - sp.height - dy)))
def emo(im, k, cx, yb):
    e = Image.open(f'{EMO}/emote_{k}.png').convert('RGBA'); e = e.crop(e.getbbox()); im.alpha_composite(e, (round(cx - e.width / 2), round(yb - e.height)))
def put(im, sp, x, yb): R.put(im, sp, x, yb)

def street(night=False, road=True, sky=(150, 200, 230)):
    im = Image.new('RGBA', (W, VH), (111, 154, 72, 255)); d = ImageDraw.Draw(im); rnd = random.Random(5)
    d.rectangle([0, 0, W, 58], fill=sky + (255,))
    for _ in range(420): d.point((rnd.randrange(W), 58 + rnd.randrange(VH - 58)), fill=rnd.choice([(126, 171, 82), (95, 138, 62), (134, 182, 90)]))
    if road:
        d.rectangle([0, 116, W, 152], fill=(184, 154, 110)); d.rectangle([0, 116, W, 117], fill=(163, 134, 92)); d.rectangle([0, 151, W, 152], fill=(163, 134, 92))
        for r, y in enumerate(range(120, 150, 6)):
            for x in range((r % 2) * 5, W, 10): d.rectangle([x + 1, y + 1, x + 8, y + 4], fill=(196, 167, 122) if (x + y) % 3 else (191, 162, 116))
    return im
def dark(im, a=.55):
    ov = Image.new('RGBA', im.size, (20, 24, 60, round(255 * a))); im.alpha_composite(ov); return im

# ---- 道具 ----
def anvil():
    def f(d): d.rectangle([0, 0, 15, 3], fill=GYd); d.rectangle([-1, 0, 2, 1], fill=GYd); d.rectangle([4, 4, 11, 7], fill=(90, 100, 120, 255)); d.rectangle([2, 8, 13, 10], fill=(90, 100, 120, 255)); d.line([(1, 0), (14, 0)], fill=GY)
    return R.shape(16, 11, f)
def rack():
    im = R.shape(26, 18, lambda d: (d.rectangle([0, 0, 25, 2], fill=BR), d.rectangle([0, 15, 25, 17], fill=BR), d.rectangle([0, 0, 2, 17], fill=BR), d.rectangle([23, 0, 25, 17], fill=BR)))
    for i, n in enumerate(['08_07', '08_08', '08_09']): s = T(n).crop((4, 0, 12, 16)); im.alpha_composite(s, (5 + i * 7, 1))
    return im
def post():   # 試刀用的木樁（綁稻草）
    def f(d): d.rectangle([3, 0, 7, 22], fill=BR); d.rectangle([1, 4, 9, 14], fill=(226, 196, 110, 255)); d.line([(1, 8), (9, 8)], fill=BRd); d.line([(1, 11), (9, 11)], fill=BRd)
    return R.shape(11, 23, f)
def wsword():   # 木劍
    return R.shape(3, 12, lambda d: (d.rectangle([0, 0, 2, 8], fill=(214, 170, 110, 255)), d.rectangle([0, 9, 2, 11], fill=BRd)), thin=True)
def banner(txt_heart=True):
    def f(d):
        d.rectangle([0, 0, 1, 30], fill=BR); d.rectangle([40, 0, 41, 30], fill=BR); d.rectangle([2, 2, 39, 14], fill=WH)
        for (x, y) in ((17, 5), (18, 5), (22, 5), (23, 5), (16, 6), (17, 6), (18, 6), (19, 6), (21, 6), (22, 6), (23, 6), (24, 6), (16, 7), (24, 7), (17, 8), (23, 8), (18, 9), (22, 9), (19, 10), (21, 10), (20, 11)): d.point((x, y), fill=RD)
        for x in range(17, 24):
            for y in range(6, 10):
                if abs(x - 20) + (y - 6) <= 4: d.point((x, y), fill=RD)
    return R.shape(42, 31, f)
def jar():
    return R.shape(8, 9, lambda d: (d.rectangle([0, 2, 7, 8], fill=(170, 210, 230, 200)), d.rectangle([1, 0, 6, 1], fill=BRd), d.rectangle([2, 5, 5, 7], fill=YL)))
def basket(full=True):
    def f(d):
        d.rectangle([0, 3, 11, 8], fill=(200, 150, 80, 255)); d.line([(0, 5), (11, 5)], fill=(160, 110, 60, 255)); d.arc([2, -3, 9, 5], 180, 360, fill=(160, 110, 60, 255))
        if full: [d.point((x, 2), fill=(67, 180, 90, 255)) for x in (2, 4, 6, 8, 9)]
    return R.shape(12, 9, f)
def herb():
    return R.shape(7, 7, lambda d: (d.line([(3, 6), (3, 2)], fill=(37, 149, 106, 255)), d.point((2, 2), fill=(67, 225, 179, 255)), d.point((4, 1), fill=(67, 225, 179, 255)), d.point((3, 0), fill=(240, 120, 200, 255))), thin=True)
def lantern():
    return R.shape(5, 8, lambda d: (d.rectangle([0, 2, 4, 7], fill=(250, 220, 110, 255)), d.rectangle([1, 0, 3, 1], fill=GYd), d.line([(0, 4), (4, 4)], fill=(230, 160, 60, 255))), thin=True)
def glow(im, cx, cy, r=26):
    ov = Image.new('RGBA', im.size); d = ImageDraw.Draw(ov)
    for i in range(r, 0, -3): d.ellipse([cx - i, cy - i * .7, cx + i, cy + i * .7], fill=(255, 220, 120, round(80 * (1 - i / r)) + 8))
    im.alpha_composite(ov)
def sickle():
    return R.shape(9, 10, lambda d: (d.rectangle([0, 5, 1, 9], fill=BR), d.arc([0, 0, 8, 8], 200, 360, fill=GY, width=2)), thin=True)
def sheaf():
    return R.shape(9, 14, lambda d: (d.rectangle([1, 0, 7, 13], fill=(232, 196, 90, 255)), d.line([(1, 7), (7, 7)], fill=BR), [d.point((x, 0), fill=(250, 220, 120, 255)) for x in (2, 4, 6)]))
def wheat_field(w=180, rows=3):
    im = Image.new('RGBA', (w, rows * 9 + 4)); d = ImageDraw.Draw(im)
    for r in range(rows):
        y = r * 9
        d.rectangle([0, y + 4, w, y + 8], fill=(150, 110, 60, 255))
        for x in range(0, w, 4): d.line([(x + (r % 2) * 2, y + 7), (x + (r % 2) * 2, y)], fill=(222, 182, 80, 255)); d.point((x + (r % 2) * 2, y), fill=(250, 220, 120, 255))
    return im
def bag():
    return R.shape(8, 9, lambda d: (d.ellipse([0, 2, 7, 8], fill=(150, 120, 90, 255)), d.rectangle([3, 0, 4, 2], fill=BRd), d.text((2, 3), '$', fill=YL)))
def thief():
    s = T('09_03').copy(); px = s.load()
    for y in range(s.height):
        for x in range(s.width):
            r, g, b, a = px[x, y]
            if a and (r, g, b) not in ((63, 38, 49), (247, 194, 130), (225, 154, 101)): px[x, y] = (int(r * .35), int(g * .35), int(b * .45), a)
    return s
def pond(w=110, h=28):
    im = Image.new('RGBA', (w + 4, h + 4)); d = ImageDraw.Draw(im)
    d.ellipse([0, 0, w + 3, h + 3], fill=O); d.ellipse([2, 2, w + 1, h + 1], fill=(64, 130, 200, 255)); d.ellipse([10, 6, w - 8, h - 4], fill=(84, 156, 220, 255))
    for x, y in ((24, 10), (60, 16), (82, 9)): d.line([(x, y), (x + 8, y)], fill=(190, 230, 250, 255))
    return im
def reeds():
    return R.shape(9, 14, lambda d: [d.line([(x, 13), (x + (x % 3) - 1, 2 + x % 4)], fill=(60, 120, 60, 255)) for x in (1, 3, 5, 7)] and None, thin=True)
def chand():
    def f(d): d.line([(10, 0), (10, 4)], fill=GYd); d.rectangle([2, 5, 18, 7], fill=YL); [d.rectangle([x, 2, x + 1, 4], fill=WH) for x in (3, 9, 15)]; [d.point((x, 1), fill=(255, 200, 80, 255)) for x in (3, 9, 15)]
    return R.shape(21, 8, f, thin=True)
def ltable(w=56):
    return R.shape(w, 10, lambda d: (d.rectangle([0, 0, w - 1, 5], fill=WH), d.rectangle([0, 5, w - 1, 6], fill=GY), d.rectangle([3, 7, 4, 9], fill=BRd), d.rectangle([w - 5, 7, w - 4, 9], fill=BRd)))
def candle(): return R.shape(2, 5, lambda d: (d.rectangle([0, 1, 1, 4], fill=WH), d.point((0, 0), fill=(255, 180, 60, 255))), thin=True)
def book(): return R.shape(6, 5, lambda d: (d.rectangle([0, 0, 5, 4], fill=RD), d.rectangle([1, 1, 4, 3], fill=WH), d.line([(2, 2), (3, 2)], fill=GYd)), thin=True)
def crouch(n):   # 蹲下：上半身往下壓 3 格
    s = T(n); out = Image.new('RGBA', (16, 16)); out.alpha_composite(s.crop((0, 0, 16, 10)), (0, 3)); out.alpha_composite(s.crop((0, 12, 16, 16)), (0, 12)); return out

# ---- 場景 ----
def s_fish():
    im = street(road=False, sky=(240, 170, 110)); d = ImageDraw.Draw(im)
    put(im, WI['tree'], 10, 100); put(im, WI['atree'], 210, 100); put(im, WI['bush'], 40, 104)
    p = pond(); im.alpha_composite(p, (110, 112)); put(im, reeds(), 112, 124); put(im, reeds(), 214, 122)
    P(im, T(R.HERO), 96, 122)   # 坐在岸邊（之後做坐姿）
    d.line([(101, 110), (128, 96)], fill=BR, width=1); d.line([(128, 96), (134, 120)], fill=(240, 240, 240, 255)); d.rectangle([133, 120, 135, 122], fill=RD); d.point((134, 120), fill=WH)
    put(im, basket(False), 72, 124); emo(im, '想睡', 104, 92)
    return im, '釣魚（休閒）', '村口外的小池塘；坐在岸邊甩竿，浮標上下動；釣到時浮標沉下去、勇者冒「驚訝」'
def s_read():
    sc = R.sc_rest(0); sc2 = Image.new('RGBA', sc.size); sc2.alpha_composite(sc)
    # 蓋掉原本站著的勇者，改成坐在凳子上看書
    base = Image.new('RGBA', (R.SW, R.SH_)); R.wall_tiles(base, '06_05'); R.floor(base, BR, BRd); R.window(base, 74, 8, night=True); R.put(base, R.frame_pic(), 34, 22)
    R.put(base, R.bed(RD, RDd := R.RDd, 38, big=True), 4, 48); R.put(base, R.rug(36), 44, 51); R.put(base, R.table(22), 62, 48); R.put(base, R.lamp(), 66, 41)
    R.put(base, R.stool(), 49, 48); R.put(base, T(R.HERO), 47, 44); R.put(base, book(), 57, 36)
    return R.pip(base, '勇者在家看書'), '看書（休閒）', '家裡小窗格：坐在凳子上捧著書，桌上點燈；開放性高的偶爾冒「想到了」'
def s_smith():
    im = street(); d = ImageDraw.Draw(im)
    d.rectangle([40, 62, 220, 116], fill=(120, 90, 70, 255)); d.rectangle([40, 62, 220, 66], fill=BRd); d.rectangle([110, 80, 150, 116], fill=(60, 40, 40, 255))   # 鐵匠鋪正面（遊戲裡用現有的鐵匠鋪建築）
    put(im, rack(), 60, 116); put(im, anvil(), 160, 116)
    P(im, T('07_03'), 186, 134, left=True)   # 鐵匠
    P(im, T(R.HERO), 112, 134); s = T('08_08'); im.alpha_composite(flip(s).rotate(-50, expand=True).crop((0, 0, 22, 22)), (116, 110))
    put(im, post(), 132, 136); d.line([(128, 116), (136, 124)], fill=WH)
    for x in (70, 84, 200): P(im, T(['07_01', '08_04', '07_04'][x % 3]), x, 150, left=x > 150)
    emo(im, '驚訝', 84, 132)
    return im, '鐵匠鋪代言試刀（任務 2）', '鐵匠鋪門口：勇者揮新刀砍稻草木樁，鐵匠在旁邊比讚，路人圍觀；做完下次買裝備打折'
def s_coach():
    im = street(road=False); d = ImageDraw.Draw(im)
    d.rectangle([0, 112, W, 160], fill=(214, 186, 130, 255)); d.rectangle([0, 112, W, 113], fill=(180, 150, 100, 255))
    for x in (50, 210): put(im, R.dummy(), x - 7, 140)
    P(im, T(R.HERO), 130, 138, left=True); emo(im, '認真', 130, 120)
    for i, (x, n) in enumerate(((92, '07_01'), (110, '08_04'), (150, '07_04'), (168, '08_03'))):
        P(im, T(n), x, 148, left=x > 130); ws = wsword(); put(im, ws if x < 130 else flip(ws), x + (6 if x < 130 else -9), 142)
    return im, '公會新人教練（任務 3）', '鬥技場：勇者站中間示範，新人拿木劍跟著揮；勇者經驗 +，招新人變容易'
def s_charity():
    im = street(); put(im, banner(), 109, 116)
    st = R.stall(); put(im, st, 130 - st.width // 2, 136)
    P(im, T(R.HERO), 130, 128); put(im, jar(), 146, 124); emo(im, '開心', 130, 110)
    for x, n in ((84, '07_01'), (98, '08_04'), (170, '07_04'), (186, '08_03')): P(im, T(n), x, 150, left=x > 130)
    emo(im, '戀愛', 98, 132)
    return im, '慈善義賣（任務 4）', '廣場攤位（沿用外快的攤子）＋白底紅心布條，捐款罐；買東西的人冒愛心'
def s_banquet():
    sc = Image.new('RGBA', (R.SW, R.SH_)); R.plain_wall(sc, (150, 60, 70, 255), (120, 44, 56, 255), stripe=12); R.floor(sc, (120, 90, 60, 255), (100, 74, 50, 255))
    d = ImageDraw.Draw(sc); d.rectangle([0, 40, R.SW, 41], fill=YL)
    R.put(sc, chand(), 22, 9); R.put(sc, chand(), 62, 9)
    R.put(sc, ltable(64), 18, 48)
    for x in (26, 44, 62, 78): R.put(sc, candle(), x, 39)
    for x, n in ((18, '08_00'), (36, '07_04'), (68, '08_01')): R.put(sc, T(n), x, 40)
    R.put(sc, T(R.HERO), 50, 40); d.rectangle([62, 28, 63, 31], fill=(200, 60, 80, 255)); d.point((62, 27), fill=WH)   # 舉杯
    return R.pip(sc, '勇者參加王都晚宴'), '王都晚宴（任務 6）', '王都小窗格：紅牆金線、水晶燈、長桌燭台，貴族圍著；勇者舉杯，心願「地位」的冒愛心'
def s_herb():
    im = street(road=False); put(im, WI['tree'], 20, 100); put(im, WI['atree'], 60, 98); put(im, WI['tree'], 200, 100); put(im, WI['bush'], 160, 104)
    for x, y in ((90, 132), (108, 140), (140, 130), (156, 142), (176, 134), (70, 146)): put(im, herb(), x, y)
    P(im, crouch(R.HERO), 122, 140); put(im, basket(), 132, 141); emo(im, '開心', 122, 122)
    return im, '採集藥草（任務 7）', '草原／森林：勇者蹲下摘草（一蹲一起），籃子慢慢變滿；不太需要打，診所的藥變便宜'
def s_patrol():
    im = street(); d = ImageDraw.Draw(im)
    for x in (10, 80, 160, 220): d.rectangle([x, 74, x + 40, 116], fill=(110, 90, 80, 255)); d.polygon([(x - 4, 76), (x + 20, 60), (x + 44, 76)], fill=(90, 50, 50, 255)); d.rectangle([x + 8, 90, x + 14, 96], fill=(250, 210, 110, 255))
    dark(im, .6); d = ImageDraw.Draw(im); d.ellipse([214, 12, 228, 26], fill=(250, 245, 210, 255))
    glow(im, 138, 124); P(im, T(R.HERO), 130, 136); put(im, lantern(), 136, 128)
    emo(im, '認真', 130, 118)
    return im, '夜間巡邏（任務 8）', '晚上的村子：勇者提燈慢慢走（燈照出一圈光）；有機率遇到小偷 → 接「抓小偷」的追逐'
def s_harvest():
    im = street(road=False, sky=(170, 200, 230)); put(im, WI['farm'], 10, 104)
    wf = wheat_field(200, 4); im.alpha_composite(wf, (50, 108))
    P(im, T(R.HERO), 120, 136); put(im, sickle(), 126, 130)
    for x in (70, 90, 200): put(im, sheaf(), x, 150)
    P(im, T('07_04'), 180, 148, left=True); emo(im, '開心', 180, 130)
    return im, '秋收幫忙（任務 9，只在 9～10 月）', '草原農田的稻子變金黃；勇者拿鐮刀割，旁邊越堆越多稻束；村民交情 +1'
def s_thief():
    im = street(); d = ImageDraw.Draw(im)
    P(im, thief(), 170, 138); put(im, bag(), 176, 132)
    for y in (122, 128, 134): d.line([(150, y), (158, y)], fill=(255, 255, 255, 180))
    P(im, T(R.HERO), 120, 138, dy=2); emo(im, '生氣', 120, 116)
    P(im, T('08_04'), 60, 140); emo(im, '驚訝', 60, 118)
    return im, '抓小偷（任務 10，突發）', '村子街上：小偷（深色兜帽）抱錢袋往右跑，勇者在後面追，被偷的村民冒「驚訝」；追到時小偷跌倒、錢袋掉地上'

SCENES = [s_fish, s_read, s_smith, s_coach, s_charity, s_banquet, s_herb, s_patrol, s_harvest, s_thief]
if __name__ == '__main__':
    S2 = 2; PW = W * S2; F = ImageFont.truetype(HUN, 24); F2 = ImageFont.truetype(HUN, 17)
    out = Image.new('RGBA', (2 * PW + 60, 5 * (VH * S2 + 110) + 20), (38, 40, 56, 255)); d = ImageDraw.Draw(out)
    for i, fn in enumerate(SCENES):
        im, t, desc = fn(); x = 20 + (i % 2) * (PW + 20); y = 14 + (i // 2) * (VH * S2 + 110)
        d.text((x, y), t, font=F, fill=(245, 230, 190))
        im2 = im.resize((im.width * S2, im.height * S2), Image.NEAREST) if im.width == W else im.resize((PW, round(im.height * PW / im.width)), Image.NEAREST)
        out.alpha_composite(im2, (x, y + 34)); d.text((x, y + 34 + VH * S2 + 6), desc[:30], font=F2, fill=(200, 200, 210)); d.text((x, y + 34 + VH * S2 + 28), desc[30:62], font=F2, fill=(200, 200, 210))
    out.convert('RGB').save(sys.argv[1])
