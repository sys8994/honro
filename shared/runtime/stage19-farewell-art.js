(function(G){'use strict';
// The parent's two flat SVGs, compiled once into shared paths by the common build.
const paths=new Map(),reduced=G.matchMedia?.('(prefers-reduced-motion: reduce)');
function shapes(key){if(!paths.has(key))paths.set(key,(G.HONRO_FAREWELL_SPIRITS?.[key]||[]).map(p=>({fill:p.fill,path:new Path2D(p.d)})));return paths.get(key);}
function draw(scene,e){const b=e.b,F=G.HonroStage19Farewell;if(!F?.active(b))return;const c=scene.ctx,app=scene.storyFrame?.app||G.HonroApp,dialogue=app?.engine?.b===b?app.dialogue:null,time=performance.now()/1000,rows=F.presentation(b,dialogue,time,!!reduced?.matches);
 const route=F.marker(b,'route');if(F.done(b).route&&route){c.save();c.strokeStyle='#c6d0aa';c.globalAlpha=.56;c.lineWidth=2;c.beginPath();c.ellipse(route.x,route.y-2,82,19,0,0,Math.PI*2);c.stroke();c.beginPath();c.ellipse(route.x,route.y-2,69,15,0,0,Math.PI*2);c.stroke();c.restore();}
 for(const row of rows){c.save();c.globalAlpha=row.alpha;c.translate(row.x+row.driftX,row.y+row.driftY);c.rotate(row.rotation||0);c.scale(row.scale*row.mirror,row.scale);for(const p of shapes(row.asset)){c.fillStyle=p.fill;c.fill(p.path);}c.restore();}
 if(rows.some(r=>r.asset==='bound')){const m=F.marker(b,'old-soul');c.save();c.translate(m.x,m.y);c.fillStyle='#59615a';c.strokeStyle='#92977d';c.lineWidth=2;c.beginPath();c.moveTo(-55,0);c.lineTo(-48,-42);c.lineTo(42,-40);c.lineTo(53,0);c.closePath();c.fill();c.stroke();c.strokeStyle='#c8c3a6';c.lineWidth=1.5;for(let i=0;i<3;i++){c.beginPath();c.moveTo(-33+i*24,-31);c.lineTo(-33+i*24,-12);c.lineTo(-23+i*24,-12);c.stroke();}c.restore();}
 scene.farewellPresentation=rows;
}
G.HonroStage19FarewellArt={draw,shapes};
})(globalThis);
