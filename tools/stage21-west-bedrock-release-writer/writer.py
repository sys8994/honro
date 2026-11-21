"""Verify retained Stage21 package and prepare a detached Git commit. Never pushes."""
import hashlib, json, os, re, stat, subprocess, sys, zipfile
from datetime import datetime
from io import BytesIO
from pathlib import Path, PurePosixPath

HERE=Path(__file__).resolve().parent
TOP='sys8994/honro'
BRANCH='qa/stage21-west-bedrock-release-writer-9ac'
REF='refs/heads/release/act3-stage21-west-bedrock-20261121'
BASE='9acde7427f3ebfce00f9ad3a9b943d030e2c352d'
TREE='88e7031612970afa607c8e6b72cb00b42f95364f'
PRODUCER='qa/stage21-west-bedrock-retention-9ac'
WF='.github/workflows/stage21-west-bedrock-retention.yml'
ANAME='honro-stage21-west-bedrock-retained-source-and-generated-no-deploy'
NESTED='stage21-west-bedrock-retained-source-and-generated-delta-no-deploy.zip'
RECEIPT='RETAINED-DELTA-RECEIPT.json'
MF='web/manifest.json'
SHELL={'HONRO.html','HONRO_WORKSHOP.html','index.html',MF}
EXPECT_SRC={'shared/runtime/act3-handoff-art.js': '234cc3908cdabe4ddce36d63bc46dd49b1b3d621', 'tests/stage21-west-bedrock-source.mjs': 'fec78045c0a71addd0425ac0454d66a823f8922e'}
SOURCE='a2fd46334146b1b0a7459c99bcbfd9fb9250ae0d'
SOURCE_TREE='8a18dc5e09e7f78b39cbe7ce660afe9d05a5ce4e'
NORMAL_HEAD='d7aef1c3b57207ec951af5d79439579780dc8008'
NORMAL_TREE='da70cb350526df4da8fa91ba5179c72919968195'
NORMAL_GENERATED={'HONRO.html': {'bytes': 17379, 'sha256': 'bf351f5c4acbf3f32143c774cb0c7d6c86f06dab3165f8d2b55647b56a51945d'}, 'HONRO_WORKSHOP.html': {'bytes': 4011, 'sha256': '6d2920c01b4ec0773dcaa6119864b4e27b917f65ef34e96cd2a1eb29f62c3b4a'}, 'index.html': {'bytes': 17379, 'sha256': 'bf351f5c4acbf3f32143c774cb0c7d6c86f06dab3165f8d2b55647b56a51945d'}, 'web/entries/game.5fabc36680b0de6e.html': {'bytes': 11318, 'sha256': '5fabc36680b0de6edd574b5141b7bc0076caae6597635ef5e46eff190e143a94'}, 'web/entries/game.a47fa9bb7d45a42e.js': {'bytes': 20483, 'sha256': 'a47fa9bb7d45a42e31c859942c8fa601106919e88be29039df1235b2ea1244bc'}, 'web/entries/workshop.a2eef25feaf1a9a1.js': {'bytes': 16706, 'sha256': 'a2eef25feaf1a9a18cf67a2ae1049b798f9f28afda1bebfc7ed995676e90d100'}, 'web/manifest.json': {'bytes': 6435758, 'sha256': '1b1d09b9e864f40f90f2099a3fec9a4f972b3f3a95ce41e24933d57e367012b1'}, 'web/runtime/ordered-common-17.9a592f68229e4289.js': {'bytes': 104308, 'sha256': '9a592f68229e42894a87a328a71e2ac8408bb1556f441bcbc67229aa80ba718c'}}
ALIASES={'web/entries/game.6d15aeb89fecafdb.js': 'web/entries/game.a47fa9bb7d45a42e.js', 'web/entries/workshop.7816df2c88efd28c.js': 'web/entries/workshop.a2eef25feaf1a9a1.js', 'web/entries/game.abedc85b183c711f.html': 'web/entries/game.5fabc36680b0de6e.html', 'web/runtime/ordered-common-17.2ed746adf1d3e0e3.js': 'web/runtime/ordered-common-17.9a592f68229e4289.js'}
CANONICAL={'shared/assets/environment/act3-handoff/stage21-bedrock.json': {'bytes': 189171, 'sha256': 'a4072b1058cc4f5776d8da99fc4b2517f910f39f7e1207df39145d1a25618472', 'git': '41462ffd970fe3d3daf5a3058d8fe8f8a399d4b2'}, 'shared/act3-handoff-art.mjs': {'bytes': 2297, 'sha256': '86f566899e9eeebd0cc1c4efb32402ac90874a79ad0bb6662e784437867f79c7', 'git': '5d1963f4cc630a8343f2c72ca486565746161710'}, 'shared/runtime/profile-store.js': {'bytes': 21907, 'sha256': '3b270b6ca132a70559f1c7691d63d6d8a82ca4bfef5d06c69522c20fe6884f2c', 'git': 'da6b816f36a786a8e8c4a0e7671b2b77fc9e30e9'}}
BODY={'wrapperIndex': 17, 'before': {'bytes': 5084, 'sha256': 'dc63b6c67d5d12aff6364b5611c0b7dd7fd22397c6859b49671070c477cf6a52'}, 'after': {'bytes': 12360, 'sha256': '4f51257a3f523791299e47991cdf0ad4daba6caa3bf6dc40d11eacf3b82b231b'}}
OLD_MODIFIED=SHELL|{'shared/runtime/act3-handoff-art.js'}

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
def exact_roles(paths):return set(paths)==set(ALIASES.values())
def load_pins():
    p=decode((HERE/'PINS.json').read_bytes())
    require(p['enabled'] is True,'not enabled; wait for independently verified retained output')
    n,m=p['normalAuthority'],p['manufacture']
    require((p['repo'],p['base'],p['baseTree'],p['releaseRef'],p['sourceGit'])==(TOP,BASE,TREE,REF,EXPECT_SRC) and
      (p['source'],p['sourceTree'],n['head'],n['tree'],n['run'],n['job'],n['decodedApprovedPNGCount'])==
         (SOURCE,SOURCE_TREE,NORMAL_HEAD,NORMAL_TREE,44892847667,136812188390,36) and
      p['expectedAliases']==ALIASES and p['immutableCanonicalSource']==CANONICAL and p['normalBodyOnly']==BODY,
      'unexpected frozen write scope')
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
    f=p['files']
    require(type(f) is dict and len(f)==10 and f.keys()==EXPECT_SRC.keys()|NORMAL_GENERATED.keys() and
      exact_roles(f.keys()-SHELL-EXPECT_SRC.keys()) and f[MF]==p['retainedManifest'] and f[MF]!=NORMAL_GENERATED[MF] and
      n['authorizedNormalGenerated']==NORMAL_GENERATED and all(f[k]==v for k,v in NORMAL_GENERATED.items() if k!=MF),
      'expected exact 2 source, 8 generated paths with retained manifest only')
    require(all(sizepin(x,12<<20)for x in f.values()) and
      all(k.split('.')[-2]==f[k]['sha256'][:16]for k in ALIASES.values()),'exact path content address invalid')
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
    require(all(c[k]==v for k,v in N.items() if k!='tree'),'underlying normal build/source/36 verified images differ')
    require(r['published'] is False and r['oldPhysicalTrackedAssetsPreserved'] is True and r['activeCount']==810 and
      r['base']==BASE and r['source']==p['source'] and r['sourceGitBlobs']==EXPECT_SRC and
      r['priorPages']==p['priorPages'] and r['files']==fs and r['zip']==m['nested'] and
      r['normalManifestBeforeRetention']==NORMAL_GENERATED[MF] and
      isinstance(r['baselineRegisteredVerified'],int) and r['baselineRegisteredVerified']>=810 and
      isinstance(r['retainedRegisteredVerified'],int) and r['retainedRegisteredVerified']>=810 and
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
    staged=dest.parent/'stage21-retainer-input.zip'
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
def normalize(b):
    for old,new in sorted(ALIASES.items()):
        b=b.replace(new.encode(),old.encode()).replace(Path(new).name.encode(),Path(old).name.encode())
    return b
def remap(x):
    if isinstance(x,list):return [remap(v)for v in x]
    if isinstance(x,dict):return {k:remap(v)for k,v in x.items()}
    return dict((v,k)for k,v in ALIASES.items()).get(x,x) if isinstance(x,str) else x
def protect_stage21(p,old,data,receipt,show):
    b,c=decode(old),decode(data[MF]); A,B=inventory(b,810),inventory(c,810)
    incoming=set(ALIASES.values()); leaving=set(ALIASES)
    require(incoming==B.keys()-A.keys() and leaving==A.keys()-B.keys() and
      all(A[k]==B[k]for k in A.keys()&B.keys()),'manifest beyond four expected immutable alias transitions')
    require(all(fact(data[k])=={q:B[k][q]for q in ('bytes','sha256')}for k in incoming),'generated identity absent from active manifest')
    for k in ('gameEntry','workshopEntry','common','gameOnly','optionalModules','styles','project'):
        require(b[k]==remap(c[k]),'normalized top-level graph differs',k)
    a17=next(k for k in leaving if 'ordered-common-17.' in k)
    h1,x1=roles(show(a17)); h2,x2=roles(data[ALIASES[a17]])
    i=BODY['wrapperIndex']
    require(h1==h2 and len(x1)==len(x2) and [j for j,q in enumerate(zip(x1,x2))if q[0]!=q[1]]==[i] and
      fact(x1[i])==BODY['before'] and fact(x2[i])==BODY['after'] and
      b'eup21:foundations' not in x1[i] and b'eup21:foundations' in x2[i] and b'upper-split-return' in x2[i] and
      all(b'act3-handoff:26:kiln-foundation' in x for x in [x1[i],x2[i]]),'wrong changed ordered painter wrapper')
    for dest in (SHELL-{MF})|(leaving-{a17}):
        require(show(dest)==normalize(data[ALIASES.get(dest,dest)]),'entry/shell change beyond pointer rename',dest)
    for k,v in CANONICAL.items():
        z=show(k)
        require(fact(z)=={t:v[t]for t in ('bytes','sha256')} and blob(z)==v['git'],'immutable canonical terrain/profile bytes drift',k)
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
    require(not any(k in os.environ for k in ('GH_TOKEN','GITHUB_TOKEN','STAGE21_WEST_BEDROCK_WRITE_TOKEN','STAGE21_WEST_BEDROCK_NETWORK_TOKEN','GIT_ASKPASS')),
     'git write credential must not exist in assembly process')
    require(git(r,'rev-parse','--is-bare-repository').strip()==b'true' and
     git(r,'rev-parse','HEAD').decode().strip()==BASE and git(r,'rev-parse','HEAD^{tree}').decode().strip()==TREE,'not the exact bare base')
    require(subprocess.run(['git','-C',str(r),'symbolic-ref','-q','HEAD'],stdout=subprocess.DEVNULL,check=False).returncode==1,'HEAD is not detached')
    data,receipt=validate(p,(HERE/NESTED).read_bytes(),(HERE/RECEIPT).read_bytes())
    show=lambda k:git(r,'show',BASE+':'+k)
    old=show(MF);pp=p['priorPages']
    require(fact(old)['sha256']==pp['manifestSHA256'] and blob(old)==pp['manifestGitBlob'],'wrong prior live manifest')
    protect_stage21(p,old,data,receipt,show)
    immutables=set(ALIASES.values())
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
      inp=b'Apply verified Act 3 Stage 1 west bedrock; retain prior web assets\n',env=env).decode().strip()
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
