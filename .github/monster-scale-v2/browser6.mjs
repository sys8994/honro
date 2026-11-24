/* Real normal Chromium app on isolated synthetic profiles. Does not execute CI or use network. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const [siteA,siteB,out,inputA,inputB,scope='31,32,35,36,37,40,43,47,48,49']=process.argv.slice(2);
assert(siteA&&siteB&&out&&[inputA,inputB].every(p=>/^[0-9a-f]{64}$/.test(p)),'browser.mjs <A> <B> <out> <manifest-sha-A> <manifest-sha-B> [IDs]');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex'), fact=b=>({bytes:b.length,sha256:sha(b)});
const copy=v=>JSON.parse(JSON.stringify(v));
const ids=scope.split(',').map(Number);
const KEY='honro-first-act-profile-1';
const themes={pc:{width:1440,height:900},mobile:{width:390,height:844}};
const pairs=Object.entries(themes).filter(([device])=>process.env.HONRO_DEVICES?.split(',').includes(device)??true);
fs.mkdirSync(out,{recursive:true});
const report={status:'HOLD',mode:'normal compiled Chromium App with prepared campaign fixture, paused deterministic scene, real Continue and exact local browser route bodies',views:pairs.map(x=>x[0]),stages:{}};
const save=()=>fs.writeFileSync(path.join(out,'BROWSER.json'),JSON.stringify(report,null,2));
function pin(site,expected){
 const base=path.resolve(site),map=new Map();
 const file=p=>{const x=path.resolve(base,p);assert(x.startsWith(base+'/'));return fs.readFileSync(x);};
 const raw=file('web/manifest.json');assert.equal(sha(raw),expected);
 const m=JSON.parse(raw);for(const r of [...m.previousFiles,...m.files])map.set(r.path,r);
 const checked=p=>{const d=file(p),s=fact(d),row=map.get(p);assert(row,'not registered: '+p);assert.deepEqual(s,{bytes:row.bytes,sha256:row.sha256},p);return d;};
 const project=JSON.parse(checked(m.project));
 return{base,m,file,checked,project,expect:expected};
}
const A=pin(siteA,inputA),B=pin(siteB,inputB);
// Root background tracks are shipped outside web/manifest.json. Pin against the exact A Pages archive, not an unrestricted file bypass.
const soundtrack={"assets/bgm/battle-1.mp3":{"bytes":4416906,"sha256":"3671f34895c9f80d5d04466a440c19420e3d0ea42acc4461a6dcb7ffb974b614"},"assets/bgm/battle-2.mp3":{"bytes":3783443,"sha256":"e9cfe4cdaeab5be1e865911ca7b61cd51e10147b3caca1994382fe75e812c698"},"assets/bgm/battle-3.mp3":{"bytes":3770116,"sha256":"966f8ccccce747935d15634ca4f537a2861319cfc4a5b96a6ff6891363462a05"},"assets/bgm/battle-4.mp3":{"bytes":4269672,"sha256":"91b0dab674e5d1f49205d2110d98fd778bd9316ab15263d36063d635da2e68bc"},"assets/bgm/battle-5.mp3":{"bytes":4844634,"sha256":"1e4f362d496fa99fb3e6081296c845fe06d5a0e126fb94a6c7070e1785baeb14"},"assets/bgm/battle-6.mp3":{"bytes":4549307,"sha256":"ff42bb3b526a47f8089a6b4ed395e82b4c8bbe32c1fe1ae31ebb22820a1be27f"},"assets/bgm/main.mp3":{"bytes":4741261,"sha256":"a2ffcceb9b0045f72e6baeab7292fd503fd92c4969d727009c057a60cbaca5fd"}};
for(const pins of [A,B]) for(const [p,m] of Object.entries(soundtrack)) assert.deepEqual(fact(pins.file(p)),m,p);
report.input={A:{manifest:inputA,entry:A.m.gameEntry},B:{manifest:inputB,entry:B.m.gameEntry}};save();
const browser=await chromium.launch({headless:true,executablePath:process.env.HONRO_CHROMIUM||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined)}).catch(e=>{report.launchError=String(e);save();throw e});
report.browser=browser.version();
function scenarioState(){
 const app=window.HonroApp,b=app.engine.b;
 const j=v=>JSON.parse(JSON.stringify(v));
 const keys=(src,list)=>Object.fromEntries(list.filter(k=>src[k]!==undefined).map(k=>[k,src[k]]));
 const art=[b.honroLandmarks,b.honroElements,b.honroEnvironment?.placements].map(a=>(a??[]).map(({asset,...rest})=>[asset?.id??null,rest]));
 return j({identity:keys(b,['mode','honroStage','honroCampaignMapRevision','honroMapOrigin','honroCanonical','honroCustom','honroAuthoredId','honroAct4Official','honroAct5']),
  tactical:keys(b,['heroDamage','damageDone','round','phase','side','active','queue','teamEnds','won','seed','rng','physics','terrain','waters','drafts','honroWorldTerrain','honroPlayBounds','honroTerrainBounds','honroState','honroMarkers','honroObjectives','honroCounters','honroAct4PreviewState','honroAct4EntryResidents','honroAct4FactEvents']),
  profile:keys(app.profile,['settings','cleared','lastStage','recruited','heroes','equipment','honroFlags','honroAct4']),
  units:b.units,npcs:b.units.filter(u=>u.side===2||u.honroAct4Resident||u.honroAct5Escort),art,
  archive:app.profileStore.archives(),locked:app.profileStore.locked});
}
async function open(pins,id,v,text=null){
 const ctx=await browser.newContext({viewport:v,deviceScaleFactor:1,locale:'ko-KR',serviceWorkers:'block'});
 assert.deepEqual(await ctx.storageState(),{cookies:[],origins:[]},'context not fresh');
 const root='http://honro-loopback.test/',shell=root+'HONRO.html';
 const errs=[],requests=new Map();
 await ctx.route('**/*',async route=>{
   const u=new URL(route.request().url());
   if(u.origin!==new URL(root).origin){errs.push('unexpected network '+u.origin);return route.abort();}
   const p=u.pathname.slice(1);
   try{
     if(route.request().method()!=='GET')throw Error('unexpected method');
     const audio=Object.hasOwn(soundtrack,p);
     const body=p==='web/manifest.json'||p==='HONRO.html'||audio?pins.file(p):pins.checked(p);
     if(audio){assert.deepEqual(fact(body),soundtrack[p]);const range=route.request().headers()['range'];const m=/^bytes=(\d+)-(\d*)$/.exec(range??'');if(m){const start=Number(m[1]),end=Math.min(m[2]?Number(m[2]):body.length-1,body.length-1);assert(start<=end);requests.set(p,fact(body));return route.fulfill({status:206,contentType:'audio/mpeg',headers:{'accept-ranges':'bytes','content-range':'bytes '+start+'-'+end+'/'+body.length},body:body.subarray(start,end+1)});}}
     requests.set(p,fact(body));
     const ext=p.split('.').at(-1),ct={js:'application/javascript',json:'application/json',html:'text/html; charset=utf-8',css:'text/css',woff2:'font/woff2',svg:'image/svg+xml',png:'image/png',webp:'image/webp',jpg:'image/jpeg',mp3:'audio/mpeg',ogg:'audio/ogg',wav:'audio/wav'}[ext]||'application/octet-stream';
     await route.fulfill({status:200,contentType:ct,body});
   }catch(e){errs.push('route '+p+': '+e.message);await route.abort();}
 });
 await ctx.addInitScript(({shell,key,text})=>{
   if(window!==window.top||location.href!==shell)return;
   if(text!==null)localStorage.setItem(key,text);
   const reset=()=>{let n=3910;Math.random=()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);};
   Object.defineProperty(window,'__honroQAResetSeed',{value:reset});
   reset();Date.now=()=>1795489910000;
 },{shell,key:KEY,text});
 const page=await ctx.newPage();page.on('pageerror',e=>errs.push(String(e)));
 try{
   const n=await page.goto(shell);assert(n&&n.ok()&&n.url()===shell);
   assert.deepEqual(fact(await n.body()),fact(pins.file('HONRO.html')),'shell mismatch');
   await page.waitForFunction(()=>document.documentElement.dataset.honroReady==='true'&&window.HonroApp&&window.HonroCampaignLoader,undefined,{timeout:60000});
   await page.evaluate(()=>{HonroApp.frame=()=>{};window.__honroQAResetSeed();});
   if(text!==null)assert.equal(sha(await page.evaluate(k=>localStorage.getItem(k),KEY)),sha(text),'seeded old bytes changed before pressing Continue');
   await page.evaluate(async id=>{await HonroCampaignLoader.ensureStage(id);},id);
   return{ctx,page,errs,requests,pins,id};
 }catch(e){await ctx.close();throw e;}
}
function checked(s){
 const {pins,id,requests,errs}=s;
 const required=[pins.m.gameEntry,pins.m.project,pins.project.stages[id-1],pins.project.stageLibraries[id-1]].filter(Boolean);
 for(const p of required)assert.deepEqual(requests.get(p),fact(pins.checked(p)),'browser did not receive current exact route '+p);
 assert.deepEqual(errs,[],'unexpected script/network error');
 return Object.fromEntries(required.map(p=>[p,requests.get(p)]));
}
async function start(s,id){
 await s.page.evaluate(id=>{
   const a=HonroApp;
   a.profile.settings.music=false;a.profile.settings.sound=false;
   for(let i=1;i<id;i++)a.profile.cleared[i]=true;
   const level=HonroProgression.plan(id).entryLevel;
   for(const h of Object.values(a.profile.heroes))h.xp=HonroProgression.xpAt(level);
   a.launch(id);
 },id);
 await s.page.waitForFunction(id=>HonroApp.engine?.b?.honroStage===id,id,{timeout:20000});
 await s.page.evaluate(()=>{
   const a=HonroApp;for(let i=0;i<40&&a.dialogue;i++)HonroStory.finish(a);
   if(a.dialogue)throw Error('entry reader persists');
   a.close();HonroStoryFraming.clear(a.scene);
 });
}
const dims=[['pc',{width:1440,height:900}],['mobile',{width:390,height:844}]];
try{
for(const [tag,pin] of [['A',A],['B',B]])for(const [device,viewport] of dims){
 if(tag==='B'&&inputA===inputB)continue;
 const s=await open(pin,6,viewport);
 try{
   await start(s,6);
   const result=await s.page.evaluate(()=>{
    const a=HonroApp,e=a.engine,b=e.b,foe=e.unit('midboss-stage6');
    if(a.settings?.debug||!b.honroCanonical||b.honroCustom||b.honroStage!==6)throw Error('Not normal canonical Stage6');
    const W=a.scene.canvas.clientWidth,H=a.scene.canvas.clientHeight;
    // Repeatable inspection camera only; no damage, movement, turns or object coordinates modified.
    Object.assign(a.scene,{x:3650,y:2800,scale:Math.min(W/2350,H/1500),time:.75,manual:true,editorView:false,skillPreview:false});
    a.scene.render(e,0,'',.6,false,0);
    return {h:foe.h,r:foe.r,x:foe.x,y:foe.y,hp:foe.hp,profile:b.honroMonsterScaleRevision,weak:foe.honroMonsterWeakPoint,scale:foe.honroMonsterScale,terrain:b.terrain.length,viewport:[W,H],objective:document.querySelector('#objective-text')?.textContent};
   });
   // Inspection frame at the same gameplay instant, minus the transient full-width
   // first-turn HUD overlay (the paused QA clock does not animate it away).
   await s.page.addStyleTag({content:'#turn-banner{visibility:hidden!important}'});
   await s.page.screenshot({path:path.join(out,tag+'-'+device+'.png')});
   report.stages[tag+'-'+device]={status:'PASS',result,required:checked(s)};save();
 }finally{await s.ctx.close();}
}
report.status='PASS';save();
}catch(e){report.err=String(e.stack??e);save();throw e;}finally{await browser.close();}
