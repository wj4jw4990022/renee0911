# 手工程序化像素角色：先用形狀畫「材質圖」，再自動上光影（左上亮、右下暗）、自動描外框，最後手點五官
from PIL import Image
W, H = 44, 60
OUT = (20, 12, 14)
MAT = {  # 材質：亮、中、暗
 'skin': [(255,226,196),(245,196,156),(214,150,112)],
 'hairB':[(120,78,48),(92,56,32),(62,36,20)],      # 棕髮
 'hairY':[(255,232,140),(236,196,92),(196,146,52)], # 金髮
 'hairK':[(80,82,104),(46,46,62),(26,26,38)],       # 黑髮
 'hairR':[(214,98,60),(176,66,40),(130,42,26)],     # 紅髮
 'steel':[(232,238,246),(176,188,206),(116,128,152)],
 'blue': [(98,150,232),(52,104,196),(30,64,140)],
 'red':  [(236,96,84),(200,58,52),(140,34,34)],
 'green':[(132,196,96),(84,152,62),(50,104,44)],
 'leaf': [(176,214,110),(126,176,72),(84,128,50)],
 'brown':[(176,120,74),(138,88,52),(96,58,32)],
 'purple':[(170,120,226),(126,78,196),(84,48,140)],
 'black':[(92,92,112),(56,56,72),(32,32,44)],
 'gold': [(255,236,140),(242,193,78),(190,130,40)],
 'cream':[(255,250,232),(236,226,196),(196,182,150)],
 'wood': [(196,140,86),(156,104,58),(110,70,38)],
 'white':[(255,255,255),(232,232,240),(190,190,206)],
}
class C:
    def __init__(s): s.m = [[None]*W for _ in range(H)]; s.fix = {}
    def put(s, x, y, m):
        if 0 <= x < W and 0 <= y < H: s.m[y][x] = m
    def rect(s, x0, y0, x1, y1, m):
        for y in range(y0, y1+1):
            for x in range(x0, x1+1): s.put(x, y, m)
    def ell(s, cx, cy, rx, ry, m):
        for y in range(int(cy-ry)-1, int(cy+ry)+2):
            for x in range(int(cx-rx)-1, int(cx+rx)+2):
                if ((x+.5-cx)/rx)**2 + ((y+.5-cy)/ry)**2 <= 1: s.put(x, y, m)
    def poly(s, pts, m):
        ys=[p[1] for p in pts]
        for y in range(int(min(ys)), int(max(ys))+1):
            xs=[]; n=len(pts)
            for i in range(n):
                (x1,y1),(x2,y2)=pts[i],pts[(i+1)%n]
                if (y1<=y+.5<y2) or (y2<=y+.5<y1): xs.append(x1+(y+.5-y1)*(x2-x1)/(y2-y1))
            xs.sort()
            for a,b in zip(xs[::2],xs[1::2]):
                for x in range(int(round(a)),int(round(b))): s.put(x,y,m)
    def px(s, x, y, rgb): s.fix[(x,y)] = rgb   # 手點的像素（五官、高光）
    def render(s, scale=1):
        im = Image.new('RGBA', (W, H), (0,0,0,0)); P = im.load(); m = s.m
        get = lambda x,y: m[y][x] if 0<=x<W and 0<=y<H else None
        for y in range(H):
            for x in range(W):
                k = m[y][x]
                if not k: continue
                L,M,D = MAT[k]
                up, lf, dn, rt = get(x,y-1)!=k, get(x-1,y)!=k, get(x,y+1)!=k, get(x+1,y)!=k
                up2 = get(x,y-2)!=k
                c = M
                if dn or rt: c = D
                if (up or lf) and not (dn and rt): c = L
                # 材質交界畫深色內線（同色系就不畫）
                if any(get(a,b) and get(a,b)!=k and MAT[get(a,b)]!=MAT[k] for a,b in ((x,y+1),(x+1,y))) and k!='skin': c = D
                P[x,y] = c + (255,)
        for (x,y),rgb in s.fix.items(): P[x,y] = rgb + (255,)
        # 外框
        A = [[P[x,y][3] for x in range(W)] for y in range(H)]
        for y in range(H):
            for x in range(W):
                if A[y][x]==0 and any(0<=x+a<W and 0<=y+b<H and A[y+b][x+a] for a,b in ((1,0),(-1,0),(0,1),(0,-1))): P[x,y] = OUT+(255,)
        return im.resize((W*scale, H*scale), Image.NEAREST) if scale>1 else im

def face(c, cx, ey, eye=(40,32,48), girl=False):
    # 大眼睛：3×5；上緣一條深色眼線、中間眼珠、左上兩格高光、下緣淡一點
    lo = tuple(min(255, v + 70) for v in eye)
    for dx in (-6, 3):
        x = cx + dx
        for xx in range(x, x+3): c.px(xx, ey, OUT)
        for yy in range(ey+1, ey+5):
            for xx in range(x, x+3): c.px(xx, yy, eye if yy < ey+3 else lo)
        c.px(x, ey+1, (255,255,255)); c.px(x+1, ey+1, (255,255,255)); c.px(x+2, ey+4, (255,255,255))
        if girl: c.px(x-1 if dx < 0 else x+3, ey, OUT); c.px(x-1 if dx < 0 else x+3, ey-1, OUT)
    for d in (-8, -7, 7, 8): c.px(cx+d-(1 if d>0 else 0), ey+5, (244,160,150))   # 腮紅
    c.px(cx-1, ey+6, (160,72,60)); c.px(cx, ey+6, (160,72,60)); c.px(cx, ey+7, (210,110,100))   # 嘴

def body_base(c, cx, skin='skin'):
    c.ell(cx, 18, 11, 10, skin)          # 頭
    c.rect(cx-1, 27, cx, 28, skin)       # 脖子

def knight():
    c = C(); cx = 22
    c.poly([(cx+8,30),(cx+16,30),(cx+18,50),(cx+6,50)], 'blue')          # 披風（背後）
    body_base(c, cx)
    c.ell(cx, 13, 12, 9, 'steel'); c.rect(cx-12, 13, cx+12, 17, 'steel')    # 頭盔
    c.rect(cx-9, 16, cx+9, 25, 'skin'); c.ell(cx, 22, 9, 5, 'skin'); c.rect(cx-10, 15, cx+10, 15, 'gold')
    c.poly([(cx-2,3),(cx+3,0),(cx+7,2),(cx+4,6),(cx,6)], 'red')            # 羽飾
    c.rect(cx-8, 29, cx+8, 40, 'steel'); c.rect(cx-8, 37, cx+8, 39, 'gold')  # 鎧甲＋腰帶
    c.ell(cx-9, 31, 3, 3, 'steel'); c.ell(cx+9, 31, 3, 3, 'steel')          # 肩甲
    c.rect(cx-11, 32, cx-9, 40, 'blue'); c.rect(cx+9, 32, cx+11, 40, 'blue')  # 手臂
    c.rect(cx-6, 41, cx-2, 49, 'blue'); c.rect(cx+2, 41, cx+6, 49, 'blue')   # 腿
    c.rect(cx-7, 50, cx-2, 54, 'steel'); c.rect(cx+2, 50, cx+7, 54, 'steel') # 鞋
    c.ell(cx-13, 39, 5, 6, 'blue'); c.rect(cx-14, 34, cx-12, 44, 'gold'); c.rect(cx-17, 38, cx-9, 40, 'gold')  # 盾
    c.rect(cx+12, 22, cx+13, 40, 'steel'); c.rect(cx+10, 39, cx+15, 40, 'gold'); c.rect(cx+12, 41, cx+13, 44, 'brown')  # 劍
    c.rect(cx-12, 40, cx-10, 41, 'skin'); c.rect(cx+10, 40, cx+11, 41, 'skin')
    face(c, cx, 18)
    return c
def elf():
    c = C(); cx = 22
    c.ell(cx, 22, 12, 9, 'hairY')                                          # 後髮
    body_base(c, cx)
    c.poly([(cx-11,17),(cx-17,12),(cx-11,21)], 'skin'); c.poly([(cx+11,17),(cx+17,12),(cx+11,21)], 'skin')  # 尖耳
    c.ell(cx, 13, 12, 8, 'hairY'); c.rect(cx-11, 13, cx-8, 24, 'hairY'); c.rect(cx+8, 13, cx+11, 24, 'hairY')
    c.rect(cx-10, 12, cx+10, 13, 'green')                                  # 頭帶
    c.poly([(cx-10,14),(cx+10,14),(cx+9,18),(cx+5,16),(cx+1,18),(cx-3,16),(cx-7,18),(cx-10,17)], 'hairY')   # 瀏海
    c.rect(cx-11, 40, cx-9, 41, 'skin'); c.rect(cx+9, 40, cx+11, 41, 'skin')
    c.rect(cx-7, 29, cx+7, 41, 'green'); c.rect(cx-7, 37, cx+7, 38, 'brown')
    c.rect(cx-10, 30, cx-8, 39, 'leaf'); c.rect(cx+8, 30, cx+10, 39, 'leaf')
    c.rect(cx-5, 42, cx-2, 49, 'brown'); c.rect(cx+2, 42, cx+5, 49, 'brown')
    c.rect(cx-6, 50, cx-1, 54, 'wood'); c.rect(cx+2, 50, cx+7, 54, 'wood')
    for i in range(22): c.put(cx+14+int(3*(1-((i-11)/11)**2)), 24+i, 'wood')   # 弓
    for i in range(22): c.put(cx+13, 24+i, 'cream')                           # 弦
    face(c, cx, 19, eye=(36,96,56), girl=True)
    return c
def witch():
    c = C(); cx = 22
    c.ell(cx, 23, 12, 8, 'hairB')
    body_base(c, cx)
    c.ell(cx, 13, 14, 4, 'purple'); c.poly([(cx-8,12),(cx+8,12),(cx+4,1),(cx-2,0)], 'purple'); c.rect(cx-9, 10, cx+9, 11, 'gold')  # 帽子
    c.rect(cx-11, 15, cx-8, 27, 'hairB'); c.rect(cx+8, 15, cx+11, 27, 'hairB')
    c.poly([(cx-9,14),(cx+9,14),(cx+9,17),(cx+4,15),(cx,18),(cx-4,15),(cx-9,17)], 'hairB')
    c.rect(cx-12, 38, cx-10, 39, 'skin'); c.rect(cx+10, 38, cx+11, 39, 'skin')
    c.poly([(cx-8,29),(cx+8,29),(cx+11,51),(cx-11,51)], 'purple'); c.rect(cx-8, 36, cx+8, 37, 'gold')  # 長袍
    c.rect(cx-11, 30, cx-9, 38, 'purple'); c.rect(cx+9, 30, cx+11, 38, 'purple')
    c.rect(cx-6, 52, cx-2, 54, 'brown'); c.rect(cx+2, 52, cx+6, 54, 'brown')
    c.rect(cx-13, 26, cx-12, 54, 'wood'); c.ell(cx-12, 24, 3, 3, 'blue')   # 法杖
    c.rect(cx+6, 34, cx+12, 40, 'red')                                    # 書
    face(c, cx, 19, eye=(70,48,130), girl=True)
    return c
def ninja():
    c = C(); cx = 22
    body_base(c, cx)
    c.ell(cx, 14, 12, 9, 'black'); c.rect(cx-11, 14, cx+11, 26, 'black')
    c.rect(cx-9, 17, cx+9, 21, 'skin')                                    # 只露眼睛
    c.poly([(cx+10,14),(cx+18,11),(cx+16,16)], 'red')                     # 頭巾尾巴
    c.rect(cx-8, 29, cx+8, 41, 'black'); c.rect(cx-8, 37, cx+8, 38, 'red')
    c.rect(cx-11, 30, cx-9, 39, 'black'); c.rect(cx+9, 30, cx+11, 39, 'black')
    c.rect(cx-6, 42, cx-2, 50, 'black'); c.rect(cx+2, 42, cx+6, 50, 'black')
    c.rect(cx-7, 51, cx-2, 54, 'hairK'); c.rect(cx+2, 51, cx+7, 54, 'hairK')
    c.rect(cx+12, 33, cx+13, 42, 'steel'); c.rect(cx+11, 42, cx+14, 43, 'gold'); c.rect(cx+12, 44, cx+13, 46, 'red')  # 匕首
    for dx in (-6, 3):
        for xx in range(cx+dx, cx+dx+3): c.px(xx, 17, OUT); c.px(xx, 18, (40,32,48)); c.px(xx, 19, (90,80,110))
        c.px(cx+dx, 18, (255,255,255))
    for xx in range(cx-6, cx-2): c.px(xx, 16, OUT)   # 眉
    for xx in range(cx+3, cx+7): c.px(xx, 16, OUT)
    c.rect(cx-12, 39, cx-10, 40, 'skin'); c.rect(cx+10, 39, cx+11, 40, 'skin')
    return c
if __name__ == '__main__':
    import sys
    chars = [('knight', knight()), ('elf', elf()), ('witch', witch()), ('ninja', ninja())]
    for n, c in chars:
        c.render().save(f'/home/claude/chars/{n}.png'); c.render(6).save(f'/home/claude/chars/{n}_x6.png')
    print('ok')
