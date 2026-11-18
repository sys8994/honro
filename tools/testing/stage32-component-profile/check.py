import json,sys,hashlib
from pathlib import Path
from PIL import Image,ImageChops
r=Path(sys.argv[1]);out=[]
for pose in ['left-tile','maximum-live']:
 a=json.load(open(r/('candidate-'+pose+'.json')));b=json.load(open(r/('profiled-'+pose+'.json')));base=json.load(open(r/('baseline-'+pose+'.json')));clip=json.load(open(r/('clip-'+pose+'.json')))
 for x in [a,b,base,clip]:assert x['ok'] and not x['storage'] and not x['errors'] and not x['violations'];assert x['contract']['ownSaveRoundtripExact']
 assert a['contract']==b['contract']==clip['contract'];assert a['initialization']==b['initialization']==clip['initialization'];assert a['provenance']['originalRuntimeSHA256']==b['provenance']['originalRuntimeSHA256']==clip['provenance']['originalRuntimeSHA256']
 A=Image.open(r/('candidate-'+pose+'.png')).convert('RGBA');B=Image.open(r/('profiled-'+pose+'.png')).convert('RGBA');exact=A.tobytes()==B.tobytes()
 def delta(f):
  before=f['before']['components'];after=f['after']['components'];return{kind:{key:{v:n-before[kind].get(key,{}).get(v,0)for v,n in row.items()}for key,row in after[kind].items()}for kind in ['functions','canvas']}
 frameHashes=lambda x:[x['performanceReport']['cold']['rgbaSHA256'],*[f['rgbaSHA256']for f in x['performanceReport']['pan']]]
 profileFrameExact=frameHashes(a)==frameHashes(b)
 clipFrameExact=frameHashes(a)==frameHashes(clip)
 frameExact=profileFrameExact and clipFrameExact
 clipPNG=Image.open(r/('clip-'+pose+'.png')).convert('RGBA').tobytes()==A.tobytes()
 out.append({'pose':pose,'allSixColdPanFramesRGBAExact':frameExact,'profileSixFramesRGBAExact':profileFrameExact,'clipSixFramesRGBAExact':clipFrameExact,'clipFinalRGBAExact':clipPNG,'clipFrames':clip['performanceReport'],'controlFrames':a['performanceReport'],'profiledVsUninstrumentedRGBAExact':exact,'cold':delta(b['performanceReport']['cold']),'pan':[delta(f) for f in b['performanceReport']['pan']],'first':delta(b['performanceReport']['first']),'scope':'Counters overlap: function inclusive and canvas totals must not be added; self excludes nested measured calls. Instrumented diagnostic not clean cost.'})
(r/'component-profile-result.json').write_text(json.dumps({'rows':out,'profileExact':all(x['profiledVsUninstrumentedRGBAExact'] and x['profileSixFramesRGBAExact'] for x in out),'clipExact':all(x['clipSixFramesRGBAExact'] and x['clipFinalRGBAExact'] for x in out),'performanceAccepted':False},indent=2));assert all(x['profiledVsUninstrumentedRGBAExact'] and x['allSixColdPanFramesRGBAExact'] and x['clipFinalRGBAExact'] for x in out),'Strict profile or clip RGBA gate failed; inspect independently saved profileExact and clipExact'
