"""Diagnostic screen-space signal, NOT a quality gate or semantic recognizer.
Run on actual App captures. Same world ROI/camera/state required for comparison.
"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image
folder=Path(sys.argv[1]); manifest=json.loads((folder/'manifest.json').read_text())
points=np.array([[0,1800],[650,1810],[1120,1910],[1800,1970],[2450,2020],[3090,2040],[4200,2040],[4930,2010],[5550,1930],[6300,1830],[7200,1800]])
rows=[]
for item in manifest['images']:
    v=item.get('actualCamera',item['view']); z=v['scale']; w=v.get('width'); h=v.get('height')
    rgb=np.asarray(Image.open(folder/item['file']).convert('RGB'),dtype=float)
    y,x=np.mgrid[:h,:w]; wx=(x-w/2)/z+v['x']; wy=(y-h/2)/z+v['y']; ground=np.interp(wx,points[:,0],points[:,1])
    luma=rgb@np.array([.2126,.7152,.0722]); gx=np.abs(np.diff(luma,axis=1,prepend=luma[:,:1])); gy=np.abs(np.diff(luma,axis=0,prepend=luma[:1,:])); edge=np.maximum(gx,gy)
    rois={'house-internal':(wx>2000)&(wx<3140)&(wy>1560)&(wy<1970), 'play-contact-band':(wx>1600)&(wx<3400)&(wy>=ground)&(wy<ground+80),'deep-ground':(wx>1600)&(wx<3400)&(wy>ground+100)&(wy<ground+600)}
    for role,mask in rois.items():
        n=int(mask.sum())
        if n<20:continue
        rows.append({'file':item['file'],'role':role,'screenPixels':n,'edgeFractionOver12of255':float((edge[mask]>12).mean()),'meanNeighborLumaDelta':float(edge[mask].mean()),'lumaStdDev':float(luma[mask].std()),'lumaRangeP95P05':float(np.percentile(luma[mask],95)-np.percentile(luma[mask],5))})
result={'scope':'Actual composited pixels; fixed world ROIs. Includes actor/overlap/sky pixels, not isolated semantic masks. Screen edge/contrast diagnostics only; no automatic pass, no node-count equality.', 'visualApproval':False,'rows':rows}
(folder/'screen-density.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
