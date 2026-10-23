(function(G){'use strict';
// One approved recording, two explicit events. No text inference or audio queue.
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
function attach(app,b){if(!relevant(app))return;const m=memory(b),d=b.honroStory;
 // Restoring an already visible/read row is reading, not a new bell strike.
 if(b.honroStage===12&&d?.lines?.slice(0,(d.index||0)+1).some(l=>l[2]?.rowId===ROW))m.sign=true;
 if(b.honroStage===18)m.keeperSerial=Math.max(m.keeperSerial||0,b.keeperRitual?.serial||0);
 void warm(app);
}
function line(app,skip=false){if(!relevant(app)||app.engine.b.honroStage!==12||app.storyHistoryOpen)return;const d=app.dialogue;if(!d||d.lines[d.index]?.[2]?.rowId!==ROW||d.staging&&(!d.staging.complete||d.staging.waitForDialogue))return;const m=memory(app.engine.b);if(m.sign)return;m.sign=true;app.dirty=true;if(!skip)play(app,1);}
function keeper(app){if(!relevant(app)||app.engine.b.honroStage!==18)return;const b=app.engine.b,r=b.keeperRitual,u=app.engine.unit(r?.owner),serial=r?.serial;if(u?.id!=='act2-keeper'||u.side!==1||!r.cast||!serial)return;const m=memory(b);if(serial<=(m.keeperSerial||0))return;m.keeperSerial=serial;play(app,1.059463);}
const lineStart=G.HonroStoryStaging?.lineStart;if(lineStart)G.HonroStoryStaging.lineStart=function(app,skip=false,...rest){const out=lineStart.call(this,app,skip,...rest);line(app,skip);return out;};
function stats(audio){const s=audio&&cache.get(audio);return s?{attempts:s.attempts,requests:s.requests,decodes:s.decodes,plays:s.plays,lastRate:s.lastRate,ready:!!s.buffer,duration:s.buffer?.duration||0,bufferBytes:s.buffer?s.buffer.length*s.buffer.numberOfChannels*4:0}:null;}
G.HonroMukjongAudio={warm,attach,line,keeper,stats};
})(globalThis);
