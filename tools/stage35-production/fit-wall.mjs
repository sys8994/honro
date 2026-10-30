/** Match authored visible wall contact to the unchanged original physical mask. */
import{readFile,writeFile}from'node:fs/promises';
const p=JSON.parse(await readFile('art/stage35-vector-production/skeleton-project.json','utf8')),original=p.library.find(a=>a.id==='a4:old-wall'),a=JSON.parse(await readFile('art/stage35-vector-production/old-wall-texture-asset.json','utf8'));
const d=original.collision.map(poly=>poly.map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join(' ')+'Z').join(' ');
a.vector.clips={...(a.vector.clips||{}),physicalWall:[d]};
a.vector.root={tag:'g',children:[{tag:'path',d,fill:'#43555e',stroke:'none'},{tag:'g',clipPath:'physicalWall',children:[{tag:'g',transform:[1,0,0,1.5,0,0],children:[a.vector.root]}]}]};
a.params={...a.params,physicalContactFit:{version:1,backing:'exact original a4:old-wall collision silhouette',textureVerticalScale:1.5,scope:'Appearance only; original collision is copied unchanged by consuming stage'}};
await writeFile('art/stage35-vector-production/old-wall-asset.json',JSON.stringify(a));
