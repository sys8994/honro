import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const source=JSON.parse(fs.readFileSync('shared/assets/environment/act5/near-import.json')).find(x=>x.id===42);
assert.equal(source.vector.root.children.length,2,'Geology and props must remain separately authored');
const rock=source.vector.root.children[0],props=source.vector.root.children[1];
assert.equal(rock.children.length,16);assert.equal(props.children.length,12);
const calls=[],ops=[];
class Scene {landmark(c,l){calls.push({type:'original',asset:l.asset});} _landmarkPaintBounds(){return {left:0,right:2022,top:0,bottom:778};} _drawTerrainDomainTiles(){} terrainReadability(){} }
const g={HonroScene:Scene,Path2D:class{constructor(d){this.d=d;}},HonroVectorArt:{draw(c,a,p){calls.push({type:'rock',asset:a,placement:p});}},HonroVisualStyle:{context:c=>c,classify:()=> 'gameplay'}};
g.globalThis=g;vm.runInNewContext(fs.readFileSync('shared/runtime/act5-edge-art.js','utf8'),g);
const ctx=Object.fromEntries(['save','restore','translate','scale','clip','beginPath','rect','transform'].map(k=>[k,(...args)=>ops.push([k,...args])]));
const wall=JSON.parse(fs.readFileSync('shared/assets/environment/act5/stage42-registered-body.json'));
const shaText=value=>createHash('sha256').update(value).digest('hex');
const sha=value=>shaText(JSON.stringify(value));
const {vector,bounds,reference:{bounds:referenceBounds,...reference},...metadata}=wall;
assert.equal(sha({...metadata,reference}),'6111cebf1b0a2cf7905d414b7c9937f1e1fe0694e8291babe840778253ff063e','BODY wrapper metadata, sockets, collision and registration remain stock');
assert.deepEqual(bounds,{x:-1250,y:0,w:4510,h:2900});
assert.deepEqual(referenceBounds,bounds);
assert.deepEqual(vector.viewBox,[bounds.x,bounds.y,bounds.w,bounds.h]);
// The three existing 55c5 draw roots and every original clip (not just the
// native alpha) remain byte-identical in runtime JSON and in draw order.
const {['mountain-host-front-intersection']:contact,...existingClips}=vector.clips;
const children=vector.root.children;
assert.equal(children.length,5,'Exactly two lower-west paths in one group before the original donor');
assert.equal(sha(children.slice(0,3)),'d7a134fdc4937455a17b55ad26f4fdd2be1c69f51fa4ec0bfdc890f8d92b684b','All retained BODY roots, upper and both side geology unchanged');
assert.equal(sha(existingClips),'aa4158f29ab6ce3d6d353217e5c32181be78509f9c302b93764b3cab1b371563','Original alpha, holes and contact clips unchanged');
// Signed HOST∩FRONT is one clip, not a new second clip of the donor asset.
// Digest pins both solved side intersections and the original donor deep outline.
assert.equal(contact?.length,1,'One signed contact contour');
assert.equal(shaText(contact[0]),'35e538a84ec73049da5c3a7943adb453efd99dc46b3c961e485ac8a2288cb999','Reviewed single signed HOST/FRONT contour');
// Original lower donor stays last. New paint is separate, with no extra clip.
const added=children[3];
assert.deepEqual(Object.keys(added),['tag','children'],'Lower-west group may not clip, transform, or change opacity');
assert.equal(added.tag,'g');
assert.equal(added.children.length,2);
assert.deepEqual(added.children.map(n=>Object.keys(n)),[['tag','d','fill'],['tag','d','fill']],
 'Standalone lower-west paths without new child clips or transforms');
assert.deepEqual(added.children.map(n=>[n.tag,n.fill,shaText(n.d)]),[
 ['path','#29343e','b516b4287713645c43d92dba1f449a4a0ad6bddc18a1fbd0949bffa48960a34d'],
 ['path','#252f39','2853d128ae3b794c166d46ef296bff4869ab21d50b2a267b28e6520d82e2842b']
],'Exact approved lower-west patch contours');
const lower=children[4], colors=lower.children?.[0]?.children;
assert.equal(colors?.length,14,'Fourteen ordered source donor fills');
assert.equal(sha(colors),'edcfc293fb457a47790409b273de65fcef4588e237e3aa9c3d29e07bdf26fce9','Exact 1db7 donor paint data, not a second rendering of upper terrain');
assert.deepEqual(lower,{tag:'g',children:[{tag:'g',children:colors}],clipPath:'mountain-host-front-intersection'},'Donor may not add an inner clip, transform or opacity');
assert.equal(sha([...children.slice(0,3),lower]),'84a2725ee72b7a23de6d81e8d428a772e1cf573b9935ace7381a3b3115b60b85','All four original ordered 0a94 draw roots unchanged');
assert.equal(sha(vector.clips),'fee55eba8db51b03e0eb58297d2c1ed634261c399b766e4f8834e8431f8d6de9','All seven original clip definitions unchanged');
assert.equal(sha(vector),'d475cb917c3bbf8b8bbee4a2b2f0d9f2437b59373d93c8921e0b58f97fd404b2','Exact lower-west registered vector (not a donor archive pixel claim)');
assert.equal(sha(vector.root.children[1]),'1499c9babc8644ea83dd91f4566dd7af6afda304145dfda1c9e7f94e600a973f','Retained original BODY subtree');
assert.equal(sha(vector.clips['native-source-alpha']),'84ea89f47a065c9215637f560ef1818c63760d1f02f853390da784c1ae648c5d','Original clip and holes remain exact');
assert.equal(sha(source),'bb159e158e18aad515714eff13f1626c366f9266563de10007eebf0195925a98','Original near art and authored props remain stock');
const a={id:'act5:near:42',vector:source.vector,edgeWall:wall,edgeSurface:JSON.parse(fs.readFileSync('shared/assets/environment/act5/stage42-surface.json'))};const old=JSON.stringify(a);
assert.equal(sha(a.edgeSurface),'9954556a2471220ae824768fc7ab94cf749ad2bbd88bd3f86ceed4550def5f3a','Original SURFACE remains stock');const scene=new Scene();scene.landmark(ctx,{asset:a,x:0,y:0,scale:1});
assert.deepEqual(calls.map(x=>x.type),['original','rock','rock','rock','rock']);
assert.equal(calls[1].asset,wall);assert.equal(calls[2].asset,a.edgeSurface);
assert.equal(JSON.stringify(a),old,'Source artwork is never mutated');
assert.equal(calls[0].asset,a,'Authored original remains first');
assert.equal(ops.filter(x=>x[0]==='clip').length,3);
assert(!ops.some(x=>x[0]==='transform'),'No mirror or shear of source paths');
const paint=(l)=>JSON.parse(JSON.stringify(scene._landmarkPaintBounds(l)));
assert.deepEqual(paint({asset:a,x:0,y:0,scale:1}),{left:-1250,right:3260,top:0,bottom:2900});
assert.deepEqual(paint({asset:a,x:100,y:300,scale:2}),{left:-2400,right:6620,top:0,bottom:6100});
assert.deepEqual(paint({asset:a,x:100,y:300,scale:2,rotation:.2}),{left:0,right:2022,top:0,bottom:778});
assert.deepEqual(paint({asset:{...a,id:'act4:control'},x:100,y:300,scale:2}),{left:0,right:2022,top:0,bottom:778});
const k=6500/2022; // actual authored Stage42 scale; world/camera data stays unchanged
assert.deepEqual(paint({asset:a,x:0,y:0,scale:k}),
 {left:-1250*k,right:3260*k,top:0,bottom:2900*k});
assert.equal(JSON.stringify(a),old,'Visual bounds cannot mutate the landmark or asset');
console.log('PASS: Stage42 exact lower-west addition, same BODY envelope and original source ownership');
