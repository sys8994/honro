from pathlib import Path
import json,sys,hashlib
p=Path(sys.argv[1]);gold=json.load(open(Path(__file__).with_name('golden.json')));rows=[]
for view,g in gold['views'].items():
 r=json.load(open(p/f'candidate-{view}.json'));assert r['ok'],r
 assert r['provenance']['ownRegisteredRuntime'] and not r['provenance']['sourceOverrides'];assert r['provenance']['commit']=='dbb25e21e075a495581ddaf8e2c0e615fe2e621e'
 for k in ['terrainRGBA','camera','vectorSHA','sourcePathHashes','width','height','cssWidth','cssHeight','actualDPR']:assert r[k]==g[k],(view,k)
 for suffix,h in g['pngSHA256'].items():
  if not suffix:continue
  assert hashlib.sha256((p/f'candidate-{view}{suffix}.png').read_bytes()).hexdigest()==h,(view,suffix)
 assert r['codecRoundtripExact'] and r['renderPure'] and not r['storage'] and not r['errors']
 assert r['routeRows'] and all(x['route']['nativeLive']==(x['sceneScale']>1.05) and x['route']['sceneScale']==x['sceneScale'] for x in r['routeRows'])
 assert [x['scale'] for x in r['budgetLifecycle']]==[x['scale'] for x in g['lifecycle']]
 stats=r['sceneMaterialStats'];assert stats['totalLogicalBytes']<=48*1024*1024
 if r['camera']['scale']>1.05:
  assert stats['nativeBudget']['admitted']>0 and stats['nativeBudget']['last']['admitted'];assert stats['nativeJunction']['calls']>0;assert stats['transition']['bufferDimensions'][1:]==[[1,1],[1,1]]
  if view!='maximum':assert stats['supersample']['calls']==0
 else:assert stats['nativeBudget']['admitted']==0
 if view=='maximum':
  ls=r['budgetLifecycle'];assert ls[0]['frameHash']==ls[2]['frameHash'] and ls[1]['frameHash']==ls[3]['frameHash'];assert [x['scale'] for x in ls]==[.6,1.65,.6,1.65]
  for i in [0,2]:assert ls[i]['stats']['supersample']['calls']==ls[i+1]['stats']['supersample']['calls'];assert ls[i+1]['stats']['totalLogicalBytes']<=48*1024*1024
 assert r['scaleSummary']['revision']==1 and r['scaleSummary']['tagged']>0
 if view=='gray-left':assert len(r['all50'])==50 and sorted(x['stage'] for x in r['all50'])==list(range(1,51)) and all(x['codecExact'] and x['scaleRevision']==1 for x in r['all50'])
 rows.append({'all50':r.get('all50'),'view':view,'terrainExactGolden':True,'sceneSameAsB':r['sceneRGBA']==g['sceneRGBA'],'physicsSameAsB':r['physicsSha256']==g['physicsSha256'],'scaleSummary':r['scaleSummary'],'codecRoundtripExact':True,'stats':stats})
terrain37=[]
for view in ['3-overview','7-left']:
 a=json.load(open(p/f'baseline-{view}.json'));b=json.load(open(p/f'candidate-{view}.json'));assert a['ok'] and b['ok'],(a,b)
 for k in ['camera','width','height','terrainSHA','sourceSHA','bodyAssetsSHA']:assert a[k]==b[k],(view,k)
 assert all(r['physicalDimensions']==[r['width'],r['height']] and r['fixedVisualClock']==2000 for r in [a,b])
 assert all(r['sourceUnchanged'] and r['battleUnchanged'] and r['actorFreeCloneOnly'] and not r['storage'] and not r['errors'] for r in [a,b])
 sa=hashlib.sha256((p/f'baseline-{view}-terrain-mask.png').read_bytes()).hexdigest();sb=hashlib.sha256((p/f'candidate-{view}-terrain-mask.png').read_bytes()).hexdigest();assert sa==sb,(view,'actorfree terrain differs')
 terrain37.append({'view':view,'actorFreeSceneExact':True,'terrainSHA':a['terrainSHA'],'normalUnitsSame':a['normalUnitsSHA']==b['normalUnitsSHA'],'normalSceneSame':hashlib.sha256((p/f'baseline-{view}.png').read_bytes()).hexdigest()==hashlib.sha256((p/f'candidate-{view}.png').read_bytes()).hexdigest()})
(p/'registered-result.json').write_text(json.dumps({'passed':True,'scope':'Official C runtime; terrain-only5B golden exact. FullScene/units may change due preserved latestmaster scale; reported separately, not waived. Source-only contract preserves3/7/32 art source. No performance/App lifecycle acceptance.','goldenRun':gold['sourceRun'],'commit':'dbb25e21e075a495581ddaf8e2c0e615fe2e621e','rows':rows,'terrain37':terrain37},indent=2));print('PASS registered C terrain five views against B actual golden')
