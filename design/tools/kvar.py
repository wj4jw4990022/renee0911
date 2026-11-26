# 換 Kenney 角色的樣貌：分區換色（頭髮／皮膚／衣服）、頭身互換、加小配件；顏色只用兩階（亮、暗），跟原圖一樣
from PIL import Image, ImageDraw
import random
T = '/home/claude/kenney/tiles/'
OUT = (63, 38, 49)
HAIR0 = [(189,108,74),(118,59,54)]          # 原本的頭髮：亮、暗
SKIN0 = [(247,194,130),(225,154,101)]
SHIRT0 = [(192,203,220),(139,155,180)]
HAIRS = {'棕':HAIR0,'黑':[(82,74,96),(48,40,58)],'金':[(244,206,96),(196,146,52)],'紅':[(214,84,58),(150,48,40)],'銀':[(214,218,230),(150,156,176)],'粉':[(240,140,180),(180,84,130)],'藍':[(96,140,220),(56,84,160)]}
SKINS = {'白':SKIN0,'小麥':[(222,160,104),(186,120,74)],'深':[(150,96,64),(112,66,42)]}
SHIRTS = {'淺藍':SHIRT0,'紅':[(222,86,74),(160,52,48)],'綠':[(120,188,96),(72,132,64)],'黃':[(244,206,96),(196,146,52)],'紫':[(176,110,206),(120,70,160)],'白':[(240,240,240),(196,196,210)]}
def recolor(im, hair=None, skin=None, shirt=None, split=10):
    im = im.convert('RGBA').copy(); px = im.load()
    for y in range(16):
        for x in range(16):
            r,g,b,a = px[x,y]
            if not a: continue
            c = (r,g,b)
            if skin and c in SKIN0: c = skin[SKIN0.index(c)]
            elif hair and y < split and c in HAIR0: c = hair[HAIR0.index(c)]
            elif shirt and y >= split and c in SHIRT0: c = shirt[SHIRT0.index(c)]
            px[x,y] = c + (a,)
    return im
def mix(head, body, cut=11):
    o = Image.new('RGBA', (16,16), (0,0,0,0)); o.alpha_composite(body.crop((0,cut,16,16)), (0,cut)); o.alpha_composite(head.crop((0,0,16,cut)), (0,0)); return o
def acc(im, kind, col=None):
    im = im.copy(); d = ImageDraw.Draw(im)
    if kind == 'glasses': d.line([(5,7),(10,7)], fill=OUT); d.point([(5,8),(10,8)], fill=(120,200,230))
    if kind == 'band': d.line([(3,4),(12,4)], fill=col or (222,86,74))
    if kind == 'beard':
        for y in (9,10): d.line([(5,y),(10,y)], fill=col or (118,59,54))
        d.line([(6,11),(9,11)], fill=col or (118,59,54))
    if kind == 'flower': d.point([(11,2),(12,3),(10,3),(11,4)], fill=(240,120,170)); d.point([(11,3)], fill=(255,230,120))
    if kind == 'scar': d.line([(10,5),(11,7)], fill=(170,70,70))
    return im
if __name__ == '__main__':
    base = Image.open(T+'07_01.png'); girl = Image.open(T+'08_03.png'); bald = Image.open(T+'07_02.png'); knight = Image.open(T+'08_02.png'); barb = Image.open(T+'07_04.png')
    rows = []
    rows.append(('髮色', [recolor(base, hair=v) for v in HAIRS.values()]))
    rows.append(('膚色', [recolor(base, skin=v) for v in SKINS.values()] + [recolor(girl, skin=v) for v in SKINS.values()]))
    rows.append(('衣服', [recolor(base, shirt=v) for v in SHIRTS.values()]))
    rows.append(('頭身互換', [mix(girl, knight), mix(base, knight), mix(bald, base), mix(girl, base), mix(barb, knight), mix(base, barb)]))
    rows.append(('配件', [acc(base,'glasses'), acc(base,'band'), acc(bald,'beard'), acc(girl,'flower'), acc(base,'scar'), acc(acc(bald,'beard',(214,218,230)),'glasses')]))
    random.seed(7); heads = [base, girl, bald, barb]; bodies = [base, knight, barb, girl]; rnd = []
    for i in range(14):
        h = mix(random.choice(heads), random.choice(bodies))
        h = recolor(h, hair=random.choice(list(HAIRS.values())), skin=random.choice(list(SKINS.values())), shirt=random.choice(list(SHIRTS.values())))
        if random.random() < .4: h = acc(h, random.choice(['glasses','band','flower','scar']))
        rnd.append(h)
    rows.append(('隨機村民', rnd[:7])); rows.append(('', rnd[7:]))
    S = 5; cw = 16*S + 14; lw = 0
    W = 7 * cw + 20; H = len(rows) * (16*S + 14) + 10
    sh = Image.new('RGB', (W, H), (122, 75, 40))
    for r, (nm, ims) in enumerate(rows):
        for i, im in enumerate(ims):
            sh.paste(im.resize((16*S,16*S), Image.NEAREST), (10 + i*cw, 8 + r*(16*S+14)), im.resize((16*S,16*S), Image.NEAREST))
    sh.save('/home/claude/gy/kenney_variants.png'); print('ok')
