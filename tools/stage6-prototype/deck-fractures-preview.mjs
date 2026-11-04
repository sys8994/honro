/** Interior-only wood fracture marks; exact physical deck clips remain authoritative. */
import {readFileSync} from 'node:fs';
export function addDeckFractures(input){
 const p=structuredClone(input),s=p.stages.find(v=>v.metadata?.stageId===6),base=p.library.find(v=>v.id==='stage06-prototype:continuous-body-v1'),source=JSON.parse(readFileSync(new URL('./art-study/contact-wedge-runtime.json',import.meta.url),'utf8'));
 if(!s||!base)throw Error('Expected Stage6 art preview');
 const defs=[['west',2530,1920,-1],['mid',3700,1880,-1],['east',4000,1883,1]],clips={},children=[];
 for(const [id,x,y,dir] of defs){const t=s.terrains.find(v=>v.id==='bridge-'+id);if(!t?.points?.length)throw Error('Expected physical '+id+' deck');clips[id]=[t.points.map((q,i)=>(i?'L':'M')+q.x+' '+q.y).join('')+'Z'];children.push({tag:'g',clipPath:id,children:[{tag:'g',transform:[dir*100/2172,0,0,42/724,x,y],children:[structuredClone(source.vector.root)]}]});}
 const a=structuredClone(base);a.id='stage06-prototype:deck-fracture-study';a.name='Diagnostic traced wood damage inside deck';a.bounds={x:2400,y:1800,w:1800,h:200};a.reference={...a.reference,bounds:a.bounds,foot:{x:0,y:0}};a.collision=[];a.visual=[];a.params={previewOnly:true};a.vector={version:1,viewBox:[2400,1800,1800,200],clips,root:{tag:'g',children}};
 p.library.push(a);s.elements.push({id:'stage06-prototype-deck-fracture-study',assetId:a.id,x:0,y:0,scale:1,rotation:0,layer:'prop',depthLayer:'L1',visualRole:'scenery'});return p;
}
