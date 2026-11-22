"""Stage33 post-Stage7 batch lane utilities only; parent owns mutation/custody."""
import hashlib,json,re,subprocess
from pathlib import Path
D=Path(__file__).resolve().parent;P=json.loads((D/'PINS.json').read_text())
M='web/manifest.json'
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return dict(bytes=len(b),sha256=sha(b))
def pin(b):return dict(fact(b),git=hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest())
def need(v,m):
 if not v:raise RuntimeError(m)
def obj(p):return json.loads(p.read_bytes())
def rd(p,n):return (p/n).read_bytes()
def sv(p,n,v):(p/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def inv(rows):return {x['path']:{k:x[k]for k in ('bytes','sha256')}for x in rows}
def git(r,*args):return subprocess.check_output(['git','-C',str(r),*args],timeout=90).decode().strip()
def slot(i,n):
 rows=[k for k in i if re.fullmatch(fr'web/runtime/{re.escape(n)}\.[a-f0-9]{{16}}\.js',k)]
 need(len(rows)==1,'expected unique compiled slot '+n);return rows[0]
def signed(a,logs,head,shell,pins,known):
 need(pin(rd(D,shell))==known,'known historic shell bytes drifted')
 r=[x for x in logs['publishedGenerations']if x['sourceSha']==head]
 need(len(r)==1,'historic manifest graph no longer retained '+head)
 qi=inv(r[0]['files']);need(all(qi[k]==v==fact(rd(a,k))for k,v in pins.items()),'historic immutable shell graph unavailable '+head)
def setup(w,out,base):
 a,b=w/'A',w/'B';s7=P['stage7'];m0,m1=(obj(r/M)for r in (a,b));ia,ib=(inv(m['files'])for m in (m0,m1))
 need(all(git(r,'rev-parse','HEAD')==base['head'] and git(r,'rev-parse','HEAD^{tree}')==base['tree'] and not git(r,'branch','--show-current')for r in (a,b)),'lane requires detached exact authority both worktrees')
 need(pin(rd(a,M))==base['manifest'] and pin(rd(a,'shared/build.mjs'))==P['sourceBefore'] and pin(rd(D,'observer.json'))==P['observer'],'exact new published A, stock build, or observer drift')
 need(all(pin(rd(b,k))==v for k,v in P['sourceUnion'].items()),'complete combined author source receipt drift')
 need(all(pin(rd(a,k))==v==pin(rd(b,k))for k,v in s7['authorSources'].items()),'Stage7 runtime/author inputs changed')
 need(len(ia)==len(ib)==811,'normal 811 active layout changed')
 prj0,prj1=(obj(r/m['project'])for r,m in ((a,m0),(b,m1)))
 for prj in (prj0,prj1):
  need(prj['stages'][6]==s7['currentMap'] and prj['stageLibraries'][6]==s7['currentAsset'],'approved active Stage7 changed')
  need(prj['stages'][32]==P['map'] and prj['stageLibraries'][32]==P['newPacket'],'Stage33 current canonical authority changed')
 # Trusted historical shells use only retained A data; no generated B bytes recycled from independent proofs.
 signed(a,m0,P['old'],'old-c60-HONRO.html',P['oldRoutes'],P['oldShell'])
 signed(a,m0,P['old2c4']['head'],'old-2c4-HONRO.html',P['old2c4Routes'],P['old2c4']['shell'])
 signed(a,m0,s7['previousHead'],'old-0b9-HONRO.html',s7['oldRoutes'],s7['oldShell'])
 before4,after4=(slot(i,'ordered-common-4')for i in (ia,ib))
 before12,after12=(slot(i,'ordered-common-12')for i in (ia,ib))
 native11=slot(ia,'ordered-common-11');loader=slot(ia,'load-data')
 need(native11==s7['currentRenderRoles'][0]==slot(ib,'ordered-common-11') and before12==s7['currentRenderRoles'][1] and loader==slot(ib,'load-data'),'historic exact Stage7 partition or stable loader not used')
 need(ia[native11]==ib[native11]==fact(rd(a,native11))==fact(rd(b,native11)),'Stage7 renderer wire changed')
 owners=json.loads(subprocess.check_output(['node',str(D/'compiled.mjs'),str(a),str(b),before4,after4,before12,after12,loader],timeout=90))
 sv(out,'COMPILED-PROOF.json',owners)
 # For Stage32 the parent lane checks R10 packet separately; here only its map, archive and original Workshop props.
 peers={k:({i:v for i,v in rows.items() if '/chapter-32-assets' not in i} if k=='32'else rows)for k,rows in P['exactPeers'].items()}
 keep={k:v for rows in peers.values() for k,v in rows.items()}
 archive=P['qualifiedJoint']['legacyStage32Archive'];keep.update({k:s7['currentRoutes'][k]for k in (s7['currentMap'],s7['currentAsset'],native11)})
 keep.update({k:P['qualifiedJoint']['protectedActive'][k]for k in (archive,loader)})
 need(all(ia[k]==ib[k]==v==fact(rd(a,k))==fact(rd(b,k))for k,v in keep.items()),'preserved Stage7 chapter, Stage33, Stage42/40/46, lazy32 or peer drift')
 def pick(i,keys,r):
  result={k:i[k]for k in keys};need(all(v==fact(rd(r,k))for k,v in result.items()),'actual key body vs normal fixed graph')
  return result
 workshop={};game7={}
 for arm,m,index,r in [('A',m0,ia,a),('B',m1,ib,b)]:
  work=m['workshopEntry'].split('?')[0];entry=m['gameEntry'].split('?')[0]
  packet=((prj0 if arm=='A'else prj1)['stageLibraries'][31])
  parts=[x['path']for x in obj(r/packet)['parts']]
  workKeys=[work,m['project'],archive,packet,*parts,*peers['32'],s7['currentMap'],s7['currentAsset']]
  workshop[arm]={'shell':fact(rd(r,'HONRO_WORKSHOP.html')),'archive':archive,'routes':pick(index,workKeys,r),'entry':work}
  native12=before12 if arm=='A'else after12
  game7[arm]={'shell':fact(rd(r,'HONRO.html')),'routes':pick(index,[entry,m['project'],s7['currentMap'],s7['currentAsset'],native11,native12],r)}
 sv(out,'SOURCE.json',{'parent':base['head'],'oldRoutes':P['oldRoutes'],'2c4Routes':P['old2c4Routes'],'2c4Shell':P['old2c4']['shell'],'sameArtifactRequired':True})
 sv(out,'GRAPH.json',{'base':base['head'],'peers':peers,'protect':keep,'protectedJoint':keep,'protectedProfile':after4,'protectedProfileBody':ib[after4],'oldCommon':before12,'newCommon':after12,'sha':ib[after12],'workshop':workshop,'game7':game7})
