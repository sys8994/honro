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
def stage(br,device,size,dpr,arm):
 key=f'{device}-DPR{dpr}-{arm}'
 v={'errors':[],'cases':{}};q['views'][key]=v;save()
 ctx=br.new_context(viewport=dict(zip(('width','height'),size)),device_scale_factor=dpr,service_workers='block')
 p=ctx.new_page();required={base+k for k in P['currentRoutes']};responses={}
 p.on('response',lambda r:responses.setdefault(r.url,r) if r.url in required else None);p.on('pageerror',lambda e:v['errors'].append(str(e)))
 try:
  p.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
  u=base+'HONRO.html';r=p.goto(u,wait_until='domcontentloaded',timeout=50000)
  n(r and r.url==u and r.status==200 and not r.from_service_worker and fact(r.body())==P['stableShell'],'wrong live normal app')
  p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  p.evaluate("()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}")
  p.evaluate(O['LAUNCH'],40);p.locator('#battlecanvas').wait_for(state='visible')
  p.wait_for_function("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim';}",timeout=15000,polling=125)
  p.evaluate(O['DECODE'])
  scene_predicates='''()=>{const a=HonroApp,s=a.scene,b=a.engine.b;return {stage:b.honroStage===40,campaign:b.mode==='campaign',canonical:b.honroCanonical===true,nonCustom:b.honroCustom===false,origin:b.honroMapOrigin==='campaign',bound:s.battle===b};}'''
  before=p.evaluate(scene_predicates)
  initial=dict(id=40,mapId='stage-40',name='ordinary',ordinary=P['pose'],dx=0,dy=0,readback=False,fixedNow=O['PHASE'])
  b0=p.evaluate(O['FROZEN'],initial)['meta']
  after=p.evaluate(scene_predicates)
  v['stockPrime']={'before':before,'after':after,'model':sha(b0['signature'].encode()),'pose':b0['actual']};save()
  n(all(after.values()) and v['stockPrime']['model']==P['physics'][str(size[0])]['hash'],('wrong genuine rendered stock scene',after))
  v['owners']=p.evaluate(OWN);ex=P['firstTurn']
  n(v['owners']['active']==P['owners'] and all(v['owners'][k]==ex[k] for k in ('actors','terrain','water')),'actual authority of owner or navigation changed')
  local={k:(D/k).read_text()for k in P['localCodeSeal']}
  n(all(sha(local[k].encode())==pin for k,pin in P['localCodeSeal'].items()),'scope components not exact')
  if arm!='A':n(p.evaluate(local['install-signed-observer.js'],{'enabled':True,'lane':arm,'source':local['pinned-runtime-authority.txt'],'pin':json.loads(local['SIGNED-CLIPS.json']),'painterSHA':P['localCodeSeal']['pinned-runtime-authority.txt']}) is True,'observer not installed')
  poses={'central':[2850,2850,.30],'east':[3850,2850,.30]}
  if dpr==1:poses.update({'minimum':None,'direct':[2850,2850,1.06]})
  def capture(name,pose):
   d=dict(id=40,mapId='stage-40',name='ordinary' if pose else 'southwest',ordinary=pose,dx=-1,dy=1,readback=False,fixedNow=O['PHASE'])
   m=p.evaluate(O['FROZEN'],d)['meta'];m['physics']=sha(m.pop('signature').encode());known=P['physics'][str(size[0])]
   n(m['physics']==known['hash'] and m['phase']==ex['phase'] and m['round']==ex['round'] and m['actorCount']==ex['actors'] and m['sceneTime']==2,'native physics drift')
   if pose:n(all(abs(m['actual'][k]-t)<1e-6 for k,t in zip(('x','y','scale'),pose)),'clamped diagnostic pose')
   outrow=v['cases'][name]={'meta':m,'sample':{},'timing':[]};save()
   samples=7 if name=='central' else 1
   for k in range(samples):
    x=p.evaluate(FRAMES,{'observe':k==0,'frozen':O['FROZEN'],'config':d})
    if k==0:
     outrow['sample']=x['state']
     raw=base64.b64decode(p.evaluate(O['CANVAS']),validate=True)
     if name=='central':
      dest=key+'-native-scene-RAW.png';(out/dest).write_bytes(raw)
      outrow['scenePNG']={'path':dest,**fact(raw)}
     with Image.open(io.BytesIO(raw))as im:
      outrow['warmRGBA']=sha(im.convert('RGBA').tobytes())
     n(outrow['warmRGBA']==x['state']['warm']['scene'],'readback pixel identity mismatch')
     save()
    outrow['timing'].append(x['timing'])
   n((name=='direct')==notiles(outrow['sample']),'wrong native tile or direct path')
  for name,pose in poses.items():capture(name,pose)
  for k,expected in P['currentRoutes'].items():
   t=responses.get(base+k);n(t and t.status==200 and not t.from_service_worker and fact(t.body())==expected,'missing exact loaded map/assets/renderer '+k)
  n(not v['errors'],'unexpected normal page errors');v['validation']='PASS'
 except Exception as e:
  v['errors'].append(repr(e));print(key,repr(e),flush=True)
 finally:
  if arm!='A':
   try:p.evaluate("()=>window.__honroStage40ClipReadonly?.restore()")
   except Exception as e:v['errors'].append(repr(e));v['validation']='HOLD'
  ctx.close();save()
def notiles(s):return all(not s[key]['tiles']for key in ('cold','settled','warm'))
FRAMES=r'''async ({observe,frozen,config})=>{
 const a=HonroApp,s=a.scene,begin=performance.now.bind(performance),invoke=new Function('return ('+frozen+')')();
 const stockStats=()=>{const o=s.renderCacheStats();return [o.domainTileBuilds||0,o.screenHits||0,o.worldHits||0]};
 const hook=()=>window.__honroStage40ClipReadonly?.read()||null;
 const exact=async x=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',x))].map(b=>b.toString(16).padStart(2,'0')).join('');
 const pix=c=>{const z=c.getContext('2d');return z.getImageData(0,0,c.width,c.height).data;};
 const sl=()=>{s._releaseDomainTiles();s._releaseRasterCanvas(s._screenWorldCache?.canvas);s._screenWorldCache=null;s._staticWorldCache=null;};
 sl();
 const take=async label=>{
  const from=stockStats(),h0=hook(),t=begin();invoke({...config,readback:true});const render=begin()-t,to=stockStats(),h1=hook();
  const time=render,state={cache:to.map((v,i)=>v-from[i]),hook:h0&&Object.fromEntries(Object.entries(h1).map(([k,v])=>[k,v-h0[k]]))};
  if(observe){state.scene=await exact(pix(s.canvas));state.tiles={};for(const [k,v] of s._domainTiles?.tiles||[])state.tiles[k]=await exact(pix(v.canvas));}
  return {time,state};
 };
 const c=await take('cold'),m=await take('settled'),w=await take('warm');
 return {timing:{cold:c.time,warm:w.time},state:observe?{cold:c.state,settled:m.state,warm:w.state}:undefined};
}'''
def compare_all():
 from statistics import median
 result={};q['strictComparison']=result
 for dev in ('PC','M'):
  for d in [1,2]:
   lanes={a:q['views'][f'{dev}-DPR{d}-{a}']for a in ('A','A0','B')}
   n(all(v.get('validation')=='PASS' and not v['errors'] for v in lanes.values()),'missing case family '+dev)
   for k in lanes['A']['cases']:
    a,a0,b=(lanes[x]['cases'][k]for x in ('A','A0','B'))
    n(a['meta']==a0['meta']==b['meta'],'camera or physics drift '+k)
    rec={}
    for key in ('cold','settled','warm'):
     x,y,z=(c['sample'][key]for c in (a,a0,b))
     n(all(x[v]==y[v]==z[v] for v in ('scene','tiles','cache')),f'unexpected pixel/tile/cache change {dev} {d} {k} {key}')
     n(y['hook']['skipped']==0 and (k!='direct' or z['hook']['skipped']==0),'hook negative outside planned tile mode')
     rec[key]={'tileCount':len(x['tiles']),'bodyBranchesSkipped':z['hook']['skipped'],'rgbaExact':True,'cache':x['cache']}
    n(k=='direct' or rec['cold']['bodyBranchesSkipped']>0,'missing positive culling proof')
    record={'checks':rec,'timing':{}}
    for lane,c in [('A',a),('A0',a0),('B',b)]:
     record['timing'][lane]={which:{'median':median(s),'min':min(s),'max':max(s),'n':len(s)} for which in ('cold','warm') if (s:=[x[which]for x in c['timing']])}
    result[f'{dev}-DPR{d}-{k}']=record
    save()
 n(len(result)==12,'incomplete expected real PC/M pose cross-section')
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
   for device,size in [('PC',[1440,900]),('M',[390,844])]:
    for dpr in [1,2]:
     for arm in (('A','A0','B') if dpr==1 else ('B','A0','A')):stage(b,device,size,dpr,arm)
  finally:b.close()
 compare_all()
 q['status']='PASS_E702_EXACT_SCENE_AND_TILES_DIAGNOSTIC_ONLY'
finally:save()
