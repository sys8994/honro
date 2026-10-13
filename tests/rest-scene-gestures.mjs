import vm from 'node:vm';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=process.cwd();
const out='_local/reports/rest-scene-controls/gestures.json';await mkdir('_local/reports/rest-scene-controls',{recursive:true});
const source=await readFile(root+'/shared/runtime/rest-journey.js','utf8');
function setup(){
 const listeners={},properties={},world={style:{}},captures=new Set(),classNames=new Set();
 let rect={left:0,top:0,width:390,height:680};
 const classes={add:n=>classNames.add(n),remove:n=>classNames.delete(n),contains:n=>classNames.has(n)};
 const scene={style:{setProperty:(n,v)=>properties[n]=v},classList:classes,isConnected:true,getBoundingClientRect:()=>rect,querySelector:s=>s==='.rest-world'?world:null,querySelectorAll:()=>[],addEventListener:(n,f)=>{(listeners[n]??=[]).push(f)},setPointerCapture:id=>captures.add(id),releasePointerCapture:id=>captures.delete(id)};
 const modalClasses=new Set(),app={screen:'rest',dialogue:null,modal:{classList:{contains:n=>modalClasses.has(n)}},profile:{}};
 const document={querySelector:s=>s==='.rest-landscape'?scene:null,querySelectorAll:()=>[],getElementById:()=>null};
 const g=vm.createContext({HONRO_CONTENT:{},HONRO_CORE:{},document,matchMedia:()=>({matches:false}),innerWidth:390});
 vm.runInContext(source,g);
 g.HonroRestJourney.mountRestCamera(app,scene);
 const target=(action=false)=>({closest:s=>s==='button'?scene:action&&s.includes('.rest-actions')?{}:null});
 function emit(type,props={}){const e={type,button:0,pointerId:1,clientX:170,clientY:440,target:target(),detail:1,preventDefault(){this.prevented=true},stopPropagation(){this.stopped=true},...props};for(const fn of listeners[type]||[])fn(e);return e}
 return {app,g,scene,world,emit,target,modalClasses,resize(r){rect={...rect,...r};g.HonroRestJourney.layoutRest()},transform:()=>world.style.transform};
}
const rows=[];function check(name,fn){try{fn();rows.push({name,status:'passed'});console.log('PASS',name)}catch(e){rows.push({name,status:'failed',message:e.message});console.log('FAIL',name,e.message)}}
check('Ordinary closed modal does not block wheel zoom',()=>{const h=setup(),old=h.transform();h.emit('wheel',{deltaY:-250,deltaMode:0});assert.notEqual(h.transform(),old)});
check('Single pointer tap remains clickable',()=>{const h=setup();h.emit('pointerdown');h.emit('pointerup');assert(!h.emit('click').prevented)});
check('Pan changes transform and suppresses only gesture click',()=>{const h=setup(),old=h.transform();h.emit('pointerdown');h.emit('pointermove',{clientX:200});h.emit('pointerup',{clientX:200});assert.notEqual(h.transform(),old);assert(h.emit('click').prevented);h.emit('pointerdown');h.emit('pointerup');assert(!h.emit('click').prevented)});
check('Toolbar remains clickable immediately after pan',()=>{const h=setup();h.emit('pointerdown');h.emit('pointermove',{clientX:200});h.emit('pointerup');h.emit('click');h.emit('pointerdown',{target:h.target(true)});h.emit('pointerup',{target:h.target(true)});assert(!h.emit('click',{target:h.target(true)}).prevented)});
check('Two-pointer pinch, single-finger continuation, release do not trigger click',()=>{const h=setup(),old=h.transform();h.emit('pointerdown',{pointerId:1,clientX:100});h.emit('pointerdown',{pointerId:2,clientX:200});h.emit('pointermove',{pointerId:2,clientX:270});assert.notEqual(h.transform(),old);h.emit('pointerup',{pointerId:2,clientX:270});const midway=h.transform();h.emit('pointermove',{pointerId:1,clientX:120,clientY:455});assert.notEqual(h.transform(),midway);h.emit('pointerup',{pointerId:1});assert(h.emit('click').prevented)});
check('Zoom clamps to safe minimum and maximum',()=>{const h=setup();for(let i=0;i<10;i++)h.emit('wheel',{deltaY:1000,deltaMode:0});assert.match(h.transform(),/scale\(0\.9\)/);assert.match(h.transform(),/translate\(0px,0px\)/);for(let i=0;i<10;i++)h.emit('wheel',{deltaY:-1000,deltaMode:0});assert.match(h.transform(),/scale\(1\.35\)/)});
check('Cancel prevents further pointer motion and accidental click',()=>{const h=setup();h.emit('pointerdown');h.emit('pointermove',{clientX:190});h.emit('pointercancel');const old=h.transform();h.emit('pointermove',{clientX:280});assert.equal(h.transform(),old);assert(h.emit('click').prevented)});
check('Resize cancels active pointer and clamps transform',()=>{const h=setup();h.emit('pointerdown');h.emit('pointermove',{clientX:190});h.resize({width:700,height:350});const old=h.transform();h.emit('pointermove',{clientX:280});assert.equal(h.transform(),old)});
check('Modal open blocks wheel and cancels active moved pointer',()=>{const h=setup();h.emit('pointerdown');h.modalClasses.add('open');const old=h.transform();h.emit('pointermove',{clientX:280});h.emit('wheel',{deltaY:-250,deltaMode:0});assert.equal(h.transform(),old);h.modalClasses.delete('open');h.emit('pointermove',{clientX:300});assert.equal(h.transform(),old)});
check('Keyboard click is preserved after drag',()=>{const h=setup();h.emit('pointerdown');h.emit('pointermove',{clientX:200});h.emit('pointerup');assert(!h.emit('click',{detail:0}).prevented)});
const result={at:new Date().toISOString(),sourceHash:createHash('sha256').update(source).digest('hex'),rows,limits:'Production rest camera event handlers in isolated VM with DOM/pointer doubles. Not actual touch/browser dispatch, rendering, normal play, or GPU proof.'};await writeFile(out,JSON.stringify(result,null,2));if(rows.some(r=>r.status==='failed'))process.exitCode=1;
