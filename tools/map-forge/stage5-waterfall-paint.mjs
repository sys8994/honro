/** Fresh lake-layout Stage5 only. Shared fluid/target/lake coordinates stay exact. */
const copy=x=>structuredClone(x),ps=a=>a.map(([x,y])=>({x,y}));
export const STAGE5_PAINT={version:1,cliff:{image:'cliff5',x:3730,y:1080,width:2500,height:3750},cave:[[3970,2140],[4025,2123],[4080,2116],[4120,2103],[4180,2095],[4240,2102],[4310,2081],[4375,2096],[4428,2127],[4460,2163],[4490,2188],[4505,2230],[4493,2268],[4500,2300],[4478,2336],[4440,2374],[4400,2395],[4350,2407],[4300,2416],[4250,2408],[4190,2410],[4130,2414],[4055,2408],[3960,2405]],tree:{x:660,height:630,foot:.54},westBranch:'west-overlook',receiverRock:'ritual-overlook',flowOffset:900};
const top=(t,x)=>{for(let i=0;i<t.points.length;i++){const a=t.points[i],b=t.points[(i+1)%t.points.length];if(b.x>a.x&&x>=a.x&&x<=b.x)return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);}throw Error('Stage5 missing surface '+t.id+'/'+x);};
export function applyStage5WaterfallPaint(project){const s=project.stages.find(s=>s.metadata?.stageId===5);if(!s||s.initialState?.honroStage5LakeRevision!==1)return project;
 const cliff=s.terrains.find(t=>t.id==='waterfall-cliff'),lower=cliff.points.findIndex(p=>p.x===3960&&p.y===2405),upper=cliff.points.findIndex(p=>p.x===3970&&p.y===2140);if(lower<0||upper<lower)throw Error('Stage5 missing cave boundary');cliff.points.splice(lower,upper-lower+1,...ps(STAGE5_PAINT.cave.slice().reverse()));
 const floor=s.terrains.find(t=>t.id==='valley-floor'),branch=s.terrains.find(t=>t.id==='west-overlook'),rock=s.terrains.find(t=>t.id==='ritual-overlook');
 Object.assign(branch,{baseMaterial:'wood',oneWay:true,points:ps([[640,2438],[700,2428],[790,2424],[890,2430],[990,2444],[991,2459],[889,2454],[787,2456],[699,2460],[639,2471]])});branch.properties={...branch.properties,surfaceKind:'branch'};
 Object.assign(rock,{baseMaterial:'rock',oneWay:false,points:ps([[1330,2640],[1400,2615],[1440,2545],[1530,2525],[1690,2520],[1775,2585],[1840,2646],[1840,2725],[1330,2725]])});
 const at=(x,support='valley-floor')=>top(s.terrains.find(t=>t.id===support),x);
 const supportAt=x=>x>=1330&&x<=1840&&top(rock,x)<top(floor,x)?'ritual-overlook':'valley-floor';
 const positions={'foe-1':1770,'foe-4':550,'foe-5':1050,'foe-8':1240,'foe-9':650};
 for(const u of s.units){u.x=positions[u.id]??u.x;if(!['bat','crow'].includes(u.honroType))u.y=at(u.x,supportAt(u.x));u.spawnX=u.x;u.spawnY=u.y;}
 Object.assign(s.anchors.receiver,{support:'ritual-overlook',y:at(s.anchors.receiver.x,'ritual-overlook')});Object.assign(s.anchors.roost,{support:'ritual-overlook',y:at(s.anchors.roost.x,'ritual-overlook')});
 Object.assign(s.anchors.basin,{support:supportAt(s.anchors.basin.x),y:at(s.anchors.basin.x,supportAt(s.anchors.basin.x))});
 s.anchors.westOverlook={x:820,y:at(820,'west-overlook'),support:'west-overlook'};
 for(const m of s.markers){if(['receiver-5','marker-1'].includes(m.id)){m.support='ritual-overlook';m.y=at(m.x,m.support);}else if(m.id==='habitat-5-0'){m.x=1880;m.support='valley-floor';m.y=at(m.x);}else if(m.id==='habitat-5-1'){m.support='ritual-overlook';m.y=at(m.x,m.support);}else if(m.type==='rest')m.y=at(m.x,supportAt(m.x));}
 for(const e of s.elements){if(e.id==='landmark-1'){e.x=s.anchors.receiver.x;e.y=s.anchors.receiver.y;}if(e.id==='stage5-entry-pine'){e.x=660;e.y=at(660)+4;}}
 s.design.stage5Paint=copy(STAGE5_PAINT);s.metadata.waterfallPaintTerrainRevision=1;s.initialState.honroStage5PaintRevision=1;
 return project;
}
