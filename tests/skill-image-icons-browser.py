"""Focused real Chromium mobile rendering; no skill artwork is created here."""
import json
from playwright.sync_api import sync_playwright
from browser_support import launch,ROOT,serve_game
OUT=ROOT/'game/docs/skill-icons-v1/evidence';OUT.mkdir(parents=True,exist_ok=True)
checks=[]
def check(name,ok,data=None):
 checks.append({'name':name,'pass':bool(ok),'data':data})
 assert ok,(name,data)
 print('PASS',name,flush=True)
def capture(p,name):
 file=OUT/name;p.screenshot(path=str(file));check(name+' under 1 MB',file.stat().st_size<1_000_000,{'bytes':file.stat().st_size})
with sync_playwright() as pw,serve_game() as base:
 b=launch(pw);ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=1)
 p=ctx.new_page();errors=[];requests=[]
 p.on('pageerror',lambda e:errors.append(str(e)))
 p.on('request',lambda r:requests.append(r.url))
 p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp')
 check('intro has no skill image requests',not any('skill-icon-' in u or '/skill-icons/v1/' in u for u in requests))
 p.evaluate("()=>{const a=HonroApp,C=HONRO_CORE;a.profile.settings.music=false;a.profile.settings.sound=false;a.updateAudio();a.profile.recruited=['archer','mage','knight','occultist'];for(const cls of a.profile.recruited){a.profile.heroes[cls].xp=C.xpAtLevel(30);for(const t of C.TALENTS.filter(n=>n.cls===cls))a.profile.heroes[cls].ranks[t.id]=1;}a.profile.loadouts.archer=['A01','A14','A09','A99'];a.showCamp('archer')}")
 for width,height in [(360,800),(390,844),(844,390),(1280,900)]:
  p.set_viewport_size({'width':width,'height':height});p.evaluate("HonroApp.showCamp('archer');HonroApp.talent('A09')")
  p.wait_for_selector('.skill-modal-body');p.wait_for_function('HonroApp.preview')
  for ratio in [0,1]:
   p.locator('.skill-modal-body').evaluate('(e,r)=>e.scrollTop=(e.scrollHeight-e.clientHeight)*r',ratio)
   geom=p.evaluate("""()=>{const d=document.querySelector('.talent-dialog'),h=d.querySelector('.skill-detail-controls'),body=d.querySelector('.skill-modal-body'),x=h.querySelector('[data-action=close]'),r=d.getBoundingClientRect(),hr=h.getBoundingClientRect(),br=body.getBoundingClientRect(),xr=x.getBoundingClientRect(),ir=h.querySelector('.skill-art').getBoundingClientRect();return{fit:r.left>=0&&r.right<=innerWidth+.5&&r.top>=0&&r.bottom<=innerHeight+.5,body:br.top>=hr.bottom-.5&&body.clientHeight>100,touch:xr.width>=44&&xr.height>=44,gap:Math.abs(hr.top-r.top-1),icon:[ir.width,ir.height],overflow:h.scrollWidth>h.clientWidth+1}}""")
   check(f'{width} modal scroll {ratio}: frame/header/body/art/touch',all(geom[k] for k in ['fit','body','touch']) and geom['gap']<1 and min(geom['icon'])>=32 and not geom['overflow'],geom)
  old=p.evaluate('HonroApp.profile.heroes.archer.ranks.A09');scroll=p.locator('.skill-modal-body').evaluate('e=>e.scrollTop')
  p.locator('[data-action=train]').tap();check(f'{width} plus retains scroll',p.evaluate('HonroApp.profile.heroes.archer.ranks.A09')==old+1 and abs(p.locator('.skill-modal-body').evaluate('e=>e.scrollTop')-scroll)<2)
  p.locator('[data-action=rank-minus-detail]').tap();check(f'{width} refund',p.evaluate('HonroApp.profile.heroes.archer.ranks.A09')==old)
  capture(p,f'modal-{width}.png');p.locator('.skill-detail-controls [data-action=close]').tap()
  check(f'{width} X closes',not p.locator('#modal').evaluate("e=>e.classList.contains('open')"))
 p.set_viewport_size({'width':390,'height':844});p.evaluate("HonroApp.showCamp('mage');HonroApp.talent('MP05')")
 check('passive icon and DOM passive mark',p.locator('.skill-modal-title .passive-stamp b').inner_text()=='상시' and p.locator('.skill-modal-title [data-skill-icon=MP05]').count()==1)
 capture(p,'passive-390.png');p.evaluate('HonroApp.close()')
 p.evaluate("HonroApp.showCamp('archer')");p.locator('[data-action=slot][data-slot="1"]').tap()
 check('slot library images preserve effects and names',p.locator('.equip-option .skill-art').count()>0 and p.locator('.equip-option small').count()>0)
 capture(p,'slot-library-390.png');p.evaluate('HonroApp.close()')
 # Real training HUD, with four actual equipped IDs; no fake artwork.
 p.evaluate('HonroApp.startTraining()');p.wait_for_selector('.training-dialog');p.evaluate('HonroApp.close()')
 p.evaluate("()=>{const a=HonroApp,u=a.engine.active;u.loadout=['A01','A14','A09','A99'];u.ranks={...u.ranks,A14:1,A09:1,A99:1};a.updateHUD(true)}")
 baseline={}
 for width,height in [(360,800),(390,844),(844,390),(1280,900)]:
  p.set_viewport_size({'width':width,'height':height});p.wait_for_timeout(100)
  geometry=p.evaluate("""()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}},buttons=[...document.querySelectorAll('#combat-skills .skill-button')].map(e=>{const r=e.getBoundingClientRect(),a=e.querySelector('.skill-art')?.getBoundingClientRect(),n=e.querySelector('.skill-name')?.getBoundingClientRect();return {w:r.width,h:r.height,art:a?[a.width,a.height]:[],inside:!a||(a.top>=r.top&&a.bottom<=r.bottom),name:!n||n.bottom<=r.bottom+.5,accessible:!!e.getAttribute('aria-label'),pressed:e.getAttribute('aria-pressed')}});return{buttons,joystick:rect('#joystick'),fire:rect('#fire'),hud:rect('#battle-bottom'),canvas:rect('#battlecanvas')}}""")
  check(f'{width} HUD 32–36px art and >=44px targets',all(min(v['art'])>=32 and max(v['art'])<=36 and v['w']>=44 and v['h']>=44 and v['inside'] and v['name'] and v['accessible'] for v in geometry['buttons']),geometry)
  # Removing the new stylesheet must leave map/HUD/control geometry identical.
  styles=p.locator('link[href*="game-src-skill-icons"]');styles.evaluate_all('els=>els.forEach(e=>e.disabled=true)')
  original=p.evaluate("""()=>Object.fromEntries(['#joystick','#fire','#battle-bottom','#battlecanvas'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return[s,[r.x,r.y,r.width,r.height]]}))""")
  styles.evaluate_all('els=>els.forEach(e=>e.disabled=false)')
  for selector,key in [('#joystick','joystick'),('#fire','fire'),('#battle-bottom','hud'),('#battlecanvas','canvas')]:
   check(f'{width} {key} bounds unchanged',all(abs(a-b)<.5 for a,b in zip(original[selector],[geometry[key][k] for k in ['x','y','w','h']])),original[selector])
  capture(p,f'hud-{width}.png');baseline[str(width)]=geometry
 # A transport-only fixture reuses an existing repository WebP. It is never
 # saved as a skill icon, never in the manifest, and never an art approval.
 existing=next((ROOT/'shared/assets').rglob('*.webp')).read_bytes();hits=[]
 def transport(route):
  hits.append(route.request.url)
  route.fulfill(status=404,body='missing') if 'broken' in route.request.url else route.fulfill(status=200,content_type='image/webp',body=existing)
 p.route('**/__skill_transport__/*.webp',transport)
 p.evaluate("""()=>{const m=HONRO_SKILL_ICON_MANIFEST;for(const id of ['A01','A14','A09'])m.icons[id]={status:'ready',url:location.origin+'/__skill_transport__/'+(id==='A09'?'broken':id)+'.webp'};const d=document.createElement('div');d.id='offscreen-skill-test';d.style.cssText='position:fixed;left:0;top:3000px';d.innerHTML=HONRO_CORE.icon('skill:A14');document.body.append(d);HonroApp.updateHUD(true)}""")
 p.wait_for_function("document.querySelector('#combat-skills [data-skill-icon=A01]').dataset.imageState==='ready'")
 p.wait_for_function("document.querySelector('#combat-skills [data-skill-icon=A09]').dataset.imageState==='error'")
 check('decoded image succeeds; missing image retains visible vector',p.locator('#combat-skills [data-skill-icon=A01] img').is_visible() and p.locator('#combat-skills [data-skill-icon=A09] svg').is_visible())
 before=len(hits);p.evaluate('HonroApp.updateHUD(true)');p.wait_for_timeout(150)
 check('same URLs decode once across rerenders; failure not retried',len(hits)==before,{'requests':hits,'status':p.evaluate('HonroSkillImages.status()')})
 check('offscreen art does not load by visibility',p.locator('#offscreen-skill-test .skill-art').get_attribute('data-image-state')=='observed')
 p.evaluate("document.querySelector('#offscreen-skill-test').remove()")
 check('no browser exceptions',not errors,errors)
 (OUT/'browser-checks.json').write_text(json.dumps({'browser':b.version,'mobile':True,'touch':True,'dpr':1,'checks':checks,'hudGeometry':baseline,'limitations':'Chromium mobile emulation; no physical handset or Safari. Transport fixture reuses existing WebP and is not skill artwork.'},ensure_ascii=False,indent=2)+'\n')
 b.close()
