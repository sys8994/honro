"""Read-only verifier for a single pinned Pages release and add-only evidence branch."""
import hashlib, json, math, os, re, subprocess
from pathlib import Path
from urllib.request import HTTPRedirectHandler, Request, build_opener

Q = Path(__file__).resolve().parent
P = json.loads((Q / 'PINS.json').read_bytes())
LIVE = P['authority']['release']
BRANCH = 'qa/terrain-loop1-remaining-2939958'
BASE = 'https://sys8994.github.io/honro/'
VIEWS = [('ordinary', 0, 0), ('overview', 0, 0), ('north', 0, -1), ('south', 0, 1),
         ('west', -1, 0), ('east', 1, 0), ('northwest', -1, -1),
         ('northeast', 1, -1), ('southwest', -1, 1), ('southeast', 1, 1)]
VIEWPORTS = [(1440, 900), (390, 844)]
OPTIONAL_MODULES = {
    'skill-preview': {'file':'web/runtime/shared-runtime-skill-preview.0873a72c3e01c88c.js','global':'HonroSkillPreview'},
    'training': {'file':'web/runtime/shared-runtime-training.84c5e6034d5b7c0b.js','global':'HonroTraining'}
}
FILES = {'.github/workflows/terrain-loop1-remaining.yml',
         *(f'tools/terrain-loop1-remaining/{name}' for name in ('source.py','capture.py','batch.py','PINS.json'))}
ALL_PINS={**P['baseLeaves'],**P['leaves']}

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
    return set(P['baseLeaves'])|stage_paths(s)

def matrix_integrity():
    stage_ids=[s for stages in P['groups'].values() for s in stages]
    assert len(P['groups'])==10 and all(1<=len(g)<=5 for g in P['groups'].values())
    assert len(set(stage_ids))==len(stage_ids)==47
    assert {str(x) for x in stage_ids}==set(P['stages'])
    reuse=set(P['reused']['stages'])
    assert reuse=={'1','26','38'} and not (reuse&set(P['stages']))
    assert set(P['stages'])|reuse=={str(i)for i in range(1,51)}
    key=lambda s,w,h,n:f's{s:02d}-{w}x{h}-{n}'
    for s,r in P['reused']['stages'].items():
        assert set(r['frameHashes'])=={key(int(s),w,h,n)for w,h in VIEWPORTS for n,_,_ in VIEWS}
        assert all(re.fullmatch(r'[0-9a-f]{64}',h)for h in r['frameHashes'].values())
    assert len({key(s,w,h,n)for s in stage_ids for w,h in VIEWPORTS for n,_,_ in VIEWS})==940

def required_observed(s):
    # The pinned entry lists these in its generated full module list, but its
    # verified normal-mode filter defers exactly these two. Still Git/body pinned.
    return required(s) - {r['file'] for r in OPTIONAL_MODULES.values()}

def decode_asset_bundle(data, encoding, allow_pinned_empty=False):
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
    if type(result) is not list or (not result and not allow_pinned_empty) or not all(type(a) is dict and type(a.get('id')) is str for a in result):
        raise ValueError('Invalid decoded campaign asset bundle')
    return result

def verify_graph(s, get):
    row = P['stages'][str(s)]
    mf = json.loads(check('pinned manifest',get('web/manifest.json'),P['manifest']))
    active = {x['path']:{k:x[k] for k in ('bytes','sha256')} for x in mf['files']}
    assert len(active) == len(mf['files'])
    assert len(VIEWS)==10 and len({x[0] for x in VIEWS})==10
    assert mf['gameEntry']==P['entry'] and mf['project']==P['campaign'] and mf['styles']==P['styles']
    assert mf['optionalModules']==OPTIONAL_MODULES
    need = required(s)
    assert all(active[path]==ALL_PINS[path] for path in need - {'HONRO.html'})
    body = {path:check(path,get(path),ALL_PINS[path]) for path in sorted(need)}
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
    stage=json.loads(body[row['map']]); assert stage['metadata']['stageId']==s
    assert c['catalog'][s-1]['metadata']['stageId']==s
    enc=c['assetEncodings']; assert (enc['stageLibraries'][s-1],enc['shared'])==(row['encoding'],'json')
    assert not (c['assetPaths']['stages'][s-1] or c['assetPaths']['stageLibraries'][s-1]
               or c['assetPaths']['shared'] or c['assetPaths']['base'])
    # Pin compatibility references exactly, but don't activate an old save to fetch them.
    for k,v in P['compatibility'].items():
        assert c[k]==v['path'] and enc[k]==v['encoding'] and not c['assetPaths'].get(k)
        signed={x:v[x]for x in ('bytes','sha256')}
        assert active[v['path']]==signed
        check(v['path'],get(v['path']),signed)
    packed=materialize(row,body)
    empty=row['allowPinnedEmpty']
    assert empty==(s==18 and len(packed)==3 and json.loads(packed)==[])
    ownership=decode_asset_bundle(packed,row['encoding'],empty)
    shared_rows=decode_asset_bundle(body[P['shared']],enc['shared'])
    material={a['id']:a for a in ownership}
    shared={a['id']:a for a in shared_rows}
    assert len(material)==len(ownership) and len(shared)==len(shared_rows)
    explicit=row.get('registeredOwners',{})
    candidates=[]
    for el in stage['elements']:
        aid=el.get('assetId')
        if aid in material or aid in shared:
            native=str(el.get('nativeArtLayer',''))
            score=(5 if native in ('body','surface','rear','dummy') else 0)+(3 if re.search(r'body|wall|cliff|floor|support|footing|foundation',el['id'],re.I) else 0)+(1 if aid in material else 0)
            if score>=3:
                candidates.append((-score,el['id'],aid))
    selection=explicit or {n:a for _,n,a in sorted(candidates)[:3]}
    for name,aid in selection.items():
        es=[e for e in stage['elements'] if e['id']==name]
        assert len(es)==1 and es[0]['assetId']==aid and (aid in material or aid in shared)
    sig=facts(packed)
    source_summary={'encoding':row['encoding'],'decodedLocalOwners':len(material),'decodedSharedOwners':len(shared),
                    'ownerSelection':'pre-registered' if explicit else 'derived from known packet/shared body/terrain references',
                    'selectedOwners':selection,'pinnedEmptyLocalBundle':empty,
                    'legacyOverrideReferences':P['compatibility'],'mapRevision':stage['metadata']}
    return active, stage, sig, source_summary

def ordinary_pose(stage,row):
    if 'ordinary' in row: return row['ordinary'],'pinned representative near first walking area'
    friendly=[u for u in stage.get('units',[]) if u.get('side') in (0,'player') and
              all(type(u.get(k)) in (int,float) and math.isfinite(u[k]) for k in ('x','y'))]
    if friendly:
        u=friendly[0]
        return [u['x'],u['y'],.50], f'authored spawn anchor {u["id"]}'
    # For non-battle stages, state explicitly that center is not actor-contact.
    return [stage['width']/2,stage['height']/2,.50],'authored map center; no source friendly spawn'

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
        matrix_integrity()
        _, stage, aggregate, source_summary=verify_graph(s,read)
        url=BASE+'web/manifest.json'; req=Request(url,headers={'Accept-Encoding':'identity','Cache-Control':'no-cache'})
        try:
            with build_opener(DirectOnly).open(req,timeout=30) as r:
                assert r.geturl()==url and r.status==200
                ref=check('public manifest',r.read(P['manifest']['bytes']+1),P['manifest'])
        except Exception as exc:
            save(out,'public-source.json',{'authority':P['authority'],'stage':s,'verified':False,
                         'commonSourceFailure':True,'error':repr(exc)})
            raise
        save(out,'public-source.json',{'stage':s,'authority':P['authority'],'verified':True,
                    'manifestHTTP':{'url':url,'status':200,**facts(ref)},
                    'required':{k:ALL_PINS[k] for k in sorted(required(s))},'aggregate':aggregate,
                    'stageInputs':source_summary,
                    'deferredNormalModules':sorted(required(s)-required_observed(s)),
                    'mapId':stage['id']})
    except Exception as exc:
        if not (out/'public-source.json').exists():
            save(out,'public-source.json',{'stage':s,'authority':P['authority'],'verified':False,'error':repr(exc)})
        raise

if __name__=='__main__':
    main(int(os.environ['AUDIT_STAGE']), Path(os.environ['AUDIT_OUT']))
