"""Recover the exact reviewed B 15-file closure and recompute independently the completed R1 cases."""
import hashlib,io,json,re,shutil,statistics,sys,zipfile
from pathlib import Path
from PIL import Image
from guard import P,need,fact,full,git,save,read,idx,M
w=Path(sys.argv[1]).resolve();root=Path(sys.argv[2]).resolve();out=w/'out'
need(P['enabled'] is True,'disabled')
u=P['failedUnion'];raw=read(w,'r1.zip');need(fact(raw)=={k:u[k] for k in ('sha256','bytes')},'wrong R1 bytes')
def zipcheck(z,limit):
 n=z.namelist()
 need(len(n)==len(set(n)) and all(not Path(k).is_absolute() and '..' not in Path(k).parts for k in n) and sum(i.file_size for i in z.infolist())<limit and z.testzip() is None,'unsafe R1 archive/CRC')
def timings(q):
 vals={}
 for x in q['trials']:
  k=(x['device'],x['stage'],x['rep'],x['arm'])
  f=x['firstFrame'];t=x['times']
  need(k not in vals and x['status']=='OBSERVED' and x['nativeReady'] and f['pose']['stage']==x['stage'] and f['pose']['mode']=='campaign' and f['pose']['custom'] is False and f['start']<=f['end'] and all(0<=n<35000 for n in t.values()),'invalid historical actual native draw')
  a=x['arm']=='B';s=x['stage']
  need(x['nativeStage40SourceAndOwner']=={'present':a,'accepted':a and s==40} and x['nativeStage46SourceAndOwner']=={'present':[a]*3,'eligible':s==46},'source/owner timing predicate missing')
  need(abs((t['readyToDrawEnd']-t['readyToDrawStart'])-t['firstDrawCpu'])<1e-5,'invalid R1 native ready timing arithmetic')
  vals[k]=t['readyToDrawEnd']
 expected={(d,s,i,a)for d in P['devices'] for s in (11,40,46) for i in range(1 if s==11 else 3) for a in 'AB'}
 need(set(vals)==expected and len(vals)==28,'not complete 28 historical observed arms')
 ans={}
 for d in P['devices']:
  per={};ans[d]=per;t0=vals[d,11,0,'A'];control=vals[d,11,0,'B']-t0
  for s in (40,46):
   rows=[]
   for i in range(3):
    a,b=vals[d,s,i,'A'],vals[d,s,i,'B'];rows.append([a,b,a-b])
   delta=statistics.median([r[2] for r in rows]);stock=statistics.median([r[0] for r in rows])
   ok=all(r[2]>0 for r in rows) and delta>=max(30,.08*stock,abs(control)) and control<=max(30,.10*t0)
   need(ok,'historical performance did not independently qualify '+str((s,d)))
   per[str(s)]={'paired':rows,'medianDeltaMs':delta,'largestControlShiftMs':control,'firstScreenBenefitQualified':ok}
 return ans
with zipfile.ZipFile(io.BytesIO(raw)) as z:
 zipcheck(z,90<<20);ld=lambda k:json.loads(z.read(k))
 q=ld('ACCEPTANCE.json');g=ld('GRAPH.json');base=ld('BASE-AND-SOURCE.json');c=ld('B-NATIVE-CLOSURE.json');o=g['ordered']
 need(q['status']=='HOLD' and len(q['errors'])==1 and u['error'] in q['errors'][0] and q['rawSaveExported'] is False,'unqualified prior failure kind')
 need(base['head']==u['head'] and base['base']==P['head'] and base['source']==P['source'],'prior signed scope drift')
 need(g['identicalCampaignSlots']==50 and o['status']=='PASS_ONLY_FOUR_SIGNED_SOURCE_MODULES_AND_POINTERS' and {v['file'] for v in o['ops']}==set(P['source']),'prior graph gates absent')
 ts=timings(q);q['timing']=ts
 need(set(q['images'])=={f'{d}-{s}'for d in P['devices']for s in (11,40,46)},'prior 12 actual PNGs missing')
 for k,pair in q['images'].items():
  a,b=pair['A'],pair['B']
  need(a['quiescent'] and b['quiescent'] and a['meta']==b['meta'] and a['rgba']==b['rgba'],'prior actual pixel/state difference '+k)
  for arm,x in pair.items():
   p=z.read(x['file'])
   with Image.open(io.BytesIO(p)) as im:
    need(list(im.size)==x['meta']['backing'] and fact(p)==x['png'] and hashlib.sha256(im.convert('RGBA').tobytes()).hexdigest()==x['rgba'],'prior exact PNG proof mismatch')
 need(set(q['saves'])=={'40','46'} and all(set(v)==set(P['devices']) for v in q['saves'].values()),'prior actual save cases missing')
 for s,devs in q['saves'].items():
  for d,x in devs.items():
   pre=x['saved'] if s=='40' else x['nativeMintedA']
   if s=='46':need(pre==x['nativeMintedB'] and x['openingBeforeAdvanceA']==x['openingBeforeAdvanceB'] and pre['refs']=={'act5:near:46':P['stage46Provider']['current']},'prior exact Stage46 ordinary persistence mismatch')
   need(x['resumeA']==x['resumeB'] and x['resumeA']['actualNativeTitleClick'] is True and x['resumeA']['state']==pre['state'] and bool(x['resumeA']['providers']),'prior ordinary persisted Continue unproven')
 cl=P['closureContract'];fixed={M,*cl['changedStableShells'],*('shared/runtime/'+k for k in P['source'])};aliases=o['addressPairs']
 need(set(aliases)==set(cl['stockActiveAliases'])==set(g['aonly']) and set(aliases.values())==set(g['bonly']) and c['pathCount']==cl['outputCount']==len(c['files']) and set(c['files'])==fixed|set(aliases.values()) and c['shipAuthorized'] is False,'prior exact 15-file custody scope invalid')
 need(all(aliases[k]==v for k,v in cl['runtimeReplacementByStock'].items() if v is not None),'prior known standalone runtime drift')
 data=z.read('B-NATIVE-CLOSURE.zip')
 need(fact(data)==c['archive'],'wrong certified raw B inner archive')
 for side in 'AB':
  git(root,'worktree','add','--detach',str(w/side),P['head'])
 A,B=w/'A',w/'B'
 need(full(read(A,M))==full(read(B,M))==P['manifest'],'wrong exact prior baseline manifest')
 with zipfile.ZipFile(io.BytesIO(data)) as inner:
  zipcheck(inner,24<<20)
  need(set(inner.namelist())==set(c['files']),'extra B restore member')
  for k,digest in c['files'].items():
   b=inner.read(k);need(full(b)==digest,'wrong reproduced B leaf '+k)
   if k in aliases.values():need(fact(b)==g['b']['active'][k],'wrong active alias manifest identity')
   if k.startswith('shared/runtime/'):
    p=P['source'][Path(k).name];need(full(read(A,k))['git']==p['stock'] and digest=={'git':p['candidate'],'sha256':p['sha256'],'bytes':p['bytes']},'wrong raw exact B source')
   into=B/k;need(into.resolve().is_relative_to(B.resolve()) and not into.is_symlink(),'untrusted B leaf')
   into.write_bytes(b)
 for key,side in [('a',A),('b',B)]:
  m=json.loads(read(side,M));h=g[key]
  need(idx(m['files'])==h['active'] and m==h['manifest'],'restored active manifest drift')
  need(fact(read(side,'HONRO.html'))==h['shell'] and fact(read(side,'HONRO_WORKSHOP.html'))==o['workshopShell'][key],'restored shell drift')
  need(all(fact(read(side,k))==v for k,v in h['active'].items()),'physical active file drift')
 diff=set(git(root,'-C',str(B),'status','--porcelain','-uall').splitlines())
 allowed={('?? ' if k in aliases.values() else ' M ')+k for k in c['files']}
 # git() strips leading whitespace from first record, compare normalized lines.
 need({s.strip() for s in diff}=={s.strip() for s in allowed},'restored B checkout differs outside exact 15 observed files')
 common=set(g['a']['active'])&set(g['b']['active']);need(all(g['a']['active'][k]==g['b']['active'][k] for k in common),'restored common profile/data addresses drift')
 project=json.loads(read(A,g['a']['manifest']['project']));dataKeys=project['stages']+project['stageLibraries']
 need(len(dataKeys)==100 and all(k in common for k in dataKeys) and g['a']['manifest']['project']==g['b']['manifest']['project'],'all 50 campaigns failed exact restoration')
 save(out/'R1-RECOMPUTED.json',{'source':u,'r1RemainsFailed':True,'completedHistoricalArms':28,'verifiedHistoricalPNG':12,'priorActualSavePairs':4,'normalBuildRerun':False,'priorScope':base,'timing':ts})
 save(w/'CARRY.json',q)
 for name in ('GRAPH.json','BASE-AND-SOURCE.json','B-NATIVE-CLOSURE.json','B-NATIVE-CLOSURE.zip'):
  (out/name).write_bytes(z.read(name))
