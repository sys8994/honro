import hashlib, json, math, os, platform, statistics, subprocess, sys, urllib.request
from pathlib import Path
from urllib.parse import urlsplit

D = Path(__file__).resolve().parent
P = json.loads((D / 'PINS.json').read_bytes())
ROOT = P['publicRoot']
SHELL = 'HONRO.html'
MANIFEST = 'web/manifest.json'
WORKFLOW = '.github/workflows/honro-p1-eaf-budget.yml'
FIELDS = ('bytes', 'sha256')

def need(x, why):
    if not x:
        raise RuntimeError(why)

def fact(b):
    return {'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest()}

def pin(q):
    return {k:q[k] for k in FIELDS}

def read_json(b): return json.loads(b)

def out_json(p, q): p.write_text(json.dumps(q, ensure_ascii=False, indent=2)+'\n')

def bind():
    need(P['enabled'] is True, 'DISABLED until review and explicit authorization')
    need(not (os.environ.get('GITHUB_TOKEN') or os.environ.get('GH_TOKEN')), 'No tokens for the public browser runner')
    need((os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==
         (P['repo'],'push',P['qaRef']), 'Wrong repo/event/ref')
    g=lambda *x:subprocess.check_output(['git',*x],timeout=30)
    head=os.environ['GITHUB_SHA']
    need(g('rev-list','--parents','-1','HEAD').decode().split()==[head,P['head']], 'Wrong sole parent')
    need(g('rev-parse',P['head']+'^{tree}').decode().strip()==P['tree'], 'Wrong stock tree')
    need(g('rev-parse','refs/remotes/origin/master').decode().strip()==P['head'], 'master moved before checkout')
    root=Path(os.environ['GITHUB_WORKSPACE'])
    allow=[WORKFLOW,*[str((D/x).relative_to(root)) for x in ['measure.py','observe.js','PINS.json']]]
    entries=g('diff','--no-renames','--name-status','-z',P['head'],head).decode().split('\0')
    need(len(entries)==9 and entries[-1]=='' and set(zip(entries[::2],entries[1::2]))=={('A',x) for x in allow}
         and not g('status','--porcelain','-z'), 'Not exact add-only child')
    need(fact((root/MANIFEST).read_bytes())==pin(P['manifest']) and
         g('rev-parse',P['head']+':'+MANIFEST).decode().strip()==P['manifest']['git'],'Exact manifest pinned')
    need(fact((root/SHELL).read_bytes())==pin(P['nativeShell']) and
         g('rev-parse',P['head']+':'+SHELL).decode().strip()==P['nativeShell']['git'],'Exact shell pinned')
    idx={f['path']:pin(f) for f in read_json((root/MANIFEST).read_bytes())['files']}
    paths={**P['core'],**{k:v for s in P['stages'].values() for k,v in s['files'].items()}}
    for k,v in paths.items():
        need(idx.get(k)==v==fact((root/k).read_bytes()),'Wrong exact author/readback route '+k)
    for sid,s in P['stages'].items():
        if s['parts']:
            d=read_json((root/s['descriptorOrPacket']).read_bytes())
            need(d['$honroJsonParts']==1 and len(d['parts'])==len(s['parts']) and
                 [r['path'] for r in d['parts']]==s['parts'] and
                 all(pin(r)==s['files'][r['path']] for r in d['parts']),'Wrong descriptor/part list '+sid)
            sha=hashlib.sha256()
            for k in s['parts']:sha.update((root/k).read_bytes())
            need(sha.hexdigest()==d['sha256'] and sum(s['files'][k]['bytes'] for k in s['parts'])==d['bytes'],
                 'Wrong joined stock packet '+sid)
    return {'head':head,'parent':P['head'],'tree':P['tree'],'pages':P['pages'],'addOnly':allow}

def identity_live():
    # Independent eaf alias verification outside measured browser processes; do not use cache busting in actual trial.
    routes = {MANIFEST:pin(P['manifest'])}
    result={}
    for path,v in routes.items():
        u=ROOT+path
        req=urllib.request.Request(u,headers={'Accept-Encoding':'identity','Cache-Control':'no-cache','User-Agent':'HONRO stock browser proof'})
        with urllib.request.urlopen(req,timeout=35) as r:
            need(r.geturl()==u and r.status==200,'unexpected public manifest URL')
            body=r.read(v['bytes']+1)
        need(fact(body)==v,'live manifest moved, stop and rebind')
        result[path]=fact(body)
    return result

def path_of(u):
    q=urlsplit(u)
    prefix=urlsplit(ROOT)
    if q.scheme==prefix.scheme and q.netloc==prefix.netloc and not (q.query or q.fragment) and q.path.startswith(prefix.path):
        return q.path[len(prefix.path):]
    return None

def order():
    a=P['rotate']
    for r in range(P['repeats']):
        start=2*r
        for i,n in enumerate(a[start:]+a[:start]):
            for dev in (['PC','Mobile'] if (r+i)%2==0 else ['Mobile','PC']):
                yield r+1,n,dev

def interval(hi,lo):
    need(isinstance(hi,(float,int)) and isinstance(lo,(float,int)) and hi>=lo,'invalid monotonic metric')
    return hi-lo

def metrics(q,s):
    mark=q['marks']; first=q['firstFrame']; stable=q['stableFrame']
    nav=q['navigation']
    need(len(nav)==1 and nav[0]['path']==SHELL,'navigation RT missing')
    owned=q['stageResources']
    cross=[x for x in owned if x['responseEnd']<=mark['launchStart']]
    begin,end=min(x['startTime'] for x in owned),max(x['responseEnd'] for x in owned)
    need(end<=first['start'],'a required route finished after a stock first frame')
    en=q['ensures']
    need((q['eager'] and not en) or
         (not q['eager'] and len(en)==1 and not en[0].get('error') and en[0]['stage']==q['stage'] and
          en[0]['start']>=mark['launchStart'] and en[0]['end']<=first['start']),
         'missing or unordered native ensureStage interval')
    before=q['firstFrame'].get('cacheBefore') or {}
    after=q['firstFrame'].get('cacheAfter') or {}
    return {
        'navToTitleObservedMs': interval(mark['titleObserved'],nav[0]['startTime']),
        'stageHttpFirstRequestToLastBodyMs':interval(end,begin),
        'stageEncodedBodyBytes':sum(x['encodedBodySize'] for x in owned),
        'stageDecodedBodyBytes':sum(x['decodedBodySize'] for x in owned),
        'stageTransferSizeBytes':sum(x['transferSize'] for x in owned),
        'stageRoutesBeforeLaunch': [x['path'] for x in cross],
        'stageRoutesStartedBeforeLaunch':[x['path'] for x in owned if x['startTime']<mark['launchStart']],
        'stageRoutesRespondedFromCache':[x['path'] for x in owned if x['transferSize']==0],
        'nativeEnsureStageMs':None if not en else interval(en[0]['end'],en[0]['start']),
        'latestOwnedResponseToStageReadyMs':None if not en else interval(en[0]['end'],end),
        'readyToFirstNativeRenderStartMs':None if not en else interval(first['start'],en[0]['end']),
        'directLaunchCallMs':interval(mark['launchReturned'],mark['launchStart']),
        'navToFirstNativeRenderReturnMs':interval(first['end'],nav[0]['startTime']),
        'launchToFirstNativeRenderReturnMs':interval(first['end'],mark['launchStart']),
        'firstNativeRenderCpuMs':interval(first['end'],first['start']),
        'firstNativeCpuToFollowingRafMs':interval(mark['firstFollowingRaf'],first['end']),
        'launchToNativeSettledFrameReturnMs':interval(stable['end'],mark['launchStart']),
        'settledNativeCpuToFollowingRafMs':interval(mark['stableFollowingRaf'],stable['end']),
        'nativeDrawCountToSettle':len(q['frames']),
        'firstRenderCacheNumericDelta':{k:after[k]-before[k] for k in (before.keys()&after.keys())},
    }

def run_trial(pw, out, r, n, dev):
    prefix=f'r{r}-stage-{n:02d}-{dev}'
    q={'trial':prefix,'replicate':r,'stage':n,'device':dev,'status':'HOLD',
       'chromeCache':'fresh process/context, normal browser policy, no artificial preload',
       'throttle':{'CDP_CPU':False,'CDP_network':False},'config':P['devices'][dev]}
    need(set(P['devices'][dev])<= {'viewport','device_scale_factor','is_mobile','has_touch'},'unexpected context emulation')
    s=P['stages'][str(n)]; needed={**P['core'],**s['files']}
    q['stageRoutes']={k:v for k,v in s.items() if k!='files'}
    fp=out/(prefix+'.json')
    b=pw.chromium.launch(headless=True)
    try:
        q['browser']=b.version
        need(b.version==P['chromium'],'unexpected Chromium build')
        ct=b.new_context(**P['devices'][dev],service_workers='block')
        page=ct.new_page()
        seen={}; page_errors=[]; redirects=[]; qr={}; q['browserErrors']=page_errors
        def response(z):
            k=path_of(z.url)
            if k in {SHELL,*needed}:seen.setdefault(k,[]).append(z)
        page.on('response',response)
        page.on('pageerror',lambda e:page_errors.append(str(e)))
        def key(x):return x.get('requestId')
        def request(e):
            k=path_of(e['request']['url'])
            if k not in {SHELL,*needed} and key(e) not in qr:return
            row=qr.setdefault(key(e),{})
            if e.get('redirectResponse'): redirects.append(e['request']['url'])
            row.update(path=k,type=e.get('type'),started=e['timestamp'])
        def cdp_response(e):
            if key(e) not in qr:return
            z=e['response']; headers={x.lower():v for x,v in z['headers'].items()}
            qr[key(e)].update(status=z['status'],protocol=z.get('protocol'),response=e['timestamp'],
                mimeType=z.get('mimeType'),contentEncoding=headers.get('content-encoding'),
                cacheControl=headers.get('cache-control'),age=headers.get('age'),cdnCache=headers.get('x-cache'),
                disk=z.get('fromDiskCache',False),worker=z.get('fromServiceWorker',False),
                prefetch=z.get('fromPrefetchCache',False))
        def completed(e):
            if key(e) in qr:qr[key(e)].update(finished=e['timestamp'],cdpEncodedDataLength=e['encodedDataLength'])
        def cached(e):
            if key(e) in qr:qr[key(e)]['requestServedFromCache']=True
        def failed(e):
            if key(e) in qr:qr[key(e)]['failed']=e.get('errorText')
        cdp=ct.new_cdp_session(page)
        for k,f in [('requestWillBeSent',request),('responseReceived',cdp_response),('loadingFinished',completed),
                    ('requestServedFromCache',cached),('loadingFailed',failed)]:
            cdp.on('Network.'+k,f)
        cdp.send('Network.enable')
        page.add_init_script((D/'observe.js').read_text())
        nav=page.goto(ROOT+SHELL,wait_until='domcontentloaded',timeout=45000)
        need(nav and nav.url==ROOT+SHELL and nav.status==200 and not nav.from_service_worker,'exact public HTTP shell missing')
        page.wait_for_function("""()=>document.documentElement.dataset.honroReady==='true' &&
            globalThis.HonroApp?.screen==='title' && typeof globalThis.HonroCampaignLoader?.ensureStage==='function'""",
            timeout=50000,polling=60)
        page.evaluate('id=>__honroP1Budget.start(id)',n)
        try:
            page.wait_for_function("""()=>__honroP1Budget.state.marks.stableFollowingRaf!==undefined ||
                !!HonroApp.lastError""",timeout=38000,polling=75)
        finally:
            # Keep milestones and original resource timing on failure too; no retry per run.
            q['observer']=page.evaluate('paths=>__honroP1Budget.state.firstFrame ? __honroP1Budget.read(paths) : __honroP1Budget.state',
                                       list(needed))
            q['cdp']=list(qr.values())
        q0=q['observer']; row=q0['stableFrame']
        need(not page_errors and not redirects and not q0['resourceOverflow'] and not q0['appError'],'browser errors, redirects or RT overflow')
        need(q0['map']['id']==s['id'] and q0['map']['stage']==n and not q0['map']['pending'] and
             row['pose']['stage']==n and row['pose']['phase']=='aim' and row['pose']['round']==1 and
             row['pose']['logical']==list(P['devices'][dev]['viewport'].values()) and row['pose']['dpr']==P['devices'][dev]['device_scale_factor'],
             'wrong actual physical state/map/perspective')
        resources=q0['measuredResources']; q0['stageResources']=[]
        for k,p in s['files'].items():
            found=[x for x in resources if x['path']==k and x['responseEnd']<=row['end']]
            need(len(found)==1 and found[0]['decodedBodySize']==p['bytes'] and found[0]['encodedBodySize']>0 and
                 found[0]['workerStart']==0,'stage owned RT missing, redacted, duplicate, or from SW: '+k)
            q0['stageResources'].append(found[0])
            wire=[x for x in q['cdp'] if x['path']==k]
            need(len(wire)==1 and wire[0].get('status')==200 and not wire[0].get('worker') and not wire[0].get('failed'),
                 'stage owned CDP cache/status uncertainty: '+k)
        q['metrics']=metrics(q0,s)
        q['verifiedBodies']={}
        # Read only after all timing stamps. Never do a second app request in a trial.
        for k,v in {SHELL:pin(P['nativeShell']),**needed}.items():
            matching=seen.get(k,[])
            need(len(matching)==1 and matching[0].status==200 and not matching[0].from_service_worker and
                 matching[0].url==ROOT+k and not matching[0].request.redirected_from,'wrong actual body response '+k)
            a=fact(matching[0].body())
            need(a==v,'wrong actual body bytes '+k)
            q['verifiedBodies'][k]=a
        if r==1:
            z=page.locator('#battlecanvas').screenshot(animations='allow',timeout=12000)
            valid_png=z[:8]==b'\x89PNG\r\n\x1a\n'
            dims=[int.from_bytes(z[i:i+4],'big') for i in (16,20)] if valid_png else []
            need(valid_png and all(x>0 for x in dims),'real browser canvas evidence missing')
            f=out/(prefix+'-after-measurement.png');f.write_bytes(z)
            q['screenshot']={'file':f.name,'size':dims,**fact(z),'label':'native canvas after stamps and verified bodies, not a compositor timing probe'}
        q['status']='PASS_ONE_EXACT_NATIVE_STOCK_TRIAL'
    except Exception as e:
        q['error']=repr(e);raise
    finally:
        out_json(fp,q)
        b.close()
    return q['metrics']

def summarize(trials):
    q={}
    for row in trials:
        label=f"{row['stage']:02d}-{row['device']}"
        q.setdefault(label,[]).append(row['metrics'])
    return {k:{metric:{'n':len(v),'median':statistics.median(v),'min':min(v),'max':max(v)}
               for metric in x[0] if len(v:=[r[metric] for r in x if type(r[metric]) in {float,int}])>0}
            for k,x in q.items()}

def main(out):
    authority=bind()
    out.mkdir(parents=True,exist_ok=True)
    q={'status':'HOLD','authority':authority,'environment':{'python':platform.python_version(),
        'platform':platform.platform(),'deviceScope':'CI viewport/touch emulation, not a phone'},
        'trialOrder':list(order()),'trials':[],'faults':[]}
    try:
        q['publicBefore']=identity_live()
        from playwright.sync_api import sync_playwright
        with sync_playwright() as pw:
            for r,n,dev in order():
                print(f'native stock rep{r} stage {n} {dev}',flush=True)
                try:
                    ms=run_trial(pw,out,r,n,dev)
                    q['trials'].append({'r':r,'stage':n,'device':dev,'metrics':ms})
                except Exception as e:
                    q['faults'].append({'r':r,'stage':n,'device':dev,'error':repr(e)})
                out_json(out/'SUMMARY.json',q)
        q['publicAfter']=identity_live()
        need(len(q['trials'])==len(list(order()))==36 and not q['faults'],'one or more real native trials failed')
        q['stageDeviceDistribution']=summarize(q['trials'])
        q['status']='PASS_STOCK_COLD_CHROME_BUDGET_36_TRIALS'
    finally:
        out_json(out/'SUMMARY.json',q)

if __name__=='__main__':
    if sys.argv[1:]==['--verify-binding']:
        print(json.dumps(bind()))
    else:
        main(Path(sys.argv[1]))
