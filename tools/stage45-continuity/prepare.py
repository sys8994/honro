"""Register traced BODY to the canonical source. Original PROPS and gameplay untouched."""
from pathlib import Path
import json,shutil
R=Path(__file__).resolve().parents[2];o=R/'art/stage45-continuity';t=R/'_local/stage45/body-trace'
s=.63*2172/1997;dx=125;dy=155
cfg={'id':'act5:stage45:root-body','name':'서낭고개 연속 거목 암반','semanticLayer':'BODY','category':'rock','anchor':{'x':0,'y':0},'foot':{'x':0,'y':788},'bounds':{'x':-dx/s,'y':-dy/s,'w':1614/s,'h':974/s},'scaleRange':[1,8],'backgroundRange':[1,8],'transform':[1/s,0,0,1/s,-dx/s,-dy/s],'preserveCompounds':True}
(o/'config.json').write_text(json.dumps(cfg))
for f,n in [('raw.svg','native-raw.svg'),('native-alpha.svg','alpha-raw.svg'),('trace.json','trace.json')]:shutil.copy(t/f,o/n)
shutil.copy(R/'_local/stage45/registration.json',o/'registration.json')
