import json,sys,hashlib
from pathlib import Path
from PIL import Image
p=Path(sys.argv[1]);here=Path(__file__).parent;gold=json.load(open(here/'golden.json'));views=json.load(open(here/'views.json'));rows=[]
for v in views:
 n=v['name'];a=json.load(open(p/('candidate-'+n+'.json')));g=gold[n];assert a['ok'],a
 assert a['provenance']['commit']=='af5b77e15accea03470fdfd0c6cb00a0bb12c5e9' and a['provenance']['ownRegisteredRuntime'] and not a['provenance']['sourceOverrides']
 for k in ['camera','width','height','vectorSHA','sourcePathHashes','terrainRGBA']:assert a[k]==g[k],(n,k,a[k],g[k])
 assert a['actualDPR']==v.get('dpr',1) and a['width']==v['width']*a['actualDPR'] and a['height']==v['height']*a['actualDPR']
 assert a['codecRoundtripExact'] and a['renderPure'] and not a['storage'] and not a['errors']
 data=Image.open(p/('candidate-'+n+'-terrain-mask.png')).convert('RGBA').tobytes();assert hashlib.sha256(data).hexdigest()==g['terrainRGBA']
 assert a['routeRows']
 for r in a['routeRows']:assert r['route']['nativeLive']==(r['sceneScale']>1.05) and r['route']['sceneScale']==r['sceneScale']
 life=a['budgetLifecycle']
 if life:
  assert len(life)==4 and life[0]['frameHash']==life[2]['frameHash'] and life[1]['frameHash']==life[3]['frameHash']
  for r in life:assert r['stats']['totalLogicalBytes']<=48*1024*1024
 rows.append({'view':n,'registeredTerrainExact':True,'referenceRun':g['referenceRun'],'actualDPR':a['actualDPR'],'ownCodecExact':True,'normalSceneRGBA':a['sceneRGBA']})
(p/'J-registered-result.json').write_text(json.dumps({'passed':True,'rows':rows,'scope':'Official J registration; terrain goldens from separately identified research runs. FullScene manual visual and current-deployed cost remain separate. All50/optimizer/oldsave separate results.'},indent=2));print(json.dumps(rows))
