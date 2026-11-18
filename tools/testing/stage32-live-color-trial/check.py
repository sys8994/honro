import json,sys,statistics,math
from pathlib import Path
from PIL import Image
r=Path(sys.argv[1]);cfg=json.load(open(Path(__file__).with_name('config.json')))
def read(stem):
 x=json.load(open(r/(stem+'.json')));assert x['ok'] and not x['storage'] and not x['errors'] and not x['violations'];assert x['contract']['ownSaveRoundtripExact'];assert x['provenance']['helperEntries'][0]['sha256']==(cfg['controlHelperSHA256']if x['variant']=='control'else cfg['candidateHelperSHA256']);return x
def stat(v):
 s=sorted(v);return {'n':len(s),'median':statistics.median(s),'p95':s[math.ceil(.95*len(s))-1],'max':s[-1]}
rows=[read(role+'-clean-'+str(i))for i,role in enumerate(cfg['order'])];hashrows=[read(role+'-hash')for role in ['control','candidate']];raf=[read(role+'-raf')for role in ['control','candidate']];allrows=rows+hashrows+raf
for x in allrows:assert x['contract']==rows[0]['contract'];assert x['initialization']==rows[0]['initialization'];assert x['camera']==rows[0]['camera'];assert x['provenance']['originalRuntimeSHA256']==rows[0]['provenance']['originalRuntimeSHA256'];assert x['provenance']['pilotSHA256']==cfg['candidatePilotSHA256']
for x in rows:
 p=x['performanceReport'];assert[len(p[k])for k in ['cold','warm','pan']]==[5,30,60];assert p['pan'][-1]['after']['helper']['supersample']['calls']==0
images=[Image.open(r/(role+'-clean-'+str(i)+'.png')).convert('RGBA').tobytes()for i,role in enumerate(cfg['order'])];finalExact=all(x==images[0]for x in images)
hashes=lambda x:[x['performanceReport']['first']['rgbaSHA256'],x['performanceReport']['cold']['rgbaSHA256'],*[f['rgbaSHA256']for f in x['performanceReport']['pan']]]
shortExact=hashes(hashrows[0])==hashes(hashrows[1]);rafExact=raf[0]['performanceReport']['finalRGBA']==raf[1]['performanceReport']['finalRGBA'];cost={}
for role in ['control','candidate']:
 ps=[x['performanceReport']for x in rows if x['variant']==role];cost[role]={'first':[p['firstIncludingLazyPreparation']['ms']for p in ps],'cold':stat([f['ms']for p in ps for f in p['cold']]),'warm':stat([f['ms']for p in ps for f in p['warm'][1:]]),'pan':stat([f['ms']for p in ps for f in p['pan']]),'blocks':[{'cold':stat([f['ms']for f in p['cold']]),'pan':stat([f['ms']for f in p['pan']])}for p in ps]}
scheduling={}
for x in raf:
 p=x['performanceReport'];assert len(p['frames'])==120 and p['after']['supersample']['calls']==0;g=[f['gapMs']for f in p['frames']if f['gapMs']is not None];scheduling[x['variant']]={'gapsMs':stat(g),'submitMs':stat([f['submitMs']for f in p['frames']]),'gapsOver50ms':sum(v>50 for v in g),'loopWallMs':p['callbackLoopWallMs'],'finalReadbackMs':p['finalReadbackMs']}
out={'cleanFinalExact':finalExact,'shortFirstColdPan5Exact':shortExact,'rafFinalExact':rafExact,'cost':cost,'rAF':scheduling,'performanceAccepted':False,'scope':'Maxpose only; clean4page ABBA separated from2hash+2rAF pages. Not phone FPS or full quality acceptance.'};(r/'combined-result.json').write_text(json.dumps(out,indent=2));assert finalExact and shortExact and rafExact,'Combined changed actual pixels'
