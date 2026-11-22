import hashlib,json,os,pathlib,shutil,subprocess,sys,zipfile,re
D=pathlib.Path(__file__).resolve().parent
P=json.loads((D/'PINS.json').read_bytes());M='web/manifest.json';S=P['stages']; E=pathlib.Path('shared/assets/environment/act5')
OP=S['40']['sourceGit']; P40=P['expectedStage40Source']; O=P['expectedCombined']
PROFILE='shared/runtime/profile-store.js'
REPO_PATHS={P40['file'],PROFILE,*(str(E/n)for n in S['46']['authored'])}
FIXED={'HONRO.html','HONRO_WORKSHOP.html','index.html',M}
def fact(b):return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
def git(*a,cwd=None):return subprocess.check_output(['git',*a],cwd=cwd,text=True,timeout=120).strip()
def obj(p):return json.loads(p.read_bytes())
def check(v,label):
 if not v:raise RuntimeError(label)
def out(p,x):p.write_text(json.dumps(x,indent=2)+'\n')
def pre(W):
 check(P['enabled'] is True and P['actualCurrentPublicPages'] and P['actualCurrentPublicPages']['head']==P['parent'] and P['actualCurrentPublicPages']['conclusion']=='success' and P['publishNever'] is True,'DISABLED: root-reviewed exact current public 342 authority required')
 check((os.environ.get('GITHUB_REPOSITORY'),os.environ.get('GITHUB_EVENT_NAME'),os.environ.get('GITHUB_REF'))==('sys8994/honro','push',P['qaRef']),'wrong repo/event/QA branch')
 check(not os.getenv('GITHUB_TOKEN') and not os.getenv('GH_TOKEN'),'unnecessary credentials')
 h=os.environ['GITHUB_SHA']; base=P['parent']; repo=pathlib.Path(os.environ['GITHUB_WORKSPACE'])
 check(W.is_relative_to(pathlib.Path(os.environ['RUNNER_TEMP']).resolve()) and repo not in W.parents,'not detached filesystem')
 check(git('rev-list','--parents','-1','HEAD')==h+' '+base and git('rev-parse',base+'^{tree}')==P['tree'],'wrong exact sole parent')
 files={'guard.py','capture40.py','capture46.py','PINS.json','observer.json','author.mjs','grammar.mjs','lossless.mjs','profile-candidate.js','check-compat.mjs','resume.py'}
 adds={'.github/workflows/stage40-46-lossless-save-compatible.yml',*(f'tools/stage40-46-save-compatible/{x}' for x in files)}
 check(set(git('diff','--no-renames','--name-status',base,h).splitlines())=={'A\t'+k for k in adds} and not git('status','--porcelain'),'not exact add-only transport')
 for label in 'AB':
  subprocess.run(['git','worktree','add','--detach',str(W/label),base],check=True,timeout=180)
  check(git('rev-parse','HEAD',cwd=W/label)==base and not git('status','--porcelain',cwd=W/label),'nonpristine worktree')
 a,b=[W/q for q in 'AB']
 old=P['previousAuthority'];stock=W/'H'
 check(git('rev-parse',old['head']+'^{tree}')==old['tree'] and git('rev-list','--parents','-1',base).split()==[base,old['head']],'exact historical source chain')
 subprocess.run(['git','worktree','add','--detach',str(stock),old['head']],check=True,timeout=180)
 check(fact((stock/M).read_bytes())==old['manifest'] and not git('status','--porcelain',cwd=stock),'actual 733 save-generation host is not pristine')
 def exact(p):return {**fact(p.read_bytes()),'git':git('hash-object',str(p))}
 check(exact(a/M)==P['manifest'] and exact(a/PROFILE)==P['profileBefore'] and exact(D/'profile-candidate.js')==P['profileAfter'],'exact profile/candidate pre-cache')
 check(fact((a/M).read_bytes())=={k:P['manifest'][k]for k in ('bytes','sha256')},'exact published retained manifest mismatch')
 for k,v in OP.items():check(git('rev-parse',f'{base}:{k}')==v,'Stage40 canonical reader/input drift '+k)
 check(git('rev-parse',base+':'+S['46']['runtimePath'])==S['46']['runtimeGit'],'stage46 native wrapper changed')
 for name,p in S['46']['authored'].items():
  f=E/name;check(git('rev-parse',f'{base}:{f}')==p['beforeGit'] and (a/f).stat().st_size==p['beforeBytes'],'Stage46 authored source drift '+name)
 sub= W/'out'/'stage40';sub.mkdir()
 subprocess.run(['node',str(D/'author.mjs'),str(a),str(b),str(sub)],check=True,timeout=150)
 proof=obj(sub/'SOURCE-PROOF.json')
 check(all(proof[k]==v for k,v in P40.items()) and len(proof['changedOwners'])==4 and fact((b/P40['file']).read_bytes())['sha256']==P40['newManifestSHA256'],'Stage40 exact independent normal authored transform drift')
 subprocess.run(['node',str(D/'check-compat.mjs'),'author',str(a),str(b),str(W/'out'/'unused')],check=True,timeout=150)
 shutil.copyfile(D/'profile-candidate.js',b/PROFILE)
 sub= W/'out'/'stage46';sub.mkdir()
 n=subprocess.run(['node',str(D/'lossless.mjs'),str(a/E),str(W/'authored46')],check=True,timeout=150,capture_output=True)
 (sub/'TRANSFORM.json').write_bytes(n.stdout)
 for name,p in S['46']['authored'].items():
  f=(W/'authored46'/name).read_bytes();check(fact(f)=={'bytes':p['afterBytes'],'sha256':p['afterSHA256']},'Stage46 exact authored transform drift '+name)
  shutil.copyfile(W/'authored46'/name,b/E/name)
 delta=set(git('diff','--no-renames','--name-status',cwd=b).splitlines())
 check(len(REPO_PATHS)==8 and delta=={'M\t'+k for k in REPO_PATHS},'expected only exact eight disjoint author modifications')
 out(W/'out'/'SOURCE-UNION.json',{'authority':P['authority'],'base':base,'changes':{k:{'A':fact((a/k).read_bytes()),'B':fact((b/k).read_bytes())}for k in sorted(REPO_PATHS)}})
def index(m):return {e['path']:{k:e[k]for k in ('bytes','sha256')}for e in m['files']}
def built(W):
 ra,rb=[W/x for x in 'AB']; A,B=[obj(r/M)for r in [ra,rb]]; ia,ib=map(index,(A,B))
 ca,cb=[obj(r/m['project'])for r,m in [(ra,A),(rb,B)]]
 olds,news=set(),set(); needA,needB={},{}; data={}
 for f in O['changedSlots']:
  n=f['stage']; j=n-1; k=str(n); s=S[k]; wantA=s['exactProjection']['A']; rawA,rawB=ca['stageLibraries'][j],cb['stageLibraries'][j]
  check((rawA,rawB)==(f['old'],f['new']) and ca['assetEncodings']['stageLibraries'][j]==cb['assetEncodings']['stageLibraries'][j]=='json-pool-v1','unexpected exact stage packet '+str(n))
  h={}
  for label,r,m,ind,leaf,sides,match in [('A',ra,A,ia,rawA,olds,wantA['files']),('B',rb,B,ib,rawB,news,f['facts'])]:
   d=obj(r/leaf); parts=[z['path']for z in d['parts']]; need=[leaf,*parts]
   assert d['$honroJsonParts']==1 and len(parts)==(3 if n==40 else 4)
   check(fact(b''.join((r/u).read_bytes()for u in parts))=={x:s[label][x]for x in ('bytes','sha256')},'exact joined payload '+str(n)+' '+label)
   check(all(fact((r/u).read_bytes())==ind[u]==match[u] for u in need),'exact individual owner payload '+str(n)+' '+label)
   sides.update(need); h[label]=(need,fact((r/leaf).read_bytes()))
  data[k]=h
 c=copy= json.loads(json.dumps(ca));copy['stageLibraries'][39]=cb['stageLibraries'][39];copy['stageLibraries'][45]=cb['stageLibraries'][45]
 check(copy==cb and len(ca['stages'])==50 and ca['stages']==cb['stages'],'campaign changed beyond exact two slots')
 ap,bp=A['project'],B['project']; aw,bw=O['adapter']['old'],O['adapter']['new']; i=O['adapter']['commonPosition']
 check((ap,bp)==(O['campaign']['old'],O['campaign']['new']),'wrong combined campaign addresses')
 ax,bx=(ra/aw).read_bytes(),(rb/bw).read_bytes()
 check(ax.count(ap.encode())==1 and ax.replace(ap.encode(),bp.encode())==bx and fact(bx)=={x:O['adapter'][x]for x in ('bytes','sha256')},'compiled adapter not single exact URL')
 check(fact((rb/bp).read_bytes())=={x:O['campaign'][x]for x in ('bytes','sha256')},'exact joint campaign SHA')
 cv=A['common'].copy();check(len(cv)==76 and cv[i]==aw and cv.count(aw)==1,'unexpected baseline common order')
 cv[i]=bw
 subprocess.run(['node',str(D/'check-compat.mjs'),'modules',str(ra),str(rb),str(W/'out'/'COMPAT-MODULES.json')],check=True,timeout=150)
 scope=obj(W/'out'/'COMPAT-MODULES.json')
 for x,y in zip(scope['oldModules'],scope['newModules']):cv[cv.index(x)]=y;olds.add(x);news.add(y)
 check(cv==B['common'] and A['gameOnly']==B['gameOnly'],'ordinary runtime changed beyond validated alias/profile/provider routes')
 for arr,m,p,w in [(olds,A,ap,aw),(news,B,bp,bw)]:
  arr.update([p,w,m['gameEntry'],m['workshopEntry'],m['playtest'].split('?')[0]])
 check(len(ia)==len(ib)==810 and len(olds)==len(news)==16 and set(ia)-set(ib)==olds-news and set(ib)-set(ia)==news-olds and all(ia[k]==ib[k]for k in ia.keys()&ib.keys()),'non-target active content was changed')
 check(all(k in ia and ia[k]==ib[k] for k in P['protectedAliases']),'lost exact Stage21/33 content')
 check(all(fact((r/k).read_bytes())==v for r,u in [(ra,ia),(rb,ib)]for k,v in u.items()),'non-target file bytes differ despite manifest')
 check(all((rb/k).read_bytes()==(ra/k).read_bytes() for k in [*ca['stages'],S['46']['runtimePath']]),'map or native renderer source changed')
 for n,k in [(40,'40'),(46,'46')]:
  g={}
  for label,r,m,u,w,d in [('A',ra,A,ia,aw,ca),('B',rb,B,ib,bw,cb)]:
   needs=[m['project'],m['gameEntry'],S[k]['bootMap'],w,*data[k][label][0]]
   check(d['stages'][n-1]==S[k]['bootMap'],'wrong actual unchanged stage map')
   g[label]={'active':u,'shell':fact((r/'HONRO.html').read_bytes()),'needs':sorted(needs),'parts':data[k][label][0],'packet':S[k][label],'manifest':fact((r/M).read_bytes())}
  out(W/'out'/f'stage{n}'/'GRAPH.json',g)
 oldRoot=W/'H';hist=obj(oldRoot/M); verify={}
 for label,root,manifest,project in [('H',oldRoot,hist,obj(oldRoot/hist['project'])),('A',ra,A,ca),('B',rb,B,cb)]:
  act=index(manifest);tree={}
  for n in (21,32,33,40,42,46):
   pos=n-1; pkt=project['stageLibraries'][pos]; desc=obj(root/pkt)
   files=[project['stages'][pos],pkt,*[x['path']for x in (desc.get('parts',[])if isinstance(desc,dict)else [])]]
   if n in (40,46):files += [manifest['project'],manifest['gameEntry'],*[p for p in manifest['common'] if re.search(r'/(?:campaign\.|ordered-common-(?:4|12)\.)',p)]]
   tree[str(n)]={k:act[k]for k in files}
   check(all(fact((root/k).read_bytes())==v for k,v in tree[str(n)].items()),'exact old/current peer route changed')
  verify[label]={'shell':fact((root/'HONRO.html').read_bytes()),'manifest':fact((root/M).read_bytes()),'routes':tree}
 check(all(verify['A']['routes'][str(n)]==verify['B']['routes'][str(n)] for n in (21,32,33,42)),'non-target peer files drift')
 out(W/'out'/'RESUME-ROUTES.json',verify)
 out(W/'out'/'COMBINED-GRAPH.json',{'status':'EXACT_COMBINED_40_46_ONLY_NO_DEPLOY','active':len(ia),'unchanged':len(ia.keys()&ib.keys()),'verifiedStructuralAdaptersOnly':O['adapter'],'sourceMapFilesExact':50,'nativeCompatibility':scope,'oldAliases':sorted(olds-news),'newAliases':sorted(news-olds),'retainedStage21Stage33':P['protectedAliases'],'publishableCandidates':sorted((news-olds)|FIXED)})
def seal(W):
 graph=obj(W/'out'/'COMBINED-GRAPH.json')
 resume=obj(W/'out'/'RESUME.json');check(resume['status']=='PASS_NATIVE_PERSISTED_733_AND_CURRENT_OLD_NEW_PC_M','actual backwards save/restore failed')
 rc={}
 for n in ('40','46'):
  j=obj(W/'out'/('stage'+n)/'BROWSER.json')
  check(j['status']=='PASS_FROZEN_PC_M_RGBA_EXACT_NO_DEPLOY' and j['pairedRGBAExacts']==12 and not j['mismatches'],'actual '+n+' native exact A/B failed')
  previous=P['normalScopes'][n]
  for dev,old in previous.items():
   for pose,expect in old.items():
    for arm in 'AB':
     n1=j['views'][arm+dev[1:]];f=n1['frames'][pose]
     check(not n1['pending'] and not n1['networkErrors'] and f['meta']==expect['meta'] and f['timingPhase']==expect['timingPhase'] and f['cssBox']==expect['cssBox'],'archived actual camera/physics drift '+n)
     check(f['raw']['rgbaSHA256']==expect['rawRGBA'] and f['dom']['rgbaSHA256']==expect['domRGBA'],'archived actual RGBA mismatch '+n)
  rc[n]={'pairedExact':12,'originalR2FoldedPoseStateExact':True,'browser':fact((W/'out'/('stage'+n)/'BROWSER.json').read_bytes())}
 current=W/'B';outdir=W/'out'
 out(outdir/'SYSTEM-VERDICT.json',{'status':'COMBINED_ACTUAL_40_AND_46_SAVES_AND_24_EXACT_PAIRS_NO_DEPLOY','stages':rc,'keepScope':'Two lossless wire savings only; no node gain or terrain seam claim.'})
 for filename,paths in [('B-COMBINED-COMPILED-NORMAL-NO-DEPLOY.zip',graph['publishableCandidates']),('B-COMBINED-AUTHOR-SOURCES-NO-DEPLOY.zip',sorted(REPO_PATHS))]:
  with zipfile.ZipFile(outdir/filename,'w',compression=zipfile.ZIP_DEFLATED)as z:
   for k in paths:z.write(current/k,k)
  out(outdir/(filename+'.json'),{'exactNoDeploy':True,'files':{k:fact((current/k).read_bytes())for k in paths},'zip':fact((outdir/filename).read_bytes())})
if __name__=='__main__': {'pre':pre,'built':built,'seal':seal}[sys.argv[1]](pathlib.Path(sys.argv[2]).resolve())
