"""Normal build-one in isolated worktree; launch blocked until exact QA authorization."""
import base64,gzip,hashlib,json,os,re,subprocess,sys
from pathlib import Path
D=Path(__file__).resolve().parent
P=json.loads((D/'PINS.json').read_bytes())
A=P['stock'];IDX=P['compilerStageIndex'];M='web/manifest.json';SRC=next(v for v in A['source']if v['file'].endswith('/near-import.json'))
def fact(b):return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
def blob(b):return hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()
def rd(r,p):
 q=r/p;assert q.is_file() and not q.is_symlink() and q.resolve().is_relative_to(r.resolve()),p
 return q.read_bytes()
def git(r,*a):return subprocess.check_output(['git','-C',r,*a],text=True,timeout=90).strip()
def save(w,k,v):(w/'out'/k).write_text(json.dumps(v,indent=2)+'\n')
def leaves(v):return v['root']['children'][0]['children']
def edit_range(raw):
 text=raw.decode('utf-8'); dec=json.JSONDecoder();n=0;match=None
 def gap(i):
  while i<len(text) and text[i] in ' \t\r\n':i+=1
  return i
 i=gap(0); assert text[i]=='[';i=gap(i+1)
 while text[i]!=']':
  q,k=dec.raw_decode(text,i);n+=1
  if str(q['id'])=='42':
   assert q['id']==42 and not match
   match=(i,k,q)
  i=gap(k)
  assert text[i] in ',]'
  if text[i]==',':i=gap(i+1)
 assert match and n>=10 and gap(i+1)==len(text)
 left,right,o=match;part=text[left:right]
 before=json.loads(part); v=before['vector']
 ed=(D/'RECIPE.b64').read_bytes();assert fact(ed)['sha256']==P['recipeSHA256']
 recipe=json.loads(gzip.decompress(base64.b64decode(ed.strip(),validate=True)))
 assert [e['i']for e in recipe]==[2,3,4,5,6,7,8,9,10,12,13,14,15]
 for e in recipe:
  k=e['i'];a=leaves(v)[k]['d'];b=e['new']
  assert fact(a.encode())['sha256']==e['oldSHA256'] and '\n' not in b and b and a!=b
  # Input D strings contain only SVG ASCII grammar; JSON.stringify of D is lexical.
  u=json.dumps(a);r=json.dumps(b)
  assert part.count(u)==1,(k,'canonical path-to-leaf anchor')
  part=part.replace(u,r,1)
  leaves(v)[k]['d']=b
 assert json.loads(part)==before
 newer=(text[:left]+part+text[right:]).encode()
 assert len(newer)<len(raw)
 return newer
def pre(w):
 r=Path(os.environ['GITHUB_WORKSPACE']).resolve();h=os.environ['GITHUB_SHA']
 assert P['enabled'] is True and A['pages']['head']==A['head'] and A['pages']['conclusion']=='success'
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==('sys8994/honro','push',P['qaRef'])
 scope={'.github/workflows/stage42-interior-grain-onebuild.yml',*(str(D.relative_to(r)/n)for n in ('PINS.json','RECIPE.b64','observer.json','guard.py','capture.py'))}
 assert git(r,'rev-parse','HEAD')==h and git(r,'show','-s','--format=%P',h)==A['head'] and git(r,'rev-parse',A['head']+'^{tree}')==A['tree']
 assert set(git(r,'diff','--no-renames','--name-status',A['head'],h).splitlines())=={'A\t'+p for p in scope} and not git(r,'status','--porcelain=v1')
 assert all(len(rd(r,x['file']))==x['bytes'] and blob(rd(r,x['file']))==x['git']for x in A['source'])
 assert blob(rd(r,M))==A['manifest']['git'] and len(rd(r,M))==A['manifest']['bytes']
 assert fact(rd(r,A['packet']['42']))==P['packetA']
 # Do not patch/disarm any legacy optimization ledger to make a candidate build.
 # A target direct optimization entry would require a separate reviewed rebase.
 ledger=json.loads(rd(r,'shared/data/terrain-path-optimization.json'))
 assert not any(x['id']==P['asset'] for x in ledger),'Existing optimization ledger owns act5:near:42; re-evaluate before compiling'
 target=w/'B';git(r,'worktree','add','--detach',str(target),A['head'])
 n=rd(r,SRC['file']);b=edit_range(n);(target/SRC['file']).write_bytes(b)
 assert git(target,'diff','--name-status','--no-renames')=='M\t'+SRC['file']
 save(w,'SOURCE.json',{'head':h,'base':A,'file':SRC['file'],'before':{**fact(n),'git':blob(n)},'after':{**fact(b),'git':blob(b)},'dataBeforeCompile':[P['packetA'],P['packetB']]})
def observe(w):
 r=Path(os.environ['GITHUB_WORKSPACE']).resolve(); b=w/'B'
 mr,mb=(json.loads(rd(t,M))for t in (r,b))
 pr,pb=(json.loads(rd(t,m['project']))for t,m in ((r,mr),(b,mb)))
 pa=A['packet']['42']; pn=pb['stageLibraries'][IDX]; mp=A['map']['42']
 assert pr['stageLibraries'][IDX]==pa and pn.startswith('web/data/chapter-42-assets.') and pn!=pa
 assert pr['stages']==pb['stages'] and len(pr['stages'])==50 and pr['stages'][IDX]==mp
 z=pb.copy();z['stageLibraries']=pb['stageLibraries'].copy();z['stageLibraries'][IDX]=pa
 assert pr==z and len(pr['stageLibraries'])==50 and fact(rd(r,pa))==P['packetA'] and fact(rd(b,pn))==P['packetB']
 mpr,mnp=(json.loads(rd(t,x))[0]for t,x in ((r,pa),(b,pn))); assert mpr['id']==mnp['id']==P['asset']
 assert all(mpr[k]==mnp[k]for k in mpr if k!='vector') and mpr['vector']['clips']==mnp['vector']['clips'] and mpr['vector']['root']['children'][1:]==mnp['vector']['root']['children'][1:]
 ir,ib=[{f['path']:{k:f[k]for k in ('bytes','sha256')}for f in m['files']} for m in (mr,mb)]
 new=sorted(ib.keys()-ir.keys());old=sorted(ir.keys()-ib.keys())
 assert len(ir)==len(ib)==P['expectedActive']
 roles=(
  r'web/data/chapter-42-assets\.[0-9a-f]{16}\.json',
  r'web/data/campaign\.[0-9a-f]{16}\.json',
  r'web/runtime/campaign\.[0-9a-f]{16}\.js',
  r'web/entries/game\.[0-9a-f]{16}\.js',
  r'web/entries/game\.[0-9a-f]{16}\.html',
  r'web/entries/workshop\.[0-9a-f]{16}\.js')
 assert len(new)==len(old)==len(roles) and all(sum(bool(re.fullmatch(p,k)) for k in v)==1 for p in roles for v in (new,old))
 assert all(ir[k]==ib[k] and fact(rd(r,k))==fact(rd(b,k))==ir[k] for k in ir.keys()&ib.keys())
 for n in (21,33):
  assert pr['stageLibraries'][n-1]==A['packet'][str(n)] and pr['stages'][n-1]==A['map'][str(n)]
 routes={}
 for label,t,m,i,px in [('A',r,mr,ir,pa),('B',b,mb,ib,pn)]:
  entry=m['gameEntry'].split('?')[0]
  rr=re.findall(rb'\.\./runtime/(campaign\.[a-f0-9]{16}\.js)',rd(t,entry));assert len(rr)==1
  wrap='web/runtime/'+rr[0].decode();assert Path(m['project']).name.encode() in rd(t,wrap)
  routes[label]={k:fact(rd(t,k))for k in ('HONRO.html',entry,wrap,m['project'],mp,px)}
  assert all(routes[label][k]==i[k]for k in routes[label] if k!='HONRO.html')
 save(w,'GRAPH.json',{'routes':routes,'new':new,'old':old,'stagesMapsUnchanged':True,'other49AssetsAndStage21Stage33Exact':True,'active':len(ib),'newPacket':pn})
if __name__=='__main__':{'pre':pre,'observe':observe}[sys.argv[1]](Path(sys.argv[2]))
