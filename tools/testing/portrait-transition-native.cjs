// Focused real-runtime/native-pixel checks; no browser or network required.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),{createCanvas,loadImage}=require(path.join(root,'node_modules/@napi-rs/canvas'));
(async()=>{
 const config=JSON.parse(fs.readFileSync(path.join(root,'game/config/story-portraits.json')));const pending=[],timers=new Map();let timerId=0;
 class Image{set src(src){this.url=src;pending.push(this)}async decode(){}}
 const g={Image,innerWidth:1024,setTimeout:(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId},clearTimeout:id=>timers.delete(id),HONRO_STORY_PORTRAITS:config,HONRO_PORTRAIT_VARIANTS:{variants:{'emotion.resolve':{},'emotion.concern':{},'emotion.relief':{},'emotion.sorrow':{},'emotion.anger':{}}}};
 for(const p of Object.values(config))for(const a of Object.values(p.approvedPortrait?.expressions||{}))a.src=a.file;
 vm.createContext(g);vm.runInContext(fs.readFileSync(path.join(root,'shared/runtime/portraits.js'),'utf8'),g);
 const c=createCanvas(400,440);c.dataset={};c.isConnected=true;c.getAttribute=k=>c[k];c.setAttribute=(k,v)=>c[k]=v;const ctx=c.getContext('2d'),real=ctx.drawImage.bind(ctx);ctx.drawImage=(im,...args)=>real(im.native||im,...args);
 const draw=(who,expression)=>g.HonroPortraits.draw(c,null,config[who].class,{identity:who,portraitExpression:expression,framing:'dialogue'}),pixels=()=>c.toBuffer('image/png'),blank=()=>!ctx.getImageData(0,0,400,440).data.some((v,i)=>i%4===3&&v>0);
 async function finish(im){assert(im);im.native=await loadImage(path.join(root,im.url));await im.onload()}
 draw('담허','base');await finish(pending.shift());const base=pixels(),stats=g.HonroPortraits.stats();draw('담허','base');assert.deepEqual(g.HonroPortraits.stats(),stats);assert.deepEqual(pixels(),base);
 assert.equal(draw('담허','emotion.resolve').state,'loading');assert(blank(),'changed expression must clear old pixels');await finish(pending.shift());assert.equal(draw('담허','emotion.resolve').expression,'emotion.resolve');assert(!blank());
 draw('담허','emotion.sorrow');const late=pending.shift();assert(blank());draw('설오','base');await finish(pending.shift());const seoro=pixels();await finish(late);assert.deepEqual(pixels(),seoro,'late request overwrote current speaker');
 // Failure shows same-person base, but later successful retry cannot replace it in this view.
 draw('담허','emotion.anger');pending.shift().onerror();assert.equal(draw('담허','emotion.anger').expression,'base');const fallback=pixels();const retry=[...timers].find(([,t])=>t.ms<8000);assert(retry);timers.delete(retry[0]);retry[1].fn();await finish(pending.shift());assert.deepEqual(pixels(),fallback);assert.equal(draw('담허','emotion.anger').expression,'base');
 // Closing releases ownership; a new visit may use the now-cached exact expression.
 g.HonroPortraits.release({querySelectorAll:()=>[c]});assert.equal(draw('담허','emotion.anger').expression,'emotion.anger');assert.notDeepEqual(pixels(),fallback);
 draw('담허','emotion.relief');const reopening=pending.shift();g.HonroPortraits.release({querySelectorAll:()=>[c]});draw('담허','emotion.relief');assert(blank());await finish(reopening);assert.equal(draw('담허','emotion.relief').state,'ready');assert(!blank());
 // Actual artwork uses near-identical full-source composition; use one normalized crop,
 // not the approximate face boxes (which formerly introduced vertical drift).
 const out=path.join(root,'_local/reports/portrait-audit-20261028');fs.mkdirSync(out,{recursive:true});const sheet=createCanvas(1200,440),sc=sheet.getContext('2d');let j=0;
 for(const e of ['base','emotion.resolve','emotion.concern']){
  let info=draw('담허',e);if(info.state!=='ready'){await finish(pending.shift());info=draw('담허',e)}
  const a=config['담허'].approvedPortrait.expressions[e],f=a.framing.dialogue.face;
  assert(Math.abs(a.width/info.crop.width-1024/(1550*400/440))<1e-9);
  assert(Math.abs(info.crop.y/a.width-(-32/1024))<1e-9);
  assert(Math.abs((info.crop.x+info.crop.width/2)/a.width-.5)<1e-9);
  sc.fillStyle='#333';sc.fillRect(j*400,0,400,440);sc.drawImage(c,j*400,0);sc.fillStyle='white';sc.fillText(e,j*400+8,20);j++;
 }
 fs.writeFileSync(path.join(out,'damheo-aligned.png'),sheet.toBuffer('image/png'));
 console.log('PASS same-key reuse; slow success blank; fast skip/stale completion; failure fallback lock; close/reopen cached and in-flight; Damheo scale/top/center alignment');
})().catch(e=>{console.error(e);process.exitCode=1});
