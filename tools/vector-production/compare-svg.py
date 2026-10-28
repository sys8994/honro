#!/usr/bin/env python3
"""Measure external geometry candidate against immutable raw; does not approve artwork."""
import argparse,importlib.util,json,re,subprocess,xml.etree.ElementTree as E
from pathlib import Path
from PIL import Image,ImageDraw
H=Path(__file__).resolve().parent;s=importlib.util.spec_from_file_location('opt',H/'optimize-svg.py');o=importlib.util.module_from_spec(s);s.loader.exec_module(o)
p=argparse.ArgumentParser();p.add_argument('raw');p.add_argument('candidate');p.add_argument('--config',required=True);p.add_argument('--output-dir',required=True);p.add_argument('--remove-reference-images',action='store_true');a=p.parse_args();config=json.loads(Path(a.config).read_text());out=Path(a.output_dir);out.mkdir(parents=True,exist_ok=True)
r=E.parse(a.raw).getroot()
for parent in r.iter():
 for child in list(parent):
  if child.tag.split('}')[-1]=='image':
   if not a.remove_reference_images:raise ValueError('Explicit image removal required')
   parent.remove(child)
candidate_normalized=out/'candidate-normalized.svg';E.ElementTree(E.parse(a.candidate).getroot()).write(candidate_normalized,encoding='utf-8',xml_declaration=True)
raw=out/'reference.svg';E.ElementTree(r).write(raw,encoding='utf-8',xml_declaration=True)
config['sourcePalette']=sorted({tuple(int(c[i:i+2],16) for i in (1,3,5)) for e in r.iter() for c in re.findall(r'#[0-9a-fA-F]{6}',e.get('style','')+';'+e.get('fill',''))})
report={'raw':a.raw,'candidate':a.candidate,'rawStats':o.stats(raw),'candidateStats':o.stats(Path(a.candidate)),'visualApproval':'NOT REVIEWED','config':config,'errors':{},'timings':{}}
for scale in config.get('scales',[1,2]):
 imgs=[]
 for label,source in [('raw',raw),('candidate',candidate_normalized)]:
  png=out/f'{label}-{scale}x.png';timing=json.loads(o.run(['node',str(H/'render-svg-target.mjs'),str(source),str(png),str(round(config.get('width',1000)*scale))]));report['timings'][f'{label}-{scale}']=timing;imgs.append(png)
 report['errors'][str(scale)]=o.compare(*imgs,scale,config)
 aa,bb=[Image.open(x).convert('RGB') for x in imgs];sheet=Image.new('RGB',(aa.width*2,aa.height+24),'white');sheet.paste(aa,(0,24));sheet.paste(bb,(aa.width,24));d=ImageDraw.Draw(sheet);d.text((5,5),'RAW',fill='black');d.text((aa.width+5,5),'PARTITION CANDIDATE - NOT APPROVED',fill='black');sheet.save(out/f'comparison-{scale}x.png')
 for i,rect in enumerate(config.get('reviewRects',config.get('protectedRects',[]))):
  x,y,w,h=rect;box=tuple(round(v*scale) for v in (x,y,x+w,y+h));ra=aa.crop(box);rb=bb.crop(box);z=Image.new('RGB',(ra.width*2,ra.height));z.paste(ra,(0,0));z.paste(rb,(ra.width,0));z.resize((z.width*2,z.height*2)).save(out/f'protected-{i}-{scale}x.png')
report['qualityPass']=all(v['pass'] for v in report['errors'].values());(out/'comparison.json').write_text(o.safe_json(report,indent=2)+'\n');print(o.safe_json({'qualityPass':report['qualityPass'],'errors':report['errors']}));raise SystemExit(0 if report['qualityPass'] else 2)
