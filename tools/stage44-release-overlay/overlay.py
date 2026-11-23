"""Read-only hosted custody of approved Stage44 generated release bytes."""
import hashlib,json,os,re,stat,subprocess,sys,time,zipfile
from pathlib import Path

P=json.loads(Path(__file__).with_name('PINS.json').read_bytes())
B=P['arms']['D']; C=P['candidate']; F='web/manifest.json'
RETAINER='tools/release/retain-published-web.mjs'
KEEP={'previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
SHELLS={'index.html','HONRO.html','HONRO_WORKSHOP.html'}
WF='.github/workflows/stage44-render-recovery-release-bytes.yml'
TOOLS={'tools/stage44-release-overlay/'+p for p in ['PINS.json','graph.mjs','overlay.py']}
SRC={v['path']:(v['stock'],v['candidate']) for v in C['source'].values()}
TEST=C['test']
PAIRS=P['passedOrdered']['addressPairs']
NEW=set(PAIRS.values())

def need(x,msg):
    if not x: raise RuntimeError(msg)
def git(root,*argv):
    return subprocess.check_output(['git','-C',str(root),*argv],text=True,timeout=90).strip()
def read(root,rel):
    p=root/rel
    need(p.resolve()==p and p.is_file() and stat.S_ISREG(p.lstat().st_mode),'bad path '+str(p))
    return p.read_bytes()
def sha(b):return hashlib.sha256(b).hexdigest()
def blob(b):return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def rich(b):return {**fact(b),'git':blob(b)}
def dump(p,v):p.write_text(json.dumps(v,indent=2)+'\n')
def live(m):return {k:v for k,v in m.items() if k not in KEEP}
def idx(rows):
    d={}
    for x in rows:
        k=x['path'];v={z:x[z] for z in ('bytes','sha256')}
        need(re.fullmatch(r'web/(runtime|entries|data|styles|graphics|fonts)/[\w.-]+',k,re.ASCII) and type(v['bytes']) is int and v['bytes']>=0 and re.fullmatch(r'[a-f0-9]{64}',v['sha256']),'bad registry record '+k)
        need(k not in d,'duplicate paths '+k);d[k]=v
    return d
def registry(m):
    q={}
    for rows in [m['files'],m['previousFiles'],*m['previousGenerations'],*(v['files'] for v in m['publishedGenerations'])]:
        for k,v in idx(rows).items():
            need(k not in q or q[k]==v,'immutable conflict '+k);q[k]=v
    return q
def scan(root,rows):
    for k,v in rows.items():need(fact(read(root,k))==v,'immutable byte mismatch: '+k)
def manifest(root):return json.loads(read(root,F))
def pristine(root,pin):
    need(git(root,'rev-parse','HEAD')==pin['head'] and git(root,'rev-parse','HEAD^{tree}')==pin['tree'] and not git(root,'status','--porcelain','--untracked-files=all'),'bad exact checkout '+str(root))

def pre(w,q):
    a,b=w/'D',w/'C';pristine(a,B);pristine(b,C)
    need(not git(q,'status','--porcelain','--untracked-files=all') and git(q,'rev-parse','HEAD')==os.environ['GITHUB_SHA'] and git(q,'show','-s','--format=%P','HEAD')==B['head'],'bad QA checkout')
    need(set(git(q,'diff','--name-status','--no-renames',B['head'],'HEAD').splitlines())=={'A\t'+f for f in TOOLS|{WF}},'wrong add-only QA payload')
    need(git(b,'show','-s','--format=%P','HEAD')==B['head'] and set(git(b,'diff','--name-status','--no-renames',B['head'],'HEAD').splitlines())==({f'M\t{k}' for k in SRC}|{'A\t'+TEST['path']}),'wrong product source diff')
    need({k:(blob(read(a,k)),blob(read(b,k))) for k in SRC}==SRC and blob(read(b,TEST['path']))==TEST['git'],'wrong signed source blobs')
    z=read(a,F);m=json.loads(z);reg=registry(m)
    need(rich(z)==dict(bytes=P['preserveCurrent']['activeBytes'],sha256=B['files'][F],git=P['preserveCurrent']['manifestGit']) and len(reg)==P['oldRegistry'] and len(m['publishedGenerations'])==P['oldGenerations'],'base manifest mismatch')
    need(B['head'] not in {g['sourceSha'] for g in m['publishedGenerations']},'3c already registered')
    scan(a,reg)
    for k,v in P['retainer'].items():need(blob(read(a,k))==blob(read(b,k))==v,'wrong tool '+k)
    for k,v in P['preserveCurrent']['source'].items():need(blob(read(a,k))==blob(read(b,k))==v,'wrong protected source '+k)
    for k in ['package.json','package-lock.json','game/package.json','game/package-lock.json']:
        raw=read(b,k);need(raw==read(a,k),'locked dependency inputs differ '+k)
        if k.endswith('lock.json'):
            x=json.loads(raw)
            need(x['lockfileVersion']==3 and all(not n or n.startswith('node_modules/') and not v.get('link') and re.fullmatch(r'https://registry\.npmjs\.org/[^?#]+\.tgz',v.get('resolved','')) and re.fullmatch(r'sha512-[A-Za-z0-9+/]+=*',v.get('integrity','')) for n,v in x['packages'].items()),'wrong dependency registry or integrity')
def graph(w):
    a,b=w/'D',w/'C'
    def inv(r):
        m=manifest(r);rows=idx(m['files']);scan(r,rows)
        return {'manifest':m,'active':rows,'shell':fact(read(r,'HONRO.html')),'workshopShell':fact(read(r,'HONRO_WORKSHOP.html'))}
    A,D=inv(a),inv(b);x,y=A['active'],D['active']
    need(len(x)==len(y)==P['preserveCurrent']['activeFiles'] and set(x)-set(y)==PAIRS.keys() and set(y)-set(x)==NEW and all(x[k]==y[k] for k in x.keys()&y.keys()),'unapproved active immutable change')
    need({k:y[k]['sha256'] for k in P['passedHTTP']}==P['passedHTTP'],'exact browser-served compiled bytes not reproduced')
    campaign=A['manifest']['project']
    need(D['manifest']['project']==campaign and x[campaign]==y[campaign],'campaign changed')
    c=json.loads(read(a,campaign))
    need(len(c['stages'])==len(c['stageLibraries'])==50,'wrong chapter graph size')
    for k in c['stages']+c['stageLibraries']:
        need(k in x and k in y and x[k]==y[k],'changed chapter map/art '+k)
        if 'assets-parts.' in k:
            d=json.loads(read(a,k));v=b''.join(read(a,n['path']) for n in d['parts'])
            need(fact(v)=={z:d[z] for z in ('bytes','sha256')} and all(x[n['path']]==y[n['path']]=={z:n[z] for z in ('bytes','sha256')} for n in d['parts']),'changed split body '+k)
    for k,(old,new) in SRC.items():need(blob(read(a,k))==old and blob(read(b,k))==new,'builder changed approved source '+k)
    for k,v in P['preserveCurrent']['source'].items():need(blob(read(b,k))==v,'builder changed protected source '+k)
    dump(w/'out'/'CLOSURE-PRE.json',{'b':A,'c':D,'bonly':sorted(PAIRS),'conly':sorted(NEW)})
def assemble(w):
    a,b=w/'D',w/'C';pristine(a,B)
    od=json.loads(read(w/'out','ORDERED.json'));need(od==P['passedOrdered'],'compiled scope differs from exact actual predeploy receipt')
    m,n=manifest(a),manifest(b);reg=registry(m);stock=idx(m['files']);new=idx(n['files']);need(not (NEW&reg.keys()),'new alias collides with physically retained alias')
    merged={**n,**{k:m[k] for k in KEEP}}
    prev={r['path'] for r in m['previousFiles']}
    merged['previousFiles']=[*m['previousFiles'],*(dict(path=k,**reg[k]) for k in sorted(reg) if k not in new and k not in prev)]
    union={**reg,**{k:new[k] for k in NEW}};need(registry(merged)==union,'unclosed previous-byte registry')
    for k in SHELLS|NEW:
        need((a/k).exists()==(k in SHELLS),'wrong overlay path class '+k)
        (a/k).write_bytes(read(b,k))
    dump(a/F,merged)
    t=P['basePages'];e=f"https://github.com/sys8994/honro/actions/runs/{t['run']}"
    before=int(time.time()*1000)
    q=json.loads(subprocess.check_output(['node',RETAINER,B['head'],'--published-at',t['publishedAt'],'--evidence',e],cwd=a,timeout=210))
    after=int(time.time()*1000)
    final=manifest(a)
    pr={v['sourceSha']:v for v in m['publishedGenerations']};nxt={v['sourceSha']:v for v in final['publishedGenerations']}
    need(q['restored']==[] and q['restoredBytes']==0 and B['head'] in nxt and nxt[B['head']]['files']==m['files'] and nxt[B['head']]['evidence']==e and nxt[B['head']]['publishedAt']==t['publishedAt'],'bad 3c official publication registration')
    need(set(nxt)<=set(pr)|{B['head']} and all(pr[k]==nxt[k] for k in pr.keys()&nxt.keys()),'rewrote existing historical publication records')
    js="""import fs from 'node:fs';import{graphSha256,selectPublishedGenerations}from './shared/web-retention.mjs';const i=JSON.parse(fs.readFileSync(0,'utf8'));const g={...i.manifest,graphSha256:graphSha256(i.manifest.files)};console.log(JSON.stringify(i.clock.map(now=>selectPublishedGenerations([g,...i.old],{now}))));"""
    calc=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=a,input=json.dumps({'manifest':nxt[B['head']],'old':m['publishedGenerations'],'clock':[before,after]}).encode(),timeout=80))
    need(calc[0]==calc[1]==final['publishedGenerations'],'unexpected retention policy or time boundary')
    need(len(union)==P['oldRegistry']+4 and registry(final)==union and live(final)==live(n) and final['publishedRetention']==m['publishedRetention'],'active or historical closure changed by retention')
    scan(a,union)
    for k in set(SRC)|{TEST['path']}:(a/k).write_bytes(read(b,k))
    need({k:blob(read(a,k)) for k in SRC}=={k:v[1] for k,v in SRC.items()} and blob(read(a,TEST['path']))==TEST['git'],'recreated source differs')
    allpath=SHELLS|NEW|{F,*SRC,TEST['path']}
    git(a,'add','--',*sorted(allpath))
    expect={'A\t'+k for k in NEW|{TEST['path']}}|{'M\t'+k for k in SHELLS|{F,*SRC}}
    need(set(git(a,'diff','--cached','--name-status','--no-renames',B['head']).splitlines())==expect and not git(a,'diff','--name-only') and not git(a,'ls-files','--others','--exclude-standard'),'exact release-tree diff failed')
    for k in allpath:
        need(git(a,'ls-files','--stage','--',k).split()[:3]==['100644',blob(read(a,k)),'0'],'generated or source Git blob differs '+k)
    out=w/'out'; target=out/'STAGE44-GENERATED-OVERLAY.zip';generated=sorted(SHELLS|NEW|{F})
    with zipfile.ZipFile(target,'w',compression=zipfile.ZIP_DEFLATED)as z:
        for k in generated:z.write(a/k,k)
    scene={k:rich(read(a,k)) for k in generated}
    with zipfile.ZipFile(target)as z:
        need(z.namelist()==generated and z.testzip() is None and all(rich(z.read(k))==v for k,v in scene.items()),'exact generated overlay ZIP failed')
    dump(out/'RELEASE-OVERLAY.json',{'status':'PASS_EXACT_NO_DEPLOY_STAGE44_RELEASE_OVERLAY','base':B['head'],'baseTree':B['tree'],'candidate':C['head'],'candidateTree':C['tree'],'assembledReleaseTree':git(a,'write-tree'),'reviewedNative':P['native'],'basePages':t,'qaHead':os.environ['GITHUB_SHA'],'activeCount':len(new),'registryBefore':len(reg),'registryAfter':len(union),'publishedGenerationsBefore':len(pr),'publishedGenerationsAfter':len(nxt),'expiredMetadataOnly':sorted(set(pr)-set(nxt)),'approvedAliasPairs':PAIRS,'rawNormalManifest':rich(read(b,F)),'retainedManifest':scene[F],'overlay':rich(target.read_bytes()),'files':scene,'exactReleaseDiff':sorted(expect),'protectedSource':P['preserveCurrent']['source'],'noDeploy':True})
if __name__=='__main__':
    need(P['enabled'] is True and os.getenv('GITHUB_REF')==P['qaRef'] and os.getenv('GITHUB_REPOSITORY')=='sys8994/honro','disabled: approved exact no-deploy branch only')
    op=sys.argv[1];w=Path(sys.argv[2]).resolve(strict=True)
    if op=='pre':pre(w,Path(sys.argv[3]).resolve(strict=True))
    elif op=='graph':graph(w)
    elif op=='package':assemble(w)
    else:raise ValueError(op)
