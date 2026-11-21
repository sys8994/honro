"""Restricted local verifier, never builds/commits/pushes. No stale base fallback."""
import argparse, hashlib, importlib.util, json, re, subprocess, sys
from pathlib import Path

HOME=Path(__file__).resolve().parent
R2=json.loads((HOME/'PINS.json').read_text())
BASE_OLD=R2['base']
SOURCE=R2['productGit']
MF='web/manifest.json'
SHELL=set(R2['stockShells'])
HISTORY={'previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
RET={'tools/release/retain-published-web.mjs':'8374336b53c74ac81e6d32f5aa43eee575e61daa',
     'shared/web-retention.mjs':'16687b0fc38e432a7d66a015ddf3ebe744163a06'}
TARGET='shared/runtime/terrain-readability.js'
TEST='tests/stage7-root-floor-closure.mjs'
SOURCE_STATUS={'M\t'+TARGET,'A\t'+TEST}
P21={'source':'shared/runtime/act3-handoff-art.js','test':'tests/stage21-west-bedrock-source.mjs'}
ARCH=json.loads((HOME/'PREFLIGHT.json').read_text())
FIXTURE35=json.loads((HOME/'NEXT.disabled.json').read_text())['stage35']
BEFORE16=R2['oldCommon16']
AFTER16='web/runtime/ordered-common-16.3d9993bd92d5eb93.js'
A16={'bytes':177300,'sha256':'c094392d4ee992d95fda1a5d8d50835a93ef8c9095962b1f10e4d34b3aec3b21'}
B16=ARCH['normalBeforeRetentionPins'][AFTER16]

def require(v,*what):
 if not v:raise SystemExit('HOLD: '+' '.join(map(str,what)))
def sha(b):return hashlib.sha256(b).hexdigest()
def stamp(b):return {'bytes':len(b),'sha256':sha(b)}
def git(r,*a):
 return subprocess.check_output(['git','-C',str(r),*a])
def parse(p):return json.loads(p.read_bytes())
def pinned(s,n):return isinstance(s,str) and re.fullmatch(rf'[0-9a-f]{{{n}}}',s) is not None and s!='0'*n
def reg_path(p):return re.fullmatch(r'web/(runtime|entries|data|styles|graphics|fonts)/[A-Za-z0-9_.-]+',p)
def inventory(rs, target=None):
 d={}
 for row in rs:
  p=row['path']; pair={k:row[k]for k in ('bytes','sha256')}
  require(reg_path(p) and pinned(pair['sha256'],64) and pair['bytes']>=0 and d.get(p,pair)==pair,'invalid/conflicting registered asset',p)
  d[p]=pair
 require(target is None or len(d)==len(rs)==target,'wrong active path count',target)
 return d
def registry(m):return inventory([*m['files'],*m['previousFiles'],*(f for g in m['previousGenerations']for f in g),*(f for g in m['publishedGenerations']for f in g['files'])])
def exactmeta(f):
 return type(f) is dict and set(f)=={'bytes','sha256'} and type(f['bytes']) is int and f['bytes']>0 and pinned(f['sha256'],64)
def check_config(c, *, normal_qa=False):
 require(c['enabled'] is True,'transplant disabled: wait for exact Stage21 public master + root decision')
 for k in ('base','baseTree','source','sourceTree'):require(pinned(c[k],40),'missing exact revision pin',k)
 require(c['base']!=BASE_OLD and len({c['base'],c['source']})==2,'old base or wrong source')
 require(type(c['activeCount']) is int and c['activeCount']>0,'explicit verified current active count required')
 require(exactmeta({k:c['stockManifest'][k]for k in ('bytes','sha256')}) and pinned(c['stockManifest']['git'],40),'wrong manifest evidence')
 require(set(c['stockShells'])==SHELL and all(exactmeta(s)for s in c['stockShells'].values()),'missing prior shell identities')
 p=c['priorPages'];require(p['head']==c['base'],'wrong Pages/base head')
 if not normal_qa:
  require(p['conclusion']=='success' and all(type(p[k]) is int and p[k]>0 for k in ('run','deployJob')) and
   re.fullmatch(r'\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z',p['publishedAt'] or '') is not None,
   'missing exact successful latest Pages retention receipt')
 else:
  require(c.get('purpose')=='normal-qa-no-retention','wrong carrier purpose')
 s=c['stage21'];require(all(pinned(s.get(k),40) for k in P21),'missing approved Stage21 product blobs')
 a=s['common17'];require(type(a) is dict and len(a)==1 and all(re.fullmatch(r'web/runtime/ordered-common-17\.[0-9a-f]{16}\.js',p) and exactmeta(m) and p.endswith('.'+m['sha256'][:16]+'.js') for p,m in a.items()),'missing active approved Stage21 compiled packet')
 require(not any('2ed746adf1d3e0e3' in p for p in a),'still old common17, not published Stage21')
 require(c['stage35']==FIXTURE35,'this narrowly scoped harness will not accept drifting Stage35 owners')
def oid(r,ref,p=None):return git(r,'rev-parse',ref+(':'+p if p else '')).decode().strip()
def stat(r,ref,p):return stamp(git(r,'show',ref+':'+p))
def exists(r,ref,p):return subprocess.run(['git','-C',str(r),'cat-file','-e',ref+':'+p],stderr=subprocess.DEVNULL).returncode==0
def locked_base(c,repo):
 x,y=c['base'],c['source']
 require(git(repo,'rev-parse','--is-shallow-repository').strip()==b'false','retainer requires full history')
 require(oid(repo,x+'^{tree}')==c['baseTree'] and oid(repo,y+'^{tree}')==c['sourceTree'],'pinned tree mismatch')
 require(git(repo,'rev-list','--parents','-n1',y).decode().split()==[y,x],'exact single parent required')
 require(git(repo,'merge-base','--is-ancestor',BASE_OLD,x)==b'','transplant base not descended from 9ac')
 diff=set(git(repo,'diff','--no-renames','--name-status',x,y).decode().splitlines())
 require(diff==SOURCE_STATUS,'candidate must be exactly approved 2 source paths',diff)
 require(oid(repo,x,TARGET)==R2['requiredStockReadabilityGit'] and not exists(repo,x,TEST),'approved transplant source preimage changed')
 for p,v in SOURCE.items():require(oid(repo,y,p)==v,'different approved Stage7 source',p)
 for p,v in {**{P21[p]:c['stage21'][p] for p in P21},**RET}.items():
  require(oid(repo,x,p)==oid(repo,y,p)==v,'protected product/retention source changed',p)
 pin=c['stockManifest'];require(oid(repo,x,MF)==pin['git'] and stat(repo,x,MF)=={k:pin[k]for k in ('bytes','sha256')},'wrong exact current manifest')
 require(all(stat(repo,x,p)==v for p,v in c['stockShells'].items()),'wrong prior shells')
 m=json.loads(git(repo,'show',x+':'+MF)); active=inventory(m['files'],c['activeCount'])
 protect(c,m,active)
 return m
def protect(c,m,active):
 require(all(active.get(p)==v and p in m['common'] for p,v in c['stage21']['common17'].items()),'Stage21 actual common17 not registered active')
 for p in c['stage35'].values():
  require(p in active,'approved Stage35 asset no longer active',p)
  require(active[p]==r2_stage35()[p],'Stage35 asset bytes changed',p)
 require(all(active.get(p)==v for p,v in R2['bakedStage7'].items()),'original Stage7 map/art bytes changed')
def r2_stage35():
 return {p:KNOWN35[p] for p in FIXTURE35.values()}
def write(f,data):
 f.write_text(json.dumps(data,indent=2,sort_keys=True)+'\n')
def prepare(c,repo,w):
 locked_base(c,repo)
 require(not w.exists(),'use fresh scratch directory only')
 w.mkdir(parents=True);(w/'out').mkdir()
 for side,ref in (('A',c['base']),('B',c['source'])):
  git(repo,'worktree','add','--detach',str(w/side),ref)
  require(not git(w/side,'status','--porcelain=v1','-z'),'checkout dirty',side)
 write(w/'out'/'SOURCE.json',{'base':c['base'],'baseTree':c['baseTree'],'source':c['source'],'sourceTree':c['sourceTree'],'stage7':SOURCE,'stage21':c['stage21'],'stage35':r2_stage35(),'priorPages':c['priorPages']})
def built(c,repo,w):
 locked_base(c,repo)
 require(stamp((w/'A'/BEFORE16).read_bytes())==A16 and BEFORE16 in parse(w/'A'/MF)['common'],'old exact common16 (Stage7) structure changed')
 now=parse(w/'B'/MF)
 require(AFTER16 in now['common'] and stamp((w/'B'/AFTER16).read_bytes())==B16,'B differs from exact approved common16')
 # Keep the checked R2 implementation; override only base-dependent inputs and active count in this local process.
 sys.argv=[__file__,'unused',str(w)]
 spec=importlib.util.spec_from_file_location('previous_r2_guard',HOME/'r2-guard-unchanged.py')
 mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
 mod.BASE=c['base'];mod.CAND=c['source']
 mod.P={**R2,**{k:c[k]for k in ('base','stockManifest','stockShells')}}
 mod.inv=lambda m:inventory(m['files'],c['activeCount'])
 mod.built()
 g=parse(w/'out'/'GRAPH.json');pairs=g['allRenamedPaths']
 fresh={p for _,p in pairs}
 require(g['repacked']==[[BEFORE16,AFTER16]] and len(pairs)==len(fresh)==4,'unexpected active alias roles')
 require(g['oldReadabilityMinified']==OLD_MINI and g['newReadabilityMinified']==NEW_MINI,'exact compiler module fingerprints changed')
 protect(c,now,inventory(now['files'],c['activeCount']))
 require(len(set(fresh)&set(registry(parse(w/'A'/MF))))==0 and all(not exists(repo,c['base'],p)for p in fresh),'an output alias already exists in published history')
 for p,s in c['stage21']['common17'].items():
  require(g['A'][p]==s==g['B'][p] and p not in fresh,'approved Stage21 bytes changed')
 focus=sorted(fresh|SHELL|{MF})
 require(len(focus)==8,'expected 8 generated output paths')
 write(w/'out'/'NORMAL-PINS.json',{p:g['B'][p]for p in focus})
 browser={**R2,'base':c['base'],'tree':c['baseTree'],'sourceCommit':c['source'],'sourceTree':c['sourceTree'],
          'stockManifest':c['stockManifest'],'stockShells':c['stockShells']}
 write(w/'out'/'R2-BROWSER-PINS.json',browser)
def retained(c,repo,w,r):
 old=locked_base(c,repo)
 require(oid(r,'HEAD')==c['source'],'retention checkout must be at exact source, with generated files unstaged')
 b=parse(w/'B'/MF); final=parse(r/MF)
 roles=lambda m:{p:v for p,v in m.items() if p not in HISTORY}
 require(roles(b)==roles(final),'retainer changed active payload/roles')
 normal=parse(w/'out'/'NORMAL-PINS.json')
 require(len(normal)==8 and all(stamp((w/'B'/p).read_bytes())==v for p,v in normal.items()),'stale normal generated seal')
 require(all(stamp((r/p).read_bytes())==v for p,v in normal.items() if p!=MF),'retainer changed verified compiled bytes')
 before,after=registry(old),registry(final)
 require(before.keys()<=after.keys() and all(after.get(p)==s for p,s in before.items()),'published history drift')
 require(all(stamp((r/p).read_bytes())==v for p,v in after.items()),'registered bytes missing/mutated')
 prior=c['priorPages'];pg=[g for g in final['publishedGenerations']if g['sourceSha']==c['base']]
 require(len(pg)==1 and pg[0]['publishedAt']==prior['publishedAt'] and pg[0]['publishedAtPrecision']=='instant' and
         pg[0]['evidence']==f"https://github.com/sys8994/honro/actions/runs/{prior['run']}" and pg[0]['files']==old['files'] and
         all(g['sourceSha']!=c['source'] for g in final['publishedGenerations']),'not the exact previous published active graph')
 delta=set(git(r,'diff','--no-renames','--name-status',c['base'],'--').decode().splitlines())
 expected=SOURCE_STATUS|{'M\t'+p for p in SHELL|{MF}}
 new=set(git(r,'ls-files','--others','--exclude-standard').decode().splitlines())
 require(delta==expected and new==set(normal)-(SHELL|{MF}),'old physical tracked file deleted/modified or scope extras',delta^expected,new)
 write(w/'out'/'RETAINED-LOCAL-PINS.json',{p:stamp((r/p).read_bytes()) for p in sorted(set(SOURCE)|set(normal))})

def main():
 a=argparse.ArgumentParser();a.add_argument('phase',choices=('validate','prepare','built','retained'));a.add_argument('pins',type=Path)
 a.add_argument('repo',type=Path,nargs='?');a.add_argument('scratch',type=Path,nargs='?');a.add_argument('--retained',type=Path)
 ns=a.parse_args();c=parse(ns.pins);check_config(c,normal_qa=ns.phase!='retained')
 if ns.phase=='validate':return
 require(ns.repo is not None and ns.scratch is not None,'exact local source repository and scratch required')
 if ns.phase=='retained':
  require(ns.retained is not None,'separate retained source checkout argument required')
  retained(c,ns.repo.resolve(),ns.scratch.resolve(),ns.retained.resolve())
 else:globals()[ns.phase](c,ns.repo.resolve(),ns.scratch.resolve())
OLD_MINI={'bytes':4589,'sha256':'54e7298bc4da24c22d136c55f4b09aaf6345cf454d4338ff229c3bfc5e3aad92'}
NEW_MINI={'bytes':4899,'sha256':'4f060b4b085d2e0ee19938a519fbd554497ebcfdd168133b98dbcff5b33eb91d'}
KNOWN35=parse(HOME/'STAGE35-PUBLIC-BYTES.json')
if __name__=='__main__':main()
