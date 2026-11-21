"""Dry hermetic retention template for Stage7 west-only rebind; intentionally cannot run without native PASS pins.

Packaging/release setup must supply a separately verified guard.exact for this QA commit,
otherwise native.built rejects its scope. Never point the native guard at a different branch
without an independently scoped, direct-master check for the full QA-only carrier.
"""
import hashlib,json,os,re,subprocess,sys,zipfile
from pathlib import Path
import guard as native
HERE=Path(__file__).resolve().parent
ROOT=native.ROOT
BASE=native.BASE; BASE_TREE=native.TREE; REL=native.SRC; MF=native.MF
SHELL=native.SHELL; REPO=native.REPO
PAGES_RUN=44945703929;PUBLISHED_AT='2026-11-21T20:21:37.5936392Z'
HF={'previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
sha=native.sha;facts=native.fact;stamp=native.stamp;git=native.git;rd=native.rd;save=native.save
def exact(w):
    native.exact(w)
    old=rd(ROOT,MF)
    assert native.blob(old)==native.OLD_MAN
    m=dictjson(old)
    assert len(registry(m))==1325 and len(m['publishedGenerations'])==39
    return m
def authority(w):
    assert not(os.getenv('GH_TOKEN') or os.getenv('GITHUB_TOKEN'))
    raw=rd(HERE,'NATIVE-PROOF-PINS.json')
    pins=dictjson(raw)
    assert pins['enabled'] is True,'DISABLED: missing verified official PNG / exact Stage14 preservation proof'
    assert pins['independentEvidence']['storedPNGs']==192 and pins['independentEvidence']['observedPhases']==384
    assert pins['independentEvidence']['stage14WholePriorPhaseExact']==16
    assert pins['conclusion']=='success' and pins['actualBrowserSignedResult']=='success'
    assert pins['base']==BASE and pins['priorPages']==PAGES_RUN and pins['candidateSourceGit']==native.NEW
    assert type(pins['nativeRun']) is int and type(pins['nativeJob']) is int
    assert re.fullmatch('[a-f0-9]{64}',pins['graphCanonicalSha256'])
    assert stamp(rd(w,'authority.json'))==pins['independentlyVerifiedAuthorityReceipt']
    return pins
def dictjson(x):
    def slots(pairs):
        p=dict(pairs)
        assert len(p)==len(pairs),'duplicate JSON key'
        return p
    return json.loads(x,object_pairs_hook=slots)
def canonical(v):return json.dumps(v,sort_keys=True,separators=(',',':'),ensure_ascii=True).encode()
def registry(m):
    entries=[*m.get('files',[]),*m.get('previousFiles',[])]
    for g in m.get('previousGenerations',[]):entries.extend(g)
    for g in m.get('publishedGenerations',[]):entries.extend(g['files'])
    result={}
    for o in entries:
      p=o['path'];fx={k:o[k]for k in ('bytes','sha256')}
      assert re.fullmatch(r'web/(runtime|entries|data|styles|graphics|fonts)/[\w.-]+',p) and type(fx['bytes']) is int and fx['bytes']>0
      assert re.fullmatch('[a-f0-9]{64}',fx['sha256']) and (p not in result or result[p]==fx)
      result[p]=fx
    return result
def manifest_active(m):
    inv={o['path']:{k:o[k] for k in ('bytes','sha256')} for o in m['files']}
    assert len(inv)==len(m['files'])==810
    return inv
def seal(w):
    old=exact(w);pins=authority(w);root=w/'B';out=w/'out'
    native.built(w);graph=dictjson(rd(out,'GRAPH.json'))
    assert sha(canonical(graph))==pins['graphCanonicalSha256'],'B compilation not exactly the normal visual authority'
    W=native.W
    assert stamp(rd(root,native.S14SRC))==W['source']
    assert graph['stage14SourceAndCompiledModuleRemainExact']=={'source':W['source'],'normalWrapper':W['normalSource']}
    assert graph['aliases'][W['priorCommon16']]==pins['expectedCombinedCommon16']['path']
    assert graph['activeB'][pins['expectedCombinedCommon16']['path']]=={k:pins['expectedCombinedCommon16'][k]for k in ('bytes','sha256')}
    buf=rd(root,MF);normal=dictjson(buf);active=manifest_active(normal);state=registry(old);aliases=dict(graph['aliases']);added=set(aliases.values())
    assert len(added)==len(aliases)==4 and not added&set(state)
    exact_b=set([REL,MF,*SHELL,*added]);assert len(exact_b)==9
    names={k:stamp(rd(root,k))for k in exact_b}
    assert names[REL]['git']==native.NEW and all(facts(rd(root,k))==graph['activeB'][k]for k in exact_b-{REL})
    # Transplant only verified normal bytes into a separate pristine retained worktree.
    # Never depend on the compiler keeping its incidental historical disk output.
    artifact_source=root
    root=w/'retained';git(ROOT,'worktree','add','--detach',str(root),BASE)
    assert git(root,'rev-parse','HEAD').decode().strip()==BASE and not git(root,'status','--porcelain=v1','-z')
    assert all(facts(rd(root,k))==v for k,v in state.items()),'pristine retained worktree missing historical bytes'
    for k in exact_b:
      target=root/k;assert target.parent.resolve().is_relative_to(root)and not target.is_symlink()
      assert target.exists()==(k not in added),('expected tracked/new output scope',k)
      target.write_bytes(rd(artifact_source,k))
    bridge={**normal,**{k:old[k]for k in HF}};shadow=list(old['previousFiles']);have={v['path'] for v in shadow}
    bridge['previousFiles']=shadow+[dict(path=k,**v)for k,v in state.items()if k not in active and k not in have]
    expected={**state,**{k:active[k] for k in added}}
    assert len(expected)==1329 and registry(bridge)==expected
    save(root/MF,bridge)
    evidence=f'https://github.com/{REPO}/actions/runs/{PAGES_RUN}'
    with (out/'retainer-output.json').open('xb')as f:
      subprocess.run(['node','tools/release/retain-published-web.mjs',BASE,'--published-at',PUBLISHED_AT,'--evidence',evidence],cwd=root,stdout=f,check=True,timeout=160)
    after=dictjson(rd(root,MF));published={x['sourceSha']:x for x in after['publishedGenerations']};oldpub={x['sourceSha']:x for x in old['publishedGenerations']}
    assert registry(after)==expected and manifest_active(after)==active and after['publishedRetention']==old['publishedRetention']
    assert {k:v for k,v in after.items()if k not in HF}=={k:v for k,v in normal.items()if k not in HF}
    assert all(facts(rd(root,k))==v for k,v in expected.items()),'post retention physical union changed'
    assert all(stamp(rd(root,k))==v for k,v in names.items()if k!=MF),'retainer touched validated candidate alias'
    assert len(oldpub)==39 and set(published)==set(oldpub)|{BASE} and len(published)==40 and BASE in published and BASE not in oldpub
    assert all(published[k]==oldpub[k]for k in set(published)-{BASE})
    compat={v['path'] for v in after['previousFiles']};expired=set(oldpub)-set(published)
    assert all(f['path']in active or f['path']in compat for k in expired for f in oldpub[k]['files'])
    p=published[BASE];assert p['publishedAt']==PUBLISHED_AT and p['publishedAtPrecision']=='instant' and p['evidence']==evidence and p['files']==old['files']
    changed={REL,MF,*SHELL};assert set(git(root,'diff','--no-renames','--name-status',BASE,'--').decode().splitlines())=={'M\t'+k for k in changed}
    assert set(git(root,'ls-files','--others','--exclude-standard').decode().splitlines())==added
    assert stamp(rd(root,native.S14SRC))==W['source']
    assert stamp(rd(root,pins['expectedCombinedCommon16']['path']))=={k:pins['expectedCombinedCommon16'][k]for k in ('git','bytes','sha256')}
    records={k:{**stamp(rd(root,k)),'mode':'100644','change':'A'if k in added else 'M'}for k in sorted(exact_b)}
    git(root,'add','--',*records)
    assert set(git(root,'diff','--cached','--no-renames','--name-status',BASE).decode().splitlines())=={v['change']+'\t'+k for k,v in records.items()}
    t=git(root,'write-tree').decode().strip();assert git(root,'rev-parse','HEAD').decode().strip()==BASE
    for k,v in records.items():assert git(root,'ls-tree',t,'--',k).decode().split()[:3]==['100644','blob',v['git']]
    z=out/'STAGE7-WEST-RETAINED-DELTA-QA-ONLY.zip'
    with zipfile.ZipFile(z,'x',zipfile.ZIP_DEFLATED,compresslevel=8)as p:
      for k in records:
        i=zipfile.ZipInfo(k,(1980,1,1,0,0,0));i.external_attr=0o100644<<16;i.compress_type=zipfile.ZIP_DEFLATED;p.writestr(i,rd(root,k))
    with zipfile.ZipFile(z)as p:
      assert p.testzip() is None and len(p.infolist())==9 and set(p.namelist())==set(records)
      assert all(stamp(p.read(k))=={n:v[n]for n in ('bytes','sha256','git')} for k,v in records.items())
    save(out/'RETAINED-DELTA-RECEIPT.json',{'status':'PASS_RETAINED_QA_ONLY_NOT_PUBLISHED','base':BASE,'baseTree':BASE_TREE,'candidateTree':t,
      'normalGraph':pins['graphCanonicalSha256'],'normalManifest':names[MF],'activeCount':len(active),'oldPhysical':len(state),'retainedPhysical':len(expected),
      'retainedGraph':published[BASE]['graphSha256'],'publishedGraphCount':len(published),'expiredHistoryStillReachable':len(expired),
      'compositeSHA256':sha((HERE/'NATIVE-PROOF-PINS.json').read_bytes()),'stage14CrossPreserved':True,'priorPages':PAGES_RUN,'published':False,'delta':records,'zip':stamp(z.read_bytes())})
if __name__=='__main__':
    if len(sys.argv)!=2 or not (HERE/'NATIVE-PROOF-PINS.json').is_file(): raise SystemExit('Blocked: no authenticated Stage7 west-only rebind production comparison')
    seal(Path(sys.argv[1]).resolve())
