"""Anonymous read-only public save and resume evidence, no personal profiles."""
from pathlib import Path
import base64,hashlib,json,sys
from guard import P,need,fact,request
from playwright.sync_api import sync_playwright
D=Path(__file__).resolve().parent;O=json.loads((D/'observer.json').read_bytes())
KEY='honro-first-act-profile-1'
URL={'H':'http://127.0.0.1:18963/','J':'http://127.0.0.1:18961/','P':P['origin']}
def sha(x):return hashlib.sha256(x.encode()).hexdigest()
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
# App.continue() restores a clone to the live engine, not to the loaded profile.
# App.showTitle() calls normal stopBattle() which snapshots that live battle and saves it.
TITLE_SAVE='arg=>{'+COMMON+r"""
 const a=HonroApp;const b=a.engine?.b;
 if(!valid(b,arg.stage)||a.profileStore.locked||a.screen!=='battle'||a.training||a.done)throw Error('stock title save unavailable in this state');
 const before=localStorage.getItem(arg.key);a.showTitle();
 const source=localStorage.getItem(arg.key),after=JSON.parse(source),s=after.honroBattle;
 const refs={};let entries=0;for(const v of own(s,arg)){
  if(v.asset.honroStaticAssetRef!==1)continue;
  entries++;if(refs[v.asset.id]&&refs[v.asset.id]!==v.asset.signature)throw Error('conflicting re-saved provider references');
  refs[v.asset.id]=v.asset.signature;
 }
 return {text:source,refs,state:content(s),placed:entries,path:{screen:a.screen,noMountedEngine:a.engine===null,storageChanged:source!==before,canonicalPersisted:valid(s,arg.stage),storeReady:a.profileStore.state.kind==='ready'&&!a.profileStore.state.lastWriteError}};
}"""
NEG='arg=>{'+COMMON+r"""
 const source=JSON.parse(arg.text).honroBattle, deny=f=>{
  const b=structuredClone(source);f(b);const old=JSON.stringify(b);
  return !HonroProfileStore.restoreBattleArt(b)&&JSON.stringify(b)===old;
 };
 const f=fn=>b=>fn(own(b,arg)[0].asset), item=fn=>b=>fn(own(b,arg)[0]);
 const out={wrongStage:deny(b=>b.honroStage=arg.stage+1),wrongOrigin:deny(b=>b.honroMapOrigin='workshop'),
  wrongMode:deny(b=>b.mode='custom'),custom:deny(b=>b.honroCustom=true),unofficial:deny(b=>b[arg.stage===40?'honroAct4Official':'honroAct5']=0),
  unknownSignature:deny(f(x=>x.signature='4:deadc0de')),unknownID:deny(f(x=>x.id='missing-for-invalid-save-fixture')),
  atomicMalformedLater:deny(b=>{const a=own(b,arg);a.at(-1).asset.signature='4:deadc0de'})};
 if(arg.stage===46){out.wrongPlacement=deny(item(x=>x.x=1));out.noncanonical=deny(b=>b.honroCanonical=false);}
 return out;
}"""
def main(w):
 out=w/'out';r=json.loads((w/'REFERENCE.json').read_bytes());g=r['routes']
 final={'status':'HOLD','scope':'Anonymous public native PC/M plus real synthetic saves from separately launched 733 and 342; no saved profile text output','runs':{},'peerHTTP':{}}
 def save():(out/'PUBLIC.json').write_text(json.dumps(final,indent=2)+'\n')
 save()
 try:
  graph=json.loads((out/'GRAPH.json').read_bytes())
  final['publicManifest']=request(URL['P']+'web/manifest.json',g['P']['manifest'])
  final['immutableSample']={p:request(URL['P']+p,h)for p,h in graph['httpSample'].items()}
  final['peerHTTP']={k:{p:request(URL['P']+p,h)for p,h in g['P']['routes'][k].items()}for k in ('21','32','33','42')}
  final['actualJoined']={}
  for j,v in graph['split'].items():
   raw=[]
   for k in v['pieces']:
    import urllib.request
    from guard import NoRedirect
    expected=g['P']['routes'][j][k];req=urllib.request.Request(URL['P']+k,headers={'Accept-Encoding':'identity','User-Agent':'HONRO isolated public split proof'})
    with urllib.request.build_opener(NoRedirect()).open(req,timeout=45)as q:
     b=q.read(expected['bytes']+1);need(q.status==200 and q.geturl()==URL['P']+k and fact(b)==expected,'split HTTP bytes '+k);raw.append(b)
   need(fact(b''.join(raw))==v['whole'],'split exact joined packet differs '+j)
   final['actualJoined'][j]=v['whole']
  save()
  with sync_playwright()as pw:
   br=pw.chromium.launch(headless=True);final['browser']=br.version;need(br.version=='151.0.7922.34','browser version drift')
   def open(arm,width,height,snap=None):
    c=br.new_context(viewport={'width':width,'height':height},device_scale_factor=1,service_workers='block')
    try:
     need(c.storage_state()=={'cookies':[],'origins':[]},'isolated profile not empty')
     c.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
     if snap is not None:
      need(arm=='P','historical origin must begin empty')
      c.add_init_script('if(location.origin==='+json.dumps('https://sys8994.github.io')+'&&location.pathname.startsWith("/honro/"))localStorage.setItem('+json.dumps(KEY)+','+json.dumps(snap)+');')
     p=c.new_page();rs={};errors=[];p.on('pageerror',lambda e:errors.append(type(e).__name__))
     p.on('response',lambda x:rs.setdefault(x.url,x))
     a=URL[arm]+'HONRO.html';nav=p.goto(a,wait_until='domcontentloaded',timeout=50000)
     need(nav and nav.status==200 and nav.url==a and not nav.from_service_worker and fact(nav.body())==g[arm]['shell'],'wrong native compiled shell '+arm)
     p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
     p.evaluate("()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}")
     return c,p,rs,errors
    except BaseException:c.close();raise
   def wait(p,n):p.wait_for_function(f"()=>HonroApp.engine?.b?.honroStage==={n}&&!HonroApp.profileStore.locked",timeout=15000)
   def closures(rs,arm,n):
    v={}
    for key,h in g[arm]['routes'][str(n)].items():
     x=rs.get(URL[arm]+key);need(x and x.status==200 and not x.from_service_worker and fact(x.body())==h,'missing real native HTTP input '+arm+' '+key);v[key]=h
    return v
   def shot(p,n,tag,label,ref):
    z={40:[1510,2120,.55],46:[1850,2550,.55]}[n]
    if tag=='M':z[2]=.42
    u={'id':n,'mapId':'stage-'+str(n),'name':'ordinary','dx':0,'dy':0,'ordinary':z,'readback':False,'fixedNow':O['PHASE']}
    meta=p.evaluate(O['FROZEN'],u)['meta'];meta['physics']=sha(meta.pop('signature'))
    p.evaluate(O['DECODE']);raw=base64.b64decode(p.evaluate(O['CANVAS']),validate=True)
    k=f'public-{tag}-{n}-{label}.png';(out/k).write_bytes(raw)
    return {'path':k,'actual':fact(raw),'pose':meta,'wholePNGExact':fact(raw)==ref['png'],'poseExact':meta==ref['meta']}
   for n in (40,46):
    for tag,width,height in [('PC',1440,900),('M',390,844)]:
     case=f'{n}-{tag}';approved=P['savePins'][case];ref=r['native'][case]
     old,new=[approved[k]for k in ('old','new')];arg={'key':KEY,'stage':n,'ids':list(old),'rows33':P['stageOrder']}
     row={'history':{},'resumed':{}};final['runs'][case]=row;save();mem={}
     for arm in ('H','J'):
      c,p,rs,err=open(arm,width,height)
      try:
       p.evaluate(O['LAUNCH'],n);wait(p,n);s=p.evaluate(PERSIST,arg)
       need(s['refs']==old and not err,'history failed genuine persist '+case+' '+arm)
       row['history'][arm]={'persisted':fact(s['text'].encode()),'refs':s['refs'],'state':{k:sha(s['state'][k])for k in ('terrain','units','objective')},'HTTP':closures(rs,arm,n)}
       need(row['history'][arm]['state']==approved['stateShas'],'historical source state not exact '+case+' '+arm)
       mem[arm]=s;save()
      finally:c.close()
     c,p,rs,err=open('P',width,height)
     try:
      p.evaluate(O['LAUNCH'],n);wait(p,n);native=p.evaluate(PERSIST,arg)
      need(native['refs']==new and {k:sha(native['state'][k])for k in ('terrain','units','objective')}==approved['stateShas'],'fresh actual public save refs/state differ '+case)
      row['fresh']={'refs':native['refs'],'HTTP':closures(rs,'P',n),'raw':shot(p,n,tag,'fresh',ref)};save()
      # The signature/physics/pose controls stay exact; fresh-frame pixels vs cold are informative only.
      need(row['fresh']['raw']['poseExact']and not err,'fresh public pose differs '+case)
     finally:c.close()
     for label in ('H','J','renewed'):
      s=mem[label]
      c,p,rs,err=open('P',width,height,s['text'])
      try:
       need(p.evaluate("()=>!HonroApp.engine&&Boolean(HonroApp.profile.honroBattle)"),'stored isolated cold profile absent or already mounted '+case+' '+label)
       p.evaluate("()=>{HonroApp.frame=()=>{};HonroApp.continue();}")
       wait(p,n);o=p.evaluate(CHECK,arg)
       need(o['state']==s['state'] and {k:sha(o['state'][k])for k in ('terrain','units','objective')}==approved['stateShas'] and o['r33']==P['stageOrder'],'restore changed stored battle or Stage33 safeguard '+case+' '+label)
       need(all(o['rows'][k]['current']==v and o['rows'][k]['rendered'] and all(y==v for y in o['rows'][k]['rendered'])for k,v in new.items()),'restore loaded wrong current provider '+case+' '+label)
       png=shot(p,n,tag,label,ref)
       row['resumed'][label]={'actualCold':True,'refs':o['rows'],'HTTP':closures(rs,'P',n),'raw':png}
       save();need(not err and png['wholePNGExact']and png['poseExact'],'public whole PNG or camera drift '+case+' '+label)
       if label=='J':
        renewed=p.evaluate(TITLE_SAVE,arg)
        path=renewed['path'];stateShas={k:sha(renewed['state'][k])for k in ('terrain','units','objective')}
        row['renewedSave']={'refs':renewed['refs'],'digest':fact(renewed['text'].encode()),'path':path,'stateShas':stateShas,'placementOwnerCount':renewed['placed'],'unchangedExactFields':{k:renewed['state'][k]==s['state'][k] for k in s['state']}}
        save()
        need(path=={'screen':'title','noMountedEngine':True,'storageChanged':True,'canonicalPersisted':True,'storeReady':True},'normal showTitle/stopBattle path failed '+case)
        need(renewed['refs']==new and renewed['placed']==sum(len(v['rendered'])for v in o['rows'].values()),'current provider re-sign failed '+case)
        need(renewed['state']==s['state'] and stateShas==approved['stateShas'] and not err,'stock autosave changed preserved battle fields '+case)
        mem['renewed']=renewed
      finally:c.close()
   br.close()
  final['status']='PASS_PUBLIC_NATIVE_733_342_RESUME_AND_CURRENT_RESAVE_PC_M'
 finally:save()
if __name__=='__main__':main(Path(sys.argv[1]).resolve())
