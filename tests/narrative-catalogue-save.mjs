import assert from 'node:assert/strict';
import {appHarness,plain,KEY} from './app-regression-helpers.mjs';
const h=await appHarness(),{g}=h;
for(const legacy of [false,true]){
 const app=h.load(h.profileThrough(1));app.launch(2);h.finish(app);app.close();
 const b=app.engine.b;if(legacy)delete b.honroNarrativeCatalogueRevision;
 const hero=b.units.find(u=>u.side===0);hero.hp-=11;hero.focus-=4;hero.cooldowns={A06:2};
 const rows=legacy?[['설오','이미 저장한 첫 줄',{storyId:'saved-verbatim'}],['담허','이미 저장한 다음 줄',{storyId:'saved-verbatim'}]]:g.HonroObjectiveRevision.contentFor(b,app.stage).outro;
 g.HonroStory.start(app,rows,{id:'saved-boundary'});app.dialogue.index=legacy?1:7;g.HonroNarrativeRevision.reveal(b,rows[app.dialogue.index]);g.HonroStory.save(app);
 const before=plain({units:b.units,markers:b.honroMarkers,state:b.honroState,story:b.honroStory});
 app.profile.honroBattle=plain(b);h.storage.set(KEY,JSON.stringify(app.profile));const resumed=h.reload();resumed.continue();
 assert.equal(resumed.dialogue.index,before.story.index);assert.deepEqual(plain(resumed.dialogue.lines),before.story.lines);
 assert.deepEqual(plain(resumed.engine.b.units),before.units);assert.deepEqual(plain(resumed.engine.b.honroMarkers),before.markers);
 const file=plain(app.profile);file.honroBattle=plain(b);
 const imported=h.load(h.profileThrough(0));await h.import(file);imported.continue();
 assert.equal(imported.dialogue.index,before.story.index,'import cursor');assert.deepEqual(plain(imported.dialogue.lines),before.story.lines,'import verbatim rows');
 assert.deepEqual(plain(imported.engine.b.units),before.units,'import HP/MP/cooldown');assert.deepEqual(plain(imported.engine.b.honroMarkers),before.markers,'import quest markers');
 assert.equal(g.HonroStoryContent.version,7,'seen prologue ID must stay v7');
}
console.log('PASS current and legacy stored dialogue cursor/text/HP/MP/cooldown/quest markers survive Continue/import; prologue seen key stays v7');
