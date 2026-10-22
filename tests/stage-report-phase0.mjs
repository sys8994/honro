import assert from 'node:assert/strict';
import {appHarness,plain,KEY} from './app-regression-helpers.mjs';
const h=await appHarness();
for(const dismiss of ['cancel','close','dismiss']){
 const a=h.load(h.profileThrough(4));a.launch(5);h.finish(a);a.engine.b.round=9;a.pause();
 const engine=a.engine,b=plain(engine.b),p=plain(a.profile),saved=h.storage.get(KEY);
 h.click('rest');assert.equal(a.modalKind,'journey-confirm');
 if(dismiss==='dismiss')a.dismissModal();else h.click(dismiss==='cancel'?'cancel-journey-launch':'close');
 assert.equal(a.modalKind,'pause-dialog');assert(a.modal.classList.contains('open'));assert.equal(a.pendingJourneyLaunch,null);
 assert.equal(a.engine,engine);assert.deepEqual(plain(engine.b),b);assert.deepEqual(plain(a.profile),p);assert.equal(h.storage.get(KEY),saved);
 console.log('PASS battle rest confirmation '+dismiss+' preserves pause and exact battle/save');
}
for(const origin of ['rest','journey']){
 const a=h.load(h.profileThrough(4));a.launch(5);h.finish(a);a.stopBattle();a.showRest();h.finish(a);
 if(origin==='journey'){h.click('journey-book');h.click('journey-select',{id:'5'});h.click('journey-travel',{id:'5'});}else h.click('journey-enter',{id:'5'});
 assert.equal(a.modalKind,'journey-confirm');const snapshot=plain(a.profile);a.dismissModal();assert.equal(a.screen,origin);assert(!a.modal.classList.contains('open'));assert.notEqual(a.modalKind,'pause-dialog');assert.deepEqual(plain(a.profile),snapshot);
 console.log('PASS '+origin+' confirmation returns only to its own origin');
}
