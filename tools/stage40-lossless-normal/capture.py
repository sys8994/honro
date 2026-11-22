"""Exact detached normal PC/M A/B, no interception and no release."""
from pathlib import Path
import sys,json,hashlib,base64,io,time
from PIL import Image
from playwright.sync_api import sync_playwright
from guard import fact,check,P
D=Path(__file__).resolve().parent
O=json.loads((D/'observer.json').read_bytes())
MEDIA={f'assets/bgm/{k}.mp3' for k in ('main','battle-1','battle-2','battle-3','battle-4')}
W=Path(sys.argv[1]);out=W/'out';G=json.loads((out/'GRAPH.json').read_text());SOURCE=json.loads((out/'SOURCE-PROOF.json').read_text())
q={'status':'HOLD','scope':'Stage40 normal frozen first-turn PC/M. Only four approved native terrain owners; all scene, physics, RGBA and immutable HTTP proof. No deploy.', 'views':{}}
def flush():(out/'BROWSER.json').write_text(json.dumps(q,indent=2)+'\n')
def need(v,x):check(v,x)
def rgba(b):
 with Image.open(io.BytesIO(b))as i:
  return list(i.size),i.convert('RGBA').tobytes()
def record(name,typ,raw):
 f=name+'-'+typ+'.png';(out/f).write_bytes(raw);s,im=rgba(raw)
 return {'path':f,**fact(raw),'size':s,'rgbaSHA256':hashlib.sha256(im).hexdigest()}
OWN='''async()=>{
 const b=HonroApp.engine.b,s=HONRO_PROJECT.stages.find(i=>i.id==='stage-40');
 if(!s||s.width!==6656||s.height!==4096||b?.honroStage!==40)throw Error('wrong loaded Stage40');
 const expected=[
  ['approved40:body',0,0],['approved40:coastal-foundation',-4800,-1200],
  ['approved40:terrain-left-join',-4800,-1200],['approved40:terrain-right-join',4800,-1200],
 ];
 const hash=async x=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(x))))].map(v=>v.toString(16).padStart(2,'0')).join('');
 const active={},placements={};
 for(const [id,x,y] of expected){
  const e=s.elements.filter(n=>n.assetId===id), d=HONRO_PROJECT.library.filter(n=>n.id===id);
  const l=(b.honroLandmarks??[]).filter(n=>n.asset?.id===id);
  if(e.length!==1||d.length!==1||l.length!==1||e[0].x!==x||e[0].y!==y||e[0].rotation!==0||e[0].scale!==1||l[0].x!==x||l[0].y!==y||(l[0].scale??1)!==1)
   throw Error('wrong exact active placement '+id+' '+JSON.stringify([e.length,d.length,l.length,l[0]?.x,l[0]?.y,l[0]?.scale]));
  if(HonroVectorArt.validate(l[0].asset.vector).length||JSON.stringify(l[0].asset.vector)!==JSON.stringify(d[0].vector))
   throw Error('native vector validation/authority '+id);
  active[id]=await hash(l[0].asset.vector);placements[id]=e[0];
 }
 return {active,placements,terrain:s.terrains.length,actors:b.units.length,water:s.design.act4.harborWater.surface};
}'''
def visit(br,arm,port,w,h):
 origin=f'http://127.0.0.1:{port}/';key=f'{arm}-{w}x{h}'
 graph=G[arm];required={'HONRO.html',*graph['needs']}
 known={**graph['active'],'HONRO.html':graph['shell']}
 c=br.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
 need(c.storage_state()=={'cookies':[],'origins':[]},'fresh profile')
 p=c.new_page();errors=[];seen={};hits=[];pending=set()
 job={'frames':{},'pending':True};q['views'][key]=job;flush()
 def rel(url):return url.removeprefix(origin) if url.startswith(origin) and '?' not in url and '#' not in url else None
 def islocal(url):return url.startswith('data:') or url.startswith('blob:'+origin)
 def request(r):
  k=rel(r.url)
  if r.method!='GET' or not(k in known or (k in MEDIA and r.resource_type=='media') or islocal(r.url)):errors.append(['request',r.method,r.url])
  if k in known:pending.add(r)
 def response(r):
  k=rel(r.url)
  if k in known and r.status==200 and not r.from_service_worker:hits.append((k,r))
  elif not((k in MEDIA and r.status in (200,206) and r.request.resource_type=='media')or islocal(r.url)):errors.append(['response',r.url,r.status])
 def failed(r):
  pending.discard(r)
  if not(rel(r.url)in MEDIA and r.resource_type=='media' and r.failure=='net::ERR_ABORTED'):errors.append(['failed',r.url,r.failure])
 for nm,cb in [('request',request),('response',response),('requestfinished',lambda r:pending.discard(r)),('requestfailed',failed),('pageerror',lambda e:errors.append(['page',str(e)]))]:p.on(nm,cb)
 def drain():
  cutoff=time.monotonic()+25;last=quiet=at=0
  while time.monotonic()<cutoff:
   need(not errors,errors)
   while at<len(hits) and hits[at][1].request not in pending:
    k,r=hits[at];actual=fact(r.body());need(known[k]==actual,'actual response bytes drift '+k);seen[k]=actual;at+=1
   n=len(hits)
   quiet=quiet+1 if not pending and n==last and at==n and required<=seen.keys() else 0
   if quiet>=3:return
   last=n;p.wait_for_timeout(110)
  raise RuntimeError(('incomplete actual route',sorted(required-seen.keys()),[x.url for x in pending],errors))
 try:
  p.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
  r=p.goto(origin+'HONRO.html',wait_until='domcontentloaded',timeout=50000);need(r and r.status==200 and not r.from_service_worker,'normal app HTTP navigation')
  p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  p.evaluate("()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}")
  p.evaluate(O['LAUNCH'],40)
  el=p.locator('#battlecanvas');el.wait_for(state='visible')
  p.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim';}""",polling=125,timeout=12000)
  job['decode']=p.evaluate(O['DECODE']);need(job['decode']['registered']>0 and not job['decode']['failed'],'native decode')
  job['owners']=p.evaluate(OWN)
  owner_key='stockSHA' if arm=='A' else 'winnerSHA'
  need(job['owners']['active']=={x['id']:x[owner_key] for x in SOURCE['changedOwners']},'native active asset does not match guarded source build')
  need(job['owners']['water']==3762.5,'incorrect harbor plane')
  poses=[('southwest',(-1,1),None),('upper',(0,0),[1510,2120,.55 if w==1440 else .46]),('immersed',(0,0),[2610,4090,.50 if w==1440 else .42])]
  for label,(dx,dy),ordinary in poses:
   args={'id':40,'mapId':'stage-40','name':label if not ordinary else 'ordinary','dx':dx,'dy':dy,'ordinary':ordinary,'readback':False,'fixedNow':O['PHASE']}
   f=p.evaluate(O['FROZEN'],args);m=f['meta']; name=key+'-'+label
   raw=base64.b64decode(p.evaluate(O['CANVAS']),validate=True); dom=el.screenshot(animations='disabled', caret='hide',scale='css')
   a,b=record(name,'raw',raw),record(name,'dom',dom)
   m['physics']=hashlib.sha256(m.pop('signature').encode()).hexdigest()
   job['frames'][label]={'meta':m,'raw':a,'dom':b,'timingPhase':O['PHASE'],'cssBox':el.bounding_box()};flush()
   need(m['backing']==a['size'] and m['phase']=='aim' and m['round']==1 and m['sceneTime']==2 and m['actorCount']>0,'native loaded-state drift')
   need(base64.b64decode(p.evaluate(O['CANVAS']),validate=True)==raw,'actual canvas changed between raw and DOM')
   if label=='immersed':
    top=m['viewport']['top']; bottom=top+m['css']['h']/m['actual']['scale']
    need(top<3762.5 and bottom>4240,'immersed witness does not actually straddle the shore and lower artwork')
   if label=='upper':
    top=m['viewport']['top']; bottom=top+m['css']['h']/m['actual']['scale']
    need(top<2120<bottom,'upper witness overlooks protected walk')
  drain();job['pending']=False;job['verifiedHTTP']=seen
 finally:
  job['networkErrors']=errors;flush();c.close()
try:
 with sync_playwright() as pw:
  br=pw.chromium.launch(headless=True);q['browser']=br.version
  need(br.version=='151.0.7922.34','expected stock proof Chromium version')
  try:
   for w,h in [(1440,900),(390,844)]:
    for arm,port in [('A',18971),('B',18972)]:visit(br,arm,port,w,h)
  finally:br.close()
 mismatches=[];passes=0
 for w,h in [(1440,900),(390,844)]:
  a,b=[q['views'][f'{arm}-{w}x{h}']for arm in 'AB']
  ac,bc=[x['owners']['active']for x in (a,b)]
  need(set(ac)==set(bc) and all(ac[k]!=bc[k] for k in ac) and {k:v for k,v in a['owners'].items()if k!='active'}=={k:v for k,v in b['owners'].items()if k!='active'},'active art scope mismatch')
  for k in ('southwest','upper','immersed'):
   f,g=a['frames'][k],b['frames'][k]
   if any(f[x]!=g[x]for x in ('meta','timingPhase','cssBox')):mismatches.append([w,k,'state/pose/physics'])
   for t in ('raw','dom'):
    if f[t]['size']!=g[t]['size'] or f[t]['rgbaSHA256']!=g[t]['rgbaSHA256']:mismatches.append([w,k,t,'RGBA'])
    else:passes+=1
 q['pairedRGBAExacts']=passes;q['mismatches']=mismatches; flush()
 need(not mismatches and passes==12,'not all 12 paired normal raw/DOM images exact')
 q['status']='PASS_FROZEN_PC_M_RGBA_EXACT_NO_DEPLOY'
except Exception as e:q['error']=repr(e);raise
finally:flush()
