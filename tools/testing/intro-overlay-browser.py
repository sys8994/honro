"""Focused title overlay and settings regression; local Chromium screenshots."""
import json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch
from story_browser_server import story_base_url
from playwright.sync_api import sync_playwright
OUT=ROOT/'game/docs/evidence/intro-bar-bgm-2026-10-21';OUT.mkdir(parents=True,exist_ok=True);rows=[]
with sync_playwright() as p:
 browser=launch(p)
 for width,height,safe in [(390,844,False),(1280,800,False),(844,390,False),(320,568,False),(390,844,True)]:
  context=browser.new_context(viewport={'width':width,'height':height},is_mobile=width<900,has_touch=width<900);page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  if safe:context.new_cdp_session(page).send('Emulation.setSafeAreaInsetsOverride',{'insets':{'top':44,'left':0,'right':0,'bottom':34}})
  page.goto(story_base_url()+'/HONRO.html');page.wait_for_function('document.documentElement.dataset.honroReady');page.wait_for_function("[...document.querySelectorAll('.title-painting img,.honro-logo')].every(i=>i.complete&&i.naturalWidth)")
  result=page.evaluate('''()=>{const h=document.querySelector('.honro-title>.top'),b=h.querySelector('button'),p=document.querySelector('.title-bg'),s=getComputedStyle(h),r=b.getBoundingClientRect(),a=p.getBoundingClientRect();return {position:s.position,background:s.backgroundColor,border:s.borderBottomWidth,button:{x:r.x,y:r.y,w:r.width,h:r.height},art:{top:a.top,left:a.left,width:a.width,height:a.height},label:b.getAttribute('aria-label'),workshop:document.querySelectorAll('[data-action="import-map"]').length}}''')
  assert result['position']=='absolute' and result['background']=='rgba(0, 0, 0, 0)' and result['border']=='0px',result
  assert result['button']['w']>=44 and result['button']['h']>=44 and result['label']=='설정'
  assert result['art']['top']==0 and result['art']['height']==height and result['workshop']==0
  if safe:assert result['button']['y']>=44,result
  page.screenshot(path=str(OUT/f'intro-{width}x{height}{"-safe-area" if safe else ""}.png'))
  button=page.get_by_role('button',name='설정',exact=True);button.click();page.locator('#modal.open input#setting-music').wait_for();page.locator('#modal.open button.close').click();button.focus();page.keyboard.press('Enter');page.locator('#modal.open input#setting-music').wait_for();page.locator('#modal.open button.close').click()
  page.locator('.title-actions button.primary').click();page.wait_for_function("HonroApp.screen==='rest'");assert page.locator('.rest-screen>.top').evaluate('(el)=>getComputedStyle(el).position')=='relative'
  assert not errors,errors;result.update(width=width,height=height,safeAreaOverride=safe,settingsMouseAndKeyboard=True,restHeaderPreserved=True);rows.append(result);context.close()
 browser.close()
(OUT/'intro-checks.json').write_text(json.dumps(rows,indent=2));print(json.dumps(rows))
