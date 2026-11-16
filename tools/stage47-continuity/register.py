from pathlib import Path
import json
R=Path(__file__).resolve().parents[2];o=R/'art/stage47-continuity/source';s=810/3300;dx=270;dy=810
cfg={'id':'act5:stage47:continuous-rock','name':'부유 석단 연속 암벽','semanticLayer':'BODY','category':'rock','anchor':{'x':0,'y':0},'foot':{'x':0,'y':1536},'bounds':{'x':-dx/s,'y':-dy/s,'w':810/s,'h':1940/s},'scaleRange':[1,8],'backgroundRange':[1,8],'transform':[1/s,0,0,1/s,-dx/s,-dy/s],'preserveCompounds':True}
(o/'config.json').write_text(json.dumps(cfg));(o/'registration.json').write_text(json.dumps({'scale':s,'translate':[dx,dy],'sourceGameplayPixels':'x270..521.34545, y810..1187.01818','policy':'Native original silhouettes, holes, doors and complete stair/bridge paths remain authoritative; generated BODY only.'},indent=2))
