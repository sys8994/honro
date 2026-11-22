"""Only 4 signed actual PC/M Stage23 west views, one detached A/B each; no release."""
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
SIGNED=(-1000,4380,240,5460)
RAW="""()=>document.querySelector('#battlecanvas').toDataURL('image/png').split(',')[1]"""
OWNER="""()=>{
 const b=HonroApp.engine.b,s=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===23),id='act3-handoff:23:quay-west';
 const floor=HonroTerrainDomain.render(b).find(x=>x.id==='sy-ground');
 const views=HonroTerrainDomain.materialLandmarks(b).filter(x=>x.asset?.id===id);
 if(!b.honroCanonical||b.honroCustom||b.honroStage!==23||b.honroMapOrigin!=='campaign'||b.honroAuthoredId!=='stage-23'||
    b.honroEscortYardRevision!==1||s?.id!=='stage-23'||s.design?.act3HandoffArt!==id||!HonroStage23EscortArt.active(b)||
    !floor||floor.broken||views.length!==1)throw Error('wrong live Stage23 shared owner route');
 const l=views[0],a=l.asset,v=JSON.stringify(a.vector);let x=2166136261,z=2654435769;
 for(let i=0;i<v.length;i++){const n=v.charCodeAt(i);x=Math.imul(x^n,16777619);z=Math.imul(z^n,2246822507)}
 if(v.length!==112793||(x>>>0)!==761114639||(z>>>0)!==2098273003||l.layer!=='front'||l.depthLayer!=='L1'||l.x!==0||l.y!==0||l.scale!==1||l.kind!=='canonical-element')throw Error('wrong exact active F source/placement');
 return {owner:id,nativeVector:[v.length,x>>>0,z>>>0],floor:HONRO_CORE.poly(floor),collision:b.terrain.map(t=>[t.id,t.vertices]),revision:b.honroEscortYardRevision,assetPlacement:[l.x,l.y,l.scale,l.layer,l.depthLayer],samePlay:true};
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
 return {'changed':n,'outside':n-local,'alphaChanged':alpha,'acceptedProjection':bounds,'changedBounds':mask.getbbox(),'strict':n>0 and n==local and alpha==0}
def emit(out,d):save(out/'BROWSER.json',d)
def visit(browser,wk,out,graph,proof,arm,key):
 k=18891 if arm=='A'else 18892
 origin=f'http://127.0.0.1:{k}/'
 known=graph['active'+arm];required=set(graph['stage23Required'])|{'HONRO.html',graph['currentProject'][arm],graph['gameEntry'][arm],graph['runtime'][arm]}
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
  boot={'stage':23,'catalogID':'stage-23','activeDeclaredDimensions':[9800,6200]}
  q['provider']=page.evaluate(LAUNCH,boot);assert q['provider']=={'stage':'stage-23','compact':None,'width':9800,'height':6200}
  c=page.locator('#battlecanvas');c.wait_for(state='visible')
  page.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue);}""",polling=125,timeout=12000)
  for n,dy in [('west',0),('southwest',1)]:
   args={'stage':23,'id':'stage-23','name':n,'dx':-1,'dy':dy,'readback':False}
   q['attempt']=n;emit(out,proof)
   got=page.evaluate(PARK,args); old=PO[key][n]
   decode=page.evaluate(DECODE);assert decode['registered']>0 and decode['font']=='loaded' and not decode['failed']
   assert page.evaluate(PARK,{**args,'readback':True})==got
   assert all(got[k]==v for k,v in old.items()if k!='rawSHA256'),('exact archived pose/physics mismatch',arm,key,n)
   owner=page.evaluate(OWNER)
   raw=base64.b64decode(page.evaluate(RAW),validate=True);dom=c.screenshot(animations='disabled',caret='hide',scale='css')
   assert raw==base64.b64decode(page.evaluate(RAW),validate=True),'DOM observation changed actual raw frame'
   row={'pose':got,'owner':owner,'decode':decode};q['frames'][n]=row
   for kind,b in [('raw',raw),('dom',dom)]:
    im=Image.open(BytesIO(b)).convert('RGBA');dw,dh=got['backing']
    assert im.size==tuple(got['backing']) if kind=='raw' else im.width==dw and im.height in (dh,dh+1)
    pathOut=f'{arm}-s23-{key}-{n}-{kind}.png';(out/pathOut).write_bytes(b)
    row[kind]={'path':pathOut,'fact':fact(b),'rgba':sha(im.tobytes()),'size':list(im.size)}
   emit(out,proof)
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
 out=w/'out';g=json.loads(rd(out,'GRAPH.json'));r={'status':'HOLD','source':BASE,'scope':'actual detached renderer A/B only W/SW PC/M; synthetic QA stage select no user profile','visits':[],'failures':[],'comparisons':{}}
 try:
  with sync_playwright()as driver:
   b=driver.chromium.launch(headless=True);r['browser']=b.version;assert b.version=='151.0.7922.34'
   try:
    for key in PO:
     for arm in 'AB':
      try:visit(b,w,out,g,r,arm,key)
      except Exception as e:r['failures'].append({'arm':arm,'device':key,'error':repr(e),'trace':traceback.format_exc()});emit(out,r)
   finally:b.close()
  assert len(r['visits'])==4 and not r['failures']
  for key in PO:
   a,b=(next(x for x in r['visits']if x['device']==key and x['arm']==j)for j in 'AB')
   for pose in ('west','southwest'):
    A,B=(v['frames'][pose]for v in (a,b))
    assert A['pose']==B['pose'] and A['owner']==B['owner']
    slot=r['comparisons'][key+'-'+pose]={}
    for kind in ('raw','dom'):
     vals=[Image.open(out/x[kind]['path']).convert('RGBA')for x in (A,B)]
     slot[kind]=compare(*vals,A['pose'])
    emit(out,r)
  assert len(r['comparisons'])==4
  cells=[v[k]for v in r['comparisons'].values()for k in ('raw','dom')]
  # Evidence custody differs from QA pass. Only a complete, same-pose RGB HOLD
  # with zero alpha changes qualifies for a separate review-only archive.
  if not all(c['strict']for c in cells):
   if all(c['alphaChanged']==0 for c in cells):
    r['status']='HOLD_RGB_PIXEL_GATE_COMPLETE_NO_RELEASE'
   raise AssertionError('strict Stage23 image gate did not pass; no deployment')
  r['status']='PASS_ACTUAL_STAGE23_WEST_SCOPE_PENDING_VISUAL_REVIEW'
 finally:emit(out,r)
if __name__=='__main__':main(Path(sys.argv[1]).resolve())
