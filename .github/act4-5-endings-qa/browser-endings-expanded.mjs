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
const soundtrack=Object.fromEntries(fs.readdirSync(path.join(A.base,"assets/bgm")).filter(f=>/\.mp3$/i.test(f)).map(f=>{const p="assets/bgm/"+f;return [p,fact(A.file(p))];}));
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
 const ctx=await browser.newContext({viewport:v,deviceScaleFactor:1,isMobile:v.width<500,hasTouch:v.width<500,locale:'ko-KR',serviceWorkers:'block'});
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
const layouts=[['pc',{width:1440,height:900}],['mobile',{width:390,height:844}]], old=new Map();
const eq=assert.equal, ending='#act-ending';
report.mode='normal exact Chromium App, controlled end-of-battle victory checkpoint; no post-start quest changes except input phase';
async function expectCut(s,id,cut){
 const el=s.page.locator(ending);
 await el.waitFor({timeout:12000});eq(await el.getAttribute('data-stage'),String(id));eq(await el.getAttribute('data-cut'),String(cut));
 const text=(await el.locator('p').innerText()).trim();
 assert(text.length>4,'Empty ending text: '+id+' cut '+cut);
 return text;
}
async function art(s,id,device){
 await s.page.waitForFunction(()=>{const c=document.querySelector('#act-ending'),i=c?.querySelector('img');return !!i&&!i.hidden&&i.complete&&i.naturalWidth>0&&!!c.dataset.art},undefined,{timeout:15000});
 const r=await s.page.locator(ending).evaluate(c=>{const i=c.querySelector('img');return {mode:c.dataset.art,src:i.getAttribute('src'),size:[i.naturalWidth,i.naturalHeight]}});
 eq(r.mode,device==='mobile'?'portrait':'landscape');
 assert(r.src&&r.size.every(x=>x>200),'Missing or tiny ending art');
 const bytes=s.pins.checked(r.src);assert(bytes.length>1000,'image bytes missing');
 assert.deepEqual(s.requests.get(r.src),fact(bytes),'decoded image must be exact active manifest bytes');
 return r;
}
async function press(s,device){
 await s.page.waitForFunction(()=>performance.now()>=HonroApp.endingInputAfter,undefined,{timeout:5000});
 if(device==='mobile')await s.page.locator(ending).tap({position:{x:12,y:60},timeout:5000});
 else await s.page.locator(ending).press('Enter');
}
async function snapshot(s){
 return await s.page.evaluate(key=>{
  const a=HonroApp,e=a.engine;
  return {screen:a.screen,stage:a.stage?.id??null,battle:e?.b?.honroStage??null,pending:a.profile.honroActEnding??null,frame:document.querySelector('#act-ending')?.dataset.cut??null,normalResult:document.querySelector('.result-title')?.textContent??null,rest:document.querySelector('main h1, .rest h1, .rest-screen h1')?.textContent??null,persisted:JSON.parse(localStorage.getItem(key)||'{}'),body:document.body.innerText.slice(0,5020)};
 },KEY);
}
async function launchOutcome(s,id){
 await start(s,id);
 await s.page.evaluate(id=>{
  const a=HonroApp,b=a.engine?.b;
  if(b?.honroStage!==id||!b.honroCanonical||b.honroCustom||a.debugMode)throw Error('not normal canonical stage '+id);
  b.phase='won';b.winnerReason='검수용 승리 상태';a.outcome(true);
 },id);
 const q=await snapshot(s); assert(q.persisted.cleared?.[id],'normal stage outcome not persisted '+id);return q;
}
async function finalRoute(s,id,fromResult=false){
 if(fromResult)await s.page.locator('[data-action="result-continue"]').click();
 if(id===40){
  await s.page.waitForFunction(()=>HonroApp.engine?.b?.honroStage===41,undefined,{timeout:18000});
  const q=await snapshot(s);eq(q.battle,41);assert(q.persisted.cleared?.[40]);
  return {battle:q.battle,screen:q.screen,saved:q.persisted.honroJourney??null};
 }
 if(id===50){
  await s.page.waitForFunction(()=>!document.querySelector('#act-ending')&&!HonroApp.engine&&HonroApp.screen==='rest',undefined,{timeout:18000});
  const q=await snapshot(s);
  assert(q.screen==='rest'&&!q.battle&&q.persisted.cleared?.[50]);
  assert(/무명사 산문|산이 끊긴 곳/.test(q.body),'Unexpected final shelter: '+q.body.slice(0,200));
  return {battle:q.battle,screen:q.screen,rest:q.rest,body:q.body.slice(0,300)};
 }
 await s.page.waitForFunction(()=>!document.querySelector('#act-ending')&&!HonroApp.profile.honroActEnding,undefined,{timeout:12000});
 const q=await snapshot(s);return {battle:q.battle,screen:q.screen};
}
async function finish(s,id,device){
 let out=[];for(let i=0;i<14;i++){
  const el=s.page.locator(ending);
  if(!await el.count())break;
  const cut=await el.getAttribute('data-cut'),text=await expectCut(s,id,cut);out.push({cut,text});
  await press(s,device);
  if(cut==='title')break;
 }
 assert(out.some(x=>x.cut==='title'),'never reached title '+id);return out;
}
async function gallery(pin,device,id,v,saved){
 const s=await open(pin,id,v,saved);
 try{
   const before=await snapshot(s);
   await s.page.evaluate(id=>HonroRestJourney.showBook(HonroApp,id),id);
   const records=s.page.locator("details.journey-records summary"); await records.first().click();
   const control=s.page.locator('[data-action="act-ending-replay"][data-id="'+id+'"]');
   await control.waitFor({timeout:12000});await control.click();
   const text=await expectCut(s,id,1);eq(await s.page.locator(ending).getAttribute('data-mode'),'gallery');
   await art(s,id,device);
   await s.page.locator('[data-ending-return]').click();
   const after=await snapshot(s);eq(after.screen,'journey');eq(after.pending,null);assert.deepEqual(after.persisted,before.persisted,'gallery mutated old completed save');
   eq(await control.count(),1);return text;
 }finally{await s.ctx.close();}
}
let failures=0;
function result(label,r){report.stages[label]=r;save();console.log(label,r.status,r.error??'');if(r.status!=='PASS')failures++;}
try{
 const work=[...ids.map(id=>['A','pc',id]),...(inputA===inputB?[]:ids.flatMap(id=>layouts.map(([name])=>['B',name,id])))];
 // Baseline old completions are first; candidate runs may later share these unmodified save bytes.
 for(const [tag,device,id] of work){
  const pin=tag==='A'?A:B, v=layouts.find(x=>x[0]===device)[1], key=tag+'-'+device+'-'+id;
  let s;
  try{
   s=await open(pin,id,v);
   const startState=await launchOutcome(s,id);
   const show=tag==='B'||id===30;
   if(!show){
    assert(!startState.pending&&!await s.page.locator(ending).count(),'baseline unexpectedly has Act '+id/10+' ending');
    eq(startState.normalResult,'길이 열렸다');
    old.set(id,JSON.stringify(startState.persisted));
    const route=await finalRoute(s,id,true);result(key,{status:'PASS',show:false,route});continue;
   }
   const first=await expectCut(s,id,1),frame=await art(s,id,device);
   await s.page.screenshot({path:path.join(out,key+'-cut1.png')});
   await press(s,device);const second=await expectCut(s,id,2);assert(first!==second,'cut content did not advance');
   const coldText=await s.page.evaluate(k=>localStorage.getItem(k),KEY);assert(JSON.parse(coldText).honroActEnding,'cold save missing pending');
   const required=checked(s);await s.ctx.close();
   s=await open(pin,id,v,coldText);
   await s.page.evaluate(()=>HonroApp.continue());eq(await expectCut(s,id,2),second);
   const oldVisits=JSON.parse(coldText).cleared?.[id]?.visits;
   const cuts=await finish(s,id,device);
   if(id===40)assert(/5막|하늘우물/.test(cuts.at(-1).text),'missing Act 5 title');
   if(id===50)assert(/다음 여정|6막|준비 중/.test(cuts.at(-1).text),'missing future status in final ending cut');
   const route=await finalRoute(s,id);
   if(tag==='B'&&id===30){const base=report.stages['A-pc-30'];assert(base?.status==='PASS','required A30 reference missing');assert.deepEqual([first,second,cuts,route],[base.first,base.second,base.cuts,base.route],'Act3 ending content/state changed');}
   const after=await snapshot(s);eq(after.pending,null);assert(after.persisted.seen?.['act-ending-v1:'+id]);eq(after.persisted.cleared?.[id]?.visits,oldVisits,'intro Continue repeated rewards/visits');
   assert.deepEqual(s.errs,[]);const replay=tag==='B'&&id!==30&&device==='pc'?await gallery(pin,device,id,v,old.get(id)):null;
   result(key,{status:'PASS',show:true,frame,first,second,cuts,route,replay,required});
  }catch(e){let late=null;if(s)try{const q=await snapshot(s);delete q.persisted;late=q;await s.page.screenshot({path:path.join(out,key+'-failure.png')});}catch{}result(key,{status:'HOLD',error:String(e.stack??e),late});}
  finally{if(s){try{await s.ctx.close()}catch{}}}
 }
 if(inputA!==inputB&&ids.includes(40)&&ids.includes(50)){const required=[40,50].flatMap(id=>layouts.map(([name])=>report.stages['B-'+name+'-'+id]?.frame?.src));if(required.some(x=>!x)||new Set(required).size!==4){failures++;report.artIndependence={status:'HOLD',required};}else report.artIndependence={status:'PASS',required};}
 report.status=failures?'HOLD':'PASS';save();
}finally{await browser.close()}
process.exitCode=failures?1:0;
