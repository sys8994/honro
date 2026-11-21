"""Read-only immutable Stage28 proof using trusted stock compiler and retainer. No ref write."""
import hashlib,json,os,re,stat,subprocess,sys,zipfile
from pathlib import Path,PurePosixPath
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'stage28-poster-native'))
import guard as r6
ROOT=Path(os.environ.get('GITHUB_WORKSPACE','.')).resolve()
BASE=r6.P['base'];BASE_TREE=r6.P['tree'];REL=r6.P['sourcePath'];MF=r6.MF;SHELL=r6.SHELL
REF='refs/heads/qa/stage28-retention-acb51'
REPO='sys8994/honro'
R7='3cf20dce849a4d42635536560f5fe860af21bbff'
R7_TREE='9f69a59fd92047cdc3ae6d374479fd431b72a0ad'
R6='47d9fe32f4210e8d09e74eb97a534cfcae6f3ffd'
R6_TREE='0fc99ea52a7a2e324ecd437784b2bf7a1f789add'
NORMAL_GRAPH='3c197b0251f30df3fbb4ef5c8b797dc2ff130298bd00acaeccb600b1851d94aa'
R6_JOB=136929892732; R6_RUN=44931823134
R7_JOB=136941853197; R7_RUN=44935745420
PAGES_JOB=136889673324; PAGES_RUN=44918541021;PUBLISHED_AT='2026-11-21T15:20:54.6142454Z'
RETAINER={'tools/release/retain-published-web.mjs':'8374336b53c74ac81e6d32f5aa43eee575e61daa','shared/web-retention.mjs':'16687b0fc38e432a7d66a015ddf3ebe744163a06'}
SELF='tools/stage28-retention/'
WORKFLOW='.github/workflows/stage28-retention-acb51.yml'
QA={WORKFLOW,SELF+'retention.py',SELF+'COMPOSITE.json'}
HF={'previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
sha=r6.sha;facts=r6.facts;stamp=r6.stamp;git=r6.git;rd=r6.rd;save=r6.save
def assert_api(v,m):
    if not v:raise ValueError(m)
def api(path):
    return json.loads(subprocess.check_output(['gh','api',f'repos/{REPO}/'+path],timeout=40))
def dictjson(x):
    def slots(pairs):
        p=dict(pairs)
        assert len(p)==len(pairs),'duplicate JSON key'
        return p
    return json.loads(x,object_pairs_hook=slots)
def canonical(v):return json.dumps(v,sort_keys=True,separators=(',',':'),ensure_ascii=True).encode()
def after_path(a,b):
    return set(git(ROOT,'diff','--no-renames','--name-status',a,b).decode().splitlines())
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
    inv=r6.inv(m);assert len(inv)==len(m['files'])==810;return inv
def exact(w):
    h=os.environ['GITHUB_SHA'];assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_REF'],os.environ['GITHUB_EVENT_NAME'])==(REPO,REF,'push')
    assert w.is_relative_to(Path(os.environ['RUNNER_TEMP']).resolve()) and not git(ROOT,'status','--porcelain=v1','-z')
    assert git(ROOT,'rev-parse','HEAD').decode().strip()==h
    for a,b in ((h,R7),(R7,R6)):
        assert git(ROOT,'rev-list','--parents','-n1',a).decode().split()==[a,b]
    for a,t in ((R7,R7_TREE),(R6,R6_TREE),(BASE,BASE_TREE)):
        assert git(ROOT,'rev-parse',a+'^{tree}').decode().strip()==t
    assert after_path(R7,h)=={'A\t'+p for p in QA}
    assert all(git(ROOT,'ls-tree',h,'--',p).decode().split()[:2]==['100644','blob']for p in QA)
    assert git(ROOT,'show',R6+':tools/stage28-poster-native/guard.py')==(HERE.parent/'stage28-poster-native'/'guard.py').read_bytes()
    for p,digest in RETAINER.items():assert git(ROOT,'rev-parse',BASE+':'+p).decode().strip()==digest
    old=git(ROOT,'show',BASE+':'+MF);assert stamp(old)==r6.P['manifest']
    return dictjson(old)
def bindings():
    c=(HERE/'COMPOSITE.json').read_bytes();assert sha(c)=='1010b692374f3cf8c891e3b1a9a11d6ce3663add08aff12a557011a0050b31e4'
    q=dictjson(c)
    assert q['status']=='EXACT_R6_TARGETS_AND_R7_INDEPENDENT_CONTROL'
    assert q['sourceB']==r6.P['sourceB'] and q['canonicalGraphSHA256']==NORMAL_GRAPH
    assert q['R6']['run']==R6_RUN and q['R6']['job']==R6_JOB and q['R6']['head']==R6 and q['R6']['aggregate']=='HOLD'
    assert q['R7']['run']==R7_RUN and q['R7']['job']==R7_JOB and q['R7']['head']==R7 and q['R7']['independentVisits']==12 and q['R7']['rawPngs']==80
    assert q['R6']['coreMatchedPairs']==16 and q['R6']['unchangedPeerMatchedPairs']==4 and q['R6']['independentRawCorePeerPhaseFrames']==80
    assert len(q['R6']['artifacts'])==len(q['R7']['artifacts'])==3
    for k in ('R6','R7'):
        assert len({x['id']for x in q[k]['artifacts']})==3
        assert all(re.fullmatch('[0-9a-f]{64}',x['sha256']) and x['bytes']>0 for x in q[k]['artifacts'])
    return q
def authority(w):
    old=exact(w);c=bindings()
    assert os.getenv('GH_TOKEN') and not os.getenv('GITHUB_TOKEN')
    assert_api(api('git/ref/heads/master')['object']['sha']==BASE,'master changed')
    for run,job,head,branch,name,result in (
        (R6_RUN,R6_JOB,R6,'qa/stage28-poster-floor-acb51-r6','compare','failure'),
        (R7_RUN,R7_JOB,R7,'qa/stage28-stage3-clock-scope-r7','unchanged-stage3','success'),
        (PAGES_RUN,PAGES_JOB,BASE,'master','deploy','success'),
    ):
      j=api(f'actions/jobs/{job}');r=api(f'actions/runs/{run}')
      assert_api((r['id'],r['head_sha'],r['head_branch'],r['status'],r['conclusion'])==(run,head,branch,'completed',result),('exact run mismatch',run))
      assert_api(r['repository']['full_name']==r['head_repository']['full_name']==REPO,('wrong repository',run))
      assert_api((j['id'],j['run_id'],j['head_sha'],j['name'],j['status'],j['conclusion'])==(job,run,head,name,'completed',result),('exact job mismatch',job))
      if run==R7_RUN:
        assert_api({s['number'] for s in j['steps'] if 4<=s['number']<=8 and s['conclusion']=='success'}=={4,5,6,7,8},'R7 compile/native/artifact proof failure')
      if run==R6_RUN:
        assert_api({s['number']:s['conclusion'] for s in j['steps'] if 4<=s['number']<=6}=={4:'success',5:'failure',6:'skipped'},'R6 actual historical proof failure mismatch')
      if run==PAGES_RUN:
        deploy=[s for s in j['steps'] if s['name']=='Deploy to GitHub Pages'];assert_api(len(deploy)==1 and deploy[0]['conclusion']=='success','prior Pages deploy failure')
      if run!=PAGES_RUN:
        q=c['R6' if run==R6_RUN else 'R7']
        observed={x['id']:x for x in api(f'actions/runs/{run}/artifacts')['artifacts']}
        for a in q['artifacts']:
          h=observed[a['id']]
          assert_api((h['name'],h['digest'],h['size_in_bytes'],h['expired'])==(a['name'],'sha256:'+a['sha256'],a['bytes'],False),('artifact metadata mismatch',a['id']))
          assert_api(h['workflow_run']['head_sha']==head and h['workflow_run']['id']==run,('artifact provenance mismatch',a['id']))
    save(w/'authority.json',{'verified':True,'base':BASE,'baseManifest':r6.P['manifest'],'priorPages':PAGES_RUN,'composite':stamp((HERE/'COMPOSITE.json').read_bytes())})
def ack(w):
    assert not(os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN'))
    a=dictjson(rd(w,'authority.json'))
    assert a=={'verified':True,'base':BASE,'baseManifest':r6.P['manifest'],'priorPages':PAGES_RUN,'composite':stamp((HERE/'COMPOSITE.json').read_bytes())}
def pre(w):
    old=exact(w);ack(w);bindings()
    assert len(registry(old))==1317 and len(old['publishedGenerations'])==37 and len(old['previousGenerations'])==2
    for name in ('A','B'):
      p=w/name;git(ROOT,'worktree','add','--detach',str(p),BASE)
      assert git(p,'rev-parse','HEAD').decode().strip()==BASE and not git(p,'status','--porcelain=v1','-z')
      assert not git(p,'branch','--show-current').strip()
      assert stamp(rd(p,REL))==r6.P['sourceA']
      assert all(facts(rd(p,k))==v for k,v in registry(old).items()),'1317 published/compat physical bytes changed'
    b=w/'B';(b/REL).write_bytes(r6.patch(rd(w/'A',REL)))
    assert stamp(rd(b,REL))==r6.P['sourceB'] and git(b,'diff','--name-status').decode().splitlines()==['M\t'+REL]
def seal(w):
    old=exact(w);ack(w);c=bindings();root=w/'B';out=w/'out'
    r6.built(w);graph=dictjson(rd(out,'GRAPH.json'))
    assert sha(canonical(graph))==NORMAL_GRAPH,'B compilation not exactly the normal visual authority'
    buf=rd(root,MF);normal=dictjson(buf);active=manifest_active(normal);state=registry(old);aliases=dict(graph['aliases']);added=set(aliases.values())
    assert len(added)==len(aliases)==4 and not added&set(state)
    exact_b=set([REL,MF,*SHELL,*added]);assert len(exact_b)==9
    names={k:stamp(rd(root,k))for k in exact_b}
    assert names[REL]==r6.P['sourceB'] and all(facts(rd(root,k))==graph['activeB'][k]for k in exact_b-{REL})
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
    assert len(expected)==1321 and registry(bridge)==expected
    save(root/MF,bridge)
    evidence=f'https://github.com/{REPO}/actions/runs/{PAGES_RUN}'
    with (out/'retainer-output.json').open('xb')as f:
      subprocess.run(['node','tools/release/retain-published-web.mjs',BASE,'--published-at',PUBLISHED_AT,'--evidence',evidence],cwd=root,stdout=f,check=True,timeout=160)
    after=dictjson(rd(root,MF));published={x['sourceSha']:x for x in after['publishedGenerations']};oldpub={x['sourceSha']:x for x in old['publishedGenerations']}
    assert registry(after)==expected and manifest_active(after)==active and after['publishedRetention']==old['publishedRetention']
    assert {k:v for k,v in after.items()if k not in HF}=={k:v for k,v in normal.items()if k not in HF}
    assert all(facts(rd(root,k))==v for k,v in expected.items()),'post retention physical union changed'
    assert all(stamp(rd(root,k))==v for k,v in names.items()if k!=MF),'retainer touched validated candidate alias'
    assert len(oldpub)==37 and set(published)<=set(oldpub)|{BASE} and len(published)>=2 and BASE in published and BASE not in oldpub
    assert all(published[k]==oldpub[k]for k in set(published)-{BASE})
    compat={v['path'] for v in after['previousFiles']};expired=set(oldpub)-set(published)
    assert all(f['path']in active or f['path']in compat for k in expired for f in oldpub[k]['files'])
    p=published[BASE];assert p['publishedAt']==PUBLISHED_AT and p['publishedAtPrecision']=='instant' and p['evidence']==evidence and p['files']==old['files']
    changed={REL,MF,*SHELL};assert set(git(root,'diff','--no-renames','--name-status',BASE,'--').decode().splitlines())=={'M\t'+k for k in changed}
    assert set(git(root,'ls-files','--others','--exclude-standard').decode().splitlines())==added
    records={k:{**stamp(rd(root,k)),'mode':'100644','change':'A'if k in added else 'M'}for k in sorted(exact_b)}
    git(root,'add','--',*records)
    assert set(git(root,'diff','--cached','--no-renames','--name-status',BASE).decode().splitlines())=={v['change']+'\t'+k for k,v in records.items()}
    t=git(root,'write-tree').decode().strip();assert git(root,'rev-parse','HEAD').decode().strip()==BASE
    for k,v in records.items():assert git(root,'ls-tree',t,'--',k).decode().split()[:3]==['100644','blob',v['git']]
    z=out/'STAGE28-RETAINED-DELTA-QA-ONLY.zip'
    with zipfile.ZipFile(z,'x',zipfile.ZIP_DEFLATED,compresslevel=8)as p:
      for k in records:
        i=zipfile.ZipInfo(k,(1980,1,1,0,0,0));i.external_attr=0o100644<<16;i.compress_type=zipfile.ZIP_DEFLATED;p.writestr(i,rd(root,k))
    with zipfile.ZipFile(z)as p:
      assert p.testzip() is None and len(p.infolist())==9 and set(p.namelist())==set(records)
      assert all(stamp(p.read(k))=={n:v[n]for n in ('bytes','sha256','git')} for k,v in records.items())
    save(out/'RETAINED-DELTA-RECEIPT.json',{'status':'PASS_RETAINED_QA_ONLY_NOT_PUBLISHED','base':BASE,'baseTree':BASE_TREE,'candidateTree':t,
      'normalGraph':NORMAL_GRAPH,'normalManifest':names[MF],'activeCount':len(active),'oldPhysical':len(state),'retainedPhysical':len(expected),
      'retainedGraph':published[BASE]['graphSha256'],'publishedGraphCount':len(published),'expiredHistoryStillReachable':len(expired),
      'compositeSHA256':sha((HERE/'COMPOSITE.json').read_bytes()),'priorPages':PAGES_RUN,'published':False,'delta':records,'zip':stamp(z.read_bytes())})
if __name__=='__main__':{'authority':authority,'pre':pre,'seal':seal}[sys.argv[1]](Path(sys.argv[2]).resolve())
