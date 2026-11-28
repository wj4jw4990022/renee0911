import sys
from PIL import Image
import numpy as np
a=np.array(Image.open(sys.argv[1]).convert('RGBA')).astype(int)
x0,x1,y0,y1=202,1034,119,1169
N=int(sys.argv[2]); cell=(y1-y0)/N
W=int(round((x1-x0)/cell)); out=np.zeros((N,W,4),np.uint8)
for j in range(N):
  for i in range(W):
    blk=a[int(y0+j*cell+cell*.25):int(y0+(j+1)*cell-cell*.25), int(x0+i*cell+cell*.25):int(x0+(i+1)*cell-cell*.25)].reshape(-1,4)
    if (blk[:,3]>128).mean()<.5: continue
    blk=blk[blk[:,3]>128][:,:3]
    out[j,i,:3]=np.median(blk,0); out[j,i,3]=255
im=Image.fromarray(out); im.save(sys.argv[3]); im.resize((W*10,N*10),Image.NEAREST).save(sys.argv[3].replace('.png','_x10.png'))
print(W,N)
