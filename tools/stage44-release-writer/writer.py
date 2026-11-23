"""Verify and reconstruct exact hosted Stage44 producer output; no push here."""
import hashlib,io,json,os,re,stat,subprocess as sp,sys,zipfile
from pathlib import Path
P=json.loads(Path(__file__).with_name('PINS.json').read_bytes())
R=P['base']; REP='sys8994/honro'; ORIGIN='https://github.com/sys8994/honro'
QA=P['producer']; B=R['head']; C=P['target']; MAN='web/manifest.json'
SHELL={'index.html','HONRO.html','HONRO_WORKSHOP.html'}; ADD=set(P['aliases'].values())
GEN=SHELL|ADD|{MAN}; SRC={v['path']:(v['stock'],v['candidate']) for v in C['source'].values()}
TEST=C['test']; WF='.github/workflows/stage44-render-recovery-release-writer.yml'
TOOLS={WF,*('tools/stage44-release-writer/'+k for k in ('PINS.json','writer.py','safe-push.sh'))}
INNER='STAGE44-GENERATED-OVERLAY.zip'; RECEIPT='RELEASE-OVERLAY.json'
KNOWN={INNER,RECEIPT,'ORDERED.json','npm-root.log','npm-game.log','renderer-unit.log','build.log'}

def sha(b):return hashlib.sha256(b).hexdigest()
def blob(b):return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def rich(b):return {**fact(b),'git':blob(b)}
def obj(b):
    def check(v):d=dict(v);assert len(d)==len(v);return d
    return json.loads(b,object_pairs_hook=check)
def git(r,*args,**kw):return sp.check_output(['git','-C',str(r),*args],timeout=180,**kw).decode().strip()
def read(r,k):
    p=r/k
    assert p.resolve()==p and p.is_file() and stat.S_ISREG(p.lstat().st_mode),k
    return p.read_bytes()
def safe(z,names,cap):
    i=z.infolist()
    assert len(i)==len(names) and {v.filename for v in i}==names
    assert sum(v.file_size for v in i)<cap and all(not v.is_dir() and v.compress_type in (zipfile.ZIP_STORED,zipfile.ZIP_DEFLATED) and stat.S_IFMT(v.external_attr>>16) in (0,stat.S_IFREG) for v in i)
    assert z.testzip() is None
def index(rows):
    x={}
    for v in rows:
        k=v['path'];v={q:v[q] for q in ('bytes','sha256')}
        assert re.fullmatch(r'web/(runtime|entries|data|styles|graphics|fonts)/[\w.-]+',k,re.ASCII)
        assert k not in x or x[k]==v
        x[k]=v
    return x
def registry(m):return index(m['files']+m['previousFiles']+sum(m['previousGenerations'],[])+[f for g in m['publishedGenerations'] for f in g['files']])

def run(w):
    assert __debug__ and P['enabled'] is P['scopeApproval'] is True
    assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_REF'],os.environ['GITHUB_EVENT_NAME'])==(REP,P['qaRef'],'push')
    assert all(type(QA[k]) is int and QA[k]>0 for k in ('run','job','artifact'))
    assert all(re.fullmatch('[a-f0-9]{40}',k or '') for k in (QA['head'],QA['tree'],P['approvedTree']))
    assert re.fullmatch('[a-f0-9]{64}',P['receiptSHA256'] or '')
    q=Path(os.environ['GITHUB_WORKSPACE']).resolve(strict=True)
    assert git(q,'rev-parse','HEAD')==os.environ['GITHUB_SHA'] and git(q,'show','-s','--format=%P','HEAD')==B
    assert git(q,'rev-parse',B+'^{tree}')==R['tree'] and not git(q,'status','--porcelain','--untracked-files=all')
    assert set(git(q,'diff','--name-status','--no-renames',B,'HEAD').splitlines())=={'A\t'+f for f in TOOLS}
    assert all(git(q,'ls-tree','HEAD','--',k).startswith('100644 ') for k in TOOLS)
    assert git(q,'rev-parse','origin/master')==B and not w.exists()
    def api(k,raw=False):
        cmd=['gh','api',*(['--allow-escape-sequences'] if raw else []),f'repos/{REP}/{k}']
        return sp.check_output(cmd,timeout=110)
    def checked(run,job=None):
        x=obj(api(f'actions/runs/{run}'));assert x['status']=='completed' and x['conclusion']=='success'
        y=obj(api(f'actions/jobs/{job}')) if job is not None else None
        if y:assert y['run_id']==run and y['head_sha']==x['head_sha'] and y['status']=='completed' and y['conclusion']=='success'
        return x,y
    def artifact(id,run,head,expected):
        a=obj(api(f'actions/artifacts/{id}'))
        assert (a['workflow_run']['id'],a['workflow_run']['head_sha'],a['expired'],a['digest'])==(run,head,False,'sha256:'+expected)
        return a
    x,y=checked(QA['run'],QA['job'])
    assert (x['head_sha'],x['head_branch'],y['name'])==(QA['head'],QA['branch'],'exact-overlay')
    v=obj(api(f"git/commits/{QA['head']}"));assert v['tree']['sha']==QA['tree'] and [r['sha'] for r in v['parents']]==[B]
    page,dep=checked(P['basePages']['run'],P['basePages']['job'])
    assert page['head_sha']==B and page['head_branch']=='master' and page['name']=='pages build and deployment' and dep['name']=='deploy' and any(s['name']=='Deploy to GitHub Pages' and s['conclusion']=='success' for s in dep['steps'])
    n=P['native'];proof,_=checked(n['run'])
    artifact(n['artifact'],n['run'],proof['head_sha'],n['zipSHA256'])
    a=artifact(QA['artifact'],QA['run'],QA['head'],QA['outer']['sha256'])
    assert a['name']==QA['name'] and a['size_in_bytes']==QA['outer']['bytes']
    outer=api(f"actions/artifacts/{QA['artifact']}/zip",raw=True)
    assert fact(outer)==QA['outer']
    with zipfile.ZipFile(io.BytesIO(outer)) as z:
        safe(z,KNOWN,28<<20);rbytes=z.read(RECEIPT);assert sha(rbytes)==P['receiptSHA256'];receipt=obj(rbytes)
        inner=z.read(INNER);assert rich(inner)==receipt['overlay']; graph=obj(z.read('ORDERED.json'))
    assert receipt['status']=='PASS_EXACT_NO_DEPLOY_STAGE44_RELEASE_OVERLAY' and receipt['noDeploy'] is True
    assert (receipt['base'],receipt['baseTree'],receipt['candidate'],receipt['candidateTree'],receipt['qaHead'],receipt['assembledReleaseTree'])==(B,R['tree'],C['head'],C['tree'],QA['head'],P['approvedTree'])
    assert receipt['basePages']==P['basePages'] and receipt['reviewedNative']==n
    assert len(GEN)==8 and len(ADD)==4 and receipt['approvedAliasPairs']==graph['addressPairs']==P['aliases'] and receipt['activeCount']==811
    assert receipt['registryBefore']==1271 and receipt['registryAfter']==1275 and receipt['protectedSource']==P['source']
    with zipfile.ZipFile(io.BytesIO(inner)) as z:
        safe(z,GEN,16<<20);files={k:z.read(k) for k in GEN}
    assert {k:rich(v) for k,v in files.items()}==receipt['files'] and rich(files[MAN])==receipt['retainedManifest']
    # From here, no OAuth credentials are passed to Git or application scripts.
    env={k:v for k,v in os.environ.items() if k not in ('GH_TOKEN','GITHUB_TOKEN','RELEASE_TOKEN')}
    assert not any(k.startswith('GIT_CONFIG_') for k in env)
    git(q,'-c','credential.helper=','-c','http.extraHeader=','fetch','--no-tags',ORIGIN+'.git',C['head'],env={**env,'GIT_TERMINAL_PROMPT':'0'})
    assert git(q,'rev-parse','FETCH_HEAD')==C['head'] and git(q,'show','-s','--format=%P %T',C['head'])==f"{B} {C['tree']}"
    w.mkdir();b=w/'B'
    git(q,'-c','core.hooksPath=/dev/null','worktree','add','--detach',str(b),B,env=env)
    assert not git(b,'status','--porcelain') and sha(read(b,MAN))==R['files'][MAN]
    m=obj(read(b,MAN));f=obj(files[MAN]);stock=registry(m);future=registry(f)
    assert len(stock)==1271 and len(future)==1275 and future.keys()-stock.keys()==ADD and all(future[k]==v for k,v in stock.items())
    assert set(index(f['files']))-set(index(m['files']))==ADD and set(index(m['files']))-set(index(f['files']))==P['aliases'].keys()
    assert f['project']==m['project'] and f['publishedRetention']==m['publishedRetention']
    for k,v in P['source'].items():assert blob(read(b,k))==v
    for k,v in stock.items():assert fact(read(b,k))==v
    for k,v in files.items():
        assert (b/k).exists()==(k not in ADD) and not (b/k).is_symlink()
        (b/k).write_bytes(v)
    for k,(old,new) in SRC.items():assert blob(read(b,k))==old
    for k,oid in {**{k:v[1] for k,v in SRC.items()},TEST['path']:TEST['git']}.items():
        data=sp.check_output(['git','-C',str(q),'show',C['head']+':'+k],env=env,timeout=90)
        assert blob(data)==oid;(b/k).write_bytes(data)
    for k,v in future.items():assert fact(read(b,k))==v
    allpaths=GEN|SRC.keys()|{TEST['path']}
    git(b,'add','--',*sorted(allpaths),env=env)
    expected={'A\t'+k for k in ADD|{TEST['path']}}|{'M\t'+k for k in SHELL|{MAN,*SRC}}
    assert sorted(expected)==receipt['exactReleaseDiff']
    assert set(git(b,'diff','--cached','--name-status','--no-renames',B).splitlines())==expected and not git(b,'diff','--name-only') and not git(b,'ls-files','--others','--exclude-standard')
    assert all(git(b,'ls-files','--stage','--',k).split()[:3]==['100644',blob(read(b,k)),'0'] for k in allpaths)
    tree=git(b,'write-tree',env=env);assert tree==P['approvedTree']
    commit=sp.check_output(['git','-C',str(b),'-c','user.name=honro automation','-c','user.email=github-actions[bot]@users.noreply.github.com','commit-tree',tree,'-p',B],input=b'Restore the verified Act 5 Stage 4 terrain rendering\n',env=env,timeout=90).decode().strip()
    assert git(b,'show','-s','--format=%P %T',commit)==f'{B} {tree}'
    (w/'candidate.sha').write_text(commit+'\n');(w/'candidate.tree').write_text(tree+'\n')
    (w/'ASSEMBLY.json').write_text(json.dumps({'status':'EXACT_STAGE44_RELEASE_TREE_NO_PUSH','base':B,'candidateCommit':commit,'candidateTree':tree,'generated':receipt['files'],'exactReleaseDiff':sorted(expected),'producer':QA,'native':n},indent=2)+'\n')
if __name__=='__main__':run(Path(sys.argv[1]).resolve())
