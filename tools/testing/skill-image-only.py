"""Production icon consumers + real asset transport faults, without substitute art."""
from pathlib import Path
import sys,json,subprocess,hashlib,re
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
OUT=ROOT/'_local/reports/skill-image-only';OUT.mkdir(parents=True,exist_ok=True)
before='--before'in sys.argv;rows=[]
SETUP="""()=>{const a=HonroApp,C=HONRO_CORE;a.profile.settings.music=false;a.profile.settings.sound=false;a.profile.recruited=['archer','mage','knight','occultist'];for(const cls of a.profile.recruited){a.profile.heroes[cls].xp=C.xpAtLevel(30);for(const t of C.TALENTS.filter(n=>n.cls===cls))a.profile.heroes[cls].ranks[t.id]=1;}a.profile.loadouts.archer=['A01','A14','A02','A99'];a.branch=C.TALENT_MAP.A14.branch;a.showCamp('archer')}"""
SNAP="""()=>[...(document.querySelector('#modal.open')||document).querySelectorAll('[data-skill-icon]')].map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e),i=e.querySelector('img');return{id:e.dataset.skillIcon,state:e.dataset.imageState,svg:e.querySelectorAll('svg').length,src:i?.getAttribute('src'),complete:i?.complete&&i?.naturalWidth===256,box:[r.width,r.height],visible:s.display!=='none'&&r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth}})"""
def ready(p):
 p.wait_for_function("()=>[...(document.querySelector('#modal.open')||document).querySelectorAll('[data-skill-icon]')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&r.bottom>0&&r.top<innerHeight}).every(e=>e.dataset.imageState==='ready'&&e.querySelector('img')?.complete&&e.querySelector('img')?.naturalWidth===256)")
def surface(p,name,checks):
 ready(p);r=p.evaluate(SNAP);assert r and all(x['svg']==0 for x in r),r;assert all(x['complete'] for x in r if x['visible']),r;checks.append({'surface':name,'icons':r})
with serve_game() as base,sync_playwright() as pw:
 b=launch(pw)
 for mode in (['slow']if before else ['normal','slow','503','404','timeout']):
  c=b.new_context(viewport={'width':390,'height':844},has_touch=True);p=c.new_page();held=[];hits={};fault=True;errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  def transport(route):
   nonlocal_dummy=None
   id=re.search(r'skill-icon-([A-Z]+\d+)\.',route.request.url)[1];hits[id]=hits.get(id,0)+1
   targeted=id in ['A14','A02','A06','AP05','A99']
   if fault and targeted and (mode=='slow'or mode=='timeout'and id=='A14'):held.append(route)
   elif fault and targeted and mode=='404':route.fulfill(status=404,body='fixture unavailable')
   elif targeted and mode=='503'and hits[id]==1:route.fulfill(status=503,body='fixture transient')
   else:route.continue_()
  p.route('**/skill-icon-*.webp',transport)
  entry='/'+json.loads(subprocess.check_output(['git','show','5987f6db:web/manifest.json'],text=True))['playtest'].split('?')[0]if before else'/HONRO.html'
  p.goto(base+entry);p.wait_for_function('window.HonroApp?.screen==="title"');assert not hits,'title requested skill art'
  p.evaluate(SETUP);p.locator('.branch.mobile-current').scroll_into_view_if_needed();p.wait_for_timeout(250)
  cold=p.evaluate(SNAP)
  if before:
   assert any(x['svg'] for x in cold if x['id']=='A14');p.screenshot(path=str(OUT/'before-slow-camp.jpg'),type='jpeg',quality=92)
   rows.append({'mode':mode,'entry':entry,'legacySvgReproduced':True,'cold':cold});c.close();continue
  assert all(x['svg']==0 for x in cold),cold
  fault_state=None
  if mode in ['slow','timeout']:
   p.wait_for_function("document.querySelector('.tree-node [data-skill-icon=A14]').dataset.imageState==='"+('timeout'if mode=='timeout'else'loading')+"'",timeout=12000)
   fault_state=p.evaluate(SNAP);assert all(x['svg']==0 for x in fault_state)
   p.screenshot(path=str(OUT/(mode+'-placeholder.jpg')),type='jpeg',quality=92);fault=False
   for route in held:route.continue_()
  if mode=='404':
   p.wait_for_function("document.querySelector('.tree-node [data-skill-icon=A14]').dataset.imageState==='error'");p.wait_for_timeout(3100)
   fault_state=p.evaluate(SNAP);assert all(x['svg']==0 for x in fault_state);assert max(hits.get(i,0)for i in ['A14','A02','A06','AP05','A99'])<=3,hits
   p.screenshot(path=str(OUT/'404-placeholder.jpg'),type='jpeg',quality=92);fault=False
   p.evaluate("HonroApp.showCamp('mage');HonroApp.showCamp('archer')")
  p.wait_for_function('HonroSkillImages.status().cached===84&&HonroSkillImages.status().active===0&&HonroSkillImages.status().queued===0',timeout=25000)
  # Failed background entries recover when they enter a real visible consumer.
  for id in ['A14','A02','A06','AP05','A99']:
   p.evaluate('id=>HonroApp.talent(id)',id);ready(p);p.evaluate('HonroApp.close()')
  checks=[]
  for cls in ['archer','mage','knight','occultist']:
   p.evaluate('cls=>HonroApp.showCamp(cls)',cls);surface(p,'camp-tree-slots-passives-'+cls,checks)
  p.evaluate("HonroApp.showCamp('archer');HonroApp.talent('A14')");surface(p,'detail-active',checks);p.evaluate('HonroApp.close()')
  p.evaluate("HonroApp.talent('AP05')");surface(p,'detail-passive',checks);p.evaluate('HonroApp.close()')
  p.locator('[data-action=slot][data-slot="1"]').tap();surface(p,'slot-library',checks);p.evaluate('HonroApp.close()')
  p.evaluate("HonroApp.showCamp('archer');window.icons=[...(document.querySelector('#modal.open')||document).querySelectorAll('[data-skill-icon]')];window.statsBefore=HonroSkillImages.status();for(let i=0;i<20;i++)HonroApp.showCamp('archer')")
  repeat=p.evaluate('({same:icons.every(e=>e.isConnected),before:statsBefore,after:HonroSkillImages.status()})');assert repeat['same']
  for k in ['requests','decodes','srcWrites']:assert repeat['before'][k]==repeat['after'][k],repeat
  p.locator('.branch.mobile-current').scroll_into_view_if_needed();p.screenshot(path=str(OUT/(mode+'-camp-ready.jpg')),type='jpeg',quality=92)
  p.evaluate('HonroApp.startTraining()');p.wait_for_selector('.training-dialog');surface(p,'training-picker',checks);p.evaluate('HonroApp.close()');surface(p,'training-toolbar-HUD',checks)
  p.evaluate("()=>{const a=HonroApp,u=a.engine.active;u.loadout=['A14','A02','A06','A99'];u.ranks={...u.ranks,A14:1,A02:1,A06:1,A99:1};a.updateHUD(true)}");ready(p)
  p.evaluate("window.hudIcons=[...document.querySelectorAll('#combat-skills [data-skill-icon]')];window.statsBefore=HonroSkillImages.status()")
  for i in range(12):p.locator('#combat-skills button').nth(i%4).tap()
  hud=p.evaluate('({same:hudIcons.every(e=>e.isConnected),before:statsBefore,after:HonroSkillImages.status()})');assert hud['same']
  for k in ['requests','decodes','srcWrites']:assert hud['before'][k]==hud['after'][k],hud
  surface(p,'HUD-clicks',checks);assert not errors,errors
  rows.append({'mode':mode,'cold':cold,'fault':fault_state,'checks':checks,'campRepeat20':repeat,'hudClicks12':hud,'hits':hits,'errors':errors,'status':p.evaluate('HonroSkillImages.status()')});print('PASS',mode,len(checks),'surfaces',flush=True);c.close()
 b.close()
(OUT/('before.json'if before else'after.json')).write_text(json.dumps({'head':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'manifestSha256':hashlib.sha256((ROOT/'web/manifest.json').read_bytes()).hexdigest(),'rows':rows},ensure_ascii=False,indent=2));print('DONE',len(rows))
