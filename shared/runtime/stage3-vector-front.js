(function(G){'use strict';
// Four distinct actual-camera authoring sections, all native Path2D.
// Path parsing happens once. Existing world tiles cache the composed result.
const paths=new Map(),surfaces=new WeakMap(),C=G.HONRO_CORE;
function p(d){if(!paths.has(d))paths.set(d,new Path2D(d));return paths.get(d);}
function grad(c,x,y,w,h,stops){const g=c.createLinearGradient(x,y,x+w,y+h);for(const[a,v]of stops)g.addColorStop(a,v);return g;}
const intersects=(a,b)=>a[0]<=b[2]&&a[2]>=b[0]&&a[1]<=b[3]&&a[3]>=b[1];
const sections=G.HONRO_FERRY_FOREGROUND.sections.map(s=>({...s,clipPath:p(s.clip),paths:s.paths.map(n=>({...n,path:p(n.d)}))}));
function section(c,s,view){if(view&&!intersects(s.coverage,[view.x,view.y,view.x+view.w,view.y+view.h]))return;c.save();c.clip(s.clipPath);c.translate(...s.origin);c.scale(s.scale,s.scale);const v=view?[(view.x-s.origin[0])/s.scale,(view.y-s.origin[1])/s.scale,(view.x+view.w-s.origin[0])/s.scale,(view.y+view.h-s.origin[1])/s.scale]:null;
 for(const n of s.paths){if(v&&!intersects(n.bounds,v))continue;c.fillStyle=n.fill;c.fill(n.path,'evenodd');c.strokeStyle=n.fill;c.lineJoin='round';c.lineWidth=.45;c.stroke(n.path);}c.restore();}
function draw(c,b,view){if(b?.honroStage!==3)return;c.save();c.fillStyle=grad(c,0,900,1000,17000,[[0,'#76674d'],[.17,'#68624d'],[.42,'#4e5746'],[1,'#344b3d']]);c.fillRect(-6100,400,16500,25500);for(const s of sections)section(c,s,view);c.restore();}
function surfaceData(b){const t=b.terrain.find(t=>t.id==='ferry-ground'&&!t.broken);if(!t)return null;const key=b.sceneVersion+':'+t.x+':'+t.y+':'+t.w+':'+t.h;let data=surfaces.get(b);if(data?.key===key)return data;
 // Contact stays at the real line. Unequal authored front shoulders rise a
 // few world units over it; source material is sampled safely below feet.
 const rows=[[0,-5,25],[190,-8,31],[420,-4,23],[690,-11,35],[920,-6,28],[1170,-9,34],[1410,-5,27],[1650,-12,36],[1880,-7,24],[2100,-4,29],[2320,-10,37],[2530,-6,26],[2750,-11,34],[2960,-5,23],[3160,-8,31],[3370,-4,28],[3580,-10,35],[3810,-6,24],[4040,-9,33],[4276,-5,26]];
 const upper=rows.map(([x,a])=>[x,C.topAt(t,x,t.y)+a]),lower=rows.toReversed().map(([x,,a])=>[x,C.topAt(t,x,t.y)+a]);const d='M'+upper.concat(lower).map(([x,y])=>x+','+y).join('L')+'Z';data={key,lip:p(d)};surfaces.set(b,data);return data;}
function surface(c,b,view){if(b?.honroStage!==3)return;const s=surfaceData(b);if(!s)return;c.save();c.clip(s.lip);c.translate(0,-30);const below=view?{...view,y:view.y+30}:null;for(const f of sections)section(c,f,below);c.restore();}
G.HonroStage3VectorFront={draw,surface};
})(globalThis);
