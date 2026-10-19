/** Stage4: the approved closed gate, yard and broken timber determine contacts.
 * Full original painting, uniform transform, independent far; no legacy silhouettes. */
const SCALE=1.6,WIDTH=2138,HEIGHT=736;
const profiles={
 'gate-basin':[[0,385],[150,372],[300,374],[450,381],[650,421],[820,445],[1010,468],[1200,488],[1410,500],[1600,514],[1790,526],[1950,517],[2138,510]],
 'gate-threshold':[[328,357],[370,357],[401,358]],
 'west-shoulder':[[130,276],[170,279],[220,289],[270,297]],
 'gate-roof':[[247,263],[281,250],[311,218],[348,233],[392,238],[421,234],[448,260]],
 'burned-gallery':[[1445,410],[1500,400],[1580,382],[1660,375],[1745,377]],
 'east-rock-low':[[1780,405],[1830,391],[1880,398],[1930,419],[1955,435]],
 'east-rock-high':[[1725,342],[1770,335],[1810,340],[1840,352]],
 'east-step-1':[[1805,334],[1818,318],[1834,295],[1845,284],[1880,286],[1933,293]],
 'east-watch':[[1796,221],[1820,208],[1847,187],[1875,201],[1910,207],[1937,220],[1948,229]]
};
const pts=ps=>ps.map(([x,y])=>({x:x*SCALE,y:y*SCALE}));
function at(x,id='gate-basin'){const ps=profiles[id];for(let i=1;i<ps.length;i++){const a=ps[i-1],b=ps[i];if(x>=a[0]&&x<=b[0])return(a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]))*SCALE;}throw Error('Stage4 source contact outside '+id+' '+x);}
const contact=(x,support='gate-basin')=>({x:x*SCALE,y:at(x,support),support});
const air=(x,y)=>({x:x*SCALE,y:y*SCALE});
export function applyStage4ImageFirst(project){const s=project.stages.find(s=>s.metadata?.stageId===4);if(!s)return project;const prior=new Map(s.terrains.map(t=>[t.id,t]));s.width=WIDTH*SCALE;s.height=HEIGHT*SCALE;s.playBounds={left:0,top:0,right:s.width,bottom:s.height};s.terrainBounds={...s.playBounds};s.terrainDomainVersion=1;s.camera={...s.camera,focusBounds:{left:0,top:-1000,right:s.width,bottom:s.height}};
 s.terrains=Object.entries(profiles).map(([id,line])=>{const floor=id==='gate-basin',breakable=id==='burned-gallery',wood=/roof|watch|step-1|gallery/.test(id);return{...prior.get(id),id,name:prior.get(id)?.name||id,type:'solid',layer:'terrain',baseMaterial:wood?'wood':floor?'soil':'rock',oneWay:!floor,breakable,points:pts(floor?[...line,[WIDTH,HEIGHT],[0,HEIGHT]]:[...line,...line.toReversed().map(([x,y])=>[x,y+9])]),detail:{spacing:20,roughness:0,optimizeEpsilon:0,seed:4},properties:{...prior.get(id)?.properties,hp:breakable?280:99999,maxHp:breakable?280:99999,route:false,surfaceKind:wood?'wood':floor?'soil':'rock',honroWalkEdges:line.slice(1).map((_,i)=>i)}};});
 s.elements=[];
 const poses={'p-archer':contact(560),'p-mage':contact(625),objective:contact(365,'gate-threshold'),'npc-hwigyeom':contact(700),'npc-chunrye':contact(465),'foe-0':contact(970),'foe-3':contact(1110),'foe-6':contact(1175),'foe-1':contact(1660),'foe-4':contact(1870),'foe-2':contact(1740,'burned-gallery'),'foe-5':air(1780,140)};
 for(const u of s.units){const p=poses[u.id];if(!p)continue;Object.assign(u,{x:p.x,y:p.y});if(Object.hasOwn(u,'spawnX'))u.spawnX=p.x;if(Object.hasOwn(u,'spawnY'))u.spawnY=p.y;}
 s.anchors={...s.anchors,start:poses['p-archer'],gate:poses.objective,leftLane:contact(850),cartChoke:contact(1510),rightLane:contact(1950),exit:contact(2090),watch:contact(1880,'east-watch'),westVantage:contact(220,'west-shoulder')};
 const markers=[poses.objective,contact(960),contact(735),contact(1450),contact(1310),contact(1880,'east-watch'),contact(1900,'east-step-1')];for(const[i,m]of s.markers.entries()){if(i<markers.length)Object.assign(m,markers[i]);if(m.id==='habitat-4-0')Object.assign(m,contact(1325));if(m.id==='habitat-4-1')Object.assign(m,contact(2060));}
 for(const e of s.events){if(e.id==='siege-0')Object.assign(e.action,{...contact(1515),spacing:170,maxDistance:260});if(e.id==='siege-1')Object.assign(e.action,{x:1950*SCALE,y:180*SCALE,requireFlightClearance:true,maxDistance:640});}
 s.materials=[];s.routes=[contact(480),contact(850),contact(1150),contact(1450),contact(1700),contact(1950),s.anchors.exit];s.design.act1Scene={version:2,scenery:[],rocks:[],replaced:[]};delete s.design.stage4Gate;delete s.design.forestChoice;
 s.design.stage4ImageFirst={revision:1,quietLayers:1,image:'stage4QuietNear',far:'quietFar',source:{width:WIDTH,height:HEIGHT},transform:{x:0,y:0,scale:SCALE},artBounds:{left:0,top:0,right:s.width,bottom:s.height},galleryFracture:[[1544,393],[1551,391],[1549,398],[1556,401],[1552,407],[1544,410],[1547,402],[1542,399]],runtimeRoster:{'foe-0-cluster':contact(1280),'foe-3-cluster':contact(1490),'foe-6-cluster':contact(1570),'foe-1-cluster':contact(1950),'foe-4-cluster':contact(2090),'foe-2-cluster':contact(1910,'east-step-1'),'foe-5-cluster':air(2020,260)},routes:{yard:s.routes,west:[contact(240),contact(220,'west-shoulder'),contact(285,'gate-roof')],east:[contact(1400),contact(1490,'burned-gallery'),contact(1660,'burned-gallery'),contact(1750,'east-rock-high'),contact(1860,'east-step-1'),contact(1880,'east-watch')],eastAfterBreak:[contact(2000),contact(1940,'east-rock-low'),contact(1820,'east-step-1'),contact(1880,'east-watch')]}};
 Object.assign(s.initialState,{width:s.width,height:s.height,routePoints:s.routes});delete s.initialState.honroStage4GateRevision;return project;
}
