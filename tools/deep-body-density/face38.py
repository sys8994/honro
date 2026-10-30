#!/usr/bin/env python3
"""Source-native floor-only contrast adjustment, preserving all finefade and contact geometry."""
import json,os,subprocess
from pathlib import Path
src=Path('art/stage38-density-depthfade');out=Path('art/stage38-density-face-v3');out.mkdir(exist_ok=True)
env={**os.environ,'INKSCAPE_PROFILE_DIR':'/tmp/honro-face38-profile','XDG_CACHE_HOME':'/tmp/honro-face38-cache'}
subprocess.run(['inkscape',str(src/'floor-final.svg'),'--export-plain-svg','--export-type=svg',f'--export-filename={out}/floor-final.svg','--actions=select-by-id:path6;object-set-property:fill,#4b5d69'],env=env,check=True)
cfg=json.loads((src/'floor-config.json').read_text());cfg['id']='s38-density:floor-face-v3';cfg['params']['artEdit']='Native Inkscape interior face path6 #526471 to #4b5d69: half contrast toward #435661. Contact #60737c and all geometry, finefade masks, physical metadata unchanged. Roof unchanged.'
(out/'floor-config.json').write_text(json.dumps(cfg,ensure_ascii=False,indent=2))
subprocess.run(['python3','tools/vector-production/import-svg.py',str(out/'floor-final.svg'),'--config',str(out/'floor-config.json'),'--output',str(out/'floor-asset.json')],check=True)
