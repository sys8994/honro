import { DIFFICULTIES, setDifficulty, GAME_NAME, GAME_NAME_KO } from './balance';
import { AtlasController, type AtlasView } from './atlasControls';
import { ATLAS_WIDTH, ATLAS_HEIGHT, ATLAS_REGIONS, STAGE_PLACES, HUBS, type HubId } from './atlasLayout';
import type { Profile, Battle, ClassId, Event, Unit, Skill } from './types';
import { CLASSES, SKILLS, STAGES, THEMES, ITEM_INFO } from './data';
import { clamp, STEP, escapeHTML, topAt, AIM_MIN, AIM_MAX, swipeAxis, joystickAxes } from './math';
import { createBattle, upgradeBattle } from './world';
import { Engine } from './engine';
import { Renderer } from './art';
import { AudioEngine } from './audio';
import { Storage, defaults, validate } from './store';
import { icon, crest } from './icons';
import * as Progress from './progression';
import { CLASS_IDS, levelOf, xpFraction, xpAtLevel, xpToNext, pointsLeft, heroStats, TALENTS, TALENT_MAP, BRANCHES, train, trainReason, untrain, untrainReason, resetTalents, autoTrain, sanitizeLoadout, baseSkill, MAP_NODES, isOpen, mapPath, nextStage, recommendedLevel, ultimateUnlocked, ultimateProgress, ULTIMATES } from './progression';
import { worldMapSVG } from './mapArt';
import { campView, talentView, ultimateView, slotLibrary, slotCard, skillStamp } from './campUI';
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const esc = escapeHTML, copy = <T>(o: T): T => JSON.parse(JSON.stringify(o));
const n2 = (n: number) => String(n).padStart(2, '0');
const clsName = (cls: ClassId) => cls === 'mage' ? '마법사' : cls === 'archer' ? '궁수' : cls === 'knight' ? '검사' : '심령술사';
const objectives = { clear: '적 제압', escort: '마차 보호', rescue: '포로 보호', defend: '깃발 방어', wards: '결계 파괴' };
function nav(title:string,back='title'){return `<header class="topnav"><button class="icon-btn" data-action="${back}" aria-label="뒤로">${icon('back')}</button><div class="brandmark">${crest}</div><h2>${title}</h2><span class="spacer"></span><button class="icon-btn" data-action="settings" aria-label="설정">${icon('gear','',20)}</button></header>`;}
class App {
    root = $('app');
    overlay = $('overlay');
    backCanvas = $<HTMLCanvasElement>('backdrop');
    back: Renderer;
    renderer: Renderer | null = null;
    engine: Engine | null = null;
    profile: Profile = defaults();
    storage = new Storage();
    audio = new AudioEngine();
    screen: 'title' | 'map' | 'camp' | 'battle' = 'title';
    stageId = 1;
    atlas:AtlasController|null=null;
    private atlasView:AtlasView|undefined;
    private atlasStage=0;
    private selectedHub:HubId|null=null;
    viewClass: ClassId = 'mage';
    selected = 'M01';
    power = .5;
    charging = false;
    paused = false;
    modalType = '';
    slot = 1;
    campBranch = 0;
    private portraits: Record<string, string> = {};
    private keys = new Set<string>();
    private last = 0;
    private accumulator = 0;
    private lastHUD = 0;
    private lastSave = 0;
    private toastTimer = 0;
    private bannerTimer = 0;
    private resultBattle: Battle | null = null;
    private returnFocus: HTMLElement | null = null;
    private selectedByUnit: Record<string, string> = {};
    private lastPlayerId = 'p0';
    private signature = '';
    private hudPhase = '';
    private mapAnimation = 0;
    private firePointer: number | null = null;
    private gesture: {
        id: number;
        x: number;
        y: number;
        lastX: number;
        lastY: number;
        kind: 'aim' | 'pan';
        moved: boolean;
        worldX: number;
        worldY: number;
    } | null = null;
    private pressTimer = 0;
    private blockClick = 0;
    private warningShown = false;
    private xpPending: Record<string, number> = {};
    private xpTimer = 0;
    private chargeStarted = 0;
    private fullscreenTried = false;
    private canvasTouches = new Map<number, {
        x: number;
        y: number;
    }>();
    private moveTouches = new Map<number, number>();
    private pinch: {
        distance: number;
        x: number;
        y: number;
    } | null = null;
    private gestureBlocked = false;
    private pressStart: {
        x: number;
        y: number;
    } | null = null;
    private spaceAction: 'jump' | 'fire' | null = null;
    private stick: {id:number;originX:number;originY:number;x:number;y:number;range:number;horizontalEngaged?:boolean}|null=null;
    private lastPhysicsMode = '';
    private previewSkillId = '';
    private previewStarted = 0;
    // Skill previews are real, isolated practice battles. They reuse the exact
    // Engine + Renderer path used by gameplay instead of a hand-drawn imitation.
    private previewEngine: Engine | null = null;
    private previewRenderer: Renderer | null = null;
    private previewCanvas: HTMLCanvasElement | null = null;
    private previewLast = 0;
    private previewAccumulator = 0;
    private previewFired = false;
    private previewResetAt = 0;
    private previewAim = { angle: 42, power: .66 };
    constructor() { this.back = new Renderer(this.backCanvas); for (const c of CLASS_IDS)
        this.portraits[c] = this.back.portrait(c, 170); this.bind(); }
    async init() { this.profile = await this.storage.load(); this.audio.configure(this.profile.settings); this.stageId = this.profile.lastStage; this.showTitle(); this.syncOrientationGate(); this.last = performance.now(); requestAnimationFrame(this.frame); this.exposeTests(); if (this.profile.migrated)
        this.toast('기록 이전 완료 · 반환된 SP를 용병 화면에서 분배하세요.'); if (this.storage.warning)
        this.toast(this.storage.warning); }
    sync() { if (this.engine?.b.mode === 'campaign')
        this.profile.heroes = copy(this.engine.b.heroes); }
    save() { if (this.engine && this.screen === 'battle') {
        this.sync();
        this.profile.saved = ['won', 'lost'].includes(this.engine.b.phase) ? null : copy(this.engine.b);
    } this.storage.save(this.profile); this.lastSave = performance.now(); }
    toast(text: string) { const el = $('toast'); el.textContent = text; el.classList.add('show'); clearTimeout(this.toastTimer); this.toastTimer = window.setTimeout(() => el.classList.remove('show'), 2800); }
    closeButton() { return `<button class="icon-btn close-x" data-action="close" aria-label="닫기">${icon('close', '', 17)}</button>`; }
    modal(html: string, type = 'dialog', wide = false) { if (!this.overlay.classList.contains('open'))
        this.returnFocus = document.activeElement as HTMLElement; this.cancelCharge(); this.keys.clear(); this.engine?.cancelMovement(); this.resetTouches(); this.paused = this.screen === 'battle'; if (this.paused) this.save(); this.modalType = type; this.overlay.innerHTML = `<section class="dialog ${type.replace(/[^a-z0-9-]/gi,'')}-dialog${wide ? ' wide' : ''}" role="dialog" aria-modal="true" tabindex="-1">${html}</section>`; this.overlay.classList.add('open'); this.overlay.querySelector<HTMLElement>('button:not(:disabled),input,select')?.focus({ preventScroll: true }); }
    closeModal() { this.overlay.classList.remove('open'); this.overlay.innerHTML = ''; this.modalType = ''; this.previewSkillId=''; this.disposeSkillPreview(); this.paused = false; this.last = performance.now(); this.accumulator = 0; if (this.returnFocus?.isConnected)
        this.returnFocus.focus({ preventScroll: true }); }
    clearOverlay() { this.overlay.classList.remove('open'); this.overlay.innerHTML = ''; this.modalType = ''; this.previewSkillId=''; this.disposeSkillPreview(); this.paused = false; this.cancelCharge(); this.keys.clear(); this.resetTouches(); }
    disposeAtlas(){if(this.atlas){this.atlasView=this.atlas.state();this.atlas.destroy();this.atlas=null;}}
    showTitle() {
        this.disposeAtlas();
        if (this.screen === 'battle')
            this.save();
        this.clearOverlay();
        this.screen = 'title';
        this.engine = null;
        this.renderer = null;
        this.backCanvas.style.display = 'block';
        const has = Object.keys(this.profile.cleared).length || CLASS_IDS.some(c => this.profile.heroes[c].xp > 0);
        this.root.innerHTML = `<main class="screen title-screen"><div class="row"><div class="brandmark">${crest}</div><span class="title-wordmark">ARCFALL</span><span class="spacer"></span><button class="icon-btn" data-action="settings" aria-label="설정">${icon('gear', '', 20)}</button></div><div class="title-main"><div class="eyebrow">TACTICAL ARTILLERY RPG</div><h1 class="new-title">ARC<span>FALL</span></h1><div class="subtitle">WIND · TERRAIN · TRAJECTORY</div><button class="btn primary" data-action="${this.profile.saved ? 'continue' : 'map'}">${this.profile.saved ? '전투 계속하기' : has ? '원정 이어가기' : '원정 시작'}${icon('chevron', '', 19)}</button><div class="title-subnav">${this.profile.saved ? '<button class="text-link" data-action="map">원정 지도</button>' : ''}</div></div><footer class="title-footer"><span>36개 전장 · 네 명의 용병</span><span class="spacer"></span><button class="text-link" data-action="help">조작 안내</button><span>9.2</span></footer></main>`;
    }
    requestMap() { if (this.profile.saved && !this.engine) {
        this.modal(`${this.closeButton()}<h2>진행 중인 전투</h2><p>지도에 돌아가면 전장을 떠납니다.<br>이미 얻은 경험치는 그대로 남습니다.</p><div class="dialog-actions"><button class="btn" data-action="continue">전투 계속</button><button class="btn primary" data-action="abandon">지도에 복귀</button></div>`, 'return');
        return;
    } this.showMap(); }
    abandon() { this.sync(); this.profile.saved = null; this.engine = null; this.save(); this.showMap(); }
    showMap(focus=true){
        this.disposeAtlas();this.clearOverlay();this.screen='map';this.engine=null;this.renderer=null;this.backCanvas.style.display='none';
        if(!isOpen(this.profile,this.stageId))this.stageId=nextStage(this.profile);
        this.profile.lastStage=this.stageId;
        const place=STAGE_PLACES[this.profile.mapNode-1];
        this.root.innerHTML=`<main class="screen map-screen atlas-screen">${nav('장막 변경')}<section class="atlas-shell"><div class="atlas-viewport" id="map-scroll" tabindex="0"><div class="map-board" id="map-board" style="width:${ATLAS_WIDTH}px;height:${ATLAS_HEIGHT}px">${worldMapSVG(this.profile)}
        ${ATLAS_REGIONS.map((r,i)=>`<button class="atlas-region" data-action="atlas-region" data-id="${i}" data-map-x="${r.x}" data-map-y="${r.y}" style="left:${r.x}px;top:${r.y}px;--region-color:${r.color}"><strong>${r.name}</strong><small>${r.en}</small></button>`).join('')}
        ${MAP_NODES.map(n=>{const st=STAGES[n.id-1],done=!!this.profile.cleared[n.id],open=isOpen(this.profile,n.id);return `<button class="map-node ${done?'cleared':open?'open':'locked'} ${st.boss?'boss':''} ${this.stageId===n.id&&!this.selectedHub?'selected':''}" data-action="node" data-id="${n.id}" data-map-x="${n.x}" data-map-y="${n.y}" style="left:${n.x}px;top:${n.y}px" aria-label="${n.id}. ${esc(st.name)} · ${open?'권장 Lv.'+n.level:'잠김'}"><span class="atlas-pin">${st.boss?icon(done?'check':'star','',18):done?icon('check','',15):n2(n.id)}</span><span class="atlas-node-caption">${esc(st.name)}</span></button>`;}).join('')}
        ${HUBS.map(h=>`<button class="atlas-hub ${this.selectedHub===h.id?'selected':''}" data-action="atlas-hub" data-id="${h.id}" data-map-x="${h.x}" data-map-y="${h.y}" style="left:${h.x}px;top:${h.y}px;--hub-color:${h.color}" aria-label="${h.name} · ${h.sub}"><span class="hub-emblem">${icon(h.icon,'',23)}</span><span class="hub-label"><strong>${h.name}</strong><small>${h.sub}</small></span></button>`).join('')}
        <div class="party-marker" id="party-marker" style="left:${place.x}px;top:${place.y}px">${icon('sword','',21)}</div></div></div>
        <div class="atlas-tools"><button class="icon-btn" data-action="atlas-fit" aria-label="전체 지도" title="전체 지도">${icon('map','',19)}</button><button class="icon-btn" data-action="atlas-focus" aria-label="현재 위치" title="현재 위치">${icon('target','',19)}</button><span id="atlas-zoom">60%</span><button class="icon-btn" data-action="atlas-zoom-in" aria-label="지도 확대">+</button><button class="icon-btn" data-action="atlas-zoom-out" aria-label="지도 축소">−</button></div>
        <div class="atlas-progress">${Object.keys(this.profile.cleared).length}<span> / 36</span></div></section><div class="map-dock" id="map-dock"></div></main>`;
        this.atlas=new AtlasController($('map-scroll'),$('map-board'),this.atlasView);this.updateMapDock();
        if(!this.atlasView){if(this.stageId===1)this.atlas.focus(850,2160,innerWidth<600?.34:.62);else this.focusMapNode(this.stageId);}
        else if(focus&&this.atlasStage!==this.stageId&&!this.selectedHub)this.focusMapNode(this.stageId);
        this.atlasStage=this.stageId;
    }
    focusMapNode(id:number){const p=MAP_NODES[id-1];if(p)this.atlas?.focus(p.x,p.y,Math.max(this.atlas?.zoom||.6,innerWidth<600?.60:.66));}
    updateMapDock(){
        const h=HUBS.find(v=>v.id===this.selectedHub);
        if(h){$('map-dock').innerHTML=`<span class="dock-emblem" style="color:${h.color}">${icon(h.icon,'',26)}</span><div class="dock-copy"><small>${h.desc}</small><h3>${h.name}</h3><div class="stage-meta"><span>${h.id==='camp'?CLASS_IDS.map(c=>CLASSES[c].person+' Lv.'+levelOf(this.profile.heroes[c])).join(' · '):h.id==='training'?'모든 기술 · 자유 조준':'36개 전장 · 4인 편성'}</span></div></div><span class="spacer"></span><button class="btn primary" data-action="hub-enter" data-id="${h.id}">${h.button}${icon('chevron','',15)}</button>`;return;}
        const stage=STAGES[this.stageId-1],p=STAGE_PLACES[this.stageId-1],open=isOpen(this.profile,this.stageId),done=this.profile.cleared[this.stageId];
        $('map-dock').innerHTML=`<span class="dock-stage">${n2(stage.id)}</span><div class="dock-copy"><small>${esc(p.place)}</small><h3>${esc(stage.name)}</h3><div class="stage-meta"><span>Lv.${recommendedLevel(stage.id)}</span><span>${stage.boss?'보스 결전':p.terrain}</span><span>${done?'완료 '+(done.visits||1)+'회':DIFFICULTIES[this.profile.settings.difficulty].name}</span></div></div><span class="spacer"></span><button class="btn primary" data-action="launch" ${open?'':'disabled'}>${done?'재도전':open?'진입':'잠김'}${icon('chevron','',16)}</button>`;
    }
    selectHub(id:HubId){const h=HUBS.find(v=>v.id===id);if(!h)return;this.selectedHub=id;this.mapAnimation++;const loc=STAGE_PLACES[this.profile.mapNode-1],marker=$('party-marker');if(marker){marker.style.left=loc.x+'px';marker.style.top=loc.y+'px';}document.querySelectorAll('.map-node').forEach(n=>n.classList.remove('selected'));document.querySelectorAll<HTMLElement>('.atlas-hub').forEach(n=>n.classList.toggle('selected',n.dataset.id===id));this.updateMapDock();}
    selectNode(id:number){
        if(!MAP_NODES[id-1])return;this.selectedHub=null;this.stageId=id;
        document.querySelectorAll<HTMLElement>('.map-node').forEach(n=>n.classList.toggle('selected',Number(n.dataset.id)===id));document.querySelectorAll('.atlas-hub').forEach(n=>n.classList.remove('selected'));this.updateMapDock();
        if(!isOpen(this.profile,id))return;
        const route=mapPath(this.profile,this.profile.mapNode,id);if(!route.length)return;
        this.profile.lastStage=id;this.atlasStage=id;const token=++this.mapAnimation;let i=0;
        const step=()=>{if(token!==this.mapAnimation||this.screen!=='map')return;const n=MAP_NODES[route[Math.min(i,route.length-1)]-1],marker=$('party-marker');if(marker){marker.style.left=n.x+'px';marker.style.top=n.y+'px';}if(++i<route.length)window.setTimeout(step,110);};
        step();this.profile.mapNode=id;this.save();
    }
    showCamp(cls = this.viewClass) { if (this.profile.saved && !this.engine) {
        this.modal(`${this.closeButton()}<h2>먼저 전장에서 복귀할까요?</h2><p>경험치는 유지됩니다. 진행 중인 전투는 종료됩니다.</p><div class="dialog-actions"><button class="btn" data-action="close">취소</button><button class="btn primary" data-action="abandon-camp">복귀</button></div>`);
        return;
    } this.disposeAtlas(); this.clearOverlay(); this.viewClass = cls; this.screen = 'camp'; this.backCanvas.style.display = 'none'; this.renderCamp(); }
    renderCamp() {
        const old=$('camp-scroll'),y=old?.scrollTop||0,x=old?.scrollLeft||0;
        this.root.innerHTML=campView(this.profile,this.viewClass,this.portraits,nav('용병 성장','map'),this.campBranch);
        const sc=$('camp-scroll');sc.scrollTop=y;sc.scrollLeft=x;
    }
    showTalent(id:string){const s=SKILLS[id];if(!s||s.cls!==this.viewClass)return;this.previewSkillId=id;this.previewStarted=performance.now();if(s.ultimate){this.modal(ultimateView(this.profile,this.viewClass,this.closeButton()),'ultimate');return;}const n=TALENT_MAP[id];if(!n)return;this.modal(talentView(this.profile,id,this.closeButton()),'talent');}
    spend(id: string, reopen=true) { const cls = this.viewClass; if (!train(this.profile.heroes[cls], id))
        return; sanitizeLoadout(this.profile, cls); this.save(); const y = $('camp-scroll')?.scrollTop || 0; this.renderCamp(); const sc=$('camp-scroll'); if(sc)sc.scrollTop=y; if(reopen)this.showTalent(id); this.audio.play('heal'); }
    refund(id:string){ const cls=this.viewClass,h=this.profile.heroes[cls],reason=untrainReason(h,id); if(reason){this.toast(reason);return;} const y=$('camp-scroll')?.scrollTop||0; if(!untrain(h,id))return; sanitizeLoadout(this.profile,cls); this.save(); this.renderCamp(); const sc=$('camp-scroll'); if(sc)sc.scrollTop=y; this.audio.play('click'); }
    chooseSlot(slot:number){
        if(slot===0){this.showTalent(baseSkill(this.viewClass));return;}
        if(slot<1||slot>3)return;this.slot=slot;this.modal(slotLibrary(this.profile,this.viewClass,slot,this.closeButton()),'equip');
    }
    equipPrompt(id:string){
        const skill=SKILLS[id],h=this.profile.heroes[this.viewClass];
        if(!skill||skill.passive||skill.cls!==this.viewClass||(skill.ultimate&&!ultimateUnlocked(h,this.viewClass)))return;
        this.modal(`${this.closeButton()}<div class="equip-v5"><div class="micro-label">${SKILLS[id].name}</div><h2>교체할 슬롯</h2><div class="swap-cards">${[1,2,3].map(i=>slotCard(this.profile,this.viewClass,i,'equip-direct',id)).join('')}</div></div>`,'equip');
    }
    equip(id: string, slot = this.slot) { const cls = this.viewClass, l = this.profile.loadouts[cls],skill=SKILLS[id],known=Progress.knownSkills(this.profile.heroes[cls],cls).includes(id); if (slot<1||slot>3||!skill||skill.passive||skill.cls!==cls||!known || id === baseSkill(cls))
        return; const existing = l.indexOf(id), old = l[slot]; if (existing > 0) {
        if (old)
            l[existing] = old;
        else
            l.splice(existing, 1);
    } l[slot] = id; this.profile.loadouts[cls] = l.filter(Boolean); this.save(); this.closeModal(); this.renderCamp(); }
    launch(id = this.stageId, mode: Battle['mode'] = 'campaign', opts: Parameters<typeof createBattle>[3] = {}) { if (mode === 'campaign' && !isOpen(this.profile, id)) {
        this.toast('아직 열리지 않은 전장입니다.');
        return;
    } this.disposeAtlas();this.selectedHub=null;this.sync(); for (const c of CLASS_IDS)
        sanitizeLoadout(this.profile, c); this.clearOverlay(); this.profile.saved = null; this.stageId = id; this.profile.lastStage = mode === 'campaign' ? id : this.profile.lastStage; if (mode === 'campaign')
        this.profile.mapNode = id; this.mountBattle(createBattle(id, this.profile, mode, opts), true); if (!this.profile.tutorial) {
        this.profile.tutorial = true;
        this.showHelp(true);
    } this.save(); }
    continueBattle() { this.disposeAtlas();this.selectedHub=null;const b = this.profile.saved; if (!b) {
        this.showMap();
        return;
    } this.stageId = b.stageId; this.mountBattle(copy(b), false); if (!this.profile.tutorial) {
        this.profile.tutorial = true;
        this.showHelp(true);
        this.save();
    } }
    mountBattle(b: Battle, fresh: boolean) {
        b = upgradeBattle(b, this.profile);
        this.clearOverlay();
        this.screen = 'battle';
        this.backCanvas.style.display = 'none';
        this.resultBattle = null;
        this.signature = '';
        this.hudPhase = '';
        this.selectedByUnit = {};
        this.lastPlayerId = b.units.find(u => u.side === 0 && !u.summoned && !u.dead)?.id || 'p0';
        this.selected = b.units.find(u => u.id === b.active)?.loadout[0] || 'M01';
        this.power = .5;
        this.accumulator = 0;
        this.engine = new Engine(b, e => this.onEvent(e), fresh);
        this.root.innerHTML = `<main class="battle-screen" data-vertical="${!!b.vertical}"><canvas id="battle-canvas" class="battle-canvas" aria-label="전장. 왼쪽 조이스틱으로 이동과 조준, 오른쪽 버튼으로 점프와 발사. 두 손가락으로 확대·축소." tabindex="0"></canvas><div class="battle-top"><button class="icon-btn" data-action="pause" aria-label="일시정지">${icon('pause', '', 19)}</button><span class="stage-heading">${b.mode === 'practice' ? '훈련장' : b.mode === 'skirmish' ? '자유 전투' : n2(b.stageId) + ' ' + esc(STAGES[b.stageId - 1].name)}</span><span class="spacer"></span><span class="wind-pill" id="wind-readout"></span><span class="turn-pill" id="turn-readout"></span><button class="speed-indicator" id="player-speed" data-action="player-speed" aria-label="아군 공격 배속"></button></div><div class="mini-wrap"><canvas class="minimap" id="minimap" aria-label="전장 미니맵"></canvas><div class="mini-meta" id="mini-caption"></div></div><button class="icon-btn camera-return" data-action="camera" aria-label="내 용병으로 카메라 이동" title="내 용병으로">${icon('target', '', 19)}</button><div class="turn-banner" id="turn-banner"></div><div class="battle-bottom"><div class="hero-hud"><div class="hero-switches" id="hero-switches"></div><div class="hpmp"><span>HP</span><div class="meter"><i id="hp-fill"></i><label id="hp-label"></label></div></div><div class="hpmp"><span>MP</span><div class="meter mp"><i id="mp-fill"></i><label id="mp-label"></label></div></div><div class="hud-xp"><i id="hud-xp-fill"></i></div><div class="move-readout" id="move-readout"></div></div><div class="action-deck"><div class="skill-strip" id="skill-strip"></div><div class="joystick" id="swipe-pad" role="application" aria-label="왼손 조이스틱. 좌우 이동, 위아래 조준" tabindex="0"><span class="stick-label">MOVE / AIM</span><div class="joystick-ring"><i id="stick-knob"></i><span class="axis-h"></span><span class="axis-v"></span></div><span class="stick-value" id="move-budget"></span></div></div><div class="shot-controls"><div class="minor-controls"><button class="icon-btn" data-action="items" aria-label="물약" title="물약">${icon('potion', '', 19)}</button><button class="icon-btn" data-action="wait" aria-label="방어하며 턴 종료" title="방어하며 턴 종료">${icon('shield', '', 19)}</button></div><div class="fire-block"><div class="shot-readout" id="shot-readout"></div><button id="jump" class="fire-button jump-button" aria-label="점프"><span class="fire-inner">${icon('chevron', 'jump-icon', 24)}<span>점프</span></span></button><button id="fire" class="fire-button" aria-label="누르고 놓아 발사"><span class="fire-inner">${icon('target', '', 22)}<span id="fire-label">발사</span></span></button></div></div></div></main>`;
        this.renderer = new Renderer($<HTMLCanvasElement>('battle-canvas'));
        this.audio.wake().then(() => this.audio.configure(this.profile.settings));
        this.audio.setTheme(STAGES[b.stageId - 1].region);
        this.updateHUD(true);
        if (b.phase === 'won' || b.phase === 'lost')
            this.showResult();
    }
    shownHero() { const e = this.engine; if (!e)
        return undefined; return e.active?.side === 0 && !e.active.summoned ? e.active : e.unit(this.lastPlayerId) || e.heroesAlive()[0] || e.b.units.find(u => u.side === 0 && !u.summoned); }
    pickSkill(id: string) { const e = this.engine, u = e?.active; if (!e?.canAct() || !u || !u.loadout.includes(id))
        return; if(SKILLS[id]?.passive){this.showSkillInfo(id);return;} this.cancelCharge(); this.selected = id; this.selectedByUnit[u.id] = id; this.power = u.lastPower || .5; this.updateHUD(true); }
    pickHero(id: string) { const e = this.engine; if (!e)
        return; if (e.select(id)) {
        e.cancelMovement();
        this.cancelCharge(); this.releaseStick();
        this.lastPlayerId = id;
        this.selected = this.selectedByUnit[id] || e.active!.loadout[0];
        this.power = e.active!.lastPower || .5;
        this.renderer?.follow();
        this.updateHUD(true);
    }
    else if (e.unit(id)) {
        this.renderer?.lookAt(e.unit(id)!.x, e.unit(id)!.y - 140);
    } }
    updateHUD(force = false) {
        const e = this.engine;
        if (!e || this.screen !== 'battle')
            return;
        const b = e.b, u = this.shownHero();
        if (!u)
            return;
        if (e.active?.side === 0) {
            this.lastPlayerId = e.active.id;
            if (!e.active.loadout.includes(this.selected) || SKILLS[this.selected]?.passive || this.hudPhase.split(':')[0] !== e.active.id) {
                this.selected = (e.active.loadout.includes(this.selectedByUnit[e.active.id])&&!SKILLS[this.selectedByUnit[e.active.id]]?.passive?this.selectedByUnit[e.active.id]:e.active.loadout.find(id=>!SKILLS[id]?.passive)) || baseSkill(e.active.cls);
                this.power = e.active.lastPower || .5;
            }
        }
        const phase = `${b.active}:${b.side}:${b.round}:${b.phase}`;
        if (phase !== this.hudPhase) {
            if (b.side === 1 && this.hudPhase.split(':')[1] === '0')
                this.banner('적의 차례');
            if (b.side === 0 && this.hudPhase.split(':')[1] === '1') {
                this.banner(`ROUND ${b.round}`);
                this.renderer?.follow();
            }
            this.hudPhase = phase;
        }
        const sig = [u.id, u.loadout.join(), this.selected, JSON.stringify(u.cooldowns||{}), ...b.units.filter(a => a.side === 0 && !a.summoned).map(a => [a.id, a.dead, a.acted, a.level].join()), Math.floor(u.focus)].join('|');
        if (force || sig !== this.signature) {
            this.signature = sig;
            $('hero-switches').innerHTML = b.units.filter(a => a.side === 0 && !a.summoned).map(a => `<button class="ally-chip ${a.id === u.id ? 'active' : ''} ${a.acted || a.dead ? 'acted' : ''}" data-action="select-hero" data-unit="${a.id}" aria-label="${esc(a.name)}${a.dead ? ' · 전투불능' : ''}"><img src="${this.portraits[a.cls]}" alt=""><span>${esc(a.name)}<small> Lv.${a.level}</small></span></button>`).join('');
            $('skill-strip').innerHTML = [0, 1, 2, 3].map(i => { const s = SKILLS[u.loadout[i]], cost = s ? e.manaCost(s, u) : 0, cd=s?e.cooldownLeft(u,s.id):0, skillColor=s?.ultimate?s.color:BRANCHES[u.cls][TALENT_MAP[s?.id||'']?.branch||0].color; return s ? `<button class="skill-button ${s.ultimate?'ultimate-skill':''} ${this.selected === s.id ? 'selected' : ''} ${u.focus < cost ? 'unaffordable' : ''} ${cd?'cooling':''}" style="--skill:${skillColor}" data-action="skill" data-skill="${s.id}" aria-label="${s.name}, MP ${cost}${cd?`, 재사용 ${cd}라운드`:''}. 길게 누르면 설명" title="${s.name}: ${s.desc}"><span class="key">${i + 1}</span><span class="mana-cost">${cd?cd+'R':cost||''}</span>${icon(s.icon, '', 30)}<span class="skill-name">${s.name}</span><span class="rank-tiny">${s.ultimate?'ULT':u.ranks[s.id] ? 'Lv.' + u.ranks[s.id] : ''}</span></button>` : `<button class="skill-button empty" disabled aria-label="빈 기술 슬롯"><span>—</span></button>`; }).join('');
        }
        $('hp-fill').style.width = clamp(u.hp / u.maxHp * 100, 0, 100) + '%';
        $('hp-label').textContent = `${Math.ceil(u.hp)} / ${u.maxHp}`;
        $('mp-fill').style.width = clamp(u.focus / u.maxFocus * 100, 0, 100) + '%';
        $('mp-label').textContent = `${Math.floor(u.focus)} / ${u.maxFocus}`;
        $('hud-xp-fill').style.width = xpFraction(b.heroes[u.cls]) * 100 + '%';
        $('move-readout').textContent = `이동 ${Math.round(u.moveLeft)} / ${u.maxMove}${u.shield ? ' · 방호 ' + Math.ceil(u.shield) : ''}`;
        $('wind-readout').textContent = `${b.wind < 0 ? '←' : '→'} ${Math.abs(b.wind).toFixed(0)}`;
        $('turn-readout').textContent = b.phase==='summon' ? '소환귀 차례' : b.phase==='review' ? '피해 확인' : b.side === 0 ? `${b.round} · 아군` : `${b.round} · 적`;
        $('player-speed').textContent = `×${this.profile.settings.playerSpeed}`;
        $('move-budget').textContent = `${Math.round(u.moveLeft)} / ${u.maxMove} · ${Math.round(this.displayAim(u))}°`;
        $('swipe-pad').classList.toggle('inactive',!e.canAct()||this.paused);
        const jump = $<HTMLButtonElement>('jump');
        jump.disabled = !e.canAct() || this.paused || !e.grounded(u) || u.moveLeft < e.jumpCost(u);
        const fire = $<HTMLButtonElement>('fire'),selectedSkill=SKILLS[this.selected] || SKILLS[u.loadout[0]];
        const cd=selectedSkill?e.cooldownLeft(u,selectedSkill.id):0;
        fire.disabled = !e.canAct() || !e.grounded(u) || this.paused || !selectedSkill || u.focus < e.manaCost(selectedSkill,u) || cd>0;
        fire.classList.toggle('charging', this.charging);
        fire.style.setProperty('--power', `${this.power * 100}%`);
        $('shot-readout').textContent = cd?`재사용 ${cd}R`:`${Math.round(this.displayAim(u))}° · ${Math.round(this.power * 100)}%`;
        $('fire-label').textContent = this.charging ? '놓아 발사' : cd?`${cd}R`:'발사';
        const active = e.combatEnemies().length, total = e.alive(1).length;
        $('mini-caption').textContent = b.mode === 'practice' ? '훈련 · 경험치 없음' : `교전 ${active} · 남은 적 ${total}`;
        this.drawMinimap();
    }
    drawMinimap() { const e = this.engine, canvas = $<HTMLCanvasElement>('minimap'); if (!e || !canvas)
        return; const w = canvas.clientWidth || 220, h = canvas.clientHeight || 56; if (canvas.width !== w * 2 || canvas.height !== h * 2) {
        canvas.width = w * 2;
        canvas.height = h * 2;
    } const c = canvas.getContext('2d')!; c.setTransform(2, 0, 0, 2, 0, 0); c.clearRect(0, 0, w, h); c.fillStyle = '#091b25c9'; c.fillRect(0, 0, w, h); const sx = w / e.b.width, sy = h / e.b.height; c.fillStyle = '#6e898a'; for (const t of e.b.terrain) {
        if (t.broken || t.mat === 'barrel' || t.mat === 'support')
            continue;
        c.beginPath();
        c.moveTo(t.x * sx, t.y * sy);
        c.lineTo((t.x + t.w) * sx, (t.y + (t.slope || 0)) * sy);
        c.lineTo((t.x + t.w) * sx, Math.min(h, (t.y + t.h) * sy));
        c.lineTo(t.x * sx, Math.min(h, (t.y + t.h) * sy));
        c.fill();
    } for (const u of e.b.units) {
        if (u.dead)
            continue;
        c.fillStyle = u.side === 0 ? '#edd4a3' : u.side === 2 ? '#99dec7' : u.boss ? '#ffb56a' : u.elite ? '#edbe75' : u.awake ? '#f18c7e' : '#a07171';
        c.beginPath();
        if(u.elite){const x=u.x*sx,y=(u.y-u.h)*sy;c.moveTo(x,y-3);c.lineTo(x+2.7,y);c.lineTo(x,y+3);c.lineTo(x-2.7,y);c.closePath();}else c.arc(u.x * sx, (u.y - u.h) * sy, u.side === 0 || u.boss ? 2.8 : 1.8, 0, Math.PI * 2);
        c.fill();
    } if (this.renderer) {
        c.strokeStyle = '#edd5a599';
        c.lineWidth = 1;
        const rr=this.renderer;const vw=rr.width/rr.scale,vh=rr.height/rr.scale; c.strokeRect((rr.cameraX-vw*.5)*sx,Math.max(1,(rr.cameraY-vh*.5)*sy),vw*sx,Math.min(h-2,vh*sy));
    } }
    banner(t: string) { const el = $('turn-banner'); if (!el)
        return; el.textContent = t; el.classList.add('show'); clearTimeout(this.bannerTimer); this.bannerTimer = window.setTimeout(() => el.classList.remove('show'), 1250); }
    beginCharge() { const e = this.engine; if (this.charging || this.paused || !e?.canAct() || !e.grounded(e.active!))
        return false; const s = SKILLS[this.selected]; if (!s || s.passive || e.active!.focus < e.manaCost(s, e.active!)) {
        this.toast('MP가 부족합니다.');
        return false;
    } e.cancelMovement(); this.charging = true; this.chargeStarted = performance.now(); this.power = .08; this.audio.wake().then(() => this.audio.play('charge')); this.updateHUD(); return true; }
    releaseCharge() { if (!this.charging)
        return; this.power = Math.min(1, .08 + (performance.now() - this.chargeStarted) / 1000 * .48); this.charging = false; const e = this.engine; this.firePointer = null; if (!e || this.paused)
        return; this.renderer?.follow(); const u = e.active; if (u && e.fire(this.selected, u.angle, this.power)) {
        this.selectedByUnit[u.id] = this.selected;
        this.save();
    } this.updateHUD(true); }
    cancelCharge() { this.charging = false; this.firePointer = null; $('fire')?.classList.remove('charging'); }
    onEvent(event: Event) { this.renderer?.event(event); if (event.type === 'xp' && event.cls && event.value) {
        this.xpPending[event.cls] = (this.xpPending[event.cls] || 0) + event.value;
        if (!this.xpTimer) {
            const battle = this.engine?.b;
            this.xpTimer = window.setTimeout(() => { this.xpTimer = 0; const gain = this.xpPending; this.xpPending = {}; if (this.engine?.b !== battle || this.screen !== 'battle')
                return; for (const [cls, n] of Object.entries(gain)) {
                const u = battle?.units.find(u => u.side === 0 && u.cls === cls);
                if (u)
                    this.renderer?.event({ type: 'fx', name: 'text', x: u.x, y: u.y - u.h - 45, color: '#b9d7ae', size: 15, text: '+' + n + ' XP' });
            } }, 220);
        }
    } if(event.type==='change'&&['review','summon'].includes(this.engine?.b.phase||''))this.renderer?.follow(); if (event.type === 'sound' && event.name)
        this.audio.play(event.name); if (event.type === 'message' && event.text && /^(야영지 확보|이미 )/.test(event.text))
        this.toast(event.text); if (event.type === 'level' && event.cls) {
        this.sync();
        this.toast(`${CLASSES[event.cls].person} Lv.${event.value} · 성장 가능`);
    } if (event.type === 'save')
        this.save(); if (event.type === 'result')
        this.showResult(); }
    showResult() {
        const e = this.engine;
        if (!e || this.resultBattle === e.b)
            return;
        const b = e.b;
        this.resultBattle = b;
        this.sync();
        this.profile.saved = null;
        const won = b.phase === 'won';
        if (won && b.mode === 'campaign') {
            const k = String(b.stageId), old = this.profile.cleared[k];
            const stars = 1 + Number(b.units.filter(u => u.side === 0 && !u.summoned).every(u => !u.dead)) + Number(b.round <= STAGES[b.stageId - 1].par);
            this.profile.cleared[k] = { stars: Math.max(stars, old?.stars || 0), rounds: Math.min(b.round, old?.rounds || 9999), shots: Math.min(b.shots, old?.shots || 9999), visits: (old?.visits || 0) + 1 };
            this.profile.mapNode = b.stageId;
            this.profile.lastStage = b.stageId;
        }
        this.save();
        const final = won && b.stageId === 36 && b.mode === 'campaign';
        this.modal(`<div class="eyebrow">${final ? 'THE EXPEDITION CONTINUES' : won ? 'VICTORY' : 'REGROUP'}</div><h2 class="result-title">${final ? '원정의 끝, 새로운 길' : won ? '전장 확보' : '다시 일어설 시간'}</h2>${final ? '<p>관측성의 불빛이 꺼졌습니다.<br>남겨 둔 갈림길과 전장은 계속 탐험할 수 있습니다.</p>' : ''}<div class="result-stat"><span>${b.round}라운드</span><span>${b.kills}명 제압</span><span>${b.shots}발 발사</span></div>${b.units.filter(u => u.side === 0 && !u.summoned).map(u => { const h = b.heroes[u.cls], delta = h.xp - b.startXP[u.cls]; return `<div class="xp-result"><img src="${this.portraits[u.cls]}" alt=""><div><strong>${esc(u.name)} · Lv.${levelOf(h)}</strong><div class="muted">${pointsLeft(h, u.cls) ? '미사용 ' + pointsLeft(h, u.cls) + ' SP' : ''}</div></div><span class="spacer"></span><span>+${delta.toLocaleString()} XP</span></div>`; }).join('')}${!won ? '<p>획득한 경험치는 유지됩니다.</p>' : ''}<div class="dialog-actions"><button class="btn" data-action="retry">재도전</button><button class="btn primary" data-action="result-map">원정 지도 ${icon('chevron', '', 15)}</button></div>`, 'result');
        this.audio.wake().then(() => { this.audio.configure(this.profile.settings); this.audio.play(won ? 'win' : 'lose'); });
    }
    showPause() { if (!this.engine || this.modalType === 'result')
        return; this.modal(`${this.closeButton()}<h2>잠시 정비</h2><div class="dialog-actions"><button class="btn primary" data-action="close">계속하기</button><button class="btn" data-action="items" ${this.engine.canAct() ? '' : 'disabled'}>물약</button><button class="btn" data-action="wait" ${this.engine.canAct() ? '' : 'disabled'}>방어 / 턴 종료</button></div>${this.engine.b.mode === 'practice' ? '<div class="dialog-actions"><button class="btn" data-action="practice-options">훈련 설정</button><button class="btn" data-action="practice-skills">모든 기술</button></div>' : ''}<div class="dialog-actions"><button class="btn ghost" data-action="settings">설정</button><button class="btn ghost" data-action="help">조작 안내</button><button class="btn ghost" data-action="leave">지도에 복귀</button></div>`, 'pause'); }
    showItems() { const e = this.engine; if (!e?.canAct()) {
        this.toast('아군이 행동할 차례에 사용할 수 있습니다.');
        return;
    } this.modal(`${this.closeButton()}<h2>보급품</h2><div class="skill-library">${Object.entries(ITEM_INFO).map(([id, v]) => `<button data-action="use-item" data-item="${id}" ${e.b.items[id] > 0 ? '' : 'disabled'}>${icon(v.icon, '', 24)}<span>${v.name}<small class="muted"> ×${e.b.items[id] || 0}<br>${v.desc}</small></span></button>`).join('')}</div><p>사용하면 해당 용병의 행동이 종료됩니다.</p>`, 'items'); }
    showSettings() { const s = this.profile.settings; this.modal(`${this.closeButton()}<h2>설정</h2><div class="setting-row"><span>앱 화면</span><button class="btn small" data-action="fullscreen">전체화면</button></div><div class="setting-row"><label for="s-orientation">화면 방향</label><select id="s-orientation" data-setting="orientation"><option value="landscape" ${s.orientation === 'landscape' ? 'selected' : ''}>가로 고정</option><option value="portrait" ${s.orientation === 'portrait' ? 'selected' : ''}>세로 고정</option><option value="auto" ${s.orientation === 'auto' ? 'selected' : ''}>자동</option></select></div><div class="orientation-readout">브라우저가 방향 잠금을 지원하지 않으면 기기 회전 안내가 표시됩니다.</div><div class="setting-row"><label for="s-sound">효과음</label><span class="row"><button class="btn small ghost" data-action="test-sound">테스트</button><input id="s-sound" type="checkbox" data-setting="sound" ${s.sound ? 'checked' : ''}></span></div><div class="setting-row"><label for="s-volume">음량</label><input id="s-volume" type="range" min="0" max="1" step=".05" value="${s.volume}" data-setting="volume"></div><div class="setting-row"><label for="s-assist">궤적 가이드</label><input id="s-assist" type="checkbox" data-setting="assist" ${s.assist ? 'checked' : ''}></div><div class="setting-row"><label for="s-player">아군 공격 속도</label><select id="s-player" data-setting="playerSpeed">${[1, 1.5, 2, 3, 4].map(n => `<option ${s.playerSpeed === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div><div class="setting-row"><label for="s-enemy">적 행동 속도</label><select id="s-enemy" data-setting="speed">${[1, 1.5, 2, 3, 4].map(n => `<option ${s.speed === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div><div class="setting-row"><label for="s-diff">난이도</label><select id="s-diff" data-setting="difficulty">${Object.entries(DIFFICULTIES).map(([k,v])=>[k,v.name]).map(([v, n]) => `<option value="${v}" ${s.difficulty === v ? 'selected' : ''}>${n}</option>`).join('')}</select></div><div class="difficulty-readout" id="difficulty-readout">적 HP ×${DIFFICULTIES[s.difficulty].hp.toFixed(2)} · 공격 ×${DIFFICULTIES[s.difficulty].damage.toFixed(2)} · 최대 ${DIFFICULTIES[s.difficulty].active}명 행동</div><div class="setting-row"><label for="s-quality">화질</label><select id="s-quality" data-setting="quality"><option value="high" ${s.quality === 'high' ? 'selected' : ''}>기본</option><option value="low" ${s.quality === 'low' ? 'selected' : ''}>절전</option></select></div><div class="setting-row"><label for="s-shake">화면 흔들림</label><input id="s-shake" type="checkbox" data-setting="shake" ${s.shake ? 'checked' : ''}></div><div class="dialog-actions"><button class="btn small" data-action="export">세이브 내보내기</button><button class="btn small" data-action="import">가져오기</button></div><p>다른 기기 또는 이전 버전의 세이브 파일을 가져올 수 있습니다.</p><button class="text-link danger" data-action="reset-profile">모든 진행 초기화</button>`, 'settings'); }
    showHelp(first = false) { this.modal(`${this.closeButton()}<h2>${first ? '새로운 조작' : '조작 안내'}</h2><div class="help-lines"><p><strong>왼쪽 조이스틱: 좌우 이동 · 위아래 조준</strong>두 동작을 전환 없이 동시에 사용할 수 있습니다.</p><p><strong>오른쪽: 점프 · 발사</strong>발사 버튼은 누르고 있다가 놓아 힘을 결정합니다.</p><p><strong>전장: 두 손가락으로 확대·축소</strong>배경 드래그로 둘러보기 · PC는 마우스 휠</p><p><strong>PC: ←/→ 이동 · ↑/↓ 조준 · Ctrl 점프 · Space 충전/발사</strong>1~4 기술 · Tab 동료</p><p>기술을 길게 누르면 설명을 볼 수 있습니다.</p></div><div class="dialog-actions"><button class="btn primary" data-action="close">시작</button></div>`, 'help'); }
    showTuning() { const cls = this.viewClass, labels = cls === 'mage' ? ['확산', '집속'] : cls === 'archer' ? ['경량', '중량'] : ['수호', '강습']; this.modal(`${this.closeButton()}<h2>${cls === 'mage' ? '마력 집속도' : cls === 'archer' ? '화살 중량' : '착지 태세'}</h2><div class="setting-row"><span>${labels[0]}</span><input type="range" min="0" max="1" step=".01" value="${this.profile.tuning[cls]}" data-tuning="${cls}"><span>${labels[1]}</span></div><p>${cls === 'mage' ? '폭발 반경과 중심 피해의 비중을 조절합니다.' : cls === 'archer' ? '중량은 기본 직격을 강화하지만 느려집니다. 실제 명중 속도가 빠를수록 추가 피해가 커집니다.' : '착지 방호와 직접 피해 사이의 비중을 조절합니다.'}<br>다음 전투부터 적용됩니다.</p>`, 'tuning'); }
    showFreeplay() { this.modal(`${this.closeButton()}<h2>자유 전투</h2><div class="setting-row"><label for="free-stage">전장</label><select id="free-stage">${STAGES.map(s => `<option value="${s.id}" ${s.id === this.stageId ? 'selected' : ''}>${n2(s.id)} ${s.name}</option>`).join('')}</select></div><p>세 용병과 현재 기술로 싸웁니다. 경험치와 원정 진행은 변하지 않습니다.</p><div class="dialog-actions"><button class="btn primary" data-action="launch-free">전투 시작</button></div>`, 'freeplay'); }
    showPracticeOptions() { const b = this.engine?.b; this.modal(`${this.closeButton()}<h2>훈련장</h2><div class="setting-row"><label for="pr-class">용병</label><select id="pr-class">${CLASS_IDS.map(c => `<option value="${c}" ${this.shownHero()?.cls === c ? 'selected' : ''}>${clsName(c)}</option>`).join('')}</select></div><div class="setting-row"><label for="pr-dist">표적 거리</label><select id="pr-dist">${[400, 700, 1000, 1400, 1800].map(n => `<option value="${n}" ${b?.practiceDistance === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div><div class="setting-row"><label for="pr-wind">바람</label><select id="pr-wind">${[-40, -20, 0, 20, 40].map(n => `<option value="${n}" ${(b?.wind || 0) === n ? 'selected' : ''}>${n < 0 ? '←' : n > 0 ? '→' : ''} ${Math.abs(n)}</option>`).join('')}</select></div><div class="dialog-actions"><button class="btn primary" data-action="practice-apply">훈련 시작</button></div>`, 'practice'); }
    showPracticeSkills(){const u=this.shownHero();if(!u)return;const ult=ULTIMATES[u.cls];
        this.modal(`${this.closeButton()}<div class="equip-v5"><h2>${clsName(u.cls)} · 모든 기술</h2><div class="equip-library">${BRANCHES[u.cls].map((br,b)=>`<section style="--branch:${br.color}"><h3>${br.name} ${b===3?'· 자동 적용':''}</h3>${TALENTS.filter(n=>n.cls===u.cls&&n.branch===b).map(n=>`<button class="equip-option" data-action="practice-skill" data-skill="${n.id}">${skillStamp(n.id,22)}<span><strong>${n.name}</strong><small>${n.row+1}단계 · Lv.8 시험</small></span><em>${n.passive?(u.ranks[n.id]?'켜짐':'꺼짐'):'선택'}</em></button>`).join('')}</section>`).join('')}<section class="equip-ultimate" style="--branch:${SKILLS[ult].color}"><h3>궁극기 · 훈련장 자유 시험</h3><button class="equip-option ultimate-option" data-action="practice-skill" data-skill="${ult}">${skillStamp(ult,26)}<span><strong>${SKILLS[ult].name}</strong><small>2R 재사용 · 고MP</small></span><em>선택</em></button></section></div></div>`,'practice-skills',true);
    }
    showSkillInfo(id: string) { const s = SKILLS[id], u = this.shownHero(); if (!s)
        return; this.previewSkillId=id;this.previewStarted=performance.now(); this.modal(`${this.closeButton()}<div class="talent-detail"><div class="skill-art" style="color:${s.color}">${icon(s.icon, '', 36)}</div><h2>${s.name}</h2>${!s.passive?`<section class="skill-preview-shell compact"><canvas id="skill-preview" data-skill="${id}" width="720" height="360"></canvas></section>`:''}<p>${s.desc}</p><div class="rank-info">${s.passive ? '습득 시 자동 적용' : u && this.engine ? 'MP ' + this.engine.manaCost(s, u) + (s.cooldown?` · 재사용 ${s.cooldown}R`:'') : ''}</div></div>`, 'skill-info'); }
    private disposeSkillPreview(){
        this.previewEngine=null;
        this.previewRenderer=null;
        this.previewCanvas=null;
        this.previewLast=0;
        this.previewAccumulator=0;
        this.previewFired=false;
        this.previewResetAt=0;
    }
    private setupSkillPreview(canvas:HTMLCanvasElement,id:string,now:number){
        const s=SKILLS[id];if(!s||s.passive)return;
        this.disposeSkillPreview();
        this.previewSkillId=id;
        this.previewCanvas=canvas;
        canvas.dataset.renderer='ingame';
        // Clone the player's actual build. An unlearned skill is previewed at Lv.1,
        // while learned passives/tuning still affect it exactly as they do in combat.
        const profile=copy(this.profile);
        profile.settings={...profile.settings,assist:false,shake:false,quality:'high'};
        profile.heroes[s.cls].ranks[id]=Math.max(1,profile.heroes[s.cls].ranks[id]||1);
        profile.loadouts[s.cls]=[id];
        const stage=clamp(this.stageId||this.profile.lastStage||1,1,36);
        const b=createBattle(stage,profile,'practice',{party:[s.cls],distance:s.cls==='knight'?620:s.cls==='archer'?1180:960});
        b.wind=STAGES[stage-1]?.region===1?11:7;
        const hero=b.units.find(u=>u.side===0&&!u.summoned)!;
        const baseDummy=b.units.find(u=>u.role==='dummy')!;
        hero.x=330;hero.spawnX=330;hero.y=hero.spawnY=970;hero.loadout=[id];hero.focus=hero.maxFocus=9999;
        hero.ranks={...profile.heroes[s.cls].ranks,[id]:Math.max(1,profile.heroes[s.cls].ranks[id]||1)};
        // Use real in-game dummy units so AoE, pull/push, chain, pierce, body collision,
        // stun and sub-projectiles all resolve through the production collision code.
        const center=s.cls==='knight'?820:s.cls==='archer'?1370:1160;
        const spread=s.cls==='knight'?92:118;
        const positions=[center-spread,center,center+spread];
        const dummies:Unit[]=[];
        for(let i=0;i<3;i++){
            const d=i===0?baseDummy:copy(baseDummy);
            const enemyClasses:ClassId[]=['archer','knight','mage','occultist'];
            const enemyRoles=['bow','guard','fire'];
            d.id='preview-enemy-'+i;d.cls=enemyClasses[i];d.role=enemyRoles[i];d.name=i===1?'정예 경비병':i===0?'적 궁수':'적 마도병';
            d.x=d.spawnX=positions[i];d.y=d.spawnY=970;d.facing=-1;d.angle=138;
            d.hp=d.maxHp=12000;d.shield=0;d.armor=i===1?.08:0;d.dead=false;d.awake=true;d.fixed=false;d.elite=i===1;d.r=i===1?25:21;d.h=i===1?82:72;d.damageBy={};d.group=0;
            dummies.push(d);
        }
        b.units=b.units.filter(u=>u.side===0&&!u.summoned).concat(dummies);
        b.active=hero.id;b.side=0;b.phase='aim';b.projectiles=[];b.zones=[];b.volley=undefined;b.reviewDamage={};b.lastShots={};
        // Add a genuine game-terrain ledge behind the targets. It is rendered by the
        // same terrain renderer and lets bounce/impact/terrain skills read naturally.
        b.terrain.push({id:'preview-ledge',x:center+215,y:835,w:210,h:135,mat:'stone',hp:950,maxHp:950});
        const engine=new Engine(b,e=>this.previewRenderer?.event(e),true);
        const target=dummies[1];
        const aim=engine.bestShot(hero,s,target);
        hero.angle=aim.angle;hero.facing=Math.cos(aim.angle*Math.PI/180)>=0?1:-1;hero.lastPower=aim.power;
        this.previewAim={angle:aim.angle,power:aim.power};
        const renderer=new Renderer(canvas);renderer.manual=true;renderer.zoom=.65;renderer.cameraX=(hero.x+positions[2])*.5;renderer.cameraY=790;
        this.previewEngine=engine;this.previewRenderer=renderer;this.previewLast=now;this.previewStarted=now;this.previewAccumulator=0;this.previewFired=false;this.previewResetAt=0;
    }
    private renderSkillPreview(now:number){
        const canvas=document.getElementById('skill-preview') as HTMLCanvasElement|null;if(!canvas)return;
        const id=canvas.dataset.skill||this.previewSkillId,s=SKILLS[id];if(!s||s.passive)return;
        if(!this.previewEngine||!this.previewRenderer||this.previewCanvas!==canvas||this.previewSkillId!==id)this.setupSkillPreview(canvas,id,now);
        const engine=this.previewEngine,renderer=this.previewRenderer;if(!engine||!renderer)return;
        let dt=Math.min(.05,Math.max(0,(now-(this.previewLast||now))/1000));this.previewLast=now;
        const elapsed=(now-this.previewStarted)/1000;
        // A short real charge pose precedes every shot. Renderer.render receives the
        // same charging flag and power value as the actual battle screen.
        const chargeDuration=.72;
        if(!this.previewFired&&elapsed>=chargeDuration){
            const u=engine.active;if(u){u.angle=this.previewAim.angle;u.lastPower=this.previewAim.power;u.focus=u.maxFocus;u.loadout=[id];engine.fire(id,this.previewAim.angle,this.previewAim.power);}
            this.previewFired=true;
        }
        if(this.previewFired){
            this.previewAccumulator+=dt*1.10;let steps=0;
            while(this.previewAccumulator>=STEP&&steps<16){engine.tick(STEP);this.previewAccumulator-=STEP;steps++;}
            if(engine.b.phase==='aim'&&engine.b.shot>0&&!this.previewResetAt)this.previewResetAt=now+850;
            if(this.previewResetAt&&now>=this.previewResetAt){this.setupSkillPreview(canvas,id,now);return;}
        }
        const chargePower=this.previewFired?this.previewAim.power:clamp(.20+elapsed/chargeDuration*.58,.20,.78);
        renderer.render(engine,dt,id,chargePower,!this.previewFired,this.profile.settings,false);
    }
    bind() {
        document.addEventListener('click', ev => {
            const el = (ev.target as Element).closest<HTMLElement>('[data-action]');
            if (!el || el.hasAttribute('disabled'))
                return;
            const a = el.dataset.action!;
            if (a === 'skill' && performance.now() < this.blockClick)
                return;
            this.audio.wake().then(() => this.audio.configure(this.profile.settings));
            const id = el.dataset.skill || el.dataset.id || '', cls = el.dataset.class as ClassId;
            if (this.screen === 'title' && ['map', 'continue', 'practice', 'launch', 'freeplay'].includes(a))
                void this.applyOrientation(false);
            switch (a) {
                case 'fullscreen':
                    void this.requestFullscreen(true).then(() => this.applyOrientation(true));
                    break;
                case 'mode':
                    this.setControl(el.dataset.mode as 'move' | 'aim');
                    break;
                case 'title':
                    this.showTitle();
                    break;
                case 'map':
                    if (this.screen === 'battle' && !['won', 'lost'].includes(this.engine!.b.phase))
                        this.requestLeave();
                    else
                        this.requestMap();
                    break;
                case 'camp':
                    this.showCamp();
                    break;
                case 'camp-hero':
                    this.showCamp(cls);
                    break;
                case 'hero':
                    this.viewClass = cls;
                    this.renderCamp();
                    break;
                case 'atlas-fit':this.atlas?.fit();break;
                case 'atlas-focus':this.focusMapNode(this.profile.mapNode);break;
                case 'atlas-zoom-in':if(this.atlas)this.atlas.zoomAt(this.atlas.zoom*1.25,this.atlas.viewport.clientWidth/2,this.atlas.viewport.clientHeight/2);break;
                case 'atlas-zoom-out':if(this.atlas)this.atlas.zoomAt(this.atlas.zoom/1.25,this.atlas.viewport.clientWidth/2,this.atlas.viewport.clientHeight/2);break;
                case 'atlas-region':{const r=ATLAS_REGIONS[Number(id)];if(r)this.atlas?.focus(r.cx,r.cy,innerWidth<600?.55:.76);break;}
                case 'atlas-hub':this.selectHub(id as HubId);break;
                case 'hub-enter':{const h=HUBS.find(v=>v.id===id);if(h?.action==='camp')this.showCamp();else if(h?.action==='practice')this.showPracticeOptions();else if(h?.action==='freeplay')this.showFreeplay();break;}
                case 'node':
                    this.selectNode(Number(el.dataset.id));
                    break;
                case 'launch':
                    this.launch();
                    break;
                case 'continue':
                    this.continueBattle();
                    break;
                case 'abandon':
                    this.abandon();
                    break;
                case 'abandon-camp':
                    this.sync();
                    this.profile.saved = null;
                    this.engine = null;
                    this.save();
                    this.showCamp();
                    break;
                case 'close':
                    this.closeModal();
                    break;
                case 'test-sound':
                    this.audio.configure(this.profile.settings); void this.audio.wake().then(()=>this.audio.play('win'));
                    break;
                case 'settings':
                    this.showSettings();
                    break;
                case 'help':
                    this.showHelp();
                    break;
                case 'practice':
                    this.showPracticeOptions();
                    break;
                case 'freeplay':
                    this.showFreeplay();
                    break;
                case 'launch-free':
                    this.launch(Number($<HTMLSelectElement>('free-stage').value), 'skirmish');
                    break;
                case 'practice-options':
                    this.showPracticeOptions();
                    break;
                case 'practice-apply': {
                    const c = $<HTMLSelectElement>('pr-class').value as ClassId, d = Number($<HTMLSelectElement>('pr-dist').value), w = Number($<HTMLSelectElement>('pr-wind').value);
                    this.launch(1, 'practice', { party: [c], wind: w, distance: d });
                    break;
                }
                case 'practice-skills':
                    this.showPracticeSkills();
                    break;
                case 'practice-skill': {
                    const u=this.engine?.active,s=SKILLS[id];
                    if(u&&s&&s.cls===u.cls){
                        if(s.passive){if(u.ranks[id])delete u.ranks[id];else u.ranks[id]=8;}
                        else{if(!u.loadout.includes(id)){if(u.loadout.length<4)u.loadout.push(id);else u.loadout[3]=id;}if(!s.ultimate)u.ranks[id]=8;}
                        Progress.applyHero(u,{...this.engine!.b.heroes[u.cls],ranks:{...u.ranks}});
                        if(s.passive){this.updateHUD(true);this.showPracticeSkills();}
                        else{this.closeModal();this.pickSkill(id);}
                    }
                    break;
                }
                case 'camp-branch': {
                    this.campBranch=Number(el.dataset.branch)||0;
                    document.querySelectorAll('[data-branch-panel]').forEach(n=>n.classList.toggle('mobile-current',Number((n as HTMLElement).dataset.branchPanel)===this.campBranch));
                    document.querySelectorAll('[data-action="camp-branch"]').forEach(n=>{const on=Number((n as HTMLElement).dataset.branch)===this.campBranch;n.classList.toggle('active',on);n.setAttribute('aria-pressed',String(on));});
                    break;
                }
                case 'talent':
                    this.showTalent(el.dataset.talent!);
                    break;
                case 'ultimate-detail':
                    this.showTalent(id);
                    break;
                case 'train':
                    this.spend(el.dataset.talent!);
                    break;
                case 'talent-plus':
                    this.spend(el.dataset.talent!,false);
                    break;
                case 'talent-minus':
                    this.refund(el.dataset.talent!);
                    break;
                case 'choose-slot':
                    this.chooseSlot(Number(el.dataset.slot));
                    break;
                case 'equip-prompt':
                    this.equipPrompt(id);
                    break;
                case 'equip-direct':
                    this.equip(id, Number(el.dataset.slot));
                    break;
                case 'equip-slot':
                    this.equip(id);
                    break;
                case 'auto-train':
                    autoTrain(this.profile.heroes[this.viewClass], this.viewClass);
                    sanitizeLoadout(this.profile, this.viewClass);
                    this.save();
                    this.renderCamp();
                    break;
                case 'reset-talents':
                    this.modal(`${this.closeButton()}<h2>스킬을 초기화할까요?</h2><p>사용한 포인트를 모두 돌려받습니다. 레벨과 경험치는 유지됩니다.</p><div class="dialog-actions"><button class="btn primary" data-action="confirm-talents-reset">무료 초기화</button></div>`, 'reset-talents');
                    break;
                case 'confirm-talents-reset':
                    resetTalents(this.profile.heroes[this.viewClass], this.viewClass);
                    sanitizeLoadout(this.profile, this.viewClass);
                    this.save();
                    this.closeModal();
                    this.renderCamp();
                    break;
                case 'tuning':
                    this.showTuning();
                    break;
                case 'pause':
                    this.showPause();
                    break;
                case 'items':
                    this.showItems();
                    break;
                case 'use-item':
                    this.closeModal();
                    this.engine?.item(el.dataset.item!);
                    this.save();
                    this.updateHUD(true);
                    break;
                case 'wait':
                    this.closeModal();
                    this.cancelCharge();
                    this.engine?.cancelMovement();
                    this.engine?.wait();
                    this.save();
                    this.updateHUD(true);
                    break;
                case 'camera': {
                    const u = this.shownHero();
                    this.renderer?.follow();
                    if (u && this.engine?.b.side !== 0)
                        this.renderer?.lookAt(u.x, u.y - 140);
                    break;
                }
                case 'skill':
                    this.pickSkill(id);
                    break;
                case 'select-hero':
                    this.pickHero(el.dataset.unit!);
                    break;
                case 'player-speed': {
                    const values = [1, 1.5, 2, 3, 4], i = values.indexOf(this.profile.settings.playerSpeed);
                    this.profile.settings.playerSpeed = values[(i + 1) % values.length];
                    this.save();
                    this.updateHUD();
                    this.toast(`아군 공격 ×${this.profile.settings.playerSpeed}`);
                    break;
                }
                case 'leave':
                    this.requestLeave();
                    break;
                case 'retry': {
                    const b = this.engine?.b;
                    if (b)
                        this.launch(b.stageId, b.mode, b.mode === 'practice' ? { party: [this.shownHero()!.cls], wind: b.wind, distance: b.practiceDistance } : {});
                    break;
                }
                case 'result-map': {
                    this.engine = null;
                    this.profile.saved = null;
                    this.stageId = nextStage(this.profile);
                    this.profile.lastStage = this.stageId;
                    this.save();
                    this.showMap();
                    break;
                }
                case 'export':
                    this.save();
                    this.storage.export(this.profile);
                    break;
                case 'import': {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json,application/json';
                    input.onchange = async () => { const f = input.files?.[0]; if (!f)
                        return; try {
                        const p = await this.storage.import(f);
                        this.cancelCharge();
                        this.engine = null;
                        this.profile = p;
                        this.stageId = p.lastStage;
                        await this.storage.save(p);
                        this.audio.configure(p.settings);
                        this.showTitle();
                        this.toast(p.migrated ? '기록 이전 완료 · 기술 투자 SP를 반환했습니다.' : '세이브를 불러왔습니다.');
                    }
                    catch (err) {
                        this.toast(err instanceof Error ? err.message : '세이브를 읽지 못했습니다.');
                    } };
                    input.click();
                    break;
                }
                case 'reset-profile':
                    this.modal(`${this.closeButton()}<h2>모든 진행을 지울까요?</h2><p>세 용병의 성장과 원정 기록을 초기화합니다. 먼저 세이브를 내보내 보관하세요.</p><div class="dialog-actions"><button class="btn" data-action="export">내보내기</button><button class="btn danger" data-action="confirm-reset">모두 초기화</button></div>`, 'reset');
                    break;
                case 'confirm-reset':
                    this.engine = null;
                    this.profile = defaults();
                    this.stageId = 1;
                    this.save();
                    this.showTitle();
                    break;
            }
        });
        document.addEventListener('input', ev => { const el = ev.target as HTMLInputElement | HTMLSelectElement; if (el.dataset.setting) {
            const k = el.dataset.setting as keyof Profile['settings'];
            const v = el instanceof HTMLInputElement && el.type === 'checkbox' ? el.checked : ['volume', 'speed', 'playerSpeed'].includes(k) ? Number(el.value) : el.value;
            (this.profile.settings as unknown as Record<string, unknown>)[k] = v;
            if (k === 'difficulty' && this.engine) setDifficulty(this.engine.b,this.profile.settings.difficulty);
            if(k==='difficulty'){const d=DIFFICULTIES[this.profile.settings.difficulty];if($('difficulty-readout'))$('difficulty-readout').textContent=`적 HP ×${d.hp.toFixed(2)} · 공격 ×${d.damage.toFixed(2)} · 최대 ${d.active}명 행동`;if(this.screen==='map')this.updateMapDock();}
            this.audio.configure(this.profile.settings);
            if(k==='sound' && this.profile.settings.sound) void this.audio.wake().then(()=>this.audio.play('click'));
            if(k==='orientation') void this.applyOrientation(true);
            this.save();
            this.updateHUD();
        } if (el.dataset.tuning) {
            this.profile.tuning[el.dataset.tuning as ClassId] = Number(el.value);
            this.save();
        } });
        document.addEventListener('keydown', ev => {
            void this.audio.wake().then(() => this.audio.configure(this.profile.settings));
            if (this.overlay.classList.contains('open')) {
                if (ev.key === 'Escape' && this.modalType !== 'result') {
                    ev.preventDefault();
                    this.closeModal();
                }
                if (ev.key === 'Tab') {
                    const list = [...this.overlay.querySelectorAll<HTMLElement>('button:not(:disabled),input,select')];
                    if (list.length) {
                        const i = list.indexOf(document.activeElement as HTMLElement);
                        if (ev.shiftKey && i <= 0) {
                            ev.preventDefault();
                            list[list.length - 1].focus({ preventScroll: true });
                        }
                        else if (!ev.shiftKey && i === list.length - 1) {
                            ev.preventDefault();
                            list[0].focus({ preventScroll: true });
                        }
                    }
                }
                return;
            }
            if (this.screen !== 'battle' || (ev.target as HTMLElement).matches('input,select,textarea'))
                return;
            const k = ev.code;
            if (['Space','ControlLeft','ControlRight','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab','Escape','Digit1','Digit2','Digit3','Digit4'].includes(k))
                ev.preventDefault();
            if (k === 'Escape') {
                this.cancelCharge();
                this.showPause();
                return;
            }
            if (k === 'Tab') {
                const list = this.engine?.heroesAlive().filter(u => !u.acted) || [], i = list.findIndex(u => u.id === this.engine?.b.active);
                if (list.length)
                    this.pickHero(list[(i + 1) % list.length].id);
                return;
            }
            if (/^Digit[1-4]$/.test(k)) {
                const u = this.engine?.active, id = u?.loadout[Number(k.slice(5)) - 1];
                if (id)
                    this.pickSkill(id);
                return;
            }
            if (!ev.repeat && k === 'Space') { if(this.beginCharge()) this.spaceAction='fire'; }
            if (!ev.repeat && (k === 'ControlLeft' || k === 'ControlRight')) this.doJump();
            this.keys.add(k);
        });
        document.addEventListener('keyup', ev => { this.keys.delete(ev.code); if (ev.code === 'Space') {
            if (this.screen === 'battle')
                ev.preventDefault();
            if (this.spaceAction === 'fire')
                this.releaseCharge();
            this.spaceAction = null;
        } });
        document.addEventListener('pointerdown', ev => { void this.audio.wake().then(() => this.audio.configure(this.profile.settings)); this.pointerDown(ev); });
        document.addEventListener('pointermove', ev => this.pointerMove(ev), { passive: false });
        document.addEventListener('pointerup', ev => this.pointerUp(ev, false), true);
        document.addEventListener('pointercancel', ev => this.pointerUp(ev, true));
        document.addEventListener('contextmenu', ev => { if ((ev.target as Element).closest('#battle-canvas,#fire,#jump,#swipe-pad,.skill-button,#minimap'))
            ev.preventDefault(); });
        document.addEventListener('lostpointercapture', ev => { if (ev.pointerId === this.firePointer)
            this.cancelCharge(); this.moveTouches.delete(ev.pointerId); if(this.stick?.id===ev.pointerId)this.releaseStick(); });
        document.addEventListener('wheel', ev => { if ((ev.target as Element).id !== 'battle-canvas' || this.paused || !this.renderer)
            return; ev.preventDefault(); const r = $('battle-canvas').getBoundingClientRect(); this.renderer.zoomAt(Math.exp(-ev.deltaY * .0015), ev.clientX - r.left, ev.clientY - r.top); }, { passive: false });
        window.addEventListener('blur', () => this.interrupt());
        document.addEventListener('visibilitychange', () => { if (document.hidden)
            this.interrupt();
        else {
            this.last = performance.now();
            this.accumulator = 0;
            // Native media channels are re-armed by the next real user gesture.
        } });
        window.addEventListener('pagehide', () => { this.cancelCharge(); this.save(); });
        window.addEventListener('resize', () => { this.last = performance.now(); this.syncOrientationGate(); });
        window.addEventListener('orientationchange', () => { this.cancelCharge(); this.resetTouches(); this.keys.clear(); window.setTimeout(()=>this.syncOrientationGate(),80); });
        document.addEventListener('fullscreenchange', () => { this.syncOrientationGate(); if(document.fullscreenElement) void this.lockOrientation(false); });
    }
    requestLeave() { this.modal(`${this.closeButton()}<h2>전장에서 복귀할까요?</h2><p>지금까지 얻은 경험치는 유지됩니다.<br>다시 진입하면 전투는 처음부터 시작합니다.</p><div class="dialog-actions"><button class="btn" data-action="close">계속하기</button><button class="btn primary" data-action="abandon">지도에 복귀</button></div>`, 'return'); }
    interrupt() { this.cancelCharge(); this.keys.clear(); this.resetTouches(); clearTimeout(this.pressTimer); this.engine?.cancelMovement(); if (this.screen === 'battle' && !this.overlay.classList.contains('open') && this.engine && !['won', 'lost'].includes(this.engine.b.phase))
        this.showPause(); this.save(); this.accumulator = 0; }
    private orientationApi() { return screen.orientation as ScreenOrientation & { lock?: (o:'landscape'|'portrait')=>Promise<void>, unlock?:()=>void }; }
    private orientationSupported() { return typeof this.orientationApi()?.lock === 'function'; }
    private standalone() { return window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches; }
    private desiredOrientation() { return this.profile.settings.orientation; }
    private orientationMatches() { const o=this.desiredOrientation(); return o==='auto' || (o==='landscape' ? innerWidth>=innerHeight : innerHeight>=innerWidth); }
    private syncOrientationGate() {
        let gate=document.getElementById('orientation-gate');
        if(!gate){ gate=document.createElement('div'); gate.id='orientation-gate'; gate.innerHTML='<div><strong></strong><span></span></div>'; document.body.appendChild(gate); }
        const pref=this.desiredOrientation(), mismatch=pref!=='auto'&&!this.orientationMatches();
        gate.classList.toggle('show',mismatch);
        const strong=gate.querySelector('strong')!, note=gate.querySelector('span')!;
        strong.textContent=pref==='portrait'?'세로 화면으로 돌려주세요':'가로 화면으로 돌려주세요';
        note.textContent=this.orientationSupported()?'화면 방향 잠금을 다시 적용하려면 화면을 한 번 눌러주세요.':'이 브라우저는 웹페이지의 화면 방향 강제 고정을 지원하지 않습니다.';
    }
    private async lockOrientation(notify=false) {
        const pref=this.desiredOrientation();
        if(pref==='auto'){ try{ this.orientationApi()?.unlock?.(); }catch{} this.syncOrientationGate(); return true; }
        try {
            if(!this.orientationSupported()) throw new Error('unsupported');
            await this.orientationApi().lock!(pref);
            this.syncOrientationGate();
            return true;
        } catch {
            this.syncOrientationGate();
            if(notify) this.toast('이 브라우저에서는 화면 방향을 강제 고정할 수 없습니다. 기기를 직접 회전해주세요.');
            return false;
        }
    }
    async applyOrientation(notify=false) {
        const pref=this.desiredOrientation();
        if(pref==='auto') return this.lockOrientation(notify);
        if(!document.fullscreenElement && !this.standalone()) await this.requestFullscreen(false);
        return this.lockOrientation(notify);
    }
    async requestFullscreen(force = false) {
        if (this.fullscreenTried && !force && document.fullscreenElement) return true;
        this.fullscreenTried = true;
        if (document.fullscreenElement || this.standalone()) return true;
        const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void; };
        try {
            if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' });
            else if (el.webkitRequestFullscreen) await Promise.resolve(el.webkitRequestFullscreen());
            else { if (force) this.toast('브라우저 메뉴에서 홈 화면에 추가하면 앱처럼 실행할 수 있습니다.'); return false; }
            return true;
        } catch {
            if (force) this.toast('전체화면을 사용할 수 없습니다. 홈 화면 추가 또는 브라우저 전체화면을 이용해주세요.');
            return false;
        }
    }
    private displayAim(u: Unit) {
        // Player-facing convention requested by the UI:
        // facing right: 0° (horizontal) -> 90° (straight up)
        // facing left : 90° (horizontal) -> 180° (straight up).
        // Internally physics still uses the standard world angle (left horizontal = 180°).
        return u.facing >= 0 ? u.angle : 270 - u.angle;
    }
    private adjustAim(u: Unit, amount: number) {
        if (!amount) return;
        if (u.facing >= 0) {
            // Right-facing upper hemisphere. Downward shots remain available to -85°.
            const shown = clamp(this.displayAim(u) + amount, AIM_MIN, 90);
            u.angle = shown;
        } else {
            // Left-facing: increasing the displayed angle raises the muzzle, while
            // the physical world angle moves from 180° toward 90°.
            const shown = clamp(this.displayAim(u) + amount, 270 - AIM_MAX, 180);
            u.angle = 270 - shown;
        }
    }
    setControl(_mode: 'move' | 'aim') { /* v8 unified controls: retained for old scripted callers */ }
    doJump() { if (this.paused || !this.engine?.canAct())
        return; if (this.engine.jump()) {
        this.renderer?.follow();
        this.updateHUD();
    } }
    resetTouches() { this.canvasTouches.clear(); this.moveTouches.clear(); this.releaseStick(); this.pinch = null; this.gestureBlocked = false; this.gesture = null; this.spaceAction = null; this.pressStart = null; clearTimeout(this.pressTimer); }
    releaseStick(){this.stick=null;$('swipe-pad')?.classList.remove('held');if($('stick-knob'))$('stick-knob').style.transform='translate(0px,0px)';}
    paintStick(){const pad=$('swipe-pad'),knob=$('stick-knob');if(!pad||!knob)return;const x=this.stick?.x||0,y=this.stick?.y||0,r=Math.max(22,Math.min(pad.clientWidth,pad.clientHeight)*.27);knob.style.transform=`translate(${x*r}px,${-y*r}px)`;}
    canvasPoint(ev: PointerEvent) { const canvas = $('battle-canvas'), r = canvas.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; }
    pinchMetrics() { const a = [...this.canvasTouches.values()]; if (a.length < 2)
        return null; return { distance: Math.max(8, Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y)), x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 }; }
    capture(el: HTMLElement, id: number) { try {
        el.setPointerCapture(id);
    }
    catch { /* synthetic inputs or cancelled touches */ } }
    pointerDown(ev: PointerEvent) {
        const target = ev.target as Element;
        if (ev.button !== 0 || this.paused)
            return;
        const fire = target.closest<HTMLElement>('#fire');
        if (fire) {
            ev.preventDefault();
            if (this.firePointer !== null || !this.beginCharge())
                return;
            this.firePointer = ev.pointerId;
            this.capture(fire, ev.pointerId);
            return;
        }
        const pad=target.closest<HTMLElement>('#swipe-pad');
        if(pad){ev.preventDefault();if(!this.stick&&this.engine?.canAct()){const r=pad.getBoundingClientRect();this.stick={id:ev.pointerId,originX:r.left+r.width/2,originY:r.top+r.height/2,x:0,y:0,range:Math.max(32,Math.min(r.width,r.height)*.42)};this.capture(pad,ev.pointerId);pad.classList.add('held');this.pointerMove(ev);}return;}
        const jump = target.closest<HTMLElement>('#jump');
        if (jump) {
            ev.preventDefault();
            this.capture(jump, ev.pointerId);
            this.doJump();
            return;
        }
        const skill = target.closest<HTMLElement>('.skill-button[data-skill]');
        if (skill) {
            clearTimeout(this.pressTimer);
            this.pressStart = { x: ev.clientX, y: ev.clientY };
            const id = skill.dataset.skill!;
            this.pressTimer = window.setTimeout(() => { this.blockClick = performance.now() + 900; this.showSkillInfo(id); }, 550);
            return;
        }
        if (target.id === 'minimap' && this.renderer && this.engine) {
            ev.preventDefault();
            const r=target.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width*this.engine.b.width;
            if(this.engine.b.vertical)this.renderer.lookAt(x,(ev.clientY-r.top)/r.height*this.engine.b.height);
            else {const t=this.engine.surface(x,0,this.engine.b.height+200);this.renderer.lookAt(x,(t?.y||900)-150);}
            return;
        }
        if (target.id !== 'battle-canvas' || !this.renderer || !this.engine)
            return;
        ev.preventDefault();
        const p = this.canvasPoint(ev);
        this.canvasTouches.set(ev.pointerId, p);
        this.capture(target as HTMLElement, ev.pointerId);
        if (this.canvasTouches.size >= 2) {
            this.gesture = null;
            this.gestureBlocked = true;
            this.pinch = this.pinchMetrics();
            return;
        }
        if (this.gestureBlocked)
            return;
        const world = this.renderer.toWorld(p.x, p.y);
        this.gesture = { id: ev.pointerId, x: p.x, y: p.y, lastX: p.x, lastY: p.y, kind: 'pan', moved: false, worldX: world.x, worldY: world.y };
    }
    pointerMove(ev: PointerEvent) {
        if(this.stick?.id===ev.pointerId){ev.preventDefault();if(this.paused||!this.engine?.canAct()){this.releaseStick();return;}const axes=joystickAxes(ev.clientX-this.stick.originX,this.stick.originY-ev.clientY,this.stick.range,!!this.stick.horizontalEngaged);this.stick.x=axes.x;this.stick.y=axes.y;this.stick.horizontalEngaged=axes.moving;this.paintStick();return;}
        if (this.pressStart && Math.hypot(ev.clientX - this.pressStart.x, ev.clientY - this.pressStart.y) > 9) {
            clearTimeout(this.pressTimer);
            this.pressTimer = 0;
        }
        if (ev.pointerId === this.firePointer) {
            ev.preventDefault();
            return;
        }
        if (this.moveTouches.has(ev.pointerId)) {
            ev.preventDefault();
            return;
        }
        if (!this.canvasTouches.has(ev.pointerId) || !this.renderer || !this.engine || this.paused)
            return;
        ev.preventDefault();
        const p = this.canvasPoint(ev);
        this.canvasTouches.set(ev.pointerId, p);
        if (this.canvasTouches.size >= 2) {
            const next = this.pinchMetrics();
            if (next && this.pinch) {
                this.renderer.zoomAt(next.distance / this.pinch.distance, this.pinch.x, this.pinch.y);
                this.renderer.pan(next.x - this.pinch.x, next.y - this.pinch.y);
            }
            this.pinch = next;
            return;
        }
        if (this.gestureBlocked)
            return;
        const g = this.gesture;
        if (!g || g.id !== ev.pointerId)
            return;
        const u = this.engine.active;
        if (Math.hypot(p.x - g.x, p.y - g.y) > 7)
            g.moved = true;
        if (g.kind === 'pan' && g.moved)
            this.renderer.pan(p.x - g.lastX, p.y - g.lastY);
        g.lastX = p.x;
        g.lastY = p.y;
    }
    pointerUp(ev: PointerEvent, cancelled: boolean) {
        clearTimeout(this.pressTimer);
        this.pressStart = null;
        this.moveTouches.delete(ev.pointerId);
        if(this.stick?.id===ev.pointerId){this.releaseStick();return;}
        if (ev.pointerId === this.firePointer) {
            if (cancelled)
                this.cancelCharge();
            else
                this.releaseCharge();
            return;
        }
        if (!this.canvasTouches.has(ev.pointerId))
            return;
        this.canvasTouches.delete(ev.pointerId);
        if (this.gestureBlocked) {
            if (this.canvasTouches.size === 0) {
                this.gestureBlocked = false;
                this.pinch = null;
                this.gesture = null;
            }
            return;
        }
        const g = this.gesture;
        if (!g || ev.pointerId !== g.id)
            return;
        this.gesture = null;
        if (cancelled || g.moved || this.paused || !this.engine || !this.renderer)
            return;
        const e = this.engine, ally = e.heroesAlive().find(u => Math.hypot(g.worldX - u.x, g.worldY - (u.y - u.h * .5)) * this.renderer!.scale < 30);
        if (ally && ally.id !== e.active?.id) {
            this.pickHero(ally.id);
            return;
        }

    }
    private frame = (now: number) => {
        const dt = clamp((now - this.last) / 1000, 0, .06);
        this.last = now;
        try {
            const e = this.engine;
            if (this.screen === 'battle' && e && this.renderer) {
                if (!this.paused) {
                    if (e.canAct()) {
                        const u=e.active!;
                        const aimAxis=clamp(Number(this.keys.has('ArrowUp'))-Number(this.keys.has('ArrowDown'))+(this.stick?.y||0),-1,1);
                        if(aimAxis){
                            // One facing-relative rule for keyboard AND mobile joystick.
                            // Pushing/pressing up always raises the muzzle visually.
                            this.adjustAim(u, aimAxis * 62 * dt);
                        }
                        if (this.charging) this.power = Math.min(1, .08 + (now - this.chargeStarted) / 1000 * .48);
                    }
                    else {if(this.charging)this.cancelCharge();if(this.stick)this.releaseStick();}
                    const speed = e.b.phase==='review'?1:e.b.side === 1 ? this.profile.settings.speed : ['flight','summon'].includes(e.b.phase) ? this.profile.settings.playerSpeed : 1;
                    this.accumulator += dt * speed;
                    let steps = 0;
                    while (this.accumulator >= STEP && steps < 80 && !this.paused) {
                        if (e.canAct()) {
                            const d=Number(this.keys.has('ArrowRight'))-Number(this.keys.has('ArrowLeft'))+(this.stick?.x||0);
                            if(Math.abs(d)>.02){e.move(clamp(d,-1,1),STEP);this.renderer.follow();}
                        }
                        const before=e.b.phase;e.tick(STEP);
                        if(e.b.phase==='review'&&before!=='review'){this.accumulator=0;this.releaseStick();break;}
                        this.accumulator -= STEP;
                        steps++;
                    }
                    if (steps === 80)
                        this.accumulator = 0;
                    this.renderer.render(e, dt * speed, this.selected, this.power, this.charging, this.profile.settings, false);
                }
                else {
                    this.accumulator = 0;
                    this.renderer.render(e, 0, this.selected, this.power, false, this.profile.settings, true);
                }
                if (now - this.lastHUD > 80) {
                    this.lastHUD = now;
                    this.updateHUD();
                }
                if (now - this.lastSave > 3000 && !['won', 'lost'].includes(e.b.phase))
                    this.save();
            }
            else if (this.screen === 'title')
                this.back.backdrop(0, 1);
            if(this.previewSkillId)this.renderSkillPreview(now);
            this.audio.update();
            if (this.storage.warning && !this.warningShown) {
                this.warningShown = true;
                this.toast(this.storage.warning);
            }
        }
        catch (err) {
            console.error(err);
            this.cancelCharge();
            this.paused = true;
            this.keys.clear();
            this.overlay.innerHTML = `<section class="dialog" role="dialog" aria-modal="true"><h2>전투를 안전하게 중단했습니다</h2><p>마지막 자동 저장부터 다시 이어갈 수 있습니다.</p><div class="dialog-actions"><button class="btn primary" onclick="location.reload()">다시 불러오기</button></div><details><summary>오류 내용</summary><pre>${esc(String(err))}</pre></details></section>`;
            this.overlay.classList.add('open');
            return;
        }
        requestAnimationFrame(this.frame);
    };
    exposeTests() { if (new URLSearchParams(location.search).has('test'))
        (window as unknown as {
            __FSC: unknown;
        }).__FSC = { app: this, Engine, createBattle, SKILLS, STAGES, defaults, validate, ...Progress, DIFFICULTIES, setDifficulty }; }
}
const app = new App();
app.init().catch(err => { console.error(err); $('app').innerHTML = `<div class="dialog"><h2>게임을 불러오지 못했습니다</h2><p>${esc(String(err))}</p><button class="btn" onclick="location.reload()">다시 불러오기</button></div>`; });
