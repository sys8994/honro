"""Pinned normal verification, no commit, remote writes, heading mutation or deployment."""
import hashlib,json,os,re,sys,subprocess,stat
from pathlib import Path
Q=Path(__file__).resolve().parent;P=json.loads((Q/'PINS.json').read_bytes()); W=Path(sys.argv[2]);OUT=W/'out'
MF='web/manifest.json'; SHELL={'HONRO.html','HONRO_WORKSHOP.html','index.html'}
BASE=P['base']; TREE=P['tree']; REL=P['sourcePath']
QA={'.github/workflows/stage44-root-floor-a0.yml',*(f'tools/stage44-root-floor-a0/{k}' for k in ('PINS.json','entry.json','guard.py','views.py','coverage.py','A0-edge.js','A0-readability.js'))}
def sha(b):return hashlib.sha256(b).hexdigest()
def facts(b):return {'bytes':len(b),'sha256':sha(b)}
def blob(b):return hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()
def stamp(b):return {**facts(b),'git':blob(b)}
def git(root,*a):return subprocess.check_output(['git','-C',str(root),*a])
def read(root,path):
 assert not path.startswith('/') and '?' not in path and '#' not in path and '..' not in Path(path).parts
 target=root/path; assert not target.is_symlink()
 return target.read_bytes()
def emit(name,data):(OUT/name).write_text(json.dumps(data,indent=2)+'\n')
def inv(m):
 a={x['path']:{k:x[k]for k in ('bytes','sha256')}for x in m['files']}
 assert len(a)==len(m['files'])==810
 return a
def a0stock():
 b=(Q/'A0-edge.js').read_bytes();r=(Q/'A0-readability.js').read_bytes()
 assert stamp(b)==P['sourceB'] and stamp(r)==P['readabilityB']
 assert b.count(b'localEdges.set(group,{filtered:edge,segment:target[0]})')==1
 assert b'localEdges.set(group,{filtered,segment:target[0]})' not in b
 return b,r
def forward_bridge(stock):
 assert stamp(stock)==P['bridgeA']
 decl=b'S.terrainReadability=function(c,b,view){'
 call=b'readability.call(this,c,b,view)'
 assert stock.count(decl)==1 and stock.count(call)==2
 changed=stock.replace(decl,b'S.terrainReadability=function(c,b,view,localEdges){').replace(call,b'readability.call(this,c,b,view,localEdges)')
 assert stamp(changed)==P['bridgeA0'] and changed.count(b'localEdges')==3
 return changed
def pre():
 assert P['enable'] is True
 root=Path(os.environ['GITHUB_WORKSPACE']);head=os.environ['GITHUB_SHA']
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==(P['repo'],'push',P['branch'])
 assert git(root,'rev-list','--parents','-n1','HEAD').decode().split()==[head,BASE]
 assert git(root,'rev-list','--parents','-n1',BASE).decode().split()==[BASE,P['baseParent']]
 for ref,tree in ((BASE,TREE),(P['baseParent'],P['baseParentTree'])):assert git(root,'rev-parse',ref+'^{tree}').decode().strip()==tree
 assert not git(root,'status','--porcelain=v1','-z')
 assert set(git(root,'diff','--name-status','--no-renames',BASE,head).decode().splitlines())=={f'A\t{k}'for k in QA}
 stock=git(root,'show',BASE+':'+MF);assert stamp(stock)==P['stockManifest']
 assert blob(git(root,'show',BASE+':shared/runtime/terrain-readability.js'))==P['stockReadabilityGit']
 a=git(root,'show',BASE+':'+REL);assert stamp(a)==P['sourceA'];b,r=a0stock();d=forward_bridge(git(root,'show',BASE+':'+P['bridgePath']))
 assert stamp(git(root,'show',BASE+':'+P['readabilityPath']))==P['readabilityA']
 for name in ('A','B'):
  t=W/name;git(root,'worktree','add','--detach',str(t),BASE)
  assert git(t,'rev-parse','HEAD').decode().strip()==BASE and not git(t,'status','--porcelain=v1','-z')
  assert stamp(read(t,REL))==P['sourceA'] and stamp(read(t,P['readabilityPath']))==P['readabilityA']
 (W/'B'/REL).write_bytes(b);(W/'B'/P['readabilityPath']).write_bytes(r);(W/'B'/P['bridgePath']).write_bytes(d)
 assert set(git(W/'B','diff','--name-status').decode().splitlines())=={'M\t'+REL,'M\t'+P['readabilityPath'],'M\t'+P['bridgePath']}
 emit('SOURCE.json',{'stock':BASE,'stockTree':TREE,'qaHead':head,'sourceA':[P['sourceA'],P['readabilityA'],P['bridgeA']],'sourceA0':[P['sourceB'],P['readabilityB'],P['bridgeA0']], 'mode':'A0 no-op diagnostic only, same combined Path2D redrawn, no deployment'})
def normalize(b,pairs):
 for x,y in sorted(set(pairs),key=lambda v:-len(v[1])):
  b=b.replace(y.encode(),x.encode()).replace(Path(y).name.encode(),Path(x).name.encode())
 return b
def role(path):
 m=re.fullmatch(r'web/runtime/ordered-(common|game)-(\d+)\.[a-f0-9]{16}\.js',path)
 return m.groups() if m else None
def mini(b,src):
 js=r"""import fs from 'node:fs';import {minify} from 'terser';
const raw=fs.readFileSync(process.argv[1],'utf8').replace(/\r\n/g,'\n');
const res=await minify("(()=>{\n'use strict';\n"+raw+"\n})();\nawait yieldIfNeeded();\n",{module:true,compress:false,mangle:false,format:{comments:false}});
process.stdout.write(res.code);
"""
 # JSON encoding is not used here; retain the JS escape sequences exactly.
 return subprocess.check_output(['node','--input-type=module','-e',js,str(src)],cwd=b,timeout=40)
END=b'await yieldIfNeeded();'
def modules(root,k):
 raw=read(root,k);s=re.fullmatch(br'import\{yieldIfNeeded\}from"(\./[^"]+)";(.+)',raw,re.DOTALL)
 assert s and s[1].startswith(b'./load-data.'),('ordered wrapper missing',k)
 payload=s[2].rstrip(b'\n')
 chunks=payload.split(END)
 assert chunks[-1]==b'' and len(chunks)>1,('slot does not end at exact yield boundary',k)
 modules=[q+END for q in chunks[:-1]]
 # Each module uses the exact official minifier's IIFE envelope.
 # Comparison below pins *all* module bytes rather than removing any other bytes.
 assert all(q.startswith(b'(()=>{') and q.endswith(b'})();'+END) for q in modules),('unexpected wrapper envelope',k)
 return s[1],modules
def inventory(root,m):
 rows={}
 for sect in ('common','gameOnly'):
  out=[]
  for i,k in enumerate(m[sect]):
   r=role(k);q={'slotIndex':i,'path':k,'file':facts(read(root,k))}
   if r:
    try:
     h,parts=modules(root,k);q.update({'role':r,'header':h.decode('ascii'),'modules':[facts(w)for w in parts]})
    except AssertionError as e:q['parseError']=repr(e)
   out.append(q)
  rows[sect]=out
 return rows
def runtime_proof(a,b,A,B,targets,lane,barrier):
 # B may repack complete modules within the *adjacent* 16/17 lane only.
 # Slot18 is independent of the timeline script, a fixed execution barrier.
 assert len(lane)==3 and len(set(lane))==3 and set(targets)=={lane[0],lane[2]}
 assert A['gameOnly']==B['gameOnly']
 assert len(A['common'])==len(B['common'])
 i=A['common'].index(lane[0])
 assert A['common'][i:i+4]==[lane[0],lane[1],barrier,lane[2]]
 assert B['common'][i+2]==barrier
 pairs=[];lookup={}
 for x,y in zip(A['common'],B['common']):
  if x!=y:
   assert x in lane and role(x)==role(y) and role(x) is not None,('unrelated runtime path/order changed',x,y)
   pairs.append((x,y))
  if x in lane:
   assert role(x)==role(y)
   lookup[x]=y
 assert set(lookup)==set(lane)
 assert set(targets)<={x for x,_ in pairs},'one exact target chunk did not change'
 slots={};groups=[]
 for grp in ((lane[0],lane[1]),(lane[2],)):
  a1=[(k,*modules(a,k))for k in grp];b1=[(lookup[k],*modules(b,lookup[k]))for k in grp]
  headers={h for _,h,_ in [*a1,*b1]}
  assert len(headers)==1,'load-data execution header changed'
  a2=[(k,w)for k,_,pp in a1 for w in pp]; b2=[(k,w)for k,_,pp in b1 for w in pp]
  tar=next(iter(set(grp)&targets.keys()))
  subs={};indices=[]
  for ma,mb,path in targets[tar]:
   old=[(i,k)for i,(k,w)in enumerate(a2)if w==ma]
   new=[(i,k)for i,(k,w)in enumerate(b2)if w==mb]
   assert ma not in subs and len(old)==len(new)==1 and old[0][0]==new[0][0] and old[0][1]==tar,('wrong unique wrapper role or order diff',tar,path,old,new)
   slots[path]={'old':old[0][1],'new':new[0][1],'moduleA':facts(ma),'moduleA0':facts(mb)}
   subs[ma]=mb;indices.append(old[0][0])
  assert len(a2)==len(b2) and [subs.get(w,w)for _,w in a2]==[w for _,w in b2],('ordered execution stream changed beyond exact replacement',tar)
  groups.append({'oldPaths':list(grp),'newPaths':[lookup[k]for k in grp],'executionWrapperCounts':[len(a2),len(b2)],
   'oldPayloadSizes':[len(pp)for _,_,pp in a1],'newPayloadSizes':[len(pp)for _,_,pp in b1],
   'wrapperRoleIndices':indices, 'normalizedWholeExecutionSHA256':sha(b''.join(w for _,w in a2))})
 return pairs,slots,groups
def built():
 a,b=W/'A',W/'B';A=json.loads(read(a,MF));B=json.loads(read(b,MF));aa,bb=inv(A),inv(B)
 assert stamp(read(a,MF))==P['stockManifest']
 assert not git(a,'status','--porcelain=v1','-z') and git(a,'rev-parse','HEAD').decode().strip()==BASE
 assert git(b,'rev-parse','HEAD').decode().strip()==BASE
 emit('COMPILED-LAYOUT-PRECHECK.json',{'scope':'observed real compiled archive layout only; before runtime graph acceptance',
  'manifestA':stamp(read(a,MF)),'manifestA0':stamp(read(b,MF)),'A':inventory(a,A),'A0':inventory(b,B)})
 tracked=git(b,'diff','--name-only','-z').decode().strip('\0').split('\0')
 assert REL in tracked and all(not n or n in (REL,P['readabilityPath'],P['bridgePath']) or n.startswith('web/') or n in SHELL for n in tracked),'build changed source beyond one exact guarded path'
 scoped_test()
 assert all(all(facts(read(root,k))==v for k,v in pins.items())for root,pins in ((a,aa),(b,bb)))
 assert all(facts(read(a,k))==v for k,v in P['stockShells'].items())
 assert all(aa[k]==v for k,v in P['activePins'].items())
 assert all(aa[k]==bb[k]==v for k,v in P['activePins'].items() if k not in P['allowedRepack'])
 assert A['project']==B['project'] and read(a,A['project'])==read(b,B['project'])
 camp=json.loads(read(a,A['project']));assert len(camp['stages'])==len(camp['stageLibraries'])==50
 data=lambda d:{k:v for k,v in d.items() if k.startswith('web/data/') or k.startswith('web/graphics/')}
 assert data(aa)==data(bb),'serialized campaign/paint changed'
 targets={}
 for old,path in ((P['oldCommon16'],P['readabilityPath']),(P['oldCommon16'],P['bridgePath']),(P['oldCommon18'],REL)):
  ma,mb=mini(b,a/path),mini(b,b/path)
  assert ma!=mb and ma.endswith(END) and mb.endswith(END)
  if path==P['bridgePath']:assert facts(ma)==P['bridgeCompiledA']
  targets.setdefault(old,[]).append((ma,mb,path))
 assert sorted(map(len,targets.values()))==[1,2]
 repacked,slots,barrierProof=runtime_proof(a,b,A,B,targets,P['allowedRepack'],P['timelineBarrier'])
 pairs=[*repacked]
 for path,d in slots.items():
  if path==P['readabilityPath']:
   module=next(v[1]for group in targets.values()for v in group if v[2]==path)
   for marker in (b'c.stroke(filtered)',b'c.drawImage(s,lx,ly,ww,hh,L,T,ww,hh)'):
    assert len(re.findall(br'(?<![\w$.])'+re.escape(marker),read(b,d['new'])))==len(re.findall(br'(?<![\w$.])'+re.escape(marker),module))==1
 for k in ('gameEntry','workshopEntry','playtest'):
  x,y=A[k].split('?')[0],B[k].split('?')[0]
  if x!=y:pairs.append((x,y))
 assert len(pairs)==len({x for x,_ in pairs})==len({y for _,y in pairs})
 assert set(aa)-set(bb)=={x for x,_ in pairs} and set(bb)-set(aa)=={y for _,y in pairs}
 assert all(aa[k]==bb[k]for k in aa.keys()&bb.keys())
 for k in SHELL:assert normalize(read(b,k),pairs)==read(a,k),('stable shell not only URLs',k)
 for x,y in pairs[len(repacked):]:assert normalize(read(b,y),pairs)==read(a,x),('bootstrap changed beyond URLs',x,y)
 skip={'files','previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
 strip=lambda d:{k:v for k,v in d.items()if k not in skip}
 assert json.loads(normalize(json.dumps(strip(B),sort_keys=True).encode(),pairs))==strip(A)
 x,y=({**p,**{k:facts(read(rt,k))for k in SHELL|{MF}}}for p,rt in ((aa,a),(bb,b)))
 must={'HONRO.html','web/data/chapter-44.48354b7c0547c1a7.json','web/data/chapter-44-assets.ddddc05a5f764d6e.json',A['gameEntry'],A['project'],P['oldCommon18'],P['oldCommon16']}
 assert must<=x.keys()
 translate=dict(pairs)
 mustB={translate.get(k,k)for k in must}|{r['new']for r in slots.values()};assert mustB<=y.keys()
 emit('GRAPH.json',{'A':x,'B':y,'activeAssetsAnd50MapsExact':True,'orderedModulesExactOutsideThreePinnedModules':True,'barrierProof':barrierProof,'repacked':repacked,'allRenamedPaths':pairs,'noOpOnly':True,'slots':slots,'mustObserveA':sorted(must),'mustObserveB':sorted(mustB)})
def scoped_test():
 assert forward_bridge(read(W/'A',P['bridgePath']))==read(W/'B',P['bridgePath'])
 for k,an,bn in ((REL,P['sourceA'],P['sourceB']),(P['readabilityPath'],P['readabilityA'],P['readabilityB'])):
  assert stamp(read(W/'A',k))==an and stamp(read(W/'B',k))==bn
 print('Exact three A/A0 diagnostic sources; Stage2 only forwards optional arg; no filtered removal path shipped.')
if __name__=='__main__':{'pre':pre,'built':built,'test':scoped_test}[sys.argv[1]]()
