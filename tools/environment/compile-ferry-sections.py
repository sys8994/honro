"""Compile separately authored ferry sections to bounded native paths.
Image reads are offline seam selection only. Runtime assets contain paths only.
"""
from pathlib import Path
from PIL import Image
from scipy.ndimage import gaussian_filter
import numpy as np,json,re,gzip,hashlib,sys
ROOT=Path(__file__).resolve().parents[2]
AUTHOR=ROOT/'game/art-studies/ferry-section-authoring'
DERIVED=ROOT/'_local/reports/ferry-sections'
OUT=ROOT/'shared/assets/environment/ferry-scene'
OUT.mkdir(parents=True,exist_ok=True)
meta=json.loads((AUTHOR/'sections.json').read_text());seams=[]
# Each 2000world plate overlaps the next by 400world. Select a low-error
# material boundary through that overlap, not a rectangular picture edge.
for left,right in zip(meta,meta[1:]):
 a=np.array(Image.open(ROOT/left['source']).convert('RGB'),float);b=np.array(Image.open(ROOT/right['source']).convert('RGB'),float)
 overlap=205;aa=a[:,-overlap:];bb=b[:,:overlap]
 energy=gaussian_filter(np.abs(aa-bb).mean(2),sigma=(3,2))[::4,::2];hh,ww=energy.shape
 energy+=.0015*(np.arange(ww)[None,:]-ww/2)**2
 cost=energy[0].copy();parents=[]
 for row in energy[1:]:
  options=[]
  for delta in range(-2,3):
   v=np.roll(cost,delta)+abs(delta)*.8
   if delta>0:v[:delta]=1e12
   if delta<0:v[delta:]=1e12
   options.append(v)
  options=np.array(options);choice=options.argmin(0);parents.append(np.arange(ww)-(choice-2));cost=row+options.min(0)
 x=int(cost.argmin());xx=[x]
 for par in parents[::-1]:x=int(par[x]);xx.append(x)
 xx=xx[::-1]
 # A short symmetric average eliminates pixel-scale seam wiggles. The
 # resulting source seam is recorded for manual inspection and later edits.
 xx=np.convolve(np.pad(xx,(4,4),mode='edge'),np.ones(9)/9,mode='valid')
 points=[[round(right['worldRect'][0]+(float(x)*2)*2000/1024,2),round(700+y*4*3000/1536,2)]for y,x in enumerate(xx)]
 # Keep one designed-scale bend per 12 native rows (about94world), with no
 # artificial leaf/noise contour added by the joining operation.
 points=points[::12]+[points[-1]]
 seams.append(points)

def packed(d):
 if re.search('[^MLZ0-9, .-]',d):return d
 result=[]
 for body in d.split('Z'):
  if not body:continue
  points=[tuple(map(int,p))for p in re.findall(r'[ML](-?\d+),(-?\d+)',body)]
  if not points:continue
  points=[(x,1560 if y==1536 else y)for x,y in points]
  x,y=points[0];out='M'+str(x)+','+str(y)
  for nx,ny in points[1:]:
   dx,dy=nx-x,ny-y
   candidates=['L'+str(nx)+','+str(ny),'l'+str(dx)+','+str(dy)]
   if not dx:candidates.append('v'+str(dy))
   if not dy:candidates.append('h'+str(dx))
   out+=min(candidates,key=len);x,y=nx,ny
  result.append(out+'Z')
 return ''.join(result)

def side_points(index):
 return [[-1300,700],[-1300,3746.875]] if index<0 else [[5500,700],[5500,3746.875]] if index>=len(seams) else seams[index]
sections=[];stats=[];defs=[];svgparts=[]
for i,item in enumerate(meta):
 f=DERIVED/item['name'];d=json.loads((f/'foreground.json').read_text());paths=[]
 for row in d['paths'][1:]:
  z=list(row['bounds']);z[3]=1560 if z[3]==1536 else z[3]
  paths.append({'fill':row['fill'],'d':packed(row['d']),'bounds':z})
 left=side_points(i-1);right=side_points(i)
 # Extend endpoints for clipping only. Actual path geometry stays bounded.
 left=[[left[0][0],0]]+left+[[left[-1][0],4000]]
 right=[[right[0][0],0]]+right+[[right[-1][0],4000]]
 clip='M'+'L'.join(str(x)+','+str(y)for x,y in left+right[::-1])+'Z'
 x,y,w,h=item['worldRect'];section={'id':item['name'],'origin':[x,y],'scale':2000/1024,'sourceSize':[1024,1536],'coverage':[x,y,x+w,3746.875],'clip':clip,'paths':paths};sections.append(section)
 prov=json.loads((f/'provenance.json').read_text());stats.append({'id':item['name'],'source':item['source'],'sourceSha256':item['sourceSha256'],'sourceSize':item['size'],'worldRect':item['worldRect'],'adultNativeHeight':item['adultNativeHeight'],'sourceBoundaryNodes':prov['boundaryNodes'],'spatialGroups':len(paths),'paletteColors':64,'boundaryErrorNativePixels':.55,'minimumRegionAreaNativePixels':12})
 defs.append('<clipPath id="section-'+str(i)+'"><path d="'+clip+'"/></clipPath>')
 svgparts.append('<g clip-path="url(#section-'+str(i)+')"><g transform="translate('+str(x)+' '+str(y)+') scale('+str(2000/1024)+')">'+''.join('<path fill="'+p['fill']+'" stroke="'+p['fill']+'" stroke-width=".45" stroke-linejoin="round" fill-rule="evenodd" d="'+p['d']+'"/>'for p in paths)+'</g></g>')
scene={'version':2,'kind':'unapproved-four-authored-native-sections','sections':sections,'seams':seams,'coverage':[-1300,700,5500,3746.875],'runtimeRasterReferences':0}
raw=(json.dumps(scene,separators=(',',':'))+'\n').encode();(OUT/'foreground.json').write_bytes(raw)
svg=('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1300 700 6800 3046.875"><defs>'+''.join(defs)+'</defs>'+''.join(svgparts)+'</svg>\n').encode();(OUT/'foreground.svg').write_bytes(svg)
prov={'version':2,'approvedArt':False,'runtimeAcceptance':False,'method':'four separately authored actual-camera sections; shared64material palette; native region boundaries; spatial bounds; exact integer path-command packing; opaque selected overlap boundaries','runtimeRasterReferences':0,'embeddedRasterImages':0,'sections':stats,'geometrySvgSha256':hashlib.sha256(svg).hexdigest(),'geometryJsonSha256':hashlib.sha256(raw).hexdigest(),'rawSvgBytes':len(svg),'gzipSvgBytes':len(gzip.compress(svg,mtime=0)),'rawJsonBytes':len(raw),'gzipJsonBytes':len(gzip.compress(raw,mtime=0)),'coverage':scene['coverage'],'pathPreparation':'once at module load, existing world-tile cache; out-of-view section/group culling','sourcePixelAtNormalZoom':2000/1024*.65,'actualAdultWorldHeight':103.5,'seamMethod':'offline RGB overlap energy with bounded smooth path; no runtime image operation; requires actual pixel review','bottomEdgeContinuationWorld':46.875}
(OUT/'provenance.json').write_text(json.dumps(prov,indent=2)+'\n');print(json.dumps(prov,indent=2))
