import json,sys,statistics
from pathlib import Path
from PIL import Image
r=Path(sys.argv[1]);rows=[]
for pose in ['left-tile','phone-min','maximum-live']:
 a=json.load(open(r/('candidate-'+pose+'.json')));b=json.load(open(r/('reuse-'+pose+'.json')))
 for x in [a,b]:assert x['ok'] and not x['storage'] and not x['errors'] and not x['violations'];assert x['contract']['ownSaveRoundtripExact']
 assert a['contract']==b['contract'];assert a['initialization']==b['initialization'];assert a['camera']==b['camera'];assert a['provenance']['originalRuntimeSHA256']==b['provenance']['originalRuntimeSHA256']
 frames=lambda x:[x['performanceReport']['first'],x['performanceReport']['cold'],*x['performanceReport']['pan']]
 exact=[x['rgbaSHA256']==y['rgbaSHA256']for x,y in zip(frames(a),frames(b))]
 png=Image.open(r/('candidate-'+pose+'.png')).convert('RGBA').tobytes()==Image.open(r/('reuse-'+pose+'.png')).convert('RGBA').tobytes()
 times=lambda x:{'first':x['performanceReport']['first']['ms'],'cold':x['performanceReport']['cold']['ms'],'pan':[f['ms']for f in x['performanceReport']['pan']]}
 rows.append({'pose':pose,'firstColdFivePanExact':exact,'finalPNGExact':png,'control':times(a),'reuse':times(b)})
(r/'reuse-result.json').write_text(json.dumps({'rows':rows,'performanceAccepted':False,'scope':'Exactness and hash-readback diagnostic; not clean cost acceptance'},indent=2));assert all(all(x['firstColdFivePanExact'])and x['finalPNGExact']for x in rows),'Reuse changed actual registered output'
