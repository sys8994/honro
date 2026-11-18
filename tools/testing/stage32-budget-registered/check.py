from pathlib import Path
import json,sys,hashlib
p=Path(sys.argv[1]);gold=json.load(open(Path(__file__).with_name('golden.json')));rows=[]
for view,g in gold['views'].items():
 r=json.load(open(p/f'candidate-{view}.json'));assert r['ok'],r
 assert r['provenance']['ownRegisteredRuntime'] and not r['provenance']['sourceOverrides'];assert r['provenance']['commit']=='fdac97818c09536f5d0057181d04fbd60d48df18'
 for k in ['sceneRGBA','terrainRGBA','camera','physicsSha256','vectorSHA','sourcePathHashes','width','height','cssWidth','cssHeight','actualDPR']:assert r[k]==g[k],(view,k)
 for suffix,h in g['pngSHA256'].items():assert hashlib.sha256((p/f'candidate-{view}{suffix}.png').read_bytes()).hexdigest()==h,(view,suffix)
 assert r['codecRoundtripExact'] and r['renderPure'] and not r['storage'] and not r['errors']
 assert r['routeRows'] and all(x['route']['nativeLive']==(x['sceneScale']>1.05) and x['route']['sceneScale']==x['sceneScale'] for x in r['routeRows'])
 assert [{'scale':x['scale'],'frameHash':x['frameHash']} for x in r['budgetLifecycle']]==g['lifecycle']
 stats=r['sceneMaterialStats'];assert stats['totalLogicalBytes']<=48*1024*1024
 if r['camera']['scale']>1.05:
  assert stats['nativeBudget']['admitted']>0 and stats['nativeBudget']['last']['admitted'];assert stats['nativeJunction']['calls']>0;assert stats['transition']['bufferDimensions'][1:]==[[1,1],[1,1]]
  if view!='maximum':assert stats['supersample']['calls']==0
 else:assert stats['nativeBudget']['admitted']==0
 if view=='maximum':
  ls=r['budgetLifecycle'];assert [x['scale'] for x in ls]==[.6,1.65,.6,1.65]
  for i in [0,2]:assert ls[i]['stats']['supersample']['calls']==ls[i+1]['stats']['supersample']['calls'];assert ls[i+1]['stats']['totalLogicalBytes']<=48*1024*1024
 rows.append({'view':view,'exactGolden':True,'codecRoundtripExact':True,'stats':stats})
(p/'registered-result.json').write_text(json.dumps({'passed':True,'scope':'Official B runtime entries without helper/pilot override; App main entry alone excluded. Registered Scene/source/physics and codec own roundtrip tested, not official App lifecycle/user saves or performance acceptance. Exact5 prior candidate outputs; combined stage3 renderer changes do not affect these Stage32 views.','goldenRun':gold['sourceRun'],'commit':'fdac97818c09536f5d0057181d04fbd60d48df18','rows':rows},indent=2));print('PASS registered B five views against prior actual golden')
