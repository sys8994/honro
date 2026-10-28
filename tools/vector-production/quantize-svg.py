#!/usr/bin/env python3
"""Snap absolute Bézier control/endpoints to an explicit grid; no relative drift."""
import argparse,hashlib,importlib.util,json,math,re,xml.etree.ElementTree as E
from pathlib import Path
from svgpathtools import parse_path,Arc
H=Path(__file__).resolve().parent;s=importlib.util.spec_from_file_location('imp',H/'import-svg.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('--output',required=True);p.add_argument('--grid',type=float,required=True);p.add_argument('--oversized-only',action='store_true');p.add_argument('--remove-reference-images',action='store_true');a=p.parse_args()
if not math.isfinite(a.grid) or a.grid<=0:raise ValueError('Positive finite grid required')
original=Path(a.source).read_bytes();root=E.fromstring(original);changed=[]
for parent in root.iter():
 for child in list(parent):
  if child.tag.split('}')[-1]=='image':
   if not a.remove_reference_images:raise ValueError('Explicit reference image removal required')
   parent.remove(child)
for e in root.iter():
 if e.tag.split('}')[-1]!='path':continue
 d=e.get('d','')
 if a.oversized_only:
  try:m.split_path(d,e.get('id','path'));continue
  except ValueError as error:
   if 'limit 60000' not in str(error):raise
 parts=[];pos=0j
 for text in re.findall(r'[Mm][^Mm]*',d):
  path=parse_path(text,current_pos=pos)
  if not path:continue
  if any(isinstance(seg,Arc) for seg in path):raise ValueError('Arc parameters do not have Bézier grid error bound; flatten explicitly first')
  pos=path[-1].end;absolute=path.d(useSandT=False)
  value=re.sub(m.NUMBER,lambda match:format(round(float(match[0])/a.grid)*a.grid,'.12g'),absolute)
  if text.rstrip().lower().endswith('z'):value+='Z'
  parts.append(value)
 e.set('d',' '.join(parts));changed.append(e.get('id'))
output=Path(a.output);output.parent.mkdir(parents=True,exist_ok=True);E.ElementTree(root).write(output,encoding='utf-8',xml_declaration=True)
report={'source':a.source,'sourceSha256':hashlib.sha256(original).hexdigest(),'gridLocalUnits':a.grid,'controlPointDisplacementBoundLocalUnits':a.grid/2**.5,'changedPaths':changed,'rawUnchanged':Path(a.source).read_bytes()==original,'visualApproval':'NOT REVIEWED'};output.with_suffix('.quantize.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
