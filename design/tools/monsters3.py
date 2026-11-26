# 怪物 v3：每區第 4 隻（偏中強敵），總表含全部
# 用法：python3 monsters3.py <Kenney tiles 資料夾> <輸出資料夾>
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw, ImageFont
from monsters import from_map, M, dark_knight, boss_with_staff
from monsters2 import N, ABYSS, auto_elite

Q = {}
Q['草原'] = ('稻草人', from_map([
"................",
".....######.....",
"....##hhhh##....",
".###hhhhhhhh###.",
".##iiiiiiiiii##.",
"..##ssssssss##..",
"..##sesssses##..",
"..##ssssssss##..",
"..##s#s#s#ss##..",
"..###ssssss###..",
".###pppppppp###.",
"#yyppqppppqppyy#",
"#yy#pppppppp#yy#",
"####ppqqpppp####",
".....##bb##.....",
"......#bb#......"], {'h': (244, 206, 96), 'i': (196, 146, 52), 's': (234, 210, 160), 'y': (244, 206, 96),
                     'p': (120, 150, 200), 'q': (90, 110, 160), 'b': (150, 100, 60)}, auto_outline=False))

Q['森林'] = ('毒蜘蛛', from_map([
"................",
"................",
"................",
"................",
"......aaaa......",
".....aaaaaa.....",
".l..aayaayaa..l.",
".ll.aaaaaaaa.ll.",
"..llaabbbbaall..",
"...laabbbbaal...",
"..ll.abbbba.ll..",
".ll...aaaa...ll.",
".l............l.",
"................",
"................",
"................"], {'a': (120, 80, 150), 'b': (140, 220, 90), 'l': (80, 55, 100), 'y': (255, 70, 70)}))

Q['荒地'] = ('禿鷹', from_map([
"................",
"................",
"......pppp......",
".....pppppp.....",
".....peppep.....",
"......pyyp......",
".......yy.......",
"....wwwwwwww....",
".cc.bbbbbbbb.cc.",
"ccc.bbbbbbbb.ccc",
"cccbbbbbbbbbbccc",
".cc.bbbbbbbb.cc.",
".....bbbbbb.....",
".....y....y.....",
"................",
"................"], {'p': (230, 150, 140), 'y': (244, 206, 96), 'w': (240, 236, 220), 'b': (125, 88, 76), 'c': (160, 118, 100)}))

Q['礦坑'] = ('石魔像', from_map([
".....######.....",
"....##aaaa##....",
"....#aGaaGa#....",
"..###aaaaaa###..",
".##bbbaaaabbb##.",
"#bbbbbaaaabbbbb#",
"#bbcbaaaaaabcbb#",
"#bbb#aaKKaa#bbb#",
"#bbb#aaKKaa#bbb#",
"#aaa#aaaaaa#aaa#",
"#aaa#bbbbbb#aaa#",
"#####bb##bb#####",
"....#bb##bb#....",
"...##aa##aa##...",
"...##########...",
"................"], {'a': (160, 150, 140), 'b': (120, 110, 105), 'c': (90, 80, 80), 'G': (120, 255, 180), 'K': (120, 240, 255)}, auto_outline=False))

Q['海岸'] = ('大螃蟹', from_map([
"................",
"................",
"................",
"..aa........aa..",
".aaaa......aaaa.",
".aaaa......aaaa.",
"..aa.we..ew.aa..",
"...a..a..a..a...",
"...aaaaaaaaaa...",
"..aaaaaaaaaaaa..",
"..aaaaa##aaaab..",
"...bbbbbbbbbb...",
"..b.b......b.b..",
"................",
"................",
"................"], {'a': (90, 160, 230), 'b': (50, 100, 180)}))

Q['雪山'] = ('冰晶元素', from_map([
"................",
"................",
".......kk.......",
"......kkkx......",
".....kkkkxx.....",
"....kkwkkkxx....",
".k.kkwkkkkkxx.x.",
"...kkekkkkexx...",
"...kkekkkkexx...",
"....kkk##kxx....",
".....kkkkxx.....",
"......kkxx......",
".......kx.......",
"................",
"................",
"................"], {'k': (170, 230, 255), 'x': (90, 170, 230)}))

Q['魔王城'] = ('暗黑法師', from_map([
"......####......",
".....##hh##.....",
"....##hhhh##....",
"...##hhhhhh##...",
"..##hh####hh##..",
"..##h#G##G#h##..",
"..##h######h##..",
"..###hhhhhh###..",
".###hhhyyhhh###.",
"###hhhhyhhhhh###",
"##sihhhhhhhhis##",
"#####hhhhhh#####",
"..##hhhhhhhh##..",
"..##iiiiiiii##..",
"..############..",
"................"], {'h': (90, 60, 140), 'i': (60, 40, 100), 'G': (255, 90, 200), 'y': (244, 206, 96), 's': (190, 200, 210)}, auto_outline=False))

if __name__ == '__main__':
    tiles, outdir = sys.argv[1], sys.argv[2]
    M['B_魔王城'] = ('黑騎士', dark_knight(tiles))
    hero = Image.open(tiles + '/07_01.png').convert('RGBA')
    os.makedirs(outdir, exist_ok=True)
    regions = ['草原', '森林', '荒地', '礦坑', '海岸', '雪山', '魔王城']
    E = {}
    for r in regions:
        nm, im = Q[r]; im.save(f'{outdir}/D_{r}_{nm}.png')
        nm, im = N[r]; im.save(f'{outdir}/C_{r}_{nm}.png')
        bn, bim = M[f'B_{r}']; E[r] = ('菁英' + bn, auto_elite(bim)); E[r][1].save(f'{outdir}/E_{r}_菁英{bn}.png')
    for k, (nm, im) in M.items(): im.save(f'{outdir}/{k}_{nm}.png')
    ABYSS.save(f'{outdir}/BOSS_深淵魔王.png')
    boss = boss_with_staff(); boss.save(f'{outdir}/BOSS_骸骨魔王.png')

    F = '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'
    f16 = ImageFont.truetype(F, 16); f13 = ImageFont.truetype(F, 13)
    S = 5; cell = 16 * S; gap = 26; left = 96
    Wd = left + 7 * (cell + gap) + 6
    rowh = 19 * S + 30
    rows = [('雜魚 A', lambda r: M[f'A_{r}']), ('雜魚', lambda r: N[r]), ('強敵 B', lambda r: M[f'B_{r}']),
            ('強敵 新', lambda r: Q[r]), ('菁英', lambda r: E[r])]
    nrow = len(rows)
    Hd = 34 + nrow * rowh + 10 + 26 * S + 34
    sh = Image.new('RGB', (Wd, Hd), (122, 75, 40)); d = ImageDraw.Draw(sh)
    TXT, SUB, NEW = (250, 236, 210), (230, 200, 160), (255, 220, 120)
    def put(im, x, ybottom, s=S):
        big = im.resize((im.width * s, im.height * s), Image.NEAREST); sh.paste(big, (x, ybottom - big.height), big)
    for i, r in enumerate(regions):
        d.text((left + i * (cell + gap) + cell // 2, 16), r, fill=TXT, font=f16, anchor='mm')
    for j, (title, get) in enumerate(rows):
        yb = 34 + j * rowh + 19 * S
        d.text((10, yb - 8 * S), title, fill=NEW if '新' in title else TXT, font=f16, anchor='lm')
        for i, r in enumerate(regions):
            nm, im = get(r); x = left + i * (cell + gap)
            put(im, x, yb); d.text((x + cell // 2, yb + 12), nm, fill=NEW if '新' in title else SUB, font=f13, anchor='mm')
    yb = 34 + nrow * rowh + 10 + 24 * S
    d.text((10, yb - 12 * S), '魔王', fill=TXT, font=f16, anchor='lm')
    x = left
    put(hero, x, yb); x += cell + 6
    put(boss, x, yb); d.text((x + 12 * S, yb + 14), '骸骨魔王（荒地盡頭）', fill=SUB, font=f13, anchor='mm')
    x += 24 * S + 50
    put(hero, x, yb); x += cell + 6
    put(ABYSS, x, yb + 2 * S); d.text((x + 12 * S, yb + 14), '深淵魔王（魔王城）', fill=SUB, font=f13, anchor='mm')
    sh.save(f'{outdir}/_怪物總表_v3.png'); print(sh.size)
