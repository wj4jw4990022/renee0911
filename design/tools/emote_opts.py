import sys; sys.path.insert(0, '/home/claude/tools')
from emote import bubble, C
from PIL import Image, ImageDraw, ImageFont
C.update({'F':(255,214,170),'f':(232,170,120),'Q':(250,170,190)})
def show(opts, out):
    hero = Image.open('/home/claude/kenney/tiles/07_01.png').convert('RGBA')
    font = ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc', 22)
    S = 6; cw, ch = 36, 44
    sh = Image.new('RGB', (len(opts) * cw * S, ch * S + 36), (156, 196, 236)); d = ImageDraw.Draw(sh)
    for k, (nm, g) in enumerate(opts):
        c = Image.new('RGBA', (cw, ch), (156, 196, 236, 255)); cd = ImageDraw.Draw(c); cd.rectangle([0, ch - 6, cw, ch], fill=(196, 150, 96))
        c.alpha_composite(hero, (8, ch - 22)); b = bubble(g); c.alpha_composite(b, (14, ch - 22 - b.height + 4))
        sh.paste(c.resize((cw * S, ch * S), Image.NEAREST), (k * cw * S, 0)); d.text((k * cw * S + 14, ch * S + 4), nm, fill=(40, 24, 16), font=font)
    sh.save(out)
shy = [
 ('A 臉頰紅暈', [".........","..KKKKK..",".KFFFFFK.","KFKFFFKFK","KQQFFFQQK",".KFFKFFK.","..KKKKK.."]),
 ('B 粉色斜線加粗', ["PP.PP.PP.",".PP.PP.PP","..P..P..P",".........","PP.PP.PP.",".PP.PP.PP","..P..P..P"]),
 ('C 閉眼害羞臉', [".........","..KKKKK..",".KFFFFFK.","KFKKFKKFK","KQQFFFQQK",".KFFFFFK.","..KKKKK.."]),
 ('D 小愛心＋紅暈', ["..PP.PP..",".PPPPPPP.",".PPPPPPP.","..PPPPP..","...PPP...","....P....","........."]),
]
show(shy, '/home/claude/gy/opt_shy.png')
shy2 = [
 ('E 一個橢圓', ["..PPPPP..",".PQQQQQP.","PQpQpQpQP","PpQpQpQQP","PQQQQQQQP",".PQQQQQP.","..PPPPP.."]),
 ('F 一個橢圓（線更粗）', ["..PPPPP..",".PQppQpP.","PQppQppQP","PppQppQQP","PpQppQQQP",".PQQQQQP.","..PPPPP.."]),
 ('G 兩邊臉頰', [".........","PPPP.PPPP","QppQ.QppQ","pQpp.pQpp","PPPP.PPPP",".........","........."]),
]
show(shy2, '/home/claude/gy/opt_shy2.png')
shy3 = [
 ('A 原版', [".........","..KKKKK..",".KFFFFFK.","KFKFFFKFK","KQQFFFQQK",".KFFKFFK.","..KKKKK.."]),
 ('A2 加大', ["..KKKKK..",".KFFFFFK.","KFKFFFKFK","KFFFFFFFK","KppFFFppK",".KFFKFFK.","..KKKKK.."]),
 ('C2 閉眼', ["..KKKKK..",".KFFFFFK.","KKKFFFKKK","KFFFFFFFK","KppFFFppK",".KFFKFFK.","..KKKKK.."]),
]
show(shy3, '/home/claude/gy/opt_shy3.png')

sad = [
 ('A 兩顆淚滴', ["...B.....","..BB...B.",".BBBB.BB.",".BWBB.BBB",".BBBB.Bb.","..bb.....","........."]),
 ('B 哭臉（淚流）', ["..KKKKK..",".KFFFFFK.","KKKFFFKKK","KBFFFFFBK","KBFKKKFBK",".BFFFFFB.","..KKKKK.."]),
 ('C 哭臉（眼角淚滴）', ["..KKKKK..",".KFFFFFK.","KFKFFFKFK","KBFFFFFBK","KBFKKKFBK",".KFFFFFK.","..KKKKK.."]),
 ('D 心碎', [".RR...RR.","RRRR.RRRR","RRRR.RRRR","RRR.RRRrR",".RRR.RrR.","..RR.rR..","....R...."]),
]
show(sad, '/home/claude/gy/opt_sad.png')

nerv = [
 ('A 小臉＋大冷汗', ["..KKKKKB.",".KFFFFBBB","KFKFFFBWB","KFFFFFKBK","KFFFFFFFK",".KFKFKFK.","..KKKKK.."]),
 ('B 小臉波浪嘴＋汗', ["..KKKKK.B",".KFFFFFBB","KFKFFFKBB","KFFFFFFFK","KFKFKFKFK",".KFKFKFK.","..KKKKK.."]),
 ('C 三滴汗', ["B...B....","B..BB..B.","BB.BBB.B.","BBBBWB.BB","BB.BBB.BB","...bb..bb","........."]),
 ('D 小臉瞪眼＋汗', ["..KKKKKB.",".KFFFFBBB","KKKFFKKBB","KKKFFKKKK","KFFFFFFFK",".KFFKKFK.","..KKKKK.."]),
]
show(nerv, '/home/claude/gy/opt_nerv.png')
