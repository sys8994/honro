(function(G){'use strict';
// Retained human/cloth/bronze contours. No terrain, actor size or game state writes.
const S=G.HonroScene.prototype,path=d=>new Path2D(d),P={
 robe:path('M-9-90Q-18-89-21-80L-18-59-23-10-17-2-6-6 0-16 8-3 23-8 17-51 21-78Q17-87 7-90L0-85Z'),
 dark:path('M1-85L8-90 17-80 12-56 21-10 10-6 1-22-5-58Z'),
 light:path('M-12-85L-6-80-13-58-18-12-21-10-16-55Z M6-54L11-47 15-11 10-9Z'),
 hem:path('M-10-57L-9-36-15-8M0-54L-3-29 1-19M11-53L8-34 13-13'),
 collar:path('M-8-91L0-85 7-91 10-85 1-72-4-74-13-84Z'),
 neck:path('M-5-98L5-98 6-88 0-83-6-89Z'),
 head:path('M-7-106Q-3-111 4-107L7-102 7-98 10-95 6-93 5-87 0-85-5-89-8-98Z'),
 face:path('M2-106L6-102 6-98 9-95 5-93 4-88 0-87-2-91 1-96Z'),
 wrap:path('M-9-106Q-5-112 4-109L8-105 8-100Q0-102-8-100Z'),
 knot:path('M-8-105L-14-103-12-98-8-100M-12-101L-18-93-24-90-18-99Z'),
 topknot:path('M-4-110Q-8-118-1-118Q6-117 3-111Z'),
 brow:path('M-5-99L0-100 4-98M-4-97L-1-97M4-96L6-96M-2-92L3-91'),
 beard:path('M-5-92L-1-93 2-91 5-93 5-88 0-83-4-86Z'),
 sash:path('M-16-60Q-2-56 15-60L15-54Q1-50-16-54Z'),
 belt:path('M-2-55L3-54 6-22 1-20Z M-5-54L-9-29-15-17-12-37Z'),
 leftSleeve:path('M-16-84Q-25-83-26-75L-24-56-15-54-10-64-16-69Z'),
 hand:path('M-18-61L-15-64-11-62-9-58-11-55-16-55Z'),
 sleeve:path('M10-85Q19-88 24-79L21-66 14-66 11-72 13-78Z'),
 fingers:path('M16-70L18-77 22-80 25-78 23-75 21-76 20-70 18-66 14-67Z'),
 fingerLines:path('M18-75L22-76M18-72L21-72M16-68L19-67'),
 plate:path('M-6-12L1-14 6-10 7 7 3 12-4 11-7 6-6-8Z'),
 plateFace:path('M1-11L4-8 5 7 2 9-1 8-2-7Z'),
 circle:path('M3-5Q-6-8-4 2Q-2 7 3 3Q5 0 3-5Z'),
 moon:path('M3-6Q-4-5-3 2Q-2 6 3 5Q-6 8-5-1Q-3-8 3-6Z'),
 ring:path('M-5-7Q-10 0-4 6Q4 11 8 2Q11-6 3-9Q-2-11-5-7ZM-2-4Q3-7 5-2Q6 3 2 4Q-4 5-4 0Z'),
 bound:path('M-18-60Q-4-65 15-59M-17-57Q0-61 15-56M-16-54Q-1-58 15-53'),
 shoe:path('M-13-6L-5-5-1 0-3 3-17 2-18-1Z M6-6L14-7 22-1 21 2 7 2Z')};
function paint(c,p,fill,stroke='#18282a',w=1){if(fill){c.fillStyle=fill;c.fill(p);}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke(p);}}
function plate(c,x,y,angle,index,dim=false){c.save();c.translate(x,y);c.rotate(angle);paint(c,P.plate,dim?'#5d6355':'#9b8962','#303c35',.9);paint(c,P.plateFace,dim?'#34483e':'#526f60',null);paint(c,index===1?P.moon:P.circle,null,dim?'#68766a':'#b6b394',.8);c.restore();}
function draw(c,u,b,time){
 const ritual=b?.keeperRitual,st=b?.honroState?.keeperStaging,pose=st?.pose||(u.honroSubdued?'weak':'gripping'),bound=pose==='bound',released=bound||pose==='released',cast=ritual?.cast?Math.sin(Math.min(1,ritual.cast.elapsed/.8)*Math.PI):st?.cue?1:0,weak=pose==='weak',move=u.moving?Math.sin(time*8)*1.1:0;
 c.save();c.lineJoin='round';c.lineCap='round';c.translate(0,Math.abs(move)*-.18);c.rotate((u.hurt>0?-.035:0)+(weak?.025:0));
 paint(c,P.shoe,'#26302e');paint(c,P.robe,'#343d38');paint(c,P.dark,'#202c2b',null);paint(c,P.light,'#566154',null);paint(c,P.hem,null,'#1b2c2b',.9);
 paint(c,P.neck,'#a28c70');paint(c,P.collar,'#b0ab92','#394338',.65);paint(c,P.sash,'#292e29');paint(c,P.belt,'#605e49','#252f2b',.6);
 c.save();c.rotate(weak?.055:0);paint(c,P.topknot,'#292c27');paint(c,P.head,'#b39a79');paint(c,P.face,'#796e57',null);paint(c,P.knot,'#262f2e');paint(c,P.wrap,'#333a35');paint(c,P.brow,null,'#30392e',.6);paint(c,P.beard,'#6d7568',null);c.restore();
 paint(c,P.leftSleeve,'#3d4941');paint(c,P.hand,'#b19b7a','#2c3930',.7);
 c.save();c.translate(3,-79);c.rotate(released?.9:cast*-.12+(weak?.1:Math.sin(time*1.5)*.012));c.translate(-3,79);paint(c,P.sleeve,'#343f38');paint(c,P.fingers,'#b29a77','#28392f',.65);paint(c,P.fingerLines,null,'#655a45',.55);
 if(!released){for(const[i,x,y]of [[0,11,-50],[1,23,-44],[2,34,-52]]){c.strokeStyle='#202e2b';c.lineWidth=1;c.beginPath();c.moveTo(20,-74);c.quadraticCurveTo(x+2,-63,x,y-12);c.stroke();plate(c,x,y,Math.sin(time*1.9+i)*.04+cast*(i-1)*.16,i,weak);}}c.restore();
 c.save();c.translate(-14,-53);c.scale(.66,.66);paint(c,P.ring,'#8d805d','#2c4038',1);c.restore();
 if(bound){paint(c,P.bound,null,'#171f1e',2);for(let i=0;i<3;i++)plate(c,[-22,-4,15][i],-2,[.9,-.8,.3][i],i,true);}
 else if(released)for(let i=0;i<3;i++)plate(c,[-16,1,18][i],-4,[-.5,.4,.8][i],i,true);
 c.restore();
}
const water=S.liveWater;S.liveWater=function(c,b){water?.call(this,c,b);const keeper=b.units.find(u=>u.id==='act2-keeper'),r=b.keeperRitual,z=r?.zone;
 if(b.honroStage===17){const site=b.honroMarkers?.find(m=>m.id==='notes');if(site){c.save();c.translate(site.x,site.y-8);c.scale(.7,.7);for(let i=0;i<3;i++)plate(c,i*24-24,-2,[.9,-.8,.3][i],i,true);c.restore();}}
 if(!keeper||b.honroStage!==18||keeper.honroSubdued||keeper.dead||['won','lost'].includes(b.phase))return;
 const stage=b.honroState?.keeperStaging,gesture=stage?.cue||r?.cast;
 if(gesture){c.save();c.strokeStyle='#54665b';c.globalAlpha=.5;c.lineWidth=1.8;for(let i=0;i<3;i++){c.beginPath();c.moveTo(keeper.x+keeper.facing*17,keeper.y-72);c.quadraticCurveTo(keeper.x-180,keeper.y-130-i*35,keeper.x-420-i*55,keeper.y-220-i*35);c.stroke();}c.restore();}
 if(!z)return;c.save();const warning=z.phase==='warning';c.strokeStyle=warning?'#d0bd88':z.kind==='echo'?'#99c8b3':'#90a99a';c.fillStyle=warning?'#b9a27422':z.returned?'#59716622':'#748b7455';c.lineWidth=2; c.setLineDash(warning?[10,8]:[]);c.fillRect(z.x,z.y,z.w,z.h);c.strokeRect(z.x,z.y,z.w,z.h);c.setLineDash([]);
 // Exact 36x36 optional connection collider, no health bar or objective actor.
 const a=z.connection;c.fillStyle='#766d4f';c.fillRect(a.x-18,a.y-18,36,36);c.strokeRect(a.x-18,a.y-18,36,36);c.beginPath();c.moveTo(keeper.x+keeper.facing*17,keeper.y-72);c.lineTo(a.x,a.y);c.stroke();plate(c,a.x,a.y,0,1);
 if(z.kind==='echo'&&!z.returned){const x=z.x+8,y=z.y+z.h*.5,d=z.direction;c.beginPath();c.moveTo(x,y);c.lineTo(x+d*56,y);c.lineTo(x+d*44,y-9);c.moveTo(x+d*56,y);c.lineTo(x+d*44,y+9);c.stroke();}
 c.font='600 13px sans-serif';c.textAlign='center';c.fillStyle=warning?'#dac79b':'#b6d3c2';c.fillText(({seal:'봉음',echo:'되울림',binding:'결박'})[z.kind]+(warning?' · 예고':z.returned?' · 소진':''),z.x+z.w*.5,z.y-15);c.restore();
};
G.HonroKeeperRitualArt={draw,paths:P};
})(globalThis);
