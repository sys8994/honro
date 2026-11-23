"""Detached historical 3032; exact C2 in-memory packet substitution on local C only."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from urllib.parse import urlsplit
from contextlib import ExitStack
import base64,hashlib,io,json,math,os,stat,subprocess,sys,threading
D=Path(__file__).resolve().parent;P=json.loads((D/'PINS.json').read_bytes())
PB=(D/'C2-PATCH.json').read_bytes(); XX=json.loads(PB)
OB=(D/'observer.json').read_bytes(); O=json.loads(OB)
F=P['base']['packet']; BODY='approved40:body'; B=P['base']['head']; ROOT=Path.cwd().resolve()
WF='.github/workflows/stage40-east-native-masonry-c2-3032.yml'; TOOL='tools/stage40-east-masonry-c2-readback/'
def need(x,m):
    if not x:raise RuntimeError(m)
def sha(s):return hashlib.sha256(s).hexdigest()
def fact(s):return {'bytes':len(s),'sha256':sha(s)}
def dump(p,x):p.write_text(json.dumps(x,indent=2)+'\n')
def enc(x):return json.dumps(x,ensure_ascii=False,separators=(',',':')).encode()
def git(path,*args):return subprocess.check_output(['git','-C',str(path),*args],text=True,timeout=90).strip()
def read(r,k):
    p=r/k
    need(p.resolve()==p and p.is_file() and stat.S_ISREG(p.lstat().st_mode),'nonregular exact path '+k)
    return p.read_bytes()

def patch(packet):
    need(fact(packet)==P['proof']['payload'] and sha(PB)==P['patchSHA256'] and XX['baseSha']==sha(packet),'wrong input packet / C2 bytes')
    raw=json.loads(packet); ids=[i for i,a in enumerate(raw) if a['id']==BODY];need(len(ids)==1,'nonunique body')
    i=ids[0];v=raw[i]['vector'];r=v['root']['children'][0];leaves=r['children']
    need(v['root']['transform']==[4,0,0,4,0,0] and r['clipPath']=='sourceAlpha' and len(leaves)==24,'wrong source slot')
    end=enc(leaves[-1])+b']}'
    need(sha(enc(leaves[-1]))==XX['expectedStockLeafSHA'] and sha(enc(v['clips']['sourceAlpha']))==XX['sourceAlphaSHA'] and packet.count(end)==1,'wrong stock final leaf / clip')
    nodes=XX['nodes'];need(len(nodes)==4 and all(set(n)=={'tag','fill','stroke','fillRule','d'} and n['tag']=='path' and n['stroke']=='none' and n['fillRule']=='nonzero' for n in nodes),'wrong exact patch structure')
    splice=b','+b','.join(map(enc,nodes));target=end[:-2]+splice+b']}'
    c=packet.replace(end,target)
    need(fact(c)==P['candidate'] and sha(c)==XX['candidateSha'] and len(c)-len(packet)==XX['byteDelta'],'C2 compiled packet identity mismatch')
    need(c.count(target)==1 and c.replace(target,end)==packet,'stock lexical reversion failed')
    rr=json.loads(c);new=rr[i]['vector']['root']['children'][0]['children']
    need(new[-4:]==nodes,'wrong native leaf order');del new[-4:]
    need(rr==raw,'B/C logical pool differs outside single body insertion')
    return c
def pre(w):
    stage=P['base'];need(w.is_dir() and (w/'out').is_dir() and not (w/'stock').exists(),'unsafe runner path')
    need(git(ROOT,'rev-parse','HEAD')==os.environ['GITHUB_SHA'] and git(ROOT,'show','-s','--format=%P','HEAD')==B and git(ROOT,'rev-parse',B+'^{tree}')==stage['tree'] and not git(ROOT,'status','--porcelain'),'wrong exact 3032 QA anchor')
    names={WF,*(TOOL+n for n in ('PINS.json','C2-PATCH.json','observer.json','probe.py'))}
    need(set(git(ROOT,'diff','--name-status','--no-renames',B,'HEAD').splitlines())=={'A\t'+f for f in names} and all(git(ROOT,'ls-tree','HEAD','--',f).startswith('100644 ') for f in names),'non-exact add-only QA scope')
    def api(x):return json.loads(subprocess.check_output(['gh','api','repos/sys8994/honro/actions/'+x],timeout=75))
    run,job=api(f"runs/{stage['run']}"),api(f"jobs/{stage['job']}")
    need((run['head_sha'],run['head_branch'],run['name'],run['conclusion'])==(B,'master','pages build and deployment','success') and (job['head_sha'],job['run_id'],job['name'],job['conclusion'])==(B,stage['run'],'deploy','success') and any(x['name']=='Deploy to GitHub Pages' and x['conclusion']=='success' for x in job['steps']),'3032 official historical Pages proof mismatch')
    # Local-only detached exact worktree. The stock provider is never edited.
    git(ROOT,'-c','core.hooksPath=/dev/null','worktree','add','--detach',str(w/'stock'),B)
    root=w/'stock';p=P['proof']
    need(not git(root,'status','--porcelain') and git(root,'rev-parse','HEAD^{tree}')==P['base']['tree'],'detached stock changed')
    need(fact(read(root,'HONRO.html'))==p['shell'] and fact(read(root,'web/manifest.json'))==p['manifest'] and git(root,'rev-parse','HEAD:web/manifest.json')==stage['manifestGit'],'not exact published 3032 shell/manifest')
    for k,v in p['files'].items():need(fact(read(root,k))==v,'wrong exact published route '+k)
    campaign='web/data/campaign.'+stage['campaign']+'.json'; m=json.loads(read(root,'web/manifest.json'));c=json.loads(read(root,campaign))
    need(m['project']==campaign and c['stageLibraries'][39]==F and c['stages'][39]=='web/data/chapter-40.5f4b6c4c311adc05.json' and len(c['stages'])==len(c['stageLibraries'])==50,'not exact compiled campaign mapping')
    candidate=patch(read(root,F));(w/'candidate.json').write_bytes(candidate)
    # Native provider FNV uses JS JSON.stringify, not Python's serialization.
    expr="""let t='';for await(const c of process.stdin)t+=c;const a=JSON.parse(t).find(x=>x.id==='approved40:body');const s=JSON.stringify(a);let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);console.log(s.length+':'+(h>>>0).toString(16))"""
    nativeSig=lambda p:subprocess.check_output(['node','--input-type=module','-e',expr],input=p,timeout=20).decode().strip()
    need(nativeSig(read(root,F))==P['registry'][BODY] and nativeSig(candidate)==P['candidateNativeProvider'] and P['candidateNativeProvider']!=P['registry'][BODY],'wrong runtime provider fingerprint')
    dump(w/'out'/'AUTHORITY.json',{'status':'EXACT_HISTORICAL_3032_SINGLE_LOCAL_PACKET_PATCH','scope':'no deploy; C is experiment, stale original content-address path local only','base':B,'baseTree':stage['tree'],'pagesRun':stage['run'],'pagesJob':stage['job'],'deployedAt':p['deployedAt'],'file':F,'stock':p['payload'],'c2':fact(candidate),'owners':{'B':P['registry'][BODY],'C':nativeSig(candidate)},'signedMobile':P['signedMobile'],'gameplayAndSourceFilesWritten':False})

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,stock,candidate,allowed,**kw):
        self.candidate=candidate;self.allowed=allowed
        super().__init__(*args,directory=str(stock),**kw)
    def send_head(self):
        u=urlsplit(self.path)
        if u.scheme or u.netloc or u.query or u.fragment or not u.path.startswith('/') or u.path[1:] not in self.allowed:
            self.send_error(404);return None
        if self.candidate is not None and u.path=='/'+F:
            self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(self.candidate)));self.send_header('Cache-Control','no-store');self.end_headers()
            return io.BytesIO(self.candidate)
        return super().send_head()
    def log_message(self,*_):pass

OWN=r"""(q)=>{const app=HonroApp,b=app.engine?.b,p=HONRO_PROJECT;
 if(!b||b.mode!=='campaign'||b.honroStage!==40||b.honroCanonical!==true||b.honroCustom!==false||b.honroMapOrigin!=='campaign'||b.honroAct4Official!==1||app.profileStore.locked)throw Error('not a loaded actual native campaign');
 const groups=[b.honroLandmarks,b.honroElements,b.honroEnvironment?.placements],sig=(a)=>{const s=JSON.stringify(a);let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return s.length+':'+(h>>>0).toString(16);};
 const rows={};
 for(const [id,v]of Object.entries(q.signatures)){
  const reg=p.library.filter(o=>o.id===id),els=groups.flatMap(a=>(a||[]).filter(o=>o.asset?.id===id));
  if(reg.length!==1||sig(reg[0])!==v||!els.length||els.some(o=>sig(o.asset)!==v))throw Error('native owner '+id);
  rows[id]={count:els.length,signature:v};
 }
 const matches=(b.honroLandmarks||[]).filter(o=>o.id==='approved40-body'&&o.asset?.id==='approved40:body');
 if(matches.length!==1)throw Error('not exact canonical body placement');
 const l=matches[0];
 if(l.x!==0||l.y!==0||l.scale!==1||(l.rotation??0)!==0)throw Error('body placement moved');
 if(!q.layer)return {rows};
 const c=document.createElement('canvas');c.width=q.meta.backing[0];c.height=q.meta.backing[1];const ctx=c.getContext('2d');
 const s=q.meta.actual.scale,v=q.meta.viewport;
 ctx.setTransform(s,0,0,s,-s*v.left,-s*v.top);ctx.honroVisualLayer='gameplay';
 if(HonroVectorArt.draw(ctx,l.asset,l)!==true)throw Error('native body isolated draw failed');
 return {rows,raw:c.toDataURL('image/png').split(',')[1]};
}"""
def verify_required_responses(res,origin,needed):
    actual={}
    for path,v in needed.items():
        r=res.get(origin+path);need(r and r.status==200 and not r.from_service_worker and fact(r.body())==v,'wrong native HTTP route '+path)
        actual[path]=v
    return actual
def verify_observed_snapshot(res,origin,active,except_path):
    # response.body() yields into the async Playwright event machinery. The live
    # dict may receive a new response mid-call. Freeze the observation epoch.
    obs=tuple(res.items());verified={}
    for url,r in obs:
        path=url[len(origin):] if url.startswith(origin) else ''
        if path in active and path!=except_path and r.status==200:
            need(not r.from_service_worker and fact(r.body())==active[path],'unbound observed current payload '+path)
            verified[path]=active[path]
    return {'responsesInSnapshot':len(obs),'verifiedInSnapshot':len(verified),'responsesAfterVerification':len(res)}
def native(w):
    need(not (os.getenv('GH_TOKEN') or os.getenv('GITHUB_TOKEN')),'credential in anonymous capture')
    from PIL import Image
    from playwright.sync_api import sync_playwright
    o=w/'out';stock=w/'stock';candidate=(w/'candidate.json').read_bytes();auth=json.loads((o/'AUTHORITY.json').read_bytes())
    need(candidate==patch(read(stock,F)) and auth['base']==B and auth['owners']=={'B':P['registry'][BODY],'C':P['candidateNativeProvider']},'wrong detached preflight results')
    ok=set(git(stock,'ls-files').splitlines());need(F in ok,'stock asset untracked')
    active={x['path']:{k:x[k] for k in ('bytes','sha256')} for x in json.loads(read(stock,'web/manifest.json'))['files']}
    allowed={k for k in ok if k in active or k in ('HONRO.html','web/manifest.json','index.html','favicon.ico')};need({F,'HONRO.html'}<=allowed,'missing closure')
    status={'status':'HOLD','kind':'Historical exact 3032 native app B; C substitutes only exact local packet, not live or deployable','cases':{}}
    def flush():dump(o/'BROWSER.json',status)
    flush()
    def decode(png):return Image.open(io.BytesIO(png)).convert('RGBA')
    def compare(bb,cc,rect):
        b,c=map(decode,(bb,cc));need(b.size==c.size,'PNG pair size drift');W,H=b.size
        raw=b.tobytes();delta=c.tobytes();z={'width':W,'height':H,'signed':rect,'changed':0,'outsideRGBA':0,'outsideAlpha':0,'alphaChanged':0,'mossGroundChanged':0,'protectedWarmByStock':0,'absoluteSceneOutsideSHA':{},'examples':{'outside':[],'alpha':[],'mossGround':[]}}
        aout=bytearray();bout=bytearray()
        # Region boundaries and protected classification are fixed before C rendering:
        # all stock warm (yellow-brown / moss) are protected, including AA edges via
        # a local 3x3 neighborhood. Position ROI is exact archived registration.
        def warm(t):
            r,g,b,a=raw[4*t:4*t+4]
            return a>=240 and r>b+4 and g>b+4
        for i in range(W*H):
            px=i%W;py=i//W;ox=not(rect[0]<=px+.5<rect[2] and rect[1]<=py+.5<rect[3])
            x=raw[4*i:4*i+4];y=delta[4*i:4*i+4]
            if ox:aout+=x;bout+=y
            else:
                protect=any(warm(v*W+u) for v in range(max(0,py-1),min(H,py+2))for u in range(max(0,px-1),min(W,px+2)))
                z['protectedWarmByStock']+=int(protect)
            if x==y:continue
            z['changed']+=1;z['alphaChanged']+=int(x[3]!=y[3]);z['outsideAlpha']+=int(ox and x[3]!=y[3]);z['outsideRGBA']+=int(ox)
            rec={'xy':[px,py],'b':list(x),'c':list(y)}
            if ox and len(z['examples']['outside'])<6:z['examples']['outside'].append(rec)
            if x[3]!=y[3] and len(z['examples']['alpha'])<6:z['examples']['alpha'].append(rec)
            if not ox and protect:
                z['mossGroundChanged']+=1
                if len(z['examples']['mossGround'])<6:z['examples']['mossGround'].append(rec)
        z['absoluteSceneOutsideSHA']={'B':sha(aout),'C':sha(bout)}
        return z
    try:
        with sync_playwright() as pw,ExitStack() as es:
            urls={}
            for k,q in [('B',None),('C',candidate)]:
                h=partial(Handler,stock=stock,candidate=q,allowed=allowed)
                srv=es.enter_context(ThreadingHTTPServer(('127.0.0.1',0),h));srv.daemon_threads=True
                threading.Thread(target=srv.serve_forever,daemon=True).start();es.callback(srv.shutdown)
                urls[k]=f"http://127.0.0.1:{srv.server_port}/"
            browser=pw.chromium.launch(headless=True);es.callback(browser.close)
            status['browser']=browser.version;need(browser.version==P['chromium'],'wrong Chromium')
            for who,wh in [('PC',[1440,900]),('M',[390,844])]:
                row={};status['cases'][who]=row; shots={}
                for k in ['B','C']:
                    url=urls[k];cp=row[k]={'checkpoint':'create_context','pictures':{},'pageErrors':[]};flush()
                    errors=[];res={};c=None
                    def at(step):cp['checkpoint']=step;flush()
                    try:
                        c=browser.new_context(viewport={'width':wh[0],'height':wh[1]},device_scale_factor=1,service_workers='block')
                        need(c.storage_state()=={'cookies':[],'origins':[]},'not fresh anonymous context')
                        c.route('**/*',lambda r:r.continue_() if r.request.url.startswith((url,'about:','data:','blob:')) else r.abort())
                        p=c.new_page();p.on('response',lambda r:res.setdefault(r.url,r));p.on('pageerror',lambda e:errors.append(str(e)));at('goto_exact_shell')
                        p.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
                        nav=p.goto(url+'HONRO.html',wait_until='domcontentloaded',timeout=60000)
                        need(nav and nav.status==200 and nav.url==url+'HONRO.html' and not nav.from_service_worker and fact(nav.body())==P['proof']['shell'],'wrong live browser shell')
                        at('wait_boot_lifecycle');p.wait_for_function("()=> document.documentElement.dataset.honroReady==='true'&&typeof globalThis.HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
                        p.evaluate("()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}")
                        at('launch_canonical_stage40');p.evaluate(O['LAUNCH'],40);p.wait_for_function("()=>globalThis.HonroApp?.engine?.b?.honroStage===40&&!HonroApp.profileStore.locked",timeout=45000)
                        arg=dict(id=40,mapId='stage-40',name='ordinary',dx=-1,dy=1,ordinary=[4500,2200,.35],readback=False,fixedNow=O['PHASE'])
                        at('park_east_and_decode');p.evaluate("()=>document.fonts.ready.then(()=>true)")
                        m=p.evaluate(O['FROZEN'],arg)['meta'];d=p.evaluate(O['DECODE'])
                        need(isinstance(d,dict) and not d.get('failed',[]),'required image decode failed')
                        m=p.evaluate(O['FROZEN'],{**arg,'readback':True})['meta'];m['physics']=sha(m.pop('signature').encode())
                        shots[k]={'raw':base64.b64decode(p.evaluate(O['CANVAS']),validate=True),'dom':p.locator('#battlecanvas').screenshot(timeout=20000)}
                        cp['pose']=m
                        def write_shot(name,png):
                            fn=f"{who}-{k}-{name.upper()}.png";(o/fn).write_bytes(png);cp['pictures'][name]={'file':fn,**fact(png)}
                        for name,png in shots[k].items():write_shot(name,png)
                        if k=='B':
                            cp['stockRawMatchesHistoricalC4']=fact(shots[k]['raw'])==P['historicalC4Pixels'][who]
                        at('capture_isolated_native_body')
                        refs=dict(P['registry']);refs[BODY]=auth['owners'][k]
                        diag=p.evaluate(OWN,{'layer':True,'meta':m,'signatures':refs});shots[k]['body']=base64.b64decode(diag.pop('raw'),validate=True)
                        cp['providers']=diag['rows'];write_shot('body',shots[k]['body'])
                        at('verify_required_http')
                        needed={**P['proof']['files'],F:auth['stock' if k=='B' else 'c2']}
                        cp['verifiedRequiredRoutes']=verify_required_responses(res,url,needed)
                        at('verify_observed_http_snapshot')
                        cp['observedHTTP']=verify_observed_snapshot(res,url,active,F)
                        cp['pageErrors']=errors;flush()
                        need(not errors,'actual runtime error '+k)
                        need(m==P['poses'][who],'native historical camera/physics changed '+k)
                        at('complete')
                    except BaseException as e:
                        cp['firstError']=repr(e)
                        cp['pageErrors']=errors
                        cp['sameOriginHTTPStatusAtError']={u[len(url):]:rr.status for u,rr in tuple(res.items()) if u.startswith(url)}
                        flush()
                        raise
                    finally:
                        if c is not None:
                            try:c.close()
                            except BaseException as e:
                                cp['cleanupError']=repr(e);flush()
                                if 'firstError' not in cp:raise
                need(row['B']['pose']==row['C']['pose'] and {a:v['count']for a,v in row['B']['providers'].items()}=={a:v['count']for a,v in row['C']['providers'].items()},'native geometry or owner count changed')
                m0=P['poses']['M'];p0=P['poses'][who];s=p0['actual']['scale']
                dx=(m0['viewport']['left']-p0['viewport']['left'])*s;dy=(m0['viewport']['top']-p0['viewport']['top'])*s
                rect=[v+(dx if i%2==0 else dy) for i,v in enumerate(P['signedMobile'])]
                row['comparison']={n:compare(shots['B'][n],shots['C'][n],rect) for n in ('raw','dom','body')};flush()
            need(not git(stock,'status','--porcelain') and fact(read(stock,F))==auth['stock'],'detached stock was modified')
            hits=[q['comparison'][n] for q in status['cases'].values() for n in ('raw','dom')]
            status['gameProtectionExact']=all(x['changed'] and not (x['outsideRGBA'] or x['alphaChanged'] or x['mossGroundChanged']) for x in hits)
            status['bodyBoundaryExact']=all(q['comparison']['body']['changed'] and not q['comparison']['body']['outsideRGBA'] for q in status['cases'].values())
            status['historicalStockRawExact']=all(q['B']['stockRawMatchesHistoricalC4'] for q in status['cases'].values())
            status['status']='PASS_FINAL_CAPTURE_PROTECTION_VISUAL_REVIEW_REQUIRED' if status['gameProtectionExact'] and status['bodyBoundaryExact'] and status['historicalStockRawExact'] else 'HOLD_FINAL_CAPTURE_PROTECTION'

            status['bodyAlphaIsDiagnostic']=True
            flush()
            need(status['status'].startswith('PASS_'),'experimental C did not pass final terrain protection')
    except BaseException as e:status['firstError']=repr(e);flush();raise

if __name__=='__main__':
    need(P['enabled'] is True and os.getenv('GITHUB_REPOSITORY')=='sys8994/honro' and os.getenv('GITHUB_REF')=='refs/heads/'+P['branch'] and sha(OB)==P['observerSHA256'],'disabled: exact no-deploy QA ref only')
    op=sys.argv[1];w=Path(sys.argv[2]).resolve(strict=True)
    if op=='pre':pre(w)
    elif op=='native':native(w)
    else:raise ValueError(op)
