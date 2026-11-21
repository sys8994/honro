"""Verify Stage24 retained authority and recreate exact bare commit. Never pushes."""
import hashlib,json,os,re,stat,subprocess,sys,zipfile
from io import BytesIO
from pathlib import Path,PurePosixPath
HERE=Path(__file__).resolve().parent
TOP='sys8994/honro';BRANCH='qa/stage24-front6-release-writer-b79'
REF='refs/heads/release/act3-stage24-front6-20261121'
BASE='b79ea7fd87fda5586d78eae0a7052996b8e71fb5';TREE='1e55d910bbabc43919c20a14d1a06002b20f4977'
PRODUCER='qa/stage24-front6-retention-b79';WF='.github/workflows/stage24-front6-retention.yml'
ANAME='honro-stage24-front6-retained-source-and-generated-no-deploy'
NESTED='stage24-front6-retained-source-and-generated-delta-no-deploy.zip'
RECEIPT='RETAINED-DELTA-RECEIPT.json'
NORM_HEAD='e4aad78d72ba927e82f8761dcfb0fef773bac947'
MF='web/manifest.json';SHELLS={'HONRO.html','HONRO_WORKSHOP.html','index.html'}
SOURCE_OLD={'shared/data/campaign.json':'edaf31a5fda2b7db0202bc0efb52dd83e54f6b9e','tools/map-forge/stage24-family-compound.mjs':'514274cdcdaf2968bfe9371272a6f56e273b9c72'}
SOURCE_NEW={'shared/data/campaign.json':'a13fc5834808899bcf3b0eac1aa3ca4ada625a2b','tools/map-forge/stage24-family-compound.mjs':'9028bacf5603eb7447f97f1f0ccc65ec37912e2e'}
STAGE24_INDEX=23
EXPIRED={'4a6042ba8ac833eb5a49e5704b5af984c182b823','974b1cce62a29dcf87cf2b20fe21976584440074','56ee35186a951d41be93689bf02ca7f6f0f0a59e'}
RET_HISTORY={'previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
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
    out={d['path']:{k:d[k]for k in ('bytes','sha256')}for d in mf['files']}
    require(len(out)==len(mf['files'])==num,'wrong active manifest population')
    return out
def tree_rows(r,obj):
    out={}
    for line in git(r,'ls-tree','-r','-z',obj).split(b'\0'):
        if line:
            d,k=line.split(b'\t',1);out[k.decode()]=tuple(d.decode().split())
    return out

def stable(obj):
    return sha(json.dumps(obj,sort_keys=True,separators=(',',':')).encode())
def want(o):return {k:o[k]for k in ('bytes','sha256')}
def load_pins():
    p=decode((HERE/'PINS.json').read_bytes())
    require(p['enabled'] is True,'disabled until verified exact Stage24 retention authority')
    require((p['base'],p['baseTree'],p['sourceOld'],p['sourceNew'])==(BASE,TREE,SOURCE_OLD,SOURCE_NEW),'source identity drift')
    m,c,n=p['manufacture'],p['candidate'],p['normal']
    require((n['run'],n['artifact'],n['head'])==(44916353122,14711489507,NORM_HEAD),'normal provenance drift')
    require(all(hx(v,40)for v in (m['head'],m['tree'],c['tree'],c['commit'],c['manifest']['git'])),'missing exact future tree/commit')
    require(all(hx(m[k],64)for k in ('receiptSHA256','verifiedAuthoritySHA256','compatibilitySHA256')),'missing exact future authority hash')
    require(all(pos(v)for v in (m['run'],m['job'],m['outer']['id'])) and sizepin(want(m['outer']),80<<20)
      and sizepin(m['nested'],64<<20) and sizepin(want(c['manifest']),12<<20),'missing exact future retained archive')
    a=p['aliases'];old=p['oldURLs'];new=p['newURLs'];f=p['normalFiles']
    require(set(a)==old.keys() and set(a.values())==new.keys() and len(old)==len(new)==6 and not set(old)&set(new)
      and f.keys()==set(new)|SHELLS|{MF} and len(f)==10 and all(f[k]==v for k,v in new.items()),'unexpected exact Stage24 alias set')
    require(all(re.sub(r'\.[a-f0-9]{16}\.', '.ALIAS.',x)==re.sub(r'\.[a-f0-9]{16}\.', '.ALIAS.',y) and
      x.split('.')[-2]==old[x]['sha256'][:16] and y.split('.')[-2]==new[y]['sha256'][:16] for x,y in a.items()),'incoherent path identity')
    require(all(sizepin(v,12<<20)for v in f.values()) and want(c['manifest'])!=f[MF],'not a distinct retained manifest')
    return p

def capsule(p,nested,rec,independent):
    m=p['manufacture'];n=p['normal'];c=p['candidate']
    require(fact(nested)==m['nested'] and sha(rec)==m['receiptSHA256'] and sha(independent)==m['verifiedAuthoritySHA256'],'signed retained inputs mismatch')
    r=decode(rec);auth=decode(independent)
    require(r['actualNormalAuthority']==auth and (auth['run'],auth['head'],auth['artifact']['id'])==(n['run'],n['head'],n['artifact'])
      and want(auth['artifact'])==n['outer'] and want(auth['nestedNormal'])==n['normalZIP']
      and auth['decodedApprovedPNGCount']==40 and auth['authorizedNormalGenerated']==p['normalFiles'],'not the exact real Stage24 author/normal artifact')
    require(r['published'] is False and r['oldPhysicalTrackedAssetsPreserved'] is True and r['localRefUnchanged']==BASE
      and (r['base'],r['baseTree'],r['sourceGitBlobs'],r['priorPages'])==(BASE,TREE,SOURCE_NEW,p['priorPages'])
      and (r['candidateTree'],r['localProofCommit'])==(c['tree'],c['commit'])
      and (r['activeCount'],r['baselineRegisteredVerified'],r['retainedRegisteredVerified'],r['publicGraphsOld'],r['publicGraphsFinal'],r['expiredGraphsStillHaveBytes'])==(810,1311,1317,39,37,3)
      and r['zip']==m['nested'] and r['normalManifestBeforeRetention']==p['normalFiles'][MF]
      and hx(r['retainedOldPublishedGraphSha256'],64),'scope/manifest/candidate receipt mismatch')
    allowed=set(SOURCE_NEW)|set(p['normalFiles']);added=set(p['newURLs']);fs=r['files']
    require(len(allowed)==12 and set(fs)==allowed,'stage24 retained paths not exact')
    with zipfile.ZipFile(BytesIO(nested)) as z:
        require(safe(z,64<<20,inner=True)==allowed,'retained archive paths or modes differ')
        data={k:read(z,k,v['bytes'])for k,v in fs.items()}
    for k,b in data.items():
        require({**fact(b),'git':blob(b),'mode':'100644','change':('A' if k in added else 'M')}==fs[k],'file mode/bytes differ',k)
        if k in SOURCE_NEW:require(blob(b)==SOURCE_NEW[k],'not exact source authoring Git blob',k)
        elif k==MF:require({**fact(b),'git':blob(b)}==c['manifest'],'wrong exact retained manifest bytes')
        else:require(fact(b)==p['normalFiles'][k],'normal sealed bytes changed outside manifest',k)
    return data,r

def api(k):
    return decode(subprocess.check_output(['gh','api',f'repos/{TOP}/'+k],timeout=45))
def verify_and_handoff(p,dest):
    m=p['manufacture'];a=m['outer'];n=p['normal']
    require(not dest.exists() and dest.parent.resolve()==Path(os.environ['RUNNER_TEMP']).resolve(),'wrong fresh handoff directory')
    require((os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==(TOP,'push','refs/heads/'+BRANCH),'wrong workflow context')
    for target,parent,tid in ((NORM_HEAD,BASE,None),(m['head'],NORM_HEAD,m['tree'])):
        j=api('git/commits/'+target)
        require(j['sha']==target and [x['sha']for x in j['parents']]==[parent] and (tid is None or j['tree']['sha']==tid),'actual judge ancestry mismatch')
    run=api(f"actions/runs/{m['run']}");job=api(f"actions/jobs/{m['job']}")
    require((run['id'],run['head_sha'],run['head_branch'],run['path'],run['status'],run['conclusion'],run['event'])==
      (m['run'],m['head'],PRODUCER,WF,'completed','success','push') and run['repository']['full_name']==run['head_repository']['full_name']==TOP,'not the exact successful official retainer')
    require((job['id'],job['run_id'],job['name'],job['status'],job['conclusion'])==(m['job'],m['run'],'seal','completed','success')
        and {'Read-only trusted actual Stage24 and Pages evidence','Tokenless exact Stage24 retained tree and local object proof'}<=
        {s['name']for s in job['steps']if(s['status'],s['conclusion'])==('completed','success')},'missing official retainer steps')
    q=[x for x in api(f"actions/runs/{m['run']}/artifacts")['artifacts']if x['name']==ANAME and not x['expired']]
    require(len(q)==1,'missing unique official retained artifact');i=q[0]
    require((i['id'],i['size_in_bytes'],i['digest'],i['workflow_run']['id'],i['workflow_run']['head_sha'])==
      (a['id'],a['bytes'],'sha256:'+a['sha256'],m['run'],m['head']),'official artifact ID/body/parent drift')
    outer=dest.parent/'stage24-retained-outer.zip'
    with outer.open('xb')as f:subprocess.run(['gh','api',f"repos/{TOP}/actions/artifacts/{a['id']}/zip"],stdout=f,check=True,timeout=120)
    require(fact(outer.read_bytes())==want(a),'outer content identity mismatch')
    with zipfile.ZipFile(outer)as z:
        require(safe(z,80<<20)=={NESTED,RECEIPT,'SHA256SUMS','retainer-output.json','verified-authority.json','prepare-reproduction.log','B79-COMPATIBILITY-HISTORY.json'},'unexpected retainer archive file inventory')
        nested=read(z,NESTED,m['nested']['bytes']);rec=read(z,RECEIPT,2<<20);independent=read(z,'verified-authority.json',2<<20)
        capsule(p,nested,rec,independent)
        bridge=read(z,'B79-COMPATIBILITY-HISTORY.json',2<<20);j=decode(bridge)
        require(sha(bridge)==m['compatibilitySHA256'] and set(j['officialWindowExpiredSourceSHAs'])==EXPIRED
          and j['retentionPolicyUnchanged'] is True and j['retainedRegistry']==1317,'wrong official compatibility history')
        require(read(z,'SHA256SUMS',4096).decode().strip()==sha(nested)+'  '+NESTED,'retained digest manifest mismatch')
    dest.mkdir(mode=0o700)
    for k,v in ((NESTED,nested),(RECEIPT,rec),('verified-authority.json',independent)):
        (dest/k).write_bytes(v)
    for k in ('writer.py','safe-push.sh','PINS.json'):(dest/k).write_bytes((HERE/k).read_bytes())
    lock=''.join(sha(f.read_bytes())+'  '+f.name+'\n' for f in sorted(dest.iterdir())).encode()
    (dest/'HANDOFF.SHA256').write_bytes(lock)
    print(sha(lock))

def normalize(b,aliases):
    for x,y in sorted(aliases.items(),key=lambda e:-len(e[1])):
        b=b.replace(y.encode(),x.encode()).replace(Path(y).name.encode(),Path(x).name.encode())
    return b
def compatibility(p,old,data,receipt,show):
    pp=p['priorPages']; require(sha(old)==pp['manifestSHA256'] and blob(old)==pp['manifestGitBlob'],'not exact preceding manifest')
    A,B=decode(old),decode(data[MF]);a,b=inventory(A,810),inventory(B,810)
    aliases,enter=p['aliases'],set(p['newURLs'])
    require(stable(a)==p['preGraph'] and stable(b)==p['normalGraph'] and len(a.keys()&b.keys())==804 and
      a.keys()-b.keys()==aliases.keys() and b.keys()-a.keys()==enter and all(a[k]==b[k]for k in a.keys()&b.keys()),'unexpected graph aliases')
    require(stable({k:v for k,v in B.items()if k not in RET_HISTORY})==p['normalManifestWithoutHistory'],'retained manifest beyond allowed history')
    for k,v in p['oldURLs'].items():require(fact(show(k))==v==a[k],'old alias lost or different',k)
    for x,y in aliases.items():
        require(fact(data[y])==b[y],'added alias bytes differ',y)
        if x.endswith(('.js','.html')):require(normalize(data[y],aliases)==show(x),'non-pointer code change',x)
    for pth in SHELLS:require(normalize(data[pth],aliases)==show(pth),'shell changed beyond aliases',pth)
    ro,rn=registry(A),registry(B)
    require(len(ro)==1311 and len(rn)==1317 and not ro.keys()&enter and rn=={**ro,**p['newURLs']},'immutable URL history differs')
    oldPub,newPub=({g['sourceSha']:g for g in q['publishedGenerations']}for q in (A,B))
    require(len(oldPub)==39 and len(newPub)==37 and newPub.keys()==(oldPub.keys()-EXPIRED)|{BASE} and all(newPub[k]==oldPub[k]for k in oldPub.keys()&newPub.keys()),'old published graphs not preserved')
    compat={r['path']for r in B['previousFiles']}; require(B['publishedRetention']==A['publishedRetention'] and all(r['path'] in compat or r['path'] in b for k in EXPIRED for r in oldPub[k]['files']),'expired graph URLs not still active/reachable through compatibility')
    m=newPub[BASE];require(m['files']==A['files'] and m['publishedAt']==pp['publishedAt'] and m['publishedAtPrecision']=='instant'
       and m['evidence']==f"https://github.com/{TOP}/actions/runs/{pp['run']}" and m['graphSha256']==receipt['retainedOldPublishedGraphSha256'],'wrong exactly retained b79 authority')
    c=p['canonicalBinding'];require((B['project'],B['gameEntry'],B['workshopEntry'],B['playtest'].split('?')[0])==(c['campaign'],c['entry'],c['workshop'],c['embedded']),'wrong canonical runtime pointers')
    a1,b1=decode(show(A['project'])),decode(data[B['project']])
    require(len(b1['stages'])==len(b1['stageLibraries'])==50 and (b1['stages'][STAGE24_INDEX],b1['stageLibraries'][STAGE24_INDEX],b1['base'],b1['shared'])==
      (c['map'],c['packet'],c['base'],c['shared']),'wrong Stage24 native route')
    b1['stageLibraries'][STAGE24_INDEX]=a1['stageLibraries'][STAGE24_INDEX]
    require(a1==b1 and a1['stageLibraries'][STAGE24_INDEX] in aliases and fact(show(c['map']))==a[c['map']],'new campaign differs beyond Stage24 packet')
    return ro,rn

def prepare(p,r,output):
    require(not any(k in os.environ for k in ('GH_TOKEN','GITHUB_TOKEN','STAGE24_FRONT6_WRITE_TOKEN','STAGE24_FRONT6_NETWORK_TOKEN','GIT_ASKPASS')),'token present during bare byte-only assembly')
    require(git(r,'rev-parse','--is-bare-repository').strip()==b'true' and
      git(r,'rev-parse','HEAD').decode().strip()==BASE and git(r,'rev-parse','HEAD^{tree}').decode().strip()==TREE,'not exact bare b79')
    require(subprocess.run(['git','-C',str(r),'symbolic-ref','-q','HEAD'],stdout=subprocess.DEVNULL,check=False).returncode==1,'not detached HEAD')
    data,rec=capsule(p,(HERE/NESTED).read_bytes(),(HERE/RECEIPT).read_bytes(),(HERE/'verified-authority.json').read_bytes())
    show=lambda k:git(r,'show',BASE+':'+k)
    ro,rn=compatibility(p,show(MF),data,rec,show)
    original=tree_rows(r,BASE);added=set(p['newURLs']);changed=set(data)-added
    require(all(blob(show(k))==v for k,v in SOURCE_OLD.items()),'unmodified authoring baseline changed')
    require((ro.keys()|rn.keys())<=(original.keys()|added) and len(changed)==len(added)==6 and not added&original.keys() and
        all(original.get(k,('',))[:2]==('100644','blob')for k in changed),'not exact M6/A6 modes/physical history')
    git(r,'read-tree',BASE)
    for k,b in sorted(data.items()):
        h=git(r,'hash-object','-w','--no-filters','--stdin',inp=b).decode().strip()
        require(h==blob(b),'Git object byte mismatch',k)
        git(r,'update-index','--add','--cacheinfo','100644,'+h+','+k)
    t=git(r,'write-tree').decode().strip();c=p['candidate']
    require(t==c['tree'] and tree_rows(r,t)=={**original,**{k:('100644','blob',blob(b))for k,b in data.items()}},'retainer commit tree or immutable bytes differ')
    delta=set(git(r,'diff-tree','-r','--no-commit-id','--name-status','--no-renames',BASE,t).decode().splitlines())
    require(delta==({'M\t'+k for k in changed}|{'A\t'+k for k in added}),'not exact M6/A6',sorted(delta))
    env=dict(os.environ)
    for n in ('AUTHOR','COMMITTER'):
        env.update({f'GIT_{n}_NAME':'HONRO QA',f'GIT_{n}_EMAIL':'qa@honro.invalid',f'GIT_{n}_DATE':'2026-11-21T14:59:22Z'})
    h=git(r,'-c','commit.gpgSign=false','commit-tree',t,'-p',BASE,
      inp=b'Stage24: retained terminal face candidate proof (not published)\n',env=env).decode().strip()
    require(h==c['commit'] and git(r,'rev-list','--parents','-n1',h).decode().split()==[h,BASE] and git(r,'rev-parse',h+'^{tree}').decode().strip()==t,'exact staged commit SHA diverged from retainer')
    git(r,'update-ref','--no-deref','HEAD',h,BASE)
    output.write_text(h+'\n')
    print(json.dumps({'commit':h,'tree':t,'parent':BASE,'releaseRef':REF,'modified':sorted(changed),'added':sorted(added),'published':False}))

if __name__=='__main__':
    mode,*args=sys.argv[1:];p=load_pins()
    if mode=='pins' and not args:pass
    elif mode=='expected-candidate' and not args:print(p['candidate']['commit'])
    elif mode=='verify' and len(args)==1:verify_and_handoff(p,Path(args[0]))
    elif mode=='prepare' and len(args)==2:prepare(p,Path(args[0]),Path(args[1]))
    else:raise SystemExit('unsupported writer mode')
