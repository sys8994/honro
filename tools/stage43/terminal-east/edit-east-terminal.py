from pathlib import Path
from lxml import etree as E
import subprocess,os,json,copy
import argparse,hashlib
ap=argparse.ArgumentParser(description='Stage43 east terminal shared clip only; paint paths/transforms unchanged')
ap.add_argument('--deep',type=Path,required=True)
ap.add_argument('--contact',type=Path,required=True)
ap.add_argument('--out',type=Path,required=True)
args=ap.parse_args();p=args.out.resolve();p.mkdir(parents=True,exist_ok=True);n='{http://www.w3.org/2000/svg}'
r=E.Element(n+'svg',nsmap={None:n[1:-1]},viewBox='-3000 -1000 9000 7000');E.SubElement(r,n+'path',id='keep',d='M-3000-1000H6000V6000H-3000Z',style='fill:#000');E.SubElement(r,n+'path',id='wedge',d='M2159 710H2400V740H2156.95C2159.9 732 2159 720 2159 710Z',style='fill:#000');f=p/'mask-input.svg';E.ElementTree(r).write(str(f));z=subprocess.run(['inkscape',str(f),'--actions=select-by-id:keep,wedge;path-difference;select-clear;export-plain-svg;export-filename:'+str(p/'mask.svg')+';export-do'],env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so','INKSCAPE_PROFILE_DIR':str(p/'profile')},capture_output=True,text=True);(p/'boolean.log').write_text(z.stdout+z.stderr);z.check_returncode();d=E.parse(str(p/'mask.svg')).find('.//'+n+'path').get('d')
for name in ['deep','contact']:
 input_file=args.deep if name=='deep' else args.contact;a=json.loads(input_file.read_text());v=a['vector'];v.setdefault('clips',{})['east-terminal-cut']=[d];v['root']={'tag':'g','clipPath':'east-terminal-cut','children':[v['root']]};(p/f'{name}.json').write_text(json.dumps(a,separators=(',',':')))

preservation={}
for name,original in [('deep',args.deep),('contact',args.contact)]:
 old=json.loads(original.read_text());new=json.loads((p/f'{name}.json').read_text());new['vector']['root']=new['vector']['root']['children'][0];del new['vector']['clips']['east-terminal-cut']
 if 'clips' not in old['vector'] and not new['vector']['clips']:del new['vector']['clips']
 assert new==old,'Only shared clip addition allowed'
 preservation[name]={'onlyAddedSharedClip':True,'inputSHA256':hashlib.sha256(original.read_bytes()).hexdigest(),'originalBytes':original.stat().st_size,'candidateBytes':(p/f'{name}.json').stat().st_size}
(p/'preservation.json').write_text(json.dumps(preservation,indent=2))
