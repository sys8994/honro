"""Two exact author paths plus one precise Stage42 save guard. No deployment."""
import hashlib, json, os, re, subprocess, sys, zipfile
from pathlib import Path
D=Path(__file__).resolve().parent; P=json.loads((D/'PINS.json').read_bytes())
def need(t,x):
 if not t:raise RuntimeError(x)
def sha(raw):return hashlib.sha256(raw).hexdigest()
def blob(raw):return hashlib.sha1(f'blob {len(raw)}\0'.encode()+raw).hexdigest()
def git(r,*a):return subprocess.check_output(['git','-C',str(r),*a],text=True).strip()
def rd(p):return json.loads(p.read_bytes())
def receipt(path,data):path.write_text(json.dumps(data,indent=2)+'\n')
def apply(root,derived,out):
 orig=P['arms']['B'];p=P['profilePatch']; signed=P['full']['files']
 need(git(root,'rev-parse','HEAD')==orig['head'] and git(root,'rev-parse','HEAD^{tree}')==orig['tree'] and not git(root,'status','--porcelain'),'unsigned worktree')
 recipe=rd(derived/'DERIVATION.json')['candidates']['full']
 need(recipe['signature']==P['full']['signature'] and recipe['files']==signed,'art derivation mismatch')
 fixed='shared/runtime/profile-store.js';target=root/fixed; old=target.read_bytes()
 need(blob(old)==p['beforeGit'] and sha(old)==p['beforeSHA256'],'wrong current profile-store')
 s=old.decode();start=s.index('function mayRestoreStage42CompactedArt(');end=s.index('\n function restoreBattleArt(',start)
 a="['1864834:f80cec75','1858841:5ce4a412']";b="current==='1382117:dec691ec';"
 cut=s[start:end];need(cut.count(a)==cut.count(b)==1,'ambiguous guard scope')
 patched=s[:start]+cut.replace(a,"['1864834:f80cec75','1858841:5ce4a412','1382117:dec691ec']").replace(b,"current==="+repr(P['full']['signature'])+";")+s[end:]
 patchedGuard=patched[start:patched.index('\n function restoreBattleArt(',start)]
 need(patched[:start]==s[:start] and patched[patched.index('\n function restoreBattleArt(',start):]==s[end:] and 'const knownSignature=optimized?.previous===ref.signature||[].concat(optimized?.previousOptimized??[]).includes(ref.signature);' in patched,'non-stage42 code changed')
 need(patchedGuard.replace("['1864834:f80cec75','1858841:5ce4a412','1382117:dec691ec']",a).replace("current==="+repr(P['full']['signature'])+";",b)==cut,'splice not reversible')
 raw=patched.encode();need(blob(raw)==p['afterGit'] and sha(raw)==p['afterSHA256'],'candidate guard differs')
 source={k:s for k,s in signed.items() if k!='packet.qa.json'}
 need(set(source)=={'shared/assets/environment/act5/stage42-near-simplified.json','shared/assets/environment/act5/stage42-surface.json'},'bad author paths')
 for k,v in source.items():
  rawArt=(derived/'full'/k).read_bytes();need(blob(rawArt)==v['git'] and len(rawArt)==v['bytes'] and sha(rawArt)==v['sha256'],'exact author mismatch '+k)
  (root/k).write_bytes(rawArt)
 target.write_bytes(raw)
 need(set(git(root,'diff','--name-status','--no-renames','HEAD').splitlines())=={'M\t'+i for i in [*source,fixed]},'unsigned source changes')
 receipt(out/'SOURCE.json',{'base':orig['head'],'modified':{**source,fixed:p},'rollbackStatus':'UNVERIFIED_BARE_STOCK_REJECTS_SUCCESSOR_SAVE'})
def assert_alias_diff(base,candidate,x,y,aliases):
 raw=(base/x).read_bytes()
 for p,q in aliases:
  raw=raw.replace(p.encode(),q.encode()).replace(p.split('/')[-1].encode(),q.split('/')[-1].encode())
 need(raw==(candidate/y).read_bytes(),'unexpected bytes outside alias fragments '+x)
def exact_route(root,path,active):
 raw=(root/path).read_bytes()
 if path in active:
  need({k:rich(raw)[k] for k in ('bytes','sha256')}=={k:active[path][k] for k in ('bytes','sha256')},'actual browser route not exact wire '+path)
 return raw
def routes(base,candidate,out):
 m=(base/'web/manifest.json').read_bytes(); need(blob(m)==P['arms']['B']['manifestGit'],'wrong pinned stock manifest')
 old=json.loads(m);cand=rd(candidate/'web/manifest.json')
 a=rd(base/old['project']); b=rd(candidate/cand['project'])
 pin=P['arms']['B']; expect=P['full']['files']['packet.qa.json'];packet='web/data/chapter-42-assets.'+expect['sha256'][:16]+'.json'
 need(a['stages'][41]==b['stages'][41]==pin['map'] and a['stageLibraries'][41]==pin['provider'] and b['stageLibraries'][41]==packet,'wrong compiled Stage42 browser binding')
 s40=P['stage40']; need(a['stages'][39]==b['stages'][39]==s40['map'] and a['stageLibraries'][39]==b['stageLibraries'][39]==s40['packet'],'wrong Stage40 browser binding')
 active={x['path']:x for x in cand['files']}
 r=(candidate/packet).read_bytes()
 need(rich(r)==expect and (candidate/pin['map']).read_bytes()==(base/pin['map']).read_bytes(),'wrong exact normal Stage42 wire/map')
 entry=(candidate/cand['gameEntry']).read_bytes()
 loaders=[k for k in cand['common'] if k.startswith('web/runtime/campaign.') and k.split('/')[-1].encode() in entry]
 common=[k for k in cand['common'] if k.startswith('web/runtime/ordered-common-5.')]
 need(len(loaders)==len(common)==1,'ambiguous browser campaign/profile route')
 loader,common5=loaders[0],common[0]
 need(rich((candidate/common5).read_bytes())==P['compiledForward'] and cand['project'].encode() in (candidate/loader).read_bytes(),'wrong selected browser loader/profile')
 stage40={}
 for role in ('packet','map','common12'):
  k=s40[role];raw=exact_route(candidate,k,active)
  need(blob(raw)==s40[role+'Git'] and raw==(base/k).read_bytes(),'wrong protected real Stage40 route '+k);stage40[k]=sha(raw)
 required=[cand['game'],cand['gameEntry'],cand['project'],packet,pin['map'],P['stageFar']['path'],P['stageFar']['config'],loader]
 need(cand['game']=='HONRO.html' and all(k in active for k in [*required[1:],common5,*stage40]),'missing mandatory current browser relative route')
 receipt(out/'BROWSER-ROUTES.json',{'scope':'STRICT_GAME_ROUTES_ONLY_NOT_FULL_RELEASE_GRAPH','packet':packet,'map':pin['map'],
  'routeSHA256':{k:sha(exact_route(candidate,k,active)) for k in required},'stage40ProtectedSHA256':stage40,
  'bootstrapStage40':{common5:sha((candidate/common5).read_bytes()),s40['common12']:stage40[s40['common12']],'campaign':cand['project']},
  'manifestSHA256':sha((candidate/'web/manifest.json').read_bytes())})
def workshop_alias(base,candidate,old,cand,fo,fn,aliases,oldDoc,newDoc,out):
 src='shared/web-build.mjs';srcRaw=(base/src).read_bytes()
 generator=b"const workshopEntry=await bootstrap('workshop',[...common,stageRules,...workshopPilot,editorModule],{playtest:gameDocument+'?embedded=1'});"
 need(blob(srcRaw)==P['buildAuthorityGit'] and srcRaw.count(generator)==1 and srcRaw==(candidate/src).read_bytes(),'actual Workshop generator changed')
 x,y=old['workshopEntry'],cand['workshopEntry']
 ar=exact_route(base,x,fo);br=exact_route(candidate,y,fn)
 oldRaw=exact_route(base,oldDoc,fo);newRaw=exact_route(candidate,newDoc,fn)
 def token(doc):return ('globalThis.HONRO_PLAYTEST_URL="'+doc+'?embedded=1";').encode()
 before,after=token(oldDoc),token(newDoc)
 need(old['playtest']==oldDoc+'?embedded=1' and cand['playtest']==newDoc+'?embedded=1' and oldDoc!=newDoc,'wrong embedded route structure')
 need(oldDoc in fo and newDoc in fn and sha(oldRaw).startswith(oldDoc.split('.')[-2]) and sha(newRaw).startswith(newDoc.split('.')[-2]),'not two exact addressed embedded Game documents')
 test=ar
 for p,q in aliases:test=test.replace(p.encode(),q.encode()).replace(p.split('/')[-1].encode(),q.split('/')[-1].encode())
 bound=test.replace(before,after)
 first=next((i for i,(a,b) in enumerate(zip(bound,br)) if a!=b),min(len(bound),len(br)))
 eq=bound==br
 receipt(out/'WORKSHOP-ALIAS-DIAGNOSTIC.json',{'scope':'EXACT_SAME_JS_AFTER_SIGNED_ALIAS_SUBSTITUTIONS_ONLY','source':rich(srcRaw),
   'old':{'entry':x,'entryFacts':rich(ar),'embed':old['playtest'],'embedFacts':rich(oldRaw),'bindingCount':ar.count(before)},
   'new':{'entry':y,'entryFacts':rich(br),'embed':cand['playtest'],'embedFacts':rich(newRaw),'bindingCount':br.count(after)},
   'bindings':aliases+[[oldDoc+'?embedded=1',newDoc+'?embedded=1']],'withoutEmbeddedAliasExact':test==br,
   'predicted':rich(bound),'exact':eq,
   'remainingDiff':None if eq else {'firstByte':first,'expectedLocalHex':bound[max(0,first-12):first+24].hex(),'observedLocalHex':br[max(0,first-12):first+24].hex()}})
 need(ar.count(before)==1 and br.count(after)==1 and test!=bound and eq,'unexpected non-alias bytes after exact Workshop embedded binding')
def graph(base,candidate,out):
 m=(base/'web/manifest.json').read_bytes()
 need(blob(m)==P['arms']['B']['manifestGit'],'wrong pinned stock full manifest')
 old=json.loads(m);cand=rd(candidate/'web/manifest.json')
 a=rd(base/old['project']);b=rd(candidate/cand['project'])
 need(len(a['stages'])==len(b['stages'])==50 and a['stages']==b['stages'],'physical stage map aliases changed')
 need(all((base/x).read_bytes()==(candidate/x).read_bytes() for x in a['stages']),'physical stage wire maps changed')
 need(len(a['stageLibraries'])==len(b['stageLibraries'])==50 and all(x==y for k,(x,y) in enumerate(zip(a['stageLibraries'],b['stageLibraries'])) if k!=41),'other stage provider aliases changed')
 need({k:v for k,v in a.items() if k!='stageLibraries'}=={k:v for k,v in b.items() if k!='stageLibraries'},'out of scope campaign project fields')
 for k in ('shared/data/terrain-path-optimization.json','shared/terrain-path-optimization.mjs'):
  need((base/k).read_bytes()==(candidate/k).read_bytes(),'unrelated Stage40 scorer source changed '+k)
 fo={x['path']:x for x in old['files']};fn={x['path']:x for x in cand['files']}
 pe=set(fo)&set(fn)
 need(all(fo[k]==fn[k] for k in pe),'same URI changed content')
 need(all((base/k).is_file() and (candidate/k).is_file() and (base/k).read_bytes()==(candidate/k).read_bytes() for k in sorted(pe)),'actual common active file bytes changed')
 for i in ('common','gameOnly'):
  need(len(old[i])==len(cand[i]),'runtime module partition length changed '+i)
 oldset=list(a['stageLibraries']);oldset.pop(41)
 need(all((base/x).read_bytes()==(candidate/x).read_bytes() for x in oldset),'other 49 provider descriptors changed')
 expected=P['full']['files']['packet.qa.json'];packet='web/data/chapter-42-assets.'+expected['sha256'][:16]+'.json'
 need(b['stageLibraries'][41]==packet and b['assetEncodings']['stageLibraries'][41]=='json','wrong new native packet')
 r=(candidate/packet).read_bytes()
 need(len(r)==expected['bytes'] and sha(r)==expected['sha256'] and blob(r)==expected['git'],'normal wire not equal to frozen full arm')
 pin=P['arms']['B']; actual={x:(candidate/x).read_bytes() for x in [cand['game'],cand['gameEntry'],cand['project'],packet,pin['map'],P['stageFar']['path'],P['stageFar']['config']]}
 loader=next((x for x in fn if x.startswith('web/runtime/campaign.') and x.rsplit('.',1)[-1]=='js' and x.split('/')[-1] in actual[cand['gameEntry']].decode()),None)
 need(loader,'candidate entry missing current campaign adapter');actual[loader]=(candidate/loader).read_bytes()
 need(cand['project'] in actual[loader].decode(),'normal campaign adapter does not select active content')
 need(old['gameOnly']==cand['gameOnly'],'game-only runtime changed')
 pairs=[[x,y] for x,y in zip(old['common'],cand['common']) if x!=y]
 oldLoader=P['stockGraph']['loader']['path'];need(rich((base/oldLoader).read_bytes())=={k:v for k,v in P['stockGraph']['loader'].items() if k!='path'},'wrong exact inherited stock campaign loader')
 s5=P['beforeCommon5']; now5=[y for x,y in pairs if x==s5['path']]
 need(len(now5)==1 and len(pairs)==2 and [oldLoader,loader] in pairs,'unexpected common module changes')
 old5=(base/s5['path']).read_bytes();compiled=(candidate/now5[0]).read_bytes()
 need(blob(old5)==s5['git'],'wrong inherited stock compiled profile module')
 a0=b'["1864834:f80cec75","1858841:5ce4a412"]';a1=b'["1864834:f80cec75","1858841:5ce4a412","1382117:dec691ec"]'
 b0=b'current==="1382117:dec691ec"';b1=b'current==="1583179:6d65aa38"'
 start=old5.index(b'function mayRestoreStage42CompactedArt(');end=old5.index(b'function restoreBattleArt(',start)
 cut=old5[start:end]
 need(cut.count(a0)==cut.count(b0)==1 and compiled==old5[:start]+cut.replace(a0,a1).replace(b0,b1)+old5[end:],'compiled profile changed outside exact two Stage42 literals')
 need(rich(compiled)==P['compiledForward'],'compiled profile exact projected Git/SHA differs')
 need((base/oldLoader).read_bytes().replace(old['project'].encode(),cand['project'].encode())==actual[loader],'unrelated campaign loader bytes changed')
 stage40=P['stage40']; stage40files={}
 for t in ('packet','map','common12'):
  k=stage40[t];x=(base/k).read_bytes()
  need(k in fo and k in fn and blob(x)==stage40[t+'Git'] and x==(candidate/k).read_bytes(),'Stage40 active byte audit '+k)
  stage40files[k]=sha(x)
 need(a['stageLibraries'][39]==stage40['packet'] and a['stages'][39]==stage40['map'] and stage40['common12'] in old['common'],'wrong active Stage40 base graph')
 stagePeers={}
 for n,v in P['latestAct5Peers'].items():
  i=int(n)-1;need(a['stages'][i]==v['map'] and a['stageLibraries'][i]==v['packet'],'wrong latest peer route '+n)
  stagePeers[n]={}
  for t in ('map','packet'):
   k=v[t];raw=(base/k).read_bytes();need(blob(raw)==v[t+'Git'] and raw==(candidate/k).read_bytes(),'latest peer changed '+k);stagePeers[n][k]=sha(raw)
 oldL={old['project'], a['stageLibraries'][41],oldLoader,s5['path'],old['gameEntry'],old['workshopEntry'],old['playtest'].split('?')[0]}
 newL={cand['project'],packet,loader,now5[0],cand['gameEntry'],cand['workshopEntry'],cand['playtest'].split('?')[0]}
 for role,pred in P['forwardPredictedActive'].items():
  f=pred['path'];raw=(candidate/f).read_bytes()
  need(rich(raw)=={k:pred[k] for k in ('bytes','sha256','git')},'actual normal output differs from exact predicted closure '+role)
 need(len(oldL)==len(newL)==7 and set(fo)-set(fn)==oldL and set(fn)-set(fo)==newL,'normal active aliases not exact +/-7')
 want={'M\t'+k for k in ('index.html','HONRO.html','HONRO_WORKSHOP.html','web/manifest.json',*rd(out/'SOURCE.json')['modified'])}
 changed=set(git(candidate,'diff','--name-status','--no-renames','HEAD').splitlines())
 # A normal CI build may prune outdated tracked generated aliases in its disposable tree;
 # that deletion list can NEVER become part of the reusable overlay.
 prune=changed-want
 need(want<=changed and all(k.startswith('D\t') and k[2:] in registry(old) for k in prune),'unexpected tracked build edit outside three sources and three shells')
 untracked=set(git(candidate,'ls-files','--others','--exclude-standard').splitlines())
 need(untracked==newL,'unexpected generated additions outside seven active aliases')
 skip={'project','gameEntry','workshopEntry','playtest','common','files','previousFiles','previousGenerations','publishedGenerations'}
 need({k:v for k,v in old.items() if k not in skip}=={k:v for k,v in cand.items() if k not in skip},'other web manifest runtime graph changed')
 aliases=[(oldLoader,loader),(s5['path'],now5[0]),(old['project'],cand['project'])]
 assert_alias_diff(base,candidate,old['gameEntry'],cand['gameEntry'],aliases)
 workshop_alias(base,candidate,old,cand,fo,fn,aliases,old['playtest'].split('?')[0],cand['playtest'].split('?')[0],out)
 for x in ('index.html','HONRO.html','HONRO_WORKSHOP.html'):
  assert_alias_diff(base,candidate,x,x,[(old['gameEntry'],cand['gameEntry']),(old['workshopEntry'],cand['workshopEntry'])])
 assert_alias_diff(base,candidate,old['playtest'].split('?')[0],cand['playtest'].split('?')[0],[(old['gameEntry'],cand['gameEntry'])])
 lane=rd(out/'BROWSER-ROUTES.json');need(lane['routeSHA256']=={k:sha(v) for k,v in actual.items()} and lane['manifestSHA256']==sha((candidate/'web/manifest.json').read_bytes()),'browser route proof not bound to release graph')
 receipt(out/'NORMAL-GRAPH.json',{'status':'PASS_FULL_EXACT_RELEASE_GRAPH','packet':packet,'map':pin['map'],'current':P['full']['signature'],'routeSHA256':{k:sha(v) for k,v in actual.items()},'commonChanged':[[x,y] for x,y in zip(old['common'],cand['common']) if x!=y],'gameOnlyChanged':[[x,y] for x,y in zip(old['gameOnly'],cand['gameOnly']) if x!=y],'other49providerAliasesAnd50MapBytesExact':True,'manifestSHA256':sha((candidate/'web/manifest.json').read_bytes()),'activeAdded':sorted(newL),'activeReplaced':sorted(oldL),'stage40ProtectedSHA256':stage40files,'bootstrapStage40':{now5[0]:sha(compiled),stage40['common12']:stage40files[stage40['common12']],'campaign':cand['project']},'compiledStage42ScopeExact':True,'SixPeerProvidersUnchanged':stagePeers,'normalDisposablePruningExcludedFromOverlay':sorted(prune)})
def rich(b):return dict(bytes=len(b),sha256=sha(b),git=blob(b))
def registry(m):
 result={}
 for rows in [m['files'],m['previousFiles'],*m['previousGenerations'],*(g['files'] for g in m['publishedGenerations'])]:
  seen=set()
  for f in rows:
   k=f['path'];v={h:f[h] for h in ('bytes','sha256')}
   need(k not in seen and re.fullmatch(r'web/(entries|runtime|data|styles|graphics|fonts)/[A-Za-z0-9_.-]+',k) is not None,'unsafe or duplicate registry path '+k)
   seen.add(k);need(k not in result or result[k]==v,'registry collision '+k);result[k]=v
 return result
def seal(base,candidate,out):
 j=rd(out/'READBACK.json');g=rd(out/'NORMAL-GRAPH.json')
 need(j['status']=='PASS_NORMAL_FULL_CURRENT_AND_PRIOR_ACTUAL_CONTINUE_NO_DEPLOY_ROLLBACK_PENDING' and len(j['stage40Continue'])==2,'no active successful browser proof')
 need(g['status']=='PASS_FULL_EXACT_RELEASE_GRAPH' and rd(out/'WORKSHOP-ALIAS-DIAGNOSTIC.json')['exact'] is True and g['other49providerAliasesAnd50MapBytesExact'] and g['compiledStage42ScopeExact'] and g['manifestSHA256']==sha((candidate/'web/manifest.json').read_bytes()),'normal scope not fully proven')
 old=rd(base/'web/manifest.json');cand=rd(candidate/'web/manifest.json');prior=registry(old)
 active={r['path']:r for r in cand['files']};auto=set(g['activeAdded'])
 need(len(auto)==7 and not (auto&prior.keys()),'not entirely new generated aliases')
 for k,v in prior.items():
  p=base/k;need(p.is_file() and p.resolve()==p and not p.is_symlink(),'not a native old file '+k)
  raw=p.read_bytes();need(dict(bytes=len(raw),sha256=sha(raw))==v,'old immutable broken '+k)
 # Do not reuse normal build cleanup. All old URLs remain physically supplied by exact pinned base,
 # original historical generation rows byte-equivalent, and no new publication attestation.
 keep={'previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
 merged={**cand,**{k:old[k] for k in keep}}
 have={r['path'] for r in old['previousFiles']}
 merged['previousFiles']=[*old['previousFiles'],*(dict(path=k,**prior[k]) for k in sorted(prior) if k not in active and k not in have)]
 union={**prior,**{k:{h:active[k][h] for h in ('bytes','sha256')} for k in auto}}
 need(registry(merged)==union and merged['publishedGenerations']==old['publishedGenerations'],'retained overlay has deletes or altered publication attestation')
 results={}
 source=rd(out/'SOURCE.json')['modified']
 for k,v in source.items():
  r=(candidate/k).read_bytes()
  need((rich(r)==v) if 'bytes' in v else (blob(r)==v['afterGit'] and sha(r)==v['afterSHA256']),'unsigned overlay source '+k)
  results[k]=r
 for k in auto:
  r=(candidate/k).read_bytes();need({h:rich(r)[h] for h in ('bytes','sha256')}==union[k],'new candidate alias changed '+k);results[k]=r
 for k in ('index.html','HONRO.html','HONRO_WORKSHOP.html'):
  need((base/k).is_file() and (candidate/k).is_file(),'missing checked shell '+k);results[k]=(candidate/k).read_bytes()
 results['web/manifest.json']=(json.dumps(merged,ensure_ascii=False,indent=2)+'\n').encode()
 z=out/'STAGE42-2C4-REUSABLE-OVERLAY-NO-DEPLOY.zip'
 with zipfile.ZipFile(z,'x',compression=zipfile.ZIP_DEFLATED) as f:
  for k,v in sorted(results.items()):f.writestr(k,v)
 with zipfile.ZipFile(z) as f:
  need(f.testzip() is None and f.namelist()==sorted(results) and all(f.read(k)==v for k,v in results.items()),'bad overlay ZIP')
 receipt(out/'OVERLAY-SEAL.json',{'status':'REUSABLE_NO_DEPLOY_OVERLAY_ZERO_IMMUTABLE_DELETES_PENDING_RELEASE_ATTESTATION','base':P['arms']['B']['head'],'baseManifest':rich((base/'web/manifest.json').read_bytes()),'registryBefore':len(prior),'registryAfter':len(union),'deletes':[],'asYetUnregisteredPublication':P['pages'],'files':{k:rich(v) for k,v in sorted(results.items())},'archive':rich(z.read_bytes())})
if __name__=='__main__':
 need(P['enabled'] is True and os.environ.get('GITHUB_REF')==P['qaRef'] and os.environ.get('GITHUB_REPOSITORY')=='sys8994/honro','disabled; no write or build')
 op,*args=sys.argv[1:]
 need(op in ('apply','routes','graph','seal') and len(args)==3,'normal apply/graph exact inputs')
 {'apply':apply,'routes':routes,'graph':graph,'seal':seal}[op](*[Path(x).resolve()for x in args])
