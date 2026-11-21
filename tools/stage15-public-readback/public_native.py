"""Stage15 scoped public-Pages exact digest + native App readback; no deployment."""
import base64,hashlib,io,json,os,pathlib,re,subprocess
from datetime import datetime,timezone
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler,Request,build_opener
from PIL import Image
from playwright.sync_api import sync_playwright

HERE=pathlib.Path(__file__).resolve().parent
OUT=pathlib.Path(os.environ['STAGE15_PUBLIC_OUT'])
BASE='https://sys8994.github.io/honro/'
ORIGIN='https://sys8994.github.io'
FROZEN=('desired','actual','viewport','focus','zoomLimits','css','backing','actorCount','phase','round','tide','sceneTime','DPR')
SHA=lambda d:hashlib.sha256(d).hexdigest()
FACT=lambda d:{'bytes':len(d),'sha256':SHA(d)}
ROW=lambda r:{k:r[k]for k in ('bytes','sha256')}
GRAPH=lambda m:SHA(json.dumps([[p,v['sha256'],v['bytes']]for p,v in sorted(m.items())],ensure_ascii=False,separators=(',',':')).encode())
def JSON(f):return json.loads(f.read_bytes())
ref_raw=(HERE/'REFERENCE.json').read_bytes()
kin_raw=(HERE/'camera-kernel.json').read_bytes()
assert SHA(ref_raw)=='79fac642d24523d4a103b3a0020aef5f68c408986369b4a459786d0acb47f945'
assert SHA(kin_raw)=='bc430dc90d9836803035c86d74da402921391a2c41d8f75c57d6ea60866126e9'
REF=json.loads(ref_raw);K=json.loads(kin_raw);REL=JSON(HERE/'RELEASE.json')
NATIVE=REF['native'];ROLES=REF['roles']
BRANCH='qa/stage15-public-readback-71fb443-20261121'
ALLOW={'.github/workflows/stage15-public-readback.yml',*(f'tools/stage15-public-readback/{n}'for n in ('public_native.py','REFERENCE.json','RELEASE.json','camera-kernel.json'))}
MEDIA=set(f'assets/bgm/{n}.mp3'for n in ('main','battle-1','battle-2','battle-3','battle-4'))
BLOB=re.compile(re.escape('blob:'+ORIGIN)+r'/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}')
GIT=lambda *a:subprocess.check_output(['git',*a])
DUMP=lambda name,obj:(OUT/name).write_text(json.dumps(obj,indent=2,ensure_ascii=False)+'\n')
class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self,*a,**k):raise RuntimeError('Anonymous Pages exact-route request redirected')
def verify_release():
    assert REL['release']=='71fb443675aed659a572b722a4337212e9d2f910' and REL['tree']=='c9f11d3a7458ecfcb390e460401f4b3298395858'
    assert all(type(REL[k]) is int and REL[k]>0 for k in ('pagesRun','pagesJob')), 'HOLD: public Pages run/job not pinned'
    assert REL['pagesConclusion']=='success' and REL['pagesRun']!=REF['authority']['run']
    when=REL['pagesCompletedUTC'];assert isinstance(when,str) and when.endswith('Z')
    assert datetime.fromisoformat(REF['priorGeneration']['publishedAt'])<datetime.fromisoformat(when[:-1]+'+00:00')<=datetime.now(timezone.utc)
    assert REL['retainedManifestSHA256']==REF['manifest']['sha256']
    head=os.environ['GITHUB_SHA'];assert os.environ.get('GITHUB_REF')=='refs/heads/'+BRANCH
    assert GIT('rev-list','--parents','-1','HEAD').decode().split()==[head,REL['release']]
    assert GIT('rev-parse',REL['release']+'^{tree}').decode().strip()==REL['tree']
    assert GIT('status','--porcelain','-z')==b''
    ds=GIT('diff','--name-status','--no-renames','-z',REL['release'],head).split(b'\0')
    assert ds.pop()==b'' and len(ds)==2*len(ALLOW)
    assert set(zip(ds[::2],ds[1::2]))=={(b'A',x.encode())for x in ALLOW}
    for p,d in REF['sourceBlobs'].items():assert GIT('rev-parse',REL['release']+':'+p).decode().strip()==d
    assert GIT('rev-parse',REL['release']+':web/manifest.json').decode().strip()==REF['manifest']['gitBlob']

def rel_safe(p):
    assert re.fullmatch(r'[A-Za-z0-9_.-]+(?:/[A-Za-z0-9_.-]+)*',p) and not {'.','..'}&set(p.split('/')),p
def local(p):
    rel_safe(p);return GIT('show',REL['release']+':'+p)
def public_get(p,f):
    rel_safe(p);u=BASE+p
    req=Request(u,headers={'Cache-Control':'no-cache','Accept-Encoding':'identity'},method='GET')
    with build_opener(NoRedirect).open(req,timeout=35) as r:
        assert r.status==200 and r.geturl()==u,p
        body=r.read(f['bytes']+1);assert FACT(body)==f,p
        return body,{'url':u,'status':200,**FACT(body)}

def check_media(p,r):
    length=r.header_value('content-length')
    if r.status==200:assert not r.header_value('content-range') and (length or '').isdigit(),p
    else:
        ran=re.fullmatch(r'bytes=(\d+)-(\d*)',r.request.header_value('range')or'')
        out=re.fullmatch(r'bytes (\d+)-(\d+)/(\d+)',r.header_value('content-range')or'')
        assert ran and out,p
        start,end,size=map(int,out.groups())
        assert start==int(ran[1]) and start<=end<size and int(length)==end-start+1,p
        if ran[2]:assert end==min(int(ran[2]),size-1),p

def graph_and_public():
    man='web/manifest.json';raw=local(man);M=json.loads(raw)
    assert FACT(raw)==ROW(REF['manifest'])
    current={r['path']:ROW(r)for r in M['files']};assert len(current)==len(M['files'])==809
    assert GRAPH(current)==REF['manifest']['activeGraphSHA256']
    assert M['gameEntry']==ROLES['entry'] and M['workshopEntry']==ROLES['workshop']
    assert M['project']==ROLES['campaign'] and M['playtest']==ROLES['playtest']
    assert ROLES['renderer'] in M['common'] and all(current[p]==v for p,v in REF['active'].items())
    pre=[g for g in M['publishedGenerations'] if g['sourceSha']==REF['priorGeneration']['sourceSha']]
    assert len(pre)==1 and {k:v for k,v in pre[0].items()if k!='files'}==REF['priorGeneration']
    before={r['path']:ROW(r)for r in pre[0]['files']};assert len(before)==len(pre[0]['files'])==809
    assert GRAPH(before)==REF['priorGeneration']['graphSha256']
    assert all(p not in current and before[p]==v for p,v in REF['retired'].items())
    needed={man:ROW(REF['manifest']),**REF['shells'],**REF['active'],**REF['retired']}
    body={};receipt={'scope':'Exact anonymous public immutable and retained graph; no App verification yet','release':REL,'http':[],'complete':False,'authority':REF['authority']}
    try:
        for p,f in needed.items():
            check=local(p);assert FACT(check)==f,p
            got,tr=public_get(p,f);assert got==check,p
            body[p]=got;receipt['http'].append(tr)
        assert body['HONRO.html']==body['index.html']
        leaf=lambda p:p.rsplit('/',1)[1].encode()
        assert leaf(ROLES['entry']) in body['HONRO.html'] and leaf(ROLES['workshop']) in body['HONRO_WORKSHOP.html']
        E=body[ROLES['entry']]
        assert all(leaf(ROLES[k]) in E for k in ('renderer','compactLoader','campaign')), 'entry not loading expected roles'
        assert leaf(ROLES['compactDescriptor']) in body[ROLES['compactLoader']]
        parts=json.loads(body[ROLES['compactDescriptor']]);assert parts['$honroJsonParts']==1 and len(parts['parts'])==2
        assert all(FACT(body[r['path']])==ROW(r)for r in parts['parts'])
        joint=b''.join(body[r['path']]for r in parts['parts']);assert FACT(joint)==ROW(parts)==ROLES['compactAggregate']
        pack=json.loads(joint);assert sorted(map(int,pack))==list(range(12,21))
        assert pack['15']['mapRevision']==615 and b'_stage15TerrainReliefLandmarks' in body[ROLES['renderer']]
        olddesc=next(p for p in REF['retired']if 'COMPACT_PACKAGES-parts.' in p);oldparts=json.loads(body[olddesc])
        assert oldparts['$honroJsonParts']==1 and len(oldparts['parts'])==2
        assert all(FACT(body[r['path']])==ROW(r)for r in oldparts['parts'])
        oldjoint=b''.join(body[r['path']]for r in oldparts['parts']);assert FACT(oldjoint)==ROW(oldparts)
        assert {k:v for k,v in json.loads(oldjoint).items()if k!='15'}=={k:v for k,v in pack.items()if k!='15'}
        assert json.loads(oldjoint)['15']['stage']==pack['15']['stage']
        campaign=json.loads(body[ROLES['campaign']])
        for i in (15,26,36):
          assert all(campaign[k][i-1] in REF['active']for k in ('stages','stageLibraries'))
        d36=json.loads(body[campaign['stageLibraries'][35]])
        assert d36['$honroJsonParts']==1 and len(d36['parts'])==2
        assert all(FACT(body[r['path']])==ROW(r)for r in d36['parts'])
        assert FACT(b''.join(body[r['path']]for r in d36['parts']))==ROW(d36)
        receipt.update(complete=True,activeCompactAggregate=FACT(joint),priorCompactAggregate=FACT(oldjoint),preservedSiblingCompactStages=8)
    except Exception as e:
        receipt['failure']=repr(e);raise
    finally:DUMP('public-source.json',receipt)
    return {**current,**REF['shells']}, parts, pack

def public_path(url):
    p=urlsplit(url)
    if p.scheme!='https' or p.netloc!='sys8994.github.io' or p.query or p.fragment or not url.startswith(BASE):return None
    return url[len(BASE):]

def photos(known,parts,pack):
    proof={'scope':'Anonymous normal Pages App; 8 exact native frames, 24 frozen camera replay, not a playthrough or global cache test','release':REL,'authority':REF['authority'],'complete':False,'visits':[],'frames':[]}
    required={'HONRO.html',ROLES['entry'],ROLES['renderer'],ROLES['campaign'],ROLES['compactLoader'],ROLES['compactDescriptor'],
        *[r['path']for r in parts['parts']],*[p for p in REF['active'] if p.startswith(('web/data/chapter-15.','web/data/chapter-15-assets.'))]}
    renderer=ROLES['renderer']
    try:
      with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True)
        assert browser.version==NATIVE['browser']=='151.0.7922.34'
        proof['browser']=browser.version
        for w,h in ((1440,900),(390,844)):
          ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
          assert ctx.storage_state()=={'cookies':[],'origins':[]}
          page=ctx.new_page();seen=[];errors=[];blobs=[]
          receipt={'viewportCSS':[w,h],'browserResponses':{},'errors':errors,'witnesses':[],'complete':False};proof['visits'].append(receipt)
          def observe(r):
            rel=public_path(r.url);method=r.request.method
            try:
              if BLOB.fullmatch(r.url) and r.status==200 and method=='GET':blobs.append(r.url);return
              if rel in MEDIA and method=='GET' and r.request.resource_type=='media' and r.status in (200,206):check_media(rel,r);return
              assert rel in known and method=='GET' and r.status==200,(r.url,r.status,method)
              seen.append((rel,r))
            except Exception as e:errors.append(repr(e))
          page.on('response',observe)
          page.on('request',lambda r:errors.append('Unexpected HTTP method '+r.method) if r.method!='GET' else None)
          page.on('pageerror',lambda e:errors.append(str(e)))
          def fail(r):
            if r.failure=='net::ERR_ABORTED' and r.resource_type=='media' and public_path(r.url) in MEDIA-{'assets/bgm/battle-4.mp3'}:return
            errors.append('Unexpected request failure: '+r.url+' '+str(r.failure))
          page.on('requestfailed',fail)
          page.add_init_script('('+K['INIT']+')()')
          shell=page.goto(BASE+'HONRO.html',wait_until='domcontentloaded',timeout=50_000)
          assert shell and shell.status==200 and shell.url==BASE+'HONRO.html' and FACT(shell.body())==REF['shells']['HONRO.html']
          page.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&!!window.HonroCampaignLoader",timeout=90_000)
          page.evaluate(K['LAUNCH'],{'id':15,'compact':NATIVE['compact'],'owners':NATIVE['owners']})
          actual=page.evaluate("()=>JSON.stringify(HONRO_ACT2_COMPACT_PACKAGES[15])")
          assert json.loads(actual)==pack['15']
          route_method='_stage15TerrainReliefLandmarks'
          receipt['observer']=page.evaluate(K['JOIN_OBSERVER'],{'name':route_method,'needed':True})
          canvas=page.locator('#battlecanvas');canvas.wait_for(state='visible')
          page.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
            return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue);}""",polling=125,timeout=9000)
          page.evaluate("()=>{const a=HonroApp;a.scene.render(a.engine,0,'',.6,false,0);}")
          replay=[f for f in NATIVE['frames'] if f['viewportCSS']==[w,h]]
          assert len(replay)==12
          for f in replay:
            v=f['view'];dx=-1 if 'west' in v else 1 if 'east' in v else 0
            dy=-1 if 'north' in v else 1 if 'south' in v else 0
            q={'id':15,'mapId':NATIVE['mapId'],'name':v,'dx':dx,'dy':dy,'ordinary':[224,2038.4444444444443,.5],
                'compact':NATIVE['compact'],'readback':False,'detail':f['actual']if v in ('roof-detail','ground-detail')else None}
            r=page.evaluate(K['PARK'],q)
            decode=page.evaluate(K['DECODE']);assert decode['registered']>0 and not decode['failed']
            assert page.evaluate(K['PARK'],{**q,'readback':True})==r
            assert all(r[k]==f[k]for k in FROZEN) and SHA(r['signature'].encode())==f['physicsSHA256'],f['key']
            cache=page.evaluate(K['CACHE'],{'view':f['viewport'],'known':f['tileKeys']});assert cache['keys']==f['tileKeys'] and not cache['fresh']
            if f['witness']:
              dom=canvas.screenshot(animations='disabled',timeout=30_000)
              raw=base64.b64decode(page.evaluate("()=>document.getElementById('battlecanvas').toDataURL('image/png').split(',')[1]"),validate=True)
              rr={'key':f['key'],'actual':f['actual'],'physicsSHA256':f['physicsSHA256']};proof['frames'].append(rr)
              for name,b in (('DOM',dom),('RAW',raw)):
                png=(OUT/(f['key']+'-'+name.lower()+'.png'));png.write_bytes(b)
                im=Image.open(io.BytesIO(b)).convert('RGBA');fact={**FACT(b),'rgbaSHA256':SHA(im.tobytes()),'dimensions':list(im.size)}
                rr[name]={**fact,'filename':png.name,'exact':fact==f[name]};assert rr[name]['exact'],(f['key'],name,fact)
              receipt['witnesses'].append(f['key'])
            assert not errors,errors
          records=page.evaluate(K['JOIN_READ']);assert records and not records['errors']
          real={r['key']:r['outcome'] for r in records['rows']}
          assert len(real)==len(records['rows']) and set(real.values())=={'stock','north','south'}
          for f in replay:
            observed=[{'tileKey':k,'result':real.get(k,'pre-observer')}for k in f['tileKeys']]
            assert all(k in real or k in records['preObserver']for k in f['tileKeys']) and observed==f['observedFormalRoutes'],f['key']
          receipt['actualRouteKeys']={x:sum(t==x for t in real.values())for x in ('stock','north','south')}
          mint=set(page.evaluate("()=>Array.from(window.__honroObserver.blobs)"));assert set(blobs)<=mint
          snapshot=list(seen)
          for p,r in snapshot:
            body=r.body();assert FACT(body)==known[p],p
            receipt['browserResponses'][p]={'status':200,**FACT(body)}
          assert required<=receipt['browserResponses'].keys() and not errors and len(snapshot)==len(seen),errors
          for p in (renderer,ROLES['compactDescriptor'],*[r['path']for r in parts['parts']]):assert ROW(receipt['browserResponses'][p])==REF['active'][p]
          receipt['complete']=True;ctx.close();DUMP('public-native-proof.json',proof)
        browser.close()
      assert len(proof['frames'])==8 and all(f['RAW']['exact'] and f['DOM']['exact'] for f in proof['frames'])
      proof['complete']=True
    except Exception as e:proof['failure']=repr(e);raise
    finally:DUMP('public-native-proof.json',proof)

if __name__=='__main__':
    OUT.mkdir(parents=True,exist_ok=True)
    verify_release()  # no network before release authority, exact lineage and source identities
    names,parts,pack=graph_and_public()
    photos(names,parts,pack)
