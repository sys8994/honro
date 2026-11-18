import json,glob,statistics,hashlib
from pathlib import Path
R=Path('stage32-whole-cost-chrome');rows=[]
def stat(v):
 s=sorted(v);return {'count':len(v),'median':statistics.median(v),'max':max(v),'p95':s[max(0,__import__('math').ceil(.95*len(s))-1)]}
allr=[]
for pose in ['left-tile','phone-min','maximum-live']:
 out={'pose':pose,'variants':{}};group=[]
 for role in ['baseline','candidate']:
  rr=[json.load(open(f)) for f in sorted(glob.glob(str(R/'evidence'/f'{role}-{pose}-*.json')))];assert len(rr)==2
  for r in rr:assert r['ok'] and not r['storage'] and not r['errors'] and not r['violations'] and r['contract']['ownSaveRoundtripExact'];assert r['initialization']['diff']['count']==20
  group+=rr;allr+=rr;ps=[r['performanceReport'] for r in rr];allframes=[f for p in ps for f in [p['firstIncludingLazyPreparation'],*p['readinessRenders'],*p['cold'],*p['warm'],*p['pan']]]
  out['variants'][role]={'firstMs':[p['firstIncludingLazyPreparation']['ms'] for p in ps],'cold':stat([f['ms'] for p in ps for f in p['cold']]),'warm':stat([f['ms'] for p in ps for f in p['warm'][1:]]),'pan':stat([f['ms'] for p in ps for f in p['pan']]),'perBlock':[{'coldMedian':statistics.median(f['ms'] for f in p['cold']),'panMedian':statistics.median(f['ms'] for f in p['pan']),'panMax':max(f['ms'] for f in p['pan'])}for p in ps],'maxObservedHelperLogicalBytes':max((f['after']['helper']or{}).get('totalLogicalBytes',0)for f in allframes) if role=='candidate' else None,'maxSSPeakLogicalBytes':max((f['after']['helper']or{}).get('supersample',{}).get('peakLogicalBytes',0)for f in allframes) if role=='candidate' else None,'panSSMs':stat([f['after']['helper']['supersample']['ms']-f['before']['helper']['supersample']['ms'] for p in ps for f in p['pan']])if role=='candidate' else None,'runtimeBytes':rr[0]['provenance']['runtimeBytes'],'worldRebuildPanFrames':sum(f['worldRebuilds']>0 for p in ps for f in p['pan'])}
 for key in ['stage3SHA','stage3ReferencedAssetsSHA','physicsSHA','stage32SourceClipSHA','stage32PathCount']:assert len({r['contract'][key] for r in group})==1,key
 for key in ['physicsSHA','unitsSHA']:assert len({r['initialization'][key] for r in group})==1,key
 assert all(r['camera']==group[0]['camera'] for r in group)
 out['rawSourcePathSHAExact']=len({r['contract']['stage32SourcePathSHA'] for r in group})==1;assert not out['rawSourcePathSHAExact'];out['otherContractChecksExact']=True;rows.append(out)
proof=Path('stage32-integration-final-chrome/integration-result.json');p=json.loads(proof.read_text());assert p['passed'] and p['pathRepresentation']['officialOptimizerCloneExact']
result={'run':44261628330,'artifact':14408129369,'artifactSHA256':'59c51dab8f8e39c6c440c0efae738dd0d3313f7cc4fc63028881b77cfcd7b4ee','ciConclusion':'failure: raw source path SHA differs','capturesOK':12,'performanceAccepted':False,'rows':rows,'independentOptimizerProof':{'run':44261966463,'resultFileSHA256':hashlib.sha256(proof.read_bytes()).hexdigest(),'officialOptimizerCloneExact':True,'raw':p['pathRepresentation']['raw'],'optimized':p['pathRepresentation']['optimized'],'scope':'Independent provenance evidence, not raw/optimized rendering cost or visual equivalence. Original cost CI failure retained.'}}
Path('stage32-whole-cost-result/analysis.json').write_text(json.dumps(result,indent=2));print(json.dumps(rows,indent=2))
