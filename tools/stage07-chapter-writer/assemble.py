"""No rebuild, exact success-only archive and guarded frozen assembly. Disabled until root binds scope."""
from datetime import datetime,timezone
from pathlib import Path
import hashlib,io,json,os,re,stat,subprocess as sp,sys,time,zipfile
D=Path(__file__).resolve().parent;P=json.loads((D/'PINS.json').read_bytes());R=P['base'];Q=P['normalQA'];OLD=R['head']
M='web/manifest.json';F={'HONRO.html','HONRO_WORKSHOP.html','index.html',M}
SRC=set(P['sources']); NEWSRC={k for k,a in P['sources'].items() if a['old'] is None}; MODSRC=SRC-NEWSRC; MODIFY=MODSRC|F
KEEP={'previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
RETAINER='tools/release/retain-published-web.mjs'; POLICY='shared/web-retention.mjs'
FILES={'.github/workflows/stage07-chapter-writer.yml',*(f'tools/stage07-chapter-writer/{x}'for x in ('assemble.py','PINS.json','safe-push.sh'))}
def need(ok,msg):
 if not ok:raise RuntimeError(msg)
def h(b):return hashlib.sha256(b).hexdigest()
def f(b):return {'bytes':len(b),'sha256':h(b)}
def g(b):return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
def full(b):return {**f(b),'git':g(b)}
def o(b):
 def strict(p):
  d=dict(p);need(len(d)==len(p),'duplicate JSON keys');return d
 return json.loads(b,object_pairs_hook=strict)
def save(p,x):p.write_text(json.dumps(x,indent=2)+'\n')
def git(p,*x):return sp.check_output(['git','-C',str(p),*x],timeout=120,text=True).strip()
def read(p,k):
 k=Path(k);q=p/k
 need(not k.is_absolute() and '..' not in k.parts and q.is_file() and not q.is_symlink() and q.resolve().is_relative_to(p.resolve()),'unsafe path '+str(k));return q.read_bytes()
def idx(rows):
 d={}
 for x in rows:
  k=x['path'];m={p:x[p]for p in ('bytes','sha256')}
  need(re.fullmatch(r'web/(runtime|entries|data|styles|graphics|fonts)/[\w.-]+',k) and type(m['bytes'])is int and m['bytes']>0 and re.fullmatch('[0-9a-f]{64}',m['sha256']) and(k not in d or d[k]==m),'unsafe or conflicting registered immutable')
  d[k]=m
 return d
def registry(m):
 return idx([*m['files'],*m['previousFiles'],*sum(m['previousGenerations'],[]),*(x for gen in m['publishedGenerations']for x in gen['files'])])
def zipped(b,expect,limit):
 z=zipfile.ZipFile(io.BytesIO(b));v=z.infolist()
 need(len(v)==len(expect) and {x.filename for x in v}==set(expect) and sum(x.file_size for x in v)<limit,'unexpected/missing archive members')
 need(all(not x.is_dir() and x.file_size>0 and x.compress_type in (0,8) and stat.S_IFMT(x.external_attr>>16) in (0,stat.S_IFREG) for x in v),'unsupported archive entry')
 need(z.testzip() is None,'archive CRC error')
 return z
def verified(raw):
 need(not any(Q[k] is None for k in ('run','job','head','tree','artifact','fact','innerFact','members','receipts')),'exact rebuilt bytes not reviewed yet')
 need(f(raw)==Q['fact'],'official producer outer archive hash')
 with zipped(raw,Q['members'],100_000_000)as z:
  need(all(f(z.read(k))==v for k,v in Q['receipts'].items()),'official producer evidence receipts')
  c=o(z.read('CUSTODY.json'));d=o(z.read('GRAPH.json'));br=P['reviewedR2']
  need(c['status']=='REVIEWED_EXACT_NORMAL_BYTES_SEALED_NO_DEPLOY' and c['base']==OLD and c['producerHead']==Q['head'] and c['noDeploy'] and c['normalRun']==br['run'] and c['normalArchive']==br['artifact'] and c['normalReceiptSHA']==br['sha'] and c['originatingScope']==br['head'],'invalid prior actual qualified authority')
  need(c['normalManifest']==P['expectedNormalManifest'] and c['oldActive']==c['newActive']==811 and set(c['addsActive'])==set(P['expectedActive']) and len(c['retiredActive'])==9 and c['inner']==Q['innerFact'],'producer scope drift')
  need(d['authority']==OLD and d['newManifest']==P['expectedNormalManifest'] and d['otherCanonicalMapsAndPacketsExact'] and d['workshopOneUnplacedAsset'] and set(d['exactProtectedPeerLeafProof'])=={'32','33','40','42','44','46'},'actual graph evidence drifted')
  inner=z.read('STAGE07-REVIEWED-NORMAL.zip');need(full(inner)==Q['innerFact'],'bad inner custody')
  with zipped(inner,c['parts'],32_000_000)as zz:parts={k:zz.read(k)for k in c['parts']}
 need(set(parts)==SRC|F|set(P['expectedActive']) and len(parts)==16 and all(full(v)==c['parts'][k]for k,v in parts.items()),'unreviewed payload bodies')
 need(full(parts[M])==P['expectedNormalManifest'] and all(full(parts[k])==P['sources'][k]['new']for k in SRC),'raw normal or source bytes differ')
 need(all(f(parts[k])==v for k,v in P['expectedActive'].items()),'new compiled addresses with different bytes')
 return parts,c,d
def env():
 need(P['enabled'] is True and P['scopeApproval'] is True and P['destinationMustBeAtBase'] is True and Q['run'] is not None,'DISABLED until root reviews exact scope')
 root=Path(os.environ['GITHUB_WORKSPACE']).resolve();head=os.environ['GITHUB_SHA']
 need((os.environ.get('GITHUB_REPOSITORY'),os.environ.get('GITHUB_REF'),os.environ.get('GITHUB_EVENT_NAME'))==(P['repo'],P['qaRef'],'push'),'wrong repo/event/QA branch')
 need(git(root,'rev-list','--parents','-1','HEAD')==head+' '+OLD and git(root,'rev-parse',OLD+'^{tree}')==R['tree'],'wrong released sole parent')
 need(not git(root,'status','--porcelain') and set(git(root,'diff','--no-renames','--name-status',OLD,head).splitlines())=={'A\t'+k for k in FILES},'unexpected staged writer edits')
 return root
def acquire(w):
 env()
 def api(p):return sp.check_output(['gh','api','repos/'+P['repo']+'/'+p],timeout=120)
 ri=o(api('actions/runs/'+str(Q['run'])));ji=o(api('actions/jobs/'+str(Q['job'])));c=o(api('git/commits/'+Q['head']))
 need(ri['head_sha']==ji['head_sha']==Q['head'] and ri['head_branch']==Q['branch'] and ji['run_id']==Q['run'] and ri['status']==ji['status']=='completed' and ri['conclusion']==ji['conclusion']=='success' and c['tree']['sha']==Q['tree'] and [x['sha']for x in c['parents']]==[OLD],'unverified QA authority')
 p=o(api('actions/runs/'+str(R['pages'])));j=o(api('actions/jobs/'+str(R['job'])));b=o(api('branches/master'))
 need(p['head_sha']==j['head_sha']==b['commit']['sha']==OLD and p['head_branch']=='master' and p['conclusion']==j['conclusion']=='success' and j['run_id']==R['pages'] and any(q['name']=='Deploy to GitHub Pages' and q['conclusion']=='success' for q in j['steps']),'wrong exact Pages fixed 0b9')
 logs=api('actions/jobs/'+str(R['job'])+'/logs');stamp=(R['publishedAt']+' Reported success!').encode()
 if zipfile.is_zipfile(io.BytesIO(logs)):
  with zipfile.ZipFile(io.BytesIO(logs))as l:
   need(l.testzip() is None and sum(e.file_size for e in l.infolist())<16<<20,'unexpected log archive')
   found=any(stamp in l.read(e)for e in l.infolist()if not e.is_dir())
 else:found=stamp in logs
 need(found,'exact Pages success moment mismatch')
 n=str(Q['artifact']);a=o(api('actions/artifacts/'+n))
 need(a['workflow_run']['id']==Q['run'] and a['workflow_run']['head_sha']==Q['head'] and a['name']==Q['artifactName'] and not a['expired'] and a['digest']=='sha256:'+Q['fact']['sha256'] and a['size_in_bytes']==Q['fact']['bytes'],'wrong official artifact metadata')
 raw=api('actions/artifacts/'+n+'/zip');verified(raw);w.mkdir();(w/'joint.zip').write_bytes(raw)
def select(b,old,incoming,now):
 code="""import fs from 'node:fs';import{graphSha256,selectPublishedGenerations}from './shared/web-retention.mjs';const a=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write(JSON.stringify(selectPublishedGenerations([{...a.incoming,graphSha256:graphSha256(a.incoming.files)},...a.prior],{now:a.now})));"""
 return o(sp.check_output(['node','--input-type=module','-e',code],cwd=b,input=json.dumps({'prior':old,'incoming':incoming,'now':now}).encode(),timeout=60))
def assemble(w):
 root=env();need(not(os.getenv('GH_TOKEN') or os.getenv('GITHUB_TOKEN')),'no checkout token in assembly env')
 parts,d,native=verified(read(w,'joint.zip'))
 b=w/'B';git(root,'worktree','add','--detach',str(b),OLD)
 need(not git(b,'status','--porcelain') and git(b,'rev-parse','HEAD^{tree}')==R['tree'],'nonpristine assembly stage')
 before=read(b,M)
 need(full(before)==R['manifest'] and g(read(b,RETAINER))==R['retainerGit'] and g(read(b,POLICY))==R['policyGit'],'official retention code mismatch')
 need(all(full(read(b,k))==P['sources'][k]['old']for k in MODSRC) and all(not (b/k).exists()for k in NEWSRC),'prior author exact bytes changed')
 old,normal=o(before),o(parts[M])
 oldreg=registry(old);active=idx(normal['files']);baseactive=idx(old['files'])
 diff=set(active)-set(baseactive)
 need(len(oldreg)==R['registry'] and len(old['publishedGenerations'])==R['publishedGenerations'] and len(active)==len(baseactive)==811 and diff==set(d['addsActive']) and set(baseactive)-set(active)==set(d['retiredActive']),'wrong exact old/new live graph')
 need(all(f(read(b,k))==v for k,v in oldreg.items()),'historical immutable URL bytes changed')
 need(all(oldreg[k]==active[k]for k in set(oldreg)&set(active)),'existing immutable path identity changed')
 ca,cb=o(read(b,old['project'])),o(parts[normal['project']]);rec=o(parts[normal['project']])
 art='act1-site:7:r7-facies';need(rec['libraryOrder'].count(art)==1,'ambiguous new asset')
 rec['libraryOrder'].remove(art)
 oldCh=P['chapter'];oa,ob=[ca[k][6]for k in ('stages','stageLibraries')];na,nb=[cb[k][6]for k in ('stages','stageLibraries')]
 for k in ('stages','stageLibraries'):rec[k][6]=ca[k][6]
 need(rec==ca and len(ca['stages'])==50 and ca['compatibility32']==cb['compatibility32'] and native['chapterA']==[oa,ob] and native['chapterB']==[na,nb],'other 49 stage dependencies/Workshop order changed')
 s,t=o(read(b,oa)),o(parts[na]);need(t['meta'].pop('r7FaciesAssetId')==art and t==s,'modified nonvisual stage field')
 r,z=o(read(b,ob)),o(parts[nb]);need(len(z)==len(r)+1 and [v for v in z if v['id']!=art]==r,'old provider geometry identifier changed')
 need(all(k in active and f(parts[k])==active[k] for k in diff),'included active body hash differs')
 addActive=diff-set(oldreg);need(len(addActive)==9,'active alias unexpectedly already historic');add=addActive|NEWSRC
 # Previous published asset URL bytes are never removed. The compiled active graph is not recomposed.
 need(OLD not in {x['sourceSha']for x in old['publishedGenerations']},'prior retained provenance already exists')
 merged={**normal,**{k:old[k]for k in KEEP}}
 prev={r['path']for r in old['previousFiles']}
 merged['previousFiles']=[*old['previousFiles'],*(dict(path=k,**v)for k,v in oldreg.items()if k not in active and k not in prev)]
 union={**oldreg,**{k:active[k]for k in addActive}}
 need(registry(merged)==union,'historical URL registry not preserved')
 for k,v in parts.items():
  p=b/k
  need(p.parent.resolve().is_relative_to(b) and not p.is_symlink(),'unsafe named candidate path')
  if k in MODIFY or k in add:
   need(p.exists()==(k in MODIFY),'stale or missing exact path '+k)
   p.write_bytes(v)
  else:need(read(b,k)==v,'candidate already published path bytes differ '+k)
 save(b/M,merged)
 evidence=f"https://github.com/sys8994/honro/actions/runs/{R['pages']}"
 incoming={'sourceSha':OLD,'publishedAt':R['publishedAt'],'publishedAtPrecision':'instant','publicationOrder':0,'evidence':evidence,'files':old['files']}
 before_ms=int(time.time()*1000)
 rt=o(sp.check_output(['node',RETAINER,OLD,'--published-at',R['publishedAt'],'--evidence',evidence],cwd=b,timeout=180))
 after_ms=int(time.time()*1000);final=o(read(b,M))
 need(rt['restored']==[] and rt['restoredBytes']==0,'previous asset restoration unexpected')
 need(final['publishedGenerations']==select(b,old['publishedGenerations'],incoming,before_ms)==select(b,old['publishedGenerations'],incoming,after_ms),'official retention window drift')
 oldg={x['sourceSha']:x for x in old['publishedGenerations']};newg={x['sourceSha']:x for x in final['publishedGenerations']}
 need(newg[OLD]['publishedAt']==R['publishedAt'] and newg[OLD]['files']==old['files'] and all(oldg[k]==newg[k]for k in oldg.keys()&newg.keys()),'published archive authority mismatch')
 need(registry(final)==union and final['publishedRetention']==old['publishedRetention'] and all(f(read(b,k))==v for k,v in union.items()),'bad published immutable route closure')
 need({k:v for k,v in final.items()if k not in KEEP}=={k:v for k,v in normal.items()if k not in KEEP} and all(read(b,k)==v for k,v in parts.items()if k!=M),'official retention changed reviewed active data')
 git(b,'add','--',*sorted(MODIFY|add));changes=set(git(b,'diff','--cached','--name-status','--no-renames',OLD).splitlines())
 # A generated stable shell is only staged if actually different; no unrelated mode/byte stamped.
 typ={k for k in MODIFY if read(b,k)!=sp.check_output(['git','-C',str(b),'show',OLD+':'+k],timeout=90)}
 need(MODSRC|{M}<=typ and len(typ)==6 and len(add)==10 and changes=={'M\t'+k for k in typ}|{'A\t'+k for k in add} and not git(b,'ls-files','--others','--exclude-standard') and not git(b,'diff','--name-only'),'dirty exact release scope')
 need(all(git(b,'ls-files','--stage','--',k).split()[:3]==['100644',g(read(b,k)),'0'] for k in add|typ),'staged original bytes mismatch')
 tree=git(b,'write-tree')
 report={'status':'EXACT_DERIVED_LOCAL_TREE_NO_PUSH_NO_DEPLOY','candidateTree':tree,'parent':OLD,'manifest':full(read(b,M)),'add':sorted(add),'modify':sorted(typ),'oldUrls':len(oldreg),'preservedUrls':len(union),'publishedGenerations':len(newg),'expiredMetadata':sorted(set(oldg)-set(newg)),'candidateRawManifest':P['expectedNormalManifest'],'files':{k:full(read(b,k))for k in sorted(add|typ)},'reviewedRun':Q['run']}
 save(w/'ASSEMBLY.json',report);print(json.dumps({k:v for k,v in report.items()if k not in ('files','add','modify')}))
if __name__=='__main__':
 act=sys.argv[1]
 if act=='local-verify':
  v,d,_=verified(Path(sys.argv[2]).read_bytes());print(json.dumps({'status':'EXACT_LOCAL_ARCHIVE_VERIFIED','files':len(v),'newActive':len(d['addsActive']),'manifest':full(v[M])}))
 else:
  w=Path(sys.argv[2]).resolve();need(w.parent==Path(os.environ['RUNNER_TEMP']).resolve() and w.name=='stage07-chapter-checkpoint','unauthorized runner path')
  {'acquire':acquire,'assemble':assemble}[act](w)
