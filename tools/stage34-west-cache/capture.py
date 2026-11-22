"""Verified built stock A and normally built B. Only actual SW near and East control."""
import base64,io,json,math,re,sys,time
from PIL import Image
from pathlib import Path
from guard import P,M,fact,sha,save
H=Path(__file__).parent
PARK=(H/'park.js').read_text()
OBSERVERS=json.loads((H/'observer.json').read_text());CLOCK=OBSERVERS.pop('CLOCK_STAGE34')
MEDIA={f'assets/bgm/{k}.mp3' for k in ('main','battle-1','battle-2','battle-3','battle-4')}
PHASE=('cold-direct','backing-first','backing-reuse')
OWNERS=('approved34-deep-bedrock','approved34-coastal-foundation','approved34-lower-continuation-v2',
        'approved34-body','approved34-lower-natural-mask-v2','approved34-east-v6-connected')
def need(ok,msg):
 if not ok:raise RuntimeError(msg)
def check(s,p,loc):
 need(fact(s)==p,('exact HTTP/PNG',loc))
 return s
def close(a,b):
 if isinstance(b,dict):return set(a)==set(b) and all(close(a[k],v)for k,v in b.items())
 if isinstance(b,list):return len(a)==len(b) and all(close(x,y)for x,y in zip(a,b))
 if isinstance(b,(int,float)):return abs(a-b)<1e-6
 return a==b
def rgba(p):
 with Image.open(p)as v:
  v.load();return v.convert('RGBA')
def png(raw):
 with Image.open(io.BytesIO(raw))as v:
  v.load();return v.convert('RGBA')
def css_enclosure(box,now,device):
 assert box and set(box)=={'x','y','width','height'} and all(math.isfinite(x)for x in box.values()),box
 x,y,w,h=map(box.get,('x','y','width','height'))
 assert abs(w-now['css'][0])<1e-6 and abs(h-now['css'][1])<1e-6 and now['dpr']==1
 assert x>=-1e-6 and y>=-1e-6 and x+w<=device[0]+1e-6 and y+h<=device[1]+1e-6
 l,t=math.floor(x+1e-8),math.floor(y+1e-8);r,b=math.ceil(x+w-1e-8),math.ceil(y+h-1e-8)
 assert 0<=l<r<=device[0] and 0<=t<b<=device[1]
 return {'css':box,'enclosed':[l,t,r,b],'enclosedSize':[r-l,b-t],'dpr':now['dpr']}
def store_img(root,name,raw):
 path=name+'.png';(root/path).write_bytes(raw);im=png(raw)
 return {'path':path,'png':fact(raw),'rgba':sha(im.tobytes()),'size':list(im.size)}

def flush(out,q):save(out/'BROWSER.json',q)
OWNERSHIP="""async()=>{
 const b=HonroApp.engine.b, st=HONRO_PROJECT.stages.find(q=>q.id==='stage-34');
 const only=(id)=>{const a=HONRO_PROJECT.library.filter(x=>x.id===id),p=st.elements.filter(x=>x.assetId===id),l=b.honroLandmarks.filter(x=>x.asset?.id===id);
  if(a.length!==1||p.length!==1||l.length!==1||a[0].collision?.length||l[0].collisionIds?.length)throw Error('wrong stock unique owner '+id);
  return {asset:a[0],live:l[0].asset,placement:p[0]};};
 const C=only('approved34:coastal-foundation'),F=only('approved34:lower-natural-mask-v2');
 const h=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(x)))),n=>n.toString(16).padStart(2,'0')).join('');
 if(C.placement.x!==-1536||C.placement.y!==-256||C.placement.nativeArtLayer!=='structure'||C.placement.layer!=='structural-back')throw Error('wrong current coastal placement');
 const coastal=await h(C.asset), fore=await h(F.asset);
 if(coastal!==await h(C.live)||fore!==await h(F.live))throw Error('active owner differs from actual draw asset');
 return {coastal,fore,placement:C.placement,terrain:st.terrains.length,actors:b.units.length};
}"""
STRIPS="""()=>{
 const C=CanvasRenderingContext2D.prototype,N=Performance.prototype.now.bind(performance),r=Object.getOwnPropertyDescriptor(C,'getImageData'),w=Object.getOwnPropertyDescriptor(C,'putImageData');
 if(!r?.configurable||!w?.configurable)throw Error('not exact native 2D API');
 let current=null, restorable=false;
 let admitted=new WeakSet();
 function attach(d,name,fn){Object.defineProperty(C,name,{...d,value:fn});}
 attach(r,'getImageData',function(...a){
  if(!current||this.canvas===HonroApp.scene.canvas||this.canvas.width!==516||this.canvas.height!==516||a[2]!==8)return Reflect.apply(r.value,this,a);
  const m=this.getTransform(),x=Math.floor(-1536*m.a+m.e);
  if(a[0]!==x-3||a[1]<0||a[3]<1||a[1]+a[3]>516)return Reflect.apply(r.value,this,a);
  const t=N();try{return Reflect.apply(r.value,this,a);}finally{admitted.add(this);current.read++;current.readMs+=N()-t;current.samples.push([a[0],a[1],a[2],a[3]]);}
 });
 attach(w,'putImageData',function(...a){
  if(!current||!admitted.has(this)||a[0]?.width!==1)return Reflect.apply(w.value,this,a);
  const t=N();try{return Reflect.apply(w.value,this,a);}finally{current.write++;current.writeMs+=N()-t;}
 });
 window.__S34STRIP={
  begin(){if(current)throw Error('unclosed timed draw'); admitted=new WeakSet();current={read:0,write:0,readMs:0,writeMs:0,samples:[]};},
  end(){const q=current;current=null;if(!q)throw Error('missing timed draw');return q;},
  restore(){Object.defineProperty(C,'getImageData',r);Object.defineProperty(C,'putImageData',w);delete window.__S34STRIP;
    return C.getImageData===r.value&&C.putImageData===w.value;}
 };return true;
}"""
PEEK="""()=>{
 const q=HonroApp.scene, n=q.renderCacheStats(), d=q._domainTiles;
 return {builds:n.domainTileBuilds??0,hits:n.worldHits??0,screenBuilds:n.screenBuilds??0,screenHits:n.screenHits??0,
  key:d?.key??null,rs:d?.rs??null,tileCount:d?.tiles?.size??0};
}"""
def projection(f,device):
 v=f['viewport'];z=f['actual']['scale'];mid=(-1536-v['left'])*z
 # Frozen target center, PC two native screen columns and M one, plus two
 # screen cells for source-texel bilinear filter + DOM-enclosure phase.
 central={'1440x900':(50,52),'390x844':(12,13)}[device]
 need(central[0]<=mid<central[1],('exact line/camera projection drift',mid))
 return [central[0]-2, max(0,math.floor((3618-v['top'])*z)-2),
         central[1]+2,min(f['backing'][1]+1,math.ceil((5874-v['top'])*z)+2)]
def visit(browser,out,q,label,device,name,graph):
    w,h=map(int,device.split('x')); dx,dy=-1,1
    ref=P['poses'][device];z=ref['actual']['scale']
    spec={'stage':34,'catalogID':'stage-34','activeDeclaredDimensions':[6144,4096]}
    arm=graph[label];SITE=arm['origin'];BLOB=re.compile(r'blob:'+re.escape(SITE)+r'[\da-f-]{36}')
    known={**arm['active'],'HONRO.html':arm['shell']}
    required=set(arm['needs'])|{'HONRO.html'}
    ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
    job={'device':[w,h],'status':'HOLD','view':name,'phase':{},'reference':'Fresh actual image; authenticated historical camera metadata only'}
    q['visits'][f'{label}-{device}-{name}']=job;flush(out,q)
    todo=set();hits=[];errors=[]; blobs=set(); seen={}
    def rel(url):
        return url[len(SITE):] if url.startswith(SITE) and '?' not in url and '#' not in url else None
    def req(r):
        k=rel(r.url)
        if not(r.method=='GET' and (k in known or k in MEDIA and r.resource_type=='media' or BLOB.fullmatch(r.url) or r.url.startswith('data:'))):
            errors.append(['unexpected request',r.method,r.url])
        if k in known: todo.add(r)
    def fail(r):
        todo.discard(r)
        if not(rel(r.url)in MEDIA and r.resource_type=='media' and r.failure=='net::ERR_ABORTED'):
            errors.append(['request fail',r.url,r.failure])
    def response(r):
        k=rel(r.url)
        if k in known and r.status==200 and not r.from_service_worker: hits.append((k,r))
        elif BLOB.fullmatch(r.url) and r.status==200:blobs.add(r.url)
        elif k in MEDIA and r.status in (200,206) and r.request.resource_type=='media':pass
        elif not r.url.startswith('data:'):errors.append(['unexpected response',r.url,r.status])
    def drain(page):
        pos=quiet=0
        cutoff=time.monotonic()+30
        while time.monotonic()<cutoff:
            need(not errors,errors)
            while pos<len(hits) and hits[pos][1].request not in todo:
                k,r=hits[pos]; check(r.body(),known[k],k); seen[k]=known[k];pos+=1
            marker=(len(hits),len(blobs));page.wait_for_timeout(105)
            quiet=quiet+1 if pos==len(hits) and not todo and marker==(len(hits),len(blobs)) and required<=seen.keys() else 0
            if quiet==3:
                need(blobs<=set(page.evaluate('()=>Array.from(__honroObserver.blobs)')),'unobserved object URL')
                return
        raise RuntimeError(('actual HTTP closure incomplete',sorted(required-seen.keys()),[x.url for x in todo],errors))
    try:
        need(ctx.storage_state()=={'cookies':[],'origins':[]},'fresh anonymous context required')
        page=ctx.new_page();page.set_default_timeout(30_000);page.add_init_script('('+OBSERVERS['INIT']+')()')
        for e,f in [('request',req),('requestfinished',lambda r:todo.discard(r)),('requestfailed',fail),('response',response),('pageerror',lambda e:errors.append(['page error',str(e)]))]:page.on(e,f)
        r=page.goto(SITE+'HONRO.html',wait_until='domcontentloaded',timeout=50_000)
        need(r and r.status==200 and r.url==SITE+'HONRO.html' and not r.from_service_worker and not r.request.redirected_from,
             'bad canonical navigation')
        check(r.body(),known['HONRO.html'],'normal shell')
        page.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
        job['clockStart']=page.evaluate(CLOCK)
        job['provider']=page.evaluate(OBSERVERS['LAUNCH'],spec)
        need(job['provider']=={'stage':'stage-34','compact':None,'width':6144,'height':4096},'not canonical Stage34')
        el=page.locator('#battlecanvas');el.wait_for(state='visible')
        page.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
           return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim');}""",polling=125,timeout=12000)
        job['decodedImageCount']=page.evaluate(OBSERVERS['DECODE'])
        drain(page)
        args={'stage':34,'id':'stage-34','name':name,'dx':dx,'dy':dy,'scale':z,'park':True,'render':False}
        f=page.evaluate(PARK,args); job['placement']=f
        need(page.evaluate(STRIPS),'cannot attach passive strip counters')
        for i,phase in enumerate(PHASE,1):
            clock=page.evaluate('(i)=>__s34Phase(i)',i)
            tc=page.evaluate(PEEK)
            page.evaluate('()=>__S34STRIP.begin()')
            now=page.evaluate(PARK,{**args,'park':False,'render':True})
            witness=page.evaluate('()=>__S34STRIP.end()'); cacheAfter=page.evaluate(PEEK)
            delta=now.pop('renderMs')
            job['phase'][phase]={'clock':clock,'renderMs':delta,'strip':witness,'readback':now,'cacheBefore':tc,'cacheAfter':cacheAfter}
            key=f'{label}-{device}-{name}-{phase}'
            # Save images before pose/physics/geometry and performance verdicts.
            box=el.bounding_box(); raw=base64.b64decode(page.evaluate(OBSERVERS['RAW']),validate=True)
            dom=el.screenshot(animations='disabled',caret='hide',scale='css')
            records={k:store_img(out,key+'-'+k,val) for k,val in [('raw',raw),('dom',dom)]}
            job['phase'][phase].update(records);flush(out,q)
            css=css_enclosure(box,now,[w,h]);records['dom']['bbox']=css
            need(box==el.bounding_box() and raw==base64.b64decode(page.evaluate(OBSERVERS['RAW']),validate=True),'canvas moved during real record')
            need(records['raw']['size']==now['backing'] and records['dom']['size']==css['enclosedSize'],'raw or DOM backing changed')
        need(page.evaluate('()=>__S34STRIP.restore() && __s34Restore()') is True,'QA observers not restored')
        f={**f,'backing':ref['backing']};f.pop('renderMs',None);job['placement']=f
        need(all(close(f[k],v)for k,v in ref.items()),('actual PC/M view changed',device,f,ref))
        need(f['physics']==P['physics'] and f['unitCount']==37 and len(f['actualTerrainIDs'])==17 and f['sceneTime']==2 and f['phase']=='aim' and f['round']==1,
             'normal gameplay state/actors or physics differ')
        need(all(x['readback']==f for x in job['phase'].values()),'normal drawing changed camera or physical state')
        owner=page.evaluate(OWNERSHIP)
        need(owner['fore']==P['foreOwner'] and owner['actors']==37 and owner['terrain']==17,'approved FORE / gameplay changed')
        job['actualNativeOwner']=owner;job['projection']=projection(f,device)
        drain(page);job.update(status='CAPTURED_REAL_A_OR_B',verifiedHTTP=seen)
    finally:
        job['networkErrors']=errors;job['verifiedHTTPPartial']=seen;flush(out,q);ctx.close()


def pairs(out,q):
 result={};perfs={}
 for d in ('1440x900','390x844'):
  a,b=[q['visits'][f'{arm}-{d}-southwest-near'] for arm in 'AB']
  need(a['status']==b['status']=='CAPTURED_REAL_A_OR_B' and a['placement']==b['placement'] and
       a['actualNativeOwner']==b['actualNativeOwner'],'same camera/owners/geometry/physics not exact')
  box=b['projection'];coldA=a['phase'][PHASE[0]];coldB=b['phase'][PHASE[0]]
  ar,br=coldA['renderMs'],coldB['renderMs']
  counter=coldB['strip'];overhead=counter['readMs']+counter['writeMs']
  warm=[b['phase'][phase]['strip'] for phase in PHASE[1:]]
  observed={'AColdRenderMs':ar,'BColdRenderMs':br,'helperStripReadWriteMs':overhead,'coldB':counter,'warmB':warm,
            'allAZero':all(x['strip']['read']==x['strip']['write']==0 for x in a['phase'].values())}
  t=P['timing'];observed['bounded']=bool(observed['allAZero'] and 0<counter['read']<=4 and 0<counter['write']<=18*counter['read'] and
    not any(p['read'] or p['write'] for p in warm) and overhead<=t['maxObservedColdStripMs'] and
    not (br-ar>t['maxObservedColdRenderExtraMs'] and br-ar>t['maxObservedColdRenderRelativeExtra']*ar))
  observed['actualNativeTilePhases']=all(
   arm['phase'][PHASE[0]]['cacheAfter']['builds']>arm['phase'][PHASE[0]]['cacheBefore']['builds'] and
   all(arm['phase'][k]['cacheAfter']['builds']==arm['phase'][k]['cacheBefore']['builds'] for k in PHASE[1:])
   for arm in (a,b))
  observed['bounded']=observed['bounded'] and observed['actualNativeTilePhases']
  perfs[d]=observed
  for phase in (PHASE[0],PHASE[2]):
   cell={}
   for kind in ('raw','dom'):
    aa,bb=(arm['phase'][phase][kind]for arm in (a,b));im=[]
    for q0 in (aa,bb):
     p=out/q0['path'];check(p.read_bytes(),q0['png'],p.name);im.append(rgba(p))
     need(list(im[-1].size)==q0['size'] and sha(im[-1].tobytes())==q0['rgba'],'final source PNG identity')
    need(im[0].size==im[1].size and aa.get('bbox')==bb.get('bbox'),'CSS or pixel size changed')
    w,h=im[0].size;x,y=(t.tobytes()for t in im); changed=alpha=outside=darkened=0;extent=[w,h,-1,-1]
    left,top,right,bottom=box
    for i in range(0,len(x),4):
     if x[i:i+4]==y[i:i+4]:continue
     j,k=i//4%w,i//4//w
     changed+=1;alpha+=x[i+3]!=y[i+3];darkened+=sum(y[i:i+3])<sum(x[i:i+3])
     outside+=not(left<=j<right and top<=k<bottom)
     extent=[min(extent[0],j),min(extent[1],k),max(extent[2],j),max(extent[3],k)]
    result[d+'-'+phase+'-'+kind]={'changed':changed,'alpha':alpha,'outside':outside,'darkened':darkened,'bbox':extent,'signed':box}
 return result,perfs
def main(w):
 from playwright.sync_api import sync_playwright
 out=w/'out';g=json.loads((out/'GRAPH.json').read_bytes())
 q={'scope':'genuine one-build Stage34 SW A/B exact four independent isolated sessions, existing single AA cue; no gameplay or release','status':'HOLD','visits':{},'errors':[]}
 try:
  with sync_playwright()as pw:
   br=pw.chromium.launch(headless=True)
   try:
    q['browser']=br.version;need(br.version=='151.0.7922.34','unexpected true Chrome')
    for d in ('1440x900','390x844'):
     for arm in 'AB':
      try:visit(br,out,q,arm,d,'southwest-near',g)
      except Exception as e:q['errors'].append({'device':d,'arm':arm,'message':repr(e)});flush(out,q)
   finally:br.close()
  need(not q['errors'],q['errors'])
  q['comparisons'],q['performance']=p,m=pairs(out,q);flush(out,q)
  need(len(p)==8 and all(not(x['alpha'] or x['outside']) and x['changed']>=15 and 10*x['darkened']>=9*x['changed']for x in p.values()),
       'actual small RGB-only line isolation not proved')
  need(all(v['bounded']for v in m.values()),'warm helper repeat, missing cold path, or first-draw cost')
  q['status']='PASS_BOUND_COLD_CACHE_SCOPE_PENDING_VISUAL_NO_DEPLOY'
 finally:flush(out,q)
if __name__=='__main__':main(Path(sys.argv[1]))
