/** UI contracts. Geometry and visual hierarchy are separate browser QA gates. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const css=await readFile('game/src/controls.css','utf8'),ui=await readFile('shared/runtime/ui-bridge.js','utf8');
const number=name=>Number(css.match(new RegExp(`--${name}:([\\d.]+)(?:px|deg|%)`))[1]);
const faceInset=number('fire-face-inset');
const sizes=[...css.matchAll(/--action-size:(\d+)px;--fire-size:(\d+)px/g)].map(m=>({size:Number(m[1]),fire:Number(m[2])}));
assert.deepEqual(sizes,[{size:38,fire:68},{size:34,fire:62},{size:35,fire:66},{size:31,fire:56}], 'Restore the original secondary/primary outer sizes at each breakpoint');
assert.equal(faceInset,12,'The fire face is visibly larger, not just an empty outer ring');
assert.match(css,/#fire \.fire-inner\{\s*position:absolute!important;inset:var\(--fire-face-inset\)!important/);
assert.match(css,/#fire \.fire-inner svg\{width:20px!important;height:20px!important/);
const angles=['jump','drop','defend'].map(id=>number(id+'-angle'));
assert.deepEqual(angles,[240,195,150]);
assert.doesNotMatch(css,/--(?:action-x|action-y|defend-x):/,'No independent button pixel offsets');
assert.equal((css.match(/--action-radius:/g)||[]).length,1,'One common radius formula, shared by all three actions at each breakpoint');
assert.match(css,/--action-radius:calc\(\(var\(--fire-size\) \+ var\(--action-size\)\) \/ 2 \+ 5px\)/);
assert.match(css,/cos\(var\(--action-angle\)\)/);assert.match(css,/sin\(var\(--action-angle\)\)/);
for(const id of ['jump','drop'])assert.match(ui,new RegExp(`<button id="${id}" class="fire-button movement-button [^"]+"[^>]*><span class="fire-inner">`));
assert.match(ui,/id="drop"[^>]*data-action="drop"[^>]*aria-label="발판 아래로 내려가기"/);
assert.match(ui,/id="jump"[^>]*aria-label="도약"/);
assert.match(ui,/class="icon-btn honro-defend"[^>]*data-action="defend"[^>]*aria-keyshortcuts="F"/);
assert.match(css,/\.movement-button:disabled\{opacity:\.35;cursor:default\}/);
assert.doesNotMatch(css,/#drop:disabled/,'Both movement buttons share disabled styling');
assert.match(css,/\.movement-button:not\(:disabled\):hover/);assert.match(css,/\.movement-button:not\(:disabled\):active/);
assert.match(css,/\.movement-button \.fire-inner\{/);
const rad=d=>d*Math.PI/180;
for(const {size,fire} of sizes){
 const radius=(fire+size)/2+5;
 // Visual and real circular hit areas have the same diameter. A fixed44px
 // target requirement must not silently erase the requested primary hierarchy.
 assert(size>=31&&size<=38);assert(fire/size>=1.75);
 const secondaryFace=size-6,primaryFace=fire*(1-2*faceInset/100);
 assert(primaryFace/secondaryFace>=1.6,'Primary gold face must be clearly larger than the secondary gold face');
 const width=radius*Math.cos(rad(15))+size/2+fire/2;
 const cx=width-fire/2,cy=radius*Math.sin(rad(60))+size/2;
 const height=Math.max(radius*(Math.sin(rad(60))+.5)+size,cy+fire/2+12);
 const buttons=angles.map(angle=>({x:cx+radius*Math.cos(rad(angle)),y:cy+radius*Math.sin(rad(angle)),size}));
 buttons.push({x:cx,y:cy,size:fire});
 for(const b of buttons){assert(b.x-b.size/2>=-.001&&b.x+b.size/2<=width+.001);assert(b.y-b.size/2>=-.001&&b.y+b.size/2<=height+.001);}
 for(let i=0;i<buttons.length;i++)for(let j=i+1;j<buttons.length;j++){
  const a=buttons[i],b=buttons[j],gap=Math.hypot(a.x-b.x,a.y-b.y)-(a.size+b.size)/2;
  assert(gap>=4.99,`${fire}px fire: visible and actual circular hit areas must be separated (${gap})`);
 }
 const readout={left:width-fire+4,top:cy+fire/2+1,right:width-4,bottom:cy+fire/2+12};
 assert(readout.bottom<=height+.001);assert(readout.left>=buttons[2].x+size/2);
 console.log(`PASS arc secondary=${size}px/fire=${fire}px, gold-face ratio=${(primaryFace/secondaryFace).toFixed(2)}, radius=${radius}px, bounds=${width.toFixed(2)}x${height.toFixed(2)}`);
}
console.log('PASS separate geometry and primary/secondary hierarchy contracts; shared jump/drop style and unchanged bindings');
assert.match(css,/--action-height:max\(calc\(/,'Readout also participates in actual HUD height');
assert.match(css,/\.battle \.context-interact\{bottom:calc\(var\(--hud-height\) \+ 10px\)/);
assert.match(css,/--hud-height:calc\(40px \+ 4px \+ var\(--action-height\)/);

const hud=await readFile('game/src/hud.css','utf8');
assert.match(css,/--joystick-size:72px;--hud-inline:20px/);
assert.match(css,/--joystick-size:72px/);assert.match(css,/--joystick-size:68px;--hud-inline:16px/);
assert.doesNotMatch(css,/\.(?:joystick|joystick-ring)\{[^}]*width:(48|56|64)px/);
assert.doesNotMatch(ui,/class="hud-xp"|id="hud-xp-fill"/,'XP is not permanently present in the battle HUD');
assert.doesNotMatch(css,/--xp-row-height/,'No empty XP row reservation');
assert.match(css,/--hud-roster-height:66px;--hud-vitals-height:20px/);
assert.match(css,/grid-template-rows:repeat\(3,18px\)!important/);
assert.match(css,/@media\(orientation:portrait\) and \(max-width:299px\)/);
for(const [viewport,padding,joystick,skills] of [[320,16,68,92],[333,16,68,92],[360,16,68,92],[390,20,72,110],[400,20,72,110]]){
 const arc=53*Math.cos(rad(15))+34/2+62/2;
 const sideGap=(viewport-2*padding-joystick-skills-arc)/2;
 assert(sideGap>=10,'The middle skills need breathing room beside the compact action group');
 console.log(`PASS ${viewport}px HUD: joystick=${joystick}px, safe-side=${padding}px, skill-side gap=${sideGap.toFixed(2)}px, no XP row`);
}
assert.match(css,/--hud-height:calc\(var\(--action-height\) \+ var\(--hud-block-start\) \+ var\(--hud-block-end\) \+ 1px\)/);
assert.match(css,/padding:var\(--hud-block-start\) [^;]+var\(--hud-block-end\)/);
assert.match(css,/--hud-height:calc\(var\(--hud-roster-height\) \+ var\(--hud-vitals-height\) \+ var\(--action-height\) \+ var\(--hud-skill-wrap\)/);
assert.match(hud,/grid-template-rows:var\(--hud-roster-height\) var\(--hud-vitals-height\) calc\(var\(--action-height\) \+ var\(--hud-skill-wrap\)\)/);
console.log('PASS all battlefield/context reservations match the reduced HUD rows');

const presentation=await readFile('game/src/skill-presentation.css','utf8');
assert.match(presentation,/--hud-roster-height:40px/);
assert.match(presentation,/grid-template-columns:minmax\(0,1fr\) 36px/);
assert.match(presentation,/summary::after\{content:'상태'/);
console.log('PASS portrait status remains reachable in the compact40px party row');

assert.match(presentation,/hero-switches\{grid-column:1!important;grid-row:1!important;/,'Portrait party must not inherit the old full-row span');
assert.match(presentation,/combat-status\{grid-column:2!important;grid-row:1!important;/,'Status stays beside the party rather than over the vital row');
assert.match(presentation,/grid-template-rows:40px!important/);
assert.match(presentation,/strong,\.honro #app \.honro-compact-hud \.ally-chip small\{margin:0!important;line-height:1\.25!important/);
console.log('PASS explicit portrait roster placement and unclipped text line height');
