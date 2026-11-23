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
 receipt(out/'SOURCE.json',{'base':orig['head'],'modified':{**source,fixed:p},'rollbackStatus':'UNVERIFIED_BARE_3032_REJECTS_SUCCESSOR_SAVE'})
def assert_alias_diff(base,candidate,x,y,aliases):
 raw=(base/x).read_bytes()
 for p,q in aliases:
  raw=raw.replace(p.encode(),q.encode()).replace(p.split('/')[-1].encode(),q.split('/')[-1].encode())
 need(raw==(candidate/y).read_bytes(),'unexpected bytes outside alias fragments '+x)
def graph(base,candidate,out):
 m=(base/'web/manifest.json').read_bytes()
 need(blob(m)==P['arms']['B']['manifestGit'],'wrong 3032 full manifest')
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
 oldLoader='web/runtime/campaign.053c858c8428c726.js'
 s5=P['beforeCommon5']; now5=[y for x,y in pairs if x==s5['path']]
 need(len(now5)==1 and len(pairs)==2 and [oldLoader,loader] in pairs,'unexpected common module changes')
 old5=(base/s5['path']).read_bytes();compiled=(candidate/now5[0]).read_bytes()
 need(blob(old5)==s5['git'],'wrong old c4 compiled profile module')
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
   k=v[t];raw=(base/k).read_bytes();need(blob(raw)==v[t+'Git'] and raw==(candidate/k).read_bytes(),'latest Act5 peer changed '+k);stagePeers[n][k]=sha(raw)
 oldL={old['project'], a['stageLibraries'][41],oldLoader,s5['path'],old['gameEntry'],old['workshopEntry'],old['playtest'].split('?')[0]}
 newL={cand['project'],packet,loader,now5[0],cand['gameEntry'],cand['workshopEntry'],cand['playtest'].split('?')[0]}
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
 for x,y in [(old['gameEntry'],cand['gameEntry']),(old['workshopEntry'],cand['workshopEntry'])]:
  assert_alias_diff(base,candidate,x,y,[(oldLoader,loader),(s5['path'],now5[0]),(old['project'],cand['project'])])
 for x in ('index.html','HONRO.html','HONRO_WORKSHOP.html'):
  assert_alias_diff(base,candidate,x,x,[(old['gameEntry'],cand['gameEntry']),(old['workshopEntry'],cand['workshopEntry'])])
 assert_alias_diff(base,candidate,old['playtest'].split('?')[0],cand['playtest'].split('?')[0],[(old['gameEntry'],cand['gameEntry'])])
 receipt(out/'NORMAL-GRAPH.json',{'packet':packet,'map':pin['map'],'current':P['full']['signature'],'routeSHA256':{k:sha(v) for k,v in actual.items()},'commonChanged':[[x,y] for x,y in zip(old['common'],cand['common']) if x!=y],'gameOnlyChanged':[[x,y] for x,y in zip(old['gameOnly'],cand['gameOnly']) if x!=y],'other49providerAliasesAnd50MapBytesExact':True,'manifestSHA256':sha((candidate/'web/manifest.json').read_bytes()),'activeAdded':sorted(newL),'activeReplaced':sorted(oldL),'stage40ProtectedSHA256':stage40files,'bootstrapStage40':{now5[0]:sha(compiled),stage40['common12']:stage40files[stage40['common12']],'campaign':cand['project']},'compiledStage42ScopeExact':True,'Act5Peer43And50Unchanged':stagePeers,'normalDisposablePruningExcludedFromOverlay':sorted(prune)})
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
 need(g['other49providerAliasesAnd50MapBytesExact'] and g['compiledStage42ScopeExact'] and g['manifestSHA256']==sha((candidate/'web/manifest.json').read_bytes()),'normal scope not fully proven')
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
 z=out/'STAGE42-3032-REUSABLE-OVERLAY-NO-DEPLOY.zip'
 with zipfile.ZipFile(z,'x',compression=zipfile.ZIP_DEFLATED) as f:
  for k,v in sorted(results.items()):f.writestr(k,v)
 with zipfile.ZipFile(z) as f:
  need(f.testzip() is None and f.namelist()==sorted(results) and all(f.read(k)==v for k,v in results.items()),'bad overlay ZIP')
 receipt(out/'OVERLAY-SEAL.json',{'status':'REUSABLE_NO_DEPLOY_OVERLAY_ZERO_IMMUTABLE_DELETES_PENDING_RELEASE_ATTESTATION','base':P['arms']['B']['head'],'baseManifest':rich((base/'web/manifest.json').read_bytes()),'registryBefore':len(prior),'registryAfter':len(union),'deletes':[],'asYetUnregisteredPublication':P['pages'],'files':{k:rich(v) for k,v in sorted(results.items())},'archive':rich(z.read_bytes())})
if __name__=='__main__':
 need(P['enabled'] is True and os.environ.get('GITHUB_REF')==P['qaRef'] and os.environ.get('GITHUB_REPOSITORY')=='sys8994/honro','disabled; no write or build')
 op,*args=sys.argv[1:]
 need(op in ('apply','graph','seal') and len(args)==3,'normal apply/graph exact inputs')
 {'apply':apply,'graph':graph,'seal':seal}[op](*[Path(x).resolve()for x in args])
