# 用一張正面圖做出走路動畫：抬腳交替＋身體上下＋往前傾一點＋左右翻面
from PIL import Image, ImageDraw
def walk_frames(im, leg_top, mid_x, lift=1, bob=1, arm=None):
    W, H = im.size; frames = []
    for f in range(4):
        o = Image.new('RGBA', (W, H + bob + lift), (0, 0, 0, 0))
        up = bob if f in (1, 3) else 0
        body = im.crop((0, 0, W, leg_top)); o.paste(body, (0, lift + bob - up), body)
        for side in (0, 1):   # 0 左腳、1 右腳
            x0, x1 = (0, mid_x) if side == 0 else (mid_x, W)
            leg = im.crop((x0, leg_top, x1, H))
            raise_ = lift if (f == 1 and side == 0) or (f == 3 and side == 1) else 0
            o.paste(leg, (x0, leg_top + lift + bob - raise_), leg)
        if arm and f in (1, 3):   # 手臂前後擺：被抬腳那一側的對邊手臂往下 1 格
            (ax0, ax1, ay0, ay1) = arm[0] if f == 3 else arm[1]
            a = im.crop((ax0, ay0, ax1, ay1)); o.paste(Image.new('RGBA', a.size, (0,0,0,0)), (ax0, ay0 + lift + bob - up)); o.paste(a, (ax0, ay0 + lift + bob - up + 1), a)
        frames.append(o)
    return frames
def walk2(im, leg_top, mid_x):
    # 改良版：先畫腿、再把身體蓋上去；身體只往「下」沉 1 格（蓋住腿的上緣），抬起的腿往上縮進身體後面，所以永遠不會裂開
    W, H = im.size; out = []
    body = im.crop((0, 0, W, leg_top))
    for f in range(4):
        o = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        for side in (0, 1):
            x0, x1 = (0, mid_x) if side == 0 else (mid_x, W)
            leg = im.crop((x0, leg_top - 1, x1, H))   # 多拿一格，跟身體重疊
            r = 1 if (f == 1 and side == 0) or (f == 3 and side == 1) else 0
            o.paste(leg, (x0, leg_top - 1 - r), leg)
        o.alpha_composite(body, (0, 1 if f in (1, 3) else 0))
        out.append(o)
    return out
def walk3(im, leg_top, mid_x):
    # 第三版：踏地的那隻腳釘在地上、往上「拉長」1 格補縫；身體和抬起的腳一起往上 1 格，所以身體和腿永遠連著
    W, H = im.size; out = []
    body = im.crop((0, 0, W, leg_top))
    for f in range(4):
        o = Image.new('RGBA', (W, H + 1), (0, 0, 0, 0))
        if f in (0, 2): o.alpha_composite(im, (0, 1)); out.append(o); continue
        lift_side = 0 if f == 1 else 1
        o.alpha_composite(body, (0, 0))
        for side in (0, 1):
            x0, x1 = (0, mid_x) if side == 0 else (mid_x, W)
            leg = im.crop((x0, leg_top, x1, H))
            if side == lift_side: o.alpha_composite(leg, (x0, leg_top))
            else:
                o.alpha_composite(leg, (x0, leg_top + 1))
                o.alpha_composite(im.crop((x0, leg_top, x1, leg_top + 1)), (x0, leg_top))   # 補縫
        out.append(o)
    return out
def hop_frames(im):   # 跳跳走：只有身體一彈一彈，加一點壓扁
    W, H = im.size; out = []
    for f, (dy, sq) in enumerate([(0, 0), (2, 0), (3, 0), (1, 1)]):
        o = Image.new('RGBA', (W, H + 3), (0,0,0,0)); t = im if not sq else im.resize((W, H - 1), Image.NEAREST)
        o.paste(t, (0, 3 - dy + (1 if sq else 0)), t); out.append(o)
    return out
if __name__ == '__main__':
    S = 3
    up2 = lambda im: im.resize((im.width * 2, im.height * 2), Image.NEAREST)
    names = ['07_01', '07_00', '08_03', '07_03', '08_00']
    sprites = [Image.open(f'/home/claude/kenney/tiles/{n}.png') for n in names]
    lanes = [[up2(f) for f in walk3(im, 14, 8)] for im in sprites]
    LH = 46; Wd = 200; frames = []; T = 104
    for t in range(T):
        fr = Image.new('RGBA', (Wd, LH * len(lanes)), (156, 196, 236, 255)); d = ImageDraw.Draw(fr)
        for k, fs in enumerate(lanes):
            gy = (k + 1) * LH - 5; d.rectangle([0, gy, Wd, gy + 5], fill=(196, 150, 96)); d.line([0, gy, Wd, gy], fill=(120, 84, 52))
            ph = (t * 2.5 + k * 37) % ((Wd + 60) * 2); goingR = ph < Wd + 60; x = ph - 30 if goingR else (Wd + 60) * 2 - ph - 30
            f = fs[(t // 2) % 4]; f = f if goingR else f.transpose(Image.FLIP_LEFT_RIGHT)
            bb = fs[0].getbbox(); fr.alpha_composite(f, (int(x) - f.width // 2, gy - bb[3] + 1))
        frames.append(fr.resize((Wd * S, fr.height * S), Image.NEAREST).convert('RGB').quantize(64))
    frames[0].save('/home/claude/gy/walk_v2.gif', save_all=True, append_images=frames[1:], duration=80, loop=0)
    # 新舊對照：同一個角色的 4 格（上排舊、下排新）
    im = sprites[0]; old = walk_frames(im, 12, 8); new = walk3(im, 14, 8)
    sh = Image.new('RGBA', (4 * 20 + 4, 2 * 22 + 4), (156, 196, 236, 255))
    for i in range(4):
        sh.alpha_composite(old[i], (2 + i * 20, 2)); sh.alpha_composite(new[i], (2 + i * 20, 26))
    sh.resize((sh.width * 8, sh.height * 8), Image.NEAREST).save('/home/claude/gy/walk_fix_cmp.png')
    print('ok')
