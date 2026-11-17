import os,json,asyncio
from pathlib import Path
from playwright.async_api import async_playwright
async def main():
 out=Path(os.environ['OUT']); rows=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch()
  context=await browser.new_context(viewport={'width':1440,'height':900})
  for name in ['HONRO.html','HONRO_WORKSHOP.html']:
   page=await context.new_page(); errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
   response=await page.goto('http://127.0.0.1:8870/'+name,wait_until='domcontentloaded')
   assert response.status==200
   await page.wait_for_function("globalThis.HONRO_READY !== undefined",timeout=120000)
   await page.evaluate("async()=>{await globalThis.HONRO_READY;return true}")
   await page.screenshot(path=str(out/(name+'.png')))
   assert not errors,errors
   rows.append({'entry':name,'ready':True,'errors':errors,'url':page.url})
   await page.close()
  await browser.close()
 (out/'boot.json').write_text(json.dumps({'scope':'Fresh independent generated Game/Workshop boot only, no user storage or battle','rows':rows},indent=2))
asyncio.run(main())
