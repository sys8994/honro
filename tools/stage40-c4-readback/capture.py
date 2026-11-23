"""Observe only exact stock Stage40 world and disposable native saves, never player data."""
from pathlib import Path
from contextlib import ExitStack
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from urllib.parse import urlsplit
import base64,hashlib,json,os,sys,threading
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright
from guard import P,need,fact,save
D=Path(__file__).resolve().parent;O=json.loads((D/'observer.json').read_bytes())
KEY='honro-first-act-profile-1';ARG={'key':KEY,'stage':40,'ids':list(P['registry']),'rows33':{}}
def sha(s):return hashlib.sha256(s.encode()).hexdigest()
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
def main(w):
 need(not(os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN')),'credential in anonymous stage readback')
 out=w/'out';signed=json.loads((out/'AUTHORITY.json').read_bytes())['actual']
 hrefs={'A':'http://127.0.0.1:18963/','B':P['public']}
 new={k:v[2]for k,v in P['registry'].items()};old={k:v[1]for k,v in P['registry'].items()}
 report={'status':'HOLD','scope':'Stage40 only. Detached exact deployed predecessor A and actual anonymous deployed c4 B. Signed geometry + native saves; numeric pixel changes diagnostic, human art verdict pending.','cases':{}}
 def flush():save(out/'STAGE40-C4-READBACK.json',report)
 flush()
 with ExitStack()as es,sync_playwright()as pw:
  h=partial(SimpleHTTPRequestHandler,directory=str(w/'A'))
  srv=es.enter_context(ThreadingHTTPServer(('127.0.0.1',18963),h));srv.daemon_threads=True
  threading.Thread(target=srv.serve_forever,daemon=True).start();es.callback(srv.shutdown)
  browser=pw.chromium.launch(headless=True);es.callback(browser.close)
  report['browser']=browser.version;need(browser.version=='151.0.7922.34','browser version drift')
  def open_(arm,wh,snap=None):
   c=browser.new_context(viewport={'width':wh[0],'height':wh[1]},device_scale_factor=1,service_workers='block')
   try:
    need(c.storage_state()=={'cookies':[],'origins':[]},'new context not empty')
    c.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
    if snap is not None:
     need(arm=='B','real save fixture origin must be c4')
     z=urlsplit(hrefs['B']);args=[z.scheme+'://'+z.netloc,z.path+'HONRO.html',KEY,snap]
     c.add_init_script('((origin,path,key,s)=>{if(location.origin===origin&&location.pathname===path)localStorage.setItem(key,s);})(...'+json.dumps(args)+');')
    p=c.new_page();rs={};err=[]
    p.on('response',lambda x:rs.setdefault(x.url,x))
    p.on('pageerror',lambda e:err.append(type(e).__name__))
    url=hrefs[arm]+'HONRO.html';nav=p.goto(url,wait_until='domcontentloaded',timeout=60000)
    need(nav and nav.status==200 and nav.url==url and not nav.from_service_worker and fact(nav.body())==signed[arm]['shell'],'wrong actual deployed/archived shell')
    p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
    p.evaluate("()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}")
    return c,p,rs,err
   except BaseException:c.close();raise
  def wait(p):p.wait_for_function("()=>HonroApp.engine?.b?.honroStage===40&&!HonroApp.profileStore.locked",timeout=45000)
  def closure(arm,rs):
   files={}
   for k,v in signed[arm]['files'].items():
    x=rs.get(hrefs[arm]+k)
    need(x and x.status==200 and not x.from_service_worker and fact(x.body())==v,'actual route not exact '+arm+' '+k)
    files[k]=v
   return files
  def state(o):
   return {k:(sha(v)if isinstance(v,str)else sha(json.dumps(v,sort_keys=True,ensure_ascii=False)))for k,v in o.items()}
  def check_owners(p,rows):
   v=p.evaluate(CHECK,ARG)
   need(all(v['rows'][k]['current']==s and v['rows'][k]['rendered']and all(y==s for y in v['rows'][k]['rendered'])for k,s in rows.items()),'missing or wrong restored native owner')
   return v
  def shot(p,tag,arm,n,dom=True):
   hist=P['poses'][tag].get(n);fixed=[4500,2200,.35]if n=='eastArrival' else ([v for v in hist['meta']['desired'].values()] if n!='southwest' else None)
   a={'id':40,'mapId':'stage-40','name':'min'if n=='southwest'else'ordinary','dx':-1,'dy':1,'ordinary':fixed,'readback':False,'fixedNow':O['PHASE']}
   meta=p.evaluate(O['FROZEN'],a)['meta'];meta['physics']=sha(meta.pop('signature'))
   if hist:need(meta==hist['meta'],'stock camera/physics no longer matches archival registration '+n)
   p.evaluate(O['DECODE']);raw=base64.b64decode(p.evaluate(O['CANVAS']),validate=True)
   rawName=tag+'-'+arm+'-'+n+'-RAW.png';(out/rawName).write_bytes(raw)
   ans={'raw':rawName,'rawFact':fact(raw),'pose':meta,'historicalRawMatched':(fact(raw)['sha256']==hist['raw'])if hist else None}
   if dom:
    path=tag+'-'+arm+'-'+n+'-DOM.png';b=p.locator('#battlecanvas').screenshot(path=str(out/path),timeout=20000)
    ans.update({'dom':path,'domFact':fact(b)})
   return ans
  def diff(a,b):
   rd=lambda p:Image.open(out/p).convert('RGBA')
   x,y=rd(a),rd(b);need(x.size==y.size,'not comparable backing/browser size')
   rr=ImageChops.difference(x,y);r,g,b,alpha=rr.split();rgb=ImageChops.lighter(ImageChops.lighter(r,g),b)
   return {'size':list(x.size),'rgbChanged':sum(rgb.histogram()[1:]),'alphaChanged':sum(alpha.histogram()[1:]),'rgbPeak':rgb.getextrema()[1],'alphaPeak':alpha.getextrema()[1],'rgbBBox':rgb.getbbox(),'alphaBBox':alpha.getbbox()}
  for tag,wh in [('PC',(1440,900)),('M',(390,844))]:
   row=report['cases'][tag]={};fresh={};st={}
   for arm,expected in [('A',old),('B',new)]:
    c,p,rs,err=open_(arm,wh)
    try:
     p.evaluate(O['LAUNCH'],40);wait(p);exact=check_owners(p,expected)
     s=p.evaluate(PERSIST,ARG);need(s['refs']==expected and not err,'native persisted provider refs wrong '+arm)
     fresh[arm]=s;st[arm]=exact['state']
     q=row[arm]={'nativeSaved':{'digest':fact(s['text'].encode()),'refs':s['refs'],'state':state(s['state'])},'rendered':exact['rows'],'frames':{}}
     for n in ('southwest','upper','immersed','eastArrival'):
      q['frames'][n]=shot(p,tag,arm,n);flush()
     q['actualVerifiedRoutes']=closure(arm,rs);need(not err,'app error '+arm);flush()
    finally:c.close()
   need(st['A']==st['B'] and fresh['A']['state']==fresh['B']['state'],'authored physical route or live Stage40 state/placements differ')
   row['comparisons']={}
   for n in row['A']['frames']:
    a,b=(row[k]['frames'][n]for k in ('A','B'))
    need(a['pose']==b['pose'],'A/B camera, actors, tide or protected physical signature differs '+n)
    row['comparisons'][n]={k:diff(a[k],b[k])for k in ('raw','dom')}
   row['cold']={};flush()
   for label in ('from-bf6','native-current','title-resaved'):
    s=fresh[{'from-bf6':'A','native-current':'B','title-resaved':'renewed'}[label]]
    c,p,rs,err=open_('B',wh,s['text'])
    try:
     need(p.evaluate("(key)=>!HonroApp.engine&&Boolean(HonroApp.profile.honroBattle)&&localStorage.getItem(key)!==null",KEY),'actual cold save missing')
     need(sha(p.evaluate("(key)=>localStorage.getItem(key)",KEY))==sha(s['text']),'stored save not genuine original')
     p.evaluate("()=>{HonroApp.frame=()=>{};HonroApp.continue();}");wait(p);r=check_owners(p,new)
     need(r['state']==s['state']and not err,'actual public Continue altered battle state')
     row['cold'][label]={'nativeProviders':r['rows'],'state':state(r['state']),'actualVerifiedRoutes':closure('B',rs)}
     if label in ('from-bf6','title-resaved'):
      row['cold'][label]['upper']=shot(p,tag,'resume-'+label,'upper',False)
     if label=='from-bf6':
      z=p.evaluate(TITLE_SAVE,ARG)
      need(z['path']=={'screen':'title','noMountedEngine':True,'storageChanged':True,'canonicalPersisted':True,'storeReady':True}and z['refs']==new and z['state']==s['state'],'normal title/stopBattle re-save failed')
      fresh['renewed']=z;row['resave']={'digest':fact(z['text'].encode()),'refs':z['refs'],'state':state(z['state']),'path':z['path']}
     need(not err,'app error during public re-save or readback');flush()
    finally:c.close()
 report['status']='PASS_SIGNED_LIVE_CAPTURE_AND_NATIVE_OLD_CURRENT_RESAVE_PC_M_VISUAL_REVIEW_REQUIRED';flush()
if __name__=='__main__': main(Path(sys.argv[1]).resolve())
