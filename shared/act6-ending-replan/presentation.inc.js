(G, assets, css) => {
 'use strict';
 const doc=G.document, sessions=new WeakMap(), installed=new WeakSet(), mediaCache=new Map();
 const order=['last-souls','bridge-record','daybreak','homecoming','jeomungol-record','later-return'];
 const lines={
  'last-souls':['다시 흐르는 길','마지막 두 혼이 산문을 건넙니다. 소단이 길에서 한 발 물러납니다.'],
  'bridge-record':['길을 지킨 사람들','휘겸은 방패선이 마지막까지 지킨 곳을 돌아봅니다.'],
  'daybreak':['돌아온 새벽','07:10. 호롱불이 꺼지고 빛이 산문에 닿았습니다. 도식은 무너진 산길에서 돌아갈 길을 살핍니다.'],
  'homecoming':['돌아와서 하는 일','연실이 나루에 배를 댑니다. 물가에서 설오는 돌아온 이들의 짐을 받아 듭니다.','장부의 열세 명 중 일곱은 피했고 넷은 구조됐습니다. 막내는 첫겨울을 넘기지 못했고, 큰애는 아직 찾고 있습니다.'],
  'jeomungol-record':['덮지 않을 기록','휘겸은 저문골을 닫으라 한 일, 사람을 죽인 일, 그 일을 감춘 기록을 한데 뭉뚱그리지 않습니다.'],
  'later-return':['그리고 어느 날','내 발로 가네. 해 지기 전 돌아오리다.']
 };
 const node=(tag,cls,text)=>{const n=doc.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
 const image=(src,alt='')=>{if(!src)return null;const i=node('img');i.alt=alt;i.decoding='sync';i.addEventListener('error',()=>{i.remove();});i.src=src;return i;};
 const frames=()=>new Promise(done=>G.requestAnimationFrame(()=>G.requestAnimationFrame(done)));
 function prewarm(){
  const format=G.matchMedia('(max-aspect-ratio: 19/20)').matches?'portrait':'wide';
  for(const src of [...Object.values(assets.actor),...Object.values(assets.places).map(x=>x[format])]){
   if(mediaCache.has(src))continue;
   const art=new G.Image();art.decoding='sync';art.src=src;
   const ready=art.decode().catch(()=>null);mediaCache.set(src,{art,ready});
  }
 }
 async function decoded(art){
  let deadline;
  try{
   const real=Promise.allSettled([...art.querySelectorAll('img')].map(i=>i.decode()));
   await Promise.race([real,new Promise(done=>{deadline=G.setTimeout(done,3500);})]);
  }finally{G.clearTimeout(deadline);}
 }
 function track(s){
  if(s.audio||!assets.track)return s.audio;
  try {
   const a=new G.Audio(assets.track);a.dataset.honroEndingTrack='provisional';a.preload='metadata';a.loop=false;s.audio=a;
   a.addEventListener('ended',()=>{s.ended=true;s.sync?.();});a.addEventListener('error',()=>{s.missing=true;s.sync?.();});
   a.addEventListener('play',()=>s.sync?.());a.addEventListener('pause',()=>s.sync?.());
   return a;
  }catch{s.missing=true;return null;}
 }
 const settings=s=>s.app.profile?.settings??{};
 const muted=s=>settings(s).music===false||!(Number(settings(s).musicVolume??.5)>0);
 function syncAudio(s){
  const a=s.audio;if(!a||s.closed)return;
  a.volume=Math.min(1,Math.max(0,Number(settings(s).musicVolume??.5)||0));
  if(doc.hidden||muted(s)||s.ended||s.missing){if(!a.paused){s.visibilityPaused=!s.ended&&!s.missing;a.pause();}} 
  else if(s.visibilityPaused&&s.started&&a.paused){s.visibilityPaused=false;let p=a.play();p?.catch(()=>{s.blocked=true;s.sync?.();});}
 }
 function start(s){
  if(s.closed||s.ended||s.missing||muted(s)||doc.hidden)return;
  const a=track(s);if(!a)return;
  s.started=true;s.blocked=false;s.visibilityPaused=false;syncAudio(s);
  try{const pending=a.play();pending?.catch(()=>{if(!s.closed){s.blocked=true;s.sync?.();}});}catch{s.blocked=true;}
  s.sync?.();
 }
 function open(app,mode){
  const style=node('style');style.textContent=css;doc.head.append(style);
  const s={app,mode,style,closed:false,armed:false};
  style.dataset.honroEndingReplan='';
  const refresh=()=>{syncAudio(s);s.sync?.();};
  doc.addEventListener('visibilitychange',refresh);
  s.close=()=>{if(s.closed)return;s.closed=true;doc.removeEventListener('visibilitychange',refresh);s.sync=null;if(s.audio){s.audio.pause();s.audio.removeAttribute('src');s.audio.load();}if(sessions.get(app)===s)sessions.delete(app);s.style.remove();};
  sessions.set(app,s);prewarm();app.updateAudio();return s;
 }
 function arm(s){if(s.armed)return;s.armed=true;s.app.updateAudio();start(s);}
 function silenceStock(app){const s=sessions.get(app);if(!s||s.closed)return false;syncAudio(s);return true;}
 function button(text,key,fn){
  const b=node('button','honro-ending-60-button',text);b.type='button';b.dataset.endingAction=key;
  b.addEventListener('click',e=>{if(e.isTrusted&&e.currentTarget===b&&!b.disabled)fn(e);});
  return b;
 }
 function audioButton(s){
  const b=button('곡 재생','listen',()=>start(s));
  const old=s.sync;
  s.sync=()=>{old?.();b.hidden=!s.armed||s.ended||s.missing||muted(s)||(!s.blocked&&!!s.audio&&!s.audio.paused);};
  s.sync();return b;
 }
 function credits(s,{root,media,heading,script,controls,status,leave}){
  root.dataset.cut='credits';media.replaceChildren();
  const emblem=node('div','h6ending-credit-plate');emblem.append(node('b','','혼로'),node('span','','魂路'),node('small','','무명사'));media.append(emblem);
  heading.textContent='여정은 여기까지';
  script.replaceChildren(node('p','','배경음: 혼로 (임시곡)'));
  s.sync=null;
  const exit=button(s.mode==='debug'?'디버그 화면으로 돌아가기':'타이틀로 돌아가기','return',leave);
  const music=audioButton(s);
  const left=node('span','h6ending-listen-status');
  const controlsUpdate=s.sync;s.sync=()=>{controlsUpdate?.();left.textContent=!s.ended&&s.audio&&!s.audio.paused?' 곡은 계속 재생됩니다. 바로 나갈 수도 있습니다.':'';};
  status.replaceChildren(node('span','',s.mode==='completion'?'여정의 끝을 기록했습니다.':''),left);controls.replaceChildren(exit,music);s.sync();exit.focus({preventScroll:true});
 }
 function framed(name,scene,cssClass,alt){
  const box=node('div',cssClass);box.dataset.art=name;
  const place=assets.places[scene],pic=node('picture','h6ending-backdrop');
  const portrait=node('source');portrait.media='(max-aspect-ratio: 19/20)';portrait.srcset=place.portrait;
  const i=image(place.wide,alt);if(i)pic.append(portrait,i);box.append(pic);return box;
 }
 function svg(tag,attrs={}){
  const el=doc.createElementNS('http://www.w3.org/2000/svg',tag);
  for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);return el;
 }
 function wakeAndFerry(){
  const prop=svg('svg',{viewBox:'0 0 460 150',class:'h6ending-ferry','aria-hidden':'true'});
  const parts=[
   ['M3 130 Q116 142 260 130 M15 141 Q84 149 177 139','#94a5a1','none',2],
   ['M137 75 Q245 84 426 53 L400 100 Q301 123 187 114 Q153 105 137 75Z','#2c312a','#4b503e',2],
   ['M146 79 Q234 91 395 69 L355 51 Q269 71 160 64Z','#35352d','#9c8156',2.4],
   ['M165 81 Q267 91 420 56 M184 108 Q280 114 395 88','#9b8058','none',2.8],
   ['M349 58 L373 30 L368 59 M384 72 L447 78','#9c8156','none',3.5]
  ];
  for(const [d,stroke,fill,sw] of parts)prop.append(svg('path',{d,fill,stroke,'stroke-width':sw,'stroke-linecap':'round','stroke-linejoin':'round'}));
  return prop;
 }
 function addedArt(scene){
  if(scene==='homecoming'){
   const v=framed('naru','shore-dawn','h6ending-naru','새벽 나루터의 물길과 돌 선착장');
   const fg=node('div','h6ending-home-foreground'),ferry=node('div','h6ending-ferry-arrival');
   const yeonsil=image(assets.actor.yeonsil,'연실');if(yeonsil){yeonsil.className='h6ending-yeonsil';ferry.append(yeonsil);}
   ferry.append(wakeAndFerry());fg.append(ferry);
   const seol=image(assets.actor.seol,'설오');if(seol){seol.className='h6ending-seol';fg.append(seol);}
   const bag=svg('svg',{viewBox:'0 0 64 73',class:'h6ending-sack','aria-hidden':'true'});
   bag.append(svg('path',{d:'M29 22 L19 7 L37 4 L47 12 L39 24 Q53 34 59 58 Q47 71 15 69 Q5 65 9 55 Q15 36 29 22Z',fill:'#8a7353',stroke:'#b4a083','stroke-width':1.8}),
    svg('path',{d:'M28 20 Q38 24 42 21 M28 29 L21 52 M40 29 L47 50 M29 64 Q43 64 51 60',fill:'none',stroke:'#5d4c3c','stroke-width':2,'stroke-linecap':'round'}));
   fg.append(bag);v.append(fg);return v;
  }
  const page=framed('records','dossier-room','h6ending-ledger','저문골 고을 기록방의 낮은 나무 탁자'),book=node('section','h6ending-paper');
  const h=node('h2','','저문골 조사 기록');book.append(h);
  const list=node('dl');
  for(const [label,detail] of [['폐쇄 승인','일부 왕실 고관의 인장 · 출입 폐쇄와 제압을 승인함'],['학살','집행 보고·호적·현장 증언 · 대도사가 주민 학살을 지휘함'],['은폐','사후처리 명령 · 관리들과 한태록의 봉문군이 수송, 봉쇄, 기록 삭제를 맡음']]){
   const slip=node('div','h6ending-evidence-slip');
   slip.append(node('dt','',label),node('dd','',detail));list.append(slip);
  }
  book.append(list);
  const hwigyeom=image(assets.actor.hwi,'휘겸');
  if(hwigyeom){hwigyeom.className='h6ending-hwi';page.append(hwigyeom);}
  page.append(book);return page;
 }
 function sceneText(script,rows){script.replaceChildren(...rows.map(text=>node('p','',text)));}
 async function paintAdded(s,parts,scene,next,leave=null){
  const {root,media,heading,script,controls,status}=parts;
  const [title,...copy]=lines[scene];
  const seq=s.artSeq=(s.artSeq??0)+1;
  const current=()=>!s.closed&&seq===s.artSeq&&root.isConnected;
  const art=addedArt(scene),more=button('계속','next',next);
  const exit=leave?button('나가기','return',leave):null;
  root.dataset.cut='loading';heading.textContent=title;sceneText(script,copy);s.sync=null;
  controls.replaceChildren(...(exit?[exit]:[]));status.textContent='장면을 준비하고 있습니다.';
  art.classList.add('h6ending-preparing');media.replaceChildren(art);
  await decoded(art);if(!current())return;
  await frames();if(!current())return;
  art.classList.remove('h6ending-preparing');
  await frames();if(!current())return;
  root.dataset.cut=scene;status.textContent='';controls.replaceChildren(more,...(exit?[exit]:[]),audioButton(s));
  more.focus({preventScroll:true});
 }
 function normal(app,parts){
  const s=open(app,'completion');let step=0;
  return Object.freeze({
   shouldHold:v=>v.scene==='later-return'&&step<2,
   paint(next){
    void paintAdded(s,parts,order[3+step],()=>{if(s.closed)return;step++;next();});
   },
   audioAfter(v,result){if(result?.ok&&v.scene==='bridge-record'&&v.record?.recorded)arm(s);},
   controls(){s.sync=null;if(s.armed)parts.controls.append(audioButton(s));},
   done(){credits(s,{...parts,leave:()=>{s.close();app.showTitle();app.updateAudio();}});},
   close:s.close
  });
 }
 function debug(app){
  if(!app.debugMode||app.training||app.customMap||G.HONRO_EMBEDDED||app.dialogue||app.endingGallery||app.settingsPage!=='debug'||
     app.modalKind!=='settings-dialog'||!app.modal.classList.contains('open')||sessions.has(app))return false;
  const s=open(app,'debug'),focus=doc.activeElement;
  const panel=node('div','honro-ending-60-panel'),root=node('section','honro-ending-60'),media=node('div','honro-ending-60-media'),
    heading=node('h1','honro-ending-60-title'),script=node('div','honro-ending-60-lines'),controls=node('div','honro-ending-60-controls'),
    status=node('p','honro-ending-60-status');
  root.dataset.stage='60';root.dataset.mode='debug';root.setAttribute('role','region');root.setAttribute('aria-label','혼로 6막 엔딩 미리보기');
  status.setAttribute('role','status');
  const held=[...app.root.children].map(n=>[n,n.inert]);
  for(const [n] of held)n.inert=true;
  const ownGallery={stage:60,debug:{screen:app.screen}};app.endingGallery=ownGallery;
  const priorScreen=app.screen;app.screen='act-ending';app.modal.classList.remove('open');panel.append(media,heading,script,controls,status);root.append(panel);app.root.append(root);
  let i=0,recorded=false;
  const token='act6-ending:'+G.performance.now();
  const onBack=()=>{if(G.history.state?.honroEndingGallery!==token)leave(false);};
  const leave=(requested=true)=>{
   if(s.closed)return;
   G.removeEventListener('popstate',onBack);
   if(requested!==false&&G.history?.state?.honroEndingGallery===token)G.history.back();
   s.close();root.remove();for(const [n,value] of held)n.inert=value;
   if(app.endingGallery===ownGallery)delete app.endingGallery;
   app.screen=priorScreen;app.modal.classList.add('open');app.prev=G.performance.now();app.updateAudio();focus?.focus?.({preventScroll:true});
  };
  const parts={root,media,heading,script,controls,status};
  function next(){if(i===1&&!recorded){recorded=true;paint();return;}if(i===1)arm(s);i++;paint();}
  function paint(){
   if(s.closed)return;
   if(i===order.length){credits(s,{...parts,leave});return;}
   const scene=order[i];
   if(i===3||i===4){void paintAdded(s,parts,scene,next,leave);return;}
   root.dataset.cut=scene;
   const [title,...copy]=lines[scene];heading.textContent=title;media.replaceChildren();
   const preview=(G.innerWidth/G.innerHeight<.95?assets.preview?.Portrait:assets.preview?.Wide)?.[scene];
   const plate=image(preview,title);if(plate)media.append(plate);
   if(scene==='bridge-record'&&recorded)copy.push('곽진 · 박문돌 · 이만복');
   sceneText(script,copy);s.sync=null;
   const press=button(scene==='bridge-record'&&!recorded?'방패선의 이름을 적기':scene==='later-return'?'여정을 마치기':'계속','next',next);
   controls.replaceChildren(press,button('나가기','return',leave),audioButton(s));
   status.textContent='미리보기 · 기록과 보상은 바뀌지 않습니다.';press.focus({preventScroll:true});
  }
  if(G.history?.pushState){G.history.pushState({...G.history.state,honroEndingGallery:token},'');G.addEventListener('popstate',onBack);}
  root.addEventListener('keydown',e=>{e.stopPropagation();if(e.code==='Escape'){e.preventDefault();leave();}});
  root.addEventListener('click',e=>e.stopPropagation());
  paint();return true;
 }
 function installDebug(app){
  const x=G.HonroActEndings;if(!x||installed.has(x)||G.HONRO_EMBEDDED)return;
  installed.add(x);const formerControls=x.debugControls,formerPreview=x.previewDebug;
  x.debugControls=a=>formerControls(a).replace('</div></section>','<button type="button" data-action="debug-act-ending-preview" data-id="60">6막</button></div></section>');
  x.previewDebug=(a,id)=>Number(id)===60?debug(a):formerPreview(a,id);
 }
 return Object.freeze({normal,installDebug,silenceStock,lines});
}
