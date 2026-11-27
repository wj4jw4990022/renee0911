# 介面圖示輸出（tools/build_art.py 用）：把 style.py 和各面板補的圖示存成 PNG（原尺寸，外框已加）
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from style import ICON
import shop, people, quest, office, settings, heropage, mainscreen   # 各面板 import 時會把自己的圖示補進 ICON
from quest import WI
OUT = sys.argv[1]
ICON.update(shop.ARMOR); ICON['草原'] = WI['bush']; ICON['森林'] = WI['tree']; ICON['荒地'] = WI['cactus']
for k, v in ICON.items(): v.save(os.path.join(OUT, k + '.png'))
