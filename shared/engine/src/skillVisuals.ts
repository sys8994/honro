import type {Projectile,Unit,Skill} from './types';
import type {Engine} from './engine';
import {SKILLS} from './data';
import {geometryPaths,type SkillGeometry} from './skillMechanics';
type C=CanvasRenderingContext2D;
const guideCache=new WeakMap<Engine,{key:string;prediction:ReturnType<Engine['predict']>}>();
function guidePrediction(e:Engine,u:Unit,s:Skill,power:number){
 const b=e.b,key=[b.shot,b.rng,b.sceneVersion,b.physics?.revision,b.wind,s.id,u.x,u.y,u.h,u.angle,power,u.tune,JSON.stringify(u.ranks),...b.units.map(v=>`${v.id}:${v.x}:${v.y}:${v.hp}:${v.dead}`)].join('|');
 const cached=guideCache.get(e);if(cached?.key===key)return cached.prediction;
 const prediction=e.predict(u,s,u.angle,power);guideCache.set(e,{key,prediction});return prediction;
}
export const SKILL_FX_SECONDS={skillGeometry:.9,inkImpact:.8,lightningBolt:.9};
export function drawSkillGeometry(c:C,g:SkillGeometry,thick=false){
 c.save();c.strokeStyle='#c2ccc6';c.lineWidth=thick?g.thickness:1.05;c.lineCap='round';c.lineJoin='round';
 for(const ps of geometryPaths(g)){c.beginPath();ps.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();}c.restore();
}
export function drawRedesignProjectile(c:C,p:Projectile){
 const s=SKILLS[p.skill];if(!s?.redesigned)return false;
 if(['prepare','waveRing','skyWait','ironEmitter','microEmitter'].includes(p.mode))return true;
 c.save();
 if(p.mode==='microWait'){c.strokeStyle='#b4beb0';c.lineWidth=1;c.beginPath();c.arc(p.x,p.y,8,0,Math.PI*2);c.stroke();c.restore();return true;}
 if(p.trail.length>1){c.strokeStyle='#aeb7b080';c.lineWidth=1;c.beginPath();p.trail.slice(-10).forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.lineTo(p.x,p.y);c.stroke();}
 c.translate(p.x,p.y);c.rotate(Math.atan2(p.vy,p.vx));
 if(s.cls==='archer'){
  c.strokeStyle='#ad9d7f';c.lineWidth=2;c.beginPath();c.moveTo(-25,0);c.lineTo(12,0);c.stroke();c.fillStyle='#c7ccc3';c.beginPath();c.moveTo(17,0);c.lineTo(7,-3);c.lineTo(8,3);c.closePath();c.fill();
  c.strokeStyle='#999f8d';c.lineWidth=1.5;for(const x of [-23,-18]){c.beginPath();c.moveTo(x,0);c.lineTo(x-4,-5);c.moveTo(x,0);c.lineTo(x-4,5);c.stroke();}
 }else if(s.branch==='gourd'&&!p.secondary){
  c.rotate(p.age*2);c.fillStyle=s.id==='M02'?'#9cbbb9':'#a0a995';c.strokeStyle='#404d47';c.lineWidth=1.5;
  c.beginPath();c.ellipse(0,3,8,10,0,0,Math.PI*2);c.fill();c.stroke();c.beginPath();c.ellipse(0,-7,5,5,0,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#645745';c.fillRect(-3,-15,6,5);
  c.strokeStyle='#74654e';c.beginPath();c.moveTo(-5,-5);c.lineTo(7,-3);c.lineTo(9,7);c.stroke();c.fillStyle='#c9c0a5';c.fillRect(0,-2,4,10);c.strokeStyle='#6f574b';c.beginPath();c.moveTo(1,0);c.lineTo(3,2);c.lineTo(1,4);c.stroke();
 }else if(s.branch==='stake'){
  c.fillStyle='#746448';c.fillRect(-15,-4,30,8);c.fillStyle='#c2b594';c.fillRect(-6,-3,13,6);c.strokeStyle='#484b3c';c.beginPath();c.moveTo(-3,-2);c.lineTo(3,2);c.lineTo(6,-2);c.stroke();
 }else if(p.secondary){c.strokeStyle=p.mode==='fireChip'?'#b88e64':'#b6cccf';c.lineWidth=2;c.beginPath();c.moveTo(-5,-2);c.lineTo(3,0);c.lineTo(-2,3);c.stroke();}
 else{
  // White dry-brush tip, translucent wash and trailing fibres: no neon glow.
  for(let i=0;i<4;i++){c.strokeStyle=i===0?'#ecebdf':'#c6d1c3';c.globalAlpha=i===0?.9:.30;c.lineWidth=i===0?3.5:1.1;c.beginPath();c.moveTo(-29-i*3,-7+i*4);c.quadraticCurveTo(-9,-15+i*7,9-i,0);c.quadraticCurveTo(-7,13-i*3,-20-i*2,7-i*2);c.stroke();}
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
export function drawRedesignGuide(c:C,e:Engine,u:Unit,s:Skill,power:number){
 if(!s.redesigned)return false;
 if(s.mode==='prepare'||u.retreat)return true;
 const pr=guidePrediction(e,u,s,power);const insight=u.ranks.MP04||0;
 c.save();c.strokeStyle='#bdc8bf';c.fillStyle='#bdc8bf';c.lineWidth=1;c.globalAlpha=.35;c.setLineDash([3,7]);
 let path=pr.points;
 if('contacts' in pr&&Array.isArray(pr.contacts)&&pr.contacts.length&&(s.id==='M02'&&insight<2||s.id==='M11'&&insight<4)){
  const contact=pr.contacts[s.id==='M11'&&insight>=3?Math.min(1,pr.contacts.length-1):0];let nearest=0,best=Infinity;
  path.forEach((v,i)=>{const d=Math.hypot(v.x-contact.x,v.y-contact.y);if(d<best){best=d;nearest=i;}});path=path.slice(0,nearest+1);
 }
 c.beginPath();path.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.stroke();c.setLineDash([]);
 if('paths' in pr&&Array.isArray(pr.paths)){c.globalAlpha=.22;c.setLineDash([3,7]);for(const other of pr.paths as {x:number;y:number}[][]){if(other===path)continue;c.beginPath();other.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.stroke();}c.setLineDash([]);}
 const geo='geometry' in pr?pr.geometry as SkillGeometry:undefined;
 if(geo){c.setLineDash([4,8]);if(insight>=5){c.globalAlpha=.025;drawSkillGeometry(c,geo,true);}c.globalAlpha=.24;drawSkillGeometry(c,geo);c.setLineDash([]);}
 else if(s.radius&&s.branch!=='stake'){c.globalAlpha=.24;c.setLineDash([4,8]);c.beginPath();c.arc(pr.x,pr.y,e.effective(s,u).radius,0,Math.PI*2);c.stroke();c.setLineDash([]);}
 if('secondaryRadius' in pr&&pr.secondaryRadius&&((s.branch==='gourd'&&insight>=1)||(s.branch==='stake'&&insight>=6))){c.globalAlpha=.25;c.setLineDash([4,9]);c.beginPath();c.arc(pr.x,pr.y,Number(pr.secondaryRadius),0,Math.PI*2);c.stroke();}
 if(insight>=7&&s.id==='M04')for(const t of e.b.units.filter(t=>!t.dead&&t.side===1&&Math.hypot(t.x-pr.x,t.y-t.h*.5-pr.y)<=260+10*((u.ranks.M04||1)-1))){c.beginPath();c.moveTo(pr.x,pr.y);c.lineTo(t.x,t.y-t.h*.5);c.stroke();}
 if(insight>=8&&s.cls==='mage'){const d=e.effective(s,u).damage;c.globalAlpha=.7;c.font='13px sans-serif';c.fillText(`예상 ${Math.round(d*.3)}–${Math.round(d*1.5)}`,pr.x+12,pr.y-18);}
 c.restore();return true;
}
