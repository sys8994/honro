"""One isolated 4/5-stage batch of canonical public evidence. No writes to game, saves or repo."""
import json, os, subprocess, sys, time
from pathlib import Path
from source import LIVE, P, Q, VIEWPORTS, VIEWS, matrix_integrity, save, sha
G=os.environ['AUDIT_GROUP']; OUT=Path(os.environ['AUDIT_BATCH_OUT'])
matrix_integrity()
assert G in P['groups']
OUT.mkdir(parents=True,exist_ok=True)
plan=P['groups'][G]
receipt={'release':LIVE,'group':G,'planned':plan,'canaryReuse':P['reused']['run'],
  'scope':'New primary camera captures, not full human review, incident triage, or completed loop.',
  'stages':[],'incidents':[],'acceptedFrames':0,'verifiedPartialFrames':0,'complete':False}
deadline=time.monotonic()+1050
startup_failures=0
def save_receipt():
    save(OUT,'batch-receipt.json',receipt)
    save(OUT,'INCIDENTS.json',{'group':G,'stageCaptureIncidents':receipt['incidents'],
         'scope':'Capture/preflight incidents only. No automated terrain verdict.'})
def execute(name, s, d, timeout):
    start=time.monotonic()
    env={**os.environ,'AUDIT_STAGE':str(s),'AUDIT_OUT':str(d)}
    log=d/(name+'.log')
    with log.open('wb') as f:
        try:
            r=subprocess.run([sys.executable,str(Q/(name+'.py'))],env=env,stdout=f,stderr=subprocess.STDOUT,timeout=timeout)
            return {'returnCode':r.returncode,'seconds':round(time.monotonic()-start,3)}
        except subprocess.TimeoutExpired:
            return {'returnCode':None,'seconds':round(time.monotonic()-start,3),'timeoutLimit':timeout}

def j(path):
    return json.loads(path.read_text()) if path.exists() else {}

stop=None
for sid in plan:
    if stop or time.monotonic()+35>=deadline:
        receipt['incidents'].append({'stage':sid,'type':'not attempted','reason':stop or 'group wall-time budget'})
        save_receipt()
        continue
    d=OUT/f's{sid:02d}';d.mkdir()
    base={'stage':sid,'complete':False};receipt['stages'].append(base);save_receipt()
    base['source']=execute('source',sid,d,min(60,deadline-time.monotonic()))
    src=j(d/'public-source.json')
    p={}
    if base['source']['returnCode']!=0 or not src.get('verified'):
        error={'stage':sid,'type':'source preflight','error':src.get('error'),'process':base['source']}
        startup_failures+=1
        if src.get('commonSourceFailure'):stop='public release unavailable, mismatched, or moved during group'
    else:
        base['browser']=execute('capture',sid,d,min(245,deadline-time.monotonic()))
        p=j(d/'proof.json')
        keys={f's{sid:02d}-{w}x{h}-{tag}'for w,h in VIEWPORTS for tag,_,_ in VIEWS}
        seen=p.get('frames',[])
        base['rawFrameCount']=len(seen)
        verified=set()
        if p.get('release')==LIVE and p.get('stage')==sid:
            for f in seen:
                key=f.get('key')
                if key not in keys or f.get('png')!=key+'.png' or not f.get('phaseReceiptValidated'): continue
                file=d/f['png']
                if file.exists() and sha(file.read_bytes())==f.get('pngSHA256'): verified.add(key)
        try:
            assert base['browser']['returnCode']==0 and p.get('complete') is True
            assert p['release']==LIVE and p['stage']==sid and len(seen)==20 and {f['key'] for f in seen}==keys
            assert verified==keys
            base['complete']=True;base['acceptedFrames']=20;receipt['acceptedFrames']+=20
            startup_failures=0;save_receipt();continue
        except (AssertionError,KeyError,OSError) as exc:
            startup_failures=(startup_failures+1) if not seen else 0
            receipt['verifiedPartialFrames']+=len(verified)
            error={'stage':sid,'type':'browser capture/verifier','process':base['browser'],
                   'framesPreserved':len(seen),'missingCaptureKeys':sorted(keys-{f.get('key')for f in seen}),
                   'verifiedRetainableKeys':sorted(verified),'unverifiedKeys':sorted(keys-verified),
                   'errors':[v.get('errors',[])for v in p.get('visits',[])],'final':p.get('failure',repr(exc))}
    receipt['incidents'].append(error)
    if startup_failures>=2 and not stop:stop='two consecutive stages without verified source/any camera evidence'
    save_receipt()
receipt['complete']=not receipt['incidents'] and receipt['acceptedFrames']==20*len(plan)
save_receipt()
assert receipt['complete'],f'Incomplete {G}: {receipt["acceptedFrames"]}/{20*len(plan)}. See per-stage proof and INCIDENTS.json.'
