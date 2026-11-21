"""Read-only anonymous Stage35 release replay. Never manufactures or serves any response."""
import base64,datetime,hashlib,io,json,math,os,re,statistics,subprocess,sys,time
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler,Request,build_opener
H=Path(__file__).resolve().parent
P=json.loads((H/'PINS.json').read_bytes())
ENTRY=json.loads((H/'entry.json').read_bytes())
OUT=Path(sys.argv[2])
R=P['release']; OLD=P['prior']; G=P['graph']; N=P['normalAuthority']
BASE='https://sys8994.github.io/honro/'
url=urlsplit(BASE); BLOB_BASE=f'blob:{url.scheme}://{url.netloc}/'
TOP='sys8994/honro'; REF='refs/heads/qa/stage35-blue-public-readback'
SHELL={'HONRO.html','index.html','HONRO_WORKSHOP.html'}; MF='web/manifest.json'; HTML='HONRO.html'
FILES={'.github/workflows/stage35-blue-public-readback.yml',*(f'tools/stage35-blue-public-readback/{k}' for k in ('PINS.json','entry.json','proof.py'))}
proof={'status':'INIT','frames':{},'scope':'Tokenless normal public App; no response substitution, build or deploy; static diagnostic camera only.'}
def sha(d):return hashlib.sha256(d).hexdigest()
def facts(d):return {'bytes':len(d),'sha256':sha(d)}
def blob(d):return hashlib.sha1(f'blob {len(d)}\0'.encode()+d).hexdigest()
def g(*args):return subprocess.check_output(['git',*args])
def show(c,p):return g('show',c+':'+p)
def write(k,v):(OUT/k).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def save():write('BROWSER.json',proof)
def hx(v,n):return type(v)is str and len(v)==n and set(v)!={'0'} and re.fullmatch('[a-f0-9]+',v)
def pos(v):return type(v)is int and v>0
def want(row):return {k:row[k] for k in ('bytes','sha256')}
def inventory(m,n):
 a={row['path']:want(row) for row in m['files']}
 assert len(a)==len(m['files'])==n
 return a
def distinct(b):
 def obj(seq):
  v=dict(seq)
  assert len(v)==len(seq),'duplicate JSON members'
  return v
 return json.loads(b,object_pairs_hook=obj)
def require_release():
 t=R['retention']
 assert R['enabled'] is True and all(hx(i,40) for i in (R['commit'],R['tree'],R['manifest']['git'],t['head'])) \
  and all(hx(i,64) for i in (R['manifest']['sha256'],t['outerSHA256'],t['receiptSHA256'],t['retainedPreviousGraphSHA256'])) \
  and all(pos(v) for v in (R['manifest']['bytes'],R['pagesRun'],R['pagesJob'],t['run'],t['job'],t['artifact'],t['outerBytes'])), 'DISABLED: require exact retained and successful Pages authority pins'
 assert R['manifest']['bytes']<=12<<20 and R['manifest']['sha256'] not in (OLD['manifestSHA256'],G['generated'][MF]['sha256']),'wrong manifest authority (old/unretained)'
 assert datetime.datetime.fromisoformat(R['publishedAt']).tzinfo is not None
 assert os.environ['GITHUB_REPOSITORY']==TOP and os.environ['GITHUB_EVENT_NAME']=='push' and os.environ['GITHUB_REF']==REF
def established():
 require_release()
 live=R['commit'];head=os.environ['GITHUB_SHA'];prior=OLD['commit']
 assert g('rev-list','--parents','-n1','HEAD').decode().split()==[head,live]
 assert g('rev-list','--parents','-n1',live).decode().split()==[live,prior]
 assert g('rev-parse',live+'^{tree}').decode().strip()==R['tree']
 assert g('status','--porcelain=v1','-z')==b''
 assert set(g('diff','--name-status','--no-renames',live,head).decode().splitlines())=={'A\t'+k for k in FILES}
 assert len(P['sourceFiles'])==13 and len(G['generated'])==18
 assert set(g('diff','--name-status','--no-renames',prior,live).decode().splitlines())==(
   {('M' if k in P['modifiedSourceFiles'] else 'A')+'\t'+k for k in P['sourceFiles']}|
   {('M' if k in SHELL|{MF} else 'A')+'\t'+k for k in G['generated']})
 raw=show(live,MF);old=show(prior,MF)
 assert facts(raw)==want(R['manifest']) and blob(raw)==R['manifest']['git']
 assert sha(old)==OLD['manifestSHA256'] and blob(old)==OLD['manifestGitBlob']
 m=distinct(raw);prev=distinct(old)
 assert inventory(m,810)==G['active']
 assert {k:m[k] for k in G['roles']}==G['roles']
 p=inventory(prev,809)
 common=G['active'].keys()&p.keys()
 assert all(G['active'][k]==p[k] for k in common) and p.keys()-G['active'].keys()==OLD['resources'].keys()-G['active'].keys()
 hist=[x for x in m['publishedGenerations'] if x['sourceSha']==prior]
 assert len(hist)==1 and hist[0]['files']==prev['files'] and hist[0]['publishedAt']==OLD['publishedAt']
 assert hist[0]['publishedAtPrecision']=='instant' and hist[0]['evidence']==f"https://github.com/{TOP}/actions/runs/{OLD['pagesRun']}"
 assert hist[0]['graphSha256']==R['retention']['retainedPreviousGraphSHA256']
 assert all(blob(show(live,k))==v for k,v in P['sourceFiles'].items())
 assert all(facts(show(live,k))==v for k,v in G['generated'].items() if k!=MF)
 assert all(k in p and facts(show(live,k))==facts(show(prior,k))==v==p[k] for k,v in OLD['resources'].items())
 return {**G['active'],**{k:G['generated'][k]for k in SHELL},MF:want(R['manifest'])}
def api(path):
 return distinct(subprocess.check_output(['gh','api',f'repos/{TOP}/'+path],timeout=30))
def authority():
 established()
 live=R['commit'];t=R['retention']
 assert api('git/ref/heads/master')['object']['sha']==live,'master advanced; do not attribute a stale deployment'
 run=api(f"actions/runs/{R['pagesRun']}"); job=api(f"actions/jobs/{R['pagesJob']}")
 assert run['id']==R['pagesRun'] and run['head_sha']==live and run['head_branch']=='master'
 assert run['repository']['full_name']==run['head_repository']['full_name']==TOP and run['name']=='pages build and deployment'
 assert (run['status'],run['conclusion'])==('completed','success')
 assert job['id']==R['pagesJob'] and job['run_id']==R['pagesRun'] and job['name']=='deploy'
 assert (job['status'],job['conclusion'])==('completed','success')
 deploy=[s for s in job['steps'] if s['name']=='Deploy to GitHub Pages']
 assert len(deploy)==1 and deploy[0]['conclusion']=='success'
 instant=datetime.datetime.fromisoformat(R['publishedAt'])
 start=datetime.datetime.fromisoformat(deploy[0]['started_at']);end=datetime.datetime.fromisoformat(job['completed_at'])
 assert start<=instant<=end+datetime.timedelta(seconds=1),'publication instant not from exact Pages deployment window'
 ret=api(f"actions/runs/{t['run']}");rj=api(f"actions/jobs/{t['job']}")
 assert ret['id']==t['run'] and ret['head_sha']==t['head'] and ret['head_branch']=='qa/stage35-blue-forest-retention-71fb'
 assert ret['path']=='.github/workflows/stage35-blue-forest-retention.yml'
 assert ret['repository']['full_name']==ret['head_repository']['full_name']==TOP
 assert (ret['status'],ret['conclusion'],ret['event'])==('completed','success','push')
 assert (rj['id'],rj['run_id'],rj['name'],rj['status'],rj['conclusion'])==(t['job'],t['run'],'seal','completed','success')
 found=[a for a in api(f"actions/runs/{t['run']}/artifacts")['artifacts'] if a['id']==t['artifact']]
 assert len(found)==1
 a=found[0]; assert a['name']=='honro-stage35-blue-forest-retained-source-and-generated-no-deploy'
 assert a['size_in_bytes']==t['outerBytes'] and a['digest']=='sha256:'+t['outerSHA256'] and not a['expired']
 assert a['workflow_run']['id']==t['run'] and a['workflow_run']['head_sha']==t['head']
 write('PAGES-AUTHORITY.json',{'result':'success','pinnedRelease':R,'normalBaseline':N,
  'retainedArtifactMetadataExact':True,'retainedReceiptSHA256FromParentSignedPins':t['receiptSHA256'],
  'onlyThisExactReleaseOnMasterAtAuthorityTime':True})
class NoRedirect(HTTPRedirectHandler):
 def redirect_request(self,*a,**k):raise RuntimeError('public canonical response redirected')
def http(path,limit):
 url=BASE+path
 r=Request(url,headers={'Accept-Encoding':'identity','Cache-Control':'no-cache'})
 with build_opener(NoRedirect).open(r,timeout=25) as y:
  assert y.status==200 and y.geturl()==url
  d=y.read(limit+1);assert len(d)<=limit,('served public byte limit exceeded',path)
  return d
def anonymous():
 assert not(os.environ.get('GH_TOKEN') or os.environ.get('GITHUB_TOKEN'))
 pins=established()
 cert=distinct((OUT/'PAGES-AUTHORITY.json').read_bytes())
 assert cert['pinnedRelease']==R and cert['result']=='success'
 raw=http(MF,12<<20);manifest=facts(raw)
 if manifest!=pins[MF]:
  old=sha(raw)==OLD['manifestSHA256']
  proof.update(status='HOLD_PRIOR_MANIFEST_STILL_SERVED' if old else 'HOLD_UNRECOGNIZED_PUBLIC_MANIFEST',
     manifest=manifest,wanted=pins[MF],priorExact=old)
  write('HTTP-PUBLIC.json',{'manifestGuard':proof['status'],'seen':manifest,'wanted':pins[MF],
    'note':'Stop before loading browser. No query, fallback replay or injected response.'})
  raise RuntimeError(proof['status'])
 names={*SHELL,*G['mustObserve'],*G['generated'],*OLD['resources']}-{MF}
 expect={**pins,**OLD['resources']};seen={MF:manifest}; data={}
 for k in sorted(names):
  b=http(k,expect[k]['bytes']);seen[k]=facts(b)
  assert seen[k]==expect[k],('wrong canonical stable public bytes',k,seen[k],expect[k])
  if k in {G['roles']['project'],G['descriptor'],*G['parts'], OLD['project'],OLD['descriptor'],*OLD['parts']}: data[k]=b
 home=facts(http('',pins['index.html']['bytes']))
 assert home==pins['index.html'];seen['root/']=home
 sides=[]
 for project,map_,desc,parts in [(G['roles']['project'],G['map'],G['descriptor'],G['parts']),
                                  (OLD['project'],OLD['map'],OLD['descriptor'],OLD['parts'])]:
  c=distinct(data[project]);d=distinct(data[desc])
  assert len(c['stages'])==len(c['stageLibraries'])==50 and c['stages'][34]==map_ and c['stageLibraries'][34]==desc
  assert d['$honroJsonParts']==1 and [x['path'] for x in d['parts']]==parts
  joined=b''.join(data[k]for k in parts)
  assert facts(joined)==want(d) and all(facts(data[q['path']])==want(q)for q in d['parts'])
  sides.append({'project':project,'map':map_,'descriptor':desc,'concatenated':facts(joined),'parts':parts})
 assert sides[0]['descriptor']!=sides[1]['descriptor'] and sides[0]['concatenated']!=sides[1]['concatenated']
 write('HTTP-PUBLIC.json',{'manifestGuard':'EXACT_CURRENT_RETAINED','currentAndOldStableResources':seen,'stage35BothClosures':sides})
 return pins
def rel(u):return u[len(BASE):] if u.startswith(BASE) and '?' not in u and '#' not in u else None
def decode(b):return Image.open(io.BytesIO(b)).convert('RGBA')
def read_png(p,z):
 b=base64.b64decode(p.evaluate(z),validate=True);return b,decode(b)
CANVAS="()=>HonroApp.scene.canvas.toDataURL('image/png').split(',')[1]"
DECODE="""async ()=>{
 const chosen=[...new Set([...window.__honroObserver.images,...document.images])].filter(i=>i.currentSrc||i.src);
 const tasks=Promise.allSettled(chosen.map(i=>i.decode()));
 const [images]=await Promise.race([Promise.all([tasks,document.fonts.ready]),new Promise((_,rej)=>setTimeout(()=>rej(Error('image/font decode deadline')),30000))]);
 const bad=[],ready=[];
 for(let i=0;i<chosen.length;i++){
  const x=chosen[i],url=x.currentSrc||x.src,kind=url.startsWith('data:')?'inline':url.startsWith('blob:')?'browser-blob':'immutable-HTTP';
  const item={kind,url:kind==='immutable-HTTP'?url:kind,w:x.naturalWidth,h:x.naturalHeight,inDOM:x.isConnected};
  if(images[i].status!=='fulfilled'||!x.complete||!x.naturalWidth||!x.naturalHeight)bad.push({...item,reason:images[i].reason?.message??null});
  else ready.push(item);
 }
 return{registered:chosen.length,fontStatus:document.fonts.status,ready,failed:bad};
}"""
PEER="""async q=>{
 const app=HonroApp,b=app.engine.b,s=app.scene,st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===35);
 if(st.design.nativeArt.far!==q.key||b.honroMap?.nativeArt?.far!==q.key)throw Error('wrong compiled Stage35 far selection');
 const f=HonroAuthoredFarArt.frames(s,q.css.w,q.css.h,b);
 if(f.length!==1||f[0].key!==q.key||f[0].alpha!==1||!f[0].frame||s.environmentStats?.authoredFar?.[0]!==q.key)throw Error('normal native active far not ready');
 const src=[...window.__honroObserver.images].findLast(i=>(i.currentSrc||i.src)===q.far&&i.complete&&i.naturalWidth);
 if(src?.naturalWidth!==q.dim[0]||src?.naturalHeight!==q.dim[1])throw Error('wrong actual far resource decode dimensions');
 const mat=HonroTerrainDomain.materialLandmarks(b), ids=st.elements.map(v=>v.id);
 if(JSON.stringify(ids)!==JSON.stringify(q.ids))throw Error('wrong normal material instance order');
 const sig=async a=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(a)))),n=>n.toString(16).padStart(2,'0')).join('');
 const shapes={},actualAssets={};
 for(const p of st.elements){
  const a=HONRO_PROJECT.library.filter(x=>x.id===p.assetId),land=mat.filter(l=>l.id===p.id);
  if(a.length!==1||land.length!==1||land[0].asset?.id!==a[0].id||land[0].kind!=='canonical-element'||
     JSON.stringify(land[0].asset.vector)!==JSON.stringify(a[0].vector))
   throw Error('unregistered actual authored owner '+p.id);
  actualAssets[p.assetId]=await sig(a[0]); shapes[p.id]={placement:p,a:a[0]};
 }
 const c=document.createElement('canvas');[c.width,c.height]=q.backing;const g=c.getContext('2d'),z=f[0].frame;
 g.drawImage(src,z.x,z.y,z.w,z.h);
 const farPng=c.toDataURL('image/png').split(',')[1];
 const oldBody=shapes['approved35-body'],scl=q.actual.scale;
 const draw=({a,placement})=>HonroVectorArt.draw(g,a,placement);
 function fresh(){g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,c.width,c.height);g.setTransform(scl,0,0,scl,-q.viewport.left*scl,-q.viewport.top*scl);}
 fresh();if(!draw(oldBody))throw Error('actual named BODY draw failed');
 const actualBody=g.getImageData(0,0,c.width,c.height).data;
 const alpha=Uint8Array.from({length:c.width*c.height},(_,i)=>actualBody[i*4+3]);
 const bytesHash=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),n=>n.toString(16).padStart(2,'0')).join('');
 const bodySHA256=await bytesHash(actualBody),bodyAlpha=await bytesHash(alpha);
 const sides={};
 for(const [k,v] of Object.entries(shapes)){
  if(!k.startsWith('act4-handoff:35:bamboo-thicket-'))continue;
  fresh();if(!draw(v))throw Error('native side vector draw failed '+k);
  let outer=0,inside=0;const pixels=g.getImageData(0,0,c.width,c.height).data;
  for(let x=0;x<c.width;x++){
   const world=q.viewport.left+(x+.5)/scl;for(let y=0;y<c.height;y++)if(pixels[4*(y*c.width+x)+3]){
     if(world>=0&&world<=4608)inside++;else outer++;
   }
  }
  sides[k]={outside:outer,inside};
 }
 return{farKey:q.key,nativeFrame:z,natural:q.dim,activeOwnerOrder:ids,actualAssets,bodyRGBA:bodySHA256,bodyAlpha:bodyAlpha,sideAlpha:sides,farPng};
}"""
def framing(f,iw,ih):
 w,h=f['css']['w'],f['css']['h'];x,y=f['actual']['x'],f['actual']['y']
 mx,my=w*.022,h*.007;s=max((w+2*mx)/iw,(h+2*my)/ih);dw,dh=iw*s,ih*s
 ox=-mx*math.tanh((x-2304)*.025/mx);oy=-my*math.tanh((y-1536)*.0035/my)
 X=-mx-(dw-w-2*mx)*(.98 if w/h>=.9 else .5)+ox;Y=-my-(dh-h-2*my)*.28+oy
 return dict(x=X,y=Y,w=dw,h=dh,offsetX=ox,offsetY=oy),[-X/s,-Y/s,(w-X)/s,(h-Y)/s]
def far_luma(img):
 q={}
 for n,i in [('top',0),('middle',1),('bottom',2)]:
  h=img.height;s=img.crop((0,round(h*i/3),img.width,round(h*(i+1)/3))).convert('L')
  q[n]={'median':statistics.median(s.getdata()),'mean':round(statistics.mean(s.getdata()),2)}
 return q

def capture(browser,evidence,wh,shots):
    graph=G; expected=graph["mustObserve"]; mode="B"
    w,h=wh;ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
    assert ctx.storage_state()=={'cookies':[],'origins':[]}
    page=ctx.new_page();page.set_default_timeout(25000)
    errors=[];hits=[];blobs=[];media=[];pending=set()
    def route(r):
        q=r.request; k=rel(q.url)
        if (q.method=='GET' and (k in evidence or k in P['media'] and q.resource_type=='media')) or q.url.startswith((BLOB_BASE,'data:')):
            return r.continue_()
        errors.append(['unexpected request',q.url]);return r.abort()
    def response(res):
        k=rel(res.url);q=res.request
        if res.url.startswith(BLOB_BASE) and res.status==200:blobs.append(res.url)
        elif k in P['media'] and q.resource_type=='media' and res.status in (200,206):media.append(k)
        elif k in evidence and res.status==200 and q.method=='GET':hits.append((k,res))
        else: errors.append(['unexpected response',res.url,res.status])
    def abnormal(q):
        if not (rel(q.url) in P['media'] and q.resource_type=='media' and q.failure=='net::ERR_ABORTED'):
            errors.append(['unexpected request failure',q.url,q.failure])
    ctx.route('**/*',route)
    page.on('request',lambda q:pending.add(q) if rel(q.url) in evidence else None)
    page.on('requestfinished',lambda q:pending.discard(q))
    page.on('requestfailed',lambda q:pending.discard(q))
    page.on('requestfailed',abnormal);page.on('response',response)
    page.on('pageerror',lambda e:errors.append(['pageerror',str(e)]))
    page.add_init_script('('+ENTRY['INIT']+')()')
    rows={}
    try:
        shell=page.goto(BASE+HTML,wait_until='domcontentloaded')
        assert shell and shell.url==BASE+HTML and shell.status==200 and facts(shell.body())==evidence[HTML]
        page.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof window.HonroCampaignLoader?.ensureStage==='function'")
        page.evaluate(ENTRY['LAUNCH'],35); canvas=page.locator('#battlecanvas');canvas.wait_for(state='visible')
        page.wait_for_function("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue);}",timeout=12000)
        page.evaluate("()=>HonroApp.scene.render(HonroApp.engine,0,'',.6,false,0)")
        for f in shots:

            k=f['key'];view=f['view']
            q={'id':35,'mapId':'stage-35','name':'ordinary' if view in ('start','exit') else view,
              'dx':1 if 'east' in view else -1 if 'west' in view else 0,
              'dy':1 if 'south' in view else -1 if 'north' in view else 0,
              'ordinary':f['anchor'],'readback':False}
            staged={'k':k,'AorB':mode}
            proof['activeProbe']=staged.copy();save()
            g=page.evaluate(ENTRY['PARK'],q)
            dd=page.evaluate(DECODE)
            staged['imageDecode']=dd
            proof['activeProbe']=staged.copy();save()
            assert not dd['failed'] and dd['fontStatus']=='loaded',('real image/font decode failure',k,mode,dd['failed'],dd['fontStatus'])
            assert g==page.evaluate(ENTRY['PARK'],{**q,'readback':True})
            assert sha(g['signature'].encode())==f['physicsSHA256'] and all(f[n]==g[n] for n in (
              'actual','viewport','css','backing','focus','actorCount','tide','sceneTime','phase','round')),('play/state/camera drift',k,mode)
            rb,raw=read_png(page,CANVAS);db=canvas.screenshot(animations='disabled');dom=decode(db)
            assert list(raw.size)==f['backing'] and list(dom.size)==f['pixels']
            domH=sha(dom.tobytes());rawH=sha(raw.tobytes())
            for name,value in [('raw',rb),('dom',db)]: (OUT/f'{k}-{mode}-{name}.png').write_bytes(value)
            far=P['far']['old' if mode=='A' else 'new'];side=list(P['sides']) if mode=='B' else []
            ids=['approved35-forest-foundation','approved35-near-geology','approved35-body',
                 'act4-handoff:35:bedrock','act4-handoff:35:bamboo','act4-handoff:35:walls']
            target_url=BASE+graph['farFile']
            far_decodes=[i for i in dd['ready'] if i['url']==target_url]
            assert far_decodes and all([x['w'],x['h']]==far['size'] for x in far_decodes),('not decoded exact signed native FAR URL',k,mode,far_decodes)
            peer=page.evaluate(PEER,{'backing':g['backing'],'viewport':g['viewport'],'actual':g['actual'],
                       'css':g['css'],'far':target_url,'key':far['key'],'dim':far['size'],'ids':side+ids})
            assert all(graph['stageAssets'][p]==hash for p,hash in peer['actualAssets'].items()) and len(peer['actualAssets'])==len(side+ids)
            assert set(peer['sideAlpha'])==set(side) and all(v['inside']==0 for v in peer['sideAlpha'].values()),('side visual leaked into play',k,mode)
            if mode=='B':
                for direction in ('west','east'):
                    if direction in view and view==direction:
                        assert peer['sideAlpha']['act4-handoff:35:bamboo-thicket-'+direction]['outside']>0,'signed near side canopy not visible in target view'
            op,crop=framing(g,*far['size'])
            assert all(abs(peer['nativeFrame'][j]-v)<1e-6 for j,v in op.items())
            rgba=decode(base64.b64decode(peer.pop('farPng'),validate=True))
            assert rgba.getchannel('A').getextrema()==(255,255),('background crop leaves transparent screen area',k,mode)
            rows[k]={'rawRGBA':rawH,'domRGBA':domH,'rawPNG':sha(rb),'domPNG':sha(db),
                     'rawAlpha':sha(raw.getchannel('A').tobytes()),'domAlpha':sha(dom.getchannel('A').tobytes()),
                     'registeredVisibleFarImage':graph['farFile'],'registeredDecodedOnlyInformational':dd['registered'],
                     'nativeFarLuma':far_luma(rgba),'crop':crop,'normalizedLegacyPhysicalSHA256':f['physicsSHA256'],**peer}
            rows[k]['camera']={n:g[n] for n in ('actual','viewport','css','backing','focus','actorCount','phase','round','sceneTime')}
            equal=('rawRGBA','domRGBA','rawAlpha','domAlpha','bodyRGBA','bodyAlpha','actualAssets','registeredVisibleFarImage','farKey','natural','activeOwnerOrder','sideAlpha','normalizedLegacyPhysicalSHA256')
            ref=f['reference']; comparison={n:rows[k][n]==ref[n] for n in equal}
            relation=('nativeFrame','crop'); comparison.update({n:(all(abs(rows[k][n][j]-ref[n][j])<=1e-6 for j in ref[n]) if isinstance(ref[n],dict)
               else len(rows[k][n])==len(ref[n]) and all(abs(a-b)<=1e-6 for a,b in zip(rows[k][n],ref[n]))) for n in relation})
            comparison['farLuma']=rows[k]['nativeFarLuma']==ref['nativeFarLuma']
            if 'seamWitness' in f:
                sw=f['seamWitness']; seam=raw.crop(sw['rawPixelLTRB'])
                seam.save(OUT/f'{k}-visible-seam.png')
                rows[k]['seamWitness']={**sw,'actualRGBA':sha(seam.tobytes())}
                comparison['visibleSeamRGBA']=rows[k]['seamWitness']['actualRGBA']==sw['RGBA']
            rows[k]['candidateReplayComparison']=comparison
            rows[k]['referenceArchivePNG']={n:ref[n] for n in ('rawPNG','domPNG')}
            rows[k]['observer']='fresh anonymous normal public Pages, no payload override'
            proof['frames'][k]=rows[k]
            save()
        seen={};i=quiet=0;deadline=time.monotonic()+12
        while time.monotonic()<deadline:
            assert not errors,errors
            while i<len(hits) and hits[i][1].request not in pending:
                k,res=hits[i]; want=evidence[k]
                seen[k]=facts(res.body()); assert seen[k]==want,('observed HTTP body differs',k)
                i+=1
            generated=set(page.evaluate("()=>[...window.__honroObserver.blobs]"))
            before=(i,len(blobs));page.wait_for_timeout(100)
            idle=before==(len(hits),len(blobs)) and not pending and set(blobs)<=generated
            quiet=quiet+1 if idle else 0
            if quiet==3:break
        proof['lastHttpDrain']={'arm':mode,'view':wh,'requests':len(hits),'pending':[q.url for q in pending],'errors':errors,'missing':sorted(set(expected)-seen.keys())};save()
        assert quiet==3 and not errors and set(expected)<=seen.keys(), ('missed normal compiled loader/split body observations',sorted(set(expected)-seen.keys()),errors)
        proof.setdefault('HTTP',{}).setdefault(f'{w}x{h}',{})[mode]={'verified':seen,'media':sorted(set(media))}
        save();return seen
    finally:ctx.close()
def app():
 from PIL import Image
 globals()['Image']=Image
 from playwright.sync_api import sync_playwright
 save()
 try:
  pins=anonymous(); seen={}
  with sync_playwright() as w:
   b=w.chromium.launch()
   assert b.version==P['browser'],('candidate and public browser mismatch',b.version,P['browser'])
   for wh in ((1440,900),(390,844)):
    frames=[P['frames'][k]for k in P['selected'] if tuple(P['frames'][k]['viewportCSS'])==wh]
    assert [f['view']for f in frames]==['ordinary','overview','west','east','southeast']
    seen[wh]=capture(b,pins,wh,frames)
   b.close()
  for (w,h),r in seen.items():
   expected=set(P['referenceObservedRequestsByCSS'][f'{w}x{h}'])
   assert set(r)==expected,('public replay exact immutable fetch set changed',w,h,sorted(expected-set(r)),sorted(set(r)-expected))
  assert set(proof['frames'])==set(P['selected']) and len(proof['frames'])==10
  mismatch={k:[i for i,v in r['candidateReplayComparison'].items()if not v] for k,r in proof['frames'].items() if not all(r['candidateReplayComparison'].values())}
  proof['mismatch']=mismatch
  assert not mismatch,('public exact candidate replay mismatch',mismatch)
  assert facts(http(MF,12<<20))==pins[MF],'stable public manifest changed during browser captures'
  proof.update(status='PASS_EXACT_PUBLIC_BLUE_STAGE35_10_FRAMES',release=R['commit'],normalReference=N)
  proof.pop('activeProbe',None)
 except Exception as e:
  if not proof['status'].startswith('HOLD'):proof['status']='HOLD'
  proof['reason']=repr(e);raise
 finally:save()
if __name__=='__main__':
 if sys.argv[1]=='authority':
  try:authority()
  except Exception as e:
   write('AUTHORITY-HOLD.json',{'status':'HOLD_BEFORE_PUBLIC_LOAD','reason':repr(e)})
   raise
 elif sys.argv[1]=='app':app()
 else:raise RuntimeError('expected authority or app')
