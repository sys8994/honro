// Native Canvas evidence with production renderer and real coalition loops.
// This is not browser input, a live Pages screenshot, or a campaign clear.
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runtimeParts} from '../../shared/build.mjs';
const native=createRequire(import.meta.url)('@napi-rs/canvas');
native.GlobalFonts.registerFromPath('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','sans-serif');
const out='_local/reports/rescue-physics',parts=await runtimeParts({vector:true,render:true});await mkdir(out,{recursive:true});
const oldAllies=await readFile('tests/fixtures/rescue-allies-before.js','utf8');
function canvas(w=960,h=1000){const c=native.createCanvas(w,h);Object.defineProperties(c,{clientWidth:{get:()=>w},clientHeight:{get:()=>h}});c.getBoundingClientRect=()=>({left:0,top:0,width:w,height:h});return c;}
function context(old=false){
 const Image=class extends native.Image{set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;}get src(){return super.src;}};
 const g=vm.createContext({console,performance,structuredClone,document:{createElement:()=>canvas()},Image,Path2D:native.Path2D,DOMMatrix:native.DOMMatrix,devicePixelRatio:1,matchMedia:()=>({matches:false}),navigator:{userAgent:'honro-native-rescue-evidence'},setTimeout,clearTimeout});g.window=g;
 let reverted=0;for(let source of parts){if(old){const mark='if (u.dead || u.fixed || !direction || dt <= 0)';if(source.includes(mark)){assert.equal(source.split(mark).length,2);source=source.replace(mark,'if (u.dead || !direction || dt <= 0)');reverted++;}if(source.includes('G.HonroAllies={'))source=oldAllies;}vm.runInContext(source,g);}
 if(old)assert.equal(reverted,1);return g;
}
function fixture(g){const C=g.HONRO_CORE,p=C.defaults();p.recruited=g.HonroStageRules.stageParty(7);const st=g.HONRO_CONTENT.stages[6],b=g.HonroWorld.build(st,p,false,'archer','A01');g.HonroStageRules.sanitizeStageBattle(b);const e=new C.Engine(b),app={engine:e,stage:st,event(){}};e.checkEnd=()=>false;return{p,b,e,app};}
const old=context(true),q=fixture(old),ids=q.b.units.filter(u=>u.id.startsWith('resident-')).map(u=>u.id);
for(let round=0;round<2;round++){q.b.phase='ally';q.b.honroState.allyQueue={ids,index:0,returnActive:q.e.heroesAlive()[0].id,phase:'begin',elapsed:0,started:false};for(let n=0;n<1600&&q.b.honroState.allyQueue;n++)old.HonroAllies.tick(q.app,q.e,1/60,()=>{});}
q.b.phase='aim';q.b.active=q.e.heroesAlive()[0].id;const before=JSON.parse(JSON.stringify(q.b));assert(!q.e.grounded(q.e.unit('resident-2')));
const g=context(),b=structuredClone(before),e=new g.HONRO_CORE.Engine(b);g.HonroAllies.attach({engine:e,stage:g.HONRO_CONTENT.stages[6],event(){}},e);assert(e.grounded(e.unit('resident-2')));assert(e.grounded(e.unit('resident-3')));
const manifest={baseline:'frozen rescue-allies-before.js plus pre-fix fixed walking contract',baselineAlliesSha256:createHash('sha256').update(oldAllies).digest('hex'),scope:'Before: two unpatched real coalition queues. After: same saved state resumed through fixed rescue contact recovery. Native Canvas only.',views:[]};
for(const [name,ctx,engine]of [['before',old,q.e],['after',g,e]]){
 const c=canvas(),scene=new ctx.HonroScene(c);Object.assign(scene,{x:1174,y:3670,scale:.56,manual:true,time:2});scene.render(engine,0,'',.6,false,0);await new Promise(r=>setTimeout(r,30));scene.render(engine,0,'',.6,false,0);
 const u=engine.unit('resident-2'),floor=engine.contactSurface(u.x,u.y,engine.b.height),cx=c.getContext('2d');cx.fillStyle='#121d20';cx.fillRect(0,0,960,90);cx.font='bold 27px sans-serif';cx.fillStyle='#eadbb2';cx.fillText(name==='before'?'수정 전 · 고정 주민이 발판 밖을 걸어 공중에 남음':'수정 후 · 같은 저장의 실제 바닥 접지 복구',25,36);cx.font='18px sans-serif';cx.fillStyle='#d1d6cd';cx.fillText(`월이: x ${u.x.toFixed(1)}, y ${u.y.toFixed(1)} / 지면까지 ${Math.max(0,(floor?.y??u.y)-u.y).toFixed(1)} · Native 재현`,25,70);
 const data=c.toBuffer('image/png'),file=`${out}/rescue-physics-${name}.png`;await writeFile(file,data);manifest.views.push({name,file,sha256:createHash('sha256').update(data).digest('hex'),resident:{x:u.x,y:u.y,grounded:engine.grounded(u),floorY:floor?.y}});
}
await writeFile(`${out}/airwalk-before-battle.json`,JSON.stringify(before));await writeFile(`${out}/airwalk-recovery-profile.json`,JSON.stringify({...q.p,honroBattle:before}));await writeFile(`${out}/visual-manifest.json`,JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify(manifest,null,2));
