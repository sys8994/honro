import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
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
const bodyFile=fs.readFileSync('shared/assets/environment/act5/stage42-registered-body.json');
const wall=JSON.parse(bodyFile);
const shaText=value=>createHash('sha256').update(value).digest('hex');
const sha=value=>shaText(JSON.stringify(value));

// Exact accepted source for Actions 44742313752: only 95 closed, covered contours
// were removed in two dParts leaves; the previously failing c229 stays present.
// Gzip is test-only, storing the exact removed source strings (no served asset).
// Tuple: [leaf ordinal, approved list SHA, accepted list SHA, per-part [[insertion ordinal, original bytes]]].
const inverseZ64=(
  'H4sIAAAAAAACA229R5Ikuc41upWwHpfRCA2Ma9pvA/+1b9Cl9r+EZwegZ7hX5jCQpFNDHIj83/+Yv/2TP/mn63/5iyjZfPsfNfvhv37++O0/d4'+
  'hv2j8kf239wZv/q1//VRH5jx9h//2Mn7/++fbPr5+m6vaT/vAP++8XmcR/+uvn/v2fZEjYr1T6FfFb48/vHz/++/HH//vzh3/rr/j5X5XlP9/+'+
  '97//+/a//4V+++f/e3H6YrP0b1m0OEjz9f3FGYvUQNwrtCJfnLlK6zQUFckX117s4vEti5dlpaJz8VJXl29ZujyiommC1TUtzTT6i65qcqNhaF'+
  '3mSc+WsoQ1Z5yqvfPLif+/1z//9+1/tK1XFrTExPhbma0dzP35wAfE8kbl0CXbXb+V+drbUx60WBSS0r3f1FyiO/nxxVocovoY+6J9f7HXChK1'+
  'e0vPpZvl8cUb7Tb2jfoxy9sX36v5vO6zMbyxMV683LbUt4q9rCTs9b2pujdlU4vU8+U4/Uh8CotMDX551trqiXa2qEQcvTOWkLF8q4ilm6pe3i'+
  'ekAVqtcHNqmmdhwrkXDp9Ob2Kl+lZJi9iaEiTWBI9yfC7Xvv3+3lNh8aJ7K1yaTYpBabmWvLxkVfme9WbQ7s4ly7Y7N1UqSXsPau9D4+CUL3fr'+
  '2k7HdtrWZdjlx9xs8yphvhFt03Iq0m+VvJyU7UGTFYm1f39QdZVmt/z4oK3Mnf4Y+aKhsy8mFnm0jGUs+vzgm3Yf+k19T/L9xfdiPq/6bIsItq'+
  'U2LerXXbWX4268vr+ycrFn+LfKWqZZr8xc0Q+5yleUk91otPde2/rtPqiyNIVfePzlZXZolPLKssWq2L6qVUyZPbQv98TKCi+J6JVVaxvVGTo5'+
  '/VV7L1Pa3DRhJwxdW1YY0bcqW6Lk+aqti0QIC6QVLEpfLvraFb0ui5cJPqSLsYJz3Fzb30Tbe8WulB4wTJL7BrhoxLeqWJbggt/7i3szVy8rI4'+
  'z6wNTdtFtWSUgfLKWZ9RdLo7e0j5uouKmbUnR6k+y8T+fTtK9lNa/14GXGeOqlyySon3XQMozZVDeVeDkellW39LXJlV/uuBQBDlq5PMnBLd3B'+
  'vYwSJ4u7bzQ085jDJpWXOxjFLgVJwaP0jLwDy6K9wZm8SeF1CLr55SGrwJZAs8U7uqeuEtkx3+PkfHnYgnw5Y2zFuE+aR0zvG9WWEGEYX16yD2'+
  '2r4ouxMtPPKDtt+NleXEo+KyZrrrdX7cDbq1pMZlhKHvbQr8OSe+hYyaZNJOxSj6zk0V1TmL0nqJmcfTPShfMsWsr7xG2ZekXvjmUz19KlVGlf'+
  'HvN1D5oXashy3+T9IRIPTA1UNmWdzzPeKGiZe8/TkwrjlwZOd8dMbqdUdm9fzGTU1Igt9dLAteVtfWM2RXHTiqLmeWBl1L1zCUtWU1kjuqFX7p'+
  'ihY2/vQbCwmaKn9IFgQmItI0pXVRCG1rXdu7eCJzh9uexrX6L3xXGyw1Ryaar0yizWZu09uKhq3i1rztaN9aVWizClOdqw2RfnJWXO531k6Utd'+
  'FitTDS0Ue3Wn4bbM0j6ouBxKWflSp1VCOz/mE1/O/FpaNp8XGW7SDQLaIPilOA6D5oCYyvVVkivC6dxQNfdX6V6bSfuR1xIJTK4UF9gELallWH'+
  'RLV7Gm+WoOLHqUCdoka2vz+RJau0SxL0SL3F4le3lYswPakA02zdyVzrN0tdNZosJms2oHhuHF5MS9VTuH9nnVZ1u0lSytfeRjfwhXC7uetQoS'+
  '+ZwFFzUNwnd2hTzsQeIlw+jvRIGclB6ETYar2VKpaFqUDuuzVaNhKbQ7LZPhf8ZcL4WYNMsh7b3ppXgjfDG/MOmrggtiomc6vMmaRuL7zDqHJi'+
  's9Pi6aep2RKdzPjhKYpxYWKn42Z1Pklxt27WiLztIclnPJg+oDs71Eth2dgNL8VUYrKlNmGSL0JIEFunTnG9WXK8Xzg7Ei6zlyri3GfUl9bY7Z'+
  'lsStwXW2xdi207monrT30Hcq5r3z+UVeVvbloq9dseEsvjT2kYgbdxOP21q31cMGNk7bdQVlXIqSbX3SdLnXsIYbFa+vGYtBenLNTkF0vdRjbZ'+
  'zyjYbetdxJ6NGyIF79jJ042y8mfi0MosRdVp32Uv+66WIcE++l9nKT1V1ZF4Qx/to/be16efMx/PTF8Xp+6hokLiUVGv2sH9ZV63qwQfLSAFyk'+
  'lUJ1iM15GEHeyqOE17VN7NxaZiwqPe+scFVAkqxh6dB0NGdgFfHhSJRtRRWYU+rmYWgOu7uIlrkpehMMa3sVVIviebm+0kkuFXWrnnsmjJvbQs'+
  'DPQzAl/WrJ15aAn6fr4vPH8H/TwUzni+GvtFqGkyVdFK/EMfTEYjG90ng1a2NaVq9UX4m/cix03XMKAi7xSqUlmJfUMnml6Cqfn8n9s/dQIaBf'+
  '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'+
  'lhcgAA'
);
const inverse=gunzipSync(Buffer.from(inverseZ64,'base64'),{maxOutputLength:40000});
assert.equal(shaText(inverse),'2b98255c3108399b019da89ee5e421fcd779399c6c58e04e4aabd9b59698a4ba','Signed contour inverse receipt bytes');
assert.equal(shaText(bodyFile),'2409a384463d48a501f3c4da4bd03ed670ae82b48f4c4277669bed5076431aed','Exact officially matched registered BODY');
assert.equal(sha(wall.vector),'93a36457b8a0f59ed7d87caa1b882ca26e673b34380591dedb1a9d99145649e1','Exact accepted optimized runtime vector');
const retainedLeaves=v=>v.root.children[1].children[0].children[0].children[0].children;
const original=structuredClone(wall);
const removals=JSON.parse(inverse);
assert.deepEqual(removals.map(v=>v[0]),[22,23],'Only two original painted dParts leaves may be restored');
let stockFile=bodyFile.toString(),inserted=0,segments=0,insertedBytes=0;
const split=d=>d.match(/M[^M]+/g)||[];
const closedEndpoints=ring=>{
  assert.match(ring.trim(),/^M.+Z$/);
  const tokens=[...ring.matchAll(/([MLCQZ])([^MLCQZ]*)/g)];
  assert.equal(tokens.map(x=>x[0]).join(''),ring);
  let start,last,n=0;
  for(const [,cmd,s] of tokens){
    const v=Array.from(s.matchAll(/-?(?:\d+\.?\d*|\.\d+)/g),a=>Number(a[0]));
    if(cmd==='M'){assert.equal(v.length,2);start=last=v;continue;}
    if(cmd==='Z'){assert.equal(v.length,0);if(start[0]!==last[0]||start[1]!==last[1])n++;continue;}
    const a={L:2,C:6,Q:4}[cmd];
    assert(v.length>=a&&v.length%a===0);n+=v.length/a;last=v.slice(-2);
  }
  return n;
};
for(const [index,oldSHA,newSHA,parts] of removals){
  const leaf=retainedLeaves(wall.vector)[index],pre=retainedLeaves(original.vector)[index];
  assert.equal(leaf.fill,'#1e2a35','Same exact original opaque paint');
  assert.equal(sha(leaf.dParts),newSHA,'Exact tested list for this leaf');
  assert.equal(parts.length,leaf.dParts.length,'Compound section boundaries stay original');
  const hit=[];
  pre.dParts=leaf.dParts.map((d,i)=>{
    const next=split(d),adds=parts[i];assert.equal(next.join(''),d);
    const wanted=new Map(adds);assert.equal(wanted.size,adds.length);
    const restored=[];let at=0;
    for(let k=0;k<next.length+adds.length;k++){
      const ring=wanted.get(k);
      if(ring!==undefined){
        assert.equal(split(ring).length,1);
        inserted++;insertedBytes+=Buffer.byteLength(ring);segments+=closedEndpoints(ring);restored.push(ring);hit.push(ring);
      }else{assert(at<next.length);restored.push(next[at++]);}
    }
    assert.equal(at,next.length,'Inverse cannot rewrite or lose retained paths');
    return restored.join('');
  });
  assert.equal(hit.length,index===22?57:38);
  assert.equal(sha(pre.dParts),oldSHA,'Restored list exact to approved left-lower snapshot');
  const token=JSON.stringify(leaf.dParts);
  assert.equal(stockFile.split(token).length,2,'Inverse may splice exactly one original slot each');
  stockFile=stockFile.replace(token,JSON.stringify(pre.dParts));
}
assert.equal(inserted,95);assert.equal(segments,483);assert.equal(insertedBytes,28212);
assert.equal(shaText(stockFile),'f2288c4b9fd67c611a7a0d290d9bf9afa99082d708c5fedfdbb10062fba14f60','Inverse returns byte-exact approved 09841989 BODY');
assert.deepEqual(JSON.parse(stockFile),original);

// Run every previous protection on the exact reconstructed, pre-optimization source.
const {vector,bounds,reference:{bounds:referenceBounds,...reference},...metadata}=original;
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
console.log('PASS: Stage42 exact 95-contour reduction; original approved paint, clips and lower-west source proven by inverse');
