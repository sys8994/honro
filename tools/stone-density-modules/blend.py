import os,subprocess,json
from pathlib import Path
p=Path('art/vector-stone-modules');env={**os.environ,'INKSCAPE_PROFILE_DIR':'/tmp/honro-stone-module-profile','XDG_CACHE_HOME':'/tmp/honro-stone-module-cache'}
for name in ['tread-block','tread-cap','tread-block-b']:
 import xml.etree.ElementTree as E
 r=E.parse(p/(name+'.svg')).getroot(); actions=[];mapping={'#4c5953':'#566366','#424a3c':'#4a5957','#384747':'#3f5053','#2c3a3a':'#46595e'}
 for q in r.iter():
  s=q.get('style','');col=s.removeprefix('fill:')
  if q.tag.endswith('path') and col in mapping:actions.extend(['select-clear','select-by-id:'+q.get('id'),'object-set-attribute:style,fill:'+mapping[col]])
 subprocess.run(['inkscape',str(p/(name+'.svg')),'--export-type=svg','--export-filename='+str(p/(name+'-blended.svg')),'--actions='+';'.join(actions)+';export-do'],check=True,env=env,capture_output=True)
 subprocess.run(['python3','tools/vector-production/import-svg.py',str(p/(name+'-blended.svg')),'--config',str(p/(name+'-config.json')),'--output',str(p/(name+'-blended-asset.json'))],check=True)
(p/'palette-edit.json').write_text(json.dumps({'intentionalArtRedesign':True,'mapping':mapping,'purpose':'Remove dark rectangular cutout edges from extracted blocks by matching deep planes to stage35 terrain; preserve bright tread edge.'},indent=2))
