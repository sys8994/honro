import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createCanvas} from '@napi-rs/canvas';
const spec=JSON.parse(await readFile('tools/stage31-production/blueprint.json','utf8')),out='art/stage31-vector-production';await mkdir(out,{recursive:true});
for(const v of [{id:'whole',x:0,y:1300,w:7200,h:2400,px:1800},{id:'body-west',x:0,y:1450,w:3600,h:2100,px:1440},{id:'body-east',x:3600,y:1450,w:3600,h:2100,px:1440}]){
 const scale=v.px/v.w,cv=createCanvas(v.px,Math.round(v.h*scale)),c=cv.getContext('2d');if(v.id==='whole'){c.fillStyle='#edf0ef';c.fillRect(0,0,cv.width,cv.height);}c.scale(scale,scale);c.translate(-v.x,-v.y);c.fillStyle='#626d70';c.beginPath();spec.bank.profile.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.lineTo(7200,4800);c.lineTo(0,4800);c.closePath();c.fill();
 if(v.id==='whole'){c.strokeStyle='#f1ce70';c.lineWidth=10;c.beginPath();spec.bank.profile.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();for(const w of spec.walkways){c.strokeStyle='#976d46';c.lineWidth=22;c.beginPath();w.top.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}c.fillStyle='#243c4b';c.fillRect(260,1720-84,28,84);c.fillStyle='#42869f';c.fillRect(6238,1890,962,600);c.fillStyle='#253d4b';c.font='70px sans-serif';c.fillText('01  ESTUARY | terrain skeleton',90,1460);}
 await writeFile(out+'/'+v.id+'-skeleton.png',cv.toBuffer('image/png'));
}
