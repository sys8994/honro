import json,sys,pathlib,statistics,hashlib,math
root=pathlib.Path(sys.argv[1]);cfg=json.loads((pathlib.Path(__file__).parent/'config.json').read_text());partial=len(sys.argv)>2
rows={p.stem:json.loads(p.read_text()) for p in root.glob('*.json')};errors=[];result={'passed':False,'performanceAccepted':False,'scope':'Paired submission/callback cost, not art acceptance, physical phone FPS or normal lifecycle release','conditions':{}}
def need(v,m):
 if not v:errors.append(m)
def summary(xs):
 xs=sorted(xs);return {'n':len(xs),'median':statistics.median(xs),'p95':xs[max(0,math.ceil(len(xs)*.95)-1)],'max':max(xs)} if xs else None
for p in cfg['poses']:
 groups={v:[r for k,r in rows.items() if k.startswith(v+'-'+p['name']+'-abba-')] for v in ['baseline','candidate']}
 for v,rs in groups.items():
  if not partial:need(len(rs)==2,p['name']+v+' ABBA count')
  for r in rs:
   need(r.get('ok'),p['name']+v+' capture failed');need(not r.get('storage') and not r.get('errors') and not r.get('violations'),'storage/runtime')
   if not r.get('ok'):continue
   need(r['contract']['ownSaveRoundtripExact'],'own codec');need(r['deviceProof']['actualDPR']==p['dpr'],'DPR');need(r['deviceProof']['backing']==[math.floor(p['width']*(min(p['dpr'],1.7) if p['stage'] in [3,7] else p['dpr'])+.5),math.floor(p['height']*(min(p['dpr'],1.7) if p['stage'] in [3,7] else p['dpr'])+.5)],'backing')
   perf=r['performanceReport'];need([len(perf[x]) for x in ['cold','warm','pan']]==[5,30,60],'phase counts')
   need(all(q.get('after',{}).get('helper') is None for q in perf['pan']),'No32 helper injection')
   need(len({(q['camera']['x'],q['camera']['y']) for q in perf['pan']})>30,'Meaningful constrained pan trajectory')
 a,b=groups.values()
 if a and b:
  for r in a+b:
   need(r['initialization']['gameplayPayload']==a[0]['initialization']['gameplayPayload'],p['name']+' gameplay exact')
   need(r['camera']==a[0]['camera'],p['name']+' constrained camera exact')
  if p['stage'] in [7,32]:
   for key in ['sourceStageSHA','referencedAssetsSHA']:need(all(r['contract'][key]==a[0]['contract'][key] for r in a+b),'7/32 '+key+' exact')
   need(all(r['initialization']['afterSHA']==a[0]['initialization']['afterSHA'] for r in a+b),'7/32 full initialized battle exact')
 result['conditions'][p['name']]={}
 for v,rs in groups.items():
  result['conditions'][p['name']][v]={}
  for phase in ['cold','warm','horizontal','vertical']:
   vals=[q['ms'] for r in rs if r.get('ok') for q in r['performanceReport']['pan' if phase in ['horizontal','vertical'] else phase] if phase not in ['horizontal','vertical'] or q['axis']==phase]
   result['conditions'][p['name']][v][phase]=summary(vals)
  result['conditions'][p['name']][v]['logicalCacheLast']=[r['performanceReport']['pan'][-1].get('logicalCache') for r in rs if r.get('ok')]
 if p.get('raf'):
  for v in ['baseline','candidate']:
   r=rows.get(v+'-'+p['name']+'-raf')
   if not partial:need(r is not None,'rAF capture count')
   if r:
    need(r.get('ok'),'rAF capture');f=r['performanceReport']['frames'];need(len(f)==120,'rAF count');result['conditions'][p['name']][v]['rafGap']=summary([q['gapMs'] for q in f if q['gapMs'] is not None]);result['conditions'][p['name']][v]['rafSubmit']=summary([q['submitMs'] for q in f]);need(r['initialization']['gameplayPayload']==groups[v][0]['initialization']['gameplayPayload'],'rAF gameplay')
result['errors']=errors;result['passed']=not errors;result['partial']=partial;(root/('partial-check.json' if partial else 'cost-result.json')).write_text(json.dumps(result,indent=2));print(json.dumps({'passed':not errors,'errors':errors}));sys.exit(bool(errors))
