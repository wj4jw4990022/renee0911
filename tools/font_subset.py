# v17.74：把 jf open 粉圓縮成「遊戲裡用到的字」的子集（完整字型 4.5MB 太大）
# 用法：python3 tools/font_subset.py <jf-openhuninn-2.0.ttf 的路徑>
# 完整字型放在 design-wip 分支 design/fonts/jf-openhuninn-2.0.ttf。改了遊戲文字、出現新字時重跑一次。
import glob, subprocess, sys, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
s = set()
for f in glob.glob(os.path.join(root, 'js', '*.js')) + [os.path.join(root, 'index.html'), os.path.join(root, 'manifest.webmanifest')]:
    s |= set(open(f, encoding='utf-8').read())
s |= set(chr(c) for c in range(0x20, 0x7f))
s |= set('，。、！？：；「」『』（）《》〈〉…—～·・％＋－×÷→←↑↓★☆♪♥❤✓✔✕✗○●◎△▲▽▼□■◆◇０１２３４５６７８９')
tmp = os.path.join(root, 'tools', '_chars.txt')
open(tmp, 'w', encoding='utf-8').write(''.join(sorted(c for c in s if ord(c) >= 0x20)))
subprocess.run(['pyftsubset', sys.argv[1], '--text-file=' + tmp, '--flavor=woff2', '--layout-features=*',
                '--output-file=' + os.path.join(root, 'fonts', 'jf-openhuninn-2.0-sub.woff2')], check=True)
os.remove(tmp); print('ok', len(s), '字')
