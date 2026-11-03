/** Diagnostic source-traced timber shim at actual (4986.352,2460.12) contact; no collision. */
import {readFileSync} from 'node:fs';
export function addRockContactShadow(input){
 const p=structuredClone(input),s=p.stages.find(v=>v.metadata?.stageId===6),base=p.library.find(v=>v.id==='stage06-prototype:continuous-body-v1'),source=JSON.parse(readFileSync(new URL('./art-study/contact-wedge-runtime.json',import.meta.url),'utf8'));
 if(!s||!base)throw Error('Expected Stage6 art preview');
 const a=structuredClone(base);a.id='stage06-prototype:rock-contact-wedge';a.name='Diagnostic source-traced east rock contact';a.bounds={x:4960,y:2441,w:50,h:20};a.reference={...a.reference,bounds:a.bounds,foot:{x:4986.352,y:2460.12}};a.collision=[];a.visual=[];a.params={previewOnly:true};a.vector={version:1,viewBox:[4960,2441,50,20],root:{tag:'g',transform:[50/2172,0,0,20/724,4960,2441],children:[source.vector.root]}};
 p.library.push(a);s.elements.push({id:'stage06-prototype-rock-contact-wedge',assetId:a.id,x:0,y:0,scale:1,rotation:0,layer:'prop',depthLayer:'L1',visualRole:'scenery'});return p;
}
