"""Compact Stage22 HUD: prepared round11 comparison saves; normal App.frame/rAF, 360/390 touch Chromium."""
import copy,json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
OUT=ROOT/'_local/reports/stage22-hold-20261024';saved=json.loads((OUT/'blocked-profile.json').read_text());rows=[];errors=[]
with serve_game() as base,sync_playwright() as pw:
 browser=launch(pw)
 for width in (360,390):
  for mode in ('blocked','defense-1'):
   profile=copy.deepcopy(saved);battle=profile['honroBattle']
   if mode=='defense-1':
    at=next(m for m in battle['honroMarkers'] if m['id']=='compare-ledgers')
    for i,uid in enumerate(('p-occultist','p-archer')):
     u=next(u for u in battle['units'] if u['id']==uid);u.update(x=at['x']-60+i*120,y=at['y'])
    battle['honroState']['act3']['holds']['compare-ledgers'].update(progress=1,spawned=2)
   context=browser.new_context(viewport={'width':width,'height':844},is_mobile=True,has_touch=True);page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
   page.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');')
   page.goto(base+'/HONRO.html');page.wait_for_function('document.documentElement.dataset.honroReady',timeout=90000);page.locator('[data-action=continue]').tap();page.wait_for_function('HonroApp.engine?.b.honroStage===22&&HonroApp.canInput()&&!HonroApp.turnNotice',timeout=90000)
   page.evaluate('''()=>{__hudDraws=0;const s=HonroApp.scene,render=s.render.bind(s);s.render=(...args)=>{__hudDraws++;return render(...args)};Object.assign(s,{x:2475,y:1020,scale:.65,manual:true})}''')
   page.wait_for_function('window.__hudDraws>=60',timeout=15000)
   measure=page.evaluate('''()=>{const e=document.getElementById('objective-text'),s=getComputedStyle(e),r=document.createRange();r.selectNodeContents(e);return{text:e.textContent,textWidth:r.getBoundingClientRect().width,containerWidth:e.getBoundingClientRect().width,clientWidth:e.clientWidth,scrollWidth:e.scrollWidth,font:s.font,overflow:s.overflow,textOverflow:s.textOverflow,whiteSpace:s.whiteSpace,parentWidth:e.parentElement.getBoundingClientRect().width,parentText:e.parentElement.textContent,draws:__hudDraws,lastError:HonroApp.lastError||null,pairReady:HonroEvidenceQuests.pairReady(HonroApp.engine.b),hold:structuredClone(HonroApp.engine.b.honroState.act3.holds['compare-ledgers'])}}''')
   assert measure['text']==('소단·설오를 모으세요' if mode=='blocked' else '수비 1/2'),measure
   assert measure['textWidth']<=measure['clientWidth']+.5 and measure['scrollWidth']<=measure['clientWidth'],measure
   assert not measure['lastError'],measure
   name=f'compact-{width}-{mode}.jpg';page.screenshot(path=str(OUT/name),type='jpeg',quality=85,scale='css');rows.append(dict(width=width,mode=mode,screenshot=name,**measure));print(json.dumps(rows[-1],ensure_ascii=False),flush=True);context.close()
 assert not errors,errors
 (OUT/'hud-width.json').write_text(json.dumps(dict(entry=json.loads((ROOT/'web/manifest.json').read_text())['gameEntry'],rows=rows,errors=errors,scope=__doc__+' Defense1/2 is an initial saved fixture, not newly earned progress. Camera prepared for comparison view. Earlier actual two enemy-end/Continue/clear/23 input proof retained from32d92f6b.'),ensure_ascii=False,indent=2));browser.close()
print('PASS compact Stage22 HUD true text bounds at360/390 and normal frame draws')
