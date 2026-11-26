import sys; import os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from iso import Iso, shade
from icons import icon
def new(): return Iso(160,160,70,90)
def signbox(s,face,u,v,name,c='w',w=7,h=7,cm=None):
    s.fbox(face,u,v,u+w-1,v+h-1,c); icon(s,face,u+1,v+1,name,cm)
def hang_sign(s,x,y,z,name,c='w',cm=None):
    # 從側面伸出的吊牌（畫在正面平面上，位於建築右前角外）
    F=('L',y,x,x+8)
    s.frect(F,0,z+6,8,z+6,'out')
    s.fbox(F,2,z-2,8,z+5,c); icon(s,F,3,z-1,name,cm)
def barrel(s,x,y):
    s.box(x,y,x+3,y+3,0,4,c='w',tex=False,top='wl')
def crate(s,x,y):
    s.box(x,y,x+4,y+4,0,4,c='wl',tex=False,top='rh')
def flag(s,x,y,z,h=7,c='r'):
    p=s.P(x,y,z); px,py=round(p[0]),int(p[1])
    for k in range(h): s.set(px,py-k,'out')
    for j in range(3):
        for i in range(1,5-j): s.set(px+i,py-h+1+j,c)
    for j in range(3):
        s.set(px+5-j,py-h+1+j,'out')
    s.set(px,py-h,'au')
def lantern(s,face,u,v):
    s.fset(face,u,v+2,'out'); s.fset(face,u,v+1,'gy'); s.fset(face,u,v,'out')
def flowers(s,face,u0,u1,v=0,c='r'):
    for u in range(u0,u1+1):
        s.fset(face,u,v,'grd'); s.fset(face,u,v+1,'gr' if u%2 else c)

# ================= 村子 =================
def house(roof='r',wall='w',shop=None):
    s=new()
    F,R=s.box(0,0,20,14,0,12,mat='wood',c=wall)
    s.door(F,8,5,8); s.window(F,2,4); s.window(R,5,4)
    if shop:
        s.awning(F,1,19,9,shop,'wh'); crate(s,21,15) if False else None
    s.gable_x(0,0,20,14,12,8,c=roof)
    s.chimney(14,3,15,7)
    if shop: barrel(s,20,15)
    return s.crop()
def mayor():
    s=new()
    F,R=s.box(0,0,26,16,0,4,mat='stone',c='s')
    F,R=s.box(0,0,26,16,4,20,mat='plaster',c='cr')
    for u in (0,9,17,26): s.frect(F,u,4,u,20,'w')
    s.frect(F,0,12,26,12,'w')
    for u in (0,8,16): s.frect(R,u,4,u,20,'w')
    s.door(F,11,6,9,z=4); s.window(F,3,14); s.window(F,20,14); s.window(R,5,14)
    flowers(s,F,2,8,4); flowers(s,F,18,24,4,'au')
    s.gable_x(0,0,26,16,20,10,c='bl')
    s.chimney(4,3,24,7)
    flag(s,22,8,26,9,'bl')
    return s.crop()
def arena():
    s=new()
    X,Y,Z=36,28,13
    # 後牆（看得到內側）
    s.box(0,0,X,3,0,Z,mat='stone',c='s',top='sl'); s.box(0,0,3,Y,0,Z,mat='stone',c='s',top='sl')
    s.flat_top(3,3,X-3,Y-3,0,'sand')
    for k in range(5):
        p=s.P(8+k*5,8+(k*7)%12,0); s.set(round(p[0]),int(p[1]),'sandd')
    # 前牆
    F,_=s.box(0,Y-3,X,Y,0,Z,mat='stone',c='s',top='sl')
    _,R=s.box(X-3,0,X,Y-3,0,Z,mat='stone',c='s',top='sl')
    F=('L',Y,0,X); R=('R',X,0,Y)
    s.door(F,15,7,10,c='bk')
    for u in (4,27):
        s.frect(F,u,4,u+4,11,'out'); s.frect(F,u+1,5,u+3,11,'r'); s.frect(F,u+2,6,u+2,10,'au')
    s.frect(R,11,4,15,11,'out'); s.frect(R,12,5,14,11,'r'); s.frect(R,13,6,13,10,'au')
    flag(s,0,0,Z+1,8,'r'); flag(s,X,0,Z+1,8,'r'); flag(s,0,Y,Z+1,8,'r'); flag(s,X,Y,Z+1,8,'r')
    return s.crop()
def temple():
    s=new()
    # 後面鐘塔
    s.box(18,0,28,8,0,34,mat='plaster',c='cr')
    Ft,Rt=('L',8,18,28),('R',28,0,8)
    s.frect(Ft,3,26,6,30,'out'); s.frect(Ft,4,26,5,29,'au')
    s.pyramid(18,0,28,8,34,12,c='bl')
    p=s.P(23,4,46); s.set(round(p[0]),int(p[1])-1,'au'); s.set(round(p[0]),int(p[1])-2,'au')
    F,R=s.box(0,8,30,26,0,18,mat='plaster',c='cr')
    s.frect(F,0,0,30,2,'sl'); s.frect(R,0,0,18,2,'s')
    s.window(R,4,6,3,7); s.window(R,11,6,3,7)
    s.gable_y(0,8,30,26,18,12,c='bl',wallc='cr')
    # 正面：玫瑰窗＋大門
    for du in range(-3,4):
        for dv in range(-3,4):
            if du*du+dv*dv<=10: s.fset(F,15+du,22+dv,'out')
            if du*du+dv*dv<=5: s.fset(F,15+du,22+dv,'pul' if (du+dv)%2 else 'pu')
    s.fset(F,15,22,'au')
    s.door(F,12,7,12,c='wd')
    icon(s,F,13,14,'cross')
    s.window(F,4,6,3,7); s.window(F,24,6,3,7)
    return s.crop()
def clinic():
    s=new()
    F,R=s.box(0,0,20,14,0,13,mat='plaster',c='cr')
    s.frect(F,0,0,20,1,'grd'); 
    s.door(F,3,5,8,c='gr'); s.window(F,12,4,5,5)
    s.awning(F,10,19,10,'gr','wh')
    s.window(R,5,5)
    s.gable_x(0,0,20,14,13,8,c='gr')
    hang_sign(s,20,14,9,'potion',cm={'p':'r'})
    return s.crop()
def inn():
    s=new()
    F,R=s.box(0,0,26,16,0,22,mat='wood',c='w')
    s.frect(F,0,11,26,11,'wd'); s.frect(R,0,11,16,11,'wd')
    s.door(F,4,6,9); s.window(F,16,3,5,5)
    s.window(F,5,14,4,4); s.window(F,17,14,4,4); s.window(R,6,14,4,4)
    signbox(s,F,11,13,'bed',c='wl',w=7,h=6) if False else None
    s.gable_x(0,0,26,16,22,10,c='r')
    s.chimney(5,3,27,7)
    hang_sign(s,26,16,14,'bed',cm={'p':'r'})
    return s.crop()
def plaza_bench(s,x,y):   # 和村子街邊的長椅同一個做法（prop_bench）
    for xx in (x+1,x+9): s.box(xx,y,xx+1,y+3,0,3,c='wd',tex=False,top='wd')
    s.box(x,y,x+11,y+3,3,4,c='w',tex=False,top='wl')
    s.box(x,y,x+11,y+1,4,8,c='w',tex=False,top='wl')
def plaza_flowers(s,x,y):   # 和 prop_flowers 同一個做法
    s.box(x,y,x+10,y+4,0,3,c='w',tex=False,top='grd')
    for (dx,dy,c) in ((1,1,'r'),(3,2,'au'),(5,1,'pul'),(7,2,'rl'),(9,1,'au'),(2,3,'gr'),(6,3,'r'),(8,3,'gr'),(4,1,'gr')):
        p=s.P(x+dx,y+dy,3); s.set(round(p[0]),int(p[1]),c); s.set(round(p[0]),int(p[1])-1,c if c!='gr' else 'grl')
def plaza_lamp(s,x,y):   # 和 prop_lamp 同一個做法
    s.box(x,y,x+2,y+2,0,1,c='bk',tex=False,top='sd'); s.box(x+.5,y+.5,x+1.5,y+1.5,1,20,c='bk',tex=False,top='bk')
    F,R=s.box(x-1,y-1,x+3,y+3,20,25,c='bk',tex=False,top='bk'); s.window(F,1,21,2,3); s.window(R,1,21,2,3); s.pyramid(x-1,y-1,x+3,y+3,25,3,c='bk')
def plaza():
    # v17.42：兩層噴水池、長椅、花圃（和街邊小物同做法）
    s=new()
    s.flat_top(-8,-8,32,24,0,'sl')
    for x in range(-8,32,6): s.line(s.P(x,-8,0),s.P(x,24,0),'s')
    for y in range(-8,24,6): s.line(s.P(-8,y,0),s.P(32,y,0),'s')
    s.outline_poly([s.P(-8,24,0),s.P(32,24,0),s.P(32,-8,0),s.P(-8,-8,0)])
    # 後排：長椅、花圃、路燈（先畫，噴水池蓋在前面）
    plaza_bench(s,-2,-7); plaza_bench(s,14,-7); plaza_flowers(s,-7,6)
    # 噴水池：石砌矮牆（和其他建築同樣的石牆紋理）、四角小石墩、水面
    F,R=s.box(4,0,22,16,0,4,mat='stone',c='s',top='sl')
    s.flat_top(5,1,21,15,4,'g')
    for k in range(6): p=s.P(7+k*2,3+k*2,4); s.set(round(p[0]),int(p[1]),'gl')
    # 中間：石台＋上層大水盆＋往上噴的水柱
    s.box(10,5,16,11,4,10,c='s',tex=False,top='sl')
    s.box(7,2,19,14,10,13,c='s',tex=False,top='sl'); s.flat_top(8,3,18,13,13,'g')
    for k in range(4): p=s.P(10+k*2,5+k*2,13); s.set(round(p[0]),int(p[1]),'gl')
    top=s.P(13,8,13); tx,ty=round(top[0]),int(top[1])
    for k in range(1,8): s.set(tx,ty-k,'gh' if k>4 else 'gl'); s.set(tx+1,ty-k,'gl' if k>2 else 'g')
    for d in (-1,1):
        for i,(dx,dy) in enumerate(((1,-8),(2,-8),(3,-7),(4,-6),(5,-5))): s.set(tx+(dx if d>0 else 1-dx),ty+dy,'gh' if i<2 else 'gl')
    # 前排：花圃、路燈
    plaza_flowers(s,22,19)
    return s.crop()
def office_tower(s,t):
    # v17.43：大陸事務所的塔樓（石牆紋理、金色腰帶、小窗、藍色尖頂）
    TF,TR=s.box(t[0],t[1],t[0]+8,t[1]+8,0,30,mat='stone',c='cr')
    s.frect(TF,0,0,8,3,'au'); s.frect(TR,0,0,8,3,'ad'); s.frect(TF,0,22,8,23,'au'); s.frect(TR,0,22,8,23,'ad')
    s.window(TF,3,13,3,5); s.window(TR,3,13,3,5)
    s.pyramid(t[0],t[1],t[0]+8,t[1]+8,30,10,c='bl')
def office(stage='地方'):
    s=new()
    if stage=='地方':
        F,R=s.box(0,0,22,14,0,13,mat='wood',c='w')
        s.door(F,3,5,8); s.window(F,13,5,5,4); s.window(R,5,5)
        s.gable_x(0,0,22,14,13,8,c='au')   # v17.41：黃色屋頂，和酒館、民宅分得出來
        # 門口旁邊立一塊金黃看板：兩根木柱、左邊金幣、右邊兩道「字」
        for x in (-12,-3): s.box(x,15,x+1,16,0,10,c='wd',tex=False,top='w')
        G=('L',16,-14,0); s.fbox(G,0,8,14,17,'au'); s.frect(G,1,9,13,9,'ad')
        icon(s,G,2,10,'coin')
        for u0 in (8,11): s.frect(G,u0,11,u0+1,15,'wd')
        hang_sign(s,22,14,10,'coin')
    elif stage=='王都':
        F,R=s.box(0,0,26,16,0,4,mat='stone',c='s')
        F,R=s.box(0,0,26,16,4,20,mat='plaster',c='cr')
        s.door(F,11,6,9,z=4); s.window(F,3,8); s.window(F,20,8); s.window(F,11,15,5,3); s.window(R,6,10)
        s.fbox(F,9,14,17,19,'bl') if False else None
        s.gable_x(0,0,26,16,20,10,c='bl')
        hang_sign(s,26,16,14,'coin')
        flag(s,13,8,26,8,'au')
    elif stage=='王國':
        F,R=s.box(0,0,30,18,0,24,mat='stone',c='cr')
        s.frect(F,0,0,30,3,'crd'); s.frect(R,0,0,18,3,'crx')
        s.door(F,12,7,11,c='wd'); s.window(F,4,8,4,7); s.window(F,23,8,4,7); s.window(R,7,10,4,6)   # v17.43：正面只留兩扇
        for u in range(0,31,3): s.fset(F,u,24,'au')
        s.gable_x(0,0,30,18,24,10,c='bl')
        s.box(24,-2,32,6,24,34,mat='plaster',c='cr')
        s.pyramid(24,-2,32,6,34,10,c='bl')
        icon(s,F,13,19,'coin')
        flag(s,28,2,44,8,'au')
    elif stage=='大陸':
        office_tower(s,(-7,16))   # v17.43：後面那座先畫，被主建築擋住一點、稍微凸出
        F,R=s.box(0,0,36,20,0,26,mat='stone',c='cr')
        s.frect(F,0,0,36,3,'au'); s.frect(R,0,0,20,3,'ad')
        for u in (6,15,21,30): s.frect(F,u,4,u+1,22,'crd')
        s.door(F,15,7,12,c='bl'); s.window(F,2,8,3,7); s.window(F,32,8,3,7); s.window(F,9,8,3,7); s.window(F,25,8,3,7); s.window(R,8,10,4,7)
        s.frect(F,0,24,36,26,'au')
        s.gable_y(0,0,36,20,26,12,c='bl',wallc='cr')
        icon(s,F,16,28,'coin')
        office_tower(s,(34,14))
        flag(s,18,10,44,9,'bl')
    elif stage=='地下':
        F,R=s.box(0,0,24,16,0,13,mat='stone',c='sx')
        s.door(F,3,5,8,c='bk'); s.window(F,14,5,4,4,lit=True); s.window(R,6,5,4,4,lit=True)
        s.gable_x(0,0,24,16,13,8,c='pud',wallc='sx')
        hang_sign(s,24,16,9,'moon',cm={'p':'au'})
        lantern(s,F,1,7); lantern(s,F,11,7)
    return s.crop()
def tavern():
    s=new()
    F,R=s.box(0,0,26,16,0,4,mat='stone',c='s')
    F,R=s.box(0,0,26,16,4,18,mat='wood',c='w')
    s.door(F,4,6,9,z=0); s.window(F,16,6,5,5,lit=False)
    s.window(R,6,8)
    s.gable_x(0,0,26,16,18,10,c='br')
    s.chimney(18,3,22,7)
    hang_sign(s,26,16,12,'mug')
    barrel(s,-4,18); barrel(s,12,19)
    return s.crop()
def guild():
    s=new()
    F,R=s.box(0,0,34,20,0,5,mat='stone',c='s')
    F,R=s.box(0,0,34,20,5,24,mat='plaster',c='cr')
    for u in (0,11,23,34): s.frect(F,u,5,u,24,'w')
    s.frect(F,0,15,34,15,'w'); s.frect(R,0,15,20,15,'w')
    for u in (0,10,20): s.frect(R,u,5,u,24,'w')
    s.door(F,14,7,11,z=0)
    s.window(F,4,8,4,5); s.window(F,26,8,4,5); s.window(R,13,8,4,5)
    s.gable_y(0,0,34,20,24,14,c='bl',wallc='cr')
    s.fbox(F,12,16,22,24,'bl'); icon(s,F,15,18,'swords')
    # 旗幟
    for u in (5,27):
        s.frect(F,u-1,16,u+3,24,'out'); s.frect(F,u,17,u+2,24,'r'); s.fset(F,u+1,19,'au')
    return s.crop()
def smith():
    s=new()
    F,R=s.box(0,0,24,16,0,14,mat='stone',c='s')
    # 開放的工作區（正面右半）
    s.frect(F,12,0,23,10,'out'); s.frect(F,13,0,22,9,'bk')
    s.frect(F,14,0,17,4,'fire'); s.frect(F,15,1,16,3,'au')
    s.door(F,3,5,8)
    s.window(R,5,5)
    s.gable_x(0,0,24,16,14,8,c='sd',wallc='s')
    s.box(18,4,22,8,18,26,c='s',tex=False,top='bk')
    # 鐵砧
    s.box(26,18,30,20,0,2,c='bk',tex=False,top='sd'); s.box(25,18,31,20,2,4,c='sd',tex=False,top='sl')
    # 煙
    p=s.P(20,6,28); x,y=round(p[0]),int(p[1])
    for (dx,dy) in ((0,-1),(1,-1),(1,-2),(0,-3),(2,-4),(1,-5),(2,-5),(0,-6),(1,-6),(2,-7),(3,-8),(2,-8)): s.set(x+dx,y+dy,'sl')
    return s.crop()
def stable():
    s=new()
    F,R=s.box(0,0,28,14,0,10,mat='wood',c='w')
    for u in (2,10,18): s.frect(F,u,0,u+6,7,'out'); s.frect(F,u+1,0,u+5,6,'wd'); s.frect(F,u+1,3,u+5,3,'wl')
    s.window(R,5,5,4,3)
    s.gable_x(0,0,28,14,10,7,c='r')
    # 乾草堆
    s.box(30,10,36,15,0,4,c='au',tex=False,top=(252,220,120))
    icon(s,('L',14,0,28),20,9,'horse') if False else None
    return s.crop()
def station():
    # v17.39：拿掉候車棚和長椅（像桌子、和馬車擠在一起），留站房＋站牌；馬車在遊戲裡另外畫在旁邊
    s=new()
    F,R=s.box(0,0,18,12,0,12,mat='wood',c='w')
    s.door(F,3,5,8); s.window(F,11,5,4,4); s.window(R,4,5)
    s.gable_x(0,0,18,12,12,7,c='bl')
    s.box(-5,13,-4,14,0,17,c='wd',tex=False,top='w')   # 站牌木柱
    G=('L',14,-9,0); s.fbox(G,0,12,8,18,'bl')            # 藍底牌子，上面一台小馬車
    for u,v in ((2,14),(3,14),(4,14),(5,14),(2,15),(3,15),(4,15),(5,15),(6,15),(2,16),(5,16)): s.fset(G,u,v,'cr')
    return s.crop()
def telepad(open_=True):
    s=new()
    s.box(0,0,24,24,0,2,mat='stone',c='s',top='sl' if not open_ else 'pud')
    if open_:
        for a in range(0,360,12):
            import math
            x=12+8*math.cos(math.radians(a)); y=12+8*math.sin(math.radians(a))
            p=s.P(x,y,2); s.set(round(p[0]),int(p[1]),'pul')
            x=12+4*math.cos(math.radians(a)); y=12+4*math.sin(math.radians(a))
            p=s.P(x,y,2); s.set(round(p[0]),int(p[1]),'gl')
        p=s.P(12,12,2); s.set(round(p[0]),int(p[1]),'wh')
    for (x,y) in ((1,1),(21,1),(1,21),(21,21)):
        s.box(x,y,x+2,y+2,2,14,c='s',tex=False,top='pul' if open_ else 'sl')
    return s.crop()
def gate():
    s=new()
    for y in (0,22):
        s.box(0,y,6,y+5,0,22,mat='stone',c='s',top='sl')
        s.pyramid(0,y,6,y+5,22,6,c='r')
    s.box(1,5,5,22,17,20,c='w',tex=False,top='wl')
    Fb=('R',5,5,22)
    s.fbox(Fb,4,11,13,18,'wl'); 
    flag(s,3,24,28,6,'r')
    return s.crop()
# 勇者的家
def home(level='租屋'):
    s=new()
    if level=='租屋':
        F,R=s.box(0,0,16,12,0,10,mat='wood',c='br')
        s.door(F,2,4,7,c='wd'); s.window(F,10,4,3,3); s.window(R,4,4,3,3)
        s.frect(F,10,1,13,1,'wd')
        s.gable_x(0,0,16,12,10,6,c='w',wallc='br')
        # 補丁
        p=s.P(6,10,13); s.set(round(p[0]),int(p[1]),'r'); s.set(round(p[0])+1,int(p[1]),'r')
        return s.crop()
    F,R=s.box(0,0,22,14,0,3,mat='stone',c='s')
    F,R=s.box(0,0,22,14,3,15,mat='plaster',c='cr')
    s.door(F,9,5,9,z=3,c='r'); s.window(F,2,7); s.window(F,16,7); s.window(R,5,7)
    flowers(s,F,1,7,3); flowers(s,F,15,21,3,'au')
    s.gable_x(0,0,22,14,15,9,c='bl',wallc='cr')
    s.chimney(15,3,19,7)
    if level in ('結婚','有小孩'):
        icon(s,F,10,13,'heart') if False else None
        # 花圃＋信箱
        s.box(24,16,30,20,0,1,c='grd',tex=False,top='gr')
        for (x,y,c) in ((25,17,'r'),(27,18,'au'),(29,17,'pul'),(26,19,'rl')):
            p=s.P(x,y,1); s.set(round(p[0]),int(p[1]),c)
        p=s.P(-2,18,0); x,y=round(p[0]),int(p[1])
        for k in range(6): s.set(x,y-k,'out')
        for i in range(-2,3):
            for j in range(3): s.set(x+i,y-6-j,'r' if abs(i)<2 and j==1 else 'out')
    if level=='有小孩':
        # 加蓋的小房間＋鞦韆
        F2,R2=s.box(22,2,30,12,0,9,mat='plaster',c='cr')
        s.window(F2,2,4,3,3) if False else s.window(R2,3,4,3,3)
        s.gable_y(22,2,30,12,9,5,c='bl',wallc='cr')
        sx0=s.P(-8,4,0); 
        for xx in (-10,-4):
            s.line(s.P(xx,6,0),s.P(xx,6,11),'wd')
        s.line(s.P(-10,6,11),s.P(-4,6,11),'wd')
        s.line(s.P(-8,6,11),s.P(-8,6,4),'out'); s.line(s.P(-6,6,11),s.P(-6,6,4),'out')
        s.line(s.P(-8,6,4),s.P(-6,6,4),'r')
    return s.crop()
# ================= 王都 =================
def castle():
    s=Iso(220,200,100,110)
    def tower(x,y):
        s.box(x,y,x+8,y+8,0,30,mat='stone',c='s')
        s.pyramid(x,y,x+8,y+8,30,12,c='bl'); flag(s,x+4,y+4,42,7,'au')
    tower(-4,-4)
    F,R=s.box(0,0,48,32,0,20,mat='stone',c='s')
    s.crenels(0,0,48,32,20)
    s.door(F,19,9,13,c='wd')
    s.box(14,4,34,20,20,44,mat='stone',c='sl')
    Fk=('L',20,14,34); s.window(Fk,8,30,3,6); s.window(Fk,3,36,2,3); s.window(Fk,15,36,2,3)
    s.gable_x(14,4,34,20,44,12,c='bl',wallc='sl')
    flag(s,24,12,56,9,'r')
    tower(44,-4); tower(-4,26); tower(44,26)
    return s.crop()
def cap_house(roof='r'):
    s=new()
    F,R=s.box(0,0,18,14,0,4,mat='stone',c='s')
    F,R=s.box(0,0,18,14,4,18,mat='plaster',c='cr')
    for u in (0,9,18): s.frect(F,u,4,u,18,'w')
    s.frect(F,0,11,18,11,'w')
    s.door(F,2,5,7,z=4); s.window(F,12,6,3,3); s.window(F,4,13,3,3); s.window(F,12,13,3,3); s.window(R,5,13,3,3)
    s.gable_y(0,0,18,14,18,10,c=roof,wallc='cr')
    return s.crop()
def cap_station():
    s=new()
    F,R=s.box(0,0,26,16,0,4,mat='stone',c='s')
    F,R=s.box(0,0,26,16,4,16,mat='wood',c='w')
    s.door(F,3,6,9,z=0); s.frect(F,13,0,22,9,'out'); s.frect(F,14,0,21,8,'wd'); s.frect(F,17,0,17,8,'out')
    s.window(R,6,8)
    s.gable_x(0,0,26,16,16,9,c='bl')
    hang_sign(s,26,16,11,'horse')
    # 馬車
    s.box(30,14,40,20,2,9,c='r',tex=False,top='rl'); 
    for xx in (31,38):
        p=s.P(xx,20,2); x,y=round(p[0]),int(p[1])
        for dx,dy in ((0,0),(1,0),(-1,0),(0,1),(0,-1)): s.set(x+dx,y+dy,'out')
        s.set(x,y,'au')
    return s.crop()
VILLAGE={'村長家':mayor,'鬥技場':arena,'神殿':temple,'藥局':clinic,'旅館':inn,'廣場':plaza,'事務所':office,'酒館':tavern,'冒險者公會':guild,'鐵匠鋪':smith,'民宅':house,'勇者的家':home,'馬廄':stable,'驛馬車站':station,'傳送陣':telepad,'村口':gate}
# ================= 遊戲用小物（斜角） =================
def horse_iso(c='br'):
    s=new()
    # 身體沿 x（朝右下走），四條腿、頭在右前
    for (x,y) in ((1,3),(1,5),(8,3),(8,5)): s.box(x,y,x+1,y+1,0,5,c='brd',tex=False,top='brd')
    s.box(0,2,10,6,5,10,c=c,tex=False,top='brl')
    s.box(9,3,12,5,9,15,c=c,tex=False,top='brl')     # 脖子
    s.box(11,3,15,5,13,16,c=c,tex=False,top='brl')   # 頭
    p=s.P(13,5,15); s.set(round(p[0]),int(p[1]),'bk')
    for k in range(4): p=s.P(9-k,3,10+k//2); s.set(round(p[0]),int(p[1]),'bk')   # 鬃毛
    p=s.P(0,4,9); s.set(round(p[0])-1,int(p[1]),'bk'); s.set(round(p[0])-2,int(p[1])+1,'bk')   # 尾巴
    return s.crop()
def coach_iso():
    s=new()
    # 車廂
    s.box(0,0,14,8,3,13,c='r',tex=False,top='rl')
    F=('L',8,0,14); s.window(F,4,7,5,4)
    s.box(-1,-1,15,9,13,14,c='rd',tex=False,top='rd')
    s.box(14,1,18,7,3,7,c='w',tex=False,top='wl')   # 駕駛座
    for xx in (2,11):
        p=s.P(xx,8,3); x,y=round(p[0]),int(p[1])
        for dx,dy in ((0,0),(1,0),(-1,0),(0,1),(0,-1),(1,1),(-1,-1),(1,-1),(-1,1)): s.set(x+dx,y+dy,'out')
        s.set(x,y,'au')
    # 前面的馬
    for (x,y) in ((21,3),(21,5),(27,3),(27,5)): s.box(x,y,x+1,y+1,0,5,c='brd',tex=False,top='brd')
    s.box(20,2,29,6,5,10,c='w',tex=False,top='wl')
    s.box(28,3,31,5,9,15,c='w',tex=False,top='wl'); s.box(30,3,34,5,13,16,c='w',tex=False,top='wl')
    p=s.P(32,5,15); s.set(round(p[0]),int(p[1]),'bk')
    s.line(s.P(18,4,6),s.P(21,4,8),'out')
    return s.crop()
# ================= 村口木樁、街邊小物（斜角，遊戲用） =================
def gate_post(sign=False):
    s=new()
    s.box(0,0,3,3,0,18,mat='wood',c='w',top='wl')
    p=s.P(1.5,1.5,21); x,y=round(p[0]),int(p[1])   # 削尖的頂
    for k in range(3):
        for i in range(-2+k,3-k): s.set(x+i,y+k,'wl' if i<0 else 'w')
    s.box(-1,2,4,3,13,14,c='wd',tex=False,top='w')   # 綁繩
    if sign:
        F=('L',3,-6,9); s.fbox(F,0,6,14,11,'wl'); s.frect(F,2,8,12,8,'w')
    return s.crop()
def prop_lamp():
    s=new()
    s.box(0,0,2,2,0,1,c='bk',tex=False,top='sd')
    s.box(0.5,0.5,1.5,1.5,1,20,c='bk',tex=False,top='bk')
    F,R=s.box(-1,-1,3,3,20,25,c='bk',tex=False,top='bk')
    s.window(F,1,21,2,3); s.window(R,1,21,2,3)
    s.pyramid(-1,-1,3,3,25,3,c='bk')
    return s.crop()
def prop_crate():
    s=new(); s.box(0,0,6,6,0,6,c='wl',tex=False,top=(252,210,150))
    F=('L',6,0,6); R=('R',6,0,6)
    for f in (F,R): s.line(s.fpt(f,0,0),s.fpt(f,6,6),'wd'); s.line(s.fpt(f,0,6),s.fpt(f,6,0),'wd')
    return s.crop()
def prop_barrel():
    s=new(); s.box(0,0,5,5,0,7,c='w',mat='wood',top='wl')
    for v in (1,5): s.frect(('L',5,0,5),0,v,5,v,'sd'); s.frect(('R',5,0,5),0,v,5,v,'sd')
    return s.crop()
def prop_bench():
    s=new()
    for x in (1,9): s.box(x,0,x+1,3,0,3,c='wd',tex=False,top='wd')
    s.box(0,0,11,3,3,4,c='w',tex=False,top='wl')
    s.box(0,0,11,1,4,8,c='w',tex=False,top='wl')
    return s.crop()
def prop_flowers():
    s=new(); s.box(0,0,10,4,0,3,c='w',tex=False,top='grd')
    for (x,y,c) in ((1,1,'r'),(3,2,'au'),(5,1,'pul'),(7,2,'rl'),(9,1,'au'),(2,3,'gr'),(6,3,'r'),(8,3,'gr'),(4,1,'gr')):
        p=s.P(x,y,3); s.set(round(p[0]),int(p[1]),c); s.set(round(p[0]),int(p[1])-1,c if c!='gr' else 'grl')
    return s.crop()
