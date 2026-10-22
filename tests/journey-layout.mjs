/** Native image anchors and live markup. Browser geometry/input remains separate. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness(),{g}=h;
for(const def of g.HONRO_JOURNEY_MAPS.acts){
 const bytes=await readFile(def.asset),meta=await sharp(bytes).metadata();assert.equal(meta.width,def.width);assert.equal(meta.height,def.height);assert.equal(bytes.length,def.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),def.sha256);assert.equal(def.stages.length,10);
 const app=h.load(h.profileThrough(29));app.journeyAct=def.act;app.journeySelection=def.stages[0].stageNumber;const before=plain(app.profile),html=g.HonroRestJourney.bookMarkup(app);
 assert.equal((html.match(/data-action="journey-select"/g)||[]).length,10);assert(!html.includes('data-action="journey-layer"'));assert(html.includes(`aspect-ratio:${def.width}/${def.height}`));
 for(const a of def.stages){assert(a.x>0&&a.x<def.width&&a.y>0&&a.y<def.height);assert(html.includes(`data-id="${a.stageNumber}" style="left:${a.x/def.width*100}%;top:${a.y/def.height*100}%`));}
 assert.deepEqual(plain(app.profile),before);
}
let app=h.load(h.profileThrough(0));g.HonroRestJourney.showBook(app,1);assert.equal((app.root.innerHTML.match(/data-action="journey-select"/g)||[]).length,1);assert(app.root.innerHTML.includes('journey-fog'));assert(!app.root.innerHTML.includes('폭포 절벽'));g.HonroRestJourney.showBook(app,21,null,3);assert.equal(app.journeyAct,1);
app=h.load(h.profileThrough(24));g.HonroRestJourney.showBook(app,25,null,3);g.HonroRestJourney.selectBook(app,26);assert.equal(app.journeySelection,25);g.HonroRestJourney.travel(app,26);assert.equal(app.screen,'journey');assert(!app.engine);
console.log('PASS three native aspect ratios, 30 supplied anchors/hash/bytes, ten canonical controls per act, no locked names/act leaks, fixed campaign order');
