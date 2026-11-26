import asyncio
from playwright.async_api import async_playwright
TOP = """() => { const im = s => `<img class="pxi" src="img/icon/${s}.png" alt="">`;
  const m = document.querySelector('.rbar .coin.money'); if (m) { const s = m.querySelector(':scope > svg'); if (s) s.outerHTML = im('coin'); const f = m.querySelector('.fame svg'); if (f) f.outerHTML = im('star').replace('pxi"', 'pxi" style="width:16px;height:16px"'); } }"""
GEAR = """() => {
  const h = H(), WT = { warrior:'sword', archer:'bow', mage:'staff', thief:'dagger' }[h.cls], eq = (k, t, z = 32) => `<img class="pxi" src="img/eq/${k}${t}.png" style="width:${z}px;height:${z}px" alt="">`;
  document.querySelectorAll('#shS [data-s=\"caravan\"]').forEach(b => { if (!(S.mt && S.mt.caravan)) b.classList.add('off'); });
  const sk = document.querySelector('#shB .shopk'); if (sk) { const sm = npc('chen'); const line = (sk.querySelectorAll('div[style*=\"font-size:12px\"]')[0] || {}).textContent || '';
    const m = line.match(/今天的報價([^（]*)(（.*）)?/); sk.outerHTML = `<div class="smith1"><span class="sav">${pimg(sm)}</span><span><b>鐵匠${sm.name}</b>：今天的報價${m ? m[1] : '照常'}<span class="k">${m && m[2] ? ' ' + m[2] : ''}</span></span></div>`; }
  const cards = document.querySelectorAll('#shB .upc');
  cards.forEach((c, i) => { c.classList.remove('rec'); const kind = i === 0 ? WT : 'armor', cur = i === 0 ? h.wpn : h.arm;
    const ics = c.querySelectorAll('.ub .ic'); if (ics[0]) ics[0].innerHTML = eq(kind, cur); if (ics[1]) ics[1].innerHTML = eq(kind, Math.min(3, cur + 1));
    c.querySelectorAll('.tds .td').forEach((d, t) => d.innerHTML = eq(kind, t, 16)); });
}"""
CARE = """() => { const g = document.querySelector('#shB .svgrid'); if (g) g.classList.add('care'); }"""
async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2)
        pg = await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8771/'); await pg.wait_for_timeout(2500)
        await pg.evaluate("SUBS.gear = [['gear','裝備'],['care','照顧'],['caravan','商隊']]")
        await pg.evaluate(TOP)
        await pg.evaluate("answer(0); S.paused = true; const h = H(); h.wallet = 52; ev('good', '自己買', `${h.name}用自己的錢買了一瓶藥水（錢包 -30 金）`); renderAll()")
        await pg.wait_for_timeout(500); await pg.evaluate(TOP); await pg.screenshot(path='/home/claude/gy/w4_main.png')
        await pg.evaluate("openSheet('gear','gear')"); await pg.wait_for_timeout(400); await pg.evaluate(GEAR); await pg.wait_for_timeout(300)
        await pg.screenshot(path='/home/claude/gy/w4_gear.png')
        await pg.evaluate("openSheet('gear','care')"); await pg.wait_for_timeout(400); await pg.evaluate(GEAR); await pg.evaluate(CARE); await pg.wait_for_timeout(300)
        await pg.screenshot(path='/home/claude/gy/w4_care.png')
        await pg.evaluate("closeSheet(); openSheet('hero','life')"); await pg.wait_for_timeout(400)
        await pg.evaluate("""() => { const h = H(), nm = document.querySelector('#shB .pinfo .nm'); if (nm) { nm.style.display = 'flex'; nm.style.alignItems = 'center'; nm.insertAdjacentHTML('beforeend', `<span class="walletR"><img class="pxi" src="img/icon/coin.png" style="width:16px;height:16px" alt="">${h.wallet} 金</span>`); }
          const tabs = document.querySelector('#shB .ff2'); if (tabs) { tabs.insertAdjacentHTML('beforeend', '<button class="on">他自己買的</button>'); tabs.querySelectorAll('button').forEach((b, i, a) => b.classList.toggle('on', i === a.length - 1)); }
          const after = tabs ? tabs.nextElementSibling : null; const html = `<div class="k" style="font-size:12px;margin:4px 0 8px">${h.name}會用自己的錢買裝備、藥水、看病、進修，買多少看人生目標。</div><div class="card"><div class="kv"><span>一瓶藥水（-30 金）</span><span class="k">1 年 1 月</span></div></div>`;
          if (tabs) { let n = tabs.nextElementSibling; while (n) { const x = n.nextElementSibling; n.remove(); n = x; } tabs.insertAdjacentHTML('afterend', html); } }""")
        await pg.wait_for_timeout(300); await pg.screenshot(path='/home/claude/gy/w4_hero.png')
        print(errs or 'ok'); await b.close()
asyncio.run(main())
