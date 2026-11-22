from pathlib import Path
import io,os,subprocess as sp,sys,zipfile
import reuse as r

Q='qa/stage34-onebuild-writer';REPO='sys8994/honro'
FILES={'.github/workflows/stage34-onebuild-release.yml',*(f'tools/stage34-onebuild-release/{x}' for x in ('PINS.json','RELEASE-PINS.json','ROOT-RENDER-SCOPE.json','author.mjs','reuse.py','safe-push.sh','transfer.py'))}
def api(k): return sp.check_output(['gh','api',f'repos/{REPO}/{k}'],timeout=90)
def archive(i,run,head,sha,l,name):
 a=r.j(api(f'actions/artifacts/{i}'))
 assert (a['workflow_run']['id'],a['workflow_run']['head_sha'],a['digest'],a['size_in_bytes'],a['expired'],a['name'])==(run,head,'sha256:'+sha,l,False,name)
 raw=api(f'actions/artifacts/{i}/zip');assert r.fact(raw)=={'bytes':l,'sha256':sha}
 return raw
def launch(d):
 root=Path(os.environ['GITHUB_WORKSPACE']).resolve(); head=os.environ['GITHUB_SHA']
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_REF'],os.environ['GITHUB_EVENT_NAME'])==(REPO,'refs/heads/'+Q,'push')
 assert r.git(root,'rev-parse','HEAD')==head and r.git(root,'show','-s','--format=%P',head)==r.BASE
 assert r.git(root,'rev-parse',r.BASE+'^{tree}')==r.TREE
 assert set(r.git(root,'diff','--name-status','--no-renames',r.BASE,head).splitlines())=={'A\t'+k for k in FILES}
 assert r.P['enabled'] is True and r.P['scopeDecision']==r.P['expectedScopeReviewIfLaterAuthorized']
 proof=r.read(r.H,'ROOT-RENDER-SCOPE.json');assert r.sha(proof)==r.P['rootScopeSHA256'];scope=r.j(proof)
 assert scope['exactGate']=='FAIL_EXISTING' and scope['browserSHA256']==r.P['receipts']['BROWSER.json'] and scope['anchor']==r.BASE
 assert len(scope['scope'])==8
 assert all(x['RGBMaxDifferenceOutside']<=2 and x['alphaChanges']==0 for x in scope['scope'].values())
 q=r.P['official']; job=r.j(api(f"actions/jobs/{q['job']}"))
 assert (job['head_sha'],job['run_id'],job['conclusion'])==(q['head'],q['run'],'failure')
 assert [s['conclusion'] for s in job['steps'] if s['number'] in (4,5,6)]==['success','failure','success']
 b=archive(q['artifact'],q['run'],q['head'],q['outer']['sha256'],q['outer']['bytes'],'honro-stage34-sw-tone-bed947-normal-r2-qa-only')
 (d/'visual.zip').write_bytes(b)
 u=r.P['publicArtifact']; a=archive(u['id'],u['run'],u['head'],u['sha256'],u['bytes'],u['name'])
 old=r.j(api(f"actions/runs/{u['run']}"));assert (old['head_sha'],old['conclusion'])==(u['head'],'success')
 p=d/'prior';p.mkdir()
 with zipfile.ZipFile(io.BytesIO(a)) as z:
  assert z.testzip() is None
  for k in ('PAGES-AUTHORITY.json','PUBLIC-HTTP.json','PUBLIC-BROWSER.json'):(p/k).write_bytes(z.read(k))
 r.payload(d/'visual.zip',p)
def index(d):
 assert not (os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN'))
 w=d/'assemble'; b=w/'B'; rec=r.j(r.read(w/'out','ASSEMBLED-DISABLED-CARRIER-RECEIPT.json'))
 assert rec['base']==r.BASE and rec['registry']==1349 and rec['previousURLBytesProtected']==1343
 assert rec['notStrictPixelPass'] and len(rec['add'])==6 and set(rec['modify'])==r.SRC|r.SHELL|{r.MAN}
 r.git(b,'add','--',*sorted(rec['add']+rec['modify']))
 expected={'A\t'+k for k in rec['add']}|{'M\t'+k for k in rec['modify']}
 assert set(r.git(b,'diff','--cached','--name-status','--no-renames',r.BASE).splitlines())==expected
 assert not r.git(b,'diff','--name-only') and not r.git(b,'ls-files','--others','--exclude-standard')
 print('Verified Stage34 candidate assembly:',rec['manifest'],r.gith(r.read(b,r.MAN)),len(expected))
d=Path(sys.argv[1]).resolve()
assert d.parent==Path(os.environ.get('RUNNER_TEMP','/tmp')).resolve() and d.name=='stage34-release'
index(d) if len(sys.argv)==3 and sys.argv[2]=='index' else launch(d)
