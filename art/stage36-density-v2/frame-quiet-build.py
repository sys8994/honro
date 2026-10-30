import subprocess,os,json,xml.etree.ElementTree as E
from pathlib import Path
out=Path('art/stage36-density-v2');src=Path('art/stage36-vector-production')
env=os.environ|{'INKSCAPE_PROFILE_DIR':'/tmp/honro-density-bg-profile','XDG_CACHE_HOME':'/tmp/honro-density-cache'}
palettes={'frame':['#807562','#807562','#6d6558','#666a68','#53534e','#555d60','#555d60','#53534e','#53534e'],'foundation':['#8b8578','#948673','#948673','#777d7c','#777d7c','#948673','#777d7c','#626763','#515652']}
for k,colors in palettes.items():
 if k != 'frame': continue
 original=src/f'{k}-final.svg';paths=[e for e in E.parse(original).iter() if e.tag.endswith('path')];palette=out/f'{k}-quiet-palette.svg';unioned=out/f'{k}-quiet-unioned.svg'
 actions=[];groups=[]
 for e,col in zip(paths,colors):
  actions+=['select-clear','select-by-id:'+e.get('id'),'object-set-property:fill,'+col]
  if groups and groups[-1][0]==col:groups[-1][1].append(e.get('id'))
  else:groups.append([col,[e.get('id')]])
 actions+=['export-filename:'+str(palette),'export-text-to-path','export-do']
 subprocess.run(['inkscape',str(original),'--export-type=svg','--actions='+';'.join(actions)],env=env,check=True,capture_output=True)
 actions=[]
 for col,ids in groups:
  if len(ids)>1 and ids == ['path9','path8']:actions+=['select-clear','select-by-id:'+','.join(ids),'path-union']
 actions+=['export-filename:'+str(unioned),'export-do']
 subprocess.run(['inkscape',str(palette),'--export-type=svg','--actions='+';'.join(actions)],env=env,check=True,capture_output=True)
 config=json.loads((src/f'{k}-config.json').read_text());config['id']='s36-density:'+k;config['name']+=' (저밀도)';config['params']['densityRevision']=2;config['params']['artEdit']='Intentional semantic palette regrouping; actual Inkscape same-fill contiguous unions; source geometry/physics unchanged.'
 (out/f'{k}-quiet-config.json').write_text(json.dumps(config,ensure_ascii=False,indent=2))
 print(k,groups)
