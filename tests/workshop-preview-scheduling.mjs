// Scheduler unit checks only. These do not claim browser responsiveness or art QA.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile('workshop/src/app.js','utf8');
const start=source.indexOf('let previewFrame=0,previewObserver=null;');
const end=source.indexOf('function renderAssetPreview(c)',start);
assert(start>0&&end>start);
const pending=new Map(),observations=[],rendered=[];let serial=0,unitPaints=0,stagePaints=0;
const tiles=[{id:'visible'},{id:'offscreen'}];
const g=vm.createContext({
 $$:()=>tiles,requestAnimationFrame:fn=>{pending.set(++serial,fn);return serial;},cancelAnimationFrame:id=>pending.delete(id),
 IntersectionObserver:class {constructor(cb){this.cb=cb;this.observed=[];this.disconnected=false;observations.push(this)}observe(c){this.observed.push(c)}unobserve(c){this.observed=this.observed.filter(v=>v!==c)}disconnect(){this.disconnected=true}},
 renderAssetPreview:c=>rendered.push(c.id),renderUnitPreviews:()=>unitPaints++,renderStage:()=>stagePaints++,document:{hidden:false},currentTab:'stage'
});
vm.runInContext(source.slice(start,end),g);
for(let i=0;i<3;i++)vm.runInContext('schedulePreviews()',g);
assert.equal(pending.size,1,'Resize/rebuild coalesces pending preview work');
const fn=[...pending.values()][0];pending.clear();fn();assert.equal(unitPaints,1);
assert.deepEqual(rendered,[],'No asset paints before visibility is observed');
observations[0].cb([{target:tiles[0],isIntersecting:true},{target:tiles[1],isIntersecting:false}]);
assert.deepEqual(rendered,['visible']);assert.equal(observations[0].observed.length,1);
vm.runInContext('schedulePreviews()',g);assert.equal(observations[0].disconnected,true,'Rebuilt DOM releases old observer');
const loopStart=source.indexOf('let lastEditorPaint=0;');const loopEnd=source.indexOf('\n\nfunction renderToolbars',loopStart);
assert(loopStart>0&&loopEnd>loopStart);vm.runInContext(source.slice(loopStart,loopEnd),g);
vm.runInContext('loop(100);loop(125);loop(200);loop(250)',g);assert.equal(stagePaints,2);
g.document.hidden=true;vm.runInContext('loop(1000)',g);assert.equal(stagePaints,2,'Hidden editor does not repaint');
g.document.hidden=false;g.currentTab='play';vm.runInContext('loop(2000)',g);assert.equal(stagePaints,2,'Does not interfere with actual playtest loop');
console.log('PASS editor preview scheduling: visible tiles only, coalescing, hidden/play skipping. Browser responsiveness unverified.');
