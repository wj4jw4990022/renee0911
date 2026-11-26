# 11×9 的小臉圖示（泡泡跟著放大），讓表情在手機上看得清楚
import sys; sys.path.insert(0, '/home/claude/tools')
from emote_opts import show, C
BASE = ["...KKKKK...","..KFFFFFK..",".KFFFFFFFK.","KFFFFFFFFFK","KFFFFFFFFFK","KFFFFFFFFFK",".KFFFFFFFK.","..KFFFFFK..","...KKKKK..."]
def face(marks, shift=0, extra=None):
    g = [list(r) for r in BASE]
    if shift: g = [list(('.' * shift + ''.join(r))[:11]) for r in g]
    for (x, y), ch in marks.items(): g[y][x + shift] = ch
    if extra:
        for (x, y), ch in extra.items(): g[y][x] = ch
    return [''.join(r) for r in g]
eyes = {(3,3):'K',(3,4):'K',(7,3):'K',(7,4):'K'}
SHY = face({**eyes, (2,5):'p',(3,5):'p',(7,5):'p',(8,5):'p', (5,6):'K'})
SAD = face({(3,3):'K',(7,3):'K',(2,2):'K',(8,2):'K', (3,4):'B',(3,5):'B',(3,6):'B',(7,4):'B',(7,5):'B',(7,6):'B', (4,6):'K',(5,6):'K',(6,6):'K',(4,5):'.' if False else 'F'})
SWEAT = {(9,0):'B',(9,1):'B',(10,1):'B',(8,2):'B',(9,2):'W',(10,2):'B',(9,3):'b'}
NA = face({**eyes, (4,6):'K',(5,6):'K',(6,6):'K'}, extra=SWEAT)
NB = face({**eyes, (3,6):'K',(4,5):'K',(5,6):'K',(6,5):'K',(7,6):'K'}, extra=SWEAT)
ND = face({(2,3):'W',(3,3):'K',(2,4):'W',(3,4):'W',(6,3):'W',(7,3):'K',(6,4):'W',(7,4):'W',(4,6):'K',(5,6):'K',(6,6):'K'}, extra=SWEAT)
NE = face({(2,3):'K',(3,4):'K',(4,3):'K',(6,3):'K',(7,4):'K',(8,3):'K',(4,6):'K',(5,6):'K',(6,6):'K'}, extra=SWEAT)   # >< 眼
if __name__ == '__main__':
    show([('害羞 A2', SHY), ('難過 B', SAD)], '/home/claude/gy/face11_done.png')
    show([('A 冷汗', NA), ('B 波浪嘴＋汗', NB), ('C 瞪眼＋汗', ND), ('D ＞＜眼＋汗', NE)], '/home/claude/gy/opt_nerv2.png')
NERV = NB
SIGH = {(8,5):'D',(9,5):'D',(9,6):'D',(10,6):'D',(10,5):'D',(9,4):'d',(10,4):'d',(10,7):'d',(9,7):'d'}
TA = face({(2,4):'K',(3,4):'K',(4,4):'K',(6,4):'K',(7,4):'K',(8,4):'K',(4,6):'K',(5,6):'K',(6,6):'K'})                                  # ＝＝眼
TB = face({(2,4):'K',(3,4):'K',(4,4):'K',(6,4):'K',(7,4):'K',(8,4):'K',(5,6):'K',(5,7):'K'}, extra=SIGH)                               # ＝＝眼＋嘆氣
TC = face({(3,3):'K',(7,3):'K',(2,4):'d',(3,4):'d',(4,4):'d',(6,4):'d',(7,4):'d',(8,4):'d',(4,6):'K',(5,6):'K',(6,6):'K'})              # 黑眼圈
TD = face({(2,4):'K',(3,4):'K',(4,4):'K',(6,4):'K',(7,4):'K',(8,4):'K',(4,6):'K',(5,6):'K',(6,6):'K'}, extra={(8,0):'D',(9,0):'D',(10,1):'D',(9,2):'D',(8,1):'D'})   # 頭頂漩渦
if __name__ == '__main__':
    show([('A ＝＝眼', TA), ('B ＝＝眼＋嘆氣', TB), ('C 黑眼圈', TC), ('D ＝＝眼＋漩渦', TD)], '/home/claude/gy/opt_tired.png')
TIRED_A = ["B.........B",".B...B...B.","BB..BB...BB","BW..BBB..BB","bB.BBWBB.Bb","...BBBBB...","...BbbbB...","....bbb....","..........."]   # 三滴汗往外噴
TIRED_B = ["....B......","...BB...D..","..BBBB..DD.",".BBBBBB....",".BBWBBB.DD.",".BBBBBB..D.",".BBBBbB....","..BbbB.....","..........."]  # 一大滴＋喘氣線
TIRED_C = ["...B...B...","..BB..BB...",".BBBB.BBB..",".BWBB.BWB..",".BBBB.Bbb..","..bb...b...","D..D..D..D.",".D..D..D..D","..........."]  # 兩滴＋熱氣
if __name__ == '__main__':
    show([('A 三滴汗噴出', TIRED_A), ('B 大汗滴＋喘氣', TIRED_B), ('C 汗滴＋熱氣', TIRED_C)], '/home/claude/gy/opt_tired2.png')
OUCH_A = face({(2,3):'K',(3,4):'K',(4,3):'K',(6,3):'K',(7,4):'K',(8,3):'K',(4,6):'K',(5,6):'K',(6,6):'K',(4,7):'K',(6,7):'K'},
              extra={(4,0):'R',(5,0):'R',(6,0):'R',(4,1):'R',(5,1):'P',(6,1):'R'})                               # ＞＜眼＋頭上腫包
OUCH_B = ["....Y......","Y...Y...Y..",".Y.YRY.Y...","..YRRRY....","YYRRWRRYY..","..YRRRY....",".Y.YRY.Y...","Y...Y...Y..","....Y......"]   # 紅黃衝擊星
OUCH_C = [".......KKK.","......KFfFK",".....KFfFFK","....KfOOOK.","...KFOOOfK.","..KFOOOFK..",".KFFfFK....","KFfFFK.....",".KKKK......"]   # OK 繃
OUCH_D = face({(2,3):'K',(3,4):'K',(4,3):'K',(6,3):'K',(7,4):'K',(8,3):'K',(4,6):'K',(5,6):'K',(6,6):'K',(2,5):'B',(8,5):'B'},
              extra={(9,0):'Y',(10,1):'Y',(8,1):'Y',(9,2):'Y'})                                                    # ＞＜眼＋淚＋小星
if __name__ == '__main__':
    show([('A ＞＜眼＋腫包', OUCH_A), ('B 衝擊星', OUCH_B), ('C OK繃', OUCH_C), ('D ＞＜眼＋淚＋星', OUCH_D)], '/home/claude/gy/opt_ouch.png')
