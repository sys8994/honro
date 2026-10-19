/** Opt-in Stage1 geography measured from the NEW original place painting.
 * Source pixels are art coordinates, never the former map's contour. */
const SCALE=3.2,WIDTH=1536,HEIGHT=1024;
const ground=[[0,526],[120,526],[240,533],[350,544],[450,550],[570,554],[700,575],[820,582],[900,582],[980,596],[1040,593],[1120,577],[1210,563],[1300,538],[1390,510],[1470,497],[1536,493]];
const boughs={
 'fc-choice-1-low-pine-root':[[435,510],[460,493],[480,480],[505,474],[540,492]],
 'pine-branch-west':[[350,420],[390,418],[430,425],[470,420]],
 'pine-branch-east':[[550,399],[590,408],[630,410],[680,407],[730,416]]
};
const points=a=>a.map(([x,y])=>({x:x*SCALE,y:y*SCALE}));
const at=(x,line=ground)=>{const p=x/SCALE;for(let i=1;i<line.length;i++){const a=line[i-1],b=line[i];if(p>=a[0]&&p<=b[0])return(a[1]+(b[1]-a[1])*(p-a[0])/(b[0]-a[0]))*SCALE;}throw Error('Stage1 artwork support outside '+x);};
export function applyStage1ImageFirst(project){
 const s=project.stages.find(s=>s.metadata?.stageId===1);if(!s)return project;
 const prior=new Map(s.terrains.map(t=>[t.id,t]));
 s.width=WIDTH*SCALE;s.height=HEIGHT*SCALE;
 s.playBounds={left:0,top:0,right:s.width,bottom:s.height};s.terrainBounds={...s.playBounds};s.terrainDomainVersion=1;
 const base=(id,upper,depth,material='soil')=>({...prior.get(id),id,name:prior.get(id)?.name||id,type:'solid',layer:'terrain',baseMaterial:material,points:points([...upper,...upper.toReversed().map(([x,y])=>[x,y+depth])]),detail:{spacing:18,roughness:0,optimizeEpsilon:0,seed:1},properties:{...prior.get(id)?.properties,honroWalkEdges:upper.slice(1).map((_,i)=>i)}});
 const floor=base('forest-floor',ground,0);floor.points=points([...ground,[WIDTH,HEIGHT],[0,HEIGHT]]);floor.oneWay=false;
 s.terrains=[floor,...Object.entries(boughs).map(([id,line])=>({...base(id,line,id.includes('root')?19:15,'wood'),oneWay:true}))];
 // These two authored low stones replace the old asset-generated colliders.
 // Their contact contours are read from visible stones within the new trail.
 for(const [id,line,depth]of [
  ['forest-boulder-a',[[242,510],[259,481],[281,465],[300,474],[315,513]],23],
  ['forest-boulder-b',[[840,573],[862,553],[885,555],[908,580]],15]
 ])s.terrains.push({...base(id,line,depth,'rock'),oneWay:false,breakable:false});
 s.elements=[]; // All were scenery or the two colliders re-authored above.
 const place=(u,x,support)=>{u.x=x*SCALE;u.y=at(u.x,support?boughs[support]:ground);if(Object.hasOwn(u,'spawnX'))u.spawnX=u.x;if(Object.hasOwn(u,'spawnY'))u.spawnY=u.y;};
 const poses={'p-archer':[140], 'foe-0':[725], 'foe-3':[1110], 'foe-1':[680,'pine-branch-east'], 'foe-2':[1340], 'npc-woodcutter':[1220]};
 for(const u of s.units){const p=poses[u.id];if(p)place(u,...p);}
 const anchors={start:140,cart:1050,shrine:500,lookout:650,ridge:1370,woodcutter:1220,exit:1490};
 for(const [key,x]of Object.entries(anchors)){s.anchors[key]={x:x*SCALE,y:at(x*SCALE,key==='lookout'?boughs['pine-branch-east']:ground),support:key==='lookout'?'pine-branch-east':'forest-floor'};}
 const markerX=[140,1050,250,500,570,1370,1250,1490];for(const [i,m]of s.markers.entries()){m.x=markerX[i]*SCALE;m.y=at(m.x);}
 const progress={cart:970,more:620,witness:1180,ridge:1320};for(const e of s.events){if(e.when?.progress!==undefined)e.when.progress=progress[e.id]*SCALE;
  // The same finite cart ambush enters from the two creek approaches, rather
  // than stacking every arrival on the eastern initial sentries. Keep its count.
  if(e.id==='cart'&&e.action?.type==='spawn'){const n=e.action.n,make=(x,count)=>({...e.action,n:count,x:x*SCALE,y:at(x*SCALE),support:'forest-floor',spacing:180,maxDistance:220});e.action={type:'multi',actions:[make(870,Math.ceil(n/2)),make(1240,Math.floor(n/2))].filter(a=>a.n)};}
 }
 // Conductive water, common contact ripples and weather remain the existing
 // systems; only their place anchor is moved into the painted shallow ford.
 const water=s.materials.find(m=>m.id==='creek-water');s.materials=water?[{...water,kind:'shallow-water',terrainId:'forest-floor',support:'forest-floor',x1:925*SCALE,x2:1025*SCALE,reference:590*SCALE,depth:22,alpha:.22,surface:undefined,bottom:undefined,points:undefined}]:[];
 s.routes=[140,500,850,1050,1250,1490].map(x=>({x:x*SCALE,y:at(x*SCALE)}));
 s.design.act1Scene={version:2,scenery:[],rocks:[],replaced:[]};
 s.design.forestChoice={version:2,supportId:'fc-choice-1-low-pine-root',treeX:480*SCALE,from:{x:460*SCALE,y:at(460*SCALE)},to:{x:460*SCALE,y:at(460*SCALE,boughs['fc-choice-1-low-pine-root'])},required:false};
 s.design.stage1ImageFirst={revision:1,image:'stage1Place',source:{width:WIDTH,height:HEIGHT},transform:{x:0,y:0,scale:SCALE},artBounds:{left:0,top:0,right:s.width,bottom:s.height},walkRibbon:points(ground),boughs:structuredClone(boughs),routes:{walk:s.routes,ascent:[{x:435*SCALE,support:'forest-floor'},{x:465*SCALE,support:'fc-choice-1-low-pine-root'},{x:455*SCALE,support:'pine-branch-west'},{x:560*SCALE,support:'pine-branch-east'}]}};
 s.design.stage1ImageFirst.runtimeRoster=Object.fromEntries([
  ['foe-0-cluster',790],['foe-3-cluster',1180],['foe-2-cluster',1445],['foe-1-cluster',400,'pine-branch-west']
 ].map(([id,x,support])=>[id,{x:x*SCALE,y:at(x*SCALE,support?boughs[support]:ground)}]));
 Object.assign(s.initialState,{width:s.width,height:s.height});
 return project;
}
