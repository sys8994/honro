"""Disabled exact Stage42 assembler. Network read of master only; no Git push/deploy."""
import hashlib, io, json, os, re, stat, subprocess as sp, sys, zipfile
from pathlib import Path
D=Path(__file__).resolve().parent
P=json.loads((D/'PINS.json').read_bytes())
B=P['base'];Q=P['producer'];F=P['fallback'];A=P['expectedAliases'];SRC=P['sources']
MAN='web/manifest.json';SHELL={'HONRO.html','HONRO_WORKSHOP.html','index.html'}
OUTER={'SOURCE.json','BROWSER-ROUTES.json','NORMAL-GRAPH.json','READBACK.json','WORKSHOP-ALIAS-DIAGNOSTIC.json','OVERLAY-SEAL.json','STAGE42-2C4-REUSABLE-OVERLAY-NO-DEPLOY.zip'}
NEW=set(A.values()); GEN=SHELL|NEW|{MAN}; INNER=GEN|set(SRC)
def need(x,msg):
 if not x:raise RuntimeError(msg)
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def rich(b):return {**fact(b),'git':hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()}
def obj(b):
 def unique(p):
  q=dict(p);need(len(q)==len(p),'duplicate JSON key');return q
 return json.loads(b,object_pairs_hook=unique)
def git(r,*args,input=None):
 env={k:v for k,v in os.environ.items() if k not in ('GH_TOKEN','GITHUB_TOKEN','RELEASE_TOKEN') and not k.startswith('GIT_CONFIG_')}
 return sp.check_output(['git','-C',str(r),'--no-optional-locks',*args],env={**env,'GIT_TERMINAL_PROMPT':'0'},input=input,timeout=180).decode().strip()
def read(root,k):
 p=root/k;need(p.resolve()==p and p.is_file() and stat.S_ISREG(p.lstat().st_mode),'unsafe/missing local file '+k);return p.read_bytes()
def safe(z,expected=None,cap=100<<20):
 rows=z.infolist(); names={i.filename for i in rows}
 need(len(rows)==len(names) and not any(i.is_dir() or stat.S_IFMT(i.external_attr>>16) not in (0,stat.S_IFREG) or i.compress_type not in (zipfile.ZIP_DEFLATED,zipfile.ZIP_STORED) for i in rows),'unsafe ZIP shape')
 need(sum(i.file_size for i in rows)<cap and z.testzip() is None,'ZIP cap or CRC')
 if expected is not None:need(names==expected,'unexpected embedded files')
 else:need(OUTER<=names and all(k in OUTER or re.fullmatch(r'(?:DERIVATION\.json|[a-z-]+\.log|(?:PC|M)-[a-zA-Z0-9-]+-(?:raw|dom|actual-cold)\.png)',k) for k in names),'unexpected producer archive file')
def idx(rows):
 d={}
 for r in rows:
  k=r['path'];need(re.fullmatch(r'web/(?:runtime|entries|data|graphics|styles|fonts)/[A-Za-z0-9_.-]+',k),'unsafe manifest path')
  v={x:r[x] for x in ('bytes','sha256')};need(type(v['bytes']) is int and v['bytes']>=0 and re.fullmatch('[a-f0-9]{64}',v['sha256']),'invalid registry entry')
  need(k not in d or d[k]==v,'conflicting immutable registry');d[k]=v
 return d
def registry(m):return idx(m['files']+m['previousFiles']+sum(m['previousGenerations'],[])+[f for g in m['publishedGenerations'] for f in g['files']])
def verify_reports(verified,outer):
 # The official status JSON and raw artifact were retrieved using the authorised
 # connector by the caller. This script itself carries no credentials.
 run=obj(read(verified,'forward-run.json'));job=obj(read(verified,'forward-job.json'));art=obj(read(verified,'forward-artifact.json'));head=obj(read(verified,'forward-parent-tree.json'))
 need((run['id'],run['head_sha'],run['head_branch'],run['status'],run['conclusion'])==(Q['run'],Q['head'],Q['branch'],'completed','success'),'producer run mismatch')
 need((job['id'],job['run_id'],job['head_sha'],job['status'],job['conclusion'])==(Q['job'],Q['run'],Q['head'],'completed','success'),'producer job mismatch')
 need((head['sha'],head['tree']['sha'],[p['sha'] for p in head['parents']])==(Q['head'],Q['tree'],[B['head']]),'wrong producer tree/parent')
 need(art['id']==Q['artifact'] and art['name']==Q['name'] and art['workflow_run']['id']==Q['run'] and art['workflow_run']['head_sha']==Q['head'] and not art['expired'] and art['digest']=='sha256:'+Q['outer']['sha256'] and art['size_in_bytes']==Q['outer']['bytes'],'producer artifact official identity mismatch')
 need(fact(outer)==Q['outer'],'producer outer ZIP SHA/size')
 f=obj(read(verified,'fallback-artifact.json')); cmp=read(verified,'fallback-reviewed-receipt.json'); archive=read(verified,'fallback-official.zip')
 need(f['id']==F['artifact'] and f['name']==F['name'] and f['expired'] is False and f['workflow_run']['id']==F['run'] and f['workflow_run']['head_sha']==F['head'] and f['digest']=='sha256:'+F['outer']['sha256'] and f['size_in_bytes']==F['outer']['bytes'],'fallback official archive mismatch')
 need(fact(archive)==F['outer'] and sha(cmp)==F['reviewSHA256'],'fallback exact review pin mismatch')
 with zipfile.ZipFile(io.BytesIO(archive)) as z:need(sum(i.file_size for i in z.infolist())<55<<20 and z.testzip() is None,'fallback official ZIP cap/CRC')
 r=obj(cmp); need(r['sha256']==F['outer']['sha256'] and r['nativeColdAccepted']==10 and r['ordinaryTitleResavesAccepted']==4 and r['officialWorkflowWasNotGreen'] is True,'fallback receipt mischaracterized')
 need(len(r['files'])==6 and all(v['raw']['differentPixels']==0 and v['dom']['differentPixels']<=69 and v['dom']['maxDN']<=2 for v in r['files'].values()),'reviewed fallback visual perimeter failed')
def validate(outer):
 with zipfile.ZipFile(io.BytesIO(outer)) as z:
  safe(z)
  seal=z.read('OVERLAY-SEAL.json');graph=z.read('NORMAL-GRAPH.json');runtime=z.read('READBACK.json')
  need([sha(x) for x in (seal,graph,runtime)]==[Q['sealSHA256'],Q['graphSHA256'],Q['readbackSHA256']],'exact runtime/build/seal receipt mismatch')
  seal,graph,runtime=map(obj,(seal,graph,runtime))
  embedded=z.read('STAGE42-2C4-REUSABLE-OVERLAY-NO-DEPLOY.zip')
 need(rich(embedded)==Q['inner']==seal['archive'] and seal['base']==B['head'] and seal['status']=='REUSABLE_NO_DEPLOY_OVERLAY_ZERO_IMMUTABLE_DELETES_PENDING_RELEASE_ATTESTATION' and seal['deletes']==[],'bad producer retention seal')
 need(graph['status']=='PASS_FULL_EXACT_RELEASE_GRAPH' and set(graph['activeAdded'])==NEW and set(graph['activeReplaced'])==A.keys() and graph['other49providerAliasesAnd50MapBytesExact'] is True,'normal build graph outside exact seven replacements')
 need(runtime['status']=='PASS_NORMAL_FULL_CURRENT_AND_PRIOR_ACTUAL_CONTINUE_NO_DEPLOY_ROLLBACK_PENDING' and not runtime['errors'] and len(runtime['coldContinue'])==14 and len(runtime['visualComparison'])==8 and len(runtime['stage40Continue'])==2,'incomplete or failed authentic R2 browser proof')
 need(all(i['priorFixtureDecodedRGBAExact']=={'raw':True,'dom':True} for i in runtime['visualComparison'].values()),'forward qualified visual changed')
 need(all(v.get('sameState') is True and v.get('actualTitleContinue') is True and v.get('wires') for v in runtime['coldContinue'].values()),'invalid exact cold-save receipt')
 need(all(all(v.get(k,{}).get('sameState') is True and v[k].get('wires') for k in ('CURRENT','NEW')) for v in runtime['stage40Continue'].values()),'invalid protected Stage40 receipt')
 need(all(runtime['coldContinue'][d+'-CURRENT-to-NEW'].get('migratedResave') for d in ('PC','M')),'native current title re-save absent')
 with zipfile.ZipFile(io.BytesIO(embedded)) as z:
  safe(z,INNER,30<<20); files={k:z.read(k) for k in INNER}
 need({k:rich(v) for k,v in files.items()}==seal['files'],'file bytes mismatch producer')
 need(all(rich(files[k])==v['after'] for k,v in SRC.items()),'unexpected authored source')
 return files,seal,graph,runtime
def stage(root,work,files,seal,graph):
 need(not work.exists(),'scratch checkout already exists')
 git(root,'worktree','add','--detach',str(work),B['head'])
 need(not git(work,'status','--porcelain') and git(work,'rev-parse','HEAD^{tree}')==B['tree'],'wrong clean writer base')
 old=read(work,MAN); need(rich(old)==seal['baseManifest'] and rich(old)['git']==B['manifestGit'],'base manifest changed')
 stock,merged=map(obj,(old,files[MAN])); before,after=map(registry,(stock,merged))
 need(len(A)==7 and len(INNER)==14 and set(after)-set(before)==NEW and all(after[k]==v for k,v in before.items()),'old immutables not exact')
 need(len(before)==seal['registryBefore'] and len(after)==seal['registryAfter'],'unexpected registry size')
 for field in ('previousGenerations','publishedGenerations','publishedRetention'):need(stock[field]==merged[field],'existing published history rewritten')
 active,new_active=map(lambda x:idx(x['files']),(stock,merged))
 need(set(active)-set(new_active)==A.keys() and set(new_active)-set(active)==NEW,'final active alias mismatch')
 fields={'files','previousFiles','common','project','gameEntry','workshopEntry','playtest'}
 need({k:v for k,v in stock.items() if k not in fields}=={k:v for k,v in merged.items() if k not in fields},'unrelated manifest pointers changed')
 need(merged['common']==[A.get(k,k) for k in stock['common']],'unrelated common runtime changed')
 for k in ('project','gameEntry','workshopEntry'):need(stock[k] in A and merged[k]==A[stock[k]],'wrong native '+k)
 old_doc=stock['playtest'].removesuffix('?embedded=1')
 need(stock['playtest']==old_doc+'?embedded=1' and old_doc in A and merged['playtest']==A[old_doc]+'?embedded=1','wrong Workshop embedded binding')
 old_prev={x['path'] for x in stock['previousFiles']}
 extra=[dict(path=k,**before[k]) for k in sorted(before) if k not in new_active and k not in old_prev]
 need(merged['previousFiles']==stock['previousFiles']+extra,'retention rows moved/rewritten')
 need(all(fact(read(work,k))==v for k,v in before.items()),'old immutable physical bytes missing/changed')
 old_campaign=obj(read(work,stock['project']));new_campaign=obj(files[merged['project']])
 need(old_campaign['stageLibraries'][41]==B['stageProvider'] and old_campaign['stages'][41]==B['stageMap'],'wrong Stage42 stock authority')
 prior=list(old_campaign['stageLibraries']);prior[41]=A[B['stageProvider']]
 need({**old_campaign,'stageLibraries':prior}==new_campaign,'an unrelated campaign slot changed')
 for k,v in SRC.items():need(rich(read(work,k))['git']==v['oldGit'],'unexpected original source')
 for k,v in files.items():
  dest=work/k;need(dest.is_file()==(k not in NEW) and not dest.is_symlink() and dest.resolve()==dest,'alias supersession invalid')
  dest.write_bytes(v)
 need(all(fact(read(work,k))==v for k,v in after.items()),'retained alias bytes not faithfully assembled')
 expected={'A\t'+k for k in NEW}|{'M\t'+k for k in INNER-NEW}
 git(work,'add','--',*sorted(INNER))
 need(set(git(work,'diff','--cached','--name-status','--no-renames',B['head']).splitlines())==expected and not git(work,'diff','--name-only') and not git(work,'ls-files','--others','--exclude-standard'),'unexpected staged product diff')
 need(all(git(work,'ls-files','--stage','--',k).split()[:3]==['100644',rich(read(work,k))['git'],'0'] for k in INNER),'wrong exact staged file identity')
 tree=git(work,'write-tree')
 return tree,sorted(expected)
def run(root,verified,out,plan=False):
 need(__debug__ and P['enabled'] is P['scopeApproval'] is True,'disabled; no local writes or network')
 need(all(Q.get(x) for x in ('artifact','outer','inner','tree','sealSHA256','graphSHA256','readbackSHA256')),'producer bindings incomplete')
 need(not out.exists(),'receipt directory must not exist')
 need(git(root,'remote','get-url','origin')=='https://github.com/sys8994/honro','wrong repository origin')
 need(git(root,'ls-remote','--exit-code','origin','refs/heads/master')==B['head']+'\trefs/heads/master','master moved; fail closed')
 need(git(root,'rev-parse',B['head']+'^{tree}')==B['tree'],'exact immutable 2c4 tree unavailable')
 outer=read(verified,'forward-official.zip');verify_reports(verified,outer)
 files,seal,graph,r=validate(outer)
 out.mkdir();tree,changes=stage(root,out/'candidate-worktree',files,seal,graph)
 result={'status':'PLAN_TREE_NO_COMMIT_NO_PUSH','base':B['head'],'tree':tree,'exactReleaseDiff':changes,'producer':Q,'fallback':F}
 (out/'ASSEMBLY.json').write_text(json.dumps(result,indent=2)+'\n')
 if plan:return
 need(tree==P['expectedTree'],'candidate tree not independently approved')
 new=git(root,'-c','user.name=honro automation','-c','user.email=github-actions[bot]@users.noreply.github.com','commit-tree',tree,'-p',B['head'],input=b'Restore Stage 5-2 terrain continuity and preserve save compatibility\n')
 need(git(root,'show','-s','--format=%P %T',new)==B['head']+' '+tree,'candidate ancestry mismatch')
 result.update(status='EXACT_STAGE42_RELEASE_TREE_NO_PUSH',candidateCommit=new)
 (out/'ASSEMBLY.json').write_text(json.dumps(result,indent=2)+'\n')
if __name__=='__main__':
 need(len(sys.argv)==5 and sys.argv[1] in ('plan','seal'),'usage: writer.py plan|seal canonical-git verified-artifacts new-output')
 run(*(Path(x).resolve()for x in sys.argv[2:]),plan=sys.argv[1]=='plan')
