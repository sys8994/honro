(function(G){'use strict';
// Deep strata below flat below-floor slabs (2026-11-24, QA 2026-11-24 item 7).
// In stages 21/24/26/28/29 everything below the drawn ground was one flat colour from a
// horizontal seam down. The approved Act 5 camp deep geology (strata bands and rounded
// boulders; G.HONRO_DEEP_STRATA) is laid there in that stage's slab colour, mirrored tile to
// tile so bands continue across joins, and darkens with depth. It is clipped below a measured
// line that stays 80+ units under the lowest drawn ground at every x (running max of the
// slab start, sampled every 100 units), so authored ground art is never covered.
// Paint only: collision, terrain, saves and map revisions are unchanged.
const S=G.HonroScene?.prototype,D=G.HONRO_DEEP_STRATA;if(!S||!D)return;
// stage: [width, height, x0, step, slab rgb, line y per step]
const LINES={"21":[6400,3200,-4200,100,[60,53,41],[3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580,3580]],"24":[7000,3300,-4200,100,[50,50,45],[3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3260,3260,3210,3200,3200,3210,3210,3210,3220,3240,3240,3240,3240,3240,3270,3270,3270,3270,3270,3270,3270,3260,3260,3240,3230,3200,3180,3160,3170,3180,3210,3210,3230,3230,3230,3230,3230,3230,3230,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3260,3250,3250,3250,3250,3250,3260,3260,3260,3260,3260,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270,3270]],"26":[7000,3300,-4200,100,[55,50,40],[3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3120,3150,3150,3200,3220,3220,3220,3220,3220,3350,3350,3350,3350,3350,3350,3350,3350,3350,3350,3350,3330,3310,3310,3290,3290,3290,3290,3300,3300,3300,3300,3310,3310,3310,3310,3310,3310,3310,3310,3310,3310,3310,3330,3350,3410,3410,3410,3410,3410,3410,3410,3410,3370,3350,3310,3290,3270,3260,3230,3230,3220,3240,3290,3310,3360,3370,3370,3370,3370,3370,3370,3370,3370,3370,3370,3370,3390,3390,3390,3390,3390,3390,3390,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110,3110]],"28":[7200,3400,-4200,100,[54,49,40],[2800,2800,2800,2800,2800,2790,2790,2790,2790,2790,2790,2790,2810,2810,2810,2810,2810,2810,2810,2800,2790,2790,2790,2790,2790,2790,2790,2790,2790,2790,2790,2790,2790,2790,2930,2980,3050,3120,3190,3210,3230,3230,3230,3230,3230,3230,3230,3220,3220,3220,3220,3220,3220,3220,3150,3150,3150,3150,3150,3150,3100,3100,3100,3100,3100,3100,3100,3080,3060,3090,3090,3090,3090,3090,3090,3090,3080,3070,3020,3010,3010,3010,3010,3030,3060,3070,3070,3070,3070,3070,3070,3070,3050,3050,3050,3050,3050,2980,3020,3030,3030,3030,3080,3080,3080,3080,3080,3080,3080,3050,3050,3050,3040,3040,3040,3040,2900,2790,2790,2790,2790,2790,2810,2810,2810,2810,2810,2810,2810,2790,2790,2790,2790,2790,2790,2790,2800,2800,2800,2800,2800,2800,2800,2790,2790,2790,2790,2790,2790,2790,2790,2790,2790,2800,2800,2800,2800]],"29":[7200,3500,-4200,100,[78,79,72],[3100,3120,3140,3160,3180,3200,3220,3240,3260,3280,3290,3300,3310,3320,3330,3350,3370,3390,3410,3430,3430,3430,3430,3440,3440,3440,3450,3450,3450,3450,3460,3460,3460,3470,3470,3470,3480,3480,3480,3480,3490,3490,3490,3500,3500,3500,3500,3510,3510,3510,3520,3520,3520,3530,3530,3530,3530,3530,3530,3530,3510,3500,3500,3500,3500,3500,3490,3460,3440,3450,3450,3460,3470,3480,3480,3480,3480,3490,3490,3490,3490,3490,3490,3490,3490,3490,3490,3370,3370,3370,3370,3360,3360,3360,3360,3360,3360,3360,3360,3360,3360,3360,3340,3290,3230,3170,3150,3150,3150,3160,3160,3160,3160,3160,3170,3170,3170,3170,3170,3170,3180,3180,3180,3180,3180,3190,3190,3190,3190,3190,3200,3200,3200,3200,3200,3200,3200,3200,3190,3180,3170,3160,3160,3190,3220,3240,3270,3300,3330,3350,3380,3410,3420,3420,3420,3420,3420]]};
const SCALE=2.4,cache=new Map();
function stageLine(b){
 const row=LINES[b?.honroStage];if(!row||b.mode!=='campaign'||b.honroCustom!==false||b.honroMapOrigin!=='campaign')return null;
 const [w,h,x0,step,slab,ys]=row;if(b.width!==w||b.height!==h)return null;
 let q=cache.get(b.honroStage);if(q)return q;
 const p=new Path2D(),far=40000,top=Math.min(...ys);p.moveTo(x0-far,ys[0]);ys.forEach((y,i)=>p.lineTo(x0+i*step,y));
 p.lineTo(x0+(ys.length-1)*step+far,ys.at(-1));p.lineTo(x0+(ys.length-1)*step+far,h+far);p.lineTo(x0-far,h+far);p.closePath();
 const bg=hex(D.background),lum=c=>.299*c[0]+.587*c[1]+.114*c[2],L=lum(bg);
 const fills=D.paths.map(([f,d,rule])=>{const c=hex(f),r=lum(c)/L;return{path:new Path2D(d),rule,color:'rgb('+slab.map((s,k)=>Math.round(Math.min(255,s*(.5*r+.5*c[k]/bg[k])))).join(',')+')'};});
 q={clip:p,top,h,slab,fills};cache.set(b.honroStage,q);return q;
}
function hex(s){return [1,3,5].map(i=>parseInt(s.slice(i,i+2),16));}
function paint(c,q){
 const m=c.getTransform();if(!m.a||m.b||m.c)return;
 const vl=-m.e/m.a,vt=-m.f/m.d,vr=vl+c.canvas.width/m.a,vb=vt+c.canvas.height/m.d;if(vb<q.top)return;
 const [,,vw,vh]=D.viewBox,tw=vw*SCALE,th=vh*SCALE;
 c.save();try{c.filter='none';c.globalAlpha=1;c.globalCompositeOperation='source-over';c.shadowColor='transparent';c.clip(q.clip);c.fillStyle='rgb('+q.slab.join(',')+')';c.fillRect(vl,Math.max(vt,q.top),vr-vl,vb-Math.max(vt,q.top));
  // Rows are shifted by a fraction of a tile and alternate tiles are mirrored left-right only,
  // so strata bands continue across joins without a four-way symmetric pattern.
  for(let j=Math.max(0,Math.floor((vt-q.top)/th));q.top+j*th<vb;j++){const shift=(j*0.37%1)*tw;
   for(let i=Math.floor((vl-shift)/tw);i*tw+shift<vr;i++){const k=i+j;
   c.save();c.translate(i*tw+shift+(k&1?tw:0),q.top+j*th);c.scale((k&1?-1:1)*SCALE,SCALE);
   for(const f of q.fills){c.fillStyle=f.color;c.fill(f.path,f.rule);}c.restore();}}
  const g=c.createLinearGradient(0,q.top,0,q.top+9000);g.addColorStop(0,'rgba(12,10,9,0)');g.addColorStop(.08,'rgba(12,10,9,.08)');g.addColorStop(.45,'rgba(12,10,9,.42)');g.addColorStop(1,'rgba(12,10,9,.62)');
  c.fillStyle=g;c.fillRect(vl,Math.max(vt,q.top),vr-vl,vb-Math.max(vt,q.top));
 }finally{c.restore();}
}
const layer=S._landmarkLayer;
S._landmarkLayer=function(c,landmarks,name){
 const out=layer.call(this,c,landmarks,name);
 if(name==='front'&&this._staticCacheBuild){const q=stageLine(this.battle);if(q)paint(c,q);}
 return out;
};
G.HonroDeepStrata={version:1,stageLine};
})(globalThis);
