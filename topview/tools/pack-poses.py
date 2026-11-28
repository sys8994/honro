"""Build common-footpoint pose atlases and the bridge's foreground occluder."""
import sys
from pathlib import Path
from PIL import Image
from pose_cells import registered_cells

assets=Path(__file__).resolve().parents[1]/'assets'

def frames(source,columns,rows):
    atlas=Image.open(assets/'source'/source).convert('RGBA')
    alpha=atlas.getchannel('A');hist=alpha.histogram()
    if sum(hist[:35])/sum(hist)<.15:
        raise ValueError(f'{source} has an opaque background')
    result=[]
    for y in range(rows):
        for x in range(columns):
            cell=atlas.crop((round(x*atlas.width/columns),round(y*atlas.height/rows),round((x+1)*atlas.width/columns),round((y+1)*atlas.height/rows)))
            a=cell.getchannel('A');box=a.point(lambda v:255 if v>=96 else 0).getbbox()
            if not box: raise ValueError(f'{source} empty frame {x},{y}')
            cell.putalpha(a.point(lambda v: 0 if v<24 else v));result.append(cell.crop(box))
    return result

def pack(name,parts,columns,width,height,pad):
    scale=min((width-2*pad)/max(p.width for p in parts),(height-2*pad)/max(p.height for p in parts))
    out=Image.new('RGBA',(columns*width,(len(parts)//columns)*height))
    for i,part in enumerate(parts):
        pic=part.resize((max(1,round(part.width*scale)),max(1,round(part.height*scale))),Image.Resampling.LANCZOS)
        x=i%columns*width+(width-pic.width)//2;y=(i//columns+1)*height-pad-pic.height
        out.alpha_composite(pic,(x,y))
    out.save(assets/'actors'/(name+'.webp'),quality=92,method=6)

# These two replacement cells share a scale and a ground anchor. The seven
# other bow directions continue to come from the original atlas.
pack('seolo-bow-ne',frames('seolo-bow-ne.png',2,1),2,160,160,5)
if sys.argv[1:]==['--bow-ne']:raise SystemExit(0)

pack('seolo-states',registered_cells('seolo-states.png'),8,160,160,5)
if sys.argv[1:]==['--seolo-states']:raise SystemExit(0)

for name in ['hound','boar','stag','crow','bat','ghost']:
    source='turns-stag-clean.png' if name=='stag' else 'turns-'+name+'.png'
    poses=frames(source,7,5)
    if name=='stag':
        # Side views show the back and the far hoof line at the same camera pitch as the field.
        side=frames('stag-flank-elevated.png',4,2)[:7]
        factor=poses[14].height/side[0].height
        poses[14:21]=[im.resize((round(im.width*factor),round(im.height*factor)),Image.Resampling.LANCZOS) for im in side]
        rear=frames('stag-rear.png',7,1)
        # Different source canvases: match the neutral pose's anatomical height before packing.
        factor=poses[28].height/rear[0].height
        poses[28:]=[im.resize((round(im.width*factor),round(im.height*factor)),Image.Resampling.LANCZOS) for im in rear]
    pack('turns-'+name,poses,7,144,128,4)
pack('seolo-front',frames('seolo-south-approved-pose.png',4,1),4,144,168,6)
bridge=frames('east-bridge.png',1,1)[0];bridge.thumbnail((720,260),Image.Resampling.LANCZOS)
bridge.save(assets/'props/bridge.png');front=bridge.copy();front.paste((0,0,0,0),(0,0,front.width,round(front.height*.74)));front.save(assets/'props/bridge-near.png')
