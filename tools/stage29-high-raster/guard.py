"""Immutable published Stage29 baseline, exact one-source normal compile. QA only."""
import hashlib,json,os,re,subprocess,sys,zipfile
from pathlib import Path
H=Path(__file__).resolve().parent
BASE='31537bcd1b070077a3287113e2085de40d3dcf2c';TREE='82c0652cf461c49cf757e08954545c27077ec697'
REF='refs/heads/qa/stage29-west-normal-small-31537b';REPO='sys8994/honro'
SRC='shared/runtime/act3-handoff-art.js'
OLD='511447643bdaae42bb17f92976c7d1b5808ce93e';NEW='17bd014206f3b2e989d87c64935f7b56db2ce6f8'
OLD_MAN='4228685f4de4494d2546682a147553c01e0c5bf5'
MF='web/manifest.json';SHELL={'HONRO.html','index.html','HONRO_WORKSHOP.html'}
MAN0={'bytes':7310425,'sha256':'86381ada9943a26afad930ea140c9d2ba22bbfb77ec68781240975af1432daab'}
P23={'web/data/chapter-23.5bf8a1a8779eb0fd.json','web/data/chapter-23-assets.ce93149a24fce0d9.json'}
P29={'web/data/chapter-29.9c23e7ce4d1312d3.json','web/data/chapter-29-assets.03bec5fbcabe5e35.json'}
P26={'web/data/chapter-26.cc8e0e37503433b3.json','web/data/chapter-26-assets.d511268fb4869e94.json'}
ROOT=Path(os.environ.get('GITHUB_WORKSPACE','.')).resolve()
QA={'.github/workflows/stage29-west-normal.yml',*(f'tools/stage29-west-normal/{p}'for p in ('guard.py','capture.py','candidate.js','park.js','POSES.json'))}
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
 assert not(os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN'))
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_REF'],os.environ['GITHUB_EVENT_NAME'])==(REPO,REF,'push')
 h=os.environ['GITHUB_SHA'];assert w.is_relative_to(Path(os.environ['RUNNER_TEMP']).resolve())
 assert git(ROOT,'rev-list','--parents','-n1',h).decode().split()==[h,BASE]
 assert git(ROOT,'rev-parse',BASE+'^{tree}').decode().strip()==TREE and not git(ROOT,'status','--porcelain=v1','-z')
 assert set(git(ROOT,'diff','--no-renames','--name-status',BASE,h).decode().splitlines())=={'A\t'+k for k in QA}
 assert all(git(ROOT,'ls-tree',h,'--',p).decode().split()[:2]==['100644','blob'] for p in QA)
 return h
def reverse_stage29(changed):
 begin=changed.index(b'// Stage 29 substrate and first traced face');end=changed.index(b'function strips(asset){',begin)
 original=b" if(!l.asset?.id?.startsWith('act3-handoff:')||!l.asset.params?.contactMapping)return draw.call(this,c,l);\n"
 candidate=b""" if(!l.asset?.id?.startsWith('act3-handoff:')||!l.asset.params?.contactMapping){
  const out=draw.call(this,c,l);
  if(this.battle?.honroStage===29&&l.id==='r29-actual-stone-faces'&&pickWest29(this.battle,l,false))paintWest29(c,false);
  return out;
 }
"""
 tail=b" if(b.honroStage===29&&asset.id==='act3-handoff:29:west-bank'&&pickWest29(b,l,true))paintWest29(raw,true);\n"
 insertion=changed[begin:end]
 assert insertion.count(b'b.honroStage!==29')==1
 remain=changed[:begin]+changed[end:]
 assert remain.count(candidate)==remain.count(tail)==1
 return remain.replace(candidate,original,1).replace(tail,b'',1)
def pre(w):
 h=exact(w);a,b=w/'A',w/'B'
 for k in (a,b):
  git(ROOT,'worktree','add','--detach',str(k),BASE)
  assert not git(k,'status','--porcelain=v1','-z') and git(k,'rev-parse','HEAD^{tree}').decode().strip()==TREE
  assert blob(rd(k,MF))==OLD_MAN and blob(rd(k,SRC))==OLD
 orig=rd(a,SRC);changed=rd(H,'candidate.js')
 assert blob(changed)==NEW and sha(changed)=='2d58dab85bdf17697868b5fe7eac020309eeb72dfdce39b319f10350196d1242'
 assert fact(rd(a,MF))==MAN0
 assert reverse_stage29(changed)==orig
 (b/SRC).write_bytes(changed)
 assert git(b,'diff','--name-status').decode().splitlines()==['M\t'+SRC]
 save(w/'out/SOURCE.json',{'base':BASE,'baseTree':TREE,'head':h,'signedPath':SRC,'old':stamp(orig),'candidate':stamp(changed),'sourceOnly':'Exact signed Stage29 west-only callbacks; old runtime outside two insertions, unchanged prior Stage23/26 art source and stage asset packets; no physics changes'})
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
  assert len(out)==len(m['files']);return out
 ai,bi=inv(am),inv(bm)
 for root,active in ((a,ai),(b,bi)):
  assert all(fact(rd(root,k))==v for k,v in active.items())
 common=ai.keys()&bi.keys()
 assert len(ai)==len(bi) and all(ai[k]==bi[k]for k in common)
 assert P23|P26|P29<=common
 assert am['project']==bm['project'] and rd(a,am['project'])==rd(b,bm['project'])
 camp=js(rd(a,am['project']));assert len(camp['stages'])==len(camp['stageLibraries'])==50
 assert {k:v for k,v in ai.items()if k.startswith(('web/data/','web/graphics/'))}=={k:v for k,v in bi.items()if k.startswith(('web/data/','web/graphics/'))}
 m0,m1=mini(b,a/SRC),mini(b,b/SRC)
 assert m0!=m1 and b'pickWest29' in m1
 x,s=body(a,am['common'],'common');y,t=body(b,bm['common'],'common')
 assert x==y and s.count(m0)==t.count(m1)==1 and s.replace(m0,m1)==t
 assert body(a,am['gameOnly'],'game')==body(b,bm['gameOnly'],'game')
 assert len(am['common'])==len(bm['common'])
 change=[(x,y)for x,y in zip(am['common'],bm['common'])if x!=y]
 assert len(change)==1 and roles(change[0][0]) and roles(change[0][1]) and roles(change[0][0]).groups()==roles(change[0][1]).groups()
 OLD_RUNTIME=change[0][0]
 assert rd(a,OLD_RUNTIME).count(m0)==rd(b,change[0][1]).count(m1)==1
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
    'aliases':cor,'oneChangedOrderedRuntime':change[0][1],'runtime':dict(zip('AB',change[0])),'currentProject':{'A':am['project'],'B':bm['project']},'gameEntry':{k:m['gameEntry'].split('?')[0] for k,m in [('A',am),('B',bm)]},'stage29Required':sorted(P29),'stage23IdenticalBytes':sorted(P23),'stage26IdenticalBytes':sorted(P26),'activeExactShared':len(common),'normalSourceA':fact(m0),'normalSourceB':fact(m1),'identical50MapsPacketsGraphics':True,'onlySingleCompiledModuleCodeChanged':True})
def custody(proof):
 w={'1440x900','390x844'};vis=proof['visits']
 assert len(vis)==4 and not proof['failures'] and all(v['status']=='CAPTURED' and not v['errors'] for v in vis)
 assert {(v['arm'],v['device'])for v in vis}=={(a,k)for a in 'AB'for k in w}
 dirs={'west','west-near'}
 assert all(set(v['frames'])==dirs for v in vis)
 for k in w:
  a,b=(next(v for v in vis if v['device']==k and v['arm']==j)for j in 'AB')
  for n in dirs:
   A,B=(v['frames'][n]for v in (a,b))
   assert A['pose']==B['pose'] and A['owner']==B['owner'] and A['nativeMatchingSectionDraws']==0 and B['nativeMatchingSectionDraws']>0
 assert set(proof['comparisons'])=={k+'-'+n for k in w for n in dirs}
 slots=[v[k]for v in proof['comparisons'].values()for k in ('raw','dom')]
 assert all(c['alphaChanged']==c['protectedUpperChanged']==0 for c in slots)
 mode='PASS_PENDING_ART' if all(c['strict']for c in slots) else 'HOLD_QA_ONLY'
 assert proof['status']==('PASS_ACTUAL_STAGE29_WEST_SCOPE_PENDING_VISUAL_REVIEW' if mode.startswith('PASS') else 'HOLD_RGB_PIXEL_GATE_COMPLETE_NO_RELEASE')
 return mode
def archive(w):
 exact(w);out=w/'out';r=w/'B'
 proof=js(rd(out,'BROWSER.json'));graph=js(rd(out,'GRAPH.json'))
 mode=custody(proof)
 assert graph['base']==BASE and graph['identical50MapsPacketsGraphics'] is True and graph['onlySingleCompiledModuleCodeChanged'] is True
 assert blob(rd(r,SRC))==NEW
 for v in proof['visits']:
  for frame in v['frames'].values():
   for k in ('raw','dom'):assert fact(rd(out,frame[k]['path']))==frame[k]['fact']
 aliases=set(graph['aliases'].values());assert len(aliases)==4 and graph['oneChangedOrderedRuntime'] in aliases
 paths=sorted(aliases|SHELL|{MF});assert len(paths)==8
 pack=out/('B-generated-'+mode.lower().replace('_','-'));pack.mkdir()
 p=pack/('B-'+mode.replace('_','-')+'-EXACT-NORMAL-GENERATED-NO-DEPLOY.zip');manifest={}
 with zipfile.ZipFile(p,'x',compression=zipfile.ZIP_DEFLATED)as z:
  for k in paths:
   data=rd(r,k);assert fact(data)==graph['activeB'][k]
   manifest[k]=stamp(data);z.writestr(k,data)
 with zipfile.ZipFile(p) as z:assert z.testzip() is None and z.namelist()==paths
 save(pack/'SEAL.json',{'base':BASE,'custody':mode,'technicalPixelGatePassed':mode=='PASS_PENDING_ART','canDeploy':False,'scope':'review only; retain published predecessors separately; no rebuild needed and no deployment authorized','authorPath':SRC,'authorGit':NEW,'files':manifest,'zip':fact(p.read_bytes()),'actual':fact(rd(out,'BROWSER.json')),'graph':fact(rd(out,'GRAPH.json'))})
if __name__=='__main__':{'pre':pre,'built':built,'archive':archive}[sys.argv[1]](Path(sys.argv[2]).resolve())
