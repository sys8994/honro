"""Strict diagnosed fresh A1/A2/B route in current published app; not normal compiler or save proof."""
import json,sys,base64,hashlib,io,re,traceback,urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image,ImageChops
from derive import derive,fact,sha
D=Path(__file__).resolve().parent
P=json.loads((D/'PINS.json').read_bytes()); O=json.loads((D/'observer.json').read_bytes())
base=P['publicRoot']; proofdir=Path(sys.argv[1]); proofdir.mkdir(parents=True,exist_ok=True)
q={'status':'HOLD','scope':'Chrome public runtime on e702; fresh observer QA only; B changes one browser-local fixture response at exact Stage42 packet URL; no compile, no saves, no edits to live origin; full RGBA0 only','visits':{},'comparisons':{}}
def save():(proofdir/'README-EVIDENCE.json').write_text(json.dumps(q,indent=2)+'\n')
def ensure(x,msg):
 if not x:raise RuntimeError(msg)
def git(buf):return hashlib.sha1(f'blob {len(buf)}\0'.encode()+buf).hexdigest()
def matches(raw,pin):
 return len(raw)==pin['bytes'] and ('git' not in pin or git(raw)==pin['git']) and ('sha256' not in pin or sha(raw)==pin['sha256'])
def get(path,pin):
 url=base+path
 request=urllib.request.Request(url,headers={'Accept-Encoding':'identity','Cache-Control':'no-cache','User-Agent':'Mozilla/5.0 HONRO non-mutating diagnostic'})
 with urllib.request.urlopen(request,timeout=45) as h:
  buf=h.read(pin['bytes']+1)
  ensure(h.geturl()==url and h.status==200 and matches(buf,pin),'public authority '+path)
 return buf
def stage(br,device,arm,routes,body):
 dev=P['devices'][device]; visit=device+'-'+arm; result={'records':{},'served':{},'exactRouteHits':0};q['visits'][visit]=result;save()
 ctx=br.new_context(viewport=dict(zip(['width','height'],dev['size'])),device_scale_factor=1,service_workers='block')
 try:
  p=ctx.new_page(); requested=[]; responses={}; errors=[]
  p.on('request',lambda r:requested.append(r.url))
  p.on('pageerror',lambda e:errors.append(str(e)))
  p.on('response',lambda r:responses.setdefault(r.url,r) if r.url in routes else None)
  p.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
  if body is not None:
   def supply(route):
    r=route.request
    ensure(r.url==base+P['packetPath'] and r.method=='GET' and result['exactRouteHits']==0,'unexpected exact packet interception')
    result['exactRouteHits']+=1
    route.fulfill(status=200,content_type='application/json; charset=utf-8',headers={'Cache-Control':'no-store'},body=body)
   p.route(lambda u:u==base+P['packetPath'],supply,times=1)
  response=p.goto(base+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
  ensure(response and response.url==base+'HONRO.html' and response.status==200 and not response.from_service_worker and matches(response.body(),P['authority']['HONRO.html']),'current normal shell wrong')
  p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  p.evaluate("()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}")
  p.evaluate(O['LAUNCH'],42);p.locator('#battlecanvas').wait_for(state='visible')
  p.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim';}""",timeout=14000)
  owner=p.evaluate("""()=>{const b=HonroApp.engine.b;const owners=HonroTerrainDomain.materialLandmarks(b).filter(x=>x.asset?.id==='act5:near:42');
   if(b.honroStage!==42||b.honroCanonical!==true||b.honroCustom!==false||b.honroMapOrigin!=='campaign'||owners.length!==1)throw Error('wrong canonical stage or provider count');
   const t=owners[0],s=JSON.stringify(t.asset);let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);
   return {id:t.asset.id,p:[t.x,t.y,t.scale,t.rotation||0],wall:!!t.asset.edgeWall,surface:!!t.asset.edgeSurface,signature:s.length+':'+(h>>>0).toString(16)};}""")
  result['owner']=owner; save()
  ensure(owner==dict(id='act5:near:42',p=[0,0,6500/2022,0],wall=True,surface=True,signature=P['ownerByArm'][arm]),'exact provider stamp wrong '+visit)
  for name,(mode,k) in dev['views'].items():
   def observe(readback=False):
    m=p.evaluate(O['FROZEN'],dict(id=42,mapId='stage-42',name=mode,ordinary=k if mode=='ordinary' else [],dx=k[0] if mode!='ordinary' else 0,dy=k[1] if mode!='ordinary' else 0,readback=readback,fixedNow=O['PHASE']))
    m['meta']['physics']=sha(m['meta'].pop('signature').encode())
    return m
   v=observe()
   p.evaluate(O['DECODE'])
   ensure(v==observe(True),'clock/camera/physical state changed after stock paint/decode')
   m=v['meta']; a=m['actual']
   ensure(m['phase']=='aim' and m['round']==1 and m['sceneTime']==2 and m['physics']==P['physics'] and m['backing']==dev['backing'],'wrong actual phase/backing/geometry')
   want=dict(zip(('x','y','scale'),k)) if mode=='ordinary' else None
   ensure(a==want if want else abs(a['scale']-m['zoomLimits']['min'])<1e-7,'unexpected actual camera')
   raw=base64.b64decode(p.evaluate(O['CANVAS']),validate=True)
   dom=p.locator('#battlecanvas').screenshot(animations='disabled',caret='hide',scale='css',timeout=25000)
   pair={}
   for kind,buf in [('raw',raw),('dom',dom)]:
    image=f'{visit}-{name}-{kind}.png'
    with Image.open(io.BytesIO(buf)) as z:
     sizes=list(z.size);ensure( (sizes==dev['backing'] if kind=='raw' else abs(sizes[0]-m['css']['w'])<2 and abs(sizes[1]-m['css']['h'])<2),'frame backing or CSS dimensions')
     pair[kind]={'file':image,**fact(buf),'size':sizes,'rgba':sha(z.convert('RGBA').tobytes())}
    (proofdir/image).write_bytes(buf)
   result['records'][name]={'pose':v,'pictures':pair};save()
  for url,signed in routes.items():
   r=responses.get(url)
   ensure(r and r.status==200 and not r.from_service_worker and matches(r.body(),signed),'required actual browser route/wire '+url)
   result['served'][url[len(base):]]=fact(r.body())
  result['packetRequests']=requested.count(base+P['packetPath'])
  ensure(result['exactRouteHits']==(0 if arm=='A1' else 1) and result['packetRequests']==1,'wrong one-leaf response or reused fetch')
  ensure(not errors and all(not u.startswith(base+P['legacyPath']) for u in requested),'stock app error or unexpected archived Stage32 route')
  save()
 finally:ctx.close()
def delta(x,y):
 with Image.open(proofdir/x['file'])as a,Image.open(proofdir/y['file'])as b:
  ensure(a.size==b.size,'RGBA size difference')
  vals=ImageChops.difference(a.convert('RGBA'),b.convert('RGBA')).split()
  all_=ImageChops.lighter(ImageChops.lighter(vals[0],vals[1]),ImageChops.lighter(vals[2],vals[3]))
  hs=all_.histogram(); alpha=vals[3].histogram(); box=all_.getbbox()
  h=all_.width*all_.height
  return {'changed':h-hs[0],'alpha':h-alpha[0],'maxDN':max(i for i,v in enumerate(hs) if v),'bbox':box}
def compare(first,last):
 issue=[]
 names={(k,d)for k,v in P['devices'].items()for d in v['views']}
 for dev,view in sorted(names):
  a=q['visits'][dev+'-'+first]['records'][view];b=q['visits'][dev+'-'+last]['records'][view]
  pose=a['pose']==b['pose']
  d={kind:delta(a['pictures'][kind],b['pictures'][kind]) for kind in ('raw','dom')}
  tag=f'{dev}-{view}:{first}/{last}'
  q['comparisons'][tag]={'poseExactlySame':pose,**d}
  if not pose or any(v['changed'] for v in d.values()):issue.append(tag)
 save()
 return issue
save()
try:
 ensure(P['enabled'] is True and base=='https://sys8994.github.io/honro/','intentionally disabled or invalid anonymous origin')
 ensure(P['packetPath']=='web/data/chapter-42-assets.abdbc9d7a8ce717e.json','unexpected mutable route')
 manifest=get('web/manifest.json',P['authority']['web/manifest.json']);q['publicManifest']=fact(manifest)
 authorities={**P['s42ImmutableRoutes'],**{k:v for k,v in P['authority'].items()if k not in ('web/manifest.json','HONRO.html')}}
 original=get(P['packetPath'],{**P['s42ImmutableRoutes'][P['packetPath']],'git':P['packetGit']})
 recipe=(D/'RECIPE.json').read_bytes();ensure(sha(recipe)==P['recipeSHA256'],'wrong proof recipe')
 payload,d=derive(original,json.loads(recipe));q['sourceDerivation']=d; save()
 with sync_playwright()as pw:
  b=pw.chromium.launch(headless=True);q['chromium']=b.version
  try:
   ensure(b.version==P['chrome'],'wrong Chrome')
   for a in ('A1','A2'):
    for dev in P['devices']:stage(b,dev,a,{base+k:v for k,v in authorities.items()},None if a=='A1' else original)
   aafail=compare('A1','A2');ensure(not aafail,'A/A full RAW/DOM or state mismatch: '+repr(aafail))
   B={**authorities,P['packetPath']:fact(payload)}
   for dev in P['devices']:stage(b,dev,'B',{base+k:v for k,v in B.items()},payload)
   ensure(not compare('A2','B'),'A/B full-frame strict gate failed (no tolerance)')
  finally:b.close()
 q['status']='PASS_STRICT_CHROMIUM_FRESH_DIAGNOSTIC_ONLY_NO_SAVE_OR_RELEASE_AUTHORITY'
except Exception:
 q['firstFailure']=traceback.format_exc(limit=6);raise
finally:save()
