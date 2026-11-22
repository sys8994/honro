import hashlib,json,os,pathlib,re,subprocess,sys
D=pathlib.Path(__file__).resolve().parent
P=json.loads((D/'PINS.json').read_bytes())
AUTH={'shared/web-build.mjs','shared/web-loader.js','shared/runtime/profile-store.js'}
M='web/manifest.json'
def check(v,e):
 if not v: raise RuntimeError(e)
def fact(b):return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
def obj(p):return json.loads(p.read_bytes())
def write(p,x):p.write_text(json.dumps(x,indent=2)+'\n')
def git(*args,cwd=None):return subprocess.check_output(['git',*args],cwd=cwd,timeout=150)
def pre(w):
 check(P['enabled'] is True and P['publicationAuthority'] and P['notR10'],'Disabled until exact current Pages and root review')
 repo=pathlib.Path(os.environ['GITHUB_WORKSPACE']).resolve();base=P['parent'];h=os.environ['GITHUB_SHA']
 check((os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==('sys8994/honro','push',P['qaRef']),'Wrong fixture ref')
 check(w.is_relative_to(pathlib.Path(os.environ['RUNNER_TEMP']).resolve()) and repo not in w.parents,'Fixture workspace not detached')
 check(git('rev-list','--parents','-1',h).decode().strip()==h+' '+base and git('rev-parse',base+'^{tree}').decode().strip()==P['tree'],'Exact sole parent/tree')
 adds={'.github/workflows/stage32-lazy-exact.yml',*(f'tools/stage32-lazy/{i}' for i in ('PINS.json','observer.json','apply.mjs','guard.py','browser.py'))}
 check(set(git('diff','--no-renames','--name-status',base,h).decode().splitlines())=={'A\t'+s for s in adds},'Not six exact add-only QA carrier files')
 for k in 'AB':
  subprocess.run(['git','worktree','add','--detach',str(w/k),base],check=True,timeout=200)
  check(not git('status','--porcelain','-z',cwd=w/k),'unexpected source mutations')
 check(git('rev-parse',base+':'+M).decode().strip()==P['manifestGit'] and git('rev-parse',base+':shared/build.mjs').decode().strip()==P['stage33HotfixSourceGit'],'Stage33 hotfix or base changed')
 subprocess.run(['node',str(D/'apply.mjs'),str(w/'A'),str(w/'B'),str(w/'out'/'SOURCE-SCOPE.json')],check=True,timeout=75)
 check(set(git('diff','--name-status','--no-renames',cwd=w/'B').decode().splitlines())=={'M\t'+p for p in AUTH},'Not only the 3 locked Stage32 candidate sources')
def idx(m):return {a['path']:{k:a[k] for k in ('bytes','sha256')}for a in m['files']}
def packet(w,p,expect):
 desc=obj(w/p); check(desc.get('$honroJsonParts')==1 and len(desc['parts'])==2,'missing two real Stage32 pieces')
 leaves=[w/x['path'] for x in desc['parts']]
 b=[t.read_bytes() for t in leaves]
 check(all(fact(x)=={k:z[k] for k in ('bytes','sha256')} for x,z in zip(b,desc['parts'])),'chunk provenance')
 body=b''.join(b);check(fact(body)==expect,'wrong compiled packet bytes')
 paths=[p,*[x['path']for x in desc['parts']]]
 return {'paths':paths,'fact':fact(body),'members':json.loads(body),'logicalHTTPBytes':sum((w/z).stat().st_size for z in paths)}
def built(w):
 a,b=(obj(w/q/M)for q in 'AB'); ia,ib=idx(a),idx(b)
 ca,cb=(obj(w/q/m['project'])for q,m in [('A',a),('B',b)])
 pa,pb=(packet(w/q,c['stageLibraries'][31],P[z])for q,c,z in [('A',ca,'stock'),('B',cb,'active')])
 arc=cb['compatibility32']; data=(w/'B'/arc).read_bytes();check(fact(data)==P['archive'],'old exact archive bytes not retained')
 check(ca['assetEncodings']['stageLibraries'][31]==cb['assetEncodings']['stageLibraries'][31]=='json','wrong native active JSON return type')
 check(cb['assetEncodings']['compatibility32']=='json' and cb['assetPaths']['compatibility32']==[],'opaque legacy assets must not rehydrate graphics')
 ids=set(P['testedLosslessRefs']);all0=pa['members'];old=[r for r in all0 if r['id'] in ids]
 check(json.loads(data)==old and [r for r in all0 if r['id'] not in ids]==pb['members'],'old identity/order or active shape changed')
 recon=json.loads(json.dumps(cb));recon['stageLibraries'][31]=ca['stageLibraries'][31];recon['assetPaths']['stageLibraries'][31]=ca['assetPaths']['stageLibraries'][31]
 for m in [recon,recon['assetEncodings'],recon['assetPaths']]: del m['compatibility32']
 check(ca==recon and ca['stages'][31]==P['map'] and len(ca['stages'])==50,'Other campaign scope changed')
 jsonActive=lambda x:{k:v for k,v in x.items() if not k.endswith(('.js','.html'))}
 fixedA,fixedB=jsonActive(ia),jsonActive(ib)
 for p in pa['paths']+[a['project']]:fixedA.pop(p)
 for p in pb['paths']+[b['project'],arc]:fixedB.pop(p)
 check(fixedA==fixedB and all(fact((w/'A'/k).read_bytes())==v==fact((w/'B'/k).read_bytes()) for k,v in fixedA.items()),'Unrelated data/media or other 49 packets changed')
 def one_loader(index):
  x=[k for k in index if re.fullmatch(r'web/runtime/load-data\.[0-9a-f]{16}\.js',k)]
  check(len(x)==1,'not one loader alias');return pathlib.PurePosixPath(x[0]).name.encode()
 la,lb=one_loader(ia),one_loader(ib)
 altered=[]
 for typ in ['common','gameOnly']:
  check(len(a[typ])==len(b[typ]),'compiled scope or ordered module count changed')
  for i,(x,y) in enumerate(zip(a[typ],b[typ])):
   ax=(w/'A'/x).read_bytes();by=(w/'B'/y).read_bytes()
   exceptLoader=ax.replace(la,lb)
   if relProject:= (b'globalThis.HONRO_PROJECT=await loadCampaign' in ax):
    check(exceptLoader.replace(a['project'].encode(),b['project'].encode())==by,'campaign adapter changed beyond routes');continue
   if exceptLoader!=by:
    check(typ=='common' and b'needsLegacy33Art' in ax and b'needsLegacy34Art' in ax and b'needsLegacy32Art' in by and b'verifyLegacy32Assets' in by,'unrelated runtime beyond loader and exact profile store ownership')
    altered.append((i,x,y))
 check(len(altered)==1,'expected one scoped profile-store owner difference')
 G={}
 for q,m,c,i,p in [('A',a,ca,ia,pa),('B',b,cb,ib,pb)]:
  G[q]={'active':i,'shell':fact((w/q/'HONRO.html').read_bytes()),'parts':p['paths'],'project':m['project'],'map':c['stages'][31],'legacy':c.get('compatibility32'),'required':[m['project'],m['gameEntry'],c['stages'][31],*p['paths']],'payloadWire':p['logicalHTTPBytes']}
 scope={'allOther49MapsAndAssetBytesExact':True,'stage33ExistingCompatAndCurrentAStrict':True,'scopedNewProfileStoreSlot':altered,'legacySameAssetArrayInCanonicalOrder':True,'archive':arc,'candidate':'exact B stock art only, not R10'}
 write(w/'out'/'GRAPH.json',G);write(w/'out'/'BUILT-SCOPE.json',scope)
if __name__=='__main__':
 {'pre':pre,'built':built}[sys.argv[1]](pathlib.Path(sys.argv[2]).resolve())
