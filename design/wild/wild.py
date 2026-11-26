# 野外背景物（v17.40 定案，正面風格）：草原、森林、荒地。Kenney Tiny Town／Dungeon（CC0）＋照同畫法補畫
import sys, random
from PIL import Image, ImageDraw, ImageFont, ImageEnhance
import os
A=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','assets')
TT=A+'/kenney-tiny-town/tiles/'; TD=A+'/kenney-tiny-dungeon/tiles/'
def hexc(s): return tuple(int(s[i:i+2],16) for i in (1,3,5))+(255,)
def tile(n, src=TT):
    im=Image.open(src+n+'.png').convert('RGBA'); p=im.load()
    for y in range(im.height):
        for x in range(im.width):
            if p[x,y][:3]==(41,122,174): p[x,y]=(0,0,0,0)   # 預覽圖沾到的藍色格線
    return im
def stack(*rows, src=TT):
    im=Image.new('RGBA',(len(rows[0])*16,len(rows)*16))
    for r,row in enumerate(rows):
        for c,n in enumerate(row):
            if n: im.alpha_composite(tile(n,src),(c*16,r*16))
    return im
def tint(im, k=(1,1,1)):
    im=im.copy(); p=im.load()
    for y in range(im.height):
        for x in range(im.width):
            r,g,b,a=p[x,y]
            if a: p[x,y]=(min(255,int(r*k[0])),min(255,int(g*k[1])),min(255,int(b*k[2])),a)
    return im
def ascii_img(rows, cm):
    im=Image.new('RGBA',(max(len(r) for r in rows),len(rows)))
    for y,r in enumerate(rows):
        for x,ch in enumerate(r):
            if ch!='.': im.putpixel((x,y),hexc(cm[ch]))
    return im
O='#3f2631'
def bold(im):
    # 粗線：在原本 1 像素外框外面再加一圈（和 Kenney 角色一樣厚實）
    w,h=im.width+2,im.height+2; src=Image.new('RGBA',(w,h)); src.alpha_composite(im,(1,1)); out=src.copy(); p=src.load(); q=out.load(); oc=hexc(O)
    for y in range(h):
        for x in range(w):
            if p[x,y][3]==0 and any(0<=x+a<w and 0<=y+b<h and p[x+a,y+b][3] for a,b in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(-1,1),(1,-1),(-1,-1))): q[x,y]=oc
    return out
HAY=ascii_img(["....######....","..##yyyyyy##..",".#yyYyyyyYyy#.","#yyyyyyYyyyyy#","#yYyyyyyyyYyy#","#yyyyYyyyyyyy#","#oyyyyyyyYyyo#","#oooyyyyyyooo#",".#oooooooooo#.","..##########.."],{'#':O,'y':'#f7c94a','Y':'#fbe39a','o':'#d8962e'})
STUMP=ascii_img(["..########..",".#oooooooo#.","#ohhooooohh#","#oooohhoooo#",".#HHHHHHHH#.",".#HhHHHHhH#.",".#HHHHhHHH#.","##HHHHHHHH##","#hh#hhhh#hh#","############"],{'#':O,'o':'#eaa56c','h':'#763b36','H':'#bd6c4a'})
CACTUS=ascii_img(["....####....","...#gggg#...","...#gLgG#...","...#gLgG#...","##.#gLgG#...","gg##gLgG#.##","gL#ggLgG##gg","gLggggggG#Lg","#gGGgggggggG","#ggGgggggGG#",".##GggLgG##.","...#gLgG#...","...#gLgG#...","...#ggGG#...","...#gggG#...","...######..."],{'#':O,'g':'#84c669','G':'#479f4a','L':'#b8e290'})
PILLAR_ROWS=([".#.##.....","#C#CC#.#..","#CCCcC#C#.","#CcCCCCC#.",".#CCCCCc#.",".#CcCCCC#.",".#CCCcCC#.",".#CCCCCC#.",".#cCCCCC#.",".#CCCCcC#.",".#CCCCCC#.",".#CcCCCC#.","#CCCCCCCC#","#cccccccc#",".########."])
PILLAR=ascii_img(PILLAR_ROWS[:4]+PILLAR_ROWS[4:12]*2+PILLAR_ROWS[12:],{'#':O,'C':'#c0cbdc','c':'#8b9bb4'})
PILLAR2=ascii_img(["..####..","#CCCCC#.","#CcCCC##","#CCCCcC#","#cCCCCC#","#CCCCCC#","#cccccc#","########"],{'#':O,'C':'#c0cbdc','c':'#8b9bb4'})
ROCK=ascii_img(["....#####.....","..##LLRRR##...",".#LLRRRrRRR#..","#LRRRRRRRrRR#.","#RRrRRRRRRRRR#","#RRRRRRrRRRrr#","#rrRRRRRRrrrr#",".#rrrrrrrrrr#.","..##########.."],{'#':O,'L':'#fec99c','R':'#eaa56c','r':'#cf8254'})
SKULL=ascii_img([".####.","#wwww#","#kwwk#","#wwww#",".#ww#.","..##.."],{'#':O,'w':'#f4eee0','k':'#3f2631'})

# 未開放柵欄（v17.44）：Kenney 南北向木柵欄一段、紅叉木牌（補畫，粗線）、盔甲守衛（Tiny Dungeon 08_00＋長矛 10_11）
def fence_col():
    col=Image.new('RGBA',(16,64)); col.alpha_composite(tile('03_11'),(0,0))
    for r in (1,2): col.alpha_composite(tile('04_11'),(0,16*r))
    col.alpha_composite(tile('05_11'),(0,48)); return col
def xsign():
    oc=hexc(O); P=hexc('#c18557'); p=hexc('#9e623d'); L=hexc('#dca874'); R=hexc('#e0483c'); r=hexc('#962428')
    im=Image.new('RGBA',(16,26)); q=im.load()
    for y in range(16):
        for x in range(16): q[x,y]=oc if x in (0,15) or y in (0,15) else (L if y==1 else p if y in (6,10,14) else P)
    for y in range(15,26):
        for x in (6,7,8,9): q[x,y]=oc if x in (6,9) or y==25 else p
    S=set()
    for i in range(4,8): S|={(i,i),(i+1,i)}
    S|={(15-x,y) for x,y in S}; S|={(x,15-y) for x,y in S}
    for x,y in S:
        for a in (-1,0,1):
            for b in (-1,0,1):
                if 1<=x+a<=14 and 1<=y+b<=14 and (x+a,y+b) not in S: q[x+a,y+b]=r
    for x,y in S: q[x,y]=R
    return im
def guard():
    g=Image.new('RGBA',(22,24)); g.alpha_composite(tile('10_11',TD),(8,0)); g.alpha_composite(tile('08_00',TD),(0,8)); return g

# 遊戲用：每個背景物一張 PNG（腳底＝最後一列）；地磚 16×16
def items():
    D=(.72,.8,.74); M=(.86,.92,.86); FK=(.8,.86,.8); RD=(.92,.9,.88); SR=(.9,.86,.84)
    T2=stack(['00_04'],['01_04']); A2=stack(['00_03'],['01_03'])
    field=stack(['03_03','03_04','03_05','03_06','03_03'],['03_04','03_03','03_06','03_05','03_04'])
    fl=Image.new('RGBA',(80,35)); fl.alpha_composite(field,(0,3))
    for r in range(2):
        for c in range(5): fl.alpha_composite(tile('01_05'),(c*16,r*16))
    it={
     # 地磚
     'g0':tile('00_00'),'g1':tile('00_01'),'g2':tile('00_02'),'rT':tile('01_01'),'rM':tile('02_01'),'rB':tile('03_01'),
     'fg0':tint(tile('00_00'),FK),'fg1':tint(tile('00_01'),FK),'frT':tint(tile('01_01'),RD),'frM':tint(tile('02_01'),RD),'frB':tint(tile('03_01'),RD),
     's0':tile('04_00',TD),'s1':tile('04_01',TD),'sT':tint(tile('04_02',TD),SR),'sM':tint(tile('04_00',TD),SR),'sB':tint(tile('04_03',TD),SR).transpose(Image.FLIP_TOP_BOTTOM),
     # 草原
     'farm':stack(['04_04','04_05','04_06'],['05_04','05_05','05_06'],['06_00','06_01','06_03'],['07_00','07_01','07_00']),
     'field':fl,'hay':HAY,'fence':stack(['06_08','06_09','06_09','06_09','06_10']),'sign':tile('06_11'),
     'tree':T2,'atree':A2,'stree':tile('02_04'),'satree':tile('02_03'),'bush':tile('00_05'),'mush':tile('02_05'),'sprout':tile('01_05'),
     # 森林（後排兩層調暗）
     'treeD':tint(T2,D),'atreeD':tint(A2,D),'streeD':tint(tile('02_04'),D),'treeM':tint(T2,M),'atreeM':tint(A2,M),'streeM':tint(tile('02_04'),M),'satreeM':tint(tile('02_03'),M),
     'log':tile('08_10'),'stump':STUMP,
     # 荒地（粗線）
     'fcol':fence_col(),'xsign':xsign(),'guard':guard(),
     'pillar':bold(PILLAR),'pillar2':bold(PILLAR2),'cactus':bold(CACTUS),'rock':bold(ROCK),'skull':bold(SKULL),
    }
    return it
if __name__=='__main__':
    out=sys.argv[1]; os.makedirs(out,exist_ok=True)
    for k,im in items().items():
        bb=im.getbbox(); im.crop((0,0,im.width,bb[3]) if bb else (0,0,im.width,im.height)).save(f'{out}/{k}.png')
    print('ok')
