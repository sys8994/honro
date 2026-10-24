"""Prepare only the retained Stage4 distant painting."""
import argparse
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output-dir',type=Path,default=ROOT/'shared/assets/environment/stage4')
out=parser.parse_args().output_dir;out.mkdir(parents=True,exist_ok=True)
im=Image.open(ROOT/'shared/assets/environment/location-far/source/mountain-still-night.png').convert('RGB')
im.thumbnail((2048,1024),Image.Resampling.LANCZOS)
im.save(out/'still-night.webp',quality=88,method=6)
print('Prepared retained Stage4 far painting in',out)
