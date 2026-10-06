// Exact extrema for our retained M/L/Q/C vector vocabulary. No raster, browser,
// native dependency or control-point-box approximation is used in authoring.
export function pathBounds(d, matrix = [1,0,0,1,0,0]) {
 const tx=([x,y])=>[matrix[0]*x+matrix[2]*y+matrix[4],matrix[1]*x+matrix[3]*y+matrix[5]],points=[];
 let start=[0,0],current=[0,0];
 const roots=(a,b,c)=>Math.abs(a)<1e-10?Math.abs(b)<1e-10?[]:[-c/b]:(b*b-4*a*c<0?[]:[(-b+Math.sqrt(b*b-4*a*c))/(2*a),(-b-Math.sqrt(b*b-4*a*c))/(2*a)]);
 const curve=control=>{const ps=control.map(tx),ts=new Set([0,1]);for(let axis=0;axis<2;axis++){const p=ps.map(v=>v[axis]);if(p.length===3){const den=p[0]-2*p[1]+p[2];if(Math.abs(den)>1e-10)ts.add((p[0]-p[1])/den);}if(p.length===4)for(const t of roots(-p[0]+3*p[1]-3*p[2]+p[3],2*(p[0]-2*p[1]+p[2]),p[1]-p[0]))ts.add(t);}for(const t of ts)if(t>=0&&t<=1){let row=ps;while(row.length>1)row=row.slice(1).map((p,i)=>p.map((v,k)=>row[i][k]*(1-t)+v*t));points.push(row[0]);}};
 for(const [,cmd,args]of d.matchAll(/([MLQCZ])([^MLQCZ]*)/gi)){const ns=(args.match(/[-+]?(?:\d*\.)?\d+/g)||[]).map(Number),step={M:2,L:2,Q:4,C:6,Z:0}[cmd];if(cmd==='Z'){curve([current,start]);current=start;continue;}for(let i=0;i<ns.length;i+=step){const ps=[];for(let j=0;j<step;j+=2)ps.push([ns[i+j],ns[i+j+1]]);if(cmd==='M'&&i===0){start=current=ps[0];points.push(tx(current));}else{curve([current,...ps]);current=ps.at(-1);}}}
 return [Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))];
}
export function paintedBounds(asset,api,{filter=()=>true,animation='idle',time=0}={}){
 const sample=api.sampleAnimation(asset,animation,time,true),matrices=api.rigMatrices(asset,sample.poses),all=[];
 for(const p of asset.paths)if(filter(p)&&(sample.poses[p.part].opacity??1)>.01){const b=pathBounds(p.d,matrices[p.part]),pad=p.stroke?(p.strokeWidth||1)/2:0;all.push([b[0]-pad,b[1]-pad,b[2]+pad,b[3]+pad]);}
 return [Math.min(...all.map(b=>b[0])),Math.min(...all.map(b=>b[1])),Math.max(...all.map(b=>b[2])),Math.max(...all.map(b=>b[3]))];
}
