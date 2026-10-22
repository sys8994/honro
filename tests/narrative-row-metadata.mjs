// Current direction/camera decisions must survive a prose-only change.
// Empty text is a test fixture, never production editorial content.
import assert from 'node:assert/strict';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness(),g=h.g;let rows=0;
for(let id=1;id<=30;id++){
 const app=h.load(h.profileThrough(id-1));app.launch(id);const b=app.engine.b;
 const lines=g.HonroObjectiveRevision.contentFor(b,app.stage).story;
 assert(lines.length>0);assert(lines.every(r=>r[2]?.rowId),'current entry row IDs '+id);
 const blank=lines.map(([who,text,meta])=>[who,'',meta]);
 const before=JSON.stringify(b),options={after:'entry'};
 const direction=g.HonroStoryDirection.build(app,lines,options),changed=g.HonroStoryDirection.build(app,blank,options);
 assert.deepEqual(plain(changed),plain(direction),'directions depend only on row metadata '+id);
 const camera=xs=>plain(g.HonroStoryFraming.bind(app,xs,options).map(r=>r[2].camera));
 assert.deepEqual(camera(blank),camera(lines),'camera choices do not parse prose '+id);
 assert.equal(JSON.stringify(b),before,'direction/camera binding must preserve quest, units and resources '+id);rows+=lines.length;
}
console.log('PASS 30 current entries / '+rows+' rows: persistent IDs, prose-independent direction/camera and unchanged battle/quest/resource state');
