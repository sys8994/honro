"""Stage14 exact retained artifact transport checks. Never builds, pushes, or deploys."""
import hashlib,json,os,re,stat,subprocess,sys,zipfile
from io import BytesIO
from pathlib import Path,PurePosixPath
HERE=Path(__file__).resolve().parent
TOP='sys8994/honro'
BRANCH='qa/stage14-candidate-writer-21809dc'
REF='refs/heads/release/act2-stage14-projection-20261121'
BASE='21809dc917101f9ee28672b34d923636ca58e7be';TREE='d3fb9a0ec8fdb21846067b49db4b71e5359f952a'
PRODUCER='qa/stage14-retention-21809dc';WF='.github/workflows/stage14-retention.yml'
MH='428dd3c9ae089846f226109f50c55d0cd9d76ee8';MT='1ca5acbb47b3e8984107e589a4c4544e9921b4d5'
R7='c857683ac6cba70b0a49870d4ce0be0a88ddeabc'; R7T='1486bb1debbbfd4f833322eb6da9158183984740'
ANAME='honro-stage14-retained-protected-proof-not-deployed'
NESTED='STAGE14-RETAINED-DELTA-QA-ONLY.zip'; RECEIPT='RETAINED-DELTA-RECEIPT.json'
MF='web/manifest.json'; SHELLS={'HONRO.html','HONRO_WORKSHOP.html','index.html'}
SOURCE='shared/runtime/act2-spatial-art.js'
SOURCE_OLD='f1d4b93c44d657ed48df03d11e648337a9f9a49b'
SOURCE_NEW={'bytes':32166,'sha256':'e091187a602892686af915d5666083d369254b580fa1d59689016bc7b4638099','git':'3409b094d17c8bb8593e19bd23805cc79432de56'}
RET_HISTORY={'previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
NORMAL='5c6ad13087162d6582e6d94c11cbb08ae4304c04e675596e7fb7068e18f8eb32'
COMPOSITE='c67eb7083963e19de60e79e84aeb99879c17ac181fa2b229b38a3dfcaca49108'
BASE_MF={'bytes':6627791,'sha256':'61061e7a60b48944c5230a07d529a3582103f6e0a5c056aaad02bd195556ac59','git':'ca657cb67768eb9ce2343352203bcc074d8c7679'}
PAGES_RUN=44938122195; PUBLISHED_AT='2026-11-21T18:57:02.1195350Z'
M_RUN=44944974489
COMMIT_AT='2026-11-21T20:14:00Z'
COMMIT_MSG=b'Stage14: omit nonwalk projected floor ink (candidate only)\n'
OUTER_NAMES={NESTED,RECEIPT,'SOURCE.json','GRAPH.json','AUTHORITY.json','retainer-output.json','npm-root-B.log','npm-game-B.log','release-guard-B.log','build-B.log','production-contract-B.log'}
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
def stamp(b):return {**fact(b),'git':blob(b)}
def load_pins():
    p=decode((HERE/'PINS.json').read_bytes())
    require(p['enabled'] is True and 'DISABLED' not in BRANCH+REF,'disabled until exact real retained authority and destination')
    m,c=p['manufacture'],p['candidate']
    require((p['base'],p['baseTree'],m['run'],m['head'],m['tree'])==(BASE,TREE,M_RUN,MH,MT),'authority pin drift')
    require(REF.startswith('refs/heads/release/') and re.fullmatch(r'refs/heads/release/[\w.-]+',REF) and '.' not in REF.split('/')[-1][:1],'not one fixed candidate destination')
    require(all(hx(x,40)for x in (c['tree'],c['commit'],c['manifest']['git'],m['nested']['git'])),'candidate objects not qualified')
    require(all(pos(x) for x in (m['job'],m['outer']['id'],c['publishedGraphCount'])) and type(c['expiredHistoryStillReachable']) is int and c['expiredHistoryStillReachable']>=0,'official counts not qualified')
    require(all(hx(x,64)for x in (p['preGraph'],p['normalGraph'],c['priorGraph'],c['retainedNonHistory'])),'exact immutable graphs not qualified')
    require(set(m['receipts'])=={RECEIPT,'GRAPH.json','AUTHORITY.json','retainer-output.json'} and all(sizepin(v,2<<20)for v in m['receipts'].values()),'official receipt bytes not qualified')
    require(sizepin(want(m['outer']),32<<20)and sizepin(want(m['nested']),20<<20)and sizepin(want(c['manifest']),12<<20),'archive/candidate hashes not qualified')
    a,old,new,f=(p[k]for k in ('aliases','oldURLs','newURLs','normalFiles'))
    require(len(a)==len(old)==len(new)==4 and set(a)==set(old) and set(a.values())==set(new) and not set(old)&set(new),'wrong 4 aliases')
    require(f.keys()==set(new)|SHELLS|{MF} and len(f)==8 and all(f[k]==v for k,v in new.items()),'wrong exact 8 normal outputs')
    require(all(sizepin(v,12<<20)for v in f.values()) and want(c['manifest'])!=f[MF],'wrong normal/retained manifest relationship')
    require(all(re.fullmatch(r'web/(runtime|entries)/[\w.-]+\.(js|html)',x) and re.sub(r'\.[a-f0-9]{16}\.', '.ALIAS.',x)==re.sub(r'\.[a-f0-9]{16}\.', '.ALIAS.',y) and x.split('.')[-2]==old[x]['sha256'][:16] and y.split('.')[-2]==new[y]['sha256'][:16] for x,y in a.items()),'content-address aliases mismatch')
    return p

def capsule(p,raw):
    m,c=p['manufacture'],p['candidate']; graph=decode(raw['GRAPH.json']); a=decode(raw['AUTHORITY.json'])
    require(all(fact(raw[k])==r for k,r in m['receipts'].items()),'retainer proof files not qualified')
    require(stable(graph)==NORMAL and dict(graph['aliases'])==p['aliases'],'normal canonical graph mismatch')
    require(a=={'verified':True,'base':BASE,'normalGraph':NORMAL,'browserRaw':'ffada7d00fb38dfcdc183ab3b6e9954d0a509bf9af719ce340dd30038a673bf7','run':44944262831,'job':136967981997,'head':R7,'receipt':14722533286,'priorPages':PAGES_RUN,'noReleaseAction':True},'retainer browser authority mismatch')
    r=decode(raw[RECEIPT]); n=raw[NESTED]
    require(r['status']=='PASS_RETAINED_QA_ONLY_NOT_PUBLISHED' and r['published'] is False and
      (r['base'],r['baseTree'],r['candidateTree'],r['normalGraph'],r['compositeSHA256'],r['priorPages'])==(BASE,TREE,c['tree'],NORMAL,COMPOSITE,PAGES_RUN),'wrong retained source/tree authority')
    require((r['activeCount'],r['oldPhysical'],r['retainedPhysical'],r['publishedGraphCount'],r['expiredHistoryStillReachable'],r['retainedGraph'])==(810,1321,1325,c['publishedGraphCount'],c['expiredHistoryStillReachable'],c['priorGraph']),'physical registry or published graph mismatch')
    require(stamp(n)==r['zip']==m['nested'] and want(r['normalManifest'])==p['normalFiles'][MF] and hx(r['normalManifest']['git'],40),'normal manifest or nested ZIP mismatch')
    allowed=set(p['normalFiles'])|{SOURCE}; added=set(p['newURLs']); fs=r['delta']
    require(len(allowed)==9 and set(fs)==allowed,'candidate count or path mismatch')
    with zipfile.ZipFile(BytesIO(n)) as z:
        require(safe(z,20<<20,inner=True)==allowed,'bad nested nine file archive')
        data={k:read(z,k,12<<20)for k in allowed}
    for k,b in data.items():
        f=stamp(b)
        require(fs[k]=={**f,'mode':'100644','change':'A' if k in added else 'M'},'mode, blob or SHA256 mismatch',k)
        require((f==SOURCE_NEW if k==SOURCE else f==c['manifest'] if k==MF else fact(b)==p['normalFiles'][k]==graph['activeB'][k]),'wrong exact bytes',k)
    return data,r

def api(k):
    return decode(subprocess.check_output(['gh','api',f'repos/{TOP}/'+k],timeout=45))
def verify_and_handoff(p,dest):
    m=p['manufacture']; a=m['outer']
    require(not dest.exists() and dest.parent.resolve()==Path(os.environ['RUNNER_TEMP']).resolve(),'wrong fresh handoff directory')
    require((os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==(TOP,'push','refs/heads/'+BRANCH),'wrong workflow context')
    require(api('git/ref/heads/master')['object']['sha']==BASE and api('git/ref/'+REF.removeprefix('refs/'))['object']['sha']==BASE,'protected master or pre-existing candidate moved')
    for head,parent,tree in ((MH,R7,MT),(R7,BASE,R7T),(BASE,None,TREE)):
        obj=api('git/commits/'+head)
        require((obj['sha'],obj['tree']['sha'])==(head,tree)and (parent is None or [v['sha']for v in obj['parents']]==[parent]),'official producer ancestry mismatch',head)
    run=api(f"actions/runs/{m['run']}"); job=api(f"actions/jobs/{m['job']}")
    require((run['id'],run['head_sha'],run['head_branch'],run['path'],run['status'],run['conclusion'],run['event'],run['run_attempt'])==
      (M_RUN,MH,PRODUCER,WF,'completed','success','push',1) and run['repository']['full_name']==run['head_repository']['full_name']==TOP,'not exact official successful retention')
    require((job['id'],job['run_id'],job['head_sha'],job['name'],job['status'],job['conclusion'])==(m['job'],M_RUN,MH,'retention','completed','success')
      and {'Authenticate official matched graph and preserve previous release','Exact native rebuild and sealed retained delta, no ref write'}<={s['name']for s in job['steps']if(s['status'],s['conclusion'])==('completed','success')},'missing both exact official proof steps')
    q=api(f"actions/runs/{M_RUN}/artifacts")['artifacts']
    require(len(q)==1 and q[0]['name']==ANAME and not q[0]['expired'],'exact retained artifact not unique'); i=q[0]
    require((i['id'],i['size_in_bytes'],i['digest'],i['workflow_run']['id'],i['workflow_run']['head_sha'])==(a['id'],a['bytes'],'sha256:'+a['sha256'],M_RUN,MH),'official artifact identity mismatch')
    outer=dest.parent/'stage14-retained-outer.zip'
    with outer.open('xb')as f:subprocess.run(['gh','api',f"repos/{TOP}/actions/artifacts/{a['id']}/zip"],stdout=f,check=True,timeout=120)
    require(fact(outer.read_bytes())==want(a),'outer archive digest mismatch')
    with zipfile.ZipFile(outer)as z:
        require(safe(z,32<<20)==OUTER_NAMES,'retainer archive inventory differs')
        raw={k:read(z,k,m['nested']['bytes'] if k==NESTED else m['receipts'][k]['bytes'])for k in {NESTED,*m['receipts']}}
    capsule(p,raw)
    dest.mkdir(mode=0o700)
    for k,v in raw.items():(dest/k).write_bytes(v)
    for k in ('writer.py','safe-push.sh','PINS.json'):(dest/k).write_bytes((HERE/k).read_bytes())
    lock=''.join(sha(f.read_bytes())+'  '+f.name+'\n' for f in sorted(dest.iterdir())).encode()
    (dest/'HANDOFF.SHA256').write_bytes(lock)
    print(sha(lock))

def check_physical(repo,registry,rows):
    # Object type/content is checked in one read-only pipe. No worktree allocation of old assets.
    todo={}
    for k,v in registry.items():
        require(re.fullmatch(r'web/(runtime|entries|data|styles|graphics|fonts)/[\w.-]+',k)and sizepin(v,100<<20),'invalid registered immutable address',k)
        require(k in rows and rows[k][:2]==('100644','blob'),'physical registered file missing from bare tree',k)
        oid=rows[k][2]
        require(oid not in todo or todo[oid]==v,'immutable Git object registry conflict',oid)
        todo[oid]=v
    with subprocess.Popen(['git','-C',str(repo),'cat-file','--batch'],stdin=subprocess.PIPE,stdout=subprocess.PIPE) as proc:
        for oid,v in todo.items():
            proc.stdin.write((oid+'\n').encode()); proc.stdin.flush()
            require(proc.stdout.readline().decode().strip()==f"{oid} blob {v['bytes']}",'physical immutable blob header mismatch',oid)
            size=v['bytes']; h=hashlib.sha256()
            while size:
                b=proc.stdout.read(min(size,1<<20));require(bool(b),'physical immutable blob truncated',oid)
                h.update(b);size-=len(b)
            require(proc.stdout.read(1)==b'\n' and h.hexdigest()==v['sha256'],'physical immutable byte mismatch',oid)
        proc.stdin.close(); require(proc.wait(timeout=30)==0,'physical immutable batch did not complete')

def normalize(b,aliases):
    for x,y in sorted(aliases.items(),key=lambda e:-len(e[1])):
        b=b.replace(y.encode(),x.encode()).replace(Path(y).name.encode(),Path(x).name.encode())
    return b

def compatibility(p,old,data,receipt,show):
    require(stamp(old)==BASE_MF,'not exact 21809 retained manifest')
    A,B=decode(old),decode(data[MF]);a,b=inventory(A,810),inventory(B,810)
    aliases,enter=p['aliases'],set(p['newURLs']); graph=p['candidate']
    require(stable(a)==p['preGraph'] and stable(b)==p['normalGraph'] and len(a.keys()&b.keys())==806 and
      a.keys()-b.keys()==aliases.keys() and b.keys()-a.keys()==enter and all(a[k]==b[k]for k in a.keys()&b.keys()),'active graph outside exact replacements')
    require(stable({k:v for k,v in B.items()if k not in RET_HISTORY})==graph['retainedNonHistory'],'normal manifest modified outside compat metadata')
    for k,v in p['oldURLs'].items():require(v==a[k],'old alias address differs',k)
    for x,y in aliases.items():
        require(fact(data[y])==b[y],'new alias bytes differ',y)
        # The ordered common16 is the only actual code delta; pinned actual normal digest applies there.
        if not x.startswith('web/runtime/ordered-common-16.'):require(normalize(data[y],aliases)==show(x),'non-pointer alias body changed',x)
    for k in SHELLS:require(normalize(data[k],aliases)==show(k),'outer shell changed beyond exact aliases',k)
    ro,rn=registry(A),registry(B)
    require(len(ro)==1321 and len(rn)==1325 and not ro.keys()&enter and rn=={**ro,**p['newURLs']},'registered URL union differs')
    oldPub,newPub=({g['sourceSha']:g for g in q['publishedGenerations']}for q in (A,B))
    expired=set(oldPub)-set(newPub)
    require(len(oldPub)==len(A['publishedGenerations'])==38 and len(newPub)==len(B['publishedGenerations'])==graph['publishedGraphCount']
      and len(expired)==graph['expiredHistoryStillReachable'] and set(newPub)-set(oldPub)=={BASE}
      and all(newPub[k]==oldPub[k]for k in oldPub.keys()&newPub.keys()),'published generations outside correct 21809 retention')
    m=newPub[BASE]
    require(m['files']==A['files'] and m['publishedAt']==PUBLISHED_AT and m['publishedAtPrecision']=='instant'
      and m['evidence']==f'https://github.com/{TOP}/actions/runs/{PAGES_RUN}' and m['graphSha256']==receipt['retainedGraph'],'new published entry must be exact prior live 21809 only')
    compat={v['path']for v in B['previousFiles']}
    require(B['publishedRetention']==A['publishedRetention'] and all(f['path']in compat or f['path']in b for k in expired for f in oldPub[k]['files']),'retention policy or protected prior addresses changed')
    require(B['project']==A['project'] and all(B[k]==aliases[A[k]] for k in ('gameEntry','workshopEntry')) and
      B['playtest']==aliases[A['playtest'].split('?')[0]]+'?embedded=1','active chapter/runtime target changed')
    return ro

def prepare(p,r,output):
    require(not any(k in os.environ for k in ('GH_TOKEN','GITHUB_TOKEN','STAGE14_WRITE_TOKEN','STAGE14_NETWORK_TOKEN','GIT_ASKPASS')),'credential present in bare byte-only assembly')
    require(git(r,'rev-parse','--is-bare-repository').strip()==b'true' and
      git(r,'rev-parse','HEAD').decode().strip()==BASE and git(r,'rev-parse','HEAD^{tree}').decode().strip()==TREE,'wrong exact bare base')
    require(subprocess.run(['git','-C',str(r),'symbolic-ref','-q','HEAD'],stdout=subprocess.DEVNULL,check=False).returncode==1,'not detached HEAD')
    require(not output.exists(),'immutable receipt path exists')
    data,rec=capsule(p,{k:(HERE/k).read_bytes()for k in {NESTED,*p['manufacture']['receipts']}})
    show=lambda k:git(r,'show',BASE+':'+k)
    ro=compatibility(p,show(MF),data,rec,show)
    original=tree_rows(r,BASE);added=set(p['newURLs']);changed=set(data)-added
    require(blob(show(SOURCE))==SOURCE_OLD and changed==SHELLS|{MF,SOURCE} and len(added)==4 and not added&original.keys() and
        all(original.get(k,('',))[:2]==('100644','blob')for k in changed),'source old blob or exact M5/A4 mode mismatch')
    check_physical(r,ro,original)
    git(r,'read-tree',BASE)
    for k,b in sorted(data.items()):
        h=git(r,'hash-object','-w','--no-filters','--stdin',inp=b).decode().strip()
        require(h==blob(b),'Git indexed blob mismatch',k)
        git(r,'update-index','--add','--cacheinfo','100644,'+h+','+k)
    t=git(r,'write-tree').decode().strip();c=p['candidate']
    require(t==c['tree'] and tree_rows(r,t)=={**original,**{k:('100644','blob',blob(b))for k,b in data.items()}},'assembled tree or unrelated paths differ')
    delta=set(git(r,'diff-tree','-r','--no-commit-id','--name-status','--no-renames',BASE,t).decode().splitlines())
    require(delta=={'M\t'+k for k in changed}|{'A\t'+k for k in added},'not exact M5/A4')
    env=dict(os.environ)
    for n in ('AUTHOR','COMMITTER'):
        env.update({f'GIT_{n}_NAME':'HONRO QA',f'GIT_{n}_EMAIL':'qa@honro.invalid',f'GIT_{n}_DATE':COMMIT_AT})
    h=git(r,'-c','commit.gpgSign=false','commit-tree',t,'-p',BASE,inp=COMMIT_MSG,env=env).decode().strip()
    require(h==c['commit'] and git(r,'rev-list','--parents','-n1',h).decode().split()==[h,BASE] and git(r,'rev-parse',h+'^{tree}').decode().strip()==t,'candidate commit/parent/tree not exact')
    git(r,'update-ref','--no-deref','HEAD',h,BASE)
    output.write_text(h+'\n')
    print(json.dumps({'commit':h,'tree':t,'parent':BASE,'candidateRef':REF,'modified':sorted(changed),'added':sorted(added),'oldPhysicalVerified':len(ro),'published':False}))

if __name__=='__main__':
    mode,*args=sys.argv[1:];p=load_pins()
    if mode=='pins' and not args:pass
    elif mode=='expected-candidate' and not args:print(p['candidate']['commit'])
    elif mode=='verify' and len(args)==1:verify_and_handoff(p,Path(args[0]))
    elif mode=='prepare' and len(args)==2:prepare(p,Path(args[0]),Path(args[1]))
    else:raise SystemExit('unsupported writer mode')
