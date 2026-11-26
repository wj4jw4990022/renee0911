# 給遊戲用的輸出：每棟建築的 PNG 之外，另外記下「窗戶像素」「門的位置」「地面對齊點」
# 用法：python3 game_export.py <輸出資料夾>   → 輸出資料夾/<名稱>.png 和 輸出資料夾/meta.json
# 遊戲裡的世界往右延伸，所以輸出時左右翻轉：建築正面朝右下（總表草稿是朝左下）
# meta.json：{名稱: {w, h, ax, ay, door, win:[[x, y, 亮面?], ...]}}
#   ax, ay：主體地基最前面那個角（菱形最下方）在圖上的位置，遊戲把它對齊街道地面
#   door：正門門口中間的 x（沒有門的用 ax）；dy：門口牆腳的 y；dw：門寬（門前小路一樣寬）
#   win：白天是藍玻璃、晚上要亮起來的窗戶像素（0＝玻璃，1＝反光）；本來就亮著的窗（惡名事務所）不算
import sys, os, json; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import iso
from iso import Iso, PAL
import bld as B

REC = None
_set, _window, _door, _box, _flat = Iso.set, Iso.window, Iso.door, Iso.box, Iso.flat_top
GLASS = {PAL['g']: 0, PAL['gl']: 1, PAL['gh']: 1}

def set_(s, x, y, c):
    _set(s, x, y, c)
    if REC is not None and REC.get('inwin') and c is not None:
        col = s.col(c)
        if col in GLASS: REC['win'][(int(x), int(y))] = (col, GLASS[col])
def window(s, face, u, v, w=4, h=4, frame='out', lit=False):
    if REC is not None and not lit: REC['inwin'] = True
    try: _window(s, face, u, v, w, h, frame, lit)
    finally:
        if REC is not None: REC['inwin'] = False
def door(s, face, u, w=5, h=8, c='wd', arch=True, z=0):
    if REC is not None and REC['door'] is None:
        x, y = s.fpt(face, u + w / 2, z); REC['door'] = (x, y); REC['dw'] = w
    return _door(s, face, u, w, h, c, arch, z)
def anchor(s, x0, y0, x1, y1, z0):
    if REC is None or z0 != 0 or (x1 - x0) * (y1 - y0) < 90: return
    x, y = s.P(x1, y1, 0)
    if REC['anchor'] is None or y > REC['anchor'][1]: REC['anchor'] = (x, y)
def box(s, x0, y0, x1, y1, z0, z1, *a, **k):
    anchor(s, x0, y0, x1, y1, z0); return _box(s, x0, y0, x1, y1, z0, z1, *a, **k)
def flat_top(s, x0, y0, x1, y1, z, c):
    anchor(s, x0, y0, x1, y1, z); return _flat(s, x0, y0, x1, y1, z, c)
def crop(s):
    s.edge(); bb = s.im.getbbox(); REC['bb'] = bb; REC['im'] = s.im
    return s.im.crop(bb)
Iso.set, Iso.window, Iso.door, Iso.box, Iso.flat_top, Iso.crop = set_, window, door, box, flat_top, crop

ITEMS = {
 'mayor': lambda: B.mayor(), 'arena': lambda: B.arena(), 'temple': lambda: B.temple(), 'clinic': lambda: B.clinic(),
 'inn': lambda: B.inn(), 'stage': lambda: B.plaza(), 'tavern': lambda: B.tavern(), 'guild': lambda: B.guild(), 'smith': lambda: B.smith(),
 'house_0': lambda: B.house('r'), 'house_1': lambda: B.house('bl'), 'house_2': lambda: B.house('gr'), 'house_3': lambda: B.house('br'),
 'shop_0': lambda: B.house('r', shop='au'), 'shop_1': lambda: B.house('bl', shop='bl'), 'shop_2': lambda: B.house('gr', shop='r'), 'shop_3': lambda: B.house('br', shop='gr'),
 'stable': lambda: B.stable(), 'station': lambda: B.station(), 'telepad': lambda: B.telepad(), 'lot': lambda: B.telepad(False), 'gate': lambda: B.gate(),
 'office_1': lambda: B.office('地方'), 'office_2': lambda: B.office('王都'), 'office_3': lambda: B.office('王國'), 'office_4': lambda: B.office('大陸'), 'office_dark': lambda: B.office('地下'),
 'home_0': lambda: B.home('租屋'), 'home_1': lambda: B.home('買房'), 'home_2': lambda: B.home('結婚'), 'home_3': lambda: B.home('有小孩'),
}
ITEMS.update({'post': lambda: B.gate_post(), 'post_sign': lambda: B.gate_post(True), 'p_lamp': lambda: B.prop_lamp(), 'p_crate': lambda: B.prop_crate(),
 'p_barrel': lambda: B.prop_barrel(), 'p_bench': lambda: B.prop_bench(), 'p_flowers': lambda: B.prop_flowers()})
if hasattr(B, 'coach_iso'): ITEMS['coach'] = lambda: B.coach_iso()
if hasattr(B, 'horse_iso'): ITEMS['horse'] = lambda: B.horse_iso()

if __name__ == '__main__':
    out = sys.argv[1]; os.makedirs(out, exist_ok=True); meta = {}
    for k, f in ITEMS.items():
        REC = {'win': {}, 'inwin': False, 'door': None, 'anchor': None}
        globals()['REC'] = REC
        im = f(); bx, by = REC['bb'][:2]; full = REC['im'].load()
        win = [[x - bx, y - by, hl] for (x, y), (col, hl) in sorted(REC['win'].items()) if full[x, y][:3] == col]
        if REC['anchor']: ax, ay = REC['anchor'][0] - bx, REC['anchor'][1] - by
        else:
            ay = im.height - 1; ax = im.width / 2
        dx = REC['door'][0] - bx if REC['door'] else ax
        dy = REC['door'][1] - by if REC['door'] else ay
        # 左右翻轉，正面改朝右下
        if k not in ('coach', 'horse'):   # 馬和馬車本來就朝右
            from PIL import ImageOps
            im = ImageOps.mirror(im); Wd = im.width
            win = [[Wd - 1 - x, y, hl] for x, y, hl in win]; ax = Wd - 1 - ax; dx = Wd - 1 - dx
        im.save(os.path.join(out, k + '.png'))
        meta[k] = {'w': im.width, 'h': im.height, 'ax': round(ax), 'ay': round(ay), 'door': round(dx), 'dy': round(dy), 'dw': REC.get('dw', 0), 'win': win}
        print(k, im.size, 'anchor', meta[k]['ax'], meta[k]['ay'], 'door', meta[k]['door'], 'win', len(win))
    json.dump(meta, open(os.path.join(out, 'meta.json'), 'w'), separators=(',', ':'))
