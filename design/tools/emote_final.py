# 目前定案的表情泡泡（2026-11-26）：輸出每個表情的 PNG 和一張總表
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from emote import bubble, I
from face11 import SHY, SAD, NB
from bandage import WIDE2
from PIL import Image, ImageDraw, ImageFont
FINAL = dict(I)
from tired_anim import grid, drop
FINAL.update({'害羞': SHY, '難過': SAD, '緊張': NB, '好痛': WIDE2, '累': grid(drop(5, 1, True))})
STATUS = {'害羞':'定案 A2','難過':'定案 B','緊張':'定案 B','累':'定案（動畫）','好痛':'照片款 OK 繃（待確認）',
          '認真':'待改','沮喪':'待改','喝醉':'待改','想要錢':'待改（想放圖示）'}
if __name__ == '__main__':
    out = sys.argv[1]; os.makedirs(out, exist_ok=True)
    font = ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc', 18)
    names = list(FINAL.keys()); cols = 6; S = 5; cw, ch = 40, 30
    sheet = Image.new('RGB', (cols * cw * S, ((len(names) + cols - 1) // cols) * (ch * S + 50)), (156, 196, 236)); d = ImageDraw.Draw(sheet)
    for k, n in enumerate(names):
        b = bubble(FINAL[n]); b.save(os.path.join(out, f'emote_{n}.png'))
        x, y = (k % cols) * cw * S, (k // cols) * (ch * S + 50)
        big = b.resize((b.width * S, b.height * S), Image.NEAREST); sheet.paste(big, (x + 10, y + 6), big)
        d.text((x + 10, y + ch * S - 8), n, fill=(40, 24, 16), font=font)
        d.text((x + 10, y + ch * S + 14), STATUS.get(n, '通過'), fill=(90, 60, 40), font=font)
    sheet.save(os.path.join(out, '_表情總表.png')); print(len(names))
