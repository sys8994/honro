#!/usr/bin/env python3
"""Partition only over-budget opaque filled paths using native Boolean intersection."""
import argparse,copy,hashlib,importlib.util,json,math,subprocess,xml.etree.ElementTree as E
from pathlib import Path
HERE=Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('imp',HERE/'import-svg.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
E.register_namespace('','http://www.w3.org/2000/svg')
p=argparse.ArgumentParser(description=__doc__);p.add_argument('source');p.add_argument('--output',required=True);p.add_argument('--remove-reference-images',action='store_true');p.add_argument('--tile-limit',type=int,default=40000);p.add_argument('--flatten-tolerance',type=float,default=0);p.add_argument('--backend',choices=['skia','geos'],default='skia');p.add_argument('--polygon-tolerance',type=float,default=0);p.add_argument('--coordinate-grid',type=float,default=0);a=p.parse_args()
from bounded_flatten import flatten
if not 100<=a.tile_limit<=60000:raise ValueError('Tile limit must be100..60000; runtime budgets are fixed')
if any(not math.isfinite(v) or v<0 for v in [a.flatten_tolerance,a.polygon_tolerance,a.coordinate_grid]):raise ValueError('Finite nonnegative approximation parameters required')
if a.backend!='geos' and (a.polygon_tolerance or a.coordinate_grid):raise ValueError('Polygon simplify/grid options require GEOS backend')

original=Path(a.source).read_bytes();root=E.fromstring(original);report={'source':a.source,'sourceSha256':hashlib.sha256(original).hexdigest(),'visualApproval':'NOT REVIEWED','flattenToleranceSourceUnits':a.flatten_tolerance,'backend':a.backend,'polygonToleranceSourceUnits':a.polygon_tolerance,'coordinateGridSourceUnits':a.coordinate_grid,'declaredLocalApproximationBudget':a.flatten_tolerance+a.polygon_tolerance+a.coordinate_grid/2**.5,'partitions':[]}
def walk(parent,inherited):
 for child in list(parent):
  tag=child.tag.split('}')[-1]
  if tag=='image':
   if not a.remove_reference_images:raise ValueError('Explicit --remove-reference-images required')
   parent.remove(child);continue
  style={**inherited,**{k:v for k,v in child.attrib.items() if k in ('fill','stroke','opacity','fill-opacity','stroke-opacity','fill-rule')}}
  style.update(dict(x.split(':',1) for x in child.get('style','').split(';') if ':' in x));style={k.strip():v.strip() for k,v in style.items()}
  if tag=='g' and float(style.get('opacity',1))!=1:raise ValueError('Group opacity unsupported')
  if tag=='path':
   try:m.split_path(child.get('d',''),child.get('id','path'));continue
   except ValueError as error:
    if 'limit 60000' not in str(error):raise
   paint=m.paint(style.get('fill','#000000'),float(style.get('fill-opacity',1)))
   if len(paint)==9 and paint[-2:]!='ff':raise ValueError('Transparent fill cannot be partitioned')
   if style.get('stroke','none')!='none' or float(style.get('opacity',1))!=1 or float(style.get('fill-opacity',1))!=1:raise ValueError('Only opaque unstroked paths can be partitioned')
   d=flatten(child.get('d'),a.flatten_tolerance) if a.flatten_tolerance else child.get('d')
   if a.backend=='geos':
    if not a.flatten_tolerance:raise ValueError('GEOS requires explicit positive flatten tolerance')
    from partition_geometry import partition_linear
    data=partition_linear(d,style.get('fill-rule','nonzero'),a.tile_limit,a.polygon_tolerance,a.coordinate_grid)
   else:
    result=subprocess.run(['node',str(HERE/'partition-path.mjs')],input=json.dumps({'d':d,'fillRule':style.get('fill-rule','nonzero'),'limit':a.tile_limit}),text=True,capture_output=True)
    if result.returncode: raise ValueError(result.stderr)
    data=json.loads(result.stdout)
   if not data['parts']:raise ValueError('No filled geometry survived; candidate rejected')
   index=list(parent).index(child)
   for i,part in enumerate(data['parts']):
    n=copy.deepcopy(child);n.set('d',part['d']);n.set('id',child.get('id','path')+f'-tile-{i}');n.set('style',child.get('style','')+';fill-rule:'+part['fillRule']);parent.insert(index+i,n)
   parent.remove(child);report['partitions'].append({'id':child.get('id'),'tiles':len(data['parts']),'maxPathChars':max(len(x['d']) for x in data['parts']),'bounds':data['sourceBounds']})
  else:walk(child,style)
root_style={k:v for k,v in root.attrib.items() if k in ('fill','stroke','opacity','fill-opacity','stroke-opacity','fill-rule')}
root_style.update(dict(x.split(':',1) for x in root.get('style','').split(';') if ':' in x))
if float(root_style.get('opacity',1))!=1:raise ValueError('Root opacity unsupported')
walk(root,root_style)
output=Path(a.output);output.parent.mkdir(parents=True,exist_ok=True);E.ElementTree(root).write(output,encoding='utf-8',xml_declaration=True);report.update(output=str(output),outputBytes=output.stat().st_size,rawUnchanged=Path(a.source).read_bytes()==original);output.with_suffix('.partition.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
