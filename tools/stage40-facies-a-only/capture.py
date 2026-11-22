"""Two real anonymous stock Stage40 frames; no product candidate or browser writeback."""
from pathlib import Path
import json,sys,hashlib,io,base64,urllib.request
from playwright.sync_api import sync_playwright
from PIL import Image
D=Path(__file__).resolve().parent;P=json.loads((D/'PINS.json').read_bytes());O=json.loads((D/'observer.json').read_bytes());base=P['publicRoot']
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
q={'status':'HOLD','scope':'Current e702 stock only, one common camera 2850,2850,.30; no authorization to author or deploy.','views':{}}
def save():(out/'READBACK.json').write_text(json.dumps(q,indent=2)+'\n')
def n(x,e):
 if not x:raise RuntimeError(e)
def sha(x):return hashlib.sha256(x).hexdigest()
def fact(x):return dict(bytes=len(x),sha256=sha(x))
def gitblob(x):return hashlib.sha1(f'blob {len(x)}\0'.encode()+x).hexdigest()
def get(k,pin):
 u=base+k;req=urllib.request.Request(u,headers={'Accept-Encoding':'identity','Cache-Control':'no-cache','User-Agent':'Mozilla/5.0 HONRO real Stage40 verification'})
 with urllib.request.urlopen(req,timeout=45)as r:
  b=r.read(pin['bytes']+1); n(r.status==200 and r.geturl()==u and fact(b)==pin,'mismatched official anonymous bytes '+k);return b
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
def stage(br,device,size):
 v={'errors':[]};q['views'][device]=v;save();ctx=br.new_context(viewport=dict(zip(('width','height'),size)),device_scale_factor=1,service_workers='block')
 p=ctx.new_page();required={base+k for k in P['currentRoutes']};responses={}
 p.on('response',lambda r:responses.setdefault(r.url,r) if r.url in required else None)
 p.on('pageerror',lambda e:v['errors'].append(str(e)))
 try:
  p.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
  u=base+'HONRO.html';r=p.goto(u,wait_until='domcontentloaded',timeout=50000)
  n(r and r.url==u and r.status==200 and not r.from_service_worker and fact(r.body())==P['stableShell'],'wrong live normal app')
  p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  p.evaluate("()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}")
  p.evaluate(O['LAUNCH'],40);p.locator('#battlecanvas').wait_for(state='visible')
  p.wait_for_function("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim';}",timeout=15000,polling=125)
  d=dict(id=40,mapId='stage-40',name='ordinary',ordinary=P['pose'],dx=0,dy=0,readback=False,fixedNow=O['PHASE'])
  p.evaluate(O['DECODE'])
  m=p.evaluate(O['FROZEN'],d)['meta'];m['physics']=sha(m.pop('signature').encode())
  raw=base64.b64decode(p.evaluate(O['CANVAS']),validate=True);dom=p.screenshot(timeout=15000)
  for kind,b in [('RAW',raw),('DOM',dom)]:
   name=device+'-r0-southwest-'+kind+'.png';(out/name).write_bytes(b)
   with Image.open(io.BytesIO(b))as im:
    dim=list(im.size);rgba=sha(im.convert('RGBA').tobytes())
   v[kind]={'path':name,'size':dim,'png':fact(b),'rgbaSHA256':rgba}
  v['meta']=m;save()
  e=P['physics'][str(size[0])];p0=P['pose'];z=m['actual']['scale'];a=m['actual'];f=m['focus'];b=m['viewport']
  n(m['desired']==dict(zip(('x','y','scale'),p0)) and all(abs(a[k]-w)<1e-6 for k,w in zip(('x','y','scale'),p0)) and f['left']<=a['x']<=f['right'] and f['top']<=a['y']<=f['bottom'] and m['zoomLimits']['min']<z<=m['zoomLimits']['max'],'live ordinary camera was clamped')
  n(m['backing']==e['backing']==v['RAW']['size'] and v['DOM']['size']==size and m['css']==e['css'] and m['physics']==e['hash'],'exact physics/viewport/backing drift')
  x,y,xx,yy=P['estimateWorldCrop'];v['sourceRoiInCanvasCSS']=[(x-b['left'])*z,(y-b['top'])*z,(xx-b['left'])*z,(yy-b['top'])*z]
  n(0<=v['sourceRoiInCanvasCSS'][0]<v['sourceRoiInCanvasCSS'][2]<=m['css']['w'] and 0<=v['sourceRoiInCanvasCSS'][1]<v['sourceRoiInCanvasCSS'][3]<=m['css']['h'],'source ROI offscreen')
  ex=P['firstTurn'];n(m['phase']==ex['phase'] and m['round']==ex['round'] and m['actorCount']==ex['actors'] and m['sceneTime']==2,'nonstandard normal first-turn camera witness')
  v['owners']=p.evaluate(OWN)
  n(v['owners']['active']==P['owners'] and all(v['owners'][k]==ex[k] for k in ('actors','terrain','water')),'actual authority of owner or navigation changed')
  n(p.evaluate("()=>{const b=HonroApp.engine.b; return b.honroStage===40 && b.mode==='campaign' && b.honroCanonical===true && b.honroMapOrigin==='campaign' && b.honroCustom===false && !HonroApp.debugMode && !HonroApp.training;}"),'not ordinary campaign mode')
  n(base64.b64decode(p.evaluate(O['CANVAS']),validate=True)==raw,'scene changed across real capture')
  v['verifiedHTTP']={}
  for k,expected in P['currentRoutes'].items():
   t=responses.get(base+k);n(t and t.status==200 and not t.from_service_worker and fact(t.body())==expected,'missing exact loaded map/assets/renderer '+k)
   v['verifiedHTTP'][k]=expected
  n(not v['errors'],'unexpected normal page errors');v['validation']='PASS'
 except Exception as e:
  v['errors'].append(repr(e));print(device,repr(e),flush=True)
 finally:ctx.close();save()
save()
try:
 n(P['enabled'] is True and base=='https://sys8994.github.io/honro/','unexpected public origin')
 r=P['release']['manifest'];m=get('web/manifest.json',{k:r[k]for k in ('bytes','sha256')});n(gitblob(m)==r['git'],'exact live manifest git mismatch')
 m1=json.loads(m);current={o['path']:{k:o[k]for k in ('bytes','sha256')}for o in m1['files']}
 n(m1['project']==P['project'] and m1['gameEntry']==P['gameEntry'] and all(current[k]==pin for k,pin in {**P['currentRoutes'],**P['peer46ManifestOnly']}.items()),'Stage40/46 active closure drift')
 c=json.loads(get(P['project'],P['currentRoutes'][P['project']]))
 n(all([c['stages'][int(i)-1],c['stageLibraries'][int(i)-1]]==p for i,p in P['campaignBindings'].items()),'stage40/46 campaign pointer drift')
 q['exactManifest']=r;q['peer46DescriptorsVerified']=len(P['peer46ManifestOnly']);save()
 with sync_playwright()as pw:
  b=pw.chromium.launch(headless=True)
  try:
   n(b.version=='151.0.7922.34','wrong official Chrome');q['chromium']=b.version
   for device,size in [('PC',[1440,900]),('M',[390,844])]:stage(b,device,size)
  finally:b.close()
 n({k:v.get('validation') for k,v in q['views'].items()}=={'PC':'PASS','M':'PASS'},'one or more actual views held')
 q['status']='PASS_EXACT_E702_TWO_ACTUAL_STAGE40_STOCK_VIEWS'
finally:save()
