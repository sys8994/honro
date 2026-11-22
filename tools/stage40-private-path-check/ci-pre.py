"""No-network, exact add-only source guard and initial scoped package configuration."""
import os,subprocess,sys,re,filecmp
from pathlib import Path
from urllib.parse import urlsplit
from local import D,blob,read,write,need,fact,verify_detached
C=read(D/'CARRIER.json')
P=read(D/'PINS.json')
def git(*z):return subprocess.check_output(['git','-C',str(D.parent.parent),*z],timeout=60)
def status(b):return set(b.decode().rstrip('\0').split('\0')) if b else set()
def lock_ok(z):
 need(z.get('lockfileVersion')==3 and isinstance(z.get('packages'),dict),'unsupported npm lock schema')
 for k,x in z['packages'].items():
  if not k:continue
  u=urlsplit(x.get('resolved',''))
  need(k.startswith('node_modules/') and all(t not in ('..','.') for t in k.split('/')) and
       isinstance(x.get('version'),str) and x.get('link') is not True and
       u.scheme=='https' and u.netloc=='registry.npmjs.org' and u.path.endswith('.tgz') and
       '/-/' in u.path and not u.query and not u.fragment and
       re.fullmatch(r'sha512-[A-Za-z0-9+/]+={0,2}',x.get('integrity','')) is not None,
       'foreign/missing/no-integrity lock row '+k)
def pre(auth):
 need(P['enabled'] is False and P['scope']=='local-loopback-only','unexpected committed partial-tool authority')
 env=os.environ
 need((env.get('GITHUB_REPOSITORY'),env.get('GITHUB_EVENT_NAME'),env.get('GITHUB_REF'),env.get('RUNNER_OS'),env.get('RUNNER_ARCH'))==
      (C['repo'],'push',C['ref'],'Linux','X64'),'unexpected exact isolated hosted CI ref/event')
 need(not (env.get('GITHUB_TOKEN') or env.get('GH_TOKEN')),'runner must not expose token')
 h=git('rev-parse','HEAD').decode().strip();b=P['base'];parent=b['head']
 need(h==env.get('GITHUB_SHA') and git('rev-list','--parents','-1',h).decode().split()==[h,parent], 'not exact single Git parent')
 need(git('rev-parse',parent+'^{tree}').decode().strip()==b['tree'],'detached zero source lineage')
 need(not git('status','--porcelain','-z','--untracked-files=all'),'dirty QA source tracking')
 t='tools/stage40-private-path-check/'
 want={C['workflow'],t+'CARRIER.json',*(t+x for x in C['tools'])}
 got=git('diff','--name-status','--no-renames',parent,h).decode().splitlines()
 need(len(got)==len(want) and set(got)=={'A\t'+x for x in want},'nonexact add-only QA carrier')
 for k,v in C['tools'].items():
  f=D/k;need(f.is_file() and not f.is_symlink() and fact(f.read_bytes())==v,'QA file hash mismatch '+k)
 for k,v in C['buildInputs'].items():
  need(blob(git('show',parent+':'+k))==v,'unexpected original package or npm lock '+k)
 # Only possible new file at this point; approval lives in QA job, not product.
 need(auth.parent==Path(env['RUNNER_TEMP']).resolve() and not auth.exists(),'nonapproved output location')
 write(auth,{**P,'enabled':True})
def verify_locks(w):
 for scope in ('A','B'):
  for k,v in C['buildInputs'].items():
   f=w/scope/k;need(blob(f.read_bytes())==v,'package or pinned lock mutated '+k)
   if k.endswith('package-lock.json'):lock_ok(read(f))
  for k,v in P['source'].items():
   expect=v['stock' if scope=='A' else 'candidate'];need(blob((w/scope/v['path']).read_bytes())==expect,'stock or private prototype source mutated '+k)
 write(w/'out'/'CI-LOCKS.json',{'locksAndPackageDefinitions':C['buildInputs'],'registry':'https://registry.npmjs.org','integrity':'sha512 per lock','appOnly':'exact f6/normal B on loopback','node':os.environ.get('NODE_VERSION'),'deploy':False})
def verify_source_writes(w):
 proof=verify_detached(w,P)
 prior=read(w/'out'/'WORKTREE.json')
 need(all(prior[k]==v for k,v in proof.items()) and git('rev-parse','HEAD').decode().strip()==prior['qaCheckoutHead']
      and not git('status','--porcelain','-z','--untracked-files=all') and not (w/'A'/'.git').exists(),
      'QA metadata/working state moved from source checkpoint')
 def list_files(root):
  paths=set()
  for parent,dirs,files in os.walk(root):
   rp=Path(parent).relative_to(root)
   if rp==Path('.'):dirs[:]=[d for d in dirs if d not in ('web','node_modules')]
   if rp==Path('game'):dirs[:]=[d for d in dirs if d!='node_modules']
   need(all(not (Path(parent)/x).is_symlink() for x in dirs+files),'unexpected tracked dependency code/link outside npm scratch')
   paths.update(str(rp/f) for f in files if not (rp==Path('.') and f=='.git' and root==w/'B'))
  return paths
 roots=[w/'A',w/'B'];a,b=map(list_files,roots)
 report='_local/reports/web-split/build.json'
 need(set(a)-set(b)==set() and set(b)-set(a)<= {report},'normal build wrote or removed unrelated repo paths')
 exceptions={'HONRO.html','HONRO_WORKSHOP.html','index.html',report,*(v['path'] for v in P['source'].values())}
 need(all(filecmp.cmp(roots[0]/f,roots[1]/f,shallow=False) for f in sorted(a-exceptions)),'normal build changed unrelated tracked source/asset')
 result=read(w/'out'/'CI-LOCKS.json');result.update({'unrelatedPathsVerified':len(a-exceptions),'extraExpectedPaths':sorted(b-a)})
 write(w/'out'/'CI-LOCKS.json',result)
 write(w/'out'/'WORKTREE.json',{**prior,'postBuildVerified':True})
if __name__=='__main__':
 need(len(sys.argv)==3,'usage: ci-pre.py {pre|locks} PATH')
 op,p=sys.argv[1],Path(sys.argv[2]).resolve()
 if op=='pre':pre(p)
 elif op in ('locks','writes'):
  need(p.is_relative_to(Path('/tmp')),'QA temp path only')
  if op=='locks':verify_locks(p)
  else:verify_source_writes(p)
 else:raise ValueError('not a read-only release task')
