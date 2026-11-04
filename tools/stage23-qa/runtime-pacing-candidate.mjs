/** Generate one isolated Stage23 diagnostic product candidate from the hash-locked
 * original. This does not run a battle or alter an existing save. Native results
 * are diagnostic only, not normal-build/browser/release acceptance. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const [kind,output]=process.argv.slice(2);
assert(['original','elite-hp-90','carrier-budget-1000','escort-lookahead-180','command-post-clearance','late-front-merge','escort-close-130'].includes(kind)&&output,
 'Usage: node runtime-pacing-candidate.mjs original|elite-hp-90|carrier-budget-1000|escort-lookahead-180|command-post-clearance|late-front-merge|escort-close-130 OUTPUT');
const path='shared/runtime/act23-v4-ch23-reviewed.js';
const original=await readFile(path,'utf8');
assert.equal(createHash('sha256').update(original).digest('hex'),
 '71e3b81904fe845b4cbc190e1e0be9be714421c75a146725075665e42b07773c');
const author="author(map){const u=map.units.find(u=>u.id==='act3-carrier'),p=map.markers.find(p=>p.id==='dispatch-bundle'),goods={x:u.x-70,y:u.y};p.x=u.x;p.y=u.y;";
const prepare="prepare(b,p){delete p.honroReviewed23RestObservation;carrier(b).name='짐꾼';mem(b).last??={x:carrier(b).x,y:carrier(b).y};},";
assert.equal(original.split(author).length,2);assert.equal(original.split(prepare).length,2);
let result=original;
if(kind==='elite-hp-90'){
 const ids=['s23-B-0','s23-C-0','s23-C-3','s23-E-5'];
 result=result.replace(author,author+`\n  // Diagnostic fresh-entry-only candidate: preserve all roles/attack/armor/XP.\n  map.initialState.honroReviewed23PacingCandidate={id:'elite-hp-90',version:1,ids:${JSON.stringify(ids)},hpScale:.9};`);
 const code=`\n  const candidate=b.honroReviewed23PacingCandidate;\n  if(candidate?.id==='elite-hp-90'&&!b.honroReviewed23PacingApplied){\n   const difficulty=C.DIFFICULTIES[b.difficulty]||C.DIFFICULTIES.normal;\n   for(const id of candidate.ids){const target=unit(b,id);if(!target||target.side!==1||!target.honroAct3Elite)throw Error('Stage23 candidate elite missing: '+id);\n    const hp=Math.max(1,Math.round(target.maxHp*candidate.hpScale));target.hp=target.maxHp=hp;target.combatBaseHp=hp/difficulty.hp;}\n   b.honroReviewed23PacingApplied={id:candidate.id,version:1};\n  }\n`;
 result=result.replace(prepare,prepare.slice(0,-2)+code+'},');
}else if(kind==='carrier-budget-1000'){
 result=result.replace(author,author+"\n  // Diagnostic fresh-entry-only candidate: speed/HP/blocking/victory unchanged.\n  u.stageOverrides={...u.stageOverrides,maxMove:1000,moveLeft:1000};\n  map.initialState.honroReviewed23PacingCandidate={id:'carrier-budget-1000',version:1};");
 }else if(kind==='escort-lookahead-180'){
 result=result.replace(author,author+"\n  // Diagnostic fresh-entry-only candidate: same near-carrier safety radius; shorter waypoint preview.\n  map.initialState.honroReviewed23PacingCandidate={id:'escort-lookahead-180',version:1};");
 const prior="p&&nearFoes(b,p,300).length>0";
 assert.equal(result.split(prior).length,2);
 result=result.replace(prior,"p&&nearFoes(b,p,b.honroReviewed23PacingCandidate?.id==='escort-lookahead-180'?180:300).length>0");
}else if(kind==='command-post-clearance'){
 const posts=[
  {leader:'s23-B-0',members:['s23-B-1','s23-B-5','s23-B-6']},
  {leader:'s23-C-0',members:['s23-C-1','s23-C-2','s23-C-5']},
  {leader:'s23-E-0',members:['s23-E-1','s23-E-2']},
  {leader:'s23-F-0',members:['s23-F-1','s23-F-2','s23-F-5']},
  {leader:'s23-G-0',members:['s23-G-1','s23-G-2']}
 ];
 result=result.replace(author,author+`\n  // Explicit new fresh-only tactical rule; not a claim about existing enemy morale.\n  map.initialState.honroReviewed23PacingCandidate={id:'command-post-clearance',version:1,closeRadius:130,posts:${JSON.stringify(posts)}};`);
 const helper=`function escortBlockingFoes(b,p,r=300){\n const foes=nearFoes(b,p,r),candidate=b.honroReviewed23PacingCandidate;\n if(candidate?.id!=='command-post-clearance'||candidate.version!==1||!Array.isArray(candidate.posts))return foes;\n return foes.filter(foe=>{const post=candidate.posts.find(row=>row.members.includes(foe.id));if(!post)return true;\n  const leader=unit(b,post.leader);if(!leader||leader.side!==1||leader.dead!==true||leader.hp>0)return true;\n  // After the explicit post is defeated, remaining troops still attack and\n  // stop the porter within130px of his actual position, not a future point.\n  return V.near(foe,carrier(b),candidate.closeRadius);\n });\n}\n`;
 result=result.replace('function blocked(b){',helper+'function blocked(b){');
 const prior="(nearFoes(b,u,300).length>0||p&&nearFoes(b,p,300).length>0)";
 assert.equal(result.split(prior).length,2);
 result=result.replace(prior,"(escortBlockingFoes(b,u,300).length>0||p&&escortBlockingFoes(b,p,300).length>0)");
}else if(kind==='escort-close-130'){
 result=result.replace(author,author+"\n  // Fresh-only escort-under-fire probe: final/start safety stays unchanged.\n  map.initialState.honroReviewed23PacingCandidate={id:'escort-close-130',version:1};");
 const prior="(nearFoes(b,u,300).length>0||p&&nearFoes(b,p,300).length>0)";
 assert.equal(result.split(prior).length,2);
 result=result.replace(prior,"(b.honroReviewed23PacingCandidate?.id==='escort-close-130'&&b.honroReviewed23PacingCandidate.version===1?nearFoes(b,u,130).length>0:"+prior+")");
}else if(kind==='late-front-merge'){
 const placements=[{id:'s23-F-0',x:7930},{id:'s23-F-1',x:8020},{id:'s23-F-2',x:8110},{id:'s23-F-5',x:8200}];
 result=result.replace(author,author+`\n  // Fresh authored placement only: combine the late ground fronts without deleting pressure.\n  const moved=${JSON.stringify(placements)},road=map.terrains.find(t=>t.id==='sy-ground').points;\n  for(const at of moved){const a=road.find((p,i)=>road[i+1]&&p.x<=at.x&&road[i+1].x>=at.x),i=road.indexOf(a),z=road[i+1];if(!a||!z)throw Error('No ground contour for '+at.id);at.y=a.y+(z.y-a.y)*(at.x-a.x)/(z.x-a.x);at.support='sy-ground';const target=map.units.find(v=>v.id===at.id);if(!target)throw Error('Missing late-front actor '+at.id);target.x=at.x;target.y=at.y;}\n  const group=map.design.act3.encounterPlan.groups.find(g=>g.id==='F-front');\n  for(const member of group.members){const at=moved.find(v=>v.id===member.id);if(at)Object.assign(member,at);}\n  group.purpose='후반 지상전위를 출구 굽이의 전위와 한 교전권으로 묶고, 기존 창고 어깨 사격조는 호송 중간에 남긴다.';\n  map.initialState.honroReviewed23PacingCandidate={id:'late-front-merge',version:1,placements:moved};`);
}
await writeFile(output,result);
console.log(JSON.stringify({kind,sourceRuntimeSha256:createHash('sha256').update(original).digest('hex'),candidateRuntimeSha256:createHash('sha256').update(result).digest('hex'),output,scope:'Generated source before fresh battle construction only; existing saved battles are not retuned. Unaccepted isolated candidate.'}));
