"""No-deploy verification of three signed inputs and all compiled active route bytes."""
from pathlib import Path
import json,hashlib,subprocess as S,os,sys,io,tarfile
D=Path(__file__).resolve().parent;P=json.loads((D/'PINS.json').read_bytes());M='web/manifest.json'
BASE=P['head'];PROD={'act5.js','story.js','main.js'};shells={'HONRO.html','HONRO_WORKSHOP.html','index.html'}
def need(b,msg):
 if not b:raise RuntimeError(msg)
def g(*q):return S.check_output(['git',*q],text=True,timeout=40).strip()
def sha(b):return hashlib.sha256(b).hexdigest()
def pin(b):return dict(bytes=len(b),sha256=sha(b))
def git(b):return hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()
def out(p,obj):p.write_text(json.dumps(obj,indent=2)+'\n')
def load(p):return json.loads(p.read_bytes())
def fact(p):return pin(p.read_bytes())
def fast(root,path):return root.joinpath(path).read_bytes()
def pre(w):
 need(P['enabled'] is True,'DISABLED: exact refreshed source not authorized')
 need(set(P['source'])==PROD and all(v for r in P['source'].values() for v in r.values()),'only exact three source changes authorized')
 need((os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_REF'],os.environ['GITHUB_EVENT_NAME'])==(P['repo'],P['qaRef'],'push'),'unexpected QA scope')
 head=os.environ['GITHUB_SHA'];need(g('rev-list','--parents','-1',head).split()==[head,BASE] and g('rev-parse',BASE+'^{tree}')==P['tree'],'nonexact source parent')
 allow={'.github/workflows/stage46-snapshot-ab.yml',*(f'tools/stage46-snapshot-ab/{k}'for k in ('PINS.json','capture.py','observe.js','observer.json','graph.mjs','guard.py','signed/act5.js','signed/story.js','signed/main.js'))}
 need(set(g('diff','--name-status','--no-renames',BASE,head).splitlines())=={'A\t'+k for k in allow},'one exact add-only QA scope')
 b0=S.run(['git','archive',BASE],stdout=(w/'stock.tar').open('wb'),check=True,timeout=120)
 A=w/'A';A.mkdir()
 with tarfile.open(w/'stock.tar')as t:t.extractall(A,filter='data')
 (w/'stock.tar').unlink()
 S.run(['git','worktree','add','--detach',str(w/'B'),BASE],check=True,timeout=120)
 need(S.check_output(['git','-C',str(w/'B'),'rev-parse','HEAD'],text=True,timeout=30).strip()==BASE and not S.check_output(['git','-C',str(w/'B'),'status','--porcelain','-z'],timeout=40),'B official build lacks exact clean detached commit')
 for arm in ('A','B'):
  r=w/arm
  need(git(fast(r,'HONRO.html'))==P['nativeShell']['git'] and fact(r/'HONRO.html')=={k:P['nativeShell'][k] for k in ('bytes','sha256')},'exact retained native shell needed')
  need(git(fast(r,M))==P['manifest']['git'] and fact(r/M)=={k:P['manifest'][k]for k in ('bytes','sha256')},'exact retained A/B starting manifest needed')
 for fn,h in P['extraUnchanged'].items():need(all(git(fast(w/a,'shared/runtime/'+fn))==h for a in ('A','B')),'protected original wrapper '+fn)
 untouched='shared/runtime/profile-store.js';need(all(git(fast(w/a,untouched))==P['unchangedProfileStore'] for a in ('A','B')),'profile-store must be same stock')
 for fn,v in P['source'].items():
  rel='shared/runtime/'+fn;dest=w/'B'/rel;new=(D/'signed'/fn).read_bytes()
  need(git(fast(w/'A',rel))==git(dest.read_bytes())==v['stock'] and git(new)==v['candidate'] and sha(new)==v['sha256'] and len(new)==v['bytes'],'unapproved source bytes '+fn)
  dest.write_bytes(new)
 changed=set(S.check_output(['git','-C',str(w/'B'),'diff','--name-only','-z',BASE],timeout=40).decode().rstrip('\0').split('\0'))
 need(changed=={'shared/runtime/'+f for f in PROD},'extra scratch source changes')
 out(w/'out'/'BASE-AND-SOURCE.json',{'head':head,'base':BASE,'source':P['source'],'unchangedProfileStore':P['unchangedProfileStore'],'ship':False})
def read_graph(w):
 A,B=w/'A',w/'B';aa,bb=load(A/M),load(B/M)
 idx=lambda v:{k['path']:{x:k[x] for x in ('bytes','sha256')}for k in v['files']}
 ai,bi=idx(aa),idx(bb)
 need(len(ai)==len(aa['files']) and len(bi)==len(bb['files']),'duplicate active address')
 need(all(ai.get(k)==v==fact(A/k) for k,v in P['core'].items()),'stock active dependency mismatch')
 common=set(ai)&set(bi)
 need(all(ai[k]==bi[k] and fact(A/k)==ai[k]==fact(B/k)for k in common),'mutated immutable active file')
 aonly=set(ai)-set(bi);bonly=set(bi)-set(ai)
 allowed=lambda k:k.startswith(('web/runtime/ordered-game-','web/runtime/ordered-common-','web/entries/game.','web/entries/workshop.')) and k.endswith(('.js','.html'))
 need(all(allowed(k)for k in aonly|bonly),'new or removed non-runtime address')
 need(all(fact(A/k)==ai[k]for k in aonly) and all(fact(B/k)==bi[k]for k in bonly),'changed runtime address bytes not equal advertised')
 need(aa['project']==bb['project'] and ai[aa['project']]==bi[bb['project']],'changed exact campaign descriptor')
 ca=load(A/aa['project']);n=len(ca['stages']);need(n==len(ca['stageLibraries'])==50,'incomplete stage coverage')
 for k in [*ca['stages'],*ca['stageLibraries']]:need(k in common,'actual campaign slot changed '+k)
 for k,v in P['stages'].items():
  need([ca['stages'][int(k)-1],ca['stageLibraries'][int(k)-1]]==[v['map'],v['descriptorOrPacket']],'wrong intended stage')
  need(all(ai[t]==b==bi[t]for t,b in v['files'].items()),'changed stage map/art routes')
  if v['parts']:
   d=load(A/v['descriptorOrPacket'])
   need(d['$honroJsonParts']==1 and [z['path'] for z in d['parts']]==v['parts'],'compiled descriptor part order drift')
   payload=hashlib.sha256();total=0
   for z in d['parts']:
    b=fast(A,z['path']); dims={k:z[k] for k in ('bytes','sha256')}
    need(pin(b)==dims==v['files'][z['path']],'split part receipt mismatch')
    payload.update(b);total+=len(b)
   need(total==d['bytes'] and payload.hexdigest()==d['sha256'],'split payload aggregate mismatch')
 def archive_footprint():
  return sum(x['bytes'] for x in ai.values())
 # Historical records remain genuinely public in A. Normal B build is disposable;
 # it need not retain retired, unreferenced previous-only files to run actual native QA.
 need(B.joinpath('shared/runtime/profile-store.js').read_bytes()==A.joinpath('shared/runtime/profile-store.js').read_bytes(),'normal B source was rewritten')
 result={'aonly':sorted(aonly),'bonly':sorted(bonly),'a':{'active':ai,'manifest':aa,'shell':fact(A/'HONRO.html')},'b':{'active':bi,'manifest':bb,'shell':fact(B/'HONRO.html')},'identicalCampaignSlots':50,'previousOnlyBaselineStillExact':True,'activeBytesA':archive_footprint(),'deploy':False}
 out(w/'out'/'GRAPH-PRE.json',result)
 if (w/'out'/'ORDERED.json').exists():
  x=load(w/'out'/'ORDERED.json');need(x['status']=='PASS_ONLY_THREE_SIGNED_SOURCE_MODULES_AND_POINTERS','ordered scope not proven')
  result['ordered']=x;out(w/'out'/'GRAPH.json',result)
if __name__=='__main__':
 mode,w=sys.argv[1],Path(sys.argv[2]); {'pre':pre,'graph':read_graph}[mode](w)
