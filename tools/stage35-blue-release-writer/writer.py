"""Verify retained Stage35 package and prepare a detached Git commit. Never pushes."""
import hashlib, json, os, re, stat, subprocess, sys, zipfile
from datetime import datetime
from io import BytesIO
from pathlib import Path, PurePosixPath

HERE=Path(__file__).resolve().parent
TOP='sys8994/honro'
BRANCH='qa/stage35-blue-release-writer-71fb'
REF='refs/heads/release/act4-stage35-blue-20261121'
BASE='71fb443675aed659a572b722a4337212e9d2f910'
TREE='c9f11d3a7458ecfcb390e460401f4b3298395858'
PRODUCER='qa/stage35-blue-forest-retention-71fb'
WF='.github/workflows/stage35-blue-forest-retention.yml'
ANAME='honro-stage35-blue-forest-retained-source-and-generated-no-deploy'
NESTED='stage35-blue-forest-retained-source-and-generated-delta-no-deploy.zip'
RECEIPT='RETAINED-DELTA-RECEIPT.json'
MF='web/manifest.json'
SHELL={'HONRO.html','HONRO_WORKSHOP.html','index.html',MF}
EXPECT_SRC={'shared/act4-handoff-art.mjs': 'a727bd85a1b8faa1cfaf8a2b98cf3b3e0de5e7e1', 'shared/act4-stage35-bedrock-join.mjs': '830077dadd0af2a770df148cc43cf8fea3993074', 'shared/act4-stage35-rock-material.mjs': '2bedb633cc299ef1be41d2920d704e2e3a341889', 'shared/act4-stage35-side-groves.mjs': '16c0b82e59448ea82ab88b1d7af4e4abac354660', 'shared/assets/environment/campaign-far/act4-stage35-bamboo-grove.webp': '71dd4478b8f1afb5403ddaeae4b5becf7a82898d', 'shared/assets/environment/campaign-far/manifest.json': '383fb06383c9039d2ab17611d7235476d599f9ee', 'shared/build.mjs': '24f491b8253abf2e86dbabd5bc7111b701058c0a', 'shared/data/act4/handoff-art/stage35-forest-east.json': '87d8c04f6de61e7003dd448e05e4b2cd404463c8', 'shared/data/act4/handoff-art/stage35-forest-west.json': '2dc8cd7d952436f964c959a0d574ce39da13f1f4', 'shared/runtime/act4-pilot-art.js': '330fc448562e5c3e36a98a99bad158176c1e9043', 'tests/act4-stage35-bamboo-far.mjs': 'd5730b54f045f34168e3253691f6ddc012708c88', 'tests/act4-stage35-bedrock-join.mjs': '904c3d98909b1bef43abcc011835c2db7f155f85', 'tests/act4-stage35-rock-material.mjs': '21addb37204599d08eaed67b2fa4151c3ec0c935'}
SOURCE='b4ac1069f81c6265afaf98116c00f01461b00ace'
SOURCE_TREE='1806602398bf21939793d288c2bb45d86bc1fb7a'
NORMAL_HEAD='c58034e8ec035e2bbcd3d323b9268526a174d0c0'
NORMAL_TREE='1ae0d52122b9e295631d545138bf1c0a44b9d4cd'
OLD_MODIFIED=SHELL|{'shared/build.mjs','shared/act4-handoff-art.mjs',
 'shared/assets/environment/campaign-far/manifest.json','shared/runtime/act4-pilot-art.js'}
SIDE_IDS={f'act4-handoff:35:bamboo-thicket-{direction}' for direction in ('west','east')}
OLD_FAR='act4FarBambooHandoff'
NEW_FAR='act4FarBambooGrove35'
NEW_WEBP='web/graphics/honro_authored_far-images-act4FarBambooGrove35.574a1793b7bb2416.webp'
OLD_WEBP='web/graphics/honro_authored_far-images-act4FarBambooHandoff.d24a7a029b12efba.webp'
ROLES=[
 r'web/data/chapter-35-assets-part-000\.[0-9a-f]{16}\.bin',r'web/data/chapter-35-assets-part-001\.[0-9a-f]{16}\.bin',
 r'web/data/chapter-35-assets-parts\.[0-9a-f]{16}\.json',r'web/data/chapter-35\.[0-9a-f]{16}\.json',
 r'web/data/campaign\.[0-9a-f]{16}\.json',r'web/data/HONRO_AUTHORED_FAR\.[0-9a-f]{16}\.json',
 r'web/runtime/campaign\.[0-9a-f]{16}\.js',r'web/runtime/ordered-common-12\.[0-9a-f]{16}\.js',
 r'web/runtime/HONRO_AUTHORED_FAR\.[0-9a-f]{16}\.js',r'web/runtime/ordered-game-25\.[0-9a-f]{16}\.js',
 r'web/entries/game\.[0-9a-f]{16}\.js',r'web/entries/game\.[0-9a-f]{16}\.html',r'web/entries/workshop\.[0-9a-f]{16}\.js']
NORMAL_GENERATED={'HONRO.html': {'bytes': 17379, 'sha256': 'a763c1871e6470646fa3dd7577a88825098598d18ee4e67d65b97f5d731aa958'}, 'HONRO_WORKSHOP.html': {'bytes': 4011, 'sha256': 'c95a0d9e969f37f19d5c8f9978af1a34f89e9711038e2a2958a41606417afc4c'}, 'index.html': {'bytes': 17379, 'sha256': 'a763c1871e6470646fa3dd7577a88825098598d18ee4e67d65b97f5d731aa958'}, 'web/data/HONRO_AUTHORED_FAR.b014b75b5dd7973d.json': {'bytes': 5006, 'sha256': 'b014b75b5dd7973d864f372fa0c2b024aec302a175f5f1f99c0fc9dc839dbc82'}, 'web/data/campaign.324003dbe6483ac8.json': {'bytes': 54961, 'sha256': '324003dbe6483ac8a778ba250d8aa8d1c63d9149f1cb5b580e6011256006f437'}, 'web/data/chapter-35-assets-part-000.2f22959bfb690283.bin': {'bytes': 4194304, 'sha256': '2f22959bfb6902837283064b16fdd6b4d1da29617f95e82436d623b0399a8e8f'}, 'web/data/chapter-35-assets-part-001.cdc249b0d9ce1988.bin': {'bytes': 399036, 'sha256': 'cdc249b0d9ce1988d2af0275f1d426d097bb2c7ff1552b9ae6f7370647e3911e'}, 'web/data/chapter-35-assets-parts.c3f1005936b3d27e.json': {'bytes': 443, 'sha256': 'c3f1005936b3d27e97a0513cf0b2a9f8cdbe7224becf6a1a7ea179628f951870'}, 'web/data/chapter-35.f62e13d97eec5171.json': {'bytes': 30417, 'sha256': 'f62e13d97eec5171cd942683c1363c615a91297413d61cbd3da35d8b0ef0065d'}, 'web/entries/game.6d15aeb89fecafdb.js': {'bytes': 20483, 'sha256': '6d15aeb89fecafdbe5ed12ed8b10fb1c69baa060baf34591fbeef5f9eb0d0f0a'}, 'web/entries/game.abedc85b183c711f.html': {'bytes': 11318, 'sha256': 'abedc85b183c711fdf5e09c6f3e035747ea466a21a0d879efc305749d3a85330'}, 'web/entries/workshop.7816df2c88efd28c.js': {'bytes': 16706, 'sha256': '7816df2c88efd28c1c150eae14f1d49937ad8dcb3aa002dc65f2b4031013604d'}, 'web/graphics/honro_authored_far-images-act4FarBambooGrove35.574a1793b7bb2416.webp': {'bytes': 205496, 'sha256': '574a1793b7bb2416d66abd249c5c7ff851ea2072aa3204db68caa9b38d2a987b'}, 'web/manifest.json': {'bytes': 6266713, 'sha256': 'fa436a9e5f4b5b04155426d0fbb81248f5b0e3614367779de8e348f9aa9913e6'}, 'web/runtime/HONRO_AUTHORED_FAR.4cfa3ca0b38a2f24.js': {'bytes': 905, 'sha256': '4cfa3ca0b38a2f24a10017fb6d61454760dae24279b6bae34b2d6be10e932a1f'}, 'web/runtime/campaign.a4e4a1f2c263a866.js': {'bytes': 527, 'sha256': 'a4e4a1f2c263a8664156be6fd74a824061ffc18f8c2c2580e9b4fbd4123f6b19'}, 'web/runtime/ordered-common-12.538fbca4939d645e.js': {'bytes': 72225, 'sha256': '538fbca4939d645ec8be42331733cae9d01295e87c0ebcd92fb2d74d43eada65'}, 'web/runtime/ordered-game-25.baee52cf4acaf033.js': {'bytes': 25313, 'sha256': 'baee52cf4acaf03390a9cdb9f7aeeec02ac824d03ea1101336c7c78095513207'}}

def require(t,*why):
    if not t:raise SystemExit('STOP '+repr(why))
def decode(b):
    def distinct(rows):
        d={}
        for k,v in rows:
            require(k not in d,'duplicate JSON key',k)
            d[k]=v
        return d
    return json.loads(b,object_pairs_hook=distinct)
def sha(b):return hashlib.sha256(b).hexdigest()
def blob(b):return hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def hx(x,n):return type(x) is str and bool(re.fullmatch(f'[0-9a-f]{{{n}}}',x)) and set(x)!={'0'}
def pos(x):return type(x) is int and x>0
def sizepin(p,maxcap):
    return type(p) is dict and set(p)=={'bytes','sha256'} and pos(p['bytes']) and p['bytes']<=maxcap and hx(p['sha256'],64)
def exact_roles(paths):
    require(len(paths)==len(ROLES)==13 and all(sum(bool(re.fullmatch(r,k))for k in paths)==1 for r in ROLES),'unauthorized generated roles')
def load_pins():
    p=decode((HERE/'PINS.json').read_bytes())
    require(p['enabled'] is True,'not enabled; wait for independently verified retained output')
    require((p['repo'],p['base'],p['baseTree'],p['releaseRef'],p['sourceGit'])==(TOP,BASE,TREE,REF,EXPECT_SRC) and (p['source'],p['sourceTree'],p['normalAuthority']['head'],p['normalAuthority']['tree'])==(SOURCE,SOURCE_TREE,NORMAL_HEAD,NORMAL_TREE),'unexpected frozen write scope')
    n,m=p['normalAuthority'],p['manufacture']
    require(all(pos(x)for x in (m['run'],m['job'],m['outer']['id'],n['run'],n['job'])) and all(hx(x,40)for x in
     (m['head'],m['tree'],n['head'],n['tree'],p['source'],p['sourceTree'],p['priorPages']['manifestGitBlob'])),'incomplete exact run/commit authority')
    o=m['outer'];require(set(o)=={'id','bytes','sha256'} and sizepin({k:o[k]for k in ('bytes','sha256')},45<<20)
      and sizepin(m['nested'],35<<20) and sizepin(p['retainedManifest'],12<<20)
      and hx(m['receiptSHA256'],64) and hx(p['priorPages']['manifestSHA256'],64),'incomplete exact artifact byte pins')
    retention=p['retention']; require(set(retention)=={'droppedRegistryPaths','droppedPublishedSources'} and
      isinstance(retention['droppedRegistryPaths'],list) and len(retention['droppedRegistryPaths'])<=200 and
      isinstance(retention['droppedPublishedSources'],list) and len(retention['droppedPublishedSources'])<=20 and
      all(hx(v,40)for v in retention['droppedPublishedSources']) and
      all(isinstance(k,str) and re.fullmatch(r'web/(runtime|entries|data|styles|graphics|fonts)/[\w.-]+',k)for k in retention['droppedRegistryPaths']),
      'unreviewed rolling registry expiry')
    f=p['files']
    require(type(f) is dict and len(f)==31 and f.keys()==EXPECT_SRC.keys()|NORMAL_GENERATED.keys(),'expected exact 13 source and 18 generated paths')
    im=f.keys()-SHELL-EXPECT_SRC.keys()
    exact_roles(im-{NEW_WEBP});require(NEW_WEBP in im and f[MF]==p['retainedManifest'] and f[MF]!=NORMAL_GENERATED[MF] and
     n['authorizedNormalGenerated']==NORMAL_GENERATED and n['decodedApprovedPNGCount']==88 and n['run']==44887003005 and n['job']==136794336261 and
     all(f[k]==w for k,w in NORMAL_GENERATED.items() if k!=MF),'retained/normal path digest scope mismatch')
    require(all(sizepin(x,12<<20)for x in f.values()) and all(k.split('.')[-2]==f[k]['sha256'][:16]for k in im),'exact path content address invalid')
    require(bool(re.fullmatch(r'2026-11-21T\d\d:\d\d:\d\dZ',p['commitDate'] or '')),'unauthorized commit date')
    datetime.fromisoformat(p['commitDate'])
    return p

def safe(z,cap,inner=False):
    seen=set();total=0
    for e in z.infolist():
        n=PurePosixPath(e.filename);mode=e.external_attr>>16
        require(e.filename not in seen and not n.is_absolute() and n.parts and '..' not in n.parts and
         n.as_posix()==e.filename.rstrip('/') and chr(92) not in e.filename and not(e.flag_bits&1) and
         stat.S_IFMT(mode) in (0,stat.S_IFREG,stat.S_IFDIR) and
         (not inner or (stat.S_IFREG|0o644)==mode and not e.is_dir()),'unsafe archive member/mode',e.filename)
        seen.add(e.filename);total+=e.file_size
    require(total<=cap and z.testzip() is None,'oversized or bad archive CRC')
    return seen
def read(z,n,cap):
    i=z.getinfo(n);require(not i.is_dir() and 0<i.file_size<=cap,'not regular bound archive member',n)
    return z.read(n)
def validate(p,nested,rec):
    m=p['manufacture'];require(fact(nested)==m['nested'] and sha(rec)==m['receiptSHA256'],'retained archive/receipt digest mismatch')
    r=decode(rec);c=r['actualNormalAuthority'];N=p['normalAuthority'];fs=p['files']
    require(all(c[k]==v for k,v in N.items() if k!='tree'),'underlying normal build/source/88 verified images differ')
    require(r['published'] is False and r['oldPhysicalTrackedAssetsPreserved'] is True and r['activeCount']==810 and
      r['base']==BASE and r['source']==p['source'] and r['sourceGitBlobs']==EXPECT_SRC and
      r['priorPages']==p['priorPages'] and r['files']==fs and r['zip']==m['nested'] and
      r['normalManifestBeforeRetention']==NORMAL_GENERATED[MF] and
      isinstance(r['baselineRegisteredVerified'],int) and r['baselineRegisteredVerified']>=809 and
      isinstance(r['retainedRegisteredVerified'],int) and r['retainedRegisteredVerified']>=809 and
      hx(r['retainedOldPublishedGraphSha256'],64),'retained/source closure or publication state mismatch')
    require(c['authorizedNormalGenerated']==NORMAL_GENERATED and all(fs[k]==v for k,v in NORMAL_GENERATED.items() if k!=MF),
      'generated normal→retained changed outside manifest')
    with zipfile.ZipFile(BytesIO(nested)) as z:
        require(safe(z,36<<20,inner=True)==set(fs),'archive paths differ from allowlist')
        data={k:read(z,k,w['bytes'])for k,w in fs.items()}
        require(all(fact(b)==fs[k] and (k not in EXPECT_SRC or blob(b)==EXPECT_SRC[k])for k,b in data.items()),'file hashes/source Git bytes differ')
    return data,r
def api(path):
    return decode(subprocess.check_output(['gh','api',f'repos/{TOP}/'+path]))
def verify_and_handoff(p,dest):
    m=p['manufacture']; n=p['normalAuthority'];ar=m['outer']
    require(not dest.exists() and dest.parent.resolve()==Path(os.environ['RUNNER_TEMP']).resolve(),'handoff must be fresh under runner temp')
    require(os.environ['GITHUB_REPOSITORY']==TOP and os.environ['GITHUB_EVENT_NAME']=='push' and
       os.environ['GITHUB_REF']=='refs/heads/'+BRANCH,'unexpected verify execution context')
    for a,tree,parent in [(BASE,TREE,None),(p['source'],p['sourceTree'],BASE),(n['head'],n['tree'],p['source']),(m['head'],m['tree'],n['head'])]:
        c=api('git/commits/'+a)
        require(c['sha']==a and c['tree']['sha']==tree and (parent is None or [r['sha'] for r in c['parents']]==[parent]),'exact recorded product/normal/retained ancestry mismatch',a)
    run=api(f"actions/runs/{m['run']}")
    require(run['id']==m['run'] and run['repository']['full_name']==run['head_repository']['full_name']==TOP and
      run['head_sha']==m['head'] and run['head_branch']==PRODUCER and run['path']==WF and
      (run['status'],run['conclusion'],run['event'])==('completed','success','push'),'retained run not the exact successful producer')
    job=api(f"actions/jobs/{m['job']}")
    require(job['id']==m['job'] and job['run_id']==m['run'] and job['name']=='seal' and
      (job['status'],job['conclusion'])==('completed','success') and
      {'Verify completed exact normal-build and browser artifact','Assemble and verify exact retained web delta only'}<=
      {s['name'] for s in job['steps'] if (s['status'],s['conclusion'])==('completed','success')},'missing verified retainer job/steps')
    known=[r for r in api(f"actions/runs/{m['run']}/artifacts")['artifacts'] if not r['expired'] and r['name']==ANAME]
    require(len(known)==1,'retainer did not emit one pinned artifact')
    v=known[0]
    require(v['id']==ar['id'] and v['size_in_bytes']==ar['bytes'] and v['digest']=='sha256:'+ar['sha256'] and
      v['workflow_run']['head_sha']==m['head'] and v['workflow_run']['id']==m['run'],'retainer artifact authority differ')
    staged=dest.parent/'stage35-retainer-input.zip'
    with staged.open('xb') as f:
        subprocess.run(['gh','api',f"repos/{TOP}/actions/artifacts/{ar['id']}/zip"],stdout=f,check=True)
    require(fact(staged.read_bytes())=={k:ar[k]for k in ('bytes','sha256')},'outer artifact byte mismatch')
    with zipfile.ZipFile(staged) as z:
        require(safe(z,48<<20)=={NESTED,RECEIPT,'SHA256SUMS','retainer-output.json','verified-authority.json'},'unexpected retained output artifact inventory')
        rec=read(z,RECEIPT,2<<20);nested=read(z,NESTED,m['nested']['bytes'])
        validate(p,nested,rec)
    dest.mkdir(mode=0o700)
    for k,b in ((NESTED,nested),(RECEIPT,rec)): (dest/k).write_bytes(b)
    for k in ('writer.py','safe-push.sh','PINS.json'): (dest/k).write_bytes((HERE/k).read_bytes())
    lock=''.join(sha(f.read_bytes())+'  '+f.name+'\n' for f in sorted(dest.iterdir())).encode()
    (dest/'HANDOFF.SHA256').write_bytes(lock)
    print(sha(lock))
def git(r,*v,inp=None,env=None):
    return subprocess.check_output(['git','-C',str(r),*v],input=inp,env=env)
def registry(mf):
    result={}
    for group in [mf['files'],*mf.get('previousGenerations',[]),mf.get('previousFiles',[]),*(p['files'] for p in mf.get('publishedGenerations',[]))]:
        for d in group:
            k=d['path'];f={x:d[x]for x in ('bytes','sha256')}
            require(k not in result or result[k]==f,'retained registry conflicting immutable byte record',k)
            result[k]=f
    return result

def inventory(mf,num):
    out={d['path']:d for d in mf['files']}
    require(len(out)==len(mf['files'])==num,'wrong active manifest population')
    return out
def tree_rows(r,obj):
    out={}
    for line in git(r,'ls-tree','-r','-z',obj).split(b'\0'):
        if line:
            d,k=line.split(b'\t',1);out[k.decode()]=tuple(d.decode().split())
    return out
def prepare(p,r,output):
    require(not any(k in os.environ for k in ('GH_TOKEN','GITHUB_TOKEN','STAGE35_BLUE_WRITE_TOKEN','STAGE35_BLUE_NETWORK_TOKEN','GIT_ASKPASS')),
     'git write credential must not exist in assembly process')
    require(git(r,'rev-parse','--is-bare-repository').strip()==b'true' and
     git(r,'rev-parse','HEAD').decode().strip()==BASE and git(r,'rev-parse','HEAD^{tree}').decode().strip()==TREE,'not the exact bare base')
    require(subprocess.run(['git','-C',str(r),'symbolic-ref','-q','HEAD'],stdout=subprocess.DEVNULL,check=False).returncode==1,'HEAD is not detached')
    data,receipt=validate(p,(HERE/NESTED).read_bytes(),(HERE/RECEIPT).read_bytes())
    show=lambda k:git(r,'show',BASE+':'+k)
    old=show(MF);pp=p['priorPages']
    require(fact(old)['sha256']==pp['manifestSHA256'] and blob(old)==pp['manifestGitBlob'],'wrong prior live manifest')
    b,c=decode(old),decode(data[MF]);A,B=inventory(b,809),inventory(c,810)
    immutables=data.keys()-SHELL-EXPECT_SRC.keys();retired=A.keys()-B.keys()
    require(immutables==B.keys()-A.keys() and all(A[x]==B[x]for x in A.keys()&B.keys()),'unexpected normal manifest path movement')
    exact_roles(retired);exact_roles(immutables-{NEW_WEBP})
    require(OLD_WEBP in A and A[OLD_WEBP]==B[OLD_WEBP] and NEW_WEBP in B,'previous far or new unique far image missing')
    require(all(fact(data[k])=={t:B[k][t]for t in ('bytes','sha256')}for k in immutables),'generated identity absent from active manifest')
    oldRegs,newRegs=registry(b),registry(c)
    require(sorted(oldRegs.keys()-newRegs.keys())==p['retention']['droppedRegistryPaths'] and
      all(oldRegs.get(k,v)==v for k,v in newRegs.items()) and
      len(oldRegs)==receipt['baselineRegisteredVerified'] and len(newRegs)==receipt['retainedRegisteredVerified'],
      'prior registry identities changed or unexpected rolling expiry')
    oldPub,newPub=[{g['sourceSha']:g for g in q['publishedGenerations']}for q in (b,c)]
    require(len(oldPub)==len(b['publishedGenerations']) and len(newPub)==len(c['publishedGenerations']) and
      sorted(oldPub.keys()-newPub.keys())==p['retention']['droppedPublishedSources'] and
      all(oldPub[k]==newPub[k]for k in oldPub.keys()&newPub.keys()),'unexpected old published generation change or expiry')
    gens=[x for x in c['publishedGenerations']if x['sourceSha']==BASE]
    evidence=f"https://github.com/{TOP}/actions/runs/{pp['run']}"
    require(len(gens)==1 and not any(x['sourceSha']==p['source'] for x in c['publishedGenerations']) and
      gens[0]['files']==b['files'] and gens[0]['publishedAt']==pp['publishedAt'] and
      gens[0]['publishedAtPrecision']=='instant' and gens[0]['evidence']==evidence and
      gens[0]['graphSha256']==receipt['retainedOldPublishedGraphSha256'],'previous public generation not held or candidate marked published')
    cand=decode(data[c['project']]);orig=decode(show(b['project']))
    libs,olibs=cand['stageLibraries'],orig['stageLibraries']
    maps,omaps=cand['stages'],orig['stages']
    order=cand['libraryOrder'];old_order=orig['libraryOrder']
    require(len(libs)==len(olibs)==len(maps)==len(omaps)==50 and libs[34] in immutables and maps[34] in immutables and
      set(order)-set(old_order)==SIDE_IDS and len(order)==len(old_order)+2 and
      {**cand,'stageLibraries':libs[:34]+[olibs[34]]+libs[35:],'stages':maps[:34]+[omaps[34]]+maps[35:],
       'libraryOrder':[k for k in order if k not in SIDE_IDS]}==orig and
      cand['assetEncodings']['stageLibraries'][34]=='json-pool-v1','non-Stage35 maps/payloads/progression metadata drift')
    nmap,omap=decode(data[maps[34]]),decode(show(omaps[34]))
    require(nmap['id']==omap['id']=='stage-35' and len(nmap['elements'])==len(omap['elements'])+2 and
      {x['id'] for x in nmap['elements'][:2]}==SIDE_IDS and all(x['id']==x['assetId'] and x['scale']==1 and
       x['depthLayer']=='L1' and x['layer']=='structural-back' for x in nmap['elements'][:2]) and
      [omap['design']['nativeArt']['far'],nmap['design']['nativeArt']['far']]==[OLD_FAR,NEW_FAR],'Stage35 two visible side claims differ')
    nmap['elements']=nmap['elements'][2:]; nmap['design']['nativeArt']['far']=OLD_FAR
    require(nmap==omap,'map difference beyond two approved placements and far selector')
    desc=decode(data[libs[34]]);parts=desc['parts']
    require(desc['$honroJsonParts']==1 and len(parts)==2 and [x['path']for x in parts]==
      sorted(k for k in immutables if 'chapter-35-assets-part-0' in k) and
      all(fact(data[x['path']])=={t:x[t]for t in ('bytes','sha256')}for x in parts) and
      fact(b''.join(data[x['path']]for x in parts))=={t:desc[t]for t in ('bytes','sha256')},'broken exact split packet')
    old_far,new_far=[next(q for q in keys if q.startswith('web/data/HONRO_AUTHORED_FAR.')) for keys in (retired,immutables)]
    f0,f1=decode(show(old_far)),decode(data[new_far])
    require(f1['images'].pop(NEW_FAR)=={'$honroAsset':NEW_WEBP} and f0==f1,'different authored far registration')
    require(data[NEW_WEBP]==data['shared/assets/environment/campaign-far/act4-stage35-bamboo-grove.webp'],'source + emitted WebP mismatch')
    # Provider and pier chunks are independently locked to the exact genuine normal
    # candidate byte records. Build/QA checks signed four scopes; no code runs here.
    require(data['HONRO.html']==data['index.html'] and c['gameEntry'].encode()in data['HONRO.html'] and
      c['workshopEntry'].encode()in data['HONRO_WORKSHOP.html'],'incorrect normal shell entry')
    original=tree_rows(r,BASE); added=set(data)-OLD_MODIFIED
    require((oldRegs.keys()|newRegs.keys())<=(original.keys()|immutables),'a retained/expired immutable file is missing physically')
    require(len(OLD_MODIFIED)==8 and len(added)==23 and all(original.get(k,('',))[0]=='100644' and original[k][1]=='blob' for k in OLD_MODIFIED)
      and not (added&original.keys()),'mode, diff role, or existing new destination drift')
    git(r,'read-tree',BASE)
    for k,b0 in sorted(data.items()):
        h=git(r,'hash-object','-w','--no-filters','--stdin',inp=b0).decode().strip()
        require(h==blob(b0),'Git object byte mismatch',k)
        git(r,'update-index','--add','--cacheinfo','100644,'+h+','+k)
    t=git(r,'write-tree').decode().strip()
    require(tree_rows(r,t)=={**original,**{k:('100644','blob',blob(b0))for k,b0 in data.items()}},
      'exact whole Git tree differs')
    delta=set(git(r,'diff-tree','-r','--no-commit-id','--name-status','--no-renames',BASE,t).decode().splitlines())
    require(delta==({'M\t'+k for k in OLD_MODIFIED}|{'A\t'+k for k in added}),'not exact 31 path delta',sorted(delta))
    env=dict(os.environ)
    for n in ('AUTHOR','COMMITTER'):
        env.update({f'GIT_{n}_NAME':'github-actions[bot]',f'GIT_{n}_EMAIL':'41898282+github-actions[bot]@users.noreply.github.com',f'GIT_{n}_DATE':p['commitDate']})
    h=git(r,'-c','commit.gpgSign=false','commit-tree',t,'-p',BASE,
      inp=b'Apply verified Act 4 Stage 5 blue rock and bamboo; retain prior web assets\n',env=env).decode().strip()
    require(git(r,'rev-list','--parents','-n1',h).decode().split()==[h,BASE] and git(r,'rev-parse',h+'^{tree}').decode().strip()==t,
      'candidate ancestry/tree disagree')
    git(r,'update-ref','--no-deref','HEAD',h,BASE)
    output.write_text(h+'\n')
    print(json.dumps({'parent':BASE,'tree':t,'commit':h,'modified':sorted(OLD_MODIFIED),'added':sorted(added),'published':False}))
if __name__=='__main__':
    mode,*args=sys.argv[1:];p=load_pins()
    if mode=='pins' and not args:pass
    elif mode=='verify' and len(args)==1:verify_and_handoff(p,Path(args[0]))
    elif mode=='prepare' and len(args)==2:prepare(p,Path(args[0]),Path(args[1]))
    else:raise SystemExit('unsupported mode')
