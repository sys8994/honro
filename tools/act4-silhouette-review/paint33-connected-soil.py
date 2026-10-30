"""Reuse connected native32 strata as soil material; never alter33 physical top."""
import json,copy,sys,xml.etree.ElementTree as ET
from pathlib import Path
import numpy as np
from svgpathtools import parse_path
sys.path.insert(0,'tools/vector-production');from bounded_flatten import flatten
D=Path('art/stage33-bank-silhouette-v4/connected-soil');D.mkdir(exist_ok=True)
P=Path('_local/reports/act4-silhouette33/freeze-v4-covered/project.json');p=json.loads(P.read_text());
for legacy in p['library']:
 if legacy['id']=='s38v:contact-surface':legacy['reference']['heightM']=5000/60
s=p['stages'][0];old=copy.deepcopy(s['terrains']);a=next(a for a in p['library'] if a['id']=='s33-silhouette:composite-bank-v4');v=a['vector'];base,rubbish,rim=v['root']['children'][0]['children'];v['symbols']={};v['clips']={'physical':[base['d']]};paint=[];receipt=[]
# The actual existing collider is authoritative for material depth, not replaced by source32 outline.
pts=next(t for t in s['terrains'] if t['id']=='a4-33-land')['points'];toppts=[]
for q in pts:
 if toppts and q['x']<toppts[-1]['x']:break
 toppts.append(q)
xx=np.array([q['x'] for q in toppts]);yy=np.array([q['y'] for q in toppts]);target=lambda x:np.interp(x,xx,yy)
for side,filename,start in [('left','ground-master.svg',0),('right','ground-right-master.svg',3800)]:
 src=(D/'right-material-joined.svg')if side=='right'else Path('art/act4-silhouette-v3/sea/bank32')/filename;r=ET.parse(src).getroot();paths={e.get('id'):e for e in r.iter() if e.tag.endswith('path')};outer=parse_path(flatten(paths['path7'].get('d'),.2));pairs=[(z.start,z.end) for z in outer]
 def top(x):
  hits=[u.imag+(w.imag-u.imag)*(x-u.real)/(w.real-u.real) for u,w in pairs if abs(w.real-u.real)>1e-8 and min(u.real,w.real)<=x<=max(u.real,w.real)]
  return min(hits)
 nodes=[]
 for pid,col in [('path5','#30495a'),('path4','#283f50'),('path3','#203647'),('path2','#192d3b')]:
  shape=parse_path(paths[pid].get('d'));parts=shape.continuous_subpaths();largest=max(parts,key=lambda q:abs(q.area()) if q.isclosed() else 0);nodes.append({'tag':'path','d':largest.d(),'fill':col})
 key='soil-'+side;v['symbols'][key]={'tag':'g','children':nodes};sx=3800/2164;sy=1.4;knots=np.linspace(4,2168,25);cor=[float(target(start+(x-4)*sx)-sy*top(x)) for x in knots]
 for i,(lo,hi) in enumerate(zip(knots[:-1],knots[1:])):
  slope=(cor[i+1]-cor[i])/(hi-lo);dy=cor[i]-slope*lo;wx=start+(lo-4)*sx;wx2=start+(hi-4)*sx;ck=f'{side}-{i}';v['clips'][ck]=[f'M{wx-.00001} 1700H{wx2+.00001}V10000H{wx-.00001}Z'];paint.append({'tag':'g','clipPath':ck,'pixelSnapClip':True,'children':[{'tag':'g','transform':[sx,slope,0,sy,start-4*sx,dy],'children':[{'tag':'use','symbol':key}]}]})
 receipt.append({'source':str(src),'largestConnectedSubpaths':['path5','path4','path3','path2'],'worldRange':[start,start+3800],'depthScale':sy,'slices':24})
v['root']={'tag':'g','children':[base,{'tag':'g','clipPath':'physical','children':paint},rim]};a['params'].update(materialSource='native32 largest connected soil strata, depth-relative to unchanged33 top',visualApproval=False);(D/'asset.json').write_text(json.dumps(a,separators=(',',':')));(D/'provenance.json').write_text(json.dumps({'sources':receipt,'physicalGeometryExact':s['terrains']==old,'rejected':'detached eyebrow fragments removed'},indent=2));out=Path('_local/reports/act4-silhouette33/connected-soil-candidate.json');out.write_text(json.dumps(p,separators=(',',':')));print(out)
# Same soil material must continue through camera-visible offstage domains, not stop atworld0.
# Reflection is material reuse only; original outer physical support remains unchanged.
physical='M'+'L'.join(f"{q['x']} {q['y']}"for q in pts)+'Z'
topall=sorted((q['x'],q['y'])for q in pts if q['y']<7000)
ux=sorted(set(x for x,y in topall));uy=[min(y for xx,y in topall if xx==x)for x in ux]
for suffix,lo,hi,side,origin,direction in [('left-near',-3000,0,'left',0,-1),('left-far',-6000,-3000,'left',-6000,1),('right-near',7600,10600,'right',7600,-1),('right-far',10600,13600,'right',13600,1)]:
 filename='ground-master.svg'if side=='left'else'ground-right-master.svg';r=ET.parse((D/'right-material-joined.svg')if side=='right'else Path('art/act4-silhouette-v3/sea/bank32')/filename).getroot();paths={e.get('id'):e for e in r.iter()if e.tag.endswith('path')};outer=parse_path(flatten(paths['path7'].get('d'),.2));pairs=[(z.start,z.end)for z in outer]
 def top(x):return min(u.imag+(w.imag-u.imag)*(x-u.real)/(w.real-u.real)for u,w in pairs if abs(w.real-u.real)>1e-8 and min(u.real,w.real)<=x<=max(u.real,w.real))
 # Boundary phase mirrors the material that touches playableworld0 or7600.
 if suffix.startswith('left'):srcAt=lambda wx:4+abs(wx)/3800*2164 if wx>=-3800 else 4+abs(wx+7600)/3800*2164
 else:srcAt=lambda wx:2168-(wx-7600)/3800*2164 if wx<=11400 else 4+(wx-11400)/3800*2164
 knots=sorted(set([*np.linspace(lo,hi,25),*[z for z in [-3800,11400]if lo<z<hi]]));nodes=[];clips={'physical':[physical]};symbol=copy.deepcopy(v['symbols']['soil-'+side])
 for i,(wl,wr)in enumerate(zip(knots[:-1],knots[1:])):
  sl,sr=srcAt(wl),srcAt(wr);sx=(wr-wl)/(sr-sl);tx=wl-sx*sl;cl=float(np.interp(wl,ux,uy))-1.4*top(sl);cr=float(np.interp(wr,ux,uy))-1.4*top(sr);m=(cr-cl)/(sr-sl);dy=cl-m*sl;key=f's{i}';clips[key]=[f'M{wl-.00001} 0H{wr+.00001}V10000H{wl-.00001}Z'];nodes.append({'tag':'g','clipPath':key,'pixelSnapClip':True,'children':[{'tag':'g','transform':[sx,m,0,1.4,tx,dy],'children':[{'tag':'use','symbol':'soil'}]}]})
 b=copy.deepcopy(a);b['id']='s33-silhouette:connected-soil-'+suffix;b['vector']={'version':1,'viewBox':[lo,0,hi-lo,10000],'root':{'tag':'g','clipPath':'physical','children':nodes},'symbols':{'soil':symbol},'clips':clips};b['bounds']={'x':lo,'y':0,'w':hi-lo,'h':10000};b['reference']['bounds']=b['bounds'];p['library'].append(b);idx=1+max(i for i,e in enumerate(s['elements'])if e['id'].startswith('s33-silhouette:domain-'));s['elements'].insert(idx,{'id':b['id'],'assetId':b['id'],'x':0,'y':0,'scale':1,'rotation':0,'depthLayer':'L1','layer':'front'});(D/(suffix+'-asset.json')).write_text(json.dumps(b,separators=(',',':')))
out.write_text(json.dumps(p,separators=(',',':')))
