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
const catalog=JSON.parse(await readFile('shared/data/bgm.json','utf8'));
const authored=JSON.parse(await readFile('shared/data/bgm-stages.json','utf8'));
const codes=catalog.map(t=>t.id),tracks=['main',...codes.slice(1)];
g.HONRO_BGM_STAGES=Object.fromEntries(Object.entries(authored).map(([stage,row])=>[
 stage,{start:codes.indexOf(row.start),loop:row.loop.map(id=>codes.indexOf(id)),event:row.event?codes.indexOf(row.event):undefined}
]));
const audios=[],music=new g.HONRO_CORE.BgmPlayer(tracks,()=>{const a=new AudioStub();audios.push(a);return a;});
const check=(name,fn)=>{const detail=fn();checks.push({name,...(detail?{detail}:{})});console.log('PASS',name);};
const sessionMusic=()=>new g.HONRO_CORE.BgmPlayer(tracks,()=>new AudioStub());
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
check('Opening chapter cycles through its two field themes',()=>{music.select('battle','encounter-1');assert.equal(music.current.src,'11');for(const expected of ['12','11','12','11']){music.current.emit('ended');assert.equal(music.current.src,expected);assert.equal(music.current.loop,false);}});
check('Same encounter refresh preserves battle track and time without seeking',()=>{music.current.emit('ended');const a=music.current;a.time=13;for(let i=0;i<50;i++){music.unlock();music.select('battle','encounter-1');}assert.equal(music.current,a);assert.equal(music.battleIndex,1);assert.equal(a.currentTime,13);assert.equal(a.plays,1);assert.equal(a.seeks,0);});
check('Pause/resume keeps playback position',()=>{const a=music.current;a.time=22;music.setPaused(true);assert.equal(a.paused,true);music.setPaused(false);assert.equal(music.current,a);assert.equal(a.currentTime,22);assert.equal(a.paused,false);assert.equal(a.seeks,0);});
check('Map exit and saved encounter reentry restart playlist beginnings',()=>{music.select('main');music.current.emit('loadedmetadata');assert.equal(music.current.currentTime,0);music.select('battle','encounter-1');assert.equal(music.current.src,'11');music.current.emit('loadedmetadata');assert.equal(music.current.currentTime,0);});
check('Music mute/volume affects BGM independently',()=>{const a=music.current;a.time=8;music.configure(false,.3);assert.ok(a.paused);music.configure(true,.3);assert.ok(!a.paused);music.tick(music.transitionStart+500);assert.equal(a.volume,.3);assert.equal(a.currentTime,8);assert.equal(a.seeks,0);});
check('Missing MP3 skips failed playlist track without throwing',()=>{music.current.error={code:4};music.current.emit('error');assert.equal(music.current.src,'12');assert.equal(music.errors.length,1);});
check('Dispose releases all streams',()=>{music.dispose();assert.equal(audios.filter(a=>!a.paused).length,0);assert.equal(music.current,null);});
check('Within unchanged playlists, 150 repeated updates/unlocks never replace or seek audio',()=>{
 for(const state of ['main','battle']){const m=sessionMusic();m.unlock();m.select(state,'one');if(state==='battle')m.current.emit('ended');const a=m.current,index=m.battleIndex;a.time=21;
  for(let i=0;i<150;i++){m.select(state,'one');m.tick();m.unlock();}assert.equal(m.current,a);assert.equal(m.battleIndex,index);assert.equal(a.currentTime,21);assert.equal(a.plays,1);assert.equal(a.seeks,0);m.dispose();}
});
check('Muted, paused and autoplay-locked playlist changes start zero on resume',()=>{
 for(const mode of ['muted','paused','locked']){const m=sessionMusic();m.unlock();m.select('battle','one');m.current.emit('ended');m.current.time=27;
  if(mode==='muted')m.configure(false,.3);if(mode==='paused')m.setPaused(true);if(mode==='locked')m.unlocked=false;m.select('main');m.select('battle','one');
  if(mode==='muted')m.configure(true,.3);if(mode==='paused')m.setPaused(false);if(mode==='locked')m.unlock();assert.equal(m.current.src,'11');assert.equal(m.current.currentTime,0);assert.equal(m.current.paused,false);m.dispose();}
});
check('Locked departure/return to currently allocated song still honors transition',()=>{
 const m=sessionMusic();m.unlock();m.current.time=34;m.unlocked=false;m.select('battle','one');m.select('main');m.unlock();assert.equal(m.current.src,'main');assert.equal(m.current.currentTime,0);const a=m.current;a.time=2;m.unlock();assert.equal(a.currentTime,2);m.dispose();
});
check('Rapid switches release stale streams and cannot restore metadata offsets',()=>{
 const all=[],m=new g.HONRO_CORE.BgmPlayer(tracks,()=>{const a=new AudioStub();all.push(a);return a;});m.unlock();
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
check('Every chapter starts at E, wraps F from the successor and restarts E on retry',()=>{
 const m=sessionMusic();m.unlock();
 for(const [stage,score] of Object.entries(authored)){
  const id=Number(stage),session='chapter-'+id;
  m.select('battle',session,id);
  assert.equal(m.current.src,score.start,session);
  let position=score.loop.indexOf(score.start);
  for(let turn=0;turn<=score.loop.length;turn++){
   const stream=m.current;stream.time=13;
   m.select('battle',session,id);m.unlock();m.select('boss',session);
   assert.equal(m.current,stream);assert.equal(stream.currentTime,13);
   stream.emit('ended');
   position=(position+1)%score.loop.length;
   assert.equal(m.current.src,score.loop[position],session);
  }
  m.current.time=19;m.select('battle',session+'-retry',id);
  assert.equal(m.current.src,score.start);assert.equal(m.current.currentTime,0);
 }
 m.dispose();
});
check('Openings outside F play once, then F starts at its first member',()=>{
 const m=new g.HONRO_CORE.BgmPlayer(['main','opening','a','b'],()=>new AudioStub(),{1:{start:1,loop:[2,3]}});
 m.unlock();m.select('battle','one',1);
 for(const expected of ['opening','a','b','a']){assert.equal(m.current.src,expected);m.current.emit('ended');}
 m.dispose();
});
check('Errors stay within the chapter and release both streams when exhausted',()=>{
 const m=sessionMusic();m.unlock();m.select('battle','one',25);
 for(const expected of ['22','23']){assert.equal(m.current.src,expected);m.current.emit('error');}
 assert.equal(m.current,null);assert.equal(m.outgoing,null);
 const starts=m.starts;m.select('battle','one',25);assert.equal(m.starts,starts);
 m.select('battle','two',60);assert.equal(m.current.src,'67');m.dispose();
});
check('Authored events loop, survive unlock and pause, and release to the chapter sequence',()=>{
 for(const stage of [10,58]){
  const m=sessionMusic(),score=authored[stage];m.unlock();m.select('battle','new',stage);
  m.current.emit('ended');const prior=m.current.src;
  m.select('battle','new',stage,true);const a=m.current;
  assert.equal(a.src,score.event);assert.equal(a.loop,true);a.time=24;
  a.emit('ended');m.unlock();m.setPaused(true);m.setPaused(false);m.select('battle','new',stage,true);
  assert.equal(m.current,a);assert.equal(a.currentTime,24);
  m.select('battle','new',stage,false);assert.equal(m.current.src,prior);
  m.select('battle','saved',stage,true);assert.equal(m.current.src,score.event);
  m.select('battle','retry',stage,false);assert.equal(m.current.src,score.start);m.dispose();
 }
});
check('Muted, paused and locked chapter changes apply the new opening',()=>{
 for(const mode of ['muted','paused','locked']){
  const m=sessionMusic();m.unlock();m.select('battle','one',9);
  if(mode==='muted')m.configure(false,.3);
  if(mode==='paused')m.setPaused(true);
  if(mode==='locked')m.unlocked=false;
  m.select('battle','two',59);
  if(mode==='muted')m.configure(true,.3);
  if(mode==='paused')m.setPaused(false);
  if(mode==='locked')m.unlock();
  assert.equal(m.current.src,'66');assert.equal(m.current.currentTime,0);assert.equal(m.current.paused,false);m.dispose();
 }
});
check('App routes real chapter, ritual and boss flags, menus, training and ending galleries',()=>{
 const update=SOURCE_MAIN.slice(SOURCE_MAIN.indexOf('        updateAudio(){')+'        updateAudio'.length,SOURCE_MAIN.indexOf('        updateMusicLabel('));
 const fn=vm.runInContext('(function'+update.trim()+')',g);g.document={hidden:false};g.G={};
 try{
  const m=sessionMusic();m.unlock();
  const b={session:'one',honroStage:10,honroState:{sodanBinding:{phase:'bound'},flags:{}}};
  const app={audio:{update(state,paused,...args){m.setPaused(paused);m.select(state,...args);}},updateMusicLabel(){},screen:'battle',engine:{b}};
  const playing=code=>{fn.call(app);assert.equal(m.current.src,code);};
  playing('13');b.honroState.sodanBinding.remaining=0;playing('14');
  b.honroStage=19;playing('24');assert.equal(m.current.loop,true);
  b.honroStage=58;playing('64');b.honroState.flags.localBossManifested=true;playing('65');
  b.honroState.flags.localDaedosaDefeated=true;playing('65');
  b.honroDaedosa={nodeDead:true};playing('64');
  b.honroStage=59;playing('66');b.honroStage=60;playing('67');
  for(const screen of ['rest','title','journey','act-ending']){app.screen=screen;playing('main');}
  app.endingGallery={debug:{screen:'battle'}};playing('main');
  delete app.endingGallery;app.screen='battle';app.training=true;app.trainingMusicSession='training';b.honroStage=26;playing('32');
  m.current.emit('ended');b.session='rebuilt';playing('33');m.dispose();
 }finally{delete g.document;delete g.G;}
});
await mkdir('_local/reports',{recursive:true});
await writeFile('_local/reports/audio-unit.json',JSON.stringify({passed:checks.length,checks},null,2)+'\n');
