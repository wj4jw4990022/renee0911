import sys; import os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import os
from PIL import Image, ImageDraw, ImageFont
HERO=Image.open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'../../assets')+'/kenney-tiny-dungeon/tiles/07_04.png').convert('RGBA')
F='/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'
def sheet(rows,out,S=3,title=None,maxw=1700):
    BG=(118,84,58); f=ImageFont.truetype(F,22); ft=ImageFont.truetype(F,28)
    # 每列自動換行
    lines=[]
    for label,items in rows:
        cur=[]; w=0
        for n,im in items:
            if cur and (w+im.width+10)*S>maxw: lines.append((label,cur)); label=''; cur=[]; w=0
            cur.append((n,im)); w+=im.width+10
        lines.append((label,cur))
    H=50 if title else 10
    hs=[]
    for _,it in lines:
        h=max(max(im.height for _,im in it),16)+4; hs.append(h); H+=h*S+34
    W=maxw+140+40
    sh=Image.new('RGB',(W,H),BG); dr=ImageDraw.Draw(sh)
    y=10
    if title: dr.text((14,8),title,fill=(255,240,210),font=ft); y=50
    for (label,it),h in zip(lines,hs):
        x=140
        dr.text((12,y+h*S//2-12),label,fill=(255,224,140),font=f)
        for n,im in it:
            big=im.resize((im.width*S,im.height*S),Image.NEAREST); sh.paste(big,(x,y+(h-im.height-2)*S),big)
            tw=dr.textlength(n,font=f); dr.text((x+im.width*S/2-tw/2,y+h*S+4),n,fill=(255,240,210),font=f)
            x+=(im.width+10)*S
        hb=HERO.resize((16*S,16*S),Image.NEAREST); sh.paste(hb,(x,y+(h-18)*S),hb)
        y+=h*S+34
    sh.save(out)
