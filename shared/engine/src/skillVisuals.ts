import {drawWarriorProjectile,drawMeleeGuide} from './warriorVisuals';
import type {Projectile,Unit,Skill} from './types';
import type {Engine} from './engine';
import {SKILLS,CLASSES} from './data';
import {echoAim,SOUL_SKILLS} from './occultMechanics';
import {geometryPaths,redesignPrediction,turnPrediction,type SkillGeometry} from './skillMechanics';
type C=CanvasRenderingContext2D;
const guideCache=new WeakMap<Engine,Map<boolean,{key:string;prediction:ReturnType<Engine['predict']>}>>();
export function guidePrediction(e:Engine,u:Unit,s:Skill,power:number,ignoreUnits=false){
 const b=e.b,key=[b.shot,b.rng,b.sceneVersion,b.physics?.revision,b.wind,s.id,u.x,u.y,u.h,u.angle,power,u.tune,JSON.stringify(u.ranks),...b.units.map(v=>`${v.id}:${v.x}:${v.y}:${v.hp}:${v.dead}`)].join('|');
 let cache=guideCache.get(e);if(!cache){cache=new Map();guideCache.set(e,cache);}const cached=cache.get(ignoreUnits);if(cached?.key===key)return cached.prediction;
 const prediction=['A04','A15'].includes(s.id)?redesignPrediction(e,u,s,u.angle,power,true,ignoreUnits)!:e.predict(u,s,u.angle,power,undefined,true,ignoreUnits);cache.set(ignoreUnits,{key,prediction});return prediction;
}
export function drawGuideContinuation(c:C,e:Engine,u:Unit,s:Skill,power:number,zoom:number){
 if(s.martial||s.mode==='pierce'||s.mode==='return'||s.mode==='prepare')return;
 const pr=guidePrediction(e,u,s,power);if(!pr.unit||pr.points.length<2)return;
 const ext=guidePrediction(e,u,s,power,true);if(ext.points.length<2)return;
 let segment=0,distance=Infinity;
 for(let i=0;i<ext.points.length-1;i++){
  const a=ext.points[i],b=ext.points[i+1],dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
  const t=length?Math.max(0,Math.min(1,((pr.x-a.x)*dx+(pr.y-a.y)*dy)/length)):0;
  const d=Math.hypot(a.x+dx*t-pr.x,a.y+dy*t-pr.y);
  if(d<distance){distance=d;segment=i;}
 }
 const path=[{x:pr.x,y:pr.y},...ext.points.slice(segment+1)];
 if(path.length<2||Math.hypot(path.at(-1)!.x-pr.x,path.at(-1)!.y-pr.y)<4/Math.max(.12,zoom))return;
 c.save();c.setLineDash([]);c.lineCap='round';c.lineJoin='round';c.strokeStyle=CLASSES[u.cls].color;c.lineWidth=.7/Math.max(.12,zoom);c.globalAlpha=.38;c.beginPath();path.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();c.restore();
}
const echoGuideCache=new WeakMap<Engine,{key:string;paths:Array<Array<{x:number;y:number}>>}>();
export function drawEchoGuides(c:C,e:Engine,u:Unit,s:Skill,power:number,zoom:number,root:ReturnType<Engine['predict']>){
  if(u.cls!=='occultist'||!SOUL_SKILLS.has(s.id)||s.id==='O16')return;
 const echoes=e.alive(0).filter(v=>v.summonKind==='echo'&&v.summonOwner===u.id);
 if(!echoes.length)return;
 const point={x:root.x,y:root.y},key=[e.b.shot,e.b.round,e.b.sceneVersion,e.b.wind,u.x,u.y,u.angle,power,s.id,point.x,point.y,...echoes.map(v=>`${v.id}:${v.x}:${v.y}`)].join('|');
 let entry=echoGuideCache.get(e);
 if(entry?.key!==key){
  entry={key,paths:echoes.map(v=>{const aim=echoAim(e,v,s,point,power);return e.predict(v,s,aim.angle,aim.power,undefined,true).points;})};
  echoGuideCache.set(e,entry);
 }
 // Echoed casts use the same dotted grammar as the principal prediction.
  for(const points of entry.paths)guideStroke(c,points,zoom,CLASSES[u.cls].color,.30);
}
export const SKILL_FX_SECONDS={swordCut:.34,circulation:.6,skillGeometry:.9,inkImpact:.8,lightningBolt:.9,qiBurst:.55,fireBloom:.85};
export function drawSkillGeometry(c:C,g:SkillGeometry,thick=false,zoom=1){
 c.save();c.strokeStyle='#d3ddd2';c.lineWidth=thick?g.thickness:1.2/zoom;c.lineCap='round';c.lineJoin='round';
 for(const ps of geometryPaths(g)){c.beginPath();ps.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();}c.restore();
}
export const ARROW_STYLES={distance:{width:1.25,length:48,head:2.6,color:'#d5d7c9'},drop:{width:2,length:39,head:4,color:'#b7cdca'},speed:{width:3.7,length:37,head:6.7,color:'#c7b38c'},basic:{width:1.8,length:39,head:3.5,color:'#b5b6a4'}};
/** A softly zoom-scaled signature marks direction, independently of the ballistic prediction. */
export function drawAimDirection(c:C,e:Engine,u:Unit,s:Skill,power:number,charging:boolean,time:number,zoom=1){
 if(s.passive||u.dead||u.retreat||s.mode==='prepare')return false;
 zoom=Math.max(.12,zoom);power=Math.max(0,Math.min(1,power));
 const melee=!!s.martial&&(s.branch==='sword'||s.mode==='bladeScreen'),angle=s.mode==='bladeScreen'?(Math.cos(u.angle*Math.PI/180)<0?Math.PI:0):u.angle*Math.PI/180;
 const origin=melee?{x:u.x,y:u.y-u.h*.5}:e.projectileOrigin(u,s,u.angle);
 // A muzzle blocked by nearby rock is represented by the contact mark instead
 // of a decorative direction arrow extending through the same solid face.
 if(!melee&&!s.martial){const raw=e.origin(u,u.angle);if(Math.hypot(raw.x-origin.x,raw.y-origin.y)>.1)return false;}
 const length=96+(charging?power*24:0),alpha=charging?.9:.54,ink={archer:'#e3cca1',mage:'#e7ecda',knight:'#d1e1df',occultist:'#d7bddf'}[u.cls];
 c.save();c.translate(origin.x,origin.y);c.rotate(-angle);const size=1/Math.sqrt(zoom);c.scale(size,size);c.setLineDash([]);c.lineCap='round';c.lineJoin='round';
 // A fine, uninterrupted centre makes the selected direction unambiguous against scenery.
 c.beginPath();c.moveTo(5,0);c.lineTo(length-5,0);c.strokeStyle='#10242a';c.globalAlpha=.6;c.lineWidth=3.5;c.stroke();
 const gradient=c.createLinearGradient(0,0,length,0);gradient.addColorStop(0,ink+'30');gradient.addColorStop(.55,ink);gradient.addColorStop(1,ink+'b0');
 c.strokeStyle=gradient;c.globalAlpha=alpha;c.lineWidth=1.35;c.stroke();c.strokeStyle=ink;c.fillStyle=ink;
 if(u.cls==='archer'){
  // A taut bow and paired feather barbs; bright flecks travel toward the arrow point.
  c.lineWidth=1.5;c.beginPath();c.moveTo(20,-18);c.quadraticCurveTo(-1,0,20,18);c.stroke();c.globalAlpha=alpha*.55;c.lineWidth=.85;c.beginPath();c.moveTo(20,-18);c.lineTo(6,0);c.lineTo(20,18);c.stroke();
  for(const x of [43,51]){c.globalAlpha=alpha*.75;c.lineWidth=1.2;c.beginPath();c.moveTo(x-7,-6);c.lineTo(x,0);c.lineTo(x-7,6);c.stroke();}
  for(let i=0;i<3;i++){const phase=(time*(charging?1.1:.5)+i/3)%1,x=28+phase*(length-36);c.globalAlpha=alpha*Math.sin(phase*Math.PI)*.65;c.beginPath();c.ellipse(x,0,3,.9,0,0,Math.PI*2);c.fill();}
  c.globalAlpha=alpha;c.beginPath();c.moveTo(length,0);c.lineTo(length-11,-4);c.lineTo(length-8,0);c.lineTo(length-11,4);c.closePath();c.fill();
 }else if(u.cls==='mage'){
  // White brush fibres and a loose, opening breath of qi, with no solid prediction ring.
  for(const side of [-1,1])for(let i=0;i<2;i++){const wave=Math.sin(time*3+i+side)*3;c.globalAlpha=alpha*(i?.26:.58);c.lineWidth=i?.7:1.7;c.beginPath();c.moveTo(9+i*5,side*7);c.bezierCurveTo(31,side*(17+wave),length*.62,side*(3+i*3),length-8,side*1.5);c.stroke();}
  c.globalAlpha=alpha*.7;c.lineWidth=1.2;c.beginPath();c.arc(14,0,12,time*.3+.5,time*.3+2.5);c.stroke();c.beginPath();c.arc(14,0,12,time*.3+3.4,time*.3+5.4);c.stroke();
  for(let i=0;i<5;i++){const phase=(time*.55+i/5)%1,x=22+phase*(length-28),y=Math.sin(phase*Math.PI)*Math.sin(time*2+i*2)*7;c.globalAlpha=alpha*Math.sin(phase*Math.PI)*.65;c.beginPath();c.ellipse(x,y,2.5,.85,-.3,0,Math.PI*2);c.fill();}
  c.globalAlpha=alpha;c.beginPath();c.moveTo(length,0);c.quadraticCurveTo(length-13,-7,length-10,0);c.quadraticCurveTo(length-13,7,length,0);c.fill();
 }else if(u.cls==='knight'){
  // A drawn edge and crossguard. Rush adds forward gusts; blade skills add a crescent edge.
  c.globalAlpha=alpha*.15;c.beginPath();c.moveTo(18,-4);c.lineTo(length,0);c.lineTo(18,4);c.closePath();c.fill();c.globalAlpha=alpha*.8;c.lineWidth=1;c.stroke();c.lineWidth=2;c.beginPath();c.moveTo(16,-9);c.lineTo(16,9);c.stroke();
  for(const side of [-1,1]){const wave=Math.sin(time*6+side)*3;c.globalAlpha=alpha*.42;c.lineWidth=1;c.beginPath();c.moveTo(27,side*(10+wave));c.quadraticCurveTo(length*.62,side*(14-wave),length-6,side*3);c.stroke();}
  if(s.branch==='rush'){for(let i=0;i<2;i++){const phase=(time*.9+i*.5)%1,x=32+phase*(length-48);c.globalAlpha=alpha*Math.sin(phase*Math.PI)*.7;c.beginPath();c.moveTo(x-5,-6);c.lineTo(x,0);c.lineTo(x-5,6);c.stroke();}}
  else if(s.branch==='blade'){c.globalAlpha=alpha*.65;c.beginPath();c.moveTo(length-16,-9);c.quadraticCurveTo(length+1,0,length-16,9);c.stroke();}
  else {const phase=(time*.7)%1;c.globalAlpha=alpha*Math.sin(phase*Math.PI);c.beginPath();c.ellipse(24+phase*(length-30),0,3,.9,0,0,Math.PI*2);c.fill();}
 }else{
  // Sodan's knotted soul threads and little will-o'-the-wisps stay distinct from white qi.
  for(const side of [-1,1]){const wave=Math.sin(time*4+side)*4;c.globalAlpha=alpha*.55;c.lineWidth=1.1;c.beginPath();c.moveTo(6,side*6);c.bezierCurveTo(29,side*(16+wave),length*.6,-side*12,length-6,0);c.stroke();}
  c.globalAlpha=alpha*.7;c.beginPath();c.moveTo(18,-8);c.lineTo(24,0);c.lineTo(18,8);c.lineTo(12,0);c.closePath();c.stroke();
  for(let i=0;i<3;i++){const phase=(time*.45+i/3)%1,x=30+phase*(length-40),y=Math.sin(phase*Math.PI)*Math.sin(time*2+i*2)*9;c.globalAlpha=alpha*(1-phase)*.85;c.beginPath();c.moveTo(x+5,y);c.quadraticCurveTo(x-6,y-7,x-3,y);c.quadraticCurveTo(x-7,y+6,x+5,y);c.fill();}
  c.globalAlpha=alpha;c.beginPath();c.moveTo(length,0);c.lineTo(length-7,-3);c.lineTo(length-11,0);c.lineTo(length-7,3);c.closePath();c.fill();
 }
 c.restore();return true;
}
function gourdAura(c:C,p:Projectile){
 const ice=p.skill==='M02',electric=p.skill==='M04'||p.skill==='M05',t=p.age;
 c.save();c.lineCap='round';
 if(electric){c.strokeStyle='#c2e9ff';for(let i=0;i<3;i++){const a=t*4+i*2.1,x=Math.cos(a)*13,y=Math.sin(a)*15;c.globalAlpha=.3+.35*Math.sin(t*17+i)**2;c.lineWidth=i===0?1.5:1;c.beginPath();c.moveTo(x,y);c.lineTo(x-5-Math.sin(t*31+i)*6,y-6);c.lineTo(x-9,y+3);c.lineTo(x-18-Math.cos(t*23)*7,y-2);c.stroke();}c.fillStyle='#8fcfff';c.globalAlpha=.10;c.beginPath();c.ellipse(-5,0,23,20,0,0,Math.PI*2);c.fill();}
 else if(ice){c.strokeStyle='#c7f0f0';for(let i=0;i<5;i++){const phase=(t*.9+i/5)%1,x=-8-phase*28,y=Math.sin(i*4+t*3)*15;c.globalAlpha=(1-phase)*.6;c.lineWidth=1;c.beginPath();c.moveTo(x-3,y);c.lineTo(x+3,y);c.moveTo(x,y-3);c.lineTo(x,y+3);c.stroke();}}
 else {for(let i=0;i<5;i++){const wave=Math.sin(t*11+i*2),y=(i-2)*4;c.globalAlpha=.25+.16*(1+wave);c.strokeStyle=i%2?'#e1a361':'#bf6549';c.lineWidth=2+i%2;c.beginPath();c.moveTo(6,y);c.bezierCurveTo(-7,y-10*wave,-18,y+wave*9,-33-i*3,y+Math.sin(t*14+i)*7);c.stroke();}c.globalAlpha=.12;c.fillStyle='#e97943';c.beginPath();c.ellipse(-5,0,23,18,0,0,Math.PI*2);c.fill();}
 c.restore();
}
function drawIronFlower(c:C,p:Projectile){
 const t=p.age,open=Math.min(1,t*7),fade=Math.min(1,(1.6-t)*3);c.save();c.translate(p.x,p.y);c.lineCap='round';
 // Layered, sharp metal petals unfold from the embedded shaft while real fragments disperse.
 for(let ring=0;ring<2;ring++)for(let i=0;i<7;i++){
  const a=i*Math.PI*2/7+ring*.42+t*(ring?-.35:.25),r=(ring?66:43)*open*(1+Math.sin(t*8+i)*.08);
  c.save();c.rotate(a);c.globalAlpha=fade*(ring?.38:.75);c.fillStyle=ring?'#a9bbb6':'#d9c5a0';c.strokeStyle='#f1e0b8';c.lineWidth=1;c.beginPath();c.moveTo(7,0);c.quadraticCurveTo(r*.45,-10-ring*4,r,0);c.lineTo(r*.46,5+ring*3);c.closePath();c.fill();c.stroke();c.restore();
 }
 for(let i=0;i<26;i++){
  const phase=(t*.95+i/26)%1,a=i*2.39996+Math.sin(i*3)*.15,r=18+phase*(145+i%4*33),x=Math.cos(a)*r,y=Math.sin(a)*r+phase*phase*22;
  c.globalAlpha=fade*(1-phase)*(.3+i%3*.18);c.strokeStyle=i%3?'#e5c995':'#e8eee2';c.lineWidth=i%3===0?2:1;c.beginPath();c.moveTo(x-Math.cos(a)*(4+phase*11),y-Math.sin(a)*(4+phase*11));c.lineTo(x,y);c.stroke();
 }
 c.globalAlpha=fade*(.6+.25*Math.sin(t*24)**2);c.fillStyle='#faf0cf';c.beginPath();c.arc(0,0,5+Math.sin(t*17)*2,0,Math.PI*2);c.fill();
 if(t<.25){c.globalAlpha=(1-t/.25)*.32;c.strokeStyle='#e0cfab';c.lineWidth=4*(1-t/.25)+.5;c.beginPath();c.arc(0,0,12+t*300,0,Math.PI*2);c.stroke();}
 c.restore();
}
export function drawRedesignProjectile(c:C,p:Projectile){
 if(drawWarriorProjectile(c,p))return true;
 const s=SKILLS[p.skill];if(!s?.redesigned)return false;
 if(p.mode==='ironEmitter'){drawIronFlower(c,p);return true;}
 if(['prepare','waveRing','skyWait','microEmitter'].includes(p.mode))return true;
 c.save();
 if(p.mode==='microWait'){c.fillStyle='#edba72';c.globalAlpha=.7;c.beginPath();c.arc(p.x,p.y,2+Math.sin(p.age*30),0,Math.PI*2);c.fill();c.restore();return true;}
 if(p.trail.length>1){c.strokeStyle=p.skill==='A08'?'#dec596a0':'#aeb7b080';c.lineWidth=p.skill==='A08'?2:1;c.beginPath();p.trail.slice(-10).forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.lineTo(p.x,p.y);c.stroke();}
 c.translate(p.x,p.y);c.rotate(Math.atan2(p.vy,p.vx));
 if(s.cls==='archer'){
  if(p.mode==='ironChip'){
   c.rotate(p.age*13);c.fillStyle='#ecdbb6';c.strokeStyle='#a9bbb6';c.lineWidth=1;c.beginPath();c.moveTo(10,0);c.lineTo(-6,-3);c.lineTo(-2,0);c.lineTo(-6,3);c.closePath();c.fill();c.stroke();c.restore();return true;
  }
  const a=ARROW_STYLES[s.branch as keyof typeof ARROW_STYLES]||ARROW_STYLES.basic;
  c.strokeStyle=a.color;c.lineWidth=a.width;c.beginPath();c.moveTo(15-a.length,0);c.lineTo(11,0);c.stroke();c.fillStyle=a.color;c.beginPath();c.moveTo(19,0);c.lineTo(6,-a.head);c.lineTo(9,0);c.lineTo(6,a.head);c.closePath();c.fill();
  c.lineWidth=s.branch==='speed'?2.3:1;for(const x of [18-a.length,24-a.length]){c.beginPath();c.moveTo(x,0);c.lineTo(x-6,-a.head-2);c.moveTo(x,0);c.lineTo(x-6,a.head+2);c.stroke();}
  if(s.branch==='drop'){c.globalAlpha=.35;c.lineWidth=1;c.beginPath();c.moveTo(-20,0);c.quadraticCurveTo(-30,Math.sin(p.age*12)*7,-44,Math.sin(p.age*12+1)*4);c.stroke();}
  if(p.mode==='ironFlower'){c.strokeStyle='#e9cf9e';for(let i=0;i<3;i++){const pulse=Math.sin(p.age*20+i*2);c.globalAlpha=.35+i*.13;c.lineWidth=1.2;c.beginPath();c.moveTo(9-i*9,-5);c.quadraticCurveTo(-12-i*8,-12-pulse*4,-38-i*10,-5+pulse*6);c.moveTo(9-i*9,5);c.quadraticCurveTo(-12-i*8,12+pulse*4,-38-i*10,5-pulse*6);c.stroke();}}
 }else if(s.branch==='gourd'&&!p.secondary){
  gourdAura(c,p);
  c.rotate(p.age*2);c.fillStyle=s.id==='M02'?'#9cbbb9':'#a0a995';c.strokeStyle='#404d47';c.lineWidth=1.5;
  c.beginPath();c.ellipse(0,3,8,10,0,0,Math.PI*2);c.fill();c.stroke();c.beginPath();c.ellipse(0,-7,5,5,0,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#645745';c.fillRect(-3,-15,6,5);
  c.strokeStyle='#74654e';c.beginPath();c.moveTo(-5,-5);c.lineTo(7,-3);c.lineTo(9,7);c.stroke();c.fillStyle='#c9c0a5';c.fillRect(0,-2,4,10);c.strokeStyle='#6f574b';c.beginPath();c.moveTo(1,0);c.lineTo(3,2);c.lineTo(1,4);c.stroke();
 }else if(s.branch==='stake'){
  c.fillStyle='#746448';c.fillRect(-15,-4,30,8);c.fillStyle='#c2b594';c.fillRect(-6,-3,13,6);c.strokeStyle='#484b3c';c.beginPath();c.moveTo(-3,-2);c.lineTo(3,2);c.lineTo(6,-2);c.stroke();
 }else if(p.secondary){c.strokeStyle=p.mode==='fireChip'?'#e9a367':'#b6cccf';c.lineWidth=2;c.beginPath();c.moveTo(-5,-2);c.lineTo(3,0);c.lineTo(-2,3);c.stroke();}
 else if(s.id==='M01'){
  const pulse=Math.sin(p.age*13);c.lineCap='round';
  for(let i=0;i<3;i++){c.globalAlpha=i===0?.8:.23;c.strokeStyle='#e4ecdf';c.lineWidth=i===0?2.2:1;c.beginPath();c.ellipse(2-i*6,0,7+i*2,8+i*3+pulse,0,-1.2,1.2);c.stroke();}
  c.globalAlpha=.28;c.lineWidth=1;c.beginPath();c.moveTo(-20,-3);c.quadraticCurveTo(-11,pulse*4,3,0);c.moveTo(-24,4);c.quadraticCurveTo(-8,3-pulse*3,3,0);c.stroke();
 }
 else{
  // White dry-brush tip, translucent wash and trailing fibres: no neon glow.
  const flutter=Math.sin(p.age*15)*3;for(let i=0;i<4;i++){c.strokeStyle=i===0?'#ecebdf':'#c6d1c3';c.globalAlpha=i===0?.9:.30;c.lineWidth=i===0?3.5:1.1;c.beginPath();c.moveTo(-29-i*3,-7+i*4+flutter);c.quadraticCurveTo(-9,-15+i*7-flutter,9-i,0);c.quadraticCurveTo(-7,13-i*3+flutter,-20-i*2,7-i*2-flutter);c.stroke();}
  for(let i=0;i<4;i++){const phase=(p.age*2+i/4)%1;c.globalAlpha=(1-phase)*.45;c.fillStyle='#dbe9db';c.beginPath();c.ellipse(-18-phase*35,Math.sin(p.age*8+i*2)*10,2.5*(1-phase)+.5,1,0,0,Math.PI*2);c.fill();}
  c.globalAlpha=.12;c.fillStyle='#e3e4d8';c.beginPath();c.ellipse(-6,0,19,11,0,0,Math.PI*2);c.fill();
 }
 c.restore();return true;
}
export const STAKE_STYLES:Record<string,{name:string;color:string;mark:string}>={M07:{name:'파진',color:'#ce9878',mark:'破'},M10:{name:'회생',color:'#91bd9a',mark:'生'},M08:{name:'유인',color:'#b4a4c8',mark:'引'},M09:{name:'축지',color:'#90bacb',mark:'移'},M99:{name:'오방',color:'#c9b173',mark:'封'}};
export function drawStakes(c:C,e:Engine,time=0){
 for(const z of e.b.stakes||[]){const s=STAKE_STYLES[z.skill]||STAKE_STYLES.M07,t=time+z.id*.37,wave=Math.sin(t*2.4),draw=(x:number,y:number)=>{
  c.save();c.translate(x,y);c.fillStyle='#56442f';c.strokeStyle='#ac9168';c.lineWidth=1.4;c.beginPath();c.moveTo(-7,0);c.lineTo(-6,-43);c.lineTo(0,-51);c.lineTo(6,-43);c.lineTo(7,0);c.closePath();c.fill();c.stroke();
  c.fillStyle=s.color;c.fillRect(-6,-42,12,7);c.strokeStyle=s.color;c.lineWidth=2;
  if(z.skill==='M07'){c.beginPath();c.moveTo(-12,-42);c.lineTo(-8,-54);c.moveTo(12,-42);c.lineTo(8,-54);c.stroke();}
  if(z.skill==='M10'){for(const side of [-1,1]){c.beginPath();c.moveTo(side*5,-34);c.quadraticCurveTo(side*20,-42,side*14,-51);c.stroke();}}
  if(z.skill==='M08'){c.beginPath();c.arc(0,-48,10,.3,Math.PI*1.8);c.stroke();}
  if(z.skill==='M99'){c.fillStyle=s.color;c.fillRect(-15,-43,30,4);}
  const cloth=(off:number)=>{c.fillStyle='#d6c7a0';c.beginPath();c.moveTo(off-4,-36);c.lineTo(off+5,-36);c.quadraticCurveTo(off+wave*5+7,-21,off+wave*4+2,-9);c.lineTo(off+wave*3-5,-13);c.quadraticCurveTo(off+wave*2,-24,off-4,-36);c.fill();c.fillStyle='#66523f';c.font='11px serif';c.textAlign='center';c.fillText(s.mark,off+wave,-23);};cloth(z.skill==='M09'?-9:0);if(z.skill==='M09')cloth(9);
  c.restore();};
  c.save();draw(z.x,z.y);c.strokeStyle=s.color;c.lineWidth=1.2;c.globalAlpha=.24+.08*wave;c.beginPath();c.ellipse(z.x,z.y-1,29+wave*2,7,0,t*.18,t*.18+Math.PI*1.65);c.stroke();
  c.globalAlpha=.55;for(let i=0;i<3;i++){const phase=(t*.35+i/3)%1,x=z.x+Math.sin(t+i*2.1)*16,y=z.y-12-phase*42;c.beginPath();if(z.skill==='M10'){c.ellipse(x,y,2.2,4,-.6+phase,0,Math.PI*2);}else if(z.skill==='M08'){c.moveTo(x-4,y+5);c.quadraticCurveTo(x+8,y,x,y-6);}else{c.moveTo(x-1,y+3);c.lineTo(x+2,y-2);}c.stroke();}
  c.globalAlpha=.85;c.fillStyle=s.color;c.font='12px serif';c.textAlign='center';c.fillText(s.name,z.x,z.y-62);
  if(z.active){c.globalAlpha=.22;const ps=[[0,-220],[220,0],[0,220],[-220,0]];for(const [x,y] of ps)draw(z.x+x,z.y+y);c.beginPath();ps.forEach(([x,y],i)=>i?c.lineTo(z.x+x,z.y+y):c.moveTo(z.x+x,z.y+y));c.closePath();c.stroke();c.setLineDash([5,12]);c.beginPath();c.arc(z.x,z.y,220,0,Math.PI*2);c.stroke();}
  c.restore();
 }
}
const noise=(n:number)=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
const envelope=(t:number)=>Math.min(1,t/.055)*Math.pow(Math.max(0,1-t),.65);
function densify(ps:{x:number;y:number}[]){const out=[ps[0]];for(let i=1;i<ps.length;i++){const a=ps[i-1],b=ps[i],n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/14));for(let j=1;j<=n;j++)out.push({x:a.x+(b.x-a.x)*j/n,y:a.y+(b.y-a.y)*j/n});}return out;}
/** An opening brushstroke, a luminous ink wash and drifting fibres live for .9 wall-clock seconds. */
export function drawInkGeometry(c:C,g:SkillGeometry,t:number){
 if(t>=1)return;const life=envelope(t),reveal=Math.min(1,.15+t*7),paths=geometryPaths(g).map(densify),origin=g.impact||g;
 c.save();c.setLineDash([]);c.lineCap='round';c.lineJoin='round';
 const strokes=(width:number,alpha:number,color:string,offset=0)=>{
  c.lineWidth=width;c.globalAlpha=life*alpha;c.strokeStyle=color;
  for(const [j,ps] of paths.entries()){c.beginPath();const count=Math.max(2,Math.ceil(ps.length*reveal));for(let i=0;i<count;i++){const p=ps[i],a=ps[Math.max(0,i-1)],b=ps[Math.min(ps.length-1,i+1)],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,off=offset+Math.sin(i*.84+j*3)*.65;i?c.lineTo(p.x-dy/len*off,p.y+dx/len*off):c.moveTo(p.x-dy/len*off,p.y+dx/len*off);}c.stroke();}
 };
 // Broad low-opacity wash under the opaque, broken white brush core.
 strokes(Math.min(36,g.thickness+8),.16,'#c5dcd5');strokes(13,.24,'#d9e6df');strokes(5.4*(1-t*.5),.95,'#f4f4e9');strokes(1.25,.65,'#ffffff',-3.8);strokes(.85,.38,'#d4e3d5',4.8);
 // A second wave peels away from the exact damage boundary.
 c.save();const scale=1.01+t*.09;c.translate(origin.x,origin.y);c.scale(scale,scale);c.translate(-origin.x,-origin.y);strokes(1.7,.25*(1-t),'#e1ebdf');c.restore();
 // Detached, tapered brush flecks move away from the boundary, never consume battle RNG.
 c.fillStyle='#eef0df';c.strokeStyle='#e6ecdf';
 for(let k=0;k<48;k++){const ps=paths[k%paths.length];if(!ps?.length)continue;const p=ps[Math.floor(noise(k+g.x)*ps.length)],a=Math.atan2(p.y-origin.y,p.x-origin.x)+(.5-noise(k+3))*.7,d=(10+noise(k+17)*35)*t,x=p.x+Math.cos(a)*d,y=p.y+Math.sin(a)*d;
  c.globalAlpha=life*(.18+.45*noise(k+2));c.save();c.translate(x,y);c.rotate(a);c.beginPath();c.ellipse(0,0,(2+noise(k+8)*7)*(1-t*.5),.6+noise(k+9)*1.8,0,0,Math.PI*2);c.fill();c.restore();
 }
 if(g.kind==='bagua'){
  // Eight trigram seals illuminate in the spaces between the eight spokes.
  c.strokeStyle='#f1f0db';c.lineWidth=2.6;c.globalAlpha=life*.78;
  for(let i=0;i<8;i++){const a=g.angle+(i+.5)*Math.PI/4;c.save();c.translate(g.x+Math.cos(a)*g.radius*.77,g.y+Math.sin(a)*g.radius*.77);c.rotate(a+Math.PI/2);for(let j=0;j<3;j++){const yy=(j-1)*6;c.beginPath();if(i&(1<<j)){c.moveTo(-10,yy);c.lineTo(-3,yy);c.moveTo(3,yy);c.lineTo(10,yy);}else{c.moveTo(-10,yy);c.lineTo(10,yy);}c.stroke();}c.restore();}
 }
 // The contact has a short white bloom while the outer calligraphy lingers.
 if(g.kind!=='ring'){const radius=26+35*t,gr=c.createRadialGradient(origin.x,origin.y,0,origin.x,origin.y,radius);gr.addColorStop(0,'#edf5e8');gr.addColorStop(.25,'#c9dcd590');gr.addColorStop(1,'#bdd6d000');c.globalAlpha=life*.5*(1-t);c.fillStyle=gr;c.beginPath();c.arc(origin.x,origin.y,radius,0,Math.PI*2);c.fill();}
 c.restore();
}
export function drawInkImpact(c:C,x:number,y:number,size:number,t:number){
 if(t>=1)return;const life=envelope(t);c.save();c.translate(x,y);c.rotate(Math.sin(x+y)*2);c.setLineDash([]);c.lineCap='round';
 const bloom=c.createRadialGradient(0,0,0,0,0,size*(.7+t*.5));bloom.addColorStop(0,'#f1f7e8b0');bloom.addColorStop(.25,'#d7e9e340');bloom.addColorStop(1,'#c3dacf00');c.fillStyle=bloom;c.globalAlpha=life*.75;c.fillRect(-size*1.2,-size*1.2,size*2.4,size*2.4);
 c.strokeStyle='#f2f3e8';c.fillStyle='#dde7d8';
 for(let i=0;i<14;i++){const a=i*Math.PI/7+Math.sin(i*4)*.2,r=size*(.22+.95*Math.pow(t,.6)),tail=r*(.22+.22*noise(i));c.globalAlpha=life*(.45+.4*noise(i+8));c.lineWidth=(4-i%3*.8)*(1-t*.55);c.beginPath();c.moveTo(Math.cos(a)*tail,Math.sin(a)*tail);c.quadraticCurveTo(Math.cos(a+.20)*r*.65,Math.sin(a+.20)*r*.65,Math.cos(a)*r,Math.sin(a)*r);c.stroke();c.globalAlpha=life*.55;c.beginPath();c.ellipse(Math.cos(a)*r*1.22,Math.sin(a)*r*1.22,1.5,3.5,a,0,Math.PI*2);c.fill();}
 c.restore();
}
/** Jagged trunk and forks share exact endpoints with the damage event. */
export function lightningPaths(x:number,y:number,x2:number,y2:number,phase=0){
 const dx=x2-x,dy=y2-y,len=Math.hypot(dx,dy)||1,n=Math.max(8,Math.min(64,Math.ceil(len/28))),nx=-dy/len,ny=dx/len,seed=x*.17+y*.13+x2*.07+phase*11,amp=Math.min(48,Math.max(11,len*.075));
 const trunk=Array.from({length:n+1},(_,i)=>{const q=i/n,off=i===0||i===n?0:(noise(seed+i*1.8)*2-1)*amp*Math.sin(Math.PI*q);return{x:x+dx*q+nx*off,y:y+dy*q+ny*off};});
 const forks:{x:number;y:number}[][]=[];
 for(let i=0;i<6;i++){const at=trunk[Math.floor(n*(.18+i*.115))],side=i%2?1:-1,reach=Math.min(155,len*.24)*( .5+noise(seed+i+44)),ex=at.x+dx/len*reach*.4+nx*reach*side,ey=at.y+dy/len*reach*.4+ny*reach*side;
  forks.push(Array.from({length:6},(_,j)=>{const q=j/5,off=j===0||j===5?0:(noise(seed+i*9+j)*2-1)*reach*.17;return{x:at.x+(ex-at.x)*q+nx*off,y:at.y+(ey-at.y)*q+ny*off};}));
 }
 return {trunk,forks};
}
export function drawLightningBolt(c:C,x:number,y:number,x2:number,y2:number,size:number,t:number){
 if(t>=1)return;const life=envelope(t),{trunk,forks}=lightningPaths(x,y,x2,y2,Math.min(2,Math.floor(t*7)));
 c.save();c.setLineDash([]);c.lineCap='round';c.lineJoin='round';c.globalCompositeOperation='lighter';
 const stroke=(ps:{x:number;y:number}[],width:number,alpha:number,color:string)=>{c.strokeStyle=color;c.lineWidth=width;c.globalAlpha=life*alpha;c.beginPath();ps.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();};
 for(const [width,alpha,col] of [[size*7,.10,'#548fe9'],[size*3,.30,'#91c3ff'],[size,.95,'#e2f3ff'],[Math.max(.8,size*.35),1,'#ffffff']] as [number,number,string][]){stroke(trunk,width,alpha,col);for(const [i,ps] of forks.entries())stroke(ps,width*.42,alpha*(.45+i*.055),col);}
 const r=34+size*8+t*55,glow=c.createRadialGradient(x2,y2,0,x2,y2,r);glow.addColorStop(0,'#e7f8ff');glow.addColorStop(.12,'#86bdffa0');glow.addColorStop(1,'#659cef00');c.globalAlpha=life*.65;c.fillStyle=glow;c.beginPath();c.arc(x2,y2,r,0,Math.PI*2);c.fill();
 // Branching discharge fans out from the contact like splintered white roots.
 for(let i=0;i<9;i++){const a=-Math.PI+i*Math.PI/8,d=(22+noise(i+x2)*35)*(1+t*.6);stroke([{x:x2,y:y2},{x:x2+Math.cos(a+.18)*d*.5,y:y2+Math.sin(a+.18)*d*.5},{x:x2+Math.cos(a)*d,y:y2+Math.sin(a)*d}],1.1, .55,'#cce8ff');}
 c.restore();
}
export function drawQiBurst(c:C,x:number,y:number,size:number,t:number){
 if(t>=1)return;c.save();c.translate(x,y);c.setLineDash([]);const life=envelope(t),r=size*(.2+.8*Math.pow(t,.45));
 c.strokeStyle='#e4edde';c.globalAlpha=life*.72;c.lineWidth=2.2*(1-t)+.6;c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.stroke();
 c.globalAlpha=life*.12;c.fillStyle='#e0eadc';c.beginPath();c.arc(0,0,r*.88,0,Math.PI*2);c.fill();
 for(let i=0;i<6;i++){const a=i*Math.PI/3+.2;c.globalAlpha=life*.5;c.lineWidth=1;c.beginPath();c.moveTo(Math.cos(a)*r*.9,Math.sin(a)*r*.9);c.lineTo(Math.cos(a)*r*1.13,Math.sin(a)*r*1.13);c.stroke();}c.restore();
}
export function drawFireBloom(c:C,x:number,y:number,size:number,t:number){
 if(t>=1)return;const life=envelope(t),r=size*(.24+.8*Math.pow(t,.45));c.save();c.translate(x,y);c.setLineDash([]);
 const glow=c.createRadialGradient(0,-r*.1,0,0,-r*.1,r*1.2);glow.addColorStop(0,'#fff0baba');glow.addColorStop(.25,'#ffca7280');glow.addColorStop(.6,'#cc57383c');glow.addColorStop(1,'#a7452900');c.globalAlpha=life;c.fillStyle=glow;c.fillRect(-r*1.3,-r*1.4,r*2.6,r*2.6);
 for(let i=0;i<12;i++){const a=i*Math.PI/6+.1,reach=r*(.7+.3*noise(i+x)),xx=Math.cos(a)*reach,yy=Math.sin(a)*reach-t*size*.18;
  c.globalAlpha=life*(.5+.35*noise(i+8));c.fillStyle=i%3===0?'#f5d096':i%2?'#dc935b':'#b8573d';c.beginPath();c.moveTo(Math.cos(a-.25)*r*.3,Math.sin(a-.25)*r*.3);c.quadraticCurveTo(xx*.9,yy*.65,xx,yy);c.quadraticCurveTo(xx*.65,yy*.85,Math.cos(a+.25)*r*.25,Math.sin(a+.25)*r*.25);c.fill();
  c.fillStyle='#f3cb87';c.globalAlpha=life*.75;c.beginPath();c.ellipse(xx*1.15,yy*1.15,1.7,3.5,a,0,Math.PI*2);c.fill();
 }
 c.restore();
}
/** Pixel-sized dashes retain contrast at every camera zoom. */
export function guideStroke(c:C,path:{x:number;y:number}[],zoom:number,color='#d9e1d2',alpha=.64,width=1.35){
 if(path.length<2)return;zoom=Math.max(.12,zoom);c.save();c.lineCap='round';c.lineJoin='round';c.setLineDash([4/zoom,7/zoom]);c.beginPath();path.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.strokeStyle='#10242a';c.lineWidth=(width+1.95)/zoom;c.globalAlpha=.45;c.stroke();c.strokeStyle=color;c.lineWidth=width/zoom;c.globalAlpha=alpha;c.stroke();c.restore();
}
const turnGuideCache=new WeakMap<Engine,{key:string;prediction:ReturnType<typeof turnPrediction>}>();
export function drawTurnGuide(c:C,e:Engine,zoom=1,point?:{x:number;y:number}){
 const p=e.b.projectiles.find(p=>p.skill==='A09'&&p.owner===e.b.active&&!p.turned&&!p.followup);if(e.b.phase!=='flight'||!p)return false;
 zoom=Math.max(.12,zoom);const key=[p.id,Math.floor(p.age*30),e.active?.angle,point?.x.toFixed(0),point?.y.toFixed(0),e.b.sceneVersion].join(':');let cached=turnGuideCache.get(e);
 if(cached?.key!==key){cached={key,prediction:turnPrediction(e,point)};turnGuideCache.set(e,cached);}const pr=cached.prediction;if(!pr)return false;
 guideStroke(c,[{x:p.x,y:p.y},...pr.points.slice(1)],zoom,'#f2d39c',.82);
 c.save();c.strokeStyle='#f0d5a7';c.globalAlpha=.8;c.lineWidth=1.3/zoom;c.beginPath();c.arc(pr.x,pr.y,5/zoom,0,Math.PI*2);c.stroke();c.font=`${12/zoom}px sans-serif`;c.fillStyle='#f0d5a7';c.fillText('선회 예상',p.x+14/zoom,p.y-14/zoom);c.restore();return true;
}
export function drawRedesignGuide(c:C,e:Engine,u:Unit,s:Skill,power:number,zoom=1){
 if(drawMeleeGuide(c,e,u,s,power,zoom))return true;
 if(!s.redesigned)return false;
 if(s.mode==='prepare'||u.retreat)return true;
 zoom=Math.max(.12,zoom);const pr=guidePrediction(e,u,s,power);
  c.save();c.strokeStyle=CLASSES[u.cls].color;c.fillStyle=CLASSES[u.cls].color;c.lineWidth=1.2/zoom;c.globalAlpha=.4;c.setLineDash([4/zoom,7/zoom]);
 let path=pr.points;
  guideStroke(c,path,zoom,CLASSES[u.cls].color);
  if(!['A04','A15'].includes(s.id)&&'paths' in pr&&Array.isArray(pr.paths))for(const other of pr.paths as {x:number;y:number}[][]){if(other!==path)guideStroke(c,other,zoom,CLASSES[u.cls].color,.36);}
 const geo='geometry' in pr?pr.geometry as SkillGeometry:undefined;
 if(geo){c.setLineDash([4/zoom,8/zoom]);c.globalAlpha=.025;drawSkillGeometry(c,geo,true,zoom);c.globalAlpha=.4;drawSkillGeometry(c,geo,false,zoom);}
 else if(s.radius&&s.branch!=='stake'){c.globalAlpha=.4;c.setLineDash([4/zoom,8/zoom]);c.beginPath();c.arc(pr.x,pr.y,e.effective(s,u).radius,0,Math.PI*2);c.stroke();}
 if('secondaryRadius' in pr&&pr.secondaryRadius){const center='secondaryPoint' in pr&&pr.secondaryPoint?pr.secondaryPoint as {x:number;y:number}:pr;
  c.globalAlpha=.32;c.setLineDash([4/zoom,9/zoom]);c.beginPath();c.arc(center.x,center.y,Number(pr.secondaryRadius),0,Math.PI*2);c.stroke();
  if(center!==pr){guideStroke(c,[{x:center.x,y:center.y-140},center],zoom,CLASSES[u.cls].color,.32,.85);}
 }
 if(s.id==='M04')for(const t of e.b.units.filter(t=>!t.dead&&t.side===1&&Math.hypot(t.x-pr.x,t.y-t.h*.5-pr.y)<=260+10*((u.ranks.M04||1)-1))){c.beginPath();c.moveTo(pr.x,pr.y);c.lineTo(t.x,t.y-t.h*.5);c.stroke();}
 c.restore();return true;
}
