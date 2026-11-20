"""Read-only verifier for a single pinned Pages release and add-only evidence branch."""
import hashlib, json, os, re, subprocess
from pathlib import Path
from urllib.request import HTTPRedirectHandler, Request, build_opener

Q = Path(__file__).resolve().parent
P = json.loads((Q / 'PINS.json').read_bytes())
LIVE = P['authority']['release']
BRANCH = 'qa/terrain-loop1-canary-2939958'
BASE = 'https://sys8994.github.io/honro/'
VIEWS = [('ordinary', 0, 0), ('overview', 0, 0), ('north', 0, -1), ('south', 0, 1),
         ('west', -1, 0), ('east', 1, 0), ('northwest', -1, -1),
         ('northeast', 1, -1), ('southwest', -1, 1), ('southeast', 1, 1)]
VIEWPORTS = [(1440, 900), (390, 844)]
FILES = {'.github/workflows/terrain-loop1-canary.yml',
         *(f'tools/terrain-loop1-canary/{name}' for name in ('source.py','capture.py','PINS.json'))}

def sha(b): return hashlib.sha256(b).hexdigest()
def facts(b): return {'bytes':len(b), 'sha256':sha(b)}
def check(name, b, want):
    assert facts(b) == want, (name, facts(b), want)
    return b
def tracked(*keys): return subprocess.check_output(['git', *keys])
def read(rel): return tracked('show', LIVE + ':' + rel)
def save(out, name, value):
    tmp = out / (name + '.tmp')
    tmp.write_text(json.dumps(value, indent=2, ensure_ascii=False)+'\n')
    tmp.replace(out / name)
def stage_paths(s):
    row = P['stages'][str(s)]
    return {row['map'], row['packet'], *row['parts']}
def required(s):
    other = set().union(*(stage_paths(int(n)) for n in P['stages'] if int(n)!=s))
    return set(P['required']) - other

def verify_graph(s, get):
    row = P['stages'][str(s)]
    mf = json.loads(check('pinned manifest',get('web/manifest.json'),P['manifest']))
    active = {x['path']:{k:x[k] for k in ('bytes','sha256')} for x in mf['files']}
    assert len(active) == len(mf['files'])
    assert len(VIEWS)==10 and len({x[0] for x in VIEWS})==10
    assert mf['gameEntry']==P['entry'] and mf['project']==P['campaign'] and mf['styles']==P['styles']
    need = required(s)
    assert all(active[path]==P['required'][path] for path in need - {'HONRO.html'})
    body = {path:check(path,get(path),P['required'][path]) for path in sorted(need)}
    shell = body['HONRO.html']
    assert shell.count(('src="'+P['entry']+'"').encode()) == 1
    entry=body[P['entry']].decode()
    direct = re.search(r'^import\{.*?\}from"\.\./(runtime/[^"]+)"',entry)
    assert direct and 'web/'+direct[1]==P['loadData']
    mods = re.search(r'const modules=\[(.*?)\]',entry)
    style = re.search(r'const stylesReady=Promise.all\(\[(.*?)\]',entry)
    assert mods and style
    assert ['web/'+p for p in re.findall(r'"\.\./(runtime/[^"]+)"',mods[1])]==P['modules']
    assert re.findall(r'"(web/styles/[^"]+)"',style[1])==P['styles']
    assert ('prefetchProject("'+P['campaign']+'")') in entry
    wrapper=[p for p in P['modules'] if p.startswith('web/runtime/campaign.')]
    assert len(wrapper)==1 and P['campaign'].encode() in body[wrapper[0]]
    c = json.loads(body[P['campaign']])
    assert c['base']==P['base'] and c['shared']==P['shared']
    assert c['stages'][s-1]==row['map'] and c['stageLibraries'][s-1]==row['packet']
    stage = json.loads(body[row['map']]);assert stage['metadata']['stageId']==s
    ownership = json.loads(materialize(row, body))
    assert isinstance(ownership,list) and ownership and all(isinstance(a.get('id'),str) for a in ownership)
    material = {a['id']:a for a in ownership}
    shared = {a['id']:a for a in json.loads(body[P['shared']])}
    assert len(material)==len(ownership)
    for key, aid in row['registeredOwners'].items():
        if not key.startswith('@'):
            es = [e for e in stage['elements'] if e['id']==key]
            assert len(es)==1 and (aid is None or aid==es[0]['assetId']), (key, es)
            aid = es[0]['assetId']
        assert aid in material or aid in shared
    if s==26:
        assert material['act3-handoff:26:kiln-foundation']['params']['westBedMaterial']==P['material26']
    return active, stage, facts(materialize(row,body))

def materialize(row, data):
    packet = data[row['packet']]
    if not row['parts']: return packet
    d=json.loads(packet);assert d['$honroJsonParts']==1
    assert [r['path'] for r in d['parts']]==row['parts']
    all_bytes=b''.join(check(r['path'],data[r['path']],{k:r[k] for k in ('bytes','sha256')}) for r in d['parts'])
    assert row['aggregate']=={k:d[k] for k in ('bytes','sha256')}
    return check('ordered aggregate',all_bytes,row['aggregate'])

def scope():
    head=os.environ['GITHUB_SHA']
    assert tracked('rev-list','--parents','-n1','HEAD').decode().split()==[head,LIVE]
    assert os.environ['GITHUB_REF']=='refs/heads/'+BRANCH
    assert tracked('rev-parse', LIVE+'^{tree}').decode().strip()==P['authority']['tree']
    assert tracked('rev-parse', LIVE+':web/manifest.json').decode().strip()==P['authority']['retainedManifestGitBlob']
    assert tracked('status','--porcelain=v1','-z')==b''
    assert set(tracked('diff','--name-status','--no-renames',LIVE,head).decode().splitlines())=={'A\t'+v for v in FILES}

class DirectOnly(HTTPRedirectHandler):
    def redirect_request(self, *a, **kw): raise RuntimeError('Unexpected Pages redirect')

def main(s, out):
    out.mkdir(parents=True, exist_ok=True)
    try:
        scope()
        _, stage, aggregate=verify_graph(s,read)
        url=BASE+'web/manifest.json'; req=Request(url,headers={'Accept-Encoding':'identity','Cache-Control':'no-cache'})
        with build_opener(DirectOnly).open(req,timeout=30) as r:
            assert r.geturl()==url and r.status==200
            ref=check('public manifest',r.read(P['manifest']['bytes']+1),P['manifest'])
        save(out,'public-source.json',{'stage':s,'authority':P['authority'],'verified':True,
                    'manifestHTTP':{'url':url,'status':200,**facts(ref)},
                    'required':{k:P['required'][k] for k in sorted(required(s))},'aggregate':aggregate,
                    'mapId':stage['id']})
    except Exception as exc:
        save(out,'public-source.json',{'stage':s,'authority':P['authority'],'verified':False,'error':repr(exc)})
        raise

if __name__=='__main__':
    main(int(os.environ['AUDIT_STAGE']), Path(os.environ['AUDIT_OUT']))
