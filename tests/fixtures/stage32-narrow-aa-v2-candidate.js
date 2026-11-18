(function(G){'use strict';
// Stage 32 only. Original 25 path geometries/order remain verbatim. The limited
// non-walk band (source y780..904) transitions pale/green to the existing material.
// Research: bounded native supersample RGB correction only in nonwalk world1420..1716.
// Source geometry, grass fills and original clips/order remain unchanged.
// Rasterize one shared world-coordinate material into the current device plane;
// every geology clip then samples the same bitmap without repeated vector AA.
if(G.HonroStage32FoundationArt)return;
const FOUNDATION='act4-handoff:32:foundation',BODY='act4-handoff:32:body-shared-material';
const MAX_PIXELS=8*1024*1024,prepared=new WeakMap();
const MAX_TRANSITION_PIXELS=1024*1024;
let buffer=null,bufferContext=null,last=null;
let transitionWork=null,transitionColor=null,transitionBody=null;
const transitionCounters={fills:0,passes:0,boundaryPasses:0,allocations:0,resizes:0,bytes:0,peakBytes:0,skips:0,lastSkip:null};
function transitionMemory(){
 transitionCounters.bytes=[transitionWork,transitionColor,transitionBody].reduce((n,c)=>n+(c?c.width*c.height*4:0),0);
 transitionCounters.peakBytes=Math.max(transitionCounters.peakBytes,transitionCounters.bytes);
}
function transitionCanvas(){
 const cv=G.document?.createElement?.('canvas');if(!cv||!cv.getContext('2d'))return null;
 cv.width=1;cv.height=1;transitionCounters.allocations++;return cv;
}
function resizeTransition(cv,w,h){
 if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;transitionCounters.resizes++;transitionMemory();}
}
function canTransition(c,l){
 const m=c.getTransform(),w=c.canvas.width,h=c.canvas.height;
 let reason=null;
 if(m.b!==0||m.c!==0||m.a<=0||m.d<=0)reason='non-axis-aligned';
 else if(c.globalAlpha!==1||(l.opacity??1)!==1||c.globalCompositeOperation!=='source-over'||c.filter&&c.filter!=='none'||c.shadowBlur||c.shadowOffsetX||c.shadowOffsetY)reason='paint-state';
 else if(w*h>MAX_TRANSITION_PIXELS)reason='transition-pixel-cap';
 else if(!G.document?.createElement)reason='canvas-unavailable';
 if(!reason){
  transitionWork??=transitionCanvas();transitionColor??=transitionCanvas();transitionBody??=transitionCanvas();
  if(!transitionWork||!transitionColor||!transitionBody)reason='canvas-unavailable';transitionMemory();
 }
 if(reason){transitionCounters.skips++;transitionCounters.lastSkip=reason;return false;}
 return true;
}
const counters={rasterizations:0,hits:0,allocations:0,resizes:0,bytes:0,peakBytes:0,fallbacks:0,lastFallback:null};
const d=n=>typeof n.d==='string'?n.d:Array.isArray(n.dParts)?n.dParts.join(''):null;
function fallback(reason){counters.fallbacks++;counters.lastFallback=reason;return false;}
function geometry(asset){
 if(prepared.has(asset))return prepared.get(asset);
 const q={};
 if(asset.id===FOUNDATION){
  const v=asset.vector,r=v?.root,g=r?.children?.[0],field=g?.children?.[0];
  if(asset.params?.stage32SharedMaterial!==1||r?.transform?.join(',')!=='7.2,0,0,7.2,0,0'||g?.clipPath!=='source-alpha-silhouette'||!field?.transform||!field.children?.length)return null;
  q.silhouette=new G.Path2D(v.clips[g.clipPath].join(''));
  q.fieldTransform=field.transform;
  q.field=field.children.map(n=>({path:new G.Path2D(d(n)),fill:n.fill}));
 }else{
  const cfg=asset.params?.stage32SharedMaterial;
  if(cfg?.version!==1||cfg.bodyScale!==2.2||!Array.isArray(cfg.protectedPaths))return null;
  const nodes=[];function walk(n){if(n.tag==='path')nodes.push(n);for(const child of n.children||[])walk(child);}walk(asset.vector.root);
  if(nodes.length!==25||cfg.sourcePathSHA256?.length!==25||!asset.vector.clips?.portApron)return null;
  q.apron=new G.Path2D(asset.vector.clips.portApron.join(''));
  const protect=new Set(cfg.protectedPaths);
  q.paths=nodes.map((n,i)=>{
   const path=d(n),indices=cfg.graySubpaths?.[i],subs=indices?path.match(/[Mm][^Mm]*/g):null;
   if(indices?.some(j=>!Number.isInteger(j)||!subs[j]))throw Error('Invalid Stage 32 original subpath index');
   return {sourceIndex:i,path:new G.Path2D(path),fill:n.fill,rule:n.fillRule||'nonzero',protected:protect.has(i),gray:indices?new G.Path2D(indices.map(j=>subs[j]).join('')):null};
  });
 }
 prepared.set(asset,q);return q;
}
function material(c,asset){
 const w=c.canvas?.width,h=c.canvas?.height,m=c.getTransform();
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w*h>MAX_PIXELS)return null;
 const matrix=[m.a,m.b,m.c,m.d,m.e,m.f];if(matrix.some(v=>!Number.isFinite(v)))return null;
 const style=G.HonroVisualStyle?.key?.()||'',key=[w,h,...matrix,style].join('|');
 if(last?.context===c&&last.asset===asset&&last.key===key){counters.hits++;return buffer;}
 if(!buffer){buffer=typeof G.OffscreenCanvas==='function'?new G.OffscreenCanvas(w,h):G.document?.createElement('canvas');if(!buffer)return null;counters.allocations++;}
 if(buffer.width!==w||buffer.height!==h){buffer.width=w;buffer.height=h;counters.resizes++;}
 bufferContext=buffer.getContext('2d');if(!bufferContext)return null;
 const q=geometry(asset);if(!q)return null;
 const cc=bufferContext;cc.setTransform(1,0,0,1,0,0);cc.globalAlpha=1;cc.globalCompositeOperation='source-over';cc.filter='none';cc.clearRect(0,0,w,h);
 cc.setTransform(...matrix);cc.translate(-5500,-1950);cc.scale(7.2,7.2);cc.transform(...q.fieldTransform);
 for(const n of q.field){cc.fillStyle=n.fill;cc.fill(n.path);}
 counters.rasterizations++;counters.bytes=w*h*4;counters.peakBytes=Math.max(counters.peakBytes,counters.bytes);
 last={context:c,asset,key};return buffer;
}
function bitmap(c,cv){c.save();c.setTransform(1,0,0,1,0,0);c.drawImage(cv,0,0);c.restore();}
// Research-only device-space supersampling. No source geometry modifications.
const SS=2,MAX_SS_PIXELS=1024*1024;
let ssCanvas=null,lowMaskCanvas=null;
let combinedPeakLogicalBytes=0;
function combinedMemory(liveReadbacks){const total=counters.bytes+transitionCounters.bytes+ssStats.scratchBytes+narrowStats.scratchBytes+liveReadbacks;combinedPeakLogicalBytes=Math.max(combinedPeakLogicalBytes,total);if(total>24*1024*1024)throw Error('Full retained-canvas plus live-readback cap');return total;}

const ssStats={calls:0,stripes:0,emptyStripes:0,highRasterStripes:0,eligibilityScanPixels:0,eligible:0,corrected:0,opaqueGrassSkipped:0,protectedPaletteSkipped:0,roadSkipped:0,subpixelRoadSkipped:0,unresolvedHolesSkipped:0,alphaChanged:0,skips:0,allocations:0,resizes:0,scratchBytes:0,peakLogicalBytes:0,readbackBytes:0,ms:0,factor:SS};
function boxMean(data,width,x,y,n){let sa=0,sr=0,sg=0,sb=0;for(let j=0;j<n;j++)for(let i=0;i<n;i++){const k=((y*n+j)*width+x*n+i)*4,a=data[k+3];sa+=a;sr+=data[k]*a;sg+=data[k+1]*a;sb+=data[k+2]*a;}return{r:sa?sr/sa:0,g:sa?sg/sa:0,b:sa?sb/sa:0,a:sa/(n*n),sumAlpha:sa};}
function sized(cv,w,h){if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w*h>MAX_SS_PIXELS)throw Error('Supersample scratch bounds');if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;ssStats.resizes++;}if(cv.width!==w||cv.height!==h)throw Error('Supersample resize mismatch');}
function coherentColor(c,cv,q){
 const m=c.getTransform(),world=m.d/2.2;
 if(m.b||m.c||m.a<=0||m.d<=0||c.globalAlpha!==1||c.globalCompositeOperation!=='source-over'||c.filter&&c.filter!=='none'||c.shadowBlur||c.shadowOffsetX||c.shadowOffsetY)return;
 const y0=Math.max(0,Math.ceil(world*1420+m.f)),y1=Math.min(c.canvas.height,Math.floor(world*1716+m.f)),w=c.canvas.width,h=y1-y0;
 if(h<=0)return;if(!Number.isInteger(w)||w<1||w*h>MAX_SS_PIXELS||w*SS>MAX_SS_PIXELS){ssStats.skips++;return;}
 const start=G.performance.now();ssStats.calls++;
 if(!ssCanvas){ssCanvas=G.document.createElement('canvas');lowMaskCanvas=G.document.createElement('canvas');ssStats.allocations+=2;}
 sized(lowMaskCanvas,w,h);const low=lowMaskCanvas.getContext('2d');low.setTransform(1,0,0,1,0,0);low.globalAlpha=1;low.globalCompositeOperation='copy';low.fillStyle='#000';low.fillRect(0,0,w,h);low.globalCompositeOperation='source-over';low.setTransform(m.a/2.2,0,0,m.d/2.2,m.e,m.f-y0);low.save();low.clip(q.apron);low.scale(2.2,2.2);
 for(const p of q.paths){low.fillStyle=p.sourceIndex>=21?'#00ffff':p.sourceIndex>=12&&p.sourceIndex<=17?'#ff00ff':'#0000ff';low.fill(p.path,p.rule);}low.restore();
 const fixedBytes=counters.bytes+transitionCounters.bytes+narrowStats.scratchBytes;
 if(fixedBytes+16*w*h+ssCanvas.width*ssCanvas.height*4>24*1024*1024)sized(ssCanvas,1,1);
 ssStats.scratchBytes=(ssCanvas.width*ssCanvas.height+w*h)*4;combinedMemory(12*w*h);
 const packed=low.getImageData(0,0,w,h).data,old=c.getImageData(0,y0,w,h),data=old.data,field=cv.getContext('2d').getImageData(0,y0,w,h).data;
 if(packed.length!==4*w*h||data.length!==4*w*h||field.length!==4*w*h)throw Error('Supersample low readback dimensions');
 const protectedColors=q.paths.filter(p=>p.sourceIndex>=12&&p.sourceIndex<=17||p.sourceIndex>=21).map(p=>{const h=p.fill.slice(1);return[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));});
 const maxHighPixels=Math.min(MAX_SS_PIXELS,Math.floor((24*1024*1024-counters.bytes-transitionCounters.bytes-narrowStats.scratchBytes-16*w*h)/12)),rows=Math.min(h,Math.floor(maxHighPixels/(w*SS*SS)));if(rows<1)throw Error('Supersample minimum stripe cannot fit');
 for(let sy=0;sy<h;sy+=rows){const count=Math.min(rows,h-sy),hw=w*SS,hh=count*SS;sized(ssCanvas,hw,hh);ssStats.stripes++;const hi=ssCanvas.getContext('2d');
  // Test-only optimization: preserve all low reads, canvas dimensions and final
  // putImageData roundtrip. Skip only high raster/readback if no RGB can change.
  let anyEligible=false;
  for(let y=0;y<count&&!anyEligible;y++)for(let x=0;x<w;x++){
   const k=((sy+y)*w+x)*4;ssStats.eligibilityScanPixels++;
   if(!packed[k]||packed[k]===255||packed[k+1]||packed[k+2]!==255||data[k+3]!==255||field[k+3]!==255)continue;
   if(protectedColors.some(v=>v[0]===data[k]&&v[1]===data[k+1]&&v[2]===data[k+2]))continue;
   anyEligible=true;break;
  }
  if(!anyEligible){
   ssStats.emptyStripes++;
   // Preserve diagnostic counts for each skipped original low-pixel branch.
   for(let y=0;y<count;y++)for(let x=0;x<w;x++){
    const k=((sy+y)*w+x)*4;if(!packed[k])continue;
    if(packed[k]===255){ssStats.opaqueGrassSkipped++;continue;}
    if(packed[k+1]){ssStats.roadSkipped++;continue;}
    if(packed[k+2]!==255||data[k+3]!==255||field[k+3]!==255)continue;
    if(protectedColors.some(v=>v[0]===data[k]&&v[1]===data[k+1]&&v[2]===data[k+2]))ssStats.protectedPaletteSkipped++;
   }
   ssStats.scratchBytes=(hw*hh+w*h)*4;ssStats.readbackBytes=3*w*h*4;
   ssStats.peakLogicalBytes=Math.max(ssStats.peakLogicalBytes,ssStats.scratchBytes+ssStats.readbackBytes);
   if(ssStats.peakLogicalBytes>24*1024*1024)throw Error('Supersample logical memory bound');combinedMemory(ssStats.readbackBytes);
   continue;
  }
  ssStats.highRasterStripes++;

  function reset(){hi.setTransform(1,0,0,1,0,0);hi.globalAlpha=1;hi.globalCompositeOperation='source-over';hi.clearRect(0,0,hw,hh);hi.imageSmoothingEnabled=false;hi.setTransform(m.a/2.2*SS,0,0,m.d/2.2*SS,m.e*SS,(m.f-y0-sy)*SS);hi.save();hi.clip(q.apron);hi.scale(2.2,2.2);}
  reset();for(const p of q.paths){if(p.protected){hi.fillStyle=p.fill;hi.fill(p.path,p.rule);}else{hi.save();hi.clip(p.path,p.rule);hi.save();hi.setTransform(1,0,0,1,0,0);hi.drawImage(cv,0,y0+sy,w,count,0,0,hw,hh);hi.restore();if(p.gray){hi.fillStyle=p.fill;hi.fill(p.gray,p.rule);}hi.restore();}}hi.restore();
  const colors=hi.getImageData(0,0,hw,hh).data;
  reset();for(const p of q.paths){hi.fillStyle=p.sourceIndex>=21?'#00ff00':p.sourceIndex>=12&&p.sourceIndex<=17?'#ff0000':'#000';hi.fill(p.path,p.rule);}hi.restore();const labels=hi.getImageData(0,0,hw,hh).data;
  if(colors.length!==hw*hh*4||labels.length!==hw*hh*4)throw Error('Supersample high readback dimensions');
  ssStats.scratchBytes=(hw*hh+w*h)*4;ssStats.readbackBytes=(2*hw*hh+3*w*h)*4;ssStats.peakLogicalBytes=Math.max(ssStats.peakLogicalBytes,ssStats.scratchBytes+ssStats.readbackBytes);if(ssStats.peakLogicalBytes>24*1024*1024)throw Error('Supersample logical memory bound');combinedMemory(ssStats.readbackBytes);
  for(let y=0;y<count;y++)for(let x=0;x<w;x++){const k=((sy+y)*w+x)*4;if(!packed[k])continue;if(packed[k]===255){ssStats.opaqueGrassSkipped++;continue;}if(packed[k+1]){ssStats.roadSkipped++;continue;}if(packed[k+2]!==255||data[k+3]!==255||field[k+3]!==255)continue;if(protectedColors.some(v=>v[0]===data[k]&&v[1]===data[k+1]&&v[2]===data[k+2])){ssStats.protectedPaletteSkipped++;continue;}ssStats.eligible++;
   const label=boxMean(labels,hw,x,y,SS),color=boxMean(colors,hw,x,y,SS);if(label.sumAlpha!==255*SS*SS||color.sumAlpha!==255*SS*SS){ssStats.unresolvedHolesSkipped++;continue;}if(label.g>0){ssStats.subpixelRoadSkipped++;continue;}if(packed[k]<=label.r+1)continue;
   const wy=(sy+y+y0+.5-m.f)/world,t=Math.max(0,Math.min(1,(wy-1420)/40)),weight=t*t*(3-2*t),rgb=[color.r,color.g,color.b].map((v,j)=>Math.round(data[k+j]+weight*(Math.round(v)-data[k+j])));if(rgb.some((v,j)=>v!==data[k+j])){for(let j=0;j<3;j++)data[k+j]=rgb[j];ssStats.corrected++;}
  }
 }
 c.putImageData(old,0,y0);ssStats.ms+=G.performance.now()-start;
}


// Independent test-only narrow correction. Original vectors remain unmodified.
const narrowROIs=[{"name":"left","x":25,"y":1540,"w":145,"h":330,"guard":"M800 330L820 300L840 269L850 255L850 258L848 260.80078L846 263.59961L844 266.40039L842 269.19922L840 272L836 278.19922L834 281.30078L826 293.69922L824 296.80078L820 303L800 333L796 339.19922L794 342.30078L788 351.59961L787.13281 352.94257L786.49603 352.92981L785.22266 352.9043L786.1778 351.42386L800 330ZM835 417L848.71997 444.44L850 463L850 463.85645L849.22852 463.82422L848 446L835 420L834 418.73828L820 401.08789L818 398.56445L812 391L808 386.27344L806 383.9082L796 372.0918L794 369.72656L790 365L788 364.96094L786 364.91992L784 364.88086L782 364.83984L780 364.80078L778 364.75977L776 364.7207L774 364.67969L772 364.64062L770 364.59961L768 364.56055L766 364.51953L764 364.48047L762 364.43945L760 364.40039L758 364.35938L756 364.32031L754 364.2793L752 364.24023L750 364.19922L748 364.16016L746 364.11914L744 364.08008L742 364.03906L740 364L650 364L650 361L740 361L790 362L812 388L835 417ZM740 352L780 352.80078L778 352.75977L776 352.7207L774 352.67969L772 352.64062L770 352.59961L768 352.56055L766 352.51953L764 352.48047L762 352.43945L760 352.40039L758 352.35938L756 352.32031L754 352.2793L752 352.24023L750 352.19922L748 352.16016L746 352.11914L744 352.08008L742 352.03906L740 352ZM360 393L363 390.59961L361 392.19922L360 393ZM750 467L825.41016 471.71289L827.37695 471.83594L824.75366 473.67157L823.44141 474.58984L822 474.5L750 470L749 469.2793L743 464.96094L741 463.51953L737 460.64062L735 459.19922L729 454.88086L727 453.43945L725 452L723 450.34375L721 448.68555L719 447.0293L717 446L715 444L713 443L711 441L709 440L707 438L705 437L703 435L701 434L699 432L697 431L695 429L693 428L689 424L687 423L685 421L683 420L679 416L675 414L673 412L671 411L669 409.34961L667 408.05078L665 407L661 405L659 405L655 403L653 403L651 402L649 402L647 401L643 401L641 400L631 400L629 399L595 399L593 398L547 398L545 397L370 397L369 397.80078L361 404.19922L359 405.80078L351 412.19922L349 413.80078L345 417L320 442L300 457L295 457.27344L293 457.38086L281 458.03711L279 458.14453L267 458.80078L265 458.9082L253 459.56445L251 459.67188L245 460L37 460L35 461L35 457L245 457L300 454L320 439L345 414L370 394L650 394L690 420L725 449L750 467ZM350 401L353 398.59961L351 400.19922L350 401ZM1300 404L1490 404L1490 407L1300 407L1296 409.80078L1294 411.19922L1286 416.80078L1284 418.19922L1276 423.80078L1274 425.19922L1270 428L1264 433.80078L1262 435.73242L1248 449.26758L1246 451.19922L1240 457L1238 458.44922L1236 459.90039L1234 461.34961L1232 462.80078L1228 465.69922L1226 467.15039L1224 468.59961L1222 470.05078L1218 472.94922L1216 474.40039L1214 475.84961L1212 477.30078L1208 480.19922L1206 481.65039L1204 483.09961L1202 484.55078L1200 486L1198 485.96094L1196 485.91992L1194 485.88086L1192 485.83984L1190 485.80078L1188 485.75977L1186 485.7207L1184 485.67969L1182 485.64062L1180 485.59961L1178 485.56055L1176 485.51953L1174 485.48047L1172 485.43945L1170 485.40039L1168 485.35938L1166 485.32031L1164 485.2793L1162 485.24023L1160 485.19922L1158 485.16016L1156 485.11914L1154 485.08008L1152 485.03906L1148 484.96094L1146 484.91992L1144 484.88086L1142 484.83984L1140 484.80078L1138 484.75977L1136 484.7207L1134 484.67969L1132 484.64062L1130 484.59961L1128 484.56055L1126 484.51953L1124 484.48047L1122 484.43945L1120 484.40039L1118 484.35938L1116 484.32031L1114 484.2793L1112 484.24023L1110 484.19922L1108 484.16016L1106 484.11914L1104 484.08008L1102 484.03906L1100 484L1076 483.03906L1074 482.96094L1026 481.03906L1024 480.96094L1000 480L998 479.96094L996 479.91992L994 479.88086L992 479.83984L990 479.80078L988 479.75977L986 479.7207L984 479.67969L982 479.64062L980 479.59961L978 479.56055L976 479.51953L974 479.48047L972 479.43945L970 479.40039L968 479.35938L966 479.32031L964 479.2793L962 479.24023L960 479.19922L958 479.16016L956 479.11914L954 479.08008L952 479.03906L948 478.96094L946 478.91992L944 478.88086L942 478.83984L940 478.80078L938 478.75977L936 478.7207L934 478.67969L932 478.64062L930 478.59961L928 478.56055L926 478.51953L924 478.48047L922 478.43945L920 478.40039L918 478.35938L916 478.32031L914 478.2793L912 478.24023L910 478.19922L908 478.16016L906 478.11914L904 478.08008L902 478.03906L900 478L892 477.65625L890 477.57227L874 476.88477L872 476.80078L858 476.19922L856 476.11523L840 475.42773L839.42383 475.4043L838 476.40039L836 477.80078L834 479.19922L826 484.80078L824 486.19922L820 489L796 513.96094L795 515L794 516.34961L792 519.05078L788 524.44922L786 527.15039L784 529.84961L782 532.55078L778 537.94922L776 540.65039L775 542L774 543.19922L766 552.80078L764 555.19922L756 564.80078L754 567.19922L750 572L748 574.80078L746 577.59961L744 580.40039L742 583.19922L738 588.80078L736 591.59961L734 594.40039L733.40619 595.23077L732.74615 595.15381L731.42773 595L732.41663 593.61566L750 569L775 539L795 512L820 486L839.42383 472.4043L900 475L1000 477L1100 481L1200 483L1240 454L1270 425L1300 404ZM289 445.59961L294.14496 445.31937L293 445.38086L289 445.59961ZM275 446.36328L280.09781 446.08557L279 446.14453L275 446.36328ZM263.00003 447.01801L266.05072 446.85178L265 446.9082L263.32031 447L263.00003 447.01801ZM252.00555 447.61789L247 447.89062L251 447.67188L252.00555 447.61789ZM390 535L460 559L530 581L610 589L680 598L740 605L790 612L850 619L850 622L848 621.76758L846 621.5332L844 621.30078L842 621.06641L840 620.83398L838 620.59961L836 620.36719L834 620.13281L832 619.90039L830 619.66602L828 619.43359L826 619.19922L824 618.9668L822 618.73242L818 618.26758L816 618.0332L814 617.80078L812 617.56641L810 617.33398L808 617.09961L806 616.86719L804 616.63281L802 616.40039L800 616.16602L798 615.93359L796 615.69922L794 615.4668L792 615.23242L790 615L788 614.7207L786 614.43945L782 613.88086L780 613.59961L778 613.32031L776 613.03906L772 612.48047L770 612.19922L766 611.64062L764 611.35938L760 610.80078L758 610.51953L754 609.96094L752 609.67969L750 609.40039L748 609.11914L744 608.56055L742 608.2793L740 608L738 607.76758L736 607.5332L734 607.30078L732 607.06641L730 606.83398L728 606.59961L726 606.36719L724 606.13281L722 605.90039L720 605.66602L718 605.43359L716 605.19922L714 604.9668L712 604.73242L708 604.26758L706 604.0332L704 603.80078L702 603.56641L700 603.33398L698 603.09961L696 602.86719L694 602.63281L692 602.40039L690 602.16602L688 601.93359L686 601.69922L684 601.4668L682 601.23242L680 601L678 600.74219L676 600.48633L672 599.9707L670 599.71484L666 599.19922L664 598.94336L660 598.42773L658 598.17188L654 597.65625L652 597.40039L648 596.88477L646 596.62891L644 596.37109L642 596.11523L638 595.59961L636 595.34375L632 594.82812L630 594.57227L626 594.05664L624 593.80078L622 603L620 603L618 602L616 602L610 599L604 593L602 591.19922L598 590.80078L596 590.59961L594 590.40039L592 590.19922L588 589.80078L586 589.59961L584 589.40039L582 589.19922L578 588.80078L576 588.59961L574 588.40039L572 588.19922L568 587.80078L566 587.59961L564 587.40039L562 587.19922L558 586.80078L556 586.59961L554 586.40039L552 586.19922L548 585.80078L546 585.59961L544 585.40039L542 585.19922L538 584.80078L536 584.59961L534 584.40039L532 584.19922L530 584L526 582.74219L524 582.11523L514 578.9707L512 578.34375L502 575.19922L500 574.57227L490 571.42773L488 570.80078L478 567.65625L476 567.0293L466 563.88477L464 567L462 568L458 568L454 566L452 566L446 563L444 563L440 561L438 561L432 558L430 558L422 554L420 554L414 551L412 551L406 548L404 548L398 545L396 545L392 543L390 543L386 541L384 541L380 539L378 539L376 538L374 538L372 537L370 537L366 535L364 535L362 534L360 534L358 533L356 533L354 532L352 532L350 531L348 531L346 530L344 530L342 529L340 529L338 524.13281L330 522L330 519L390 535ZM580 560L597.88477 577.28711L599.61523 578.96094L597.3067 578.72986L592.14258 578.21289L592 578L588 574L586 571L582 567L580 564L576 560L574 558.40039L566 552.26758L564 550.73242L554 543.06641L552 542L550 542L548 541L546 541L544 540L540 540L538 539.40039L536 539.30078L534 539.19922L526 538.80078L524 538.69922L516 538.30078L514 538.19922L510 538L510 535L550 537L580 560ZM11.363636 700L34.380932 700L34.495968 700.58984L34.75713 700L34.820953 700L34.789215 700.08026C34.707752 700.28564 34.62138 700.49786 34.522778 700.72668L35.746094 707L36.507812 710.89844L36.507812 710.9043L38.380859 720.5L38.308594 728.41992L38.277344 731.86719L38.28532 732.31458C38.343388 735.56207 38.401924 738.83575 38.193359 741.01758L38.171875 743.23242L37.746094 743.82812L37.746094 743.83008L35.220703 747.36719L32.267578 751.5L30.263672 755.5L28.359375 759.29688L28.257812 759.5L28.726562 784L29.036697 800.20703L29.037048 800.22852L29.046875 800.74219L29.048828 800.88867L29.054108 801.17773L29.05607 801.28516L29.057241 801.31641L29.195312 808.5L29.152344 808.5957L24.597656 818.76953L23.561813 821.08368L22.850718 822.6723L22.849609 822.67188L22.005205 824.56122L21.71447 825.21075L20.255377 828.47046L20 829.04102L20 850L11.363636 850L11.363636 700ZM710 592.5L713.99994 592.9671L718 593.43359L716 593.19922L714 592.9668L712 592.73242L710 592.5ZM718 593.43384L722 593.90057L726 594.36725L730 594.83398L728 594.59961L726 594.36725L724 594.13281L722 593.90057L720 593.66602L718 593.43384ZM40.470444 721.78802C40.487919 721.79584 40.507645 721.80176 40.529583 721.8056C41.072948 721.90155 42.973801 720.7901 45.689308 718.87622C42.536392 721.00616 41.029282 721.91632 40.470444 721.78802Z"},{"name":"arch","x":1900,"y":1490,"w":160,"h":220,"guard":"M800 330L820 300L840 269L850 255L850 258L848 260.80078L846 263.59961L844 266.40039L842 269.19922L840 272L836 278.19922L834 281.30078L826 293.69922L824 296.80078L820 303L800 333L796 339.19922L794 342.30078L788 351.59961L787.13281 352.94257L786.49603 352.92981L785.22266 352.9043L786.1778 351.42386L800 330ZM835 417L848.71997 444.44L850 463L850 463.85645L849.22852 463.82422L848 446L835 420L834 418.73828L820 401.08789L818 398.56445L812 391L808 386.27344L806 383.9082L796 372.0918L794 369.72656L790 365L788 364.96094L786 364.91992L784 364.88086L782 364.83984L780 364.80078L778 364.75977L776 364.7207L774 364.67969L772 364.64062L770 364.59961L768 364.56055L766 364.51953L764 364.48047L762 364.43945L760 364.40039L758 364.35938L756 364.32031L754 364.2793L752 364.24023L750 364.19922L748 364.16016L746 364.11914L744 364.08008L742 364.03906L740 364L650 364L650 361L740 361L790 362L812 388L835 417ZM740 352L780 352.80078L778 352.75977L776 352.7207L774 352.67969L772 352.64062L770 352.59961L768 352.56055L766 352.51953L764 352.48047L762 352.43945L760 352.40039L758 352.35938L756 352.32031L754 352.2793L752 352.24023L750 352.19922L748 352.16016L746 352.11914L744 352.08008L742 352.03906L740 352ZM360 393L363 390.59961L361 392.19922L360 393ZM750 467L825.41016 471.71289L827.37695 471.83594L824.75366 473.67157L823.44141 474.58984L822 474.5L750 470L749 469.2793L743 464.96094L741 463.51953L737 460.64062L735 459.19922L729 454.88086L727 453.43945L725 452L723 450.34375L721 448.68555L719 447.0293L717 446L715 444L713 443L711 441L709 440L707 438L705 437L703 435L701 434L699 432L697 431L695 429L693 428L689 424L687 423L685 421L683 420L679 416L675 414L673 412L671 411L669 409.34961L667 408.05078L665 407L661 405L659 405L655 403L653 403L651 402L649 402L647 401L643 401L641 400L631 400L629 399L595 399L593 398L547 398L545 397L370 397L369 397.80078L361 404.19922L359 405.80078L351 412.19922L349 413.80078L345 417L320 442L300 457L295 457.27344L293 457.38086L281 458.03711L279 458.14453L267 458.80078L265 458.9082L253 459.56445L251 459.67188L245 460L37 460L35 461L35 457L245 457L300 454L320 439L345 414L370 394L650 394L690 420L725 449L750 467ZM350 401L353 398.59961L351 400.19922L350 401ZM1300 404L1490 404L1490 407L1300 407L1296 409.80078L1294 411.19922L1286 416.80078L1284 418.19922L1276 423.80078L1274 425.19922L1270 428L1264 433.80078L1262 435.73242L1248 449.26758L1246 451.19922L1240 457L1238 458.44922L1236 459.90039L1234 461.34961L1232 462.80078L1228 465.69922L1226 467.15039L1224 468.59961L1222 470.05078L1218 472.94922L1216 474.40039L1214 475.84961L1212 477.30078L1208 480.19922L1206 481.65039L1204 483.09961L1202 484.55078L1200 486L1198 485.96094L1196 485.91992L1194 485.88086L1192 485.83984L1190 485.80078L1188 485.75977L1186 485.7207L1184 485.67969L1182 485.64062L1180 485.59961L1178 485.56055L1176 485.51953L1174 485.48047L1172 485.43945L1170 485.40039L1168 485.35938L1166 485.32031L1164 485.2793L1162 485.24023L1160 485.19922L1158 485.16016L1156 485.11914L1154 485.08008L1152 485.03906L1148 484.96094L1146 484.91992L1144 484.88086L1142 484.83984L1140 484.80078L1138 484.75977L1136 484.7207L1134 484.67969L1132 484.64062L1130 484.59961L1128 484.56055L1126 484.51953L1124 484.48047L1122 484.43945L1120 484.40039L1118 484.35938L1116 484.32031L1114 484.2793L1112 484.24023L1110 484.19922L1108 484.16016L1106 484.11914L1104 484.08008L1102 484.03906L1100 484L1076 483.03906L1074 482.96094L1026 481.03906L1024 480.96094L1000 480L998 479.96094L996 479.91992L994 479.88086L992 479.83984L990 479.80078L988 479.75977L986 479.7207L984 479.67969L982 479.64062L980 479.59961L978 479.56055L976 479.51953L974 479.48047L972 479.43945L970 479.40039L968 479.35938L966 479.32031L964 479.2793L962 479.24023L960 479.19922L958 479.16016L956 479.11914L954 479.08008L952 479.03906L948 478.96094L946 478.91992L944 478.88086L942 478.83984L940 478.80078L938 478.75977L936 478.7207L934 478.67969L932 478.64062L930 478.59961L928 478.56055L926 478.51953L924 478.48047L922 478.43945L920 478.40039L918 478.35938L916 478.32031L914 478.2793L912 478.24023L910 478.19922L908 478.16016L906 478.11914L904 478.08008L902 478.03906L900 478L892 477.65625L890 477.57227L874 476.88477L872 476.80078L858 476.19922L856 476.11523L840 475.42773L839.42383 475.4043L838 476.40039L836 477.80078L834 479.19922L826 484.80078L824 486.19922L820 489L796 513.96094L795 515L794 516.34961L792 519.05078L788 524.44922L786 527.15039L784 529.84961L782 532.55078L778 537.94922L776 540.65039L775 542L774 543.19922L766 552.80078L764 555.19922L756 564.80078L754 567.19922L750 572L748 574.80078L746 577.59961L744 580.40039L742 583.19922L738 588.80078L736 591.59961L734 594.40039L733.40619 595.23077L732.74615 595.15381L731.42773 595L732.41663 593.61566L750 569L775 539L795 512L820 486L839.42383 472.4043L900 475L1000 477L1100 481L1200 483L1240 454L1270 425L1300 404ZM289 445.59961L294.14496 445.31937L293 445.38086L289 445.59961ZM275 446.36328L280.09781 446.08557L279 446.14453L275 446.36328ZM263.00003 447.01801L266.05072 446.85178L265 446.9082L263.32031 447L263.00003 447.01801ZM252.00555 447.61789L247 447.89062L251 447.67188L252.00555 447.61789ZM390 535L460 559L530 581L610 589L680 598L740 605L790 612L850 619L850 622L848 621.76758L846 621.5332L844 621.30078L842 621.06641L840 620.83398L838 620.59961L836 620.36719L834 620.13281L832 619.90039L830 619.66602L828 619.43359L826 619.19922L824 618.9668L822 618.73242L818 618.26758L816 618.0332L814 617.80078L812 617.56641L810 617.33398L808 617.09961L806 616.86719L804 616.63281L802 616.40039L800 616.16602L798 615.93359L796 615.69922L794 615.4668L792 615.23242L790 615L788 614.7207L786 614.43945L782 613.88086L780 613.59961L778 613.32031L776 613.03906L772 612.48047L770 612.19922L766 611.64062L764 611.35938L760 610.80078L758 610.51953L754 609.96094L752 609.67969L750 609.40039L748 609.11914L744 608.56055L742 608.2793L740 608L738 607.76758L736 607.5332L734 607.30078L732 607.06641L730 606.83398L728 606.59961L726 606.36719L724 606.13281L722 605.90039L720 605.66602L718 605.43359L716 605.19922L714 604.9668L712 604.73242L708 604.26758L706 604.0332L704 603.80078L702 603.56641L700 603.33398L698 603.09961L696 602.86719L694 602.63281L692 602.40039L690 602.16602L688 601.93359L686 601.69922L684 601.4668L682 601.23242L680 601L678 600.74219L676 600.48633L672 599.9707L670 599.71484L666 599.19922L664 598.94336L660 598.42773L658 598.17188L654 597.65625L652 597.40039L648 596.88477L646 596.62891L644 596.37109L642 596.11523L638 595.59961L636 595.34375L632 594.82812L630 594.57227L626 594.05664L624 593.80078L622 603L620 603L618 602L616 602L610 599L604 593L602 591.19922L598 590.80078L596 590.59961L594 590.40039L592 590.19922L588 589.80078L586 589.59961L584 589.40039L582 589.19922L578 588.80078L576 588.59961L574 588.40039L572 588.19922L568 587.80078L566 587.59961L564 587.40039L562 587.19922L558 586.80078L556 586.59961L554 586.40039L552 586.19922L548 585.80078L546 585.59961L544 585.40039L542 585.19922L538 584.80078L536 584.59961L534 584.40039L532 584.19922L530 584L526 582.74219L524 582.11523L514 578.9707L512 578.34375L502 575.19922L500 574.57227L490 571.42773L488 570.80078L478 567.65625L476 567.0293L466 563.88477L464 567L462 568L458 568L454 566L452 566L446 563L444 563L440 561L438 561L432 558L430 558L422 554L420 554L414 551L412 551L406 548L404 548L398 545L396 545L392 543L390 543L386 541L384 541L380 539L378 539L376 538L374 538L372 537L370 537L366 535L364 535L362 534L360 534L358 533L356 533L354 532L352 532L350 531L348 531L346 530L344 530L342 529L340 529L338 524.13281L330 522L330 519L390 535ZM580 560L597.88477 577.28711L599.61523 578.96094L597.3067 578.72986L592.14258 578.21289L592 578L588 574L586 571L582 567L580 564L576 560L574 558.40039L566 552.26758L564 550.73242L554 543.06641L552 542L550 542L548 541L546 541L544 540L540 540L538 539.40039L536 539.30078L534 539.19922L526 538.80078L524 538.69922L516 538.30078L514 538.19922L510 538L510 535L550 537L580 560ZM887.16425 677.27271L936.36365 677.27271L936.36365 734.72296L923.79492 732.22461L910.44336 729.57031L910.08984 729.5L904.74805 723L900.82227 718.22266C898.76184 715.56787 896.82898 713.07056 895.70312 711.07227L893.92188 708.46094L893.50977 707.85938L893.26562 707.5L893.20312 707.01758C893.20209 707.01483 893.20221 707.01056 893.20117 707.00781L892.08398 698.5L890.9043 689.5L889.04688 683.5L888.31445 681.12891L887.19141 677.5L887.16425 677.27271ZM710 592.5L713.99994 592.9671L718 593.43359L716 593.19922L714 592.9668L712 592.73242L710 592.5ZM718 593.43384L722 593.90057L726 594.36725L730 594.83398L728 594.59961L726 594.36725L724 594.13281L722 593.90057L720 593.66602L718 593.43384ZM863.63635 738.99493L863.63635 738.89209C865.68195 742.06049 867.52325 744.62756 869.05115 746.43359L869.052 746.43457L869.05353 746.4364C870.51373 748.16199 871.68744 749.19177 872.47913 749.38617C872.67712 749.43481 872.85126 749.43115 873 749.37305C873.82501 749.05084 879.55493 748.54858 885.73242 748.25586L896.26727 747.75568C896.73486 748.12103 896.99951 748.09058 897 747.62439L896.99933 747.62366C897 747.46948 896.56934 746.99884 895.95575 746.4588C895.84045 746.3573 895.71863 746.25336 895.59198 746.14856L894.93414 745.39319L895.375 745.81055L895.37695 745.81274L898.5 748.76953L902.0777 749.27966C902.10016 749.28192 902.12231 749.28516 902.14441 749.28912L902.55273 749.34766L903.5 749.48242L903.50977 749.48438L903.52136 749.48547L903.57477 749.49304L903.60974 749.49817L903.74445 749.51733L903.82074 749.52899L908.5 750.19336L924.5 755.2168L930.20898 757.98633L931.60938 758.66602C931.638 758.68005 931.66656 758.69409 931.69543 758.70746L936.36365 760.974L936.36365 761.29694C935.09027 760.47083 933.72833 759.71375 932.16858 758.93982C932.01288 758.86255 931.85522 758.78516 931.69513 758.70813C933.32568 759.51166 934.82715 760.38538 936.36365 761.46643L936.36365 767.64264L932 767.24023C923.81232 766.48615 915.95166 766.22772 909.44336 766.43164C902.93506 766.63556 897.77911 767.30273 895 768.40039C885.46326 772.16705 877.37115 774 870.28516 774C868.25153 774 865.84979 774.1283 863.63635 774.33398L863.63635 752.15497C867.92352 750.90717 871 749.81775 871 749.43555C871 749.27295 870.11731 747.96698 868.77155 746.10822C867.3996 744.49054 865.8255 742.32922 864.08691 739.67859C863.93982 739.45776 863.78955 739.22974 863.63635 738.99493ZM904.10779 749.57434C905.05164 749.72748 906.09845 749.93518 907.22217 750.18958L907.24976 750.18347C906.1283 749.93396 905.07373 749.72852 904.10779 749.57434ZM908.81946 750.5506C908.82043 750.55707 908.82092 750.56342 908.82104 750.56976C914.21619 751.91101 920.94922 754.13177 926.59558 756.43262C926.39166 756.34839 926.18646 756.2644 925.98016 756.1806L925.95172 756.16907C920.37061 753.90363 914.03455 751.82635 908.81946 750.5506ZM917.57532 774.97772C909.70514 775.12067 901.98767 775.88074 895.0426 777.27271L895.11035 777.27271C902.03589 775.88287 909.72839 775.12286 917.57532 774.97772ZM936.12018 775.77765L936.36346 775.80365L936.36365 775.99542C932.2005 775.53595 927.9184 775.18347 924.05847 774.99872C928.11127 775.09802 932.15961 775.35828 936.12018 775.77765Z"}],narrowStats={calls:0,regions:0,eligible:0,changed:0,protectedSkipped:0,normalGrassSkipped:0,ms:0,allocations:0,scratchBytes:0,readbackBytes:0,peakLogicalBytes:0};
let narrowMask=null,narrowGuard=null;
function narrowColor(c,cv,q){
 const m=c.getTransform();if(m.b||m.c||m.a<=0||m.d<=0||c.globalAlpha!==1||c.globalCompositeOperation!=='source-over')return;
 const start=G.performance.now();narrowStats.calls++;
 for(const r of narrowROIs){
  const x0=Math.max(0,Math.floor(m.a*r.x+m.e)),x1=Math.min(c.canvas.width,Math.ceil(m.a*(r.x+r.w)+m.e)),y0=Math.max(0,Math.floor(m.d*r.y+m.f)),y1=Math.min(c.canvas.height,Math.ceil(m.d*(r.y+r.h)+m.f)),w=x1-x0,h=y1-y0;
  if(w<=0||h<=0)continue;if(w*h>MAX_TRANSITION_PIXELS)throw Error('Narrow ROI pixel cap');
  if(!narrowMask){narrowMask=G.document.createElement('canvas');narrowGuard=G.document.createElement('canvas');narrowStats.allocations+=2;}
  for(const canvas of [narrowMask,narrowGuard]){if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}if(canvas.width!==w||canvas.height!==h)throw Error('Narrow resize mismatch');}
  const mask=narrowMask.getContext('2d'),guard=narrowGuard.getContext('2d');
  for(const cc of [mask,guard]){cc.setTransform(1,0,0,1,0,0);cc.globalAlpha=1;cc.globalCompositeOperation='source-over';cc.clearRect(0,0,w,h);cc.setTransform(m.a,0,0,m.d,m.e-x0,m.f-y0);cc.save();cc.clip(q.apron);cc.scale(2.2,2.2);}
  for(const p of q.paths){mask.fillStyle=p.sourceIndex>=21?'#00ffff':p.sourceIndex>=12&&p.sourceIndex<=17?'#ff00ff':'#0000ff';mask.fill(p.path,p.rule);}mask.restore();
  r.path??=new G.Path2D(r.guard);guard.fillStyle='#fff';guard.strokeStyle='#fff';guard.lineJoin='round';guard.lineWidth=4/(Math.min(m.a,m.d)*2.2);guard.fill(r.path);guard.stroke(r.path);guard.restore();
  narrowStats.scratchBytes=8*w*h;combinedMemory(16*w*h);
  const labels=mask.getImageData(0,0,w,h).data,protectedPixels=guard.getImageData(0,0,w,h).data,old=c.getImageData(x0,y0,w,h),data=old.data,field=cv.getContext('2d').getImageData(x0,y0,w,h).data;
  if([labels,protectedPixels,data,field].some(a=>a.length!==w*h*4))throw Error('Narrow read bounds');
  narrowStats.regions++;narrowStats.scratchBytes=8*w*h;narrowStats.readbackBytes=16*w*h;narrowStats.peakLogicalBytes=Math.max(narrowStats.peakLogicalBytes,24*w*h);
  combinedMemory(narrowStats.readbackBytes);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const k=(y*w+x)*4;if(!labels[k]||labels[k]===255||labels[k+1]||labels[k+2]!==255||data[k+3]!==255||field[k+3]!==255)continue;
   if(protectedPixels[k+3]){narrowStats.protectedSkipped++;continue;}
   const wx=(x0+x+.5-m.e)/m.a,wy=(y0+y+.5-m.f)/m.d;
   // Explicit independent known genuine-grass exception plus 4-world-unit guard.
   if(Math.abs(wx-1949.6)<=4&&Math.abs(wy-1646)<=4){narrowStats.normalGrassSkipped++;continue;}
   const edge=Math.min(wx-r.x,r.x+r.w-wx,wy-r.y,r.y+r.h-wy),u=Math.max(0,Math.min(1,edge/8)),weight=u*u*(3-2*u);if(!weight)continue;
   narrowStats.eligible++;let changed=false;for(let j=0;j<3;j++){const v=Math.round(data[k+j]+weight*(field[k+j]-data[k+j]));if(v!==data[k+j])changed=true;data[k+j]=v;}if(changed)narrowStats.changed++;
  }
  c.putImageData(old,x0,y0);
 }
 narrowStats.ms+=G.performance.now()-start;
}

function draw(c,l,b,originalOnly=false){
 const id=l?.asset?.id;
 if(b?.honroStage!==32||b?.honroCustom||![FOUNDATION,BODY].includes(id))return false;
 if((l.scale??1)!==1||(l.rotation??0)!==0||l.x!==(id===FOUNDATION?-5500:0)||l.y!==(id===FOUNDATION?-1950:0))return fallback('unexpected-placement');
 // The compiler clones providers into battle landmarks. Share that exact
 // resolved field object across foundation/BODY passes, not the library copy.
 const field=id===FOUNDATION?l.asset:(b.honroLandmarks?.find(v=>v.asset?.id===FOUNDATION)?.asset||G.HONRO_PROJECT?.library?.find(a=>a.id===FOUNDATION));
 if(!field)return fallback('missing-field');
 let q,cv;try{q=geometry(l.asset);cv=q&&material(c,field);}catch{return fallback('invalid-source');}
 if(!q||!cv)return fallback('invalid-source-or-device-pixel-cap');
 const transition=id===BODY&&!originalOnly&&canTransition(c,l);
 let originalContext=null,stagedCanvas=null;
 const threshold=c.getTransform().d*1716+c.getTransform().f;
 if(id===BODY&&transition&&threshold>0&&threshold<c.canvas.height){
  originalContext=c;const matrix=c.getTransform();
  stagedCanvas=transitionBody;resizeTransition(stagedCanvas,c.canvas.width,c.canvas.height);transitionCounters.boundaryPasses++;
  const next=stagedCanvas.getContext('2d');next.setTransform(1,0,0,1,0,0);next.globalAlpha=1;next.globalCompositeOperation='copy';next.drawImage(c.canvas,0,0);next.globalCompositeOperation='source-over';next.setTransform(matrix);next.globalAlpha=c.globalAlpha;c=next;
 }
 if(transition)transitionCounters.passes++;
 c.save();try{
  c.globalAlpha*=(l.opacity??1);
  if(id===FOUNDATION){c.translate(l.x,l.y);c.scale(7.2,7.2);c.clip(q.silhouette);bitmap(c,cv);}
  else{
   c.clip(q.apron);c.scale(2.2,2.2);
   let transitionMaskReady=false; // draw-local: identical material ROI/gradient for every protected fill
   for(const n of q.paths){
    if(n.protected){
  if(!transition||n.sourceIndex>=21){c.fillStyle=n.fill;c.fill(n.path,n.rule);continue;}
  // Original path/order is unchanged. No geometry erasure.
  // Source y780 = world1716, below the lowest actual route at world1342.
  const m=c.getTransform(),inv=m.inverse();if(m.b!==0||m.c!==0||m.d<=0)throw Error('Unexpected tile transform');
  const split=Math.max(0,Math.min(cv.height,Math.floor(m.d*780+m.f)));
  if(split===cv.height){c.fillStyle=n.fill;c.fill(n.path,n.rule);continue;}
  if(split>0){c.save();c.setTransform(1,0,0,1,0,0);c.beginPath();c.rect(0,0,cv.width,split);c.clip();c.setTransform(m);c.fillStyle=n.fill;c.fill(n.path,n.rule);c.restore();}
  const y0=Math.max(0,Math.floor(m.d*780+m.f)-2),y1=Math.min(cv.height,Math.ceil(m.d*904+m.f)+2),bandHeight=y1-y0;
  if(bandHeight<=0){c.fillStyle=n.fill;c.fill(n.path,n.rule);continue;}
  const work=transitionWork,color=transitionColor;
  resizeTransition(work,cv.width,bandHeight);resizeTransition(color,cv.width,bandHeight);
  const wc=work.getContext('2d'),cc=color.getContext('2d');
  if(!transitionMaskReady){
  wc.setTransform(1,0,0,1,0,0);wc.globalAlpha=1;wc.globalCompositeOperation='copy';wc.drawImage(cv,0,y0,cv.width,bandHeight,0,0,cv.width,bandHeight);
  wc.globalCompositeOperation='destination-in';wc.setTransform(m.a,m.b,m.c,m.d,m.e,m.f-y0);
  const g=wc.createLinearGradient(0,780,0,900);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.25,'rgba(255,255,255,.15625)');g.addColorStop(.5,'rgba(255,255,255,.5)');g.addColorStop(.75,'rgba(255,255,255,.84375)');g.addColorStop(1,'rgba(255,255,255,1)');wc.fillStyle=g;wc.fillRect(-1000000,-1000000,2000000,2000000);transitionMaskReady=true;
  }
  cc.setTransform(1,0,0,1,0,0);cc.globalAlpha=1;cc.globalCompositeOperation='copy';cc.fillStyle=n.fill;cc.fillRect(0,0,cv.width,bandHeight);cc.globalCompositeOperation='source-over';cc.drawImage(work,0,0);
  const pattern=c.createPattern(color,'no-repeat');if(!pattern)throw Error('Missing transition pattern');pattern.setTransform(inv.translate(0,y0));
  c.save();c.setTransform(1,0,0,1,0,0);c.beginPath();c.rect(0,split,cv.width,cv.height-split);c.clip();c.setTransform(m);c.fillStyle=pattern;c.fill(n.path,n.rule);c.restore();transitionCounters.fills++;continue;
 }
    c.save();c.clip(n.path,n.rule);bitmap(c,cv);
    if(n.gray){c.fillStyle=n.fill;c.fill(n.gray,n.rule);}c.restore();
   }
   if(!originalContext)coherentColor(c,cv,q);
  }
 }finally{c.restore();}
 if(originalContext){
  // Preserve the original BODY pass exactly above the approved non-walk band.
  // The alternate pass is staged independently; only integer lower rows publish.
  const matrix=originalContext.getTransform(),split=Math.max(0,Math.min(stagedCanvas.height,Math.floor(matrix.d*1716+matrix.f)));
  draw(originalContext,l,b,true);
  if(split<stagedCanvas.height){originalContext.save();originalContext.setTransform(1,0,0,1,0,0);originalContext.globalAlpha=1;originalContext.globalCompositeOperation='source-over';originalContext.beginPath();originalContext.rect(0,split,stagedCanvas.width,stagedCanvas.height-split);originalContext.clip();originalContext.drawImage(stagedCanvas,0,0);originalContext.restore();}
 }
 if(transition&&!originalOnly)narrowColor(originalContext||c,cv,q);
 return true;
}
G.HonroStage32FoundationArt={draw,stats:()=>({...counters,combinedPeakLogicalBytes,narrow:{...narrowStats},supersample:{...ssStats,maxScratchPixels:MAX_SS_PIXELS,scope:"Logical canvas and live readback payload only; not total JS/native/GPU heap"},maxPixels:MAX_PIXELS,transition:{...transitionCounters,maxPixels:MAX_TRANSITION_PIXELS,bufferDimensions:[transitionWork,transitionColor,transitionBody].map(c=>c?[c.width,c.height]:null)},totalLogicalBytes:counters.bytes+transitionCounters.bytes+ssStats.scratchBytes+narrowStats.scratchBytes}),clear:()=>{for(const cv of [narrowMask,narrowGuard])if(cv){cv.width=1;cv.height=1;}narrowStats.scratchBytes=narrowMask?8:0;narrowStats.readbackBytes=0;for(const cv of [ssCanvas,lowMaskCanvas])if(cv){cv.width=1;cv.height=1;}ssStats.scratchBytes=ssCanvas?8:0;ssStats.readbackBytes=0;last=null;if(buffer){buffer.width=1;buffer.height=1;}counters.bytes=buffer?4:0;for(const cv of [transitionWork,transitionColor,transitionBody])if(cv){cv.width=1;cv.height=1;}transitionMemory();}};
})(globalThis);

