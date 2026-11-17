"""Native Inkscape color/alpha trace; optimization is a separate recorded step."""
from pathlib import Path
import os,sys,json,subprocess,base64,hashlib
from PIL import Image
import numpy as np
from lxml import etree as E
from svgpathtools import parse_path

ROOT=Path('/workspace/scratch/0b8c8f8d81c7/honro')
INK=Path('/usr/bin/inkscape')
n=46
src=Path(sys.argv[1]).resolve()
out=Path(sys.argv[2]).resolve()
out.mkdir(parents=True,exist_ok=True)
if (out/'color-raw.svg').exists() or (out/'alpha-raw.svg').exists():
 record=json.loads((out/'trace.json').read_text(encoding='utf-8'))
 assert record['sourceSHA256']==hashlib.sha256(src.read_bytes()).hexdigest(),'Source changed: use a new trace output; preserve the raw'
 for kind in ['color','alpha']:
  assert record[kind]['sha256']==hashlib.sha256((out/f'{kind}-raw.svg').read_bytes()).hexdigest(),'Raw trace changed'
 print(json.dumps(record));sys.exit(0)
im=Image.open(src).convert('RGBA');rgba=np.asarray(im);w,h=im.size
rgb=rgba[:,:,:3].copy();rgb[rgba[:,:,3]<128]=255
Image.fromarray(rgb).save(out/'color-input.png')
Image.fromarray(np.where(rgba[:,:,3]>=128,0,255).astype('uint8')).convert('RGB').save(out/'alpha-input.png')
env={**os.environ,'INKSCAPE_PROFILE_DIR':str(out/'inkscape-profile'),'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'}
def run(args,log):
 p=subprocess.run([str(INK),*map(str,args)],env=env,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=300)
 (out/log).write_text(p.stdout+'\n'+p.stderr,encoding='utf-8')
 if p.returncode:raise RuntimeError(p.stderr)
def trace(kind,action):
 b64=base64.b64encode((out/f'{kind}-input.png').read_bytes()).decode()
 wrapper=out/f'{kind}-wrapper.svg';dest=out/f'{kind}-raw.svg'
 wrapper.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><image id="raster" width="{w}" height="{h}" xlink:href="data:image/png;base64,{b64}"/></svg>',encoding='utf-8')
 run([wrapper,'--batch-process',f'--actions=select-by-id:raster;object-trace:{action};select-clear;select-by-id:raster;delete;export-plain-svg;export-filename:{dest};export-do'],f'{kind}-trace.log')
 tree=E.parse(str(dest));paths=tree.findall('.//{*}path')
 assert paths and not tree.findall('.//{*}image')
 return {'action':action,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'bytes':dest.stat().st_size,'paths':len(paths),'segments':sum(len(parse_path(p.get('d',''))) for p in paths)}
color=trace('color','20,false,true,false,4,0.6,0.1')
alpha=trace('alpha','2,false,false,true,0,0,0.1')
run([out/'color-raw.svg','--export-type=png',f'--export-filename={out/"color-raw.png"}'],'color-render.log')
record={'stage':n,'inkscape':subprocess.check_output([str(INK),'--version'],text=True).strip(),'source':str(src),'sourceSHA256':hashlib.sha256(src.read_bytes()).hexdigest(),'sourceSize':[w,h],'color':color,'alpha':alpha,'alphaPolicy':'source alpha >= 128; hidden RGB forced white; color and alpha are native Inkscape traces','status':'raw trace only, not art or gameplay approval'}
(out/'trace.json').write_text(json.dumps(record,indent=2),encoding='utf-8')
print(json.dumps(record),flush=True)
