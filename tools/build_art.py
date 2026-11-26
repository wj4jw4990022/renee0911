# 產生 js/art.js：把定案圖檔（Kenney 角色、表情泡泡、裝備圖示）轉成文字資料，遊戲載入時不用另外讀圖
# 用法：python3 tools/build_art.py <design 資料夾>   （design-wip 分支的 design/）
import sys, json, glob, os, base64, io
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
out = '// 自動產生（tools/build_art.py），不要手改。圖檔來源：design-wip 分支 design/final、Kenney Tiny Dungeon（CC0）\n'
out += 'const ART = ' + json.dumps({'ch':''.join(CH[:len(pal)]), 'pal':pal, 'ken':ken, 'emo':emo, 'eq':eq, 'equrl':equrl}, ensure_ascii=False, separators=(',',':')) + ';\n'
open(os.path.dirname(os.path.abspath(__file__)) + '/../js/art.js', 'w').write(out)
print('pal', len(pal), 'bytes', len(out))
