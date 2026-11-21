"""Immutable published Stage7 baseline, exact one-source normal compile. QA only."""
import hashlib,json,os,re,subprocess,sys
from pathlib import Path
H=Path(__file__).resolve().parent
P=json.loads((H/'POSES.json').read_bytes());W=P['lineage']['stage14NormalAuthority'];LIVE=P['live']
BASE=LIVE['commit'];TREE=LIVE['tree'];OLD_MAN=(LIVE['manifest'] or {}).get('git')
REF='refs/heads/qa/stage7-west-closure-after-stage14';REPO='sys8994/honro'
SRC='shared/runtime/terrain-readability.js'
S14SRC='shared/runtime/act2-spatial-art.js'
OLD='df4437aa937dce38efac3c799e615e68cee0cf29';NEW='aa4ccbcaa8a2ae6160330c1134f1596c9f4be6f8'
MF='web/manifest.json';SHELL={'HONRO.html','index.html','HONRO_WORKSHOP.html'}
OLD_RUNTIME=W['priorCommon16']
ROOT=Path(os.environ.get('GITHUB_WORKSPACE','.')).resolve()
QA={'.github/workflows/stage7-west-closure.yml',*(f'tools/stage7-west-closure/{p}'for p in ('guard.py','capture.py','candidate.js','park.js','stock-observer.json','POSES.json'))}
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def blob(b):return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\x00'+b).hexdigest()
def stamp(b):return {**fact(b),'git':blob(b)}
def rd(r,k):return (r/k).read_bytes()
def git(r,*a):return subprocess.check_output(['git','-C',str(r),*a],timeout=100)
def save(p,x):
 t=p.with_suffix('.tmp');t.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n');t.replace(p)
def js(b):return json.loads(b)
def roles(n):
 return re.fullmatch(r'web/runtime/ordered-(common|game)-(\d+)\.[a-f0-9]{16}\.js',n)
def exact(w):
 assert LIVE['enabled'] is True,'DISABLED: wait for exact successful Stage14 Pages successor and independently signed retained manifest'
 assert all(type(x)is str and bool(re.fullmatch(r'[0-9a-f]{40}',x))for x in (BASE,TREE,OLD_MAN))
 assert LIVE['confirmedPages']['head']==BASE and LIVE['confirmedPages']['result']=='success'
 assert not(os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN'))
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_REF'],os.environ['GITHUB_EVENT_NAME'])==(REPO,REF,'push')
 h=os.environ['GITHUB_SHA'];assert w.is_relative_to(Path(os.environ['RUNNER_TEMP']).resolve())
 assert git(ROOT,'rev-list','--parents','-n1',h).decode().split()==[h,BASE]
 assert git(ROOT,'rev-list','--parents','-n1',BASE).decode().split()==[BASE,P['lineage']['prior']]
 assert git(ROOT,'rev-parse',BASE+'^{tree}').decode().strip()==TREE and not git(ROOT,'status','--porcelain=v1','-z')
 assert set(git(ROOT,'diff','--no-renames','--name-status',BASE,h).decode().splitlines())=={'A\t'+k for k in QA}
 assert all(git(ROOT,'ls-tree',h,'--',p).decode().split()[:2]==['100644','blob'] for p in QA)
 return h
def pre(w):
 h=exact(w);a,b=w/'A',w/'B'
 for k in (a,b):
  git(ROOT,'worktree','add','--detach',str(k),BASE)
  assert not git(k,'status','--porcelain=v1','-z') and git(k,'rev-parse','HEAD^{tree}').decode().strip()==TREE
  assert stamp(rd(k,MF))==LIVE['manifest'] and blob(rd(k,SRC))==OLD
  assert stamp(rd(k,S14SRC))==W['source'] and fact(rd(k,OLD_RUNTIME))==W['active'][OLD_RUNTIME]
 orig=rd(a,SRC);changed=rd(H,'candidate.js')
 assert blob(changed)==NEW and sha(changed)=='3ceca0d9455255251ab5d72a554bbc7a725bb6bb29bc7d4ac11c47c9a6c54b07'
 needle=b'if(!walkable&&ny>0&&b.honroStage===7'
 old=b'a.y===5069.18&&z.y===5069.18&&Math.min(a.x,z.x)===-1200&&Math.max(a.x,z.x)===5732.24)continue;'
 nw=b'((ny>0&&'+old.split(b')continue;')[0]+b')||(a.x===-1200&&z.x===-1200&&a.y===5069.18&&z.y===3101.83)))continue;'
 assert orig.count(needle)==orig.count(old)==1
 assert orig.replace(needle,b'if(!walkable&&b.honroStage===7').replace(old,nw)==changed
 (b/SRC).write_bytes(changed)
 assert git(b,'diff','--name-status').decode().splitlines()==['M\t'+SRC]
 save(w/'out/SOURCE.json',{'base':BASE,'baseTree':TREE,'head':h,'signedPath':SRC,'old':stamp(orig),'candidate':stamp(changed),'sourceOnly':'exact stage7 canonical painted root-floor west nonwalk closure; east and horizontal prior behavior unchanged; physics unchanged'})
def mini(b,k):
 cmd=r"""import fs from 'node:fs';import {minify} from 'terser';
const raw=fs.readFileSync(process.argv[1],'utf8').replace(/\r\n/g,'\n');
const m=await minify("(()=>{\n'use strict';\n"+raw+"\n})();\nawait yieldIfNeeded();\n",{module:true,compress:false,mangle:false,format:{comments:false}});
process.stdout.write(m.code);"""
 return subprocess.check_output(['node','--input-type=module','-e',cmd,str(k)],cwd=b,timeout=40)
def body(r,seq,kind):
 fields=[]
 for p in seq:
  z=roles(p)
  if not z or z[1]!=kind:continue
  m=re.fullmatch(br'import\{yieldIfNeeded\}from"(\./[^"]+)";(.+)\n?',rd(r,p),re.S)
  assert m,m;fields.append((m[1],m[2].rstrip(b'\n')))
 assert len(set(a for a,_ in fields))==1
 return fields[0][0],b''.join(v for _,v in fields)
def normal(x,als):
 for a,b in als.items():x=x.replace(b.encode(),a.encode()).replace(Path(b).name.encode(),Path(a).name.encode())
 return x
def built(w):
 exact(w);a,b=w/'A',w/'B';am,bm=[js(rd(x,MF)) for x in (a,b)]
 assert blob(rd(a,MF))==OLD_MAN and blob(rd(a,SRC))==OLD and blob(rd(b,SRC))==NEW
 assert git(a,'status','--porcelain=v1','-z')==b''
 def inv(m):
  out={q['path']:{k:q[k]for k in ('bytes','sha256')}for q in m['files']}
  assert len(out)==len(m['files'])==810;return out
 ai,bi=inv(am),inv(bm)
 assert ai=={k:v for k,v in W['active'].items()if k not in SHELL|{MF}}
 assert all(fact(rd(a,k))==W['active'][k]for k in SHELL)
 assert stamp(rd(a,S14SRC))==stamp(rd(b,S14SRC))==W['source']
 for root,active in ((a,ai),(b,bi)):
  assert all(fact(rd(root,k))==v for k,v in active.items())
 common=ai.keys()&bi.keys()
 assert len(common)==806 and all(ai[k]==bi[k]for k in common)
 assert am['project']==bm['project'] and rd(a,am['project'])==rd(b,bm['project'])
 camp=js(rd(a,am['project']));assert len(camp['stages'])==len(camp['stageLibraries'])==50
 assert {k:v for k,v in ai.items()if k.startswith(('web/data/','web/graphics/'))}=={k:v for k,v in bi.items()if k.startswith(('web/data/','web/graphics/'))}
 m0,m1=mini(b,a/SRC),mini(b,b/SRC)
 assert m0!=m1 and b'a.x===-1200&&z.x===-1200&&a.y===5069.18&&z.y===3101.83' in m1
 x,s=body(a,am['common'],'common');y,t=body(b,bm['common'],'common')
 assert x==y and s.count(m0)==t.count(m1)==1 and s.replace(m0,m1)==t
 m14=mini(b,b/S14SRC)
 assert fact(m14)==W['normalSource'] and s.count(m14)==t.count(m14)==1
 assert m0 not in m14 and m1 not in m14
 assert body(a,am['gameOnly'],'game')==body(b,bm['gameOnly'],'game')
 assert len(am['common'])==len(bm['common'])
 change=[(x,y)for x,y in zip(am['common'],bm['common'])if x!=y]
 assert len(change)==1 and change[0][0]==OLD_RUNTIME and roles(change[0][1]).groups()==('common','16')
 assert rd(a,OLD_RUNTIME).count(m0)==rd(b,change[0][1]).count(m1)==1
 assert rd(a,OLD_RUNTIME).count(m14)==rd(b,change[0][1]).count(m14)==1
 assert rd(a,OLD_RUNTIME).replace(m0,m1)==rd(b,change[0][1])
 cor=dict(change)
 for k in ('gameEntry','workshopEntry','playtest'):
  x,y=am[k].split('?')[0],bm[k].split('?')[0]
  assert x!=y and x not in cor;cor[x]=y
 assert set(ai)-set(bi)==set(cor) and set(bi)-set(ai)==set(cor.values())
 assert all(normal(rd(b,y),cor)==rd(a,x)for x,y in cor.items()if x!=OLD_RUNTIME)
 assert all(normal(rd(b,k),cor)==rd(a,k)for k in SHELL)
 ignore={'files','previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
 assert set(am)-ignore==set(bm)-ignore
 assert all(js(normal(json.dumps(bm[k],sort_keys=True).encode(),cor))==am[k]for k in set(am)-ignore)
 assert git(b,'diff','--no-renames','--name-only','--','shared','game/src','game/engine','workshop/src','tests','tools').decode().splitlines()==[SRC]
 save(w/'out/GRAPH.json',{'base':BASE,'activeA':{**ai,**{k:fact(rd(a,k))for k in SHELL|{MF}}},'activeB':{**bi,**{k:fact(rd(b,k))for k in SHELL|{MF}}},
    'aliases':cor,'normalSourceA':fact(m0),'normalSourceB':fact(m1),'identical50MapsPacketsGraphics':True,'onlySingleCompiledModuleCodeChanged':True,'stage14SourceAndCompiledModuleRemainExact':{'source':W['source'],'normalWrapper':fact(m14)}})
if __name__=='__main__':{'pre':pre,'built':built}[sys.argv[1]](Path(sys.argv[2]).resolve())
