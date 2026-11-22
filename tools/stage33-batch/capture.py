"""Real canonical 'save old art -> cold load -> continue' with disposable browser storage only."""
import base64,hashlib,json,math,sys,urllib.request
from pathlib import Path
from urllib.parse import urlsplit
from guard import P,need,rd,fact,sha,sv
D=Path(__file__).resolve().parent;O=json.loads(rd(D,'observer.json'))
A=None; B=None; CUR='https://sys8994.github.io/honro/'
KEY='honro-first-act-profile-1'
SIG="""a=>{const s=JSON.stringify(a);let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return s.length+':'+(h>>>0).toString(16)}"""
READ_SAVE="""arg=>{
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
NEG="""arg=>{
 const old=JSON.parse(arg.text).honroBattle,rows=arg.rows;
 const test=(f)=>{const b=structuredClone(old);f(b);const snap=JSON.stringify(b);return !HonroProfileStore.restoreBattleArt(b)&&JSON.stringify(b)===snap;};
 const own=b=>[...b.honroLandmarks||[],...b.honroElements||[],...b.honroEnvironment?.placements||[]].find(x=>x.asset?.id===arg.ids[0]&&x.asset.honroStaticAssetRef===1);
 return {wrongStage:test(b=>b.honroStage=34),wrongPrevious:test(b=>own(b).asset.signature='862760:4666d3c9'),
 custom:test(b=>b.honroCustom=true),workshop:test(b=>b.honroMapOrigin='workshop'),unofficial:test(b=>b.honroAct4Official=0)};
}"""
BATTLE="""arg=>{
 const a=HonroApp,b=a.engine.b,lib=HONRO_PROJECT.library;
 const sig=a=>{const s=JSON.stringify(a);let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return s.length+':'+(h>>>0).toString(16)};
 const out={};for(const id of arg.ids){const provider=lib.find(a=>a.id===id),items=[...b.honroLandmarks||[],...b.honroElements||[],...b.honroEnvironment?.placements||[]].filter(k=>k.asset?.id===id);
 if(!provider||!items.length)throw Error('missing real imported stage owner '+id);out[id]={current:sig(provider),runtime:items.map(x=>sig(x.asset))};}
 return {stage:b.honroStage,mapId:HONRO_PROJECT.stages.find(x=>x.metadata?.stageId===33)?.id,revision:b.honroCampaignMapRevision,
  expectedRevision:HonroCampaignMapRevision.current(33),terrain:JSON.stringify(b.terrain),units:JSON.stringify(b.units),phase:b.phase,round:b.round,official:b.honroAct4Official,refs:out,locked:a.profileStore.locked,rows:Object.fromEntries(arg.ids.map(id=>[id,HONRO_PREVIOUS_TERRAIN_ART[id]]))};
}"""
ART33="""
arg=>{
 const K='act4-sideview:33:coastal-v2:lowland',D=K+'-deep-strata',b=arg.input?JSON.parse(arg.input).honroBattle:HonroApp.engine.b;
 const arrays=[b.honroElements,b.honroLandmarks];const result={copies:arrays.map(l=>l.filter(e=>e.id===D||e.asset?.id===D).length)};
 const sig=a=>{const s=JSON.stringify(a);let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return s.length+':'+(h>>>0).toString(16);};
 result.protectedPhysicalDigest=sig([b.terrain,b.honroWorldTerrain,b.honroPlayBounds,b.honroTerrainBounds,b.units,b.honroObjectives,b.honroCampaignMapRevision,b.phase,b.round]);
 if(arg.type==='old')return result;
 result.exact=arrays.every((l,i)=>{
  const n=l.findIndex(e=>e.id===D),e=l[n],a=e?.asset;
  return result.copies[i]===1&&l[n+1]?.id===K&&e.assetId===D&&e.kind==='canonical-element'&&e.x===0&&e.y===0&&e.scale===1&&e.rotation===0&&e.snap===false&&
    e.depthLayer==='L1'&&e.nativeArtLayer==='surface'&&e.layer==='mid'&&Array.isArray(e.collisionIds)&&!e.collisionIds.length&&
    (arg.type==='saved'?a?.honroStaticAssetRef===1&&a.id===D&&a.signature==='5555:6b3d7631':a?.vector?.version===1&&a.id===D&&sig(a)==='5555:6b3d7631'&&!a.interactionType&&Array.isArray(a.collision)&&!a.collision.length);
 });
 if(arg.type==='mounted'){
  const clone=structuredClone(b),old=JSON.stringify(clone);result.idempotent=HonroProfileStore.restoreBattleArt(clone)&&JSON.stringify(clone)===old;
  result.stateDigest=sig([b.terrain,b.units,b.honroObjectives,b.honroState,b.honroWorldTerrain,b.phase,b.round,b.honroCampaignMapRevision]);
 }
 return result;
}
"""
NEG33="""
arg=>{
 const old=JSON.parse(arg.old).honroBattle,current=JSON.parse(arg.current).honroBattle,k='act4-sideview:33:coastal-v2:lowland',d=k+'-deep-strata';
 const p=b=>b.honroElements.find(x=>x.id===k);
 const deny=f=>{const b=structuredClone(old);f(b);const s=JSON.stringify(b);return !HonroProfileStore.restoreBattleArt(b)&&JSON.stringify(b)===s;};
 return {
  wrong2c4Token:deny(b=>p(b).asset.signature='728197:c76800ed'),
  wrongLowPlacement:deny(b=>p(b).x=1),
  duplicateLow:deny(b=>b.honroElements.push(structuredClone(p(b)))),
  alreadyExistsBoth:deny(b=>{for(const key of ['honroElements','honroLandmarks'])b[key].splice(8,0,structuredClone(current[key].find(v=>v.id===d)));}),
  wrongDeepPlacement:deny(b=>{const e=structuredClone(current.honroElements.find(v=>v.id===d));e.y=1;b.honroElements.push(e);}),
  lateInvalidAtomic:deny(b=>b.honroLandmarks.push({asset:{honroStaticAssetRef:1,id:'missing-r6-fixture',signature:'1:bad'}}))
 };
}
"""
COMMON=r"""
 const collections=b=>[b.honroLandmarks,b.honroElements,b.honroEnvironment?.placements];
 const own=(b,arg)=>collections(b).flatMap(q=>(q||[]).filter(x=>arg.ids.includes(x.asset?.id)));
 const valid=(b,n)=>Boolean(b&&b.honroStage===n&&b.honroCanonical===true&&b.honroCustom===false&&b.honroMapOrigin==='campaign'&&b.mode==='campaign'&&(n===40?b.honroAct4Official===1:b.honroAct5===1));
 const sig=a=>{const s=JSON.stringify(a);let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return s.length+':'+(h>>>0).toString(16)};
 const content=b=>({terrain:JSON.stringify(b.terrain),units:JSON.stringify(b.units),objective:JSON.stringify([b.honroObjectives,b.objectives,b.honroQuestTargets,b.honroGoalState,b.honroEncounterState]),phase:b.phase,round:b.round,
   revision:b.honroCampaignMapRevision??null,handled:collections(b).map(a=>(a||[]).filter(x=>x.asset?.id).map(({asset,...keep})=>[asset.id,keep]))});
"""
PERSIST='arg=>{'+COMMON+r"""
 const a=HonroApp;let b=a.engine?.b;
 if(!valid(b,arg.stage)||a.profileStore.locked)throw Error('no legitimate exact native battle');
 if(a.persist()!==true)throw Error('normal save refused');
 const source=localStorage.getItem(arg.key),saved=JSON.parse(source),s=saved.honroBattle;
 if(!valid(s,arg.stage)||HonroCampaignMapRevision.obsolete(s))throw Error('actual persisted battle not saved/campaign obsolete');
 const list=own(s,arg);const rows={};for(const v of list){
   const a=v.asset;if(a.honroStaticAssetRef!==1)throw Error('target live owner did not compact into approved provider ref');
   if(rows[a.id]&&rows[a.id]!==a.signature)throw Error('one asset resolved multiple signatures');rows[a.id]=a.signature;
 }
 if(arg.ids.some(k=>!rows[k]))throw Error('missing actual old provider refs');
 return {text:source,refs:rows,state:content(s),placementOwners:list.length};
}"""
CHECK='arg=>{'+COMMON+r"""
 const a=HonroApp,b=a.engine?.b;
 if(!valid(b,arg.stage)||a.profileStore.locked)throw Error('actual app did not mount a canonical saved battle');
 const rows={};for(const k of arg.ids){const source=HONRO_PROJECT.library.filter(r=>r.id===k);if(source.length!==1)throw Error('nonunique live provider');
   const l=own(b,arg).filter(i=>i.asset.id===k);
   if(!l.length)throw Error('absent restored live provider');rows[k]={current:sig(source[0]),rendered:l.map(i=>sig(i.asset))};
 }
 const r33=Object.fromEntries(Object.keys(arg.rows33).map(k=>[k,HONRO_PREVIOUS_TERRAIN_ART[k]]));
 return {state:content(b),rows,r33};
}"""
def seed_script(url,shell,payload):
 wanted=urlsplit(url+shell)
 parsed_origin=f'{wanted.scheme}://{wanted.netloc}'
 need(wanted.scheme in ('http','https') and wanted.netloc and not wanted.username and not wanted.password and not wanted.query and not wanted.fragment,'invalid exact seed URL')
 return 'if(window===window.top&&location.origin==='+json.dumps(parsed_origin)+'&&location.pathname==='+json.dumps(wanted.path)+'){localStorage.setItem('+json.dumps(KEY)+','+json.dumps(payload)+');}'
def request(url,p):
 req=urllib.request.Request(url,headers={'Accept-Encoding':'identity','User-Agent':'Mozilla/5.0 HONRO no-deploy observer'})
 with urllib.request.urlopen(req,timeout=45)as r:
  need(r.status==200 and r.geturl()==url and fact(r.read(p['bytes']+1))==p,('wrong direct served body',url))
 return p
def fullWorkshop(br,root,expected):
 w=P['jointWorkshop'];c=br.new_context(viewport={'width':1440,'height':900},device_scale_factor=1,service_workers='block')
 try:
  need(c.storage_state()=={'cookies':[],'origins':[]},'Workshop start context not clean')
  p=c.new_page();seen={};requests=[];errors=[]
  p.on('pageerror',lambda e:errors.append(str(e)))
  p.on('request',lambda r:requests.append(r.url.split('?',1)[0]))
  p.on('response',lambda r:seen.setdefault(r.url.split('?',1)[0],r))
  url=root+'HONRO_WORKSHOP.html';nav=p.goto(url,wait_until='domcontentloaded',timeout=50000)
  need(nav and nav.url==url and nav.status==200 and not nav.from_service_worker and fact(nav.body())==expected['shell'],'full native Workshop shell not exact')
  p.wait_for_function("()=>window.HONRO_READY instanceof Promise&&window.HONRO_PROJECT_MODE==='full'",timeout=90000)
  p.evaluate("()=>Promise.race([HONRO_READY,new Promise((_,reject)=>setTimeout(()=>reject(Error('Workshop ready deadline')),150000))])")
  mounted=p.evaluate("""ids=>{
   const p=HONRO_PROJECT;if(!p||p.stages.length!==50||p.stages.some(s=>s.pending))throw Error('missing full native chapter');
   const mac=a=>{const s=JSON.stringify(a);let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return s.length+':'+(h>>>0).toString(16);};
   const all=p.library.map(a=>a.id);
   return {refs:Object.fromEntries(ids.map(id=>{const m=p.library.filter(x=>x.id===id);if(m.length!==1)throw Error('legacy owner absent or duplicate');return [id,mac(m[0])];})),allIds:all,hasNamespace:all.some(id=>id.startsWith('act4compat32:v1:')),mapIds:p.stages.map(si=>si.id)};
  }""",list(w['originalProviderSignatures']))
  need(mounted['refs']==w['originalProviderSignatures'] and not mounted['hasNamespace'] and not errors,'Workshop original provider signatures or namespace drift')
  def digest(x):return sha(json.dumps(x,ensure_ascii=False,separators=(',',':')).encode())
  original=[i for i in mounted['allIds'] if i!=w['soleNewId']]
  need(mounted['allIds'].count(w['soleNewId'])==1 and len(mounted['allIds'])==w['libraryLength'] and len(mounted['mapIds'])==w['mapLength'] and digest(original)==w['libraryIdsSHA256'] and digest(mounted['mapIds'])==w['mapIdsSHA256'],'original full Workshop ordering or only allowed new Stage7 provider changed')
  routes={}
  for k,v in expected['routes'].items():
   r=seen.get(root+k); need(r and r.status==200 and not r.from_service_worker and fact(r.body())==v,('Workshop exact active bytes missing',k));routes[k]=v
  archiveCount=requests.count(root+expected['archive'])
  need(archiveCount==w['archiveGETs'],'Workshop must request original complete archive exactly once')
  return {'status':'PASS','stage7NewIndex':mounted['allIds'].index(w['soleNewId']),'stage7NewId':w['soleNewId'],'fullLibraryLength':len(mounted['allIds']),'fullMapLength':len(mounted['mapIds']),'originalProviderSignatures':mounted['refs'],'archiveGETs':archiveCount,'libraryIdsSHA256':digest(mounted['allIds']),'mapIdsSHA256':digest(mounted['mapIds']),'routes':routes}
 finally:c.close()
LOCK7="""()=>{const b=HonroApp.engine.b,s=(b.honroLandmarks||[]).find(x=>x.asset?.id==='act1-site:7:body'),m=HonroTerrainDomain.materialLandmarks(b).find(x=>x.asset?.id==='act1-site:7:body');if(!s||!m)throw Error('No authored Stage7 vertical owner');return {id:s.id,provider:JSON.stringify(s.asset),physicalUnregistered:JSON.stringify([b.honroWorldTerrain,b.honroPlayBounds,b.honroTerrainBounds,b.honroLandmarks.map(z=>[z.id,z.scale,z.x,z.y,z.collisionIds])]),materialDifferent:s!==m,height:m.asset.bounds.h,usesOldFiller:m.asset.vector.root.children.some(z=>z.clipPath==='site-edge-2'),exactOldBaseUnwrapped:s.asset.vector.root.children[0]===m.asset.vector.root.children[0],activeFacies:m.asset.vector.root.children.filter(z=>z.clipPath==='stage7R7Facies').length};}"""
def nativeStage7(open,proof,q,save,G):
 p7=P['stage7'];O7=O['STAGE7'];r=q['stage7']={};save()
 def raw(p):
  return p.evaluate('''()=>{const a=HonroApp;if(a.debugMode||a.training||a.engine?.b?.mode!=='campaign'||a.engine?.b?.honroStage!==7)throw Error('ordinary Stage7 UI save unavailable');a.showTitle();const s=localStorage.getItem('honro-first-act-profile-1'),p=JSON.parse(s||'null');if(p?.honroBattle?.honroStage!==7||a.profileStore.locked)throw Error('Stage7 UI persistence missing');return s;}''')
 def model(p,needs7):
  p.locator('#battlecanvas').wait_for(state='visible')
  p.wait_for_function("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return a.engine?.b?.honroStage===7&&document.getElementById('turn-banner')?.hidden!==false;}",polling=125,timeout=14000)
  x=p.evaluate(LOCK7)
  facts={k:fact(x[k].encode())for k in ('provider','physicalUnregistered')}
  need(facts==p7['model'],'authentic Stage7 original provider or physical role changed')
  need((x['activeFacies']==1 and x['exactOldBaseUnwrapped'] and x['materialDifferent'] and not x['usesOldFiller'])if needs7 else (x['activeFacies']==0 and x['usesOldFiller']),'actual Stage7 owner registration does not match original or currently qualified art')
  return {'originalScope':facts,'activeFacies':x['activeFacies'],'usesOldFiller':x['usesOldFiller']}
 def saved(t):
  need(p7['knownAsset'] not in t and 'r7FaciesAssetId' not in t,'render-only art leaked into user-format Stage7 save')
  return json.loads(t)['honroBattle']
 def stateMatch(x,y,full=False):
  a,b=map(saved,(x,y))
  ks=('honroWorldTerrain','honroPlayBounds','honroTerrainBounds','honroMap','honroLandmarks','honroElements')
  if full:ks+=('terrain','units','honroObjectives','phase','round')
  return all(a.get(k)==b.get(k)for k in ks)
 snaps={};r['sources']={};r['nativeB']={}
 for label,u,shell,routes,sh,needs7 in [
   ('old0b9',A,'OLD-0B9.html',p7['oldRoutes'],{k:p7['oldShell'][k]for k in ('bytes','sha256')},False),
   ('currentLiveStage7',CUR,'HONRO.html',G['game7']['A']['routes'],G['game7']['A']['shell'],True)]:
  c,p,net,err,nav=open(u,shell=shell,observer=O7)
  try:
   need(fact(nav.body())==sh,'authentic historic/current Stage7 shell changed')
   p.evaluate(O7['LAUNCH'],7);v=model(p,needs7)
   x=raw(p);saved(x);snaps[label]=x
   r['sources'][label]={'profile':fact(x.encode()),'model':v,'routes':proof(net,u,routes)}
   need(not err,'Stage7 original actual App error');save()
  finally:c.close()
 for label,x in snaps.items():
  control=None;r['nativeB'][label]={}
  for arm,u in [('A',CUR),('B',B)]:
   c,p,net,err,nav=open(u,x,observer=O7)
   try:
    need(fact(nav.body())==G['game7'][arm]['shell'] and p.evaluate("key=>localStorage.getItem(key)",KEY)==x and p.evaluate("()=>!HonroApp.engine&&!HonroApp.profileStore.locked"),'Stage7 input must be unopened and exact')
    p.evaluate("()=>{HonroApp.frame=()=>{};}")
    p.locator('[data-action="continue"]').first.click(timeout=15000)
    p.wait_for_function("()=>HonroApp.engine?.b?.honroStage===7&&!!HonroApp.scene",timeout=22000)
    v=model(p,True);y=raw(p)
    need(stateMatch(x,y) and not err,'live Stage7 original maps, placement or save provider mismatch')
    if arm=='A':control=y
    else:need(stateMatch(control,y,True),'candidate Stage7 units/objectives/round or provider differs from same-phase actual public')
    r['nativeB'][label][arm]={'status':'PASS_COLD_VISIBLE_AND_NATIVE_RESAVE','model':v,'resaved':fact(y.encode()),'routes':proof(net,u,G['game7'][arm]['routes'])};save()
   finally:c.close()
 r['status']='PASS_ACTUAL_0B9_AND_NEW_STAGE7_COLD_AND_RESAVE';save()
def main(w):
 from playwright.sync_api import sync_playwright
 out=w;S=json.loads(rd(out,'SOURCE.json'));G=json.loads(rd(out,'GRAPH.json'))
 q={'status':'HOLD','old':{},'runs':{},'peerHTTP':{}}
 def save():sv(w,'BROWSER.json',q)
 save()
 try:
  q['exactPublicJoint']=request(CUR+'web/manifest.json',{k:P['manifest'][k]for k in ('bytes','sha256')})
  q['qualifiedJoint']={k:{'current':request(CUR+k,v),'candidate':request(B+k,v)}for k,v in G['protectedJoint'].items()}
  for id,rr in G['peers'].items():
   q['peerHTTP'][id]={k:{'current':request(CUR+k,v),'candidate':request(B+k,v)}for k,v in rr.items()}
  save()
  ids=list(P['rows'])
  def state(app):
   a={k:app[k]for k in ('stage','mapId','revision','expectedRevision','phase','round','official','refs','locked','rows')}
   a['terrainSha']=sha(app['terrain'].encode());a['unitsSha']=sha(app['units'].encode());return a
  with sync_playwright() as k:
   br=k.chromium.launch(headless=True);q['browser']=br.version;need(br.version=='151.0.7922.34','wrong browser fixture')
   def open(url,text=None,shell='HONRO.html',device='PC',observer=None):
    w,h=(1440,900)if device=='PC'else (390,844)
    c=br.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
    need(c.storage_state()=={'cookies':[],'origins':[]},'QA context not clean')
    opts=observer or O
    c.add_init_script('('+opts['INIT']+')();'+opts['INIT_SEED'])
    if text is not None:c.add_init_script(seed_script(url,shell,text))
    p=c.new_page(); rs={}; errors=[]
    p.on('response',lambda r:rs.setdefault(r.url.split('?',1)[0],r));p.on('pageerror',lambda e:errors.append(str(e)))
    nav=p.goto(url+shell,wait_until='domcontentloaded',timeout=50000)
    need(nav and nav.status==200 and nav.url==url+shell and not nav.from_service_worker,'actual shell not loaded')
    p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
    return c,p,rs,errors,nav
   def proof(rs,url,expected):
    data={}
    for path,k in expected.items():
     z=rs.get(url+path);need(z and z.status==200 and not z.from_service_worker,('native URL not loaded',path));data[path]=fact(z.body());need(data[path]==k,('native body mismatch',path))
    return data
   def shot(p,label):
    args={'id':33,'mapId':'stage-33','name':'east','dx':1,'dy':0,'readback':False,'fixedNow':O['PHASE']}
    pose=p.evaluate(O['FROZEN'],args)['meta']; p.evaluate(O['DECODE']); p.evaluate(O['FROZEN'],{**args,'readback':True})
    raw=base64.b64decode(p.evaluate(O['CANVAS']),validate=True);name=f'{label}-raw.png';(out/name).write_bytes(raw)
    return dict(raw=fact(raw),png=name,pose={k:pose[k]for k in ('actual','viewport','backing')})
   def paused(page):
    page.evaluate("()=>{const a=HonroApp;a.frame=()=>{};a.close();HonroStoryFraming.clear(a.scene);}")
   c,p,net,err,nav=open(A)
   try:
    p.evaluate(O['LAUNCH'],33)
    old=p.evaluate(READ_SAVE,{'key':KEY,'ids':ids})
    need(old['refs']=={i:r['previous']for i,r in P['rows'].items()},'not witnessed old compacted static signatures')
    q['old']={'save':fact(old['text'].encode()),'refs':old['refs'],'revision':old['revision'],'terrainSha':sha(old['terrain'].encode()),'unitsSha':sha(old['units'].encode()),'routes':proof(net,A,S['oldRoutes']),'shell':fact(nav.body()),'errors':err}
    need(q['old']['shell']=={k:P['oldShell'][k]for k in ('bytes','sha256')} and not err,'old genuine App had errors')
    q['old']['capture']=shot(p,'old-c60-generated-save');save()
   finally:c.close()
   # Generate native historical saves in separate, fresh devices and independently reproduce live rejection.
   oldDevice={};q['old2c4']={};q['publicJointSeed']={};q['publicJointRejection']={}
   for device in ('PC','M'):
    c,p,net,err,nav=open(A,shell='OLD-2C4.html',device=device)
    try:
     p.evaluate(O['LAUNCH'],33)
     older=p.evaluate(READ_SAVE,{'key':KEY,'ids':ids})
     old_expect=P['legacy2c4Refs']
     need(older['refs']==old_expect and older['revision']==5,'not original 2c4 real compact save')
     q['old2c4'][device]={'save':fact(older['text'].encode()),'refs':older['refs'],'revision':older['revision'],
       'terrainSha':sha(older['terrain'].encode()),'unitsSha':sha(older['units'].encode()),'routes':proof(net,A,S['2c4Routes']),
       'shell':fact(nav.body()),'errors':err,'capture':shot(p,'old-2c4-generated-save-'+device)}
     need(q['old2c4'][device]['shell']=={k:S['2c4Shell'][k]for k in ('bytes','sha256')} and not err,'2c4 original app/shell differed')
     oldDevice[device]=older;save()
    finally:c.close()
    c,p,net,err,nav=open(CUR,older['text'],device=device)
    try:
     seen=p.evaluate("key=>localStorage.getItem(key)",KEY)
     q['publicJointSeed'][device]={'origin':p.evaluate('()=>location.origin'),'navPath':p.evaluate('()=>location.pathname'), 'input':fact(older['text'].encode()),'stored':fact(seen.encode())if seen is not None else None}
     save()
     need(seen==older['text'],'genuine 2c4 profile bytes not present in public before Continue')
     p.evaluate("()=>{HonroApp.frame=()=>{};HonroApp.continue();}")
     try:
      p.wait_for_function("()=>document.getElementById('notice')?.textContent?.includes('저장된 장의 그림 자료를 불러오지 못했습니다.')",timeout=12000)
     except Exception:
      q['publicJointUnexpected-'+device]=p.evaluate("()=>({notice:document.getElementById('notice')?.textContent??null,stage:HonroApp.engine?.b?.honroStage??null,locked:HonroApp.profileStore.locked})");save();raise
     rec=p.evaluate("key=>({locked:HonroApp.profileStore.locked,notMounted:HonroApp.engine==null,bytesIntact:localStorage.getItem(key),notice:document.getElementById('notice').textContent})",KEY)
     need(rec['notMounted'] and rec.pop('bytesIntact')==older['text'] and not err,'current official rejection and original bytes not witnessed')
     q['publicJointRejection'][device]={**rec,'routes':proof(net,CUR,G['peers']['33']),'savedBytesUnchanged':True}
     p.screenshot(path=str(out/('public-joint-2c4-native-block-'+device+'.png')));save()
    finally:c.close()
   # Fresh real installed package validates current saves separately from the old replay.
   c,p,net,err,nav=open(B)
   try:
    p.evaluate(O['LAUNCH'],33)
    cur=p.evaluate(READ_SAVE,{'key':KEY,'ids':ids})
    need(cur['refs']=={i:r['current']for i,r in P['rows'].items()},'fresh current art signatures changed')
    q['fresh']={'save':fact(cur['text'].encode()),'refs':cur['refs'],'revision':cur['revision'],'capture':shot(p,'candidate-fresh33'),'errors':err};need(not err,'fresh normal app errors');save()
   finally:c.close()
   q['coldResave']={};resaved={}
   for name,u,snapshot,device in [('candidate2c4',B,oldDevice['PC'],'PC'),('candidate2c4Mobile',B,oldDevice['M'],'M'),('candidateC60',B,old,'PC'),('candidateFresh',B,cur,'PC')]:
    c,p,net,err,nav=open(u,snapshot['text'],device=device)
    try:
     need(p.evaluate("()=>!HonroApp.profileStore.locked&&!HonroApp.engine&&HonroApp.profile.honroBattle?.honroStage===33"),'cold normal storage could not read legitimate saved battle')
     need(p.evaluate("key=>localStorage.getItem(key)",KEY)==snapshot['text'],'native B exact input bytes missing')
     sourceScope=p.evaluate(ART33,{'input':snapshot['text'],'type':'old'})
     if name.startswith('candidate2c4'):need(sourceScope['copies']==[0,0],'genuine old scope already contains new deep art')
     p.evaluate("()=>{HonroApp.frame=()=>{};HonroApp.continue();}")
     p.wait_for_function("()=>HonroApp.engine?.b?.honroStage===33&&HonroApp.engine.b.honroAct4Official===1",timeout=12000)
     paused(p);b=p.evaluate(BATTLE,{'ids':ids})
     a33=p.evaluate(ART33,{'type':'mounted'})
     need(a33['copies']==[1,1] and a33['exact'] and a33['idempotent'],'native post-restore deep art missing, altered or duplicated')
     need(a33['protectedPhysicalDigest']==sourceScope['protectedPhysicalDigest'],'old true collision/world/units/objectives changed along with art')
     status=state(b); q['runs'][name]={'status':'CAPTURED','battle':status,'strata':a33,'errors':err,'capture':shot(p,name)}
     save()
     need(b['mapId']=='stage-33' and b['revision']==b['expectedRevision']==snapshot['revision'] and b['official']==1 and not b['locked'] and b['rows']==P['rows'],'actual revision or exact registry runtime mismatch')
     need(b['terrain']==snapshot['terrain'] and b['units']==snapshot['units'] and b['phase']==snapshot['phase'] and b['round']==snapshot['round'],'restored physical battle or actors changed, not a true resume')
     need(all(b['refs'][i]['current']==row['current'] and all(x==row['current']for x in b['refs'][i]['runtime'])for i,row in P['rows'].items()),'restored native field did not resolve to exact current provider')
     expected={P['map']:G['peers']['33'][P['map']],P['newPacket']:G['peers']['33'][P['newPacket']],G['newCommon']:G['sha']}
     q['runs'][name]['routes']=proof(net,u,expected);need(not err,'normal restored App errors')
     if name in ('candidate2c4','candidate2c4Mobile','candidateC60'):
      neg=p.evaluate(NEG,{'text':snapshot['text'],'ids':ids,'rows':P['rows']});q.setdefault('negativeControls',{})[name]=neg;need(all(neg.values()),'wrong prior token or owner state accepted')
     visual=q['runs'][name]['capture']
     need(visual['raw']==P['knownCurrentPC' if device=='PC' else 'rawMobile33'],'actual resumed normal visual regression')
     if device=='M':need(visual['pose']==P['poseMobile33'],'unexpected native 2c4 mobile render pose')
     if name.startswith('candidate2c4'):
      need(p.evaluate("key=>localStorage.getItem(key)",KEY)==snapshot['text'],'restore mutated storage before normal save')
      extra=p.evaluate(NEG33,{'old':snapshot['text'],'current':cur['text']})
      q['negativeControls'][name]['mountOnlyScoped']=extra
      need(all(extra.values()),'2c4 misplaced/mixed/duplicate source did not fail atomically')
      written=p.evaluate(READ_SAVE,{'key':KEY,'ids':ids})
      compact=p.evaluate(ART33,{'input':written['text'],'type':'saved'})
      need(compact['exact'] and compact['copies']==[1,1] and written['refs']=={i:r['current']for i,r in P['rows'].items()},'actual normal resave did not compact exact current providers')
      need(all(written[k]==snapshot[k]for k in ('terrain','units','phase','round','revision')),'persist changed old battle progress')
      q['coldResave'][device]={'originalStorageBeforeRealSave':fact(snapshot['text'].encode()),'persisted':fact(written['text'].encode()),'compact':compact};resaved[device]=written
     q['runs'][name]['status']='PASS';save()
    finally:c.close()
   for device in ('PC','M'):
    old=oldDevice[device];w2=resaved[device]
    c,p,net,err,nav=open(B,w2['text'],device=device)
    try:
     need(p.evaluate("key=>localStorage.getItem(key)",KEY)==w2['text'] and p.evaluate("()=>!HonroApp.engine&&!HonroApp.profileStore.locked"),'real current resave did not start cold on second launch')
     p.evaluate("()=>{HonroApp.frame=()=>{};HonroApp.continue();}")
     p.wait_for_function("()=>HonroApp.engine?.b?.honroStage===33&&HonroApp.engine.b.honroAct4Official===1",timeout=12000)
     paused(p)
     b=p.evaluate(BATTLE,{'ids':ids});z=p.evaluate(ART33,{'type':'mounted'})
     need(z['exact'] and z['idempotent'] and z['copies']==[1,1] and z['stateDigest']==q['runs']['candidate2c4' if device=='PC' else 'candidate2c4Mobile']['strata']['stateDigest'],'real fresh cold load changed previously restored layout or physical state')
     need(all(b[k]==old[k]for k in ('terrain','units','phase','round','revision')) and b['rows']==P['rows'] and not err,'current cold changed actual gameplay or accepted tokens')
     v=shot(p,'candidate-second-cold-'+device)
     need(v['raw']==P['knownCurrentPC' if device=='PC' else 'rawMobile33'],'real second cold image mismatch')
     route={**G['peers']['33'],G['protectedProfile']:G['protectedProfileBody'],G['newCommon']:G['sha']}
     q['coldResave'][device].update(status='PASS',secondCold=z,capture=v,routes=proof(net,B,route));save()
    finally:c.close()
   # Genuine unchanged released Stage40 old/current and Stage46 current at the same exact profile engine.
   q['compatPeers']={}
   for nid in (40,46):
    witness=P['compatWitness'][str(nid)]
    ar={'key':KEY,'stage':nid,'ids':list(witness['currentTokens']),'rows33':P['rows']}
    arms=[('currentPublished',CUR,witness['currentTokens'],G['peers'][str(nid)])]
    if nid==40:arms.insert(0,('historicalC60',A,witness['historicalTokens'],P['stage40OldRoutes']))
    for name,u,tokens,oldPaths in arms:
     label=f'{nid}-{name}'
     c,p,net,err,nav=open(u)
     try:
      p.evaluate("()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}")
      p.evaluate(O['LAUNCH'],nid)
      prior=p.evaluate(PERSIST,ar)
      need(prior['refs']==tokens and not err,'peer genuine save wrong provider or script error')
      oldRoutes=proof(net,u,oldPaths)
      need(sha(prior['state']['terrain'].encode())==witness['terrainSha'] and sha(prior['state']['units'].encode())==witness['unitsSha'],'peer saved geometry differs from validated 40/46 release')
     finally:c.close()
     c,p,net,err,nav=open(B,prior['text'])
     try:
      p.evaluate("()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}")
      need(p.evaluate("()=>!HonroApp.engine&&Boolean(HonroApp.profile.honroBattle)"),'peer stock cold profile did not persist')
      p.evaluate("()=>{HonroApp.frame=()=>{};HonroApp.continue();}")
      p.wait_for_function(f"()=>HonroApp.engine?.b?.honroStage==={nid}&&!HonroApp.profileStore.locked",timeout=15000)
      paused(p)
      y=p.evaluate(CHECK,ar)
      need(y['state']==prior['state'] and y['r33']==P['rows'] and not err,'peer normal old/current resume changed physics/placements/guard')
      need(set(y['rows'])==set(witness['currentTokens']) and all(v['current']==witness['currentTokens'][k] and all(x==v['current'] for x in v['rendered'])for k,v in y['rows'].items()),'peer normal resume did not resolve exact current provider')
      wanted={**G['peers'][str(nid)],G['protectedProfile']:G['protectedProfileBody'],G['newCommon']:G['sha']}
      q['compatPeers'][label]={'status':'PASS','oldTokens':tokens,'resolved':y['rows'],'terrainSHA':witness['terrainSha'],'unitsSHA':witness['unitsSha'],'nativeSources':oldRoutes,'nativeResumedRoutes':proof(net,B,wanted)};save()
     finally:c.close()
   q['workshop']={}
   for k,u in [('A',CUR),('B',B)]:
    q['workshop'][k]=fullWorkshop(br,u,G['workshop'][k]);save()
   need(q['workshop']['A']==q['workshop']['B'] or all(q['workshop']['A'][k]==q['workshop']['B'][k]for k in ('stage7NewIndex','stage7NewId','libraryIdsSHA256','mapIdsSHA256','fullLibraryLength','fullMapLength','originalProviderSignatures','archiveGETs')),'Workshop 1194 active asset ordering changed')
   nativeStage7(open,proof,q,save,G)
   br.close()
  q['status']='PASS_BATCH_STAGE33_2C4_PC_M_RESAVE_PLUS_STAGE7_AND_WORKSHOP'
 finally:save()
if __name__=='__main__':main(Path(sys.argv[1]))
