import hashlib,json,os,pathlib,re,subprocess,sys,zipfile
D=pathlib.Path(__file__).resolve().parent
P=json.loads((D/'PINS.json').read_bytes())
AUTH={'shared/web-build.mjs','shared/web-loader.js','shared/runtime/profile-store.js'}
M='web/manifest.json'
AUTH.add(P['stage42']['source'])
def blob(b):return hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()
def check(v,e):
 if not v: raise RuntimeError(e)
def fact(b):return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
def obj(p):return json.loads(p.read_bytes())
def write(p,x):p.write_text(json.dumps(x,indent=2)+'\n')
def git(*args,cwd=None):return subprocess.check_output(['git',*args],cwd=cwd,timeout=150)
def pre(w):
 check(P['enabled'] is True and P['publicationAuthority'] and P['publicationAuthority']['head']==P['parent'] and P['publicationAuthority']['conclusion']=='success' and P['publishNever'] and P['notR10'],'Disabled until exact current Pages and root review')
 repo=pathlib.Path(os.environ['GITHUB_WORKSPACE']).resolve();base=P['parent'];h=os.environ['GITHUB_SHA']
 check((os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==('sys8994/honro','push',P['qaRef']),'Wrong fixture ref')
 check(w.is_relative_to(pathlib.Path(os.environ['RUNNER_TEMP']).resolve()) and repo not in w.parents,'Fixture workspace not detached')
 check(git('rev-list','--parents','-1',h).decode().strip()==h+' '+base and git('rev-parse',base+'^{tree}').decode().strip()==P['tree'],'Exact sole parent/tree')
 expected={'.github/workflows/stage32-stage42-combined-qualified.yml'}
 expected.update(f'tools/stage32-joint/{n}' for n in ('PINS.json','observer.json','apply.mjs','guard.py','browser.py','compiled.mjs','old-c60-HONRO.html','profile-candidate.js','resume4046.py','workshop.py'))
 expected.update(f'tools/stage42-joint/{n}' for n in ('PINS.json','RECIPE.b64','bridge.py','capture.py','guard.py','observer.json','resume.py'))
 check(set(git('diff','--no-renames','--name-status',base,h).decode().splitlines())=={'A\t'+s for s in expected},'Wrong eighteen exact add-only QA carrier files')

 for k in 'AB':
  subprocess.run(['git','worktree','add','--detach',str(w/k),base],check=True,timeout=200)
  check(not git('status','--porcelain','-z',cwd=w/k),'unexpected source mutations')
 check(git('rev-parse',base+':'+M).decode().strip()==P['manifestGit'] and git('rev-parse',base+':shared/build.mjs').decode().strip()==P['stage33HotfixSourceGit'],'Stage33 hotfix or base changed')
 check(fact((w/'A'/M).read_bytes())==P['manifestFact'],'released manifest SHA and length differ')
 prev=P['previousAuthority'];ph=w/'H733'
 check(git('rev-parse',prev['head']+'^{tree}').decode().strip()==prev['tree'],'historical 733 tree mismatch')
 check(git('rev-list','--parents','-1',base).decode().split()==[base,'342a7aa03f7244db9663315ceac596f307dac06e'] and git('rev-list','--parents','-1','342a7aa03f7244db9663315ceac596f307dac06e').decode().split()==['342a7aa03f7244db9663315ceac596f307dac06e',prev['head']],'Unexpected release ancestry')
 subprocess.run(['git','worktree','add','--detach',str(ph),prev['head']],check=True,timeout=200)
 check(fact((ph/M).read_bytes())==prev['manifest'] and not git('status','--porcelain','-z',cwd=ph),'historical 733 payload or tree changed')
 h=P['stage33Peer'];m=obj(w/'A'/M)
 old=[x for x in m['publishedGenerations']if x['sourceSha']==h['old']]
 check(len(old)==1,'no exact historic Stage33 generation')
 historic={i['path']:{k:i[k]for k in ('bytes','sha256')}for i in old[0]['files']}
 paths={h[k]for k in ('oldEntry','oldCampaign','oldWrapper','oldPacket','map')}
 check(all(fact((w/'A'/p).read_bytes())==historic[p] for p in paths),'old canonical Stage33 payload not exactly retained')
 shell=(D/'old-c60-HONRO.html').read_bytes()
 check(fact(shell)=={k:h['oldShell'][k]for k in ('bytes','sha256')} and hashlib.sha1(f'blob {len(shell)}\0'.encode()+shell).hexdigest()==h['oldShell']['git'],'old Stage33 published shell pin')
 c=w/'C60';c.mkdir();(c/'HONRO.html').write_bytes(shell)
 for name in ('web','assets'):(c/name).symlink_to(w/'A'/name,target_is_directory=True)
 write(w/'out'/'STAGE33-HISTORIC.json',{p:historic[p]for p in sorted(paths)})
 subprocess.run(['node',str(D/'apply.mjs'),str(w/'A'),str(w/'B'),str(w/'out'/'SOURCE-SCOPE.json')],check=True,timeout=75)
 subprocess.run(['python',str(D.parent/'stage42-joint'/'bridge.py'),'pre',str(w/'A'),str(w/'B'),str(w/'stage42')],check=True,timeout=120)
 check(set(git('diff','--name-status','--no-renames',cwd=w/'B').decode().splitlines())=={'M\t'+p for p in AUTH},'Not only exact four candidate source changes')
 write(w/'out'/'SOURCE-JOINT.json',{p:{'git':blob((w/'B'/p).read_bytes()),**fact((w/'B'/p).read_bytes())}for p in sorted(AUTH)})

def idx(m):return {a['path']:{k:a[k] for k in ('bytes','sha256')}for a in m['files']}
def packet(w,p,expect):
 desc=obj(w/p); check(desc.get('$honroJsonParts')==1 and len(desc['parts'])==2,'missing two real Stage32 pieces')
 leaves=[w/x['path'] for x in desc['parts']]
 b=[t.read_bytes() for t in leaves]
 check(all(fact(x)=={k:z[k] for k in ('bytes','sha256')} for x,z in zip(b,desc['parts'])),'chunk provenance')
 body=b''.join(b);check(fact(body)==expect,'wrong compiled packet bytes')
 paths=[p,*[x['path']for x in desc['parts']]]
 return {'paths':paths,'fact':fact(body),'members':json.loads(body),'logicalHTTPBytes':sum((w/z).stat().st_size for z in paths)}
def peer_leaves(n,desc,encoding):
 if n==33:
  check(encoding=='json' and isinstance(desc,list),'Stage33 unchanged direct plain JSON packet required')
  return []
 if n==21:
  check(encoding=='json-pool-v1' and isinstance(desc,dict) and set(desc)=={'version','nodes','root'} and desc['version']==1 and isinstance(desc['nodes'],list),'Stage21 unchanged direct pooled JSON packet required')
  return []
 count={40:3,46:4}[n]
 check(encoding=='json-pool-v1' and isinstance(desc,dict) and desc.get('$honroJsonParts')==1 and isinstance(desc.get('parts'),list) and len(desc['parts'])==count,f'Stage{n} normal {count} split parts required')
 paths=[r['path']for r in desc['parts']]
 check(all(re.fullmatch(fr'web/data/chapter-{n}-assets-part-{i:03d}\.[0-9a-f]{{16}}\.bin',path)for i,path in enumerate(paths)),f'Stage{n} exact ordered immutable leaves required')
 return paths
def built(w):
 source=obj(w/'out'/'SOURCE-JOINT.json')
 check(set(source)==AUTH and all(blob((w/'B'/p).read_bytes())==v['git'] and fact((w/'B'/p).read_bytes())=={k:v[k]for k in ('bytes','sha256')}for p,v in source.items()),'normal build changed qualified author sources')
 a,b=(obj(w/q/M)for q in 'AB'); ia,ib=idx(a),idx(b)
 ca,cb=(obj(w/q/m['project'])for q,m in [('A',a),('B',b)])
 pa,pb=(packet(w/q,c['stageLibraries'][31],P[z])for q,c,z in [('A',ca,'stock'),('B',cb,'active')])
 arc=cb['compatibility32']; data=(w/'B'/arc).read_bytes();check(fact(data)==P['archive'],'old exact archive bytes not retained')
 check(ca['assetEncodings']['stageLibraries'][31]==cb['assetEncodings']['stageLibraries'][31]=='json','wrong native active JSON return type')
 check(cb['assetEncodings']['compatibility32']=='json' and cb['assetPaths']['compatibility32']==[],'opaque legacy assets must not rehydrate graphics')
 ids=set(P['testedLosslessRefs']);all0=pa['members'];old=[r for r in all0 if r['id'] in ids]
 check(json.loads(data)==old and [r for r in all0 if r['id'] not in ids]==pb['members'],'old identity/order or active shape changed')
 u=P['stage42'];pack42A,pack42B=u['stockPath'],u['activePath']
 check(ca['stages'][41]==cb['stages'][41]==u['map'] and ca['stageLibraries'][41]==pack42A and cb['stageLibraries'][41]==pack42B and fact((w/'A'/pack42A).read_bytes())==u['stock'] and fact((w/'B'/pack42B).read_bytes())==u['active'],'exact signed Stage42 A/B packets expected')
 recon=json.loads(json.dumps(cb));recon['stageLibraries'][41]=pack42A;recon['stageLibraries'][31]=ca['stageLibraries'][31];recon['assetPaths']['stageLibraries'][31]=ca['assetPaths']['stageLibraries'][31]
 for m in [recon,recon['assetEncodings'],recon['assetPaths']]: del m['compatibility32']
 check(ca==recon and ca['stages'][31]==P['map'] and len(ca['stages'])==50,'Other campaign scope changed')
 jsonActive=lambda x:{k:v for k,v in x.items() if not k.endswith(('.js','.html'))}
 fixedA,fixedB=jsonActive(ia),jsonActive(ib)
 for p in pa['paths']+[a['project'],pack42A]:fixedA.pop(p)
 for p in pb['paths']+[b['project'],arc,pack42B]:fixedB.pop(p)
 check(fixedA==fixedB and all(fact((w/'A'/k).read_bytes())==v==fact((w/'B'/k).read_bytes()) for k,v in fixedA.items()),'Unrelated data/media or other 48 packets changed')
 def by_stem(index,folder,stem,suffix='js'):
  p=f'web/{folder}/{stem}.'
  found=[k for k in index if re.fullmatch(re.escape(p)+r'[0-9a-f]{16}\.'+re.escape(suffix),k)]
  check(len(found)==1,f'not one exact slot {stem}');return found[0]
 la_path,lb_path=[by_stem(i,'runtime','load-data')for i in (ia,ib)]
 la,lb=[pathlib.PurePosixPath(k).name.encode()for k in (la_path,lb_path)]
 ca4,cb4=[by_stem(i,'runtime','ordered-common-4')for i in (ia,ib)]
 pta,ptb=[by_stem(i,'runtime','shared-assets-party-party-runtime')for i in (ia,ib)]
 paa,pab=[by_stem(i,'runtime','party-alias')for i in (ia,ib)]
 check(ca4==P['stage32PublishedCommon4'] and [pta,paa]==P['partyPublished'],'wrong stock compiled stage32/specific transitive alias')
 selfnode=subprocess.run(['node',str(D/'compiled.mjs'),str(w/'A'),str(w/'B'),la.decode(),lb.decode(),ca4,cb4,la_path,lb_path],
   check=True,stdout=subprocess.PIPE,text=True,timeout=50)
 ownerProof=json.loads(selfnode.stdout);write(w/'out'/'PROFILE-COMPILATION.json',ownerProof)
 natA,natB=(pathlib.PurePosixPath(k).name.encode()for k in (pta,ptb))
 check((w/'A'/pta).read_bytes().replace(la,lb)==(w/'B'/ptb).read_bytes() and pta!=ptb,'party data module path alone cannot account for delta')
 diagnostic=[]
 for typ in ['common','gameOnly']:
  check(len(a[typ])==len(b[typ]),'compiled scope or ordered module count changed')
  for i,(x,y) in enumerate(zip(a[typ],b[typ])):
   ax=(w/'A'/x).read_bytes();by=(w/'B'/y).read_bytes();want=ax.replace(la,lb);case='loader-or-byte-exact'
   check(fact(ax)==ia[x] and fact(by)==ib[y],f'module manifest fingerprint {x}')
   if b'globalThis.HONRO_PROJECT=await loadCampaign' in ax:
    case='campaign-loader-and-packet-only';want=want.replace(a['project'].encode(),b['project'].encode())
   elif x==ca4:
    case='independent-exact-Terser-profile'
    check(y==cb4 and fact(ax)['sha256']==ownerProof['a'] and fact(by)['sha256']==ownerProof['b'],'exact compiled profile pair not on same ordered slot')
    want=by
   elif x==paa:
    case='actual-narrow-transitive-party-alias'
    check(y==pab and ax.count(natA)==1,'party alias relative target ambiguous')
    want=want.replace(natA,natB)
   diagnostic.append(dict(graph=typ,index=i,a=x,b=y,before=fact(ax),after=fact(by),case=case,exact=want==by))
 write(w/'out'/'COMPILED-SLOTS.json',diagnostic)
 check(all(x['exact'] for x in diagnostic),'unknown compiled delta '+str([x['a']+' → '+x['b'] for x in diagnostic if not x['exact']]))
 check({k:sum(x['case']==k for x in diagnostic)for k in ('independent-exact-Terser-profile','actual-narrow-transitive-party-alias','campaign-loader-and-packet-only')}=={'independent-exact-Terser-profile':1,'actual-narrow-transitive-party-alias':1,'campaign-loader-and-packet-only':1},'known module owners not uniquely observed')
 ra,rb=w/'A',w/'B'
 def stem(k):return re.sub(r'\.[a-f0-9]{16}(?=\.[^.]+$)','',k)
 def jsroles(i):
  ps=[k for k in i if k.endswith(('.js','.html'))]
  z={stem(k):k for k in ps}
  check(len(z)==len(ps),'ambiguous immutable JS/HTML role');return z
 sa,sb=jsroles(ia),jsroles(ib)
 check(sa.keys()==sb.keys(),'unrelated compiled JS/HTML role was added or removed')
 pairs={d['a']:d['b']for d in diagnostic}
 pairs.update({la_path:lb_path,pta:ptb})
 for x,y in pairs.items():
  check(x in ia and y in ib and stem(x)==stem(y),'validated owner changed logical role')
 gp,gw=a['gameEntry'],a['workshopEntry'];gdoc=a['playtest'].split('?')[0]
 bp,bw=b['gameEntry'],b['workshopEntry'];bdoc=b['playtest'].split('?')[0]
 downstream={gp:bp,gw:bw,gdoc:bdoc};data={a['project']:b['project']}
 # All other generated native programs are literal old bytes, or one relative loader import change.
 for key,x in sa.items():
  y=sb[key]
  if x in pairs or x in downstream:continue
  old,new=(ra/x).read_bytes(),(rb/y).read_bytes()
  check(old.replace(la,lb)==new and fact(old)==ia[x] and fact(new)==ib[y],f'unexpected ancillary module {x}')
  pairs[x]=y
 def translate(z,bindings):
  for x,y in bindings.items():
   if x!=y:
    z=z.replace(pathlib.PurePosixPath(x).name.encode(),pathlib.PurePosixPath(y).name.encode())
  return z
 check(translate((ra/gp).read_bytes(),{**pairs,**data})==(rb/bp).read_bytes(),'ordinary game bootstrap wrong graph glue')
 check(translate((ra/gdoc).read_bytes(),{gp:bp})==(rb/bdoc).read_bytes(),'embedded playtest shell wrong active game')
 check(translate((ra/gw).read_bytes(),{**pairs,**data,gdoc:bdoc})==(rb/bw).read_bytes(),'Workshop bootstrap wrong graph glue')
 for name,x,y in [('HONRO.html',gp,bp),('HONRO_WORKSHOP.html',gw,bw)]:
  check(translate((ra/name).read_bytes(),{x:y})==(rb/name).read_bytes(),f'{name} changed outside precise alias')
 check(translate((ra/'index.html').read_bytes(),{gp:bp})==(rb/'index.html').read_bytes(),'index changed outside precise game alias')
 newActive=sorted(ib.keys()-ia.keys());oldActive=sorted(ia.keys()-ib.keys())
 check(len(ib)==len(ia)+1,'only extra active file may be archived Stage32 packet')
 check(all(fact((rb/k).read_bytes())==ib[k] for k in newActive),'emitted added files have wrong digests')
 specs={'activeBefore':len(ia),'activeAfter':len(ib),'newActive':newActive,'retiredActive':oldActive,'publication':'none'}
 write(w/'out'/'ACTIVE-DELTA.json',specs)
 altered=[(ca4,cb4)]
 G={}
 for q,m,c,i,p in [('A',a,ca,ia,pa),('B',b,cb,ib,pb)]:
  G[q]={'active':i,'shell':fact((w/q/'HONRO.html').read_bytes()),'parts':p['paths'],'project':m['project'],'map':c['stages'][31],'legacy':c.get('compatibility32'),'required':[m['project'],m['gameEntry'],c['stages'][31],*p['paths']],'payloadWire':p['logicalHTTPBytes']}
 h=P['stage33Peer']
 for q,m,c in [('A',a,ca),('B',b,cb)]:
  check([c['stages'][32],c['stageLibraries'][32]]==[h['map'],h['newPacket']],'Stage33 current exact required paths')
  G[q]['peer33Required']=[m['project'],m['gameEntry'],h['map'],h['newPacket']]
 outRoutes={}
 for q in ('A','B','H'):
  root=w/('H733' if q=='H' else q);m=obj(root/M);c=obj(root/m['project']);ind=idx(m)
  wrapper=by_stem(ind,'runtime','campaign')
  paths={}
  for n in (21,33,40,46):
   part=c['stageLibraries'][n-1];desc=obj(root/part)
   files=[c['stages'][n-1],part,*peer_leaves(n,desc,c['assetEncodings']['stageLibraries'][n-1])]
   if n in (40,46):
    files += [m['project'],m['gameEntry'],wrapper]
   row={k:fact((root/k).read_bytes())for k in files}
   check(all(v==ind[k]for k,v in row.items()),f'{q} peer exact manifest {n}')
   paths[str(n)]=row
  outRoutes[q]={'routes':paths,'shell':fact((root/'HONRO.html').read_bytes()),'legacy':c.get('compatibility32')}
 write(w/'out'/'RESUME-ROUTES.json',outRoutes)
 for q,m in [('A',a),('B',b)]:
  G[q]['workshop']={'shell':fact((w/q/'HONRO_WORKSHOP.html').read_bytes()),'entry':m['workshopEntry'],'ids':(ca if q=='A' else cb)['libraryOrder']}
 scope={'allOther48StagePacketsAndAll50MapsByteExact':True,'stage33ExistingCompatAndCurrentAStrict':True,'scopedNewProfileStoreSlot':altered,'legacySameAssetArrayInCanonicalOrder':True,'archive':arc,'candidate':'Stage32 stock art byte exact, Stage42 signed partial node only, 33/40/46 unchanged, no R10'}
 write(w/'out'/'GRAPH.json',G);write(w/'out'/'BUILT-SCOPE.json',scope)
 subprocess.run(['python',str(D.parent/'stage42-joint'/'bridge.py'),'graph',str(w/'A'),str(w/'B'),str(w/'H733'),str(w/'stage42')],check=True,timeout=150)
def custody(w):
 root=w/'B';outdir=w/'out';d=obj(outdir/'ACTIVE-DELTA.json');s=obj(outdir/'SOURCE-JOINT.json')
 checks={(outdir/'BROWSER.json'):'PASS_ACTUAL_NORMAL_NEW_AND_SCOPED_OLD_SAVE_NO_DEPLOY',
         (outdir/'WORKSHOP.json'):'PASS_ACTUAL_WORKSHOP_FULL_ORIGINAL_AND_ORDER',
         (outdir/'RESUME-40-46.json'):'PASS_NATIVE_PERSISTED_733_AND_CURRENT_OLD_NEW_PC_M'}
 for c,v in checks.items():check(obj(c)['status']==v,f'QA custody not eligible: {c.name}')
 # Stage42 capture and resume are also required by the successful preceding runner step;
 # recheck and embed exact evidence digests. No fixture profiles are emitted.
 s42=w/'stage42'/'out';names=sorted([s42/'BROWSER.json',*s42.glob('*RESUME*.json')])
 check(len(names)==2 and all(str(obj(n)['status']).startswith('PASS') for n in names),'Stage42 real evidence omitted or failed')
 keep=sorted({*d['newActive'],'HONRO.html','HONRO_WORKSHOP.html','index.html',M,*s})
 files={}
 ma=idx(obj(root/M))
 for k in keep:
  data=(root/k).read_bytes();files[k]={'git':blob(data),**fact(data)}
  if k in ma:check(fact(data)==ma[k],f'custody file disagrees with manifest: {k}')
  if k in s:check(files[k]==s[k],f'custody author bytes changed: {k}')
 total=sum(v['bytes']for v in files.values())
 check(total<50_000_000,'small output-only custody cap exceeded; save receipts, no oversized source export')
 z=outdir/'B-REVIEW-ONLY.zip'
 with zipfile.ZipFile(z,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6)as f:
  for k in keep:f.writestr(k,(root/k).read_bytes())
 row={'status':'QA_REVIEW_ONLY_NO_DEPLOY','sourceHead':P['parent'],'runHead':os.environ['GITHUB_SHA'],'compiledArchive':fact(z.read_bytes()),
      'candidateManifest':files[M],'totalUnpackedTargetFiles':total,'packageFiles':files,'proofs':{str(k.relative_to(w)):fact(k.read_bytes())for k in [*checks,*names]},'published':False}
 write(outdir/'OUTPUT-CUSTODY.json',row)
if __name__=='__main__':
 {'pre':pre,'built':built,'custody':custody}[sys.argv[1]](pathlib.Path(sys.argv[2]).resolve())
