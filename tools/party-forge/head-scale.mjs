import {mapPath} from './proportions.mjs';
// Final user direction: comparable bare facial size for the three men, Sodan
// slightly smaller. Hat brim, ponytail and bun are excluded from measurement.
export const HEAD_SCALE={seol_o:.96,damheo:1.03,hwigyeom:1.22,sodan:.88};
export function harmonizeHeads(a){
 const scale=HEAD_SCALE[a.character_id],pivot=a.rig.parts.find(p=>p.id==='head').pivot;
 const map=p=>p.map((n,i)=>pivot[i]+(n-pivot[i])*scale);
 for(const p of a.paths)if(['head','hair_tail'].includes(p.part)){
  p.d=mapPath(p.d,map);if(p.strokeWidth)p.strokeWidth*=scale;
 }
 for(const p of a.rig.parts)if(p.id==='hair_tail')p.pivot=map(p.pivot);
 for(const [key,p]of Object.entries(a.face.landmarks))a.face.landmarks[key]=map(p);
 a.face.authoringMap.to=map(a.face.authoringMap.to);a.face.authoringMap.scale*=scale;
 a.proportions.headScale=scale;
 a.proportions.headSizeBasis='Bare face_plane at the unchanged game draw scale; excludes hat, hair and beard. Male face heights match within 5%, Sodan is about 12% smaller.';
 // Keep enough room above a growing head without reducing the established body
 // scale or moving the UI down into the hair of a smaller one.
 const headPaths=a.paths.filter(p=>['head','hair_tail'].includes(p.part)),top=Math.min(...headPaths.flatMap(p=>(p.d.match(/[-+]?(?:\d*\.)?\d+/g)||[]).filter((_,i)=>i%2).map(Number)));
 a.canvas.presentationHeight=Math.max(a.canvas.presentationHeight,a.canvas.anchor[1]-top+8);
}
