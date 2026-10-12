/** Production character inspection + input callbacks with a synthetic DOM.
 * XP/engine state are real; geometry, touch capture and rendering need browser QA. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';

const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,S=C.SKILLS;
const source=await readFile('shared/runtime/main.js','utf8'),nodes=new Map(),listeners=new Map(),checks=[];
const listen=(type,fn)=>{const all=listeners.get(type)||[];all.push(fn);listeners.set(type,all);};
function element(id=''){
 const children=new Map(),handlers=new Map(),attrs=new Map(),classes=new Set();
 return {id,hidden:false,dataset:{},style:{setProperty(){}},textContent:'',innerHTML:'',handlers,attrs,
  classList:{contains:k=>classes.has(k),add:k=>classes.add(k),remove:k=>classes.delete(k),toggle(k,value){value?classes.add(k):classes.delete(k);}},
  querySelector(selector){if(!children.has(selector))children.set(selector,element());return children.get(selector);},querySelectorAll:()=>[],
  addEventListener(type,fn){const all=handlers.get(type)||[];all.push(fn);handlers.set(type,all);},
  setAttribute:(k,v)=>attrs.set(k,String(v)),setPointerCapture(){},hasPointerCapture:()=>false,
  getBoundingClientRect:()=>({left:0,top:0,bottom:900,width:id==='unit-info'?290:1440,height:id==='unit-info'?300:900}),
  append(child){nodes.set(child.id,child);},contains:()=>false,
 };
}
const node=id=>{if(!nodes.has(id))nodes.set(id,element(id));return nodes.get(id);};
const doc={addEventListener:listen,getElementById:id=>nodes.get(id),createElement:()=>element(),querySelector:()=>({getBoundingClientRect:()=>({top:760})}),querySelectorAll:()=>[]};
g.document=doc;g.innerWidth=1440;g.innerHeight=900;g.HonroScene=class{};g.HonroFA={icon:()=>''};g.HonroStory={turnPaused:()=>false};
vm.runInContext(await readFile('shared/runtime/unit-info.js','utf8'),g);
const info=g.HonroUnitInfo;
const slices=[['        defend()','        updateStick('],['        updateChargeDisplay()','        updateHUD('],['        bind() {','        equipConfirm(']];
const App=new Function('G','C','S','H','document','window','performance','$','clamp','return class {'+slices.map(([a,b])=>{
 assert(source.includes(a)&&source.includes(b));return source.slice(source.indexOf(a),source.indexOf(b));
}).join('\n')+'}')(g,C,S,g.HONRO_CONTENT,doc,{addEventListener(){}},performance,node,(x,a,b)=>Math.max(a,Math.min(b,x)));
const check=(name,fn)=>{fn();checks.push(name);console.log('PASS',name);};
function fixture(){
 const profile=C.defaults(),b=C.createBattle(1,profile,'practice',{party:['archer'],wind:0}),archer=b.units[0],mage=C.makeUnit('mage',0,600,500,{id:'mage-test'}),enemy=b.units.find(u=>u.side===1);
 for(const [i,u] of [archer,mage,enemy].entries())Object.assign(u,{x:250+i*350,y:500,vx:0,vy:0,acted:false,dead:false});
 b.units=[archer,mage,enemy];b.active=archer.id;b.side=0;b.phase='aim';b.heroes.archer.xp=0;b.heroes.mage.xp=C.xpAtLevel(5)+Math.floor(C.xpToNext(5)/2);
 mage.loadout=['M01','M03'];
 const a=new App(),cv=node('battlecanvas');cv.parentElement=element();
 Object.assign(a,{engine:new C.Engine(b),profile,screen:'battle',selected:'A01',selectedByUnit:{[mage.id]:'M03'},keys:new Set(),contacts:new Map(),stick:{x:0,y:0},scene:{canvas:cv,scale:1,x:0,y:0,world:(x,y)=>({x,y}),zoom(f){this.scale*=f;}},modal:element(),done:false,charging:false,root:element(),updateHUD(){},notify(text){this.notice=text;},pause(){this.paused=true;}});
 a.inputs();a.bind();g.HonroApp=a;
 return {a,b,archer,mage,enemy,el:nodes.get('unit-info'),cv};
}
const body=u=>({x:u.x,y:u.y-u.h*.5});
const event=(p,id=1,type='mouse')=>({pointerId:id,pointerType:type,clientX:p.x,clientY:p.y,preventDefault(){}});
const emit=(type,e)=>{for(const fn of listeners.get(type)||[])fn(e);};
const action=(action,id)=>emit('click',{target:{closest:()=>({dataset:{action,id},disabled:false})}});
const click=id=>action('select-hero',id);
const key=(code)=>emit('keydown',{code,repeat:false,target:{tagName:'BODY'},preventDefault(){}});
let f=fixture();
check('Map character tap keeps character/remembered-skill selection and opens a nonmodal card',()=>{
 f.a.charging=true;f.a.keys.add('KeyD');const p=body(f.mage);f.cv.onpointerdown(event(p));f.cv.onpointerup(event(p));
 assert.equal(f.b.active,f.mage.id);assert.equal(f.a.selected,'M03');assert(!f.a.charging);assert.equal(f.a.keys.size,0);assert.equal(f.a.contacts.size,0);
 assert.equal(f.a.scene.inspectUnitId,f.mage.id);assert(!f.el.hidden);assert(!f.a.modal.classList.contains('open'));assert(f.a.canInput());
 assert.equal(f.el.querySelector('h3').textContent,`${f.mage.name} · 경지 5`);assert.equal(f.el.querySelector('.unit-info-progress').hidden,false);
 const xp=f.el.querySelector('.unit-info-xp');assert.equal(xp.querySelector('i').style.width,C.xpFraction(f.b.heroes.mage)*100+'%');assert.equal(xp.attrs.get('aria-valuenow'),'50');
});
check('The former generous map selection edge also opens character information',()=>{
 info.close(f.a);const p={x:f.archer.x+f.archer.h*.65,y:f.archer.y-f.archer.h*.5};assert.equal(info.pick(f.a,p),null);
 f.cv.onpointerdown(event(p));f.cv.onpointerup(event(p));assert.equal(f.b.active,f.archer.id);assert.equal(f.a.scene.inspectUnitId,f.archer.id);
});
check('Live battle XP is authoritative, including zero, updates, level thresholds and maximum',()=>{
 const hero=f.b.heroes.archer,normal=JSON.stringify(f.a.profile);f.a.profile.heroes.archer.xp=C.XP_CAP;
 info.show(f.a,f.archer);const xp=f.el.querySelector('.unit-info-xp');assert.equal(xp.querySelector('i').style.width,'0%');assert.equal(xp.attrs.get('aria-valuenow'),'0');assert.match(f.el.querySelector('.unit-info-xp-detail').textContent,/^0 \/ 270 XP$/);
 hero.xp=C.xpAtLevel(7);info.tick(f.a);assert.match(f.el.querySelector('h3').textContent,/경지 7$/);assert.equal(xp.querySelector('i').style.width,'0%');
 C.grantXP(hero,Math.floor(C.xpToNext(7)/2));info.tick(f.a);assert.equal(xp.querySelector('i').style.width,C.xpFraction(hero)*100+'%');assert.match(f.el.querySelector('.unit-info-xp-label').textContent,/50%/);
 hero.xp=C.XP_CAP;info.tick(f.a);assert.equal(xp.querySelector('i').style.width,'100%');assert.equal(xp.attrs.get('aria-valuenow'),'100');assert.match(f.el.querySelector('.unit-info-xp-label').textContent,/최대 경지/);assert.match(f.el.querySelector('.unit-info-xp-detail').textContent,/경지 30 · 성장 완료/);
 f.a.profile=JSON.parse(normal);
});
check('Acted and fallen companions are inspectable without becoming the active unit',()=>{
 f.mage.acted=true;const before=f.b.active;info.tap(f.a,body(f.mage),false);assert.equal(f.b.active,before);assert.equal(f.a.scene.inspectUnitId,f.mage.id);assert.match(f.el.querySelector('.unit-info-side').textContent,/행동 완료/);
 click(f.mage.id);assert.equal(f.b.active,before);assert(f.el.hidden,'Even an unavailable portrait only selects and closes information');
 f.mage.dead=true;f.mage.hp=0;info.show(f.a,f.mage);assert.equal(f.b.active,before);assert(!f.el.hidden);assert.match(f.el.querySelector('.unit-info-side').textContent,/전투불능/);assert.equal(info.pick(f.a,body(f.mage)),null);
 click(f.mage.id);assert.equal(f.b.active,before);assert(f.el.hidden);
 f.mage.dead=false;f.mage.acted=false;f.mage.hp=f.mage.maxHp;
});
check('HUD portraits only select and dismiss cards; keyboard Tab does not open information',()=>{
 info.show(f.a,f.archer);click(f.mage.id);assert.equal(f.b.active,f.mage.id);assert.equal(f.a.selected,'M03');assert.equal(f.a.scene.inspectUnitId,null);assert(f.el.hidden);
 click(f.mage.id);assert(f.el.hidden,'Reselecting the same portrait does not open information');
 info.show(f.a,f.enemy);click(f.archer.id);assert.equal(f.b.active,f.archer.id);assert(f.el.hidden,'Portrait selection also closes enemy information');
 key('Tab');assert.equal(f.b.active,f.mage.id);assert.equal(f.a.scene.inspectUnitId,null);click(f.archer.id);
 const line=source.split('\n').find(x=>x.includes("$('hero-switches').innerHTML="));assert(!line.includes('선택 및 정보'),'Portrait label must describe selection only');
});
check('Status button opens selected-character information and preserves durations, damage and action restrictions',()=>{
 const status=node('combat-status'),hero=f.archer,oldTerrain=f.b.terrain;
 Object.assign(hero,{bound:2,curseTurns:3,curseDamage:9,curseArmor:.15,focus:0,jumping:false,airborne:false});f.a.selected='A05';
 f.b.terrain=[{id:'fixture-floor',x:0,y:500,w:2000,h:500,mat:'rock',hp:9999,maxHp:9999}];f.b.sceneVersion++;
 g.HonroCombatStatus.refresh(f.a,hero);assert.match(status.innerHTML,/button class="status-trigger" type="button" data-action="inspect-hero"/);assert(status.innerHTML.includes(`data-id="${hero.id}"`));assert(!status.innerHTML.includes('status-popover'));assert(status.innerHTML.includes('combat-action-reason'),'Fire control retains an accessible action-reason description');
 f.a.charging=true;f.a.keys.add('Space');const before=JSON.stringify(f.b);action('inspect-hero',hero.id);assert.equal(JSON.stringify(f.b),before);assert(!f.a.charging);assert.equal(f.a.keys.size,0);assert.equal(f.a.scene.inspectUnitId,hero.id);assert(!f.a.modal.classList.contains('open'));
 assert.match(f.el.querySelector('.unit-info-status').textContent,/결박 2회/);assert.match(f.el.querySelector('.unit-info-status').textContent,/저주 3턴/);assert.match(f.el.querySelector('.unit-info-status').textContent,/매 턴 피해 9/);assert.match(f.el.querySelector('.unit-info-reason').textContent,/기력 부족/);assert(!f.el.querySelector('.unit-info-reason').hidden);
 const trigger=status.querySelector('.status-trigger');let stopped=0;for(const code of ['Space','Enter'])for(const type of ['onkeydown','onkeyup'])trigger[type]({code,stopPropagation(){stopped++;}});assert.equal(stopped,4,'Native activation must not reach the combat charge handlers');
 Object.assign(hero,{bound:0,curseTurns:0,curseDamage:0,curseArmor:0,focus:hero.maxFocus});f.a.selected='A01';f.b.terrain=oldTerrain;f.b.sceneVersion++;info.close(f.a);
});
check('HUD skills retain icon, name, cost and number while omitting their rank label',()=>{
 const line=source.split('\n').find(x=>x.includes("$('combat-skills').innerHTML="));assert(!line.includes('rank-tiny'));for(const token of ['class="key"','class="mana-cost"','this.sig(s.id)','class="skill-name"'])assert(line.includes(token));
});
check('Enemy inspection retains selection, level, health, defense and skills without hero XP',()=>{
 const before=JSON.stringify(f.b);info.tap(f.a,body(f.enemy),false);assert.equal(f.a.scene.inspectUnitId,f.enemy.id);assert.equal(JSON.stringify(f.b),before);
 assert.match(f.el.querySelector('h3').textContent,/Lv\./);assert.equal(f.el.dataset.side,'enemy');assert.equal(f.el.querySelector('.unit-info-progress').hidden,true);assert(f.el.querySelector('.unit-info-reason').hidden);assert(f.el.querySelector('.unit-info-health span').textContent.includes('/'));assert(f.el.querySelector('.unit-info-existence').innerHTML);assert(f.el.querySelector('.unit-info-skills').textContent);
});
check('Summons and allies retain inspection without claiming their class hero XP',()=>{
 const summon=C.makeUnit('occultist',0,1250,500,{id:'summon-test',summoned:true,summonOwner:f.archer.id}),ally=C.makeUnit('knight',2,1300,500,{id:'ally-test'});f.b.units.push(summon,ally);
 for(const u of [summon,ally]){assert(info.show(f.a,u));assert.equal(f.el.querySelector('.unit-info-progress').hidden,true);assert.equal(f.el.dataset.side,'ally');}
 summon.dead=true;assert(!info.show(f.a,summon));assert(info.show(f.a,f.archer));
});
check('Bound-body warning keeps its protected-person presentation without health or XP',()=>{
 const original=g.HonroNarrativeRevision.bodyBound;g.HonroNarrativeRevision.bodyBound=(b,u)=>u===f.enemy;
 try{info.show(f.a,f.enemy);assert.equal(f.el.querySelector('h3').textContent,f.enemy.name);assert(f.el.querySelector('.unit-info-health').hidden);assert(f.el.querySelector('.unit-info-existence').hidden);assert(f.el.querySelector('.unit-info-progress').hidden);assert.match(f.el.querySelector('.unit-info-desc').textContent,/몸을 공격하지 마세요/);}finally{g.HonroNarrativeRevision.bodyBound=original;}
});
check('Closing via button, Escape, empty tap and HUD outside click preserves battle and allows input',()=>{
 for(const close of [()=>f.el.querySelector('button').onclick(),()=>key('Escape'),()=>info.tap(f.a,{x:-200,y:-200},false),()=>emit('pointerdown',{target:{closest:()=>null}})]){
  info.show(f.a,f.archer);const before=JSON.stringify(f.b);close();assert.equal(f.a.scene.inspectUnitId,null);assert(f.el.hidden);assert(!f.a.paused);assert(f.a.canInput());assert.equal(JSON.stringify(f.b),before);
 }
 let stopped=0;for(const type of ['keydown','keyup'])for(const fn of f.el.handlers.get(type)||[])fn({code:'Space',stopPropagation(){stopped++;}});assert.equal(stopped,2);
});
check('Mouse and touch drag, pinch and cancellation never reopen a character card or select it',()=>{
 for(const type of ['mouse','touch']){info.show(f.a,f.archer);const before=f.b.active,p=body(f.mage);f.cv.onpointerdown(event(p,1,type));f.cv.onpointermove(event({x:p.x+25,y:p.y},1,type));f.cv.onpointerup(event({x:p.x+25,y:p.y},1,type));assert(f.el.hidden);assert.equal(f.b.active,before);assert.equal(f.a.contacts.size,0);}
 info.show(f.a,f.archer);const p=body(f.mage);f.cv.onpointerdown(event(p,1,'touch'));f.cv.onpointerdown(event({x:p.x+50,y:p.y},2,'touch'));f.cv.onpointermove(event({x:p.x+70,y:p.y},2,'touch'));f.cv.onpointerup(event(p,1,'touch'));f.cv.onpointerup(event({x:p.x+70,y:p.y},2,'touch'));assert(f.el.hidden);assert.equal(f.a.contacts.size,0);
 info.show(f.a,f.archer);f.cv.onpointerdown(event(p,1,'touch'));f.cv.onpointercancel(event(p,1,'touch'));for(const fn of f.cv.handlers.get('pointercancel')||[])fn();assert(f.el.hidden);assert.equal(f.a.contacts.size,0);
});
check('Touch tap opens the card while dialogs, completed battles and invisible foes are excluded',()=>{
 const p=body(f.mage);f.cv.onpointerdown(event(p,1,'touch'));f.cv.onpointerup(event(p,1,'touch'));assert.equal(f.a.scene.inspectUnitId,f.mage.id);
 for(const block of ['dialogue','done']){f.a[block]=true;info.tick(f.a);assert(f.el.hidden);assert(!info.show(f.a,f.archer));f.a[block]=false;}
 f.a.modal.classList.add('open');assert(!info.show(f.a,f.archer));f.a.modal.classList.remove('open');
 const visibility=g.HonroAct2.visible;g.HonroAct2.visible=(b,u)=>u!==f.enemy;assert.equal(info.pick(f.a,body(f.enemy)),null);assert(!info.show(f.a,f.enemy));g.HonroAct2.visible=visibility;
});
check('Inspection and dismissal never write progression or a normal profile',()=>{
 const profile=JSON.stringify(f.a.profile),battle=JSON.stringify(f.b);for(const u of f.b.units){info.show(f.a,u);info.tick(f.a);info.close(f.a);}assert.equal(JSON.stringify(f.a.profile),profile);assert.equal(JSON.stringify(f.b),battle);
 assert(!source.includes('hud-xp-fill'),'HUD must not own an experience bar');
});
await mkdir('_local/reports/character-info',{recursive:true});await writeFile('_local/reports/character-info/summary.json',JSON.stringify({status:'passed',checks,limits:['Synthetic DOM and pointer callbacks; actual browser layout, pointer capture, Game and Workshop remain separate QA.','Progression states are isolated fixtures, not normal-campaign play evidence.']},null,2)+'\n');
console.log(`Character information: ${checks.length} passed`);
