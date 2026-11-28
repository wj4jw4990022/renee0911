import sys
from PIL import Image
import numpy as np
a=np.array(Image.open('r60.png').convert('RGBA')).astype(int)
H,W=a.shape[:2]; o=a.copy()
OUTL=(35,20,30); CLO=[(52,30,42),(68,41,54),(94,60,74)]   # 斗篷：暗、本色、亮（原圖 63,38,49）
HAIR=[(54,40,66),(74,58,90),(104,84,124),(146,122,168)]   # 頭髮：原圖 b、d＋亮
for y in range(H):
  for x in range(W):
    r,g,b,al=a[y,x]
    if not al: continue
    lum=(r+g+b)/3
    if lum<34: o[y,x,:3]=OUTL; continue
    if y>=55 and 13<=x<=35:
      o[y,x,:3]=(192,203,220) if y<57 else (139,155,180); continue
    purple = r>g+5 and b>=g+8 and not (r>200)
    if purple:
      inhead = 13<=x<=35 and 8<=y<=31
      if inhead:
        o[y,x,:3]=HAIR[0] if lum<58 else HAIR[1] if lum<85 else HAIR[2] if lum<118 else HAIR[3]
      else:
        o[y,x,:3]=CLO[0] if lum<58 else CLO[1] if lum<92 else CLO[2]
    elif y>=55 and r>g>b and r-b>25:      # 咖啡色鞋子 → 原圖的淺色靴
      o[y,x,:3]=(192,203,220) if lum>90 else (139,155,180)
Image.fromarray(o.astype(np.uint8)).save('r60c.png')
c=Image.new('RGBA',(64,64),(0,0,0,0)); c.alpha_composite(Image.fromarray(o.astype(np.uint8)),((64-W)//2,64-H-2)); c.save('小滿_64.png')
c.resize((512,512),Image.NEAREST).save('小滿_64_x8.png')
# 收斂成固定調色盤（照原圖的顏色＋各自的亮暗），去掉 AI 圖的雜色
PAL=[OUTL]+CLO+HAIR+[(248,214,182),(226,169,142),(236,160,150),(38,43,68),(110,120,170),
     (222,226,238),(192,203,220),(139,155,180),(82,96,124),(62,70,104),(189,108,74),(226,150,90)]
P=np.array(PAL)
q=o.copy()
for y in range(H):
  for x in range(W):
    if not q[y,x,3]: continue
    PP = P[:14] if (10<=x<=38 and 3<=y<=33) else P      # 頭部只用頭髮、斗篷、皮膚、眼睛的顏色
    q[y,x,:3]=PP[np.argmin(((PP-q[y,x,:3])**2).sum(1))]
    if y<17 and tuple(q[y,x,:3]) in [(248,214,182),(226,169,142),(236,160,150)]: q[y,x,:3]=HAIR[3]   # 頭髮反光不要變成膚色
Image.fromarray(q.astype(np.uint8)).save('r60q.png')
c=Image.new('RGBA',(64,64),(0,0,0,0)); c.alpha_composite(Image.fromarray(q.astype(np.uint8)),((64-W)//2,64-H-2)); c.save('小滿_64.png')
c.resize((512,512),Image.NEAREST).save('小滿_64_x8.png')
