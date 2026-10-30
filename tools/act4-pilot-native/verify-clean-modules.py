#!/usr/bin/env python3
"""Actual renderer and main-exterior QA; deliberate seam/palette edits reported separately."""
import json,subprocess,importlib.util,hashlib,xml.etree.ElementTree as E
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import binary_fill_holes,binary_erosion,distance_transform_edt,label
from svgpathtools import parse_path
H=Path(__file__).resolve().parents[1];P=H.parent/'art/act4-pilot-modules-v2';report={'status':'CANDIDATE; root fullmap/camera acceptance pending','sourceNativeSHA256':hashlib.sha256((P/'modules-traced.svg').read_bytes()).hexdigest(),'qaCssWidth':1000,'alphaMetricCaveat':'Raw unstacked microchannels connect interior AA seams to the outside. Largest alpha component boundary distances mix repaired seams with exterior, so large values are NOT a passed external-silhouette metric. Root visual/camera review and exact native-outline provenance remain mandatory.','intentionalArtChanges':['near-duplicate palette pairs merged (max channel delta3)','sub5sourcepx2 minor contours removed','native main exterior opaque underfill, no expanded outside backing'],'assets':{}}
def mainmask(a):
 labs,n=label(a[:,:,3]>=128)
 if not n:return labs.astype(bool)
 sizes=np.bincount(labs.ravel());sizes[0]=0;return binary_fill_holes(labs==sizes.argmax())
def dist(a,b):
 ea=a^binary_erosion(a);eb=b^binary_erosion(b);return max(float(distance_transform_edt(~ea)[eb].max(initial=0)),float(distance_transform_edt(~eb)[ea].max(initial=0)))
def walk(n,depth=0):
 yield n,depth
 for c in n.get('children',[]):yield from walk(c,depth+1)
for name in ['ascending','plateau','descending','overhang']:
 d=P/name;E.register_namespace('','http://www.w3.org/2000/svg');E.ElementTree(E.parse(d/'raw.svg').getroot()).write(d/'qa-reference.svg',encoding='utf-8',xml_declaration=True);asset=json.loads((d/'asset.json').read_text());nodes=list(walk(asset['vector']['root']));ds=[n['d'] for n,_ in nodes if n['tag']=='path'];q={};timings={}
 for scale in [1,2]:
  width=1000*scale
  for kind,src,script in [('raw',d/'qa-reference.svg','render-svg-target.mjs'),('runtime',d/'asset.json','render-asset.mjs')]:
   out=d/f'qa-{kind}-{scale}.png';t=json.loads(subprocess.check_output(['node',str(H/'vector-production'/script),str(src),str(out),str(width)],text=True));timings[f'{kind}-{scale}']=t
  a=np.asarray(Image.open(d/f'qa-raw-{scale}.png').convert('RGBA')).astype(float);b=np.asarray(Image.open(d/f'qa-runtime-{scale}.png').convert('RGBA')).astype(float);ap=a[:,:,:3]*(a[:,:,3:]/255);bp=b[:,:,:3]*(b[:,:,3:]/255);delta=np.maximum(abs(ap-bp),abs(ap+255-a[:,:,3:]-bp-255+b[:,:,3:]));q[str(scale)]={'rasterAlphaBoundaryOffsetCssPxIncludingSeamTopologyChanges':dist(mainmask(a),mainmask(b))/scale,'rgbMAE255IncludingIntentionalPaletteAndSeamRepair':float(delta.mean()),'rawAlphaHolePixels':int(((a[:,:,3]<128)&mainmask(a)).sum()),'runtimeAlphaHolePixels':int(((b[:,:,3]<128)&mainmask(b)).sum())}
 report['assets'][name]={'runtimeBytes':(d/'asset.json').stat().st_size,'nodes':len(nodes),'maxDepth':max(depth for _,depth in nodes),'maxPathChars':max(map(len,ds)),'expandedSegments':sum(len(parse_path(s)) for s in ds),'errors':q,'timings':timings,'contact':json.loads((d/'contact.json').read_text())}
 print(name,q,flush=True)
(P/'verification.json').write_text(json.dumps(report,indent=2)+'\n')
