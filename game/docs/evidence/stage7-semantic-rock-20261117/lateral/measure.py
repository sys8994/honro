from pathlib import Path
import xml.etree.ElementTree as E,copy,subprocess,json
from PIL import Image
import numpy as np
P=Path(__file__).parent
for name in ['raw-study','with-original-sides','baseline']:
 s=E.parse(P/(name+'.svg')).getroot()
 for x in list(s)[-2:]:s.remove(x)
 E.ElementTree(s).write(P/(name+'-alpha.svg'))
 subprocess.run(['inkscape',str(P/(name+'-alpha.svg')),'--export-filename='+str(P/(name+'-alpha.png'))],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
report={}
for name in ['raw-study','with-original-sides','baseline']:
 a=np.asarray(Image.open(P/(name+'-alpha.png')).convert('RGBA'))[:,:,3]
 out={}
 for side,lo,hi,y in [('left',-381,8,991),('right',1447,1831,884)]:
  cols=np.arange(lo,hi+1)+450;row=y-750
  gaps=[]
  for col in cols:
   hits=np.flatnonzero(a[row:,col]>=128)
   gaps.append(int(hits[0]) if len(hits) else None)
  out[side]={'x':[lo,hi],'sourceY':y,'contactOpaqueSamples':int((a[row,cols]>=128).sum()),'totalSamples':len(cols),'firstSupportGapMin':min(v for v in gaps if v is not None),'firstSupportGapMax':max(v for v in gaps if v is not None),'noSupportWithinView':sum(v is None for v in gaps),'samples':{str(x):gaps[x-lo] for x in ([lo,-300,-200,-100,0,hi] if side=='left' else [lo,1500,1600,1700,1800,hi])}}
 report[name]=out
(P/'support-measurements.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
