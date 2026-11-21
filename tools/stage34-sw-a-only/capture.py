"""Official-carrier A only. No adjustment, B registration, or release action."""
import argparse,base64,io,json,math,os,re,subprocess,time,urllib.request
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parent
P=json.loads((ROOT/'PINS.json').read_bytes())
CURRENT=P['authority']
POSES,VIEWS,LAYOUT=(P[k] for k in ('devices','views','layout'))
STOCK_ORDER=tuple(P['ownerOrder'])
MAP,PACKET=P['expectedMapAndPacket']
SITE='https://sys8994.github.io/honro/'
BLOB=re.compile(r'blob:https://sys8994\.github\.io/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$')
MEDIA={f'assets/bgm/{k}.mp3' for k in ('main','battle-1','battle-2','battle-3','battle-4')}
FORMS={'southwest-near':(-1,1),'southwest':(-1,1),'east':(1,0)}
PHASE=('cold-direct','backing-first','backing-reuse')
PARK=(ROOT/'park.js').read_text()
OBSERVERS=json.loads((ROOT/'observer.json').read_bytes())
CLOCK=OBSERVERS.pop('CLOCK_STAGE34')

import hashlib
def need(ok, msg):
    if not ok: raise RuntimeError(msg)
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def expected(o):return {k:o[k] for k in ('bytes','sha256')}
def check(raw,pin,label):
    need(fact(raw)==expected(pin),f'wrong exact bytes: {label}')
    return raw
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

def check_github_carrier():
    need(os.getenv('GITHUB_REPOSITORY')=='sys8994/honro' and os.getenv('GITHUB_EVENT_NAME')=='push' and
         os.getenv('GITHUB_REF')==P['qaRef'],'wrong isolated QA origin')
    w=Path(os.environ['GITHUB_WORKSPACE']).resolve()
    def g(*cmd):return subprocess.check_output(['git','-C',str(w),*cmd])
    head=os.environ['GITHUB_SHA'];parent=CURRENT['lastLocallyAttestedPublic']
    need(g('rev-list','--parents','-n1','HEAD').decode().split()==[head,parent] and
         g('rev-parse',parent+'^{tree}').decode().strip()==P['publishedTree'],'wrong exact QA head / sole released parent')
    files={'.github/workflows/stage34-sw-a-only.yml',*(f'tools/stage34-sw-a-only/{k}'for k in ('PINS.json','park.js','observer.json','capture.py'))}
    need(set(g('diff','--name-status','--no-renames',parent,'HEAD').decode().splitlines())=={'A\t'+f for f in files},
         'only exact add-only QA scope is allowed')
    need(all(g('ls-tree',head,'--',f).startswith(b'100644 blob ')for f in files) and
         not g('status','--porcelain=v1','--untracked-files=all'),'nonordinary added files or dirty worktree')
    need(os.environ.get('PYTHONDONTWRITEBYTECODE')=='1','do not mutate checkout with helper caches')
    pins={'web/manifest.json':CURRENT['retainedManifest'],MAP:CURRENT['matchingMapAndPacket'][0],
          PACKET:CURRENT['matchingMapAndPacket'][1]}
    for f,pin in pins.items():
        check(g('show',f'{parent}:{f}'),pin,f)
        need(g('rev-parse',f'{parent}:{f}').decode().strip()==pin['gitBlob'],'wrong exact stock Git blob '+f)
    m=json.loads(g('show',f'{parent}:{MAP}'));a=json.loads(g('show',f'{parent}:{PACKET}'))
    need((m['id'],m['width'],m['height'])==('stage-34',6144,4096) and
         tuple(x['id']for x in m['elements'])==STOCK_ORDER and len(a)==6 and
         {x['assetId']for x in m['elements']}=={x['id']for x in a},'wrong compiled Stage34 stock ownership')
    return {'head':head,'parent':parent,'parentTree':P['publishedTree'],'onlyAdded':sorted(files),'exactStockBlobs':pins}

def close(a,b):
    if isinstance(b,dict): return set(a)==set(b) and all(close(a[k],v)for k,v in b.items())
    if isinstance(b,list):return len(a)==len(b) and all(close(x,y)for x,y in zip(a,b))
    if isinstance(b,(int,float)) and not isinstance(b,bool):return isinstance(a,(int,float)) and abs(a-b)<1e-6
    return a==b
def fetch(k,v):
    q=urllib.request.Request(SITE+k,headers={'Cache-Control':'no-cache','Accept-Encoding':'identity','User-Agent':'Mozilla/5.0 HONRO developer inspector'})
    with urllib.request.urlopen(q,timeout=60)as r:
        need(r.status==200 and r.geturl()==SITE+k and r.headers.get('Content-Encoding') in (None,'identity'),'noncanonical public response '+k)
        return check(r.read(v['bytes']+1),v,k)
def context_inputs():
    mf=expected(CURRENT['retainedManifest'])
    m=json.loads(fetch('web/manifest.json',mf))
    idx={r['path']:expected(r)for r in m['files']}
    need(len(idx)==len(m['files'])==810,'wrong live generation, re-pin first')
    need(all(idx[k]==expected(v)for k,v in CURRENT['manifestAnchors'].items()),'wrong active Stage34 map/load refs')
    allowed={**P['oldAliases'],**idx,'HONRO.html':P['shell'],'web/manifest.json':mf}
    for k in ('HONRO.html',MAP,PACKET):
        fetch(k,allowed[k])
    # The retained shell may naturally request either its old game entry alias or
    # the current hash. Read observed bytes as sent; never intercept responses.
    required={k for k in CURRENT['manifestAnchors'] if not k.endswith('.html')}|{'HONRO.html'}
    return allowed,required

NATIVE='''()=>{
 const a=HonroApp,s=a.scene,b=a.engine.b,m=HONRO_PROJECT.stages.find(x=>x.id==='stage-34');
 const floor=b.honroLandmarks, family=m.elements.filter(x=>x.id.startsWith('approved34-'));
 const ids=family.map(x=>x.id), actors=b.units.length;
 const rect=s.canvas.getBoundingClientRect(),view=HonroBounds.viewport(s,rect.width,rect.height);
 const fore=floor.filter(l=>s._isForeground(l)&&s._landmarkVisible(l,view)).map(l=>l.id);
 const f=s._screenForegroundCache,css=[rect.width,rect.height];
 const r=s.renderCacheStats(),stock=family.map(x=>{const hit=HONRO_PROJECT.library.filter(l=>l.id===x.assetId);return [x.id,hit.length,!!hit[0]?.vector];});
 return {ids,actors,fore,css,stock,cache:{key:f?.key??null,canvas:f?.canvas?[f.canvas.width,f.canvas.height]:null,bytes:f?.bytes??0,
  builds:r.screenBuilds??0,hits:r.screenHits??0}};
}'''
def flush(out,q):
    p=out/'A.json.tmp';p.write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n');p.replace(out/'A.json')
def projection(f):
    x,y,x2,y2=LAYOUT; v=f['viewport'];w,h=f['css']; z=f['actual']['scale']
    o=[(x-v['left'])*z,(y-v['top'])*z,(x2-v['left'])*z,(y2-v['top'])*z]
    need(0<o[0]<o[2]<w and 0<o[1]<o[3]<h,'signed SW receiver not wholly in observed near view')
    need(o[2]-o[0]>=14 and o[3]-o[1]>=7.9,'signed SW receiver too small')
    return o
def visit(browser,out,q,label,device,name,known,required):
    z,w,h=POSES[device];dx,dy=FORMS[name]; old=P['historicalContext']['poseAndPhysicsOnlyPerDevice']['s34-'+device]
    shape=old['southwest']; hist=old.get(name); spec={'stage':34,'catalogID':'stage-34','activeDeclaredDimensions':[6144,4096]}
    ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
    job={'device':[w,h],'status':'HOLD','view':name,'phase':{},'referenceType':'NONE: fresh SW near' if hist is None else 'historical camera metadata only; new PNG'}
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
        args={'stage':34,'id':'stage-34','name':name,'dx':dx,'dy':dy,
              'scale':z if hist is None else None,'park':True,'render':False}
        f=page.evaluate(PARK,args); b=page.evaluate(NATIVE)
        need(f['physics']==shape['physics'] and f['unitCount']==b['actors']==37 and f['sceneTime']==2 and f['phase']=='aim' and f['round']==1,
             'stock canonical physics, turn and scene clock differ')
        need(close(f['css'],shape['css']),'actual CSS / backing authority changed')
        need(tuple(b['ids'])==STOCK_ORDER and all(a[1:]==[1,True] for a in b['stock']),'stock owners missing/not unique')
        if hist is None:
            target=P['nearPlan']['PC' if w==1440 else 'mobile']['unrunPlannedActual']
            need(close([f['actual'][k]for k in ('x','y','scale')],target),'near native clamp differed; do not force')
            job['signedCSSProjection']=projection(f)
            need(STOCK_ORDER[4] in b['fore'],'known SW native foreground owner did not enter view')
        else:
            need(all(close(f[k],hist[k])for k in ('actual','viewport','css')),'historical minimum zoom framing changed')
        if name=='east':
            need(f['viewport']['left']>LAYOUT[2]+40, 'signed SW receiver could reach the negative east view')
        job['beforeRender']=b;job['beforeFirstActualBacking']=f['backing']
        f={**f,'backing':shape['backing']}
        job['placement']=f
        # One stock render per phase. No cache resets, forced tile recreation, or geometry hooks.
        phases=PHASE if name=='southwest-near' else PHASE[:1]
        for i,phase in enumerate(phases,1):
            clock=page.evaluate('(i)=>__s34Phase(i)',i)
            now=page.evaluate(PARK,{**args,'park':False,'render':True});n=page.evaluate(NATIVE); c=n['cache']
            need(now==f and n['fore']==b['fore'] and n['stock']==b['stock'],'render/readback state changed')
            if i==1 and name=='southwest-near':
                need(c['key'] and c['key']!=b['cache']['key'] and c['canvas'] is None and c['bytes']==0,'missing fresh foreground direct draw')
            elif i>1:
                prev=job['phase'][PHASE[i-2]]['native']['cache']
                need(c['key']==prev['key'] and c['canvas']==f['backing'] and c['bytes']==math.prod(f['backing'])*4,'not measured foreground backing')
                need((c['builds']>prev['builds']) if i==2 else (c['hits']>prev['hits'] and c['builds']==prev['builds']), 'missing allocation/reuse witness')
            key=f'A-{label}-{device}-{name}-{phase}'
            box=el.bounding_box(); css=css_enclosure(box,now,[w,h]); raw=base64.b64decode(page.evaluate(OBSERVERS['RAW']),validate=True)
            dom=el.screenshot(animations='disabled',caret='hide',scale='css')
            need(box==el.bounding_box(),'canvas moved during DOM readback')
            records={k:store_img(out,key+'-'+k,val)for k,val in [('raw',raw),('dom',dom)]}
            need(records['raw']['size']==now['backing'] and records['dom']['size']==css['enclosedSize'],'raw/DOM viewport backing confused')
            records['dom']['bbox']=css;job['phase'][phase]={**records,'native':n,'clock':clock}
            flush(out,q)
        need(page.evaluate('()=>__s34Restore()') is True,'render clock observer not restored')
        drain(page); job.update(status='A_ACTUAL_CAPTURED',verifiedHTTP=seen)
    finally:
        job['networkErrors']=errors;flush(out,q);ctx.close()

def compare_a(out,q):
    num=0
    for d in POSES:
        for view in ('southwest-near',):
            a,b=[q['visits'][f'{i}-{d}-{view}'] for i in (1,2)]
            need(a['status']==b['status']=='A_ACTUAL_CAPTURED' and a['placement']==b['placement'],'A repeat differs in state/pose')
            for phase in PHASE:
                av,bv=a['phase'][phase],b['phase'][phase]
                need(av['clock']==bv['clock'],'do not compare different phase clocks')
                for kind in ('raw','dom'):
                    x,y=av[kind],bv[kind]
                    for i in (x,y):
                        p=out/i['path'];check(p.read_bytes(),i['png'],p.name)
                        im=rgba(p);need(sha(im.tobytes())==i['rgba'] and list(im.size)==i['size'],'PNG/decoded identity mismatch')
                    need(x['size']==y['size'] and x['rgba']==y['rgba'] and x.get('bbox')==y.get('bbox'),
                         (d,view,phase,kind,'A1/A2 actual RGBA not exact'))
                    num+=1
    return num

def main():
    p=argparse.ArgumentParser(__doc__); p.add_argument('--capture-exact-2c4-A',action='store_true',required=True)
    p.add_argument('--out',required=True,type=Path)
    a=p.parse_args()
    need(a.out.is_absolute() and a.out.is_relative_to(Path(os.environ['RUNNER_TEMP']).resolve()) and
         not a.out.exists(),'choose a wholly new RUNNER_TEMP output')
    need(not any(os.getenv(x) for x in ('GH_TOKEN','GITHUB_TOKEN')),'public anonymous A only')
    a.out.mkdir()
    q={'scope':'A_ONLY; no B; no art, product, or visual approval','status':'HOLD',
       'historicalContext':P['historicalContext'],'release':CURRENT['lastLocallyAttestedPublic'],
       'pagesRecorded':CURRENT['pagesRun'],'visits':{}}
    flush(a.out,q)
    q['source']=check_github_carrier()
    flush(a.out,q)
    try:
        from playwright.sync_api import sync_playwright
        known,required=context_inputs()
        with sync_playwright()as pw:
            br=pw.chromium.launch(headless=True)
            try:
                q['browser']=br.version;need(br.version==P['browser'],'do not use other Chromium for the pinned proof')
                for repeat in (1,2):
                    for d in POSES:
                        for name in (VIEWS if repeat==1 else ('southwest-near',)):
                            visit(br,a.out,q,repeat,d,name,known,required)
                            need(not br.contexts,'browser context leak')
            finally:br.close()
        fetch('web/manifest.json',known['web/manifest.json'])
        q['matchedWholeFramePairs']=compare_a(a.out,q)
        expected_visits={f'1-{d}-{v}'for d in POSES for v in VIEWS}|{f'2-{d}-southwest-near'for d in POSES}
        need(set(q['visits'])==expected_visits and all(x['status']=='A_ACTUAL_CAPTURED' for x in q['visits'].values()),
             'incomplete actual A source/pose matrix')
        need(q['matchedWholeFramePairs']==12,'incomplete near A repeat matrix')
        expected_images={v[k]['path'] for x in q['visits'].values()for v in x['phase'].values()for k in ('raw','dom')}
        need(len(expected_images)==32 and expected_images=={x.name for x in a.out.glob('*.png')},'incomplete actual image closure')
        for x in q['visits'].values():
            for f in x['phase'].values():
                for k in ('raw','dom'):
                    r=f[k];p=a.out/r['path'];check(p.read_bytes(),r['png'],p.name)
                    im=rgba(p);need(sha(im.tobytes())==r['rgba'] and list(im.size)==r['size'],'wrong final PNG/decoded identity')
        q['status']='PASS_A_FRAMING_AND_NEAR_REPEAT_ONLY'
    except Exception as e:
        q['error']=repr(e);raise
    finally:flush(a.out,q)

if __name__=='__main__':main()
