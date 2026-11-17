"""Stage50 lower material seam: source data immutable, lower decorative rock redesigned.
Native source alpha, architecture and all authored walking corridors are protected.
"""
from pathlib import Path
from lxml import etree as E
import json, subprocess, os, hashlib
import numpy as np
from PIL import Image
R=Path(__file__).resolve().parents[2];O=R/'_local/stage50/protection';O.mkdir(parents=True,exist_ok=True)
ns='{http://www.w3.org/2000/svg}';source=json.loads((R/'shared/assets/environment/act5/near-import.json').read_text())[9];v=source['vector'];assert v['viewBox']==[0,0,1774,887]
env={**os.environ,'INKSCAPE_PROFILE_DIR':str(O/'profile')}
if Path('/tmp/honro-inkscape-headless-init.so').exists():env['LD_PRELOAD']='/tmp/honro-inkscape-headless-init.so'
def svg():return E.Element(ns+'svg',nsmap={None:ns[1:-1]},viewBox='-1200 -4000 4200 8300')
def path(r,id,d,**kw):return E.SubElement(r,ns+'path',id=id,d=d,**kw)
def run(r,name,actions):
 E.ElementTree(r).write(str(O/(name+'-input.svg')))
 out=O/(name+'.svg');p=subprocess.run(['inkscape',str(O/(name+'-input.svg')),'--batch-process','--actions='+';'.join(actions+['select-clear','export-plain-svg',f'export-filename:{out}','export-do'])],env=env,capture_output=True,text=True);(O/(name+'.log')).write_text(p.stdout+p.stderr);p.check_returncode();return [p.get('d')for p in E.parse(str(out)).findall('.//'+ns+'path')]
r=svg()
for name,ds in v['clips'].items():path(r,name,' '.join(ds))
alpha=run(r,'native-alpha',['select-all','path-union']);assert len(alpha)==1
im=np.array(Image.open(R/'_local/stage50/source-native.png').convert('RGBA'));rgb=im[:,:,:3].astype(float);a=im[:,:,3];xs=np.where((a>127).any(axis=0))[0];x0,edgeRight=int(xs.min()),int(xs.max())+1
# Dynamic-programming selection follows native material color edges; max step3px.
# This is a mask selection, not authored geology or a new walkable surface.
data=rgb.transpose(1,0,2);lo,hi,target=760,826,790
values=np.arange(lo,hi);gradient=np.linalg.norm(data[:,2:]-data[:,:-2],axis=2)
cost=-np.minimum(gradient[:,values-1],90)*.08+abs(values-target)[None,:]*.08
prev=cost[0];back=[]
for row in cost[1:]:
 choices=[]
 for d in range(-3,4):
  ar=np.full(len(values),1e8);l=max(0,d);h=min(len(values),len(values)+d);ar[l:h]=prev[l-d:h-d]+abs(d)*.3;choices.append(ar)
 ar=np.stack(choices);idx=ar.argmin(0);back.append(np.arange(len(values))-(idx-3));prev=ar.min(0)+row
idx=int(prev.argmin());seam=[int(values[idx])]
for b in reversed(back):idx=int(b[idx]);seam.append(int(values[idx]))
seam=seam[::-1]
# Blend only the final80source pixels at each end into the existing lower alpha.
# Smoothstep weights preserve the measured contour's irregularities; no straight
# cap or invented monotone edge replaces the original rounded end.
materialSeam=seam.copy();endpointSamples=[]
for x in range(x0,edgeRight):
 distance=min(x-x0,edgeRight-1-x)
 if distance>=80:continue
 ys=np.where(a[:,x]>127)[0];assert len(ys)
 nativeBottom=float(ys.max())-2
 t=distance/80;w=1-(3*t*t-2*t*t*t)
 seam[x]=round(materialSeam[x]*(1-w)+nativeBottom*w,4)
 endpointSamples.append([x,nativeBottom,w,seam[x]])
left,right,top,depth=-1200,3000,-4000,4300
pts=[[x0,top],[edgeRight,top],[edgeRight,seam[edgeRight-1]],*[[x,seam[x]]for x in range(edgeRight-1,x0-1,-1)]]
keep='M'+'L'.join(f'{x},{y}'for x,y in pts)+'Z'
r=svg();path(r,'upper',keep)
lines=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import{terrain}from'./shared/data/act5/terrain.mjs';console.log(JSON.stringify(terrain[9].lines))"],cwd=R,text=True));actions=[]
for i,(_,ps) in enumerate(lines):
 # 52 SOURCE-unit corridor, centered8px above authored contact, preserves stone depth.
 p=[[x*1774/1024,y*1774/1024-8]for x,y in ps]
 path(r,f'walk-{i}','M'+'L'.join(f'{x},{y}'for x,y in p),fill='none',stroke='black',**{'stroke-width':'52','stroke-linecap':'round','stroke-linejoin':'round'})
 actions+=['select-clear',f'select-by-id:walk-{i}','object-stroke-to-path']
for name in ['surface-a','temple-a']:path(r,name,' '.join(v['clips'][name]))
region=run(r,'protected-region',actions+['select-all','path-union']);assert len(region)==1
# Clip only the original source; upper air/arch remains excluded for new BODY.
r=svg();path(r,'native',' '.join(alpha));path(r,'keep',' '.join(region));preserved=run(r,'source-preserved',['select-all','path-intersection']);assert len(preserved)==1
r=svg();path(r,'full',f'M{left} {top}H{right}V{depth}H{left}Z');path(r,'remove',' '.join(region));allowed=run(r,'body-allowed',['select-all','path-difference']);assert len(allowed)==1
out={'version':2,'stage':50,'sourcePreserved':preserved,'bodyAllowed':allowed,'sourceViewBox':v['viewBox'],'bodyAllowedBounds':[left,top,right-left,depth-top],'sourceHorizontalSpan':[x0,edgeRight],'nativeAlphaClips':v['clips'],'nativeSourceAlpha':alpha,'materialSeam':{'searchY':[760,825],'targetY':790,'interiorMaxAdjacentStep':3,'endpointBlendWidth':80,'endpointBlend':'smoothstep to actual alpha>127 bottom minus2; not a straight cap','actualY':[min(seam),max(seam)],'points':[[x,seam[x]]for x in range(x0,edgeRight)]},'endpointSamples':endpointSamples,'method':'Original source DATA unchanged. Lower decorative rock below a native color-edge seam (last80source pixels at each end blend to actual lower alpha minus2) is visually redesigned/replaced, not whole-source pixel preservation. Entire surface/temple alpha plus52-source-pixel authored walk corridors protected. BODY uses complementary region; exterior native alpha still supplies final silhouette, no horizontal exterior cap. Upper source sky/arch remain excluded.','sourcePngSha256':hashlib.sha256((R/'_local/stage50/source-native.png').read_bytes()).hexdigest(),'sourceDataSha256':hashlib.sha256(json.dumps(source,separators=(',',':'),ensure_ascii=False).encode()).hexdigest(),'contactScale':1774/1024,'boundsAreCoverageOnly':True}
(R/'art/stage50-continuity/protection.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')))
print(json.dumps({'seamRange':[min(seam),max(seam)],'mode':'lower decorative source rock redesigned, original data immutable'}))
