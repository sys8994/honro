from pathlib import Path
import json,copy,hashlib
from svgpathtools import parse_path
O=Path('_local/reports/cave-decor-coherence-v4');D=Path('art/cave-decor-coherence-v4');p=json.loads((O/'stage38-candidate-v1.json').read_text());s=p['stages'][0];assets=[];changes=[]
def walk(n,fn):
 if isinstance(n,dict):
  fn(n)
  for v in n.values():
   if isinstance(v,(dict,list)):walk(v,fn)
 elif isinstance(n,list):
  for v in n:walk(v,fn)
def recolor(n):
 for k in ['fill','stroke']:
  v=n.get(k,'')
  if isinstance(v,str) and len(v)==7 and v.startswith('#'):
   lum=sum(int(v[i:i+2],16)for i in [1,3,5])/3;n[k]='#405568' if lum>105 else '#344b5d' if lum>75 else '#2b4052' if lum>50 else '#243949'
for eid in ['s38v:body-east','s38v:body-east-domain-right','s38v:body-emergency-ledges']:
 e=next(e for e in s['elements']if e['id']==eid);a=copy.deepcopy(next(a for a in p['library']if a['id']==e['assetId']));assert a['collision']==[];old=a['id'];a['id']='s38-coherent-v4:'+eid.replace(':','-');walk(a['vector'],recolor);a['params']['paletteEdit']='Quiet blue-dawn BODY role consolidation; contour unchanged';e['assetId']=a['id'];p['library'].append(a);assets.append(a);changes.append({'element':eid,'oldAsset':old,'newAsset':a['id']})
for eid,domainid in [('s38v:body-land','s38v:body-land-domain-left'),('s38v:body-cavern-roof','s38v:body-cavern-roof-domain-left')]:
 e=next(e for e in s['elements']if e['id']==eid);a=copy.deepcopy(next(a for a in p['library']if a['id']==e['assetId']));a['id']='s38-coherent-v4:'+('west-depth' if eid.endswith('land')else'roof');v=a['vector']
 if eid.endswith('land'):
  def extend(n):
   if n.get('tag')!='path':return
   path=parse_path(n['d'])
   for z in path:
    for k in ['start','end','control','control1','control2']:
     if hasattr(z,k):
      q=getattr(z,k);setattr(z,k,complex(q.real,q.imag if q.imag<=500 else 500+(q.imag-500)*24))
   n['d']=path.d()
  walk(v['symbols']['source'],extend);a['params']['depthExtension']='Native source only y>500 extended24x; gameplay contour untouched'
 e['assetId']=a['id'];p['library'].append(a);assets.append(a)
 ext=copy.deepcopy(a);ext['id']=a['id']+'-domain-left';ext['vector']['symbols']['domainSource']={'tag':'g','children':copy.deepcopy(v['root']['children'])};ext['vector']['clips']['domainContinuation']=['M-6000 0H0V10000H-6000Z'];ext['vector']['root']={'tag':'g','clipPath':v['root']['clipPath'],'children':[{'tag':'g','clipPath':'domainContinuation','pixelSnapClip':True,'children':[{'tag':'g','transform':[-1,0,0,1,0,0],'children':[{'tag':'use','symbol':'domainSource'}]}]}]};ext['params']['domainContinuation']='Reflected native material only, clipped by unchanged full solid';p['library'].append(ext);assets.append(ext);de=next(e for e in s['elements']if e['id']==domainid);de['assetId']=ext['id']
raw=json.dumps(p,separators=(',',':'));(O/'stage38-candidate-v2.json').write_text(raw);(D/'stage38-v2-assets.json').write_text(json.dumps(assets));(D/'stage38-v2-stage.json').write_text(json.dumps(s));receipt={'source':'stage38-candidate-v1.json','candidateSha256':hashlib.sha256(raw.encode()).hexdigest(),'changes':changes,'scope':'Art-only native material depth/domain and BODY palette continuation; physical arrays unchanged','status':'pending actual frame review'};(D/'stage38-v2-receipt.json').write_text(json.dumps(receipt,indent=2));print(receipt['candidateSha256'])
