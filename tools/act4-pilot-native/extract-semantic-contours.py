#!/usr/bin/env python3
"""Assign intact native contours to explicit disjoint semantic regions; never crop."""
import sys,json,hashlib,importlib.util,xml.etree.ElementTree as E
from pathlib import Path
from svgpathtools import parse_path
from shapely.geometry import Polygon,LineString
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools/vector-production'))
from bounded_flatten import flatten
spec=importlib.util.spec_from_file_location('svg_import',ROOT/'tools/vector-production/import-svg.py');imp=importlib.util.module_from_spec(spec);spec.loader.exec_module(imp)
source,config,out=map(Path,sys.argv[1:4]);cfg=json.loads(config.read_text());S='http://www.w3.org/2000/svg';E.register_namespace('',S);regions={n:Polygon(r['region']) for n,r in cfg['objects'].items()};roots={n:E.Element('{'+S+'}svg') for n in regions};counts={n:0 for n in regions};rejected=[]
for element in E.parse(source).getroot().iter():
 if element.tag.split('}')[-1]!='path':continue
 assert not element.get('transform'),'Bake native transforms before extraction'
 groups={n:[] for n in regions}
 for d,b in imp.contours(element.get('d')):
  path=parse_path(flatten(d,.1));points=[(path[0].start.real,path[0].start.imag)]+[(s.end.real,s.end.imag) for s in path] if len(path) else []
  if not points:continue
  geom=LineString(points).buffer(.11);matches=[n for n,r in regions.items() if r.covers(geom)]
  if len(matches)!=1:rejected.append({'bounds':b,'regions':matches});continue
  groups[matches[0]].append(d)
 for name,parts in groups.items():
  if parts:
   attrs={k:v for k,v in element.attrib.items() if k not in ['d','id']};attrs.update(id=element.get('id','path'),d=' '.join(parts));E.SubElement(roots[name],'{'+S+'}path',attrs);counts[name]+=len(parts)
assert not rejected,('No clipping/fallback permitted; revise semantic regions',rejected[:20])
for name,root in roots.items():
 dest=out/name;dest.mkdir(parents=True,exist_ok=True);bs=[b for e in root for _,b in imp.contours(e.get('d'))];assert bs,(name,'empty');x,y,x1,y1=min(b[0] for b in bs),min(b[2] for b in bs),max(b[1] for b in bs),max(b[3] for b in bs);bounds={'x':x,'y':y,'w':x1-x,'h':y1-y};root.set('viewBox',f'{x} {y} {x1-x} {y1-y}');E.ElementTree(root).write(dest/'raw.svg',encoding='utf-8',xml_declaration=True)
 asset={'id':cfg['idPrefix']+name,'name':name,'semanticLayer':'REAR','category':cfg.get('category','rock'),'bounds':bounds,'anchor':{'x':0,'y':0},'foot':{'x':x+(x1-x)/2,'y':y1},'scaleRange':[1,1],'backgroundRange':[1,1],'params':{'nativeSourceFile':source.name,'sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'candidateOnly':True,'semanticRole':cfg['objects'][name]['role']}}
 (dest/'asset-config.json').write_text(json.dumps(asset,indent=2));(dest/'region.json').write_text(json.dumps({'wholeContourCount':counts[name],'region':cfg['objects'][name]['region'],'cropGeometry':False,'classificationFlattenSourceBound':.1,'classificationSafetyBuffer':.11},indent=2))
print(json.dumps(counts))
