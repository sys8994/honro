"""Actual built Chromium UI; controlled production training arenas, no compositing."""
import ast,json,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import launch,ROOT,serve_game
OUT=ROOT/'game/docs/skill-icons-v1/integration/evidence';OUT.mkdir(parents=True,exist_ok=True)
constants={}
for n in ast.parse((ROOT/'tests/cheonroe-target-lightning-browser.py').read_text()).body:
 if isinstance(n,ast.Assign) and isinstance(n.targets[0],ast.Name) and n.targets[0].id in ['SETUP','SNAP']: constants[n.targets[0].id]=ast.literal_eval(n.value)
rows=[];errors=[];network=[]
def shot(p,name):
 p.wait_for_timeout(120)
 p.screenshot(path=str(OUT/(name+'.jpg')),type='jpeg',quality=85)
 assert (OUT/(name+'.jpg')).stat().st_size<1000000

def settle(p):
 p.wait_for_function("HonroSkillImages.status().active===0&&HonroSkillImages.status().queued===0")
 p.wait_for_timeout(100)

def net(p,label):
 settle(p)
 resources=p.evaluate("performance.getEntriesByType('resource').filter(e=>/skill-icon-.*webp|skill-icons\\/v1\\/.*webp/.test(e.name)).map(e=>({url:e.name,body:e.encodedBodySize,transfer:e.transferSize}))")
 row={'phase':label,'requests':len(network),'payloadBytes':sum(r['body'] for r in resources),'transferBytes':sum(r['transfer'] for r in resources),'urls':list(network)};rows.append(row);return row
with sync_playwright() as pw,serve_game() as base:
 b=launch(pw);p=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=1)
 p.add_init_script("(()=>{const decode=HTMLImageElement.prototype.decode;window.skillDecode={active:0,max:0,total:0};HTMLImageElement.prototype.decode=async function(){const s=window.skillDecode;s.active++;s.total++;s.max=Math.max(s.max,s.active);try{return await decode.call(this)}finally{s.active--}}})()")
 p.on('pageerror',lambda e:errors.append(str(e)))
 p.on('request',lambda r:network.append(r.url) if 'skill-icon-' in r.url and '.webp' in r.url else None)
 p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp');net(p,'intro');assert len(network)==0
 p.evaluate("()=>{const a=HonroApp,C=HONRO_CORE;a.profile.settings.music=false;a.profile.settings.sound=false;a.updateAudio();a.profile.recruited=['archer','knight','mage','occultist'];for(const cls of a.profile.recruited){a.profile.heroes[cls].xp=C.xpAtLevel(30);for(const t of C.TALENTS.filter(n=>n.cls===cls))a.profile.heroes[cls].ranks[t.id]=1;}a.showCamp('archer')}")
 first=net(p,'first archer visible');assert first['requests']<84
 shot(p,'camp-archer-visible')
 # Every current skill is inspected on its real detail surface, plus all class trees.
 inventory=json.loads((ROOT/'game/docs/skill-icons-v1/inventory.json').read_text());checked=[]
 for cls in ['archer','knight','mage','occultist']:
  p.evaluate('(cls)=>HonroApp.showCamp(cls)',cls);settle(p);shot(p,'camp-'+cls)
  for sk in [s for s in inventory['skills'] if s['classId']==cls]:
   p.evaluate('(id)=>HonroApp.talent(id)',sk['id'])
   p.wait_for_function("id=>document.querySelector('.skill-modal-title [data-skill-icon='+id+']')?.dataset.imageState==='ready'",arg=sk['id'])
   assert p.locator('.skill-modal-title [data-skill-icon] img').is_visible()
   checked.append(sk['id'])
   # Save actual modal evidence for all 84 to allow parent pixel review.
   shot(p,'detail-'+sk['id'])
   p.evaluate('HonroApp.close()')
  p.set_viewport_size({'width':1280,'height':900});p.evaluate('(cls)=>HonroApp.showCamp(cls)',cls);p.locator('.tree-grid').evaluate('e=>e.scrollIntoView(true)');settle(p);shot(p,'tree-'+cls)
  p.locator('.passive-summary').evaluate('e=>e.scrollIntoView(true)');settle(p);shot(p,'passives-'+cls)
  p.set_viewport_size({'width':390,'height':844})
  p.evaluate('(cls)=>{HonroApp.showCamp(cls);HonroApp.talent(HONRO_CORE.baseSkill(cls))}',cls);settle(p);shot(p,'basic-'+cls);p.evaluate('HonroApp.close()')
 assert len(set(checked))==84
 net(p,'all 84 detail surfaces')
 # Four required sizes: fixed top controls, scrolling, plus/refund, X and unchanged controls.
 geometry=[]
 for w,h in [(360,800),(390,844),(844,390),(1280,900)]:
  p.set_viewport_size({'width':w,'height':h});p.evaluate("HonroApp.showCamp('archer');HonroApp.talent('A14')");settle(p)
  for ratio in [0,1]:
   p.locator('.skill-modal-body').evaluate('(e,r)=>e.scrollTop=(e.scrollHeight-e.clientHeight)*r',ratio)
   g=p.evaluate("()=>{const d=document.querySelector('.talent-dialog'),c=d.querySelector('.skill-detail-controls'),x=c.querySelector('[data-action=close]'),r=d.getBoundingClientRect(),cr=c.getBoundingClientRect(),xr=x.getBoundingClientRect();return {fit:r.left>=0&&r.right<=innerWidth+.5&&r.top>=0&&r.bottom<=innerHeight+.5,header:Math.abs(cr.top-r.top-1)<1,touch:xr.width>=44&&xr.height>=44,overflow:c.scrollWidth>c.clientWidth+1}}")
   assert g['fit'] and g['header'] and g['touch'] and not g['overflow'],g
   geometry.append({'size':[w,h],'scroll':ratio,**g})
  old=p.evaluate('HonroApp.profile.heroes.archer.ranks.A14');scroll=p.locator('.skill-modal-body').evaluate('e=>e.scrollTop')
  p.locator('[data-action=train]').tap();assert p.evaluate('HonroApp.profile.heroes.archer.ranks.A14')==old+1
  assert abs(p.locator('.skill-modal-body').evaluate('e=>e.scrollTop')-scroll)<2
  p.locator('[data-action=rank-minus-detail]').tap();assert p.evaluate('HonroApp.profile.heroes.archer.ranks.A14')==old
  shot(p,'modal-'+str(w));p.locator('.skill-detail-controls [data-action=close]').tap();assert not p.locator('#modal').evaluate("e=>e.classList.contains('open')")
 p.set_viewport_size({'width':360,'height':800})
 p.evaluate("()=>{const a=HonroApp,h=a.profile.heroes.archer;h.xp=0;h.ranks.A08=0;a.showCamp('archer');a.talent('A08')}");settle(p);assert p.locator('[data-action=train]').is_disabled();shot(p,'locked-A08');p.evaluate('HonroApp.close()');p.evaluate("HonroApp.branch=2;HonroApp.showCamp('archer')");p.locator('.tree-node[data-talent=A08]').scroll_into_view_if_needed();settle(p);shot(p,'locked-tree-A08')
 p.evaluate("()=>{const a=HonroApp,C=HONRO_CORE,h=a.profile.heroes.archer;h.xp=C.xpAtLevel(30);h.ranks.A09=2;h.statTraining=0;h.statTraining=C.pointsEarned(h)-C.pointsSpent(h,'archer');a.talent('A09')}");settle(p)
 assert p.locator('[data-action=train]').is_disabled() and not p.locator('[data-action=rank-minus-detail]').is_disabled();shot(p,'sp0-A09');p.evaluate('HonroApp.close()')
 p.evaluate("HonroApp.showCamp('archer')");p.locator('[data-action=slot][data-slot="1"]').tap();settle(p);shot(p,'slot-library');p.evaluate('HonroApp.close()')
 # Training HUD with actual weak/detail-sensitive art; cooldown and focus use real engine.
 p.evaluate('HonroApp.startTraining()');p.wait_for_selector('.training-dialog');p.evaluate('HonroApp.close()')
 hud=[]
 for cls,ids in [('archer',['A01','A08','A14','A09']),('knight',['S00','S11','S13','S03']),('occultist',['O01','O14','O13','O16']),('mage',['M01','M05','M04','M14'])]:
  for w,h in [(360,800),(390,844),(844,390),(1280,900)]:
   p.set_viewport_size({'width':w,'height':h})
   p.evaluate("opts=>{const a=HonroApp,u=a.engine.active;u.cls=opts.cls;u.loadout=opts.ids;u.ranks=Object.fromEntries(opts.ids.map(id=>[id,1]));u.focus=10000;u.cooldowns={};a.selected=opts.ids[1];a.updateHUD(true)}",{'cls':cls,'ids':ids});settle(p);shot(p,'hud-'+cls+'-'+str(w)+'-selected')
   rects="()=>Object.fromEntries(['#joystick','#fire','#battle-bottom','#battlecanvas'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return[s,[r.x,r.y,r.width,r.height]]}))"
   before=p.evaluate(rects);styles=p.locator('link[href*="game-src-skill-icons"]');styles.evaluate_all('es=>es.forEach(e=>e.disabled=true)');original=p.evaluate(rects);styles.evaluate_all('es=>es.forEach(e=>e.disabled=false)');assert before==original
   p.evaluate("()=>{const a=HonroApp,u=a.engine.active;u.focus=0;u.cooldowns[u.loadout[2]]=3;a.updateHUD(true)}");settle(p);shot(p,'hud-'+cls+'-'+str(w)+'-unavailable')
   hud.append({'class':cls,'size':[w,h],'controlsUnchanged':True,'imageOpacity':p.locator('#combat-skills .unaffordable').first.evaluate('e=>getComputedStyle(e).opacity')})
 p.evaluate("()=>{const a=HonroApp,u=a.engine.active;u.cls='archer';u.loadout=['A01','A08','A14','A09'];u.focus=10000;HONRO_CORE.SKILLS.A14.cooldown=2;u.cooldowns={A14:a.engine.b.round+2};a.updateHUD(true)}");settle(p);shot(p,'diagnostic-cooldown-2-turns');assert p.locator('[data-skill=A14] .mana-cost').inner_text()=='2회';p.evaluate('delete HONRO_CORE.SKILLS.A14.cooldown')
 cached=net(p,'reentered surfaces cached');assert len(set(network))==84,(len(network),len(set(network)))
 # Cold real network failure: actual hashed asset responds 404 and the neutral frame contains no SVG.
 q=b.new_page(viewport={'width':390,'height':844});q.route('**/skill-icon-A08.*.webp',lambda r:r.fulfill(status=404,body='deliberate network failure'))
 q.goto(base+'/HONRO.html');q.wait_for_function('window.HonroApp');q.evaluate("HonroApp.showCamp('archer');HonroApp.talent('A08')")
 q.wait_for_function("document.querySelector('.skill-modal-title [data-skill-icon=A08]').dataset.imageState==='error'")
 assert q.locator('.skill-modal-title [data-skill-icon=A08] svg').count()==0;shot(q,'network-failure-A08');q.evaluate("HonroApp.talent('A08')");q.wait_for_timeout(100);assert q.evaluate('HonroSkillImages.status().failed')==1;q.close()
 # Real production scene: 1/4/10, spaced/clustered, zoom and roof. Original physics untouched.
 p.evaluate("HonroOptionalRuntime.load('training')")
 p.add_script_tag(content=(ROOT/'tests/cheonroe-fixture.mjs').read_text().replace('export function','function'))
 lightning=[]
 for w,h,z,count,spacing,roof in [(360,800,.66,1,38,False),(360,800,.66,4,65,False),(360,800,.66,10,38,False),(390,844,.8,10,17,False),(844,390,.66,10,38,False),(844,390,1.15,4,80,False),(1280,900,1.4,1,38,False),(1280,900,.45,10,38,False),(1280,900,1.15,10,17,True)]:
  p.set_viewport_size({'width':w,'height':h});p.evaluate(constants['SETUP'],{'count':count,'zoom':z,'ceiling':roof,'cameraY':900 if h<500 else 760})
  p.evaluate("opts=>{fixture.b.units.slice(1).forEach((u,i)=>u.x=1000+(i-(opts.count-1)/2)*opts.spacing);if(opts.roof){fixture.b.terrain[1].y=790;fixture.b.sceneVersion++;}fixture.impact();fixture.strike();renderFrame(.08)}",{'count':count,'spacing':spacing,'roof':roof})
  r=p.evaluate(constants['SNAP']);assert len(r['bolts'])==count and r['liveRays']==count and len(r['hits'])==count and r['headAgreement'],r
  name=f'lightning-{w}-{count}-spacing{spacing}-zoom{z}'+('-roof' if roof else '')
  shot(p,name);lightning.append({'file':name+'.jpg',**r})
 assert p.evaluate('window.skillDecode.max')<=4
 assert not errors,errors
 report={'browser':b.version,'scope':'Actual local built Chromium; diagnostic profile/training arenas, deterministic stepping; no campaign completion or physical device/Safari approval','reviewedIDs':checked,'network':rows,'geometry':geometry,'hud':hud,'lightning':lightning,'pageErrors':errors,'decodeStatus':p.evaluate('HonroSkillImages.status()'),'decodeMetrics':p.evaluate('window.skillDecode'),'currentCooldownSkills':p.evaluate('Object.keys(HONRO_SKILL_ICON_MANIFEST.icons).filter(id=>HONRO_CORE.SKILLS[id].cooldown)')}
 (OUT/'browser-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');b.close()
print('PASS integration actual UI: all 84, all four sizes, classes, locked/SP/selected/unavailable, real network cache/failure, lightning 1/4/10')
