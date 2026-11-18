import json,math
from pathlib import Path
M=1024**2;rows=[]
# Device pixels, actual probe-style walk camera, plus focused maxpose and full band bound.
for label,w,h,d in [('desktop1080',1920,1080,1),('phoneD2',390,696,2),('phoneD3',390,696,3),('sixMiPixelStudy',3072,2048,1),('fourK',3840,2160,1)]:
 W,H=w*d,h*d;P=W*H;poses=[]
 for cy in [1342,1650]:
  z=1.65;t=d*(h/2+(1716-cy)*z);y0=max(0,math.floor(t)-2);y1=min(H,math.ceil(d*(h/2+(1988.8-cy)*z))+2);B=max(0,y1-y0);body=P if 0<t<H else 1;current=4*P+8*max(W*B,1)+4*body
  poses.append({'scale':z,'cameraY':cy,'thresholdDevice':t,'bandRows':B,'boundaryPass':0<t<H,'freshLogicalBytes':current,'plusRetainedSSWorst8MiB':current+8*M,'MiBWithSS':(current+8*M)/M})
 rows.append({'device':label,'css':[w,h],'dpr':d,'physical':[W,H],'pixels':P,'materialBytes':4*P,'poses':poses,'fullBandSplitWorstBytes':16*P,'withRetainedSSWorstBytes':16*P+8*M,'withRetainedSSWorstMiB':(16*P+8*M)/M,'fitsProposed48MiBAtFullBand':16*P+8*M<=48*M})
Path('stage32-total-byte-budget/table.json').write_text(json.dumps({'retainedSSWorstBytes':8*M,'proposedStudyLogicalBudget':48*M,'rows':rows},indent=2));print(json.dumps(rows,indent=2))
