import json,sys,statistics,math,hashlib
from pathlib import Path
from PIL import Image
r=Path(sys.argv[1]);cfg=json.load(open(Path(__file__).with_name('config.json')))
assert hashlib.sha256((Path(__file__).with_name('quality-evidence.json')).read_bytes()).hexdigest()==cfg['qualityEvidence']['sha256']
def read(stem):
 x=json.load(open(r/(stem+'.json')));assert x['ok'] and not x['storage'] and not x['errors'] and not x['violations'];assert x['contract']['ownSaveRoundtripExact'];assert x['provenance']['helperEntries'][0]['sha256']==(cfg['controlHelperSHA256']if x['variant']=='control'else cfg['candidateHelperSHA256']);return x
def stat(v):
 s=sorted(v);return {'n':len(s),'median':statistics.median(s),'p95':s[math.ceil(.95*len(s))-1],'max':s[-1]}
rows=[read(role+'-clean-'+str(i))for i,role in enumerate(cfg['order'])];raf=[read(role+'-raf')for role in ['control','candidate']];allrows=rows+raf
for x in allrows:assert x['contract']==rows[0]['contract'];assert x['initialization']==rows[0]['initialization'];assert x['camera']==rows[0]['camera'];assert x['provenance']['originalRuntimeSHA256']==rows[0]['provenance']['originalRuntimeSHA256'];assert x['provenance']['pilotSHA256']==cfg['candidatePilotSHA256']
for x in rows:
 p=x['performanceReport'];assert[len(p[k])for k in ['cold','warm','pan']]==[5,30,60];assert p['pan'][-1]['after']['helper']['supersample']['calls']==0
images=[Image.open(r/(role+'-clean-'+str(i)+'.png')).convert('RGBA').tobytes()for i,role in enumerate(cfg['order'])];withinExact=images[0]==images[3] and images[1]==images[2]
changed=sum(images[0][i:i+4]!=images[1][i:i+4] for i in range(0,len(images[0]),4));alphaChanged=sum(images[0][i]!=images[1][i]for i in range(3,len(images[0]),4));maxDelta=max(abs(a-b)for a,b in zip(images[0],images[1]));rafExact=raf[0]['performanceReport']['finalRGBA']==raf[1]['performanceReport']['finalRGBA'];cost={}
for role in ['control','candidate']:
 ps=[x['performanceReport']for x in rows if x['variant']==role];cost[role]={'first':[p['firstIncludingLazyPreparation']['ms']for p in ps],'cold':stat([f['ms']for p in ps for f in p['cold']]),'warm':stat([f['ms']for p in ps for f in p['warm'][1:]]),'pan':stat([f['ms']for p in ps for f in p['pan']]),'blocks':[{'cold':stat([f['ms']for f in p['cold']]),'pan':stat([f['ms']for f in p['pan']])}for p in ps]}
scheduling={}
for x in raf:
 p=x['performanceReport'];assert len(p['frames'])==120 and p['after']['supersample']['calls']==0;g=[f['gapMs']for f in p['frames']if f['gapMs']is not None];scheduling[x['variant']]={'gapsMs':stat(g),'submitMs':stat([f['submitMs']for f in p['frames']]),'gapsOver50ms':sum(v>50 for v in g),'loopWallMs':p['callbackLoopWallMs'],'finalReadbackMs':p['finalReadbackMs']}
out={'withinVariantCleanExact':withinExact,'crossVariantResetPNG':{'changedPixels':changed,'alphaChanged':alphaChanged,'maxChannelDelta':maxDelta},'rafFinalCrossVariantExact':rafExact,'cost':cost,'rAF':scheduling,'qualityEvidence':cfg['qualityEvidence'],'qualityAccepted':False,'performanceAccepted':False,'scope':'Offline33face copied preview versus8c at maxpose only; lower RGB intentionally differs. Partialforeground/allviews/highDPR and latest deployed comparison pending.'};(r/'combined-result.json').write_text(json.dumps(out,indent=2));assert withinExact and alphaChanged==0,'Repeat/outer alpha regression'
