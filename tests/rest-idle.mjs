/** Production App/menu lifecycle with DOM/Canvas doubles; rendering proof is
 * tests/rest-idle-render.mjs. Neither test claims browser input/performance. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,click,finish,load,profileThrough}=h,checks=[];
const media={matches:false};g.matchMedia=()=>media;
vm.runInContext(await readFile('shared/runtime/rest-journey.js','utf8'),g);
const R=g.HonroRestJourney,A=g.HonroJourneyArt;
let actors=[],writes=0,raf=0;
g.requestAnimationFrame=()=>++raf;
g.HONRO_PARTY=Object.fromEntries(['seol_o','damheo','hwigyeom','sodan'].map(id=>[id,{id}]));
g.HonroVectorRig={createCanvasRenderer:asset=>({draw(ctx,options){actors.push({id:asset.id,...options});}})};
const canvas=cls=>({dataset:{restPerson:cls},width:220,height:300,getContext:()=>({clearRect(){},save(){},restore(){},translate(){},scale(){}})});
let people=['archer','mage','knight','occultist'].map(canvas);
const art=['flame-outer','flame-inner','flame-core','fire-ground','fire-halo','ember','pine-crown','lantern','mist','cloud','ripples'].map(kind=>({dataset:{restMotion:kind},attrs:{},setAttribute(k,v){this.attrs[k]=v;writes++;}}));
const scene={isConnected:true,style:{setProperty(){}},getBoundingClientRect:()=>({width:1440,height:800}),querySelectorAll:()=>art};
const query=g.document.querySelector;g.document.querySelector=s=>s==='.rest-landscape'?scene:query(s);
g.document.querySelectorAll=s=>s==='canvas[data-rest-person]'?people:[];
const check=(name,fn)=>{fn();checks.push(name);console.log('PASS',name);};
let app;
check('Existing App rAF drives asynchronous party idle and retained art at capped cadence',()=>{
 app=load(profileThrough(10));const before=raf;click('rest');finish(app);assert.equal(raf,before,'rest entry must not create another rAF');
 const first=actors.slice(-4);assert.equal(first.length,4);const m=app.restMotion,draws=m.draws;
 for(let i=1;i<=60;i++)app.frame(app.prev+1000/60);
 assert.equal(raf,before+60,'only the App frame reschedules');assert.equal(m.draws-draws,24);assert.equal(new Set(actors.slice(-4).map(v=>v.time)).size,4);
 for(const old of first){const now=actors.findLast(v=>v.id===old.id);assert(now.time>old.time);assert.equal(now.animation,'idle');assert.equal(now.height,102);assert.equal(now.facing,old.facing);}
 assert(art.every(v=>Object.keys(v.attrs).length));
});
check('Animation never ticks or rewrites a suspended battle or profile',()=>{
 app=load(profileThrough(10));app.launch(11);finish(app);app.engine.active.hp-=11;app.engine.active.focus-=3;click('rest');finish(app);
 const before=plain(app.profile),snapshot=plain(app.profile.honroBattle),html=app.root.innerHTML;
 for(let i=0;i<240;i++)app.frame(app.prev+1000/60);
 assert.equal(app.engine,null);assert.deepEqual(plain(app.profile),before);assert.deepEqual(plain(app.profile.honroBattle),snapshot);assert.equal(app.root.innerHTML,html);
});
check('Hidden tabs and reduced motion freeze draws/time; resumption has no catch-up',()=>{
 const m=app.restMotion;g.document.hidden=true;const time=m.time,count=m.draws,attrs=JSON.stringify(art.map(v=>v.attrs));
 for(let i=0;i<30;i++)R.frame(app,60);assert.equal(m.time,time);assert.equal(m.draws,count);assert.equal(JSON.stringify(art.map(v=>v.attrs)),attrs);
 g.document.hidden=false;R.frame(app,60);assert.equal(m.time,time);R.frame(app,60);assert(m.time-time<=.06000001);
 media.matches=true;R.frame(app,.06);const reducedCount=m.draws,reducedTime=m.time;assert.equal(actors.at(-4).time,0);for(let i=0;i<60;i++)R.frame(app,.06);assert.equal(m.draws,reducedCount);assert.equal(m.time,reducedTime);
 media.matches=false;R.frame(app,90);assert.equal(m.time,reducedTime);R.frame(app,0);assert.equal(m.time,reducedTime);
});
check('Narrow screens cap canvas redraws to 20 Hz and invalid dt cannot jump time',()=>{
 g.innerWidth=390;app.restMotion.age=0;const m=app.restMotion,before=m.draws,time=m.time;for(let i=0;i<60;i++)R.frame(app,1/60);assert.equal(m.draws-before,20);
 const current=m.time;for(const dt of [-1,NaN,undefined])R.frame(app,dt);assert.equal(m.time,current);assert(Math.abs(m.time-time-1)<1e-8);g.innerWidth=1440;
});
check('Optional dialogue redraw keeps one controller, elapsed time and focus',()=>{
 const old=app.restMotion,time=old.time;click('rest-talk',{class:'occultist'});assert.equal(app.dialogue.restKind,'optional');finish(app);assert.notEqual(app.restMotion,old);assert.equal(app.restMotion.time,time);assert(g.document.activeElement);
 const count=old.draws;R.frame(app,.06);assert.equal(old.draws,count);assert.match(app.root.innerHTML,/aria-label="소단과 선택 대화/);
});
check('Repeated rest/camp/book/title transitions release all motion handles without added listeners',()=>{
 const listenerCount=()=>[...h.listeners.values()].reduce((n,a)=>n+a.length,0),before=listenerCount(),beforeRaf=raf;
 for(let i=0;i<6;i++)for(const action of ['camp','journey-book','title']){click('rest');finish(app);const old=app.restMotion;assert(old);click(action);assert.equal(app.restMotion,null);const count=old.draws;R.frame(app,.06);assert.equal(old.draws,count);}
 assert.equal(listenerCount(),before);assert.equal(raf,beforeRaf);click('rest');finish(app);scene.isConnected=false;R.frame(app,.06);assert.equal(app.restMotion,null);scene.isConnected=true;
});
check('Reduced motion at entry is static; all animated artwork attributes remain finite and bounded',()=>{
 media.matches=true;click('rest');finish(app);const m=app.restMotion,draws=m.draws;for(let i=0;i<60;i++)R.frame(app,.06);assert.equal(m.draws,draws);assert.equal(m.time,0);media.matches=false;
 for(const variant of A.variants)for(const layer of A.layers){const svg=A.scene(variant,layer);assert.match(svg,/data-rest-motion="flame-outer"/);assert.match(svg,/data-rest-motion="mist"/);assert.equal((svg.match(/data-rest-motion="ember"/g)||[]).length,3);assert((svg.match(/data-rest-motion=/g)||[]).length<=18);}
 for(const target of art)for(let t=0;t<60;t+=.137){const attrs=A.motionFrame(target.dataset.restMotion,t,.37);for(const v of Object.values(attrs))assert(!/NaN|Infinity/.test(v));if(attrs.opacity!==undefined)assert(+attrs.opacity>=0&&+attrs.opacity<=1);}
});
await report('rest-idle',checks,{limits:['DOM/Canvas/input scheduling are doubles. Native pixel evidence runs separately. No browser performance or normal campaign claim.']});
