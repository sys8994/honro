"""Read-only verifier for a single pinned Pages release and add-only evidence branch."""
import hashlib, json, math, os, re, subprocess
from pathlib import Path
RUNTIME_SOURCE_ROWS=[['renderer', '25c34f4a8c246c543389a472eb1746e6e226da88', 90630], ['art-dark', '700bedd1e573d7491dca3082d824556a1eaa7286', 48508], ['terrain-skirt', '003feabd319d958bcf2152cf5716d8663404b2f9', 5832], ['environment-art', '65482f3556ee3a46949aa23c9e8e99abfd061a0b', 7685], ['map-art-polish', '3a89971bafc0c5025943c84363f702e8fbe453bd', 20643], ['monster-vector', '2d8e5d00cbd0726752c8e52aca0e3947e80baa2a', 9546], ['monster-scale-art', '17ca025805b5515df50594796aa606553a859e9a', 2716], ['actor-vector', 'e1bd48e667dd3a22833f8387790198ac97fb0ac2', 4379], ['act23-v4-ch21-art', '741a7242f6c177ee411008e6607bdde1bfd75fe2', 3130], ['elements', 'bc1fca255d60f3d19597d401b0bff491c564bbd2', 7866], ['environment-renderer', '23ccae70d952cff0f73175eed1b48b57651461eb', 20883], ['time-of-day', '0703b87f0c5e28695c642d9d1ed70f8ec76fbee6', 7693], ['cave-enclosure', 'ec3fddb757a352fc4a690031400850ddb110eabc', 17887], ['act2-spatial-art', 'f1d4b93c44d657ed48df03d11e648337a9f9a49b', 31620], ['stage11-landscape-art', '543441082f4c209596bf17ed5b5bd96987489aa9', 17107], ['keeper-ritual-art', 'dcef56699245df5fbbcb89d4cb2460ca3fa26801', 6123], ['act2-art', '3e275deb1e8c4691fffc9bc0b152e2dbb709acec', 18766], ['act3-art', '39e90c51ea6196ee953ca707dca6247f66b18b25', 5477], ['act1-spatial-art', '79b99ffc88927885dae8a89b08aaf28e3832b584', 27514], ['terrain-readability', '5c3b3cd4df6fcb383a77bd6a8b21cbb90dd4ca04', 5059], ['geology-art', '9681248d0718b300e72af06b5f3ae6dc41abcccb', 6012], ['geology-rear-support', '0992149eb4f4c67bdc0c2367249e981031d869d5', 1257], ['stage2-layered-road-art', 'e762860bbd51c641ec59a3f3d4f2fa48f3681310', 3113], ['stage18-bell-art', 'f2243593673f9cafecb6a17ffc711f9e31a00e09', 11571], ['stage30-ferry-art', 'ac485fafd6df450423a56e475a423397e9ec1da3', 12229]]

from urllib.request import HTTPRedirectHandler, Request, build_opener

Q = Path(__file__).resolve().parent
P = json.loads((Q / 'PINS.json').read_bytes())
LIVE = P['authority']['release']
B_PROOF = json.loads((Q/'B-native-44844285051.json').read_bytes())
B_MANIFEST={'bytes':6095000,'sha256':'4a8ca6ebc400b6927ebd50a1e9901381ae4f1cd57cacf0d68772a7c3a945a379'}
B_ROOT=Path(os.environ['AUDIT_B']).resolve()
BRANCH = 'qa/terrain-loop1-act2-gap-2939958'
BASE='http://127.0.0.1:'+os.environ['AUDIT_PORT']+'/'
ROOT=Path(os.environ['AUDIT_TREE']).resolve()
ARM=os.environ['AUDIT_ARM'];assert ARM in 'BV' and len(ARM)==1
VIEWS = [('ordinary', 0, 0), ('overview', 0, 0), ('north', 0, -1), ('south', 0, 1),
         ('west', -1, 0), ('east', 1, 0), ('northwest', -1, -1),
         ('northeast', 1, -1), ('southwest', -1, 1), ('southeast', 1, 1), ('ground-detail', 0, 0)]
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
def read(rel): return (ROOT/rel).read_bytes()
def save(out, name, value):
    tmp = out / (name + '.tmp')
    tmp.write_text(json.dumps(value, indent=2, ensure_ascii=False)+'\n')
    tmp.replace(out / name)
def stage_paths(s):
    row = P['stages'][str(s)]
    return {row['map'], row['packet'], *row['parts']}
def required(s):
    return set(P['baseLeaves'])|stage_paths(s)

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
    assert len(VIEWS)==11 and len({x[0] for x in VIEWS})==11
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
    n=P['overrides']; plan=row['compact']
    assert n['stage11'].encode() in body[n['stage11Loader']]
    assert n['act2Descriptor'].encode() in body[n['act2Loader']]
    assert b'HonroStage11Compact,HonroAct2Compact' in body[wrapper[0]]
    assert json.loads(body[n['phaseStages']])==list(range(12,21))
    assert json.loads(body[n['bgmRegistry']])==n['registeredMedia']
    descriptor=json.loads(body[n['act2Descriptor']])
    assert descriptor['$honroJsonParts']==1 and [x['path']for x in descriptor['parts']]==n['act2Parts']
    assert {k:descriptor[k]for k in ('bytes','sha256')}==n['act2Aggregate']
    override_seed=check('active compact Act2 ordered aggregate',b''.join(
       check(f['path'],body[f['path']],{k:f[k]for k in ('bytes','sha256')})
       for f in descriptor['parts']),n['act2Aggregate'])
    active_overrides=json.loads(override_seed);assert sorted(map(int,active_overrides))==list(range(12,21))
    compact=json.loads(body[n['stage11']]) if s==11 else active_overrides[str(s)]
    orig=compact['source']; front=compact['stage']; compact_assets={a['id']:a for a in compact['assets']}
    assert all(stage.get(k)==orig.get(k) for k in ('id','metadata','width','height','playBounds','terrainBounds'))
    assert sorted(k for k in stage.keys()|orig.keys() if stage.get(k)!=orig.get(k))==plan['prefixAuthorFields']
    assert front['id']==stage['id'] and front['metadata']['stageId']==s
    assert (front['width'],front['height'],front['metadata']['compactStatus'],compact['mapRevision'])==(
        plan['width'],plan['height'],plan['status'],plan['revision'])
    rows={}
    for eid,aid in plan['ownerIds'].items():
        es=[e for e in front['elements'] if e['id']==eid]
        assert len(es)==1 and es[0]['assetId']==aid
        if eid in plan['retainedOwners']:
            assert aid not in compact_assets and (aid in shared or aid in material)
            a=material.get(aid,shared.get(aid))
        else:
            assert aid in compact_assets and aid not in shared and aid not in material
            a=compact_assets[aid]
        assert a.get('renderer')!='landmark' and a.get('vector')
        el=es[0]
        rows[eid]={'assetId':aid,'origin':'retained packet/shared' if eid in plan['retainedOwners'] else 'active compact override',
                   'authored':{k:el.get(k) for k in ('x','y','scale','rotation','layer','snap')},
                   'bounds':a.get('bounds')}
    assert rows
    start=[u for u in front['units'] if u['id']==plan['spawnId']]
    assert len(start)==1 and [start[0]['x'],start[0]['y']]==plan['spawn']
    sig=facts(packed)
    summary={'encoding':row['encoding'],'decodedLocalOwners':len(material),'decodedSharedOwners':len(shared),
        'ownerSelection':'definitive active compact authored/compiled/renderer witnesses','selectedOwners':rows,
        'pinnedEmptyLocalBundle':empty,'legacyOverrideReferences':P['compatibility'],
        'mapRevision':stage['metadata'],'activeCompact':plan,'activeCompactAggregate':n['act2Aggregate']}
    return active, stage, sig, summary

def ordinary_pose(stage,row):
    assert stage['metadata']['stageId'] in (11,12,13,14,15,16,17,18,20)
    return row['ordinary'],'explicit active compact layout, not raw pre-author stage'

def media_evidence(path, method, kind, status, req_range, content_range, content_length):
    allowed={'assets/bgm/main.mp3',*(f'assets/bgm/battle-{i}.mp3' for i in range(1,5))}
    assert path in allowed and path in P['overrides']['registeredMedia'] and method=='GET' and kind=='media'
    if status==200:
        # Native Python localhost file server does not implement Range.
        # The actual public Stage15 receipt pinned both complete media lengths.
        exact={'assets/bgm/main.mp3':4741261,'assets/bgm/battle-4.mp3':4269672}
        assert not content_range and content_length==str((ROOT/path).stat().st_size)
        if path in exact: assert int(content_length)==exact[path]
        return {'path':path,'status':status,'contentLength':int(content_length),'notTerrainIntegrity':True}
    assert status==206
    wanted=re.fullmatch(r'bytes=(0|[1-9]\d*)-((?:0|[1-9]\d*)?)',req_range or '')
    got=re.fullmatch(r'bytes (0|[1-9]\d*)-(0|[1-9]\d*)/([1-9]\d*)',content_range or '')
    assert wanted and got,('invalid media Range/Content-Range',req_range,content_range)
    lo,hi,total=map(int,got.groups())
    requested_end=wanted[2]
    assert lo==int(wanted[1]) and lo<=hi<total
    if requested_end:
        assert hi==min(int(requested_end),total-1)
    if content_length is not None:
        assert re.fullmatch(r'[1-9]\d*',content_length) and int(content_length)==hi-lo+1
    return {'path':path,'status':status,'range':req_range,'contentRange':content_range,
          'contentLength':content_length,'notTerrainIntegrity':True}

def materialize(row, data):
    packet = data[row['packet']]
    if not row['parts']: return packet
    d=json.loads(packet);assert d['$honroJsonParts']==1
    assert [r['path'] for r in d['parts']]==row['parts']
    all_bytes=b''.join(check(r['path'],data[r['path']],{k:r[k] for k in ('bytes','sha256')}) for r in d['parts'])
    assert row['aggregate']=={k:d[k] for k in ('bytes','sha256')}
    return check('ordered aggregate',all_bytes,row['aggregate'])



def verify_repack(live, change):
    """Exact signed B16 bytes from stock; then independently rebuild all four chunks."""
    from patch import gitsha
    read_b=lambda p:(B_ROOT/p).read_bytes()
    OLD15='web/runtime/ordered-common-15.3dd35880565c92f2.js'
    OLD16='web/runtime/ordered-common-16.8c8322e8250bb868.js'
    NEW15='web/runtime/ordered-common-15.aa95124786fcca35.js'
    NEW16='web/runtime/ordered-common-16.c094392d4ee992d9.js'
    assert change[(OLD15,NEW15)] and change[(OLD16,NEW16)]
    a15,a16=(check(r,(live/r).read_bytes(),ALL_PINS[r])for r in (OLD15,OLD16))
    b15,b16=(check(r,read_b(r),change[(o,r)])for o,r in ((OLD15,NEW15),(OLD16,NEW16)))
    assert facts(b16)=={'bytes':177300,'sha256':'c094392d4ee992d95fda1a5d8d50835a93ef8c9095962b1f10e4d34b3aec3b21'}
    header=b'import{yieldIfNeeded}from"./load-data.248fb3aada6f16bb.js";'
    sep=b'await yieldIfNeeded();'
    def split(raw,num):
        assert raw.startswith(header) and raw.endswith(sep+b'\n')
        parts=raw[len(header):-1].split(sep)
        assert parts[-1]==b'' and len(parts)==num+1 and all(p.startswith(b'(()=>{') and p.endswith(b'})();') for p in parts[:-1])
        return parts[:-1]
    p15,p16,q15,q16=(split(raw,n) for raw,n in ((a15,9),(a16,15),(b15,7),(b16,17)))
    assert q16==p15[7:]+p16 and q15[1:]==p15[1:7] and q15[0]!=p15[0]
    assert b16==header+sep.join(p15[7:]+p16)+sep+b'\n'
    sym=b'_stage15NorthQaTiles'
    assert all(sym not in z for z in (a15,a16,b16))
    assert q15[0].count(sym)==2 and sum(i.count(sym) for i in q15)==2
    files=[]
    for name,want,size in RUNTIME_SOURCE_ROWS:
        rel='shared/runtime/'+name+'.js'
        x=(live/rel).read_bytes(); y=read_b(rel)
        assert gitsha(x)==want and len(x.replace(b'\r\n',b'\n'))==size,rel
        if name!='renderer':assert x==y,rel
        else:assert gitsha(y)=='13995f7a9c56912e74917dcd3454477a8cfbb05d'
        files.append({'name':rel,'A':x.decode().replace('\r\n','\n'),'B':y.decode().replace('\r\n','\n')})
    weight=lambda arm,lo,hi:sum(len(x[arm].encode())for x in files[lo:hi])
    limit=192*1024
    counts=[[weight('A',0,9),weight('A',0,10)],[weight('B',0,7),weight('B',0,8)],
            [weight('A',9,24),weight('A',9,25)],[weight('B',7,24),weight('B',7,25)]]
    assert counts==[[193069,200935],[193985,198364],[187948,200177],[195457,207686]]
    assert all(lo<=limit<hi for lo,hi in counts)
    # Compiler uses no compression/mangling and comments disabled. Minifying full
    # raw ordered source (not just the isolated minified segments) must match both.
    js=r"""
      import {readFileSync} from 'node:fs';
      import {createHash} from 'node:crypto';
      import {minify} from 'terser';
      if(JSON.parse(readFileSync('node_modules/terser/package.json')).version!=='5.51.2')throw Error('not locked Terser');
      const f=JSON.parse(readFileSync(0,'utf8'));
      const out=[];
      for(const [arm,lo,hi] of [['A',0,9],['A',9,24],['B',0,7],['B',7,24]]){
        const input='import {yieldIfNeeded} from "./load-data.248fb3aada6f16bb.js";\n'+
          f.slice(lo,hi).map(x=>'// '+x.name+'\n(()=>{\n\'use strict\';\n'+x[arm]+'\n})();\nawait yieldIfNeeded();\n').join('');
        const bytes=Buffer.from((await minify(input,{module:true,compress:false,mangle:false,format:{comments:false}})).code+'\n');
        out.push({bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
      }
      process.stdout.write(JSON.stringify(out));
    """
    reproduced=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],
                         input=json.dumps(files).encode(),cwd=live))
    assert reproduced==[facts(x)for x in (a15,a16,b15,b16)],reproduced
    return {'limit':limit,'beforeAndNextBytes':counts,
            'movedUnchanged':['shared/runtime/actor-vector.js','shared/runtime/act23-v4-ch21-art.js'],
            'fullSiblingSHA256':facts(b16)['sha256'],'lockedCompilerReplay':reproduced,
            'sourceSiblingModulesExact':True}

def check_active_manifest(before,after,transport):
    # A semantic dependency rewrite must never rewrite archived immutable rows.
    retained={'previousFiles','previousGenerations','publishedRetention','publishedGenerations'}
    assert before.keys()==after.keys() and retained<=before.keys()
    def norm(x):
        if type(x)==str:return transport(x.encode()).decode()
        if type(x)==list:return [norm(v)for v in x]
        if type(x)==dict:return {k:norm(v)for k,v in x.items()}
        return x
    subset=lambda m:{k:v for k,v in m.items()if k not in retained|{'files'}}
    a,b=norm(subset(before)),subset(after)
    assert a==b,('active manifest dependency mismatch',[k for k in a if a[k]!=b[k]])
    for key in ('publishedRetention','publishedGenerations'):
        assert before[key]==after[key],('published history or policy changed',key)

def verify_retention(live,broot,froot):
    from patch import gitsha
    check('unaltered public worktree manifest',(live/'web/manifest.json').read_bytes(),
          {'bytes':6421884,'sha256':'cc22d45754173a212ab3ce05d7bc5b3faf211c13e7ad5ba08f252f8e10f56304'})
    helper='shared/web-retention.mjs'
    content=(live/helper).read_bytes()
    assert gitsha(content)=='16687b0fc38e432a7d66a015ddf3ebe744163a06'
    assert all((root/helper).read_bytes()==content for root in (broot,froot))
    # Independent replay of signed compiler retention at a single clock. Any
    # expiry between builds and this check must fail closed instead of waiving it.
    js=r"""
      import {readFileSync} from 'node:fs';
      import {createHash} from 'node:crypto';
      import {pathToFileURL} from 'node:url';
      import path from 'node:path';
      import assert from 'node:assert/strict';
      const roots=process.argv.slice(1);
      assert.equal(roots.length,3);
      const [stock,b,f]=roots;
      const read=(root,rel)=>readFileSync(path.join(root,rel));
      const manifest=root=>JSON.parse(read(root,'web/manifest.json'));
      const previous=manifest(stock);
      const {planWebAssetRetention,selectPublishedGenerations,publishedRetention,validateAsset}=
        await import(pathToFileURL(path.join(stock,'shared/web-retention.mjs')).href);
      const now=Date.now(), witness=[];
      const published=selectPublishedGenerations(previous.publishedGenerations,{now});
      for(const root of [b,f]){
        const actual=manifest(root);
        const replay=planWebAssetRetention(previous,actual.files,{now});
        assert.deepEqual(actual.publishedRetention,publishedRetention);
        assert.deepEqual(actual.publishedGenerations,published);
        assert.deepEqual(actual.previousFiles,replay.previousFiles);
        assert.deepEqual(actual.previousGenerations,replay.previousGenerations);
        const ret=new Map();
        for(const entry of [...replay.previousFiles,...published.flatMap(g=>g.files)]){
          validateAsset(entry);
          if(ret.has(entry.path)){assert.deepEqual(ret.get(entry.path),entry);continue;}
          const bytes=read(root,entry.path);
          assert.equal(bytes.length,entry.bytes,entry.path);
          assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256,entry.path);
          ret.set(entry.path,entry);
        }
        witness.push({retainedBytes:[...ret.values()].reduce((a,r)=>a+r.bytes,0),
            retainedFiles:ret.size,previousFiles:replay.previousFiles.length,
            previousGenerations:replay.previousGenerations.length});
      }
      process.stdout.write(JSON.stringify({now:new Date(now).toISOString(),bothExact:witness,
        publishedGenerations:published.length}));
    """
    return json.loads(subprocess.check_output(['node','--input-type=module','-e',js,str(live),str(broot),str(froot)]))

def build_context():
    from patch import OLD,SOURCE,TAG,gitsha,patch
    live=Path(os.environ['AUDIT_A']).resolve()
    assert (ARM=='B')==(ROOT==B_ROOT) and ROOT!=live!=B_ROOT
    base_renderer=(live/SOURCE).read_bytes()
    assert gitsha(base_renderer)==OLD
    assert (ROOT/SOURCE).read_bytes()==(B_ROOT/SOURCE).read_bytes()==patch(base_renderer)
    signed=tracked('show', LIVE+':web/manifest.json')
    check('exact published source manifest',signed,P['manifest'])
    current=check('signed exact B build manifest',(B_ROOT/'web/manifest.json').read_bytes(),B_MANIFEST)
    def files(raw):
        return {f['path']:{k:f[k]for k in ('bytes','sha256')}for f in json.loads(raw)['files']}
    before,after=files(signed),files(current)
    for k in before.keys()&after.keys():assert before[k]==after[k]
    assert len(before)==len(after)==809
    m=json.loads(current)
    old=P['entry']; oldmods=P['modules']
    assert m['project']==P['campaign']
    if True:  # Verify exact B reference before examining any F derivative.
        cats=lambda items:{re.sub(r'\.[0-9a-f]{16}\.', '.HASH.', k):k for k in items}
        removed,added=cats(before.keys()-after.keys()),cats(after.keys()-before.keys())
        predicted={
            'web/runtime/ordered-common-15.HASH.js':'web/runtime/ordered-common-15.aa95124786fcca35.js',
            'web/runtime/ordered-common-16.HASH.js':'web/runtime/ordered-common-16.c094392d4ee992d9.js',
            'web/entries/game.HASH.js':'web/entries/game.5570eaacc80849a9.js',
            'web/entries/game.HASH.html':'web/entries/game.6f34a78f22a011e5.html',
            'web/entries/workshop.HASH.js':'web/entries/workshop.306e71ef534a5c99.js'}
        assert added==predicted and set(removed)==set(predicted) and len(before.keys()-after.keys())==5,(removed,added)
        assert all(after[x]['sha256'][:16]==x.split('.')[-2] and facts((B_ROOT/x).read_bytes())==after[x] for x in added.values())
        assert old==removed['web/entries/game.HASH.js'] and m['gameEntry']==added['web/entries/game.HASH.js']
        replacements={removed[k]:added[k] for k in predicted}
        newrt={k:v for k,v in replacements.items()if k in oldmods}
        assert len(newrt)==2 and all(v in m['common']for v in newrt.values())
        repack=verify_repack(live,{(k,v):after[v]for k,v in newrt.items()})
        P['entry']=m['gameEntry']; P['modules']=[newrt.get(x,x)for x in oldmods]
        for outp,inp in {old:m['gameEntry'],**newrt}.items():
            ALL_PINS.pop(outp); P['baseLeaves'].pop(outp)
            ALL_PINS[inp]=P['baseLeaves'][inp]=after[inp]
        ALL_PINS['HONRO.html']=P['baseLeaves']['HONRO.html']=facts((B_ROOT/'HONRO.html').read_bytes())
    P['manifest']=facts(current)
    b_receipt={'generatedManifest':P['manifest'],'repack':repack,'publishedAtlasCompared':True}
    from floor_asset import PACKAGE,PACK_BLOB,OUT_BLOB,OUT_SHA,make,verify,outer
    compact=(live/PACKAGE).read_bytes()
    assert gitsha(compact)==PACK_BLOB and (B_ROOT/PACKAGE).read_bytes()==compact
    if ARM=='B':return {**b_receipt,'arm':ARM,'vExactOuterOnly':False}
    candidate=make(compact)
    assert gitsha(candidate)==OUT_BLOB and sha(candidate)==OUT_SHA
    assert read(PACKAGE)==candidate

    # Content-addressed graph edge, not a wildcard: only the compact data path
    # and the exact prior referring programs may change names or byte strings.
    n=P['overrides']; original_path=n['act2Descriptor']; original_loader=n['act2Loader']
    actual=read('web/manifest.json')
    bf,ff=after,files(actual)
    for k in bf.keys()&ff.keys():assert bf[k]==ff[k],k
    normalize=lambda p:re.sub(r'\.[0-9a-f]{16}\.', '.HASH.', p)
    prev,new={normalize(x):x for x in bf.keys()-ff.keys()},{normalize(x):x for x in ff.keys()-bf.keys()}
    mandatory={normalize(original_path),normalize(original_loader),'web/entries/game.HASH.js',
               'web/entries/game.HASH.html','web/entries/workshop.HASH.js'}
    optional={normalize(x)for x in n['act2Parts']}
    assert set(prev)==set(new) and len(prev)==len(bf.keys()-ff.keys())==len(ff.keys()-bf.keys())
    assert mandatory<=set(new)<=mandatory|optional and set(new)&optional,(prev,new)
    r={prev[k]:new[k]for k in new}
    h=lambda p:check(p,read(p),ff[p])
    b=lambda p:check(p,(B_ROOT/p).read_bytes(),bf[p])
    for p in r.values():
        assert ff[p]['sha256'][:16]==p.split('.')[-2];h(p)
    def expand(loader_path,read_bytes):
        d=json.loads(read_bytes(loader_path))
        assert d['$honroJsonParts']==1 and len(d['parts'])==2
        j=b''.join(check(x['path'],read_bytes(x['path']),{k:x[k]for k in ('bytes','sha256')}) for x in d['parts'])
        assert len(j)==d['bytes'] and sha(j)==d['sha256']
        data=json.loads(j)
        assert sorted(map(int,data))==list(range(12,21))
        return d,data
    oldd,oldact=expand(original_path,b)
    newd,newact=expand(r[original_path],h)
    assert [r.get(p,p)for p in n['act2Parts']]==[x['path'] for x in newd['parts']]
    rawB,rawV=json.loads(compact),json.loads(candidate)
    assert oldact['15']['stage']==rawB['stage']==newact['15']['stage']==rawV['stage']
    c=verify(rawB,rawV)
    from ledger import check_ledgers,compiled,verify_compiled
    migrated=check_ledgers(live,B_ROOT,ROOT)
    expectB,expectV=compiled(B_ROOT,'B'),compiled(ROOT,'V')
    assert oldact['15']==expectB['pack'] and newact['15']==expectV['pack']
    verify_compiled(oldact['15'],newact['15'],rawV)
    c.update({'ledgerOnlySignedDisplacedOriginalPaths':True,
              'ledgerTargetGitBlob':migrated,'stockCompiledOuterVectorSHA':expectB['after'],
              'v3CompiledOuterVectorSHA':expectV['after'],'originalOptimizedPathsByteIdentical':True})
    assert {k:v for k,v in oldact.items()if k!='15'}=={k:v for k,v in newact.items()if k!='15'}

    def relrefs(mapping):
        refs=dict(mapping)
        for p,q in mapping.items():
            refs[p.split('/')[-1]]=q.split('/')[-1]
        return refs
    refs=relrefs(r)
    def transport(data):
        # Single lexical substitution pass over prior whole content, never a parsed re-emit.
        repl={k.encode():v.encode()for k,v in refs.items()}
        return re.sub(b'|'.join(re.escape(k)for k in sorted(repl,key=len,reverse=True)),lambda m:repl[m[0]],data)
    for p,q in r.items():
        if normalize(p) in mandatory-{normalize(original_path)}:
            assert transport(b(p))==h(q),(p,q,'non pointer loader/entry change')
    assert transport((B_ROOT/'HONRO.html').read_bytes())==read('HONRO.html')
    m,g=json.loads(current),json.loads(actual)
    check_active_manifest(m,g,transport)
    retention=verify_retention(live,B_ROOT,ROOT)
    assert P['entry'] in r
    P['entry']=r[P['entry']];P['modules']=[r.get(x,x)for x in P['modules']]
    for outp,inp in r.items():
        if outp not in ALL_PINS:continue
        ALL_PINS.pop(outp);P['baseLeaves'].pop(outp);ALL_PINS[inp]=P['baseLeaves'][inp]=ff[inp]
    ALL_PINS['HONRO.html']=P['baseLeaves']['HONRO.html']=facts(read('HONRO.html'))
    n['act2Loader']=r[original_loader];n['act2Descriptor']=r[original_path]
    n['act2Parts']=[x['path']for x in newd['parts']]
    n['act2Aggregate']={k:newd[k]for k in ('bytes','sha256')}
    P['manifest']=facts(actual)
    return {**b_receipt,'arm':ARM,'vExactOuterOnly':True,'replacedPaths':r,
            'compiledSiblingCompactPackagesExact':True,'fManifest':P['manifest'],'retentionReplay':retention,**c}

BUILD=build_context()

def main(s,out):
    assert s==15
    out.mkdir(exist_ok=True,parents=True)
    _,stage,aggregate,summary=verify_graph(s,read)
    save(out,'public-source.json',{'stage':s,'authority':P['authority'],'verified':True,'arm':ARM,
        'scope':'Disposable normal localhost built source; not deployed','build':BUILD,
        'aggregate':aggregate,'stageInputs':summary,'mapId':stage['id']})
if __name__=='__main__':main(int(os.environ['AUDIT_STAGE']),Path(os.environ['AUDIT_OUT']))
