# 怪物 v2：A＋B 混用，每區 3 隻＋菁英＋兩個魔王
# 用法：python3 monsters2.py <Kenney tiles 資料夾> <輸出資料夾>
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw, ImageFont
from monsters import from_map, M, dark_knight, elite, boss_with_staff, OUT, EYE

N = {}
N['草原'] = ('蜜蜂', from_map([
"................",
"................",
"................",
"...www....www...",
"...wwwyyyywww...",
"....wyyyyyyw....",
"....yyeyyeyy....",
"....yyy##yyy....",
"....kkkkkkkk....",
"....yyyyyyyy....",
".....kkkkkk.....",
"......yyyy......",
".......kk.......",
"................",
"................",
"................"], {'y': (255, 210, 70), 'w': (215, 238, 255), 'k': (90, 70, 70)}))

N['森林'] = ('樹樁怪', from_map([
"................",
"................",
"........l.......",
".......ll.......",
"....tttttttt....",
"...ttuuuuuutt...",
"...bttttttttb...",
"...bbbbbbbbbb...",
"...bbebbbbebb...",
"...bbebbbbebb...",
"...bbb####bbb...",
"..cbbbbbbbbbbc..",
".cc.cbbbbbbc.cc.",
"................",
"................",
"................"], {'t': (234, 190, 120), 'u': (200, 150, 90), 'b': (150, 100, 60), 'c': (110, 70, 45), 'l': (120, 188, 96)}))

N['荒地'] = ('沙蟲', from_map([
"................",
"................",
"......aaaa......",
".....aaaaaa.....",
"....aa####aa....",
"....a#wwww#a....",
"....a#wrrw#a....",
"....a#wwww#a....",
"....aa####aa....",
".....abbbba.....",
".....aaaaab.....",
".....bbbbbb.....",
"...ssaaaaabss...",
"..ssssssssssss..",
"................",
"................"], {'a': (210, 150, 110), 'b': (160, 100, 80), 's': (234, 190, 120), 'r': (200, 50, 60)}))

N['礦坑'] = ('洞窟蝙蝠', from_map([
"................",
"................",
"................",
"................",
".....b....b.....",
".a....bbbb....a.",
".aa..bbbbbb..aa.",
".aaa.bybbyb.aaa.",
".aaaabbbbbbaaaa.",
"..aaabw##wbaaa..",
"...aa.bbbb.aa...",
"......b..b......",
"................",
"................",
"................",
"................"], {'a': (82, 60, 110), 'b': (130, 100, 160), 'y': (255, 220, 80)}))

N['海岸'] = ('海星', from_map([
"................",
"................",
".......oo.......",
".......oo.......",
"......oooo......",
".oooooooooooooo.",
"..oooeooooeooo..",
"...ooeooooeoo...",
"....ooo##ooo....",
"....oooooooo....",
"...ooooppoooo...",
"...oooo..oooo...",
"..ooo......ooo..",
"..oo........oo..",
"................",
"................"], {'o': (255, 200, 90), 'p': (230, 150, 60)}))

N['雪山'] = ('冰狼', from_map([
"................",
"................",
"...cc......cc...",
"...cac....cac...",
"...caaaaaaaac...",
"..aaaaaaaaaaaa..",
"..aaakaaaakaaa..",
"..aaabwwwwbaaa..",
"...aaww##wwaa...",
"....awwwwwwa....",
"....bww##wwb....",
"...bbbwwwwbbb...",
"...bb.bbbb.bb...",
"...cc......cc...",
"................",
"................"], {'a': (200, 214, 235), 'b': (150, 170, 205), 'c': (100, 120, 170), 'k': (60, 200, 255)}))

N['魔王城'] = ('惡魔之眼', from_map([
"................",
"................",
"................",
"................",
"......wwww......",
".....wwwwww.....",
".d..wwrrrrww..d.",
".dd.wrr##rrw.dd.",
".ddwwrr##rrwwdd.",
"..d.wwrrrrww.d..",
".....wwwwwg.....",
"......gggg......",
"................",
"................",
"................",
"................"], {'r': (220, 50, 70), 'd': (110, 40, 70), 'g': (200, 200, 215)}))

ABYSS = from_map([
"........................",
"..h..................h..",
"..hh................hh..",
"...hh..............hh...",
"...hhh....aaaa....hhh...",
"....hhhaaaaaaaaaahhh....",
".....hhaaaaaaaaaahh.....",
"......aaaaaaaaaaaa......",
"......aaGGaaaaGGab......",
"......aaaGaaaaGaab......",
"......aaaaaaaaaaab......",
".......a########b.......",
".......a#w#ww#w#b.......",
"dd....bbaaaaaaaabb....dd",
"ddd..ccccbbbbbbcccc..ddd",
"dddd.cccccbVVbccccc.dddd",
"ddddcccccbVVVVbcccccdddd",
".dddcccccbVVVVbcccccddd.",
"..ddccccccbVVbccccccdd..",
"...dcccccccbbcccccccd...",
"....cccccccccccccccc....",
".....ccccc....ccccc.....",
"........................",
"........................"], {'a': (100, 70, 135), 'b': (68, 46, 95), 'h': (210, 200, 180), 'G': (120, 255, 240),
                              'c': (48, 34, 66), 'd': (120, 44, 76), 'V': (180, 100, 255)})

def auto_elite(im):
    # 通用菁英：整隻偏暗紅、眼睛變紅、加小金冠
    px = im.load(); pm = {}
    for y in range(im.height):
        for x in range(im.width):
            p = px[x, y]
            if not p[3]: continue
            c = p[:3]
            if c in (OUT, EYE) or c in pm: continue
            r, g, b = c
            pm[c] = (int(r * .68 + 12), int(g * .6), int(b * .7 + 8))
    for k in [(255, 70, 70), (255, 80, 60), (255, 220, 80), (60, 200, 255), (220, 50, 70)]:
        pm.pop(k, None)
    return elite(im, pm)

if __name__ == '__main__':
    tiles, outdir = sys.argv[1], sys.argv[2]
    M['B_魔王城'] = ('黑騎士', dark_knight(tiles))
    hero = Image.open(tiles + '/07_01.png').convert('RGBA')
    os.makedirs(outdir, exist_ok=True)
    regions = ['草原', '森林', '荒地', '礦坑', '海岸', '雪山', '魔王城']
    E = {}
    for r in regions:
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
    nrow = 4
    Hd = 34 + nrow * rowh + 10 + 26 * S + 34
    sh = Image.new('RGB', (Wd, Hd), (122, 75, 40)); d = ImageDraw.Draw(sh)
    TXT, SUB = (250, 236, 210), (230, 200, 160)
    def put(im, x, ybottom, s=S):
        big = im.resize((im.width * s, im.height * s), Image.NEAREST); sh.paste(big, (x, ybottom - big.height), big)
    for i, r in enumerate(regions):
        d.text((left + i * (cell + gap) + cell // 2, 16), r, fill=TXT, font=f16, anchor='mm')
    rows = [('雜魚 A', lambda r: M[f'A_{r}']), ('雜魚 新', lambda r: N[r]), ('強敵 B', lambda r: M[f'B_{r}']), ('菁英', lambda r: E[r])]
    for j, (title, get) in enumerate(rows):
        yb = 34 + j * rowh + 19 * S
        d.text((10, yb - 8 * S), title, fill=TXT, font=f16, anchor='lm')
        for i, r in enumerate(regions):
            nm, im = get(r); x = left + i * (cell + gap)
            put(im, x, yb); d.text((x + cell // 2, yb + 12), nm, fill=SUB, font=f13, anchor='mm')
    yb = 34 + nrow * rowh + 10 + 24 * S
    d.text((10, yb - 12 * S), '魔王', fill=TXT, font=f16, anchor='lm')
    x = left
    put(hero, x, yb); x += cell + 6
    put(boss, x, yb); d.text((x + 12 * S, yb + 14), '骸骨魔王（荒地盡頭）', fill=SUB, font=f13, anchor='mm')
    x += 24 * S + 50
    put(hero, x, yb); x += cell + 6
    put(ABYSS, x, yb + 2 * S); d.text((x + 12 * S, yb + 14), '深淵魔王（魔王城）', fill=SUB, font=f13, anchor='mm')
    sh.save(f'{outdir}/_怪物總表_v2.png'); print(sh.size)
