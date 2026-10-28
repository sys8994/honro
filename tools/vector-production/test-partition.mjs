import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createCanvas,Path2D} from '@napi-rs/canvas';
const cases=[
 ['nonzero','M10 10H90V90H10Z M30 30H70V70H30Z'],
 ['evenodd','M10 10H90V90H10Z M30 30H70V70H30Z'],
 ['nonzero','M10 10H90V90H10Z M30 30V70H70V30Z'],
 ['nonzero','M10 10H60V60H10Z M40 40H90V90H40Z'],
 ['evenodd','M10 10L90 90L10 90L90 10Z']
];
const python=process.env.PYTHON_GEOMETRY||'python';
for(const[rule,d]of cases){
 const data=JSON.parse(execFileSync(python,['-c',`import sys,json;sys.path.insert(0,'tools/vector-production');from partition_geometry import partition_linear;r,d=json.load(sys.stdin);print(json.dumps(partition_linear(d,r,35)))`],{input:JSON.stringify([rule,d]),encoding:'utf8'}));
 const a=createCanvas(100,100),b=createCanvas(100,100),ca=a.getContext('2d'),cb=b.getContext('2d');ca.fill(new Path2D(d),rule);for(const part of data.parts)cb.fill(new Path2D(part.d),part.fillRule);
 const x=ca.getImageData(0,0,100,100).data,y=cb.getImageData(0,0,100,100).data;let delta=0;for(let i=3;i<x.length;i+=4)delta+=Math.abs(x[i]-y[i]);assert.ok(delta/10000<1,`${rule} alphaMAE ${delta/10000}`);
 assert.equal(ca.getImageData(50,40,1,1).data[3]>=128,cb.getImageData(50,40,1,1).data[3]>=128);
 console.log(`${rule}: ${data.parts.length} tiles, alphaMAE ${delta/10000}`);
}
console.log('PASS: GEOS original nonzero/evenodd winding, holes, overlap, self-intersection and tile rasterization');
