"""Compile registered native traces as paint-only front cliff modules."""
from pathlib import Path
import importlib.util,json,sys
ROOT=Path(__file__).resolve().parents[2];REPORT=ROOT/'_local/reports/act4-sideview-p1-20261116'
sys.path.insert(0,str(ROOT/'tools/terrain-node-optimizer'))
spec=importlib.util.spec_from_file_location('native_clip',ROOT/'tools/vector-production/import-native-clip.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

for row in json.loads((REPORT/'source-contracts.json').read_text()):
 n=row['stage'];p={**row['mapping'],**json.loads((ROOT/'shared/assets/environment/act4-sideview/source/layout.json').read_text()).get(str(n),{})};td=REPORT/f'registered{n}-v2';stage=json.loads((REPORT/f'stage{n}-canonical.json').read_text(encoding='utf-8'))
 selected=td/'color-final.svg'
 if not selected.exists():raise ValueError('Run registration, optimization and bounded compact serialization first')
 cfg={'id':f'act4-sideview:{n}:front','name':f'{n}장 측면 전면 암벽','semanticLayer':'BODY',
      'bounds':{'x':p.get('offsetX',0),'y':0,'w':p['worldWidth'],'h':p['canvasWorldHeight']},'anchor':{'x':0,'y':0},'foot':{'x':0,'y':p['worldHeight']},
      'transform':[p['worldPerPixel'],0,0,p['worldPerPixel'],p.get('offsetX',0),0],'scaleRange':[.1,8],'backgroundRange':[.1,8],
      'params':{'silhouetteUnderpaint':False,'sourceStage':n,'sourceRegistration':p,'collisionSource':'unchanged canonical terrains'}}
 asset=m.compile_native_clip(selected,td/'alpha-registered.svg',cfg)
 if n==40:
  def remove_matte(node):
   if node.get('fill') in ['#fdfdfd','#9c9fa4','#79869d']:node['fill']='#435c88'
   for c in node.get('children',[]):remove_matte(c)
  remove_matte(asset['vector']['root'])
 assets=[asset]
 for a in assets:
  v=a['vector'];prefix=a['id'].replace(':','-');names={k:prefix+'-'+k for k in v.get('clips',{})}
  def rename(node):
   if node.get('clipPath') in names:node['clipPath']=names[node['clipPath']]
   for c in node.get('children',[]):rename(c)
  rename(v['root']);v['clips']={names[k]:d for k,d in v.get('clips',{}).items()}
 out=ROOT/f'shared/data/act4/sideview-art/{n}.json';out.parent.mkdir(parents=True,exist_ok=True)
 out.write_bytes((json.dumps({'version':1,'stage':n,'worldSize':[stage['width'],stage['height']],'assets':assets},ensure_ascii=False,separators=(',',':'))+'\n').encode('utf-8'))
 print(n,selected.name,out.stat().st_size)
