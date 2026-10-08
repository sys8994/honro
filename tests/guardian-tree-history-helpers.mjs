// Reverse only the three exact, reviewed stage-10 tree references for old story
// contracts. Do not drop fields or relax the remaining mission/dialogue checks.
import assert from 'node:assert/strict';
export const guardianStoryDelta={
 narration:{before:'윗마당으로 오르는 발밑을 붉은 끈이 후려쳤다. 혼을 얽어 막는 주박이었다. 소단은 일행이 가까이 올 때마다 방울을 쥔 손을 세게 당겼다.',after:'언덕 한가운데 거대한 나무가 윗마당을 감싸고 있었다. 오랜 수호령처럼 가지를 펼친 그 아래에서, 붉은 끈이 오르는 발밑을 후려쳤다. 혼을 얽어 막는 주박이었다. 소단은 일행이 가까이 올 때마다 방울을 쥔 손을 세게 당겼다.'},
 line:{before:'설오, 사람을 겨누지 마시오. 우리를 때리는 주박만 걷고 진으로 길을 냅시다.',after:'설오, 저 굵은 가지를 밟으면 위에서도 길이 보이겠소. 사람을 겨누지 말고, 우리를 때리는 주박만 걷읍시다.'}
};
export function beforeGuardianStory(content,id){
 const copy=JSON.parse(JSON.stringify(content));if(id!==10)return copy;
 assert.deepEqual(copy.narration,[guardianStoryDelta.narration.after],'Only the exact tree observation is an approved narration delta');
 assert.equal(copy.story[5][0],'휘겸');assert.equal(copy.story[5][1],guardianStoryDelta.line.after,'Only the exact branch observation is approved');
 const receiver='내 판단이 모자랐네. 하지만 지금 그 매듭도 터지고 있어. 아래 세운 두 진을 이 윗마당 양옆과 이어야 자네 손의 힘을 나눌 수 있네.';
 assert.equal(copy.story[3][1],receiver,'Exact approved lower/upper receiver clarification');
 copy.story[3][1]=receiver.replace('아래 세운 두 진을 이 윗마당 양옆과 이어야','양옆 받이진을 이어야');
 copy.narration=[guardianStoryDelta.narration.before];copy.story[5][1]=guardianStoryDelta.line.before;return copy;
}
