import {animals,actionNames,directions,paintSprite} from './actors.mjs';
import {spriteSize} from './body.mjs';
import {fieldPalette} from './palette.mjs';
const $=id=>document.getElementById(id),canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');
const actor=$('actor'),direction=$('direction'),pose=$('pose'),play=$('play');
const names=['설오','산개','멧돼지','사슴','까마귀','박쥐','원혼','나무꾼'];
function options(select,values,labels){values.forEach((value,i)=>select.add(new Option(labels[i],value)));}
options(actor,['seolo',...animals,'woodcutter'],names);options(direction,directions,directions);options(pose,actionNames,['대기','이동','조준·준비','발사·공격','회복','피격','퇴장']);pose.value='idle';
const requested=new URLSearchParams(location.search);
for(const [select,key] of [[actor,'actor'],[direction,'direction'],[pose,'pose']]){
  const value=requested.get(key);if([...select.options].some(o=>o.value===value))select.value=value;
}
const ids=['woodcutter','seolo','seolo-front','seolo-states','seolo-bow','seolo-bow-ne',...animals.map(n=>'turns-'+n)];
const images=new Map(await Promise.all(ids.map(async id=>{const image=new Image();image.src=new URL('../assets/actors/'+id+'.webp',import.meta.url);await image.decode();return [id,fieldPalette(id,image)];})));
let running=true,elapsed=0,last=0;
function toggle(next){running=next;play.textContent=next?'멈춤':'재생';play.setAttribute('aria-pressed',String(running));}
play.onclick=()=>toggle(!running);$('step').onclick=()=>{toggle(false);elapsed+=.18;};
toggle(true);play.disabled=false;$('step').disabled=false;
function render(now){if(last&&running)elapsed+=Math.min(.1,(now-last)/1000);last=now;ctx.fillStyle='#303a30';ctx.fillRect(0,0,720,300);
  for(const [x,k] of [[170,1],[485,3]]){const y=240;ctx.strokeStyle='#abb398';ctx.beginPath();ctx.moveTo(x-38,y);ctx.lineTo(x+38,y);ctx.moveTo(x,y-6);ctx.lineTo(x,y+6);ctx.stroke();
    const stride=elapsed*385;
    paintSprite(ctx,images,actor.value,pose.value,directions.indexOf(direction.value),stride,x,y,spriteSize(actor.value)*k,elapsed);}
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
