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
check('Battle playlist cycles 02 → 03 → 04 → 02',()=>{music.select('battle');assert.equal(music.current.src,'02');for(const expected of ['03','04','02']){music.current.emit('ended');assert.equal(music.current.src,expected);assert.equal(music.current.loop,false);}});
check('Stage change preserves battle track and time',()=>{music.current.emit('ended');const a=music.current;a.currentTime=13;music.select('battle');assert.equal(music.current,a);assert.equal(music.battleIndex,1);assert.equal(a.currentTime,13);});
check('Boss crossfades to looping 05, only two channels',()=>{music.select('boss');assert.equal(music.current.src,'05');assert.equal(music.current.loop,true);music.tick(music.transitionStart+200);assert.ok(music.current.volume>0);assert.ok(music.outgoing.volume>0);assert.ok(audios.filter(a=>!a.paused).length<=2);music.tick(music.transitionStart+500);assert.equal(music.outgoing,null);assert.equal(audios.filter(a=>!a.paused).length,1);});
check('Pause/resume keeps playback position',()=>{const a=music.current;a.currentTime=22;music.setPaused(true);assert.equal(a.paused,true);music.setPaused(false);assert.equal(music.current,a);assert.equal(a.currentTime,22);assert.equal(a.paused,false);});
check('Main return and battle index are retained',()=>{music.select('main');music.current.emit('loadedmetadata');assert.equal(music.current.currentTime,17);music.select('battle');assert.equal(music.current.src,'03');music.current.emit('loadedmetadata');assert.equal(music.current.currentTime,13);});
check('Music mute/volume affects BGM independently',()=>{music.configure(false,.3);assert.ok(music.current.paused);music.configure(true,.3);assert.ok(!music.current.paused);music.tick(music.transitionStart+500);assert.equal(music.current.volume,.3);});
check('Missing MP3 skips the failed playlist track without throwing',()=>{music.current.error={code:4};music.current.emit('error');assert.equal(music.current.src,'04');assert.equal(music.errors.length,1);});
check('Dispose releases all streams',()=>{music.dispose();assert.equal(audios.filter(a=>!a.paused).length,0);assert.equal(music.current,null);});
await writeFile('reports/audio-unit.json',JSON.stringify({passed:checks.length,checks},null,2)+'\n');
