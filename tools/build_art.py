# 產生 js/art.js：把定案圖檔（Kenney 角色、表情泡泡、裝備圖示）轉成文字資料，遊戲載入時不用另外讀圖
# 用法：python3 tools/build_art.py <design 資料夾>   （design-wip 分支的 design/）
import sys, json, glob, os, base64, io, subprocess, tempfile
from PIL import Image
D = sys.argv[1]
KT = D + '/assets/kenney-tiny-dungeon/tiles/'
LET = {(63,38,49):'#',(189,108,74):'H',(118,59,54):'h',(247,194,130):'S',(225,154,101):'s',(192,203,220):'C',(139,155,180):'c',(38,43,68):'k',
       (155,76,163):'P',(209,118,208):'p',(82,96,124):'m',(37,149,106):'G',(67,225,179):'g',(234,165,108):'o',(170,183,204):'x',(232,69,55):'r'}
ken = {}
for n in ['07_00','07_01','07_02','07_04','08_02','08_03','09_03','09_04']:
    im = Image.open(KT + n + '.png').convert('RGBA')
    ken[n] = ''.join('.' if im.getpixel((x,y))[3] < 128 else LET[im.getpixel((x,y))[:3]] for y in range(16) for x in range(16))
pal = []; CH = [chr(c) for c in range(35, 127) if chr(c) not in '\\']
def enc(im):
    im = im.convert('RGBA'); s = []
    for y in range(im.height):
        for x in range(im.width):
            r,g,b,a = im.getpixel((x,y))
            if a < 128: s.append(' '); continue
            hx = '#%02x%02x%02x' % (r,g,b)
            if hx not in pal: pal.append(hx)
            s.append(CH[pal.index(hx)])
    return ''.join(s)
emo = {}
E = D + '/final/emotes/'
for f in sorted(glob.glob(E + '*.png')):
    nm = os.path.basename(f)[:-4]
    if nm.endswith('_frames'): continue
    js = E + nm + '.json'
    if os.path.exists(js):
        m = json.load(open(js)); im = Image.open(E + nm + '_frames.png')
        emo[nm] = {'w':m['frame_w'], 'h':m['frame_h'], 'n':m['frames'], 'd':m['durations_ms'], 'px':enc(im)}
    else:
        im = Image.open(f); emo[nm] = {'w':im.width, 'h':im.height, 'n':1, 'd':[1000], 'px':enc(im)}
eq = {}; equrl = {}
for f in sorted(glob.glob(D + '/final/equipment/*.png')):
    nm = os.path.basename(f)[:-4]; im = Image.open(f).convert('RGBA')
    eq[nm] = enc(im.resize((16,16), Image.NEAREST))
    b = io.BytesIO(); im.save(b, 'PNG', optimize=True); equrl[nm] = 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()
assert len(pal) < len(CH), len(pal)
# 斜角建築（村子）：design/buildings/tools/game_export.py 輸出 PNG＋meta。建築用自己的色盤 bpal，
# 窗戶像素記成 'W'（玻璃）、'Wh'（反光），遊戲裡依白天／晚上上色
bld = {}; bpal = ['W', 'Wh']
TMP = tempfile.mkdtemp()
subprocess.run([sys.executable, D + '/buildings/tools/game_export.py', TMP], check=True, stdout=subprocess.DEVNULL)
BM = json.load(open(TMP + '/meta.json'))
for nm, m in BM.items():
    im = Image.open(TMP + '/' + nm + '.png').convert('RGBA'); wn = {(x, y): hl for x, y, hl in m['win']}; s = []
    for y in range(im.height):
        for x in range(im.width):
            r,g,b,a = im.getpixel((x,y))
            if a < 128: s.append(' '); continue
            hx = 'Wh' if wn.get((x, y)) == 1 else 'W' if (x, y) in wn else '#%02x%02x%02x' % (r,g,b)
            if hx not in bpal: bpal.append(hx)
            s.append(CH[bpal.index(hx)])
    bld[nm] = {'w':m['w'], 'h':m['h'], 'ax':m['ax'], 'ay':m['ay'], 'door':m['door'], 'dy':m['dy'], 'dw':m['dw'], 'px':''.join(s)}
assert len(bpal) < len(CH), len(bpal)
# 怪物（design/monsters，定案）：每區 a／c 雜魚、b／d 強敵、e 菁英（b 的菁英版）；魔王 boneking、abyss。底下透明的列裁掉，腳底就是最後一列
ZN = ['草原', '森林', '荒地', '礦坑', '海岸', '雪山', '魔王城']; mon = {}   # 顏色多，每隻各自一個小色盤
def menc(f):
    im = Image.open(f).convert('RGBA'); bb = im.getbbox(); im = im.crop((0, 0, im.width, bb[3])); s = []; mpal = []
    for y in range(im.height):
        for x in range(im.width):
            r,g,b,a = im.getpixel((x,y))
            if a < 128: s.append(' '); continue
            hx = '#%02x%02x%02x' % (r,g,b)
            if hx not in mpal: mpal.append(hx)
            s.append(CH[mpal.index(hx)])
    assert len(mpal) < len(CH), (f, len(mpal))
    return {'w':im.width, 'h':im.height, 'pal':mpal, 'px':''.join(s)}
for f in sorted(glob.glob(D + '/monsters/*.png')):
    nm = os.path.basename(f)[:-4]
    if nm.startswith('_'): continue
    if nm.startswith('BOSS_'): mon['boneking' if '骸骨' in nm else 'abyss'] = menc(f); continue
    t, zn, _ = nm.split('_', 2); mon['z%d%s' % (ZN.index(zn), t.lower())] = menc(f)
# 馬、驛馬車（design/rides，v17.39）、野外背景物（design/wild，v17.40）：每張各自一個小色盤；最後一列就是腳底
def folder(script):
    res = {}; RT = tempfile.mkdtemp(); subprocess.run([sys.executable, script, RT], check=True, stdout=subprocess.DEVNULL)
    for f in sorted(glob.glob(RT + '/*.png')):
        im = Image.open(f).convert('RGBA'); s = []; rpal = []
        for y in range(im.height):
            for x in range(im.width):
                r,g,b,a = im.getpixel((x,y))
                if a < 128: s.append(' '); continue
                hx = '#%02x%02x%02x' % (r,g,b)
                if hx not in rpal: rpal.append(hx)
                s.append(CH[rpal.index(hx)])
        assert len(rpal) < len(CH), (f, len(rpal))
        res[os.path.basename(f)[:-4]] = {'w':im.width, 'h':im.height, 'pal':rpal, 'px':''.join(s)}
    return res
ride = folder(D + '/rides/rides.py'); wild = folder(D + '/wild/wild.py'); room = folder(D + '/rooms/rooms.py')   # v17.47：屋裡的小窗格
out = '// 自動產生（tools/build_art.py），不要手改。圖檔來源：design-wip 分支 design/final、design/buildings、design/monsters、Kenney Tiny Dungeon（CC0）\n'
out += 'const ART = ' + json.dumps({'ch':''.join(CH[:len(pal)]), 'pal':pal, 'ken':ken, 'emo':emo, 'eq':eq, 'equrl':equrl, 'bch':''.join(CH[:len(bpal)]), 'bpal':bpal, 'bld':bld, 'mch':''.join(CH), 'mon':mon, 'ride':ride, 'wild':wild, 'room':room}, ensure_ascii=False, separators=(',',':')) + ';\n'
open(os.path.dirname(os.path.abspath(__file__)) + '/../js/art.js', 'w').write(out)
print('pal', len(pal), 'bytes', len(out))
