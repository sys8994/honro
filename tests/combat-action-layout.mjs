/** UI-only arc contracts. Real DOM/hit testing and screenshots are separate browser QA. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const css=await readFile('game/src/controls.css','utf8'),ui=await readFile('shared/runtime/ui-bridge.js','utf8');
const number=name=>Number(css.match(new RegExp(`--${name}:([\\d.]+)(?:px|deg)`))[1]);
const size=number('action-size'),radius=number('action-radius');
const angles=['jump','drop','defend'].map(id=>number(id+'-angle'));
assert.deepEqual(angles,[240,195,150]);
assert(size>=44,'Circular touch targets must be at least 44px');
assert.doesNotMatch(css,/--(?:action-x|action-y|defend-x):/,'No independent pixel offsets');
assert.equal((css.match(/--action-radius:/g)||[]).length,1,'One radius across all layouts');
assert.match(css,/cos\(var\(--action-angle\)\)/);assert.match(css,/sin\(var\(--action-angle\)\)/);
for(const id of ['jump','drop']){
 assert.match(ui,new RegExp(`<button id="${id}" class="fire-button movement-button [^"]+"[^>]*><span class="fire-inner">`));
}
assert.match(ui,/id="drop"[^>]*data-action="drop"[^>]*aria-label="발판 아래로 내려가기"/);
assert.match(ui,/id="jump"[^>]*aria-label="도약"/);
assert.match(ui,/class="icon-btn honro-defend"[^>]*data-action="defend"[^>]*aria-keyshortcuts="F"/);
assert.match(css,/\.movement-button:disabled\{opacity:\.35;cursor:default\}/);
assert.doesNotMatch(css,/#drop:disabled/,'Both movement buttons share disabled styling');
assert.match(css,/\.movement-button:not\(:disabled\):hover/);assert.match(css,/\.movement-button:not\(:disabled\):active/);
assert.match(css,/\.movement-button \.fire-inner\{/);
const rad=d=>d*Math.PI/180;
for(const fire of [68,66,62,56]){
 const width=radius*Math.cos(rad(15))+size/2+fire/2,height=radius*(Math.sin(rad(60))+.5)+size;
 const cx=width-fire/2,cy=radius*Math.sin(rad(60))+size/2;
 const buttons=angles.map(angle=>({x:cx+radius*Math.cos(rad(angle)),y:cy+radius*Math.sin(rad(angle)),size}));
 buttons.push({x:cx,y:cy,size:fire});
 for(const b of buttons){assert(b.x-b.size/2>=-.001&&b.x+b.size/2<=width+.001);assert(b.y-b.size/2>=-.001&&b.y+b.size/2<=height+.001);}
 for(let i=0;i<buttons.length;i++)for(let j=i+1;j<buttons.length;j++){
  const a=buttons[i],b=buttons[j],gap=Math.hypot(a.x-b.x,a.y-b.y)-(a.size+b.size)/2;
  assert(gap>=4.9,`${fire}px fire: circular hit areas must be separated (${gap})`);
 }
 // Readout belongs below fire, to the right of defense, inside the same group.
 const readout={left:width-fire+2,top:cy+fire/2+3,right:width-2,bottom:cy+fire/2+17};
 assert(readout.bottom<=height);assert(readout.left>=buttons[2].x+size/2);
 console.log(`PASS combat arc fire=${fire}px: radius=${radius}px, action=${size}px, bounds=${width.toFixed(2)}x${height.toFixed(2)}`);
}
console.log('PASS shared jump/drop styling, preserved action bindings, one-angle-system arc');

assert.match(css,/\.honro #app \.battle\{\s*--action-size:44px;--action-radius:64px;/);
assert.match(css,/\.battle \.context-interact\{bottom:max\(calc\(130px \+ var\(--action-height\)\)/);
assert.match(css,/\.battle \.context-interact\{bottom:max\(calc\(60px \+ var\(--action-height\)\)/);
console.log('PASS contextual interaction clearance derives from the same arc height');
