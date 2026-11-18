import json,sys,math,statistics,hashlib
from pathlib import Path
here=Path(__file__).parent;r=Path(sys.argv[1]);cfg=json.loads((here/'config.json').read_text());assert cfg['readyForCI'],'Unpinned preparation cannot execute'
def stats(v):
 s=sorted(v);return dict(n=len(s),median=statistics.median(s),p95=s[math.ceil(.95*len(s))-1],maximum=s[-1])
def read(name,role):
 x=json.loads((r/(name+'.json')).read_text());assert x['ok'],x.get('error');assert not(x['storage'] or x['errors'] or x['violations']);assert x['contract']['ownSaveRoundtripExact'];assert x['provenance']['commit']==cfg['baselineRef'if role=='baseline'else'candidateRef'];assert x['provenance']['helperEntries']==cfg['helperInventory'][role];return x
rows=[];errors=[]
for pose in cfg['poses']:
 a=[read(role+'-'+pose['name']+'-abba-'+str(i),role)for i,role in enumerate(cfg['order'])]
 checks={k:all(x['contract'][k]==a[0]['contract'][k]for x in a)for k in ['stage3SHA','stage3ReferencedAssetsSHA','physicsSHA','stage32SourcePathSHA','stage32SourceClipSHA','stage32PathCount']}
 # Historical other-stage changes are inventory, not attributed to32art; candidate-parent gate is a separate integration obligation.
 for k in ['physicsSHA','stage32SourceClipSHA','stage32PathCount']:
  if not checks[k]:errors.append(pose['name']+':32contract:'+k)
 for k in ['physicsSHA','unitsSHA']:
  if not all(x['initialization'][k]==a[0]['initialization'][k]for x in a):errors.append(pose['name']+':postEngine:'+k)
 if not all(x['camera']==a[0]['camera']for x in a):errors.append(pose['name']+':actualcamera')
 if not checks['stage32SourcePathSHA']:
  proof=cfg.get('sourceRepresentationProof')
  if not proof:errors.append(pose['name']+':independent-current-version-optimizer-proof-missing')
  else:
   data=(here/proof['file']).read_bytes();assert hashlib.sha256(data).hexdigest()==proof['sha256'];q=json.loads(data)
   assert q['baselineRef']==cfg['baselineRef']and q['candidateRef']==cfg['candidateRef']and q['officialOptimizerCloneExact'] is True
   assert q['baselineSourcePathSHA']==a[0]['contract']['stage32SourcePathSHA'] and q['candidateRawSourcePathSHA']==a[1]['contract']['stage32SourcePathSHA']
 costs={}
 for role in ['baseline','candidate']:
  b=[x for x in a if x['variant']==role];ps=[x['performanceReport']for x in b]
  for p in ps:assert [len(p[k])for k in ['cold','warm','pan']]==[5,30,60]
  assert b[0]['contract']==b[1]['contract']and b[0]['initialization']==b[1]['initialization']
  costs[role]={'first':stats([p['firstIncludingLazyPreparation']['ms']for p in ps]),**{k:stats([f['ms']for p in ps for f in p[k]])for k in ['cold','warm','pan']},'helperFinal':[p['pan'][-1]['after']['helper']for p in ps]}
 rows.append(dict(pose=pose['name'],crossVersionChecks=checks,cost=costs))
raf={}
for role in ['baseline','candidate']:
 x=read(role+'-maximum-live-raf',role);p=x['performanceReport'];assert len(p['frames'])==120
 raf[role]={'submit':stats([f['submitMs']for f in p['frames']]),'gaps':stats([f['gapMs']for f in p['frames']if f['gapMs']is not None]),'finalReadbackMs':p['finalReadbackMs'],'endpointRGBA':p['finalRGBA'],'loopMs':p['callbackLoopWallMs']}
out=dict(baselineEvidence=cfg['baselineEvidence'],rows=rows,rAF=raf,errors=errors,performanceAccepted=False,scope='Last-successful-Pages pinned release vs candidate own official builds; not liveHTTP verification. Historical gameplay changes must not be mislabeled32art regressions; failed32match blocks same-map interpretation. No normalized renderer.')
(r/'deployed-baseline-result.json').write_text(json.dumps(out,indent=2));assert not errors,errors
