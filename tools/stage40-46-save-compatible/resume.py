"""Real archived 733 and candidate browser-generated saves through actual cold app continue, no user profile."""
from pathlib import Path
import base64,hashlib,json,sys,urllib.request
from guard import P,check,fact
from playwright.sync_api import sync_playwright
D=Path(__file__).resolve().parent;O=json.loads((D/'observer.json').read_bytes())
KEY='honro-first-act-profile-1'
URL={a:'http://127.0.0.1:'+str(port)+'/' for a,port in [('A',18961),('B',18962),('H',18963)]}
def sha(x):return hashlib.sha256(x.encode()).hexdigest()
def request(url,pin):
 req=urllib.request.Request(url,headers={'Accept-Encoding':'identity','User-Agent':'HONRO official detached save and resume QA'})
 with urllib.request.urlopen(req,timeout=45)as r:check(r.status==200 and r.geturl()==url and fact(r.read(pin['bytes']+1))==pin,'HTTP immutable difference '+url)
 return pin
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
def main(W):
 out=W/'out';g=json.loads((out/'RESUME-ROUTES.json').read_bytes())
 q={'status':'HOLD','scope':'Genuine persisted historical 733 and current B in-battle saves, PC/M; no save text or private data leaves runner. No release.','runs':{},'peerHTTP':{}}
 def save():(out/'RESUME.json').write_text(json.dumps(q,indent=2)+'\n')
 save()
 try:
  # Compare exact published prior-scope/current assets over genuine HTTP. Enabling requires public current manifest.
  for n in (21,32,33,42):
   k=str(n);q['peerHTTP'][k]={p:{arm:request(URL[arm]+p,h) for arm in 'AB'}for p,h in g['A']['routes'][k].items()}
  pg=P['actualCurrentPublicPages'];cur='https://sys8994.github.io/honro/'
  q['publicExactManifest']=request(cur+'web/manifest.json',{k:P['manifest'][k]for k in ('bytes','sha256')})
  with sync_playwright() as pw:
   br=pw.chromium.launch(headless=True);q['browser']=br.version;check(br.version=='151.0.7922.34','official browser mismatch')
   def open(arm,w,h,snapshot=None):
    c=br.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
    check(c.storage_state()=={'cookies':[],'origins':[]},'not a new isolated native profile')
    c.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
    if snapshot is not None:c.add_init_script('if(location.origin==='+json.dumps(URL[arm].rstrip('/'))+'){localStorage.setItem('+json.dumps(KEY)+','+json.dumps(snapshot)+');}')
    p=c.new_page();rs={};errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
    p.on('response',lambda r:rs.setdefault(r.url,r))
    nav=p.goto(URL[arm]+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
    check(nav and nav.status==200 and nav.url==URL[arm]+'HONRO.html' and not nav.from_service_worker and fact(nav.body())==g[arm]['shell'],'exact native game shell not served')
    p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
    p.evaluate("()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}")
    return c,p,rs,errors
   def closures(rs,arm,n):
    x={}
    for k,h in g[arm]['routes'][str(n)].items():
     r=rs.get(URL[arm]+k);check(r and r.status==200 and not r.from_service_worker and fact(r.body())==h,'actual resumed HTTP identity '+k)
     x[k]=h
    return x
   def shot(p,n,label):
    z={40:[1510,2120,.55],46:[1850,2550,.55]}[n]
    if label.startswith('M'):z[2]=.42
    u={'id':n,'mapId':'stage-'+str(n),'name':'ordinary','dx':0,'dy':0,'ordinary':z,'readback':False,'fixedNow':O['PHASE']}
    meta=p.evaluate(O['FROZEN'],u)['meta'];meta['physics']=sha(meta.pop('signature'))
    p.evaluate(O['DECODE'])
    raw=base64.b64decode(p.evaluate(O['CANVAS']),validate=True)
    f='resume-'+label+'.png';(out/f).write_bytes(raw)
    return {'path':f,'png':fact(raw),'meta':meta}
   def wait_battle(p,n):p.wait_for_function(f"()=>HonroApp.engine?.b?.honroStage==={n}&&!HonroApp.profileStore.locked",timeout=15000)
   for n in (40,46):
    old={k:v['act4'].get('previousOptimized',v['act4']['previous'])for k,v in P['saveRows40'].items()} if n==40 else {P['saveRows46']['id']:P['saveRows46']['old']}
    new={k:v['act4']['current']for k,v in P['saveRows40'].items()} if n==40 else {P['saveRows46']['id']:P['saveRows46']['current']}
    ar={'key':KEY,'stage':n,'ids':list(old),'rows33':P['saveRows33']}
    for tag,w,h in [('PC',1440,900),('M',390,844)]:
     log={};q['runs'][f'{n}-{tag}']=log;save()
     snapshots={}
     for label,arm,expected in [('historical733','H',old),('candidateFresh','B',new)]:
      c,p,rr,er=open(arm,w,h)
      try:
       p.evaluate(O['LAUNCH'],n);wait_battle(p,n)
       s=p.evaluate(PERSIST,ar);check(s['refs']==expected,'not genuine expected native save refs')
       log[label]={'save':fact(s['text'].encode()),'refs':s['refs'],'terrains':sha(s['state']['terrain']),'units':sha(s['state']['units']),'placements':s['placementOwners'],'HTTP':closures(rr,arm,n),'errors':er}
       check(not er,'unexpected genuine source browser error');snapshots[label]=s;save()
      finally:c.close()
     for label,s in snapshots.items():
      if label=='historical733':
       # Existing public 342 live game must still resume this historical 733 save.
       c,p,rr,er=open('A',w,h,s['text'])
       try:
        check(p.evaluate("()=>!HonroApp.engine&&Boolean(HonroApp.profile.honroBattle)"),'stock cold saved profile did not remain available')
        p.evaluate("()=>{HonroApp.frame=()=>{};HonroApp.continue();}")
        wait_battle(p,n);o=p.evaluate(CHECK,ar)
        check(o['state']==s['state'] and o['r33']==P['saveRows33'] and not er,'stock historical cold restore drift')
        log['currentStock733Resume']={'actual':True,'untouched':True,'HTTP':closures(rr,'A',n)}
       finally:c.close()
      c,p,rr,er=open('B',w,h,s['text'])
      try:
       check(p.evaluate("()=>!HonroApp.engine&&Boolean(HonroApp.profile.honroBattle)"),'candidate cold saved profile absent or pre-mounted')
       p.evaluate("()=>{HonroApp.frame=()=>{};HonroApp.continue();}")
       wait_battle(p,n);o=p.evaluate(CHECK,ar)
       check(o['state']==s['state'] and o['r33']==P['saveRows33'],'restored battle physics/entities/placement/objs/registry drift')
       check(all(o['rows'][k]['current']==v and all(y==v for y in o['rows'][k]['rendered']) for k,v in new.items()),'actual mounted battle uses wrong current provider')
       log[label+'ColdB']={'actualRestore':True,'stateShas':{k:sha(o['state'][k])for k in ('terrain','units','objective')},'refs':o['rows'],'peer33RegistryExact':True,'HTTP':closures(rr,'B',n),'raw':shot(p,n,tag+'-'+str(n)+'-'+label),'errors':er}
       check(not er,'unexpected candidate normal restore error')
       if label=='historical733':
        neg=p.evaluate(NEG,{**ar,'text':s['text']});check(all(neg.values()),'disallowed exact compatibility negative accepted')
        log['malformedControlsRejected']=neg
       save()
      finally:c.close()
   br.close()
  q['status']='PASS_NATIVE_PERSISTED_733_AND_CURRENT_OLD_NEW_PC_M'
 finally:save()
if __name__=='__main__':main(Path(sys.argv[1]))
