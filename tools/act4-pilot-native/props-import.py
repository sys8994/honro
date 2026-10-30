#!/usr/bin/env python3
import json,subprocess
from pathlib import Path
H=Path(__file__).resolve().parents[1];P=H.parent/'art/act4-pilot-props-v2'
for name,width,layer in [('pine',440,'REAR'),('reeds',200,'FORE'),('rocks',360,'REAR'),('marker',190,'FORE')]:
 d=P/name; j=json.loads((d/'metrics.json').read_text());x0,y0,x1,y1=j['nativeUnionBounds'];pad=2;x0-=pad;y0-=pad;x1+=pad;y1+=pad;scale=width/(x1-x0);height=(y1-y0)*scale
 b={'x':0,'y':0,'w':width,'h':height};config={'id':'act4:prop-v2:'+name,'name':name,'semanticLayer':layer,'category':'prop','bounds':b,'anchor':{'x':0,'y':0},'foot':{'x':width/2,'y':height},'transform':[scale,0,0,scale,-x0*scale,-y0*scale],'scaleRange':[1,1],'backgroundRange':[1,1],'params':{'candidateOnly':True,'functionalCollision':False,'provisionalDimensions':True,'placementReview':'PENDING'}}
 (d/'config.json').write_text(json.dumps(config,indent=2)+'\n');subprocess.run(['python',str(H/'vector-production/import-svg.py'),str(d/'optimized.svg'),'--config',str(d/'config.json'),'--output',str(d/'asset.json')],check=True)
