(function(G){'use strict';
// Compose the shared approved granite material on the three real Stage5 masses.
// Collision, saved state and the actual contact rim are never derived from art.
const S=G.HonroScene.prototype,ids=new Set(['valley-floor','stage5-west-shoulder','stage5-ritual-stone','stage5-upper-ridge','stage5-cave-brow']),active=b=>G.HonroStage5Positioning.active(b);
const terrain=S.terrain;S.terrain=function(c,t){if(this.battle?.honroStage5DynamicRevision)return terrain.call(this,c,t);if(active(this.battle)&&ids.has(t.id)&&!t.broken){
 const b=this.battle,A=G.HonroAct1SpatialArt,q=A.prepareTerrain(t,b),scale=this._staticCacheBuild?this._worldRasterScale(b,this.canvas.clientWidth):this.scale;
 // Reuse the original broad weathered faces beneath a few native-size shared
 // shoulder/foundation modules. Only the actual solid is painted: the undercut
 // stays empty, and the same canonical contact rim is drawn last.
 A.drawTerrainMaterial(c,t,b,{walkRim:false});c.save();c.clip(q.shape);
 G.HonroGeologyArt.draw(this,c,b,v=>v.asset.category==='rock'&&v.attachment.terrainId===t.id);c.restore();
 c.save();c.strokeStyle=G.HonroGeologyArt.PALETTE.rim;c.lineWidth=1.05/Math.max(.05,scale);c.lineJoin='round';c.stroke(q.rim);c.restore();return;
 }return terrain.call(this,c,t);};
const omitReadability=(group,b)=>active(b)&&ids.has(group.id);

// Revision5 keeps the common pool renderer and adds only the shared fluid body.
// Every ribbon vertex is also consumed by the projectile drag implementation.
const waterPaths=Object.fromEntries(Object.entries(G.HonroStage5WaterGeometry.dynamic).map(([key,ps])=>{const path=new Path2D();ps.forEach((p,i)=>i?path.lineTo(p.x,p.y):path.moveTo(p.x,p.y));path.closePath();return[key,path];}));
const flows={closed:new Path2D('M5310 720L5310 875C5280 1250 5310 1920 5300 2470Q5280 2810 5210 2890'),opened:new Path2D('M5310 720L5310 875C5450 840 5550 870 5780 875C5930 980 5960 1360 5900 1625Q5800 2330 5310 2900')};
function water(c,b,base){
 base.call(this,c,{...b,honroLandmarks:b.honroLandmarks.filter(l=>l.kind!=='waterfall')});
 const A=G.HonroEnvironmentArt,time=A.time(this),key=G.HonroQuestTargets.records(b).find(t=>t.id==='waterfall-veil')?.honroWaterOpen?'opened':'closed';
 const head=b.honroSurfaceZones.find(z=>z.id==='stage5-headwater');if(head){c.save();c.clip(A.poolData(head).clip);c.fillStyle=A.gradient(c,0,170,0,740,[[0,'#8caaa4'],[1,'#b0c8b4']]);c.fillRect(5200,150,7500,590);c.strokeStyle='#d1ddbf90';c.lineWidth=5;c.beginPath();head.surface.forEach(([x,y],i)=>i?c.lineTo(x,y+5):c.moveTo(x,y+5));c.stroke();c.restore();}

 c.save();c.clip(waterPaths[key]);c.fillStyle=A.gradient(c,5050,0,6100,0,[[0,'#769fa6b8'],[.25,'#b7d2c8c9'],[.55,'#769ba4b0'],[.8,'#c1d5c9c4'],[1,'#527f8fa0']]);c.save();c.globalAlpha*=key==='opened'?.27:.40;c.fillRect(4950,710,1200,2250);c.restore();
 c.save();c.strokeStyle='#b9d2c76c';c.lineWidth=key==='opened'?29:36;c.lineCap='round';c.setLineDash([]);c.stroke(flows[key]);c.restore();
 // Broken broad curtains remain inside the same fluid collider. No second water simulation.
 c.strokeStyle='#e2ead45c';c.lineCap='round';
 for(const [i,[dx,width,dashes]]of [[-72,3,[170,110,48,250]],[-24,7,[310,180,80,90]],[34,4,[76,230,155,170]],[67,2,[240,75,130,290]]].entries()){c.save();c.lineWidth=width;c.setLineDash(dashes);c.lineDashOffset=-time*(170+i*19)+i*97;c.translate(dx,0);c.stroke(flows[key]);c.restore();}
 // Eroded curtains vary along the drop; their torn margins stay inside the real fluid shape.
 if(key==='closed'){
 c.fillStyle='#bdd6ca53';c.fill(new Path2D('M5221 720Q5239 850 5226 980L5245 1080Q5219 1220 5243 1340L5232 1510 5251 1590Q5232 1850 5249 2010L5224 2200 5232 2370Q5220 2590 5170 2830L5225 2790Q5260 2610 5250 2360L5266 2150 5259 1970Q5272 1740 5264 1550L5250 1360Q5268 1170 5257 1030L5247 860 5250 720Z'));
 c.fillStyle='#d4e3cf42';c.fill(new Path2D('M5378 760L5386 940Q5366 1130 5381 1290L5360 1480Q5380 1710 5367 1880L5374 2060 5353 2230Q5366 2460 5325 2710L5341 2780Q5388 2600 5382 2420L5393 2220Q5404 1990 5390 1800L5398 1570 5383 1390Q5402 1190 5398 1010L5401 820Z'));
 }c.restore();
 const contacts=key==='closed'?[[5370,1290,110,34],[5375,2160,145,46],[5300,2590,175,55]]:[[5870,1330,130,34],[5770,2210,160,44]];
 for(const [i,[x,y,w,h]]of contacts.entries()){
  A.fog(c,x,y,w,h,'#c6dbcf',.46,time,31+i);c.save();c.translate(x,y);c.fillStyle='#c7ddd075';
  c.fillStyle='#c7ddd030';for(const [dx,dy,r]of [[-7,1,20],[-28,4,16],[-44,10,12],[-13,-7,11],[-26,16,9]]){c.beginPath();c.ellipse(dx,dy,r,r*.4,0,0,Math.PI*2);c.fill();}
  c.fillStyle='#d3e2ce7c';for(const [j,[dx,dy,r]]of [[-37,-14,2.5],[-60,1,2],[-29,26,3],[-9,-19,2]].entries()){c.beginPath();c.ellipse(dx+Math.sin(time*1.3+j)*3,dy+Math.cos(time+j)*2,r,r*.55,0,0,Math.PI*2);c.fill();}c.restore();
 }
 const foam=new Path2D('M3980 2900Q4040 2880 4110 2895Q4170 2865 4230 2890Q4300 2860 4370 2894Q4460 2875 4570 2900Q4490 2930 4350 2920Q4210 2940 4110 2918Z');
 c.save();c.translate(1000,0);c.fillStyle='#c8dbca9c';c.fill(foam);c.strokeStyle='#deead270';c.lineWidth=5;
 for(let i=0;i<3;i++){const phase=(time*.3+i/3)%1;c.globalAlpha=(1-phase)*.65;c.beginPath();c.ellipse(4300,2905,150+phase*290,7+phase*24,0,0,Math.PI*2);c.stroke();}c.restore();
 A.glow(c,5280,2890,480,120,'#a5c8be',.48);A.fog(c,5280,2880,1250,340,'#c4d6c7',.76,time,15);
 for(const z of b.honroSurfaceZones.filter(z=>['stage5-shallow-water','stage5-plunge-pool'].includes(z.id))){
  const q=A.poolData(z),deep=z.id==='stage5-plunge-pool';c.save();c.clip(q.clip);
  if(deep){c.fillStyle=A.gradient(c,0,q.top,0,q.bottom,[[0,'#456c7010'],[.35,'#133a4f70'],[1,'#071e33c9']]);c.fillRect(q.left,q.top,q.right-q.left,q.bottom-q.top);}
  c.strokeStyle=deep?'#8eb4ac60':'#bcc7a68c';c.lineWidth=deep?7:5;
  c.beginPath();c.moveTo(q.left,q.top+3);c.quadraticCurveTo(q.left+42,q.top+25,q.left+90,q.top+27);c.moveTo(q.right,q.top+3);c.quadraticCurveTo(q.right-36,q.top+22,q.right-84,q.top+24);c.stroke();
  c.strokeStyle=deep?'#789e9c55':'#bac8ad70';c.lineWidth=3;
  for(let i=0;i<3;i++){const x=q.left+(q.right-q.left)*(.18+i*.22),y=q.top+10+i*8;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+50,y-5,x+100,y+1);c.stroke();}c.restore();
  if(deep){
   // Edge stakes and broad inward currents distinguish the hazard from the walkable creek.
   c.save();for(const [x,dir]of [[3990,1],[5580,-1]]){c.fillStyle='#584c3c';c.fillRect(x-8,2810,10,50);c.fillRect(x+22*dir-5,2824,8,36);c.fillStyle='#b69c68';c.beginPath();c.moveTo(x-8,2810);c.lineTo(x+22*dir,2824);c.lineTo(x+22*dir,2832);c.lineTo(x-8,2819);c.fill();}
   c.strokeStyle='#9cbbb27a';c.lineWidth=4;c.lineCap='round';for(const x of [4210,4580,4940]){c.beginPath();c.moveTo(x,2918);c.bezierCurveTo(x+100,2922,x+65,2960,x+170,2965);c.stroke();}
   if(this.scale>=.45){c.font='18px serif';c.textAlign='left';c.fillStyle='#d3c59e';c.fillText('깊은 물 · 최대HP25% 피해 / 행동 종료',4130,2810);c.font='15px serif';c.fillStyle='#b8c7bc';c.fillText('진입한 쪽 낮은 물가로 복귀',4130,2833);}c.restore();
  }
 }

}
G.HonroStage5DynamicArt={water};
G.HonroStage5PositioningArt={active,omitReadability};
})(globalThis);
