import assert from 'node:assert/strict';
import {battlefield} from '../game/tests/helpers.mjs';
/** First-clear reward ledger fixture, not a playthrough of Stages1–17. */
export function campaignEntryReadiness(g){
 const C=g.HONRO_CORE,P=g.HonroProgression,p=C.defaults(),rows=[];
 for(let id=1;id<=17;id++){const st=g.HONRO_CONTENT.stages[id-1];if(id===11)g.HonroAct2.recruit(p);const {b}=battlefield(g,id,{profile:p});P.complete(b);p.heroes=structuredClone(b.heroes);p.honroGrowth=structuredClone(b.honroGrowth.ledger);p.cleared[id]={visits:1,rounds:0};P.recruit(p,st);rows.push({stage:id,limit:structuredClone(b.honroGrowth.limit),xp:Object.fromEntries(p.recruited.map(c=>[c,p.heroes[c].xp])),level:Object.fromEntries(p.recruited.map(c=>[c,C.levelOf(p.heroes[c])]))});}
 const xp=P.legacyCampaignAnchor(17);for(const cls of p.recruited){assert.equal(p.heroes[cls].xp,xp,'Actual first-clear/recruit ledger agrees with campaign anchor');assert.equal(C.levelOf(p.heroes[cls]),C.levelOf(xp));}
 return{xp,level:C.levelOf(xp),heroes:p.heroes,cleared:p.cleared,ledger:p.honroGrowth,rows,scope:'Only a reward-ledger completion fixture of Stages1–17. It does not claim those stages were played.'};
}
/** Test-only input policy. Route graph proposes inputs; only Engine.move/jump
 * advances actors. No battle fields or movement budgets are edited here. */
export function navigator(g,b,e,{tick,ready,record}){
 const C=g.HONRO_CORE,stage=g.HONRO_PROJECT.stages[17],nodes=[],edges=[],map=new Map(),bySurface=new Map(),nav=new Map();
 const distance=(a,z)=>Math.hypot(a.x-z.x,a.y-z.y),surface=u=>e.surface(u.x,u.y-5,u.y+5)?.t?.id;
 function node(p){const key=`${p.surfaceId}:${p.x.toFixed(1)}:${p.y.toFixed(1)}`;if(map.has(key))return map.get(key);const i=nodes.length;nodes.push({...p});edges.push([]);map.set(key,i);if(!bySurface.has(p.surfaceId))bySurface.set(p.surfaceId,new Set());bySurface.get(p.surfaceId).add(i);return i;}
 function edge(a,z,mode=null){const from=node(a),to=node(z);if(from===to)return;const cost=distance(a,z)+(mode?180:0);if(!edges[from].some(x=>x.to===to&&x.mode?.kind===mode?.kind))edges[from].push({to,cost,mode});}
 function walk(a,z){edge(a,z);if(Math.abs(a.y-z.y)<=Math.abs(a.x-z.x)*1.35+1)edge(z,a);}
 for(const r of stage.design.space.routes){for(let i=0;i<r.anchors.length;i++){let p=r.anchors[i];node(p);const leap=p.jumpTo||p.dropTo;if(leap){const t=b.terrain.find(t=>t.id===leap.support),landing={x:leap.x,y:C.topAt(t,leap.x),surfaceId:t.id};edge(p,landing,{kind:p.jumpTo?'jump':'drop',...leap});if(r.id==='main'&&p.jumpTo&&Math.abs(p.x-landing.x)<=260&&Math.abs(p.y-landing.y)<=220)edge(landing,p,{kind:'jump',x:p.x,support:p.surfaceId,speed:leap.speed||.35});p=landing;}const z=r.anchors[i+1];if(!z)continue;if(p.surfaceId===z.surfaceId){const t=b.terrain.find(t=>t.id===p.surfaceId),n=Math.max(1,Math.ceil(Math.abs(z.x-p.x)/90));let old=p;for(let j=1;j<=n;j++){const x=p.x+(z.x-p.x)*j/n,next={x,y:C.topAt(t,x),surfaceId:t.id};walk(old,next);old=next;}}else walk(p,z);}}
 const hero=e.heroesAlive()[0];
 for(const t of b.terrain.filter(t=>t.honroSpaceSurfaceId&&!t.honroCeiling)){const left=Math.max(25,t.x),right=Math.min(b.width-25,t.x+t.w);for(const x of [...Array.from({length:Math.floor((right-left)/80)+1},(_,i)=>left+i*80),right]){const y=C.topAt(t,x);if(!Number.isFinite(y)||y<0||y>b.height)continue;const p={...hero,x,y};if(C.validTerrainContactPose(b.terrain,p))node({x,y,surfaceId:t.id});}}
 for(const site of Object.values(stage.design.space.sites||{}))if(site.standing)node(site.standing);
 for(const [id,set]of bySurface){const list=[...set].sort((a,z)=>nodes[a].x-nodes[z].x);for(let j=1;j<list.length;j++){const a=nodes[list[j-1]],z=nodes[list[j]];if(distance(a,z)<430&&Math.abs(a.y-z.y)<=Math.abs(a.x-z.x)*1.35+.2)walk(a,z);}}
 for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],z=nodes[j];if(a.surfaceId!==z.surfaceId&&Math.abs(a.x-z.x)<95&&Math.abs(a.y-z.y)<35)walk(a,z);}
 function nearest(u){const s=surface(u);let best=0,score=Infinity;for(let i=0;i<nodes.length;i++){const v=distance(u,nodes[i])+(nodes[i].surfaceId===s?0:400);if(v<score){best=i;score=v;}}return best;}
 function route(u,point,enemy){const from=nearest(u),d=nodes.map(()=>Infinity),prev=nodes.map(()=>null),done=new Set();d[from]=0;for(let n=0;n<nodes.length;n++){let i=-1;for(let j=0;j<nodes.length;j++)if(!done.has(j)&&(i<0||d[j]<d[i]))i=j;if(i<0||!Number.isFinite(d[i]))break;done.add(i);for(const step of edges[i])if(d[i]+step.cost<d[step.to]){d[step.to]=d[i]+step.cost;prev[step.to]={from:i,...step};}}
  const range={archer:550,mage:420,knight:75,occultist:420}[u.cls];let best=-1,score=Infinity;
  for(let i=0;i<nodes.length;i++){const p=nodes[i],delta=distance(p,point),dy=Math.abs(p.y-point.y);let penalty=delta*10;if(enemy){if(delta>1700||dy>(u.cls==='knight'?300:900))continue;penalty=Math.abs(delta-range)*2+Math.max(0,dy-(u.cls==='knight'?60:220))*5;}const total=d[i]+penalty;if(total<score){best=i;score=total;}}
  if(best<0||!Number.isFinite(score))return null;const links=[];for(let i=best;i!==from;){const step=prev[i];if(!step)return null;links.push({from:nodes[step.from],point:nodes[i],mode:step.mode});i=step.from;}links.reverse();if(distance(u,nodes[from])>13)links.unshift({from:{x:u.x,y:u.y},point:nodes[from]});return{links,index:0,point:{...point},enemy,goal:nodes[best]};
 }
 function advance(u,point,enemy=false){let state=nav.get(u.id);if(!state||state.point.id!==point.id||distance(state.point,point)>160||state.enemy!==enemy||state.index>=state.links.length){state=route(u,point,enemy);if(!state){record({op:'nav-blocked',hero:u.cls,reason:'no graph route',position:{x:u.x,y:u.y},goal:point});return;}nav.set(u.id,state);}const start={x:u.x,y:u.y};let still=0;
  for(let n=0;n<1600&&ready()&&u.moveLeft>8;n++){
   if(state.air){const a=state.air,from=state.links[state.index]?.from;const departing=a.kind==='drop'&&!state.departed&&e.grounded(u)&&surface(u)===from?.surfaceId,aimX=departing?(a.stepOffX??a.x):a.x;if(!e.grounded(u)||surface(u)!==from?.surfaceId)state.departed=true;if(Math.abs(u.x-aimX)>3)e.move(Math.sign(aimX-u.x)*(a.speed||.35),C.STEP);tick();if(e.grounded(u)&&++state.airFrames>4&&(a.kind!=='drop'||state.departed&&surface(u)===a.support&&Math.abs(u.x-a.x)<18)){record({op:'land',hero:u.cls,x:u.x,y:u.y,support:surface(u),expected:a.support});state.air=null;state.index++;}continue;}
   const link=state.links[state.index];if(!link)break;const p=link.mode?link.from:link.point;const reached=Math.abs(u.x-p.x)<14&&Math.abs(u.y-p.y)<55&&e.grounded(u);
   if(reached){if(link.mode){if(link.mode.kind==='jump'){if(u.moveLeft<e.jumpCost(u)+Math.abs(link.mode.x-u.x)+65)break;if(!e.jump(u))break;record({op:'jump',hero:u.cls,from:{x:u.x,y:u.y},to:link.mode});}state.air=link.mode;state.airFrames=0;state.departed=false;continue;}state.index++;continue;}
   const old={x:u.x,y:u.y};if(Math.abs(u.x-p.x)>5)e.move(Math.sign(p.x-u.x)*(Math.abs(p.x-u.x)<22?.35:1),C.STEP);
   if(e.grounded(u)&&(still>12&&Math.abs(u.x-p.x)>25||Math.abs(u.x-p.x)<25&&u.y-p.y>80)){if(e.jump(u)){record({op:'recovery-jump',hero:u.cls,x:u.x,y:u.y,goal:p});still=0;}}
   tick();still=distance(old,u)<.02?still+1:0;if(still>100){record({op:'nav-blocked',hero:u.cls,position:{x:u.x,y:u.y},support:surface(u),goal:p});nav.delete(u.id);break;}
  }
  for(let i=0;i<300&&ready()&&!e.grounded(u);i++){if(state.air&&Math.abs(u.x-state.air.x)>3)e.move(Math.sign(state.air.x-u.x)*(state.air.speed||.35),C.STEP);tick();}
  if(distance(start,u)>1)record({op:'move',hero:u.cls,from:start,to:{x:u.x,y:u.y},support:surface(u),goal:{id:point.id,x:point.x,y:point.y}});
 }
 return{advance,clear:id=>nav.delete(id),surface,nodes:nodes.length};
}

/** Post-run trace analysis only. A turn may include locomotion before defend. */
export function analyzeWaits(actions,maxRound){
 const rounds=Array.from({length:maxRound},(_,i)=>{const round=i+1,a=actions.filter(x=>x.round===round);return{round,fires:a.filter(x=>x.op==='fire').length,defends:a.filter(x=>x.op==='defend').length};});
 const globalAttacklessRounds=[];let streak=[];for(const row of rounds){if(!row.fires)streak.push(row.round);else if(streak.length){globalAttacklessRounds.push(streak);streak=[];}}if(streak.length)globalAttacklessRounds.push(streak);
 const heroes={};for(const cls of ['archer','mage','knight','occultist']){const turns=new Map();for(const a of actions.filter(x=>x.hero===cls)){if(!turns.has(a.turn))turns.set(a.turn,{turn:a.turn,round:a.round,fire:0,defend:0});const row=turns.get(a.turn);if(a.op==='fire')row.fire++;if(a.op==='defend')row.defend++;}let run=[],longest=[],total=0;for(const row of turns.values()){if(row.defend&&!row.fire){run.push(row);total++;if(run.length>longest.length)longest=[...run];}else run=[];}heroes[cls]={attacklessDefendTurns:total,longestConsecutiveAttacklessDefendTurns:longest.length,rounds:longest.map(r=>r.round),firstTurn:longest[0]?.turn,lastTurn:longest.at(-1)?.turn};}
 return{definition:'An attackless defend turn is an actorTurnSerial with a defend action and no accepted fire by that hero. It can contain walking/jumping. Whole-party attackless rounds include final E-only round.',globalAttacklessRounds,heroes,rounds};
}
