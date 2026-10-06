(function(G){'use strict';
// Geography describes the approach to an existing event, not a new quest or
// settlement. Event names remain owned by campaign content; atlas anchors are presentation only.
// Load after act2-content / act2-drama. Adding a chapter means adding its place
// and source narration/adaptation below; progression uses the chapter's existing requires contract.
const H=G.HONRO_CONTENT,version=1;
const sources={
 geography:['shared/runtime/content.js','shared/runtime/story-content.js','shared/runtime/act2-content.js','shared/runtime/act2-drama.js','game/docs/ACT2_SPATIAL_IMPLEMENTATION.md'],
 firstAct:'story-content.js introductions/outros: 연목 나루, 북문, 폭포, 나무다리, 주거지, 창고, 두 마당',
 secondAct:'act2-drama.js chapters 11–20: 연목 외문 → 북쪽 돌산 → 석문 → 동굴마을 → 잠운사 → 묵종 공동 → 동굴 출구',
 interludes:'Full H.stages narration adapted as Seolo dialogue; audited against interludeSources for stages 1–20.',
 conversations:'New optional observations use only scenery or facts established before the next chapter. Existing battlefield dialogue is unchanged.'
};
// region, place, layer, visual variant, local rest name, scene description.
// These are ordinary descriptive stops, not additional named places in lore.
const geography=[
 ['연목','고갯길','surface','forest','고개 아래 주막','주막 앞에서 고갯길이 시작된다. 설오는 접힌 쪽지를 꺼내 행선지를 다시 살핀다.'],
 ['연목','나루로 내려가는 분지','surface','cliff','능선 바위턱','바위턱 아래로 장례 행렬이 보인다. 길목에서 오래 머물 수는 없다.'],
 ['연목','연목 나루','surface','river','나루로 내려가는 길','물가로 이어진 길에서 잠시 숨을 고른다. 설오는 홍만의 딸이 알려 준 움막 쪽을 바라본다.'],
 ['연목','북문','surface','forest','북문 바깥 길목','나루를 벗어난 길이 마을 문으로 이어진다. 설오는 품에 넣은 장부가 젖지 않았는지 살핀다.'],
 ['연목','폭포 절벽','surface','river','폭포 아래 바위턱','폭포 소리가 가까워진다. 붉은 실이 이어진 방향을 바위턱에서 살필 수 있다.'],
 ['연목','나무다리','surface','cliff','나무다리 위 길목','끊어진 다리 쪽으로 길이 굽는다. 일행은 뒤처진 운반대를 데리러 내려갈 채비를 한다.'],
 ['연목','북문 안 주거지','surface','forest','북문 쉼터','운반대가 닿은 쉼터에서 주거지로 길이 이어진다. 안쪽에는 아직 사람 목소리가 남아 있다.'],
 ['연목','상여를 둔 창고','surface','forest','창고 앞 길목','주민들이 빠져나간 길 너머에 창고가 있다. 설오는 빈 상여를 보았다는 말을 되짚는다.'],
 ['연목','아랫마당','surface','temple','아랫마당 길목','위쪽 마당으로 가는 길이 보인다. 일행은 주민이 지나갈 자리를 살피며 걸음을 고른다.'],
 ['연목','윗마당','surface','temple','윗마당 아래 계단','두 받이진을 뒤로하고 계단 앞에 선다. 소단이 붙든 줄은 아직 팽팽하다.'],
 ['연목','동쪽 외문','surface','dawn','동쪽 외문 곁','긴 밤이 지난 외문 곁에 산길이 이어진다. 아직 거두지 못한 매듭이 남아 있다.'],
 ['북쪽 돌산','채석장','surface','cliff','채석장 앞 산길','북쪽 산길에서 같은 바위와 마른 소나무를 거듭 지난다. 지도에 없는 길을 찾아 잠시 걸음을 멈춘다.'],
 ['북쪽 돌산','함몰지의 석문','underground','cave','함몰지 돌계단','돌림진의 한 축을 풀자 함몰지로 내려가는 계단이 드러났다. 처음 보는 돌문 쪽에서 울림이 올라온다.'],
 ['동굴마을','암반 위 주거지','underground','cave','석문 안쪽 길목','열린 석문 안쪽으로 마을 길이 이어진다. 일행은 뒤에서 오는 사람이 지날 자리를 남겨 둔다.'],
 ['동굴마을','수문 아래 작업굴','underground','river','피난 다리 곁','고정된 피난 다리 뒤로 가족들이 모여 있다. 아래 물길은 잠운사로 이어지는 우회로다.'],
 ['잠운사','법당','underground','temple','법당 아래 계단','물이 빠진 작업굴을 지나 계단 앞에 선다. 암벽에 붙은 법당 쪽으로 길이 올라간다.'],
 ['잠운사','뒤편 작업굴','underground','cave','잠운사 뒤편 길목','법당 뒤로 작업굴이 이어진다. 설오는 가져온 기록을 다시 접어 품에 넣는다.'],
 ['잠운사','묵종 공동','underground','cave','인양로 끝','복원한 인양로 끝에서 공동으로 길이 열린다. 일행은 남은 기록을 챙기고 발걸음을 맞춘다.'],
 ['잠운사','묵종 공동','underground','cave','묵종 곁','종지기는 제압됐지만 종 안에는 아직 혼이 남아 있다. 같은 자리에서 그들을 보내는 일이 이어진다.'],
 ['북쪽 돌산','동굴 출구','underground','cave','동굴 출구 안쪽','종의 울림이 멎은 길을 따라 사람들이 모인다. 바깥으로 나가기 전, 서로의 걸음을 기다린다.']
];
// Two 1800 × 1050 atlas layers. Nearby events remain in local clusters.
// The bell's two events share one chamber but get separate selectable pins.
const mapAnchors=[[180,710],[330,820],[520,800],[760,670],[570,440],[890,590],[990,460],[1190,490],[1120,300],[1310,240],[1450,390],[1510,590],[230,200],[580,400],[670,740],[1080,300],[1320,490],[1240,730],[1350,800],[270,890]];
const places=geography.map(([region,place,layer,variant,restName,restDescription],i)=>{
 const stageId=i+1,st=H.stages.find(s=>s.id===stageId);
 return {stageId,region,place,event:st.name,layer,variant,restName,restDescription,map:[...mapAnchors[i]]};
});
// Chapter 20 spans the cave exit and outdoor escort. Its pre-event rest is
// underground; this post-event scene is the actual return to the open sky.
const ending={stageId:20,region:'북쪽 돌산',place:'바깥 산길',event:'다시 하늘 아래',layer:'surface',variant:'dawn',restName:'새벽 산길',restDescription:'생존자들과 함께 동굴 밖에 닿았다. 사람들은 산길 곁에서 쉬고, 일행에게도 잠시 말없이 앉을 틈이 생겼다.',map:[1560,780]};
function at(stageId){const id=Number(stageId);return Number.isInteger(id)?places.find(p=>p.stageId===id)||null:null;}
function open(profile,stageId){const st=H.stages.find(s=>s.id===stageId);return !!st&&(st.requires||[]).every(id=>!!profile?.cleared?.[id]);}
function next(profile){return places.find(p=>!profile?.cleared?.[p.stageId]&&open(profile,p.stageId))||null;}
// Direct links follow authored urgency, not the presence of a boss:
// 1 outro sees the funeral already under attack; 9 outro leaves Sodan holding
// a failing knot; 18/19 share one physical bell chamber and an unfinished rite.
const directAfter=[1,9,18];
function transitionAfter(stageId){return directAfter.includes(Number(stageId))?'direct':'rest';}
function context(profile,nextStageId){
 if(nextStageId==null)return profile?.cleared?.[20]&&!next(profile)?ending:null;
 const p=at(nextStageId);return p&&open(profile,p.stageId)?p:null;
}
// Full authored pre-stage narration, adapted into Seolo's observations.
// Each source paragraph is retained here for a source-to-adaptation audit.
// Acts 1 and 2 respectively use story-content.js introductions and the active
// act2-drama.js narration (not the superseded act2-content.js narration).
// Replays and urgent transitions call interlude() directly; the caller owns
// delivery and seen flags. No artwork/narration kind is set on these tuples.
const interludeSources={
 "1": [
  "설오는 사라진 고향 사람들의 행방을 찾아 연목으로 왔다. 몇 해 전 그들을 배에 태웠다는 뱃사공, 홍만을 만나러 가는 길이다."
 ],
 "2": [
  "연목 나루로 내려가는 분지에서 장례 행렬이 멈췄다. 관을 메고 가는 운반틀인 상여 곁으로, 정체 모를 혼에 몸을 빼앗긴 짐승들이 내려오고 있다. 설오는 높은 바위턱에서 활을 든다."
 ],
 "3": [
  "홍만은 이미 세상을 떠났다. 설오는 그의 딸 연실이 알려 준 장부를 찾아 담허와 나루로 내려왔다. 빈 움막 앞에서 낯선 검객 하나가 두 사람을 향해 손을 들었다."
 ],
 "4": [
  "장부에 따르면 설오의 고향 사람들은 연목 주막에 묵은 뒤 북문으로 이동했다. 마을 입구에서는 피란민들이 좁은 문을 빠져나오고 있었다."
 ],
 "5": [
  "마을 사람들을 지키던 붉은 실이 이제 집 쪽으로 거세게 당겨진다. 줄을 따라온 일행은 폭포 뒤에서 줄을 고정한 쇠고리를 찾았다. 담허는 땅에 혼을 잠시 붙들어 둘 받이진을 펴서, 고리를 끊어도 혼이 주민들에게 돌아가지 않게 하려 한다."
 ],
 "6": [
  "휘겸이 앞서 보낸 피란민들은 쉼터에 닿았다. 그러나 늦게 출발한 부상자 운반대 하나가 나무다리 아래에 남아 있었다. 세 사람은 함께 그들을 데리러 내려간다."
 ],
 "7": [
  "북문 안 주거지에서 인기척이 났다. 붉은 실에 묶인 주민 셋이 몸을 웅크리고 있었다. 그중 한 사람이 다가오는 일행에게 필사적으로 고개를 저었다."
 ],
 "8": [
  "홍만을 장사 지낸 뒤 창고에 놓아둔 빈 상여가 움직였다. 관은 비어 있는데 결박은 안쪽에서 잡아당긴 듯 팽팽했다."
 ],
 "9": [
  "구조한 주민들은 자신들을 지킨 사람을 소단이라 불렀다. 일행이 아랫마당에 닿자, 위쪽 담장 너머에서 방울 소리가 뚝 멎었다. 붉은 실에 감긴 손 하나가 담장 위로 보였다."
 ],
 "10": [
  "윗마당으로 오르는 발밑을 붉은 끈이 후려쳤다. 혼을 얽어 막는 주박이었다. 소단은 일행이 가까이 올 때마다 방울을 쥔 손을 세게 당겼다."
 ],
 "11": [
  "날이 밝아도 연목의 집들은 문을 열지 않았다. 소단이 줄 하나를 거둘 때마다 안쪽에서 손목을 살피는 소리가 났다. 동쪽 고개를 넘은 길은 북쪽 돌산으로 꺾였고, 풀어 놓은 줄 끝이 바람을 거슬러 그쪽을 향했다."
 ],
 "12": [
  "갈라진 바위와 마른 소나무가 세 번째 나타났다. 돌탑 곁에 둔 수레도 그대로였다. 발자국은 앞을 향했는데 일행은 자꾸 같은 자리로 돌아왔다."
 ],
 "13": [
  "돌림진 너머 석문 아래로 하늘빛이 들어왔다. 누구도 산 안에 이런 공간이 있으리라 생각하지 못했다. 중간에서 멎은 승강기에 한 노인이 피 묻은 밧줄을 감고 버텼고, 발밑에서 곡괭이들이 벽을 기어올랐다."
 ],
 "14": [
  "집들은 벼랑을 벽 삼아 층층이 붙어 있었다. 저녁상을 차린 채 닫힌 집, 문고리에 아이의 옷을 묶어 둔 집, 등잔 기름만 갈며 누군가를 기다린 집이 이어졌다. 아래층에서 같은 이름을 부르는 목소리가 들렸다."
 ],
 "15": [
  "수면에 떠 있던 나뭇조각들이 모두 한 방향으로 밀렸다가 돌아왔다. 숨을 쉬듯 반복되는 역류였다. 물속의 발판마다 손잡이가 달렸지만, 위에서 당길 밧줄은 모두 끊어져 있었다."
 ],
 "16": [
  "법당의 향은 오래전에 꺼졌지만 재를 고르는 손길은 남아 있었다. 노승은 쓰러진 제자의 손바닥에 이름 세 글자를 쓰고 지우기를 반복했다. 제자는 글자가 지워질 때마다 다른 사람의 이름을 말했다."
 ],
 "17": [
  "작업굴에는 삭은 밧줄보다 새로 잘린 밧줄이 많았다. 버려진 축에는 녹이 슬지 않았다. 누군가 다시 끼워 쓰지 못하도록 기름칠까지 한 채 벽 틈에 감춰 놓았다."
 ],
 "18": [
  "청동의 둥근 벽은 가까이 갈수록 집이 아니라 산처럼 보였다. 밑동에는 바깥으로 향한 손자국이 겹쳐 있었다. 사슬을 쥔 종지기는 그 자국 쪽을 한 번도 내려다보지 않았다."
 ],
 "19": [
  "주민들은 종 아래에 망치와 밥그릇과 천으로 싼 짚신을 놓았다. 가져올 물건이 없는 이는 빈손을 무릎 위에 올렸다. 소단은 그들 가운데 앉아 가장 먼저 불릴 이름을 기다렸다."
 ],
 "20": [
  "종소리가 사라진 길에서는 옷 스치는 소리와 절뚝이는 발소리가 크게 들렸다. 행렬은 가장 느린 사람보다 빨리 걷지 않았다. 앞쪽 틈으로 들어온 바람이 처음으로 젖은 소매를 말렸다."
 ]
};
const interludeParagraphs={
 "1": [
  "사라진 고향 사람들의 행방을 찾아 연목까지 왔다.",
  "몇 해 전 그들을 배에 태웠다는 뱃사공, 홍만을 만나러 가는 길이다."
 ],
 "2": [
  "연목 나루로 내려가는 분지에 장례 행렬이 멈춰 있다.",
  "관을 메고 가는 운반틀이 상여라고 했지. 그 곁으로 정체 모를 혼에 몸을 빼앗긴 짐승들이 내려온다.",
  "이 높은 바위턱에서 활을 들었다."
 ],
 "3": [
  "홍만 어르신은 이미 세상을 떠나셨다.",
  "딸 연실 씨가 알려 준 장부를 찾으러 담허 어른과 나루로 내려왔다.",
  "빈 움막 앞의 저 검객은 처음 보는 사람인데. 우리 둘을 향해 손을 드는군."
 ],
 "4": [
  "장부대로라면 고향 사람들은 연목 주막에 묵은 뒤 북문으로 갔다.",
  "마을 입구에 피란민들이 보인다. 저 좁은 문으로 빠져나오고 있구나."
 ],
 "5": [
  "마을 사람들을 지키던 붉은 실이 이제는 집 쪽으로 거세게 당겨진다.",
  "줄을 따라오니 폭포 뒤에 쇠고리가 보인다. 저기에 줄을 고정해 두었군.",
  "담허 어른이 땅에 혼을 잠시 붙들어 둘 받이진을 펴려 하신다. 고리를 끊어도 혼이 주민들에게 돌아가지 않게 받으려는 거다."
 ],
 "6": [
  "휘겸이 앞서 보낸 피란민들은 쉼터에 닿았다.",
  "늦게 출발한 부상자 운반대 하나는 아직 나무다리 아래에 남아 있다.",
  "이제 우리 셋이 함께 데리러 내려가자."
 ],
 "7": [
  "북문 안 주거지에서 인기척이 난다.",
  "붉은 실에 묶인 주민이 셋이다. 모두 몸을 웅크리고 있군.",
  "우리가 다가가자 한 분이 필사적으로 고개를 젓는다."
 ],
 "8": [
  "홍만 어르신을 장사 지낸 뒤 창고에 놓아둔 빈 상여가 움직인다.",
  "관은 비어 있는데 결박은 팽팽하다. 안쪽에서 잡아당긴 것처럼."
 ],
 "9": [
  "구조한 주민들은 자신들을 지킨 사람을 소단이라 불렀다.",
  "아랫마당에 닿자 위쪽 담장 너머의 방울 소리가 뚝 멎었다.",
  "담장 위로 손이 보인다. 붉은 실이 감겨 있다."
 ],
 "10": [
  "윗마당으로 오르려는데 붉은 끈이 발밑을 후려친다.",
  "혼을 얽어 막는 주박이구나.",
  "우리가 가까이 갈 때마다 소단이 방울을 쥔 손을 세게 당긴다."
 ],
 "11": [
  "날이 밝았는데도 연목의 집들은 문을 열지 않는다. 소단이 줄 하나를 거둘 때마다 안에서 손목을 살피는 소리가 난다.",
  "동쪽 고개를 넘은 길은 북쪽 돌산으로 꺾인다.",
  "풀어 놓은 줄 끝도 그쪽을 향한다. 바람을 거슬러서."
 ],
 "12": [
  "갈라진 바위와 마른 소나무다. 벌써 세 번째 지나친다.",
  "돌탑 곁에 둔 수레도 그대로 있다.",
  "발자국은 줄곧 앞을 향했는데, 우리는 왜 같은 자리로 돌아오는 거지?"
 ],
 "13": [
  "돌림진 너머 석문 아래로 하늘빛이 들어온다. 산 안에 이런 공간이 있을 줄은 아무도 몰랐다.",
  "승강기가 중간에서 멎었다. 노인 한 분이 피 묻은 밧줄을 손에 감고 버티고 계신다.",
  "그 발밑에서 곡괭이들이 벽을 기어오른다."
 ],
 "14": [
  "집들이 벼랑을 벽 삼아 층층이 붙어 있다.",
  "저녁상을 차린 채 닫힌 집도 있고, 문고리에 아이의 옷을 묶어 둔 집도 있다.",
  "등잔 기름만 갈며 누군가를 기다린 집도 이어진다.",
  "아래층에서 같은 이름을 부르는 목소리가 들린다."
 ],
 "15": [
  "수면의 나뭇조각이 모두 한 방향으로 밀려갔다가 돌아온다.",
  "역류가 숨을 쉬듯 되풀이되는군.",
  "물속 발판마다 손잡이는 달렸는데, 위에서 당길 밧줄은 전부 끊어져 있다."
 ],
 "16": [
  "법당의 향은 오래전에 꺼졌는데도 재를 고르는 손길은 남아 있군.",
  "저 노승은 쓰러진 제자의 손바닥에 이름 세 글자를 쓰고 지우기를 되풀이하신다.",
  "글자가 지워질 때마다 제자가 다른 사람의 이름을 말한다."
 ],
 "17": [
  "작업굴에 삭은 밧줄보다 새로 잘린 밧줄이 더 많다.",
  "버려진 축에는 녹도 슬지 않았다.",
  "기름칠까지 한 축을 벽 틈에 감춰 두었군. 누군가 다시 끼워 쓰지 못하게 한 거다."
 ],
 "18": [
  "가까이 오니 둥근 청동 벽이 집이 아니라 산처럼 보인다.",
  "밑동에 손자국이 겹쳐 있다. 모두 바깥으로 향해 있다.",
  "사슬을 쥔 종지기는 그 자국을 한 번도 내려다보지 않는군."
 ],
 "19": [
  "주민들이 종 아래에 망치와 밥그릇, 천으로 싼 짚신을 놓는다.",
  "가져올 물건이 없는 분은 빈손을 무릎 위에 올리셨다.",
  "소단이 그 가운데 앉아 있다. 가장 먼저 불릴 이름을 기다리고 있구나."
 ],
 "20": [
  "종소리가 사라지니 옷 스치는 소리와 절뚝이는 발소리가 크게 들린다.",
  "행렬은 가장 느린 분보다 빨리 걷지 않고 있다.",
  "앞쪽 틈으로 바람이 들어온다. 이제야 젖은 소매가 마르기 시작한다."
 ]
};
function interlude(stageId){
 const p=at(stageId),paragraphs=p&&interludeParagraphs[p.stageId];if(!paragraphs)return [];
 return paragraphs.map(text=>['설오',text,{storyId:`rest-interlude-v1-${p.stageId}`,storyTitle:p.event,optional:false}]);
}
function required(profile,nextStageId){
 const p=context(profile,nextStageId);if(!p)return [];
 if(nextStageId!=null)return interlude(p.stageId);
 return [['설오','사람들과 함께 하늘 아래로 돌아왔다. 오늘은 이 길 곁에서 잠시 숨을 고르자.',{storyId:'rest-interlude-v1-end',storyTitle:p.restName,optional:false}]];
}
// Each row is an optional, single-speaker observation: Seolo, Damheo, Hwigyeom,
// Sodan. Empty cells deliberately preserve the order of recruitment/revelation.
// No rewards, upgrades, quests or service roles are attached to these lines.
const observations={
 1:['쪽지가 접힌 자리에 이름이 걸렸네. 홍만, 연목 나루. 잊을까 봐 벌써 몇 번을 읽었지.'],
 2:['아래 사람들은 아직 나를 못 봤다. 목소리가 닿을 만큼만 더 가까이 가자.'],
 3:['살아 계실 때 왔어야 했는데. 지금은 남겨 두신 것을 찾는 수밖에 없겠지.','아버지가 남긴 장부를 기억하고 있었구먼. 연실이 해 준 말을 잘 짚어 보세.'],
 4:['장부에 사람 수가 남아 있었다. 이제는 누구를 찾는지 제대로 말할 수 있겠지.','젖은 장을 함부로 넘기지 않길 잘했네. 사람 이름이 적힌 종이는 잘 간수하게.'],
 5:['가까워질수록 물소리가 커진다. 서로 하는 말을 놓치지 않게 해야겠네.','실이 당겨지는 쪽은 보여도, 저 너머 사정까지 안다고 할 수는 없지.'],
 6:['휘겸도 같은 실을 쫓고 있었다. 각자 본 것을 맞춰 보면 놓친 게 드러날지 모른다.','한 곳이 느슨해졌다고 다른 곳도 그런 건 아니네. 물가에서 본 움직임을 기억해 두세.','쉼터에 닿은 사람들도 뒤처진 이들을 기다리고 있을 것이오. 나도 그 얼굴들이 마음에 남소.'],
 7:['쉼터에선 사람들 말소리가 들린다. 운반대를 끌던 소리가 멎으니 이제야 알겠네.','다친 몸과 그 안에 든 혼은 다른 것이네. 오늘 만난 사람들을 보며 더 잊지 말아야겠어.','운반대를 끝까지 함께 끌고 오니 어깨가 묵직하오. 기다리던 사람들 얼굴은 좀 펴졌소.'],
 8:['손을 자기 뜻대로 움직인다고 하던 말이 자꾸 생각난다. 당연한 일이 아니었구나.','주민들 말을 들으니 우리가 밖에서 본 매듭과 안에서 겪은 매듭이 같지 않았네.','덕수는 자기 이름부터 말했소. 몸을 빼앗겨도 그 이름만은 놓지 않으려 했던 것이겠지.'],
 9:['빈 상여에 든 것이 홍만은 아니었다. 연실에게도 그 말은 분명히 전하고 싶네.','받아 냈다고 너무 빨리 여겼네. 내가 본 것 밖에 남아 있던 것도 있었어.','상여가 멈춘 뒤에도 주위를 돌아보게 되오. 빈자리라 해서 아무것도 없는 건 아니었소.'],
 10:['활끝을 낮추자. 저 사람 눈에는 아직 우리가 줄을 끊으러 온 사람들일 테니.','두려워하는 데에는 까닭이 있네. 그걸 못 본 척하면 내 말도 닿지 않겠지.','계단 위를 보시오. 아직 손을 펴지 못하고 있소.'],
 11:['외문 너머에도 길이 이어진다. 장부의 빈 장이 끝이라는 뜻은 아니겠지.','밤새 손에 힘이 들어갔구먼. 아침이 와도 몸은 금방 풀리지 않는 법이지.','해가 떠도 문을 바로 열지는 못하는군. 지난밤이 길었소.','손을 펴도 아직 줄이 감겨 있는 것 같아요. 조금씩은 펴져요.'],
 12:['같은 바위를 지나도 발자국의 방향은 바뀌지 않았다. 어디서 되돌아온 건지 짚어 봐야겠다.','산 안쪽 소리는 돌아서 들리네. 들은 방향만 믿고 단정하지는 말세.','흙길이 끝나고 돌이 많아졌소. 밑창에 묻은 흙부터 털어야겠군.','매듭 없이 걸으니 손이 자꾸 빈 곳을 찾네요. 그래도 다시 쥐지는 않을래요.'],
 13:['위에서 보았을 때보다 절벽이 깊다. 계단을 내려가니 하늘이 좁아진다.','바깥 바람이 이 계단까지 들어오는군. 내려가며 얼마나 달라지는지 느껴 보세.','지도에는 없던 돌계단이오. 여기서부터는 직접 본 길을 남겨야겠소.','수레가 움직이기 바로 전에 소리가 났어요. 그 순간은 잊지 않을 것 같아요.'],
 14:['석공의 손은 줄을 놓고도 굽어 있었다. 아들을 만나면 좀 펴실 수 있을까.','아들을 기다린다는 말이 먼저 나오더군. 자기 손이 아프다는 말보다도.','노인은 평생 쓰던 손을 놓지 못했소. 아들을 기다리는 손이기도 했겠지.','문이 열렸는데도 안쪽은 어두워요. 저기 켜 둔 등잔이 눈에 먼저 들어와요.'],
 15:['서로 손목의 줄을 풀어 주던 사람들이 떠오른다. 돌아갈 때는 함께 밖으로 걸어 나가자.','이름을 부르니 돌아보는 사람이 있었네. 줄보다 오래 남는 것도 있는 것이지.','다리 뒤에 모인 사람들은 서로 손을 놓지 않더군. 이제 묶인 손은 아니었소.','혼을 떼어 낸 뒤에 가족 목소리부터 찾았어요. 이번에는 살아 있는 사람이 부르는 소리였어요.'],
 16:['물 아래 감춰져 있던 자국이 드러났다. 기록에도 남은 것이 있으면 좋겠네.','흐르는 물과 되밀리는 물은 소리부터 달랐네. 바닥이 드러나니 더 분명했어.','녹슨 인양 자리와 새 정 자국이 달랐소. 오래전에 옮긴 일과 지금 가둔 일을 따로 봐야겠소.','물소리가 멎으니 다른 소리가 들렸어요. 너무 늦게 들은 것 같아서 마음에 남아요.'],
 17:['노승은 제자가 이름을 말하자 손의 먹을 닦아 주었다. 그 모습을 잊지 말아야겠다.','산길과 장부의 진법 표식이 닮았네. 내가 배운 법이 그곳에도 남은 까닭은 더 살펴야겠어.','들은 말을 남겨 두길 잘했소. 돌아섰다는 말까지, 빼놓지 않고.','그분이 자기 손이 아프다고 했을 때 스님 얼굴이 달라졌어요. 그 한마디를 기다리셨나 봐요.'],
 18:['돌아가는 축을 보고도 한동안 말을 못 했다. 이 길은 열 수 있었던 길이다.','굴 안이 조용해지니 우리가 걷는 소리만 남는군. 조금 전 기록을 읽던 소리도 아직 귀에 있어.','축은 부러지지 않았소. 손으로 빼냈고 다시 끼울 수 있었소. 그 사실은 달라지지 않소.','종을 올리려던 혼이 있었어요. 끝까지 그 일을 하고 있었어요.'],
 19:['청동에 난 손자국이 보인다. 이제는 그 안에서 나오는 작은 소리도 들린다.','울림이 낮아지니 서로 다른 소리가 들리는군. 처음부터 하나의 소리가 아니었던 것이지.','종은 그대로 서 있소. 사슬을 놓은 쪽은 종지기요.','이번에는 밖에서 문을 닫는 사람이 없어요. 그걸 먼저 알았으면 좋겠어요.'],
 20:['이름을 불러 주던 사람들이 밖으로 돌아갈 차례다. 같은 길을 함께 걸으면 된다.','오래된 혼은 아직 종 곁에 남았네. 서둘러 뜻을 붙이기보다 왜 길을 못 찾는지 알아보아야겠어.','무명사에서 옮겼다는 표식과 왕실 봉인을 함께 챙겼소. 저문골이라는 이름도 빠뜨리지 않겠소.','멀어지는 목소리가 서로를 부르고 있었어요. 이제 저를 붙잡지는 않아요.'],
 end:['하늘이 이렇게 넓었구나. 동굴을 나오고도 자꾸 위를 보게 된다.','한동안 종소리가 귀에 남을 줄 알았는데, 지금은 바람이 먼저 들리네.','길찬이 아버지 짐을 들었소. 노인도 이번에는 손을 펴고 걷더군.','아무것도 붙잡지 않고 앉아 있어도 되네요. 지금은 이대로 조금만 있을래요.']
};
const classes=['archer','mage','knight','occultist'],firstRest={archer:1,mage:3,knight:6,occultist:11};
function optional(profile,nextStageId,cls){
 const p=context(profile,nextStageId),index=classes.indexOf(cls);
 if(!p||index<0||!profile?.recruited?.includes(cls))return [];
 const key=nextStageId==null?'end':p.stageId;
 if(key!=='end'&&p.stageId<firstRest[cls])return [];
 const text=observations[key]?.[index];if(!text)return [];
 return [[H.hero[cls].name,text,{storyId:`rest-optional-v1-${key}-${cls}`,storyTitle:p.restName+' · '+H.hero[cls].name,optional:true}]];
}
G.HonroJourneyContent={version,sources,places,ending,at,next,transitionAfter,interludeSources,interlude,required,optional};
})(globalThis);
