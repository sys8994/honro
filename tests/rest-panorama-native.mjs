/** Native SVG/Canvas composition evidence, not browser CSS or touch proof. */
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {createCanvas,loadImage,Path2D,GlobalFonts} from '@napi-rs/canvas';
GlobalFonts.registerFromPath('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','Rest Korean');
const out='_local/reports/rest-panorama';await mkdir(out,{recursive:true});
const g=vm.createContext({atob:s=>Buffer.from(s,'base64').toString('binary'),HONRO_CONTENT:{},HONRO_CORE:{},document:{},Path2D,matchMedia:()=>({matches:false})});
for(const f of ['shared/map/environment.js','shared/runtime/party-rig.js','shared/assets/party/party.runtime.js','shared/runtime/journey-art.js','shared/runtime/rest-journey.js'])vm.runInContext(await readFile(f,'utf8'),g);
g.HONRO_ACT1_FAR_DATA={};for(const [key,file]of [['mountains','act1-far.svg'],['gorge','act1-gorge.svg']])g.HONRO_ACT1_FAR_DATA[key]='data:image/svg+xml;base64,'+Buffer.from((await readFile('shared/assets/environment/'+file,'utf8')).replace(/\bstroke="[^"]*"/g,'stroke="none"')).toString('base64');
const before=vm.createContext({});vm.runInContext(execFileSync('git',['show','5bbf19f:shared/runtime/journey-art.js'],{encoding:'utf8'}),before);
for(let stage=1;stage<=10;stage++){const art=g.HonroJourneyArt.scene('forest','surface',stage);assert(art.includes(`data-rest-backdrop="${stage<6?'mountains':'gorge'}"`));assert(!art.includes('data-art-layer="distant-ink-mountains"'));for(const match of Buffer.from(g.HONRO_ACT1_FAR_DATA[stage<6?'mountains':'gorge'].split(',')[1],'base64').toString().matchAll(/\sd="([^"]+)"/g))assert(art.includes(match[0]),'approved path shape preserved');assert(art.includes('data-art-layer="campaign-distant-landscape"'));assert(!art.includes('<image '));}
assert(!g.HonroJourneyArt.scene('cave','underground',14).includes('data-rest-backdrop'));
const rows=[];
for(const [label,w,h]of [['phone',390,844],['small-phone',320,700],['desktop',1280,800]])for(const stage of [1,8])for(const mode of ['before','center','left','right']){
 const old=mode==='before',c=createCanvas(w,h),ctx=c.getContext('2d'),header=50,sh=h-header,mobile=w<=700;
 const geom=old?{width:w/.9,height:sh/.9}:g.HonroRestJourney.restGeometry(w,sh),ww=geom.width,wh=geom.height,artH=wh-140,scale=old?Math.max(ww*(mobile?1.6:1)/1600,artH/900):geom.scale,dy=artH-900*scale;
 const pan=mode==='left'?(ww-w)/2:mode==='right'?-(ww-w)/2:0,ox=(w-ww)/2+pan,oy=header+(sh-wh)/2,ground=oy+765*scale+dy;
 let svg=(old?before.HonroJourneyArt:g.HonroJourneyArt).scene('forest','surface',stage);if(!old&&pan)svg=svg.replace(/data-rest-backdrop="([^"]+)"/,`data-rest-backdrop="$1" transform="translate(${-pan/scale*(1-g.HonroEnvironment.ACT1_FAR.panX)} 0)"`);const art=await loadImage(Buffer.from(svg));
 const text=(s,x,y,size=12,color='#ded8c4',align='left')=>{ctx.font=`${size}px "Rest Korean"`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(s,x,y)};
 const button=(x,y,bw,bh,s,primary=false)=>{ctx.fillStyle=primary?'#b6a371':'#14262aee';ctx.fillRect(x,y,bw,bh);ctx.strokeStyle=primary?'#dcc996':'#9aab9859';ctx.strokeRect(x+.5,y+.5,bw-1,bh-1);text(s,x+bw/2,y+bh/2+4,mobile?11:12,primary?'#152222':'#ded8c4','center')};
 ctx.fillStyle='#091416';ctx.fillRect(0,0,w,h);text('⌃',23,31,22);text('▤',w-65,29,21);text('⚙',w-29,30,23);
 ctx.save();ctx.beginPath();ctx.rect(0,header,w,sh);ctx.clip();ctx.fillStyle='#111d22';ctx.fillRect(0,header,w,sh);ctx.drawImage(art,ox+(ww-1600*scale)/2,oy+dy,1600*scale,900*scale);
 const bottom=oy+artH,fade=ctx.createLinearGradient(0,bottom-40,0,bottom);fade.addColorStop(0,'#111d2200');fade.addColorStop(1,'#111d22');ctx.fillStyle=fade;ctx.fillRect(0,bottom-40,w,40);ctx.fillStyle='#111d22';ctx.fillRect(0,bottom,w,h-bottom);
 const campWidth=w/.9,campLeft=(w-campWidth)/2+pan;
 for(const [i,cls]of (stage===1?['archer']:['archer','mage','knight']).entries()){const cw=mobile?76:110,ch=mobile?128:174,ah=mobile?104:150,x=campLeft+campWidth*(mobile?[.20,.36,.65][i]:[.30,.40,.63][i]),actor=createCanvas(220,300);actor.dataset={restPerson:cls};g.HonroRestJourney.drawPeople(0,[actor]);ctx.drawImage(actor,x-cw/2,ground+32-ch,cw,ah);button(x-18,ground+8,36,24,['설오','담허','휘겸'][i]);actor.width=actor.height=1;}
 button(w/2+pan-63,ground+43,126,52,'모닥불');text('동행 · 능력치 · 기예',w/2+pan,ground+86,9,'#d3c19e','center');
 text(`1막 ${stage}장`,w*.06,header+sh*.05+23,10);text(stage===8?'창고 앞 길목':'고개 아래 주막',w*.06+49,header+sh*.05+23,mobile?27:38);ctx.restore();
 if(Math.abs(pan)>w*.3)button(w-106,h-122,94,44,'모닥불로 ↩');
 const left=mobile?12:w*.06,gap=mobile?6:10,available=w-left*2-gap*2,unit=mobile?available/3.55:130,y=h-18-46,start=mobile?left:(w-(unit*3.55+gap*2))/2;button(start,y,unit,46,'◇ 여정 지도');button(start+unit+gap,y,unit,46,'허공터');button(start+unit*2+gap*2,y,unit*1.55,46,'다음 길로 진입 →',true);
 const file=`${out}/${label}-stage${stage}-${mode}.png`;await writeFile(file,c.toBuffer('image/png'));rows.push({file,mode,stage,w,h,pan,worldWidth:ww});c.width=c.height=1;
}
await writeFile(out+'/summary.json',JSON.stringify({rows,limits:'Native SVG rasterization and mirrored production CSS geometry. Not browser layout, touch, performance, or deployed verification.'},null,2));console.log('PASS exact Act1 image identity, all stage variations, underground isolation; 24 Native composition previews:',out);
