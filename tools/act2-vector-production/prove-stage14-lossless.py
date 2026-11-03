"""Prove lexical path/unused-ID minification is pixel identical at 1x/2x."""
import json,sys,subprocess,hashlib
from pathlib import Path
from PIL import Image
import numpy as np
p=Path(sys.argv[1]);original=Path(sys.argv[2]);cfg=json.load(open(p/'pixel-config.json'));out=p/'lossless-proof';out.mkdir(exist_ok=True);rows=[]
for scale in (1,2):
 files=[]
 for label,source in [('before',original),('after',p/'final.svg')]:
  png=out/f'{label}-{scale}x.png';subprocess.run(['node','tools/vector-production/render-svg-target.mjs',str(source),str(png),str(cfg['width']*scale)],check=True,stdout=subprocess.DEVNULL);files.append(png)
 a,b=[np.asarray(Image.open(f).convert('RGBA'))for f in files];equal=bool(np.array_equal(a,b));rows.append({'scale':scale,'rgbaPixelIdentical':equal,'differentChannelValues':int(np.count_nonzero(a!=b))});assert equal,rows[-1]
report={'beforeSha256':hashlib.sha256(original.read_bytes()).hexdigest(),'afterSha256':hashlib.sha256((p/'final.svg').read_bytes()).hexdigest(),'removed':'Unreferenced path/group IDs and XML declaration; lossless lexical token spelling','scales':rows};(p/'lossless-proof.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
