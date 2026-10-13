/** Two approved fresh-story display changes, separate from migration metadata.
 * Historical source and old saved narrative snapshots remain immutable. */
import assert from 'node:assert/strict';
export const currentGoalDisplayDelta=Object.freeze({sourceCommit:'edcd57c30576dae6d0f4520abe2ee02b907a77af',rows:[
 {stage:8,before:'빈 상여에 옮겨 붙는 원혼을 받이진 안에서 제압',after:'결박을 풀고 빈 상여를 멈춰 주민의 귀환로 확보'},
 {stage:10,before:'소단의 주박을 비살상으로 풀고 밀려드는 원혼을 함께 막기',after:'바깥 주박을 걷고 소단과 함께 밀려드는 원혼 막기'}
]});
export function throughCurrentGoalDisplay(g,input){const before=JSON.stringify(input),p=JSON.parse(before);for(const row of currentGoalDisplayDelta.rows){const s=p.stages?.find(s=>s.metadata.stageId===row.stage);if(!s)continue;const labels=s.objectives.filter(o=>o.id==='campaign-goal');assert.equal(labels.length,1);const goal=labels[0];assert.equal(goal.type,'campaign');assert([row.before,row.after].includes(goal.label),'Only exact approved before/after goal display '+row.stage);
 const content=g.HONRO_CONTENT.stages[row.stage-1],display=g.HonroObjectiveRevision.contentFor({honroStage:row.stage,honroObjectiveRevision:2,honroNarrativeRevision:1},content);assert.equal(display.goal,row.after,'Current formal fresh-story display matches approved wording');assert.equal(g.HONRO_NARRATIVE_V0.content[row.stage-1].goal,row.before,'Frozen old story display remains exact');goal.label=display.goal;
}assert.equal(JSON.stringify(input),before,'Never overwrite historical labels');return p;}
