"""Prepare only the retained Stage21 far panorama; retired painted geometry is history."""
import argparse
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
source=ROOT/'shared/assets/environment/stage21-painted/source/far-panorama.png'
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output-dir',type=Path,default=ROOT/'shared/assets/environment/stage21')
out=parser.parse_args().output_dir;out.mkdir(parents=True,exist_ok=True)
far=Image.open(source)
far.resize((2048,683),Image.Resampling.LANCZOS).save(out/'far.webp',quality=86,method=6)
print('Prepared retained Stage21 far painting in',out)
