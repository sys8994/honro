"""Uniformly fit actual Inkscape ink bounds, preserving full source viewBox."""
import json,subprocess
from pathlib import Path
root=Path('art/stage33-vector-production');src=root/'stone-pier-raw.svg'
row=subprocess.check_output(['inkscape',str(src),'--query-all'],stderr=subprocess.DEVNULL,text=True).splitlines()[0].split(',')
x,y,w,h=map(float,row[-4:]);k=300/h
cfg={'id':'s33v:stone-pier','name':'Natural coastal rear support','semanticLayer':'REAR','category':'architecture','bounds':{'x':-w*k/2,'y':-300,'w':w*k,'h':300},'anchor':{'x':0,'y':0},'foot':{'x':0,'y':0},'transform':[k,0,0,k,-(x+w/2)*k,-(y+h)*k],'params':{'artRole':'noncolliding rear terrain support; not firing cover','inkBounds':[x,y,w,h],'fit':'uniform actual ink height300; original peak/base anchors in stone-pier-anchor-contract.json','source':'stone-pier-raw.svg'}}
p=Path('tools/stage33-production/stone-pier-config.json');p.write_text(json.dumps(cfg,indent=2))
subprocess.run(['python','tools/vector-production/import-svg.py',str(src),'--config',str(p),'--output',str(root/'stone-pier-asset.json')],check=True)
print('Ink bounds',x,y,w,h,'normalized width',w*k)
