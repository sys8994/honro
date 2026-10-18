"""Prepare only approved source paintings; never write campaign gameplay data."""
import json
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[2];base=ROOT/'shared/assets/environment/painted-pilots';src=base/'source';base.mkdir(parents=True,exist_ok=True)
images={}
for key,name,size in [('forestFar','stage1-far',(2048,683)),('bellRear','stage18-rear',(1920,768)),('depotRear','stage27-rear',(1774,887))]:
 im=Image.open(src/(name+'.png')).convert('RGB');im=im.resize(size,Image.Resampling.LANCZOS);file=name+'.webp';im.save(base/file,quality=88,method=6);images[key]=file
forest=Image.open(src/'forest-atlas.png').convert('RGBA')
regions={'pineA':[(0,0),(555,0),(555,330),(455,430),(530,740),(0,740)],'pineB':[(540,90),(1105,90),(1105,740),(555,740),(555,520),(455,450),(455,360),(540,300)],'dead':[(1105,65),(1536,65),(1536,742),(1105,742)],'granite':[(0,742),(532,742),(532,1015),(0,1015)],'log':[(535,745),(1105,745),(1105,1015),(535,1015)],'roots':[(1107,765),(1536,765),(1536,1024),(1107,1024)]}
crops={}
for key,poly in regions.items():
 mask=Image.new('L',forest.size);ImageDraw.Draw(mask).polygon(poly,fill=255);from PIL import ImageChops
 a=ImageChops.multiply(forest.getchannel('A'),mask);box=a.point(lambda p:255 if p>=18 else 0).getbbox();im=forest.copy();im.putalpha(a);im=im.crop(box);file='forest-'+key+'.webp';im.save(base/file,quality=91,method=6);images[key]=file;crops[key]={'sourceBounds':list(box),'width':im.width,'height':im.height}
under=Image.open(src/'underground-atlas.png').convert('RGBA');under.save(base/'underground.webp',quality=90,method=6);images['underground']='underground.webp'
for key,box in [('stone',(65,164,828,395)),('beam',(35,537,959,608))]:
 im=under.crop(box);back=Image.new('RGBA',im.size,'#222c29');back.alpha_composite(im);file=key+'.webp';back.convert('RGB').save(base/file,quality=91,method=6);images[key]=file
patch=forest.crop((650,860,900,912));back=Image.new('RGBA',patch.size,'#3b3629');back.alpha_composite(patch);back.convert('RGB').save(base/'bark.webp',quality=91,method=6);images['bark']='bark.webp'
manifest={'revision':1,'images':images,'forestCrops':crops,'stages':{'1':{'rear':'forestFar','kind':'sky','rockOrigin':1200},'18':{'rear':'bellRear','kind':'world','rect':[-1400,1800,16400,6560],'rockOrigin':4500},'27':{'rear':'depotRear','kind':'world','rect':[-1600,700,11400,5700],'rockOrigin':2400}}}
(base/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print('Prepared',len(images),'runtime images;',sum((base/f).stat().st_size for f in images.values()),'bytes')
