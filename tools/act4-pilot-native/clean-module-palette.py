#!/usr/bin/env python3
import json,xml.etree.ElementTree as E,importlib.util,re
from pathlib import Path
from svgpathtools import parse_path
H=Path(__file__).resolve().parents[1];sp=importlib.util.spec_from_file_location('imp',H/'vector-production/import-svg.py');m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
P=H.parent/'art/act4-pilot-modules-v2';S='http://www.w3.org/2000/svg';E.register_namespace('',S)
for name in ['ascending','plateau','descending','overhang']:
 d=P/name;r=E.parse(d/'seam-fixed.svg').getroot();out=E.Element(r.tag,r.attrib);out.append(r[0]);report={'paletteRevision':{'#365480':'#35537e','#34527b':'#35537e','#12213a':'#112038','#101d35':'#112038'},'maxNativePaletteChannelChange':3,'minorContourAreaThresholdSourcePx2':5,'exteriorUnderfill':'unchanged largest native union exterior; no expansion','layers':[],'status':'CANDIDATE ROOT VISUAL REVIEW REQUIRED'}
 for i,layer in enumerate(json.loads((d/'merged-palette.json').read_text())):
  paths=[p for p in parse_path(layer['d']).continuous_subpaths() if len(p)];keep=[];removed=0;area=0
  for p in paths:
   size=abs(p.area()) if p.isclosed() else float('inf')
   if size<5:removed+=1;area+=size;continue
   value=p.d(use_closed_attrib=p.isclosed());value=re.sub(m.NUMBER,lambda match:format(round(float(match[0]),2),'.12g'),value);keep.append(value)
  E.SubElement(out,'{'+S+'}path',id=f'clean-native-{i}',fill=layer['fill'],style='fill-rule:'+layer['fillRule'],d=' '.join(keep));report['layers'].append({'fill':layer['fill'],'removedMinorContours':removed,'removedAbsoluteArea':area,'retainedContours':len(keep)})
 E.ElementTree(out).write(d/'cleaned.svg',encoding='utf-8',xml_declaration=True);(d/'cleanup.json').write_text(json.dumps(report,indent=2)+'\n');print(name,(d/'cleaned.svg').stat().st_size)
