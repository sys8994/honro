(function(G){'use strict';
// This material pass is explicitly opt-in. It clips every wash, bark plate and
// fracture to the live collider; old battles and every other stage are untouched.
const C=G.HONRO_CORE,cache=new WeakMap();
const active=b=>b?.honroStage===11&&b.honroStage11LandscapeRevision===1;
const path=d=>new Path2D(d),P=ps=>{const p=new Path2D();ps.forEach((v,i)=>i?p.lineTo(v.x??v[0],v.y??v[1]):p.moveTo(v.x??v[0],v.y??v[1]));p.closePath();return p;};
const grad=(c,x,y,xx,yy,colors)=>{const g=c.createLinearGradient(x,y,xx,yy);colors.forEach(([u,k])=>g.addColorStop(u,k));return g;};
const hash=s=>{let h=11;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h;};
const ROCK_BLOCKS=[
 {body:'M28 151Q76 30 234 27L510 2 846 59 1118 160Q1214 298 1110 473L962 612 901 825 559 895 195 774Q35 691 59 510Z',light:'M71 153Q128 68 235 69L484 39 513 185 439 312 283 453 95 448Z',face:'M514 38L829 91 1068 178 1075 336 879 450 694 398 442 327 501 202Z',shade:'M1107 180Q1169 294 1078 464L927 603 875 811 729 849 771 639 832 462 1035 326Z',foot:'M290 482L438 377 698 439 862 479 845 631 765 815 547 858 219 733Z',joint:'M486 43L514 63 489 211 424 315 455 367 410 406 376 559 278 647 308 719 292 766 263 728 246 639 344 542 378 387 405 342 395 309 459 201Z',bed:'M93 445Q221 466 299 431L431 369 461 383 304 464 167 484 95 467Z',wash:'M203 114L264 85 281 185 258 271 264 393 233 414 219 279 239 198Z'},
 {body:'M3 206L186 58 431 3 719 41Q909 72 1003 223L1171 437 1137 616 988 767 769 862 413 894 111 728Q49 538 3 206Z',light:'M51 206L210 91 425 48 663 66 627 166 488 215 441 342 216 391 70 332Z',face:'M662 63Q866 99 947 233L1081 403 898 429 747 358 635 422 443 355 488 215 623 168Z',shade:'M1006 253L1141 443 1109 602 961 747 735 832 713 658 879 516 1032 448Z',foot:'M190 433L430 396 624 457 741 397 877 464 751 599 681 818 421 854 155 696Z',joint:'M449 39L464 53 435 128 489 211 459 238 431 344 471 394 437 421 408 545 457 642 407 721 412 849 386 854 377 709 426 640 375 546 404 405 399 349 431 227 455 207 405 133Z',bed:'M697 365L750 337 867 401 991 398 1016 422 877 432 749 371 651 444 621 422Z',wash:'M207 471Q278 428 337 442L325 514 281 563 298 668 266 688 252 562 291 502Z'},
 {body:'M11 117L296 15 630 37 965 113 1183 329Q1206 477 1075 601L973 762 647 858 317 899 80 722Z',light:'M58 141L299 63 593 82 651 202 514 258 230 258 74 366Z',face:'M639 89L949 158 1121 348 1047 446 878 416 749 470 603 402 527 273 686 230Z',shade:'M1138 360L1117 498 1038 590 937 737 612 824 667 623 812 558 936 459 1036 470Z',foot:'M89 414L262 308 510 310 582 440 746 512 632 664 575 827 321 853 119 694Z',joint:'M610 60L638 71 695 229 555 278 614 410 768 487 754 520 595 446 518 272 653 215Z',bed:'M129 581L283 553 418 577 508 549 543 568 419 607 282 585 130 610Z',wash:'M852 229L886 235 902 326 883 371 858 366 868 325Z'}
].map(r=>Object.fromEntries(Object.entries(r).map(([k,d])=>[k,path(d)])));
const mix=(a,b,u)=>{const aa=[1,3,5].map(i=>parseInt(a.slice(i,i+2),16)),bb=[1,3,5].map(i=>parseInt(b.slice(i,i+2),16));return'#'+aa.map((v,i)=>Math.round(v+(bb[i]-v)*u).toString(16).padStart(2,'0')).join('');};
function rockBlock(c,p){
 const r=ROCK_BLOCKS[p.variant%3];c.save();c.translate(p.x,p.y);c.scale(p.ww/1200,p.depth/900);
 c.fillStyle=grad(c,170,30,790,880,[[0,'#9ba696'],[.45,'#6c817b'],[1,'#314b54']]);c.fill(r.body);c.clip(r.body);
 c.fillStyle=grad(c,0,0,700,790,[[0,'#aab5a0'],[.53,'#8e9e8d'],[1,'#607c75']]);c.fill(r.light);
 c.fillStyle=grad(c,600,0,910,610,[[0,'#a7b09b'],[.6,'#7d9287'],[1,'#526f6c']]);c.fill(r.face);
 c.fillStyle=grad(c,500,280,420,900,[[0,'#789082'],[.48,'#607c75'],[1,'#4a6668']]);c.fill(r.foot);
 c.fillStyle=grad(c,940,60,795,870,[[0,'#506d6b'],[.6,'#35515a'],[1,'#324f59']]);c.fill(r.shade);
 if(p.rift){c.fillStyle='#233f47a8';c.fill(r.joint);}if(p.variant!==1){c.fillStyle='#36565a88';c.fill(r.bed);}c.fillStyle='#c4c4a928';c.fill(r.wash);c.restore();
}
// Faces are authored for each connected landform, in top-to-bottom local depth.
// Shared boundaries describe beds, faults and undercut shelves; these are not
// copies of a stone token and are never used as collision or traversal geometry.
const GEOLOGY={
 'rv-west-shoulder':[
  [0,[[0,-.1],[.38,-.1],[.56,.13],[.32,.24],[0,.16]]],
  [1,[[.38,-.1],[1,-.1],[1,.21],[.76,.31],[.56,.13]]],
  [2,[[0,.16],[.32,.24],[.29,.66],[.1,.75],[0,.61]]],
  [3,[[.32,.24],[.56,.13],[.76,.31],[.63,.56],[.29,.66]]],
  [4,[[.76,.31],[1,.21],[1,.75],[.79,.65],[.63,.56]]],
  [5,[[0,.61],[.1,.75],[.29,.66],[.63,.56],[.79,.65],[.72,1.1],[0,1.1]]],
  [2,[[.79,.65],[1,.75],[1,1.1],[.72,1.1]]]],
 'rv-west-stone-arch':[
  [0,[[0,-.1],[1,-.1],[.83,.23],[.2,.18]]],
  [3,[[0,-.1],[.2,.18],[.32,.54],[.12,1.1],[0,1.1]]],
  [1,[[.2,.18],[.83,.23],[.68,.67],[.32,.54]]],
  [4,[[1,-.1],[1,1.1],[.73,1.1],[.68,.67],[.83,.23]]],
  [5,[[.32,.54],[.68,.67],[.73,1.1],[.12,1.1]]]],
 'rv-west-rock-crown':[
  [0,[[0,-.1],[.56,-.1],[.47,.15],[.18,.21],[0,.13]]],
  [1,[[.56,-.1],[1,-.1],[1,.29],[.72,.2],[.47,.15]]],
  [3,[[0,.13],[.18,.21],[.24,.6],[0,.72]]],
  [2,[[.18,.21],[.47,.15],[.72,.2],[.61,.47],[.24,.6]]],
  [4,[[.72,.2],[1,.29],[1,.7],[.77,.66],[.61,.47]]],
  [1,[[.24,.6],[.61,.47],[.77,.66],[.6,.8],[.17,.86],[0,.72]]],
  [5,[[0,.72],[.17,.86],[.6,.8],[.77,.66],[1,.7],[1,1.1],[0,1.1]]]],
 'rv-ritual-buttress':[
  [0,[[0,-.12],[.32,-.12],[.28,.15],[.08,.23],[0,.19]]],
  [1,[[.32,-.12],[.75,-.12],[.7,.22],[.51,.29],[.28,.15]]],
  [0,[[.75,-.12],[1,-.12],[1,.25],[.89,.32],[.7,.22]]],
  [3,[[0,.19],[.08,.23],[.28,.15],[.25,.56],[.06,.66],[0,.54]]],
  [2,[[.28,.15],[.51,.29],[.49,.6],[.25,.56]]],
  [4,[[.51,.29],[.7,.22],[.89,.32],[.78,.62],[.49,.6]]],
  [2,[[.89,.32],[1,.25],[1,.82],[.9,.78],[.78,.62]]],
  [5,[[0,.54],[.06,.66],[.25,.56],[.49,.6],[.78,.62],[.9,.78],[1,.82],[1,1.1],[0,1.1]]]],
 'rv-lower-west-shelf':[
  [0,[[0,-.1],[.66,-.1],[.53,.18],[.18,.28],[0,.16]]],
  [1,[[.66,-.1],[1,-.1],[1,.32],[.72,.4],[.53,.18]]],
  [2,[[0,.16],[.18,.28],[.53,.18],[.48,.51],[.13,.62],[0,.53]]],
  [4,[[.53,.18],[.72,.4],[1,.32],[1,.75],[.81,.81],[.48,.51]]],
  [3,[[0,.53],[.13,.62],[.48,.51],[.81,.81],[.53,.94],[0,.87]]],
  [5,[[0,.87],[.53,.94],[.81,.81],[1,.75],[1,1.1],[0,1.1]]]],
 'rv-lower-refuge-rock':[
  [0,[[0,-.1],[.34,-.1],[.31,.13],[.13,.22],[0,.17]]],
  [1,[[.34,-.1],[.78,-.1],[.84,.16],[.55,.26],[.31,.13]]],
  [0,[[.78,-.1],[1,-.1],[1,.36],[.84,.16]]],
  [3,[[0,.17],[.13,.22],[.31,.13],[.39,.49],[.18,.63],[0,.54]]],
  [2,[[.31,.13],[.55,.26],[.84,.16],[.74,.44],[.39,.49]]],
  [4,[[.84,.16],[1,.36],[1,.66],[.87,.73],[.74,.44]]],
  [1,[[.18,.63],[.39,.49],[.74,.44],[.87,.73],[.64,.83],[.3,.78]]],
  [5,[[0,.54],[.18,.63],[.3,.78],[.64,.83],[.87,.73],[1,.66],[1,1.1],[0,1.1]]]],
 'rv-east-tower':[
  [0,[[0,-.1],[.53,-.1],[.46,.12],[.14,.22],[0,.13]]],
  [1,[[.53,-.1],[1,-.1],[1,.31],[.73,.26],[.46,.12]]],
  [2,[[0,.13],[.14,.22],[.3,.2],[.24,.57],[0,.67]]],
  [3,[[.3,.2],[.46,.12],[.73,.26],[.66,.53],[.42,.64],[.24,.57]]],
  [4,[[.73,.26],[1,.31],[1,.81],[.82,.71],[.66,.53]]],
  [1,[[0,.67],[.24,.57],[.42,.64],[.36,.85],[.09,.93],[0,.84]]],
  [2,[[.42,.64],[.66,.53],[.82,.71],[.72,1.1],[.36,1.1],[.36,.85]]],
  [5,[[0,.84],[.09,.93],[.36,.85],[.36,1.1],[0,1.1]]],
  [5,[[.82,.71],[1,.81],[1,1.1],[.72,1.1]]]],
 'rv-north-trace':[
  [0,[[0,-.1],[.4,-.1],[.36,.14],[.17,.25],[0,.16]]],
  [1,[[.4,-.1],[.74,-.1],[.69,.26],[.51,.35],[.36,.14]]],
  [0,[[.74,-.1],[1,-.1],[1,.19],[.83,.32],[.69,.26]]],
  [3,[[0,.16],[.17,.25],[.36,.14],[.33,.54],[.1,.65],[0,.49]]],
  [2,[[.36,.14],[.51,.35],[.69,.26],[.62,.64],[.33,.54]]],
  [4,[[.69,.26],[.83,.32],[1,.19],[1,.68],[.84,.76],[.62,.64]]],
  [1,[[.1,.65],[.33,.54],[.62,.64],[.57,.84],[.27,.89],[0,.8],[0,.49]]],
  [5,[[0,.8],[.27,.89],[.57,.84],[.62,.64],[.84,.76],[1,.68],[1,1.1],[0,1.1]]]],
 'act2-floor':[
  [2,[[0,-.1],[.24,-.1],[.31,.26],[.13,.43],[0,.31]]],
  [1,[[.24,-.1],[.58,-.1],[.52,.19],[.31,.26]]],
  [0,[[.58,-.1],[.83,-.1],[.9,.23],[.68,.38],[.52,.19]]],
  [3,[[.83,-.1],[1,-.1],[1,.54],[.9,.23]]],
  [4,[[0,.31],[.13,.43],[.31,.26],[.52,.19],[.68,.38],[.55,.62],[.28,.57],[0,.77]]],
  [2,[[.68,.38],[.9,.23],[1,.54],[1,.83],[.76,.73],[.55,.62]]],
  [5,[[0,.77],[.28,.57],[.55,.62],[.76,.73],[1,.83],[1,1.1],[0,1.1]]]]
};
const BEDDING={
 'rv-west-shoulder':[[[0,.16],[.32,.24],[.56,.13],[.76,.31],[1,.21]],[[.32,.24],[.29,.66],[.34,.86]],[[.76,.31],[.63,.56],[.72,1]]],
 'rv-west-stone-arch':[[[.2,.18],[.32,.54],[.12,1]],[[.83,.23],[.68,.67],[.73,1]]],
 'rv-west-rock-crown':[[[0,.13],[.18,.21],[.47,.15],[.72,.2],[1,.29]],[[.18,.21],[.24,.6],[.17,.86]],[[.72,.2],[.61,.47],[.77,.66]],[[.24,.6],[.61,.47]]],
 'rv-ritual-buttress':[[[0,.19],[.08,.23],[.28,.15],[.51,.29],[.7,.22],[.89,.32],[1,.25]],[[.28,.15],[.25,.56],[.29,.89]],[[.7,.22],[.66,.43],[.78,.62],[.75,.89]],[[.06,.66],[.25,.56],[.49,.6],[.78,.62]]],
 'rv-lower-west-shelf':[[[0,.16],[.18,.28],[.53,.18],[.72,.4],[1,.32]],[[.13,.62],[.48,.51],[.81,.81]],[[.53,.18],[.48,.51],[.53,.94]]],
 'rv-lower-refuge-rock':[[[0,.17],[.13,.22],[.31,.13],[.55,.26],[.84,.16]],[[.31,.13],[.39,.49],[.3,.78]],[[.84,.16],[.74,.44],[.87,.73]],[[.18,.63],[.39,.49],[.74,.44]]],
 'rv-east-tower':[[[0,.13],[.14,.22],[.3,.2],[.46,.12],[.73,.26],[1,.31]],[[.3,.2],[.24,.57],[.36,.85]],[[.73,.26],[.66,.53],[.82,.71],[.72,1]],[[.24,.57],[.42,.64],[.66,.53]]],
 'rv-north-trace':[[[0,.16],[.17,.25],[.36,.14],[.51,.35],[.69,.26],[.83,.32],[1,.19]],[[.36,.14],[.33,.54],[.27,.89]],[[.69,.26],[.62,.64],[.57,.84]],[[.1,.65],[.33,.54],[.62,.64],[.84,.76]]],
 'act2-floor':[[[0,.31],[.13,.43],[.31,.26],[.52,.19],[.68,.38],[.9,.23]],[[.31,.26],[.28,.57],[.34,.89]],[[.68,.38],[.55,.62],[.58,1]]]
};
const ROCK_TONES=['#a6ae96','#929e88','#74877b','#647b70','#4c6963','#385450'];
function connectedFaces(t,q,b){
 const layout=GEOLOGY[t.id];if(!layout)return null;
 const start=Math.max(0,t.x),end=Math.min(b.width,t.x+t.w),point=([u,v])=>{const x=start+(end-start)*u,y=q.top(x);const d=q.bottom(x)-y,depth=d>1500?(v<=.3?v*500:v<=.78?150+(v-.3)*2187.5:1200+(d-1200)*(v-.78)/.22):d*(v<=.3?v/3:v<=.78?.1+(v-.3)*1.4583333333:.8+(v-.78)*.9090909091);return[x,y+depth];};
 const follow=ps=>ps.flatMap((a,i)=>{const z=ps[(i+1)%ps.length],n=Math.max(1,Math.ceil(Math.abs(z[0]-a[0])*12));return Array.from({length:n},(_,j)=>point([a[0]+(z[0]-a[0])*j/n,a[1]+(z[1]-a[1])*j/n]));});
 q.geoPoint=point;return layout.map(([tone,ps])=>{const points=follow(ps);return{tone,path:P(points),x:points[0][0],top:Math.min(...points.map(p=>p[1])),bottom:Math.max(...points.map(p=>p[1]))};});
}

function smooth(ps,closed=true){const p=new Path2D();if(ps.length<2)return p;p.moveTo(...ps[0]);for(let i=1;i<ps.length;i++){const a=ps[i],z=ps[i+1];if(z)p.quadraticCurveTo(...a,(a[0]+z[0])/2,(a[1]+z[1])/2);else p.lineTo(...a);}if(closed)p.closePath();return p;}
function prepare(t,b){
 let q=cache.get(t);if(q?.vertices===t.vertices&&q.version===b.sceneVersion)return q;
 const ps=C.poly(t),shape=P(ps),edges=G.HonroAct2SpatialArt.surfaceEdges(t,b),seed=hash(t.id),wood=!!t.honroRavineTree;
 const at=x=>{const e=edges.find(([a,z])=>x>=Math.min(a.x,z.x)-.01&&x<=Math.max(a.x,z.x)+.01);return e?e[0].y+(e[1].y-e[0].y)*(x-e[0].x)/(e[1].x-e[0].x||1):t.y;};
 const bottom=x=>{const ys=[];for(let i=0;i<ps.length;i++){const a=ps[i],z=ps[(i+1)%ps.length];if(x>=Math.min(a.x,z.x)&&x<=Math.max(a.x,z.x)&&Math.abs(a.x-z.x)>.01)ys.push(a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x));}return Math.max(at(x)+10,...ys);};
 const rim=new Path2D();for(const[a,z]of edges){rim.moveTo(a.x,a.y);rim.lineTo(z.x,z.y);}
 q={vertices:t.vertices,version:b.sceneVersion,shape,rim,wood,edges,plates:[],grooves:[],moss:[],bands:[],top:at,bottom};
 if(wood){
  const start=Math.min(...edges.flat().map(v=>v.x)),end=Math.max(...edges.flat().map(v=>v.x)),width=end-start;
  const sampleCount=Math.max(8,Math.min(42,Math.ceil(width/70))),xs=Array.from({length:sampleCount},(_,i)=>start+(end-start)*i/(sampleCount-1));
  const stops=[[0,'#8e734c'],[.22,'#ac8e5f'],[.48,'#755b3e'],[.78,'#493b2e'],[1,'#262a23']],tone=f=>{for(let i=1;i<stops.length;i++)if(f<=stops[i][0])return mix(stops[i-1][1],stops[i][1],(f-stops[i-1][0])/(stops[i][0]-stops[i-1][0]));return stops.at(-1)[1];};
  for(let i=0;i<24;i++){const f=i/24,z=(i+1.1)/24,up=xs.map(x=>[x,at(x)+(bottom(x)-at(x))*f]),down=xs.slice().reverse().map(x=>[x,at(x)+(bottom(x)-at(x))*z]);q.bands.push({path:P([...up,...down]),fill:tone((f+z)/2)});}
  const count=Math.max(2,Math.min(7,Math.ceil(width/390)));
  for(let i=0;i<count;i++){
   const u=(i+.08)/count,x=start+width*u,ww=width/count*(1.1+(i%3)*.14),samples=[];
   for(let j=0;j<=7;j++){const xx=Math.min(end-.4,x+ww*j/7),top=at(xx),dep=bottom(xx)-top,s=j/7; samples.push([xx,top,dep,s]);}
   const upper=samples.map(([xx,y,d,s])=>[xx,y+d*(.43+.12*Math.sin(s*3+i*.71)-.29*Math.sin(Math.PI*s))]),lower=samples.slice().reverse().map(([xx,y,d,s])=>[xx,y+d*(.43+.12*Math.sin(s*3+i*.71)+.29*Math.sin(Math.PI*s))]);
   const face=smooth([...upper,...lower]);
   const deep=smooth(samples.map(([xx,y,d,s])=>[xx,y+d*(.78+.1*Math.sin(s*5.2+i*.8))]),false);
   q.plates.push({face,x,y:at(x),h:Math.max(90,bottom(x)-at(x)),light:i%3!==2});q.grooves.push(deep);
   // One short branching split interrupts each broad plate. Nothing repeats
   // at a fixed world interval or extends as a ruler-straight yellow stripe.
   const xx=Math.min(end-20,x+ww*.61),y=at(xx),dep=bottom(xx)-y;
   const crack=path(`M${xx-ww*.18} ${y+dep*.38}Q${xx-ww*.03} ${y+dep*.51} ${xx+ww*.11} ${at(Math.min(end,xx+ww*.11))+dep*.35}M${xx} ${y+dep*.48}q${ww*.02} ${dep*.17} ${ww*.12} ${dep*.20}`);
   q.grooves.push(crack);
  }
  // Broken side arm alone exposes a torn cambium end. Other connections are
  // continuous wood, never modular beam caps or identical ellipse tokens.
  if(t.id==='rv-saddle-broken-arm'){const x=end-31,y=at(x),d=bottom(x)-y;q.cut=path(`M${x-19} ${y+12}q-26 ${d*.17} -5 ${d*.43}q25 ${d*.17} 37 ${-d*.14}q15 ${-d*.28} -18 ${-d*.37}`);}
 }else{
  const floor=t.honroSurfaceRole==='floor',start=floor?Math.max(0,t.x):t.x,end=floor?Math.min(b.width,t.x+t.w):t.x+t.w,w=end-start;
  const pillar=!t.oneWay&&w<550&&t.h>w*1.07;
  const count=pillar?1:t.oneWay||t.h<220?Math.max(1,Math.ceil(w/360)):Math.max(2,Math.min(14,Math.ceil(w/(floor?1400:960))));
  const weights=Array.from({length:count},(_,i)=>[1.43,.71,1.18,.86,1.51,.59,1.06][(i+seed)%7]),total=weights.reduce((a,z)=>a+z,0);let cursor=start;
  for(let i=0;i<count;i++){
   const stride=w*weights[i]/total,x=cursor-stride*.12,ww=stride*[1.26,1.08,1.34,1.15][(i+seed)%4];cursor+=stride;
   const y=at(Math.max(start,Math.min(end,x+ww*.34)))+(pillar?0:!t.oneWay?[5,133,57,-49,211][(i+seed)%5]:3);
   const depth=pillar?t.h*.96:Math.min(t.h*(t.oneWay?.88:.79),ww*[.63,.79,.72,.88,.67][(i+seed)%5],1050);
   if(!t.oneWay&&t.h>500&&(i+seed)%3===1)q.plates.push({x:x-ww*.17,y:y+depth*.73,ww:ww*1.22,depth:depth*1.16,variant:(i+seed+1)%3,rift:false});
   q.plates.push({x,y,ww,depth,variant:(i+seed)%3,rift:(i+seed)%3===0||w<220});
  }
  q.faces=connectedFaces(t,q,b);

  if(q.faces)q.beds=(BEDDING[t.id]||[]).map(ps=>{const points=ps.map(q.geoPoint),p=new Path2D();points.forEach((v,i)=>i?p.lineTo(...v):p.moveTo(...v));return p;});
  // Coherent moss grows in a few damp seams, rather than flat green stickers.
  const e=edges.filter(([a,z])=>Math.abs(z.x-a.x)>100);for(const [i,[a,z]]of e.entries()){
   if((i+seed)%3===0)continue;const lo=.1+((i+seed)%3)*.13,hi=Math.min(.95,lo+.24+((i+seed)%2)*.18),x=a.x+(z.x-a.x)*lo,xx=a.x+(z.x-a.x)*hi,y=at(x),yy=at(xx),deep=t.oneWay?12:35+((i+seed)%3)*11;
   q.moss.push(path(`M${x} ${y+5}Q${(x+xx)/2} ${(y+yy)/2+18} ${xx} ${yy+6}L${xx-13} ${yy+deep*.7}Q${(x+xx)/2+24} ${(y+yy)/2+deep+10} ${x+12} ${y+deep*.6}Z`));
  }
 }
 cache.set(t,q);return q;
}
function terrain(c,t,b){
 if(!active(b)||!t.honroRavine)return false;
 const q=prepare(t,b);c.save();c.clip(q.shape);
 if(q.wood){
  c.fillStyle=grad(c,t.x,t.y,t.x+t.w*.24,t.y+t.h,[[0,'#8d6f49'],[.35,'#66513b'],[1,'#282f29']]);c.fill(q.shape);
  for(const band of q.bands){c.fillStyle=band.fill;c.fill(band.path);}
  for(const p of q.plates){c.fillStyle=p.light?'#b0a07028':'#29261f40';c.fill(p.face);}
  c.lineCap='round';c.lineJoin='round';c.strokeStyle='#34271979';c.lineWidth=6;for(const p of q.grooves)c.stroke(p);
  if(q.cut){c.strokeStyle='#b79963';c.lineWidth=7;c.stroke(q.cut);}
  c.strokeStyle='#b6a077';c.lineWidth=4;c.stroke(q.rim);
 }else{
  // Continuous warm-grey bedrock is visibly separate from the cool blue rear
  // cliff. The rounded exposed faces belong to this mass, never to empty air.
  c.fillStyle=q.faces?'#405754':grad(c,t.x,t.y,t.x+t.w*.1,t.y+Math.min(t.h,2800),[[0,'#929982'],[.28,'#6f7560'],[.75,'#525b48'],[1,'#414b3b']]);c.fill(q.shape);
  c.fillStyle=grad(c,t.x,t.y,t.x+t.w,t.y+t.h*.23,[[0,'#b9aa7324'],[.38,'#7c775512'],[.72,'#24322c20'],[1,'#182c2b65']]);c.fill(q.shape);
  if(q.faces)for(const f of q.faces){const tone=ROCK_TONES[f.tone];c.fillStyle=grad(c,f.x,f.top,f.x+180,f.bottom,[[0,mix(tone,'#c6c3a6',.12)],[.58,tone],[1,mix(tone,'#233f3e',.18)]]);c.fill(f.path);}
  else for(const p of q.plates)rockBlock(c,p);
  if(q.beds){c.lineJoin='bevel';c.lineCap='butt';c.strokeStyle='#273f4080';c.lineWidth=16;for(const p of q.beds)c.stroke(p);c.save();c.translate(0,9);c.strokeStyle='#b4bca04d';c.lineWidth=5;for(const p of q.beds)c.stroke(p);c.restore();}

  c.strokeStyle='#18292360';c.lineWidth=10;c.stroke(q.shape);
  c.fillStyle='#495d3e';for(const p of q.moss)c.fill(p);
  c.strokeStyle='#b1bba1';c.lineWidth=5;c.stroke(q.rim);
 }
 c.restore();return true;
}
G.HonroStage11LandscapeArt={active,prepare,terrain};
})(globalThis);
