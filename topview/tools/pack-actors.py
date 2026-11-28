"""Retain one scale for the walk cycle and preserve relative stride heights."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]/'assets'
source=Image.open(root/'source/seolo.png').convert('RGBA')
frame_w,frame_h=144,168
sheet=Image.new('RGBA',(4*frame_w,8*frame_h))
for row in range(8):
    cells=[]
    for col in range(4):
        cell=source.crop((col*source.width//4,row*source.height//8,(col+1)*source.width//4,(row+1)*source.height//8))
        alpha=cell.getchannel('A')
        box=alpha.point(lambda n:255 if n>45 else 0).getbbox()
        if not box:raise ValueError((col,row))
        cell.putalpha(alpha.point(lambda n:0 if n<10 else n))
        cells.append((cell,box))
    center=sum((b[0]+b[2])/2 for _,b in cells)/4
    base=sorted(b[3] for _,b in cells)[2]
    for col,(cell,box) in enumerate(cells):
        image=cell.crop(box)
        image=image.resize((round(image.width*.82),round(image.height*.82)),Image.Resampling.LANCZOS)
        sheet.alpha_composite(image,(round((col+.5)*frame_w+(box[0]-center)*.82),round((row+1)*frame_h-5+(box[1]-base)*.82)))
sheet.save(root/'actors/seolo.webp',quality=94,method=6)
source=Image.open(root/'source/pass-cast.png').convert('RGBA')
for idx,name in enumerate(['hound','boar','stag','crow','bat','ghost','cart','woodcutter']):
    col,row=idx%4,idx//4
    cell=source.crop((col*source.width//4,row*source.height//2,(col+1)*source.width//4,(row+1)*source.height//2))
    alpha=cell.getchannel('A');box=alpha.point(lambda n:255 if n>70 else 0).getbbox()
    cell.putalpha(alpha.point(lambda n:0 if n<15 else n))
    sprite=cell.crop(box);sprite.thumbnail((300,300),Image.Resampling.LANCZOS);sprite.save(root/f'actors/{name}.webp',quality=92)
