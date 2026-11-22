"""Exact normal one-source build. Only detached worktrees; no release."""
import hashlib,json,os,re,subprocess,sys,zipfile
from pathlib import Path
H=Path(__file__).resolve().parent
P=json.loads((H/'PINS.json').read_bytes())
M='web/manifest.json';DOCS={'HONRO.html','HONRO_WORKSHOP.html','index.html'}
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return dict(bytes=len(b),sha256=sha(b))
def blob(b):return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\x00'+b).hexdigest()
def get(r,p):
 assert not p.startswith('/') and '..' not in Path(p).parts
 t=r/p;assert t.is_file() and not t.is_symlink()
 return t.read_bytes()
def write(p,x):p.write_text(json.dumps(x,indent=2,ensure_ascii=False)+'\n')
save=write
def git(r,*a):return subprocess.check_output(['git','-C',str(r),*a],timeout=110).decode().strip()
def idx(m):
 z={o['path']:{k:o[k]for k in ('bytes','sha256')}for o in m['files']}
 assert len(z)==len(m['files'])==810
 return z
def intact(root):
 assert P['enabled'] is True,'Disabled until independent operator review'
 assert not(os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN'))
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==('sys8994/honro','push',P['ref'])
 base=P['base'];head=os.environ['GITHUB_SHA']
 assert git(root,'rev-list','--parents','-1','HEAD').split()==[head,base] and git(root,'rev-parse',base+'^{tree}')==P['tree']
 assert not git(root,'status','--porcelain=v1')
 files={'.github/workflows/stage34-west-cache.yml',*(f'tools/stage34-west-cache/{n}'for n in ('PINS.json','candidate.js','guard.py','capture.py','observer.json','park.js'))}
 assert set(git(root,'diff','--name-status','--no-renames',base,head).splitlines())=={'A\t'+f for f in files}
 assert all(git(root,'ls-tree',head,'--',f).startswith('100644 blob ')for f in files)
 return head
def pre(w):
 root=Path(os.environ['GITHUB_WORKSPACE']);head=intact(root);base=P['base']
 for n in 'AB':
  r=w/n;git(root,'worktree','add','--detach',str(r),base)
  assert git(r,'rev-parse','HEAD')==base and not git(r,'status','--porcelain=v1')
  assert blob(get(r,M))==P['manifestGit'] and blob(get(r,'HONRO.html'))==P['shellGit'] and blob(get(r,P['src']))==P['sourceA']
 a=get(w/'A',P['src']);b=get(H,'candidate.js')
 assert blob(b)==P['sourceB'] and sha(b)==P['sourceBSHA']
 begin=b.index(b'// One Stage34 structural landmark,');end=b.index(b'const S=G.HonroScene?.prototype;',begin)
 b0=b[:begin]+b[end:]
 assert b0.count(b'{suppressStage34WestClipAA(raw,l,b,this);return;}')==1
 assert b0.replace(b'{suppressStage34WestClipAA(raw,l,b,this);return;}',b'return;',1)==a
 (w/'B'/P['src']).write_bytes(b)
 assert git(w/'B','diff','--name-status')=='M\t'+P['src']
 save(w/'out'/'SOURCE.json',{'base':base,'tree':P['tree'],'head':head,'source':P['src'],'A':fact(a),'B':fact(b)})
def mini(b,k):
 js=r"""import fs from 'node:fs';import {minify} from 'terser';
 const raw=fs.readFileSync(process.argv[1],'utf8').replace(/\r\n/g,'\n');
 const m=await minify("(()=>{\n'use strict';\n"+raw+"\n})();\nawait yieldIfNeeded();\n",{module:true,compress:false,mangle:false,format:{comments:false}});
 process.stdout.write(m.code);"""
 return subprocess.check_output(['node','--input-type=module','-e',js,str(k)],cwd=b,timeout=60)
def stream(root,seq,role):
 out=[]
 for p in seq:
  if not re.fullmatch(r'web/runtime/ordered-'+role+r'-\d+\.[a-f0-9]{16}\.js',p):continue
  v=re.fullmatch(br'import\{yieldIfNeeded\}from"(\./[^"]+)";(.+?)\n?',get(root,p),re.S);assert v
  out.append((v[1],v[2]))
 assert out and len({k for k,_ in out})==1
 return out[0][0],b''.join(v for _,v in out)
def aliases(v,ab):
 for a,b in sorted(ab.items(),key=lambda kv:-len(kv[1])):
  v=v.replace(b.encode(),a.encode()).replace(Path(b).name.encode(),Path(a).name.encode())
 return v
def built(w):
 root=Path(os.environ['GITHUB_WORKSPACE']);intact(root);a,b=w/'A',w/'B'
 am,bm=[json.loads(get(x,M))for x in (a,b)];ai,bi=map(idx,(am,bm))
 assert git(a,'status','--porcelain=v1')=='' and blob(get(a,M))==P['manifestGit']
 assert (blob(get(a,P['src'])),blob(get(b,P['src'])))==(P['sourceA'],P['sourceB'])
 assert git(b,'diff','--name-only','--','shared','game/src','game/engine','workshop/src','tests','tools')==P['src']
 for r,m in ((a,ai),(b,bi)):
  assert all(fact(get(r,k))==v for k,v in m.items())
 assert all(ai[k]==bi[k]for k in ai.keys()&bi.keys())
 assert am['project']==bm['project']==P['project'] and get(a,P['project'])==get(b,P['project'])
 c=json.loads(get(a,P['project'])); maps=c['stages']; packets=c['stageLibraries']
 assert len(maps)==len(packets)==50 and maps[33]==P['map'] and packets[33]==P['packet']
 assert {k:v for k,v in ai.items() if k.startswith(('web/data/','web/graphics/'))}=={k:v for k,v in bi.items() if k.startswith(('web/data/','web/graphics/'))}
 assert set(maps+packets)<=ai.keys()&bi.keys()
 assert am['common']==bm['common'] and stream(a,am['common'],'common')==stream(b,bm['common'],'common')
 ar,ss=stream(a,am['gameOnly'],'game');br,tt=stream(b,bm['gameOnly'],'game');ma,mb=mini(b,a/P['src']),mini(b,b/P['src'])
 assert ar==br and ma!=mb and ss.count(ma)==tt.count(mb)==1 and ss.replace(ma,mb,1)==tt
 assert len(am['gameOnly'])==len(bm['gameOnly'])
 mods={x:y for x,y in zip(am['gameOnly'],bm['gameOnly'])if x!=y}
 assert P['oldSlot'] in mods and all(re.sub(r'\.[a-f0-9]{16}\.js$','',x)==re.sub(r'\.[a-f0-9]{16}\.js$','',y) for x,y in mods.items())
 native=mods[P['oldSlot']]
 assert get(b,native).count(mb)==1
 rel=dict(mods)
 for k in ('gameEntry','workshopEntry','playtest'):
  x,y=am[k].split('?')[0],bm[k].split('?')[0]
  if x!=y:rel[x]=y
 assert set(ai)-set(bi)==set(rel) and set(bi)-set(ai)==set(rel.values())
 assert all(aliases(get(b,y),rel)==get(a,x)for x,y in rel.items()if x not in mods)
 assert all(aliases(get(b,k),rel)==get(a,k)for k in DOCS)
 ignore={'files','previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
 assert (set(am)-ignore)==(set(bm)-ignore)
 assert all(json.loads(aliases(json.dumps(bm[k]).encode(),rel))==am[k]for k in am if k not in ignore)
 assert am['publishedRetention']==bm['publishedRetention']=={'version':2,'windowDays':7,'minGraphs':2}
 pack=json.loads(get(a,P['packet']));assert len(pack)==6
 assert all(len([x for x in pack if x['id']==id and not x['collision']])==1 for id in ('approved34:coastal-foundation','approved34:lower-natural-mask-v2'))
 needed={P['project'],P['map'],P['packet']}
 g={'case':'Stage34 active 810, maps/packets/graphics identical; ordered game stream one exact module replacement','base':P['base'],'mapCount':50,'packetCount':50,'aliases':rel,'oneModuleA':fact(ma),'oneModuleB':fact(mb),'emitted':sorted(set(rel.values())|DOCS|{M})}
 for n,root,pool,m,port,chunk in [('A',a,ai,am,18961,P['oldSlot']),('B',b,bi,bm,18962,native)]:
  k=m['gameEntry'].split('?')[0]
  g[n]={'active':pool,'needs':sorted(needed|{k,chunk}),'shell':fact(get(root,'HONRO.html')),'origin':f'http://127.0.0.1:{port}/'}
 save(w/'out'/'GRAPH.json',g)
def seal(w):
 q=json.loads(get(w/'out','BROWSER.json'));g=json.loads(get(w/'out','GRAPH.json'))
 assert q['status']=='PASS_BOUND_COLD_CACHE_SCOPE_PENDING_VISUAL_NO_DEPLOY' and len(q['comparisons'])==8
 assert g['base']==P['base'] and g['mapCount']==g['packetCount']==50
 paths=g['emitted'];out=w/'out'
 with zipfile.ZipFile(out/'B-EXACT-NORMAL-QA-NO-DEPLOY.zip','x',zipfile.ZIP_DEFLATED)as z:
  for k in paths:z.writestr(k,get(w/'B',k))
 save(out/'SEAL.json',{'mustReview':True,'noDeploy':True,'source':P['sourceB'],'files':{k:{**fact(get(w/'B',k)),'git':blob(get(w/'B',k))}for k in paths},
   'zip':fact(get(out,'B-EXACT-NORMAL-QA-NO-DEPLOY.zip')),'browser':fact(get(out,'BROWSER.json'))})
if __name__=='__main__':
 w=Path(sys.argv[2]).resolve(); r=Path(os.environ['RUNNER_TEMP']).resolve()
 assert w.is_relative_to(r) and w!=r and (w/'out').is_dir()
 {'pre':pre,'built':built,'seal':seal}[sys.argv[1]](w)
