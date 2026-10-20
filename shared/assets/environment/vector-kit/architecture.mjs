/** Shared geometry-aware building assembly. Inputs reference live terrain IDs only.
 * Walls are rear scenery; all walking/roof lines remain the canonical one-way edges.
 */
export function compileArchitecture(specs,b,kit,core){
 const groups=[],covered=new Set(),joins=[],terrain=id=>b.terrain.find(t=>t.id===id&&!t.broken);
 const point=(x,y)=>({x,y}),lineD=ps=>ps.map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join(''),polyD=ps=>lineD(ps)+'Z';
 const topLine=t=>{const ps=core.poly(t),edges=t.honroWalkEdges;if(edges?.length)return [...edges.map(i=>ps[i]),ps[edges.at(-1)+1]];return ps.slice(0,ps.length/2);};
 const at=(ps,x)=>{for(let i=1;i<ps.length;i++){const a=ps[i-1],z=ps[i];if(x>=Math.min(a.x,z.x)-.01&&x<=Math.max(a.x,z.x)+.01)return a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x||1);}return x<ps[0].x?ps[0].y:ps.at(-1).y;};
 function group(id,instances,{shape,material='wood',paint='body',clip,paths=[]}={}){
  const assets=Object.create(kit.ASSETS),all=[];
  if(shape){const xs=shape.map(p=>p.x),ys=shape.map(p=>p.y),assetId='architecture:'+id;assets[assetId]={id:assetId,material,bounds:{x:Math.min(...xs),y:Math.min(...ys),w:Math.max(1,Math.max(...xs)-Math.min(...xs)),h:Math.max(1,Math.max(...ys)-Math.min(...ys))},scaleRange:[1,1],rotationRange:[0,0],clipToShape:null,paths:[{id:assetId,d:polyD(shape),paint},...paths]};all.push({id,assetId,palette:kit.palette});}
  all.push(...instances);const compiled=kit.compileScene({instances:all},{assets});groups.push({id,compiled,clipD:clip&&polyD(clip)});return compiled;
 }
 const instance=(id,assetId,x,y,scale=1,rotation=0)=>({id,assetId,palette:kit.palette,transform:{x,y,scale,rotation}});
 function member(id,assetId,x,foot,bearing){const def=kit.ASSETS[assetId],height=-def.sockets.top.at[1],scale=(foot-bearing)/height;
  if(scale<def.scaleRange[0]-.001||scale>def.scaleRange[1]+.001)return null;
  joins.push({id,assetId,x,foot,bearing,scale,error:0});return instance(id,assetId,x,foot,scale);
 }
 function baseLine(floor,left,right,steps=5){return Array.from({length:steps+1},(_,i)=>{const x=left+(right-left)*i/steps;return point(x,core.topAt(floor,x,floor.y));});}
 function strip(id,upper,depth,material,paint='body'){
  const lower=upper.map(p=>point(p.x,p.y+depth)),shape=[...upper,...lower.toReversed()];
  group(id,[],{shape,material,paint});return shape;
 }
 function roof(spec,t){
  const top=topLine(t),left=top[0].x,right=top.at(-1).x,width=right-left,drop=spec.eaveDrop??8;
  const eave=spec.profileEave?top.map(p=>point(p.x,p.y+drop)):[point(left,Math.max(...top.map(p=>p.y))+drop),point(left+width*.48,Math.max(...top.map(p=>p.y))+drop+4),point(right,Math.max(...top.map(p=>p.y))+drop-2)];
  const body=[...top,...eave.toReversed()];group(spec.id+'/roof-skin',[],{shape:body,material:'roof'});
  // One broad upper face and two restrained tile/hip planes, clipped to the roof.
  const hip=top.map(p=>point(p.x,p.y+Math.min(14,width*.025))),middle=top.map(p=>point(p.x,p.y+Math.min(37,width*.055)));
  group(spec.id+'/roof-light',[],{shape:[...top,...hip.toReversed()],material:'roof',paint:'light',clip:body});
  group(spec.id+'/roof-mid',[],{shape:[...hip,...middle.toReversed()],material:'roof',paint:'base',clip:body});
  const bands=[],span=spec.eaveSpan||105,total=eave.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-eave[i].x,p.y-eave[i].y),0),count=Math.max(1,Math.ceil(total/span)),step=total/count;
  function sample(distance){let d=0;for(let i=1;i<eave.length;i++){const a=eave[i-1],z=eave[i],length=Math.hypot(z.x-a.x,z.y-a.y);if(d+length>=distance||i===eave.length-1){const f=Math.max(0,Math.min(1,(distance-d)/length));return point(a.x+(z.x-a.x)*f,a.y+(z.y-a.y)*f);}d+=length;}}
  for(let i=0;i<count;i++){const a=sample(i*step),z=sample((i+1)*step),m=sample((i+.5)*step),scale=step/120;bands.push(instance(spec.id+'/eave-'+i,'hanok.eave.band',m.x,m.y,scale,Math.atan2(z.y-a.y,z.x-a.x)*180/Math.PI));}
  strip(spec.id+'/continuous-fascia',eave,step/120*32,'wood','shade');
  group(spec.id+'/eaves',bands);covered.add(t.id);
  return{top,eave,left,right,bearing:x=>at(eave,x)+step/120*29};
 }
 function building(spec){
  const t=terrain(spec.roof),floor=terrain(spec.ground);if(!t||!floor)return;
  const rtop=topLine(t),left=spec.left??rtop[0].x+18,right=spec.right??rtop.at(-1).x-18;
  // Compile the roof last so its soffit overlaps the column heads and wall joins.
  const groupStart=groups.length,coverStart=new Set(covered),r=roof(spec,t),roofGroups=groups.splice(groupStart);covered.clear();for(const id of coverStart)covered.add(id);covered.add(t.id);
  const upper=[point(left,at(r.eave,left)+12),...r.eave.filter(p=>p.x>left&&p.x<right).map(p=>point(p.x,p.y+12)),point(right,at(r.eave,right)+12)],base=baseLine(floor,left,right),wall=[...upper,...base.toReversed()];
  group(spec.id+'/wall',[],{shape:wall,material:'wall'});
  const infill=[];
  for(const opening of spec.openings||[]){const support=terrain(opening.support||spec.ground);if(!support)continue;const y=core.topAt(support,opening.x,support.y);infill.push(instance(spec.id+'/'+opening.id,opening.assetId,opening.x,y,opening.scale||1));}
  group(spec.id+'/infill',infill,{clip:wall});
  const posts=[];for(const x of spec.columns){const foot=core.topAt(floor,x,floor.y),bearing=r.bearing(x),height=foot-bearing,id=height>290?'hanok.column.long':'hanok.column',p=member(spec.id+'/column-'+x,id,x,foot,bearing);if(p)posts.push(p);}
  group(spec.id+'/columns',posts);
  if(!spec.profileEave){const span=right-left,count=Math.max(1,Math.round(span/310)),segment=span/count,scale=segment/315;if(scale>=.85&&scale<=1.2)group(spec.id+'/beams',Array.from({length:count},(_,i)=>{const x=left+(i+.5)*segment;return instance(spec.id+'/beam-'+i,'hanok.beam',x,r.bearing(x)+6,scale);}));}
  groups.push(...roofGroups);
 }
 function deck(spec){
  const t=terrain(spec.deck),floor=terrain(spec.ground);if(!t||!floor)return;const top=topLine(t),left=top[0].x,right=top.at(-1).x;
  const posts=[],xs=spec.piles||[left+(right-left)*.15,left+(right-left)*.78];
  for(const x of xs){const foot=core.topAt(floor,x,floor.y)+8,bearing=at(top,x)+10;if(foot-bearing<35)continue;const p=member(spec.id+'/pile-'+x,'dock.pile',x,foot,bearing);if(p)posts.push(p);}
  group(spec.id+'/piles',posts);strip(spec.id+'/fascia',top.map(p=>point(p.x,p.y+8)),22,'wood','base');
  if(spec.braces!==false&&posts.length>1){const a=posts[0].transform,z=posts[1].transform,dx=Math.min(220,(z.x-a.x)*.7),dy=(a.y-12)-(at(top,a.x+dx)+15),length=Math.hypot(dx,dy),scale=length/Math.hypot(180,120),angle=Math.atan2(-dy,dx)*180/Math.PI+Math.atan2(120,180)*180/Math.PI;
   if(scale>=.3&&scale<=1.8)group(spec.id+'/brace',[instance(spec.id+'/brace','dock.brace',a.x,a.y-12,scale,angle)]);
  }
 }
 function ledge(spec){
  const t=terrain(spec.deck),floor=terrain(spec.ground);if(!t||!floor)return;const top=topLine(t),left=top[0].x,right=top.at(-1).x,base=baseLine(floor,left,right),shape=[...top,...base.toReversed()];
  group(spec.id+'/body',[],{shape,material:'rock'});
  const width=right-left,parts=[];if(spec.stone==='masonry'){parts.push(instance(spec.id+'/stone','hanok.masonry',(left+right)/2,Math.max(...base.map(p=>p.y))+12,.8));}
  else {const def=kit.ASSETS['rock.shoulder'],scale=Math.max(def.scaleRange[0],Math.min(def.scaleRange[1],width/def.bounds.w*1.15));parts.push(instance(spec.id+'/stone','rock.shoulder',(left+right)/2,Math.max(...base.map(p=>p.y))+22,scale));}
  group(spec.id+'/stone-face',parts,{clip:shape});
 }
 for(const spec of specs||[]){if(spec.type==='building')building(spec);else if(spec.type==='deck')deck(spec);else if(spec.type==='ledge')ledge(spec);}
 return{groups,covered,joins};
}
