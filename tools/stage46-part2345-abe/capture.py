"""Three pinned normal app arms. Pose-normalized receipt, not an art pass or benchmark."""
import base64,hashlib,io,json,sys
from pathlib import Path
from PIL import Image,ImageChops,ImageFilter
from playwright.sync_api import sync_playwright
from guard import P,need,fact,save
W=Path(sys.argv[1]);out=W/'out';O=json.loads(Path(__file__).with_name('observer.json').read_bytes());G=json.loads((out/'GRAPH.json').read_bytes())
need(set(G)==set('ABE'),'missing independently complete normal A/B/E graph')
URL={k:'http://127.0.0.1:'+str(18961+i)+'/'for i,k in enumerate('ABE')};q={'status':'HOLD','pictures':{},'errors':[],'rawSaveExported':False,'visualGate':'UNTESTED','saveGate':'NOT_TESTED; isolated art-only diagnostic, do no live profiles or resume/export exercised'}
def snap():save(out/'BROWSER.json',q)
PROOF=r"""
 signature=>{
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
def brand(br,arm,dev):
 o=G[arm]['files'];c=br.new_context(**P['devices'][dev],service_workers='block')
 c.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
 u=URL[arm]+'HONRO.html'
 p=c.new_page();seen={};errors=[]
 want=set(o)-{'HONRO.html','web/manifest.json'}
 allowed={URL[arm]+i:i for i in want}
 c.route('**/*',lambda route:route.continue_() if route.request.url.startswith(URL[arm]) and route.request.method in ('GET','HEAD') else route.abort())
 p.on('response',lambda x:seen.setdefault(x.url,x) if x.url in allowed else None)
 p.on('pageerror',lambda e:errors.append(str(e)))
 nav=p.goto(u,wait_until='domcontentloaded',timeout=50000)
 need(nav and nav.url==u and nav.status==200 and not nav.from_service_worker and fact(nav.body())==o['HONRO.html'],'wrong actual normal shell')
 p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&window.HonroApp?.screen==='title'&&typeof window.HonroCampaignLoader?.ensureStage==='function'",timeout=65000)
 def verify():
  missing=[k for k in sorted(want) if URL[arm]+k not in seen]
  need(not errors and not missing,'normal app request/error evidence diverges: '+repr((missing,errors)))
  actual={}
  for k in sorted(want):
   r=seen[URL[arm]+k]
   need(r.status==200 and not r.from_service_worker and r.url==URL[arm]+k,'unexpected response '+k)
   actual[k]=fact(r.body())
   need(actual[k]==o[k],'actual response bytes differ: '+k)
  return actual
 return c,p,verify
def still(p,arm,dev,name):
 cfg={'id':46,'mapId':'stage-46','name':'southeast' if name=='SE' else 'ordinary','ordinary':P['pose'][dev].get(name),'dx':1,'dy':1,'readback':False,'fixedNow':O['PHASE']}
 m=p.evaluate(O['FROZEN'],cfg)['meta'];m['physics']=sha(m.pop('signature'))
 z=p.evaluate(O['DECODE']);m2=p.evaluate(O['FROZEN'],{**cfg,'readback':True})['meta'];m2['physics']=sha(m2.pop('signature'))
 need(m==m2 and not z['failed'],'unstable actual scene')
 raw=base64.b64decode(p.evaluate(O['CANVAS']),validate=True);mask=base64.b64decode(p.evaluate(MASK,m),validate=True)
 n=f'{dev}-{name}-{arm}';(out/(n+'-RAW.png')).write_bytes(raw);(out/(n+'-MASK.png')).write_bytes(mask)
 prior=P['priorMatchedRaw'][f'{dev}-{name}'].get(arm)
 row={'raw':fact(raw),'mask':fact(mask),'pose':m,'matchesPriorRaw':fact(raw)==prior if prior else None}
 q['pictures'].setdefault(f'{dev}-{name}',{})[arm]=row;snap()
 need(m==P['priorMatchedPose'][f'{dev}-{name}'],'actual archived pose/physics mismatch')
 if name!='SE':need(all(abs(m['actual'][k]-v)<1e-6 for k,v in zip(('x','y','scale'),cfg['ordinary'])),'normal pose not exactly reachable')

def compare(dev,name):
 n=f'{dev}-{name}';records=q['pictures'][n];ma=records['A']['pose']
 need(all(records[a]['pose']==ma and records[a]['mask']==records['A']['mask'] for a in 'ABE'),'protected physical state, true pose or common BODY clip drift')
 ims={arm:Image.open(out/f'{n}-{arm}-RAW.png').convert('RGBA') for arm in 'ABE'}
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
 aa=compare_px('A','B',fullmask);bd=compare_px('B','E',part);ad=compare_px('A','E',fullmask)
 # Quantify actual shelf contrast. Locate the same world coordinate in each matched real pose.
 world=P['measureWorldX'][n];xp=(world-ma['viewport']['left'])*scale;x=int(xp)
 need(2<=x<w-2,'target seam is not genuinely visible')
 def step_stats(at,im):
  px=im.load();m=original.load()
  vals=[max(abs(px[at-1,y][k]-px[at+1,y][k]) for k in range(3)) for y in range(h) if m[at-1,y] and m[at+1,y]]
  return {'sampleRows':len(vals),'meanMaxRGBdn':sum(vals)/len(vals) if vals else None,'rowsAtLeast12dn':sum(v>=12 for v in vals)}
 step={a:{str(i):step_stats(i,ims[a])for i in range(x-1,x+2)}for a in 'ABE'}
 for a in 'ABE':
  ims[a].crop((max(0,x-150),0,min(w,x+150),h)).save(out/f'{n}-{a}-JOINT.png')
 east=Image.new('L',(w,h),0)
 if i1<w:east.paste(255,(i1,0,w,h))
 extra={}
 for extraWorld in P['extraMeasureWorldX'].get(n,[]):
  px=(extraWorld-ma['viewport']['left'])*scale;xx=int(px)
  need(2<=xx<w-2,'secondary requested join is not visible')
  steps={a:{str(k):step_stats(k,ims[a]) for k in range(xx-1,xx+2)} for a in 'ABE'}
  need(all(rows[str(xx)]['sampleRows']>0 for rows in steps.values()),'secondary join had no shared BODY samples')
  extra[str(extraWorld)]={'actualProjectedBackingX':px,'horizontalStepAcrossTwoPixels':steps}
  for a in 'ABE':ims[a].crop((max(0,xx-60),0,min(w,xx+60),h)).save(out/f'{n}-{a}-JOINT-{extraWorld}.png')
 records['comparisons']={'oldVsCurrent':aa,'currentVsPart2Through5':bd,'oldVsPart2Through5':ad,'signedRasterRange':[i0,i1],
  'signedWorldRange':P['scopeWorldX'],'signedScopeNotice':'comparison envelope, not exact per-ring path support',
  'eastOfEnvelopeCurrentVsPart2Through5':compare_px('B','E',ImageChops.invert(east))['outside'],
  'seamWorldX':world,'actualProjectedBackingX':xp,'horizontalStepAcrossTwoPixels':step,'secondaryJoins':extra};snap()
 need(all(v[str(x)]['sampleRows']>0 for v in step.values()),'selected join had no shared BODY sample rows')
 need(all(ims[a].size==tuple(ma['backing']) for a in 'ABE'),'canvas dimensions do not match receipt')
 need(aa['alpha']==aa['outside']==ad['alpha']==ad['outside']==bd['alpha']==bd['outside']==0 and bd['different']>0,'actual alpha/protected output or positive E effect failed; images retained')
 return records['comparisons']
def native_fresh(br,arm,dev,name):
 c,p,v=brand(br,arm,dev)
 try:
  p.evaluate(O['LAUNCH'],46)
  sig={'A':P['oldSig'],'B':P['newSig'],'E':P['Esignature']}[arm]
  a=p.evaluate(PROOF,sig);a['world']=sha(a['world'])
  still(p,arm,dev,name)
  q.setdefault('actualOwner',{}).setdefault(f'{dev}-{name}',{})[arm]={**a,'HTTP':v()};snap()
 finally:c.close()
def capture_matrix(br):
 shots=(('PC','deep'),('Mobile','SE'),('PC','west'))
 for dev,n in shots:
  for a in 'ABE':
   try:native_fresh(br,a,dev,n)
   except Exception as e:q['errors'].append({'arm':a,'pose':f'{dev}-{n}','error':repr(e)});snap()
 reviewed=[]
 for dev,n in shots:
  k=f'{dev}-{n}'
  try:
   need(set(q['actualOwner'][k])==set('ABE') and len({o['world']for o in q['actualOwner'][k].values()})==1,'live protected world/HTTP authority differs')
   compare(dev,n);reviewed.append(k)
  except Exception as e:q['errors'].append({'pose':k,'error':repr(e)});snap()
 q['eastLimitation']='E restores exactly P2/P3/P4/P5. Mobile-SE measures x4800 and x7200 on the same actual frame. PC-west is a boundary probe, not an unchanged negative frame.'
 q['visualGate']='NUMERIC_SCOPE_PASS; HUMAN ART JUDGMENT REQUIRED' if len(reviewed)==3 else 'HOLD'
 q['status']='NATIVE_DIAGNOSTIC_EVIDENCE_READY_FOR_ART_REVIEW' if len(reviewed)==3 else 'HOLD'
 snap();need(q['status']!='HOLD','actual result held; partial cross-checks retained')
snap()
try:
 with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True);need(b.version==P['chromium'],'wrong Chromium')
  try:capture_matrix(b)
  finally:b.close()
finally:snap()
