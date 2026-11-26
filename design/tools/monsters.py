# 怪物草稿 v1：Kenney Tiny Dungeon 風格（深棕粗外框、兩～三階平塗、1×2 深藍眼）
# 用法：python3 monsters.py <Kenney tiles 資料夾> <輸出資料夾>
import sys
from PIL import Image, ImageDraw, ImageFont

OUT = (63, 38, 49)
EYE = (38, 43, 68)
W = (255, 255, 255)

def from_map(rows, pal, auto_outline=True):
    h = len(rows); w = len(rows[0])
    for i, r in enumerate(rows):
        assert len(r) == w, (i, r, len(r))
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); px = im.load()
    full = {'#': OUT, 'e': EYE, 'w': W}; full.update(pal)
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch != '.': px[x, y] = full[ch] + (255,)
    if auto_outline:
        im = outline(im)
    return im

def outline(im):
    # 先 8 方向外擴 1 格，再 4 方向外擴 1 格 → 接近 Kenney 的粗外框
    w, h = im.size
    for nb in ([(-1,-1),(0,-1),(1,-1),(-1,0),(1,0),(-1,1),(0,1),(1,1)], [(0,-1),(-1,0),(1,0),(0,1)]):
        src = im.load(); new = im.copy(); dst = new.load()
        for y in range(h):
            for x in range(w):
                if src[x, y][3]: continue
                for dx, dy in nb:
                    xx, yy = x+dx, y+dy
                    if 0 <= xx < w and 0 <= yy < h and src[xx, yy][3]:
                        dst[x, y] = OUT + (255,); break
        im = new
    return im

M = {}
# ---------- A：圓滾可愛 ----------
M['A_草原'] = ('史萊姆', from_map([
"................",
"................",
"................",
"................",
".......aa.......",
"......aaaa......",
".....awaaaa.....",
"....awaaaaaa....",
"...aaaaaaaaab...",
"...aaeaaaaeab...",
"...aaeaaaaeab...",
"...aaaa##aabb...",
"...baaaaaaabb...",
"....bbbbbbbb....",
"................",
"................"], {'a': (120, 200, 255), 'b': (60, 140, 230)}))

M['A_森林'] = ('蘑菇怪', from_map([
"................",
"................",
"................",
".....rrrrrr.....",
"...rrrwwrrrrr...",
"..rrwwwrrrrwwr..",
"..rrwwrrrrrwwr..",
"..rrrrrrrrrrrr..",
"...cccccccccc...",
"....ssssssss....",
"....ssessess....",
"....ssessedd....",
"....sss##sds....",
"....dsssssdd....",
".....d....d.....",
"................"], {'r': (232, 69, 55), 'c': (150, 40, 40), 's': (247, 194, 130), 'd': (225, 154, 101)}))

M['A_荒地'] = ('仙人掌怪', from_map([
"................",
"................",
".......pp.......",
"......gggg......",
".....ggwggg.....",
"..g..gggggg..g..",
"..gg.geggeg.gg..",
"..gg.geggeg.gg..",
"..gggggggggggh..",
".....gg##gh.....",
".....gwgggh.....",
".....ggggwh.....",
".....gggghh.....",
".....h....h.....",
"................",
"................"], {'g': (120, 188, 96), 'h': (72, 132, 64), 'p': (255, 112, 170)}))

M['A_礦坑'] = ('水晶石頭精', from_map([
"................",
"................",
".....kx.........",
".....kx...kx....",
"....aaaaaaaa....",
"...aaaaaaaaab...",
"..aaaabaaaaabb..",
"..aaaeaaaaebbb..",
"..aaaeaaaaebbb..",
"..baaaa##aabbb..",
"..bbaaaaaabbcb..",
"...bbbbbbbbcb...",
"....bb....bb....",
"................",
"................",
"................"], {'a': (192, 203, 220), 'b': (139, 155, 180), 'c': (90, 105, 136), 'k': (150, 240, 255), 'x': (70, 170, 230)}))

M['A_海岸'] = ('章魚寶寶', from_map([
"................",
"................",
"................",
"......oooo......",
".....oowooo.....",
"....oowooooo....",
"...oooooooooo...",
"...ooeooooeop...",
"...ooeooooeop...",
"...oooo##ooop...",
"...pppppppppp...",
"..pp.pp..pp.pp..",
"..p...p..p...p..",
"................",
"................",
"................"], {'o': (255, 150, 125), 'p': (225, 95, 95)}))

M['A_雪山'] = ('雪球怪', from_map([
"................",
"................",
"................",
"......wwww......",
"....wwwwwwww....",
"...wwwwwwwwwk...",
"..wwwwwwwwwwkk..",
"..wwwewwwwewkk..",
"..wwwewwwwewkk..",
"..wwpww##wwpkk..",
"...wwwwwwwwkk...",
"....kkkkkkkk....",
"....kk....kk....",
"................",
"................",
"................"], {'w': (240, 248, 255), 'k': (170, 200, 235), 'p': (255, 170, 190)}))

M['A_魔王城'] = ('小惡魔', from_map([
"................",
"................",
"...k........k...",
"...kk......kk...",
"....kaaaaaak....",
"....aaaaaaaa....",
"....ayeaaeya....",
"....aaaaaaab....",
"....aaw##wab....",
".dd..abbbba..dd.",
".ddd.aaaaaa.ddd.",
"..dd.aaaaab.dd..",
".....bb..bb.....",
"................",
"................",
"................"], {'a': (176, 110, 206), 'b': (120, 70, 160), 'k': (240, 236, 220), 'd': (82, 60, 110), 'y': (255, 220, 80)}))

# ---------- B：正統奇幻（跟勇者同一套人形比例） ----------
M['B_草原'] = ('野豬', from_map([
"................",
"................",
"................",
"...cb......bc...",
"...cbbbbbbbbc...",
"....bbbbbbbb....",
"...bbbbbbbbbb...",
"...bbebbbbebb...",
"...bbebbbbebb...",
"..bbbbaaaabbbb..",
"..bbbaaaaaabbb..",
"..bbwa#aa#awbb..",
"..bbwaaaaaawbb..",
"...bbbaaaabbb...",
"...cc......cc...",
"................"], {'a': (234, 165, 108), 'b': (189, 108, 74), 'c': (118, 59, 54)}))

GOB = {'a': (100, 160, 70), 'b': (150, 210, 90), 'c': (60, 110, 60), 'd': EYE, 'y': (255, 220, 80),
       't': (160, 110, 70), 'u': (110, 70, 50)}
M['B_森林'] = ('哥布林', from_map([
"................",
"....########....",
"...##########...",
"..###abbbba###..",
"..##abbbbbba##..",
"##a#cbbbbbbc#a##",
"###acbbbbbbca###",
"..##bbydbydb##..",
"..##cbwccwbc##..",
"..###cccccc###..",
".###tuuuuuut###.",
"###ttuttttutt###",
"##bbuttttttubb##",
"##bb#tttttt#bb##",
"#####uu##uu#####",
".####cc##cc####."], GOB, auto_outline=False))

M['B_荒地'] = ('木乃伊', from_map([
"................",
"....########....",
"...##########...",
"..###abbbba###..",
"..##bbbbbbbb##..",
"..##aaaaaaaa##..",
"..##bbbbbbbb##..",
"..###rr##rr###..",
"..##bbbbaaab##..",
"..###aaaaaa###..",
".###bbbbbbbb###.",
"###bbaaaabbbb###",
"##bbabbbbbbabb##",
"##aa#bbaabb#aa##",
"#####aa##aa#####",
".####bb##bb####."], {'a': (190, 176, 140), 'b': (232, 222, 190), 'r': (255, 80, 60)}, auto_outline=False))

M['B_礦坑'] = ('骷髏礦工', from_map([
"................",
"....########....",
"...####yy####...",
"..###hhyyhi###..",
"..##hhhhhhhi##..",
"..##iiiiiiii##..",
"..##wwwwwwww##..",
"..##w##ww##w##..",
"..##wwwgwwwg##..",
"..###wgwgww###..",
".###wwwwwwww###.",
"###ww#w##w#ww###",
"##wwgw#ww#wgww##",
"##ww#gwwwwg#ww##",
"#####ww##ww#####",
".####gg##gg####."], {'h': (244, 206, 96), 'i': (196, 146, 52), 'y': (255, 250, 200), 'w': (240, 240, 232), 'g': (192, 203, 220)}, auto_outline=False))

M['B_海岸'] = ('魚人', from_map([
"................",
".....######.....",
"...###ffff###...",
"..###abbbba###..",
"..##abbbbbba##..",
"..##bwwbbwwb##..",
"..##bwebbewb##..",
"..##bbbbbbbb##..",
"..##bc####cb##..",
"..###cbbbbc###..",
".###sbbbbbbs###.",
"###ssbsbsbsss###",
"##bbsbsbsbssbb##",
"##bb#ssssss#bb##",
"#####ss##ss#####",
".####cc##cc####."], {'a': (60, 140, 150), 'b': (96, 190, 180), 'c': (40, 100, 120), 'f': (255, 140, 120), 's': (70, 120, 190)}, auto_outline=False))

M['B_雪山'] = ('雪怪', from_map([
"................",
"....########....",
"...##########...",
"..###wwwwww###..",
"..##wwwwwwww##..",
"..##wffffffw##..",
"..##wfeffefw##..",
"..##ffffffff##..",
"..##fw####wf##..",
".###wffffffw###.",
"###wwwwwwwwww###",
"#wwkwwwwwwwwkww#",
"#wwkwwwwwwwwkww#",
"#ffk#wwwwww#kff#",
"#####kk##kk#####",
".####ff##ff####."], {'w': (240, 244, 250), 'k': (176, 190, 215), 'f': (150, 175, 215)}, auto_outline=False))

def dark_knight(tiles):
    im = Image.open(tiles + '/08_00.png').convert('RGBA'); px = im.load()
    rep = {(192, 203, 220): (110, 96, 130), (139, 155, 180): (76, 62, 96), (90, 105, 136): (52, 40, 66),
           (38, 43, 68): (255, 70, 70), (82, 96, 124): (52, 40, 66)}
    for y in range(16):
        for x in range(16):
            p = px[x, y]
            if p[3] and p[:3] in rep: px[x, y] = rep[p[:3]] + (255,)
    for x, y in [(6, 7), (8, 7), (10, 7)]: px[x, y] = (255, 70, 70, 255)   # 頭盔縫裡的紅光
    px[8, 8] = (180, 40, 50, 255)
    for x in range(5, 11): px[x, 13] = (150, 40, 60, 255)   # 腰帶改暗紅
    return im

# ---------- 菁英：同一隻換深色＋紅眼＋金角 ----------
def elite(im, pal_map, crown=True):
    im = im.copy(); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            p = px[x, y]
            if not p[3]: continue
            c = p[:3]
            if c in pal_map: px[x, y] = pal_map[c] + (255,)
            elif c == EYE: px[x, y] = (255, 60, 60, 255)
    if crown:
        big = Image.new('RGBA', (im.width, im.height + 3), (0, 0, 0, 0)); big.alpha_composite(im, (0, 3))
        d = ImageDraw.Draw(big); cx = im.width // 2
        g, o = (255, 214, 80), OUT
        top = min(y for y in range(big.height) for x in range(big.width) if big.getpixel((x, y))[3])
        y0 = top - 1
        for dx in (-3, -1, 1, 3): pass
        # 小金冠 5×3（含外框）
        crown_rows = ["#.#.#", "#g#g#", "ggggg"]
        crown_rows = [".#.#.#.", "#g#g#g#", "#ggggg#", ".#####."]
        for j, r in enumerate(crown_rows):
            for i, ch in enumerate(r):
                if ch == '.': continue
                xx, yy = cx - 3 + i, y0 - 2 + j
                if 0 <= yy < big.height: big.putpixel((xx, yy), (o if ch == '#' else g) + (255,))
        bb = big.getbbox(); return big.crop((0, bb[1], im.width, big.height))
    return im

# ---------- 骸骨魔王 24×24 ----------
BOSS = from_map([
"........................",
".......y...yy...y.......",
".......yy.yyyy.yy.......",
".......yyyyrryyyy.......",
".......zzzzzzzzzz.......",
"......wwwwwwwwwwww......",
"......wwwwwwwwwwwg......",
"......w#RR#ww#RR#g......",
"......w####ww####g......",
"......wwwww##wwwwg......",
".......w#w#w#w#wg.......",
"........wwwwwwgg........",
"....ccyyyyyyyyyyyycc....",
"...cccrwgwwwwwwgwrccc...",
"...ccrrw#w#ww#w#wrrcc...",
"..cccrrwwwwwwwwwwrrccc..",
"..ccrrrw#w#ww#w#wrrrcc..",
"..ccrrrrwwwwwwwwrrrrcc..",
"..ccrrrrrggwwggrrrrrcc..",
"..cccrrrrrrrrrrrrrrccc..",
"...ccccrrrrrrrrrrcccc...",
"....cccccccccccccccc....",
"......ww........ww......",
"........................"], {'y': (244, 206, 96), 'z': (196, 146, 52), 'w': (240, 240, 232), 'g': (192, 203, 220),
                              'R': (255, 80, 80), 'r': (150, 40, 60), 'c': (70, 50, 90), 'k': (200, 120, 255), 's': (196, 146, 52)}, auto_outline=False)

def boss_with_staff():
    # 加權杖（左手）：紫色寶珠＋金杖，骨手
    rows = [list(r) for r in [
"........................",
".......y...yy...y.......",
".......yy.yyyy.yy.......",
".......yyyyrryyyy.......",
".......zzzzzzzzzz.......",
"..k...wwwwwwwwwwww......",
".kkk..wwwwwwwwwwwg......",
"..k...w#RR#ww#RR#g......",
"..s...w####ww####g......",
"..s...wwwww##wwwwg......",
"..s....w#w#w#w#wg.......",
"..s.....wwwwwwgg........",
"..s.ccyyyyyyyyyyyycc....",
"..s.cccwgwwwwwwgwrccc...",
"..scccrw#w#ww#w#wrrcc...",
".wwwcrrwwwwwwwwwwrrccc..",
"..sccrrw#w#ww#w#wrrrcc..",
"..scrrrrwwwwwwwwrrrrcc..",
"..scrrrrrggwwggrrrrrcc..",
"..sccrrrrrrrrrrrrrrccc..",
"..s.ccccrrrrrrrrrrcccc..",
"..s..cccccccccccccccc...",
"......ww........ww......",
"........................"]]
    pal = {'y': (244, 206, 96), 'z': (196, 146, 52), 'w': (240, 240, 232), 'g': (192, 203, 220),
           'R': (255, 80, 80), 'r': (150, 40, 60), 'c': (70, 50, 90), 'k': (200, 120, 255), 's': (196, 146, 52)}
    return from_map([''.join(r) for r in rows], pal, auto_outline=True)

if __name__ == '__main__':
    tiles, outdir = sys.argv[1], sys.argv[2]
    M['B_魔王城'] = ('黑騎士', dark_knight(tiles))
    hero = Image.open(tiles + '/07_01.png').convert('RGBA')
    import os; os.makedirs(outdir, exist_ok=True)
    for k, (nm, im) in M.items(): im.save(f'{outdir}/{k}_{nm}.png')
    regions = ['草原', '森林', '荒地', '礦坑', '海岸', '雪山', '魔王城']
    F = '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'
    f16 = ImageFont.truetype(F, 16); f14 = ImageFont.truetype(F, 13); f20 = ImageFont.truetype(F, 20)
    S = 5; cell = 16 * S; gap = 22; left = 130
    cols = 8  # 勇者 + 7 區
    Wd = left + cols * (cell + gap) + 10
    rowh = cell + 46
    Hd = 40 + 2 * rowh + 30 + 24 * S + 10
    sh = Image.new('RGB', (Wd, Hd), (122, 75, 40)); d = ImageDraw.Draw(sh)
    TXT, SUB = (250, 236, 210), (230, 200, 160)
    def put(im, x, y, s=S):
        big = im.resize((im.width * s, im.height * s), Image.NEAREST); sh.paste(big, (x, y), big)
    # 欄標
    d.text((left + 0 * (cell + gap) + cell // 2, 14), '勇者(參考)', fill=SUB, font=f14, anchor='mm')
    for i, r in enumerate(regions):
        d.text((left + (i + 1) * (cell + gap) + cell // 2, 14), r, fill=TXT, font=f16, anchor='mm')
    for j, (tag, title) in enumerate([('A', 'A 圓滾可愛'), ('B', 'B 正統奇幻')]):
        y = 32 + j * rowh
        d.text((12, y + cell // 2), title, fill=TXT, font=f16, anchor='lm')
        put(hero, left, y)
        for i, r in enumerate(regions):
            nm, im = M[f'{tag}_{r}']
            x = left + (i + 1) * (cell + gap)
            put(im, x, y)
            d.text((x + cell // 2, y + cell + 12), nm, fill=SUB, font=f14, anchor='mm')
    # 下排：菁英＋魔王
    y = 32 + 2 * rowh + 18
    d.text((12, y + 40), '菁英 / 魔王', fill=TXT, font=f16, anchor='lm')
    boar = M['B_草原'][1]
    eb = elite(boar, {(234, 165, 108): (200, 120, 90), (189, 108, 74): (110, 60, 60), (118, 59, 54): (70, 36, 46), (255, 255, 255): (255, 214, 80)})
    slime = M['A_草原'][1]
    es = elite(slime, {(120, 200, 255): (255, 140, 120), (60, 140, 230): (200, 60, 80)})
    x = left
    put(boar, x, y + (19 - 16) * S); d.text((x + cell // 2, y + 19 * S + 12), '野豬', fill=SUB, font=f14, anchor='mm')
    x += cell + gap
    put(eb, x, y + (19 - eb.height) * S); d.text((x + cell // 2, y + 19 * S + 12), '菁英野豬', fill=SUB, font=f14, anchor='mm')
    x += cell + gap + 10
    put(slime, x, y + (19 - 16) * S); d.text((x + cell // 2, y + 19 * S + 12), '史萊姆', fill=SUB, font=f14, anchor='mm')
    x += cell + gap
    put(es, x, y + (19 - es.height) * S); d.text((x + cell // 2, y + 19 * S + 12), '菁英史萊姆', fill=SUB, font=f14, anchor='mm')
    x += cell + gap + 30
    boss = boss_with_staff(); boss.save(f'{outdir}/BOSS_骸骨魔王.png')
    bh = boss.height
    put(hero, x, y + (bh - 16) * S - 5 * S)
    put(boss, x + cell + 4, y - 5 * S)
    d.text((x + cell + 4 + bh * S // 2, y + (bh - 5) * S + 12), '骸骨魔王 24×24（旁邊是勇者）', fill=SUB, font=f14, anchor='mm')
    sh.save(f'{outdir}/_怪物草稿_v1.png'); print(sh.size)
