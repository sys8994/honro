import json,sys,statistics,math
from pathlib import Path
from PIL import Image
r=Path(sys.argv[1]);cfg=json.load(open(Path(__file__).with_name('config.json')));assert cfg['readyForCI'];out=[]
def stat(v):
 s=sorted(v);return {'n':len(s),'median':statistics.median(s),'p95':s[math.ceil(.95*len(s))-1],'max':s[-1]}
for pose in cfg['poses']:
 group=[]
 for i,role in enumerate(cfg['order']):
  row=json.load(open(r/(role+'-'+pose['name']+'-abba-'+str(i)+'.json')));assert row['ok'];assert row['provenance']['commit']==cfg['sourceCommit'];assert row['provenance']['candidateSourceOverride']==(role=='candidate');assert row['provenance']['helperEntries'][0]['sha256']==cfg['candidateHelperSHA256']if role=='candidate'else row['provenance']['helperEntries'][0]['sha256']==cfg['candidateRegisteredHelperSHA256'];assert row['provenance']['pilotSHA256']==(cfg['candidatePilotSHA256']if role=='candidate'else cfg['registeredPilotSHA256']);assert not row['storage']and not row['errors']and not row['violations'];assert row['contract']['ownSaveRoundtripExact'];p=row['performanceReport'];assert[len(p[k])for k in ['cold','warm','pan']]==[5,30,60];group.append(row)
 for row in group:assert row['contract']==group[0]['contract'];assert row['initialization']==group[0]['initialization'];assert row['camera']==group[0]['camera'];assert row['provenance']['originalRuntimeSHA256']==group[0]['provenance']['originalRuntimeSHA256']
 live=group[0]['camera']['scale']>1.05
 ss=lambda f:f['after']['helper']['supersample']['calls']-f['before']['helper']['supersample']['calls']
 native=lambda f:f['after']['helper']['nativeJunction']['calls']-f['before']['helper']['nativeJunction']['calls']
 for row in group:
  p=row['performanceReport'];frames=[p['firstIncludingLazyPreparation'],*p['readinessRenders'],*p['cold'],*p['warm'],*p['pan']]
  if live and row['variant']=='candidate':assert all(ss(f)==0 for f in frames),'Live route ran SS';assert sum(native(f)for f in frames)>0,'No native helper work observed'
  if live and row['variant']=='control':assert sum(ss(f)for f in frames)>0,'Control SS absent'
 if not live:
  for phase in ['cold','warm','pan']:
   signatures=[[ss(f)for f in row['performanceReport'][phase]]for row in group];assert all(v==signatures[0]for v in signatures),'Cached SS route changed'
  images=[Image.open(r/(role+'-'+pose['name']+'-abba-'+str(i)+'.png')).convert('RGBA').tobytes()for i,role in enumerate(cfg['order'])];assert all(x==images[0]for x in images),'Cached final PNG changed'
 variants={}
 for role in ['control','candidate']:
  rows=[x for x in group if x['variant']==role];ps=[x['performanceReport']for x in rows];variants[role]={'first':[p['firstIncludingLazyPreparation']['ms']for p in ps],'cold':stat([f['ms']for p in ps for f in p['cold']]),'warm':stat([f['ms']for p in ps for f in p['warm'][1:]]),'pan':stat([f['ms']for p in ps for f in p['pan']]),'blocks':[{'coldMedian':statistics.median(f['ms']for f in p['cold']),'panMedian':statistics.median(f['ms']for f in p['pan']),'panMax':max(f['ms']for f in p['pan'])}for p in ps]}
 out.append({'pose':pose['name'],'actualCamera':group[0]['camera'],'liveSceneRoute':live,'routeCountersChecked':True,'variants':variants})
(r/'live-route-clean-result.json').write_text(json.dumps({'rows':out,'registeredCandidate':False,'performanceAccepted':False,'scope':'Copied helper/pilot preview clean synchronous Scene cost; live visual acceptance comes from separate actual10view evidence. Not GPU completion/startup/normal lifecycle memory.'},indent=2))
