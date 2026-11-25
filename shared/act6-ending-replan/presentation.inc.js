(G, assets, css, timeline) => {
 'use strict';
 const doc=G.document, sessions=new WeakMap(), installed=new WeakSet(), images=new Map();
 const node=(tag,cls,text)=>{const n=doc.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
 const button=(label,key)=>{const n=node('button','he-button',label);n.type='button';n.dataset.endingAction=key;return n;};
 const orient=()=>G.matchMedia('(orientation: portrait)').matches?'port':'land';
 const clamp=(x,l,h)=>Math.max(l,Math.min(h,x));
 function load(src){
  if(!images.has(src)){
   const img=new G.Image();img.src=src;
   images.set(src,img.decode().then(()=>src,()=>{images.delete(src);return null;}));
  }
  return images.get(src);
 }
 function prewarm(){
  const side=orient();
  for(const cut of timeline.cuts)void load(assets.stills[cut.id][side]);
 }
 function open(app,mode,leave){
  if(sessions.has(app))return null;
  const style=node('style');style.textContent=css;doc.head.append(style);
  const root=node('section','he-root');root.dataset.endingMode=mode;root.dataset.endingPhase='intro';root.tabIndex=-1;
  root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','혼로 엔딩');
  const backdrop=node('div','he-media'),veil=node('div','he-veil'),fx=node('div','he-fx'),words=node('div','he-copy'),
    controls=node('div','he-controls'),status=node('p','he-status');
  words.setAttribute('aria-live','polite');status.setAttribute('role','status');
  root.append(backdrop,veil,fx,words,controls,status);
  const held=[...app.root.children].map(n=>[n,n.inert]);
  for(const [n] of held)n.inert=true;
  app.root.append(root);
  const s={app,mode,root,backdrop,fx,words,controls,status,closed:false,rafs:new Set(),timers:new Set(),hold:null};
  sessions.set(app,s);
  const stop=e=>e.stopPropagation();
  root.addEventListener('pointerdown',stop);root.addEventListener('pointerup',stop);root.addEventListener('click',stop);
  s.delay=(fn,ms)=>{const timer=G.setTimeout(()=>{s.timers.delete(timer);if(!s.closed)fn();},ms);s.timers.add(timer);return timer;};
  s.frame=fn=>{const id=G.requestAnimationFrame(now=>{s.rafs.delete(id);if(!s.closed)fn(now);});s.rafs.add(id);};
  function afterVisibility(){
   if(s.closed)return;
   if(doc.hidden){
    s.resetInputs?.();
    if(s.playing){s.playing.hiddenAt=G.performance.now();s.audio?.pause();}
   }else if(s.playing?.hiddenAt!=null){
    const diff=G.performance.now()-s.playing.hiddenAt;s.playing.origin+=diff;s.playing.audioOrigin+=diff;
    if(s.playing.transition)s.playing.transition.since+=diff;
    s.playing.hiddenAt=null;resumeAudio(s);
   }
  }
  const previous=doc.activeElement;
  function keyboardCapture(event){
   if(G.document.activeElement!==root&&!root.contains(G.document.activeElement))root.focus({preventScroll:true});
   const allowed=s.onKeys?.(event);
   if(allowed){event.preventDefault();event.stopImmediatePropagation();}
  }
  doc.addEventListener('visibilitychange',afterVisibility);G.addEventListener('blur',()=>s.resetInputs?.(),{signal:(s.lifecycle=new G.AbortController()).signal});
  G.addEventListener('keydown',keyboardCapture,{capture:true,signal:s.lifecycle.signal});
  G.addEventListener('keyup',keyboardCapture,{capture:true,signal:s.lifecycle.signal});
  s.close=()=>{
   if(s.closed)return;s.closed=true;s.lifecycle.abort();doc.removeEventListener('visibilitychange',afterVisibility);
   for(const t of s.timers)G.clearTimeout(t);
   for(const r of s.rafs)G.cancelAnimationFrame(r);
   if(s.audio){s.audio.pause();s.audio.removeAttribute('src');s.audio.load();}
   s.sound?.close().catch(()=>{});s.cleanupNative?.();
   root.remove();style.remove();for(const [n,v] of held)n.inert=v;
   if(sessions.get(app)===s)sessions.delete(app);
   if(previous?.isConnected)previous.focus?.({preventScroll:true});
  };
  s.leave=()=>{if(!s.closed){s.close();leave();}};
  root.focus({preventScroll:true});app.updateAudio();return s;
 }
 function track(s){
  if(!assets.track||s.audio)return s.audio;
  const a=new G.Audio(assets.track);a.preload='auto';a.loop=false;s.audio=a;return a;
 }
 const volume=s=>s.app.profile?.settings?.music===false?0:clamp(Number(s.app.profile?.settings?.musicVolume??.5)||0,0,1);
 function prime(s){
  if(!volume(s))return;
  const a=track(s);if(!a||s.priming)return;
  a.volume=0;
  try{s.priming=Promise.resolve(a.play()).then(()=>{
   if(!s.playing){a.pause();a.currentTime=0;}
  }).catch(()=>{}).finally(()=>{s.priming=null;});}catch{}
 }
 function resumeAudio(s){
  const a=track(s),v=volume(s);if(!a||!v||doc.hidden||s.closed||!s.playing)return;
  a.volume=v;
  const elapsed=Math.max(0,(G.performance.now()-s.playing.audioOrigin)/1000);
  if(Number.isFinite(a.duration)&&elapsed>=a.duration)return;
  if(a.readyState>0&&Math.abs(a.currentTime-elapsed)>.22){a.currentTime=elapsed;}
  try{a.play()?.catch(()=>{if(!s.closed&&s.playing){s.audioPlay.hidden=false;}});}catch{s.audioPlay.hidden=false;}
 }
 function mark(s){
  prewarm();prime(s);
  try{
   const Ctx=G.AudioContext??G.webkitAudioContext;if(!Ctx||s.app.profile?.settings?.sound===false)return;
   const cx=s.sound??=new Ctx();void cx.resume();
   const sec=.26, buffer=cx.createBuffer(1,Math.ceil(cx.sampleRate*sec),cx.sampleRate), v=buffer.getChannelData(0);
   for(let i=0;i<v.length;i++){const f=i/v.length;v[i]=(Math.random()*2-1)*Math.sin(Math.PI*f)**2*.07;}
   const b=cx.createBufferSource(), fil=cx.createBiquadFilter();fil.type='bandpass';fil.frequency.value=1100;fil.Q.value=.7;
   b.buffer=buffer;b.connect(fil);fil.connect(cx.destination);b.start();
  }catch{}
 }
 function paintDialog(s,idx){
  const [name,line]=timeline.intro[idx];const p=node('p','he-dialog',line);p.prepend(node('strong','',name));s.words.replaceChildren(p);
 }
 function intro(s,{surface,record,depart}){
  let phase='quiet', ready=false, input=null, progress=0,last=0,closing=false;
  const ledger=node('section','he-ledger'),title=node('h2','','이름을 새긴다'),press=button('이름을 새긴다','record'),
   names=node('p','he-names'),walk=button('산문 밖으로 걷기 →','walk');
  walk.style.touchAction='none';
  const ink=()=>{ledger.replaceChildren(title,names);for(const name of timeline.names)names.append(node('span','',name));};
  async function takeRecord(e){
   if(!e.isTrusted||phase!=='ledger'||press.disabled)return;
   press.disabled=true;mark(s);
   let ok=false;try{ok=(await record(e)).ok;}catch{}
   if(s.closed)return;
   if(!ok){press.disabled=false;s.status.textContent='장부를 남기지 못했습니다. 다시 시도하십시오.';return;}
   phase='ink';s.root.dataset.endingPhase='ink';ink();s.status.textContent='';
   s.delay(()=>{
    phase='walk';s.root.dataset.endingPhase='walk';s.words.replaceChildren();
    s.controls.replaceChildren(walk);s.status.textContent='→ 또는 D를 누르거나 버튼을 길게 눌러 걸으십시오.';
    ready=true;last=0;s.root.focus({preventScroll:true});s.frame(tick);
   },5500);
  }
  function enterLedger(){
   if(s.closed||phase!=='quiet')return;
   phase='ledger';s.root.dataset.endingPhase='ledger';ledger.replaceChildren(title);
   s.words.replaceChildren(ledger);s.controls.replaceChildren(press);press.focus({preventScroll:true});
  }
  paintDialog(s,0);s.delay(()=>paintDialog(s,1),6500);s.delay(enterLedger,14000);
  press.addEventListener('click',takeRecord);
  function stop(){input=null;}
  s.resetInputs=stop;
  async function finish(e){
   if(!e.isTrusted||!ready||closing||progress<1)return;
   closing=true;stop();prime(s);s.status.textContent='';walk.disabled=true;s.root.dataset.endingPhase='departure';
   let result;try{result=await depart(e);}catch{}
   if(s.closed)return;
   if(!result?.ok){
    closing=false;walk.disabled=false;phase='walk';walk.textContent='다시 기록하기';s.root.dataset.endingPhase='walk';
    s.status.textContent='여정의 끝을 기록하지 못했습니다. 다시 시도하십시오.';return;
   }
   phase='finished';s.delay(()=>play(s),850);
  }
  function tick(now){
   if(phase!=='walk'||!ready)return;
   const d=last?Math.min(now-last,55):0;last=now;
   if(input&&progress<1){
    const next=clamp(progress+d/5300,0,1);
    if(surface(next)){
     progress=next;
     if(progress===1){walk.textContent='산문을 나서기';s.status.textContent='누르던 버튼을 놓으면 산문을 나섭니다.';}
    }
   }
   s.frame(tick);
  }
  walk.addEventListener('pointerdown',e=>{
   if(!e.isTrusted||phase!=='walk'||closing||e.button!==0)return;
   input='pointer';walk.setPointerCapture(e.pointerId);
  });
  walk.addEventListener('pointercancel',stop);
  walk.addEventListener('lostpointercapture',stop);
  walk.addEventListener('pointerup',e=>{if(input==='pointer'){stop();if(progress===1)void finish(e);}});
  walk.addEventListener('click',e=>{
   if(!e.isTrusted||phase!=='walk'||closing)return;
   if(progress===1){void finish(e);return;}
   if(e.detail===0){
    input='assist';
    s.delay(()=>{if(input==='assist'){stop();if(progress===1){walk.textContent='산문을 나서기';walk.focus();}}},5600);
   }
  });
  s.onKeys=e=>{
   if(phase==='ledger'&&e.code==='Space'&&e.target!==press){if(e.type==='keydown'&&!e.repeat)void takeRecord(e);return true;}
   if(!['ArrowRight','KeyD'].includes(e.code))return false;
   if(phase==='walk'){
    if(e.type==='keydown'&&!e.repeat)input='key';
    if(e.type==='keyup'&&input==='key'){stop();if(progress===1)void finish(e);}
   }
   return true;
  };
  return ()=>progress;
 }
 function play(s){
  if(s.closed)return;
  s.root.dataset.endingPhase='stills';s.words.replaceChildren();s.status.textContent='';
  const picture=node('img','he-still');picture.alt='';s.backdrop.replaceChildren(picture);
  const skip=button('건너뛰기','skip'),audioPlay=button('음악 재생','audio');audioPlay.hidden=true;s.audioPlay=audioPlay;
  skip.setAttribute('aria-label','2초간 눌러 엔딩 건너뛰기');s.controls.replaceChildren(skip,audioPlay);
  const origin=G.performance.now(),p=s.playing={origin,audioOrigin:origin,hiddenAt:null,index:-1,beat:-1,side:null,transition:null};
  s.root.setAttribute('aria-description','화면을 누르거나 스페이스 키를 누르면 다음 문장으로 넘어갑니다.');
  resumeAudio(s);
  audioPlay.addEventListener('click',e=>{if(e.isTrusted){audioPlay.hidden=true;resumeAudio(s);}});
  function cancel(){if(!s.hold)return;G.clearTimeout(s.hold.timer);s.timers.delete(s.hold.timer);s.hold=null;skip.classList.remove('he-held');}
  function hold(e,mode){
   if(!e.isTrusted||s.hold)return;
   s.hold={mode,timer:s.delay(s.leave,2000)};skip.classList.add('he-held');
  }
  function advance(e){
   if(!e.isTrusted||p.transition||p.hiddenAt!==null)return;
   const since=G.performance.now(),elapsed=since-p.origin,cue=timeline.cueAt(elapsed);
   if(!cue||cue.final&&cue.beat===2)return;
   const target=(cue.start+cue.beatStart+cue.beatSpan)*1000+.1;
   const next=timeline.cueAt(target);
   if(!next||target<=elapsed)return;
   p.transition={since,elapsed,target,changesImage:next.index!==cue.index};
  }
  s.root.addEventListener('click',e=>{if(!e.target.closest?.('button'))advance(e);},{signal:s.lifecycle.signal});
  s.resetInputs=cancel;
  for(const type of ['pointerup','pointercancel','lostpointercapture','blur'])skip.addEventListener(type,cancel);
  skip.addEventListener('pointerdown',e=>{if(e.isTrusted&&e.button===0){skip.setPointerCapture(e.pointerId);hold(e,'pointer');}});
  s.onKeys=e=>{
   const isSkip=e.code==='Escape'||(doc.activeElement===skip&&['Enter','Space'].includes(e.code));
   if(isSkip){if(e.type==='keydown')hold(e,'key');else if(s.hold?.mode==='key')cancel();return true;}
   if(!['Enter','Space','ArrowRight'].includes(e.code)||doc.activeElement?.closest?.('button'))return false;
   if(e.type==='keydown'&&!e.repeat)advance(e);
   return true;
  };
  s.root.focus({preventScroll:true});
  function show(cue){
   const {index,beat,cut,final}=cue,side=orient(),changed=index!==p.index;
   if(changed||side!==p.side){
    p.index=index;p.side=side;
    s.root.dataset.endingStill=cut.id;s.root.dataset.endingMotion=cut.motion;picture.style.animationDuration=cut.duration+'s';
    const url=assets.stills[cut.id][side];picture.alt=cut.alt;
    if(changed||!picture.src){picture.src=url;picture.classList.remove('he-drift');void picture.offsetWidth;picture.classList.add('he-drift');}
    else void load(url).then(src=>{if(src&&!s.closed&&p.index===index&&p.side===side)picture.src=src;});
    if(changed){
     s.fx.replaceChildren();
     if(!final)for(let i=0;i<6;i++){const d=node('i');d.style.setProperty('--i',String(i));s.fx.append(d);}
    }
   }
   if(changed||beat!==p.beat){
    p.beat=beat;s.root.dataset.endingBeat=String(beat);s.words.replaceChildren();
    if(final&&beat===1){
     const credits=node('div','he-credit');
     credits.append(node('h1','','혼로'),node('p','he-roman','HONRO'),node('p','','기획 · 시나리오 · 아트 · 프로그래밍'));
     if(assets.credit.developer)credits.append(node('p','he-credit-name',assets.credit.developer));
     credits.append(node('p','he-song','엔딩곡'+(assets.credit.song?' · '+assets.credit.song:' (임시곡)')));
     credits.append(node('p','he-thanks',cut.beats[1]));s.words.append(credits);
    }else if(cut.beats[beat]){
     const line=node('p','he-line',cut.beats[beat]);s.words.append(line);
    }
   }
   const local=cue.time-cue.beatStart, leftover=cue.beatSpan-local;
   const wording=clamp(Math.min(local/.59,leftover/.66),0,1);
   const still=clamp(Math.min(cue.time/.72,(cut.duration-cue.time)/.86),0,1);
   return {wording,still};
  }
  function update(now){
   if(p.hiddenAt==null){
    let textFactor=1,artFactor=1,elapsed=now-p.origin;
    if(p.transition){
     const f=clamp((now-p.transition.since)/340,0,1);
     if(f>=1){p.origin=now-p.transition.target;elapsed=p.transition.target;p.transition=null;}
     else{
      elapsed=p.transition.elapsed;textFactor=1-f;
      if(p.transition.changesImage)artFactor=1-f;
     }
    }
    const cue=timeline.cueAt(elapsed);
    if(!cue){s.leave();return;}
    const {wording,still}=show(cue);
    s.words.style.opacity=String(wording*textFactor);
    s.backdrop.style.opacity=String(still*artFactor);
    s.fx.style.opacity=String(still*artFactor);
    const fade=cue.final?clamp(1-(cue.cut.duration-cue.time)/1.7,0,1):0;
    s.root.style.setProperty('--he-outro',String(fade));
    if(s.audio&&!s.audio.paused)s.audio.volume=volume(s)*(1-fade);
   }
   s.frame(update);
  }
  s.frame(update);
 }
 function debug(app){
  if(!app.debugMode||app.training||app.customMap||G.HONRO_EMBEDDED||app.dialogue||app.endingGallery||app.settingsPage!=='debug'||
     app.modalKind!=='settings-dialog'||!app.modal.classList.contains('open')||sessions.has(app))return false;
  const priorScreen=app.screen, token='act6-ending-v2:'+G.performance.now();
  const ownGallery={stage:60,debug:{screen:priorScreen}};
  app.endingGallery=ownGallery;app.screen='act-ending';app.modal.classList.remove('open');
  const back=()=>{if(G.history.state?.honroEndingGallery!==token)s.leave();};
  const s=open(app,'debug',()=>{
   G.removeEventListener('popstate',back);
   if(G.history.state?.honroEndingGallery===token)G.history.back();
   if(app.endingGallery===ownGallery)delete app.endingGallery;
   app.screen=priorScreen;app.modal.classList.add('open');app.prev=G.performance.now();app.updateAudio();
  });
  const pic=node('picture'),media=node('img','he-native-preview'), source=node('source');
  source.media='(orientation: portrait)';source.srcset=assets.preview.port;media.src=assets.preview.land;
  pic.append(source,media);s.backdrop.append(pic);
  if(G.history?.pushState){G.history.pushState({...G.history.state,honroEndingGallery:token},'');G.addEventListener('popstate',back);}
  intro(s,{surface:p=>{media.style.transform='scale(1.1) translateX('+(-4*p)+'%)';return true;},record:()=>({ok:true}),depart:()=>({ok:true})});
  return true;
 }
 function installDebug(){
  const x=G.HonroActEndings;if(!x||installed.has(x)||G.HONRO_EMBEDDED)return;
  installed.add(x);const formerControls=x.debugControls,formerPreview=x.previewDebug;
  x.debugControls=a=>formerControls(a).replace('</div></section>','<button type="button" data-action="debug-act-ending-preview" data-id="60">6막</button></div></section>');
  x.previewDebug=(a,id)=>Number(id)===60?debug(a):formerPreview(a,id);
 }
 return Object.freeze({installDebug,silenceStock:app=>sessions.has(app),open,intro});
}
