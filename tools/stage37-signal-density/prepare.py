import json
from pathlib import Path
p=Path('art/stage37-signal-density');scale=240/751.5
config={'id':'s37-density:haul-winch','name':'해안 목제 권양기','semanticLayer':'PROP','category':'architecture','bounds':{'x':-300,'y':-240,'w':600,'h':280},'anchor':{'x':0,'y':0},'foot':{'x':0,'y':0},'transform':[scale,0,0,scale,-(55+1749.239/2)*scale,-793*scale],'params':{'sourceRole':'Non-interactive background boat-hauling windlass. Drum, six broad rope wraps, crank and timber trestles.'}}
p.joinpath('winch-config.json').write_text(json.dumps(config,indent=2))
# Source-page display width about280 at biggest .9 instance and.53normal. Protect crank/rope/gaps at displayed coordinates.
opt={'width':280,'scales':[1,1.1/.53],'protectionMode':'contact','protectedRects':[[95,32,80,55],[225,0,55,65],[72,76,100,45]],'reviewRects':[[0,0,280,131]],'asset':config}
p.joinpath('winch-optimization-config.json').write_text(json.dumps(opt,indent=2))
