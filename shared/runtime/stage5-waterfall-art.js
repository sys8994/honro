(function(G){'use strict';
// One opt-in material/flow pass, shared by Game, Stage View and Playtest.
// Geometry remains canonical; paths are immutable and clipped to live terrain.
const S=G.HonroScene.prototype,A=G.HonroEnvironmentArt,active=G.HonroStage5Waterfall.active,cache=new WeakMap();
const paths=new Map(),P=d=>{if(!paths.has(d))paths.set(d,new Path2D(d));return paths.get(d);},poly=ps=>{const p=new Path2D();ps.forEach((q,i)=>i?p.lineTo(q.x,q.y):p.moveTo(q.x,q.y));p.closePath();return p;};
const facets=[
 ['M3020 1240L3220 1270 3280 1760 3190 2110 3080 2200 2970 1900Z','#83968a'],
 ['M3260 1230L3480 1260 3400 1580 3510 1840 3440 2110 3220 2230 3320 1830Z','#5e7774'],
 ['M3500 1250L3790 1220 3700 1570 3830 2040 3740 2430 3580 2620 3470 2200 3530 1820Z','#a1aa91'],
 ['M3780 1210L4090 1170 4180 1510 3990 1800 4140 2120 4040 2430 3820 2520 3910 2050 3740 1650Z','#6a8179'],
 ['M4100 1180L4470 1160 4690 1590 4440 1910 4510 2600 4090 2840 4130 2300 4250 1910Z','#536d6e'],
 ['M3600 2410L3830 2520 4050 2370 4190 2710 4020 3060 4090 3460 3760 3760 3690 3210Z','#6d8278'],
 ['M3290 2680L3510 2590 3630 2830 3560 3110 3680 3450 3440 3840 3210 3880Z','#476862'],
 ['M4400 1500L4690 1350 5020 1610 4860 2090 5130 2700 4780 3200 4300 3330Z','#657c74']
].map(([d,color])=>({path:P(d),color}));
const cracks=[P('M3460 1350L3390 1590 3490 1840 3435 2080 3520 2320 3510 2590'),P('M4030 1360L3970 1670 4110 2110 4010 2430 4150 2700'),P('M3720 2600L3890 2780 3790 3030 3930 3330')];
const moss=[P('M3140 1330Q3360 1320 3470 1290L3420 1345 3270 1370 3150 1355Z'),P('M3580 2110L3760 2100 3830 2160 3720 2140 3600 2160Z'),P('M3610 2480L3800 2500 3840 2540 3730 2530 3620 2520Z'),P('M3940 1240Q4120 1200 4290 1195L4220 1250 4060 1290 3950 1280Z')];
const closed=poly(G.HonroStage5WaterGeometry.closed),opened=poly(G.HonroStage5WaterGeometry.opened);
const flowHighlights=[P('M2960 1220Q2920 1740 2970 2100T2910 3280L2940 3290Q3030 2830 3010 2330T3000 1220Z'),P('M3050 1220Q3070 1760 3040 2080T3100 3280L3130 3290Q3070 2740 3070 2260T3090 1220Z')];

function terrain(c,t,b){let q=cache.get(t);if(!q||q.vertices!==t.vertices){q={vertices:t.vertices,path:poly(G.HONRO_CORE.poly(t))};cache.set(t,q);}c.save();c.clip(q.path);
 c.fillStyle=A.gradient(c,0,1220,0,4450,[[0,'#788d80'],[.25,'#4d6968'],[.68,'#29484d'],[1,'#172e38']]);c.fill(q.path);
 if(t.id==='waterfall-cliff'){
  c.translate(b.honroStage5LakeRevision===1?900:0,0);
  for(const f of facets){c.fillStyle=A.gradient(c,3200,1280,4400,3550,[[0,f.color],[1,'#233d46']]);c.fill(f.path);}c.fillStyle='#213b3e44';c.fill(P('M3360 1540Q3490 1690 3410 1860L3330 2060 3415 1870Q3460 1680 3360 1540Z'));c.fill(P('M3980 1990L3930 2250 3990 2400 3960 2260 4010 2070Z'));
  for(const path of moss){c.fillStyle='#66765a';c.fill(path);}c.fillStyle=A.gradient(c,2910,0,3670,0,[[0,'#142f3740'],[.45,'#c1cbb318'],[1,'#162b3344']]);c.fillRect(2870,1280,850,2540);
 }else{
  const x=Math.max(-200,t.x),y=Math.max(2200,t.y),w=Math.min(2500,t.w),d=Math.min(1000,t.h);c.fillStyle='#7d92824d';c.fill(poly([{x,y},{x:x+w*.43,y:y+40},{x:x+w*.25,y:y+d*.65},{x:x+w*.03,y:y+d*.85}]));c.fillStyle='#183a4366';c.fill(poly([{x:x+w*.5,y},{x:x+w,y:y+70},{x:x+w*.85,y:y+d},{x:x+w*.62,y:y+d*.72}]));
  c.fillStyle='#75826388';c.fillRect(t.x,t.y,t.w,18);
 }c.restore();c.save();c.strokeStyle='#162c33';c.lineWidth=3;c.stroke(q.path);c.restore();}
const oldTerrain=S.terrain;S.terrain=function(c,t,...args){if(active(this.battle)&&this.battle.honroStage5DynamicRevision){if(t.id==='waterfall-veil'||/^stage5-(timber-|fallen-log)/.test(t.id))return;return oldTerrain.call(this,c,t,...args);}if(active(this.battle)&&t.indestructible&&t.id!=='waterfall-veil'&&!t.honroElementCollision){terrain(c,t,this.battle);return;}if(active(this.battle)&&t.id==='waterfall-veil')return;return oldTerrain.call(this,c,t,...args);};
const oldLandmark=S.landmark;S.landmark=function(c,l,...args){if(active(this.battle)&&l.kind==='waterfall')return;return oldLandmark.call(this,c,l,...args);};
function caveBackground(c,w,h,b,scene){if(!active(b)||b.honroStage5DynamicRevision)return;c.save();c.translate(w/2,h/2);c.scale(scene.scale,scene.scale);c.translate(-scene.x+(b.honroStage5LakeRevision===1?900:0),-scene.y);const mouth=P('M3070 2140L3540 2100 3660 2240 3630 2405 3060 2405Z');c.clip(mouth);c.fillStyle='#14252d';c.fill(mouth);c.fillStyle='#273c3e';c.fill(P('M3020 2160L3260 2120 3570 2170 3600 2290 3500 2400 3030 2430Z'));c.restore();}
const oldBackground=S.background;S.background=function(c,w,h,b){oldBackground.call(this,c,w,h,b);caveBackground(c,w,h,b,this);};
const oldWater=S.liveWater;S.liveWater=function(c,b){if(!active(b))return oldWater.call(this,c,b);if(b.honroStage5DynamicRevision)return G.HonroStage5DynamicArt.water.call(this,c,b,oldWater);oldWater.call(this,c,{...b,honroLandmarks:b.honroLandmarks.filter(l=>l.kind!=='waterfall'),honroSurfaceZones:b.honroSurfaceZones.filter(z=>!['stage5-downstream','stage5-plunge-pool','stage5-headwater'].includes(z.id))});const time=A.time(this),a=G.HonroEnvironment.atmosphereAt({backdrop:b.honroBackdrop,environment:b.honroEnvironment},this.y),open=!!G.HonroQuestTargets.records(b).find(t=>t.id==='waterfall-veil')?.honroWaterOpen,shape=open?opened:closed;const downstream=b.honroSurfaceZones.find(z=>z.id==='stage5-downstream');if(downstream){c.save();c.clip(A.poolData(downstream).clip);c.fillStyle=A.gradient(c,0,3300,0,3460,[[0,'#3f63635c'],[1,'#17343aaa']]);c.fillRect(-6000,3300,8400,180);c.restore();}
 const head=b.honroSurfaceZones.find(z=>z.id==='stage5-headwater');if(head){c.save();c.clip(A.poolData(head).clip);c.fillStyle=A.gradient(c,0,1220,0,1350,[[0,'#a8c4b980'],[1,'#315859dd']]);c.fillRect(2960,1220,8000,150);c.strokeStyle='#adcdbd70';c.lineWidth=4;for(let i=0;i<8;i++){const x=3070+i*260-(time*60%260);c.beginPath();c.moveTo(x,1240+i%3*13);c.quadraticCurveTo(x+50,1232+i%3*13,x+135,1244+i%3*13);c.stroke();}c.restore();}
 const basin=b.honroSurfaceZones.find(z=>z.id==='stage5-plunge-pool');if(basin){c.save();c.clip(A.poolData(basin).clip);c.fillStyle=A.gradient(c,0,3300,0,b.honroStage5LakeRevision===1?4300:3820,[[0,'#487d78cc'],[.16,'#234f5c'],[.55,'#102e43'],[1,'#071c2c']]);c.fillRect(basin.x1||2290,3300,(basin.x2||3970)-(basin.x1||2290),1100);A.glow(c,2960,3330,450,100,'#bdddd0',.25);c.strokeStyle='#80aba54d';c.lineWidth=3;for(let i=0;i<7;i++){c.beginPath();c.ellipse(2940+Math.sin(i*4)*120,3320+i*25,200+i*26,8+i*2,0,0,Math.PI);c.stroke();}c.restore();}c.save();c.translate(b.honroStage5LakeRevision===1?900:0,0);c.save();c.clip(shape);
 c.fillStyle=A.gradient(c,2780,0,3650,0,[[0,'#d8e2ccdd'],[.20,'#9ebcb4e8'],[.36,'#5d898ee0'],[.67,'#d4dfc9d8'],[1,'#779e9ddd']]);c.fillRect(2650,1210,1080,2150);
 if(!open){for(const p of flowHighlights){c.fillStyle='#ecf0d64a';c.fill(p);}}else{c.save();c.strokeStyle='#e6ecda43';c.setLineDash([300,95,580,160,65,240]);for(const dx of [-83,-21,58]){c.save();c.translate(dx,0);c.lineDashOffset=-time*310+dx*13;c.lineWidth=dx===-21?6:3;c.stroke(P('M2995 1220C2950 1630 3030 1880 3290 2060C3580 2240 3650 2440 3470 2750C3300 3020 3120 3230 2990 3310'));c.restore();}c.restore();}
 for(let i=0;i<12;i++){const y=1230+(time*(150+i%3*21)+i*177)%2090;c.fillStyle=i%2?'#eff1d331':'#c4ded530';c.save();c.translate(2850+(i%4)*58,y);c.fill(P('M0 0Q-7 70 6 130L17 175Q12 67 22 0Z'));c.restore();}
 c.restore();A.glow(c,2980,3250,490,170,'#c0dbd0',.52);A.fog(c,3010,3260,1450,400,'#d5e2d0',.80,time,22);A.fog(c,2900,3170,1050,320,'#b3c8bd',.5,time,15);
 c.save();c.fillStyle='#cbdcca8c';c.fill(P('M2720 3301Q2770 3276 2825 3294Q2860 3255 2910 3278Q2950 3252 3000 3284Q3070 3256 3120 3290Q3180 3270 3230 3303Q3100 3328 2980 3317Q2840 3330 2720 3301Z'));c.fillStyle='#edf0d7a1';c.fill(P('M2820 3300Q2890 3282 2950 3296Q3010 3270 3080 3294L3160 3305Q3000 3320 2820 3300Z'));c.restore();
 c.save();c.strokeStyle='#d1dfc5ad';c.lineWidth=7;c.beginPath();c.moveTo(2798,1220);c.bezierCurveTo(2920,1210,3070,1216,3210,1220);c.stroke();for(let i=0;i<4;i++){const phase=(time*.19+i*.24)%1;c.globalAlpha=(1-phase)*.65;c.beginPath();c.ellipse(2980,3305,140+phase*420,11+phase*29,0,0,Math.PI*2);c.stroke();}c.restore();c.restore();};
function targetBody(c,t){ if(!t.broken){const level=G.HonroAct1StoryArt.cleatDamageStage(t),x=t.x,y=t.y,w=t.w,h=t.h;c.save();c.fillStyle='#4b352e';c.fillRect(x,y,w,h);c.fillStyle='#91765a';c.fillRect(x+3,y+3,w-6,10);c.fillRect(x+3,y+3,7,h-6);c.fillStyle='#201e20';c.fillRect(x+w-12,y+8,10,h-10);c.strokeStyle='#15252b';c.lineWidth=3;c.strokeRect(x,y,w,h);
 c.fillStyle='#d8caaa';c.fill(poly([{x:x+20,y:y+12},{x:x+61,y:y+19},{x:x+55,y:y+115},{x:x+29,y:y+130}]));c.strokeStyle='#9c5848';c.lineWidth=4;c.beginPath();c.moveTo(x+43,y+25);c.lineTo(x+41,y+100);c.moveTo(x+31,y+39);c.lineTo(x+54,y+47);c.moveTo(x+28,y+62);c.lineTo(x+56,y+70);c.stroke();c.strokeStyle='#753f3b';c.lineWidth=7;c.beginPath();c.moveTo(x+1,y+30);c.lineTo(x+w-1,y+72);c.moveTo(x,y+87);c.lineTo(x+w,y+44);c.stroke();
 if(level){c.strokeStyle='#171e23';c.lineWidth=3+level;c.beginPath();c.moveTo(x+w*.56,y+3);c.lineTo(x+w*.47,y+h*.41);c.lineTo(x+w*.67,y+h*.55);c.lineTo(x+w*.4,y+h-3);c.stroke();}c.restore();}}
function evidence(scene,e){const b=e.b,c=scene.ctx,t=G.HonroQuestTargets.records(b).find(t=>t.id==='cliff-cleat'),m=b.honroMarkers.find(m=>m.id==='receiver-5');if(!t||!m)return;const lit=!!b.honroState.ritual?.active,time=A.time(scene);G.HonroAct1StoryArt.floorArray(c,m,time,lit);
 for(const site of b.honroMarkers.filter(m=>m.type==='hauntHabitat')){c.save();c.translate(site.x,site.y);if(site.kind==='crow'){c.fillStyle='#554d42';c.strokeStyle='#1b2a2d';c.lineWidth=3;c.beginPath();c.ellipse(0,-9,38,13,-.08,0,Math.PI*2);c.fill();c.stroke();c.strokeStyle='#a69b7d';c.lineWidth=2;for(let i=0;i<5;i++){c.beginPath();c.moveTo(-33+i*7,-16+i%2*5);c.lineTo(24+i*3,-4-i%3*5);c.stroke();}}else{c.strokeStyle='#566d58';c.lineWidth=5;for(let i=0;i<9;i++){const x=(i-4)*10;c.beginPath();c.moveTo(x,0);c.quadraticCurveTo(x-10,-30,x+(i%2?18:-15),-55-i%3*12);c.stroke();}}c.restore();}
 // The complete wood slab represents the attackable rectangle, without hollow holes.
 if(!t.honroQuestTarget)targetBody(c,t);
 c.save();c.strokeStyle=t.broken?'#8c63504d':'#ad6657';c.lineWidth=3;c.beginPath();c.moveTo(t.x-210,t.y+55);c.quadraticCurveTo(t.x-90,t.y+(t.broken?150:50),t.x+t.w/2,t.y+66);c.lineTo(t.x+230,t.y+24);c.stroke();c.restore();}
G.HonroStage5WaterfallArt={active,evidence,terrain,targetBody,caveBackground};
})(globalThis);
