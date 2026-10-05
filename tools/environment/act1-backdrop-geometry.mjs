/** Normalize equivalent SVG primitives for geometry-only regression tests. */
import {createHash} from 'node:crypto';
export function backdropGeometry(source){
 const paths=new Map([...source.matchAll(/<path\b[^>]*id="([^"]+)"[^>]*d="([^"]+)"[^>]*\/>/g)].map(m=>[m[1],m[2]]));
 const groups=new Map([...source.matchAll(/<g id="(pine(?:-lean)?)">([\s\S]*?)<\/g>/g)].map(m=>[m[1],m[2]]));
 source=source.replace(/<use\b([^>]*)\/>/g,(_,attrs)=>{const id=/href="#([^"]+)"/.exec(attrs)?.[1];attrs=attrs.replace(/\s*href="[^"]+"/,'');if(paths.has(id))return '<path d="'+paths.get(id)+'"'+attrs+'/>';if(groups.has(id))return '<g'+attrs+'>'+groups.get(id)+'</g>';throw Error('Unknown backdrop reference '+id);});
 source=source.replace(/<ellipse\b([^>]*)\/>/g,(_,attrs)=>{const a=Object.fromEntries([...attrs.matchAll(/(cx|cy|rx|ry)="([^"]+)"/g)].map(m=>[m[1],Number(m[2])]));const {cx,cy,rx,ry}=a;if(!Object.values(a).every(Number.isFinite))throw Error('Nonfinite ellipse');return `<path d="M${cx-rx} ${cy}A${rx} ${ry} 0 1 0 ${cx+rx} ${cy}A${rx} ${ry} 0 1 0 ${cx-rx} ${cy}Z"/>`;});
 return {paths:[...source.matchAll(/\sd="([^"]+)"/g)].map(m=>m[1]),transforms:[...source.matchAll(/\stransform="([^"]+)"/g)].map(m=>m[1]),circles:[...source.matchAll(/<circle\b([^>]*)\/>/g)].map(m=>Object.fromEntries([...m[1].matchAll(/(cx|cy|r)="([^"]+)"/g)].map(v=>[v[1],Number(v[2])]))) };
}
export const backdropShapeHash=source=>createHash('sha256').update(JSON.stringify(backdropGeometry(source))).digest('hex');
