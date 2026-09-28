import type { Skill, ClassId, Stage, EnemySpec } from './types';
import {installSkillRedesign} from './skillRedesignData';
export const CLASSES: Record<ClassId, {
    name: string;
    person: string;
    epithet: string;
    desc: string;
    color: string;
    hp: number;
    icon: string;
    start: string[];
    order: string[];
}> = {
    mage: { name: '마법사', person: '이렌', epithet: '재를 읽는 자', desc: '운석과 산개탄으로 엄폐 너머를 무너뜨린다.', color: '#e7ae67', hp: 180, icon: 'flame', start: ['M01', 'M05', 'M06', 'M02'], order: ['M01', 'M05', 'M06', 'M02', 'M03', 'M04', 'M07', 'M08', 'M09', 'M10', 'M11', 'M12'] },
    archer: { name: '궁수', person: '카엘', epithet: '바람의 끝', desc: '작은 틈, 반사면, 적의 빈틈을 정확히 꿰뚫는다.', color: '#86cbb2', hp: 175, icon: 'arrow', start: ['A01', 'A02', 'A04', 'A05'], order: ['A01', 'A02', 'A04', 'A05', 'A03', 'A06', 'A07', 'A08', 'A09', 'A10', 'A11', 'A12'] },
    knight: { name: '검사', person: '레온', epithet: '성벽을 넘는 검', desc: '몸을 날려 진입하고, 착지한 곳을 다음 전선으로 만든다.', color: '#b2c3e9', hp: 240, icon: 'sword', start: ['S01', 'S02', 'S06', 'S09'], order: ['S01', 'S02', 'S06', 'S09', 'S03', 'S04', 'S05', 'S07', 'S08', 'S10', 'S11', 'S12'] },
    occultist: { name: '심령술사', person: '마르엔', epithet: '경계를 듣는 자', desc: '유령·저주·소환귀로 물리 법칙과 적의 전열을 비튼다.', color: '#b796d9', hp: 195, icon: 'rune', start: ['O01', 'O06', 'O11', 'O02'], order: ['O01','O02','O03','O04','O05','O06','O07','O08','O09','O10','O11','O12','O13','O14','O15'] }
};
const skillClass=(id:string):ClassId=>id[0]==='M'?'mage':id[0]==='A'?'archer':id[0]==='S'?'knight':'occultist';
const skill = (id: string, name: string, tag: string, desc: string, cost: number, damage: number, radius: number, mode: string, icon: string, color: string, speed = 1, wind = 1, terrain = 1): Skill => ({ id, cls: skillClass(id), name, tag, desc, cost, damage, radius, mode, icon, color, speed, wind, terrain });
export const SKILLS: Record<string, Skill> = Object.fromEntries([
    skill('M01', '화염탄', '기본 · 폭발', '첫 충돌에서 폭발한다. 적 가까운 지면도 좋은 표적이다.', 0, 40, 78, 'blast', 'flame', '#ffa969'),
    skill('M02', '반사화구', '반사 · 폭발', '단단한 면에서 한 번 튕긴 뒤 폭발한다. 기둥과 경사를 이용하라.', 2, 47, 88, 'bounce', 'bounce', '#ffca8b'),
    skill('M03', '서리구', '냉기 · 빙결', '2라운드의 냉기 영역을 남긴다. 물을 얼리고 적의 다음 이동을 제한한다.', 2, 28, 84, 'frost', 'snow', '#95e0eb'),
    skill('M04', '전격핵', '전격 · 전도', '착탄 구역의 물에 전류를 흘린다. 연결된 물속의 아군도 위험하다.', 2, 38, 62, 'lightning', 'bolt', '#c8d1ff'),
    skill('M05', '유성 인장', '비술 · 수직 낙하', '맞은 좌표 위에서 운석이 떨어진다. 운석은 지붕과 충돌하며, 벽을 통과하지 않는다.', 4, 78, 136, 'marker', 'meteor', '#ffc384', .97, 1, 2),
    skill('M06', '성화 산개', '비술 · 정점 분열', '정점에서 작은 폭탄 7~14개가 흩어진다. 강화할 때마다 하나씩 늘어난다. 천장에 먼저 맞으면 작은 폭발만 발생한다.', 4, 22, 61, 'cluster', 'burst', '#ffbd85'),
    skill('M07', '지연화인', '지연 · 영역 통제', '상대 팀의 다음 차례 종료 후 폭발하는 인장을 남긴다. 그 전에 아군도 대피하라.', 2, 64, 115, 'delay', 'rune', '#ed9dad'),
    skill('M08', '중력핵', '흡인 · 위치 조작', '착탄 지점으로 주변 적과 아군을 끌어당긴다. 고정된 보스는 움직이지 않는다.', 2, 21, 162, 'gravity', 'vortex', '#c6a8f0'),
    skill('M09', '빙벽핵', '지형 · 생성', '파괴 가능한 빙벽을 3라운드 동안 세운다. 시전자당 최대 2개. 반사면이나 방어막으로 활용한다.', 2, 14, 40, 'wall', 'wall', '#9adce5'),
    skill('M10', '화염궤', '지속 · 지표 이동', '지면을 따라 불길이 굴러가며 2라운드의 화염 영역을 남긴다. 행동을 끝낼 때 피해를 준다.', 2, 29, 63, 'firetrail', 'trail', '#f7a56d'),
    skill('M11', '파쇄핵', '파괴 · 엄폐 제거', '적에게는 작은 피해, 엄폐와 지지대에는 큰 파괴력을 준다.', 2, 24, 112, 'shatter', 'crack', '#e1bd9a', 1, 1, 4.5),
    skill('M12', '공명구', '연계 · 영역 증폭', '착탄 근처의 마법 영역 하나를 소모해 크게 폭발한다. 영역이 없으면 작은 폭발.', 2, 29, 68, 'resonate', 'resonance', '#dea8db'),
    skill('A01', '철시', '기본 · 정밀', '가늘고 빠른 화살. 노출된 적이나 작은 틈을 정확히 노린다.', 0, 43, 0, 'arrow', 'arrow', '#b1dbbf', 1.13, .65, .55),
    skill('A02', '관통시', '관통 · 연속 적중', '유닛 하나 또는 얇은 목재를 통과하고 약해진 채 진행한다. 석벽은 통과하지 못한다.', 2, 49, 0, 'pierce', 'pierce', '#d7e4b6', 1.16, .65, 1.4),
    skill('A03', '도탄시', '반사 · 우회', '단단한 표면에서 한 번 반사한다. 방패 뒤에서 들어오는 궤적을 만들어라.', 2, 51, 0, 'ricochet', 'bounce', '#a9d6d8', 1.13, .65),
    skill('A04', '삼연시', '분산 · 다중 사격', '스킬 Lv.1~8에 따라 3~10발을 쏜다. 각도 폭은 화살 수의 제곱근에 비례해 넓어져 밀도가 높아진다. 같은 적에 맞은 여러 화살은 각각 피해를 준다.', 2, 24, 0, 'triple', 'triple', '#d0e3b7', 1.12, .65, .65),
    skill('A05', '중량쐐기', '밀림 · 중량', '적을 화살이 날아온 방향으로 밀어낸다. 발판과 엄폐를 무너뜨리는 전술.', 2, 38, 0, 'push', 'push', '#d5c0a3', 1.02, .5),
    skill('A06', '구속시', '구속 · 이동 제한', '대상의 다음 행동 종료까지 이동량과 도약 성능을 낮춘다. 사격은 할 수 있다.', 2, 33, 0, 'bind', 'bind', '#c2caa4', 1.1, .65),
    skill('A07', '파갑시', '약화 · 방호 파괴', '다음 두 번의 피격에 방어를 약화시킨다. 장갑 보스에게도 유효하다.', 2, 38, 0, 'break', 'crack', '#dcbfa3', 1.16, .6, 1.8),
    skill('A08', '시한폭발시', '지연 · 부착', '적이나 지형에 박힌 뒤 상대의 다음 차례 종료 후 폭발한다. 적에게 붙으면 함께 움직인다.', 2, 16, 80, 'sticky', 'timer', '#e2ba92', 1.06, .65),
    skill('A09', '견인시', '당김 · 엄폐 이탈', '직격한 적을 사수 쪽으로 당긴다. 끌려오는 경로의 벽은 통과하지 못한다.', 2, 32, 0, 'pull', 'pull', '#a2d2c7', 1.1, .65),
    skill('A10', '균열표식', '표식 · 직격 연계', '다음 아군 직격 한 번의 피해를 강화한다. 범위 가장자리에는 적용되지 않는다.', 2, 23, 0, 'mark', 'target', '#dbd6a0', 1.14, .6),
    skill('A11', '낙우시', '비술 · 화살 비', '정점에서 아래로 화살 7개가 좁게 쏟아진다. 지붕이 있으면 가로막힌다.', 4, 20, 0, 'rain', 'rain', '#c1e0d4', 1.02, .8),
    skill('A12', '회귀시', '비술 · 궤도 반전', '정점에서 방향을 뒤집어 느리게 되돌아온다. 정점을 적 뒤쪽에 놓아 후면을 노려라. 아군도 맞는다.', 4, 71, 0, 'return', 'return', '#aed4ef', 1.1, .65),
    skill('S01', '도약참', '기본 · 도약', '몸을 날려 착지 주위를 벤다. 공격 후 그 위치에 남는다.', 0, 48, 73, 'leap', 'sword', '#c6d6ef', .94, .55),
    skill('S02', '낙성강타', '비술 · 급강하', '정점에서 수평 이동을 멈추고 급강하한다. 적 위에 정점이 오도록 조준하라.', 4, 79, 115, 'slam', 'slam', '#d7d8ef', .98, .55, 2),
    skill('S03', '회전참', '회전 · 경로 공격', '비행 경로의 적을 한 번씩 벤다. 벽은 통과하지 않으며 착지 시 작은 참격.', 2, 43, 62, 'spin', 'spin', '#c5cce7', .96, .55),
    skill('S04', '돌파찌르기', '돌파 · 방벽 파괴', '첫 충돌에서 얇은 파괴 가능 방벽을 부수고 통과한다. 기반 암반에는 멈춘다.', 2, 58, 66, 'dash', 'pierce', '#d1d5de', 1.02, .5, 3.5),
    skill('S05', '충격착지', '밀림 · 착지 충격', '착지 주변을 강하게 밀어낸다. 직접 피해보다 위치를 무너뜨리는 기술.', 2, 38, 122, 'quake', 'quake', '#d9c9b0', .94, .55),
    skill('S06', '수호착지', '방호 · 진입', '착지하며 적을 공격하고 방호 44를 얻는다. 상대 팀의 다음 차례까지 유지.', 2, 36, 73, 'guard', 'shield', '#a8c8e4', .94, .55),
    skill('S07', '승천참', '띄우기 · 위치 변경', '착지 근처의 적을 위로 띄운다. 낙하와 아군의 후속 사격을 연계한다.', 2, 42, 83, 'lift', 'lift', '#c8dce7', .96, .55),
    skill('S08', '갈고리도약', '갈고리 · 고지 진입', '갈고리 검을 지형에 걸어 그곳으로 이동한다. 이동 중 벽은 통과하지 못한다.', 2, 28, 55, 'grapple', 'hook', '#b6ccd7', 1.03, .65),
    skill('S09', '반월검기', '원거리 · 초승달', '제자리에서 중력을 받는 검기를 쏜다. 접근하기 어려운 적을 견제한다.', 0, 36, 47, 'crescent', 'crescent', '#bfd4ee', 1.07, .7),
    skill('S10', '진공쇄도', '원거리 · 지표 이동', '검기가 지면을 따라 짧게 이동한다. 큰 틈을 만나면 사라진다.', 2, 45, 48, 'groundwave', 'wave', '#b7d8e7', 1.02, .65),
    skill('S11', '방패투척', '원거리 · 반사', '한 번 튕기는 방패. 적을 가볍게 밀고 방호에 큰 충격을 준다.', 2, 42, 32, 'shieldthrow', 'shield', '#c1cedd', 1.06, .6),
    skill('S12', '귀환참', '비술 · 귀환 진입', '출발점에 인장을 남기고 도약 공격 후 돌아온다. 귀환 경로에는 추가 공격이 없다.', 4, 66, 92, 'recall', 'recall', '#cbbcf0', .98, .55)
].map(s => [s.id, s]));
export const THEMES = [
    { name: '회색 변경', eng: 'THE GREY MARCH', sky: ['#243a48', '#8c8a76', '#c3a67c'], far: '#596b6a', mid: '#405454', stone: '#536268', top: '#939d90', accent: '#d5b37a', mist: '#a8b5a1', flag: '#82685a', regionText: '무너진 관문 너머, 아직 꺼지지 않은 불빛.' },
    { name: '산악 수도원', eng: 'THE WINDWARD ABBEY', sky: ['#253b58', '#7d9eaf', '#cfbda2'], far: '#647a91', mid: '#405a72', stone: '#536879', top: '#b2b6af', accent: '#c8bf99', mist: '#bdd1d3', flag: '#8b918f', regionText: '바람은 기도를 듣지 않는다. 다만 궤적을 바꾼다.' },
    { name: '침수된 연금 지구', eng: 'THE DROWNED QUARTER', sky: ['#183b40', '#567977', '#b7ac86'], far: '#4d7977', mid: '#315a5c', stone: '#52696b', top: '#8bac9d', accent: '#a7d5bc', mist: '#99c0ae', flag: '#62837a', regionText: '물이 삼킨 거리에서 오래된 연금술이 깨어난다.' },
    { name: '흑요 채석장', eng: 'THE OBSIDIAN DEPTHS', sky: ['#151b2b', '#2a3043', '#57536a'], far: '#363b51', mid: '#262c42', stone: '#414555', top: '#828598', accent: '#b7a5d2', mist: '#7d829c', flag: '#615d78', regionText: '낮은 천장, 검은 광석. 빛은 반사되어 돌아온다.' },
    { name: '왕성 외곽', eng: 'THE IRON CITADEL', sky: ['#292c3f', '#796a75', '#c7957d'], far: '#666471', mid: '#403f55', stone: '#555662', top: '#97929a', accent: '#d8a796', mist: '#aa9a9f', flag: '#87484d', regionText: '두 겹의 성문도, 한 번의 완벽한 궤적은 막지 못한다.' },
    { name: '낙성 관측성', eng: 'THE FALLING STAR', sky: ['#10172b', '#28344f', '#5d6884'], far: '#424c70', mid: '#293553', stone: '#4c5773', top: '#a1a9c3', accent: '#d7c494', mist: '#8f9cbd', flag: '#586b92', regionText: '별이 떨어진 자리에, 마지막 계약이 기다린다.' }
];
export const ENEMIES: Record<string, {
    name: string;
    cls: ClassId;
    hp: number;
    skills: string[];
    armor: number;
    intent: string;
}> = {
    bow: { name: '변경 장궁병', cls: 'archer', hp: 100, skills: ['A01', 'A04'], armor: 0, intent: '정밀 사격' }, crossbow: { name: '왕성 석궁병', cls: 'archer', hp: 112, skills: ['A02', 'A05'], armor: .06, intent: '관통 사격' }, slinger: { name: '투석 척후병', cls: 'mage', hp: 96, skills: ['M01', 'M02'], armor: 0, intent: '포물선 사격' }, guard: { name: '철벽 방패병', cls: 'knight', hp: 132, skills: ['S11', 'S09'], armor: .26, intent: '방패 견제' }, leaper: { name: '검은 도약기사', cls: 'knight', hp: 145, skills: ['S01', 'S05', 'S06'], armor: .12, intent: '도약 준비' }, fire: { name: '재의 화염술사', cls: 'mage', hp: 105, skills: ['M01', 'M06'], armor: 0, intent: '범위 공격' }, frost: { name: '빙결 수도사', cls: 'mage', hp: 104, skills: ['M03', 'M02'], armor: .06, intent: '냉기 공격' }, storm: { name: '전격 연금사', cls: 'mage', hp: 106, skills: ['M04', 'M01'], armor: 0, intent: '전격 공격' }, bomber: { name: '폭뢰 공병', cls: 'archer', hp: 110, skills: ['A08', 'M07'], armor: 0, intent: '지연 폭발' }, healer: { name: '종루 치유사', cls: 'mage', hp: 92, skills: ['M01'], armor: 0, intent: '회복 준비' }, ward: { name: '결계 수호자', cls: 'mage', hp: 102, skills: ['M09', 'M02'], armor: .08, intent: '방호 준비' }, ballista: { name: '고정 쇠뇌', cls: 'archer', hp: 155, skills: ['A02', 'A04'], armor: .18, intent: '중량 사격' }
};
const names = [
    ['폐관문의 첫 불꽃', '성벽 아래의 사수', '부서진 도개교', '회색 숲의 계약', '화물 마차의 호위', '보루 골렘'],
    ['맞바람 순례길', '풍혈의 절벽', '쌍둥이 종탑', '현수교의 수호자', '폭풍 관측소', '종루의 대포주교'],
    ['물에 잠긴 시장', '냉각 수로', '붕괴한 증류소', '연금 운송선', '방수문의 선택', '수로의 심장'],
    ['검은 갱도', '거울 암석실', '낙석 화랑', '수직 승강로', '갱도의 포로들', '균열의 파수꾼'],
    ['이중 성문', '사수들의 회랑', '깃발을 지키는 밤', '결계의 세 탑', '배수로의 우회', '흑철 기사단장'],
    ['별빛 경사로', '끊어진 천문교', '붉은 관측실', '세 개의 조준선', '마지막 엄폐물', '관측성의 주인']
];
const briefs = [
    ['처음 맡은 계약은 단순했다. 폐관문을 점거한 척후병을 몰아내라. 이렌은 바람을 읽고 손안의 불꽃을 조용히 응축했다.', '성벽의 작은 창 너머에서 시위가 당겨지는 소리가 들린다. 카엘에게 필요한 것은 더 큰 폭발이 아니라, 정확한 한 발이다.', '다리는 끊어졌지만 계약은 끝나지 않았다. 레온은 무너진 난간을 밟고, 검이 닿을 곳을 바라본다.', '길 위에서 만난 셋은 같은 계약서를 내민다. 이제 두 사람의 한 발이 서로의 길을 만들 차례다.', '마차에는 보석이 아니라 겨울을 날 약품이 실려 있다. 네 번의 라운드 동안 마차를 지켜라. 소수의 증원이 온다.', '관문의 수호 장치가 사람과 적을 구분하지 못한다. 장갑은 두껍지만, 엄폐와 코어 사이에는 틈이 있다.'],
    ['깃발은 동쪽을 가리키지만 가야 할 길은 서쪽이다. 맞바람에서 높은 궤적은 더 오래 흔들린다.', '절벽 아래서 솟는 기류가 낙엽을 하늘로 들어 올린다. 저 바람을 피할 것인가, 이용할 것인가.', '두 종탑 사이로 서로 다른 높이의 시선이 교차한다. 높은 곳의 사수와 낮은 곳의 방패병을 갈라놓아라.', '교량의 지지대는 아직 버티고 있다. 적의 발판을 무너뜨릴 수 있지만, 그 길을 나도 건너야 할지 모른다.', '오래된 풍향 장치가 폭풍을 붙잡고 있다. 장치를 파괴하면 해당 기류도 멎는다.', '종루의 마지막 수호자는 내려오지 않는다. 지붕을 부수거나, 종의 옆을 지나는 궤적을 찾아라.'],
    ['집들의 지붕만 물 위로 남았다. 같은 물에 발을 담갔다면, 전격은 편을 가리지 않는다.', '얕은 수로가 밤새 얼어붙었다. 착지와 밀림에 남는 짧은 미끄러짐을 이용하라.', '유리와 청동 사이로 휘발성 잔류물이 빛난다. 저 용기를 맞히는 한 발이면 전장은 크게 달라진다.', '버려진 운송선이 수문 주기에 맞춰 움직인다. 발판은 라운드 사이에만 이동한다.', '남은 수문 손잡이에 화살 자국이 보인다. 장치를 맞히면 물길의 수위가 바뀐다.', '수로의 모든 전력이 중앙 기관으로 모인다. 보조 연결 장치를 끊으면 코어의 방호가 약해진다.'],
    ['머리 위는 검은 암반이다. 하늘에서 떨어지는 기술보다 낮은 궤도와 단단한 벽이 답이 될 때가 있다.', '광석 표면에 불빛이 또렷하게 비친다. 튕겨 들어오는 한 발은 방패의 방향을 무의미하게 만든다.', '지지대가 비명을 낸다. 표시된 버팀목을 부수면 연결된 바위가 무너져 아래를 덮친다.', '광부들의 승강기가 마지막 동력으로 오르내린다. 다음 위치를 읽어 전선을 옮겨라.', '포로들이 적의 엄폐물 바로 옆에 갇혀 있다. 무작정 큰 폭발을 쓰지 말고, 모두 살아서 나갈 길을 찾아라.', '어둠 속 거대한 파수꾼이 두 굴 사이를 오간다. 다음 위치와 외피가 열리는 라운드를 읽어라.'],
    ['첫 문을 부순 뒤에도 두 번째 벽이 남아 있다. 파괴가 끝날 때까지 기다릴지, 작은 사격 틈을 찾을지 선택하라.', '서로 다른 높이의 사수들이 성벽을 지킨다. 그들의 의도는 읽을 수 있지만 날아오는 화살은 진짜다.', '깃발이 쓰러지면 후방의 사람들이 길을 잃는다. 네 라운드의 증원을 버티고 남은 적을 제압하라.', '세 장치의 빛이 수비대의 갑옷을 감싼다. 장치를 부숴 결계를 해제하고 전장을 정리하라.', '위쪽 정면으로 갈 수도, 낮은 배수로에서 출발할 수도 있다. 준비 화면에서 진입로를 선택하라.', '기사단장은 말없이 검을 든다. 방어 태세가 풀리는 순간, 그도 몸을 날린다.'],
    ['별빛 아래 매끈한 경사판이 늘어서 있다. 모든 반사면은 새로운 발사대와 같다.', '천문교의 가운데가 비어 있다. 이동 발판과 기류가 만들어주는 순간의 길을 잡아라.', '관측 장치 사이에서 불꽃과 물길이 교차한다. 안전해 보이는 엄폐도 폭발 앞에서는 오래 버티지 못한다.', '세 명의 적이 각기 다른 방향으로 준비한다. 정밀 사수, 범위 마법사, 도약기사. 누구의 다음 한 발을 막을 것인가.', '오늘의 엄폐는 다음 라운드의 잔해가 된다. 벽이 무너질수록 전장은 넓어지고 판단할 시간은 선명해진다.', '관측성의 주인은 하늘에 인장을 찍는다. 별이 떨어지기 전, 우리가 쏠 마지막 궤적을 정하자.']
];
const tips = ['짧게 눌러도 발사된다. 45° · 약 50%에서 시작해 지난 발을 보정해 보자.', '관통시는 얇은 목재를 통과한다. 화살은 폭발하지 않으니 몸통을 직접 노려라.', '도약은 공격이자 이동이다. 낙성강타는 정점을 지나면 수직으로 내려온다.', '아군 순서를 바꿀 수 있다. 첫 발로 길을 열고 다음 발로 마무리하라.', '회복약은 사격 대신 사용한다. 마차 체력과 증원 예고를 확인하라.', '붉은 장갑 상태에서는 피해가 줄어든다. 파쇄와 파갑, 약점 노출을 활용하라.'];
const regionRoles = [['bow', 'slinger', 'guard', 'fire'], ['bow', 'frost', 'guard', 'healer'], ['storm', 'bomber', 'ward', 'bow'], ['crossbow', 'guard', 'slinger', 'bomber'], ['leaper', 'crossbow', 'healer', 'ward'], ['fire', 'crossbow', 'leaper', 'storm']];
export const STAGES: Stage[] = names.flatMap((ns, r) => ns.map((name, l) => {
    const id = r * 6 + l + 1;
    let en: EnemySpec[] = [{ role: regionRoles[r][l % 4], x: 965 }, { role: regionRoles[r][(l + 1) % 4], x: 1200 }];
    if (id <= 3)
        en = [{ role: id === 3 ? 'guard' : id === 2 ? 'bow' : 'slinger', x: 955, hp: id === 3 ? 78 : 62 }];
    if (r >= 1 && l === 3)
        en.push({ role: regionRoles[r][(l + 2) % 4], x: 770 });
    if (id === 34)
        en = [{ role: 'crossbow', x: 890 }, { role: 'fire', x: 1110 }, { role: 'leaper', x: 1270 }];
    const objective = id === 5 ? 'escort' : id === 23 ? 'rescue' : id === 27 ? 'defend' : id === 28 ? 'wards' : 'clear';
    return { id, region: r, local: l, name, subtitle: `${String(id).padStart(2, '0')} / ${THEMES[r].eng}`, brief: briefs[r][l], outro: l === 5 ? ['관문이 열렸다. 북쪽 산맥에서 종소리가 들려온다.', '바람이 잠잠해졌다. 계곡 아래, 물에 잠긴 도시가 나타난다.', '수문이 멎고 도시의 불빛이 돌아온다. 물 아래 길은 검은 갱도로 이어진다.', '포로들은 지상으로, 용병단은 왕성으로 향한다. 이제 남은 것은 마지막 계약이다.', '기사단장은 검을 거두고 길을 내준다. 관측성 위로 별 하나가 떨어진다.', '별은 더 이상 떨어지지 않는다. 세 사람은 새벽빛 속에서 계약서를 접었다. 아직 가보지 않은 길은 많다.'][r] : '계약을 마쳤다. 남은 불빛을 뒤로하고, 용병단은 다음 전장으로 향한다.', tip: r === 0 ? tips[l] : briefs[r][l].split('. ').slice(-1)[0], objective, layout: l, wind: r === 0 ? [0, 12, -8, 6] : r === 1 ? [-30, -18, 20, 34, -24] : r === 3 ? [0, 4, -4] : [14, -20, 8, 28, -14], enemies: en, solo: id <= 3 ? (['mage', 'archer', 'knight'] as ClassId[])[id - 1] : undefined, boss: l === 5 ? r + 1 : undefined, par: l === 5 ? 10 : 8 };
}));
export function unlockedSkills(cls: ClassId, cleared: number, all = false) { return CLASSES[cls].order.slice(0, all ? 12 : Math.min(12, 4 + Math.floor(cleared / 6) * 2)); }
export const ITEM_INFO = { heal: { name: '회복약', desc: '현재 용병의 체력 65 회복', icon: 'potion' }, focus: { name: '집중약', desc: '집중력 4 회복 · 이번 행동 소비', icon: 'rune' }, cleanse: { name: '정화약', desc: '구속·파갑·표식을 제거하고 체력 22 회복', icon: 'snow' }, ward: { name: '방호 부적', desc: '다음 적 차례까지 방호 60', icon: 'shield' } };
// RPG edition keeps every original projectile rule; mana uses an expanded pool.
for (const s of Object.values(SKILLS)) {
    s.cost *= 10;
}
SKILLS.M08.name = '극지의 핵';
SKILLS.M08.color = '#9bd6f0';
SKILLS.M11.name = '빙하 파쇄';
SKILLS.M11.color = '#a1dced';
SKILLS.M07.name = '뇌전 인장';
SKILLS.M07.color = '#c5aff3';
SKILLS.M10.name = '잔류 전류';
SKILLS.M10.color = '#c5aff3';
SKILLS.M12.name = '전격 공명';
SKILLS.M12.color = '#d1bef8';
THEMES[0].name = '변경의 숲';
THEMES[0].sky = ['#172e36', '#638477', '#c6b995'];
THEMES[3].name = '용암 채석장';
THEMES[3].sky = ['#211b29', '#4c3037', '#986355'];
THEMES[3].accent = '#efab88';
for (const stage of STAGES) {
    stage.solo = undefined;
    stage.par = 18 + stage.region * 3;
}
ITEM_INFO.heal.desc = '최대 HP의 45% 회복';
ITEM_INFO.focus.name = '마나 물약';
ITEM_INFO.focus.desc = '최대 MP의 60% 회복';
ITEM_INFO.ward.desc = '다음 적 차례까지 최대 HP의 20% 방호';
STAGES[4].brief = '숲길을 막은 적들을 제압하고 구호 마차를 지켜라. 용병단이 전진하면 마차도 뒤를 따른다.';
STAGES[26].brief = '성벽의 깃발을 지키며 수비대를 제압하라. 가까운 적부터 전선을 정리하는 편이 안전하다.';
STAGES[28].brief = '성벽 위와 아래의 길이 갈라진다. 용병의 이동과 도약으로 유리한 진입로를 고르자.';
for (const stage of STAGES)
    stage.tip = '지면을 눌러 이동하고, 용병 근처를 드래그하여 조준하세요.';
SKILLS.M10.desc = '지면을 따라 전류구가 굴러가며 2라운드의 잔류 전류를 남긴다. 영역 안에서 행동을 끝내면 피해를 준다.';
SKILLS.S06.desc = '착지하며 적을 공격하고 공격 배율에 비례한 방호를 얻는다. 상대 팀의 다음 차례까지 유지.';
// Already expressed in RPG mana units: do not apply the v1-to-v2 ×10 conversion again.
// v3.0: traveling spell emitters. Secondary projectiles obey the same collision world.
for (const skill of [
    { id: 'M13', cls: 'mage', name: '화염혜성', tag: '화염 · 유성우', desc: '혜성이 비행하며 불씨를 아래로 흩뿌린다. 강화에 따라 최대 불씨 수가 16~30개로 증가한다. 높이와 바람으로 폭격 구간을 정한다.', cost: 30, damage: 58, radius: 78, speed: .77, wind: 1.05, mode: 'emberOrb', color: '#ffac66', icon: 'flame', terrain: .7 },
    { id: 'M14', cls: 'mage', name: '빙하구', tag: '빙결 · 회전 파편', desc: '회전하는 얼음 파편을 사방으로 방출한다. 강화에 따라 최대 파편 수가 32~60개로 증가한다. 파편에 맞으면 이동이 둔화된다.', cost: 32, damage: 45, radius: 66, speed: .71, wind: .88, mode: 'frostOrb', color: '#99eaff', icon: 'snow', terrain: .45 },
    { id: 'M15', cls: 'mage', name: '뇌운핵', tag: '뇌전 · 수직 방전', desc: '떠가는 뇌운핵에서 전격을 연속 방출한다. 강화에 따라 최대 방전 수가 12~19개로 증가한다. 번개도 지붕과 벽에 막힌다.', cost: 34, damage: 52, radius: 60, speed: .75, wind: 1.08, mode: 'stormOrb', color: '#c2b9ff', icon: 'bolt', terrain: .65 },
] as Skill[])
    SKILLS[skill.id] = skill;

// Exactly 15 active + 5 learned-passive skills per class; all support eight ranks.
for (const s of [
 skill('A13','유도 화살','추적 · 제한 선회','비행 중 300 거리 안, 시야가 열린 적을 찾아 부드럽게 선회한다. 벽은 통과하지 못한다.',26,48,0,'homing','target','#b9f1d4',1.08,.5,.6),
 skill('A14','풍절시','장거리 · 바람 관통','바람을 거의 받지 않는 가볍고 빠른 정밀 화살. 긴 사거리와 충돌 속력을 활용한다.',24,55,0,'windArrow','wind','#bce5f5',1.32,.08,.8),
 skill('A15','추격 성좌','분열 · 추적','정점에서 세 개의 추적 화살로 갈라진다. 탐지 범위 밖에서는 그대로 떨어진다.',36,25,0,'seekRain','triple','#d9e7a4',1.04,.65,.6),
 skill('S13','관통돌격','돌격 · 다중 운반','몸의 궤적에 닿은 적을 한 번씩 타격하며 함께 밀고 간다. 벽과 고정 보스에 부딪히면 멈춘다.',30,59,78,'charge','pierce','#efc790',1.10,.50,1.6),
 skill('S14','쌍월참','검기 · 양날','상하로 조금 벌어지는 두 개의 검기를 쏜다. 각각 폭발하지만 한 적에게 겹치는 피해는 제한된다.',26,32,58,'twinCrescent','crescent','#b8dfff',1.10,.65,.8),
 skill('S15','천공도약','고공 진입 · 기절','강한 도약으로 높은 발판에 접근한다. 착지 주변에 피해를 주고 잠시 기절시킨다.',34,57,96,'vault','lift','#d2bdff',1.28,.50,1.2)
]) SKILLS[s.id]=s;
const passive=(id:string,cls:ClassId,name:string,desc:string,icon:string,color:string):Skill=>({id,cls,name,tag:'패시브 · 자동 적용',desc,cost:0,damage:0,radius:0,speed:1,wind:0,mode:'passive',icon,color,terrain:0,passive:true});
for (const s of [
 passive('MP01','mage','잔향 마력','주 투사체가 처음 폭발한 곳에 잔향 폭발을 더한다. 파편과 후폭발은 다시 발동시키지 않는다.','resonance','#f1b57e'),
 passive('MP02','mage','성운 확장','마법의 폭발 반경을 넓힌다. 자신과 동료가 휘말릴 범위도 함께 넓어진다.','burst','#d8c4fc'),
 passive('MP03','mage','마력 환류','한 행동에서 처음 적에게 피해를 주면 MP를 회복한다. 연사·파편으로 중복 회복하지 않는다.','rune','#98d9db'),
 passive('MP04','mage','원소 장막','마법을 발사할 때 최대 HP에 비례한 방호를 얻는다. 다음 적 차례 종료까지 유지된다.','shield','#9acce6'),
 passive('MP05','mage','분광학','분열탄과 보조 투사체의 피해를 높인다. 추가 분열을 생성하지는 않는다.','snow','#b5cbfc'),
 passive('AP01','archer','연속 시위','0.5초 간격 연사하며 후속탄은 조준 방향에서 ±2° 흩어진다. Lv.1~4는 총 2~5발, Lv.5~8은 후속탄 위력을 강화한다. 추가 MP는 소모하지 않는다.','triple','#bfdba5'),
 passive('AP02','archer','매의 눈','유도 화살의 탐지 범위와 모든 화살의 직격 피해를 높인다.','target','#cfe5b7'),
 passive('AP03','archer','바람 걸음','한 차례에 이동할 수 있는 거리와 걷는 속도를 높인다.','wind','#9ad6d2'),
 passive('AP04','archer','탄성 관통','빠르게 명중할수록 강해지는 속력 피해 배율을 강화한다. 재생 배속과는 무관하다.','pierce','#ead5ad'),
 passive('AP05','archer','집중 호흡','이번 차례 이동 예산의 80% 이상을 남긴 채 사격하면 피해가 증가한다.','rune','#b2c8ea'),
 passive('SP01','knight','전장의 중심','도약 착지 때 주변 적을 착지점으로 끌어당긴다. 랭크가 높을수록 범위와 흡인력이 커진다.','vortex','#d6c4a6'),
 passive('SP02','knight','강철 피부','최대 HP와 방어력을 높인다. 피해 감소에는 전체 상한이 적용된다.','shield','#adc6df'),
 passive('SP03','knight','충격 흡수','자신이 받는 밀치기 충격을 줄인다. 최대 80% 저항하며 완전 면역이 되지는 않는다.','bind','#a1ceda'),
 passive('SP04','knight','도약의 달인','이동 거리와 점프 높이를 늘리고 점프의 이동 비용을 줄인다. 점프 비용은 최소 15다.','lift','#d7d0e9'),
 passive('SP05','knight','불굴','전투당 한 번, 치명상을 받으면 최대 HP의 일부를 남기고 버틴다. 이미 쓰러진 상태에서는 발동하지 않는다.','heart','#e6ba9e')
]) SKILLS[s.id]=s;
THEMES[5].name='천공 첨탑';THEMES[5].eng='THE ASCENDING SPIRE';THEMES[5].regionText='층층이 떠 있는 관측 회랑. 마지막 별은 가장 높은 곳에 있다.';
const spireNames=['천공의 첫 계단','부유하는 회랑','별빛 승강로','폭풍의 나선','정상의 세 관문','첨탑의 주인'];
for(let i=0;i<6;i++){STAGES[30+i].name=spireNames[i];STAGES[30+i].brief='발판과 회랑을 따라 위로 전진하며 수비대를 제압하라. 점프와 고각·하향 사격으로 서로 다른 층을 공략한다.';}
for(const id of [8,11,17,22]){STAGES[id-1].subtitle='수직 원정';STAGES[id-1].tip='왼손 스와이프와 점프로 발판을 올라가세요. 미니맵에서 위층도 살펴볼 수 있습니다.';}

// v8: distinct combat profiles and class ultimates. Values intentionally trade reach, impact and area.
const V8_SKILL_TUNING:Record<string,Partial<Skill>>={
 M01:{damage:42,radius:92,speed:.98}, M02:{damage:54,radius:74,speed:1.06,wind:.9}, M03:{damage:25,radius:132,speed:.92}, M04:{damage:57,radius:68,speed:1.08}, M05:{damage:94,radius:176,speed:.91}, M06:{damage:19,radius:54,speed:.89}, M07:{damage:72,radius:148,speed:.96}, M08:{damage:18,radius:214,speed:.86}, M09:{damage:10,radius:44,speed:.82}, M10:{damage:36,radius:84,speed:.84}, M11:{damage:31,radius:106,speed:1.02,terrain:5.4}, M12:{damage:44,radius:88,speed:1.04}, M13:{damage:52,radius:72,speed:.80}, M14:{damage:39,radius:64,speed:.74}, M15:{damage:46,radius:58,speed:.82},
 A01:{damage:43,speed:1.23,wind:.55}, A02:{damage:53,speed:1.28,terrain:1.5}, A03:{damage:47,speed:1.18}, A04:{damage:22,speed:1.16}, A05:{damage:36,speed:1.00,wind:.42}, A06:{damage:29,speed:1.15}, A07:{damage:34,speed:1.26,terrain:2}, A08:{damage:19,radius:88,speed:1.08}, A09:{damage:30,speed:1.13}, A10:{damage:24,speed:1.25}, A11:{damage:18,speed:1.06}, A12:{damage:76,speed:1.17}, A13:{damage:45,speed:1.17}, A14:{damage:58,speed:1.52,wind:.06}, A15:{damage:23,speed:1.10},
 S01:{damage:54,radius:78,speed:.98}, S02:{damage:88,radius:124,speed:1.02}, S03:{damage:48,radius:66,speed:1.04}, S04:{damage:64,radius:62,speed:1.15,terrain:4.2}, S05:{damage:34,radius:148,speed:.92}, S06:{damage:40,radius:82,speed:.94}, S07:{damage:44,radius:94,speed:1.00}, S08:{damage:28,radius:58,speed:1.18}, S09:{damage:37,radius:46,speed:1.12}, S10:{damage:50,radius:54,speed:1.06}, S11:{damage:46,radius:38,speed:1.10}, S12:{damage:73,radius:100,speed:1.04}, S13:{damage:66,radius:86,speed:1.18}, S14:{damage:35,radius:62,speed:1.16}, S15:{damage:63,radius:112,speed:1.34}
};
for(const [id,patch] of Object.entries(V8_SKILL_TUNING))Object.assign(SKILLS[id],patch);

for(const s of [
 {id:'M99',cls:'mage',name:'천공 심판',tag:'궁극기 · 비전 폭뢰',desc:'비전핵이 정점에서 붕괴하며 넓은 범위의 적들에게 보라색 낙뢰탄을 자동 방출한다. 강력하지만 MP 소모가 매우 크고 사용 후 2라운드 동안 재사용할 수 없다.',cost:62,damage:104,radius:112,speed:.88,wind:.8,mode:'arcaneJudgment',color:'#c88cff',icon:'bolt',terrain:1.4,ultimate:true,cooldown:2},
 {id:'A99',cls:'archer',name:'별사냥',tag:'궁극기 · 추적 성좌',desc:'한 발을 하늘 높이 쏘아 정점에서 다수의 황금 추적화살로 분열시킨다. 서로 다른 적을 우선 추적하며 먼 거리의 전열을 동시에 꿰뚫는다.',cost:56,damage:86,radius:0,speed:1.34,wind:.35,mode:'starHunt',color:'#f5dd8c',icon:'target',terrain:.8,ultimate:true,cooldown:2},
 {id:'S99',cls:'knight',name:'파성진',tag:'궁극기 · 파성 돌격',desc:'검사가 거대한 검광을 두르고 전장을 관통한다. 경로의 적들을 끌고 밀어붙인 뒤 착지점에서 대범위 충격파와 기절을 일으킨다.',cost:60,damage:118,radius:184,speed:1.28,wind:.28,mode:'cataclysmCharge',color:'#e2c4ff',icon:'sword',terrain:3.5,ultimate:true,cooldown:2}
] as Skill[])SKILLS[s.id]=s;


// v9 — the Occultist (심령술사): 15 active skills, five learned passives and one ultimate.
for(const s of [
 { ...skill('O01','혼령탄','유령 · 저중력','중력과 바람의 영향을 적게 받는 혼령을 날린다. 긴 궤도를 안정적으로 그리는 기본기.',0,39,72,'spiritBolt','rune','#c9a7ff',1.02,.22,.45),gravity:.28 },
 { ...skill('O02','투과령','유령 · 시간 기폭','지형과 생명체를 통과한다. 통과한 적에게 영체 피해를 남기며, 충전량이 길수록 더 오래 비행한 뒤 그 자리에서 폭발한다.',24,55,94,'phaseWraith','resonance','#b98be8',.96,.15,.2),gravity:.18,phase:'all' as const,fuse:1.35 },
 { ...skill('O03','역천령','유령 · 역중력','중력이 반대로 작용해 하늘로 치솟는다. 상공 경계에 닿으면 원혼비로 갈라져 아래를 덮친다.',28,62,105,'reverseGhost','vortex','#a985e8',.88,.20,.35),gravity:-.62 },
 { ...skill('O04','황천창','유령 · 지형 투과','벽과 지형을 무시하지만 첫 생명체에는 실체화해 강하게 꽂힌다.',30,76,28,'spiritLance','pierce','#d6b9ff',1.14,.10,.15),gravity:.08,phase:'terrain' as const },
 { ...skill('O05','회귀망령','유령 · 왕복','모든 것을 투과하며 날아가 접촉한 적에게 피해를 남긴다. 되돌아오는 길에도 다시 적을 관통해 더 큰 영체 피해를 준다.',38,50,118,'wraithReturn','return','#c2a1ef',.91,.18,.25),gravity:.14,phase:'all' as const,fuse:1.45 },
 { ...skill('O06','쇠망부','저주 · 쇠약','낮은 피해와 함께 공격력과 방어력을 낮추는 쇠약을 3라운드 남긴다.',24,24,18,'curseWeak','rune','#aa7bc8',1.06,.55,.35) },
 { ...skill('O07','증오부','저주 · 적대 전이','부적에 맞은 적은 2라운드 동안 주변 아군의 적의에 노출되어 같은 편에게도 표적이 된다.',28,18,34,'curseBetray','target','#d078ae',1.03,.55,.25) },
 { ...skill('O08','악령진','저주 · 5라운드','넓은 범위에 악령의 낙인을 새긴다. 피해는 작지만 5라운드 동안 지속 피해를 준다.',34,18,156,'curseDot','rune','#8d62b7',.95,.65,.3) },
 { ...skill('O09','봉혼부','저주 · 속박','맞은 적의 이동과 공격력을 크게 낮춘다. 범위 내 여러 적에게 짧게 번진다.',30,29,88,'curseBind','bind','#9e7bc2',1.04,.52,.4) },
 { ...skill('O10','연쇄원한','저주 · 전염','낙인이 폭발하며 주변 적에게 짧은 원한을 전염시킨다. 밀집 대형에 강하다.',38,36,104,'curseChain','burst','#c061a5',.98,.58,.4) },
 { ...skill('O11','배회령의 씨앗','소환귀 · 추적','착탄 지점에 배회령을 소환한다. 플레이어 턴 종료 후 소환귀 턴에 가까운 적에게 빠르게 접근해 근접 공격한다.',28,12,24,'summonStalker','rune','#9ab8cf',.94,.55,.2) },
 { ...skill('O12','등불귀','소환귀 · 공중 소환','투사체가 일정 시간 비행하면 공중에서 등불귀가 태어난다. 플레이어 턴 뒤 소환귀 차례에 2,400 거리 안의 모든 적에게 각각 추적 원혼탄을 발사한다. 표적이 멀면 먼저 비행해 접근한다.',32,10,34,'summonLantern','flame','#96c5d8',.90,.45,.2),gravity:.35,fuse:1.15 },
 { ...skill('O13','돌격귀의 씨앗','소환귀 · 돌격','착탄 지점에 돌격귀를 소환한다. 수평·수직 지형을 넘어 최대 3,200 거리까지 추적 이동한 뒤, 사거리 안의 적을 강하게 밀친다.',34,18,42,'summonCharger','slam','#b0a0d8',1.00,.48,.4) },
 { ...skill('O14','수호령의 씨앗','소환귀 · 방호','착탄 지점에 수호령을 소환한다. 매 소환귀 턴 주변 아군에게 방호를 부여한다.',36,8,96,'summonWarden','shield','#86b4c9',.92,.50,.2) },
 { ...skill('O15','귀문의 씨앗','소환귀 · 다중 소환','귀문을 열어 서로 다른 성향의 소환귀 둘을 동시에 불러낸다. 유지시간은 짧지만 압박이 강하다.',44,16,86,'summonHost','vortex','#c6a1eb',.88,.55,.3) },
] as Skill[]) SKILLS[s.id]=s;

for(const s of [
 passive('OP01','occultist','경계 감응','유령 계열의 중력 영향을 더 줄이고 피해를 높인다.','resonance','#c7a7ef'),
 passive('OP02','occultist','흉조 증폭','저주의 지속시간과 지속 피해·약화 효과를 강화한다.','rune','#c978ad'),
 passive('OP03','occultist','귀문 강화','소환귀의 최대 HP와 공격력을 크게 높인다.','vortex','#8fbfd0'),
 passive('OP04','occultist','사념 회수','저주받은 적이 쓰러지면 심령술사가 MP를 회복한다. 한 적당 한 번만 발동한다.','return','#a98bc8'),
 passive('OP05','occultist','경계 합일','유령과 소환귀가 저주받은 적에게 추가 피해를 준다.','star','#d4b2ef')
]) SKILLS[s.id]=s;

SKILLS.O99={id:'O99',cls:'occultist',name:'백귀야행',tag:'궁극기 · 경계 붕괴',desc:'혼령핵이 정점에서 귀문을 열어 넓은 범위의 적을 저주하고 추적 원혼을 쏟아낸다. 귀문 아래에는 강력한 소환귀 둘이 남는다.',cost:72,damage:92,radius:190,speed:.84,wind:.18,mode:'nightParade',color:'#b780f0',icon:'vortex',terrain:.35,ultimate:true,cooldown:2,gravity:.18};

installSkillRedesign(SKILLS);
