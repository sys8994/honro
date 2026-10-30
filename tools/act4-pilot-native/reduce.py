#!/usr/bin/env python3
"""One bounded topology-preserving reduction trial; no hand authored geometry."""
import sys,json,copy,xml.etree.ElementTree as E
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'vector-production'))
from bounded_flatten import flatten
from partition_geometry import partition_linear
P=Path(__file__).resolve().parents[2]/'art/act4-pilot-common-v1/objects';S='http://www.w3.org/2000/svg';E.register_namespace('',S)
for directory in sorted(P.iterdir()):
 r=E.parse(directory/'raw.svg').getroot();o=E.Element(r.tag,r.attrib);details=[]
 for e in r:
  data=partition_linear(flatten(e.get('d'),.1),'nonzero',45000,.25,.1)
  for i,part in enumerate(data['parts']):E.SubElement(o,e.tag,id=e.get('id')+'-'+str(i),style=e.get('style')+';fill-rule:evenodd',d=part['d'])
  details.append({'id':e.get('id'),'parts':len(data['parts'])})
 E.ElementTree(o).write(directory/'reduced.svg',encoding='utf-8',xml_declaration=True)
 (directory/'reduced-metadata.json').write_text(json.dumps({'flattenToleranceSourceUnits':.1,'topologyPreservingSimplifySourceUnits':.25,'coordinateGridSourceUnits':.1,'declaredApproximationSumSourceUnits':.1+.25+.1/2**.5,'interiorContourDeletion':False,'operations':details,'status':'CANDIDATE NOT APPROVED'},indent=2)+'\n')
 print(directory.name,(directory/'reduced.svg').stat().st_size,flush=True)
