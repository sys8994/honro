/** Offline visual evidence using the production compiler, Engine and HonroScene.
 * This is deliberately not a browser, HUD/input check or normal combat run. */
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {runtimeParts,root} from '../../shared/build.mjs';
const require=createRequire(import.meta.url),native=require('@napi-rs/canvas');
// Evidence-only platform font registration; production CSS/fonts are unchanged.
native.GlobalFonts.registerFromPath('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','sans-serif');
const out=path.resolve(root,'_local/reports/guardian-tree/landings');
await mkdir(out,{recursive:true});
let seed=3910;const math=Object.create(Math);math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
function canvas(w=300,h=150){const c=native.createCanvas(w,h);Object.defineProperties(c,{clientWidth:{get:()=>c.width},clientHeight:{get:()=>c.height}});c.getBoundingClientRect=()=>({left:0,top:0,width:c.width,height:c.height});return c;}
const NativeImage=native.Image;
const Image=class extends NativeImage{set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;}get src(){return super.src;}};
const document={createElement(tag){if(tag!=='canvas')throw Error('Unexpected DOM '+tag);return canvas();}};
const g=vm.createContext({console,performance,structuredClone,Math:math,document,Image,Path2D:native.Path2D,DOMMatrix:native.DOMMatrix,devicePixelRatio:1,matchMedia:()=>({matches:false}),navigator:{userAgent:'honro-native-canvas-evidence'},setTimeout,clearTimeout});g.window=g;
const parts=await runtimeParts({vector:true,render:true});for(const source of parts)vm.runInContext(source,g);
const st=g.HONRO_PROJECT.stages[9],b=g.HonroMaps.createBattle(st,g.HONRO_PROJECT);g.HonroStageRules.sanitizeStageBattle(b);const e=new g.HONRO_CORE.Engine(b,()=>{},true),C=g.HONRO_CORE,u=b.units.find(u=>u.cls==='archer'&&u.side===0),floor=b.terrain.find(t=>t.id==='outer-yard');
Object.assign(u,{x:2200,y:C.topAt(floor,2200),vx:0,vy:0,acted:false});b.active=u.id;b.phase='aim';b.side=0;e.checkEnd=()=>false;
const rows=[];
for(const [index,[x,id]]of [[2280,'altar-step-1'],[2450,'altar-step-2'],[2460,'altar-step-3'],[2500,'altar-platform']].entries()){
 assert(e.jump(u));for(let frames=0;frames<360;frames++){if(Math.abs(x-u.x)>1)e.move(Math.sign(x-u.x)*Math.min(1,Math.abs(x-u.x)/(u.walkSpeed*C.STEP)),C.STEP);e.integrateBody(u,C.STEP);if(frames>2&&e.grounded(u))break;}
 assert.equal(e.contactSurface(u.x,u.y-.15,u.y+.15)?.t?.id,id);const cv=canvas(1440,960),scene=new g.HonroScene(cv);Object.assign(scene,{x:2500,y:1900,scale:.72,manual:true,time:2});scene.render(e,0,'',.6,false,0);await new Promise(r=>setTimeout(r,20));scene.render(e,0,'',.6,false,0);
 const file=`landing-${index+1}-${id}.png`;await writeFile(path.join(out,file),cv.toBuffer('image/png'));rows.push({file,id,x:u.x,y:u.y,grounded:e.grounded(u),remainingMove:u.moveLeft,method:'Sequential production Engine jump/move/integrateBody, no reposition after ground start'});console.log(file);
}
await writeFile(path.join(out,'manifest.json'),JSON.stringify({rows,limits:['Native Canvas, not browser input','Isolated input fixture, not normal combat clear']},null,2)+'\n');
