import sys, math; sys.path.insert(0, '/home/claude/tools')
from emote_opts import show, C
C['F'] = (255, 214, 170); C['f'] = (226, 170, 120); C['U'] = (255, 246, 232); C['u'] = (236, 214, 196)
def capsule(ang=-32, L=4.6, R=2.1, pad=1.7, w=11, h=9):
    g = [['.'] * w for _ in range(h)]; ca, sa = math.cos(math.radians(ang)), math.sin(math.radians(ang))
    cx, cy = (w - 1) / 2, (h - 1) / 2
    def d(x, y):
        u = (x - cx) * ca + (y - cy) * sa; v = -(x - cx) * sa + (y - cy) * ca
        q = max(abs(u) - L, 0); return math.hypot(q, v), u, v
    for y in range(h):
        for x in range(w):
            dist, u, v = d(x, y)
            if dist <= R:
                ch = 'F'
                if abs(u) <= pad: ch = 'U' if v < .6 else 'u'            # 中間的紗布
                elif v > R - 1.0: ch = 'f'                              # 下緣陰影
                if abs(u) <= pad and (round(u + 10) + round(v + 10)) % 2 == 0 and abs(v) < R - .8: ch = 'f'   # 紗布上的小孔
                g[y][x] = ch
            elif dist <= R + 1.0: g[y][x] = 'K'
    return [''.join(r) for r in g]
if __name__ == '__main__':
    show([('C4 水平', capsule(ang=0, L=2.6, R=2.6, pad=1.6)), ('C5 微斜', capsule(ang=-15, L=2.4, R=2.4, pad=1.5)), ('C6 斜貼', capsule(ang=-30, L=2.6, R=2.2, pad=1.4))], '/home/claude/gy/opt_band.png')
C['X'] = (110, 28, 34); C['Q'] = (244, 150, 150)
BAND_RED = ["...........",".KKKKKKKKK.","KFfOOOOOfFK","KFFOQRQOFFK","KfFQRXRQFfK","KFFOQRQOFFK","KFfOOOOOfFK",".KKKKKKKKK.","..........."]
BAND_RED2 = ["...........",".KKKKKKKKK.","KFfOOOOOfFK","KFFOQRQOFFK","KfFRRXRRFfK","KFFOQRQOFFK","KFfOOOOOfFK",".KKKKKKKKK.","..........."]
if __name__ == '__main__':
    show([('照片款', BAND_RED), ('血跡大一點', BAND_RED2)], '/home/claude/gy/opt_band2.png')
BAND_RED3 = ["...........","..KKKKKKK..",".KFfFOOFfFK.".replace('.K','.K')[:11],"KFFfOQROfFFK"[:11],"KfFFQRXQFfK","KFFfOQROfFK","KFfFOOOFfFK",".KKKKKKKKK.","..........."]
B3 = ["...........",
      "..KKKKKKK..",
      ".KFfFOOFfFK".ljust(11,'.')[:11],
      "KFFfORQOfFK",
      "KfFFRXRQFfK",
      "KFFfOQROfFK",
      ".KFfFOOFfK.",
      "..KKKKKKK..",
      "..........."]
if __name__ == '__main__':
    show([('照片款', BAND_RED), ('圓角＋紗布窄', B3)], '/home/claude/gy/opt_band2.png')
WIDE = ["..KKKKKKKKKKK..",
        ".KFfFfFOOOFfFfK.".ljust(15,'.')[:15],
        "KFfFfFOQRQOfFfFK"[:15],
        "KfFfFORRXRROFfFK"[:15],
        "KFfFfFOQRQOfFfFK"[:15],
        ".KFfFfFOOOFfFfK.".ljust(15,'.')[:15],
        "..KKKKKKKKKKK.."]
WIDE = ["...KKKKKKKKK...",
        ".KKFfFfOOOfFfKK",
        "KFfFfFOQRQOFfFK",
        "KfFfFORRXRROfFK",
        "KFfFfFOQRQOFfFK",
        ".KKFfFfOOOfFfKK",
        "...KKKKKKKKK..."]
WIDE = [r.ljust(15, '.')[:15] for r in WIDE]
if __name__ == '__main__':
    show([('照片款（加寬）', WIDE)], '/home/claude/gy/opt_band3.png')
WIDE2 = ["...KKKKKKKKK...",
         ".KKFfFUUUFfFKK.",
         "KFfFfUQRQUfFfFK",
         "KfFfURRXRRUfFfK",
         "KFfFfUQRQUfFfFK",
         ".KKFfFUUUFfFKK.",
         "...KKKKKKKKK..."]
if __name__ == '__main__':
    show([('照片款', WIDE2)], '/home/claude/gy/opt_band3.png')
