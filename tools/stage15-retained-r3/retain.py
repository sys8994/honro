"""Static local Stage15 retained-release verification helpers, no build/API/commit launcher."""
import hashlib,json,re,stat,subprocess,zipfile,os,sys,shutil
from pathlib import Path,PurePosixPath
ARCHIVE_ONLY={'previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
MANIFEST='web/manifest.json'
SAFE=re.compile(r'^web/(?:runtime|entries|data|styles|graphics|fonts)/[\w.-]+\.([a-f0-9]{16})\.[\w]+$',re.ASCII)
HEX64=re.compile(r'^[0-9a-f]{64}$')
HEX40=re.compile(r'^[0-9a-f]{40}$')
def req(ok,*why):
    if not ok:raise SystemExit(f'HOLD: {why}')
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def fact_path(p):
    req(p.is_file() and not p.is_symlink(),'not regular',p)
    with p.open('rb')as f:return {'bytes':p.stat().st_size,'sha256':hashlib.file_digest(f,'sha256').hexdigest()}
def j(s):
    def obj(rows):
        d={}
        for k,v in rows:
            req(k not in d,'duplicate manifest key',k)
            d[k]=v
        return d
    return json.loads(s,object_pairs_hook=obj)
def roles(d):return {k:v for k,v in d.items()if k not in ARCHIVE_ONLY}
def records(groups):
    out={}
    for g in groups:
        here=set()
        for row in g:
            p,h,n=row['path'],row['sha256'],row['bytes'];m=SAFE.fullmatch(p)
            req(m and HEX64.fullmatch(h) and h[:16]==m[1] and type(n)is int and n>=0 and p not in here,'bad immutable record',p)
            k={'bytes':n,'sha256':h}
            req(p not in out or out[p]==k,'immutable collision',p)
            out[p]=k;here.add(p)
    return out
def registered(x):
    return records([x['files'],x.get('previousFiles',[]),*x.get('previousGenerations',[]),*[y['files']for y in x.get('publishedGenerations',[])]])
def graph(m):
    return sha(json.dumps([[p,v['sha256'],v['bytes']]for p,v in sorted(m.items())],ensure_ascii=False,separators=(',',':')).encode())
def audit_release_normal(live,normal,root,p):
    q=p['qa']
    req(fact(live)==p['base']['manifest'] and fact(normal)==q['normalManifest'],'exact official normal manifest bytes differ')
    a,b=j(live),j(normal)
    old,new=[records([m['files']])for m in (a,b)]
    common=old.keys()&new.keys()
    req(len(old)==len(new)==809 and all(old[k]==new[k]for k in common),'untouched active graph drift')
    extra={k:new[k]for k in new.keys()-old.keys()}
    req(len(extra)==9 and all(extra.get(k)==v for k,v in q['observedNewImmutable'].items()),'unexpected new active browser roles')
    unpublished=set(extra)-set(q['observedNewImmutable'])
    rc=lambda k:re.sub(r'\.[0-9a-f]{16}\.', '.HASH.', k)
    req(len(unpublished)==2 and {rc(k)for k in unpublished}==set(q['newUnobservedRoles']),'unexpected workshop/direct-entry roles')
    req(all(v is None or v in unpublished for v in q['newUnobservedRoles'].values()),'wrong direct game entry identity')
    req({k:old[k]for k in old.keys()-new.keys()}==q['priorActiveRetired'],'unexpected retired active digests')
    req(all(fact_path(root/k)==v for k,v in new.items()),'normal fresh disk file bytes differ')
    req(fact_path(root/'HONRO.html')==q['normalGameHTML'] and
        (root/'HONRO.html').read_bytes()==(root/'index.html').read_bytes(),'public shell HTML mismatch')
    return a,b,old,new
def audit_after_retainer(before,after,stockmanifest,root,p,assembly_head):
    q=p['qa']
    req(set(before)==set(after) and roles(before)==roles(after),'retainer changed non-archival active manifest roles')
    for x in ('publishedRetention','publishedGenerations','previousFiles','previousGenerations'):
        req(x in after,'missing retention field',x)
    base=p['base'];st=base['pages']
    v=[g for g in after['publishedGenerations'] if g['sourceSha']==base['commit']]
    old=records([stockmanifest['files']])
    req(len(v)==1 and v[0]['files']==stockmanifest['files'] and v[0]['graphSha256']==graph(old) and
        v[0]['publishedAt']==st['publishedAt'] and v[0]['publishedAtPrecision']=='instant' and
        v[0]['evidence']==f"https://github.com/sys8994/honro/actions/runs/{st['run']}",'prior live generation not properly retained')
    req(all(g['sourceSha'] not in (q['head'],assembly_head) for g in after['publishedGenerations']),'an unpublished candidate was registered as live')
    x,y=registered(stockmanifest),registered(after)
    req(all(x[k]==y[k] for k in x.keys()&y.keys()),'retention metadata changed immutable history')
    req(all(fact_path(root/k)==v for k,v in (x|y).items()),'retained old/new physical bytes differ')
    # Also check tracked web inventory vs exact base using proven Stage26 routine;
    # registered paths alone cannot protect old orphan tracked web assets.
    return {'activeGraphSHA256':graph(records([after['files']])),'verifiedImmutableRegistered':len(x|y)}
def run_hash_tree(root,ref):
    # Read-only static inventory, includes raw blob identities for every old
    # web path, even those not referenced by any current retention manifest.
    out={}
    b=subprocess.check_output(['git','-C',str(root),'ls-tree','-r','-z',ref,'--','web'])
    for line in b.split(b'\x00'):
        if line:
            left,right=line.split(b'\t',1);mode,typ,h=left.decode().split();p=right.decode()
            req(mode=='100644' and typ=='blob' and p not in out,'unordinary prior tracked file',p)
            out[p]=h
    return out
def archive_member(z,path,cap=12<<20):
    # Invoke this only after official GitHub run/job, artifact metadata and whole ZIP pins.
    seen=z.namelist()
    req(len(seen)==len(set(seen)),'duplicate archive members')
    for i in z.infolist():
        n=PurePosixPath(i.filename)
        req(not n.is_absolute() and '..' not in n.parts and chr(92) not in i.filename and
            n.as_posix()==i.filename.rstrip('/') and not stat.S_ISLNK(i.external_attr>>16),'unsafe archive',i.filename)
    i=z.getinfo(path)
    req(not i.is_dir() and 0<i.file_size<=cap,'member outside limits',path)
    return z.read(i)
R=Path(__file__).resolve().parent
P=j((R/'PINS.json').read_bytes())
BASE=P['base']['commit'];QA=P['qa'];HEAD=QA['head']
TOOLS='tools/stage15-formal-integrated-qa'
FLOW='.github/workflows/stage15-formal-integrated-qa.yml'
MFG='.github/workflows/stage15-retained-r3.yml'
TARGET_PATHS={MFG,'tools/stage15-retained-r3/retain.py','tools/stage15-retained-r3/PINS.json'}
SHELLS={'HONRO.html','index.html','HONRO_WORKSHOP.html'}
REDIR='workshop/HONRO_MAP_WORKSHOP.html'
REPO='sys8994/honro'
def git(root,*a):return subprocess.check_output(['git','-C',str(root),*a])
def g(root,*a):return git(root,*a).decode().strip()
def ask(root,*a):subprocess.run(a,cwd=root,check=True)
def save(p,o):p.write_text(json.dumps(o,indent=2)+'\n')
def api(path):return j(subprocess.check_output(['gh','api','repos/'+REPO+'/'+path]))

def verify_ref(root):
    h=g(root,'rev-parse','HEAD')
    req(h==os.environ['GITHUB_SHA'] and g(root,'show','-s','--format=%P',h)==HEAD,'not exact assembly parent/head')
    req(g(root,'rev-parse',HEAD+'^{tree}')==QA['headTree'] and g(root,'rev-parse',BASE+'^{tree}')==P['base']['tree'],'immutable input tree changed')
    req(set(g(root,'diff','--name-status','--no-renames',HEAD,h).splitlines())=={'A\t'+x for x in TARGET_PATHS},'assembly contains unexpected changes')
    for k,sha in P['protectedCompilerGitBlobs'].items():
        req(g(root,'rev-parse',BASE+':'+k)==sha,'protected compiler bytes',k)
    return h

def authority(root,w):
    verify_ref(root)
    id=QA['run'];part=QA['artifact']
    a=api(f'actions/runs/{id}')
    req(a['id']==id and a['head_sha']==HEAD and a['head_branch']==QA['branch'] and
        a['repository']['full_name']==a['head_repository']['full_name']==REPO and a['path']==FLOW and
        a['event']=='push' and a['status']=='completed' and a['conclusion']=='failure','wrong scoped-only run')
    b=api(f"actions/jobs/{QA['job']}")
    req(b['id']==QA['job'] and b['run_id']==id and b['name']=='stage15-formal-integrated'
        and b['status']=='completed' and b['conclusion']=='failure','wrong scoped-only job')
    s={i['number']:i for i in b['steps']}
    req({n:s[n]['conclusion']for n in (4,5,6,7)}=={4:'success',5:'success',6:'failure',7:'success'},'normal build/capture/global audit/upload outcomes')
    rows=[i for i in api(f'actions/runs/{id}/artifacts')['artifacts'] if i['name']==QA['artifactName'] and not i['expired']]
    req(len(rows)==1,'expected exactly one scoped artifact');v=rows[0];run=v['workflow_run']
    req((v['id'],v['size_in_bytes'],v['digest'],run['id'],run['head_sha'])==(part['id'],part['bytes'],'sha256:'+part['sha256'],id,HEAD),'artifact identity mismatch')
    z=w/'official.zip'
    with z.open('xb')as f:subprocess.run(['gh','api',f"repos/{REPO}/actions/artifacts/{part['id']}/zip"],stdout=f,check=True)
    auth=read_authority(z)
    save(w/'scoped-authority.json',auth)

def read_authority(z):
    part=QA['artifact']
    req(fact_path(z)=={k:part[k]for k in ('bytes','sha256')},'wrong official ZIP')
    with zipfile.ZipFile(z) as f:
        req(f.testzip() is None,'corrupt official ZIP')
        def read(n):return archive_member(f,n)
        d={}
        for path,k in [('C/capture-bundle.json','captureBundleSHA256'),('C/public-source.json','sourceProofSHA256'),
                       ('C/proof.json','browserProofSHA256'),('combined-exact-comparison.json','comparisonFileSHA256')]:
            x=read(path);req(sha(x)==QA[k],'qualified receipt changed',path);d[path]=j(x)
        cap,src,view,cmp=[d[x]for x in ('C/capture-bundle.json','C/public-source.json','C/proof.json','combined-exact-comparison.json')]
        req(cap['release']==BASE and cap['formalJoin'] is True and cap['stage']==15 and cap['manifest']==QA['normalManifest']
            and src['verified'] is True and src['build']['sameAllEightCompactSiblingPackages'] is True,
            'wrong exact independent source or build')
        req(src['build']['integratedCompiler']['formalRenderer']==P['sourceGitBlobs']['shared/runtime/renderer.js'][1] and
            src['build']['authoredCombinedGitBlob']==P['sourceGitBlobs']['shared/data/act2/stage15-compact-package.json'][1] and
            src['build']['ledgerGitBlob']==P['sourceGitBlobs']['shared/data/terrain-path-optimization.json'][1],'wrong target inputs')
        obs={(x['key'],x['mode']):x for x in cmp['results']}
        req(cmp['pairs']==len(obs)==48 and cmp['validatedContractSHA256']==QA['frameContractSHA256'] and
            sum(bool(x['componentPNGExact'])for x in obs.values())==8,'exact comparison incomplete')
        req(view['complete'] is True and view['browser']=='151.0.7922.34' and len(view['frames'])==24,'not actual completed signed capture')
        for f0 in view['frames']:
            k=f0['key']
            req(f0['phaseReceiptValidated'] is True and f0['phase']=='aim' and f0['round']==1 and
                f0['physicsSHA256']=='99969df4447f9a8c930ff3d94d5b5777ab8baee8b6fb76e2a48bfec5e971ba7a','wrong native first-turn state',k)
            for m,p0,h in [('raw','raw','rawSHA256'),('DOM','png','pngSHA256')]:
                row=obs[(k,m)]
                req(row['exactRGBA']is True and row['unchangedState']is True and
                    sha(read('C/'+f0[p0]))==f0[h]==row['actualPNGSHA256'],'native frame/bytes drift',k,m)
        for visit in view['visits']:
            seen={i['path']:{k:i[k] for k in ('bytes','sha256')}for i in visit['observed'] if i['status']==200}
            req(all(seen.get(k)==x for k,x in QA['observedNewImmutable'].items()) and
                seen.get('HONRO.html')==QA['normalGameHTML'],'new real loaded graph drift')
        return {'run':QA['run'],'job':QA['job'],'head':HEAD,'artifact':part,'scoped48Exact':True,
                'overallIntegratedJobConclusion':'failure','legacyGlobalAudit':P['legacyAudit'],'normalBundle':cap}

def disk_inventory(root):
    p=set()
    for f in (root/'web').rglob('*'):
        req(not f.is_symlink(),'web symlink',f)
        if f.is_file():p.add(f.relative_to(root).as_posix())
        else:req(f.is_dir(),'web entry not directory/file',f)
    return p
def preserve(root,baseline,extra):
    disk=disk_inventory(root)
    absent=set(baseline)-disk
    req(all(x!=MANIFEST and SAFE.fullmatch(x) for x in absent),'deleted non-immutable path')
    if absent:
        subprocess.run(['git','-C',str(root),'restore','--source='+BASE,'--worktree','--pathspec-from-file=-','--pathspec-file-nul'],
            input=b''.join(x.encode()+b'\x00' for x in sorted(absent)),check=True)
    old=sorted(set(baseline)-{MANIFEST})
    signs=subprocess.check_output(['git','-C',str(root),'hash-object','--no-filters','--stdin-paths'],
        input=''.join(x+'\n'for x in old).encode()).decode().splitlines()
    req(signs==[baseline[x]for x in old] and disk_inventory(root)==set(baseline)|set(extra),'old historical tracked Git bytes or final physical inventory changed')
    return sorted(absent)
def archive_write(root,w,paths):
    name='stage15-r3-source-and-retained-web-delta.zip'
    z=w/name;expected={p:fact_path(root/p) for p in paths}
    with zipfile.ZipFile(z,'x',zipfile.ZIP_DEFLATED,compresslevel=6) as f:
        for p in paths:
            i=zipfile.ZipInfo(p,date_time=(1980,1,1,0,0,0)); i.external_attr=(stat.S_IFREG|0o644)<<16
            f.writestr(i,(root/p).read_bytes(),compress_type=zipfile.ZIP_DEFLATED,compresslevel=6)
    with zipfile.ZipFile(z) as f:
        req(f.namelist()==paths and all(fact(f.read(p))==expected[p]for p in paths),'artifact round trip failure')
    arc={'path':name,**fact_path(z)}
    (w/'SHA256SUMS').write_text(arc['sha256']+'  '+name+'\n')
    return arc,expected

def assembly(root,w):
    head=verify_ref(root);auth=read_authority(w/'official.zip')
    req(auth==j((w/'scoped-authority.json').read_bytes()),'missing exact scoped authority stamp')
    A,B,C=[w/x for x in 'ABC']
    for x in (A,B,C):
        git(root,'worktree','add','--detach',str(x),BASE)
        req(g(x,'rev-parse','HEAD')==BASE and not g(x,'status','--porcelain=v1','-uall'),'not exact clean disposable stock')
    args=list(map(str,(A,B,C)));q=root/TOOLS
    srcs=P['sourceGitBlobs']
    for p,values in srcs.items():
        req(g(root,'rev-parse',BASE+':'+p)==values[0],'wrong stock author',p)
    for label,tool,params in [('floor','floor_asset.py',[str(A),str(C)]),('ledger','ledger.py',args),('combined','integrate.py',args)]:
        log=subprocess.check_output([sys.executable,str(q/tool),*params])
        (w/f'assembly-{label}.json').write_bytes(log)
    p='shared/runtime/renderer.js'
    shutil.copyfile(q/'renderer.formal.js',C/p)
    for p,values in srcs.items():
        req(g(C,'hash-object','--no-filters',p)==values[1],'wrong recreated target author',p)
    ask(C,'node','--check','shared/runtime/renderer.js')
    with (w/'normal-build.log').open('xb')as log:
        for cmd in (('npm','ci'),('npm','ci','--prefix','game'),('npm','run','test:release-guard'),
                    ('npm','run','build'),('npm','run','test:production-contract')):
            run=subprocess.run(cmd,cwd=C,stdout=log,stderr=subprocess.STDOUT)
            if run.returncode:
                print((w/'normal-build.log').read_text(errors='replace')[-10000:],file=sys.stderr);run.check_returncode()
    lock=j((C/'node_modules/terser/package.json').read_bytes());req(lock['version']=='5.51.2','Terser version mismatch')
    base,normal,old,new=audit_release_normal(git(root,'show',BASE+':'+MANIFEST),(C/MANIFEST).read_bytes(),C,P)
    extra={p:new[p]for p in new.keys()-old.keys()}
    baseline=run_hash_tree(root,BASE);req(not (set(extra)&set(baseline)),'new active path already tracked historically')
    recipe=auth['normalBundle']
    desc=next(p for p in extra if p.startswith('web/data/HONRO_ACT2_COMPACT_PACKAGES-parts.'))
    d=j((C/desc).read_bytes())
    req(d['$honroJsonParts']==1 and len(d['parts'])==2 and all(k['path']in extra for k in d['parts']),'compact split shape')
    payload=b''.join((C/k['path']).read_bytes()for k in d['parts'])
    req(fact(payload)==recipe['compactAggregate'],'normal compiled actual compact differs')
    req(extra[recipe['runtime']['path']]=={k:v for k,v in recipe['runtime'].items()if k!='path'},'qualified renderer hash differs')
    shellbase={n:git(root,'show',BASE+':'+n) for n in SHELLS|{REDIR}}
    old_wk=next(x for x in old.keys()-new.keys()if x.startswith('web/entries/workshop.'))
    new_wk=normal['workshopEntry'];req(new_wk in extra,'unexpected Workshop entry')
    req(shellbase['HONRO_WORKSHOP.html'].count(old_wk.encode())==1 and
        (C/'HONRO_WORKSHOP.html').read_bytes()==shellbase['HONRO_WORKSHOP.html'].replace(old_wk.encode(),new_wk.encode()) and
        (C/REDIR).read_bytes()==shellbase[REDIR],'unexpected Workshop shell/redirect change')
    req({n for n in SHELLS if (C/n).read_bytes()!=shellbase[n]}==SHELLS,'unexpected mutable shell scope')
    shell={n:fact_path(C/n) for n in SHELLS|{REDIR}}
    restored=preserve(C,baseline,extra)
    live=P['base']['pages'];url=f"https://github.com/{REPO}/actions/runs/{live['run']}"
    save(w/'verified-normal-graph.json',{'normalManifest':QA['normalManifest'],'actualRenderer':recipe['runtime'],
        'normalActiveGraphSHA256':graph(new),'newImmutable':extra,'removedActiveButRetained':QA['priorActiveRetired']})
    with (w/'retainer-output.json').open('xb')as f:
        subprocess.run(['node','tools/release/retain-published-web.mjs',BASE,'--published-at',live['publishedAt'],'--evidence',url],cwd=C,stdout=f,check=True)
    after=j((C/MANIFEST).read_bytes())
    verified=audit_after_retainer(normal,after,base,C,P,head)
    req(all(fact_path(C/n)==v for n,v in shell.items()),'retainer rewrote a public shell')
    req(not preserve(C,baseline,extra),'retainer removed a prior tracked web path')
    retained=registered(after);req(set(retained)<=set(baseline)|set(extra),'invalid new retention reference')
    edits=set(g(C,'diff','--name-status','--no-renames','HEAD','--').splitlines())
    req(edits=={'M\t'+p for p in set(srcs)|SHELLS|{MANIFEST}},'unexpected changed tracked files',edits)
    untracked=set(g(C,'ls-files','--others','--exclude-standard').splitlines())
    req(untracked<=set(extra),'unexpected untracked files',untracked-set(extra))
    for p,values in srcs.items():
        req(g(C,'hash-object','--no-filters',p)==values[1],'recreated source drift after build/retention',p)
    archive,files=archive_write(C,w,sorted(set(srcs)|SHELLS|{MANIFEST}|set(extra)))
    save(w/'RETAINED-DELTA-RECEIPT.json',{'artifactRole':'Stage15 R3 scoped source+retained generated additive delta, no deploy',
        'sourceBase':BASE,'actualNativeAuthority':auth,'legacyGlobalAudit':P['legacyAudit'],'published':False,
        'sourceGitBlobs':srcs,'normalManifest':QA['normalManifest'],'normalActiveGraphSHA256':graph(new),
        'retainedManifest':files[MANIFEST],'currentPublicBase':live,'historicTrackedWebCount':len(baseline)-1,
        'historicRestoredPaths':restored,'publishedBaseGenerationPreserved':True,**verified,
        'mutableShells':sorted(SHELLS),'newImmutable':extra,'deletedPaths':[],
        'archive':archive,'files':files})
    print('Prepared replayed Stage15 exact R3 source and additive retained delta, not publication.')

if __name__=='__main__':
    m,*paths=sys.argv[1:]
    if m=='verify-local-authority':
        (z,)=map(Path,paths);print(json.dumps(read_authority(z),indent=2));raise SystemExit(0)
    root,w=map(lambda p:Path(p).resolve(),paths)
    req(m in ('authority','assemble') and w.parent==Path(os.environ['RUNNER_TEMP']).resolve(),'wrong mode/worktree')
    (authority if m=='authority' else assembly)(root,w)
