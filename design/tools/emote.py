# 表情泡泡：白底深框的小對話框（13×11＋尾巴），裡面一個 9×7 的像素圖示；照 Kenney 的外框色和兩階配色
from PIL import Image, ImageDraw, ImageFont
OUT = (63,38,49)
C = {'K':OUT, 'R':(222,70,70), 'r':(160,40,48), 'P':(240,140,180), 'p':(200,90,140), 'B':(92,160,232), 'b':(52,104,196), 'Y':(250,210,80), 'y':(200,150,40),
     'G':(120,190,96), 'g':(70,130,60), 'W':(255,255,255), 'D':(120,120,140), 'd':(80,80,100), 'O':(240,140,60), 'o':(190,90,40), 'T':(255,248,200),
     'S':(250,214,170), 'V':(140,110,200), 'v':(96,72,150), 'L':(200,220,240), 'F':(250,250,240), 'M':(255,180,60)}
I = {
 '開心':  ["...KKKK..","...K..K..","...K..K..","...K..K..",".KKK.KKK.","KKKK.KKKK",".KK...KK."],          # 音符
 '戀愛':  [".RR...RR.","RRRR.RRRR","RRWRRRRRR","RRRRRRRrR",".RRRRRrR.","..RRRrR..","....R...."],
 '害羞': ['...KKKKK...', '..KSSSSSK..', '.KSSSSSSSK.', '.KSKSSSKSK.', '.KSSSSSSSK.', '.KPPSSSPPK.', '.KSSSKSSSK.', '..KSSSSSK..', '...KKKKK...'],
 '生氣':  ["..R...R..",".RR...RR.","RR.....RR",".........","RR.....RR",".RR...RR.","..R...R.."],
 '難過': ['....b......', '....B......', '...BBB.....', '...BBB.....', '..BBBBB....', '..BWBBB....', '..BWBBB....', '..BBBBb....', '...Bbb.....'],
 '緊張': ['........b..', '..b.....B..', '.b.....BBB.', 'b.....BBBBB', '..b...BWBBB', '..b...BWBBB', '.b.....BBb.', 'b..........', '...........'],
 '累': ['...........', '...DDDD....', '..DLLLLD...', '.DLLLLLLD..', 'DLLLLLLLLD.', '.DLLLLLLDd.', '..DD..DDd..', '....DD..d..', '...........'],
 '想睡':  ["....BBBBB","......bB.",".....bB..","BBB.BBBBB","..B......",".B.......","BBB......"],
 '生病':  ["..GGGG...",".G....G..","G..GG..G.","G.G..G.G.","G..G...G.",".G...GG..","..GGG...."],
 '好痛': ['.....R.....', '..R..R..R..', '...RRORR...', '.RROOYOORR.', 'RRROYYYORRR', '.RROOYOORR.', '...RROR....', '..R..R..R..', '.....R.....'],
 '認真': ['....R......', '...RR...R..', '..RRR..RR..', '..RROR.RR..', '.RROOORRR..', '.RROMMORR..', '.RROMMORRR.', '..RROOORR..', '...RRRRR...'],
 '沮喪': ['V.V.V.V.V.V', 'V.V.V.V.V.V', 'V.v.V.v.V.v', 'v.V.v.V.v.V', '..v.V.v.V..', '..V.v...v..', '....V...V..', '....v......', '...........'],
 '驚訝':  ["...RR....","...RR....","...RR....","...RR....","...RR....",".........","...RR...."],
 '疑惑':  ["..BBBB...",".BB..BB..",".....BB..","....BB...","...BB....",".........","...BB...."],
 '想到了':["..YYYY...",".YTTTYY..",".YTYYYY..",".YYYYYY..","..YYYY...","..DDDD...","...dd...."],
 '想要錢': ['...YYYYY...', '..YTTYYYY..', '.YTYyyyYYy.', '.YYyYYYyYy.', '.YYYyyyYYy.', '.YYyYYYyYy.', '.YYYyyyYYy.', '..YYYYYYy..', '...yyyyy...'],
 '無言':  [".........",".........",".........","KK.KK.KK.","KK.KK.KK.",".........","........."],
 '喝醉': ['..F.F.F....', '..FFFFFF...', '.FFFFFFFF..', '.KYYYYYYKK.', '.KYMYYMYK.K', '.KYYYYYYK.K', '.KYMYYYYKKK', '.KYYYMYYK..', '.KKKKKKKK..'],
}
def coin_icon():
    import sys, glob; sys.argv = ['x']; sys.path.insert(0, '/home/claude/tools')
    from pixel import pixelize
    return pixelize(Image.open(glob.glob('/home/claude/bingo_src/*6803611f.png')[0]), 9, 8)
ICON_IMG = {}
def bubble(icon):
    w, h = 15, 13
    im = Image.new('RGBA', (w + 2, h + 4), (0,0,0,0)); d = ImageDraw.Draw(im)
    d.rectangle([1, 0, w, h - 1], fill=(255,255,255,255)); d.rectangle([0, 1, w + 1, h - 2], fill=(255,255,255,255))
    px = im.load()
    for (x, y) in [(3, h), (4, h), (3, h + 1)]: px[x, y] = (255,255,255,255)   # 尾巴
    # 外框
    A = [[px[x, y][3] for x in range(w + 2)] for y in range(h + 4)]
    o = Image.new('RGBA', (w + 4, h + 6), (0,0,0,0)); op = o.load()
    for y in range(h + 4):
        for x in range(w + 2):
            if A[y][x]: op[x + 1, y + 1] = px[x, y]
    for y in range(h + 6):
        for x in range(w + 4):
            if op[x, y][3] == 0 and any(0 <= x+a < w+4 and 0 <= y+b < h+6 and op[x+a, y+b][3] and op[x+a, y+b][:3] == (255,255,255) for a, b in ((1,0),(-1,0),(0,1),(0,-1))): op[x, y] = OUT + (255,)
    if isinstance(icon, Image.Image): o.alpha_composite(icon, (4 + (11 - icon.width) // 2, 3 + (9 - icon.height) // 2)); return o
    ox, oy = (11 - len(icon[0])) // 2, (9 - len(icon)) // 2
    for y, row in enumerate(icon):
        for x, ch in enumerate(row):
            if ch in C: op[x + 4 + ox, y + 3 + oy] = C[ch] + (255,)
    return o
if __name__ == '__main__':
    import sys
    sys.path.insert(0, '/home/claude/tools')
    I['想要錢'] = ['...KKKKK...','..KYYYYYK..','.KYTTYYYyK.','.KYTYYyYyK.','.KYYyyyYyK.','.KYYYyYYyK.','.KYYyYyYyK.','..KyyyyyK..','...KKKKK...']
    from kvar import recolor, HAIRS
    hero = Image.open('/home/claude/kenney/tiles/07_01.png').convert('RGBA')
    S = 5; cell_w, cell_h = 38, 48
    font = ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc', 22)
    names = list(I.keys()); cols = 6; rows = (len(names) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * cell_w * S, rows * (cell_h * S + 34)), (156, 196, 236)); dr = ImageDraw.Draw(sheet)
    for k, n in enumerate(names):
        c = Image.new('RGBA', (cell_w, cell_h), (156, 196, 236, 255)); cd = ImageDraw.Draw(c)
        cd.rectangle([0, cell_h - 6, cell_w, cell_h], fill=(196, 150, 96))
        c.alpha_composite(hero, (8, cell_h - 6 - 16)); b = bubble(I[n]); c.alpha_composite(b, (13, cell_h - 6 - 16 - b.height + 4))
        x, y = (k % cols) * cell_w * S, (k // cols) * (cell_h * S + 34)
        sheet.paste(c.resize((cell_w * S, cell_h * S), Image.NEAREST), (x, y)); dr.text((x + 12, y + cell_h * S + 2), n, fill=(40, 24, 16), font=font)
    sheet.save('/home/claude/gy/emote_sheet.png')
    # 動圖：泡泡彈出來、停一下、收掉，輪流換表情；勇者原地踏步
    sys.path.insert(0, '/home/claude/tools'); from walk import walk3
    wf = walk3(hero, 14, 8); frames = []
    for n in names:
        b = bubble(I[n])
        for t in range(14):
            c = Image.new('RGBA', (cell_w, cell_h), (156, 196, 236, 255)); cd = ImageDraw.Draw(c); cd.rectangle([0, cell_h - 6, cell_w, cell_h], fill=(196, 150, 96))
            f = wf[(t // 2) % 4] if t >= 10 else wf[0]; c.alpha_composite(f, (8, cell_h - 6 - f.height))
            if t < 11:
                bb = b if t > 0 else b.resize((b.width // 2 + 1, b.height // 2 + 1), Image.NEAREST)
                lift = 2 if t == 1 else 0
                c.alpha_composite(bb, (14 + (0 if t else 3), cell_h - 6 - 16 - bb.height + 4 - lift))
            frames.append(c.resize((cell_w * 6, cell_h * 6), Image.NEAREST).convert('RGB').quantize(64))
    frames[0].save('/home/claude/gy/emote_anim.gif', save_all=True, append_images=frames[1:], duration=90, loop=0)
    print(len(names))
