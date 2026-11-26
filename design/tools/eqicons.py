# 依職業的武器 4 級＋防具 4 級（16×16 像素，深棕外框，照獵魔村畫風），輸出 2 倍＝32×32
from PIL import Image
K=(59,38,22)
W={
'sword':["................",".............KK.","............KLMK","...........KLMK.","..........KLMK..",".........KLMK...","........KLMK....","...K...KLMK.....","..KHK.KLMK......","...KHKLMK.......","....KHMK........","....KGHHK.......","...KGK.KHK......","..KGK...K.......","..KK............","................"],
'bow':["................","......KKK.......",".....KMLK.S.....","....KMK...S.....","...KMK....S.....","...KMK....S.....","..KMK.....S.....","..KGK.....S.....","..KGK.....S.....","..KMK.....S.....","...KMK....S.....","...KMK....S.....","....KMK...S.....",".....KMLK.S.....","......KKK.......","................"],
'staff':["................","..........KKK...",".........KJJJK..",".........KJLJK..",".........KJJJK..","..........KMK...",".........KMLK...","........KMLK....",".......KMLK.....","......KMLK......",".....KGGK.......","....KGGK........","...KMLK.........","..KMLK..........","..KKK...........","................"],
'dagger':["................","................","................","..........KK....",".........KLMK...","........KLMK....",".......KLMK.....","...K..KLMK......","..KHKKLMK.......","...KHHMK........","....KHHK........","...KGKKHK.......","..KGK...K.......","..KK............","................","................"],
}
TIER=[  # M 主色, L 亮色, H 護手, J 寶石
 dict(M=(160,104,58),L=(201,139,82),H=(107,68,35),J=(160,104,58)),
 dict(M=(154,163,173),L=(213,219,224),H=(107,111,117),J=(213,219,224)),
 dict(M=(127,166,201),L=(216,236,255),H=(74,106,138),J=(89,168,255)),
 dict(M=(230,196,90),L=(255,244,176),H=(201,138,28),J=(176,108,255)),
]
G=(122,74,42); S=(120,104,88)
TORSO=["................","....KKKKKKKK....","..KKCCCKKCCCKK..",".KCCCCCCCCCCCCK.",".KCCCCCCCCCCCCK.",".KCCKCCCCCCKCCK.",".KKK.KCCCCK.KKK.",".....KCCCCK.....",".....KCCCCK.....",".....KDDDDK.....",".....KCCCCK.....","....KCCCCCCK....","....KCCCCCCK....","....KKKKKKKK....","................","................"]
ARM=[dict(C=(226,210,170),C2=(226,210,170),D=(160,104,58),T=None),      # 布衣
     dict(C=(150,96,54),C2=(122,74,42),D=(80,50,28),T=None),            # 皮甲
     dict(C=(168,176,186),C2=(120,128,138),D=(107,68,35),T=None),       # 鎖子甲
     dict(C=(200,210,222),C2=(235,240,248),D=(201,138,28),T=(242,193,78))]  # 板甲
def render(grid, f):
    im=Image.new('RGBA',(16,16),(0,0,0,0)); px=im.load()
    for y,row in enumerate(grid):
        for x,ch in enumerate(row):
            c=f(ch,x,y)
            if c: px[x,y]=c+(255,)
    return im.resize((32,32),Image.NEAREST)
out='/home/claude/sample2/img/eq/'
for w,grid in W.items():
    for t,P in enumerate(TIER):
        render(grid, lambda ch,x,y: {'K':K,'M':P['M'],'L':P['L'],'H':P['H'],'G':G,'J':P['J'],'S':S}.get(ch)).save(f'{out}{w}{t}.png')
for t,A in enumerate(ARM):
    def f(ch,x,y,A=A,t=t):
        if ch=='K': return K
        if ch=='D': return A['D']
        if ch=='C':
            if t==2: return A['C'] if (x+y)%2 else A['C2']
            if t==3 and x in (4,5): return A['C2']
            if t==3 and y==2: return A['T']
            if t==1 and y in (4,11) and x%2: return A['C2']
            return A['C']
    render(TORSO,f).save(f'{out}armor{t}.png')
# 對照表
sheet=Image.new('RGB',(5*48,5*48),(241,230,204))
for r,w in enumerate(list(W)+['armor']):
    for t in range(4): im=Image.open(f'{out}{w}{t}.png'); sheet.paste(im.resize((40,40),Image.NEAREST),(4+t*48,4+r*48),im.resize((40,40),Image.NEAREST))
sheet.save('/home/claude/gy/eq_sheet.png')
