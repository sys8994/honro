"""Preserve exact authored walking art through 15-source-unit strips.
The newly designed continuous lower geology replaces nonwalking dangling ends.
"""
from pathlib import Path
import json,subprocess
import numpy as np
A=Path(__file__).resolve().parent;R=A.parents[1]
old=json.load(open(A/'source-seam.json'));lines=json.loads(subprocess.run(['node','--input-type=module','-e',"import{terrain}from'./shared/data/act5/terrain.mjs';console.log(JSON.stringify(terrain[7].lines))"],cwd=R,capture_output=True,text=True,check=True).stdout)
x=np.arange(1536);contact=np.full(1536,315.)
for key,ps in lines:
 p=np.array(ps)*1.5
 for a,b in zip(p,p[1:]):
  if b[0]<=a[0]:continue
  use=(x>=a[0])&(x<=b[0]);contact[use]=np.maximum(contact[use],a[1]+(x[use]-a[0])*(b[1]-a[1])/(b[0]-a[0]))
def reduced(arr):
 pts=[[int(i),round(float(v),4)]for i,v in enumerate(arr)];return [pts[0]]+[pts[i]for i in range(1,len(pts)-1)if abs((pts[i][1]-pts[i-1][1])-(pts[i+1][1]-pts[i][1]))>.0002]+[pts[-1]]
pts=reduced(contact+15);rev=' '.join(f'{a},{b}'for a,b in reversed(pts));keep=f'M-10,-100H1546V{pts[-1][1]}L{rev}L-10,{pts[0][1]}Z'
base=reduced(contact);sequence=' '.join(f'{a},{b}'for a,b in base);gate=f'M-1400,315H0L{sequence}H3000V5000H-1400Z'
json.dump({**old,'clip':keep,'points':pts,'contactMinMargin':15,'method':'authored lowest contact envelope +15 source units; continuous redesigned nonwalk body replaces lower tips','supportGate':gate},open(A/'source-seam-v8.json','w'),indent=2)
