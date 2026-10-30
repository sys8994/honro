#!/usr/bin/env python3
import json,hashlib
from pathlib import Path
from PIL import Image,ImageDraw
P=Path(__file__).resolve().parents[2]/'art/act4-pilot-common-v1';rows=[];report={'status':'REJECTED CANDIDATE - NOT FOR PRODUCTION','actualGamePlacementVerified':False,'visualApproval':'PENDING ROOT REVIEW','sourceSHA256':hashlib.sha256((P/'source-traced.svg').read_bytes()).hexdigest(),'assets':{}}
for d in sorted((P/'objects').iterdir()):
 qa=json.loads((d/'qa-reduced/comparison.json').read_text());a=json.loads((d/'reduced-asset.json').read_text())
 def walk(n,depth=0):
  yield n,depth
  for c in n.get('children',[]):yield from walk(c,depth+1)
 ns=list(walk(a['vector'])); ps=[n.get('d','') for n,_ in ns if n.get('d')]
 # Runtime schema stores top-level nodes under elements.
 def visit(v,depth=0):
  if isinstance(v,dict):
   if 'tag' in v:yield v,depth
   for k,x in v.items():
    if k in ('root','children'):yield from visit(x,depth+1)
  elif isinstance(v,list):
   for x in v:yield from visit(x,depth)
 ns=list(visit(a['vector']));ps=[n['d'] for n,_ in ns if 'd' in n]
 report['assets'][d.name]={'rawSvgBytes':(d/'raw.svg').stat().st_size,'reducedSvgBytes':(d/'reduced.svg').stat().st_size,'runtimeBytes':(d/'reduced-asset.json').stat().st_size,'rawExpandedCommands':qa['rawStats']['commands'],'reducedExpandedCommands':qa['candidateStats']['commands'],'runtimeNodes':len(ns),'runtimeMaxPathChars':max(map(len,ps),default=0),'runtimeMaxDepth':max((dep for _,dep in ns),default=0),'qualityPass':qa['qualityPass'],'cssErrors':{k:{'silhouette':v['silhouetteMaxOffsetPx']/float(k),'protectedSilhouette':v['protectedSilhouetteMaxOffsetPx']/float(k),'protectedColorEdge':v['protectedColorEdgeMaxOffsetPx']/float(k),'protectedRgbMAE255':v['protectedRgbMAE255']} for k,v in qa['errors'].items()}}
 raw=Image.open(d/'qa-reduced/raw-2x.png').convert('RGBA');raw.thumbnail((600,600));cand=Image.open(d/'qa-reduced/runtime.png').convert('RGBA');row=Image.new('RGB',(1200,max(raw.height,cand.height)+26),'#233744');row.paste(raw,(0,26),raw);row.paste(cand,(600,26),cand);ImageDraw.Draw(row).text((10,5),d.name+' | RAW LEFT / REDUCED RUNTIME RIGHT - REJECTED',fill='white');rows.append(row)
can=Image.new('RGB',(1200,sum(r.height for r in rows)));y=0
for row in rows:can.paste(row,(0,y));y+=row.height
can.save(P/'review-600css.png');(P/'optimization-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
