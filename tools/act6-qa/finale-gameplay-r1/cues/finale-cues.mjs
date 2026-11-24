// Candidate for the Act6 encounter adapters only; not installed in the App.
// Derive captions from a trusted, already committed native event; never start gameplay here.
const S = {
  '54:retrace.locked': {
    channel:'warning', speaker:'담허', text:'발을 뗐는데 자국이 남았군. 저놈은 내 발이 있던 데를 보고 있어.', predicate:e=>['locked', 'legalFooting', 'hasResponse'].every(k=>e[k] === true),
  },
  '56:reflow.warned': {
    channel:'warning', speaker:'담허', text:'먼지가 옆으로 흐르는군. 진목 가까운 바닥은 아직 멀쩡해. 그쪽에 붙게.', predicate:e=>['activeBand', 'safeFooting', 'hasResponse'].every(k=>e[k] === true),
  },
  '56:reflow.interrupted': {
    channel:'confirmation', speaker:'담허', text:'노가 틀어지니 바닥도 잠잠해졌군.', predicate:e=>['nativeContact', 'interrupted'].every(k=>e[k] === true),
  },
  '58:ritual.manifested': {
    channel:'scene', speaker:'대도사', text:'자네가 현묵의 법을 쓰는가.',
    predicate:e=>['aligned', 'answered', 'aliveHuman', 'interactable'].every(k=>e[k] === true),
  },
  '58:expansion.locked': {
    channel:'warning', speaker:'담허', text:'술기가 여기 꽂혔군. 아래로 내려가지 말고, 위쪽 턱으로 옮겨야겠어.',
    predicate:e=>['sourceLive', 'locked', 'upperSafe', 'hasResponse'].every(k=>e[k] === true),
  },
  '58:expansion.humanBound': {
    channel:'scene', speaker:'담허', text:'아직 살아 있습니다. 하지만 저 틈을 다시 벌리지는 못할 겁니다.',
    predicate:e=>['aliveHuman', 'expansionDisabled', 'noncombat', 'sameBody'].every(k=>e[k] === true),
  },
  '59:wave.firstContact': {
    channel:'warning', speaker:'휘겸', text:'저것들은 들린 게 아니오. 혼이 혼을 끌어안고 다리로 올라오고 있소.',
    predicate:e=>['liveHostile', 'nativeEntered', 'firstWave'].every(k=>e[k] === true),
  },
  '59:giant.winding': {
    channel:'warning', speaker:'설오', text:'휘겸 님, 경사에서 벗어나세요! 팔이 돌아오기 시작합니다.',
    predicate:e=>['locked', 'giantVisible', 'hasResponse'].every(k=>e[k] === true),
  },
  '59:garmjin.finished': {
    channel:'scene', speaker:'소단', text:'올라오던 것들은 멈췄어요. 떠나는 분들은 아직 길을 따라가요.',
    predicate:e=>['outerComplete', 'innerSignal', 'wavesClosed', 'soulPathOpen'].every(k=>e[k] === true),
  },
};
const OWNERS = new Set([54,56,58,59]);
export function cueState(stage, attemptIdentity) {
  if(!OWNERS.has(stage) || typeof attemptIdentity!=='string' || !attemptIdentity.trim()) throw Error('Invalid finale cue owner');
  return {stage,attemptIdentity,seen:[],highestTick:-1};
}
export function observeNativeCue(state,{stage,attemptIdentity,tick,key,evidence}={}) {
  if(!state || state.stage!==stage || state.attemptIdentity!==attemptIdentity || !Number.isSafeInteger(tick) || tick<0 || tick<state.highestTick || !evidence || typeof evidence!=='object' || typeof key!=='string') return null;
  const signature=stage+':'+key;
  const cue=Object.hasOwn(S,signature)?S[signature]:null;
  if(!cue || state.seen.includes(signature) || !cue.predicate(evidence)) return null;
  state.highestTick=tick;
  state.seen.push(signature);
  const {channel,speaker,text}=cue;
  return {signature,tick,channel,speaker,text,blocksInput:false};
}
