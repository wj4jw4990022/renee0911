# 草圖（v17.91）：任務演出裡的舊圖換新——護送的篷車、被救的村民、守衛旗、考官
# python3 escort_sketch.py 草圖_任務舊圖換新.png
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, '..', 'rides'))
from PIL import Image, ImageDraw, ImageFont
import tasks_sketch as K, rides
R = K.R; T = K.T; P = K.P; emo = K.emo; put = K.put; W, VH = K.W, K.VH
def wild():
    im = K.street(road=False); d = ImageDraw.Draw(im)
    d.rectangle([0, 120, W, 150], fill=(196, 160, 110)); d.rectangle([0, 120, W, 121], fill=(170, 136, 92)); d.rectangle([0, 149, W, 150], fill=(170, 136, 92))
    put(im, K.WI['tree'], 14, 104); put(im, K.WI['atree'], 220, 102); put(im, K.WI['bush'], 60, 108); put(im, K.WI['fence'], 150, 112)
    return im
def flag(c=(247, 201, 74, 255)):   # 2 像素粗線的小旗：木桿＋三角旗＋中間一顆星
    def f(d):
        d.rectangle([0, 0, 1, 21], fill=R.BR); d.polygon([(2, 1), (13, 4), (2, 8)], fill=c); d.point((5, 4), fill=R.WH); d.point((6, 4), fill=R.WH)
    return R.shape(14, 22, f)
def tied(n):   # 被綁住的村民：坐在地上、身上兩圈繩子
    s = K.crouch(n); d = ImageDraw.Draw(s)
    for y in (9, 11): d.line([(3, y), (12, y)], fill=(118, 59, 54, 255))
    return s
def s_escort():
    im = wild(); w = rides.wagon(1); put(im, w, 60, 140); P(im, T(R.HERO), 150, 140)
    return im, '護送：舊的斜角小貨車 → 棕馬拉的篷車', '貨車照進度往前走、輪子會轉，勇者走在前面開路；路上遭遇的傭兵也改用這台'
def s_rescue():
    im = wild(); P(im, tied('07_01'), 120, 140); emo(im, '驚訝', 120, 122)
    P(im, T(R.HERO), 90, 140); P(im, T('08_04'), 200, 140, left=True)
    return im, '救援：方塊小人 → Kenney 村民被綁住', '前半段坐在地上、身上兩圈繩子、冒驚訝；救出來後站起來跟在勇者後面走'
def s_guard():
    im = wild(); put(im, flag(), 150, 140); P(im, T(R.HERO), 130, 140)
    put(im, flag((90, 150, 220, 255)), 60, 140); P(im, T('08_00'), 80, 140)
    return im, '守衛旗（右）、考官旗（左）→ 粗線小旗', '守衛：勇者守著黃旗；升格考核：公會考官（藍旗）站在旁邊看'
SC = [s_escort, s_rescue, s_guard]
if __name__ == '__main__':
    S2 = 2; PW = W * S2; F = ImageFont.truetype(K.HUN, 24); F2 = ImageFont.truetype(K.HUN, 17)
    out = Image.new('RGBA', (PW + 40, 3 * (VH * S2 + 110) + 20), (38, 40, 56, 255)); d = ImageDraw.Draw(out)
    for i, fn in enumerate(SC):
        im, t, desc = fn(); y = 14 + i * (VH * S2 + 110)
        d.text((20, y), t, font=F, fill=(245, 230, 190)); out.alpha_composite(im.resize((PW, VH * S2), Image.NEAREST), (20, y + 34)); d.text((20, y + 40 + VH * S2), desc[:30], font=F2, fill=(200, 200, 210)); d.text((20, y + 62 + VH * S2), desc[30:], font=F2, fill=(200, 200, 210))
    out.convert('RGB').save(sys.argv[1])
