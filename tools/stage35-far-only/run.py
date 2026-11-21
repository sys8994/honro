"""One real public FAR image response only; diagnostic QA, no product/deploy."""
import base64,hashlib,io,json,math,os,statistics,subprocess,sys,time
from pathlib import Path
from urllib.request import HTTPRedirectHandler,Request,build_opener
from PIL import Image
H=Path(__file__).resolve().parent
P=json.loads((H/'PINS.json').read_bytes());ENTRY=json.loads((H/'entry.json').read_bytes())
OUT=Path(sys.argv[1]); BASE='https://sys8994.github.io/honro/';HTML='HONRO.html'
FAR=P['far'];LIVE=P['authority']['commit'];REF='refs/heads/qa/stage35-far-only-71fb'
CANDIDATE=(H/'candidate.webp').read_bytes()
proof={'status':'INIT','stock':P['authority'],'scope':'one Stage35 far WebP fixture substitution; geometry/gameplay/art outside far source unmodified, not a build or release','frames':{}}
def sha(x):return hashlib.sha256(x).hexdigest()
def facts(b):return {'bytes':len(b),'sha256':sha(b)}
def save():(OUT/'PROOF.json').write_text(json.dumps(proof,indent=2,ensure_ascii=False)+'\n')
def git(*a):return subprocess.check_output(['git',*a])
class NoRedirect(HTTPRedirectHandler):
 def redirect_request(self,*a,**kw):raise RuntimeError('public URL redirected')
def get(k,p):
 u=BASE+k
 with build_opener(NoRedirect).open(Request(u,headers={'Accept-Encoding':'identity','Cache-Control':'no-cache'}),timeout=30) as r:
  assert r.status==200 and r.geturl()==u
  b=r.read(p['bytes']+1);assert facts(b)==p,('authority drift',k);return b
def pre():
 assert os.environ['GITHUB_REPOSITORY']=='sys8994/honro' and os.environ['GITHUB_REF']==REF and os.environ['GITHUB_EVENT_NAME']=='push'
 h=os.environ['GITHUB_SHA']
 assert git('rev-list','--parents','-n1','HEAD').decode().split()==[h,LIVE]
 assert git('rev-parse',LIVE+'^{tree}').decode().strip()==P['authority']['tree']
 assert git('status','--porcelain=v1','-z')==b''
 exact={'.github/workflows/stage35-far-only.yml',*(f'tools/stage35-far-only/{p}' for p in ('PINS.json','run.py','entry.json','candidate.webp'))}
 assert set(git('diff','--name-status','--no-renames',LIVE,h).decode().splitlines())=={'A\t'+a for a in exact}
 assert git('rev-parse',LIVE+':web/manifest.json').decode().strip()==P['authority']['manifestGit']
 b=git('show',LIVE+':web/manifest.json');assert facts(b)==P['authority']['manifest']
 m=json.loads(b);e={r['path']:{k:r[k] for k in ('bytes','sha256')} for r in m['files']}
 assert len(e)==len(m['files'])==P['expectedActive809']
 e[HTML]=P['authority']['html']
 assert set(P['mustObserve'])<=e.keys() and facts(CANDIDATE)==P['candidate']
 result={}
 for k in [*P['mustObserve'],'web/manifest.json']:
  if k=='web/manifest.json':want=P['authority']['manifest']
  else:want=e[k]
  b=get(k,want);assert b==git('show',LIVE+':'+k);result[k]=facts(b)
 assert Image.open(io.BytesIO(CANDIDATE)).size==tuple(P['newSize'])
 assert Image.open(io.BytesIO(get(FAR,e[FAR]))).size==tuple(P['oldSize'])
 proof.update(status='SOURCE_PASS',head=h,signedLive=result);save()
 return e
def layer_frame(f,iw,ih):
 w,h=f['css']['w'],f['css']['h'];x,y=f['actual']['x'],f['actual']['y']
 mx,my=w*.022,h*.007;s=max((w+2*mx)/iw,(h+2*my)/ih);dw,dh=iw*s,ih*s
 ox=-mx*math.tanh((x-2304)*.025/mx);oy=-my*math.tanh((y-1536)*.0035/my)
 X=-mx-(dw-w-2*mx)*(.98 if w/h>=.9 else .5)+ox;Y=-my-(dh-h-2*my)*.28+oy
 return {'x':X,'y':Y,'w':dw,'h':dh,'offsetX':ox,'offsetY':oy},[-X/s,-Y/s,(w-X)/s,(h-Y)/s]
def light(im):
 x=im.convert('RGB')
 out={}
 for k,lo,hi in [('top',0,1/3),('middle',1/3,2/3),('base',2/3,1)]:
  sample=x.crop((0,round(im.height*lo),im.width,round(im.height*hi)))
  v=[(54*r+183*g+19*b)/256 for r,g,b in sample.getdata()]
  out[k]={'medianLuma':round(statistics.median(v),2),'meanLuma':round(statistics.mean(v),2)}
 return out
PEER="""async q=>{
 const app=HonroApp,b=app.engine.b,s=app.scene;
 const f=HonroAuthoredFarArt.frames(s,q.css.w,q.css.h,b);
 if(f.length!==1||f[0].key!=='act4FarBambooHandoff'||f[0].alpha!==1||!f[0].frame||s.environmentStats?.authoredFar?.[0]!==f[0].key)
  throw Error('Current normal active far owner/source not ready');
 const src=[...window.__honroObserver.images].filter(i=>(i.currentSrc||i.src)===q.far&&i.complete&&i.naturalWidth).at(-1);
 if(!src)throw Error('Current active actual image decode missing');
 const mat=HonroTerrainDomain.materialLandmarks(b);
 const stage=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===35);
 const poses=q.ownerIds.map(id=>{
   const p=stage.elements.find(e=>e.id===id), children=mat.filter(e=>e.id===id);
   if(!p||children.length!==1)throw Error('missing exact terrain owner '+id);
   const a=HONRO_PROJECT.library.find(x=>x.id===p.assetId),land=children[0];
   if(!a||land.asset?.id!==a.id||JSON.stringify(a.vector)!==JSON.stringify(land.asset.vector))throw Error('mismatched active native terrain art');
   return [p,land.kind,land.layer,land.x,land.y,land.scale,a];
 });
 const source=new TextEncoder().encode(JSON.stringify(poses));
 const bsha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',source)),v=>v.toString(16).padStart(2,'0')).join('');
 const c=document.createElement('canvas');[c.width,c.height]=q.backing;const p=c.getContext('2d'),g=f[0].frame;
 // All variants use the act4Far family: unchanged author palette, no runtime filter.
 p.drawImage(src,g.x,g.y,g.w,g.h);
 return{materialOwnersSHA256:bsha,ownerIds:q.ownerIds,nativeFrame:g,natural:[src.naturalWidth,src.naturalHeight],
  farPng:c.toDataURL('image/png').split(',')[1]};
}"""

def rel(u):
    return u[len(BASE):] if u.startswith(BASE) and '?' not in u and '#' not in u else None
def decode(b):return Image.open(io.BytesIO(b)).convert('RGBA')
def read_png(p,z):
    b=base64.b64decode(p.evaluate(z),validate=True);return b,decode(b)
CANVAS="()=>HonroApp.scene.canvas.toDataURL('image/png').split(',')[1]"
def capture(browser,evidence,wh,mode,shots):
    w,h=wh;ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
    assert ctx.storage_state()=={'cookies':[],'origins':[]}
    page=ctx.new_page();page.set_default_timeout(25000)
    errors=[];hits=[];blobs=[];media=[];pending=set();intercepts=[]
    def route(r):
        q=r.request; k=rel(q.url)
        if mode=='B' and k==FAR and q.method=='GET':
            try:
                rr=r.fetch(max_redirects=0,timeout=25000); assert rr.status==200 and rr.url==q.url and facts(rr.body())==evidence[k]
                assert not intercepts
                hdr={a:b for a,b in rr.headers.items() if a not in ('content-encoding','content-length','etag','last-modified','content-range','content-digest','digest')}
                hdr.update({'content-type':'image/webp','cache-control':'no-store'})
                r.fulfill(status=200,headers=hdr,body=CANDIDATE);intercepts.append(k);return
            except Exception as exc:
                errors.append(['candidate replacement',repr(exc)]);return r.abort()
        if (q.method=='GET' and (k in evidence or k in P['media'] and q.resource_type=='media')) or q.url.startswith(('blob:'+BASE.split('/honro/')[0]+'/','data:')):
            return r.continue_()
        errors.append(['unexpected request',q.url]);return r.abort()
    def response(res):
        k=rel(res.url);q=res.request
        if res.url.startswith('blob:https://sys8994.github.io/') and res.status==200:blobs.append(res.url)
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
            k=f['key']; view=f['view'];q={'id':35,'mapId':'stage-35','name':view,'dx':1 if view=='east' else -1 if view=='west' else 0,'dy':-1 if view=='north' else 0,'ordinary':f['ordinaryAnchor'],'readback':False}
            g=page.evaluate(ENTRY['PARK'],q)
            dd=page.evaluate(ENTRY['DECODE'])
            assert dd['registered']==f['decodeCount'] and not dd['failed']
            assert g==page.evaluate(ENTRY['PARK'],{**q,'readback':True})
            assert sha(g['signature'].encode())==f['physicsSHA256'] and all(f[n]==g[n] for n in (
              'actual','viewport','css','backing','focus','actorCount','tide','sceneTime','phase','round'))
            rb,raw=read_png(page,CANVAS);db=canvas.screenshot(animations='disabled');dom=decode(db)
            assert list(raw.size)==f['backing'] and list(dom.size)==f['pixels']
            domH=sha(dom.tobytes());rawH=sha(raw.tobytes())
            for name,value in [('raw',rb),('dom',db)]: (OUT/f'{k}-{mode}-{name}.png').write_bytes(value)

            if mode=='A':
                assert domH==f['stockDOMdecodedSHA256'],('stock archival PNG pixel drift',k,domH)
                if 'stockNativeRawDecodedSHA256' in f:assert rawH==f['stockNativeRawDecodedSHA256'],('stock archived RAW drift',k)
            peer=page.evaluate(PEER,{'backing':g['backing'],'actual':g['actual'],'css':g['css'],
                                    'ownerIds':P['signedOwnerIds'],'far':BASE+FAR})
            mat=base64.b64decode(peer.pop('farPng'),validate=True)
            im=decode(mat);assert im.getchannel('A').getextrema()==(255,255),('new far frame leaves uncovered screen pixels',k,mode)
            expect=P['newSize'] if mode=='B' else P['oldSize']
            frame,crop=layer_frame(g,*expect)
            assert peer['natural']==expect and all(abs(peer['nativeFrame'][j]-v)<1e-6 for j,v in frame.items())
            (OUT/f'{k}-{mode}-far-sample.png').write_bytes(mat)
            rows[k]={'rawRGBA':rawH,'domRGBA':domH,'rawPNG':sha(rb),'domPNG':sha(db),'physics':f['physicsSHA256'],
                     'canvasAlphaRaw':sha(raw.getchannel('A').tobytes()),'canvasAlphaDom':sha(dom.getchannel('A').tobytes()),
                     'farOnlySamplePNG':sha(mat),'sourceCropPixels':crop,'farTonal':light(im),'compositeTonal':light(raw),**peer}
            proof['frames'].setdefault(k,{})[mode]=rows[k]
            save()
        seen={};i=quiet=0;deadline=time.monotonic()+12
        while time.monotonic()<deadline:
            assert not errors,errors
            while i<len(hits) and hits[i][1].request not in pending:
                k,res=hits[i]; want=facts(CANDIDATE) if mode=='B' and k==FAR else evidence[k]
                seen[k]=facts(res.body()); assert seen[k]==want,('observed HTTP body differs',k)
                i+=1
            generated=set(page.evaluate("()=>[...window.__honroObserver.blobs]"))
            before=(i,len(blobs));page.wait_for_timeout(100)
            idle=before==(len(hits),len(blobs)) and not pending and set(blobs)<=generated
            quiet=quiet+1 if idle else 0
            if quiet==3:break
        assert quiet==3 and not errors and set(P['mustObserve'])<=seen.keys()
        assert intercepts==([FAR] if mode=='B' else [])
        proof.setdefault('HTTP',{}).setdefault(f'{w}x{h}',{})[mode]={'verified':seen,'onlyReplacement':intercepts,'media':sorted(set(media))}
        save();return seen
    finally:ctx.close()
def main():
 from playwright.sync_api import sync_playwright
 save()
 try:
  exact=pre()
  with sync_playwright() as w:
   b=w.chromium.launch();assert b.version==P['browser']
   for wh in ((1440,900),(390,844)):
    shots=[x for x in P['shots'].values() if tuple(x['viewportCSS'])==wh]
    A=capture(b,exact,wh,'A',shots);B=capture(b,exact,wh,'B',shots)
    assert A.keys()==B.keys() and [p for p in sorted(A) if A[p]!=B[p]]==[FAR]
    for f in shots:
     k=f['key'];v=proof['frames'][k];u,z=v['A'],v['B']
     assert all(u[j]==z[j] for j in ('physics','ownerIds','materialOwnersSHA256','canvasAlphaRaw','canvasAlphaDom')),('target scope drift',k)
     assert u['rawRGBA']!=z['rawRGBA'] and u['domRGBA']!=z['domRGBA'],('far-only replacement not visible',k)
     v['samePhysicalStateAndNativeOwners']=True
   b.close()
  assert len(proof['frames'])==7
  proof.update(status='PASS_SCOPED_FAR_ONLY_VISUAL_INPUT',artAcceptance='manual review still needed')
 except Exception as e:proof.update(status='HOLD',reason=repr(e));raise
 finally:save()
if __name__=='__main__':main()
