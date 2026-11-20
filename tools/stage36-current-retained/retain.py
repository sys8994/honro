"""Read-only same-repo Stage36 authority and additive compiled delivery; no ref mutations."""
from __future__ import annotations
import hashlib, json, os, re, stat, subprocess, sys, zipfile
from pathlib import Path, PurePosixPath

HERE=Path(__file__).resolve().parent
REPO='sys8994/honro'
QA_DIR='tools/stage36-current-pocket/'
TRANSPORT=('.github/workflows/stage36-current-retained-readonly.yml',
           'tools/stage36-current-retained/PINS.json','tools/stage36-current-retained/retain.py')
MANIFEST='web/manifest.json'
SHELLS=('HONRO.html','index.html','HONRO_WORKSHOP.html','workshop/HONRO_MAP_WORKSHOP.html')
IMM=re.compile(r'^web/(?:runtime|entries|data|styles|graphics|fonts)/[\w.-]+\.([a-f0-9]{16})\.\w+$',re.ASCII)
HEX=re.compile(r'^[0-9a-f]{64}$')
RETAIN_KEYS={'publishedRetention','publishedGenerations','previousFiles','previousGenerations'}


def req(ok,*why):
    if not ok: raise SystemExit(f'HOLD: {why}')


def j(raw):
    def unique(pairs):
        d={}
        for k,v in pairs:
            req(k not in d,'duplicate JSON key',k)
            d[k]=v
        return d
    return json.loads(raw,object_pairs_hook=unique)


def canonical(x):
    return json.dumps(x,sort_keys=True,separators=(',',':')).encode()


def sha(raw): return hashlib.sha256(raw).hexdigest()


def stamp(raw): return {'bytes':len(raw),'sha256':sha(raw)}


def stamp_file(path):
    req(path.is_file() and not path.is_symlink(),'not a regular file',str(path))
    with path.open('rb') as f:
        return {'bytes':os.fstat(f.fileno()).st_size,'sha256':hashlib.file_digest(f,'sha256').hexdigest()}


def save(path,x): path.write_text(json.dumps(x,indent=2)+'\n')


P=j((HERE/'PINS.json').read_bytes())
BASE,TARGET=P['base'],P['target']


def git(root,*args):
    return subprocess.check_output(['git','-C',str(root),*args])


def gtxt(root,*a): return git(root,*a).decode().strip()


def blob(root,src,name): return gtxt(root,'rev-parse',src+':'+name)


def delta_status(root,a,b):
    return set(gtxt(root,'diff','--name-status','--no-renames',a,b).splitlines())


def check_source(root,works=None):
    q=P['qa']
    req(gtxt(root,'show','-s','--format=%P','HEAD')==TARGET,'unexpected transport parent')
    req(delta_status(root,TARGET,'HEAD')=={'A\t'+p for p in TRANSPORT},'transport not exactly add-only allowlist')
    req(gtxt(root,'show','-s','--format=%P',TARGET)==BASE,'unexpected source parent')
    req(gtxt(root,'rev-parse',BASE+'^{tree}')==P['baseTree'] and gtxt(root,'rev-parse',TARGET+'^{tree}')==P['targetTree'],'source trees')
    req(delta_status(root,BASE,TARGET)=={'M\t'+p for p in P['sources']},'non-Stage36 product change')
    prior_qa='056fc50f8798c8a84ea8471db064734d2dc3585b'
    req(gtxt(root,'show','-s','--format=%P',q['head'])==prior_qa and
        gtxt(root,'show','-s','--format=%P',prior_qa)==TARGET,'authority checked wrong target or fixture ancestry')
    modified={q['workflow'],QA_DIR+'guard.py',QA_DIR+'verify.py'}
    req(delta_status(root,prior_qa,q['head'])=={'M\t'+p for p in modified} and
        blob(root,q['head'],QA_DIR+'capture.py')=='5d3d886c1953bae08652bd8a4f064664af4cde01',
        'unexpected original fixture change')
    req(delta_status(root,TARGET,q['head'])=={'A\t'+p for p in (q['workflow'],QA_DIR+'capture.py',QA_DIR+'guard.py',QA_DIR+'verify.py')},'unexpected QA source mutation')
    for p,k in ((q['workflow'],'workflowBlob'),(QA_DIR+'guard.py','guardBlob'),(QA_DIR+'verify.py','verifierBlob')):
        req(blob(root,q['head'],p)==q[k],'wrong original QA input',p)
    for p,expected in P['unchangedRetainer'].items():
        req(blob(root,BASE,p)==blob(root,TARGET,p)==expected,'prior retainer drift',p)
    for i,ref in enumerate((BASE,TARGET)):
        for p,vs in P['sources'].items():
            req(blob(root,ref,p)==vs[i],'wrong source blob',p,ref)
            if works:
                req(gtxt(works[i],'hash-object','--no-filters',p)==vs[i],'detached source bytes changed',p)
    for p,k in ((MANIFEST,'manifestBlob'),('HONRO.html','htmlBlob')):
        req(blob(root,BASE,p)==blob(root,TARGET,p)==P['live'][k],'wrong old generated source',p)
    for p,k in ((MANIFEST,'manifestSHA256'),('HONRO.html','htmlSHA256')):
        req(sha(git(root,'show',BASE+':'+p))==P['live'][k],'wrong published file digest',p)


def get_api(path):
    return j(subprocess.check_output(['gh','api','repos/'+REPO+'/'+path]))


def proof_rows(rows):
    expected={(s,w,h,k)for s in (36,37)for w,h in ((1440,900),(390,844))
              for k in ('overview','south','southwest','southeast')}
    actual={(r['stage'],r['width'],r['height'],r['view'])for r in rows}
    req(actual==expected and len(rows)==len(expected),'incomplete native pairs')
    for r in rows:
        req(r['pass'] is True and not r['failures'] and not r['alphaChangedPixels'],'native row fail')
        if r['stage']==36:
            req(r['roiFullyVisible'] is True and r['changed']>0 and r['outsideStrong']==0 and
                r['brightBlueBefore']>r['brightBlueAfter'],'no scoped native improvement',r)
        else:
            req(r['changed']==r['outsideMinor']==r['outsideStrong']==0,'Stage37 control changed',r)


def qa_members(path):
    avail={}
    with zipfile.ZipFile(path) as z:
        seen=set()
        for e in z.infolist():
            n=PurePosixPath(e.filename)
            req(n.parts and not n.is_absolute() and '..' not in n.parts and '\\' not in e.filename
                and n.as_posix()==e.filename.rstrip('/') and e.filename not in seen
                and not stat.S_ISLNK(e.external_attr>>16),'unsafe input archive',e.filename)
            seen.add(e.filename)
        for name in ('CURRENT-POCKET-VERIFIED.json','CURRENT-POCKET-RESULT.json','stock-graph.json','target-graph.json',
                     'built-scope.json','source.json','source-after.json'):
            info=z.getinfo(name)
            req(not info.is_dir() and 0<info.file_size<=2<<20,'invalid proof member',name)
            avail[name]=j(z.read(info))
    p=avail['CURRENT-POCKET-VERIFIED.json']
    req(p==avail['CURRENT-POCKET-RESULT.json'] and p['pairs']==16 and p['stage36TargetPairs']==8 and p['stage37ExactControls']==8
        and p['success'] is True and p['scopedToEnclosedRockPocket'] is True and p['fullPlaythrough'] is False,'wrong native verdict')
    proof_rows(p['rows'])
    for side in ('stock','target'):
        req(sha(canonical(avail[side+'-graph.json']))==P['graphSHA256'][side],'official active graph drift',side)
    for name in ('source.json','source-after.json'):
        req(avail[name]==[{'commit':p,'tree':t,'pinnedInputs':{k:v[i] for k,v in P['sources'].items()}}
            for i,(p,t) in enumerate(zip((BASE,TARGET),(P['baseTree'],P['targetTree'])))],'wrong native source receipt',name)
    req(avail['built-scope.json']=={'stage36':{'before':P['packet']['stock'],'after':P['packet']['target']},
        '49OtherChapterAssetPathsExact':True,'50ChapterMapPathsExact':True},'native package scope different')
    return avail


def authority(root,w):
    check_source(root)
    q=P['qa']; pinned=q['artifact']
    req(isinstance(pinned,dict) and set(pinned)=={'id','bytes','sha256'} and type(pinned['id']) is int and
        type(pinned['bytes']) is int and 0<pinned['bytes']<=80<<20 and HEX.fullmatch(pinned['sha256']),
        'bind exact completed official artifact id, byte size and SHA256 before launch')
    run=get_api(f"actions/runs/{q['run']}")
    req(run['id']==q['run'] and run['head_sha']==q['head'] and run['head_branch']==q['branch'] and
        run['repository']['full_name']==run['head_repository']['full_name']==REPO and
        run['status']=='completed' and run['conclusion']=='success' and run['event']=='push' and run['path']==q['workflow'],
        'wrong completed QA run/provenance')
    job=get_api(f"actions/jobs/{q['job']}")
    req(job['id']==q['job'] and job['run_id']==q['run'] and job['name']=='verify' and job['status']=='completed' and
        job['conclusion']=='success' and all(x['conclusion']=='success' for x in job['steps'] if x['number'] in (4,5,6)) and
        {x['number'] for x in job['steps']} >= {4,5,6},'wrong completed QA job')
    meta=get_api(f"actions/runs/{q['run']}/artifacts")
    found=[a for a in meta['artifacts'] if a['name']==q['artifactName'] and not a['expired']]
    req(len(found)==1,'expected unique official browser ZIP')
    a=found[0]
    req(a['workflow_run']['id']==q['run'] and a['workflow_run']['head_sha']==q['head'] and
        (a['id'],a['size_in_bytes'],a['digest'])==(pinned['id'],pinned['bytes'],'sha256:'+pinned['sha256']),'artifact pin changed')
    dst=w/'official.zip'
    with dst.open('xb') as out:
        subprocess.run(['gh','api',f"repos/{REPO}/actions/artifacts/{pinned['id']}/zip"],stdout=out,check=True)
    req(stamp_file(dst)=={k:pinned[k] for k in ('bytes','sha256')},'browser ZIP transfer mismatch')
    proof=qa_members(dst)
    save(w/'verified-authority.json',{'run':q['run'],'job':q['job'],'head':q['head'],'artifact':pinned,
          'verifiedNativePairs':proof['CURRENT-POCKET-VERIFIED.json']['pairs'],'activeGraphSHA256':P['graphSHA256']})


def mrows(lists):
    out={}
    for group in lists:
        here=set()
        for v in group:
            p=v['path']; h=v['sha256']; n=v['bytes']; m=IMM.fullmatch(p)
            req(m and m[1]==h[:16] and HEX.fullmatch(h) and type(n) is int and n>=0 and p not in here,
                'bad immutable manifest path/digest/count',p)
            k={'bytes':n,'sha256':h}
            req(p not in out or out[p]==k,'immutable collision',p)
            out[p]=k; here.add(p)
    return out


def registered(m):
    return mrows([m['files'],m.get('previousFiles',[]),*m.get('previousGenerations',[]),
                 *(g['files'] for g in m.get('publishedGenerations',[]))])


def graph_sha(rows):
    return sha(json.dumps([[p,v['sha256'],v['bytes']] for p,v in sorted(rows.items())],
                          ensure_ascii=False,separators=(',',':')).encode())


def inventory(root,ref):
    out={}
    for line in git(root,'ls-tree','-r','-z',ref,'--','web').split(b'\0'):
        if not line: continue
        fields,name=line.split(b'\t',1); mode,kind,ident=fields.decode().split()
        p=name.decode()
        req(mode=='100644' and kind=='blob','not ordinary generated Git file',p)
        out[p]=ident
    return out


def disk_inventory(root):
    out=set()
    for p in (root/'web').rglob('*'):
        req(not p.is_symlink(),'symlink in assembled generated scope',str(p))
        if p.is_file():out.add(p.relative_to(root).as_posix())
        else:req(p.is_dir(),'not normal generated file/directory',str(p))
    return out


def restored_inventory(root,base_files):
    web=disk_inventory(root)
    absent=sorted(set(base_files)-web)
    for p in absent: req(p!=MANIFEST and IMM.fullmatch(p),'deleted non-immutable compiled path',p)
    if absent:
        subprocess.run(['git','-C',str(root),'restore','--source='+BASE,'--worktree','--pathspec-from-file=-',
            '--pathspec-file-nul'],input=b''.join(p.encode()+b'\0' for p in absent),check=True)
    inherited=sorted(set(base_files)-{MANIFEST})
    proc=subprocess.run(['git','-C',str(root),'hash-object','--no-filters','--stdin-paths'],
                        input=''.join(p+'\n' for p in inherited).encode(),stdout=subprocess.PIPE,check=True)
    actual=proc.stdout.decode().splitlines()
    req(len(actual)==len(inherited) and all(x==base_files[p] for x,p in zip(actual,inherited)),
        'prior tracked web asset not byte-preserved')
    req(disk_inventory(root)==set(base_files)|set(P['newImmutable']),'unexpected final physical web path dump/delta')
    return absent


def assemble(root,w):
    check_source(root)
    q=P['qa']
    proof=qa_members(w/'official.zip')
    ident=j((w/'verified-authority.json').read_bytes())
    req(ident=={'run':q['run'],'job':q['job'],'head':q['head'],'artifact':q['artifact'],
          'verifiedNativePairs':16,'activeGraphSHA256':P['graphSHA256']}
        and stamp_file(w/'official.zip')=={k:q['artifact'][k] for k in ('bytes','sha256')},
        'missing/inconsistent authority stamp')
    A,B=(w/'stock',w/'target')
    for r,p in ((A,BASE),(B,TARGET)):
        git(root,'worktree','add','--detach',str(r),p)
        req(gtxt(r,'rev-parse','HEAD')==p and not gtxt(r,'status','--porcelain=v1','--untracked-files=all'),
            'not clean detached source',p)
    check_source(root,(A,B))
    for r in (A,B):
        with (w/f'{r.name}-build.log').open('xb') as log:
            for cmd in (('npm','ci'),('npm','ci','--prefix','game'),('npm','run','build')):
                subprocess.run(cmd, cwd=r,check=True,stdout=log,stderr=subprocess.STDOUT)
    check_source(root,(A,B))
    baseline=inventory(root,BASE); extra=P['newImmutable']; prior=P['oldActiveRetained']
    req(len(prior)==len(extra)==7 and not (set(extra)&set(baseline)) and set(prior)<=set(baseline),
        'unexpected prior staging path intersection')
    bound=w/'official-guard.py'
    bound.write_bytes(git(root,'show',q['head']+':'+QA_DIR+'guard.py'))
    built=w/'rebuilt'; built.mkdir()
    # Run the exact pinned already-reviewed graph/payload-closure guard, but not a camera rerun.
    subprocess.run([sys.executable,str(bound),'built',str(A),str(B),str(built)],check=True)
    for name in ('stock-graph.json','target-graph.json','built-scope.json'):
        req(j((built/name).read_bytes())==proof[name],'fresh normal build graph differs from official browser',name)
    live=j(git(root,'show',BASE+':'+MANIFEST))
    before=j((B/MANIFEST).read_bytes()); rebuilt_stock=j((A/MANIFEST).read_bytes())
    old,normal=mrows([live['files']]),mrows([before['files']])
    req(proof['stock-graph.json']['files']==old==mrows([rebuilt_stock['files']]) and
        proof['target-graph.json']['files']==normal and len(old)==len(normal)==809,'registered active graph different')
    req({p:normal[p] for p in normal.keys()-old.keys()}==extra and
        {p:old[p] for p in old.keys()-normal.keys()}==prior and
        all(normal[p]==old[p] for p in normal.keys()&old.keys()),
        'not exactly seven expected active substitutions')
    sha_shells={p:stamp_file(B/p) for p in SHELLS}
    req(sha_shells['HONRO.html']['sha256']==P['hashShells']['target'] and
        (B/'HONRO.html').read_bytes()==(B/'index.html').read_bytes() and
        before['gameEntry']==proof['target-graph.json']['roles']['entry'] and
        before['project']==proof['target-graph.json']['roles']['campaign'],'normal HTML or manifest roles drift')
    # The workshop shell was not active in the 16 screenshots: only its
    # exact compiler-linked entry may differ, never arbitrarily rebuilt HTML.
    wk='HONRO_WORKSHOP.html'
    stock_wk=git(root,'show',BASE+':'+wk)
    old_wk=[p for p in prior if p.startswith('web/entries/workshop.') and p.endswith('.js')]
    new_wk=[p for p in extra if p.startswith('web/entries/workshop.') and p.endswith('.js')]
    req(len(old_wk)==len(new_wk)==1 and stock_wk.count(old_wk[0].encode())==1 and
        (A/wk).read_bytes()==stock_wk and (B/wk).read_bytes()==stock_wk.replace(old_wk[0].encode(),new_wk[0].encode()),
        'unexpected workshop shell change')
    req((A/'workshop/HONRO_MAP_WORKSHOP.html').read_bytes()==(B/'workshop/HONRO_MAP_WORKSHOP.html').read_bytes()==
        git(root,'show',BASE+':workshop/HONRO_MAP_WORKSHOP.html'),'workshop redirect changed')
    for p,desc in normal.items():req(stamp_file(B/p)==desc,'unverified rebuilt active file bytes',p)
    restored=restored_inventory(B,baseline)
    evidence=f"https://github.com/{REPO}/actions/runs/{P['live']['run']}"
    with (w/'retainer-output.json').open('xb') as out:
        subprocess.run(['node','tools/release/retain-published-web.mjs',BASE,'--published-at',P['live']['publishedAt'],
                        '--evidence',evidence], cwd=B, stdout=out,check=True)
    after=j((B/MANIFEST).read_bytes())
    req({k:v for k,v in after.items() if k not in RETAIN_KEYS}=={k:v for k,v in before.items() if k not in RETAIN_KEYS},
        'existing retainer altered active fields')
    for p,v in sha_shells.items():req(stamp_file(B/p)==v,'existing retainer altered shell',p)
    pubs=[g for g in after['publishedGenerations'] if g['sourceSha']==BASE]
    req(len(pubs)==1 and pubs[0]['publishedAt']==P['live']['publishedAt'] and
        pubs[0]['publishedAtPrecision']=='instant' and pubs[0]['evidence']==evidence and pubs[0]['files']==live['files'] and
        pubs[0]['graphSha256']==graph_sha(old),'prior attested live active generation not retained')
    req(all(g['sourceSha']!=TARGET for g in after['publishedGenerations']),'unpublished source recorded as live')
    regs=registered(after); live_registered=registered(live)
    req(set(regs)<=set(baseline)|set(extra),'retainer registered outside exact allowed paths')
    for p,v in (live_registered|regs).items():
        req(stamp_file(B/p)==v,'prior registered or current asset dropped/changed',p)
    req(not any(live_registered.get(p,v)!=v for p,v in regs.items()),'retainer changed prior recorded immutable hash')
    req(not restored_inventory(B,baseline),'retainer removed/replaced previous physical asset')
    changing=set(gtxt(B,'diff','--name-only','--no-renames','HEAD','--').splitlines())
    untracked=set(gtxt(B,'ls-files','--others','--exclude-standard').splitlines())
    changed_shells={p for p in SHELLS if blob(root,BASE,p)!=gtxt(B,'hash-object','--no-filters',p)}
    req(changed_shells=={'HONRO.html','index.html','HONRO_WORKSHOP.html'},'unexpected mutable shell rewrite',changed_shells)
    req(changing==changed_shells|{MANIFEST} and untracked<=set(extra),'unexpected source/generated deletes or modifications',changing,untracked)
    check_source(root,(A,B))
    paths=sorted(changing|set(extra))
    receipt_paths={p:stamp_file(B/p) for p in paths}
    zpath=w/'stage36-generated-delta.zip'
    with zipfile.ZipFile(zpath,'x',zipfile.ZIP_DEFLATED,compresslevel=6) as zp:
        for p in paths:
            zi=zipfile.ZipInfo(p,date_time=(1980,1,1,0,0,0))
            zi.external_attr=(stat.S_IFREG|0o644)<<16; zi.compress_type=zipfile.ZIP_DEFLATED
            zp.writestr(zi,(B/p).read_bytes())
    with zipfile.ZipFile(zpath) as zp:
        req(zp.namelist()==paths and all(stamp(zp.read(p))==receipt_paths[p] for p in paths),
            'output ZIP round-trip differs')
    archive=stamp_file(zpath)
    (w/'SHA256SUMS').write_text(archive['sha256']+'  '+zpath.name+'\n')
    save(w/'RETAINED-DELTA-RECEIPT.json',{'artifactRole':'Stage36 retained compiled delta only, not publication',
        'published':False,'base':BASE,'source':TARGET,'stage':36,'sourceDiff':P['sources'],
        'actualBrowserAuthority':ident,'publicBaseRegistration':{'run':P['live']['run'],'job':P['live']['job'],
          'publishedAt':P['live']['publishedAt'],'graphSHA256':graph_sha(old)},'normalGraphSHA256':graph_sha(normal),
        'finalManifestSHA256':receipt_paths[MANIFEST]['sha256'],'activeGraphUnchangedAfterRetention':True,
        'allPriorTrackedImmutableAssetsPreserved':True,'previousTrackedWebFilesPreserved':len(baseline)-1,
        'previousRegisteredImmutableFilesPreserved':len(live_registered),'restoredPriorPaths':restored,
        'newImmutableCount':len(extra),'mutablePaths':sorted(changing),'deletedPaths':[],
        'deltaFiles':receipt_paths,'archive':{'path':zpath.name,**archive}})
    print(f'Compiled Stage36 only: {len(extra)} new immutable files, {len(changing)} mutable generated files; no publication.')


if __name__=='__main__':
    mode,root,w=sys.argv[1:]
    req(mode in ('authority','assemble'),'unknown mode',mode)
    root=Path(root).resolve(); w=Path(w).resolve()
    req(w.parent==Path(os.environ['RUNNER_TEMP']).resolve(),'working directory not inside disposable runner temp')
    (authority if mode=='authority' else assemble)(root,w)
