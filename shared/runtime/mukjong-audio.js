(function(G){'use strict';
// One approved recording, two explicit events. No text inference or audio queue.
const INTERVAL=2,MAX_SEMITONES=5;
const ROW='12.beats.sign:a6e603d56a',cache=new WeakMap();
function record(audio){let s=cache.get(audio);if(!s){s={buffer:null,promise:null,attempts:0,retryAt:0,requests:0,decodes:0,plays:0,lastRate:null};cache.set(audio,s);}return s;}
const relevant=app=>!app.training&&!app.engine?.b.honroCustom&&[12,18].includes(app.engine?.b.honroStage);
function warm(app){const a=app.audio,c=a?.context;if(!relevant(app)||!a?.enabled||a.volume<=0||!c||c.state==='closed'||!G.HONRO_MUKJONG_AUDIO?.src)return Promise.resolve(false);const s=record(a);if(s.buffer)return Promise.resolve(true);if(s.promise)return s.promise;if(s.attempts>=2||performance.now()<s.retryAt)return Promise.resolve(false);
 s.attempts++;s.requests++;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
 s.promise=(async()=>{try{const r=await fetch(G.HONRO_MUKJONG_AUDIO.src,{signal:controller.signal});if(!r.ok)throw Error('Bell sample unavailable');const bytes=await r.arrayBuffer();s.decodes++;const buffer=await c.decodeAudioData(bytes);if(controller.signal.aborted||c.state==='closed')return false;s.buffer=buffer;return true;}catch{s.retryAt=performance.now()+1000;return false;}finally{clearTimeout(timer);s.promise=null;}})();return s.promise;
}
function play(app,rate){const a=app.audio,c=a?.context;if(!a?.enabled||a.volume<=0||!c||c.state!=='running'||!a.master||G.document?.hidden)return false;const s=record(a);if(!s.buffer){void warm(app);return false;}
 // Existing mute/visibility/dispose cleanup owns every voice, including this one.
 if(a.voices.size>=20){const old=a.voices.values().next().value;try{old?.stop();}catch{}if(old)a.voices.delete(old);}
 const voice=c.createBufferSource();voice.buffer=s.buffer;voice.playbackRate.value=rate;voice.connect(a.master);a.voices.add(voice);voice.onended=()=>{a.voices.delete(voice);voice.disconnect();};voice.start();s.plays++;s.lastRate=rate;return true;
}
function memory(b){b.honroState??={};return b.honroState.mukjongAudio??={version:1,sign:false,keeperSerial:0};}
function pitchValid(p){return p?.version===1&&[1,2].includes(p.interval)&&['firstRound','lastRound','activeRounds'].every(k=>Number.isSafeInteger(p[k])&&p[k]>=0)&&typeof p.paused==='boolean'&&typeof p.stopped==='boolean';}
function suppressed(b){const a=b.honroState?.act2,hold=b.honroAct2Steps?.find(s=>s.id==='hold-silence');return !!b.keeperRitual?.suppressed||b.honroState?.bellDescent?.status==='lowering'||!!(a?.done?.silence&&!a.done['hold-silence']&&hold&&!G.HonroAct2.satisfied(b,hold));}
function stopped(b){const u=b.units?.find(u=>u.id==='act2-keeper');return !u||u.side!==1||u.dead||u.hp<=1||u.honroSubdued||b.honroState?.act2?.done?.keeper||['won','lost'].includes(b.phase);}
function observe(app){if(!relevant(app)||app.engine.b.honroStage!==18)return;const b=app.engine.b,m=memory(b),p=m.pitch;if(!pitchValid(p))return;
 const paused=suppressed(b),halted=!!stopped(b),round=Math.max(0,Math.floor(b.round||0)),delta=Math.max(0,round-p.lastRound);if(round===p.lastRound&&paused===p.paused&&(p.stopped||halted)===p.stopped)return;
 // Only whole battle-round boundaries advance. Both ends of a suppressed
 // interval must be live, so clearing suppression never charges a saved gap.
 if(!p.paused&&!paused&&!p.stopped&&!halted)p.activeRounds=Math.min(Number.MAX_SAFE_INTEGER,p.activeRounds+delta);
 p.lastRound=round;p.paused=paused;p.stopped=p.stopped||halted;
}
function attach(app,b,{fresh=false}={}){if(!relevant(app))return;const m=memory(b),d=b.honroStory;
 // Restoring an already visible/read row is reading, not a new bell strike.
 if(b.honroStage===12&&d?.lines?.slice(0,(d.index||0)+1).some(l=>l[2]?.rowId===ROW))m.sign=true;
 if(b.honroStage===18){if(fresh){delete m.pitch;delete m.lastToneRound;m.echoStep=-1;}else if(m.echoStep===undefined)m.echoStep=pitchValid(m.pitch)?Math.floor(m.pitch.activeRounds/m.pitch.interval):0;m.keeperSerial=Math.max(m.keeperSerial||0,b.keeperRitual?.serial||0);
  if(pitchValid(m.pitch)){m.pitch.lastRound=Math.max(0,Math.floor(b.round||0));observe(app);}else delete m.pitch;
 }
 void warm(app);
}
function line(app,skip=false){if(!relevant(app)||app.engine.b.honroStage!==12||app.storyHistoryOpen)return;const d=app.dialogue;if(!d||d.lines[d.index]?.[2]?.rowId!==ROW||d.staging&&(!d.staging.complete||d.staging.waitForDialogue))return;const m=memory(app.engine.b);if(m.sign)return;m.sign=true;app.dirty=true;if(!skip)play(app,1);}
function keeper(app){if(!relevant(app)||app.engine.b.honroStage!==18)return;const b=app.engine.b,r=b.keeperRitual,u=app.engine.unit(r?.owner),serial=r?.serial;if(u?.id!=='act2-keeper'||u.side!==1||!r.cast||!serial)return;const m=memory(b);if(serial<=(m.keeperSerial||0))return;m.keeperSerial=serial;
 if(stopped(b)){observe(app);return;}
 if(!pitchValid(m.pitch))m.pitch={version:1,interval:INTERVAL,firstRound:b.round,lastRound:b.round,activeRounds:0,paused:suppressed(b),stopped:false};
 observe(app);const p=m.pitch;if(!p.paused&&!p.stopped)tone(app,p);
}

function tone(app,p){const b=app.engine.b,m=memory(b),step=Math.min(MAX_SEMITONES,Math.floor(p.activeRounds/p.interval));m.echoStep=Math.floor(p.activeRounds/p.interval);if(m.lastToneRound===b.round)return;m.lastToneRound=b.round;play(app,2**(step/12));}
function update(app){if(!relevant(app)||app.engine.b.honroStage!==18)return;const b=app.engine.b;if(b.honroBellRevision!==1||b.mode!=='campaign')return;const m=memory(b),ready=app.screen==='battle'&&!app.dialogue&&!app.modal?.classList.contains('open')&&!G.document?.hidden&&!G.HonroStory?.turnPaused(app)&&!G.HonroBellAnomaly?.blocked(b);
 if(!pitchValid(m.pitch)){if(!ready||stopped(b)||suppressed(b))return;m.pitch={version:1,interval:INTERVAL,firstRound:b.round,lastRound:b.round,activeRounds:0,paused:false,stopped:false};}
 observe(app);const p=m.pitch;if(!ready||p.paused||p.stopped)return;const step=Math.min(MAX_SEMITONES,Math.floor(p.activeRounds/p.interval));
 // Existing App clock only. No timer, turn alarm, queued playback or new quest.
 // At the cap, keep the same sparse two-round residual cadence.
 const slot=Math.floor(p.activeRounds/p.interval);if(m.echoStep===slot)return;m.echoStep=slot;app.dirty=true;tone(app,p);
}

const lineStart=G.HonroStoryStaging?.lineStart;if(lineStart)G.HonroStoryStaging.lineStart=function(app,skip=false,...rest){const out=lineStart.call(this,app,skip,...rest);line(app,skip);return out;};
function stats(audio){const s=audio&&cache.get(audio);return s?{attempts:s.attempts,requests:s.requests,decodes:s.decodes,plays:s.plays,lastRate:s.lastRate,ready:!!s.buffer,duration:s.buffer?.duration||0,bufferBytes:s.buffer?s.buffer.length*s.buffer.numberOfChannels*4:0}:null;}
G.HonroMukjongAudio={warm,attach,line,keeper,observe,update,suppressed,pitchValid,stats,INTERVAL,MAX_SEMITONES};
})(globalThis);
