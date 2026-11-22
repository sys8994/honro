"""Conditional no-build Stage29 high-raster PC A/B only; no release."""
from pathlib import Path
from io import BytesIO
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright
from guard import H,BASE,MF,sha,fact,save,rd
import base64,json,math,re,time,traceback,sys
INIT=r"""()=>{
 const images=new Set(), blobs=new Set();
 const proto=HTMLImageElement.prototype, d=Object.getOwnPropertyDescriptor(proto,'src');
 Object.defineProperty(proto,'src',{...d,set(v){images.add(this);return d.set.call(this,v);}});
 const create=URL.createObjectURL;
 URL.createObjectURL=function(...args){const url=Reflect.apply(create,this,args);blobs.add(url);return url};
 Object.defineProperty(window,'__honroObserver',{value:{images,blobs},enumerable:false});
}"""
LAUNCH=r"""async q=>{
 const a=window.HonroApp,id=q.stage;
 if(!a||typeof a.launch!=='function')throw Error('normal app not ready');
 a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;
 await Promise.race([HonroCampaignLoader.ensureStage(id),new Promise((_,bad)=>setTimeout(()=>bad(Error('ensureStage deadline')),90000))]);
 const st=HONRO_PROJECT.stages.find(x=>x.metadata?.stageId===id), expected=q.activeDeclaredDimensions;
 if(!st||st.id!==q.catalogID||st.pending||st.width!==expected[0]||st.height!==expected[1])
   throw Error('active declared stage differs from exact current provider: '+st?.id);
 const c=q.compactWitness||null;
 if(c){
   const pkg=id===11?window.HONRO_STAGE11_COMPACT_DATA:window.HONRO_ACT2_COMPACT_PACKAGES?.[id];
   const on=id===11?window.HonroStage11Compact?.enabled():window.HonroAct2Compact?.enabled(id);
   if(on!==true||!pkg||JSON.stringify(st)!==JSON.stringify(pkg.stage)||pkg.mapRevision!==c.revision||
      st.width!==c.width||st.height!==c.height||(st.metadata.compactStatus??null)!==c.status)
     throw Error('active compact art provider exact check failed');
   if(JSON.stringify(pkg.assets.map(x=>x.id))!==JSON.stringify(c.packageAssetIDs))throw Error('compact source scope mismatch');
   for (const asset of pkg.assets){
     const found=HONRO_PROJECT.library.filter(x=>x.id===asset.id);
     if(found.length!==1||JSON.stringify(found[0])!==JSON.stringify(asset))throw Error('compact live asset mismatch: '+asset.id);
   }
 }
 for(let n=1;n<id;n++)a.profile.cleared[n]=true;
 for(const h of Object.values(a.profile.heroes))h.xp=HonroProgression.xpAt(HonroProgression.plan(id).entryLevel);
 a.launch(id);
 const b=a.engine?.b;
 if(!b||b.honroStage!==id||!b.honroCanonical||b.honroCustom!==false||b.honroMapOrigin!=='campaign'||b.width!==st.width||b.height!==st.height)
    throw Error('not normal canonical stage launch');
 if(c&&(b.honroCampaignMapRevision!==c.revision||(id===11&&window.HonroStage11Compact?.active(b)!==true)))
    throw Error('wrong live compact revision');
 for(let n=0;n<40&&a.dialogue;n++)HonroStory.finish(a);
 if(a.dialogue)throw Error('dialogue remains after isolated entry');
 a.close();HonroStoryFraming.clear(a.scene);
 return {stage:st.id,compact:c?{revision:c.revision,matched:true,assetCount:c.packageAssetIDs.length}:null,width:st.width,height:st.height};
}"""
DECODE=r"""async()=>{
 const chosen=new Set([...document.images,...__honroObserver.images].filter(i=>i.currentSrc||i.src));
 await Promise.race([Promise.all([document.fonts.ready,...Array.from(chosen,i=>i.decode())]),
    new Promise((_,bad)=>setTimeout(()=>bad(Error('declared image decode timeout')),30000))]);
 const failed=[...chosen].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.currentSrc||i.src);
 return {registered:chosen.size,font:document.fonts.status,failed};
}"""
PARK=rd(H,'park.js').decode()
PO=json.loads(rd(H,'POSES.json'))['poses']
MEDIA={f'assets/bgm/{n}.mp3'for n in ('main','battle-1','battle-2','battle-3','battle-4')}
SIGNED=(-480,2735,250,3350)
RAW="""()=>document.querySelector('#battlecanvas').toDataURL('image/png').split(',')[1]"""
OWNER="""()=>{
 const b=HonroApp.engine.b,s=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===29),D=HonroTerrainDomain;
 const layers=D.materialLandmarks(b),bi='stage29:record-actual-stone-faces',fi='act3-handoff:29:west-bank';
 const B=layers.filter(x=>x.asset?.id===bi),F=layers.filter(x=>x.asset?.id===fi);
 const floor=D.render(b).find(x=>x.id==='a3-foundation');
 if(!b.honroCanonical||b.honroCustom||b.honroStage!==29||b.honroMapOrigin!=='campaign'||b.honroAuthoredId!=='stage-29'||
    s?.id!=='stage-29'||s.design?.act3HandoffArt!==fi||!D.active(b)||!floor||floor.broken||B.length!==1||F.length!==1||
    layers.indexOf(B[0])>=layers.indexOf(F[0])||!B[0].honroTerrainMaterialClip)throw Error('wrong normal dual-owner Stage29 route');
 function exact(l,id,signature){
  const v=JSON.stringify(l.asset.vector);let a=2166136261,z=2654435769;
  for(let i=0;i<v.length;i++){const n=v.charCodeAt(i);a=Math.imul(a^n,16777619);z=Math.imul(z^n,2246822507)}
  const p=[l.id,l.kind,l.layer,l.depthLayer,l.x,l.y,l.scale,l.rotation??0];
  if(p.join(':')!==[id,'canonical-element','front','L1',0,0,1,0].join(':')||v.length+':'+(a>>>0)+':'+(z>>>0)!==signature||l.asset.collision?.length!==0)
    throw Error('wrong active Stage29 vector '+id);
  return {placement:p,vector:signature};
 }
 const world=HONRO_CORE.poly(floor);
 if(![[-500,2611.1328125],[0,2700],[1150,2700]].every(([x,y])=>world.some(p=>p.x===x&&p.y===y)))throw Error('western bedrock support drift');
 return {B:exact(B[0],'r29-actual-stone-faces','16445:857675311:1155320747'),F:exact(F[0],fi,'100397:1019299454:2212172850'),floor:world};
}"""
WITNESS="""()=>{
 const P=CanvasRenderingContext2D.prototype,d=Object.getOwnPropertyDescriptor(P,'drawImage');
 if(!d?.configurable||typeof d.value!=='function')throw Error('missing exact draw observer owner');
 const n={low:0,high:0,transform:[]};
 const watched=function(...a){
  const out=Reflect.apply(d.value,this,a);
  if(a.length===5&&a[1]===-480&&a[2]===2730&&a[3]===740&&a[4]===640&&
    ((a[0]?.width===259&&a[0]?.height===224)||(a[0]?.width===481&&a[0]?.height===416))){
    const isHigh=a[0].width===481; n[isHigh?'high':'low']++;
    const m=this.getTransform();
    const proof=[m.a,m.b,m.c,m.d,a[0].width,a[0].height];
    if(!n.transform.some(x=>JSON.stringify(x)===JSON.stringify(proof)))n.transform.push(proof);
  }
  return out;
 };
 Object.defineProperty(P,'drawImage',{...d,value:watched});
 window.__s29Read=()=>n;
 window.__s29Undo=()=>{Object.defineProperty(P,'drawImage',d);delete window.__s29Read;delete window.__s29Undo;return P.drawImage===d.value;};
 return true;
}"""
def box(p,wh):
 v=p['viewport'];z=p['actual']['scale'];w,h=wh
 # Source box (same in both arms) + two fixed backing/CSS raster sample pixels.
 x0,y0,x1,y1=SIGNED
 return (max(0,math.floor((x0-v['left'])*z)-2),max(0,math.floor((y0-v['top'])*z)-2),
         min(w,math.ceil((x1-v['left'])*z)+2),min(h,math.ceil((y1-v['top'])*z)+2))
def compare(a,b,pose):
 assert a.size==b.size
 diff=ImageChops.difference(a,b)
 r,g,bl,al=diff.split(); mask=ImageChops.lighter(ImageChops.lighter(r,g),ImageChops.lighter(bl,al))
 bounds=box(pose,a.size);assert bounds[0]<bounds[2] and bounds[1]<bounds[3]
 n=sum(mask.histogram()[1:]);local=sum(mask.crop(bounds).histogram()[1:]);alpha=sum(al.histogram()[1:])
 rimY=max(0,min(a.height,math.floor((2732-pose['viewport']['top'])*pose['actual']['scale'])))
 rim=sum(mask.crop((0,0,a.width,rimY)).histogram()[1:])
 return {'changed':n,'outside':n-local,'alphaChanged':alpha,'protectedUpperChanged':rim,'acceptedProjection':bounds,'changedBounds':mask.getbbox(),'strict':n>0 and n==local and alpha==rim==0}
def emit(out,d):save(out/'BROWSER.json',d)
def visit(browser,wk,out,graph,proof,arm,key):
 k=18891 if arm=='A'else 18892
 origin=f'http://127.0.0.1:{k}/'
 known=graph['active'+arm];required=set(graph['stage29Required'])|{'HONRO.html',graph['currentProject'][arm],graph['gameEntry'][arm],graph['runtime'][arm]}
 assert required<=known.keys()
 W,H=map(int,key.split('x'));q={'arm':arm,'device':key,'status':'HOLD','frames':{}}
 proof['visits'].append(q);emit(out,proof)
 errors=[];responses=[];pending=set();blobs=set();seen=set();loc=0
 blob=re.compile('blob:'+re.escape(origin)+r'[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}')
 def path(u):return u[len(origin):]if u.startswith(origin)and '?'not in u and '#'not in u else None
 def request(r):
  k=path(r.url)
  if r.method!='GET' or not (k in known or k in MEDIA and r.resource_type=='media' or blob.fullmatch(r.url) or r.url.startswith('data:')):errors.append(['unexpected request',r.method,r.url])
  if k in known:pending.add(r)
 def done(r):pending.discard(r)
 def failed(r):
  done(r)
  if not(path(r.url)in MEDIA and r.resource_type=='media' and r.failure=='net::ERR_ABORTED'):errors.append(['failed request',r.url,r.failure])
 def response(r):
  k=path(r.url)
  if k in known and r.status==200 and not r.from_service_worker:responses.append((k,r))
  elif blob.fullmatch(r.url) and r.status==200:blobs.add(r.url)
  elif k in MEDIA and r.request.resource_type=='media' and r.status in (200,206):pass
  elif not r.url.startswith('data:'):errors.append(['unexpected status',r.status,r.url])
 ctx=browser.new_context(viewport={'width':W,'height':H},device_scale_factor=1,service_workers='block')
 assert ctx.storage_state()=={'cookies':[],'origins':[]}
 page=ctx.new_page();page.set_default_timeout(30000);page.add_init_script('('+INIT+')()')
 for event,func in [('request',request),('requestfinished',done),('requestfailed',failed),('response',response),('pageerror',lambda e:errors.append(['pageerror',str(e)]))]:page.on(event,func)
 try:
  n=page.goto(origin+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
  assert n and n.url==origin+'HONRO.html' and n.status==200 and not n.from_service_worker and fact(n.body())==known['HONRO.html']
  page.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  boot={'stage':29,'catalogID':'stage-29','activeDeclaredDimensions':[7200,3500]}
  q['provider']=page.evaluate(LAUNCH,boot);assert q['provider']=={'stage':'stage-29','compact':None,'width':7200,'height':3500}
  c=page.locator('#battlecanvas');c.wait_for(state='visible')
  page.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue);}""",polling=125,timeout=12000)
  assert page.evaluate(WITNESS)
  for n,dy in [('west-hi',0)]:
   args={'stage':29,'id':'stage-29','name':n,'dx':-1,'dy':dy,'readback':False}
   q['attempt']=n;emit(out,proof)
   got=page.evaluate(PARK,args); old=PO[key]['west-near']
   decode=page.evaluate(DECODE);assert decode['registered']>0 and decode['font']=='loaded' and not decode['failed']
   assert page.evaluate(PARK,{**args,'readback':True})==got
   # Reuse every pose-independent, source/physics/metadata pin from real .5 QA.
   # The four camera-specific values are individually pinned to this exact new view.
   target={'x':0,'y':3020,'scale':.94}
   x,y,z=target.values();w,h=old['css']
   expected={k:v for k,v in old.items()if k!='rawSHA256'}
   expected.update(name='west-hi',desired=target,actual=target,
                   viewport={'left':x-w/(2*z),'right':x+w/(2*z),'top':y-h/(2*z),'bottom':y+h/(2*z)})
   mismatch={k:{'expected':v,'observed':got.get(k)}for k,v in expected.items()if got.get(k)!=v}
   assert not mismatch,('exact high pose or archived physics mismatch',arm,key,n,mismatch)
   v=got['viewport']; assert v['left']<-480 and v['right']>260 and v['top']<2730 and v['bottom']>3370
   owner=page.evaluate(OWNER)
   native_calls=page.evaluate('()=>__s29Read()')
   assert native_calls['low']==0
   if arm=='B':
    assert native_calls['high']>0 and native_calls['transform']==[[.68,0,0,.68,481,416]],('did not render exact high branch B',native_calls)
   else:
    assert native_calls['high']==0 and native_calls['transform']==[],('unexpected native A draw',native_calls)
   raw=base64.b64decode(page.evaluate(RAW),validate=True);dom=c.screenshot(animations='disabled',caret='hide',scale='css')
   assert raw==base64.b64decode(page.evaluate(RAW),validate=True),'DOM observation changed actual raw frame'
   row={'pose':got,'owner':owner,'decode':decode,'nativeMatchingSectionDraws':native_calls};q['frames'][n]=row
   for kind,b in [('raw',raw),('dom',dom)]:
    im=Image.open(BytesIO(b)).convert('RGBA');dw,dh=got['backing']
    assert im.size==tuple(got['backing']) if kind=='raw' else im.width==dw and im.height in (dh,dh+1)
    pathOut=f'{arm}-s29-{key}-{n}-{kind}.png';(out/pathOut).write_bytes(b)
    row[kind]={'path':pathOut,'fact':fact(b),'rgba':sha(im.tobytes()),'size':list(im.size)}
   emit(out,proof)
  assert page.evaluate('()=>__s29Undo()')
  stable=0;end=time.monotonic()+24
  while time.monotonic()<end:
   assert not errors,errors
   while loc<len(responses)and responses[loc][1].request not in pending:
    p,r=responses[loc];assert fact(r.body())==known[p],('wrong observed HTTP body',p);seen.add(p);loc+=1
   sig=len(responses),len(blobs);page.wait_for_timeout(120)
   stable=stable+1 if sig==(len(responses),len(blobs))and loc==len(responses)and not pending and required<=seen else 0
   if stable==3:
    assert blobs<=set(page.evaluate('()=>Array.from(__honroObserver.blobs)'))
    q.update(status='CAPTURED',verified=len(seen),required=sorted(required));break
  assert q['status']=='CAPTURED',('incomplete HTTP graph',sorted(required-seen),len(pending),errors)
 finally:q['errors']=errors;emit(out,proof);ctx.close()
def main(w):
 out=w/'out';g=json.loads(rd(out,'GRAPH.json'))
 r={'status':'HOLD','source':BASE,'scope':'one actual PC pair at x0/y3020/z.94; no build, no release','visits':[],'failures':[],'comparisons':{}}
 try:
  with sync_playwright()as driver:
   b=driver.chromium.launch(headless=True);r['browser']=b.version;assert b.version=='151.0.7922.34'
   try:
    for arm in 'AB':
     try:visit(b,w,out,g,r,arm,'1440x900')
     except Exception as e:r['failures'].append({'arm':arm,'error':repr(e),'trace':traceback.format_exc()});emit(out,r)
   finally:b.close()
  assert len(r['visits'])==2 and not r['failures']
  A,B=[v['frames']['west-hi']for v in r['visits']]
  assert A['pose']==B['pose'] and A['owner']==B['owner']
  for kind in ('raw','dom'):
   ims=[Image.open(out/x[kind]['path']).convert('RGBA')for x in (A,B)]
   r['comparisons'][kind]=compare(*ims,A['pose'])
  assert all(x['strict']for x in r['comparisons'].values()),'protected areas, alpha or engagement gate failed'
  r['status']='PASS_STAGE29_EXACT_HIGH_RASTER_PC_SCOPE_PENDING_VISUAL_REVIEW'
 finally:emit(out,r)
if __name__=='__main__':main(Path(sys.argv[1]).resolve())
