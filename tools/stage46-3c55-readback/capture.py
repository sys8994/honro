"""Two recorded normal app arms. Pose-normalized receipt, not an art pass or benchmark."""
import base64,hashlib,io,json,sys
from pathlib import Path
from PIL import Image,ImageChops,ImageFilter
from playwright.sync_api import sync_playwright
from guard import P,need,fact,save
W=Path(sys.argv[1]);out=W/'out';O=json.loads(Path(__file__).with_name('observer.json').read_bytes());G=json.loads((out/'GRAPH.json').read_bytes())
URL={'A':'http://127.0.0.1:18961/','B':P['publicRoot']};q={'status':'HOLD','pictures':{},'continue':{},'errors':[],'rawSaveExported':False}
def snap():save(out/'BROWSER.json',q)
key='honro-first-act-profile-1';ids=['act5:near:46']
PROOF=r"""
 ({signature,onlySave})=>{
 const a=window.HonroApp,b=a.engine?.b,p=HONRO_PROJECT.stages[45],id='act5:near:46';
 const sha=s=>{let n=2166136261;for(let i=0;i<s.length;i++)n=Math.imul(n^s.charCodeAt(i),16777619);return s.length+':'+(n>>>0).toString(16);};
 const values=x=>[x.honroElements,x.honroLandmarks].map(xs=>xs.filter(i=>i.id==='a5-near'&&i.assetId===id));
 const sig=x=>{let v={};for(const k of ['width','height','terrain','units','phase','round','active','honroObjectives','honroGoalState','honroEncounterState','honroMapOrigin'])v[k]=x[k];return JSON.stringify(v);};
 if(!b||p.id!=='stage-46'||b.honroStage!==46||b.honroCustom!==false||!b.honroCanonical||b.honroMapOrigin!=='campaign'||a.profileStore.locked)throw Error('not actual Stage46 normal scene');
 const registered=HONRO_PROJECT.library.filter(x=>x.id===id);
 if(registered.length!==1)throw Error('wrong active Stage46 asset count');
 const provider=registered[0],raw=JSON.stringify(provider);
 const rows=values(b);
 if(sha(raw)!==signature||rows.some(xs=>xs.length!==1||xs.some(x=>x.x!==0||x.y!==0||x.scale!==4||x.rotation!==0||x.collisionIds?.length!==0||JSON.stringify(x.asset)!==raw)))throw Error('wrong compiled actual Stage46 paint owner');
 if(provider.collision?.length!==0||provider.shaftExteriorParts?.length!==5||!provider.shaftExterior)throw Error('missing genuine restored visual owner');
 if(onlySave){
 const text=localStorage.getItem('honro-first-act-profile-1');if(text===null)throw Error('actual predecessor ordinary save absent');
 const s=JSON.parse(text).honroBattle;
 if(!s||s.honroStage!==46||HonroCampaignMapRevision.obsolete(s))throw Error('wrong actual predecessor save');
 if(values(s).some(xs=>xs.length!==1||xs.some(x=>x.asset?.id!==id||x.asset?.signature!==signature||x.asset?.honroStaticAssetRef!==1)))throw Error('missing approved old compact signature');
 return {text,world:sig(s),provider:signature};
 }
 return {world:sig(b),provider:signature,rendering:['BODY',...provider.shaftExteriorParts.map(x=>x.id||'part')],collisionOwners:rows.map(xs=>xs.map(x=>x.collisionIds.length))};
 }
"""
MASK=r"""m=>{
 const a=HONRO_PROJECT.library.find(v=>v.id==='act5:near:46').shaftExterior;
 const s=a.vector.clips['native-source-alpha'];
 if(!s?.length)throw Error('missing verified native body mask');
 const cv=document.createElement('canvas');[cv.width,cv.height]=m.backing;
 const x=cv.getContext('2d'),sx=m.actual.scale*cv.width/m.css.w,sy=m.actual.scale*cv.height/m.css.h;
 x.setTransform(sx,0,0,sy,-m.viewport.left*sx,-m.viewport.top*sy);
 x.scale(4,4);
 x.translate(-(a.anchor?.x||0),-(a.anchor?.y||0));
 x.transform(...(a.vector.root.transform||[1,0,0,1,0,0]));
 x.fillStyle='#fff';x.fill(new Path2D(s.join(' ')));
 return cv.toDataURL('image/png').split(',')[1];
}"""
def sha(x):return hashlib.sha256(x.encode()).hexdigest()
def brand(br,arm,dev,seed=None):
 o=G[arm]['files'];c=br.new_context(**P['devices'][dev],service_workers='block')
 c.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
 u=URL[arm]+'HONRO.html'
 if seed is not None:
  c.add_init_script('if(window.top===window && location.href==='+json.dumps(u)+'){localStorage.setItem('+json.dumps(key)+','+json.dumps(seed,ensure_ascii=True)+');}')
 p=c.new_page();seen={};errors=[]
 want=set(o)-{'HONRO.html','web/manifest.json'}
 p.on('response',lambda x:seen.setdefault(x.url,(x.status,x.from_service_worker)) if x.url in {URL[arm]+i for i in want} else None)
 p.on('pageerror',lambda e:errors.append(str(e)))
 nav=p.goto(u,wait_until='domcontentloaded',timeout=50000)
 need(nav and nav.url==u and nav.status==200 and not nav.from_service_worker and fact(nav.body())==o['HONRO.html'],'wrong actual normal shell')
 p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&window.HonroApp?.screen==='title'&&typeof window.HonroCampaignLoader?.ensureStage==='function'",timeout=65000)
 def verify():
  need(not errors and all(seen.get(URL[arm]+k)==(200,False) for k in want),'normal app request/error evidence diverges')
  return {k:o[k] for k in want}
 return c,p,verify
def still(p,arm,dev,name):
 cfg={'id':46,'mapId':'stage-46','name':'southeast' if name=='SE' else 'ordinary','ordinary':P['pose'][dev].get(name),'dx':1,'dy':1,'readback':False,'fixedNow':O['PHASE']}
 m=p.evaluate(O['FROZEN'],cfg)['meta'];m['physics']=sha(m.pop('signature'))
 z=p.evaluate(O['DECODE']);m2=p.evaluate(O['FROZEN'],{**cfg,'readback':True})['meta'];m2['physics']=sha(m2.pop('signature'))
 need(m==m2 and not z['failed'],'unstable actual scene')
 if name!='SE':need(all(abs(m['actual'][k]-v)<1e-6 for k,v in zip(('x','y','scale'),cfg['ordinary'])),'normal pose not exactly reachable')
 raw=base64.b64decode(p.evaluate(O['CANVAS']),validate=True);mask=base64.b64decode(p.evaluate(MASK,m),validate=True)
 n=f'{dev}-{name}-{arm}';(out/(n+'-RAW.png')).write_bytes(raw);(out/(n+'-MASK.png')).write_bytes(mask)
 row={'raw':fact(raw),'mask':fact(mask),'pose':m}
 q['pictures'].setdefault(f'{dev}-{name}',{})[arm]=row;snap()
def compare(dev,name):
 n=f'{dev}-{name}';records=q['pictures'][n]
 need(records['A']['pose']==records['B']['pose'] and records['A']['mask']==records['B']['mask'],'actual physical state, camera or original native clip changed')
 def pix(arm,fn):return Image.open(out/f'{n}-{arm}-{fn}.png').convert('RGBA')
 A,B=pix('A','RAW'),pix('B','RAW')
 mask=pix('A','MASK').getchannel('A').point(lambda x:255 if x else 0)
 pad=P['maskGuardBackingPixels'];mask=mask.filter(ImageFilter.MaxFilter(pad*2+1))
 dr=ImageChops.difference(A,B);R,G,Q,alpha=dr.split()
 changed=ImageChops.lighter(ImageChops.lighter(R,G),Q).point(lambda x:255 if x else 0)
 outside=ImageChops.multiply(changed,ImageChops.invert(mask))
 qt={'changedRGB':changed.histogram()[255],'outsideRGB':outside.histogram()[255],'signedArea':mask.histogram()[255],'alphaChanged':sum(alpha.histogram()[1:]),'changedBox':changed.getbbox(),'outsideBox':outside.getbbox(),'maskGuardBackingPixels':pad}
 records['compare']=qt;snap()
 need(qt['outsideRGB']==qt['alphaChanged']==0,'actual outside edited body support or final alpha changed')
def native(br,dev):
 seed=None;world=None
 for arm in 'AB':
  c,p,v=brand(br,arm,dev)
  try:
   p.evaluate(O['LAUNCH'],46)
   a=p.evaluate(PROOF,dict(signature=P['oldSig'] if arm=='A' else P['newSig'],onlySave=False));a['world']=sha(a['world'])
   for name in ('near','deep','SE'):still(p,arm,dev,name)
   if arm=='A':
    s=p.evaluate(PROOF,dict(signature=P['oldSig'],onlySave=True));seed=s['text'];world=sha(s['world'])
    q['continue'][dev]={'actualOldNativeSave':fact(seed.encode()),'oldSignature':s['provider'],'oldState':world};snap()
   q.setdefault('actualOwner',{}).setdefault(dev,{})[arm]={**a,'HTTP':v()};snap()
  finally:c.close()
 for name in ('near','deep','SE'):compare(dev,name)
 need(any(q['pictures'][f'{dev}-{n}']['compare']['changedRGB'] for n in ('near','deep','SE')),'no actual visual density variant observed')
 c,p,v=brand(br,'B',dev,seed)
 try:
  need(p.evaluate("()=>window.HonroApp.profileStore.original().text")==seed,'old native bytes were not read by actual live title')
  p.evaluate("()=>{window.HonroApp.frame=()=>{}}")
  p.locator('[data-action="continue"]').first.click(timeout=15000)
  p.wait_for_function("()=>window.HonroApp?.engine?.b?.honroStage===46&&!window.HonroApp.profileStore.locked",timeout=26000)
  a=p.evaluate(PROOF,dict(signature=P['newSig'],onlySave=False));now=sha(a['world'])
  q['continue'][dev].update({'nativeClick':True,'currentSignature':a['provider'],'actualSameState':now==world,'currentState':now,'HTTP':v()});snap()
  need(now==world,'actual old profile native Continue changed gameplay state')
 finally:c.close()
snap()
try:
 with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True);need(b.version==P['chromium'],'wrong Chromium')
  try:
   for d in P['devices']:native(b,d)
  finally:b.close()
 q['status']='NATIVE_STAGE46_VISUAL_AND_OLD_CONTINUE_WITNESSES_READY_FOR_HUMAN_REVIEW'
except Exception as e:q['errors'].append(repr(e));raise
finally:snap()
