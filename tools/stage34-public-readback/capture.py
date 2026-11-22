"""Anonymous Stage34 Pages readback. One SW camera per device; no A/B verdict."""
import base64,hashlib,io,json,math,os,re,subprocess,sys,time,urllib.request,urllib.parse
from pathlib import Path
H=Path(__file__).resolve().parent
LIVE='https://sys8994.github.io/honro/'
M='web/manifest.json'
P=json.loads((H/'PINS.json').read_bytes())
def sha(raw):return hashlib.sha256(raw).hexdigest()
def fact(raw):return {'bytes':len(raw),'sha256':sha(raw)}
def save(p,x):
 f=p.with_suffix('.tmp');f.write_text(json.dumps(x,indent=2,ensure_ascii=False)+'\n');f.replace(p)
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
def png(raw):
 from PIL import Image
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

IDENTITY='''()=>{const ids=new WeakMap();let next=0;return obj=>{
 if(obj==null)return null;if(!ids.has(obj))ids.set(obj,++next);return ids.get(obj);
};}'''
METHODS='''async()=>{
 const p=HonroScene.prototype,s=HonroApp.scene;
 const bytes=x=>new TextEncoder().encode(x);
 const hex=x=>Array.from(new Uint8Array(x),b=>b.toString(16).padStart(2,'0')).join('');
 const methods={};for(const k of ['_drawForeground','_screenRaster']){
  if(Object.hasOwn(s,k)||Object.getPrototypeOf(s)!==p||typeof p[k]!=='function'||s[k]!==p[k])throw Error('foreground method not native prototype: '+k);
  methods[k]=hex(await crypto.subtle.digest('SHA-256',bytes(Function.prototype.toString.call(p[k]))));
 }
 return methods;
}'''
NATIVE='''sample=>{
 const a=HonroApp,s=a.scene,b=a.engine.b,m=HONRO_PROJECT.stages.find(x=>x.id==='stage-34');
 const floor=b.honroLandmarks, family=m.elements.filter(x=>x.id.startsWith('approved34-'));
 const ids=family.map(x=>x.id), actors=b.units.length;
 const rect=s.canvas.getBoundingClientRect(),view=HonroBounds.viewport(s,rect.width,rect.height);
 const admitted=floor.filter(l=>s._isForeground(l)&&s._landmarkVisible(l,view));
 const keyPrefix=s._worldCacheKey(b,rect.width)+':foreground:'+admitted.map(l=>[l.id,l.asset?.id,l.x,l.y,l.scale,l.rotation,l.opacity].join(',')).join('|');
 const fore=admitted.map(l=>l.id),f=s._screenForegroundCache,css=[rect.width,rect.height];
 const r=s.renderCacheStats(),stock=family.map(x=>{const hit=HONRO_PROJECT.library.filter(l=>l.id===x.assetId);return [x.id,hit.length,!!hit[0]?.vector];});
 return {ids,actors,fore,css,stock,cache:{key:f?.key??null,canvas:f?.canvas?[f.canvas.width,f.canvas.height]:null,bytes:f?.bytes??0,
   slot:sample(f),canvasInstance:sample(f?.canvas),nativeSlotData:Object.hasOwn(s,'_screenForegroundCache')&&(!f||Object.getPrototypeOf(f)===Object.prototype),
   ownDetachedCanvas:!!f?.canvas&&f.canvas instanceof HTMLCanvasElement&&!f.canvas.isConnected&&f.canvas!==s.canvas,
   currentSignaturePrefix:typeof f?.key==='string'&&f.key.startsWith(keyPrefix+':'),
   aggregate:{builds:r.screenBuilds??0,hits:r.screenHits??0}}};
}'''
def native_phase(phase, c, before, recorded, backing):
    need(c['nativeSlotData'] and c['currentSignaturePrefix'] and isinstance(c['slot'],int) and c['slot']>0,
         ('native FORE slot is not own admitted current cache',phase,c))
    if phase=='cold-direct':
        need(c['slot']!=before['slot'] and c['key']!=before['key'] and c['canvas'] is None and
             c['canvasInstance'] is None and c['bytes']==0 and not c['ownDetachedCanvas'],
             ('missing fresh foreground direct draw',c))
        return
    cold=recorded['cold-direct']['native']['cache']
    need(c['slot']==cold['slot'] and c['key']==cold['key'] and c['canvas']==backing and
         c['bytes']==math.prod(backing)*4 and c['ownDetachedCanvas'] and
         isinstance(c['canvasInstance'],int) and c['canvasInstance']>0 and c['canvasInstance']!=c['slot'],
         ('native foreground backing not allocated in same slot',phase,c))
    if phase=='backing-reuse':
        first=recorded['backing-first']['native']['cache']
        need(c['slot']==first['slot'] and c['canvasInstance']==first['canvasInstance'],
             ('foreground backing instance not retained through warm',first,c))
def flush(out,q):save(out/'BROWSER.json',q)
REGISTERED='''async({id,rows})=>{
 const st=HONRO_PROJECT.stages.find(s=>s.id==='stage-34'),b=HonroApp.engine.b;
 const a=HONRO_PROJECT.library.filter(a=>a.id===id),p=st.elements.filter(e=>e.assetId===id),l=b.honroLandmarks.filter(e=>e.asset?.id===id);
 if(a.length!==1||p.length!==1||l.length!==1||a[0].collision.length||l[0].collisionIds?.length||
      p[0].x!==-1536||p[0].y!==3072||p[0].layer!=='front'||p[0].nativeArtLayer!=='front'||l[0].layer!=='front')throw Error('not actual existing Stage34 native art owner');
 const h=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(x)))),n=>n.toString(16).padStart(2,'0')).join('');
 return {owner:await h(a[0]),registered:await h(a[0].vector),actual:await h(l[0].asset.vector),placement:p[0],terrain:st.terrains.length,colliders:0};
}'''
def projection(f):
    x,y,r=P['region'];v=f['viewport'];w,h=f['css'];z=f['actual']['scale']
    data=[(x-r-v['left'])*z,(y-r-v['top'])*z,(x+r-v['left'])*z,(y+r-v['top'])*z]
    need(data[0]>=0 and data[1]>=0 and data[2]<=w and data[3]<=h,'signed SW face does not fit viewport')
    return data
def visit(browser,out,q,label,device,name,graph):
    w,h=map(int,device.split('x')); near=name=='southwest-near'; dx,dy=(-1,1) if near else (1,0)
    ref=P['references'][f'1-{device}-{name}'];z=ref['actual']['scale'] if near else None
    spec={'stage':34,'catalogID':'stage-34','activeDeclaredDimensions':[6144,4096]}
    arm=graph[label];SITE=arm['origin'];origin=urllib.parse.urlsplit(SITE); BLOB=re.compile(r'blob:'+re.escape(f'{origin.scheme}://{origin.netloc}/')+r'[\da-f-]{36}')
    known={**arm['active'],'HONRO.html':arm['shell']}
    required=set(arm['needs'])|{'HONRO.html'}
    ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
    job={'device':[w,h],'status':'HOLD','view':name,'phase':{},'reference':'Fresh anonymous published actual; authenticated QA camera metadata only'}
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
        need(job['decodedImageCount']>0,'native image decoding not witnessed')
        drain(page)
        args={'stage':34,'id':'stage-34','name':name,'dx':dx,'dy':dy,'scale':z,'park':True,'render':False}
        identity=page.evaluate_handle(IDENTITY)
        f=page.evaluate(PARK,args); b=page.evaluate(NATIVE,identity)
        wire=graph['normalBuildWire'];owner=page.evaluate(REGISTERED,{'id':P['id']})
        need(owner['owner']==wire['owner'+label] and owner['registered']==owner['actual']==wire['vector'+label] and
             owner['terrain']==17 and owner['colliders']==0,'wrong byte-exact live native owner / physical scope')
        job['actualNativeOwner']=owner
        need(f['physics']==P['exact37Physics'] and f['unitCount']==b['actors']==37 and f['sceneTime']==2 and f['phase']=='aim' and f['round']==1,
             'stock canonical physics, turn and scene clock differ')
        need(close(f['css'],ref['css']) and close(f['actual'],ref['actual']),'native camera/CSS mismatch')
        need(tuple(b['ids'])==OWNERS and all(a[1:]==[1,True] for a in b['stock']),'stock owners missing/not unique')
        if near:
            job['signedCSSProjection']=projection(f)
            need(OWNERS[4] in b['fore'],'known SW native foreground owner did not enter view')
        else:
            need(f['viewport']['left']>P['region'][0]+P['region'][2]+40,'SW face could enter East negative control')
        job['beforeRender']=b;job['beforeFirstActualBacking']=f['backing']
        f={**f,'backing':ref['backing']}
        job['placement']=f
        # One stock render per phase. No cache resets, forced tile recreation, or geometry hooks.
        phases=PHASE
        for i,phase in enumerate(phases,1):
            clock=page.evaluate('(i)=>__s34Phase(i)',i)
            now=page.evaluate(PARK,{**args,'park':False,'render':True});n=page.evaluate(NATIVE,identity)
            job['attempt']={'phase':phase,'native':n,'readback':now,'clock':clock}
            flush(out,q)
            need(now==f and n['fore']==b['fore'] and n['stock']==b['stock'],'render/readback state changed')
            job['phase'][phase]={'native':n,'clock':clock,'guard':'HOLD'}
            if near:native_phase(phase,n['cache'],b['cache'],job['phase'],f['backing'])
            job['phase'][phase]['guard']='PASS'
            job.pop('attempt');flush(out,q)
            if i!=3:continue
            key=f'{label}-{device}-{name}'
            box=el.bounding_box(); css=css_enclosure(box,now,[w,h]); raw=base64.b64decode(page.evaluate(OBSERVERS['RAW']),validate=True)
            dom=el.screenshot(animations='disabled',caret='hide',scale='css');need(box==el.bounding_box(),'canvas moved')
            need(raw==base64.b64decode(page.evaluate(OBSERVERS['RAW']),validate=True),'native canvas moved while recording DOM')
            records={k:store_img(out,key+'-'+k,val)for k,val in [('raw',raw),('dom',dom)]}
            records['dom']['bbox']=css;job['phase'][phase].update(records);flush(out,q)
            need(records['raw']['size']==now['backing'] and records['dom']['size']==css['enclosedSize'],'raw/DOM backing changed')
        identity.dispose()
        need(page.evaluate('()=>__s34Restore()') is True,'render clock observer not restored')
        drain(page); job.update(status='PUBLIC_ACTUAL_CAPTURED',verifiedHTTP=seen)
    finally:
        job['networkErrors']=errors;job['verifiedHTTPPartial']=seen;flush(out,q);ctx.close()


def enabled():
    a=P.get('release')
    need(P['enabled'] is True and isinstance(a,dict),'DISABLED: bind verified successful master Pages run before launch')
    commit=a['head'];tree=a['tree'];deploy=a['pages']
    need(all(isinstance(x,str) and re.fullmatch('[0-9a-f]{40}',x) for x in (commit,tree))
         and commit!=P['previousRelease'],'exact promoted master required, not old master')
    need(set(deploy)=={'head','branch','conclusion','run','job','publishedAt'} and
         deploy['head']==commit and deploy['branch']=='master' and deploy['conclusion']=='success' and
         all(type(deploy[k]) is int and deploy[k]>0 for k in ('run','job')) and
         re.fullmatch(r'2026-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z',deploy['publishedAt']),
         'root must attest actual successful deployment of exact promoted master')
    need(not(os.getenv('GH_TOKEN') or os.getenv('GITHUB_TOKEN')),'anonymous only')
    need((os.getenv('GITHUB_REPOSITORY'),os.getenv('GITHUB_EVENT_NAME'),os.getenv('GITHUB_REF'))==
         ('sys8994/honro','push',P['qaRef']),'isolated public QA branch only')
    repo=Path(os.environ['GITHUB_WORKSPACE'])
    def g(*args):return subprocess.check_output(['git','-C',repo,*args],timeout=40).decode().strip()
    h=os.environ['GITHUB_SHA']
    need(g('rev-list','--parents','-1','HEAD').split()==[h,commit] and
         g('rev-parse',commit+'^{tree}')==tree,'checkout not exact child of exact deployed master')
    names={'.github/workflows/stage34-sw-tone-public-readback.yml',*(str(H.relative_to(repo)/x) for x in
                        ('PINS.json','capture.py','observer.json','park.js'))}
    need(set(g('diff','--no-renames','--name-status',commit,h).splitlines())=={'A\t'+k for k in names}
         and all(g('ls-tree',h,'--',k).startswith('100644 blob ') for k in names)
         and not g('status','--porcelain=v1'),'unknown changes in public QA carrier')
    need(fact((repo/M).read_bytes())==a['manifest'],'latest retained manifest is not the branch source')
    return a

def anonymous(out,a):
    def get(k,pin):
       req=urllib.request.Request(LIVE+k,headers={'User-Agent':'Mozilla/5.0 HONRO anonymous QA',
         'Cache-Control':'no-cache','Accept-Encoding':'identity'})
       with urllib.request.urlopen(req,timeout=50)as r:
         need(r.status==200 and r.geturl()==LIVE+k and r.headers.get('Content-Encoding') in (None,'identity'),
           ('unexpected anonymous HTTP',k,r.status,r.geturl()))
         b=check(r.read(pin['bytes']+1),pin,k)
       return b
    m=json.loads(get(M,a['manifest']))
    pin=lambda x:{k:x[k] for k in ('bytes','sha256')}
    active={p['path']:pin(p) for p in m['files']}
    need(len(active)==len(m['files'])==P['activeCount'],'active public resource ledger drifted')
    for k,v in P['newRoute'].items():
        if k.startswith('web/'):need(active.get(k)==v,('incompatible compiled B active path',k))
    retired={x['path']:pin(x) for row in [m['previousFiles'],*m['previousGenerations'],
       *(c['files'] for c in m['publishedGenerations'])] for x in row}
    need(len(active.keys()|retired.keys())==P['preservedImmutableCount'],'public retained URL graph count drifted')
    need(any(c['sourceSha']==P['previousRelease'] for c in m['publishedGenerations']),'previous live generation not retained')
    for k,v in P['oldRoute'].items():need(retired.get(k)==v,('previous immutable URL not recorded',k))
    selected={**P['newRoute'],**P['oldRoute']}
    actual={k:fact(get(k,v)) for k,v in selected.items()}
    save(out/'HTTP-PUBLIC.json',{'release':a,'verifiedGET':{M:a['manifest'],**actual},
           'activeManifestEntries':len(active),'listedImmutableURLUnion':len(active.keys()|retired.keys()),
           'spotScope':'HTTP-get exact changed and displaced role URLs; remaining addresses are manifest retention, not individual HTTP smoke.'})
    return {'B':{'active':active,'needs':P['browserNeeds'],'shell':P['newRoute']['HONRO.html'],'origin':LIVE},
      'normalBuildWire':P['normalBuildWire']}

def main(out):
    a=enabled();out.mkdir(parents=True,exist_ok=True)
    from playwright.sync_api import sync_playwright
    q={'release':a,'scope':'Actual anonymous public Stage34 SW color-only smoke; prior stricter A/B gate remains FAIL',
       'status':'HOLD','visits':{}}
    try:
      g=anonymous(out,a)
      with sync_playwright()as pw:
        br=pw.chromium.launch(headless=True)
        try:
          q['browser']=br.version;need(br.version=='151.0.7922.34','unexpected native Chrome')
          for d in ('1440x900','390x844'):visit(br,out,q,'B',d,'southwest-near',g)
        finally:br.close()
      need(len(q['visits'])==2 and all(f['status']=='PUBLIC_ACTUAL_CAPTURED' for f in q['visits'].values()),
           'incomplete two-device public smoke')
      q['status']='PASS_PUBLIC_BYTES_AND_TWO_ACTUAL_SW_CAPTURES'
    finally:flush(out,q)
if __name__=='__main__':
    if sys.argv[1:]==['--verify-binding']:enabled()
    else:
      need(len(sys.argv)==2,'usage: capture.py OUT or --verify-binding')
      main(Path(sys.argv[1]).resolve())
