/** Native art-scale diagnostic from production PNGs, NOT a browser/CSS screenshot. */
import {createCanvas,loadImage,GlobalFonts} from '@napi-rs/canvas';
import sharp from 'sharp';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const out='_local/reports/title-ashen/native',asset='shared/assets/environment/title/';
await mkdir(out,{recursive:true});
GlobalFonts.registerFromPath('/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc');
const [landscape,portrait,hanja,hangul]=await Promise.all(['landscape.webp','portrait.webp','hanja-wordmark.png','wordmark.png'].map(f=>loadImage(asset+f)));
const report={scope:'Native Canvas + librsvg art composition at intended CSS scale. Button/text geometry is a diagnostic approximation, not browser, touch, or Pages approval.',assets:{},views:[]};
for(const f of ['hanja-wordmark.png','wordmark.png','landscape.webp','portrait.webp'])report.assets[f]=createHash('sha256').update(await readFile(asset+f)).digest('hex');
function text(c,t,x,y,size,color='#d6dcda',align='left'){c.font=`${size}px "Noto Serif CJK KR"`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=color;c.fillText(t,x,y);}
// Render the production filter and original alpha through SVG; no source pixels are rewritten.
const main=await readFile('shared/runtime/main.js','utf8'),inkDefs=main.match(/<defs><filter id="honro-title-ink"[\s\S]*?<\/defs>/)[0];
const [hanjaData,hangulData]=await Promise.all(['hanja-wordmark.png','wordmark.png'].map(async f=>'data:image/png;base64,'+(await readFile(asset+f)).toString('base64')));
const markCache=new Map();
async function mark(c,x,y,w){
 const h=w/1.85,sw=w*.115,sh=sw*550/575,sy=h*.48,sx=w*.97;
 if(!markCache.has(w)){
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w*1.09}" height="${h}" viewBox="0 0 ${w*1.09} ${h}">${inkDefs}<defs><clipPath id="hon-crop"><path d="M0 0H575V380H550V550H0Z"/></clipPath><clipPath id="ro-crop"><path d="M575 0H1100V550H550V380H575Z"/></clipPath></defs><g filter="url(#honro-title-ink)"><image xlink:href="${hanjaData}" width="${w}" height="${w*846/1859}"/><svg x="${sx}" y="${sy}" width="${sw}" height="${sh}" viewBox="0 0 575 550"><image xlink:href="${hangulData}" width="1100" height="550" clip-path="url(#hon-crop)"/></svg><svg x="${sx}" y="${sy+sh}" width="${sw}" height="${sh}" viewBox="525 0 575 550"><image xlink:href="${hangulData}" width="1100" height="550" clip-path="url(#ro-crop)"/></svg></g></svg>`;
  markCache.set(w,await loadImage(await sharp(Buffer.from(svg)).png().toBuffer()));
 }
 c.drawImage(markCache.get(w),x,y);
 return {x,y,width:w,hanjaHeight:w*846/1859,hangulX:x+sx,hangulY:y+sy,hangulWidth:sw,hangulHeight:sh*2,height:h,orientation:'upright 혼 then 로'};
}
for(const [w,h] of [[1440,900],[400,800],[333,740],[333,592],[844,390],[667,333]]){
 const c=createCanvas(w,h),ctx=c.getContext('2d'),p=h>w,compact=p&&h<=650,low=!p&&h<=540,tiny=low&&h<=380;
 const bg=p?portrait:landscape,scale=Math.max(w/bg.width,h/bg.height),bw=bg.width*scale,bh=bg.height*scale;
 ctx.drawImage(bg,(w-bw)*(p?1:.7),(h-bh)*(p?1:.65),bw,bh);
 if(p){let g=ctx.createLinearGradient(0,h,0,0);g.addColorStop(0,'#050e169c');g.addColorStop(.19,'#050e1600');g.addColorStop(.56,'#07131d20');g.addColorStop(1,'#07131d24');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}else{let g=ctx.createLinearGradient(0,0,w*.64,0);g.addColorStop(0,'#06111b80');g.addColorStop(1,'#06111b00');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);g=ctx.createLinearGradient(0,h,0,h*.76);g.addColorStop(0,'#050e16b3');g.addColorStop(1,'#050e1600');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}
 const mw=p?(compact?Math.min(225,w*.7):Math.min(295,w*.79)):(tiny?170:low?220:Math.min(390,w*.4));
 const gap=p?(compact?5:6):(tiny?3:low?4:7),mh=mw/1.85,tagSize=p?(compact?10:11):(tiny?9:low?10:14),tagMargin=p?(compact?10:19):(tiny?4:low?9:23),tagLine=tagSize*1.7;
 const buttonH=p?(compact?46:49):(low?44:50),buttonGap=p?(compact?5:7):(low?4:7),actionH=buttonH*2+buttonGap,tagBottomMargin=p?0:(tiny?7:low?12:35);
 const headerH=p?58:low?48:64,footerH=p?76:low?54:70,padBottom=p||low?0:28;
 const my=p?headerH+(compact?0:Math.max(8,Math.min(40,h*.037))):(tiny?headerH:headerH+Math.max(0,(h-headerH-footerH-mh-tagMargin-tagLine-tagBottomMargin-actionH-padBottom)/2));
 const mx=p?(w-mw)/2:(low?w*.06:Math.max(32,Math.min(130,w*.07)));
 const bounds=await mark(ctx,mx,my,mw),tagY=my+mh+tagMargin;
 text(ctx,'산도, 죽은 자도, 언젠가 다시 흐른다.',p?w/2:mx,tagY+tagLine/2,tagSize,'#bec6c6',p?'center':'left');
 const aw=p?Math.min(280,w*.8):(tiny?230:low?240:280),ax=p?(w-aw)/2:mx,ay=p?h*(compact?.44:.43):tagY+tagLine+tagBottomMargin;
 for(let i=0;i<2;i++){let y=ay+i*(buttonH+buttonGap);ctx.fillStyle=i?'#101f2a9e':'#b6a47a18';ctx.fillRect(ax,y,aw,buttonH);ctx.strokeStyle=i?'#bcc5c426':'#d8cba442';ctx.lineWidth=1;ctx.strokeRect(ax+.5,y+.5,aw-1,buttonH-1);text(ctx,i?'저장된 전투 이어서 걷기':'쉼터 대화 이어가기',p?ax+aw/2:ax+16,y+buttonH/2,p?(compact?14:15):(low?13:16),i?'#d6dcda':'#f1e4c6',p?'center':'left');}
 const fx=p?w*.07:low?w*.04:Math.max(24,Math.min(75,w*.05)),fy=h-footerH+10;
 for(const [t,x,bw] of [['Workshop Map',fx,low?104:118],['기록',fx+(low?110:124),low?45:50]]){ctx.fillStyle='#09151d70';ctx.fillRect(x,fy,bw,44);ctx.strokeStyle='#a9b7b52e';ctx.strokeRect(x+.5,fy+.5,bw-1,43);text(ctx,t,x+bw/2,fy+22,low?10:11,'#aeb8ba','center');}
 text(ctx,'연목의 매듭 · 울리지 않는 종',p?fx:w-fx,p?h-9:h-footerH/2+6,p?9:10,'#aeb8ba',p?'left':'right');
 ctx.strokeStyle='#c4cccf30';ctx.fillStyle='#0b182180';ctx.beginPath();ctx.arc(w-(p?38:low?36:48),headerH/2,22,0,Math.PI*2);ctx.fill();ctx.stroke();text(ctx,'⚙',w-(p?38:low?36:48),headerH/2,20,'#c8cbbb','center');
 const name=`${w}x${h}-native-art.png`;await writeFile(out+'/'+name,c.toBuffer('image/png'));report.views.push({width:w,height:h,file:name,mark:bounds,tagY,actionY:ay,actionBottom:ay+actionH,footerY:fy});console.log(name);
}
// Actual title-size letter samples expose fringe/noise over a constant dark ground.
const c=createCanvas(760,550),ctx=c.getContext('2d');ctx.fillStyle='#091620';ctx.fillRect(0,0,c.width,c.height);await mark(ctx,20,40,390);await mark(ctx,440,40,263);await mark(ctx,460,290,170);text(ctx,'390 px / desktop',30,320,15);text(ctx,'263 px / 333 px portrait',460,225,13);text(ctx,'170 px / short landscape',460,420,13);text(ctx,'NATIVE ART REVIEW · production alpha at display scale',30,510,14,'#849799');await writeFile(out+'/mark-real-size.png',c.toBuffer('image/png'));await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');
