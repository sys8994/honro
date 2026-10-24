"""Prepare the four retained far paintings; retired pilot terrain/manifest is history."""
import argparse
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
base=ROOT/'shared/assets/environment/painted-pilots'
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output-dir',type=Path,default=base)
out=parser.parse_args().output_dir;out.mkdir(parents=True,exist_ok=True)
for source,name,size in [
    (ROOT/'shared/assets/environment/location-far/source/mountain-dusk.png','stage1-mountain-dusk',(2048,683)),
    (base/'source/stage18-rear.png','stage18-rear',(1920,768)),
    (base/'source/stage27-rear.png','stage27-rear',(1774,887)),
]:
    im=Image.open(source).convert('RGB').resize(size,Image.Resampling.LANCZOS)
    im.save(out/(name+'.webp'),quality=88,method=6)
im=Image.open(ROOT/'shared/assets/environment/location-far/source/mountain-wet-valley.png').convert('RGB')
im.thumbnail((2048,1024),Image.Resampling.LANCZOS)
im.save(out/'stage2-wet-valley.webp',quality=85,method=6)
print('Prepared 4 retained far paintings in',out)
