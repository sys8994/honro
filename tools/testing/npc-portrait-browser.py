"""NPC portrait display on actual App/Scene, resume-row fixtures; no campaign replay."""
from pathlib import Path
import sys,json,subprocess,hashlib
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
OUT=ROOT/'_local/reports/npc-plain-v2';OUT.mkdir(parents=True,exist_ok=True)
D=json.loads((ROOT/'shared/data/narrative-current.json').read_text());M=json.loads((ROOT/'game/docs/npc-portraits-20261023/mapping-proposed.json').read_text());C=json.loads((ROOT/'game/config/npc-portraits.json').read_text())
cases=[]
for asset in C['assets']:
 for m in M['rowMappings']:
  if m['rowId']in C['rows']and C['rows'][m['rowId']]['asset']==asset:
   line=D
   for part in m['jsonPointer'].strip('/').split('/'):line=line[int(part)]if isinstance(line,list)else line[part]
   cases.append({'asset':asset,'stage':int(m['jsonPointer'].split('/')[2]),'line':line});break
worker=next(c for c in cases if c['asset']=='worker_mature')
if '--smoke'in sys.argv:cases=[cases[0],worker]
profile=json.loads((ROOT/'tests/fixtures/render-update-profile-20261022.json').read_text());profile['cleared'].update({str(i):True for i in range(1,31)})
rows=[];faults=[]
def context(b):
 c=b.new_context(viewport={'width':390,'height':844},has_touch=True);p=c.new_page();p.add_init_script('if(!localStorage.getItem("honro-first-act-profile-1"))localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');');return c,p
def show(p,case):
 p.evaluate('async q=>{const a=HonroApp;if(a.stage?.id!==q.stage||a.screen!=="battle"){await HonroCampaignLoader.ensureStage(q.stage);a.launch(q.stage);for(let i=0;a.dialogue&&i<40;i++)HonroStory.finish(a);}HonroStory.start(a,[q.line,q.line],{title:a.stage.name,index:0});}',case)
 p.wait_for_selector('#story-portrait-canvas')
def ready(p):p.wait_for_function('document.getElementById("story-portrait-canvas")?.dataset.portraitState==="ready"',timeout=15000)
def snap(p):
 return p.evaluate('''()=>{const c=document.getElementById('story-portrait-canvas'),s=document.querySelector('.story-scene'),name=s.querySelector('.story-speaker-name').textContent,v=HonroNPCPortraits.resolve(HonroApp,name,HonroApp.dialogue.lines[HonroApp.dialogue.index][2],null),r=e=>{const b=e.getBoundingClientRect();return{x:b.x,y:b.y,right:b.right,bottom:b.bottom,w:b.width,h:b.height};},p=r(c),ctx=c.getContext('2d'),bytes=ctx.getImageData(0,0,c.width,c.height).data;return{name,row:HonroApp.dialogue.lines[HonroApp.dialogue.index][2].rowId,asset:v?.id,state:c.dataset.portraitState,canvas:p,body:r(s.querySelector('#story-line')),topAlpha:Math.max(...Array.from(bytes.slice(0,c.width*4)).filter((_,i)=>i%4===3)),nonzeroAlpha:bytes.some((v,i)=>i%4===3&&v>0),buttons:[...s.querySelectorAll('button')].map(e=>{const b=r(e);return{disabled:e.disabled,inside:b.x>=0&&b.right<=innerWidth&&b.y>=0&&b.bottom<=innerHeight,hit:e.disabled||document.elementFromPoint(b.x+b.w/2,b.y+b.h/2)?.closest('button')===e};}),stats:HonroPortraits.stats()};}''')
with serve_game() as base,sync_playwright() as pw:
 b=launch(pw);c,p=context(b);requests=[];errors=[];p.on('request',lambda q:requests.append(q.url)if'npc-portrait-'in q.url else None);p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp?.screen==="title"');assert not requests
 for case in cases:
  show(p,case);ready(p)
  for w,h in [(1280,800),(390,844),(320,640),(844,390)]:
   p.set_viewport_size({'width':w,'height':h});p.wait_for_timeout(230);r=snap(p);r.update(view=[w,h]);rows.append(r);assert r['asset']==case['asset']and r['name']==case['line'][0]and r['nonzeroAlpha']and r['topAlpha']==0 and all(x['inside']and x['hit']for x in r['buttons']),r
   if w in [390,844]or '--smoke'in sys.argv:p.screenshot(path=str(OUT/(str(w)+'-'+case['asset']+'.jpg')),type='jpeg',quality=92)
  p.locator('[data-action=dialogue-next]').tap();p.wait_for_function('HonroApp.dialogue.index===1');p.locator('[data-action=dialogue-prev]').tap();p.wait_for_function('HonroApp.dialogue.index===0')
 assert len(set(requests))==len(cases) and len(requests)==len(cases),requests
 show(p,worker);ready(p);a=p.evaluate('''()=>{const c=document.getElementById('story-portrait-canvas'),ctx=c.getContext('2d'),draw=ctx.drawImage,clear=ctx.clearRect;let paints=0,clears=0;ctx.drawImage=function(...a){paints++;return draw.apply(this,a)};ctx.clearRect=function(...a){clears++;return clear.apply(this,a)};const before=HonroPortraits.stats(),asset=HonroNPCPortraits.resolve(HonroApp,'덕수',HonroApp.dialogue.lines[0][2]);for(let i=0;i<120;i++)HonroPortraits.draw(c,null,null,{npcAsset:asset,framing:'dialogue'});return{before,after:HonroPortraits.stats(),paints,clears};}''');assert a['paints']==a['clears']==0 and a['before']==a['after'],a
 # Normal saved battle restores the same original line metadata and NPC image.
 saved=p.evaluate('HonroStory.save(HonroApp);JSON.stringify(HonroApp.dialogue.lines)');p.reload();p.wait_for_function('window.HonroApp?.screen==="title"');p.evaluate('HonroApp.continue()');ready(p);assert p.evaluate('JSON.stringify(HonroApp.dialogue.lines)')==saved
 # The current rest prelude really contains a pub owner; run its existing row.
 p.evaluate('''()=>{HonroStory.finish(HonroApp);HonroRestJourney.state(HonroApp.profile).restStageId=1;HonroApp.showRest();for(let i=0;HonroApp.dialogue&&i<30;i++)HonroStory.finish(HonroApp);const line=HonroStoryContent.mapScenes[0].find(l=>l[0]==='주막주인');HonroStory.start(HonroApp,[line,line],{title:HonroApp.stage.name,index:0});}''');ready(p);rest=snap(p);assert rest['asset']=='man_elder';p.screenshot(path=str(OUT/'rest-pub-owner.jpg'),type='jpeg',quality=92)
 assert not errors,errors;c.close()
 for mode in ([]if '--smoke'in sys.argv else ['slow','404','timeout']):
  c,p=context(b);held=[];fail=True;hits=[]
  def route(q):
   hits.append(q.request.url)
   if fail and mode in ['slow','timeout']:held.append(q)
   elif fail:q.fulfill(status=404,body='fixture failure')
   else:q.continue_()
  p.route('**/npc-portrait-worker_mature.*.webp',route);p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp?.screen==="title"');show(p,worker)
  if mode=='slow':p.wait_for_function('document.getElementById("story-portrait-canvas").dataset.portraitState==="loading"')
  else:p.wait_for_function('document.getElementById("story-portrait-canvas").dataset.portraitState==="error"',timeout=10000)
  if mode=='404':p.wait_for_timeout(2800)
  initial=snap(p);assert not initial['nonzeroAlpha']and initial['stats']['fallbackPaints']==0 and initial['stats']['vectorBuilds']==0,initial;p.screenshot(path=str(OUT/(mode+'-neutral.jpg')),type='jpeg',quality=92)
  assert all(x['inside']and x['hit']for x in initial['buttons']);p.locator('[data-action=dialogue-next]').tap();p.locator('[data-action=dialogue-prev]').tap()
  fail=False
  for q in held:q.continue_()
  if mode=='404':
   p.evaluate('HonroStory.finish(HonroApp)');show(p,worker)
  ready(p);result=snap(p);assert result['nonzeroAlpha']and result['stats']['fallbackPaints']==0 and result['stats']['vectorBuilds']==0,result
  faults.append({'mode':mode,'before':initial,'after':result,'requests':len(hits)});print('PASS',mode,len(hits),'requests',flush=True);c.close()
 b.close()
(OUT/('final-smoke.json'if '--smoke'in sys.argv else'browser.json')).write_text(json.dumps({'head':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'manifestSha256':hashlib.sha256((ROOT/'web/manifest.json').read_bytes()).hexdigest(),'rows':rows,'repeat120':a,'saveRestore':True,'rest':rest,'faults':faults,'errors':errors},ensure_ascii=False,indent=2));print('PASS',len(rows),'NPC view samples + saved story/rest/repeat120; cold assets',len(cases),'; faults',len(faults))
