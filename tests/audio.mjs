import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime(),checks=[];
class AudioStub {
 paused=true;currentTime=0;duration=100;volume=1;src='';listeners={};plays=0;loop=false;
 addEventListener(name,fn){this.listeners[name]=fn;}
 play(){this.paused=false;this.plays++;return Promise.resolve();}
 pause(){this.paused=true;}
 removeAttribute(name){if(name==='src')this.src='';}
 load(){}
 emit(name){this.listeners[name]?.();}
}
const audios=[],music=new g.HONRO_CORE.BgmPlayer(['01','02','03','04','05'],()=>{const a=new AudioStub();audios.push(a);return a;});
const check=(name,fn)=>{fn();checks.push(name);console.log('PASS',name);};
check('No eager media preload or playback',()=>{music.select('main');assert.equal(audios.length,0);});
check('First input unlocks Main Theme',()=>{music.unlock();assert.equal(music.current.src,'01');assert.equal(music.current.plays,1);assert.equal(music.current.loop,true);});
check('Noncombat refresh does not restart Main Theme',()=>{const a=music.current;a.currentTime=17;for(let i=0;i<50;i++){music.select('main');music.tick();}assert.equal(music.current,a);assert.equal(a.currentTime,17);assert.equal(a.plays,1);});
check('Battle playlist cycles 02 → 03 → 04 → 02',()=>{music.select('battle','encounter-1');assert.equal(music.current.src,'02');for(const expected of ['03','04','02']){music.current.emit('ended');assert.equal(music.current.src,expected);assert.equal(music.current.loop,false);}});
check('Same encounter refresh preserves battle track and time',()=>{music.current.emit('ended');const a=music.current;a.currentTime=13;for(let i=0;i<50;i++)music.select('battle','encounter-1');assert.equal(music.current,a);assert.equal(music.battleIndex,1);assert.equal(a.currentTime,13);});
check('Boss crossfades to looping 05, only two channels',()=>{music.select('boss');assert.equal(music.current.src,'05');assert.equal(music.current.loop,true);music.tick(music.transitionStart+200);assert.ok(music.current.volume>0);assert.ok(music.outgoing.volume>0);assert.ok(audios.filter(a=>!a.paused).length<=2);music.tick(music.transitionStart+500);assert.equal(music.outgoing,null);assert.equal(audios.filter(a=>!a.paused).length,1);});
check('Pause/resume keeps playback position',()=>{const a=music.current;a.currentTime=22;music.setPaused(true);assert.equal(a.paused,true);music.setPaused(false);assert.equal(music.current,a);assert.equal(a.currentTime,22);assert.equal(a.paused,false);});
check('Map visit and saved encounter resume retain song and position',()=>{music.select('main');music.current.emit('loadedmetadata');assert.equal(music.current.currentTime,17);music.select('battle','encounter-1');assert.equal(music.current.src,'03');music.current.emit('loadedmetadata');assert.equal(music.current.currentTime,13);});
check('Music mute/volume affects BGM independently',()=>{music.configure(false,.3);assert.ok(music.current.paused);music.configure(true,.3);assert.ok(!music.current.paused);music.tick(music.transitionStart+500);assert.equal(music.current.volume,.3);});
check('Missing MP3 skips the failed playlist track without throwing',()=>{music.current.error={code:4};music.current.emit('error');assert.equal(music.current.src,'04');assert.equal(music.errors.length,1);});
check('Dispose releases all streams',()=>{music.dispose();assert.equal(audios.filter(a=>!a.paused).length,0);assert.equal(music.current,null);});
const sessionMusic=()=>new g.HONRO_CORE.BgmPlayer(['01','02','03','04','05'],()=>new AudioStub());
check('New encounters advance once, through a map or directly, and wrap from the last song',()=>{
 const m=sessionMusic();m.unlock();m.select('battle','one');m.current.currentTime=31;
 m.select('main');m.select('battle','two');assert.equal(m.current.src,'03');
 const second=m.current;for(let i=0;i<50;i++){m.unlock();m.select('battle','two');}assert.equal(m.current,second);
 m.select('battle','three');assert.equal(m.current.src,'04');
 m.select('main');m.select('battle','four');m.current.emit('loadedmetadata');assert.equal(m.current.src,'02');assert.equal(m.current.currentTime,0);
 m.current.emit('ended');assert.equal(m.current.src,'03');m.select('battle','five');assert.equal(m.current.src,'04');m.dispose();
});
check('Boss interruptions preserve the next normal song; boss-only encounters consume none',()=>{
 const m=sessionMusic();m.unlock();m.select('battle','one');m.current.emit('ended');
 m.select('boss','one');m.select('main');m.select('boss','one');assert.equal(m.battleIndex,1);
 m.select('boss','boss-two');assert.equal(m.battleIndex,2);
 m.select('main');m.select('boss','boss-three');assert.equal(m.battleIndex,2);
 m.select('battle','normal-four');assert.equal(m.current.src,'04');m.dispose();
});
check('Autoplay lock and mute preserve encounter order without eager streams',()=>{
 const m=sessionMusic();m.select('battle','one');m.select('main');m.select('battle','two');assert.equal(m.current,null);
 m.configure(false,.3);m.unlock();assert.equal(m.current.src,'03');assert.equal(m.current.plays,0);
 m.configure(true,.3);assert.equal(m.current.plays,1);m.setPaused(true);m.select('battle','two');m.setPaused(false);assert.equal(m.current.src,'03');m.dispose();
});
await writeFile('_local/reports/audio-unit.json',JSON.stringify({passed:checks.length,checks},null,2)+'\n');
