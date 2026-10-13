/** Native composition preview using production art and actor drawing. Geometry
 * mirrors CSS but is not a browser layout screenshot or input proof. */
import vm from 'node:vm';import {readFile,mkdir,writeFile} from 'node:fs/promises';import {createCanvas,loadImage,Path2D,GlobalFonts} from '@napi-rs/canvas';
GlobalFonts.registerFromPath('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','Rest Korean');
const g=vm.createContext({HONRO_CONTENT:{},HONRO_CORE:{},document:{},Path2D,matchMedia:()=>({matches:false})});
for(const file of ['shared/runtime/party-rig.js','shared/assets/party/party.runtime.js','shared/runtime/journey-art.js','shared/runtime/rest-journey.js'])vm.runInContext(await readFile(file,'utf8'),g);
const out='_local/reports/rest-scene-controls';await mkdir(out,{recursive:true});const art=await loadImage(Buffer.from(g.HonroJourneyArt.scene('forest','surface')));
for(const [name,w,h] of [['333',333,722],['400',400,866],['desktop',1280,800]])for(const before of [true,false]){
 const c=createCanvas(w,h),ctx=c.getContext('2d'),mobile=w<=700,header=50,footer=before?(mobile?85:75):0,sceneH=h-header-footer;
 const text=(v,x,y,size=12,color='#ded8c4',align='left')=>{ctx.font=`${size}px "Rest Korean"`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(v,x,y)};
 const button=(x,y,bw,bh,label,primary=false)=>{ctx.fillStyle=primary?'#b6a371':'#14262aee';ctx.fillRect(x,y,bw,bh);ctx.strokeStyle=primary?'#dcc996':'#9aab9859';ctx.strokeRect(x+.5,y+.5,bw-1,bh-1);text(label,x+bw/2,y+bh/2+4,mobile?11:12,primary?'#152222':'#ded8c4','center')};
 ctx.fillStyle='#091416';ctx.fillRect(0,0,w,h);text('⌃',23,31,22);text('▤',w-65,29,21);text('⚙',w-29,30,23);if(before)text('길 위의 쉼터',65,31,16);
 ctx.save();ctx.beginPath();ctx.rect(0,header,w,sceneH);ctx.clip();
 const ww=before?w:w/.9,wh=before?sceneH:sceneH/.9,ox=before?0:(w-ww)/2,oy=header+(before?0:(sceneH-wh)/2),artH=wh-(before?(mobile?90:0):140),svgW=ww*(mobile?1.6:1),scale=Math.max(svgW/1600,artH/900),dy=artH-900*scale,artX=ox+(ww-1600*scale)/2,ground=oy+765*scale+dy;
 if(!before){ctx.fillStyle='#111d22';ctx.fillRect(0,header,w,sceneH);}ctx.drawImage(art,artX,oy+dy,1600*scale,900*scale);if(!before){const bottom=oy+artH,fade=ctx.createLinearGradient(0,bottom-40,0,bottom);fade.addColorStop(0,'#111d2200');fade.addColorStop(1,'#111d22');ctx.fillStyle=fade;ctx.fillRect(0,bottom-40,w,40);ctx.fillStyle='#111d22';ctx.fillRect(0,bottom,w,h-bottom);}
 for(const [i,cls]of ['archer','mage','knight','occultist'].entries()){
  const cw=before?(mobile?76:Math.min(144,w*.09)):(mobile?76:110),ch=before?(mobile?174:Math.min(270,w*.2)):(mobile?128:174),canvasH=ch-(before?38:24),aw=Math.min(cw,canvasH*220/300),ah=aw*300/220,actor=createCanvas(220,300);actor.dataset={restPerson:cls};g.HonroRestJourney.drawPeople(0,[actor]);const xs=before?(mobile?[.14,.33,.68,.87]:[.36,.44,.61,.70]):mobile?[.20,.36,.65,.81]:[.30,.40,.63,.73],x=ox+ww*xs[i],bottom=ground+(before?46:32),top=bottom-ch;
  ctx.drawImage(actor,x-aw/2,top+(canvasH-ah)/2,aw,ah);button(x-18,bottom-(before?38:24),36,24,['설오','담허','휘겸','소단'][i]);if(before)text('···',x+cw*.24,top+ch*.14,21,'#e4d5a7','center');else{const bx=x+cw*.17,by=top-54;ctx.fillStyle='#102025e6';ctx.beginPath();ctx.roundRect(bx-25,by,50,50,16);ctx.fill();text('···',bx,by+26,21,'#e4d5a7','center');}if(before)text('이야기 듣기',x,bottom-2,8,'#a9b4a6','center');actor.width=actor.height=1;
 }
 if(before){text('연목 · 지상',w*.07,header+sceneH*.07+12,11);text('고개 아래 주막',w*.07,header+sceneH*.07+54,mobile?30:42);text('주막 앞에서 고갯길이 시작된다.',w*.07,header+sceneH*.07+86,11);text('설오는 접힌 쪽지를 꺼내 행선지를 다시 살핀다.',w*.07,header+sceneH*.07+108,11);text('지나온 길',w*.05,header+sceneH*.49,9);text('산 아래 주막',w*.05,header+sceneH*.49+19,11);button(w*(mobile?.33:.5)-67,ground+(mobile?82:36)-31,135,62,'모닥불');button(w*(mobile?.76:.85)-w*.21,ground+(mobile?82:36)-31,w*.42,62,'고갯길로 진입 →');}
 else{text('1막 1장',w*.06,header+sceneH*.05+23,10);text('고개 아래 주막',w*.06+49,header+sceneH*.05+23,mobile?27:38);button(w/2-63,ground+43,126,52,'모닥불');text('동행 · 능력치 · 기예',w/2,ground+86,9,'#d3c19e','center');}
 ctx.restore();if(before){ctx.fillStyle='#0a171c';ctx.fillRect(0,h-footer,w,footer);button(12,h-footer+12,92,44,'여정첩');text('허공터 · 기예 연습',116,h-footer+38,11);if(mobile)text('1 / 30번째 길 · 연목 고갯길',12,h-8,9);}else{const left=mobile?12:w*.06,gap=mobile?6:10,available=w-left*2-gap*2,unit=mobile?available/3.55:130,y=h-18-46,start=mobile?left:(w-(unit*2+unit*1.55+gap*2))/2;button(start,y,unit,46,'◇ 여정 지도');button(start+unit+gap,y,unit,46,'허공터');button(start+unit*2+gap*2,y,unit*1.55,46,'다음 길로 진입 →',true);}
 await writeFile(`${out}/${before?'before':'after'}-${name}-native.png`,c.toBuffer('image/png'));c.width=c.height=1;
}
console.log('Six Native-only previews written to '+out);
