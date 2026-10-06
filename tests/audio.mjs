import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime(),checks=[];
class AudioStub {
 paused=true;time=0;duration=100;volume=1;src='';listeners={};plays=0;seeks=0;loop=false;
 get currentTime(){return this.time;} set currentTime(value){this.time=value;this.seeks++;}
 addEventListener(name,fn){this.listeners[name]=fn;}
 play(){this.paused=false;this.plays++;return Promise.resolve();}
 pause(){this.paused=true;} removeAttribute(name){if(name==='src')this.src='';} load(){} emit(name){this.listeners[name]?.();}
}
const audios=[],music=new g.HONRO_CORE.BgmPlayer(['01','02','03','04','05'],()=>{const a=new AudioStub();audios.push(a);return a;});
const check=(name,fn)=>{const detail=fn();checks.push({name,...(detail?{detail}:{})});console.log('PASS',name);};
const sessionMusic=()=>new g.HONRO_CORE.BgmPlayer(['01','02','03','04','05'],()=>new AudioStub());
check('No eager media preload or playback',()=>{music.select('main');assert.equal(audios.length,0);});
check('First input unlocks Main Theme',()=>{music.unlock();assert.equal(music.current.src,'01');assert.equal(music.current.plays,1);assert.equal(music.current.loop,true);});
check('Noncombat refresh does not restart Main Theme',()=>{const a=music.current;a.time=17;for(let i=0;i<50;i++){music.select('main');music.tick();}assert.equal(music.current,a);assert.equal(a.currentTime,17);assert.equal(a.plays,1);assert.equal(a.seeks,0);});
check('Battle playlist cycles 02 → 03 → 04 → 02',()=>{music.select('battle','encounter-1');assert.equal(music.current.src,'02');for(const expected of ['03','04','02']){music.current.emit('ended');assert.equal(music.current.src,expected);assert.equal(music.current.loop,false);}});
check('Same encounter refresh preserves battle track and time without seeking',()=>{music.current.emit('ended');const a=music.current;a.time=13;for(let i=0;i<50;i++){music.unlock();music.select('battle','encounter-1');}assert.equal(music.current,a);assert.equal(music.battleIndex,1);assert.equal(a.currentTime,13);assert.equal(a.plays,1);assert.equal(a.seeks,0);});
check('Boss crossfades to looping 05, only two channels',()=>{music.select('boss');assert.equal(music.current.src,'05');assert.equal(music.current.loop,true);music.tick(music.transitionStart+200);assert.ok(music.current.volume>0);assert.ok(music.outgoing.volume>0);assert.ok(audios.filter(a=>!a.paused).length<=2);music.tick(music.transitionStart+500);assert.equal(music.outgoing,null);assert.equal(audios.filter(a=>!a.paused).length,1);});
check('Pause/resume keeps playback position',()=>{const a=music.current;a.time=22;music.setPaused(true);assert.equal(a.paused,true);music.setPaused(false);assert.equal(music.current,a);assert.equal(a.currentTime,22);assert.equal(a.paused,false);assert.equal(a.seeks,0);});
check('Map exit and saved encounter reentry restart playlist beginnings',()=>{music.select('main');music.current.emit('loadedmetadata');assert.equal(music.current.currentTime,0);music.select('battle','encounter-1');assert.equal(music.current.src,'02');music.current.emit('loadedmetadata');assert.equal(music.current.currentTime,0);});
check('Music mute/volume affects BGM independently',()=>{const a=music.current;a.time=8;music.configure(false,.3);assert.ok(a.paused);music.configure(true,.3);assert.ok(!a.paused);music.tick(music.transitionStart+500);assert.equal(a.volume,.3);assert.equal(a.currentTime,8);assert.equal(a.seeks,0);});
check('Missing MP3 skips failed playlist track without throwing',()=>{music.current.error={code:4};music.current.emit('error');assert.equal(music.current.src,'03');assert.equal(music.errors.length,1);});
check('Dispose releases all streams',()=>{music.dispose();assert.equal(audios.filter(a=>!a.paused).length,0);assert.equal(music.current,null);});
check('All six playlist transitions start their first track at zero, including previously heard tracks',()=>{
 const rows=[];for(const from of ['main','battle','boss'])for(const to of ['main','battle','boss'])if(from!==to){
  const m=sessionMusic();m.unlock();m.select(to,'same');m.current.time=43;if(to==='battle'){m.current.emit('ended');m.current.emit('ended');m.current.time=37;}
  m.select(from,'same');m.current.time=29;const outgoing=m.current;m.select(to,'same');m.current.emit('loadedmetadata');
  assert.equal(m.current.src,{main:'01',battle:'02',boss:'05'}[to]);assert.equal(m.current.currentTime,0);assert.notEqual(m.current,outgoing);
  rows.push({from,to,track:m.current.src,seconds:m.current.currentTime});m.dispose();
 }return rows;
});
check('Within unchanged playlists, 150 repeated updates/unlocks never replace or seek audio',()=>{
 for(const state of ['main','battle','boss']){const m=sessionMusic();m.unlock();m.select(state,'one');if(state==='battle')m.current.emit('ended');const a=m.current,index=m.battleIndex;a.time=21;
  for(let i=0;i<150;i++){m.select(state,'one');m.tick();m.unlock();}assert.equal(m.current,a);assert.equal(m.battleIndex,index);assert.equal(a.currentTime,21);assert.equal(a.plays,1);assert.equal(a.seeks,0);m.dispose();}
});
check('Direct new encounters advance once within battle, while main reentry begins at 02',()=>{
 const m=sessionMusic();m.unlock();m.select('battle','one');m.current.time=31;m.select('battle','two');assert.equal(m.current.src,'03');assert.equal(m.current.currentTime,0);
 const second=m.current;for(let i=0;i<50;i++){m.unlock();m.select('battle','two');}assert.equal(m.current,second);
 m.select('battle','three');assert.equal(m.current.src,'04');m.select('battle','four');assert.equal(m.current.src,'02');m.current.emit('ended');assert.equal(m.current.src,'03');m.select('main');m.select('battle','five');assert.equal(m.current.src,'02');assert.equal(m.current.currentTime,0);m.dispose();
});
check('Boss-only fresh encounter restarts zero once without per-frame stutter',()=>{
 const m=sessionMusic();m.unlock();m.select('boss','one');m.current.time=24;m.select('boss','two');const a=m.current;assert.equal(a.currentTime,0);a.time=3;for(let i=0;i<50;i++)m.select('boss','two');assert.equal(a.currentTime,3);assert.equal(a.seeks,1);m.dispose();
});
check('Muted, paused and autoplay-locked playlist changes start zero on resume',()=>{
 for(const mode of ['muted','paused','locked']){const m=sessionMusic();m.unlock();m.select('battle','one');m.current.emit('ended');m.current.time=27;
  if(mode==='muted')m.configure(false,.3);if(mode==='paused')m.setPaused(true);if(mode==='locked')m.unlocked=false;m.select('main');m.select('battle','one');
  if(mode==='muted')m.configure(true,.3);if(mode==='paused')m.setPaused(false);if(mode==='locked')m.unlock();assert.equal(m.current.src,'02');assert.equal(m.current.currentTime,0);assert.equal(m.current.paused,false);m.dispose();}
});
check('Locked departure/return to currently allocated song still honors transition',()=>{
 const m=sessionMusic();m.unlock();m.current.time=34;m.unlocked=false;m.select('battle','one');m.select('main');m.unlock();assert.equal(m.current.src,'01');assert.equal(m.current.currentTime,0);const a=m.current;a.time=2;m.unlock();assert.equal(a.currentTime,2);m.dispose();
});
check('Rapid switches release stale streams and cannot restore metadata offsets',()=>{
 const all=[],m=new g.HONRO_CORE.BgmPlayer(['01','02','03','04','05'],()=>{const a=new AudioStub();all.push(a);return a;});m.unlock();
 for(const state of ['battle','boss','main','boss','battle','main','battle']){m.current.time=39;m.select(state,'one');for(const a of all)a.emit('loadedmetadata');assert.equal(m.current.currentTime,0);assert.ok(all.filter(a=>!a.paused).length<=2);}
 m.tick(m.transitionStart+500);assert.equal(all.filter(a=>!a.paused).length,1);m.dispose();assert.equal(all.filter(a=>!a.paused).length,0);
});
await writeFile('_local/reports/audio-unit.json',JSON.stringify({passed:checks.length,checks},null,2)+'\n');
