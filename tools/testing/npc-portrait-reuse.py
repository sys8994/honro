"""A cached NPC error must erase the previous speaker on the retained canvas."""
from pathlib import Path
import json,sys,subprocess,hashlib
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
OUT=ROOT/'_local/reports/npc-plain-v2';OUT.mkdir(parents=True,exist_ok=True)
D=json.loads((ROOT/'shared/data/narrative-current.json').read_text());M=json.loads((ROOT/'game/docs/npc-portraits-20261023/mapping-proposed.json').read_text());C=json.loads((ROOT/'game/config/npc-portraits.json').read_text())
profile=json.loads((ROOT/'tests/fixtures/render-update-profile-20261022.json').read_text());profile['cleared'].update({str(i):True for i in range(1,31)})
def row(asset):
 m=next(m for m in M['rowMappings']if m['rowId']in C['rows']and C['rows'][m['rowId']]['asset']==asset);line=D
 for part in m['jsonPointer'].strip('/').split('/'):line=line[int(part)]if isinstance(line,list)else line[part]
 return {'stage':int(m['jsonPointer'].split('/')[2]),'line':line}
def show(p,q):
 p.evaluate('''async q=>{const a=HonroApp;if(a.stage?.id!==q.stage||a.screen!=="battle"){await HonroCampaignLoader.ensureStage(q.stage);a.launch(q.stage);for(let i=0;a.dialogue&&i<40;i++)HonroStory.finish(a);}HonroStory.start(a,[q.line,q.line],{title:a.stage.name,index:0});}''',q)
def alpha(p):return p.evaluate('''()=>{const c=document.getElementById('story-portrait-canvas');return c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0);}''')
rows=[]
with serve_game()as base,sync_playwright()as pw:
 b=launch(pw)
 for phase in ['before','after']:
  c=b.new_context(viewport={'width':390,'height':844},has_touch=True);p=c.new_page();p.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');');hits=[];fail=True
  def route(q):
   hits.append(q.request.url)
   if fail:q.fulfill(status=404,body='fixture failure')
   else:q.continue_()
  p.route('**/npc-portrait-worker_mature.*.webp',route);p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp?.screen==="title"')
  if phase=='before':p.evaluate(subprocess.check_output(['git','show','66758d13:shared/runtime/portraits.js'],text=True))
  show(p,row('worker_mature'));p.wait_for_function('document.getElementById("story-portrait-canvas")?.dataset.portraitState==="error"');p.wait_for_timeout(2800);assert len(hits)==3,hits
  # Keep the same Stage7 dialogue owner/canvas. A stage launch recreates its
  # owner, which would hide this retained-surface case rather than exercise it.
  p.evaluate('''()=>{const a=HonroApp,m=a.engine.b.honroMarkers.find(m=>m.label==='월이'),line=HonroStoryContent.interaction(a,m).find(l=>l[0]===m.label);HonroStory.start(a,[line,line],{title:a.stage.name,index:0});}''')
  p.wait_for_function('document.getElementById("story-portrait-canvas")?.dataset.portraitState==="ready"');assert alpha(p)
  show(p,row('worker_mature'));p.wait_for_selector('#story-portrait-canvas');stale=alpha(p);assert stale==(phase=='before'),(phase,stale)
  p.screenshot(path=str(OUT/('reuse-'+phase+'.jpg')),type='jpeg',quality=92)
  repeat=p.evaluate('''()=>{const c=document.getElementById('story-portrait-canvas'),ctx=c.getContext('2d'),draw=ctx.drawImage,clear=ctx.clearRect;let paints=0,clears=0;ctx.drawImage=function(...a){paints++;return draw.apply(this,a)};ctx.clearRect=function(...a){clears++;return clear.apply(this,a)};const before=HonroPortraits.stats(),asset=HonroNPCPortraits.resolve(HonroApp,'덕수',HonroApp.dialogue.lines[0][2]);for(let i=0;i<120;i++)HonroPortraits.draw(c,null,null,{npcAsset:asset,framing:'dialogue'});return{before,after:HonroPortraits.stats(),paints,clears};}''')
  assert repeat['paints']==repeat['clears']==0 and repeat['before']==repeat['after'],repeat
  fail=False;p.evaluate('HonroStory.finish(HonroApp)');show(p,row('worker_mature'));p.wait_for_function('document.getElementById("story-portrait-canvas")?.dataset.portraitState==="ready"',timeout=15000);assert alpha(p);assert len(hits)<=6,hits
  rows.append({'phase':phase,'staleNonzeroAlpha':stale,'repeat120':repeat,'reopenRecovered':True,'physicalRequests':len(hits)});c.close()
 b.close()
(OUT/'reuse.json').write_text(json.dumps({'head':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'afterSourceSha256':hashlib.sha256((ROOT/'shared/runtime/portraits.js').read_bytes()).hexdigest(),'beforeSource':'66758d13','rows':rows},ensure_ascii=False,indent=2));print('PASS cached-error -> other ready speaker -> cached-error: stale alpha before, neutral after; 120 additional paints/clears/requests/decodes=0; reopen recovered')
