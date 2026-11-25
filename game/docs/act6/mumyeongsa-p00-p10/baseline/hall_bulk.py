"""Measure the authored 53/54/58 polygon overlays by a shared world-space raster mask."""
import argparse
import gzip
import hashlib
import json
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[5]
ASSETS=r"""
import {readFileSync} from 'node:fs';
import {createBrokenRail} from './shared/act6-mumyeongsa/broken-rail.mjs';
import {composeHall53} from './shared/act6-mumyeongsa/stage53.mjs';
import {composeGallery54} from './shared/act6-mumyeongsa/stage54.mjs';
import {hallB58} from './shared/act6-mumyeongsa/hall-b.mjs';
const json=p=>JSON.parse(readFileSync(p,'utf8'));
const packet=id=>json('shared/data/act6-qa/'+id+'.json');
const rail=createBrokenRail(json('shared/act6-b-slice/layout.json'));
const entry=packet('third'), normal=packet('fourth'), late=packet('eighth');
const rock=json('shared/act6-mumyeongsa/art/stage53-bedrock.json');
const a=composeHall53(JSON.parse(entry.mapText),JSON.parse(entry.libraryText),rail,rock);
const b=composeGallery54(normal.map,normal.library);
const c=hallB58();
const row=(label,roi,assets)=>({label,roi,assets:assets.map(a=>({id:a.id,visual:a.visual}))});
console.log(JSON.stringify([
 row('53 halls and balconies',a.map.playBounds,a.library.filter(u=>u.id.startsWith('m53-')&&u.visual.length)),
 row('53/54 shared B playable clip',a.map.playBounds,rail.assets),
 row('54 N gallery balconies',b.map.playBounds,b.library.filter(u=>u.id==='m54-observation-balconies')),
 row('58 upper hall, structure and roof',late.map.playBounds,c.visual.map(u=>u.asset)),
]));
"""
FACTORS=(1440/6800,2880/6800)


def raster(row, scale):
    roi=row['roi']
    left,top,right,bottom=(roi[key] for key in ('left','top','right','bottom'))
    size=(round((right-left)*scale),round((bottom-top)*scale))
    canvas=Image.new('L',size)
    draw=ImageDraw.Draw(canvas)
    for asset in row['assets']:
        for face in asset['visual']:
            draw.polygon([((p['x']-left)*scale,(p['y']-top)*scale) for p in face['points']],fill=255)
    return canvas


def measure(row,out):
    l,t,r,b=(row['roi'][key] for key in ('left','top','right','bottom'))
    faces=[f for a in row['assets'] for f in a['visual']]
    endpoints=sum(l<=p['x']<r and t<=p['y']<b for f in faces for p in f['points'])
    measures=[]
    for i,scale in enumerate(FACTORS,1):
        mask=raster(row,scale)
        image_bytes=mask.tobytes()
        area=image_bytes.count(255)/scale**2
        measures.append({'scale':scale,'worldArea':round(area,2),'rasterSHA256':hashlib.sha256(image_bytes).hexdigest()})
        mask.save(out/f"{row['label'].split()[0].replace('/','-')}-{i}x.png")
    wire=json.dumps(row['assets'],separators=(',',':'),ensure_ascii=False).encode()
    return {'overlay':row['label'],'roi':row['roi'],'assetIds':[a['id'] for a in row['assets']],
            'withinROIPolygonEndpoints':endpoints,'sourcePolygonFaces':len(faces),
            'normalizedBytes':len(wire),'gzipBytes':len(gzip.compress(wire,mtime=0)),
            'measurements':measures,
            'endpointsPerMillionWorldSquared1x':round(endpoints/measures[0]['worldArea']*1_000_000,2)}


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out',required=True,type=Path)
    args=parser.parse_args()
    args.out.mkdir(parents=True,exist_ok=True)
    overlays=json.loads(subprocess.check_output(['node','--input-type=module','-e',ASSETS],cwd=ROOT,text=True))
    data={'scope':'New authored polygon fills only. Hard play ROI clip, binary alpha. Original body and engine compositing excluded.',
          'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
          'rows':[measure(row,args.out) for row in overlays]}
    (args.out/'bulk.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
