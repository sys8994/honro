import type {Projectile,Unit,Skill} from './types';
import type {Engine} from './engine';
import {meleeSkill,meleeRange,meleeSpan,orbitPoint} from './warriorMechanics';
import {SKILLS} from './data';
import {STEP} from './math';
type C=CanvasRenderingContext2D;
function crescent(c:C,x:number,y:number,angle:number,size=22){
 c.save();c.translate(x,y);c.rotate(angle);c.strokeStyle='#e0e6df';c.lineWidth=2;c.beginPath();c.moveTo(-9,-size);c.quadraticCurveTo(size*.65,0,-9,size);c.stroke();c.globalAlpha*=.35;c.lineWidth=1;c.beginPath();c.moveTo(-13,-size*.85);c.quadraticCurveTo(size*.22,0,-13,size*.85);c.stroke();c.restore();
}
/** Tapered wash and moving fibres follow recorded flight positions, including curved flights. */
function flightTail(c:C,points:{x:number;y:number}[],age:number,width:number){
 if(points.length<2)return;c.save();c.lineCap='round';c.lineJoin='round';
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],t=i/(points.length-1),angle=Math.atan2(b.y-a.y,b.x-a.x),nx=-Math.sin(angle),ny=Math.cos(angle);
  c.strokeStyle='#c5d8d0';c.globalAlpha=.13*t;c.lineWidth=width*t;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();
  for(const side of [-1,1]){const off=side*width*.28*t+Math.sin(age*19-i*.7+side)*width*.10*(1-t);
   c.strokeStyle=side===1?'#edf1df':'#a7c4c4';c.globalAlpha=t*.46;c.lineWidth=.65+1.3*t;c.beginPath();c.moveTo(a.x+nx*off,a.y+ny*off);c.lineTo(b.x+nx*off,b.y+ny*off);c.stroke();}
 }
 c.restore();
}
export function drawWarriorProjectile(c:C,p:Projectile){
 if(!SKILLS[p.skill]?.martial)return false;
 if(p.orbit){for(const blade of p.orbit.blades){
  const history=p.trail.slice(-11),points=history.map((v,i)=>orbitPoint({...p,x:v.x,y:v.y},blade,Math.max(0,p.age-(history.length-1-i)*STEP))),q=orbitPoint(p,blade);
  points.push(q);flightTail(c,points,p.age,12);crescent(c,q.x,q.y,blade.phase+blade.omega*p.age+Math.PI*.5,17*(p.sizeBoost||1));
 }return true;}
 const points=[...p.trail,{x:p.x,y:p.y}],angle=Math.atan2(p.vy,p.vx);
 flightTail(c,points,p.age,p.body?40:24);
 if(p.body){
  // Two streaming coat hems and detached gusts make the airborne body readable at small zooms.
  c.save();c.translate(p.x,p.y);c.rotate(angle);c.lineCap='round';
  for(const side of [-1,1]){const flutter=Math.sin(p.age*24+side)*8;c.fillStyle=side===1?'#b9c5b0':'#718e88';c.globalAlpha=.45;c.beginPath();c.moveTo(-10,side*14);c.bezierCurveTo(-35,side*21+flutter,-56,side*8-flutter,-88,side*18+flutter);c.quadraticCurveTo(-49,side*10,-15,side*8);c.closePath();c.fill();}
  c.strokeStyle='#dae1cd';for(let i=0;i<5;i++){const phase=(p.age*2.5+i/5)%1,side=i%2?1:-1,x=-25-phase*105,y=side*(24+phase*19);c.globalAlpha=(1-phase)*.5;c.lineWidth=1.2;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x-15,y+side*4,x-31,y+side*2);c.stroke();}
  c.restore();return true;
 }
 c.save();for(const [i,back] of [5,11].entries()){const q=p.trail.at(-back);if(!q)continue;c.globalAlpha=.18-i*.07;crescent(c,q.x,q.y,angle,20*(p.sizeBoost||1));}c.restore();
 // The leading edge breathes subtly while its tail conveys direction and speed.
 crescent(c,p.x,p.y,angle,(23+Math.sin(p.age*17)*1.5)*(p.sizeBoost||1));return true;
}
export function drawMeleeGuide(c:C,e:Engine,u:Unit,s:Skill,power:number,zoom=1){
 if(!s.martial||!meleeSkill(s)&&s.mode!=='bladeScreen')return false;
 const radius=s.mode==='bladeScreen'?175:meleeRange(u,s,s.mode==='lifeSlash'?0:power),wide=s.mode==='bladeScreen'?Math.PI*.5:meleeSpan(u,s,power)/2,angle=s.mode==='bladeScreen'?(Math.cos(u.angle*Math.PI/180)<0?Math.PI:0):-u.angle*Math.PI/180;
 c.save();c.translate(u.x,u.y-u.h*.5);c.lineWidth=1.35/zoom;c.strokeStyle='#d5dfd4';c.setLineDash([4/zoom,7/zoom]);c.globalAlpha=.65;
 for(const offset of s.mode==='meleeTurn'?[0,Math.PI]:[0]){c.beginPath();c.moveTo(0,0);c.arc(0,0,radius,angle+offset-wide,angle+offset+wide);c.closePath();c.stroke();}
 c.restore();return true;
}
export function drawSwordCut(c:C,x:number,y:number,size:number,t:number,facing=1,variant=0,color='#dce3de',geometry?:string){
 if(geometry){const g=JSON.parse(geometry);c.save();c.translate(x,y);c.rotate(g.angle);c.strokeStyle=color;c.lineWidth=3*(1-t)+.6;c.beginPath();c.arc(0,0,size,-g.span/2,g.span/2);c.stroke();c.globalAlpha*=.22*(1-t);c.fillStyle=color;c.beginPath();c.moveTo(0,0);c.arc(0,0,size,-g.span/2,g.span/2);c.closePath();c.fill();c.restore();return;}
 c.save();c.translate(x,y);c.scale(facing,1);c.strokeStyle=color;c.lineCap='round';
 if(variant===2){c.lineWidth=2.5*(1-t)+.5;c.beginPath();c.moveTo(8,14);c.lineTo(size*Math.min(1,t*7),-14);c.stroke();c.globalAlpha*=.35;c.strokeStyle='#a96358';c.beginPath();c.moveTo(10,18);c.lineTo(size*.92,-9);c.stroke();}
 else {const direction=variant===1?-1:1,progress=Math.min(1,t*4);c.lineWidth=2.8*(1-t)+.6;c.beginPath();c.ellipse(5,0,size*.86,size*.43,direction*.12,-1.2,-1.2+2.4*progress);c.stroke();for(let i=0;i<3;i++){c.globalAlpha=.20*(1-t);c.lineWidth=.7;c.beginPath();c.ellipse(5,0,size*(.76+i*.025),size*.37,direction*.12,-1.08,-1.08+2.25*progress);c.stroke();}}
 c.restore();
}
export function drawCirculation(c:C,x:number,y:number,size:number,t:number){c.save();c.strokeStyle='#d8e2da';c.lineWidth=1.5;c.globalAlpha*=Math.sin(Math.PI*t);const a=t*Math.PI*2;c.beginPath();c.ellipse(x,y,size*.6,size,0,a-1.5,a+.4);c.stroke();c.restore();}
export function drawCombatPassives(c:C,e:Engine,time:number){
 for(const u of e.b.units){if(u.dead)continue;
  if(u.bladeScreen&&u.bladeScreen.round>=e.b.round){const a=u.bladeScreen.facing<0?Math.PI:0;c.save();c.strokeStyle='#c4d3cb';c.lineWidth=1.4;c.globalAlpha=.38;for(let i=0;i<3;i++){c.beginPath();c.ellipse(u.x,u.y-u.h*.5,171+i*3,168-i*8,0,a-Math.PI*.5+i*.025,a+Math.PI*.5-i*.025);c.stroke();}c.restore();}
  if(u.salheun){const entries=Object.entries(u.salheun).flatMap(([owner,h])=>h.entries.map(v=>({...v,age:(e.unit(owner)?.arrowTurn||v.turn)-v.turn}))).sort((a,b)=>a.age-b.age).slice(0,3);c.save();for(let i=0;i<entries.length;i++){const x=u.x+(i-1)*7,y=u.y-u.h*(.44+i*.10),wiggle=(u.salheunFlash||0)>0?Math.sin(time*75)*2:0;c.globalAlpha=Math.max(.3,.8-entries[i].age*.13);c.strokeStyle='#c0b491';c.lineWidth=1.2;c.beginPath();c.moveTo(x-15,y-8+wiggle);c.lineTo(x+2,y+wiggle);c.moveTo(x-13,y-7+wiggle);c.lineTo(x-15,y-12+wiggle);c.stroke();}c.restore();}
 }
}
