import sys; sys.path.insert(0, '/home/claude/tools')
from emote import bubble
from PIL import Image, ImageDraw, ImageFont
def grid(cells, w=11, h=9):
    g = [['.'] * w for _ in range(h)]
    for (x, y), ch in cells.items():
        if 0 <= x < w and 0 <= y < h: g[y][x] = ch
    return [''.join(r) for r in g]
def drop(cx, top, big=True):
    c = {}
    if big:
        for (x, y, ch) in [(0,0,'B'),(-1,1,'B'),(0,1,'B'),(-1,2,'B'),(0,2,'B'),(1,2,'B'),(-2,3,'B'),(-1,3,'W'),(0,3,'B'),(1,3,'B'),(-2,4,'B'),(-1,4,'B'),(0,4,'B'),(1,4,'B'),(-1,5,'b'),(0,5,'b')]: c[(cx + x, top + y)] = ch
    else:
        for (x, y, ch) in [(0,0,'B'),(0,1,'B'),(-1,1,'B'),(-1,2,'B'),(0,2,'b')]: c[(cx + x, top + y)] = ch
    return c
def A(f):   # 中間大滴上下抖，兩邊小滴往外飛
    c = drop(5, 2 + (f % 2), True); off = f % 4
    c.update(drop(1 - (off // 2), 3 - off, False)); c.update({(10 - x, y): v for (x, y), v in drop(1 - (off // 2), 3 - off, False).items()})
    return grid(c)
def B(f):   # 大汗滴慢慢往下滑，喘氣線一閃一閃
    c = drop(3, 1 + (f % 3), True)
    if f % 2 == 0: c.update({(7,2):'D',(8,2):'D',(7,4):'D',(8,4):'D',(9,4):'D',(7,6):'D',(8,6):'D'})
    else: c.update({(8,3):'D',(9,3):'D',(8,5):'D',(9,5):'D',(10,5):'D'})
    return grid(c)
def C(f):   # 兩滴汗輪流晃，下面熱氣左右飄
    c = drop(3, 1 + (f % 2), True); c.update(drop(7, 1 + ((f + 1) % 2), True))
    s = f % 2
    for x in range(0, 11, 3): c[(x + s, 7)] = 'D'; c[(x + 1 - s, 8)] = 'D'
    return grid(c)
if __name__ == '__main__':
    hero = Image.open('/home/claude/kenney/tiles/07_01.png').convert('RGBA')
    font = ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc', 20)
    S = 6; cw, ch = 36, 44; frames = []
    for t in range(16):
        f = t // 2
        row = Image.new('RGBA', (cw * 3, ch), (156, 196, 236, 255)); d = ImageDraw.Draw(row); d.rectangle([0, ch - 6, cw * 3, ch], fill=(196, 150, 96))
        for k, fn in enumerate((A, B, C)):
            bob = 1 if (t // 4) % 2 else 0   # 累到身體一沉一沉
            row.alpha_composite(hero, (k * cw + 8, ch - 22 + bob))
            b = bubble(fn(f)); row.alpha_composite(b, (k * cw + 14, ch - 22 - b.height + 4))
        big = row.resize((cw * 3 * S, ch * S), Image.NEAREST).convert('RGB')
        out = Image.new('RGB', (big.width, big.height + 34), (156, 196, 236)); out.paste(big, (0, 0)); dd = ImageDraw.Draw(out)
        for k, nm in enumerate(['A 三滴汗噴出', 'B 大汗滴＋喘氣', 'C 汗滴＋熱氣']): dd.text((k * cw * S + 12, ch * S + 4), nm, fill=(40, 24, 16), font=font)
        frames.append(out.quantize(64))
    frames[0].save('/home/claude/gy/tired_anim.gif', save_all=True, append_images=frames[1:], duration=140, loop=0)
    print('ok')
def T(f):   # 右上小滴、左中大滴，上下擺動像在流汗（兩滴錯開一拍）
    big = [0, 1, 2, 1][f % 4]; small = [1, 0, 1, 2][f % 4]
    c = drop(3, 2 + big, True); c.update(drop(8, 0 + small, False))
    return grid(c)
def make_one(fn, out):
    hero = Image.open('/home/claude/kenney/tiles/07_01.png').convert('RGBA')
    S = 6; cw, ch = 36, 44; frames = []
    for t in range(16):
        f = t // 2
        row = Image.new('RGBA', (cw, ch), (156, 196, 236, 255)); d = ImageDraw.Draw(row); d.rectangle([0, ch - 6, cw, ch], fill=(196, 150, 96))
        row.alpha_composite(hero, (8, ch - 22 + (1 if (t // 4) % 2 else 0)))
        b = bubble(fn(f)); row.alpha_composite(b, (14, ch - 22 - b.height + 4))
        frames.append(row.resize((cw * S, ch * S), Image.NEAREST).convert('RGB').quantize(64))
    frames[0].save(out, save_all=True, append_images=frames[1:], duration=150, loop=0)
def make_flow(out):
    hero = Image.open('/home/claude/kenney/tiles/07_01.png').convert('RGBA')
    S = 6; cw, ch = 36, 44; frames = []; N = 12
    for t in range(N * 2):
        big_top = -3 + (t % N); small_top = -3 + ((t + 6) % N)   # 從上方流進來、流到底下消失，兩滴錯開半圈
        c = {}
        if big_top <= 8: c.update(drop(3, big_top, True))
        if small_top <= 8: c.update(drop(8, small_top, False))
        g = grid(c)
        row = Image.new('RGBA', (cw, ch), (156, 196, 236, 255)); d = ImageDraw.Draw(row); d.rectangle([0, ch - 6, cw, ch], fill=(196, 150, 96))
        row.alpha_composite(hero, (8, ch - 22 + (1 if (t // 6) % 2 else 0)))
        b = bubble(g); row.alpha_composite(b, (14, ch - 22 - b.height + 4))
        frames.append(row.resize((cw * S, ch * S), Image.NEAREST).convert('RGB').quantize(64))
    frames[0].save(out, save_all=True, append_images=frames[1:], duration=110, loop=0)
C_TRAIL = 'L'
def make_real(out):
    from emote import C as EC
    EC['L'] = (186, 218, 246)   # 淡藍色：汗流過的痕跡
    hero = Image.open('/home/claude/kenney/tiles/07_01.png').convert('RGBA')
    S = 6; cw, ch = 36, 44; frames = []
    # 一滴汗：先在上面慢慢冒出來（小→大），停一下，再越滑越快往下流，留下一點痕跡，流到底消失
    seq = [('s', 0), ('s', 0), ('b', 0), ('b', 0), ('b', 0), ('b', 1), ('b', 2), ('b', 3), ('b', 5), ('b', 7), ('b', 10), ('-', 0), ('-', 0)]
    for t, (kind, dy) in enumerate(seq):
        c = {}
        if kind == 's': c.update(drop(5, 0, False))
        if kind == 'b':
            top = dy
            for yy in range(max(0, top - 2), max(0, top)): c[(5, yy)] = 'L'   # 流過的痕跡（只留兩格）
            c.update(drop(5, top, True))
        g = grid(c)
        row = Image.new('RGBA', (cw, ch), (156, 196, 236, 255)); d = ImageDraw.Draw(row); d.rectangle([0, ch - 6, cw, ch], fill=(196, 150, 96))
        row.alpha_composite(hero, (8, ch - 22 + (1 if t in (6, 7, 8, 9) else 0)))
        b = bubble(g); row.alpha_composite(b, (14, ch - 22 - b.height + 4))
        frames.append(row.resize((cw * S, ch * S), Image.NEAREST).convert('RGB').quantize(64))
    durs = [220, 160, 160, 260, 200, 140, 120, 100, 90, 80, 80, 160, 160]
    frames[0].save(out, save_all=True, append_images=frames[1:], duration=durs, loop=0)
