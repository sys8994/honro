"""Bind live Stage26 v3 active and retained bytes to the already tested release lineage."""
import hashlib,json,os,pathlib,re,subprocess
from datetime import datetime,timezone
from urllib.request import HTTPRedirectHandler,Request,build_opener
HERE=pathlib.Path(__file__).resolve().parent
OUT=pathlib.Path(os.environ['STAGE26_PUBLIC']); OUT.mkdir(parents=True,exist_ok=True)
POLICY=json.loads((HERE/'RELEASE.json').read_bytes())
REF=json.loads((HERE/'reference.json').read_bytes())
BASE='https://sys8994.github.io/honro/'
SOURCES=REF['testedSource']['pinnedInputs']
ALLOWED={'.github/workflows/stage26-v3-public-west.yml',*(f'tools/stage26-v3-public-west/{n}' for n in ('public.py','capture.py','reference.json','RELEASE.json'))}
def git(*args): return subprocess.check_output(['git',*args])
def sha(b): return hashlib.sha256(b).hexdigest()
def measure(b):return {'bytes':len(b),'sha256':sha(b)}
def write_json(file,v):
    (OUT/file).write_text(json.dumps(v,indent=2,ensure_ascii=False)+'\n')
def rel_ok(rel):
    assert re.fullmatch(r'[A-Za-z0-9_.-]+(?:/[A-Za-z0-9_.-]+)*',rel) and all(x not in ('.','..') for x in rel.split('/')),rel
def public_get(rel,expected):
    rel_ok(rel)
    class NoRedirect(HTTPRedirectHandler):
        def redirect_request(self,*_args,**_kw): raise RuntimeError('Public URL returned redirect: '+rel)
    url=BASE+rel
    with build_opener(NoRedirect).open(Request(url,headers={'Accept-Encoding':'identity','Cache-Control':'no-cache'}),timeout=30) as req:
        assert (str(req.geturl()),req.status)==(url,200),rel
        body=req.read(expected['bytes']+1)
        got=measure(body)
        assert got==expected,(rel,got,expected)
        return body,{'url':url,'status':req.status,**got}
def guard_and_public():
    p=POLICY;b=p['release']
    for k in ('release','tree','retainedManifestGitBlob'): assert re.fullmatch('[a-f0-9]{40}',p[k] or ''),k
    assert b not in (REF['previousPublishedSource'],REF['testedSource']['commit']), 'source-only or previous deployment is not the final release'
    assert re.fullmatch('[a-f0-9]{64}',p['retainedManifestSHA256'] or '')
    assert all(type(p[k]) is int and p[k]>0 for k in ('pagesRun','pagesJob')),p
    t=p['pagesCompletedUTC']; assert re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z',t or ''),t
    assert datetime.fromisoformat(t[:-1]+'+00:00')<=datetime.now(timezone.utc)
    assert git('rev-list','--parents','-n1','HEAD').decode().split()==[os.environ['GITHUB_SHA'],b]
    assert git('rev-parse',b+'^{tree}').decode().strip()==p['tree']
    assert git('status','--porcelain','-z')==b''
    ds=git('diff','--name-status','--no-renames','-z',b,'HEAD').split(b'\0')
    assert ds.pop()==b'' and len(ds)==2*len(ALLOWED)
    assert set(zip(ds[::2],ds[1::2]))=={(b'A',f.encode()) for f in ALLOWED},ds
    assert all(git('rev-parse',b+':'+f).decode().strip()==dig for f,dig in SOURCES.items())
    manifest='web/manifest.json'
    assert git('rev-parse',b+':'+manifest).decode().strip()==p['retainedManifestGitBlob']
    raw=git('show',b+':'+manifest); assert sha(raw)==p['retainedManifestSHA256']
    manifest_json=json.loads(raw)
    active={f['path']:{'bytes':f['bytes'],'sha256':f['sha256']} for f in manifest_json['files']}
    roles=REF['roles']
    assert manifest_json['gameEntry']==roles['entry'] and manifest_json['project']==roles['campaign']
    assert roles['activeRuntime'] in manifest_json['common']
    prior=[g for g in manifest_json['publishedGenerations'] if g['sourceSha']==REF['previousPublishedSource']]
    assert len(prior)==1 and re.fullmatch(r'https://github\.com/sys8994/honro/actions/runs/\d+',prior[0]['evidence'])
    previous={f['path']:{'bytes':f['bytes'],'sha256':f['sha256']} for f in prior[0]['files']}
    assert all(active[x]==v for x,v in (REF['active']|REF['protected36']).items())
    assert all(previous[x]==v and x not in active for x,v in REF['retained'].items())
    html=git('show',b+':HONRO.html'); assert sha(html)==REF['htmlSHA256']
    needed={**REF['active'],**REF['protected36'],**REF['retained'],
            'HONRO.html':measure(html),manifest:measure(raw)}
    assert len(needed)==15
    seen={}
    receipt={'scope':'Exact current public HTTPS bytes; anonymous GET only','release':p,'http':[],'complete':False}
    try:
      for rel,want in needed.items():
        committed=git('show',b+':'+rel)
        assert measure(committed)==want,(rel,measure(committed),want)
        data,m=public_get(rel,want)
        assert data==committed,rel
        receipt['http'].append(m)
        seen[rel]=data
      assert len(receipt['http'])==len(needed)
      assert roles['entry'].encode() in seen['HONRO.html']
      assert roles['campaign'].encode() in seen[roles['entry']]
      assert ('../runtime/'+roles['activeRuntime'].rsplit('/',1)[1]).encode() in seen[roles['entry']]
      assert roles['campaign'].encode() in seen[roles['loader']]
      assert b'westBedMaterial' in seen[roles['activeRuntime']]
      campaign=json.loads(seen[roles['campaign']])
      assert [campaign['stages'][25],campaign['stageLibraries'][25]]==[roles['stageMap'],roles['chapterPacket']]
      stage36=campaign['stages'][35]
      desc36=campaign['stageLibraries'][35]
      assert stage36 in REF['protected36'] and desc36 in REF['protected36']
      desc=json.loads(seen[desc36]); assert desc['$honroJsonParts']==1
      assert len(desc['parts'])==2 and {p['path'] for p in desc['parts']}==set(REF['protected36'])-{stage36,desc36}
      parts=[seen[p['path']] for p in desc['parts']]
      assert all(measure(chunk)=={k:p[k] for k in ('bytes','sha256')} for p,chunk in zip(desc['parts'],parts))
      assert measure(b''.join(parts))=={k:desc[k] for k in ('bytes','sha256')}
      receipt['reachableStage36Descriptor']=desc36
      receipt['reachableStage26Runtime']=roles['activeRuntime']
      receipt['complete']=True
    except Exception as e:
      receipt['failure']=str(e)
      raise
    finally:
      write_json('public-source.json',receipt)
if __name__=='__main__': guard_and_public()
