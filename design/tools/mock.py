import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        for port,out in [(8768,'mock_new')]:
            ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2)
            pg = await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(f'http://localhost:{port}/'); await pg.wait_for_timeout(2500)
            await pg.evaluate("say('今天天氣不錯，去草原走走吧'); fxPop('+45 金','gold')"); await pg.wait_for_timeout(500)
            await pg.screenshot(path=f'/home/claude/gy/{out}.png'); print(out, errs or 'ok'); await ctx.close()
        await b.close()
asyncio.run(main())
