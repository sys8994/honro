import json,hashlib,pathlib,sys
from PIL import Image
root=pathlib.Path('/workspace/scratch/fff510b4df37');base=root/'honro-act2-vector-rollout/stage14';stage=json.load(open(root/'honro-act2-stage14/shared/data/campaign.json'))['stages'][13]
parts=sys.argv[1:] or ['domain-v3','upper-v2','west-v1','east-v1','family-v1','refuge-v2','vault-v2']
for part in parts:
 p=base/part;c=json.load(open(p/'contract.json'));w,h=Image.open(p/'source.png').size;x,y,ww,hh=c['worldRect'];colors=['#293a3e','#33464a','#45585b','#5b6a6b','#77817b','#979789','#686b59'] if not part.startswith('domain-') else ['#26393d','#344a4e','#41595d','#4e676a']
 (p/'merged.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg">'+''.join(f'<path style="fill:{color}" d="M0 0Z"/>' for color in colors)+'</svg>')
 lines=[]
 for t in stage['terrains']:
  if t['id'] not in c['bodyTerrainIds']:continue
  indices=t.get('properties',{}).get('honroWalkEdges',[])
  if t['id']=='v14-cavern-vault':indices=range(2,len(t['points'])-1)
  for i in indices:
   a,b=t['points'][i],t['points'][(i+1)%len(t['points'])]
   if max(a['x'],b['x'])<x or min(a['x'],b['x'])>x+ww or max(a['y'],b['y'])<y or min(a['y'],b['y'])>y+hh:continue
   lines.append({'points':[[(q['x']-x)/ww*w,(q['y']-y)/hh*h] for q in [a,b]],'width':12})
 config={'width':w,'scales':[1,2],'limits':{'rgbMAE255':2,'silhouettePx':1.5,'protectedRgbMAE255':1,'protectedPx':.5,'protectedChangedPixelFraction':.05},'protectedPolylines':lines,'protectedRgbQuantizationTolerance255':1}
 (p/'pixel-config.json').write_text(json.dumps(config,indent=2));(p/'config.json').write_text(json.dumps({'id':'act2-traced:stage14-'+part,'name':'Stage14 cavern geology '+part,'bounds':dict(zip(['x','y','w','h'],c['worldRect'])),'anchor':{'x':0,'y':0},'foot':{'x':0,'y':y+hh},'semanticLayer':'BODY','preserveCompounds':True,'transform':[ww/w,0,0,hh/h,x,y],'params':{'bodyTerrainIds':c['bodyTerrainIds'],'bodyBaseColor':'#293a3e'}},indent=2));(p/'source-sha256.txt').write_text(hashlib.sha256((p/'source.png').read_bytes()).hexdigest()+'\n')
 print(part,w,h,len(lines))
