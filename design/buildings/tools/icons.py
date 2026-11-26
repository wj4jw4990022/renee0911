# 招牌小圖示（畫在牆面局部座標上，v 往上）
ICONS={
'mug':["..... ",".aaa.",".aaab",".aaab",".aaa.",".www."],
'swords':["w...w",".w.w.","..w..",".w.w.","y...y"],
'cross':["..y..",".yyy.","..y..","..y.."],
'potion':["..k..",".ppp.","ppppp","ppppp",".ppp."],
'anvil':["kkkk.",".kkkk","..kk.",".kkkk"],
'bed':["w....","wpppp","wwwww","k...k"],
'coin':[".yyy.","yyoyy","yoyyy","yyoyy",".yyy."],
'horse':["...kk","kkkk.","kkkk.","k..k."],
'heart':[".r.r.","rrrrr",".rrr.","..r.."],
'moon':[".pp..","p....","p....",".pp.."],
'star':["..y..","yyyyy",".yyy.",".y.y."],
'shield':["bbbbb","bwbwb","bbbbb",".bbb.","..b.."],
}
CM={'a':'au','b':'bl','w':'wh','y':'au','k':'bk','p':'r','r':'r','o':'ad'}
def icon(s,face,u,v,name,cm=None):
    m=ICONS[name]; h=len(m); cmap=dict(CM); cmap.update(cm or {})
    for j,row in enumerate(m):
        for i,ch in enumerate(row):
            if ch in cmap: s.fset(face,u+i,v+h-1-j,cmap[ch])
