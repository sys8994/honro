from pathlib import Path
import sys, shutil
from playwright.sync_api import sync_playwright
root=Path(__file__).parent.resolve(); rev=sys.argv[1]
out=root/'reviews'/f'round-{rev}'; out.mkdir(exist_ok=True)
for f in [*root.glob('*.svg'),root/'review.html']: shutil.copy(f,out/f.name)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium')
 page=b.new_page(viewport={'width':1150,'height':1700},device_scale_factor=1)
 page.goto(f'http://127.0.0.1:8732/reviews/round-{rev}/review.html'); page.wait_for_function('Array.from(document.images).every(i=>i.complete && i.naturalWidth)')
 page.screenshot(path=str(out/'normal-and-30pct.png'),full_page=True)
 for i,name in enumerate(['shelf','shoulder','fan']):
  row=page.locator('.row').nth(i)
  row.locator('.panel').nth(0).screenshot(path=str(out/f'{name}-normal.png'))
  row.locator('.panel').nth(1).screenshot(path=str(out/f'{name}-30pct.png'))
 page.set_viewport_size({'width':1940,'height':850})
 page.goto('http://127.0.0.1:8732/assembly.html')
 page.wait_for_function('Array.from(document.images).every(i=>i.complete && i.naturalWidth)')
 page.screenshot(path=str(out/'assembly-normal-and-30pct.png'),full_page=True)
 page.locator('body > .frame').screenshot(path=str(out/'assembly-normal.png'))
 page.locator('.small').screenshot(path=str(out/'assembly-30pct.png'))
 shutil.copy(root/'assembly.html',out/'assembly.html')
 b.close()
