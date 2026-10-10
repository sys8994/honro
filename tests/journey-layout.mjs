/** Coordinate/markup contracts. Actual viewport and input checks live in the browser suites. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {menuRuntime,menuProfile} from '../tools/environment/atlas-proof.mjs';
const g=await menuRuntime(),A=g.HonroJourneyArt,f=A.bookFrame;
assert.deepEqual(JSON.parse(JSON.stringify(f)),{x:-180,y:-105,width:2160,height:1260});
for(const layer of ['surface','underground','city']){
 const p=menuProfile(g,30),saved=JSON.stringify(p),a={profile:p,journeyLayer:layer,journeySelection:layer==='surface'?12:layer==='underground'?18:30,debugMode:true,top:()=>''};
 const html=g.HonroRestJourney.bookMarkup(a),svg=A.bookAtlas(layer);
 assert.equal(svg,A.bookAtlas(layer));assert.match(svg,/viewBox="-180 -105 2160 1260"/);assert.match(svg,/expanded-atlas-landscape/);assert.doesNotMatch(svg,/<(?:image|script|foreignObject)\b/);
 assert.match(html,/<section class="journey-map-viewport"[^>]*><div class="journey-map-scroll">/);
 assert.match(html,/<\/div><\/div><div class="journey-map-legend">/);
 for(const v of g.HonroJourneyContent.places.filter(v=>v.layer===layer)){
  assert(html.includes(`data-id="${v.stageId}" style="left:${(v.map[0]-f.x)/f.width*100}%;top:${(v.map[1]-f.y)/f.height*100}%`));
 }
 assert.equal(JSON.stringify(p),saved);
}
const css=await fs.readFile('game/src/journey.css','utf8');assert.match(css,/max\(100cqw,171\.428572cqh,897\.6px\)/);assert.match(css,/journey-map-legend\{position:absolute/);
for(const [w,h] of [[1917,706],[2560,750],[390,480],[844,300]])for(const z of [.85,1,1.35]){
 const width=Math.max(w,h*2160/1260,897.6)*z/.85;assert(width>=w-1e-6&&width*1260/2160>=h-1e-6);
}
console.log('PASS expanded paper, route/pin projection, viewport fit equation, legend sibling and unchanged profile; browser layout remains separate');
