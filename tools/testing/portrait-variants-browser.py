"""Actual App portrait UI and bounded image lifetime; authored rows are fixtures."""
from pathlib import Path
import json,sys,subprocess,hashlib
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
OUT=ROOT/('_local/reports/portrait-variants32/browser' if '--v2' in sys.argv else '_local/reports/portrait-variants');OUT.mkdir(parents=True,exist_ok=True)
D=json.loads((ROOT/'shared/data/narrative-current.json').read_text());H=json.loads((ROOT/'game/config/story-portraits.json').read_text());N=json.loads((ROOT/'game/config/npc-portraits.json').read_text());M=json.loads((ROOT/('art/portraits/variants-v2-20261024/manifest.json' if '--v2' in sys.argv else 'art/portraits/variants-v1/manifest.json')).read_text());M=[dict(r,id=Path(r['file']).stem,actor=r['identity'],variant=r['expression']) for r in M['images']] if '--v2' in sys.argv else M;allrows=[]
def walk(x,stage=1):
 if isinstance(x,list):
  if len(x)>2 and isinstance(x[0],str)and isinstance(x[1],str)and isinstance(x[2],dict)and x[2].get('rowId'):allrows.append({'stage':stage,'line':x})
  else:
   for v in x:walk(v,stage)
 elif isinstance(x,dict):
  for k,v in x.items():
   if k=='stages':
    for s,body in v.items():walk(body,int(s))
   else:walk(v,stage)
walk(D)
def identity(q):
 who=q['line'][0];return H.get(who,{}).get('approvedPortrait',{}).get('id')or N['rows'].get(q['line'][2]['rowId'],{}).get('asset')or N['named'].get(who)
cases={}
for r in M:
 pool=[q for q in allrows if identity(q)==r['actor']];assert pool,r;matches=[q for q in pool if q['line'][2].get('portraitExpression')==r['variant']];match=next((q for q in matches if r['id']=='sodan-holding-threads'and q['stage']==10),matches[0]if matches else None);q=json.loads(json.dumps(match or pool[0]));q['fixtureExpression']=not bool(match);q['line'][2]['portraitExpression']=r['variant'];cases[r['id']]=q
profile=json.loads((ROOT/'tests/fixtures/render-update-profile-20261022.json').read_text());profile['cleared'].update({str(i):True for i in range(1,31)})
def openpage(b,base):
 c=b.new_context(viewport={'width':390,'height':844},has_touch=True);p=c.new_page();p.add_init_script('if(!localStorage.getItem("honro-first-act-profile-1"))localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');');p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp?.screen==="title"');return c,p
def show(p,q,launch=True):
 p.evaluate('''async({q,launch})=>{const a=HonroApp;if(launch&&(a.stage?.id!==q.stage||a.screen!=="battle")){await HonroCampaignLoader.ensureStage(q.stage);a.launch(q.stage);for(let i=0;a.dialogue&&i<40;i++)HonroStory.finish(a);}HonroStory.start(a,[q.line,q.line],{title:a.stage.name,index:0});}''',{'q':q,'launch':launch})
def info(p):return p.evaluate('''()=>{const c=document.getElementById('story-portrait-canvas'),[who,,meta]=HonroApp.dialogue.lines[HonroApp.dialogue.index],npc=HonroNPCPortraits.resolve(HonroApp,who,meta),cls=HONRO_STORY_PORTRAITS[who]?.class;return HonroPortraits.draw(c,null,cls,{npcAsset:npc,identity:who,portraitExpression:meta.portraitExpression,framing:'dialogue'});}''')
def exact(p,expr):p.wait_for_function('''expr=>{const c=document.getElementById('story-portrait-canvas');if(!c)return false;const [who,,meta]=HonroApp.dialogue.lines[HonroApp.dialogue.index],npc=HonroNPCPortraits.resolve(HonroApp,who,meta),v=HonroPortraits.draw(c,null,HONRO_STORY_PORTRAITS[who]?.class,{npcAsset:npc,identity:who,portraitExpression:meta.portraitExpression,framing:'dialogue'});return v?.state==='ready'&&v.expression===expr;}''',arg=expr,timeout=18000)
def pixels(p):return p.evaluate('document.getElementById("story-portrait-canvas").toDataURL()')
def repeat(p):
 return p.evaluate('''()=>{const c=document.getElementById('story-portrait-canvas'),ctx=c.getContext('2d'),draw=ctx.drawImage,clear=ctx.clearRect;let paints=0,clears=0;ctx.drawImage=function(...a){paints++;return draw.apply(this,a)};ctx.clearRect=function(...a){clears++;return clear.apply(this,a)};const [who,,meta]=HonroApp.dialogue.lines[HonroApp.dialogue.index],asset=HonroNPCPortraits.resolve(HonroApp,who,meta),cls=HONRO_STORY_PORTRAITS[who]?.class,before=HonroPortraits.stats();for(let i=0;i<120;i++)HonroPortraits.draw(c,null,cls,{npcAsset:asset,identity:who,portraitExpression:meta.portraitExpression,framing:'dialogue'});return{before,after:HonroPortraits.stats(),paints,clears};}''')
def check_repeat(r):assert r['paints']==r['clears']==0 and r['before']==r['after'],r
seoro=json.loads(json.dumps(cases['seoro-emotion-resolve' if '--v2' in sys.argv else 'seoro-anger']));basecase=json.loads(json.dumps(seoro));basecase['line'][2]['portraitExpression']='base';damheo=json.loads(json.dumps(cases['damheo-emotion-resolve' if '--v2' in sys.argv else 'damheo-concern']));damheo['line'][2]['portraitExpression']='base'
if '--mount-audit'in sys.argv or '--v2' in sys.argv:
 audit=[]
 with serve_game()as base,sync_playwright()as pw:
  b=launch(pw);c,p=openpage(b,base);errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  cold=p.evaluate('HonroPortraits.stats()');assert cold['requests']==0,cold
  p.evaluate("""()=>{const api=HonroPortraits;globalThis.HonroPortraits=Object.freeze({...api,mount(...args){const v=api.mount(...args);if(args[3]?.surface==='dialogue')window.actualMount={identity:v?.identity,requested:args[3].portraitExpression,actor:args[1]?.name,cls:args[2]};return v;}});} """)
  for r in ([] if '--consumers-only' in sys.argv else M):
   show(p,cases[r['id']]);p.wait_for_function('document.getElementById("story-portrait-canvas")?.dataset.portraitState==="ready"');mounted=p.evaluate('actualMount');assert mounted['identity']==r['actor']and mounted['requested']==r['variant'],(r,mounted);before=p.evaluate('HonroPortraits.stats()');selected=info(p);after=p.evaluate('HonroPortraits.stats()');assert all(before[k]==after[k] for k in ['requests','decodes','paints','fallbackPaints','vectorBuilds']) and selected['expression']==r['variant'],(r,before,after,selected);audit.append({'id':r['id'],'fixtureExpression':cases[r['id']]['fixtureExpression'],'rowId':cases[r['id']]['line'][2]['rowId'],'mounted':mounted,'selected':selected,'inspectionChangedCounters':False})
   if '--v2' in sys.argv:
    stable=repeat(p);assert stable['paints']==stable['clears']==0 and all(stable['before'][k]==stable['after'][k] for k in ['requests','decodes','paints','fallbackPaints','vectorBuilds']);audit[-1]['repeat120']=stable;checks=p.evaluate("""()=>{const c=document.getElementById('story-portrait-canvas'),r=c.getBoundingClientRect();return {width:r.width,height:r.height,opacity:getComputedStyle(c).opacity,stats:HonroPortraits.stats()}}""");assert checks['width']>0 and checks['height']>0 and checks['stats']['decodedRgbaBytes']<=checks['stats']['budgetBytes'];audit[-1]['visibility']=checks
    if r['id'] in ['hwigyeom-emotion-concern-v2','seoro-action-aim','damheo-scene-steadying','sodan-action-listen','woman-mature-emotion-concern']:
     for w,h in [(390,844),(844,390)]:
      p.set_viewport_size({'width':w,'height':h});p.wait_for_timeout(500);p.screenshot(path=str(OUT/(str(w)+'-'+r['id']+'.jpg')),type='jpeg',quality=90)
     p.set_viewport_size({'width':390,'height':844})
  if audit:(OUT/'mount-audit.json').write_text(json.dumps({'head':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'rows':audit,'cold':cold,'errors':errors,'noDrawPolling':True},ensure_ascii=False,indent=2))
  if '--v2' in sys.argv:
   # Real camp/training consumers deliberately request unchanged base portraits.
   c.close();c,p=openpage(b,base)
   p.evaluate("""()=>{HonroStory.finish(HonroApp);HonroRestJourney.state(HonroApp.profile).restStageId=1;HonroApp.showRest();for(let i=0;HonroApp.dialogue&&i<30;i++)HonroStory.finish(HonroApp);HonroApp.showCamp();}""");p.wait_for_function("[...document.querySelectorAll('.hero-tabs canvas,.summary-identity canvas')].length===5&&[...document.querySelectorAll('.hero-tabs canvas,.summary-identity canvas')].every(c=>c.dataset.portraitState==='ready')");p.screenshot(path=str(OUT/'v2-camp.jpg'),type='jpeg',quality=90)
   p.evaluate('async()=>{await HonroOptionalRuntime.load("training");HonroApp.close();HonroApp.startTraining();}');p.wait_for_selector('.training-dialog');p.wait_for_function("[...document.querySelectorAll('.training-heroes canvas')].length===4&&[...document.querySelectorAll('.training-heroes canvas')].every(c=>c.dataset.portraitState==='ready')");p.screenshot(path=str(OUT/'v2-training.jpg'),type='jpeg',quality=90)
   training=p.evaluate("""()=>{const a=HonroApp,old=[...document.querySelectorAll('.training-heroes canvas')],before=HonroPortraits.stats();for(let i=0;i<5;i++){a.close();HonroTraining.open(a);}return {same:old.every((c,i)=>c===document.querySelectorAll('.training-heroes canvas')[i]),before,after:HonroPortraits.stats()}}""");assert training['same'] and all(training['before'][k]==training['after'][k] for k in ['requests','decodes','paints'])
   p.locator('[data-training-action="hero"][data-value="knight"]').click();p.locator('[data-training-action="apply"]').click();p.wait_for_timeout(200)
   p.evaluate('HonroUnitInfo.show(HonroApp,HonroApp.engine.heroesAlive()[0])');p.wait_for_function('document.querySelector(".unit-info-portrait canvas")?.dataset.portraitState==="ready"');p.locator('.unit-info-portrait').click();p.wait_for_function('document.querySelector(".unit-portrait-image canvas")?.dataset.portraitState==="ready"');p.screenshot(path=str(OUT/'v2-unit-info-large.jpg'),type='jpeg',quality=90)
   (OUT/'consumers.json').write_text(json.dumps({'campReady':5,'trainingReady':4,'trainingRepeat5':training,'unitInfoLargeReady':True,'scope':'fresh browser fixture context; actual modal buttons, normal App frame'},indent=2))


  assert not errors,errors
  c.close();b.close()
 if audit:(OUT/'mount-audit.json').write_text(json.dumps({'head':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'rows':audit,'cold':cold,'errors':errors,'noDrawPolling':True},ensure_ascii=False,indent=2))
 print('PASS',len(audit),'actual story mounts; requested consumer checks complete');sys.exit(0)
rows=[];faults=[]
with serve_game()as base,sync_playwright()as pw:
 b=launch(pw);c,p=openpage(b,base);errors=[];p.on('pageerror',lambda e:errors.append(str(e)));cold=p.evaluate('HonroPortraits.stats()');assert cold['requests']==0,cold
 for r in M:
  show(p,cases[r['id']]);print('checking',r['id'],cases[r['id']]['stage'],flush=True)
  try:exact(p,r['variant'])
  except Exception:
   print('diagnostic',p.evaluate('JSON.stringify({dialogue:HonroApp.dialogue,stats:HonroPortraits.stats()})'),flush=True);raise
  for w,h in [(390,844),(844,390)]:
   p.set_viewport_size({'width':w,'height':h});p.wait_for_timeout(160);v=info(p);checks=p.evaluate('''()=>({buttons:[...document.querySelectorAll('.story-scene button')].every(e=>{const r=e.getBoundingClientRect();return r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight&&(e.disabled||document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===e)}),canvases:document.querySelectorAll('#story-portrait-canvas').length,stats:HonroPortraits.stats()})''');assert checks['buttons']and checks['canvases']==1 and checks['stats']['decodedRgbaBytes']<=checks['stats']['budgetBytes'],checks;rows.append({'id':r['id'],'view':[w,h],'fixtureExpression':cases[r['id']]['fixtureExpression'],'selection':v,**checks});p.screenshot(path=str(OUT/(str(w)+'-'+r['id']+'.jpg')),type='jpeg',quality=93)
 stable=repeat(p);check_repeat(stable)
 # Missing art/typo use the same person's base, without probing guessed URLs.
 unmade=json.loads(json.dumps(seoro));unmade['line'][2]['portraitExpression']='emotion.sorrow';show(p,unmade);exact(p,'base');assert info(p)['fallbackReason']=='unmade';typo=json.loads(json.dumps(seoro));typo['line'][2]['portraitExpression']='emotion.__typo';show(p,typo);exact(p,'base');assert info(p)['fallbackReason']=='unknown-expression'
 # Real browser old save uses two allowed speakers and preserves cursor/metadata.
 p.evaluate('''()=>{const a=HonroApp;HonroStory.start(a,[['설오','옛 저장 첫 줄',{rowId:'legacy-fixture-1'}],['설오','옛 저장 둘째 줄',{rowId:'legacy-fixture-2'}]],{title:'legacy fixture',index:1});HonroStory.save(a);}''');saved=p.evaluate('JSON.stringify(HonroApp.dialogue.lines)');p.reload();p.wait_for_function('window.HonroApp?.screen==="title"');p.evaluate('HonroApp.continue()');p.wait_for_function('HonroApp.dialogue?.index===1');assert p.evaluate('JSON.stringify(HonroApp.dialogue.lines)')==saved
 # Camp and training keep retained approved base canvases after variant churn.
 p.evaluate('''()=>{HonroStory.finish(HonroApp);HonroRestJourney.state(HonroApp.profile).restStageId=1;HonroApp.showRest();for(let i=0;HonroApp.dialogue&&i<30;i++)HonroStory.finish(HonroApp);HonroApp.showCamp();}''');p.wait_for_timeout(350);p.screenshot(path=str(OUT/'camp.jpg'),type='jpeg',quality=92);p.evaluate('HonroApp.close();HonroApp.startTraining()');p.wait_for_selector('.training-dialog');p.wait_for_function("[...document.querySelectorAll('.training-heroes canvas')].length===4&&[...document.querySelectorAll('.training-heroes canvas')].every(c=>c.dataset.portraitState==='ready')");p.screenshot(path=str(OUT/'training.jpg'),type='jpeg',quality=92);assert not errors,errors;c.close()
 # Slow change retains same-person base; a new speaker clears before readiness.
 c,p=openpage(b,base);held=[];otherHeld=[];p.route('**/portrait-seoro-emotion-anger.*.webp',lambda r:held.append(r));p.route('**/portrait-damheo-base.*.webp',lambda r:otherHeld.append(r));show(p,basecase);exact(p,'base');before=pixels(p);show(p,seoro,False);p.wait_for_timeout(180);assert pixels(p)==before and info(p)['state']=='loading';p.screenshot(path=str(OUT/'slow-same-person.jpg'),type='jpeg',quality=92)
 cleared=p.evaluate('''q=>{const a=HonroApp;HonroStory.start(a,[q.line,q.line],{index:0});const c=document.getElementById('story-portrait-canvas');return !c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0);}''',damheo);assert cleared
 for r in otherHeld:r.continue_()
 exact(p,'base');other=pixels(p)
 for r in held:r.continue_()
 p.wait_for_timeout(350);assert pixels(p)==other;faults.append({'mode':'slow/rapid-switch','samePersonRetained':True,'differentPersonCleared':cleared,'lateImageDidNotOverwrite':True});c.close()
 for mode in ['503','404','base404','timeout']:
  c,p=openpage(b,base);hits=[];held=[];fail=True
  def route(r):
   hits.append(r.request.url)
   if fail and mode=='timeout':held.append(r)
   elif fail and (mode!='503'or len(hits)==1):r.fulfill(status=503 if mode=='503'else 404,body='portrait fixture error')
   else:r.continue_()
  p.route('**/portrait-seoro-emotion-anger.*.webp',route)
  if mode=='base404':p.route('**/portrait-seoro-base.*.webp',lambda r:r.fulfill(status=404,body='base fixture error')if fail else r.continue_())
  show(p,seoro)
  if mode=='timeout':p.wait_for_timeout(8150)
  elif mode in ['404','base404']:p.wait_for_timeout(2800)
  else:p.wait_for_timeout(180)
  if mode!='base404':p.wait_for_function('document.getElementById("story-portrait-canvas")?.dataset.portraitState==="ready"',timeout=18000)
  initial=info(p)
  if mode=='base404':assert initial['source']=='neutral'and initial['state']=='error',initial
  elif mode!='503'or len(hits)==1:assert initial['expression']=='base'and initial['fallbackReason']=='network-variant',initial
  if mode in ['404','base404']:
   assert len(hits)==3,hits;check_repeat(repeat(p));p.screenshot(path=str(OUT/(mode+'-fallback.jpg')),type='jpeg',quality=92)
  fail=False
  for r in held:r.continue_()
  if mode in ['404','base404']:p.evaluate('HonroStory.finish(HonroApp)');show(p,seoro)
  exact(p,'emotion.anger');check_repeat(repeat(p));faults.append({'mode':mode,'initial':initial,'recovered':info(p),'physicalVariantRequests':len(hits),'stats':p.evaluate('HonroPortraits.stats()')});c.close()
 b.close()
(OUT/'browser.json').write_text(json.dumps({'head':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'runtimeSha256':hashlib.sha256((ROOT/'shared/runtime/portraits.js').read_bytes()).hexdigest(),'rows':rows,'repeat120':stable,'oldSaveRestored':True,'faults':faults,'errors':errors,'limits':'Production App display/resume-row and network fixtures; no normal campaign completion/physical device claim.'},ensure_ascii=False,indent=2));print('PASS12 real variants/24 UI views, tags/fallbacks,old save,rest/camp/training,slow/503/404/base404/timeout/rapid/reopen,cache-byte/repeat120')
