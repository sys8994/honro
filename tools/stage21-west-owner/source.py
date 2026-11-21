"""Read-only verifier for a single pinned Pages release and add-only evidence branch."""
import hashlib, json, math, os, re, subprocess
from pathlib import Path
from urllib.request import HTTPRedirectHandler, Request, build_opener

Q = Path(__file__).resolve().parent
P = json.loads((Q / 'PINS.json').read_bytes())
LIVE = P['authority']['release']
BRANCH = 'qa/stage21-west-owner-71fb443'
BASE = 'https://sys8994.github.io/honro/'
VIEWS = [('ordinary',0,0),('west',-1,0),('east',1,0)]
VIEWPORTS = [(1440, 900), (390, 844)]
OPTIONAL_MODULES = {
    'skill-preview': {'file':'web/runtime/shared-runtime-skill-preview.0873a72c3e01c88c.js','global':'HonroSkillPreview'},
    'training': {'file':'web/runtime/shared-runtime-training.84c5e6034d5b7c0b.js','global':'HonroTraining'}
}
FILES = {'.github/workflows/stage21-west-owner.yml',
         *(f'tools/stage21-west-owner/{name}' for name in ('source.py','capture.py','PINS.json'))}

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

def required_observed(s):
    # The pinned entry lists these in its generated full module list, but its
    # verified normal-mode filter defers exactly these two. Still Git/body pinned.
    return required(s) - {r['file'] for r in OPTIONAL_MODULES.values()}

def decode_asset_bundle(data, encoding):
    """Independent JSON pool interpreter following the pinned load-data.js v1 contract."""
    value=json.loads(data)
    if encoding is None or encoding=='json':
        result=value
    else:
        if encoding!='json-pool-v1':
            raise ValueError(f'Unsupported campaign asset encoding: {encoding!r}')
        if (not isinstance(value,dict) or set(value)!={'version','nodes','root'}
            or type(value['version']) is not int or value['version']!=1 or not isinstance(value['nodes'],list)):
            raise ValueError('Invalid canonical JSON pool header')
        expanded=[]
        def ref(r):
            if r is None or type(r) is bool:
                return r
            if type(r) is list:
                if (len(r)!=1 or type(r[0]) not in (int,float) or not math.isfinite(r[0])
                    or (type(r[0]) is int and abs(r[0])>9007199254740991)):
                    raise ValueError('Invalid canonical JSON pool numeric literal')
                return r[0]
            if type(r) is not int or not 0<=r<len(expanded):
                raise ValueError('Invalid JSON pool reference (not earlier than parent)')
            return expanded[r]
        for node in value['nodes']:
            if type(node) is str:
                expanded.append(node)
                continue
            if type(node) is not list or not node or type(node[0]) is not int:
                raise ValueError('Invalid JSON pool node')
            if node[0]==0:
                expanded.append([ref(child) for child in node[1:]])
            elif node[0]==1 and len(node)%2==1:
                pairs={}
                for a,b in zip(node[1::2],node[2::2]):
                    key=ref(a)
                    if type(key) is not str or key in pairs:
                        raise ValueError('Invalid canonical JSON pool object key')
                    pairs[key]=ref(b)
                expanded.append(pairs)
            else:
                raise ValueError('Invalid JSON pool tag/arity')
        result=ref(value['root'])
    if type(result) is not list or not result or not all(type(a) is dict and type(a.get('id')) is str for a in result):
        raise ValueError('Invalid decoded campaign asset bundle')
    return result

def verify_graph(s, get):
    row = P['stages'][str(s)]
    mf = json.loads(check('pinned manifest',get('web/manifest.json'),P['manifest']))
    active = {x['path']:{k:x[k] for k in ('bytes','sha256')} for x in mf['files']}
    assert len(active) == len(mf['files'])
    assert len(VIEWS)==3 and len({x[0] for x in VIEWS})==3
    assert mf['gameEntry']==P['entry'] and mf['project']==P['campaign'] and mf['styles']==P['styles']
    assert mf['optionalModules']==OPTIONAL_MODULES
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
    assert entry[mods.end():].startswith('.filter(file=>!true||globalThis.HONRO_EMBEDDED||globalThis.HONRO_PROJECT_MODE==="full"||!Object.values(globalThis.HONRO_OPTIONAL_MODULES).some(entry=>entry.url===file));')
    assert all(r['file'] in P['modules'] and ('../runtime/'+r['file'].split('/')[-1]) in entry[:mods.start()]
               for r in OPTIONAL_MODULES.values())
    assert ['web/'+p for p in re.findall(r'"\.\./(runtime/[^"]+)"',mods[1])]==P['modules']
    assert re.findall(r'"(web/styles/[^"]+)"',style[1])==P['styles']
    assert ('prefetchProject("'+P['campaign']+'")') in entry
    wrapper=[p for p in P['modules'] if p.startswith('web/runtime/campaign.')]
    assert len(wrapper)==1 and P['campaign'].encode() in body[wrapper[0]]
    c = json.loads(body[P['campaign']])
    assert c['base']==P['base'] and c['shared']==P['shared']
    assert c['stages'][s-1]==row['map'] and c['stageLibraries'][s-1]==row['packet']
    stage = json.loads(body[row['map']]);assert stage['metadata']['stageId']==s
    encoding=c['assetEncodings']['stageLibraries'][s-1]
    assert encoding==row['encoding']=='json-pool-v1' and c['assetEncodings']['shared']=='json'
    packet=materialize(row,body)
    verify_stage(stage,packet,encoding)
    assert any(b'"eup21:foundations":{terrain:"a3-foundation",deep:3650}' in body[k] for k in P['modules'])
    assert any(b'design?.act3HandoffArt' in body[k] and b'result=[...base.filter' in body[k] for k in P['modules'])
    return active,stage,facts(packet)

def verify_stage(stage,packet,encoding):
    library=decode_asset_bundle(packet,encoding)
    assert stage['design']['act3HandoffArt']==P['owner']
    front=[u for u in library if u['id']==P['owner']]
    back=[u for u in library if u['id']==P['baseOwner']]
    assert len(front)==len(back)==1
    f,b=front[0],back[0]
    assert f['collision']==[] and f['bounds']=={'x':0,'y':2220,'w':6400,'h':1080}
    assert f['params']['semanticLayer']=='BODY' and not ('blendFace' in f['params'] or 'edgeFade' in f['params'])
    assert f['params']['contactMapping'][:2]==[[0,514,0,2810],[217,502,620,2810]]
    assert f['params']['contactMapping'][-1]==[2172,296,6400,2220]
    assert b['bounds']=={'x':0,'y':2220,'w':6400,'h':1450}
    entry_rows=[e for e in stage['elements'] if e['assetId'] in (P['owner'],P['baseOwner'])]
    assert len(entry_rows)==1 and entry_rows[0]['id']=='foundations' and entry_rows[0]['assetId']==P['baseOwner']
    floor=[t for t in stage['terrains'] if t['id']=='a3-foundation']
    assert len(floor)==1 and floor[0]['playProjection']['bounds']==stage['playBounds']
    assert floor[0]['playProjection']['start']=={'x':0,'y':2810} and stage['playBounds']['left']==0
    assert all({'x':x,'y':y} in floor[0]['points'] for x,y in [(-500,2755.3125),(0,2810),(620,2810)])
    assert not stage['materials'] and all(x['kind']=='rear-ground' for x in stage['environment']['surfaces'])

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
    assert facts(read('web/manifest.json')) == P['manifest']
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
                    'deferredNormalModules':sorted(required(s)-required_observed(s)),
                    'mapId':stage['id']})
    except Exception as exc:
        save(out,'public-source.json',{'stage':s,'authority':P['authority'],'verified':False,'error':repr(exc)})
        raise

if __name__=='__main__':
    main(int(os.environ['AUDIT_STAGE']), Path(os.environ['AUDIT_OUT']))
