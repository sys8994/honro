import json,hashlib,re,argparse
from pathlib import Path
from svgpathtools import parse_path
parser=argparse.ArgumentParser();parser.add_argument('candidate',type=Path);parser.add_argument('output',type=Path);args=parser.parse_args();raw=args.candidate.read_bytes();assert hashlib.sha256(raw).hexdigest()=='e22e8d2773728ef3443a93b95192dab0b64c711c5f484a8cad24c671f3b902b9','unexpected source candidate';project=json.loads(raw);body=next(a for a in project['library'] if a['id']=='approved32:body');vector=body['vector'];source=vector['root']['children'][0];bounds=(2998/2.2,674/2.2,3118/2.2,867/2.2);left,top,right,bottom=bounds
children=[];counts=[]
for i,node in enumerate(source['children']):
 path=parse_path(' '.join(node.get('dParts',[node.get('d','')])));pieces=path.continuous_subpaths();kept=[]
 for part in pieces:
  x1,x2,y1,y2=part.bbox()
  if x2>=left and x1<=right and y2>=top and y1<=bottom:kept.append(part.d()+' Z')
 if kept:
  # Keep each selected original continuous contour; convert coordinates to
  # absolute form and round only numerical conversion noise to 5 decimals.
  def compact(text):
   return re.sub(r'(?<![A-Za-z])[+-]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][+-]?\d+)?',lambda m: format(round(float(m.group()),5),'.5f').rstrip('0').rstrip('.') or '0',text)
  d=compact(' '.join(kept));new={k:v for k,v in node.items() if k not in ('d','dParts')};new['d']=d
  print('NODE',i,len(d),len(kept))
  if len(d)>60000:raise ValueError('oversized compound')
  children.append(new);counts.append({'node':i,'fill':node.get('fill'),'subpaths':len(pieces),'kept':len(kept),'chars':len(d)})

result={'id':'approved32:wood-door-extract','name':'32 shelter original wood door extract','category':'prop','visual':[],'collision':[],'sockets':[],'anchor':{'x':0,'y':0},'bounds':{'x':0,'y':0,'w':120,'h':193},'reference':{'bounds':{'x':0,'y':0,'w':120,'h':193},'foot':{'x':60,'y':193},'heightM':193/60,'scaleRange':[.1,8],'backgroundRange':[1,1]},'params':{'semanticLayer':'BODY','silhouetteUnderpaint':False},'vector':{'version':1,'viewBox':[0,0,120,193],'clips':{'sourceAlpha':vector['clips']['sourceAlpha'],'doorCrop':[f'M{left} {top} H{right} V{bottom} H{left} Z']},'root':{'tag':'g','transform':[2.2,0,0,2.2,-2998,-674],'children':[{'tag':'g','clipPath':'sourceAlpha','children':[{'tag':'g','clipPath':'doorCrop','children':children}]}]}}}
args.output.write_text(json.dumps(result,separators=(',',':')));print(json.dumps({'sourceSha256':hashlib.sha256(raw).hexdigest(),'sourceROIWorld':[2998,674,3118,867],'sourceROI':bounds,'counts':counts,'extractedBytes':args.output.stat().st_size,'outputSha256':hashlib.sha256(args.output.read_bytes()).hexdigest()},indent=2))
