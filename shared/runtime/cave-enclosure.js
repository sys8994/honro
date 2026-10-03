(function(G){'use strict';
const C=G.HONRO_CORE,B=G.HonroBounds,cache=new WeakMap();
function polygon(ps){const p=new Path2D();ps.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();return p;}
function rock(c,b){const g=c.createLinearGradient(0,0,0,b.height+1800);g.addColorStop(0,'#293439');g.addColorStop(.38,'#37444a');g.addColorStop(.70,'#303e44');g.addColorStop(1,'#17272e');return g;}
function prepare(t,b){const source=t.vertices||t;let q=cache.get(t);if(q?.source===source)return q;
 const pts=C.poly(t).map(p=>[p.x,p.y]),shape=polygon(pts),contour=pts.filter(([x,y])=>y>1&&y<b.height&&x>=0&&x<=b.width),edge=new Path2D();
 contour.forEach(([x,y],i)=>i?edge.lineTo(x,y):edge.moveTo(x,y));
 const bands=[],joints=[],sign=t.honroCeiling?-1:1;
 // Broad ledges and sediment beds follow the authored rock surface. Retained
 // paths, rather than frame noise, describe scale at normal and tactical zoom.
 for(let j=0;j+2<contour.length;j+=5){const segment=contour.slice(j,j+7),a=segment[0],z=segment.at(-1);if(Math.abs(z[0]-a[0])<160)continue;
  const depth=110+(j%4)*42;
  bands.push(polygon([...segment.map(([x,y])=>[x,y+sign*15]),...segment.slice().reverse().map(([x,y],k)=>[x+(k%3-1)*24,y+sign*(depth+k*8)])]));
  const p=new Path2D();p.moveTo(a[0]+40,a[1]+sign*45);p.bezierCurveTo(a[0]+140,a[1]+sign*105,z[0]-110,z[1]+sign*75,z[0]-18,z[1]+sign*130);joints.push(p);
 }
 q={source,shape,edge,bands,joints};cache.set(t,q);return q;
}
function terrain(c,t,b){const q=prepare(t,b);c.save();c.fillStyle=rock(c,b);c.fill(q.shape);c.clip(q.shape);
 q.bands.forEach((p,i)=>{c.fillStyle=i%3===0?'#73817a28':i%3===1?'#15272e45':'#a4a48a15';c.fill(p);});
 c.lineWidth=4;c.strokeStyle='#172a3060';for(const p of q.joints)c.stroke(p);
 c.strokeStyle=t.honroCeiling?'#7081836b':'#a2aea38a';c.lineWidth=t.honroCeiling?3:4;c.lineJoin='round';c.stroke(q.edge);c.restore();
}
function enclosure(c,b,w,h){const v=B.visual(b,w,h,this.scale),key=[b.sceneVersion,b.width,b.height,v.left,v.top,v.right,v.bottom].join(':');
 let q=this._caveEnclosure;if(!q||q.key!==key||q.source!==b.honroCaveEnvelope){
  const fill=new Path2D();fill.rect(v.left,v.top,v.right-v.left,v.bottom-v.top);fill.rect(0,0,b.width,b.height);
  const tunnels=(b.honroCaveEnvelope.portals||[]).map(p=>{const left=p.side==='left',x=left?0:b.width,sign=left?-1:1,far=x+sign*780;
   return{...p,x,far,path:polygon([[x-sign*2,p.top],[x+sign*210,p.top-24],[x+sign*460,p.top+30],[far,p.top+75],[far,p.bottom+35],[x+sign*310,p.bottom+14],[x-sign*2,p.bottom]])};});
  q={key,source:b.honroCaveEnvelope,fill,tunnels};this._caveEnclosure=q;this._skirtBuilds=(this._skirtBuilds||0)+1;
 }
 // The very same world-space color field is used on both sides of all four
 // boundaries. There is no sky cap, vertical seam or outdoor shoulder here.
 c.save();c.fillStyle=rock(c,b);c.fill(q.fill,'evenodd');
 for(const p of q.tunnels){const g=c.createLinearGradient(p.x,0,p.far,0);g.addColorStop(0,'#203035');g.addColorStop(.4,'#15272d');g.addColorStop(1,'#112026');c.fillStyle=g;c.fill(p.path);c.strokeStyle='#75867c38';c.lineWidth=3;c.stroke(p.path);}
 c.restore();this.overscanStats={bounds:v,paths:1+q.tunnels.length,builds:this._skirtBuilds,cave:true,portals:q.tunnels.length};
}
G.HonroCaveRock={terrain,enclosure,prepare,rock};
})(globalThis);
