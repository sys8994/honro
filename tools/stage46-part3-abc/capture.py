"""Two recorded normal app arms. Pose-normalized receipt, not an art pass or benchmark."""
import base64,hashlib,io,json,sys
from pathlib import Path
from PIL import Image,ImageChops,ImageFilter
from playwright.sync_api import sync_playwright
from guard import P,need,fact,save
W=Path(sys.argv[1]);out=W/'out';O=json.loads(Path(__file__).with_name('observer.json').read_bytes());G=json.loads((out/'GRAPH.json').read_bytes())
URL={k:'http://127.0.0.1:'+str(18961+i)+'/'for i,k in enumerate('ABC')};q={'status':'HOLD','pictures':{},'continue':{},'errors':[],'rawSaveExported':False,'visualGate':'UNTESTED','saveGate':'UNTESTED'}
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
 n=f'{dev}-{name}';records=q['pictures'][n];ma=records['A']['pose']
 need(all(records[a]['pose']==ma and records[a]['mask']==records['A']['mask'] for a in 'ABC'),'protected physical state, true pose or common BODY clip drift')
 ims={arm:Image.open(out/f'{n}-{arm}-RAW.png').convert('RGBA') for arm in 'ABC'}
 original=Image.open(out/f'{n}-A-MASK.png').convert('RGBA').getchannel('A').point(lambda x:255 if x else 0)
 pad=P['maskGuardBackingPixels'];fullmask=original.filter(ImageFilter.MaxFilter(pad*2+1));w,h=fullmask.size
 x0,x1=P['scopeWorldX'];scale=w/(ma['viewport']['right']-ma['viewport']['left'])
 i0=max(0,int((x0-ma['viewport']['left'])*scale)-pad);i1=min(w,int((x1-ma['viewport']['left'])*scale)+pad+1)
 need(i0<i1,'no local analysis range in actual pose')
 column=Image.new('L',(w,h),0);column.paste(255,(i0,0,i1,h));part=ImageChops.multiply(fullmask,column)
 def compare_px(a,b,ms):
  dr=ImageChops.difference(ims[a],ims[b]);R,G,Q,T=dr.split();delta=ImageChops.lighter(ImageChops.lighter(R,G),Q)
  mm=delta.point(lambda v:255 if v else 0)
  squared=ImageChops.multiply(mm,ImageChops.invert(ms))
  return {'different':mm.histogram()[255],'strongDelta12':sum(delta.histogram()[12:]),'alpha':sum(T.histogram()[1:]),
   'outside':squared.histogram()[255],'outsideBox':squared.getbbox(),'signedPixels':ms.histogram()[255]}
 aa=compare_px('A','B',fullmask);bc=compare_px('B','C',part);ac=compare_px('A','C',fullmask)
 # Right of the candidate support remains intentionally as in current B.
 east=Image.new('L',(w,h),0)
 if i1<w:east.paste(255,(i1,0,w,h))
 def residual(a,b):
  dr=ImageChops.difference(ims[a],ims[b]);R,G,Q,_=dr.split();v=ImageChops.lighter(ImageChops.lighter(R,G),Q)
  return ImageChops.multiply(v,east).histogram()
 abfar=residual('A','B');bcfar=residual('B','C')
 records['comparisons']={'originalVsCurrent':aa,'currentVsPart3':bc,'originalVsPart3':ac,'signedRasterRange':[i0,i1],
  'signedWorldRange':P['scopeWorldX'],'eastPixelsOldVsCurrentDifferent':sum(abfar[1:]),'eastPixelsCurrentVsPart3Different':sum(bcfar[1:])};snap()
 need(bc['alpha']==bc['outside']==0 and bc['different']>0,'native C source support/alpha or actual positive local effect failed')
 return records['comparisons']
SNAP_SAVE=PROOF
def native_fresh(br,arm,dev,names):
 c,p,v=brand(br,arm,dev)
 try:
  p.evaluate(O['LAUNCH'],46)
  sig={'A':P['oldSig'],'B':P['newSig'],'C':P['Csignature']}[arm]
  a=p.evaluate(PROOF,dict(signature=sig,onlySave=False));a['world']=sha(a['world'])
  for name in names:still(p,arm,dev,name)
  before=p.evaluate(SNAP_SAVE,dict(signature=sig,onlySave=True));raw=before['text']
  q.setdefault('actualOwner',{}).setdefault(dev,{})[arm]={**a,'HTTP':v(),'minted':fact(raw.encode()),'mintedStateSHA':sha(before['world'])};snap()
  return raw,sha(before['world'])
 finally:c.close()
RESAVE=r"""sig=>{
 const a=window.HonroApp;if(a.profileStore.locked||a.engine?.b?.honroStage!==46)throw Error('not exact native loaded game');
 a.showTitle();
 const t=localStorage.getItem('honro-first-act-profile-1'),s=JSON.parse(t).honroBattle;
 if(!s||s.honroStage!==46||HonroCampaignMapRevision.obsolete(s))throw Error('native title transition not ordinary persisted');
 for(const rows of [s.honroElements,s.honroLandmarks]){
  const expected=rows.filter(x=>x.id==='a5-near'&&x.assetId==='act5:near:46');
  if(expected.length!==1||expected[0].asset?.honroStaticAssetRef!==1||expected[0].asset?.signature!==sig)throw Error('latest native compact record not re-signed');
 }
 return t;
}"""
def resume(br,dev,seed,world,original,resave):
 c,p,v=brand(br,'C',dev,seed)
 k=f'{dev}-{original}';q['continue'][k]={'incoming':fact(seed.encode())};snap()
 try:
  need(p.evaluate("()=>window.HonroApp.profileStore.original().text")==seed,'actual cold title old bytes absent')
  p.evaluate("()=>{window.HonroApp.frame=()=>{}}")
  p.locator('[data-action="continue"]').first.click(timeout=15000)
  p.wait_for_function("()=>window.HonroApp?.engine?.b?.honroStage===46&&!window.HonroApp.profileStore.locked",timeout=26000)
  a=p.evaluate(PROOF,dict(signature=P['Csignature'],onlySave=False));now=sha(a['world'])
  row=q['continue'][k];row.update({'nativeClick':True,'currentSignature':a['provider'],'actualSameState':now==world,'currentState':now,'HTTP':v()});snap()
  need(now==world,'genuine previous native Continue changed gameplay state')
  if resave:
   new=p.evaluate(RESAVE,P['Csignature']);row['nativeTitleResave']=fact(new.encode());snap()
   return new,now
  return None
 finally:c.close()
def capture_matrix(br):
 shots=(('PC','deep'),('Mobile','SE'));mints={}
 for dev,n in shots:
  for a in 'ABC':
   try:mints[dev,a]=native_fresh(br,a,dev,[n])
   except Exception as e:q['errors'].append(repr(e));snap()
 visual=[]
 for dev,n in shots:
  try:compare(dev,n);visual.append(f'{dev}-{n}')
  except Exception as e:q['errors'].append(repr(e));snap()
 q['visualGate']='NUMERIC_SCOPE_PASS_VISUAL_JUDGMENT_REQUIRED' if len(visual)==2 else 'HOLD'
 q['eastLimitation']='Intentional beyond-part3 far east remains same C vs B; no claim full Mobile SE restoration.'
 snap()
 ok=[]
 for dev,_ in shots:
  for a in 'ABC':
   try:
    seed,world=mints[dev,a]
    updated=resume(br,dev,seed,world,a,resave=(a=='B'))
    if updated:resume(br,dev,*updated,'C-resaved-previous-B',resave=False)
    ok.append(f'{dev}-{a}')
   except Exception as e:q['errors'].append(repr(e));snap()
 q['saveGate']='ACTUAL_A_B_C_CONTINUE_AND_B_TO_C_RESAVE_RELOAD_PASS' if len(ok)==6 else 'HOLD'
 q['unverifiedOlderSignature']='17756761:bc1a6549 VM-only, not native old boot.'
 q['status']='NATIVE_EVIDENCE_READY_FOR_ART_REVIEW' if len(visual)==2 and len(ok)==6 else 'HOLD'
 snap();need(q['status']!='HOLD','actual result held; partial cross-checks retained')
snap()
try:
 with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True);need(b.version==P['chromium'],'wrong Chromium')
  try:capture_matrix(b)
  finally:b.close()
finally:snap()
