import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
import ts from '../game/node_modules/typescript/lib/typescript.js';
// Focus on the streaming channel directly; do not build unrelated runtime/assets.
const g=vm.createContext({performance:{now:()=>0},exports:{}}),checks=[];
const SOURCE_MAIN=await readFile(new URL('../shared/runtime/main.js',import.meta.url),'utf8');
const source=await readFile(new URL('../shared/engine/src/bgm.ts',import.meta.url),'utf8');
vm.runInContext(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText,g);
g.HONRO_CORE={BgmPlayer:g.exports.BgmPlayer};
class AudioStub {
 paused=true;muted=false;time=0;duration=100;volume=1;src='';listeners={};playVolumes=[];plays=0;seeks=0;loop=false;
 get currentTime(){return this.time;} set currentTime(value){this.time=value;this.seeks++;}
 addEventListener(name,fn){this.listeners[name]=fn;}
 play(){this.playVolumes.push(this.volume);this.paused=false;this.plays++;return Promise.resolve();}
 pause(){this.paused=true;} removeAttribute(name){if(name==='src')this.src='';} load(){} emit(name){this.listeners[name]?.();}
}
const audios=[],music=new g.HONRO_CORE.BgmPlayer(['main','battle-1','battle-2','battle-3','battle-4','battle-5','battle-6'],()=>{const a=new AudioStub();audios.push(a);return a;});
const check=(name,fn)=>{const detail=fn();checks.push({name,...(detail?{detail}:{})});console.log('PASS',name);};
const sessionMusic=()=>new g.HONRO_CORE.BgmPlayer(['main','battle-1','battle-2','battle-3','battle-4','battle-5','battle-6'],()=>new AudioStub());
check('Title tries audible streaming startup once with saved volume and the short ramp',()=>{music.configure(true,.35);assert.equal(audios.length,1);assert.equal(music.current.src,'main');assert.equal(music.current.preload,'auto');assert.equal(music.current.paused,false);assert.equal(music.starts,1);assert.equal(music.unlocked,true);assert.equal(music.current.muted,false);assert.equal(music.current.playVolumes[0],.35/25);music.tick(music.transitionStart);assert.equal(music.current.volume,.35/25);music.tick(music.transitionStart+12.5);assert.equal(music.current.volume,.175);music.tick(music.transitionStart+25);assert.equal(music.current.volume,.35);for(let i=0;i<50;i++){music.configure(true,.35);music.select('main');music.tick();}assert.equal(music.current.plays,1);});
check('Saved music mute and zero volume do not preload',()=>{for(const [enabled,volume] of [[false,.35],[true,0]]){const all=[],m=new g.HONRO_CORE.BgmPlayer(['main','battle-1'],()=>{const a=new AudioStub();all.push(a);return a;});m.configure(enabled,volume);m.select('main');m.unlock();assert.equal(all.length,0);assert.equal(m.starts,0);}});
check('Locked title preparation does not preload battle or boss songs',()=>{const m=sessionMusic();m.select('main');const a=m.current;m.select('battle','one');m.select('boss','one');assert.equal(m.current,a);assert.equal(m.starts,0);m.dispose();});
check('Hidden title defers preparation until it becomes visible',()=>{g.document={hidden:true};try{const m=sessionMusic();m.configure(true,.35);m.select('main');assert.equal(m.current,null);for(let i=0;i<5;i++){m.configure(true,.35);m.select('main');m.tick();}assert.equal(m.starts,0);g.document.hidden=false;m.select('main');assert.equal(m.current.src,'main');assert.equal(m.starts,1);for(let i=0;i<5;i++)m.select('main');assert.equal(m.starts,1);m.dispose();}finally{delete g.document;}});
check('Paused title makes no startup attempt until resumed and selected',()=>{const m=sessionMusic();m.setPaused(true);m.configure(true,.35);m.select('main');assert.equal(m.current,null);assert.equal(m.starts,0);m.setPaused(false);m.select('main');assert.equal(m.starts,1);m.dispose();});
check('Preload failure retries once on input, not each frame',()=>{const all=[],m=new g.HONRO_CORE.BgmPlayer(['main'],()=>{const a=new AudioStub();all.push(a);return a;});m.configure(true,.35);m.current.error={code:2};m.current.emit('error');for(let i=0;i<50;i++)m.select('main');assert.equal(all.length,1);m.unlock();assert.equal(all.length,2);assert.equal(m.current.plays,1);m.current.error={code:2};m.current.emit('error');m.unlock();assert.equal(all.length,2);m.dispose();});
check('First input preserves an already playing Main Theme without a second start',()=>{music.unlock();assert.equal(music.current.src,'main');assert.equal(music.current.plays,1);assert.equal(music.current.loop,true);assert.equal(audios.length,1);music.tick(music.transitionStart+25);assert.equal(music.current.volume,.35);});
check('Touch release/touchend/click unlock burst preserves one initial play and its short ramp',()=>{const m=sessionMusic();m.configure(true,.35);m.unlock();const a=m.current,start=m.transitionStart;a.time=.01;for(let i=0;i<3;i++)m.unlock();assert.equal(a.plays,1);assert.equal(a.seeks,0);assert.equal(m.transitionStart,start);m.tick(start+25);assert.equal(a.volume,.35);m.dispose();});
check('A real track replacement keeps the full 420 ms crossfade',()=>{const m=sessionMusic();m.configure(true,.35);m.unlock();m.tick(m.transitionStart+25);m.select('battle','first');m.tick(m.transitionStart+210);assert.equal(m.current.volume,.175);assert.equal(m.outgoing.volume,.175);m.tick(m.transitionStart+420);assert.equal(m.current.volume,.35);assert.equal(m.outgoing,null);m.dispose();});
check('Noncombat refresh does not restart Main Theme',()=>{const a=music.current;a.time=17;for(let i=0;i<50;i++){music.select('main');music.tick();}assert.equal(music.current,a);assert.equal(a.currentTime,17);assert.equal(a.plays,1);assert.equal(a.seeks,0);});
check('Act 1/3 cycles battle 1 → 2 → 3 → 1',()=>{music.select('battle','encounter-1');assert.equal(music.current.src,'battle-1');for(const expected of ['battle-2','battle-3','battle-1']){music.current.emit('ended');assert.equal(music.current.src,expected);assert.equal(music.current.loop,false);}});
check('Same encounter refresh preserves battle track and time without seeking',()=>{music.current.emit('ended');const a=music.current;a.time=13;for(let i=0;i<50;i++){music.unlock();music.select('battle','encounter-1');}assert.equal(music.current,a);assert.equal(music.battleIndex,1);assert.equal(a.currentTime,13);assert.equal(a.plays,1);assert.equal(a.seeks,0);});
check('Pause/resume keeps playback position',()=>{const a=music.current;a.time=22;music.setPaused(true);assert.equal(a.paused,true);music.setPaused(false);assert.equal(music.current,a);assert.equal(a.currentTime,22);assert.equal(a.paused,false);assert.equal(a.seeks,0);});
check('Map exit and saved encounter reentry restart playlist beginnings',()=>{music.select('main');music.current.emit('loadedmetadata');assert.equal(music.current.currentTime,0);music.select('battle','encounter-1');assert.equal(music.current.src,'battle-1');music.current.emit('loadedmetadata');assert.equal(music.current.currentTime,0);});
check('Music mute/volume affects BGM independently',()=>{const a=music.current;a.time=8;music.configure(false,.3);assert.ok(a.paused);music.configure(true,.3);assert.ok(!a.paused);music.tick(music.transitionStart+500);assert.equal(a.volume,.3);assert.equal(a.currentTime,8);assert.equal(a.seeks,0);});
check('Missing MP3 skips failed playlist track without throwing',()=>{music.current.error={code:4};music.current.emit('error');assert.equal(music.current.src,'battle-2');assert.equal(music.errors.length,1);});
check('Dispose releases all streams',()=>{music.dispose();assert.equal(audios.filter(a=>!a.paused).length,0);assert.equal(music.current,null);});
check('Within unchanged playlists, 150 repeated updates/unlocks never replace or seek audio',()=>{
 for(const state of ['main','battle']){const m=sessionMusic();m.unlock();m.select(state,'one');if(state==='battle')m.current.emit('ended');const a=m.current,index=m.battleIndex;a.time=21;
  for(let i=0;i<150;i++){m.select(state,'one');m.tick();m.unlock();}assert.equal(m.current,a);assert.equal(m.battleIndex,index);assert.equal(a.currentTime,21);assert.equal(a.plays,1);assert.equal(a.seeks,0);m.dispose();}
});
check('Direct new encounters advance once within battle, while main reentry begins at battle 1',()=>{
 const m=sessionMusic();m.unlock();m.select('battle','one');m.current.time=31;m.select('battle','two');assert.equal(m.current.src,'battle-2');assert.equal(m.current.currentTime,0);
 const second=m.current;for(let i=0;i<50;i++){m.unlock();m.select('battle','two');}assert.equal(m.current,second);
 m.select('battle','three');assert.equal(m.current.src,'battle-3');m.select('battle','four');assert.equal(m.current.src,'battle-1');m.select('battle','fifth');assert.equal(m.current.src,'battle-2');m.current.emit('ended');assert.equal(m.current.src,'battle-3');m.select('main');m.select('battle','five');assert.equal(m.current.src,'battle-1');assert.equal(m.current.currentTime,0);m.dispose();
});
check('Muted, paused and autoplay-locked playlist changes start zero on resume',()=>{
 for(const mode of ['muted','paused','locked']){const m=sessionMusic();m.unlock();m.select('battle','one');m.current.emit('ended');m.current.time=27;
  if(mode==='muted')m.configure(false,.3);if(mode==='paused')m.setPaused(true);if(mode==='locked')m.unlocked=false;m.select('main');m.select('battle','one');
  if(mode==='muted')m.configure(true,.3);if(mode==='paused')m.setPaused(false);if(mode==='locked')m.unlock();assert.equal(m.current.src,'battle-1');assert.equal(m.current.currentTime,0);assert.equal(m.current.paused,false);m.dispose();}
});
check('Locked departure/return to currently allocated song still honors transition',()=>{
 const m=sessionMusic();m.unlock();m.current.time=34;m.unlocked=false;m.select('battle','one');m.select('main');m.unlock();assert.equal(m.current.src,'main');assert.equal(m.current.currentTime,0);const a=m.current;a.time=2;m.unlock();assert.equal(a.currentTime,2);m.dispose();
});
check('Rapid switches release stale streams and cannot restore metadata offsets',()=>{
 const all=[],m=new g.HONRO_CORE.BgmPlayer(['main','battle-1','battle-2','battle-3','battle-4','battle-5','battle-6'],()=>{const a=new AudioStub();all.push(a);return a;});m.unlock();
 for(const state of ['battle','main','battle','main','battle','main','battle']){m.current.time=39;m.select(state,'one');for(const a of all)a.emit('loadedmetadata');assert.equal(m.current.currentTime,0);assert.ok(all.filter(a=>!a.paused).length<=2);}
 m.tick(m.transitionStart+500);assert.equal(all.filter(a=>!a.paused).length,1);m.dispose();assert.equal(all.filter(a=>!a.paused).length,0);
});
{
 const m=new g.HONRO_CORE.BgmPlayer(['main'],()=>{const a=new AudioStub();a.play=()=>{a.plays++;return Promise.reject({name:'NotAllowedError'});};return a;});m.configure(true,.35);await Promise.resolve();
 check('Autoplay rejection waits for another gesture and preserves the prepared stream',()=>{const a=m.current;assert.equal(m.unlocked,false);assert.equal(a.volume,0);assert.equal(a.paused,true);for(let i=0;i<50;i++){m.select('main');m.configure(true,.35);m.tick();}assert.equal(a.plays,1);a.play=()=>{a.paused=false;a.plays++;return Promise.resolve();};m.unlock();assert.equal(m.current,a);assert.equal(a.plays,2);assert.equal(a.volume,0);m.tick(m.transitionStart+25);assert.equal(a.volume,.35);m.dispose();});
}
{
 const m=new g.HONRO_CORE.BgmPlayer(['main'],()=>{const a=new AudioStub();a.play=()=>{a.plays++;throw {name:'NotAllowedError'};};return a;});
 m.configure(true,.35);
 check('A synchronous policy rejection is handled and waits for input',()=>{assert.equal(m.unlocked,false);assert.equal(m.current.plays,1);for(let i=0;i<10;i++)m.configure(true,.35);assert.equal(m.current.plays,1);m.dispose();});
}
{
 let rejectStartup;const m=new g.HONRO_CORE.BgmPlayer(['main'],()=>{const a=new AudioStub();a.play=()=>{a.plays++;return new Promise((_,reject)=>{rejectStartup=reject;});};return a;});
 m.configure(true,.35);const a=m.current;a.play=()=>{a.paused=false;a.plays++;return Promise.resolve();};m.unlock();rejectStartup({name:'NotAllowedError'});await Promise.resolve();
 check('A stale startup rejection cannot relock newer gesture playback',()=>{assert.equal(a.plays,2);assert.equal(m.unlocked,true);assert.equal(a.paused,false);assert.equal(m.errors.length,0);m.dispose();});
}
check('Act boundaries reset even without a new session; legacy boss stays in the active list',()=>{
 const m=sessionMusic();m.unlock();m.select('battle','one');m.current.emit('ended');m.current.time=21;
 m.select('battle','one',undefined,2);assert.equal(m.current.src,'battle-4');assert.equal(m.current.currentTime,0);
 for(const track of ['battle-5','battle-6','battle-4']){m.current.emit('ended');assert.equal(m.current.src,track);}
 const a=m.current;a.time=14;m.select('boss','one');assert.equal(m.current,a);assert.equal(a.currentTime,14);assert.equal(a.loop,false);
 m.select('battle','two',3,2);assert.equal(m.current.src,'battle-5','out-of-list opening ignored');
 m.select('battle','two',undefined,3);assert.equal(m.current.src,'battle-1');assert.equal(m.current.currentTime,0);m.dispose();
});
check('Each act skips failures only within its list and stops when exhausted',()=>{
 for(const act of [1,2,3]){const m=sessionMusic();m.unlock();m.select('battle','one',undefined,act);
  for(let i=0;i<3;i++){assert.ok(m.current.src.startsWith('battle-'));assert.ok((Number(m.current.src.slice(-1))>=4)===(act===2));m.current.error={code:4};m.current.emit('error');}
  const current=m.current,starts=m.starts;for(let i=0;i<50;i++)m.select('battle','one',undefined,act);
  assert.equal(m.current,current);assert.equal(m.starts,starts);assert.equal(m.errors.length,3);assert.equal(m.current,null);assert.equal(m.outgoing,null);m.dispose();
 }
});
check('Authored battle 3 opening is session-only on 9/10, then rotates 1/2/3',()=>{
 for(const stage of [9,10]){const m=sessionMusic();m.unlock();m.select('battle',`stage-${stage}`,3,1);assert.equal(m.current.src,'battle-3');
  const a=m.current;a.time=27;for(let i=0;i<120;i++)m.select('battle',`stage-${stage}`,3,1);
  m.setPaused(true);m.setPaused(false);m.unlock();assert.equal(m.current,a);assert.equal(a.currentTime,27);assert.equal(a.seeks,0);
  for(const track of ['battle-1','battle-2','battle-3','battle-1']){m.current.emit('ended');m.select('battle',`stage-${stage}`,3,1);assert.equal(m.current.src,track);}
  m.select('battle',`stage-${stage}-retry`,3,1);assert.equal(m.current.src,'battle-3');assert.equal(m.current.currentTime,0);m.dispose();
 }
});
check('Muted and paused act changes resume the new list and unavailable acts release old streams',()=>{
 for(const mode of ['muted','paused','locked']){const m=sessionMusic();m.unlock();m.select('battle','one',undefined,1);m.current.time=28;
  if(mode==='muted')m.configure(false,.3);if(mode==='paused')m.setPaused(true);if(mode==='locked')m.unlocked=false;
  m.select('battle','same',undefined,2);
  if(mode==='muted')m.configure(true,.3);if(mode==='paused')m.setPaused(false);if(mode==='locked')m.unlock();
  assert.equal(m.current.src,'battle-4');assert.equal(m.current.currentTime,0);assert.equal(m.current.paused,false);m.dispose();
 }
 const m=new g.HONRO_CORE.BgmPlayer(['main','battle-1','battle-2','battle-3'],()=>new AudioStub());m.unlock();m.select('battle','one');m.select('battle','one',undefined,2);assert.equal(m.current,null);assert.equal(m.outgoing,null);m.dispose();
});
check('Actual App updateAudio maps stages 1/9/10/11/20/21/30, rest/title and training',()=>{
 const main=SOURCE_MAIN;
 const update=main.slice(main.indexOf('        updateAudio(){')+'        updateAudio'.length,main.indexOf('        updateMusicLabel(){'));
 const fn=vm.runInContext('(function'+update.trim()+')',g);
 g.document={hidden:false};g.G={};
 try{const m=sessionMusic();m.unlock();const app={audio:{update:(state,paused,session,opening,act)=>{m.setPaused(paused);m.select(state,session,opening,act);}},updateMusicLabel(){},screen:'battle',engine:{b:{session:'same'}}};
  for(const [stage,track] of [[1,'battle-1'],[9,'battle-3'],[10,'battle-3'],[11,'battle-4'],[20,'battle-5'],[21,'battle-1'],[30,'battle-2']]){app.engine.b.honroStage=stage;app.engine.b.session=String(stage);fn.call(app);assert.equal(m.current.src,track);}
  for(const screen of ['rest','title','journey']){app.screen=screen;fn.call(app);assert.equal(m.current.src,'main');}
  app.screen='battle';app.training=true;app.trainingMusicSession='training';app.engine.b.honroStage=11;fn.call(app);assert.equal(m.current.src,'battle-4');m.dispose();
 }finally{delete g.document;delete g.G;}
});
await mkdir('_local/reports',{recursive:true});
await writeFile('_local/reports/audio-unit.json',JSON.stringify({passed:checks.length,checks},null,2)+'\n');
