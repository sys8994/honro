"""Built Chromium evidence: baseline versus keyed HUD/camp reuse, cold/warm/retry."""
import json,os,subprocess
from pathlib import Path
from contextlib import contextmanager
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from functools import partial
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
OUT=ROOT/os.environ.get('HONRO_ICON_OUT','game/docs/icon-cache-journey-navigation/evidence');OUT.mkdir(parents=True,exist_ok=True)
@contextmanager
def server(root):
 class Quiet(SimpleHTTPRequestHandler):
  def log_message(self,*_):pass
 s=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)));t=Thread(target=s.serve_forever,daemon=True);t.start()
 try:yield f'http://127.0.0.1:{s.server_port}'
 finally:s.shutdown();s.server_close();t.join(2)
INIT="""(()=>{window.iconStats={decode:0,load:0};const decode=HTMLImageElement.prototype.decode;HTMLImageElement.prototype.decode=function(){if(/skill-icon|skill-icons/.test(this.src))iconStats.decode++;return decode.call(this)};const src=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{...src,set(value){if(/skill-icon|skill-icons/.test(value))iconStats.load++;return src.set.call(this,value)}})})()"""
SETUP="""()=>{const a=HonroApp;a.profile.settings.music=false;a.profile.settings.sound=false;a.close();a.engine.active.loadout=['A01','A02','A03','A04'];for(const id of a.engine.active.loadout)a.engine.active.ranks[id]=1;a.selected='A01';a.selectedByUnit[a.engine.active.id]='A01';a.updateHUD(true)}"""
WATCH="""()=>{window.identity=[...document.querySelectorAll('#combat-skills>button')];window.artIdentity=identity.map(e=>e.querySelector('.skill-art'));window.mutations={created:0,removed:0,flash:0};window.mo=new MutationObserver(rs=>{for(const r of rs){mutations.created+=r.addedNodes.length;mutations.removed+=r.removedNodes.length;if(r.type==='attributes'&&r.target.matches('.skill-art')&&r.target.dataset.imageState!=='ready')mutations.flash++}for(const e of document.querySelectorAll('#combat-skills .skill-art'))if(e.dataset.imageState!=='ready'||getComputedStyle(e.querySelector('svg')).visibility!=='hidden')mutations.flash++});mo.observe(document.querySelector('#combat-skills'),{childList:true,subtree:true,attributes:true});window.before={...iconStats,resources:performance.getEntriesByType('resource').filter(e=>/skill-icon/.test(e.name)).length}}"""
rows=[]
with sync_playwright() as pw:
 b=launch(pw)
 for label,root in [('baseline',Path(os.environ.get('HONRO_ICON_BASELINE','/tmp/honro-icon-baseline'))),('fixed',ROOT)]:
  with server(root) as base:
   p=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);p.add_init_script(INIT);errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
   p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp');p.wait_for_timeout(200)
   intro=p.evaluate('({...iconStats,status:HonroSkillImages.status()})');assert intro['decode']==0
   p.evaluate('HonroApp.startTraining()');p.wait_for_selector('.training-dialog');p.evaluate(SETUP);p.wait_for_function("()=>[...document.querySelectorAll('#combat-skills .skill-art')].every(e=>e.dataset.imageState==='ready')")
   p.wait_for_function('HonroSkillImages.status().active===0&&HonroSkillImages.status().queued===0');p.wait_for_timeout(350)
   p.evaluate(WATCH)
   for i in range(30):
    p.locator('#combat-skills>button').nth(i%4).click(force=True)
    assert p.locator('#combat-skills>button').nth(i%4).get_attribute('aria-pressed')=='true'
    p.evaluate("i=>{const a=HonroApp,u=a.engine.active;a.selected=u.loadout[i%4];a.selectedByUnit[u.id]=a.selected;u.focus=i%2?u.maxFocus:0;u.cooldowns={A02:i%3};a.updateHUD(true)}",i)
    p.wait_for_timeout(18)
   result=p.evaluate("""()=>({mutations,sameButtons:identity.map((n,i)=>n===document.querySelectorAll('#combat-skills>button')[i]),sameArt:artIdentity.map((n,i)=>n===document.querySelectorAll('#combat-skills .skill-art')[i]),decodeDelta:iconStats.decode-before.decode,loadDelta:iconStats.load-before.load,resourceDelta:performance.getEntriesByType('resource').filter(e=>/skill-icon/.test(e.name)).length-before.resources,resources:performance.getEntriesByType('resource').filter(e=>/skill-icon/.test(e.name)).map(e=>({body:e.encodedBodySize,transfer:e.transferSize})),intro:null})""")
   result.update(label=label,intro=intro,browser=b.version,errors=errors)
   p.screenshot(path=str(OUT/f'icon-{label}.jpg'),type='jpeg',quality=82)
   if label=='fixed':
    assert all(result['sameButtons']) and all(result['sameArt']);assert result['mutations']=={'created':0,'removed':0,'flash':0};assert result['decodeDelta']==result['loadDelta']==result['resourceDelta']==0
    p.evaluate("()=>{const a=HonroApp,u=a.engine.active;u.loadout=['A02','A01','A04','A03'];a.updateHUD(true)}");assert p.evaluate('identity.every(n=>n.isConnected)')
    result['reorderRetainsNodes']=True
    p.evaluate("()=>{const a=HonroApp,u=a.engine.active;HONRO_CORE.SKILLS.A99.cooldown=2;u.loadout[3]='A99';u.cooldowns.A99=a.engine.b.round+2;a.updateHUD(true)}");result['cooldown']=p.locator('#combat-skills [data-skill=A99] .mana-cost').inner_text();assert result['cooldown']=='2회'
    p.evaluate("()=>{const a=HonroApp,u=a.engine.active;u.meleeFollow='ready';a.updateHUD(true)}");assert p.locator('#combat-skills [data-skill=A01]').is_disabled();result['skillLock']=True
    p.evaluate("()=>{const a=HonroApp;a.profile.recruited=['archer','knight','mage','occultist'];a.profile.heroes.archer.xp=HONRO_CORE.xpAtLevel(30);a.showCamp('archer')}")
    p.wait_for_timeout(200)
    p.evaluate("window.campArt=[...document.querySelectorAll('.skill-art')];window.campButtons=[...document.querySelectorAll('.tree-node,.slot-card')]")
    p.evaluate("()=>{const a=HonroApp;a.profile.heroes.archer.ranks.A02=1;a.showCamp('archer');a.profile.heroes.archer.statTraining=1;a.showCamp('archer')}")
    result['camp']=p.evaluate("({icons:campArt.every(n=>n.isConnected),buttons:campButtons.every(n=>n.isConnected)})");assert all(result['camp'].values())
    # Existing fallback remains visible after network error, explicit retry recovers.
    p.close();p=b.new_page(viewport={'width':390,'height':844});p.add_init_script(INIT)
    p.route('**/*skill-icon-A01*.webp',lambda route:route.abort());p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp');p.evaluate('HonroApp.startTraining()');p.wait_for_selector('.training-dialog');p.evaluate(SETUP)
    p.wait_for_function("document.querySelector('#combat-skills [data-skill-icon=A01]').dataset.imageState==='error'")
    assert p.locator('#combat-skills [data-skill-icon=A01] svg').evaluate("e=>getComputedStyle(e).visibility")=='visible'
    p.unroute('**/*skill-icon-A01*.webp');p.evaluate('HonroSkillImages.retry()');p.wait_for_function("document.querySelector('#combat-skills [data-skill-icon=A01]').dataset.imageState==='ready'");result['failureRecovery']=True
   rows.append(result);p.close()
 b.close()
(OUT/'icon-results.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
print(json.dumps([{k:v for k,v in row.items() if k!='resources'} for row in rows],ensure_ascii=False))
