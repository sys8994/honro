"""Normal build's true Chromium current / exact older static refs / scope negatives. No deploy."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image
import base64,sys,json,io,hashlib
from guard import P, fact, check
D=Path(__file__).resolve().parent;O=json.loads((D/'observer.json').read_bytes())
W=Path(sys.argv[1]);out=W/'out';G=json.loads((out/'GRAPH.json').read_bytes())
ref=P['testedLosslessRefs'];ports={'A':18981,'B':18982}
q={'status':'HOLD','cases':{},'scope':'true browser built normal/continue; old exact fixture browser-produced from verified 3 prior providers in actual official Stage32 state, not a historical user-save'}
def record():(out/'BROWSER.json').write_text(json.dumps(q,indent=2)+'\n')
FIXTURE="""(old)=>{const a=HonroApp,b=structuredClone(a.engine.b), source=HONRO_PROJECT.library;
 if(b.honroStage!==32||b.honroAct4Official!==1||b.honroMapOrigin!=='campaign'||b.honroCustom||b.mode!=='campaign')throw Error('not real canonical Stage32');
 if(old){
  if(old.some(id=>source.filter(x=>x.id===id).length!==1))throw Error('old provider not loaded under original id on A');
  const placement=b.honroLandmarks.find(p=>p.id==='approved32-body'&&p.asset?.id==='act4-handoff:32:body-joined');
  if(!placement)throw Error('missing actual source placement');
  for(const id of old){const asset=source.find(x=>x.id===id);if(asset.collision?.length||asset.interactionType)throw Error('bad archived provider');
    b.honroLandmarks.push({...placement,id:'qa-existing-prior-art:'+id,opacity:0,asset});}
 }
 const saved=HonroProfileStore.compactBattleArt(b);
 return [saved, saved.honroLandmarks.filter(x=>x.id?.startsWith('qa-existing-prior-art:')).map(x=>x.asset)];
}"""
RESUME="""saved=>{const a=HonroApp;
 a.profile.honroBattle=structuredClone(saved);a.profile.honroMapRestart=null;
 a.engine=null;a.continue();
}"""
LIVE="""()=>{
 const b=HonroApp.engine?.b||null;return b?{stage:b.honroStage,round:b.round,phase:b.phase,
  scope:[b.mode,b.honroMapOrigin,b.honroAct4Official,b.honroCustom],
  priorRefs:b.honroLandmarks.filter(l=>l.id?.startsWith('qa-existing-prior-art:')).map(l=>[l.asset.id,!!l.asset.vector,l.opacity]),
  refs:HonroProfileStore.compactBattleArt(b).honroLandmarks.filter(l=>l.id?.startsWith('qa-existing-prior-art:')).map(l=>l.asset)}:null;
}"""
NEGATIVE="""q=>{const b=structuredClone(q),r=b.honroLandmarks.filter(l=>l.id?.startsWith('qa-existing-prior-art:'));
 for(const l of r)l.asset.signature+='0';
 const options=[b,{...q,honroStage:33},{...q,honroCustom:true},{...q,honroMapOrigin:'workshop'},{...q,honroAct4Official:0}];
 return options.map(x=>[HonroProfileStore.needsLegacy32Art(x),HonroProfileStore.restoreBattleArt(structuredClone(x))]);
}"""
def live(br,arm,label,size,func):
 w,h=size;base=f'http://127.0.0.1:{ports[arm]}/';known=G[arm]['active'];need={*G[arm]['required'],'HONRO.html'}
 c=br.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
 p=c.new_page();seen=[];requests=[];errors=[]
 j=q['cases'][label]={'errors':errors};record()
 def link(url):return url.removeprefix(base).split('?',1)[0] if url.startswith(base) else None
 def req(r):
  k=link(r.url)
  if r.url.startswith(('data:','blob:'+base)):return
  if r.method!='GET' or not(k=='HONRO.html' or k in known or (k and k.startswith('assets/bgm/') and r.resource_type=='media')):errors.append(['request',r.method,r.url])
  requests.append(k)
 p.on('request',req)
 p.on('response',lambda r:seen.append(r) if link(r.url) in (need|({G[arm]['legacy']} if G[arm]['legacy'] else set())) else None)
 p.on('pageerror',lambda e:errors.append(['page',str(e)]))
 def routes():
  actual={};archive=G[arm]['legacy']; j['archiveGETs']=requests.count(archive) if archive else 0
  for k in sorted(need|({archive} if archive and j['archiveGETs'] else set())):
   x=next((r for r in seen if link(r.url)==k and r.status==200 and not r.from_service_worker),None)
   check(x,f'missing HTTP body {k}');f=fact(x.body())
   check(f==(G[arm]['shell'] if k=='HONRO.html' else known[k]),f'actual data hash {k}');actual[k]=f
  j['routes']=actual
  j['stageAssetsWire']=sum(actual[k]['bytes'] for k in G[arm]['parts'])
  check(j['stageAssetsWire']==G[arm]['payloadWire'] and not errors,'network capture drift')
 try:
  p.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
  r=p.goto(base+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
  check(r and r.status==200 and r.url==base+'HONRO.html' and not r.from_service_worker,'normal local app served')
  p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  p.evaluate("()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}")
  p.evaluate(O['LAUNCH'],32)
  p.locator('#battlecanvas').wait_for(state='visible')
  p.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim';}""",polling=125,timeout=14000)
  j['decoded']=p.evaluate(O['DECODE'])
  result=func(p,j,requests)
  routes();record()
  return result
 except Exception as e:j['errors'].append(repr(e));record();raise
 finally:c.close()
def frame(p,j,requests):
 params={'id':32,'mapId':'stage-32','name':'south','dx':0,'dy':1,'readback':False,'fixedNow':O['PHASE']}
 meta=p.evaluate(O['FROZEN'],params)['meta'];meta['physics']=hashlib.sha256(meta.pop('signature').encode()).hexdigest();j['meta']=meta
 raw=base64.b64decode(p.evaluate(O['CANVAS']),validate=True)
 dom=p.locator('#battlecanvas').screenshot(animations='disabled',caret='hide',scale='css')
 return [raw,dom,meta]
def fingerprint(raw):
 with Image.open(io.BytesIO(raw))as im:return (list(im.size),hashlib.sha256(im.convert('RGBA').tobytes()).hexdigest())
def current(br,fixtures,arm):
 def go(p,j,r):
  # Before all resume actions the ordinary candidate must not include the old world package.
  check(p.evaluate("(ids)=>ids.every(id=>!HONRO_PROJECT.library.some(a=>a.id===id))",list(ref)),'normal Stage32 has retired asset')
  p.evaluate(RESUME,fixtures['new'])
  p.wait_for_function("()=>HonroApp.engine?.b?.honroStage===32",timeout=20000)
  j['mounted']=p.evaluate(LIVE);check(j['mounted']['round']==fixtures['new']['round'],'new save did not mount actual round')
  check(j['mounted']['refs']==[],'new save mutated into legacy refs')
 live(br,arm,'current-save',(1440,900),go)
 check(q['cases']['current-save']['archiveGETs']==0,'current save fetched legacy')
def scope_cut(br,fixtures):
 def g(p,j,r):
  j['negatives']=p.evaluate(NEGATIVE,fixtures['old'])
  check(j['negatives']==[[False,False]]*5,'scope negative failed before retrieval')
 live(br,'B','invalid-before-archive',(1440,900),g)
 check(q['cases']['invalid-before-archive']['archiveGETs']==0,'untrusted signature or stage fetched archive')
def legacy(br,fixtures):
 def g(p,j,requests):
  j['neededBefore']=p.evaluate("b=>!HonroCampaignLoader.hasBattleArt(b)",fixtures['old'])
  check(j['neededBefore'] and requests.count(G['B']['legacy'])==0,'not a cold exact old save')
  p.evaluate(RESUME,fixtures['old'])
  p.wait_for_function("()=>HonroApp.engine?.b?.honroStage===32&&HonroApp.engine.b.honroLandmarks.filter(l=>l.id?.startsWith('qa-existing-prior-art:')&&l.asset?.vector).length===3",timeout=20000)
  j['mounted']=p.evaluate(LIVE)
  check(j['mounted']['round']==fixtures['old']['round'] and {x['id']:x['signature'] for x in j['mounted']['refs']}==ref,'old true app continue or re-save signatures wrong')
  j['cachedGuards']=p.evaluate(NEGATIVE,fixtures['old'])
  check(j['cachedGuards']==[[False,False]]*5,'wrong scoped ref restored after archive cached')
  check(p.evaluate("(ids)=>ids.every(id=>!HONRO_PROJECT.library.some(a=>a.id===id)&&HONRO_PROJECT.library.some(a=>a.id==='act4compat32:v1:'+id))",list(ref)),'original old id exposed globally')
  p.evaluate("async b=>{await Promise.all([HonroCampaignLoader.ensureBattleArt(b),HonroCampaignLoader.ensureBattleArt(b),HonroCampaignLoader.ensureBattleArt(b)]);}",fixtures['old'])
 live(br,'B','old-save-continue-and-resave',(1440,900),g)
 check(q['cases']['old-save-continue-and-resave']['archiveGETs']==1,'old save fetched zero or multiple exact archives')
record()
try:
 with sync_playwright() as pw:
  br=pw.chromium.launch(headless=True);q['chromium']=br.version
  check(br.version=='151.0.7922.34','browser version drift')
  try:
   for w,h in [(1440,900),(390,844)]:
    pair={}
    for arm in 'AB':
     k=f'normal-{w}x{h}-{arm}';pair[arm]=live(br,arm,k,(w,h),frame)
     for typ,data in zip(('raw','dom'),pair[arm][:2]):(out/f'{k}-{typ}.png').write_bytes(data)
     check(q['cases'][k]['archiveGETs']==0,'fresh launch fetched isolated archive')
    check(pair['A'][2]==pair['B'][2] and all(fingerprint(x)==fingerprint(y) for x,y in zip(pair['A'][:2],pair['B'][:2])),'ordinary normal appearance or physics drift')
   def make(p,j,r):
    old,oldrefs=p.evaluate(FIXTURE,list(ref));new,newrefs=p.evaluate(FIXTURE,None)
    check({x['id']:x['signature'] for x in oldrefs}==ref and not newrefs,'exact old source compact proof')
    j['creatorOldRefs']=oldrefs
    return {'old':old,'new':new}
   saved=live(br,'A','create-signed-witnesses',(1440,900),make)
   current(br,saved,'B');scope_cut(br,saved);legacy(br,saved)
  finally:br.close()
 q['status']='PASS_ACTUAL_NORMAL_NEW_AND_SCOPED_OLD_SAVE_NO_DEPLOY'
except Exception as e:q['error']=repr(e);raise
finally:record()
