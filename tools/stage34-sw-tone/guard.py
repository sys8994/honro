import hashlib,json,os,re,subprocess,sys,zipfile
from shutil import copyfile
from pathlib import Path
H=Path(__file__).resolve().parent
P=json.loads((H/'PINS.json').read_bytes())
M='web/manifest.json'; DOCS=('HONRO.html','HONRO_WORKSHOP.html','index.html')
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return dict(bytes=len(b),sha256=sha(b))
def get(r,p):
 assert not p.startswith('/') and '..' not in Path(p).parts
 return (r/p).read_bytes()
def js(r,p):return json.loads(get(r,p))
def save(p,x):
 t=p.with_suffix('.tmp');t.write_text(json.dumps(x,indent=2,ensure_ascii=False)+'\n');t.replace(p)
def git(r,*a):return subprocess.check_output(['git','-C',str(r),*a],timeout=90).decode().strip()
def idx(m):
 records={o['path']:{k:o[k]for k in ('bytes','sha256')}for o in m['files']}
 assert len(records)==len(m['files']);return records
def pre(w):
 root=Path(os.environ['GITHUB_WORKSPACE']);head=os.environ['GITHUB_SHA'];base=P['base']
 assert not(os.getenv('GH_TOKEN') or os.getenv('GITHUB_TOKEN'))
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==('sys8994/honro','push','refs/heads/qa/stage34-sw-tone-bed947-r2')
 assert git(root,'rev-list','--parents','-1','HEAD').split()==[head,base] and git(root,'rev-parse',base+'^{tree}')==P['tree']
 assert not git(root,'status','--porcelain=v1')
 files={'.github/workflows/stage34-sw-tone.yml',*(f'tools/stage34-sw-tone/{n}'for n in ('PINS.json','author.mjs','guard.py','capture.py','observer.json','park.js'))}
 assert set(git(root,'diff','--name-status','--no-renames',base,head).splitlines())=={'A\t'+f for f in files}
 assert all(git(root,'ls-tree',head,'--',f).startswith('100644 blob ')for f in files)
 for side in ('A','B'):git(root,'worktree','add','--detach',str(w/side),base)
 assert fact(get(w/'A',M))==P['manifest'] and fact(get(w/'A','HONRO.html'))==P['shell']
 save(w/'out'/'AUTHORITY.json',{'base':base,'tree':P['tree'],'head':head,'onlyAdded':sorted(files),'usingBuiltAWithoutRebuild':True})
ROLE={'packet':r'web/data/chapter-34-assets\.[a-f0-9]{16}\.json','campaign':r'web/data/campaign\.[a-f0-9]{16}\.json',
 'campaign-js':r'web/runtime/campaign\.[a-f0-9]{16}\.js','game-js':r'web/entries/game\.[a-f0-9]{16}\.js',
 'game-html':r'web/entries/game\.[a-f0-9]{16}\.html','workshop-js':r'web/entries/workshop\.[a-f0-9]{16}\.js'}
def roles(paths):
 q={}
 for p in paths:
  [k]=[k for k,r in ROLE.items()if re.fullmatch(r,p)]
  assert k not in q;q[k]=p
 assert q.keys()==ROLE.keys();return q
def aliases(v,ab):
 for a,b in ab.items():
  if a!=b:
   v=v.replace(b.encode(),a.encode()).replace(Path(b).name.encode(),Path(a).name.encode())
 return v
def built(w):
 a,b=w/'A',w/'B';am,bm=[js(x,M)for x in (a,b)]; ai,bi=map(idx,(am,bm))
 for side in (a,b):assert git(side,'rev-parse','HEAD')==P['base'] and git(side,'rev-parse','HEAD^{tree}')==P['tree']
 assert not git(a,'status','--porcelain=v1')
 author=js(w/'out','AUTHOR.json');assert author['asset']==P['id'] and author['new']==P['newOwner'] and author['otherBytesExact']
 modified=git(b,'status','--porcelain=v1','--untracked-files=no','--','shared','tests','game/src','tools').splitlines()
 assert modified and all(re.fullmatch(r'\s*M\s+shared/data/act4/world.parts/(?:manifest.json|part-\d{3}.jsonpart)',q) for q in modified),modified
 for side,pool in ((a,ai),(b,bi)):
  for k,v in pool.items():assert fact(get(side,k))==v,k
 assert fact(get(a,M))==P['manifest']
 assert all(ai[k]==bi[k]for k in ai.keys()&bi.keys())
 assert am['publishedRetention']==bm['publishedRetention']=={'version':2,'windowDays':7,'minGraphs':2}
 begin,end=(int((w/'out'/f'BUILD-{k}-MS.txt').read_text())for k in ('BEGIN','END'))
 assert 0<end-begin<23*60*1000
 assert git(a,'rev-parse',P['base']+':shared/web-retention.mjs')=='16687b0fc38e432a7d66a015ddf3ebe744163a06'
 assert git(a,'hash-object','shared/web-retention.mjs')==git(b,'hash-object','shared/web-retention.mjs')=='16687b0fc38e432a7d66a015ddf3ebe744163a06'
 policy_js='''import {readFileSync} from 'node:fs';
 import {selectPublishedGenerations as select,planWebAssetRetention as plan} from './shared/web-retention.mjs';
 const [aa,bb,t0,t1]=process.argv.slice(1), a=JSON.parse(readFileSync(aa)), b=JSON.parse(readFileSync(bb));
 const q=[+t0,+t1].map(now=>({selected:select(a.publishedGenerations,{now}),obsolete:plan(a,b.files,{now}).obsoleteFiles}));
 if(JSON.stringify(q[0])!==JSON.stringify(q[1])) throw Error('retention clock crossed an ambiguous boundary during normal build');
 const {selected,obsolete}=q[0];console.log(JSON.stringify({selected,obsolete}));'''
 plan=json.loads(subprocess.check_output(['node','--input-type=module','-e',policy_js,str(a/M),str(b/M),str(begin),str(end)],cwd=a,timeout=90))
 assert bm['publishedGenerations']==plan['selected'],'normal observed retention not exact pinned stock policy'
 retiredPrior='2fdf345e9618a9575177ffefdca0969ee513486f'
 old_gen={g['sourceSha']:g for g in am['publishedGenerations']};new_gen={g['sourceSha']:g for g in bm['publishedGenerations']}
 assert retiredPrior not in old_gen and len(old_gen)==41 and new_gen==old_gen,'expected no further policy expiration on exact bed947 A yet'
 old={r['path']:{k:r[k]for k in ('bytes','sha256')} for g in [am['files'],am['previousFiles'],*am['previousGenerations'],*(x['files']for x in am['publishedGenerations'])] for r in g}
 assert len(old)==1343,'exact current predecessor immutable union'
 allowed={x['path'] for x in plan['obsolete']};restored=[]
 for k,v in old.items():
  assert fact(get(a,k))==v,k
  if not (b/k).exists():
   assert k in allowed and k not in bi and (b/k).parent.is_dir(),('missing unrelated old immutable URL',k)
   copyfile(a/k,b/k);restored.append(k)
  assert fact(get(b,k))==v,k
 save(w/'out'/'RETENTION.json',{'policyVersion2':True,'beginMS':begin,'endMS':end,'newMetadataExpired':[],'expiredInPriorRelease':retiredPrior,
      'allOldRecordsCompared':len(old_gen),'normalRecords':len(new_gen),'allOldURLBytesPreserved':len(old),'restoredExactObsoleteBytesFromA':sorted(restored),'manifestHistoryNotForPromotion':True})
 ar,br=sorted(ai.keys()-bi.keys()),sorted(bi.keys()-ai.keys())
 save(w/'out'/'OBSERVED-GRAPH.json',{'removed':ar,'added':br,'unchanged':len(ai.keys()&bi.keys()),'allOldBytesProtected':len(old)})
 ak,bk=roles(ar),roles(br); diff={ak[k]:bk[k]for k in ROLE}
 assert ak['packet']==P['packet']['path'] and ai[ak['packet']]=={k:P['packet'][k]for k in ('bytes','sha256')}
 assert ak['campaign']==P['campaign'] and ai[P['map']['path']]==bi[P['map']['path']]=={k:P['map'][k]for k in ('bytes','sha256')}
 for k in set(ROLE)-{'packet'}:
  assert get(a,ak[k])==aliases(get(b,bk[k]),diff),k
 for k in DOCS:assert get(a,k)==aliases(get(b,k),diff),k
 ac,bc=js(a,ak['campaign']),js(b,bk['campaign'])
 assert ac['stages']==bc['stages'] and len(ac['stages'])==50 and ac['stages'][33]==P['map']['path']
 assert ac['compatibility34']==bc['compatibility34'] and ac['compatibility33']==bc['compatibility33']
 for gk in ('project','playtest','gameEntry','workshopEntry','common','gameOnly','optionalModules','styles'):
  assert am[gk]==json.loads(aliases(json.dumps(bm[gk]).encode(),diff)),gk
 wire=json.loads(subprocess.check_output(['node',str(H/'author.mjs'),'wire',str(w),str(a/ak['packet']),str(b/bk['packet'])]))
 assert (wire['ownerA'],wire['ownerB'])==(P['oldOwner'],P['newOwner'])
 arms={}
 for k,r,pool,role,port in (('A',a,ai,ak,18961),('B',b,bi,bk,18962)):
  needs={role[n] for n in ('packet','campaign','campaign-js','game-js')}|{P['map']['path']}
  arms[k]={'active':pool,'needs':sorted(needs),'shell':fact(get(r,'HONRO.html')),'origin':f'http://127.0.0.1:{port}/'}
 emitted={p:fact(get(b,p)) for p in [*br,*DOCS,M]}
 with zipfile.ZipFile(w/'out'/'B-compiled-qa-only.zip','w',zipfile.ZIP_DEFLATED)as z:
  for p in sorted(emitted):z.writestr(p,get(b,p))
 save(w/'out'/'GRAPH.json',{'releasedBase':P['base'],'oldBytesPreserved':len(old),'mapCount50Identical':True,'other49PacketsGraphExact':True,'changedAssetOnly':P['id'],'sourceRecipe':author,'sourcesChangedInDetachedB':modified,'emitted':emitted,'normalBuildWire':wire,**arms})
if __name__=='__main__':
 w=Path(sys.argv[2]).resolve();r=Path(os.environ['RUNNER_TEMP']).resolve()
 assert w.is_relative_to(r) and w!=r and (w/'out').is_dir()
 {'pre':pre,'built':built}[sys.argv[1]](w)
