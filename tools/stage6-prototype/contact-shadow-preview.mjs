/** Diagnostic contact shadow, no collision or gameplay. Exact contact is (4986.352, 2460.12). */
export function addRockContactShadow(input){
 const p=structuredClone(input),s=p.stages.find(v=>v.metadata?.stageId===6),base=p.library.find(v=>v.id==='stage06-prototype:continuous-body-v1');
 if(!s||!base)throw Error('Expected Stage6 art preview');
 const a=structuredClone(base);a.id='stage06-prototype:rock-contact-shadow';a.name='Diagnostic east rock contact shadow';a.bounds={x:4958,y:2455,w:56,h:12};a.reference={...a.reference,bounds:a.bounds,foot:{x:4986.352,y:2460.12}};a.collision=[];a.visual=[];a.params={previewOnly:true};a.vector={version:1,viewBox:[4958,2455,56,12],root:{tag:'path',d:'M4958 2460 C4965 2456 5006 2456 5014 2460 C5006 2464 4965 2464 4958 2460 Z',fill:'#192b2a'}};
 p.library.push(a);s.elements.push({id:'stage06-prototype-rock-contact-shadow',assetId:a.id,x:0,y:0,scale:1,rotation:0,layer:'prop',depthLayer:'L1',visualRole:'scenery'});return p;
}
