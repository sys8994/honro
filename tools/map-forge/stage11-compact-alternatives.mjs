/** Unadopted alternatives; the baseline candidate module remains immutable.
 * Lowering the solid rock does not magically create a low-ground bypass. */
import {createCompactCandidate,heightOn} from './stage11-compact-candidates.mjs';
export function createTwoStepB(){
 const c=createCompactCandidate('B'),rock=c.terrains.find(t=>t.id==='compact-firing-rock'),left=rock.points[0].x,base=heightOn(c.floor,left),top=[[left,base-100],[left+90,base-100],[left+90,base-200],[left+390,base-200]];
 rock.points=[...top,[left+390,heightOn(c.floor,left+390)+30],[left,heightOn(c.floor,left)+30]].map(([x,y])=>({x,y}));rock.properties.honroWalkEdges=[0,1,2];
 const start={x:left-28,y:heightOn(c.floor,left-28),surfaceId:'compact-floor'},first={x:left+30,y:base-100,surfaceId:rock.id},secondEntry={x:left+62,y:base-100,surfaceId:rock.id},second={x:left+120,y:base-200,surfaceId:rock.id},last={x:left+380,y:base-200,surfaceId:rock.id};
 start.jumpTo={...first,support:rock.id};secondEntry.jumpTo={...second,support:rock.id};
 const route=[start,first,secondEntry,second,last],main=c.routes.find(r=>r.id==='main'),firstRock=main.anchors.findIndex(p=>p.jumpTo?.support===rock.id),afterRock=main.anchors.findIndex(p=>p.surfaceId==='compact-bier-cover');
 main.anchors=[...main.anchors.slice(0,firstRock),...structuredClone(route),...main.anchors.slice(afterRock)];
 c.routes.find(r=>r.id==='firing-rock').anchors=route;c.routes.find(r=>r.id==='firing-rock').kind='two-ordinary-jumps';
 c.sites.firingRock=structuredClone(last);c.proxies.firingRock={...c.proxies.firingRock,totalRise:200,stepRises:[100,100],standing:structuredClone(last)};
 c.alternative={id:'B-two-step-200',adopted:false,change:'Only the rooted solid firing-rock top is lowered from four 100-unit steps to two; 300-unit top plateau.',lowGroundBypass:false,reason:'The rooted solid remains across this 2D floor. Optional high ground needs a separately authored fork/topology, not a claim based on lowering.'};return c;
}
export function createOpenTwoStepB(){
 const c=createTwoStepB(),rock=c.terrains.find(t=>t.id==='compact-firing-rock'),floor='compact-floor',bier=c.terrains.find(t=>t.id==='compact-bier-cover'),left=bier.points[0].x,right=bier.points[1].x,roofY=bier.points[0].y;
 rock.oneWay=true;rock.properties={...rock.properties,rearSupportRole:'rear-shelf',visualPlane:'L1-back',colliderPolicy:'oneWay-top',frontBodySolid:false};
 const p=x=>({x,y:heightOn(c.floor,x),surfaceId:floor}),walk=(from,to)=>[from,...c.floor.map(p=>p[0]).filter(x=>x>from&&x<to),to].map(p);
 const takeoff=p(left-28),landing={x:left+25,y:roofY,surfaceId:bier.id};takeoff.jumpTo={...landing,support:bier.id};
 const neckStart=c.crossing[0][0],neckEnd=c.crossing.at(-1)[0],main=c.routes.find(r=>r.id==='main'),afterNeck=main.anchors.filter(p=>p.x>=neckEnd&&p.surfaceId===floor);
 main.anchors=[...walk(c.spawn,takeoff.x).slice(0,-1),takeoff,landing,{x:right-25,y:roofY,surfaceId:bier.id},p(right+40),...walk(right+40,neckStart).slice(1),...c.crossing.slice(1).map(([x,y])=>({x,y,surfaceId:'compact-stone-neck'})),...afterNeck];
 c.proxies.firingRock={...c.proxies.firingRock,role:'rear-shelf',visualPlane:'L1-back',colliderPolicy:'oneWay-top',frontBodySolid:false,projectilePolicy:'Upward and side entry pass; downward exterior-to-interior top contact collides. Uses existing open-platform rules.'};
 c.visualSupports.push({id:'firing-rock-rear-shelf',terrainId:rock.id,rearSupportRole:'rear-shelf',visualPlane:'L1-back',collision:false,supportSockets:{foot:p(rock.points[0].x),bearing:structuredClone(c.sites.firingRock)},purpose:'Rear rock body and grounding are drawn behind the low path; the actor must never appear to walk through a foreground solid wall.'});
 c.alternative={id:'B-two-step-open-200',adopted:false,change:'Two-step rear rock shelf uses existing one-way top contacts; low front path jumps only the solid bier, high route is optional.',lowGroundBypass:true,warning:'This changes the collider/visual-plane policy; it is not a physical bypass through an unchanged solid wall. Art must distinguish front path from rear body before adoption.'};return c;
}
