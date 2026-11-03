(function(G){'use strict';
// Story clock and time-of-day grading. Visual only: no gameplay, save or terrain
// state. The clock is derived from the stage timeline and the current round, so
// retry/continue restore it without new saved data.
const data=()=>G.HONRO_TIMELINE||null;
const hm=s=>{const [h,m]=String(s).split(':').map(Number);return h*60+m;};
const hex=s=>{const m=/^#?([0-9a-f]{6})$/i.exec(s||'');return m?[0,2,4].map(i=>parseInt(m[1].slice(i,i+2),16)):[128,128,128];};
const lerp=(a,b,t)=>a+(b-a)*t;
const mix=(a,b,t)=>a.map((v,i)=>lerp(v,b[i],t));
const css=(rgb,a=1)=>`rgba(${rgb.map(v=>Math.round(v)).join(',')},${a})`;
const profiles=new Map();
function profile(name){
 if(profiles.has(name))return profiles.get(name);const p=data()?.profiles?.[name];if(!p)return null;
 if(p.fixed){const v={fixed:norm(p.fixed)};profiles.set(name,v);return v;}
 const base=p.extends?profile(p.extends)?.keys||[]:[],keys=new Map(base.map(k=>[k.m,k]));
 for(const k of [...(p.keys||[]),...(p.override||[])])keys.set(hm(k.t),{m:hm(k.t),...norm(k)});
 const v={keys:[...keys.values()].sort((a,b)=>a.m-b.m)};profiles.set(name,v);return v;
}
function norm(k){return {sat:k.sat??1,mul:[hex(k.mul?.[0]),k.mul?.[1]??0],hor:k.hor?[hex(k.hor[0]),k.hor[1]]:null,stars:k.stars||0};}
function sample(p,min){
 if(!p)return null;if(p.fixed)return p.fixed;const ks=p.keys;if(!ks.length)return null;
 const m=((min%1440)+1440)%1440;let i=ks.findIndex(k=>k.m>m);if(i<0)i=0;const b=ks[i],a=ks[(i-1+ks.length)%ks.length];
 const span=((b.m-a.m)+1440)%1440||1440,t=(((m-a.m)+1440)%1440)/span;
 const ha=a.hor||(b.hor?[b.hor[0],0]:null),hb=b.hor||(a.hor?[a.hor[0],0]:null);
 return {sat:lerp(a.sat,b.sat,t),mul:[mix(a.mul[0],b.mul[0],t),lerp(a.mul[1],b.mul[1],t)],hor:ha?[mix(ha[0],hb[0],t),lerp(ha[1],hb[1],t)]:null,stars:lerp(a.stars,b.stars,t)};
}
function entry(b){if(!b||b.honroCustom)return null;return data()?.stages?.[String(b.honroStage)]||null;}
function targetMinutes(e,round){
 let s=hm(e.start),z=hm(e.end);if(z<s)z+=1440;const n=Math.max(2,e.endRound||10),f=Math.min(1,Math.max(0,((round||1)-1)/(n-1)));return s+(z-s)*f;
}
// Smooth the change at a new round; snap on a new battle so loads never flash.
function minutes(scene,b){
 const e=entry(b);if(!e||e.clock===false)return null;const target=targetMinutes(e,b.round),now=performance.now(),key=b.honroStage+':'+(b.session??'');
 const st=scene._honroTime;if(!st||st.key!==key){scene._honroTime={key,value:target,at:now};return target;}
 const dt=Math.min(.1,Math.max(0,(now-st.at)/1000));st.at=now;st.value+=(target-st.value)*Math.min(1,dt*1.1);if(Math.abs(target-st.value)<.05)st.value=target;return st.value;
}
function grade(scene,b){const e=entry(b);if(!e)return null;const p=profile(e.profile||'default');if(e.clock===false)return {g:sample(p,0),e,min:null};const min=minutes(scene,b);return {g:sample(p,min),e,min};}
function apply(c,w,h,g,k){
 if(!g||k<=0)return;c.save();
 if(g.sat<1){c.globalCompositeOperation='saturation';c.globalAlpha=Math.min(1,(1-g.sat)*k);c.fillStyle='#808080';c.fillRect(0,0,w,h);}
 if(g.mul[1]>0){c.globalCompositeOperation='multiply';c.globalAlpha=Math.min(1,g.mul[1]*k);c.fillStyle=css(g.mul[0]);c.fillRect(0,0,w,h);}
 // Atmospheric horizon band only (an approved gradient use): dusk ember, dawn blue.
 if(g.hor&&g.hor[1]>0){c.globalCompositeOperation='screen';c.globalAlpha=Math.min(1,g.hor[1]*k);const y=h*.46,gr=c.createLinearGradient(0,y-h*.36,0,y+h*.3);gr.addColorStop(0,css(g.hor[0],0));gr.addColorStop(.55,css(g.hor[0],1));gr.addColorStop(1,css(g.hor[0],0));c.fillStyle=gr;c.fillRect(0,0,w,h);}
 c.restore();
}
const stars=Array.from({length:48},(_,i)=>({x:((i*7919)%997)/997,y:((i*6151)%613)/613*.42,r:.5+((i*31)%7)/9,p:i*1.7}));
function moonPos(e,min,w,h){
 const m=data()?.moons?.[e.moon];if(!m||min===null)return null;let r=hm(m.rise),s=hm(m.set),t=((min%1440)+1440)%1440;if(s<r)s+=1440;if(t<r)t+=1440;const p=(t-r)/(s-r);if(p<=0||p>=1)return null;
 return {x:w*(.9-.8*p),y:h*(.34-.24*Math.sin(Math.PI*p)),phase:m.phase??.5,p};
}
// Clouds: long, soft, ink-wash bands that drift with the gameplay wind in real
// time. Pre-blurred once; never outlined or round. Hidden-tab returns clamp dt.
let cloudTex=null;
function cloudTexture(){
 if(cloudTex||typeof document==='undefined')return cloudTex;const W=1024,H=220,src=document.createElement('canvas');src.width=W;src.height=H;const x=src.getContext('2d');
 let seed=91;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(let i=0;i<18;i++){const cx=rnd()*W,cy=H*(.18+rnd()*.62),rx=70+rnd()*300,ry=10+rnd()*34;x.globalAlpha=.09+rnd()*.14;x.fillStyle=rnd()<.5?'#9aa3a8':'#b4bab6';x.beginPath();x.ellipse(cx,cy,rx,ry,(rnd()-.5)*.08,0,Math.PI*2);x.fill();x.beginPath();x.ellipse((cx+W/2)%W,cy,rx,ry,0,0,Math.PI*2);x.fill();}
 const out=document.createElement('canvas');out.width=W;out.height=H;const o=out.getContext('2d');o.filter='blur(18px)';o.drawImage(src,-W,0);o.drawImage(src,0,0);o.drawImage(src,W,0);o.filter='none';cloudTex=out;return out;
}
function clouds(scene,c,w,h,b,e){
 const tex=cloudTexture();if(!tex)return;const now=performance.now(),st=scene._honroClouds??={x:0,v:0,at:now};const dt=Math.min(.1,Math.max(0,(now-st.at)/1000));st.at=now;
 const wind=Number.isFinite(b.wind)?b.wind:0;st.v+=(wind*1.6-st.v)*Math.min(1,dt*.25);st.x+=(st.v+4)*dt;
 const density=e.clouds??.7;if(density<=0)return;c.save();
 for(const [i,L] of [[0,{y:.06,s:.55,a:.75,p:.35}],[1,{y:.16,s:.8,a:1,p:1}]]){const tw=tex.width*L.s*(w/1280),th=tex.height*L.s*(w/1280),off=(((st.x*L.p)%tw)+tw)%tw;c.globalAlpha=Math.min(1,density*L.a);for(let x=-off-tw;x<w+tw;x+=tw)c.drawImage(tex,x,h*L.y,tw,th);}
 c.restore();
}
// Sky layer: stars and a dim haloed moon over the far painting, then a light sky grade.
function sky(scene,c,w,h,b){
 const r=grade(scene,b);if(!r?.g)return;const {g,e,min}=r;
 if(e.sky!==false&&min!==null){
  if(g.stars>0){c.save();c.fillStyle='#d8dccf';for(const s of stars){c.globalAlpha=g.stars*(.35+.25*Math.sin(scene.time*.6+s.p));c.fillRect(s.x*w,s.y*h,s.r,s.r);}c.restore();}
  const mo=moonPos(e,min,w,h);if(mo){const R=Math.max(9,Math.min(w,h)*.022),night=1-Math.min(1,g.sat);c.save();
   const halo=c.createRadialGradient(mo.x,mo.y,R*.8,mo.x,mo.y,R*6);halo.addColorStop(0,'rgba(196,204,198,.20)');halo.addColorStop(1,'rgba(196,204,198,0)');c.globalAlpha=.6+night*.4;c.fillStyle=halo;c.fillRect(mo.x-R*6,mo.y-R*6,R*12,R*12);
   c.globalAlpha=.45+night*.35;c.fillStyle='#cfcdbd';c.beginPath();c.arc(mo.x,mo.y,R,0,Math.PI*2);c.fill();
   // Waning shadow and a faint veil keep the disc dull rather than a bright sticker.
   c.globalCompositeOperation='destination-out';c.globalAlpha=.85;c.beginPath();c.arc(mo.x-R*(1-mo.phase)*1.9,mo.y-R*.12,R*.98,0,Math.PI*2);c.fill();
   c.globalCompositeOperation='source-over';c.globalAlpha=.25;c.fillStyle='#5a6372';c.beginPath();c.arc(mo.x,mo.y,R*1.05,0,Math.PI*2);c.fill();c.restore();}
 }
 if(e.sky!==false&&e.clock!==false)clouds(scene,c,w,h,b,e);
 apply(c,w,h,g,.35);
}
function install(S){
 if(!S||S.prototype._honroTimeInstalled)return;const prior=S.prototype.environmentTone;S.prototype._honroTimeInstalled=true;
 S.prototype.environmentTone=function(c,w,h,b){const r=grade(this,b);if(!r?.g)return prior?.call(this,c,w,h,b);apply(c,w,h,r.g,1);};
}
G.HonroTimeOfDay={entry,targetMinutes,minutes,grade,sample:(name,min)=>sample(profile(name),min),apply,sky,install,clockText:(b)=>{const e=entry(b);if(!e||e.clock===false)return null;const m=Math.round(targetMinutes(e,b.round))%1440;const raw=targetMinutes(e,b.round);return `${e.day+Math.floor(raw/1440)}일차 ${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;}};
install(G.HonroScene);
})(globalThis);
