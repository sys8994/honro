"""Native Boolean composition: preserve accepted central crown, quiet whole-bank continuation."""
exec(open('tools/act4-silhouette-review/assemble33-fullbank.py').read().split('# Whole bank source')[0])
import subprocess,os
from svgpathtools.path import transform
NS='http://www.w3.org/2000/svg';E.register_namespace('',NS)
D=Path('art/stage33-bank-silhouette-v3');D.mkdir(exist_ok=True)
def mapped(n,x1,x2,y1,y2):
 a,l,r,top,_=source(f'art/stage33-bank-silhouette-v{n}','bank',f'_local/reports/bank-silhouette-v{n}/optimization');z=(x2-x1)/(r-l);sh=((y2-y1)-z*(top(r)-top(l)))/(r-l);tx=x1-z*l;ty=y1-z*top(l)-sh*l
 m=np.array([[z,0,tx],[sh,z,ty],[0,0,1.]])
 return m,lambda x:z*top((x-tx)/z)+sh*(x-tx)/z+ty
full,ft=mapped(2,0,7600,2100,1930);mid,mt=mapped(1,1800,4100,2300,2330)
# Affine shoulder fits reconcile native source endpoints exactly, not hand-authored contours.
left=np.array([[1,0,0],[(2300-ft(1800))/1800,1,0],[0,0,1.]])@full
rr=(2330-ft(4100))/(4100-7600);right=np.array([[1,0,0],[rr,1,-rr*7600],[0,0,1.]])@full
parts=[(2,0,1800,left),(1,1800,4100,mid),(2,4100,7600,right)]
profile=[];root=E.Element('{'+NS+'}svg',{'viewBox':'0 1800 7600 8200','width':'7600','height':'8200'});actions=[]
for j,(n,lo,hi,m) in enumerate(parts):
 _,l,r,top,_=source(f'art/stage33-bank-silhouette-v{n}','bank',f'_local/reports/bank-silhouette-v{n}/optimization')
 for x in np.linspace(lo,hi,int(hi-lo)+1):
  sx=(x-m[0,2])/m[0,0];profile.append((x,m[1,0]*sx+m[1,1]*top(sx)+m[1,2]))
 paths=[p for p in E.parse(f'art/stage33-bank-silhouette-v{n}/bank-master.svg').getroot().iter() if p.tag.endswith('path')]
 for k,pth in enumerate(paths):
  pid=f'p{j}_{k}';color=['#40566a','#192d3b','#192d3b','#192d3b'][k];d=transform(parse_path(pth.get('d')),m).d();E.SubElement(root,'{'+NS+'}path',{'id':pid,'d':d,'fill':color});cid=f'clip{j}_{k}';E.SubElement(root,'{'+NS+'}path',{'id':cid,'d':f'M{lo} 0H{hi}V10000H{lo}Z','fill':color});actions.append(f'select-clear;select-by-id:{pid},{cid};path-intersection')
# Deep continuation is repeated/unioned native silhouette translated down, not a new top silhouette.
base=E.Element('{'+NS+'}svg',dict(root.attrib));ba=[]
for j,(n,lo,hi,m) in enumerate(parts):
 pth=next(p for p in E.parse(f'art/stage33-bank-silhouette-v{n}/bank-master.svg').getroot().iter() if p.tag.endswith('path'))
 for k,offset in enumerate(range(0,8001,200)):
  mm=m.copy();mm[1,2]+=offset;pid=f'b{j}_{k}';E.SubElement(base,'{'+NS+'}path',{'id':pid,'d':transform(parse_path(pth.get('d')),mm).d(),'fill':'#192d3b'})
 ids=','.join(f'b{j}_{k}' for k in range(41));ba.append(f'select-clear;select-by-id:{ids};path-union');cid=f'bc{j}';E.SubElement(base,'{'+NS+'}path',{'id':cid,'d':f'M{lo} 0H{hi}V10000H{lo}Z','fill':'#192d3b'});ba.append(f'select-clear;select-by-id:b{j}_0,{cid};path-intersection')
env={**os.environ,'INKSCAPE_PROFILE_DIR':'/tmp/honro33boolean','XDG_CACHE_HOME':'/tmp/honro33cache'}
def ink(tree,name,acts):
 E.ElementTree(tree).write(D/(name+'-input.svg'));subprocess.run(['inkscape',str(D/(name+'-input.svg')),'--export-plain-svg','--export-type=svg',f'--export-filename={D/(name+".svg")}',f'--actions={";".join(acts)}'],env=env,check=True,stdout=subprocess.DEVNULL);return E.parse(D/(name+'.svg')).getroot()
b=ink(base,'deep-union',ba+['select-all;path-union']);c=ink(root,'contact-intersections',actions)
# Keep only native exposed rim, removing artificial source-image bottom edges.
rim=E.Element(root.tag,root.attrib);ra=[]
for j in range(3):
 for k in [0,1]:
  e=copy.deepcopy(next(e for e in c.iter() if e.get('id')==f'p{j}_{k}'));e.set('style','fill:#40566a;stroke:none');rim.append(e)
 ra.append(f'select-clear;select-by-id:p{j}_0,p{j}_1;path-difference')
ra.append('select-all;path-union')
rim=ink(rim,'rim-union',ra)
# This is a source-derived contact-depth selection, not a drawn terrain outline.
near='M'+' L'.join(f'{x:.6f} {y-2:.6f}' for x,y in profile)+' L'+' L'.join(f'{x:.6f} {y+60:.6f}' for x,y in reversed(profile))+' Z'
E.SubElement(rim,'{'+NS+'}path',{'id':'nearContact','d':near,'style':'fill:#40566a'})
rim=ink(rim,'rim-contact-only',['select-all;path-intersection'])
master=E.Element(root.tag,root.attrib)
for sourceRoot,color in [(b,'#192d3b'),(rim,'#40566a')]:
 for e in sourceRoot:
  if e.tag.endswith('path') or e.tag.endswith('g'):
   for z in e.iter():
    if z.tag.endswith('path'):z.set('style','fill:'+color+';stroke:none')
   master.append(copy.deepcopy(e))
E.ElementTree(master).write(D/'bank-master.svg')
cfg={'id':'s33-silhouette:composite-bank-v3','semanticLayer':'BODY','name':'Native composed asymmetric bank','category':'rock','bounds':{'x':0,'y':1800,'w':7600,'h':8200},'anchor':{'x':0,'y':0},'foot':{'x':0,'y':0},'params':{'source':'bank-master.svg','silhouetteUnderpaint':False,'visualApproval':False,'composition':'v1 crown exact; v2 outer shoulders affine fitted; native Boolean quiet deep continuation'}};(D/'import-config.json').write_text(json.dumps(cfg));subprocess.run(['python','tools/vector-production/import-svg.py',str(D/'bank-master.svg'),'--config',str(D/'import-config.json'),'--output',str(D/'bank-world-asset.json')],check=True)
a=json.loads((D/'bank-world-asset.json').read_text());p['library'].append(a);profile=list(LineString(profile).simplify(.18).coords);t=s['terrains'][0];hi=next(i for i,q in enumerate(t['points']) if q['x']==7600);t['points']=[{'x':round(x,5),'y':round(y,5)} for x,y in profile]+t['points'][hi+1:]
removed=[e['id'] for e in s['elements'] if ('body' in e['id'] and e['id'].startswith('s33v:')) or 'soil-contact' in e['id']];s['elements']=[e for e in s['elements'] if e['id'] not in removed];insert=next(i for i,e in enumerate(s['elements']) if e['id'].startswith('s33v:fore-reed'));s['elements'].insert(insert,{'id':a['id'],'assetId':a['id'],'x':0,'y':0,'scale':1,'rotation':0,'depthLayer':'L1','layer':'front'})
for e in s['elements']:
 if 'reed-cluster' in e.get('assetId',''):
  aa=next(aa for aa in p['library'] if aa['id']==e['assetId']);f=aa['reference']['foot'];e['y']=float(np.interp(e['x']+f['x']*e['scale'],[q[0] for q in profile],[q[1] for q in profile]))-f['y']*e['scale']+2
changes.append({'kind':'native-composite-bank','terrain':t,'assetFile':str(D/'bank-world-asset.json'),'removeElementIds':removed,'centralCrownPreserved':True});p['stages']=[s];p['activeStageId']=s['id'];p['production']=json.loads(Path('_local/reports/causeway-silhouette-v3/candidate-project.json').read_text())['production'];s['design']['vectorGround']['baseColor']='#192d3b';(O/'candidate-project.json').write_text(json.dumps(p,separators=(',',':')));(O/'changes.json').write_text(json.dumps({'oldTerrain':oldTerrain,'changes':changes,'visualApproval':False},indent=2));print('Native composite ready')
