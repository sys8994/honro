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
 adds={'.github/workflows/stage46-lossless-normal.yml',*(f'tools/stage46-lossless-normal/{x}' for x in ('guard.py','capture.py','PINS.json','observer.json','lossless.mjs'))}
 check(set(git('diff','--no-renames','--name-status',base,h).splitlines())=={'A\t'+k for k in adds} and not git('status','--porcelain'),'not six exact add-only paths')
 for label in 'AB':
  subprocess.run(['git','worktree','add','--detach',str(W/label),base],check=True,timeout=180)
  check(git('rev-parse','HEAD',cwd=W/label)==base and not git('status','--porcelain',cwd=W/label),'worktree not exact pristine')
 check(fact((W/'A'/M).read_bytes())==P['manifest'] and git('rev-parse',base+':'+P['runtimePath'])==P['runtimeGit'],'baseline changed')
 for name,p in P['authored'].items():
  f=WHAT/name
  check(git('rev-parse',f'{base}:{f}')==p['beforeGit'] and (W/'A'/f).stat().st_size==p['beforeBytes'],'authored source authority: '+name)
 p=subprocess.run(['node',str(D/'lossless.mjs'),str(W/'A'/WHAT),str(W/'authored')],check=True,timeout=120,capture_output=True)
 (W/'out'/'TRANSFORM.json').write_bytes(p.stdout)
 for name,p in P['authored'].items():
  f=(W/'authored'/name).read_bytes()
  check(fact(f)=={'bytes':p['afterBytes'],'sha256':p['afterSHA256']},'local-sha/schema drift '+name)
  shutil.copyfile(W/'authored'/name,W/'B'/WHAT/name)
 check(set(git('diff','--name-only',cwd=W/'B').splitlines())=={str(WHAT/name) for name in P['authored']},'author path changed beyond six')
def index(a):return {r['path']:{'bytes':r['bytes'],'sha256':r['sha256']}for r in a['files']}
def payload(root,manifest,c,x):
 idx=index(manifest)
 p=c['stageLibraries'][45]; pp=obj(root/p)
 check(pp['bytes']==x['bytes'] and pp['sha256']==x['sha256'] and c['assetEncodings']['stageLibraries'][45]=='json-pool-v1','source built packet delta differs')
 check(pp.get('$honroJsonParts')==1 and len(pp['parts'])==4,'unexpected multipart composition')
 leaves=[p,*[z['path']for z in pp['parts']]]
 check(all(fact((root/k).read_bytes())==idx[k] for k in leaves),'compiled manifest or body leaf mismatch')
 joined=b''.join((root/z['path']).read_bytes() for z in pp['parts'])
 check(fact(joined)=={'bytes':x['bytes'],'sha256':x['sha256']},'complete joined bytes')
 return leaves
def built(W):
 ra,rb=[W/q for q in 'AB'];a,b=[obj(r/M)for r in (ra,rb)]
 ia,ib=index(a),index(b);ca,cb=[obj(r/m['project'])for r,m in [(ra,a),(rb,b)]]

 def alias_of(i):
  w=[k for k in i if re.fullmatch(r'web/runtime/campaign\.[0-9a-f]{16}\.js',k)]
  check(len(w)==1,'exactly one campaign JS adapter per arm')
  return w[0]
 wa,wb=alias_of(ia),alias_of(ib)
 xa,xb=(ra/wa).read_bytes(),(rb/wb).read_bytes()
 wanted_a=P['exactProjection']['A'];wanted_b=P['exactProjection']['B']
 caa,cbb=a['common'],b['common']; gaa,gbb=a['gameOnly'],b['gameOnly']
 i=P['adapterCommonIndex']; adjust=[*caa];observed_positions=[j for j,u in enumerate(caa) if u==wa];b_positions=[j for j,u in enumerate(cbb) if u==wb]
 if i<len(adjust):adjust[i]=wb
 def diff2(x,y):return [[j,m,n] for j,(m,n) in enumerate(zip(x,y)) if m!=n]
 normal=lambda v:v.split('?')[0]
 receipt={'status':'MEASURED_BEFORE_GRAPH_VERDICT','A':{'project':a['project'],'adapter':wa,'adapterFact':fact(xa),'adapterCommonIndex':observed_positions,'commonLength':len(caa),'gameOnlyLength':len(gaa),'stage46Descriptor':ca['stageLibraries'][45],'playtest':normal(a['playtest'])},
          'B':{'project':b['project'],'adapter':wb,'adapterFact':fact(xb),'adapterCommonIndex':b_positions,'commonLength':len(cbb),'gameOnlyLength':len(gbb),'stage46Descriptor':cb['stageLibraries'][45],'playtest':normal(b['playtest'])},
          'commonLiteralDifferences':diff2(caa,cbb),'commonDifferencesAfterSingleExpectedAddress':diff2(adjust,cbb),'gameOnlyDifferences':diff2(gaa,gbb),
          'exactContentAndOrderChecks':{'candidateProjectedAdapterSHA':fact(xb)==wanted_b['files'][wanted_b['adapter']], 'adapterOnlyReplacesProjectURL':xa.count(a['project'].encode())==1 and xa.replace(a['project'].encode(),b['project'].encode())==xb,'commonExactExceptExpectedAddressAtSamePosition':observed_positions==b_positions==[i] and adjust==cbb,'gameOnlyExact':gaa==gbb}}
 out(W/'out'/'RUNTIME-ADAPTER-RECEIPT.json',receipt)
 check(all(receipt['exactContentAndOrderChecks'].values()),'runtime address substitution, order, or unchanged code mismatch')
 check(b['playtest'].split('?')[0]=='web/entries/game.bcb4017b870cf082.html','R1 observed B playtest rebuilt differently')
 for r,m,c,w,idx,u in [(ra,a,ca,wa,ia,wanted_a),(rb,b,cb,wb,ib,wanted_b)]:
  check((m['project'],w,c['stageLibraries'][45])==(u['project'],u['adapter'],u['descriptor']),'compiler produced a non-projected staged route')
  check(all(idx[k]==f and fact((r/k).read_bytes())==f for k,f in u['files'].items()),'non-projected immutable module/data bytes')
 la,lb=(payload(r,m,c,P[q])for r,m,c,q in [(ra,a,ca,'A'),(rb,b,cb,'B')])
 check(len(ia)==len(ib)==810 and ca['stages']==cb['stages'] and ca['stages'][45]==P['bootMap'],'map/active graph drift')
 a2=json.loads(json.dumps(ca));a2['stageLibraries'][45]=cb['stageLibraries'][45]
 check(a2==cb,'not exactly one remapped campaign asset packet')
 check(ca['stageLibraries'][32]==cb['stageLibraries'][32]==P['nonTargetStage33Packet'],'deployed Stage33 packet did not survive exactly')
 aa={*la,wa,a['project'],a['gameEntry'],a['workshopEntry'],a['playtest'].split('?')[0]}
 bb={*lb,wb,b['project'],b['gameEntry'],b['workshopEntry'],b['playtest'].split('?')[0]}
 check(len(aa)==len(bb)==10 and set(ia)-set(ib)==aa-bb and set(ib)-set(ia)==bb-aa and all(ia[k]==ib[k] for k in ia.keys()&ib.keys()),'not exact Stage46 transport-only active aliases')
 check(adjust==b['common'] and a['gameOnly']==b['gameOnly'],'changed ordered native painter/other runtime or condition')
 for rx,ix in [(ra,ia),(rb,ib)]:
  for k,f in ix.items():check(fact((rx/k).read_bytes())==f,'unverified graph bytes '+k)
 check(all((ra/str(rel)).read_bytes()==(rb/str(rel)).read_bytes() for rel in [P['runtimePath'],*ca['stages']]),'terrain, runtime or mechanics changed')
 graph={}
 for label,r,m,c,idx,l,wr in [('A',ra,a,ca,ia,la,wa),('B',rb,b,cb,ib,lb,wb)]:
  needs={m['project'],m['gameEntry'],P['bootMap'],wr,*l}
  graph[label]={'active':idx,'shell':fact((r/'HONRO.html').read_bytes()),'needs':sorted(needs),'parts':l,'packet':P[label],'manifest':fact((r/M).read_bytes())}
 receipt['status']='EXACT_SINGLE_ADAPTER_URL_ALIAS_ONLY';out(W/'out'/'RUNTIME-ADAPTER-RECEIPT.json',receipt)
 out(W/'out'/'GRAPH.json',graph)
 out(W/'out'/'CANDIDATE-EXACT-SCOPE.json',{'files':sorted(bb|FIXED),'previousAliases':sorted(aa),'nativeCommonAndGameExact':True,'mapFilesExact':50})
def seal(W):
 q=obj(W/'out'/'BROWSER.json');check(q['status']=='PASS_FROZEN_PC_M_RGBA_EXACT_NO_DEPLOY','no official exact B seal after browser HOLD')
 paths=obj(W/'out'/'CANDIDATE-EXACT-SCOPE.json')['files'];b=W/'B'
 with zipfile.ZipFile(W/'out'/'B-COMPILED-FROM-PASSED-NORMAL-NO-DEPLOY.zip','w',compression=zipfile.ZIP_DEFLATED)as z:
  for k in paths: z.write(b/k,k)
 out(W/'out'/'SEAL.json',{'status':'NORMAL_BYTE_SAFE_QA_ONLY_NO_DEPLOY','files':{k:fact((b/k).read_bytes())for k in paths},'zip':fact((W/'out'/'B-COMPILED-FROM-PASSED-NORMAL-NO-DEPLOY.zip').read_bytes())})
if __name__=='__main__':
 {'pre':pre,'built':built,'seal':seal}[sys.argv[1]](pathlib.Path(sys.argv[2]).resolve())
