# 斜 45 度（2:1 等角）建築畫筆：Kenney Tiny 系列配色、深棕外框、兩三階平塗
# 座標：x 往右下（正面＝左下那一面，沿 x 展開），y 往左下（側面＝右下那一面），z 往上
from PIL import Image
OUT=(63,38,49)
PAL=dict(
 out=OUT,
 r=(195,75,53), rl=(242,132,98), rh=(252,188,143), rd=(140,52,44),
 s=(139,155,180), sl=(192,203,220), sd=(90,105,136), sx=(70,82,110),
 w=(189,108,74), wl=(234,165,108), wd=(118,59,54),
 g=(41,122,174), gl=(120,200,255), gh=(220,245,255), gy=(255,214,110),
 au=(247,194,74), ad=(196,128,44),
 gr=(71,159,74), grl=(132,198,105), grd=(40,110,60),
 cr=(244,232,200), crd=(210,190,150), crx=(176,150,112),
 pu=(120,80,160), pul=(170,120,210), pud=(80,50,110),
 bl=(60,110,180), bll=(110,160,220), bld=(40,70,130),
 wh=(255,255,255), bk=(38,43,68), fire=(255,150,60), sand=(232,200,130), sandd=(200,160,96),
 br=(150,96,64), brl=(196,140,92), brd=(100,60,44),
 tl=(64,170,160), tll=(120,220,200), tld=(40,110,110),
)
def shade(c,k):
    c=PAL[c] if isinstance(c,str) else c
    return tuple(max(0,min(255,int(v*k))) for v in c)
class Iso:
    def __init__(s,W,H,ox,oy):
        s.W=W; s.H=H; s.ox=ox; s.oy=oy
        s.im=Image.new('RGBA',(W,H)); s.px=s.im.load()
    def P(s,x,y,z): return (s.ox+x-y, s.oy+(x+y)/2-z)
    def col(s,c): return PAL[c] if isinstance(c,str) else c
    def set(s,x,y,c):
        x=int(x); y=int(y)
        if 0<=x<s.W and 0<=y<s.H and c is not None: s.px[x,y]=s.col(c)+(255,)
    def poly(s,pts,c):
        ys=[p[1] for p in pts]
        for y in range(int(min(ys))-1,int(max(ys))+2):
            xs=[]
            for i in range(len(pts)):
                (ax,ay),(bx,by)=pts[i],pts[(i+1)%len(pts)]
                if (ay<=y+.5<by) or (by<=y+.5<ay): xs.append(ax+(y+.5-ay)*(bx-ax)/(by-ay))
            xs.sort()
            for k in range(0,len(xs)-1,2):
                for x in range(int(round(xs[k])),int(round(xs[k+1]))): s.set(x,y,c)
    def line(s,a,b,c='out'):
        (x0,y0),(x1,y1)=a,b
        n=int(max(abs(x1-x0),abs(y1-y0)))+1
        for i in range(n+1):
            t=i/max(1,n); s.set(round(x0+(x1-x0)*t-0.0001) if x1>=x0 else round(x0+(x1-x0)*t+0.0001), y0+(y1-y0)*t, c)
    def outline_poly(s,pts,c='out'):
        for i in range(len(pts)): s.line(pts[i],pts[(i+1)%len(pts)],c)
    # ---- 面上的局部座標 ----
    # 正面（y=Y0 平面，沿 x）：u→x，v→z ；側面（x=X1 平面，沿 -y）：u→(Y1-y)，v→z
    def fpt(s,face,u,v):
        kind,a,b0,b1=face   # ('L', y, x0, x1) or ('R', x, y0, y1)
        if kind=='L': return s.P(b0+u,a,v)
        else: return s.P(a,b1-u,v)
    def fset(s,face,u,v,c):
        x,y=s.fpt(face,u,v); s.set(round(x),int(y+0.5) if False else int(y),c)
    def frect(s,face,u0,v0,u1,v1,c):
        for u in range(int(u0),int(u1)+1):
            for v in range(int(v0),int(v1)+1): s.fset(face,u,v,c)
    def fbox(s,face,u0,v0,u1,v1,c,o='out'):
        s.frect(face,u0,v0,u1,v1,o); s.frect(face,u0+1,v0+1,u1-1,v1-1,c)
    # ---- 牆面材質 ----
    def wall_tex(s,face,L,Z0,Z1,mat,dark):
        if mat=='wood':
            for v in range(Z0+3,Z1,3): s.frect(face,0,v,L,v,dark)
        elif mat=='stone':
            row=0
            for v in range(Z0+3,Z1,4):
                s.frect(face,0,v,L,v,dark)
                for u in range(2+(row%2)*3,L,6): s.frect(face,u,v+1,u,min(v+3,Z1-1),dark)
                row+=1
        elif mat=='plaster':
            pass
        elif mat=='timber':
            pass
    # ---- 盒子（牆） ----
    def box(s,x0,y0,x1,y1,z0,z1,mat='wood',c='w',light=None,top=None,tex=True):
        # 可見：正面 y=y1（左下）、側面 x=x1（右下）、頂面
        cL=s.col(c); cR=shade(c,.80); dark=shade(c,.72)
        F=('L',y1,x0,x1); R=('R',x1,y0,y1)
        A=s.P(x0,y1,z0); B=s.P(x1,y1,z0); C=s.P(x1,y0,z0)
        A2=s.P(x0,y1,z1); B2=s.P(x1,y1,z1); C2=s.P(x1,y0,z1); D2=s.P(x0,y0,z1)
        s.poly([A,B,B2,A2],cL); s.poly([B,C,C2,B2],cR)
        if top: s.poly([A2,B2,C2,D2],top)
        if tex:
            s.wall_tex(F,x1-x0,z0,z1,mat,shade(c,.78)); s.wall_tex(R,y1-y0,z0,z1,mat,shade(c,.64))
        s.outline_poly([A,B,B2,A2]); s.outline_poly([B,C,C2,B2])
        if top: s.outline_poly([A2,B2,C2,D2])
        return F,R
    # ---- 屋頂 ----
    def shingle(s,pts,c,ridge,eave_dir):
        tmp=Iso(s.W,s.H,s.ox,s.oy); tmp.poly(pts,'r')
        light={'r':'rl','s':'sl','w':'wl','bl':'bll','gr':'grl','pu':'pul','br':'brl','tl':'tll','sd':'s','au':'wh','cr':'wh'}.get(c,'wh') if isinstance(c,str) else shade(c,1.25)
        dark=shade(c,.78)
        ins=lambda x,y: 0<=x<s.W and 0<=y<s.H and tmp.px[x,y][3]
        for y in range(s.H):
            for x in range(s.W):
                if not(ins(x,y) and ins(x,y-1) and ins(x+1,y) and ins(x-1,y) and ins(x,y+1)): continue
                d=y - eave_dir*x/2.0
                row=int((d+100)//4); r=(d+100)-row*4
                if r<1: s.set(x,y,dark)
                elif r<2 and (x+row*2)%4==0: s.set(x,y,dark)
                elif r>=3 and (x+row*2)%4 in (1,2) : s.set(x,y,light)
    def gable_x(s,x0,y0,x1,y1,z,R,c='r',over=1,wallc='w'):
        # 屋脊沿 x：前坡朝左下，右側是山牆三角
        ym=(y0+y1)/2
        e0=s.P(x0-over,y1+over,z-over*0); e1=s.P(x1+over,y1+over,z)
        r0=s.P(x0-over,ym,z+R); r1=s.P(x1+over,ym,z+R)
        b0=s.P(x0-over,y0-over,z); b1=s.P(x1+over,y0-over,z)
        # 後坡（可能露一點）
        s.poly([r0,r1,b1,b0],shade(c,.75)); s.outline_poly([r0,r1,b1,b0])
        # 山牆三角（側面）
        g0=s.P(x1,y1,z); g1=s.P(x1,y0,z); gm=s.P(x1,ym,z+R)
        s.poly([g0,g1,gm],shade(wallc,.8)); s.outline_poly([g0,g1,gm])
        # 側面屋頂厚度（山牆邊的瓦緣）
        s.poly([e1,r1,s.P(x1+over,ym,z+R-1),s.P(x1+over,y1+over,z-1)],shade(c,.6)); s.outline_poly([e1,r1,s.P(x1+over,ym,z+R-1),s.P(x1+over,y1+over,z-1)])
        s.poly([r1,b1,s.P(x1+over,y0-over,z-1),s.P(x1+over,ym,z+R-1)],shade(c,.6)); s.outline_poly([r1,b1,s.P(x1+over,y0-over,z-1),s.P(x1+over,ym,z+R-1)])
        # 前坡
        s.poly([e0,e1,r1,r0],c); s.shingle([e0,e1,r1,r0],c,None,1); s.outline_poly([e0,e1,r1,r0])
        return ('R',x1,y0,y1)
    def gable_y(s,x0,y0,x1,y1,z,R,c='r',over=1,wallc='w'):
        # 屋脊沿 y：右坡朝右下，正面是山牆三角
        xm=(x0+x1)/2
        e0=s.P(x1+over,y0-over,z); e1=s.P(x1+over,y1+over,z)
        r0=s.P(xm,y0-over,z+R); r1=s.P(xm,y1+over,z+R)
        b0=s.P(x0-over,y0-over,z); b1=s.P(x0-over,y1+over,z)
        s.poly([r0,r1,b1,b0],shade(c,.75)); s.outline_poly([r0,r1,b1,b0])
        g0=s.P(x0,y1,z); g1=s.P(x1,y1,z); gm=s.P(xm,y1,z+R)
        s.poly([g0,g1,gm],s.col(wallc)); s.outline_poly([g0,g1,gm])
        s.poly([b1,r1,s.P(xm,y1+over,z+R-2),s.P(x0-over,y1+over,z-2)],shade(c,.6)); s.outline_poly([b1,r1,s.P(xm,y1+over,z+R-2),s.P(x0-over,y1+over,z-2)])
        s.poly([r1,e1,s.P(x1+over,y1+over,z-2),s.P(xm,y1+over,z+R-2)],shade(c,.6)); s.outline_poly([r1,e1,s.P(x1+over,y1+over,z-2),s.P(xm,y1+over,z+R-2)])
        s.poly([e0,e1,r1,r0],shade(c,.85)); s.shingle([e0,e1,r1,r0],c,None,-1); s.outline_poly([e0,e1,r1,r0])
        return ('L',y1,x0,x1)
    def pyramid(s,x0,y0,x1,y1,z,R,c='s',over=1):
        xm=(x0+x1)/2; ym=(y0+y1)/2; T=s.P(xm,ym,z+R)
        A=s.P(x0-over,y1+over,z); B=s.P(x1+over,y1+over,z); C=s.P(x1+over,y0-over,z)
        s.poly([A,B,T],c); s.shingle([A,B,T],c,None,1); s.poly([B,C,T],shade(c,.8)); 
        s.outline_poly([A,B,T]); s.outline_poly([B,C,T])
        return T
    def flat_top(s,x0,y0,x1,y1,z,c):
        A=s.P(x0,y1,z); B=s.P(x1,y1,z); C=s.P(x1,y0,z); D=s.P(x0,y0,z)
        s.poly([A,B,C,D],c); s.outline_poly([A,B,C,D])
    def crenels(s,x0,y0,x1,y1,z,c='s',step=4):
        for x in range(x0,x1-1,step): s.box(x,y1-2,x+2,y1,z,z+3,c=c,tex=False,top=shade(c,1.15))
        for y in range(y1-step,y0,-step): s.box(x1-2,y,x1,y+2,z,z+3,c=c,tex=False,top=shade(c,1.15))
    # ---- 部件 ----
    def door(s,face,u,w=5,h=8,c='wd',arch=True,z=0):
        s.frect(face,u-1,z,u+w,z+h+1,'out'); s.frect(face,u,z,u+w-1,z+h,c)
        if arch: s.fset(face,u,z+h,'out'); s.fset(face,u+w-1,z+h,'out')
        s.frect(face,u,z+h-1 if not arch else z+h-1,u+w-1,z+h-1,shade(c,1.25)) if False else None
        for uu in range(u+2,u+w-1,2): s.frect(face,uu,z,uu,z+h-2,shade(c,.75))
        s.fset(face,u+w-2,z+h//2,'au')
    def window(s,face,u,v,w=4,h=4,frame='out',lit=False):
        s.frect(face,u-1,v-1,u+w,v+h,frame)
        s.frect(face,u,v,u+w-1,v+h-1,'gy' if lit else 'g'); s.frect(face,u,v+h-1,u+w-1,v+h-1,'gl' if not lit else 'wh'); s.fset(face,u,v+h-1,'gh' if not lit else 'wh')
        if w>=4: s.frect(face,u+w//2,v,u+w//2,v+h-1,frame) if w>=5 else None
    def awning(s,face,u0,u1,v,c1='r',c2='wh'):
        for u in range(u0,u1+1):
            cc=c1 if (u//2)%2==0 else c2
            s.frect(face,u,v,u,v+2,cc); s.fset(face,u,v-1,'out' if True else cc)
        s.frect(face,u0-1,v+3,u1+1,v+3,'out')
    def sign(s,face,u,v,w,h,c='w',icon=None):
        s.fbox(face,u,v,u+w-1,v+h-1,c)
        if icon: icon(s,face,u,v,w,h)
    def chimney(s,x,y,z,h,c='s'):
        s.box(x,y,x+3,y+3,z,z+h,c=c,tex=False,top='sd')
    def edge(s):
        src=s.im.copy(); sp=src.load()
        for y in range(s.H):
            for x in range(s.W):
                if sp[x,y][3]: continue
                for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
                    xx,yy=x+dx,y+dy
                    if 0<=xx<s.W and 0<=yy<s.H and sp[xx,yy][3]: s.px[x,y]=OUT+(255,); break
    def crop(s):
        s.edge(); bb=s.im.getbbox(); return s.im.crop((bb[0],bb[1],bb[2],bb[3]))
