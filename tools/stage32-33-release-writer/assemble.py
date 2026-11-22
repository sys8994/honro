"""No rebuild, exact success-only archive and guarded frozen assembly. Disabled until root binds scope."""
from datetime import datetime,timezone
from pathlib import Path
import hashlib,io,json,os,re,stat,subprocess as sp,sys,time,zipfile
D=Path(__file__).resolve().parent;P=json.loads((D/'PINS.json').read_bytes());R=P['base'];Q=P['normalQA'];OLD=R['head']
M='web/manifest.json';F={'HONRO.html','HONRO_WORKSHOP.html','index.html',M}
SRC=set(P['sources']); NEWSRC={k for k,a in P['sources'].items() if a['old'] is None}; MODSRC=SRC-NEWSRC; MODIFY=MODSRC|F
KEEP={'previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
RETAINER='tools/release/retain-published-web.mjs'; POLICY='shared/web-retention.mjs'
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
def role(k):
 return re.sub(r'\.[a-f0-9]{16}(?=\.[^.]+$)','',k)
def verified(raw):
 need(all(Q[k] is not None for k in ('run','job','head','tree','artifact','fact','innerFact','members','receipts')) and all(P[k] is not None for k in ('expectedNormalManifest','expectedActive','reviewedFrames')),'R5 output still unbound')
 need(f(raw)==Q['fact'],'official outer archive hash mismatch')
 q33=P['qualifiedStage33']['file']
 needed={'SOURCE.json','GRAPH.json','RETENTION-BUILD.json','SEAL.json','stage32/BROWSER.json','stage32/RESUME.json',q33,'stage33/COMPILED-PROOF.json'}
 need(needed<=Q['receipts'].keys() and len(P['reviewedFrames'])>=4,'receipt/approved frames missing')
 with zipped(raw,Q['members'],200_000_000) as z:
  need(all(f(z.read(k))==v for k,v in Q['receipts'].items()),'official signed R5 receipts')
  need(all(f(z.read(k))==v for k,v in P['reviewedFrames'].items()),'reviewed true PC/M PNG bytes')
  se,d,src,ret,art,res,old,comp=(o(z.read(k))for k in ('SEAL.json','GRAPH.json','SOURCE.json','RETENTION-BUILD.json','stage32/BROWSER.json','stage32/RESUME.json',q33,'stage33/COMPILED-PROOF.json'))
  need(se['status']=='PASS_STAGE32_STAGE33_NATIVE_POST07_INTEGRATION_REVIEW_REQUIRED_NO_DEPLOY' and se['base']==d['base']==src['base']==OLD and se['baseTree']==src['baseTree']==R['tree'] and se['QAHead']==src['qaHead']==Q['head'] and se['noDeploy'] is d['noDeploy'] is True,'R5 exact successful authority invalid')
  need(src['status']=='EXACT_3_SOURCE_UNION' and {k:{t:v[t]for t in ('old','new')}for k,v in src['sources'].items()}==P['sources'] and src['stage07']==P['stage07'],'combined exact authored scope')
  need(d['status']=='EXACT_LOCALHOST_NORMAL_CANDIDATE_CLOSURE' and d['active']==R['active'] and d['immutablePhysical']==ret['retainedAll']==R['registry'] and d['all50Maps49OtherPacketsExact'] is d['priorStage07And42Exact'] is True and ret['planExact'] is True and not ret['expiredMetadata'],'protected active and legacy scope')
  need(art['status']=='PASS_ACTUAL_R10_PENDING_ART_REVIEW' and res['status']=='PASS_ACTUAL_STAGE32_R10_ARCHIVED_CURRENT_AND_NEW_COLD_RESUME_PC_M_NO_DEPLOY' and old['status']==P['qualifiedStage33']['status'] and comp['status']=='EXACT_INDEPENDENT_TERSER_4_AND_POST7_12_MIRROR_SLOTS','native/compile gates did not all pass')
  need(set(old['coldResave'])=={'PC','M'} and all(v['status']=='PASS'for v in old['coldResave'].values()) and all(v['fullLibraryLength']==1194 and v['fullMapLength']==50 and v['archiveGETs']==1 for v in old['workshop'].values()) and old['stage7']['status']=='PASS_ACTUAL_0B9_AND_NEW_STAGE7_COLD_AND_RESAVE','real 2c4 / Stage7 / Workshop proof missing')
  ip='NORMAL-COMBINED-B-PENDING-REVIEW-NO-DEPLOY.zip'; inner=z.read(ip)
  need(se['artifact']=={ip:Q['innerFact']} and f(inner)==Q['innerFact'],'inner official custody changed')
  with zipped(inner,se['files'],40_000_000) as zz:parts={k:zz.read(k)for k in zz.namelist()}
 need(set(parts)==SRC|F|set(P['expectedActive']) and len(parts)==17 and all(full(v)==se['files'][k]for k,v in parts.items()),'exact 17 sealed files required')
 need(d['BPaths']=={k:se['files'][k]for k in set(parts)-SRC} and full(parts[M])==P['expectedNormalManifest'] and ret['rawGeneratedManifestIdentical']==f(parts[M]),'normal bytes/receipts changed')
 need(all(full(parts[k])['git']==P['sources'][k]['new']for k in SRC),'combined source bytes differ')
 need(set(d['added'])==set(P['expectedActive']) and len(d['added'])==len(d['displaced'])==10 and all(f(parts[k])==v and v['sha256'][:16] in k for k,v in P['expectedActive'].items()),'10 exact new alias bodies required')
 need({role(x)for x in d['added']}=={role(x)for x in d['displaced']}==set(P['roles']),'logical active closure drift')
 return parts,d,src
def authority(root):
 need(P['releaseRef'] and re.fullmatch(r'refs/heads/release/[A-Za-z0-9][A-Za-z0-9._-]+',P['releaseRef']),'disabled target release ref')
 def api(p):return sp.check_output(['gh','api','repos/'+P['repo']+'/'+p],timeout=120)
 ri=o(api('actions/runs/'+str(Q['run'])));ji=o(api('actions/jobs/'+str(Q['job'])));c=o(api('git/commits/'+Q['head']))
 need(ri['head_sha']==ji['head_sha']==Q['head'] and ri['head_branch']==Q['branch'] and ji['name']=='native-integration' and ji['run_id']==Q['run'] and ri['status']==ji['status']=='completed' and ri['conclusion']==ji['conclusion']=='success' and c['tree']['sha']==Q['tree'] and [x['sha']for x in c['parents']]==[OLD],'unverified R5 producer authority')
 p=o(api('actions/runs/'+str(R['pages'])));j=o(api('actions/jobs/'+str(R['job'])));b=o(api('branches/master'))
 need(p['head_sha']==j['head_sha']==b['commit']['sha']==OLD and p['head_branch']=='master' and p['conclusion']==j['conclusion']=='success' and j['run_id']==R['pages'] and any(q['name']=='Deploy to GitHub Pages' and q['conclusion']=='success' for q in j['steps']),'wrong exact e702 Pages/master')
 logs=api('actions/jobs/'+str(R['job'])+'/logs');marker=(R['publishedAt']+' Reported success!').encode()
 if zipfile.is_zipfile(io.BytesIO(logs)):
  with zipfile.ZipFile(io.BytesIO(logs)) as l:
   need(l.testzip() is None and sum(e.file_size for e in l.infolist())<16<<20,'unexpected Pages log archive')
   found=any(marker in l.read(e)for e in l.infolist()if not e.is_dir())
 else:found=marker in logs
 need(found,'exact e702 Pages success moment mismatch')
 n=str(Q['artifact']);a=o(api('actions/artifacts/'+n))
 need(a['workflow_run']['id']==Q['run'] and a['workflow_run']['head_sha']==Q['head'] and a['name']==Q['artifactName'] and not a['expired'] and a['digest']=='sha256:'+Q['fact']['sha256'] and a['size_in_bytes']==Q['fact']['bytes'],'wrong official R5 artifact metadata')
 return verified(api('actions/artifacts/'+n+'/zip'))
def select(b,old,incoming,now):
 code="""import fs from 'node:fs';import{graphSha256,selectPublishedGenerations}from './shared/web-retention.mjs';const a=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write(JSON.stringify(selectPublishedGenerations([{...a.incoming,graphSha256:graphSha256(a.incoming.files)},...a.prior],{now:a.now})));"""
 return o(sp.check_output(['node','--input-type=module','-e',code],cwd=b,input=json.dumps({'prior':old,'incoming':incoming,'now':now}).encode(),timeout=60))
def assemble(root,w):
 need(P['enabled'] is True and P['scopeApproval'] is True and P['destinationMustBeAtBase'] is True,'DISABLED until explicit root release review')
 need(git(root,'rev-parse','HEAD')==OLD and git(root,'rev-parse','HEAD^{tree}')==R['tree'] and not git(root,'status','--porcelain'),'wrong pristine e702 repository')
 need(not w.exists() and w.parent.is_dir() and not w.is_relative_to(root),'non-isolated scratch assembly')
 parts,d,native=authority(root)
 w.mkdir()
 b=w/'B';git(root,'worktree','add','--detach',str(b),OLD)
 need(not git(b,'status','--porcelain') and git(b,'rev-parse','HEAD^{tree}')==R['tree'],'nonpristine assembly stage')
 before=read(b,M)
 need(full(before)==R['manifest'] and g(read(b,RETAINER))==R['retainerGit'] and g(read(b,POLICY))==R['policyGit'],'official retention code mismatch')
 need(all(g(read(b,k))==P['sources'][k]['old']for k in MODSRC) and all(not (b/k).exists()for k in NEWSRC),'prior author exact bytes changed')
 old,normal=o(before),o(parts[M])
 oldreg=registry(old);active=idx(normal['files']);baseactive=idx(old['files'])
 diff=set(active)-set(baseactive)
 need(len(oldreg)==R['registry'] and len(old['publishedGenerations'])==R['publishedGenerations'] and len(active)==len(baseactive)==811 and diff==set(d['added']) and set(baseactive)-set(active)==set(d['displaced']),'wrong exact old/new live graph')
 need(all(f(read(b,k))==v for k,v in oldreg.items()),'historical immutable URL bytes changed')
 need(all(oldreg[k]==active[k]for k in set(oldreg)&set(active)),'existing immutable path identity changed')
 ca,cb=o(read(b,old['project'])),o(parts[normal['project']]);rec=o(parts[normal['project']])
 need(ca['stages']==cb['stages'] and len(ca['stages'])==len(ca['stageLibraries'])==len(cb['stageLibraries'])==50,'canonical map scope changed')
 need(cb['stageLibraries'][31] in diff and role(cb['stageLibraries'][31])=='web/data/chapter-32-assets-parts.json','wrong changed Stage32 packet')
 rec['stageLibraries'][31]=ca['stageLibraries'][31]
 if 'assetPaths' in rec:rec['assetPaths']['stageLibraries'][31]=ca['assetPaths']['stageLibraries'][31]
 need(rec==ca and set(P['stage07'])=={ca['stages'][6],ca['stageLibraries'][6]},'other 49 stage providers or Workshop order changed')
 need(all(active[k]==oldreg[k]==v for k,v in P['stage07'].items()),'Stage7 authored map or pack changed')
 c0,c1=old['common'],normal['common']
 need(len(c0)==len(c1)==76 and [(i,role(a),role(c))for i,(a,c)in enumerate(zip(c0,c1),1)if a!=c]==[(48,'web/runtime/ordered-common-4.js','web/runtime/ordered-common-4.js'),(56,'web/runtime/ordered-common-12.js','web/runtime/ordered-common-12.js'),(57,'web/runtime/campaign.js','web/runtime/campaign.js')],'main common ordered graph out of scope')
 need(all(k in active and f(parts[k])==active[k] for k in diff),'included active body hash differs')
 addActive=diff-set(oldreg);need(len(addActive)==10,'active alias unexpectedly already historic');add=addActive|NEWSRC
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
 need(len(union)==1521 and registry(final)==union and final['publishedRetention']==old['publishedRetention'] and all(f(read(b,k))==v for k,v in union.items()),'bad published immutable route closure')
 need({k:v for k,v in final.items()if k not in KEEP}=={k:v for k,v in normal.items()if k not in KEEP} and all(read(b,k)==v for k,v in parts.items()if k!=M),'official retention changed reviewed active data')
 git(b,'add','--',*sorted(MODIFY|add));changes=set(git(b,'diff','--cached','--name-status','--no-renames',OLD).splitlines())
 # A generated stable shell is only staged if actually different; no unrelated mode/byte stamped.
 typ={k for k in MODIFY if read(b,k)!=sp.check_output(['git','-C',str(b),'show',OLD+':'+k],timeout=90)}
 need(MODSRC|{M}<=typ and len(typ)==6 and len(add)==11 and changes=={'M\t'+k for k in typ}|{'A\t'+k for k in add} and not git(b,'ls-files','--others','--exclude-standard') and not git(b,'diff','--name-only'),'dirty exact release scope')
 need(all(git(b,'ls-files','--stage','--',k).split()[:3]==['100644',g(read(b,k)),'0'] for k in add|typ),'staged original bytes mismatch')
 tree=git(b,'write-tree')
 report={'status':'EXACT_DERIVED_LOCAL_TREE_NO_PUSH_NO_DEPLOY','candidateTree':tree,'parent':OLD,'manifest':full(read(b,M)),'add':sorted(add),'modify':sorted(typ),'oldUrls':len(oldreg),'preservedUrls':len(union),'publishedGenerations':len(newg),'expiredMetadata':sorted(set(oldg)-set(newg)),'candidateRawManifest':P['expectedNormalManifest'],'files':{k:full(read(b,k))for k in sorted(add|typ)},'reviewedRun':Q['run']}
 save(w/'ASSEMBLY.json',report);print(json.dumps({k:v for k,v in report.items()if k not in ('files','add','modify')}))
if __name__=='__main__':
 act=sys.argv[1]
 if act=='local-verify':
  v,d,_=verified(Path(sys.argv[2]).read_bytes());print(json.dumps({'status':'EXACT_LOCAL_ARCHIVE_VERIFIED','files':len(v),'newActive':len(d['added']),'manifest':full(v[M])}))
 elif act=='assemble':
  assemble(Path(sys.argv[2]).resolve(),Path(sys.argv[3]).resolve())
 else:raise SystemExit('local-verify EXACT_ZIP | assemble EXACT_E702_REPO FRESH_SCRATCH (no push)')
