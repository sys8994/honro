"""Reproducible format/crop preparation of the approved Stage21 paintings.
No synthesis: the four source PNGs remain untouched; gameplay is read only.
"""
import json
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
source=ROOT/'shared/assets/environment/stage21-painted/source'
out=ROOT/'shared/assets/environment/stage21';out.mkdir(parents=True,exist_ok=True)
p=json.loads((ROOT/'shared/data/campaign.json').read_text());stage=p['stages'][20]
atlas=Image.open(source/'architecture-atlas.png').convert('RGBA')
# Remove low-alpha red extraction fringe, preserving the opaque red banners.
pixels=atlas.load()
for yy in range(atlas.height):
 for xx in range(atlas.width):
  r,g,b,a=pixels[xx,yy]
  if a<192 and r>g*1.7 and r>b*1.7:pixels[xx,yy]=(r,g,b,0)
atlas.save(out/'architecture.webp',quality=89,method=6)
wood=atlas.crop((1008,685,1028,783));back=Image.new('RGBA',wood.size,'#342c23');back.alpha_composite(wood);back.convert('RGB').save(out/'timber.webp',quality=90,method=6)
far=Image.open(source/'far-panorama.png');far.resize((2048,683),Image.Resampling.LANCZOS).save(out/'far.webp',quality=86,method=6)
rock=Image.open(source/'bedrock.png');rock.resize((1152,768),Image.Resampling.LANCZOS).save(out/'bedrock.webp',quality=88,method=6)
regions={'gate':(0,55,618,510),'home':(618,225,1130,510),'office':(1130,150,1774,510),'workshop':(0,535,558,850),'awning':(560,535,1070,850),'wall':(1070,590,1774,850)}
# Each selected cell is cropped by actual alpha, not a presumed uniform grid.
crops={}
for key,box in regions.items():
 crop=atlas.crop(box);alpha=crop.getchannel('A').point(lambda v:255 if v>=32 else 0);b=alpha.getbbox();crops[key]=[box[0]+b[0],box[1]+b[1],b[2]-b[0],b[3]-b[1]]
manifest={'revision':2,'referenceLibraryId':'libfile_2af54b6333c88191913f28c61eb1800e','sourceLibraryIds':{'sky':'libfile_a93e2070e394819192b020069277c8cd','architecture':'libfile_dcad615ed3dc819186fa4ca5f339a79f','bedrock':'libfile_eb051213649081919a8eb09b25a94c8e'},'images':{'sky':'far.webp','architecture':'architecture.webp','bedrock':'bedrock.webp'},'sky':'sky','rock':'bedrock','rockTileSize':[1728,1152],'alphaCrops':crops,'elements':{}}
elements=manifest['elements'];placements={e['id']:e for e in stage['elements']}
manifest['images']['timber']='timber.webp'
def part(crop,target):return {'image':'architecture','source':crop,'target':target}
def tops(crop,n=128):
 x,y,w,h=crop;a=atlas.getchannel('A');v=[]
 for i in range(n):
  b=a.crop((x+w*i//n,y,x+max(w*(i+1)//n,w*i//n+1),y+h)).point(lambda z:255 if z>=40 else 0).getbbox();v.append(b[1] if b else 0)
 return v
def roofhouse(id,kind):
 inst=placements[id];t=next(t for t in stage['terrains'] if t['id']=='eup21-'+id+'-roof');pts=t['points'][:len(t['points'])//2];top=[[round(v['x']-inst['x'],4),round(v['y']-inst['y'],4)] for v in pts];left=top[0][0];right=top[-1][0];high=min(v[1] for v in top);crop=crops[kind];q=part(crop,[left,high,right-left,-high]);q.update(roof=top,sourceTop=tops(crop),sourceEave={'home':125,'workshop':132,'office':145,'awning':145}[kind],eaveTarget=top[0][1]+(17 if kind=='office' else 30));elements['eup21:'+id]={'parts':[q]}
for id,kind in [('outside-stall','workshop'),('cloth-shelter','awning'),('inner-home','home'),('potter-home','workshop'),('stable','workshop'),('office-store','workshop'),('office-hall','office')]:roofhouse(id,kind)
# Side kitchen has no walkable roof and keeps its aspect ratio.
crop=crops['workshop'];width=216;height=width*crop[3]/crop[2];elements['eup21:office-side-bay']={'parts':[part(crop,[-108,-height,216,height])]}
# Gate's timber pavilion has the actual roof contour. Masonry is split around
# its transparent arch so wall width never dictates the portal width.
inst=placements['gate'];t=next(t for t in stage['terrains'] if t['id']=='eup21-gate-roof');top=[[v['x'],v['y']] for v in t['points'][:len(t['points'])//2]];high=min(v[1] for v in top)
gateTop=[84,89,466,212];q=part(gateTop,[top[0][0],high,top[-1][0]-top[0][0],2240-high]);q.update(roof=top,sourceTop=tops(gateTop),sourceEave=120,eaveTarget=2049)
parts=[q]
for a,z,l,r in [(17,251,2017,2130),(251,384,2130,2424),(384,617,2424,2543)]:
 for sy,ey,yy,zz in [(300,349,2240,2338),(349,498,2338,2560)]:parts.append(part([a,sy,z-a,ey-sy],[l,yy,r-l,zz-yy]))
# Keep the exact open arch free of opaque painting at all camera scales.
elements['eup21:gate']={'parts':parts,'cutout':'M2130 2565 L2130 2466 Q2130 2338 2277 2338 Q2424 2338 2424 2466 L2424 2565 Z'}
# Existing low walls follow their original terrain; their capped opening is
# omitted when a continuous boundary is needed.
def ground(x):
 t=next(t for t in stage['terrains'] if t['id']=='a3-foundation');pts=t['points']
 for a,b in zip(pts,pts[1:]):
  if a['x']<=x<=b['x'] and b['x']>a['x']:return a['y']+(b['y']-a['y'])*(x-a['x'])/(b['x']-a['x'])
 return 2810 if x<0 else 2220
def wall(l,r,h):
 crop=[1086,664,294,160];q=part(crop,[l,min(ground(l),ground(r))-h,r-l,h+abs(ground(l)-ground(r))]);q.update(roof=[[l,ground(l)-h],[r,ground(r)-h]],bottom=[[l,ground(l)],[r,ground(r)]],sourceTop=tops(crop));return q
for id,l,r in [('market-yard',3290,3420),('office-court',5630,5900)]:
 # A single side of the wall atlas avoids inventing a door across the street.
 elements['eup21:'+id]={'parts':[wall(l,r,100)]}
parts=[]
for l,r,h in [(3260,3460,87),(3740,4050,106),(4450,4700,74),(4960,5150,88),(5550,5890,82)]:
 # Keep the original low wall profile, using repeated architectural material
 # only where a wall already exists; no new route or apparent platform.
 parts.append(wall(l,r,h))
elements['eup21:market-alley']={'parts':parts}
manifest['materialElements']={}
for id in ['eup21:inner-earth','eup21:office-plinth']:
 a=next(a for a in p['library'] if a['id']==id)
 manifest['materialElements'][id]=[v['d'] for v in a['vector']['root']['children'] if v.get('tag')=='path' and v.get('fill','none')!='none']
manifest['joinery']={}
for inst in stage['elements']:
 id=inst['assetId']
 if id.startswith('eup21:') and any(v in id for v in ['-step','-awning','-eave','loading-deck','deck-crate','cart']):
  a=next(a for a in p['library'] if a['id']==id)
  manifest['joinery'][id]=[v['d'] for v in a['vector']['root']['children'] if v.get('tag')=='path' and v.get('fill','none')!='none']
# The former large green rear fill becomes locally grounded painted rock.
# Real one-way steps and brace connections remain the existing editable SVG.
manifest['roofTerrainIds']=['eup21-'+id+'-roof' for id in ['outside-stall','cloth-shelter','inner-home','potter-home','stable','office-store','office-hall','gate']]
(out/'painted.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'crops':crops,'runtimeBytes':{f.name:f.stat().st_size for f in out.glob('*.webp')},'paintedElements':len(elements)},ensure_ascii=False))
