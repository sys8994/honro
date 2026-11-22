"""Normal build's true Chromium current / exact older static refs / scope negatives. No deploy."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image
import base64,sys,json,io,hashlib
from guard import P, fact, check
D=Path(__file__).resolve().parent;O=json.loads((D/'observer.json').read_bytes())
W=Path(sys.argv[1]);out=W/'out';G=json.loads((out/'GRAPH.json').read_bytes())
KEY='honro-first-act-profile-1'
ref=P['testedLosslessRefs'];ports={'A':18981,'B':18982}
q={'status':'HOLD','cases':{},'scope':'true browser built normal/continue; old exact fixture browser-produced from verified 3 prior providers in actual official Stage32 state, not a historical user-save'}
def record():(out/'BROWSER.json').write_text(json.dumps(q,indent=2)+'\n')
FIXTURE="""arg=>{const a=HonroApp,b=a.engine.b, source=HONRO_PROJECT.library, old=arg.old;
 if(b.honroStage!==32||b.honroAct4Official!==1||b.honroMapOrigin!=='campaign'||b.honroCustom||b.mode!=='campaign'||a.profileStore.locked)throw Error('not real canonical Stage32');
 const before=b.honroLandmarks;
 try{
  if(old){
   if(old.some(id=>source.filter(x=>x.id===id).length!==1))throw Error('old provider not loaded under original id on A');
   const placement=before.find(p=>p.id==='approved32-body'&&p.asset?.id==='act4-handoff:32:body-joined');
   if(!placement)throw Error('missing actual source placement');
   b.honroLandmarks=[...before,...old.map(id=>{const asset=source.find(x=>x.id===id);
    if(asset.collision?.length||asset.interactionType)throw Error('bad archived provider');
    return {...placement,id:'qa-existing-prior-art:'+id,opacity:0,asset};})];
  }
  if(a.persist()!==true)throw Error('native Stage32 persist failed');
  const text=localStorage.getItem(arg.key), saved=JSON.parse(text).honroBattle;
  if(!saved||saved.honroStage!==32||HonroCampaignMapRevision.obsolete(saved))throw Error('native Stage32 save stamp incorrect');
  return [text, saved.honroLandmarks.filter(x=>x.id?.startsWith('qa-existing-prior-art:')).map(x=>x.asset)];
 }finally{b.honroLandmarks=before;}
}"""
RESUME="""()=>{const a=HonroApp;if(a.profileStore.locked||a.profile.honroBattle?.honroStage!==32||a.engine)throw Error('not cold readable Stage32 local storage');a.frame=()=>{};a.continue();}"""
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
def live(br,arm,label,size,func,storage=None):
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
  if storage is not None:p.add_init_script('localStorage.setItem('+json.dumps(KEY)+','+json.dumps(storage)+');')
  r=p.goto(base+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
  check(r and r.status==200 and r.url==base+'HONRO.html' and not r.from_service_worker,'normal local app served')
  p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  p.evaluate("()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}")
  if storage is None:
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
  p.evaluate(RESUME)
  p.wait_for_function("()=>HonroApp.engine?.b?.honroStage===32",timeout=20000)
  j['mounted']=p.evaluate(LIVE);check(j['mounted']['round']==fixtures['new']['battle']['round'],'new save did not mount actual round')
  check(j['mounted']['refs']==[],'new save mutated into legacy refs')
 live(br,arm,'current-save',(1440,900),go,storage=fixtures['new']['text'])
 check(q['cases']['current-save']['archiveGETs']==0,'current save fetched legacy')
def scope_cut(br,fixtures):
 def g(p,j,r):
  j['negatives']=p.evaluate(NEGATIVE,fixtures['old']['battle'])
  check(j['negatives']==[[False,False]]*5,'scope negative failed before retrieval')
 live(br,'B','invalid-before-archive',(1440,900),g)
 check(q['cases']['invalid-before-archive']['archiveGETs']==0,'untrusted signature or stage fetched archive')
def legacy(br,fixtures):
 def g(p,j,requests):
  j['neededBefore']=p.evaluate("b=>!HonroCampaignLoader.hasBattleArt(b)",fixtures['old']['battle'])
  check(j['neededBefore'] and requests.count(G['B']['legacy'])==0,'not a cold exact old save')
  p.evaluate(RESUME)
  p.wait_for_function("()=>HonroApp.engine?.b?.honroStage===32&&HonroApp.engine.b.honroLandmarks.filter(l=>l.id?.startsWith('qa-existing-prior-art:')&&l.asset?.vector).length===3",timeout=20000)
  j['mounted']=p.evaluate(LIVE)
  check(j['mounted']['round']==fixtures['old']['battle']['round'] and {x['id']:x['signature'] for x in j['mounted']['refs']}==ref,'old true app continue or re-save signatures wrong')
  j['cachedGuards']=p.evaluate(NEGATIVE,fixtures['old']['battle'])
  check(j['cachedGuards']==[[False,False]]*5,'wrong scoped ref restored after archive cached')
  check(p.evaluate("(ids)=>ids.every(id=>!HONRO_PROJECT.library.some(a=>a.id===id)&&HONRO_PROJECT.library.some(a=>a.id==='act4compat32:v1:'+id))",list(ref)),'original old id exposed globally')
  p.evaluate("async b=>{await Promise.all([HonroCampaignLoader.ensureBattleArt(b),HonroCampaignLoader.ensureBattleArt(b),HonroCampaignLoader.ensureBattleArt(b)]);}",fixtures['old']['battle'])
 live(br,'B','old-save-continue-and-resave',(1440,900),g,storage=fixtures['old']['text'])
 check(q['cases']['old-save-continue-and-resave']['archiveGETs']==1,'old save fetched zero or multiple exact archives')
PEER_READ_SAVE="""arg=>{
 const a=HonroApp,b=a.engine?.b;
 if(!b||b.honroStage!==33||b.honroAct4Official!==1||b.honroCustom||b.mode!=='campaign'||a.profileStore.locked)throw Error('not actual saved canonical battle');
 if(a.persist()!==true)throw Error('legitimate native save failed');
 const text=localStorage.getItem(arg.key),p=JSON.parse(text),s=p.honroBattle;
 if(!s||s.honroStage!==33||s.honroAct4Official!==1||s.honroCustom||s.mode!=='campaign'||HonroCampaignMapRevision.obsolete(s))
  throw Error('actual profile revision not valid for canonical resume');
 const refs={};
 for(const x of [s.honroLandmarks,s.honroElements,s.honroEnvironment?.placements]){
  for(const v of x||[]){const a=v.asset;if(arg.ids.includes(a?.id)&&a.honroStaticAssetRef===1){if(refs[a.id]&&refs[a.id]!==a.signature)throw Error('mixed save refs');refs[a.id]=a.signature;}}
 }
 if(arg.ids.some(id=>!refs[id]))throw Error('normal profile writer did not emit both exact static refs');
 return {text,refs,revision:s.honroCampaignMapRevision,terrain:JSON.stringify(s.terrain),units:JSON.stringify(s.units),phase:s.phase,round:s.round};
}"""
PEER_NEG="""arg=>{
 const old=JSON.parse(arg.text).honroBattle,rows=arg.rows;
 const test=(f)=>{const b=structuredClone(old);f(b);const snap=JSON.stringify(b);return !HonroProfileStore.restoreBattleArt(b)&&JSON.stringify(b)===snap;};
 const own=b=>[...b.honroLandmarks||[],...b.honroElements||[],...b.honroEnvironment?.placements||[]].find(x=>x.asset?.id===arg.ids[0]&&x.asset.honroStaticAssetRef===1);
 return {wrongStage:test(b=>b.honroStage=34),wrongPrevious:test(b=>own(b).asset.signature='862760:4666d3c9'),
 custom:test(b=>b.honroCustom=true),workshop:test(b=>b.honroMapOrigin='workshop'),unofficial:test(b=>b.honroAct4Official=0)};
}"""
PEER_BATTLE="""arg=>{
 const a=HonroApp,b=a.engine.b,lib=HONRO_PROJECT.library;
 const sig=a=>{const s=JSON.stringify(a);let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return s.length+':'+(h>>>0).toString(16)};
 const out={};for(const id of arg.ids){const provider=lib.find(a=>a.id===id),items=[...b.honroLandmarks||[],...b.honroElements||[],...b.honroEnvironment?.placements||[]].filter(k=>k.asset?.id===id);
 if(!provider||!items.length)throw Error('missing real imported stage owner '+id);out[id]={current:sig(provider),runtime:items.map(x=>sig(x.asset))};}
 return {stage:b.honroStage,mapId:HONRO_PROJECT.stages.find(x=>x.metadata?.stageId===33)?.id,revision:b.honroCampaignMapRevision,
  expectedRevision:HonroCampaignMapRevision.current(33),terrain:JSON.stringify(b.terrain),units:JSON.stringify(b.units),phase:b.phase,round:b.round,official:b.honroAct4Official,refs:out,locked:a.profileStore.locked,rows:Object.fromEntries(arg.ids.map(id=>[id,HONRO_PREVIOUS_TERRAIN_ART[id]]))};
}"""
def peer33(br):
 h=P['stage33Peer']; ids=list(h['rows']); query={'ids':ids,'key':KEY,'rows':h['rows']}
 pre=json.loads((out/'STAGE33-HISTORIC.json').read_bytes())
 post={k:G['B']['active'][k]for k in G['B']['peer33Required']}
 j=q['cases']['untouched-c60-stage33-continue']={'status':'HOLD'};record()
 def opened(port,paths,storage,callback):
  u=f'http://127.0.0.1:{port}/';rs={};errs=[];requests=[]
  c=br.new_context(viewport={'width':1440,'height':900},device_scale_factor=1,service_workers='block')
  try:
   c.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
   if storage is not None:c.add_init_script('localStorage.setItem('+json.dumps(KEY)+','+json.dumps(storage)+');')
   p=c.new_page()
   p.on('response',lambda r:rs.setdefault(r.url.split('?',1)[0],r))
   p.on('request',lambda r:requests.append(r.url.split('?',1)[0]))
   p.on('pageerror',lambda e:errs.append(str(e)))
   nav=p.goto(u+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
   check(nav and nav.status==200 and not nav.from_service_worker and nav.url==u+'HONRO.html','exact Stage33 normal document')
   check(fact(nav.body())==({k:h['oldShell'][k]for k in ('bytes','sha256')} if port==18983 else G['B']['shell']),'normal Stage33 served shell mismatch')
   p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
   result=callback(p)
   check(not errs and u+G['B']['legacy'] not in requests,'untouched Stage33 browser issues or leakage to Stage32 archive')
   for k,v in paths.items():
    r=rs.get(u+k);check(r and r.status==200 and not r.from_service_worker and fact(r.body())==v,f'Stage33 exact served dependency {k}')
   return result
  finally:c.close()
 def historical(p):
  p.evaluate(O['LAUNCH'],33); old=p.evaluate(PEER_READ_SAVE,query)
  check(old['refs']=={x:y['previous']for x,y in h['rows'].items()},'actual old Stage33 profile refs')
  return old
 old=opened(18983,pre,None,historical)
 j['old']={'refs':old['refs'],'digest':fact(old['text'].encode()),'revision':old['revision']};record()
 def continued(p):
  check(p.evaluate("()=>!HonroApp.profileStore.locked&&!HonroApp.engine&&HonroApp.profile.honroBattle?.honroStage===33"),'old Stage33 storage not cold')
  p.evaluate("()=>{HonroApp.frame=()=>{};HonroApp.continue();}")
  p.wait_for_function("()=>HonroApp.engine?.b?.honroStage===33&&HonroApp.engine.b.honroAct4Official===1",timeout=20000)
  b=p.evaluate(PEER_BATTLE,query)
  neg=p.evaluate(PEER_NEG,{**query,'text':old['text']}); check(all(neg.values()),'retained Stage33 negative regression')
  check(b['mapId']=='stage-33' and b['revision']==b['expectedRevision']==old['revision'] and b['official']==1 and not b['locked'] and b['rows']==h['rows'],'actual Stage33 owner/revision drift')
  check(all(b[i]==old[i] for i in ('terrain','units','phase','round')),'actual old Stage33 did not resume same physical battle')
  check(all(b['refs'][i]['current']==y['current'] and all(k==y['current']for k in b['refs'][i]['runtime'])for i,y in h['rows'].items()),'actual old Stage33 resumed with stale art')
  return {'stage':b['stage'],'revision':b['revision'],'round':b['round'],'phase':b['phase'],'negative':neg,'refs':b['refs'],'terrain':fact(b['terrain'].encode()),'units':fact(b['units'].encode())}
 j['continue']=opened(18982,post,old['text'],continued);j['status']='PASS';record()

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
    new,newrefs=p.evaluate(FIXTURE,{'old':None,'key':KEY});old,oldrefs=p.evaluate(FIXTURE,{'old':list(ref),'key':KEY})
    check({x['id']:x['signature'] for x in oldrefs}==ref and not newrefs,'exact old source compact proof')
    j['creatorOldRefs']=oldrefs
    j['saveDigest']={'old':fact(old.encode()),'current':fact(new.encode())}
    return {k:{'text':v,'battle':json.loads(v)['honroBattle']}for k,v in [('old',old),('new',new)]}
   saved=live(br,'A','create-signed-witnesses',(1440,900),make)
   current(br,saved,'B');scope_cut(br,saved);legacy(br,saved);peer33(br)
  finally:br.close()
 q['status']='PASS_ACTUAL_NORMAL_NEW_AND_SCOPED_OLD_SAVE_NO_DEPLOY'
except Exception as e:q['error']=repr(e);raise
finally:record()
