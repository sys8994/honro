import hashlib,json,os,pathlib,shutil,subprocess,sys,zipfile,re
D=pathlib.Path(__file__).resolve().parent
P=json.loads((D/'PINS.json').read_bytes())
M='web/manifest.json'; WHAT=pathlib.Path('shared/assets/environment/act5');FIXED={'HONRO.html','HONRO_WORKSHOP.html','index.html',M}
def fact(b):return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
def git(*a,cwd=None):return subprocess.check_output(['git',*a],cwd=cwd,text=True,timeout=120).strip()
def obj(p):return json.loads(p.read_bytes())
def check(v,label):
 if not v:raise RuntimeError(label)
def out(p,x):p.write_text(json.dumps(x,indent=2)+'\n')
def pre(W):
 check(P['enabled'] is True,'Disabled; coordinator-reviewed activation only')
 check((os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==('sys8994/honro','push',P['qaRef']),'unexpected QA branch')
 h=os.environ['GITHUB_SHA']; base=P['parent']; REPO=pathlib.Path(os.environ['GITHUB_WORKSPACE'])
 check(W.is_relative_to(pathlib.Path(os.environ['RUNNER_TEMP']).resolve()) and REPO not in W.parents,'bad detached work directory')
 check(git('rev-list','--parents','-1','HEAD')==h+' '+base and git('rev-parse',base+'^{tree}')==P['tree'],'unexpected exact QA parent')
 adds={'.github/workflows/stage40-lossless-normal.yml',*(f'tools/stage40-lossless-normal/{x}' for x in ('guard.py','capture.py','PINS.json','observer.json','grammar.mjs','author.mjs'))}
 check(set(git('diff','--no-renames','--name-status',base,h).splitlines())=={'A\t'+k for k in adds} and not git('status','--porcelain'),'not seven exact add-only paths')
 for label in 'AB':
  subprocess.run(['git','worktree','add','--detach',str(W/label),base],check=True,timeout=180)
  check(git('rev-parse','HEAD',cwd=W/label)==base and not git('status','--porcelain',cwd=W/label),'worktree not exact pristine')

 check(len(P['sourceGit'])>=17 and all(git('rev-parse',f'{base}:{f}')==digest for f,digest in P['sourceGit'].items()),'canonical author source authority changed')
 subprocess.run(['node',str(D/'author.mjs'),str(W/'A'),str(W/'B'),str(W/'out')],check=True,timeout=180)
 check(git('diff','--no-renames','--name-status',cwd=W/'B')=='M\t'+P['authorManifest'],'non-author-source delta detected')
def index(a):return {r['path']:{'bytes':r['bytes'],'sha256':r['sha256']}for r in a['files']}
def payload(root,manifest,c,x):
 idx=index(manifest)
 p=c['stageLibraries'][39]; pp=obj(root/p)
 check(pp['bytes']==x['bytes'] and pp['sha256']==x['sha256'] and c['assetEncodings']['stageLibraries'][39]=='json-pool-v1','source built packet delta differs')
 check(pp.get('$honroJsonParts')==1 and len(pp['parts'])==3,'unexpected multipart composition')
 leaves=[p,*[z['path']for z in pp['parts']]]
 check(all(fact((root/k).read_bytes())==idx[k] for k in leaves),'compiled manifest or body leaf mismatch')
 joined=b''.join((root/z['path']).read_bytes() for z in pp['parts'])
 check(fact(joined)=={'bytes':x['bytes'],'sha256':x['sha256']},'complete joined bytes')
 return leaves
def built(W):
 ra,rb=[W/q for q in 'AB'];a,b=[obj(r/M)for r in (ra,rb)]
 ia,ib=index(a),index(b);ca,cb=[obj(r/m['project'])for r,m in [(ra,a),(rb,b)]]
 la,lb=(payload(r,m,c,P[q])for r,m,c,q in [(ra,a,ca,'A'),(rb,b,cb,'B')])
 check(len(ia)==len(ib)==810 and ca['stages']==cb['stages'] and ca['stages'][39]==P['bootMap'],'map/active graph drift')
 a2=json.loads(json.dumps(ca));a2['stageLibraries'][39]=cb['stageLibraries'][39]
 check(a2==cb,'not exactly one remapped campaign asset packet')
 check(ca['stageLibraries'][32]==cb['stageLibraries'][32],'deployed Stage33 packet did not survive exactly')
 wa,wb=([k for k in i if re.fullmatch(r'web/runtime/campaign\.[0-9a-f]{16}\.js',k)] for i in (ia,ib))
 check(len(wa)==len(wb)==1,'exactly one campaign JS adapter per arm')
 wa,wb=wa[0],wb[0]
 xa,xb=(ra/wa).read_bytes(),(rb/wb).read_bytes()
 check(xa.count(a['project'].encode())==1 and xa.replace(a['project'].encode(),b['project'].encode())==xb,'campaign adapter changed beyond packet URL')
 aa={*la,wa,a['project'],a['gameEntry'],a['workshopEntry'],a['playtest'].split('?')[0]}
 bb={*lb,wb,b['project'],b['gameEntry'],b['workshopEntry'],b['playtest'].split('?')[0]}
 check(len(aa)==len(bb)==9 and set(ia)-set(ib)==aa-bb and set(ib)-set(ia)==bb-aa and all(ia[k]==ib[k] for k in ia.keys()&ib.keys()),'not exact Stage40 transport-only active aliases')
 check(a['common']==b['common'] and a['gameOnly']==b['gameOnly'],'native runtime module changed')
 for rx,ix in [(ra,ia),(rb,ib)]:
  for k,f in ix.items():check(fact((rx/k).read_bytes())==f,'unverified graph bytes '+k)
 check(all((ra/str(rel)).read_bytes()==(rb/str(rel)).read_bytes() for rel in list(ca['stages'])),'terrain, runtime or mechanics changed')
 graph={}
 for label,r,m,c,idx,l,wr in [('A',ra,a,ca,ia,la,wa),('B',rb,b,cb,ib,lb,wb)]:
  needs={m['project'],m['gameEntry'],P['bootMap'],wr,*l}
  graph[label]={'active':idx,'shell':fact((r/'HONRO.html').read_bytes()),'needs':sorted(needs),'parts':l,'packet':P[label],'manifest':fact((r/M).read_bytes())}
 out(W/'out'/'GRAPH.json',graph)
 out(W/'out'/'CANDIDATE-EXACT-SCOPE.json',{'files':sorted(bb|FIXED),'previousAliases':sorted(aa),'nativeCommonAndGameExact':True,'mapFilesExact':50,'logicalAuthorOnly':P['authorManifest']})
def seal(W):
 q=obj(W/'out'/'BROWSER.json');check(q['status']=='PASS_FROZEN_PC_M_RGBA_EXACT_NO_DEPLOY','no official exact B seal after browser HOLD')
 paths=obj(W/'out'/'CANDIDATE-EXACT-SCOPE.json')['files'];b=W/'B'
 with zipfile.ZipFile(W/'out'/'B-COMPILED-FROM-PASSED-NORMAL-NO-DEPLOY.zip','w',compression=zipfile.ZIP_DEFLATED)as z:
  for k in paths: z.write(b/k,k)
 out(W/'out'/'SEAL.json',{'status':'NORMAL_BYTE_SAFE_QA_ONLY_NO_DEPLOY','files':{k:fact((b/k).read_bytes())for k in paths},'zip':fact((W/'out'/'B-COMPILED-FROM-PASSED-NORMAL-NO-DEPLOY.zip').read_bytes())})
if __name__=='__main__':
 {'pre':pre,'built':built,'seal':seal}[sys.argv[1]](pathlib.Path(sys.argv[2]).resolve())
