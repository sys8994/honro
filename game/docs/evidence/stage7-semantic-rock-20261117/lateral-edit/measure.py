from PIL import Image
import numpy as np,json
from pathlib import Path
P=Path(__file__).parent;a=np.asarray(Image.open(P/'source-contact.png').convert('RGBA'));report={}
for side,lo,hi,y in [('left',-1200/3.13,8,991),('right',1447,1448+1200/3.13,884)]:
 # half-source pixel samples, including nearest centers to both endpoints.
 cols=np.arange(int(np.floor((lo+450)*2)),int(np.ceil((hi+450)*2)))
 rows=[round((y+d-750)*2) for d in [0,.5,1,2,4,8,16,24,32,64,128,256]]
 report[side]={'extent':[lo,hi],'samples':len(cols),'coverage':{str((r/2+750)-y):{'opaque':int((a[r,cols,3]>=128).sum()),'minAlpha':int(a[r,cols,3].min())} for r in rows}}
(P/'coverage.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
