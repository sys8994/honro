"""Anonymous exact public Stage44 raw readback; no injected resource or save profile."""
from pathlib import Path
from base64 import b64decode
from io import BytesIO
from PIL import Image
from playwright.sync_api import sync_playwright
from concurrent.futures import ThreadPoolExecutor
import hashlib,json,os,re,sys,urllib.request
D=Path(__file__).resolve().parent; P=json.loads((D/'PINS.json').read_bytes())
ob=(D/'observer.json').read_bytes(); O=json.loads(ob)
BASE='https://sys8994.github.io/honro/'
READY="()=>document.documentElement.dataset.honroReady==='true' && typeof globalThis.HonroCampaignLoader?.ensureStage==='function'"
def require(c,m):
    if not c:raise RuntimeError(m)
def sha(b):return hashlib.sha256(b).hexdigest()
OBJECTIVE_FONT="""async()=>{
 const s=globalThis.HonroApp?.scene;
 if(!s||!Array.isArray(s.missionTargets))throw Error('No live objective targets for native font witness');
 const text='오른쪽 · 위 뿌리 능선',font='600 12px sans-serif';
 const targets=s.missionTargets.map(t=>[t.id,t.kind,t.x,t.y,t.label]);
 const face=await document.fonts.load(font,text);await document.fonts.ready;
 if(!document.fonts.check(font,text)||face.some(f=>f.status!=='loaded'))throw Error('Native canvas objective font not ready');
 // The objective renderer assigns an explicit generic sans-serif, not DOM
 // Honro Serif. A FontFaceSet/check result alone cannot prove fallback glyphs.
 const c=document.createElement('canvas');c.width=48;c.height=32;
 const g=c.getContext('2d',{willReadFrequently:true});g.font=font;g.textBaseline='alphabetic';
 const fingerprints=[...'오른쪽'].map(ch=>{g.clearRect(0,0,48,32);g.fillText(ch,2,20);
  const pixels=g.getImageData(0,0,48,32).data;let h=2166136261,ink=0;
  for(let i=3;i<pixels.length;i+=4){if(pixels[i])ink++;h=Math.imul(h^pixels[i],16777619);}
  return{ch,ink,hash:h>>>0};});
 if(fingerprints.some(x=>x.ink===0)||new Set(fingerprints.map(x=>x.hash)).size!==fingerprints.length)
  throw Error('Native Korean objective fallback has missing/tofu glyphs');
 return{font:g.font,text,width:g.measureText(text).width,fingerprints,targets,
         authorFaceFamilies:face.map(x=>x.family),status:document.fonts.status};
}"""
def ready_canvas_font(page):
    return page.evaluate(OBJECTIVE_FONT)
def collect(br,origin,who,hashes,pose_override=None):
    W,H={'PC':(1440,900),'M':(390,844)}[who]
    ctx=br.new_context(viewport={'width':W,'height':H},device_scale_factor=1,service_workers='block')
    try:
        # Read only the signed public Pages path. Unrelated external requests are blocked.
        ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(origin) or r.request.url.startswith(('data:','blob:','about:')) else r.abort())
        p=ctx.new_page(); seen={}; errors=[]
        p.on('response',lambda r:seen.setdefault(r.url,r) if r.url.startswith(origin) else None)
        p.on('pageerror',lambda e:errors.append(str(e)))
        p.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
        nav=p.goto(origin+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
        require(nav and nav.status==200 and nav.url==origin+'HONRO.html' and not nav.from_service_worker,'HTTP shell')
        p.wait_for_function(READY,timeout=90000)
        p.evaluate('()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}')
        p.evaluate(O['LAUNCH'],44);p.locator('#battlecanvas').wait_for(state='visible')
        p.wait_for_function("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return document.querySelector('#turn-banner')?.hidden!==false&&!a.dialogue&&a.engine?.b?.phase==='aim';}",timeout=15000,polling=125)
        font=ready_canvas_font(p)
        pose=pose_override if pose_override is not None else P['poses'][who];args=dict(id=44,mapId='stage-44',name='ordinary' if who=='PC' else 'west-min',ordinary=pose,dx=0 if who=='PC' else -1,dy=0,readback=False,fixedNow=O['PHASE'])
        m0=p.evaluate(O['FROZEN'],args)['meta']; d=p.evaluate(O['DECODE']);require(not d['failed'],'images decode')
        m=p.evaluate(O['FROZEN'],{**args,'readback':True})['meta'];raw=b64decode(p.evaluate(O['CANVAS']),validate=True)
        ph=sha(m.pop('signature').encode())
        require(sha(m0.pop('signature').encode())==ph==P['physics'] and m==m0,'physics/readback phase changed')
        require(m['actual']==dict(zip(('x','y','scale'),pose)) and m['round']==1 and m['phase']=='aim' and m['sceneTime']==2 and m['actorCount']==35,'unexpected fixed pose/turn')
        require(not errors,str(errors))
        needed=set(P['arms']['C']['files'])-{'web/manifest.json',P['expected']['approvedAliasPairs']['web/entries/workshop.bfa695faa4088b81.js'],P['expected']['approvedAliasPairs']['web/entries/game.d33d78b046b05167.html']}
        for k in needed:
            r=seen.get(origin+k)
            require(r and r.status==200 and not r.from_service_worker and sha(r.body())==P['arms']['C']['files'][k],'used HTTP route missing/changed '+k)
        # Audit every observed 200 asset with manifest pin; do not label scanner/no-response or range complete.
        actual={}
        for u,r in seen.items():
            k=u[len(origin):]
            if r.status==200 and k in hashes:
                require(not r.from_service_worker and sha(r.body())==hashes[k]['sha256'],'unbound asset '+k)
                actual[k]=hashes[k]['sha256']
        return raw,{'meta':m,'physical':ph,'objectiveFont':font,'http':actual,'pngSHA256':sha(raw)}
    finally:ctx.close()
def fetch(k,v,n):
    require(re.fullmatch(r'(?:index\.html|HONRO(?:_WORKSHOP)?\.html|web/manifest\.json|web/(?:runtime|entries|data|graphics)/[A-Za-z0-9_.-]+)',k),'unsafe route '+k)
    u=BASE+k
    with urllib.request.urlopen(urllib.request.Request(u,headers={'Cache-Control':'no-cache','Accept-Encoding':'identity'}),timeout=40)as r:
        require(r.status==200 and r.url==u and r.headers.get('Content-Encoding','identity')=='identity','public status '+k)
        b=r.read(n+1)
    require(len(b)==n and sha(b)==v,'public body '+k)
    return b
def pre():
    p=P['expected'];f=p['files'];r=json.loads(fetch('web/manifest.json',f['web/manifest.json']['sha256'],f['web/manifest.json']['bytes']))
    active={x['path']:x for x in r['files']};old={x['path']:x for x in r['previousFiles']}
    require(len(active)==811 and r['gameEntry']=='web/entries/game.547b23467b5bf6c7.js' and r['workshopEntry']=='web/entries/workshop.ba859e0a5db97979.js' and r['playtest']=='web/entries/game.b433e4fc393b568b.html?embedded=1' and 'web/runtime/ordered-common-18.326be34080f88678.js' in r['common'],'exact active published main routes')
    refs={k:v for k,v in f.items() if k!='web/manifest.json'}
    for a,b in p['approvedAliasPairs'].items():
        require(a in old and b in active and refs[b]['sha256']==active[b]['sha256'],'exact public active/history roles')
        refs[a]=old[a]
    c=P['arms']['C']; extra={c[k] for k in ('map','campaign','provider')}|{k for k in c['files'] if 'chapter-44-assets-part-' in k}
    for k in extra:
        require(active[k]['sha256']==c['files'][k],'protected public provider '+k)
        refs[k]=active[k]
    with ThreadPoolExecutor(max_workers=4)as w:
        pending={k:w.submit(fetch,k,v['sha256'],v['bytes']) for k,v in refs.items()}
        results={k:v.result() for k,v in pending.items()}
    camp=json.loads(results[c['campaign']])
    require(camp['stages'][43]==c['map'] and camp['stageLibraries'][43]==c['provider'],'Stage44 not native active alias')
    parts=json.loads(results[c['provider']]);body=b''.join(results[v['path']] for v in parts['parts'])
    require(len(body)==parts['bytes'] and sha(body)==parts['sha256'],'active public split body mismatch')
    return active,{k:{'sha256':sha(v),'bytes':len(v)} for k,v in results.items()}
def run(out):
    require(P['enabled'] is True and os.getenv('GITHUB_REPOSITORY')=='sys8994/honro' and os.getenv('GITHUB_REF')=='refs/heads/'+P['branch'] and sha(ob)==P['observerSHA256'],'disabled: exact public probe only')
    verified=json.loads((out/'PAGES.json').read_bytes())
    require(verified['head']==P['head'] and confirmed(verified),'not official current Pages')
    desc={'status':'HOLD','pages':verified,'nativeC3':P['expected']['reviewedNative'],'frames':{}}
    def save():(out/'PUBLIC.json').write_text(json.dumps(desc,indent=2)+'\n')
    try:
        active,desc['routes']=pre();save()
        with sync_playwright() as p:
            b=p.chromium.launch(headless=True,chromium_sandbox=True)
            try:
                require(b.version==P['chromium'],'stock Chromium version mismatch')
                for name,who,pose in (('PC','PC',None),('M','M',None),('PC-CLOSE','PC',P['closeWestPC'])):
                    png,r=collect(b,BASE,who,active,pose)
                    (out/(name+'-PUBLIC.png')).write_bytes(png)
                    with Image.open(BytesIO(png))as im:r['rgbaSHA256']=sha(im.convert('RGBA').tobytes())
                    expected=P['frames'][name];r['exactNativeC3Pixels']=r['rgbaSHA256']==expected['rgbaSHA256'];r['exactNativeC3PNG']=r['pngSHA256']==expected['pngSHA256']
                    desc['frames'][name]=r;save()
                    require(r['exactNativeC3Pixels'] and r['objectiveFont']==expected['objectiveFont'],'actual public native parity '+name)
            finally:b.close()
        # Abort acceptance if a newer deployment appears during the capture.
        q=P['expected']['retainedManifest'];fetch('web/manifest.json',q['sha256'],q['bytes'])
        desc['status']='PASS_EXACT_PUBLIC_STAGE44_PC_M_AND_CLOSE_RECOVERY'
    except BaseException as e:desc['firstError']=repr(e);raise
    finally:save()
def confirmed(x):return x.get('status')=='PASS_OFFICIAL_EXACT_PAGES' and {k:x[k] for k in P['pages']}==P['pages']
if __name__=='__main__':run(Path(sys.argv[1]).resolve(strict=True))
