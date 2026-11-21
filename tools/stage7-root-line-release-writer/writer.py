"""Verify retained Stage21 package and prepare a detached Git commit. Never pushes."""
import hashlib, json, os, re, stat, subprocess, sys, zipfile
from datetime import datetime
from io import BytesIO
from pathlib import Path, PurePosixPath

HERE=Path(__file__).resolve().parent
TOP='sys8994/honro'
BRANCH='qa/stage7-root-line-release-writer-42879'
REF='refs/heads/release/act1-stage7-root-line-20261121'
BASE='42879fcbb740fb2167a21e6ec9288bd63432a2f0'
TREE='032ad6463b99a1aa2aec93ab988c6692801dc890'
PRODUCER='qa/stage7-root-line-retention-42879'
WF='.github/workflows/stage7-stage21-retention.yml'
ANAME='honro-stage7-root-line-retained-source-and-generated-no-deploy'
NESTED='stage7-root-line-retained-source-and-generated-delta-no-deploy.zip'
RECEIPT='RETAINED-DELTA-RECEIPT.json'
MF='web/manifest.json'
SHELL={'HONRO.html','HONRO_WORKSHOP.html','index.html',MF}
EXPECT_SRC={'shared/runtime/terrain-readability.js': 'df4437aa937dce38efac3c799e615e68cee0cf29', 'tests/stage7-root-floor-closure.mjs': 'ff184d1f4bc17c11b57b220f634abd09ddf695cd'}
SOURCE='fe9c948e8a0a3637ba54cea53118b2a85aa8057f'
SOURCE_TREE='b827e5c83ee36908b95993f5b9528a7a45be8bf6'
NORMAL_HEAD='fde0638adffa7a6327892210ea8d35be63b412d1'
NORMAL_TREE='880736e19a4c43ef1fb21d6cce29bb1e3dc8cc6b'
OLD_ALIASES=['web/runtime/ordered-common-16.c094392d4ee992d9.js', 'web/entries/game.a47fa9bb7d45a42e.js', 'web/entries/workshop.a2eef25feaf1a9a1.js', 'web/entries/game.5fabc36680b0de6e.html']
BODY={'before': {'bytes': 4589, 'sha256': '54e7298bc4da24c22d136c55f4b09aaf6345cf454d4338ff229c3bfc5e3aad92'}, 'after': {'bytes': 4899, 'sha256': '4f060b4b085d2e0ee19938a519fbd554497ebcfdd168133b98dbcff5b33eb91d'}}
WRAPPER={'index':12,'before':{'bytes':4567,'sha256':'768ca185897c9d18b61732a7b382a09e5e00b11981fa23114cc0f692672e21bb'},'after':{'bytes':4877,'sha256':'651d6f6c52f8a0e55404ee84e196d2c9a57efd5bfd8cde6a1617be539ec5af3d'}}
COMMON16_OLD='web/runtime/ordered-common-16.c094392d4ee992d9.js'
COMMON16_NEW={'web/runtime/ordered-common-16.3d9993bd92d5eb93.js': {'bytes': 177610, 'sha256': '3d9993bd92d5eb93572f4b05fe9da2f19d4202c7a3e24ba767a5274ca3364f2c'}}
PROTECTED={'web/runtime/ordered-common-17.9a592f68229e4289.js': {'bytes': 104308, 'sha256': '9a592f68229e42894a87a328a71e2ac8408bb1556f441bcbc67229aa80ba718c'}, 'web/graphics/honro_authored_far-images-act4FarBambooGrove35.574a1793b7bb2416.webp': {'bytes': 205496, 'sha256': '574a1793b7bb2416d66abd249c5c7ff851ea2072aa3204db68caa9b38d2a987b'}, 'web/runtime/ordered-common-12.538fbca4939d645e.js': {'bytes': 72225, 'sha256': '538fbca4939d645ec8be42331733cae9d01295e87c0ebcd92fb2d74d43eada65'}, 'web/data/chapter-35.f62e13d97eec5171.json': {'bytes': 30417, 'sha256': 'f62e13d97eec5171cd942683c1363c615a91297413d61cbd3da35d8b0ef0065d'}, 'web/data/chapter-35-assets-parts.c3f1005936b3d27e.json': {'bytes': 443, 'sha256': 'c3f1005936b3d27e97a0513cf0b2a9f8cdbe7224becf6a1a7ea179628f951870'}, 'web/data/chapter-21.724a765a85d437a2.json': {'bytes': 67494, 'sha256': '724a765a85d437a24ea9437ba300f5602282abda9ecbd190074a7d25b8b1c51b'}, 'web/data/chapter-21-assets.195e73632de8b164.json': {'bytes': 688805, 'sha256': '195e73632de8b16431e39ac63f87eed9ad1ea538a47dcc0d980e4a0e1c624e67'}, 'web/data/chapter-07.28f7bf612a598aeb.json': {'bytes': 30579, 'sha256': '28f7bf612a598aeb0eb6da0f819a0b6ddb7fd5414eab9410e434772eb04d2553'}, 'web/data/chapter-07-assets.7068fa05c6ce1c2e.json': {'bytes': 655969, 'sha256': '7068fa05c6ce1c2ef0c96045daa3dea192ba69a18e35bc323e6a5df9a1529db5'}, 'web/graphics/honro_authored_far-images-act1Site7.9ab1f4843007e530.webp': {'bytes': 41590, 'sha256': '9ab1f4843007e530ec48cfac52569aa3323b1ab5098b962054a63828da1c1931'}, 'web/data/chapter-35-assets-part-000.2f22959bfb690283.bin': {'bytes': 4194304, 'sha256': '2f22959bfb6902837283064b16fdd6b4d1da29617f95e82436d623b0399a8e8f'}, 'web/data/chapter-35-assets-part-001.cdc249b0d9ce1988.bin': {'bytes': 399036, 'sha256': 'cdc249b0d9ce1988d2af0275f1d426d097bb2c7ff1552b9ae6f7370647e3911e'}}
OLD_MODIFIED=SHELL|{'shared/runtime/terrain-readability.js'}
STOCK_SOURCE={'shared/runtime/terrain-readability.js':'5c3b3cd4df6fcb383a77bd6a8b21cbb90dd4ca04','shared/runtime/act3-handoff-art.js':'234cc3908cdabe4ddce36d63bc46dd49b1b3d621','tests/stage21-west-bedrock-source.mjs':'fec78045c0a71addd0425ac0454d66a823f8922e'}
RECEIPT_KEYS={'SOURCE.json','GRAPH.json','BROWSER.json','STAGE21-CONTROL.json','NORMAL-SEAL-NOT-PUBLISHED.json'}

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
def release_paths(p):
    n=p['normalAuthority'];aliases=p['aliases']; normal=n['authorizedNormalGenerated']
    require(type(aliases) is dict and set(aliases)==set(OLD_ALIASES) and len(set(aliases.values()))==4 and
      aliases[COMMON16_OLD] in COMMON16_NEW and all(re.sub(r'\.[0-9a-f]{16}\.', '.ALIAS.', k)==
        re.sub(r'\.[0-9a-f]{16}\.', '.ALIAS.', y) and k!=y and bool(re.fullmatch(r'web/(runtime|entries)/[\w.-]+\.[a-f0-9]{16}\.(js|html)',y)) for k,y in aliases.items()),
      'wrong four qualified active alias classes')
    require(normal.keys()==SHELL|set(aliases.values()) and len(normal)==8 and
      all(sizepin(x,12<<20)for x in normal.values()) and all(normal[k]==v for k,v in COMMON16_NEW.items()) and
      all(k.split('.')[-2]==normal[k]['sha256'][:16]for k in aliases.values()),'wrong exact eight generated path digests')
    return aliases,normal
def load_pins():
    p=decode((HERE/'PINS.json').read_bytes())
    require(p['enabled'] is True,'not enabled; wait for independently verified retained output')
    n,m=p['normalAuthority'],p['manufacture']
    require((p['repo'],p['base'],p['baseTree'],p['releaseRef'],p['sourceGit'])==(TOP,BASE,TREE,REF,EXPECT_SRC) and
      (p['source'],p['sourceTree'],n['head'],n['tree'],n['run'],n['job'],n['decodedApprovedPNGCount'])==
         (SOURCE,SOURCE_TREE,NORMAL_HEAD,NORMAL_TREE,44895479793,136820088269,80) and
      p['oldAliases']==OLD_ALIASES and p['oldCommon16']==COMMON16_OLD and p['newCommon16']==COMMON16_NEW and
      p['protectedActive']==PROTECTED and p['normalBodyOnly']==BODY,'unexpected frozen write scope')
    require(sizepin({k:n['artifact'][k]for k in ('bytes','sha256')},201<<20) and pos(n['artifact']['id']) and
      hx(n['nestedNormal'],64) and set(n['normalProofReceipts'])==RECEIPT_KEYS and all(hx(i,64)for i in n['normalProofReceipts'].values()),
      'missing independently known exact normal artifact authority')
    require(set(m)=={'run','job','head','tree','outer','nested','receiptSHA256'} and
      all(pos(x)for x in (m['run'],m['job'],m['outer']['id'])) and all(hx(x,40)for x in
         (m['head'],m['tree'],p['priorPages']['manifestGitBlob'])),'incomplete exact run/commit authority')
    o=m['outer']; require(set(o)=={'id','bytes','sha256'} and sizepin({k:o[k]for k in ('bytes','sha256')},45<<20)
      and sizepin(m['nested'],35<<20) and sizepin(p['retainedManifest'],12<<20)
      and hx(m['receiptSHA256'],64) and hx(p['priorPages']['manifestSHA256'],64),'incomplete exact artifact byte pins')
    retention=p['retention']; require(type(retention) is dict and
      set(retention)=={'droppedRegistryPaths','droppedPublishedSources'} and
      isinstance(retention['droppedRegistryPaths'],list) and len(retention['droppedRegistryPaths'])<=200 and
      isinstance(retention['droppedPublishedSources'],list) and len(retention['droppedPublishedSources'])<=20 and
      all(hx(v,40)for v in retention['droppedPublishedSources']) and
      all(isinstance(k,str) and re.fullmatch(r'web/(runtime|entries|data|styles|graphics|fonts)/[\w.-]+',k)for k in retention['droppedRegistryPaths']),
      'unreviewed rolling registry expiry')
    f=p['files']; aliases,normal=release_paths(p)
    require(type(f) is dict and len(f)==10 and f.keys()==EXPECT_SRC.keys()|normal.keys() and
      f[MF]==p['retainedManifest'] and f[MF]!=normal[MF] and all(f[k]==v for k,v in normal.items() if k!=MF),
      'expected exact 2 source, 8 generated paths with retained manifest only')
    require(all(sizepin(x,12<<20)for x in f.values()),'exact path content address invalid')
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
    aliases,normal=release_paths(p)
    require(c=={k:v for k,v in N.items() if k!='tree'},'underlying normal build/source/80 verified images differ')
    require(r['published'] is False and r['oldPhysicalTrackedAssetsPreserved'] is True and r['activeCount']==810 and
      r['base']==BASE and r['source']==p['source'] and r['sourceGitBlobs']==EXPECT_SRC and
      r['priorPages']==p['priorPages'] and r['files']==fs and r['zip']==m['nested'] and
      r['normalManifestBeforeRetention']==normal[MF] and
      isinstance(r['baselineRegisteredVerified'],int) and r['baselineRegisteredVerified']>=810 and
      isinstance(r['retainedRegisteredVerified'],int) and r['retainedRegisteredVerified']>=810 and
      hx(r['retainedOldPublishedGraphSha256'],64),'retained/source closure or publication state mismatch')
    require(c['authorizedNormalGenerated']==normal and all(fs[k]==v for k,v in normal.items() if k!=MF),
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
    staged=dest.parent/'stage7-retainer-input.zip'
    with staged.open('xb') as f:
        subprocess.run(['gh','api',f"repos/{TOP}/actions/artifacts/{ar['id']}/zip"],stdout=f,check=True)
    require(fact(staged.read_bytes())=={k:ar[k]for k in ('bytes','sha256')},'outer artifact byte mismatch')
    with zipfile.ZipFile(staged) as z:
        require(safe(z,48<<20)=={NESTED,RECEIPT,'SHA256SUMS','retainer-output.json','verified-authority.json'},'unexpected retained output artifact inventory')
        rec=read(z,RECEIPT,2<<20);nested=read(z,NESTED,m['nested']['bytes'])
        _,receipt=validate(p,nested,rec)
        require(decode(read(z,'verified-authority.json',2<<20))==receipt['actualNormalAuthority'] and
          read(z,'SHA256SUMS',2<<20).decode().strip()==sha(nested)+'  '+NESTED,
          'retainer corroboration/digest list mismatch')
        ret=decode(read(z,'retainer-output.json',2<<20))
        require(ret['restored']==[] and ret['restoredBytes']==0,'scoped transport must not restore historic bytes')
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
def roles(b):
    header, tail=b.split(b';',1)
    require(bool(re.fullmatch(rb'import\{yieldIfNeeded\}from"\./load-data\.[a-f0-9]{16}\.js"',header)),'wrong ordered wrapper header')
    parts=tail.split(b'await yieldIfNeeded();')
    require(len(parts)>1 and parts.pop().strip()==b'' and
      all(x.lstrip().startswith(b'(()=>{"use strict";') and x.rstrip().endswith(b'})();') for x in parts),'invalid stock wrapper framing')
    return header,[x.strip() for x in parts]
def normalize(b,aliases):
    for old,new in sorted(aliases.items()):
        b=b.replace(new.encode(),old.encode()).replace(Path(new).name.encode(),Path(old).name.encode())
    return b
def remap(x,aliases):
    if isinstance(x,list):return [remap(v,aliases)for v in x]
    if isinstance(x,dict):return {k:remap(v,aliases)for k,v in x.items()}
    return dict((v,k)for k,v in aliases.items()).get(x,x) if isinstance(x,str) else x
def protect_stage7(p,old,data,receipt,show):
    aliases,normal=release_paths(p)
    b,c=decode(old),decode(data[MF]); A,B=inventory(b,810),inventory(c,810)
    incoming=set(aliases.values()); leaving=set(aliases)
    require(incoming==B.keys()-A.keys() and leaving==A.keys()-B.keys() and
      all(A[k]==B[k]for k in A.keys()&B.keys()),'manifest beyond four expected immutable alias transitions')
    require(all(fact(data[k])=={q:B[k][q]for q in ('bytes','sha256')}for k in incoming),'generated identity absent from active manifest')
    ignored={'files','previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
    graph=lambda z:{k:v for k,v in z.items() if k not in ignored}
    require(graph(b)==decode(normalize(json.dumps(graph(c),sort_keys=True).encode(),aliases)),
      'normalized non-historical release graph differs')
    h1,x1=roles(show(COMMON16_OLD)); h2,x2=roles(data[aliases[COMMON16_OLD]])
    ch=[j for j,q in enumerate(zip(x1,x2))if q[0]!=q[1]]
    require(h1==h2 and len(x1)==len(x2) and len(ch)==1,'more than the one authorized Stage7 wrapper changed')
    i=ch[0]
    require(i==WRAPPER['index'] and fact(x1[i])==WRAPPER['before'] and fact(x2[i])==WRAPPER['after'] and
      b'5069.18' in x2[i] and b'5732.24' in x2[i],'wrong Stage7 terrain readability wrapper')
    for dest in (SHELL-{MF})|(leaving-{COMMON16_OLD}):
        require(show(dest)==normalize(data[aliases.get(dest,dest)],aliases),'entry/shell change beyond pointer rename',dest)
    for k,v in STOCK_SOURCE.items():
        require(blob(show(k))==v,'prior Stage21 author or original Stage7 readability source drift',k)
    for k,v in PROTECTED.items():
        require(v=={t:A[k][t]for t in ('bytes','sha256')}=={t:B[k][t]for t in ('bytes','sha256')} and
            fact(show(k))==v,'protected active Stage7/21/35 byte drift',k)
    project=decode(show(b['project']))
    require(len(project['stages'])==len(project['stageLibraries'])==50 and
      all(A[k]==B[k]for k in (b['project'],project['base'],project['shared'],*project['stages'],*project['stageLibraries'])),
      'canonical chapter packets/project changed')
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
    pp=p['priorPages']; evidence=f"https://github.com/{TOP}/actions/runs/{pp['run']}"
    require(len(gens)==1 and SOURCE not in newPub and gens[0]['files']==b['files'] and
      gens[0]['publishedAt']==pp['publishedAt'] and gens[0]['publishedAtPrecision']=='instant' and
      gens[0]['evidence']==evidence and gens[0]['graphSha256']==receipt['retainedOldPublishedGraphSha256'],
      'previous public generation not held or candidate marked published')

def prepare(p,r,output):
    require(not any(k in os.environ for k in ('GH_TOKEN','GITHUB_TOKEN','STAGE7_ROOT_LINE_WRITE_TOKEN','STAGE7_ROOT_LINE_NETWORK_TOKEN','GIT_ASKPASS')),
     'git write credential must not exist in assembly process')
    require(git(r,'rev-parse','--is-bare-repository').strip()==b'true' and
     git(r,'rev-parse','HEAD').decode().strip()==BASE and git(r,'rev-parse','HEAD^{tree}').decode().strip()==TREE,'not the exact bare base')
    require(subprocess.run(['git','-C',str(r),'symbolic-ref','-q','HEAD'],stdout=subprocess.DEVNULL,check=False).returncode==1,'HEAD is not detached')
    data,receipt=validate(p,(HERE/NESTED).read_bytes(),(HERE/RECEIPT).read_bytes())
    show=lambda k:git(r,'show',BASE+':'+k)
    old=show(MF);pp=p['priorPages']
    require(fact(old)['sha256']==pp['manifestSHA256'] and blob(old)==pp['manifestGitBlob'],'wrong prior live manifest')
    protect_stage7(p,old,data,receipt,show)
    immutables=set(p['aliases'].values())
    oldRegs,newRegs=(registry(decode(z))for z in (old,data[MF]))
    original=tree_rows(r,BASE); added=set(data)-OLD_MODIFIED
    require((oldRegs.keys()|newRegs.keys())<=(original.keys()|immutables),'a retained/expired immutable file is missing physically')
    require(len(OLD_MODIFIED)==5 and len(added)==5 and all(original.get(k,('',))[0]=='100644' and original[k][1]=='blob' for k in OLD_MODIFIED)
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
    require(delta==({'M\t'+k for k in OLD_MODIFIED}|{'A\t'+k for k in added}),'not exact 10 path delta',sorted(delta))
    env=dict(os.environ)
    for n in ('AUTHOR','COMMITTER'):
        env.update({f'GIT_{n}_NAME':'github-actions[bot]',f'GIT_{n}_EMAIL':'41898282+github-actions[bot]@users.noreply.github.com',f'GIT_{n}_DATE':p['commitDate']})
    h=git(r,'-c','commit.gpgSign=false','commit-tree',t,'-p',BASE,
      inp=b'Apply verified Act 1 Stage 7 root line; retain prior web assets\n',env=env).decode().strip()
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
