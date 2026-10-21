(function(G){'use strict';
// Stage-local painting over the exact physical granite union. No independent
// collision, event clock, actor movement, or save writes live in this module.
const S=G.HonroScene.prototype,C=G.HONRO_CORE,cache=new WeakMap(),skyCache=new WeakMap();
const active=b=>b?.honroStage===12&&b.honroQuarryRevision===1;
const path=ps=>{const p=new Path2D();ps.forEach((v,i)=>i?p.lineTo(v.x??v[0],v.y??v[1]):p.moveTo(v.x??v[0],v.y??v[1]));p.closePath();return p;};
const forms=[
 ['M-30-30H615L567 150 445 285 178 309-30 455Z','M770-30H1030V1030H595L532 765 695 514 608 341Z','M-30 643L155 547 402 611 545 526 720 648 1030 562V1030H-30Z'],
 ['M-30-30H358L583 108 539 316 235 417-30 365Z','M650-30H1030V1030H709L620 736 788 507 678 321Z','M-30 640L203 541 456 664 634 593 799 711 1030 692V1030H-30Z'],
 ['M-30-30H540L650 217 394 363 229 345-30 535Z','M851-30H1030V1030H619L581 846 727 636 666 428Z','M-30 745L282 643 521 751 705 626 1030 744V1030H-30Z']
].map(xs=>xs.map(d=>new Path2D(d)));
// Bedrock follows each workface's slope and cut, rather than scaling the same
// three accents across the entire lower ground or a cave's underside.
const exposures={
 'sq-north-quarry':[
  ['#99aa91aa','M5330 3760L5800 3700 6160 3590 6050 3780 5890 3880 5630 3900 5480 3850 5330 3880Z'],
  ['#a0ac91a0','M6250 3550L6740 3540 7130 3370 7510 3310 7690 3310 7800 3400 7600 3550 7460 3760 7080 3810 6850 3940 6610 3830 6470 3650Z'],
  ['#526f70cc','M6050 3780L6250 3590 6470 3650 6610 3830 6850 3940 6800 4140 6530 4060 6070 4080 5780 3990 5890 3880Z'],
  ['#789184a0','M6880 3950L7100 3850 7460 3810 7590 3590 7840 3480 8080 3630 8170 3820 8020 4050 7750 4220 7500 4280 7290 4160 7060 4140Z'],
  ['#345560cc','M5790 3990L6070 4080 6530 4060 6810 4140 7010 4150 7130 4230 7320 4230 7500 4320 7740 4370 8020 4260 8110 4100 8300 4040 8500 4120 8660 4050 8660 4300 5590 4200Z'],
  ['#24434fbb','M7540 3340L7510 3550 7420 3750 7190 3910 7180 4080 7240 4110 7260 3940 7510 3790 7600 3570 7630 3330Z'],
  ['#a3ac913e','M7900 3510L8070 3640 8130 3800 8040 3930 7850 4010 7890 3890 7970 3770 7920 3670Z'],
  ['#a4af9388','M6240 3570L6590 3560 6720 3620 6650 3720 6460 3770 6290 3710 6190 3730Z'],
  ['#2a4c5766','M6190 3730L6290 3710 6460 3770 6650 3720 6720 3620 6800 3650 6720 3810 6480 3860 6260 3790 6160 3810Z'],
  ['#b1b59877','M7130 3390L7490 3340 7660 3330 7710 3410 7590 3500 7450 3640 7240 3680 7290 3560Z'],
  ['#45676588','M7210 3710L7440 3680 7560 3580 7610 3610 7500 3800 7310 3850 7100 3810Z'],
  ['#9aa78d88','M7470 3900L7710 3800 7920 3740 8000 3830 7920 3960 7740 4030 7550 4010 7380 4120 7290 4100Z'],
  ['#24465188','M7380 4120L7550 4010 7740 4030 7920 3960 8000 3830 8050 3900 7980 4060 7760 4120 7550 4090 7410 4190 7280 4180Z']
 ],
 'sq-west-quarry':[
  ['#7c9485','M3300 4390L3470 4450 3510 4615 3390 4520 3300 4485 3290 4435Z'],

  ['#99a98eaa','M3300 4390L3700 4290 4090 4110 4240 4080 4160 4260 3930 4340 3780 4470 3490 4510 3300 4500Z'],
  ['#9eaa8fa0','M4430 4080L4850 3910 5190 3890 5320 4070 5180 4210 4970 4260 4790 4430 4550 4390 4470 4250Z'],
  ['#647f76bb','M3930 4360L4160 4300 4320 4150 4470 4250 4550 4390 4790 4430 4700 4610 4250 4570 3770 4590Z'],
  ['#345660dd','M3300 4470L3500 4510 3780 4470 3930 4420 4240 4480 4500 4460 4700 4610 5160 4720 5650 4760 5920 4650 5820 4820 3300 4700Z'],
  ['#496b6aaa','M5180 4210L5320 4100 5450 4210 5750 4410 5920 4540 5650 4660 5490 4520 5330 4460 5250 4350Z'],
  ['#284954bb','M4850 3940L4740 4150 4800 4320 4680 4560 4740 4580 4870 4320 4800 4140 4920 3920Z'],
  ['#a3ae9188','M3550 4360L3800 4260 4050 4160 4130 4170 4030 4290 3800 4410 3650 4450 3490 4460Z'],
  ['#476a6977','M3490 4460L3650 4450 3800 4410 4030 4290 4130 4170 4180 4240 4090 4360 3830 4490 3610 4520 3490 4500Z'],
  ['#a9b19666','M4610 4100L4810 4020 4990 3990 5110 4050 5020 4140 4840 4190 4630 4170Z'],
  ['#43636399','M4630 4170L4840 4190 5020 4140 5110 4050 5160 4130 5070 4240 4870 4290 4650 4240Z'],
  ['#8c9f8788','M4190 4380L4390 4350 4510 4440 4680 4470 4610 4540 4410 4510 4250 4560 4100 4510Z']
 ],
 'sq-back-road':[
  ['#94a58aaa','M7110 4660L7510 4610 7920 4470 8000 4520 7860 4610 7660 4650 7510 4720 7220 4730 7110 4770Z'],
  ['#5b7974bb','M8000 4520L8210 4520 8460 4390 8730 4280 8940 4270 8940 4380 8660 4450 8490 4560 8220 4640 7920 4640Z'],
  ['#294b57aa','M7570 4610L7640 4610 7590 4670 7470 4770 7420 4780 7490 4680Z']
 ],
 'sq-west-turn-high':[['#91a48ea0','M3120 4520H3260V4537L3225 4551 3165 4542 3120 4554Z'],['#385c63bb','M3120 4554L3165 4542 3225 4551 3260 4537V4590H3120Z']],
 'sq-west-turn-low':[['#829b87bb','M3270 4650H3380V4664L3345 4685 3295 4673 3270 4682Z']],
 'sq-inner-joint':[['#91a58ddd','M6020 4670H6160V4680L6120 4692 6060 4684 6020 4690Z']],
 'sq-east-turn':[['#8a9f8cbb','M8730 4130H8880V4140L8820 4158 8770 4145 8730 4155Z']],
 'sq-lower-ground':[
  ['#879b87','M5740 4870L5940 4740 6020 4670 6160 4670 6320 4800 6520 4800 6370 4890 6130 4810 6010 4780 5860 4900 5700 4960Z'],
  ['#4a6f6d','M5700 4960L5860 4900 6010 4780 6130 4810 6370 4890 6520 4800 6610 4940 6400 5060 6150 4970 5930 5090 5680 5080Z'],

  ['#7d9280','M2930 4860L3160 4780 3270 4650 3380 4650 3470 4790 3610 4860 3450 4840 3330 4740 3220 4765 3080 4860 2910 4920Z'],
  ['#42646a','M3220 4765L3330 4740 3450 4840 3610 4860 3700 5010 3450 4940 3290 4860 3080 4940 2910 4920 3080 4860Z'],

  ['#8b9c915e','M1300 5320L2210 5110 2910 4910 3470 4830 3570 4980 3260 5230 2810 5340 2490 5550 1800 5600 1410 5470Z'],
  ['#9daa9266','M3830 4990L4330 5060 4860 5030 5300 4980 5530 5050 5280 5230 4780 5290 4610 5450 4190 5430 3920 5300Z'],
  ['#29495177','M4270 5480L4620 5470 4800 5320 5280 5270 5510 5110 5610 5250 5360 5490 4830 5550 4550 5730 4220 5640Z'],
  ['#a4ad9270','M5760 4900L6160 4830 6520 4830 6910 4830 7060 4930 6950 5150 6710 5270 6370 5250 6160 5370 5930 5300 5870 5100Z'],
  ['#26465088','M6180 5420L6400 5300 6730 5330 6980 5210 7100 4970 7200 5130 7130 5400 6880 5570 6560 5530 6330 5680Z'],
  ['#91a29461','M7330 5270L7600 5510 8060 5850 8400 6020 8450 6250 8160 6330 7870 6100 7630 5870 7490 5600 7270 5460Z'],
  ['#28485399','M6920 4840L7060 4930 6950 5150 6710 5270 6700 5180 6860 5080Z'],
  ['#496a6a88','M6160 4830L6250 4890 6220 5070 6340 5190 6160 5370 6110 5290 6260 5170 6150 5040Z'],
  ['#b4b69a38','M6230 5020L6480 4990 6630 5020 6860 4970 6940 4990 6830 5130 6550 5170 6390 5100 6250 5110Z'],
  ['#294b5677','M6250 5110L6390 5100 6550 5170 6830 5130 6940 4990 6990 5030 6870 5210 6550 5250 6360 5180 6220 5150Z'],
  ['#35576188','M6510 4835L6480 4980 6510 5090 6450 5260 6480 5260 6550 5100 6510 4970 6540 4835Z'],
  ['#29495599','M7600 5510L7720 5560 7830 5810 8100 6010 8160 6330 8040 6210 7970 6030 7750 5860Z'],
  ['#9ba99055','M8500 6050L9270 6100 10080 6260 10530 6350 10410 6520 9830 6590 9560 6480 9020 6460 8710 6300Z'],
  ['#35576277','M9010 6530L9550 6550 9840 6660 10410 6600 10900 6510 11250 6590 11250 6920 10560 7000 9970 6890 9480 6940 9120 6760Z']
 ],
 'sq-old-road':[
  ['#a8b19450','M8300 3030L8620 2995 9090 2760 9560 2620 9800 2540 9700 2780 9390 2910 9180 3080 8730 3170 8440 3160Z'],
  ['#294a5577','M9180 3120L9430 2980 9720 2860 9850 2550 10130 2420 10330 2450 10310 2730 10010 2950 10030 3130 9600 3190Z']
 ],
 'sq-cave-roof':[
  ['#1b354a99','M7790 5220L8070 5370 8560 5380 9250 5490 10100 5650 11250 5810 11250 6100 10030 5900 9200 5740 8560 5610 8000 5620 7750 5430Z'],
  ['#84998c40','M8180 5090L8730 5140 9050 5270 9010 5350 8660 5310 8400 5330 8150 5250Z']
 ],
 'sq-cave-buttress':[
  ['#81998a88','M7470 4700L7770 4630 8040 4550 8290 4500 8440 4570 8230 4710 7990 4800 7870 5000 7630 5070 7470 5020Z'],
  ['#4e6f70aa','M7470 4750L7560 4780 7660 4930 7630 5070 7800 5330 7910 5410 7800 5390 7470 5120Z'],
  ['#355661aa','M7900 4830L8090 4770 8240 4660 8350 4670 8260 4900 8080 5100 8150 5290 8070 5460 7910 5290 7860 5080Z'],
  ['#203e4e88','M7500 4890L7790 5050 7990 5270 8300 5340 8550 5220 8710 4980 9070 4890 9300 5230 9050 5450 8490 5580 7990 5540 7760 5330 7480 5130Z']
 ]
};
exposures['sq-north-quarry'].push(
 ['#526f70','M5330 3870L5630 3900 5890 3880 6010 3990 6110 4150 5840 4125 5700 4010 5500 4015Z'],
 ['#42646b','M6010 3990L6070 4080 6530 4060 6810 4140 6750 4440 6510 4250 6270 4270 6110 4150Z'],
 ['#4c6c69','M6810 4140L7010 4150 7130 4230 7320 4230 7500 4320 7680 4430 7450 4390 7230 4470 7020 4400 6750 4440Z'],
 ['#395d65','M7500 4180L7750 4220 8020 4050 8130 4130 8098 4310 7820 4340 7680 4430 7450 4390Z'],
 ['#4b6c69','M8130 4050L8380 4040 8530 3990 8650 4060 8653 4055 8585 4120 8458 4148 8368 4230 8180 4200 8098 4310 7970 4200Z']
);
exposures['sq-west-quarry'].push(
 ['#55776f','M3490 4510L3780 4470 3930 4420 4240 4480 4500 4460 4420 4580 4330 4670 4140 4700 3890 4610 3700 4700 3510 4615Z'],
 ['#416469','M4250 4570L4700 4610 5160 4720 5200 4770 5000 4850 4720 4770 4500 4810 4330 4670Z'],
 ['#50716e','M5160 4720L5490 4520 5650 4660 5800 4700 5610 4715 5480 4800 5200 4770Z']
);
exposures['sq-west-turn-high']=[
 ['#94a28a','M3120 4520H3260L3260 4545 3240 4550 3180 4554 3105 4560Z'],
 ['#4b6b69','M3105 4560L3180 4554 3240 4550 3260 4545 3230 4590 3180 4580Z']
];
exposures['sq-west-turn-low']=[
 ['#8da087','M3270 4650H3380L3390 4675 3350 4685 3300 4675 3255 4680Z'],
 ['#4a6d69','M3255 4680L3300 4675 3350 4685 3390 4675 3350 4705 3300 4700Z']
];
exposures['sq-inner-joint']=[
 ['#96a58b','M6020 4670H6160L6170 4685 6115 4688 6060 4682 6005 4685Z'],
 ['#4c6f6a','M6005 4685L6060 4682 6115 4688 6170 4685 6135 4703 6080 4700 6040 4690Z']
];
for(const id in exposures)exposures[id]=exposures[id].map(([color,d])=>({color,path:new Path2D(d)}));
function prepare(t,b){let q=cache.get(t);if(q?.source===t.vertices&&q.version===b.sceneVersion)return q;const ps=C.poly(t),indices=t.honroWalkEdges||[],edges=indices.map(i=>[ps[i],ps[(i+1)%ps.length]]).filter(([a,z])=>a&&z&&Math.abs(a.x-z.x)>.001),rim=new Path2D();for(const[a,z]of edges){rim.moveTo(a.x,a.y+7);rim.lineTo(z.x,z.y+7);}let key=0;for(const ch of t.id)key+=ch.charCodeAt(0);q={source:t.vertices,version:b.sceneVersion,shape:path(ps),edges,rim,forms:forms[key%forms.length]};if(t.honroQuarryVeil){const x=t.x,y=t.y,w=t.w,h=t.h;q.veilFaces=[
 {color:'#87967f',path:path([[x,y],[x+w*.6,y],[x+w*.44,y+h*.26],[x+w*.63,y+h*.43],[x+w*.34,y+h*.61],[x,y+h*.67]])},
 {color:'#2c4b55',path:path([[x+w*.72,y],[x+w,y],[x+w,y+h],[x+w*.45,y+h],[x+w*.6,y+h*.77],[x+w*.35,y+h*.61],[x+w*.7,y+h*.44],[x+w*.52,y+h*.24]])},
 {color:'#6c8376',path:path([[x,y+h*.72],[x+w*.3,y+h*.66],[x+w*.51,y+h*.8],[x+w*.36,y+h],[x,y+h]])}];}cache.set(t,q);return q;}
function terrain(c,t,b){if(!active(b)||!t.honroQuarry)return false;const q=prepare(t,b);c.save();c.clip(q.shape);const gradient=c.createLinearGradient(t.x,t.y,t.x+t.w*.16,t.y+Math.min(t.h,2400));gradient.addColorStop(0,t.honroCeiling?'#586a6c':'#98a397');gradient.addColorStop(.27,'#72898a');gradient.addColorStop(.64,'#45666d');gradient.addColorStop(1,'#203c4e');c.fillStyle=gradient;c.fill(q.shape);
 if(t.honroQuarryVeil){c.fillStyle='#536f6c';c.fill(q.shape);for(const f of q.veilFaces){c.fillStyle=f.color;c.fill(f.path);}c.strokeStyle='#b9b79288';c.lineWidth=4;c.beginPath();c.moveTo(t.x+t.w*.3,t.y+70);c.lineTo(t.x+t.w*.65,t.y+t.h*.31);c.lineTo(t.x+t.w*.35,t.y+t.h*.64);c.lineTo(t.x+t.w*.68,t.y+t.h-48);c.stroke();}
 else{c.save();c.translate(t.x,t.y);c.scale(t.w/1000,Math.min(t.h,2300)/1000);if(!exposures[t.id]&&!t.honroCeiling)for(const[i,color]of ['#c1c2a92f','#17384789','#1838475c'].entries()){c.fillStyle=color;c.fill(q.forms[i]);}c.restore();c.strokeStyle='#d0d2b16f';c.lineWidth=t.honroSurfaceRole==='short-fracture'?4:10;c.stroke(q.rim);
  if(t.id==='sq-lower-ground'){c.fillStyle='#b2ae8138';c.fill(path([[6060,4822],[6210,4805],[6510,4805],[6930,4805],[6990,4825],[6560,4835],[6250,4830],[6060,4850]]));}

  for(const face of exposures[t.id]||[]){c.fillStyle=face.color;c.fill(face.path);}
 }c.restore();return true;}
// Internal one-area comparison: clips only select which EXISTING painter runs.
// These paths are masks, never additional rock artwork or collision sources.
const pilotMasks=new WeakMap();
function pilot(b){const p=active(b)&&b.honroMap?.quarryArt?.commonPilot;if(!p)return null;let q=pilotMasks.get(p);if(!q){const r=p.bounds,world=b.honroTerrainBounds,inside=new Path2D(),outside=new Path2D();inside.rect(r.left,r.top,r.right-r.left,r.bottom-r.top);outside.rect(world.left,world.top,world.right-world.left,world.bottom-world.top);outside.addPath(inside);q={spec:p,inside,outside};pilotMasks.set(p,q);}return q;}
const baseTerrain=S.terrain;S.terrain=function(c,t){const q=pilot(this.battle);
 if(q&&q.spec.terrainIds.includes(t.id)){c.save();c.clip(q.outside,'evenodd');terrain(c,t,this.battle);c.restore();c.save();c.clip(q.inside);baseTerrain.call(this,c,t);c.restore();return;}
 if(terrain(c,t,this.battle))return;return baseTerrain.call(this,c,t);};
// The existing rear-only landmark is the bearing rock behind the real lanes.
// Its irregular buttresses have no bright top/rim and never enter collision.
// Keep this drawing inside the landmark's published bounds for world tiles.
const rearFaces=[
 ['#29464f','M3200 4490L3300 4440 3730 4410 4130 4340 4580 4340 4980 4430 5440 4420 5710 4590 5520 4740 5360 4950 5140 4900 4770 4870 4350 5030 4020 4990 3820 4930 3490 4840 3350 4660 3280 4580 3200 4590Z'],
 ['#496564','M3300 4500L3500 4530 3780 4480 4110 4440 4300 4520 4220 4700 4350 5010 4090 4950 3970 4790 3720 4720 3510 4630 3380 4660Z'],
 ['#1e3d49','M4420 4470L4780 4540 4960 4490 5360 4580 5520 4700 5360 4950 5120 4890 4970 4720 4770 4720 4580 4830 4510 4660Z'],
 ['#38575d','M3200 4500L3260 4510 3300 4570 3290 4650 3350 4690 3460 4800 3510 4810 3490 4860 3380 4770 3240 4700 3250 4590 3200 4570Z'],
 ['#284650','M5430 3860L5840 3910 6150 3980 6460 3970 6750 4100 7100 4050 7420 4230 7770 4150 8130 4250 8540 4070 8650 4300 8530 4480 8620 4700 8660 6015 8390 5990 8250 5560 8190 5110 7970 4770 7730 4710 7440 4760 7160 4710 7030 4910 6820 4780 6580 4760 6280 4690 6010 4810 5650 4884 5480 4860 5660 4540 5590 4200Z'],
 ['#456363','M5570 4090L5840 4140 6140 4100 6380 4220 6340 4450 6090 4580 5940 4800 5650 4884 5720 4650 5830 4450 5760 4280Z'],
 ['#1d3c48','M6600 4160L6900 4200 7070 4130 7270 4260 7400 4480 7210 4650 7030 4910 6790 4770 6920 4580 6900 4400Z'],
 ['#3e5d61','M7900 4350L8130 4330 8440 4200 8510 4370 8360 4590 8300 4900 8410 5160 8380 5530 8540 5840 8660 6015 8410 5980 8250 5560 8190 5110 8080 4880 8090 4610Z'],
 ['#2a4852','M8230 3250L8840 3220 9250 3340 9600 3270 10040 3340 10580 3270 10900 3310 10780 3790 10820 4250 10600 4550 10450 4700 10650 5350 10550 6370 10210 6210 10100 5750 9880 5450 9650 5720 9440 6140 9160 5980 9260 5510 9150 5120 8880 4420 8700 3920 8540 3630Z'],
 ['#456265','M8900 3380L9230 3460 9450 3400 9640 3550 9680 3900 9500 4350 9540 4660 9750 5060 9640 5370 9440 6140 9280 5970 9380 5630 9410 5340 9240 5030 9280 4690 9140 4380 9040 3970Z'],
 ['#1d3c48','M9960 3400L10330 3450 10630 3340 10500 3790 10550 4140 10270 4520 10200 4850 10460 5290 10350 5630 10550 6370 10210 6210 10030 5860 10000 5530 9820 5200 9920 4810 10020 4500 10130 4060Z']
].map(([color,d])=>({color,path:new Path2D(d)}));
function rear(c,l){c.save();const alpha=c.globalAlpha;c.translate(l.x||0,l.y||0);c.rotate(l.rotation||0);c.scale(l.scale??1,l.scale??1);for(const [i,f] of rearFaces.entries()){c.globalAlpha=alpha*(i<8?.58:.29);c.fillStyle=f.color;c.fill(f.path);}c.restore();}
const landmark=S.landmark;S.landmark=function(c,l){if(active(this.battle)&&l.id==='sq-art-recessed-mother-rock'){const q=pilot(this.battle);c.save();if(q)c.clip(q.outside,'evenodd');rear(c,l);c.restore();return;}return landmark.call(this,c,l);};
const skyAsset=b=>b.honroMap?.quarryArt?.backdropAsset;
function skyRaster(asset){let q=skyCache.get(asset);if(q)return q;const cv=G.document.createElement('canvas'),[x,y,w,h]=asset.vector.viewBox;cv.width=1800;cv.height=1080;const c=G.HonroVisualStyle?.context(cv.getContext('2d'),'SKY')||cv.getContext('2d');c.scale(cv.width/w,cv.height/h);c.translate(-x,-y);G.HonroVectorArt.draw(c,asset,{x:0,y:0,scale:1,rotation:0});skyCache.set(asset,cv);return cv;}
const background=S.background;S.background=function(c,w,h,b){if(!active(b)||!skyAsset(b))return background.call(this,c,w,h,b);const cv=skyRaster(skyAsset(b)),frame=G.HonroEnvironment.act1BackdropFrame(this,w,h,b,cv.width,cv.height);c.drawImage(cv,frame.x,frame.y,frame.w,frame.h);this.environmentStats={groups:0,visibleAssets:1,cachedPaths:0,backgroundAnimatedPrimitives:0,animatedPrimitives:0};};
const shoe=new Path2D('M-26-3Q-20-17-2-19Q18-17 25-6L20 0Q-1 6-24 2Z'),lace=new Path2D('M-16-12L-9 1M-5-17L0 3M7-15L11 2');
function storyProp(c,b){if(!active(b)||!b.honroState?.quarry?.shoePlaced)return;const m=b.honroMarkers.find(m=>m.id==='sign');if(!m)return;c.save();c.translate(m.x+44,m.y-9);c.fillStyle='#ac9b6c';c.fill(shoe);c.strokeStyle='#574f38';c.lineWidth=2;c.stroke(shoe);c.stroke(lace);c.restore();}
const live=S.liveWater;S.liveWater=function(c,b){const out=live?.call(this,c,b);storyProp(c,b);return out;};
// Shared exposed-edge generation still owns every walkable edge and union.
const ownsEdge=id=>!!exposures[id];
const omitReadability=(group,b)=>active(b)&&(ownsEdge(group.id)||group.id==='sq-turning-veil'&&!!group.broken);
const readability=S.terrainReadability;S.terrainReadability=function(c,b,view){const out=readability.call(this,c,b,view);if(!active(b))return out;
 const q=G.HonroTerrainReadability.prepare(b),style=G.HonroTerrainReadability.STYLE,raster=this._staticCacheBuild?this._worldRasterScale(b,this.canvas.clientWidth):this.scale,unit=1/Math.max(.05,raster);
 c.save();c.lineJoin='round';for(const group of q.groups){if(!ownsEdge(group.id))continue;const box=group.bounds;if(view&&(box.right<view.left||box.left>view.right||box.bottom<view.top||box.top>view.bottom))continue;
  // Every physical edge is still shown. Recessed contacts need less ink than
  // the bright playable contour; hiding the collision underside is forbidden.
  c.strokeStyle='#172e37bb';c.lineWidth=.8*unit;c.stroke(group.edge);c.strokeStyle=style.edgeInk;c.lineWidth=style.topInkPixels*unit;c.stroke(group.top);c.strokeStyle=style.topLight;c.lineWidth=style.topLightPixels*unit;c.stroke(group.top);
 }c.restore();return out;
};
G.HonroStage12QuarryArt={active,prepare,terrain,rear,skyAsset,skyRaster,storyProp,omitReadability};
})(globalThis);
