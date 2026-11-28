# 從遊戲裡拿幾位勇者現在的樣子（kenCanvas 站姿），存成 16x16 PNG
import base64, sys
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--allow-file-access-from-files'])
    pg = b.new_page(viewport={'width':393,'height':852})
    pg.goto('file:///home/claude/renee0911/index.html'); pg.wait_for_timeout(2500)
    try: pg.click('[data-a="1"]', timeout=3000)
    except Exception: pass
    pg.wait_for_timeout(800)
    js = """() => { const out=[]; const hs=[H()].concat(["warrior","archer","thief","mage"].map(c=>{const x=newHero({gen:1}); x.cls=c; return x;}));
      hs.forEach(h=>{ const c=kenCanvas(h,'stand',0); const t=document.createElement('canvas'); t.width=KEN_W; t.height=KEN_H; t.getContext('2d').drawImage(c,0,0);
        out.push({n:h.name, cls:h.cls, w:KEN_W, h:KEN_H, ox:KEN_OX, oy:KEN_OY, url:t.toDataURL()}); }); return out; }"""
    r = pg.evaluate(js)
    for i, o in enumerate(r):
        open(f'/home/claude/fpwork/hero{i}.png','wb').write(base64.b64decode(o['url'].split(',')[1])); print(i, o['n'], o['cls'], o['w'], o['h'], o['ox'], o['oy'])
    b.close()
