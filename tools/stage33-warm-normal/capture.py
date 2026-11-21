"""Normal A/B isolated Chromium. No product mutation or publication."""
import base64,json,re,sys,time
from math import ceil,floor
from io import BytesIO
from PIL import Image
from pathlib import Path
from guard import facts,sha,save,obj,CANON,ID,BASE
from metrics import pixels,raster,P
PARK=(Path(__file__).parent/'park.js').read_text()
VIEWS={'north':(0,-1),'south':(0,1),'southwest':(-1,1),'southeast':(1,1)}
PNG="()=>HonroApp.scene.canvas.toDataURL('image/png').split(',')[1]"
MEDIA={f'assets/bgm/{n}.mp3'for n in ('main','battle-1','battle-2','battle-3','battle-4')}
def raw_png(b):
 im=Image.open(BytesIO(b)).convert('RGBA');im.load();return im
INIT=r"""()=>{
 const images=new Set(), blobs=new Set();
 const proto=HTMLImageElement.prototype, d=Object.getOwnPropertyDescriptor(proto,'src');
 Object.defineProperty(proto,'src',{...d,set(v){images.add(this);return d.set.call(this,v);}});
 const create=URL.createObjectURL;
 URL.createObjectURL=function(...args){const url=Reflect.apply(create,this,args);blobs.add(url);return url};
 Object.defineProperty(window,'__honroObserver',{value:{images,blobs},enumerable:false});
}"""
LAUNCH=r"""async id=>{
 const a=window.HonroApp;
 if(!a||typeof a.launch!=='function')throw Error('Normal app unavailable');
 a.frame=()=>{};
 a.profile.settings.music=false;a.profile.settings.sound=false;
 await HonroCampaignLoader.ensureStage(id);
 for(let n=1;n<id;n++)a.profile.cleared[n]=true;
 for(const h of Object.values(a.profile.heroes))h.xp=HonroProgression.xpAt(HonroProgression.plan(id).entryLevel);
 a.launch(id);
 if(a.engine?.b?.honroStage!==id)throw Error('Campaign wrong stage');
 for(let n=0;n<40&&a.dialogue;n++)HonroStory.finish(a);
 if(a.dialogue)throw Error('Entry dialogue remains');
 a.close();HonroStoryFraming.clear(a.scene);
}"""
DECODE=r"""async()=>{
 const chosen=new Set([...document.images,...__honroObserver.images].filter(i=>i.currentSrc||i.src));
 await Promise.race([Promise.all([document.fonts.ready,...Array.from(chosen,i=>i.decode())]),
    new Promise((_,bad)=>setTimeout(()=>bad(Error('declared image decode timeout')),30000))]);
 const failed=[...chosen].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.currentSrc||i.src);
 return {registered:chosen.size,font:document.fonts.status,failed};
}"""
OBSERVE=r"""async law=>{
 const app=HonroApp,b=app.engine.b,st=HONRO_PROJECT.stages.find(x=>x.id==='stage-33');
 const h=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(x)))),n=>n.toString(16).padStart(2,'0')).join('');
 const registered=HONRO_PROJECT.library.filter(x=>x.id===law.asset);
 const declared=st?.elements?.filter(e=>e.assetId===law.asset)??[];
 const native=(window.HonroTerrainDomain?.materialLandmarks?.(b)??[]).filter(x=>x.asset?.id===law.asset);
 if(registered.length!==1||native.length!==1||declared.length!==1||declared[0].x!==0||declared[0].y!==0||declared[0].scale!==1||declared[0].collision||!Array.isArray(registered[0].collision)||registered[0].collision.length)
  throw Error('physical/source lowland placement unexpectedly changed');
 const sourceSHA=await h(registered[0]),vectorSHA=await h(registered[0].vector),actual=await h(native[0].asset.vector);
 if(sourceSHA!==law.whole||vectorSHA!==law.vector||actual!==law.vector)
  throw Error('wrong canonical registered/actual native lowland vector hash '+[sourceSHA,vectorSHA,actual]);
 return {owners:native.length,sourceSHA,vectorSHA,nativeSHA:actual,layer:native[0].layer,declared:declared[0]};
}"""
def capture(browser,variant,arm,w,h,out,proof):
 base=arm['origin']; known={**arm['active'],'HONRO.html':arm['shell'],CANON:arm['manifest']}
 assert base in ('http://127.0.0.1:18961/','http://127.0.0.1:18962/')
 blob=re.compile(r'blob:'+re.escape(base)+r'[\da-f-]{36}')
 def key(x):return x[len(base):] if x.startswith(base) and not any(c in x for c in '?#') else None
 ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
 assert ctx.storage_state()=={'cookies':[],'origins':[]}
 page=ctx.new_page();page.set_default_timeout(30000)
 page.add_init_script('('+INIT+')()')
 errors=[];pending=set();hits=[];verified=set();blobs=set();pos=0
 state={'side':variant,'device':[w,h],'errors':errors,'status':'INIT'}
 proof['visits'].append(state)
 def emit():save(out/'RECEIPT.json',proof)
 def req(q):
  p=key(q.url)
  if not (q.method=='GET' and (p in known or p in MEDIA and q.resource_type=='media' or blob.fullmatch(q.url) or q.url.startswith('data:'))):
   errors.append(['noncanonical request',q.method,q.url])
  if p in known:pending.add(q)
 def fail(q):
  pending.discard(q)
  if not (key(q.url) in MEDIA and q.resource_type=='media' and q.failure=='net::ERR_ABORTED'):errors.append(['failed request',q.url,q.failure])
 def response(r):
  p=key(r.url)
  if p in known and r.status==200:hits.append((p,r))
  elif blob.fullmatch(r.url) and r.status==200:blobs.add(r.url)
  elif p in MEDIA and r.request.resource_type=='media' and r.status in (200,206):pass
  elif not r.url.startswith('data:'):errors.append(['unexpected response',r.status,r.url])
 page.on('request',req);page.on('requestfinished',lambda r:pending.discard(r))
 page.on('requestfailed',fail);page.on('response',response);page.on('pageerror',lambda e:errors.append(['pageerror',str(e)]))
 needs=set(arm['needs'])|{'HONRO.html'}
 def drain():
  nonlocal pos
  quiet=0;end=time.monotonic()+18
  while time.monotonic()<end:
   assert not errors,errors
   while pos<len(hits) and hits[pos][1].request not in pending:
    k,r=hits[pos];assert facts(r.body())==known[k],('observed request bytes',variant,k);verified.add(k);pos+=1
   before=(pos,len(blobs));page.wait_for_timeout(110)
   quiet=quiet+1 if before==(len(hits),len(blobs)) and not pending and needs<=verified else 0
   if quiet==3:
    assert not errors and blobs<=set(page.evaluate('()=>Array.from(__honroObserver.blobs)'))
    state['requiredObserved']=sorted(needs);state['observedVerifiedCount']=len(verified);return
  raise RuntimeError(('missing required HTTP app body',sorted(needs-verified),sorted(x.url for x in pending),errors))
 try:
  shell=page.goto(base+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
  assert shell and shell.url==base+'HONRO.html' and shell.status==200 and facts(shell.body())==known['HONRO.html']
  page.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof window.HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  page.evaluate(LAUNCH,33)
  canvas=page.locator('#battlecanvas');canvas.wait_for(state='visible')
  page.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
    return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue);}""",polling=125,timeout=12000)
  page.evaluate("()=>HonroApp.scene.render(HonroApp.engine,0,'',.6,false,0)")

  key=f's33-{w}x{h}'
  for name,(dx,dy) in VIEWS.items():
   k=key+'-'+name;state['attempt']=k;emit()
   q={'stage':33,'id':'stage-33','name':name,'dx':dx,'dy':dy,'readback':False}
   f=page.evaluate(PARK,q); decode=page.evaluate(DECODE)
   assert decode['registered']>0 and decode['font']=='loaded' and not decode['failed']
   assert page.evaluate(PARK,{**q,'readback':True})==f
   owner=page.evaluate(OBSERVE,{'asset':ID,'whole':arm['ownerSHA'],'vector':arm['vectorSHA']})
   assert owner['owners']==1 and owner['sourceSHA']==arm['ownerSHA'] and owner['vectorSHA']==arm['vectorSHA']
   exact={x:v for x,v in P['views'][key][name].items()if x!='rawSHA256'}
   assert {x:f[x]for x in exact}==exact,(variant,k,'actual pose/physics mismatched')
   assert f['phase']=='aim' and f['round']==1 and f['sceneTime']==2
   drain()
   data=base64.b64decode(page.evaluate(PNG),validate=True)
   dom=canvas.screenshot(animations='disabled',timeout=30000)
   assert base64.b64decode(page.evaluate(PNG),validate=True)==data,(variant,k,'same arm frozen frame drift')
   row={**f,'sourceOwner':owner,'imageDecode':decode,'stockArchiveRawExact':(sha(data)==P['views'][key][name]['rawSHA256'])if variant=='A'else None}
   for label,x in (('raw',data),('dom',dom)):
    im=raw_png(x);assert im.width==exact['backing'][0]and im.height in (exact['backing'][1],exact['backing'][1]+1)
    filename=f'{variant}-{k}-{label}.png';(out/filename).write_bytes(x);row[label]=filename;row[label+'SHA256']=sha(x)
   proof['frames'][variant+'-'+k]=row;emit()
  del state['attempt'];state['status']='CAPTURED'
 except Exception as e:state['status']='HOLD';errors.append(['first failed gate',repr(e)])
 finally:emit();ctx.close()

def paired(out,p):
 status=True
 for device,poses in P['views'].items():
  for n in poses:
   k=device+'-'+n
   if not all(v+'-'+k in p['frames']for v in ('A','B')):
    status=False;continue
   a,b=(p['frames'][v+'-'+k]for v in ('A','B')); north=n=='north'
   assert a['sourceOwner']['declared']==b['sourceOwner']['declared'] and a['sourceOwner']['layer']==b['sourceOwner']['layer']
   assert all(a.get(key)==b.get(key)for key in ('actual','viewport','physics','tide','actualDrawOwnerIDs','actualTerrainIDs'))
   row={}
   for label in ('raw','dom'):
    im0,im1=[raw_png((out/f[label]).read_bytes())for f in (a,b)]
    d=pixels(im0,im1,a,north)
    if not north:
     r=raster(im0,im1,a)
     measured=(r['oldBoundaryAColumns']>=.80*r['testedColumns']and
       r['oldBoundaryBLongest']<=.60*r['oldBoundaryALongest']and r['oldBoundaryBColumns']<=.70*r['oldBoundaryAColumns'] and
       r['warmBrightBChangedColumns']<=.05*r['testedColumns'] and r['warmBrightBLongest']<=(8 if im0.width==1440 else 3))
     d.update(raster=r,oldCutAndHalo=measured);d['strict'] &= measured
     if label=='raw':
      z=a['actual']['scale']; top=a['viewport']['top']
      y0=max(0,floor((4750-top)*z));y1=min(im0.height,ceil((5980-top)*z))
      crops=[x.crop((0,y0,x.width,y1)) for x in (im0,im1)]
      paired=Image.new('RGBA',(im0.width,(y1-y0)*2+3),(25,28,34,255));paired.paste(crops[0],(0,0));paired.paste(crops[1],(0,y1-y0+3))
      paired.save(out/(k+'-actual-A-top-B-bottom-1x.png'))
    row[label]=d;status &= d['strict']
   p['comparisons'][k]=row;save(out/'RECEIPT.json',p)
 return status
def main(work):
 from playwright.sync_api import sync_playwright
 out=work/'out';g=obj((out/'GRAPH.json').read_bytes())
 p={'status':'INIT','scope':'actual clean diagnostic public-version normal renderer A/B only; not live combat or tide progression; never deployment','release':BASE,
   'visits':[],'frames':{},'comparisons':{}}
 try:
  with sync_playwright()as pw:
   browser=pw.chromium.launch(headless=True);p['browser']=browser.version;assert browser.version=='151.0.7922.34'
   try:
    for w,h in ((1440,900),(390,844)):
     for side in ('A','B'):capture(browser,side,g[side],w,h,out,p)
   finally:browser.close()
  ok=paired(out,p)
  assert len(p['frames'])==16 and len(p['comparisons'])==8 and all(v['status']=='CAPTURED'for v in p['visits']),'partial actual captures'
  assert ok,'signed/alpha/opposite exact or old-line/new-halo measurement gate'
  p['status']='PASS_EXACT_STAGE33_NORMAL_PIXEL_SCOPE_PENDING_HUMAN'
 except Exception as e:p.update(status='HOLD',error=repr(e));raise
 finally:save(out/'RECEIPT.json',p)
if __name__=='__main__':main(Path(sys.argv[1]))
