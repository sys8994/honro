// Stage32 post-combat rally in real Chromium with real keyboard input.
// Entry is a combat-clear save produced by stage32-play.mjs (declared, not a
// continuous browser campaign). Reads state only; never writes actors.
const {chromium}=require('playwright');const fs=require('fs');
const URL0=process.env.S32_URL||'http://127.0.0.1:8772/HONRO.html',SAVE=process.argv[2],OUT=process.argv[3],KEY='honro-first-act-profile-1';fs.mkdirSync(OUT,{recursive:true});
const log=[];const note=(k,v)=>{log.push({k,v});console.log(k,JSON.stringify(v));};
const st=p=>p.evaluate(()=>{const a=HonroApp,e=a.engine,b=e?.b;if(!b)return{screen:a.screen};const q=b.honroAct4PreviewState||{};return{screen:a.screen,stage:b.honroStage,round:b.round,phase:b.phase,active:b.active,can:a.canInput(),dialogue:!!a.dialogue,modal:a.modal.classList.contains('open'),done:!!a.done,foes:b.units.filter(u=>u.side===1&&!u.dead&&u.hp>0).length,safeSeven:!!q.safeSeven,complete:!!q.complete,travel:!!q.shelterTravel,objective:document.getElementById('objective-text')?.textContent||'',heroes:b.units.filter(u=>u.side===0&&!u.summoned).map(u=>({id:u.id,x:Math.round(u.x),y:Math.round(u.y),dead:!!u.dead,move:Math.round(u.moveLeft),surf:e.contactSurface(u.x,u.y-.5,u.y+.5)?.t.id||null})),exitX:b.honroAct4Design?.exit?.x,npcX:e.unit('a4-shelter-speaker')?.x,region:b.honroMap?.flightRegion||null};});
async function talk(p){for(let i=0;i<80;i++){const s=await st(p);if(!s.dialogue)return s;const n=p.locator('[data-action="dialogue-next"]:visible').first();if(await n.count())await n.click();else await p.keyboard.press('Space');await p.waitForTimeout(220);}return st(p);}
async function select(p,id){for(let i=0;i<5;i++){if((await st(p)).active===id)return true;await p.keyboard.press('Tab');await p.waitForTimeout(200);}return (await st(p)).active===id;}
async function hold(p,key,ms){await p.keyboard.down(key);await p.waitForTimeout(ms);await p.keyboard.up(key);await p.waitForTimeout(150);}
const inputs=[];let laneTry=0;
async function walkEast(p,id,goal){let stuck=0;for(let i=0;i<120;i++){let s=await talk(p);if(s.phase==='won'||s.done)return s;const u=s.heroes.find(h=>h.id===id);if(!u||u.x>=goal)return s;if(!s.can){await p.waitForTimeout(300);continue;}if(!await select(p,id)){await p.waitForTimeout(300);continue;}
  if(u.surf==='approved32-lower-lane'){ // the lane's east end is a pocket: take the central stair with a running jump
   if(u.x<1636){await hold(p,'ArrowRight',Math.min(900,Math.max(25,(1652-u.x)/.6)));inputs.push({id,key:'ArrowRight',to:'stair foot'});continue;}
   if(u.x>1668){await hold(p,'ArrowLeft',Math.min(900,Math.max(25,(u.x-1652)/.6)));inputs.push({id,key:'ArrowLeft',to:'stair foot'});continue;}
   await p.keyboard.press('ControlLeft');await p.keyboard.down('ArrowRight');await p.waitForTimeout(laneTry%2?190:130);await p.keyboard.up('ArrowRight');await p.waitForTimeout(900);laneTry++;inputs.push({id,key:'Control then ArrowRight',at:u.x,after:(await st(p)).heroes.find(h=>h.id===id)});continue;}
  const ms=Math.round(Math.min(700,Math.max(40,(goal-u.x)/.57+40)));await hold(p,'ArrowRight',ms);const n=(await st(p)).heroes.find(h=>h.id===id);inputs.push({id,key:'ArrowRight '+ms+'ms',from:u.x,to:n.x});
  if(Math.abs(n.x-u.x)<3){stuck++;if(stuck>2){await p.keyboard.down('ArrowRight');await p.keyboard.press('ControlLeft');await p.waitForTimeout(500);await p.keyboard.up('ArrowRight');inputs.push({id,key:'Control+ArrowRight (stuck)',at:n.x});}if(stuck>8)return st(p);}else stuck=0;}
 return st(p);}
(async()=>{const br=await chromium.launch(),errors=[];const c=await br.newContext({viewport:{width:1280,height:720}}),p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
 const save=JSON.parse(fs.readFileSync(SAVE,'utf8'));await p.goto(URL0);await p.waitForFunction('window.HonroProfileStore');await p.waitForFunction('window.HonroApp');await p.waitForTimeout(800);
 // The game's own save import (file input); the raw export is larger than localStorage accepts uncompacted.
 if(!await p.locator('#file-import').count()){const b=p.locator('[data-action="settings"]').first();if(await b.count())await b.click();await p.waitForTimeout(400);}
 await p.locator('#file-import').setInputFiles(SAVE);await p.waitForTimeout(2500);if(await p.evaluate(()=>HonroApp.modal.classList.contains('open')))await p.keyboard.press('Escape');await p.waitForTimeout(400);
 await p.locator('[data-action="continue"]').first().click();await p.waitForTimeout(2500);let s=await talk(p);note('continue',s);await p.screenshot({path:OUT+'/01-continue.png'});
 if(s.foes!==0)throw Error('save is not a combat-clear state');
 // 1) Seolo (archer) walks to the shelter witness.
 s=await walkEast(p,'archer',s.npcX-150);note('archer-at-shelter',{round:s.round,archer:s.heroes.find(h=>h.id==='archer'),objective:s.objective});await p.screenshot({path:OUT+'/02-archer-shelter.png'});
 for(let i=0;i<12&&!(s=await st(p)).safeSeven;i++){if(s.dialogue){await talk(p);continue;}await p.keyboard.press('KeyE');inputs.push({key:'KeyE'});await p.waitForTimeout(900);await talk(p);}
 note('reunion-diagnostic',await p.evaluate(()=>{const a=HonroApp,b=a.engine.b,q=b.honroAct4PreviewState,npc=a.engine.unit('a4-shelter-speaker'),hero=a.engine.unit('archer'),s=a.scene,cv=s.canvas,r=cv.getBoundingClientRect(),box=u=>{const x=r.left+cv.clientWidth/2+(u.x-s.x)*s.scale,y=r.top+cv.clientHeight/2+(u.y-s.y)*s.scale;return{left:Math.round(x-22*s.scale),right:Math.round(x+22*s.scale),top:Math.round(y-90*s.scale),bottom:Math.round(y+4*s.scale)};},hud=['.battle-info','.battle-head>button','#minimap-dock'].map(sel=>[...document.querySelectorAll(sel)].map(n=>{const k=n.getBoundingClientRect();return[sel,Math.round(k.left),Math.round(k.top),Math.round(k.right),Math.round(k.bottom)];})).flat();return{observed:!!q.reunionObserved,door:q.shelterDoor,npc:{x:Math.round(npc.x),sheltered:!!npc.honroAct4Sheltered},hero:Math.round(hero.x),events:Object.fromEntries(Object.entries(q.events).map(([k,v])=>[k,{terminal:v.terminal,skipped:v.skipped,presented:v.presented?.length}])),canvas:[Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)],scale:s.scale,npcBox:box(npc),heroBox:box(hero),hud};}));
 s=await st(p);note('reunion',{round:s.round,safeSeven:s.safeSeven,objective:s.objective});await p.screenshot({path:OUT+'/03-reunion.png'});
 // 2) Everyone gathers at the shelter.
 for(const id of s.heroes.filter(h=>!h.dead).sort((a,z)=>z.x-a.x).map(h=>h.id)){s=await walkEast(p,id,s.exitX-250);note('gather '+id,{round:s.round,x:s.heroes?.find(h=>h.id===id)?.x,phase:s.phase,complete:s.complete});if(s.phase==='won'||s.done)break;}
 for(let i=0;i<20;i++){s=await talk(p);if(s.phase==='won'||s.done||s.screen!=='battle')break;if(s.can&&i%3===1){await p.keyboard.press('KeyE');inputs.push({key:'KeyE (gathered)'});}await p.waitForTimeout(400);}
 await p.waitForTimeout(1500);s=await st(p);await p.screenshot({path:OUT+'/04-result.png'});
 const stored=await p.evaluate(k=>{const v=JSON.parse(localStorage.getItem(k));return{cleared32:v.cleared?.[32]||null,hasBattle:!!v.honroBattle};},KEY);
 note('final',{round:s.round,phase:s.phase,done:s.done,complete:s.complete,screen:s.screen,stored});
 fs.writeFileSync(OUT+'/browser-rally.json',JSON.stringify({url:URL0,save:SAVE,inputs,log,errors},null,1));console.log('ERRORS',JSON.stringify(errors.slice(0,5)));await br.close();})();
