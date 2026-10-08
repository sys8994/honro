(function (G) {
    'use strict';
    const C = G.HONRO_CORE, H = G.HONRO_CONTENT, $ = id => document.getElementById(id), clone = x => JSON.parse(JSON.stringify(x)), clamp = (v, a, b) => Math.max(a, Math.min(b, v)), esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const KEY = 'honro-first-act-profile-1', ROSTER = ['archer', 'mage', 'knight', 'occultist'], BASE = C.STAGES.map(clone);
    const S = C.SKILLS, FA = G.HonroFA;
    const fa=(name,size=18,cls='')=>FA?.icon?.(name,cls,size)||'';
    // Use the original ARCFALL skill icons, the final 0.6.4+ behavior.
    for (const cls of ROSTER) {
        Object.assign(C.CLASSES[cls], { name: H.hero[cls].job, person: H.hero[cls].name, color: H.hero[cls].color, desc: H.hero[cls].line });
        if (C.BRANCHES?.[cls])
            C.BRANCHES[cls].forEach((b, i) => b.name = H.hero[cls].branch[i]);
    }
    for (const [id, s] of Object.entries(S)) {
        s.name = H.skillNames[id] || s.name;
        s.desc = (s.desc || '').replace(/마법사/g, '도사').replace(/검사/g, '무사').replace(/심령술사/g, '영매').replace(/용병/g, '동행').replace(/스킬/g, '기예').replace(/레벨/g, '경지');
    }
    for (const t of C.TALENTS || [])
        if (S[t.id]) {
            t.name = S[t.id].name;
            t.desc = S[t.id].desc;
        }
    for (const st of H.stages) {
        const b = BASE[(st.id - 1) % BASE.length] || BASE[0];
        C.STAGES[st.id - 1] = { ...b, id: st.id, name: st.name, subtitle: st.goal, region: 0, local: st.id - 1, objective: (st.objective === 'escort'||st.objective==='overwatch') ? 'escort' : st.objective === 'defend' ? 'banner' : st.objective === 'boss' ? 'boss' : 'clear', boss: st.objective === 'boss', intro: '', outro: st.outro.map(x => x[1]).join(' ') };
    }
    C.STAGES.length = H.stages.length;
    function fresh() { const p = C.defaults(); for (const c of ROSTER)
        C.sanitizeLoadout(p, c); p.saved = null; p.cleared = {}; p.party = ['archer']; p.recruited = ['archer']; p.lastStage = 1; p.mapNode = 1; p.schema = 4; p.game = 'honro'; p.seen = {}; p.record = []; p.honroFlags = {}; p.settings = { ...p.settings, orientation: 'auto', music: true, musicVolume: .65, speed: 1.5, playerSpeed: 1.5, sound: true, volume: .55, minimapVisible: true }; return p; }
    function migrateGrowth(p,revision){
        for(const roster of [p.heroes,p.saved?.heroes,p.honroBattle?.heroes])if(roster)for(const cls of ROSTER){const hero=roster[cls];if(!hero)continue;if(!Number.isInteger(hero.statTraining))hero.statTraining=Object.values(hero.statRanks||{}).reduce((sum,n)=>sum+(Number.isInteger(n)&&n>0?n:0),0);delete hero.statRanks;}
        if(revision>=13)return;
        const convert=revision<=10?C.migrateLegacyXp9:C.migrateXp12;
        const oldBattleXp=new Map([p.saved,p.honroBattle].filter(Boolean).map(b=>[b,Math.max(...ROSTER.map(cls=>Number.isFinite(b.heroes?.[cls]?.xp)?b.heroes[cls].xp:0))]));
        for(const roster of [p.heroes,p.saved?.heroes,p.honroBattle?.heroes])if(roster)for(const cls of ROSTER){const hero=roster[cls];if(hero&&Number.isFinite(hero.xp))hero.xp=convert(hero.xp);}
        for(const battle of [p.saved,p.honroBattle])if(battle){
            if(battle.startXP)for(const cls of ROSTER)if(Number.isFinite(battle.startXP[cls]))battle.startXP[cls]=convert(battle.startXP[cls]);
            if(battle.honroGrowth?.limit){
                const newHero=Math.max(...ROSTER.map(cls=>Number.isFinite(battle.heroes?.[cls]?.xp)?battle.heroes[cls].xp:0));
                const shift=Math.max(0,newHero-(oldBattleXp.get(battle)||0));battle.honroGrowth.limit.start+=shift;battle.honroGrowth.limit.end+=shift;
            }
        }
        p.revision=13;
    }
    function load() { if(G.HONRO_EMBEDDED)return fresh(); try {
        let x = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (x && x.game === 'honro' && [1,2,3,4].includes(x.schema) && x.heroes && Array.isArray(x.recruited) && x.recruited.includes('archer')) {
            const p = fresh();
            Object.assign(p, x);
            p.schema = 4;
            p.settings = { ...fresh().settings, ...x.settings };
            if(p.honroBattle?.honroRevision!==20){p.honroBattle=null;p.upgradeNotice=!!x.honroBattle;}
            C.migrateSkills(p);
            migrateGrowth(p,x.revision||12);
            G.HonroProgression.repairRecruits(p);
            G.HonroProgression.reconcileCampAllocations(p);
            return p;
        }
    }
    catch { } return fresh(); }
    // Debug changes only access checks. Clone every campaign-owned value so
    // story, growth, allocations and a suspended battle use normal semantics.
    // This clone is session-only; only the normal profile is ever exported/saved.
    function debugProfile(normal) { return clone(normal); }
    function save(p) { try {
        localStorage.setItem(KEY, JSON.stringify(p));
        return true;
    }
    catch {
        return false;
    } }
    function terrain(id, x, y, w, h, mat = 'rock', extra = {}) { return { id, x, y, w, h, mat, hp: mat === 'wood' ? 330 : 99999, maxHp: mat === 'wood' ? 330 : 99999, route: true, ...extra }; }
    function makeLegacyWorld(st, p, training = false, cls = 'archer', skill) {
        const b = C.createBattle(1, clone(p), 'practice', { party: [cls], distance: 900 });
        b.stage = st.id;
        b.stageId = st.id;
        b.honroStage = st.id;
        b.mode = training ? 'practice' : 'campaign';
        b.width = training ? 2400 : st.w;
        b.height = training ? 1380 : st.h;
        b.vertical = !training && st.theme === 'tree';
        b.terrain = [];
        b.units = [];
        b.projectiles = [];
        b.fields = [];
        b.drafts = [];
        b.waters = [];
        b.zones = [];
        b.decor = [];
        b.events = [];
        b.queue = [];
        b.round = 1;
        b.side = 0;
        b.phase = 'aim';
        b.turnAge = 0;
        b.resolveAge = 0;
        b.reviewLeft = 0;
        b.reviewDamage = {};
        b.heroes = clone(p.heroes);
        b.startXP = Object.fromEntries(ROSTER.map(c => [c, b.heroes[c].xp]));
        b.wind = training ? 7 : ({ forest: 8, temple: -7, gate: 10, river: -12, valley: 23, bridge: 16, tree: 8, shrine: -15 }[st.theme] || 6);
        b.enemyLimit = st.id === 1 ? 2 : 3;
        b.sceneVersion = (b.sceneVersion || 0) + 10;
        b.heroDamage = 0;
        b.damageDone = 0;
        b.shots = 0;
        b.kills = 0;
        b.winnerReason = '';
        b.session = 'honro-' + Date.now();
        b.lastShots = {};
        b.honroState = { flags: {}, collected: [], hold: 0, lastRound: 1, rescued: false };
        b.honroMarkers = [];
        const add = (...args) => b.terrain.push(terrain(...args));
        if (training) {
            add('trainingfloor', 0, 1010, b.width, 400);
            add('trainingstep', 1360, 850, 240, 23, 'wood', { oneWay: true });
        }
        else if (st.id === 1) {
            add('ground', 0, 1080, st.w, 500);
            add('lowrise', 820, 1020, 460, 35, 'wood', { oneWay: true });
            add('ramp', 1440, 1080, 410, 230, 'rock', { slope: -100 });
            add('far-bank', 1850, 980, 600, 570);
        }
        else if (st.id === 2) {
            add('low', 0, 1190, st.w, 350);
            add('left', 0, 1010, 780, 330);
            add('steps1', 640, 1110, 330, 200);
            add('middle', 1080, 990, 630, 360);
            add('stair', 1580, 1090, 270, 220);
            add('templeyard', 1860, 890, 990, 590);
            add('roofwalk', 1930, 685, 310, 21, 'wood', { oneWay: true });
        }
        else if (st.id === 3) {
            add('floor', 0, 1120, st.w, 400);
            add('gatewalk', 900, 900, 360, 26, 'wood', { oneWay: true });
            add('stair1', 610, 1020, 300, 20, 'wood', { oneWay: true });
            add('eastledge', 1720, 1010, 360, 25, 'wood', { oneWay: true });
            add('ruinwall', 2210, 930, 100, 190, 'stone', { hp: 470, maxHp: 470 });
        }
        else if (st.id === 4) {
            add('mudfloor', 0, 1240, st.w, 500);
            add('nearbank', 0, 1050, 680, 500);
            add('reedland', 870, 1090, 510, 460);
            add('midpier', 1570, 960, 430, 26, 'wood', { oneWay: true });
            add('bridge1', 630, 1100, 270, 24, 'wood', { oneWay: true });
            add('bridge2', 1350, 1080, 300, 24, 'wood', { oneWay: true });
            add('farbank', 2220, 1080, 880, 500);
            add('ramp3', 1940, 1170, 290, 180, 'rock', { slope: -90 });
        }
        else if (st.id === 5) {
            add('valleyfloor', 0, 1540, st.w, 500);
            add('west', 0, 1030, 850, 820);
            add('westslant', 850, 1030, 700, 820, 'rock', { slope: 460 });
            add('eastslope', 2140, 1490, 700, 390, 'rock', { slope: -460 });
            add('east', 2840, 1030, 900, 820);
            add('lowaltar', 1690, 1320, 290, 20, 'wood', { oneWay: true });
            for (let i = 0; i < 4; i++)
                add('weststair' + i, 980 + i * 150, 1200 + i * 87, 200, 18, 'wood', { oneWay: true });
            for (let i = 0; i < 4; i++)
                add('eaststair' + i, 2170 + i * 155, 1400 - i * 100, 220, 18, 'wood', { oneWay: true });
        }
        else if (st.id === 6) {
            add('ravine', 0, 1470, st.w, 500);
            add('west', 0, 1010, 760, 730);
            add('east', 2610, 1010, 760, 730);
            for (let i = 0; i < 8; i++)
                add('plank' + i, 735 + i * 239, 1020 + Math.sin(i / 7 * Math.PI) * 100, 250, 25, 'wood', { hp: 420, maxHp: 420 });
            for (let i = 0; i < 6; i++)
                add('lower' + i, 900 + i * 295, 1360 - (i % 2) * 100, 245, 22, 'wood', { oneWay: true, hp: 99999, maxHp: 99999 });
            add('rise', 2320, 1370, 350, 200, 'rock', { slope: -300 });
        }
        else if (st.id === 7) {
            add('rootfloor', 0, 1970, st.w, 400);
            for (let i = 0; i < 8; i++) {
                const x = i % 2 ? 1470 : 710, yy = 1820 - i * 152;
                add('branch' + i, x, yy, 780, 25, 'wood', { oneWay: true, hp: 99999, maxHp: 99999 });
            }
            add('altarledge', 1800, 720, 800, 28, 'stone', { oneWay: true });
            for (let i = 0; i < 5; i++)
                add('backroute' + i, 120 + i * 130, 1790 - i * 166, 320, 22, 'wood', { oneWay: true, hp: 99999, maxHp: 99999 });
        }
        else {
            add('floor', 0, 1400, st.w, 550);
            add('westterrace', 0, 1120, 970, 800);
            add('midstep', 1090, 1250, 480, 20, 'wood', { oneWay: true });
            add('shrinebase', 1870, 1050, 1260, 850);
            add('slope', 1500, 1360, 480, 540, 'stone', { slope: -310 });
            add('altarroof', 2210, 825, 380, 24, 'wood', { oneWay: true });
            add('rearstep', 3140, 1220, 430, 22, 'wood', { oneWay: true });
        }
        const topAt = (x, limit = Infinity) => { let y = b.height - 180; for (const t of b.terrain) {
            if (t.broken || x < t.x || x > t.x + t.w)
                continue;
            const yy = t.y + (t.slope || 0) * (x - t.x) / t.w;
            if (yy <= limit)
                y = Math.min(y, yy);
        } return y; };
        let party = training ? [cls] : p.recruited.slice();
        party.forEach((c, i) => { let x = training ? 280 : st.id === 7 ? 270 + i * 140 : ({ archer: 205, mage: 370, knight: 535, occultist: 430 }[c]); let y = topAt(x); if (!training && c === 'archer' && st.id >= 3 && st.id !== 7) {
            add('archer-perch', 100, y - 150, 280, 19, 'wood', { oneWay: true, hp: 99999, maxHp: 99999 });
            y -= 150;
        } const u = C.makeUnit(c, 0, x, y, { id: 'p-' + c, name: H.hero[c].name, loadout: [...p.loadouts[c]], tune: p.tuning[c] ?? .5 }); C.applyHero(u, b.heroes[c], true); u.acted = false; u.cooldowns = {}; u.spawnX = x; u.spawnY = y; b.units.push(u); });
        if (training) {
            const u = b.units[0];
            u.focus = u.maxFocus = 9999;
            u.ranks = { ...u.ranks };
            if (skill) {
                u.loadout = [skill];
                u.ranks[skill] = S[skill]?.ultimate || S[skill]?.basic ? 1 : p.heroes[cls].ranks[skill] || 1;
                b.heroes[cls].ranks = { ...u.ranks };
            }
            for (let i = 0; i < 5; i++) {
                const x = 920 + i * 180, y = topAt(x);
                const t = C.makeUnit(i % 2 ? 'knight' : 'archer', 1, x, y, { id: 'practice-' + i, name: '허상', role: 'dummy', fixed: true, hp: 9000, maxHp: 9000, loadout: ['A01'], awake: true });
                t.honroType = ['ghost', 'beast', 'shade', 'human', 'crow'][i];
                b.units.push(t);
            }
        }
        else {
            let count = st.enemies;
            for (let i = 0; i < count; i++) {
                let x = 970 + (st.w - 1220) * (i / (count - 1 || 1));
                if (st.id === 1)
                    x = 850 + i * 315;
                if (st.id === 7)
                    x = i % 2 ? 1920 : 820;
                let y = st.id === 7 ? 1820 - Math.floor(i / 2) * 304 : topAt(x);
                let role = ['bow', 'fire', 'shield', 'bow', 'ice', 'leaper', 'bow', 'ward'][i % 8];
                if (!C.ENEMIES[role])
                    role = 'bow';
                let u = C.makeEnemy({ role, x, y }, b.terrain, C.STAGES[st.id - 1], i);
                u.id = 'foe-' + i;
                u.x = x;
                u.y = y;
                u.spawnX = x;
                u.spawnY = y;
                u.name = ['길막이', '뿌리짐승', '빈갑옷', '등불 도둑', '행렬귀', '검은 날짐승'][i % 6];
                u.honroType = ['ghost', 'beast', 'human', 'lantern', 'shade', 'crow'][i % 6];
                u.hp = u.maxHp = Math.round(u.maxHp * (st.id === 1 ? .63 : .82));
                u.attack *= st.id === 1 ? .64 : .79;
                u.combatBaseHp = u.maxHp / (C.DIFFICULTIES[b.difficulty]?.hp || 1);
                u.combatBaseAttack = u.attack / (C.DIFFICULTIES[b.difficulty]?.damage || 1);
                u.awake = true;
                u.aggroUntil = 999;
                u.group = 0;
                u.fixed = u.honroType === 'crow' || u.honroType === 'lantern';
                if (u.fixed)
                    u.y -= 90;
                u.spawnY = u.y;
                b.units.push(u);
            }
        }
        const mk = (type, x, y, label) => b.honroMarkers.push({ type, x, y, label });
        if (!training) {
            if (st.objective === 'escort') {
                const x = 390, y = topAt(x);
                b.units.push(C.makeUnit('knight', 2, x, y, { id: 'objective', name: '상여', role: 'caravan', honroType: 'bier', hp: 1450, maxHp: 1450, r: 50, h: 88, fixed: true, loadout: [] }));
                mk('exit', st.w - 180, topAt(st.w - 180), '고개');
            }
            if (st.objective === 'defend') {
                const x = 820, y = topAt(x);
                b.units.push(C.makeUnit('knight', 2, x, y, { id: 'objective', name: '피난문', role: 'ward', honroType: 'bier', hp: 1850, maxHp: 1850, r: 50, h: 90, fixed: true, loadout: [] }));
                mk('shrine', x, y, '피난문');
            }
            if (['seals', 'boss'].includes(st.objective)) {
                let xs = st.id === 2 ? [1550, 2540] : st.id === 5 ? [2920, 3400] : [2120, 2990];
                xs.forEach((x, i) => add('seal-' + i, x - 35, topAt(x) - 132, 70, 132, 'stone', { honroSeal: true, device: 'ward', hp: st.id < 5 ? 340 : 500, maxHp: st.id < 5 ? 340 : 500, route: false }));
            }
            if (st.objective === 'recover') {
                for (const x of [1050, 1690, 2480])
                    mk('relic', x, topAt(x), '이름');
                mk('exit', st.w - 170, topAt(st.w - 170), '나루');
            }
            if (st.objective === 'rescue') {
                let x = 2540, y = topAt(x);
                b.units.push(C.makeUnit('archer', 2, x, y, { id: 'objective', name: '생존자', role: 'prisoner', honroType: 'human', hp: 1100, maxHp: 1100, r: 22, h: 75, fixed: true, loadout: [] }));
                mk('exit', st.w - 130, topAt(st.w - 130), '건너편');
            }
            if (st.objective === 'ritual')
                mk('shrine', 2260, 720, '왕문');
            if (st.objective === 'boss') {
                const x = 2780, y = topAt(x);
                b.units.push(C.makeUnit('knight', 1, x, y, { id: 'boss', name: '장례길의 주인', role: 'golem', boss: 1, honroType: 'boss', hp: 1900, maxHp: 1900, attack: 2.4, armor: .12, r: 44, h: 168, loadout: ['S09', 'S02'], fixed: false, awake: true, aggroUntil: 999, group: 0 }));
            }
        }
        b.active = b.units.find(u => u.side === 0).id;
        b.sceneVersion++;
        return b;
    }
    function makeWorld(st,p,training=false,cls='archer',skill){return G.HonroWorld.build(st,p,training,cls,skill,makeLegacyWorld);}
    class App {
        constructor() { this.root = $('app'); this.modal = $('modal'); this.normalProfile = load(); this.debugMode = !!this.normalProfile.settings.debugMode && !G.HONRO_EMBEDDED; this.profile = this.debugMode ? debugProfile(this.normalProfile) : this.normalProfile; this.engine = null; this.scene = null; this.screen = 'title'; this.stageId = this.profile.lastStage || 1; this.cls = this.profile.recruited[0]; this.branch = 0; this.selectedByUnit = {}; this.selected = 'A01'; this.charging = false; this.power = .58; this.keys = new Set(); this.stick = { x: 0, y: 0 }; this.contacts = new Map(); this.audio = C.AudioEngine ? new G.HonroAudio() : null; this.audio?.configure(this.profile.settings); this.prev = performance.now(); this.acc = 0; this.uiAge = 0; this.dirty = false; this.dialogue = null; this.preview = null; this.trainingClass = 'archer'; this.trainingSkill = 'A01'; this.trainingPassives = {}; this.trainingRanks = {}; this.eventText = ''; this.eventUntil = 0; this.banterQueue=[]; this.banterCurrent=null; this.banterUntil=0; this.bind(); this.showTitle(); requestAnimationFrame(t => this.frame(t)); }
        persist() { if(G.HONRO_EMBEDDED||this.customMap)return; G.HonroProgression.persist(this); G.HonroSplitCampaign?.persist(this); this.profile.party = [...this.profile.recruited]; if(this.debugMode)return; this.normalProfile=this.profile; if (!save(this.profile) && !this.storageWarned) {
            this.storageWarned = true;
            this.notify('이 환경에서는 자동 기록이 제한돼. 설정에서 기록 파일을 보관해줘.');
        } }
        notify(text) { let n = $('notice'); n.textContent = text; n.hidden = false; clearTimeout(this.noti); this.noti = setTimeout(() => n.hidden = true, 3200); }
        top(title, back = 'title') { return `<header class="top"><button class="icon ghost" data-action="${back}" aria-label="뒤로">${fa('chevronUp',17,'back-icon')}</button><h2>${esc(title)}</h2>${this.debugMode?'<span class="debug-badge">디버그 · 기록 분리</span>':''}<span class="grow"></span><button class="icon ghost" data-action="journal" aria-label="기록">${fa('bookOpen',18)}</button><button class="icon ghost" data-action="settings" aria-label="설정">${fa('gear',18)}</button></header>`; }
        portrait(cls, size = 1) { return `<canvas class="portrait" data-portrait="${cls}" width="88" height="108"></canvas>`; }
        drawPortraits() { for (const cv of document.querySelectorAll('canvas[data-portrait]')) G.HonroPortraits.draw(cv,null,cv.dataset.portrait); }
        showTitle() { this.stopBattle(); this.close(); this.screen = 'title'; const resumeRest=!!this.profile.honroJourney?.story;this.root.innerHTML = `<main class="screen title honro-title"><div class="title-bg" aria-hidden="true">${G.HONRO_TITLE_SCENE||""}</div><header class="top">${this.debugMode?'<span class="debug-badge">디버그 · 기록 분리</span>':''}<span class="grow"></span><button class="icon ghost" data-action="settings" aria-label="설정">${fa('gear',19)}</button></header><input type="file" id="map-import" accept=".json" hidden><section class="title-main"><div class="honro-logo-wrap">${G.HONRO_TITLE_LOGO?`<img class="honro-logo" src="${G.HONRO_TITLE_LOGO}" alt="혼로 HONRO · 잊힌 혼들이 머무는 곳, 다시 흐르는 이야기">`:'<h1>혼로</h1>'}</div><p class="title-tagline">산도, 죽은 자도, 언젠가 다시 흐른다.</p><div class="title-actions"><button class="primary" data-action="${resumeRest?'rest':this.profile.honroBattle ? 'continue' : 'rest'}">${resumeRest?'쉼터 대화 이어가기':this.profile.honroBattle ? '이어서 걷기' : Object.keys(this.profile.cleared).length ? '여정 이어가기' : '길을 열다'}</button>${this.profile.honroBattle ? resumeRest?'<button class="ghost" data-action="continue">저장된 전투 이어서 걷기</button>':!this.debugMode&&G.HonroSplitCampaign.locked(this.profile)?'':'<button class="ghost" data-action="rest">길 위의 쉼터</button>' : ''}</div></section><footer class="footer"><button class="ghost" data-action="import-map">Workshop Map</button><button class="ghost" data-action="journal">기록</button><span class="grow"></span><span>연목의 매듭 · 울리지 않는 종</span></footer></main>`; }
        stopBattle() { G.HonroRestJourney?.stopMotion(this); if (this.engine && !this.training && !this.done) {
            G.HonroProgression.syncRoster(this.profile,this.engine.b);
            this.profile.honroBattle = clone(this.engine.b);
            this.persist();
        } this.engine = null; this.scene = null; this.keys.clear(); this.stick = { x: 0, y: 0 }; this.charging = false; this.dialogue = null; this.banterQueue=[];this.banterCurrent=null; this.turnNotice=null;this.lastTurnNotice=null;this.storyCamera=null;document.body.classList.remove('story-lock');
          if(this.customMap){this.profile=this.customMap.returnProfile;this.stageId=this.customMap.returnStageId;this.customMap=null;}
        }
        isOpen(st) { return this.debugMode || st.requires.every(id => this.profile.cleared[id]); }
        showRest(){return G.HonroRestJourney.showRest(this);}
        showMap(){return G.HonroRestJourney.showBook(this);}

        showCamp(cls=this.cls){if(G.HonroSplitCampaign?.redirectRest(this))return;const y=$('armory')?.scrollTop||0;this.stopBattle();this.close();this.screen='camp';if(!this.profile.recruited.includes(cls))cls=this.profile.recruited[0];this.cls=cls;this.root.innerHTML=G.HonroUI.camp(this.profile,cls,this.top('모닥불 · 동행의 준비','rest'),this.branch).replace('id="camp-scroll"','id="armory"');$('armory').scrollTop=y;}

        saveCampAllocation(cls=this.cls){G.HonroProgression.markCampAllocation(this.profile,cls);this.persist();}

        sig(id){return C.icon('skill:'+id,'',28);}

        open(html, kind = '') { this.cancelInput(); if(!this.modal.classList.contains('open')){const active=document.activeElement;this.modalReturnFocus=active?.matches?.('button,input,select,textarea,a[href],[tabindex]')?active:this.root?.querySelector('button');} this.modal.innerHTML = `<section class="dialog ${kind}" role="dialog" aria-modal="true"><button class="close" data-action="close" aria-label="닫기">${fa('xmark',18)}</button>${html}</section>`; this.modal.classList.add('open'); this.drawPortraits(); this.updateAudio(); this.modal.querySelector('[data-action="close"]')?.focus({preventScroll:true}); }
        close() { this.pendingJourneyLaunch=null;const wasOpen=this.modal.classList.contains('open'),previous=this.modalReturnFocus;this.modal.classList.remove('open'); this.modal.innerHTML = ''; this.preview = null; this.last = performance.now();this.modalReturnFocus=null;if(wasOpen)(previous?.isConnected?previous:this.root?.querySelector('[data-action="pause"],button'))?.focus?.({preventScroll:true}); if(this.engine)this.updateAudio(); }
        talent(id){const sk=S[id];if(!sk)return;const cls=sk.cls;this.cls=cls;const roster=this.training&&this.engine?{...this.profile,heroes:this.engine.b.heroes}:this.profile;const h=roster.heroes[cls],r=h.ranks[id]||0;this.open(G.HonroUI.talent(roster,id),'detail '+(sk.ultimate?'ultimate-dialog':'talent-dialog'));
            this.preview=sk.passive?null:G.HonroSkillPreview.setup(this,id,h,$('previewcanvas'));
        }
        equip(id) { this.equipIncoming = id; this.open(`<h2>갖출 자리</h2><div class="slots">${[1, 2, 3].map(i => `<button class="slot filled" data-action="equip-confirm" data-slot="${i}"><div><strong>${S[this.profile.loadouts[this.cls][i]]?.name || '빈 자리'}</strong><small class="muted">${i + 1}번 자리</small></div></button>`).join('')}</div>`); }
        changeRank(id, delta, detail) { let h = this.profile.heroes[S[id].cls]; if (delta > 0) {
            if (!C.train(h, id))
                return;
        }
        else if (!C.untrain?.(h, id))
            return; C.sanitizeLoadout(this.profile, S[id].cls); this.saveCampAllocation(S[id].cls); if (detail) {
            this.cls = S[id].cls;
            this.showCamp(this.cls);
            this.talent(id);
        }
        else {
            let y = $('armory')?.scrollTop || 0;
            this.showCamp(this.cls);
            $('armory').scrollTop = y;
        }  }
        settings() { const p=this.profile,s=p.settings;const speedOptions=v=>[1,1.25,1.5,2,3,4].map(n=>`<option value="${n}" ${+v===n?'selected':''}>×${n}</option>`).join('');this.open(`<h2>설정</h2><div class="settings settings-grid"><button class="fullscreen-setting primary" data-action="fullscreen">${fa('expand',18)}<span>전체화면</span><b>${document.fullscreenElement?'나가기':'켜기'}</b></button><div class="setting"><label for="setting-sound">효과음</label><div class="row"><button data-action="sound-test">시험</button><input type="checkbox" id="setting-sound" data-setting="sound" ${s.sound?'checked':''}></div></div><div class="setting"><label for="setting-volume">음량</label><input type="range" id="setting-volume" data-setting="volume" min="0" max="1" step=".05" value="${s.volume}"></div><div class="setting"><label for="setting-music">배경음악</label><input type="checkbox" id="setting-music" data-setting="music" ${s.music!==false?'checked':''}></div><div class="setting"><label for="setting-musicVolume">BGM 음량</label><input type="range" id="setting-musicVolume" data-setting="musicVolume" min="0" max="1" step=".05" value="${s.musicVolume??.65}"></div><div class="setting"><label for="setting-difficulty">난이도</label><select id="setting-difficulty" data-setting="difficulty">${Object.entries(C.DIFFICULTIES).map(([k,v])=>`<option value="${k}" ${s.difficulty===k?'selected':''}>${v.name}</option>`).join('')}</select></div><div class="setting"><label for="setting-playerSpeed">우리 행동 속도</label><select id="setting-playerSpeed" data-setting="playerSpeed">${speedOptions(s.playerSpeed||1)}</select></div><div class="setting"><label for="setting-speed">적 행동 속도</label><select id="setting-speed" data-setting="speed">${speedOptions(s.speed||1)}</select></div><div class="setting minimap-setting"><label for="minimap-setting">미니맵 표시</label><input id="minimap-setting" type="checkbox" data-setting="minimapVisible" ${s.minimapVisible!==false?'checked':''}></div><div class="setting"><label for="setting-orientation">화면 방향</label><select id="setting-orientation" data-setting="orientation">${[['auto','자동'],['landscape','가로'],['portrait','세로']].map(([a,b])=>`<option value="${a}" ${s.orientation===a?'selected':''}>${b}</option>`).join('')}</select></div>${G.HONRO_EMBEDDED?'':`<div class="setting debug-setting"><label for="debug-mode-setting">디버그 모드</label><input id="debug-mode-setting" type="checkbox" data-setting="debugMode" ${this.debugMode?'checked':''}></div><p class="debug-help">같은 쉼터와 여정첩에서 모든 스테이지를 선택할 수 있습니다. 현재 기록을 복제해 진행하며 전투·성장 규칙은 같습니다. 검수 기록은 일반 저장에 남지 않고, 새로고침하거나 모드를 끄면 원래 기록으로 돌아옵니다.</p>`}</div><div class="actions"><button data-action="export">기록 내보내기</button>${this.debugMode?'':'<button data-action="import">가져오기</button>'}</div>${this.debugMode?'':'<div class="actions"><button class="danger ghost" data-action="newgame">새 여정</button></div>'}`,'settings-dialog'); }
        setMinimapVisible(visible) {
            visible=!!visible;
            this.profile.settings.minimapVisible=this.minimapVisible=visible;
            const dock=$('minimap-dock');if(dock)dock.hidden=!visible;
            if(visible&&this.engine)this.updateHUD(true);
            // View preferences persist in debug mode without writing debug progress.
            if(this.debugMode&&!G.HONRO_EMBEDDED&&!this.customMap){
                this.normalProfile.settings.minimapVisible=visible;
                if(!save(this.normalProfile))this.notify('미니맵 설정을 저장하지 못했습니다.');
            }else this.persist();
        }
        setDebugMode(enabled) {
            if(G.HONRO_EMBEDDED||enabled===this.debugMode)return;
            this.stopBattle();
            if(enabled){
                this.normalProfile=this.profile;
                this.normalProfile.settings.debugMode=true;
                this.persist();
                this.debugMode=true;
                this.profile=debugProfile(this.normalProfile);
            }else{
                this.debugMode=false;
                this.profile=this.normalProfile;
                this.profile.settings.debugMode=false;
                this.persist();
            }
            this.stageId=this.profile.lastStage||1;
            this.journeySelection=null;
            this.journeyLayer=null;
            this.showRest();
            this.notify(enabled?'디버그 모드 · 모든 스테이지를 검수할 수 있습니다.':'일반 여정으로 돌아왔습니다.');
        }
        journal() { G.HonroStory.journal(this); }
        recruit(st) { G.HonroProgression.recruit(this.profile,st,this.engine?.b); }
        launchMap(input,stageId,options={}) {
            const project=G.HonroMaps.normalize(input),map=project.stages.find(s=>s.id===(stageId||project.activeStageId));
            if(!map)throw Error('Stage not found '+stageId);
            const errors=G.HonroMaps.validate(project).filter(x=>x.level==='err');if(errors.length)throw Error(errors.map(x=>x.text).join('\n'));
            if(!map.units.some(u=>u.team==='player'))throw Error('플레이어 유닛을 먼저 배치하세요.');
            // Retry/results may already have released the engine. End the old
            // custom context first so its protected owner cannot become a QA copy.
            this.stopBattle();this.close();
            this.customMap={project,stageId:map.id,returnProfile:this.profile,returnStageId:this.stageId};
            const profileOverride=clone(options.profile||{});
            this.profile={...fresh(),...G.HonroMaps.profileFor(map),...profileOverride};
            this.profile.settings={...this.customMap.returnProfile.settings,...profileOverride.settings};
            this.stageId=map.metadata.stageId||1;this.training=false;
            this.stage={...H.stages[this.stageId-1],name:map.name,w:map.width,h:map.height,theme:map.backdrop};
            if(!map.metadata.campaign){this.stage={...this.stage,objective:'authored',goal:map.objectives.map(o=>o.label||o.type).join(' · ')||'맵 탐색',story:[],outro:[],storySummary:'작성한 목표를 달성했다.'};}
            const battle=G.HonroMaps.createBattle(map,project,this.profile);
            if(options.from==='selected'&&options.unitId){const u=battle.units.find(u=>u.id===options.unitId);if(u?.side===0)battle.active=u.id;else if(u)options={...options,from:'camera',camera:{x:u.x,y:u.y}};}
            if(options.from==='camera'&&options.camera){const u=battle.units.find(u=>u.id===battle.active),x=clamp(options.camera.x,30,battle.width-30),y=G.HonroMapEngine.surfaceY(battle.terrain,x,options.camera.y)?.y??options.camera.y;Object.assign(u,{x,y,spawnX:x,spawnY:y});}
            G.HonroStageRules.sanitizeStageBattle(battle);this.mount(battle);
            if(options.story!==false&&map.metadata.campaign)G.HonroRestJourney?G.HonroRestJourney.startEntry(this,map.name):G.HonroStory.start(this,G.HonroObjectives.entry(this),{title:map.name,after:'entry'});
            return this.engine;
        }
        launch(id = this.stageId, training = false, skill = null) {
            if(this.customMap&&!training&&id===this.stageId)return this.launchMap(this.customMap.project,this.customMap.stageId);
            if(!G.HonroSplitCampaign.allowLaunch(this,id,training))return;
            // Changing a training loadout rebuilds combat, but stays in the same musical session.
            const trainingMusic=training&&this.training&&this.engine&&this.screen==='battle'?(this.trainingMusicSession||this.engine.b.session):null;
            const st = G.HonroSplitCampaign.content(this.profile,id)||H.stages[id - 1];
            if(!st||!training&&!G.HONRO_PROJECT.stages.some(m=>m.metadata?.stageId===st.id)){this.notify('아직 준비되지 않은 길입니다.');return;}
            if (this.engine || this.customMap)
                this.stopBattle();
            this.close();
            if (!training && !this.isOpen(st)) {
                this.notify('아직 이어지지 않은 길이야.');
                return;
            }
            G.HonroSplitCampaign.prepareLaunch(this,id,training);
            this.stageId = st.id;
            this.training = training;
            this.stage = st;
            if(!training){if(st.act===2)G.HonroAct2.recruit(this.profile);G.HonroProgression.repairRecruits(this.profile);}
            const p = clone(this.profile);
            if (training) {
                p.recruited = ROSTER.slice();
                for (const c of ROSTER) {
                    p.heroes[c].xp = C.xpAtLevel(25);
                    p.heroes[c].ranks = {[C.baseSkill(c)]: 1};
                    for (const t of C.TALENTS.filter(t => t.cls === c)) {
                        if (!t.passive || this.trainingPassives[t.id])
                            p.heroes[c].ranks[t.id] = this.trainingRanks[t.id] || 1;
                        else
                            delete p.heroes[c].ranks[t.id];
                    }
                }
                p.loadouts[this.trainingClass] = [skill || this.trainingSkill];
            }
            if (!training) p.recruited = G.HonroSplitCampaign.legacy(this.profile,st.id)?G.HonroSplitCampaign.roster(st.id,1):G.HonroStageRules.stageParty(st.id);
            const battle=makeWorld(st, p, training, this.trainingClass, skill || this.trainingSkill);
            if(!training)battle.honroJourneyReplay=!!this.profile.cleared[st.id];
            if(!training)delete this.profile.honroCampPending;
            this.trainingMusicSession=training?(trainingMusic||battle.session):null;
            // 0.6.8 settles the campaign spawn once at creation and again at mount.
            // Preserve both passes: stage 5 contains overlapping terrain supports.
            if(!training)G.HonroStageRules.sanitizeStageBattle(battle);
            this.mount(battle);
            if(!training&&battle.honroSplit?.mode==='replay')this.notify('분할 재플레이 · 지난 분기 기록 없이 현재 성장과 입장 준비값으로 시작합니다.');
            if (!training) {
                this.profile.lastStage = st.id;
                this.profile.honroBattle = clone(this.engine.b);
                this.persist();
    const text = st.story.map(x => x.slice(0,2).join(' · ')).join('\n');
    const last = this.profile.record[this.profile.record.length - 1];
    if(!last || last.place !== st.name || last.text !== text){ this.profile.record.push({ place: st.name, text }); this.persist(); }
    if(G.HonroRestJourney)G.HonroRestJourney.startEntry(this,st.name);else G.HonroStory.start(this,G.HonroObjectives.entry(this),{title:st.name,after:'entry'});
            }
        }
        mount(b) { G.HonroStageRules.sanitizeStageBattle(b); G.HonroEncounters.configure(b);G.HonroProgression.initialize(b,this.profile);b.honroActiveLimit??=H.stages[(b.honroStage||1)-1].active;b.enemyLimit=b.honroActiveLimit;this.screen = 'battle'; this.contacts.clear(); this.acc = 0; this.engine = new C.Engine(b, ev => { this.scene?.event(ev); if (ev.type === 'sound')
            this.audio?.play(ev.name); if (ev.type === 'save')
            this.dirty = true; }, false); const e = this.engine; G.HonroAllies.attach(this,e); G.HonroEncounters.attach(this,e); G.HonroAct2.attach(this,e); G.HonroAct3.attach(this,e); G.HonroSplitCampaign.attach(this,e); G.HonroStakeCrossing.attach(this,e); if (!this.training) {
            e.checkEnd = () => this.checkMission(e);
            const orig = e.hurt.bind(e);
            e.hurt = (u, amount, ...args) => {
                if(args[0]){const src=e.unit(args[0]);if(src?.honroAlly&&(u.side===0||u.side===2))return;if(u.honroAlly&&src?.side===0)return;}
                if (u.id === 'boss' && e.b.terrain.some(t => t.honroSeal && !t.broken)) amount *= .20;
                if(e.b.honroStage===10&&u.id==='boss'&&!e.b.honroState?.sodanCoop){const floor=Math.ceil(u.maxHp*.36);amount=Math.min(amount,Math.max(0,u.hp-floor));}
                const before=u.hp,out=orig(u,amount,...args);if(e.b.honroStage===10&&u.id==='boss'&&!e.b.honroState?.sodanCoop&&u.hp<=0){u.hp=1;u.dead=false;}
                if(u.hp<before)this.scene?.focusUnit?.(u.id,720,false); return out;
            };
        } this.selected = e.active?.loadout?.includes(this.selectedByUnit[e.active.id]) ? this.selectedByUnit[e.active.id] : e.active?.loadout?.find(id => !S[id]?.passive) || 'A01'; if(e.active)this.selectedByUnit[e.active.id]=this.selected; this.power = e.active?.lastPower || .58; this.done = false; this.minimapVisible=this.profile.settings.minimapVisible!==false; this.root.innerHTML = `<main class="battle battle-screen" data-vertical="${b.height>b.width*1.08}"><div class="battle-view"><canvas id="battlecanvas"></canvas></div><header class="battle-head"><button class="icon" data-action="pause" aria-label="잠시 멈춤">${fa('pause',18)}</button><div class="battle-info"><div class="battle-title-row"><b>${this.training ? '허공터' : this.stage.name}</b>${this.debugMode?'<span class="debug-badge">디버그 · 기록 분리</span>':''}<span id="turn-text"></span></div><button type="button" id="objective-text" class="mission-help" data-action="battle-help" aria-haspopup="dialog" title="눌러서 목표·조작 안내">${this.training ? '적은 반격합니다 · 아군은 쓰러지지 않습니다' : this.stage.goal}</button><span id="objective-end-text" class="mission-end"></span></div></header><div class="minimap-dock" id="minimap-dock" ${this.minimapVisible?'':'hidden'}><canvas class="mini" id="minimap" aria-label="전장 미니맵"></canvas></div><div class="allied-roster" id="allied-roster" aria-label="동맹"></div><div class="event" id="event" hidden></div><div class="banter" id="banter" hidden></div>${this.training ? G.HonroTraining.toolbar(this) : ''}${G.HonroUI.bottom()}<aside id="stake-crossing-tools" class="stake-crossing-tools" aria-label="물길 횡단" hidden></aside><div id="dialogue-root"></div></main>`; this.scene = new G.HonroScene($('battlecanvas')); const u = e.active; this.scene.x = u?.x || 400; this.scene.y = (u?.y || 1000) - 170; this.scene.scale = innerWidth < 600 ? .82 : .94; if(b.height>b.width*1.08)this.scene.scale=Math.min(this.scene.scale,innerWidth<760?.68:.82); this.inputs(); G.HonroInteractions?.mount(this); this.updateAudio(); this.updateHUD(true); if(b.honroStory){G.HonroStory.start(this,b.honroStory.lines,b.honroStory);} }
        continue() { if (!this.profile.honroBattle) {
            this.showRest();
            return;
        } const b = clone(this.profile.honroBattle); if(b.honroRevision!==20){this.profile.honroBattle=null;this.notify('지형 물리가 교체되어 현재 스테이지 입구에서 다시 시작합니다. 성장 정보는 유지됩니다.');this.launch(b.honroStage||1);return;} this.stageId = b.honroStage || 1; this.stage = G.HonroSplitCampaign.content(this.profile,this.stageId)||H.stages[this.stageId - 1]; this.training = false; if(!this.customMap&&!G.HONRO_EMBEDDED){G.HonroStage7Reentry?.upgradeBattle(b);G.HonroPlatformPassages?.upgradeBattle(b);G.HonroProjectileTargets?.upgradeBattle(b);} this.mount(b); }
        checkMission(e) {
            const b = e.b;
            if (['won', 'lost'].includes(b.phase))
                return true;
            if(G.HonroStakeCrossing.recoverFailure(this))return false;
            const heroes = G.HonroAct3.active(b)?G.HonroAct3.heroes(b):b.units.filter(u => u.side === 0 && !u.summoned && !u.dead && u.hp > 0), objective = b.units.find(u => u.id === 'objective');
            const rescuedResidentLost=this.stage?.objective==='rescue3'&&(b.honroMarkers||[]).some(m=>m.action==='rescue'&&b.units.some(u=>u.id===m.target&&(u.dead||u.hp<=0)));
            const channelerLost=b.honroStage===10&&b.honroState?.sodanCoop&&b.units.some(u=>u.id==='boss'&&(u.dead||u.hp<=0));
            const act2Failure=G.HonroStakeCrossing.failure(b)||G.HonroSplitCampaign.failure(b)||G.HonroAct2.failure(b)||G.HonroAct3.failure(b)||G.HonroObjectives.failure(b,this.stage);
            if (!heroes.length || objective?.dead || rescuedResidentLost || channelerLost || act2Failure) {
                b.phase = 'lost';
                C.cleanupPassiveHistory(e);
                b.winnerReason = act2Failure || (objective?.dead || rescuedResidentLost || channelerLost ? '지켜야 할 이를 잃었다.' : '동행이 모두 쓰러졌다.');
                this.dirty = true;
                return true;
            }
            const st=this.stage,state=G.HonroObjectives.state(b,st);
            if(state.objectiveReady){b.honroState.objectiveReadyRound??=b.round;}else delete b.honroState.objectiveReadyRound;
            const win=G.HonroObjectives.state(b,st).complete;
            if (win) {
                b.phase = 'won';this.cancelInput();b.projectiles=[];b.volley=undefined;for(const u of b.units)delete u.meleeAction;
                C.cleanupPassiveHistory(e);
                b.winnerReason = st.storySummary || '길을 확보했다.';
                this.dirty = true;
                return true;
            }
            return false;
        }
        missionTick(dt){G.HonroStakeCrossing.tick(this);if(G.HonroLayouts.upgrade(this.engine.b)){this.scene.manual=false;this.updateHUD(true);this.profile.honroBattle=clone(this.engine.b);this.persist();}G.HonroAllies.missionTick(this,dt);}

        groundAt(x, oldY) { return G.HonroMapEngine.surfaceY(this.engine.b.terrain,x,oldY)?.y ?? Math.min(this.engine.b.height-140,oldY+8); }
        spawnWave(n) { let b = this.engine.b; for (let i = 0; i < n; i++) {
            let x = b.width - 190 - i * 100, y = this.groundAt(x, b.height - 700), u = C.makeEnemy({ role: 'bow', x, y }, b.terrain, C.STAGES[this.stage.id - 1], 100 + i);
            u.id = 'wave-' + b.round + '-' + i;
            u.honroType = i ? 'ghost' : 'human';
            u.name = i ? '행렬귀' : '봉인군';
            u.hp = u.maxHp = Math.round(u.maxHp * .75);
            u.attack *= .8;
            u.awake = true;
            u.aggroUntil = 999;
            u.group = 0;
            b.units.push(u);
        } }
        event(text) { if(!text)return;this.eventText=text;this.eventUntil=performance.now()+2300;this.dirty=true; }
        speakerUnits(who){return(this.engine?.b.units||[]).filter(v=>(v.side===0||v.honroAlly||v.honroCivilian)&&(v.name===who||v.side===0&&H.hero[v.cls]?.name===who));}
        canSpeak(who){if(!this.engine)return true;const units=this.speakerUnits(who),known=units.length||Object.values(H.hero).some(h=>h.name===who);return !known||units.some(u=>!u.dead&&u.hp>0);}
        focusSpeaker(who,duration=1700){if(!this.engine||!this.scene)return;const u=this.speakerUnits(who).find(v=>!v.dead&&v.hp>0);if(u)this.scene.focusUnit(u.id,duration,true);}
        say(who,text){if(this.canSpeak(who))G.HonroStory.queue(this,[[who,text]]);}
        sayLines(lines=[]){G.HonroStory.queue(this,lines);}
        startQueuedStory(){return G.HonroStory.drain(this);}
        nextBanter(){}
        drawBanter(){}
        tickBanter(){this.banterQueue=this.banterQueue.filter(q=>this.canSpeak(q.who));if(this.banterCurrent&&!this.canSpeak(this.banterCurrent.who))this.banterCurrent=null;}
        drawDialogue(){G.HonroStory.draw(this);}
        outcome(afterStory=false) {
            if(!afterStory&&this.engine?.b.phase==='won'&&!this.dialogue){this.cancelInput();if(G.HonroStory.start(this,(G.HonroObjectiveRevision?.contentFor(this.engine.b,this.stage)||this.stage).outro,{title:this.stage.name,after:'outcome'}))return;}
            if (this.done || !this.engine)
                return;
            this.done = true;
            this.cancelInput();
            const b = this.engine.b, won = b.phase === 'won', st = G.HonroObjectiveRevision?.contentFor(b,this.stage)||this.stage;
            if(won)G.HonroProgression.complete(b);
            G.HonroProgression.syncRoster(this.profile,b);
            delete this.profile.honroCampPending;
            this.profile.honroBattle = null;
            if (won) {
                const first = !this.profile.cleared[st.id];
                this.profile.cleared[st.id] = { visits: (this.profile.cleared[st.id]?.visits || 0) + 1, rounds: b.round };
                if (first) {
                    this.profile.record.push({ place: st.name, text: st.outro.filter(x=>G.HonroStory.allowed(this,x[0])).map(x => x.slice(0,2).join(' · ')).join('\n') });
                }
                this.recruit(st);
                this.profile.honroFlags['cleared-' + st.id] = true;
            }
            G.HonroSplitCampaign.outcome(this,won);
            G.HonroRestJourney?.recordOutcome(this,won);
            this.persist();
            this.open(`<div class="result-title">${won ? '길이 열렸다' : '길에서 물러났다'}</div><p>${won ? esc(b.winnerReason || st.storySummary || '길을 확보했다.') : esc(b.winnerReason || '얻은 경험은 남는다.')}</p><div class="result-team">${this.profile.recruited.map(c => `<div><strong>${H.hero[c].name}</strong><small>경지 ${C.levelOf(this.profile.heroes[c])}</small></div>`).join('')}</div>${won && st.id === 10 ? '<p>첫째 막 끝 · 북쪽 산길에서 둘째 막이 이어집니다.</p>' : won && st.id===20 ? '<p>둘째 막 끝 · 다음 목적지는 저문골·무명사 기록을 찾을 읍성 문서고입니다. 셋째 막으로 이어집니다.</p>' : won && st.id===30 ? '<p>셋째 막 끝 · 끊긴 옛 운송로와 장례길을 따라 무명사로 향합니다. 넷째 막은 준비 중입니다.</p>' : !won && st.act>=2 ? '<p>이 장을 다시 시작할 수 있습니다. 획득한 경험은 유지됩니다.</p>' : ''}<div class="actions"><button data-action="retry">다시 걷기</button><button class="primary" data-action="result-continue">${G.HonroRestJourney?.resultLabel(this)||'다음 쉼터로'}</button></div>`, 'result');
            this.audio?.play(won ? 'win' : 'lose');
        }
        battleHelp() {
            if(!this.engine||this.screen!=='battle'||this.dialogue)return;
            const help=G.HonroObjectives.help(this);
            this.open(`<h2>목표·조작 안내</h2><section class="battle-help-goal"><h3>${esc(this.training?'허공터':this.stage.name)}</h3><p class="battle-help-current">${esc(help.summary)}</p></section>${help.checklist?.length?`<section><h3>지금까지의 목표</h3><ol class="mission-checklist">${help.checklist.map(q=>`<li${q.done?' class="complete"':''}>${q.done?'✓ ':q.current?'현재 · ':''}${esc(q.text)}</li>`).join('')}</ol></section>`:''}${help.failureText?`<section><h3>실패 조건</h3><p>${esc(help.failureText)}</p></section>`:''}<section><h3>화면 둘러보기</h3><p>빈 전장을 드래그해 화면을 옮깁니다. 마우스 휠 또는 두 손가락 오므리기·벌리기로 축소·확대합니다. 미니맵을 누르거나 드래그하면 그 위치를 봅니다. 행동 가능한 동행 초상을 누르면 다시 따라갑니다.</p></section><section><h3>키보드</h3><p>← → / A D 이동 · ↑ ↓ 조준 각도 · Ctrl 도약<br>Space 누른 채 충전, 떼어 발사 · F 방어<br>Tab 행동 가능한 동행 전환 · 1–4 기예 선택 · E 상호작용</p></section><section><h3>발판과 사격</h3><p>발판은 아래·옆으로 쏜 탄을 통과시키고, 위에서 내려오는 탄을 막습니다. 진목·소환탄도 윗면에 닿으면 놓입니다. 벽과 동굴 천장은 모든 방향의 탄을 막으며, 반사 기예는 막힌 면에서 튕깁니다.</p></section><section><h3>터치</h3><p>왼쪽 조이스틱의 좌우로 이동하고 위아래로 조준합니다. 발사 버튼을 누른 채 충전하고 떼면 발사합니다. 도약·방어·동행·기예·상호작용은 화면의 해당 버튼을 누릅니다.</p></section><div class="actions"><button data-action="pause">일시정지 메뉴</button><button class="primary" data-action="close">돌아가기</button></div>`,'battle-help-dialog');
        }
        pause() { this.cancelInput(); this.open(`<h2>잠시 머무르기</h2><div class="pause-menu"><button class="primary" data-action="close">${fa('crosshairs',17)}<span>돌아가기</span></button><button data-action="settings">${fa('gear',17)}<span>설정</span></button><button data-action="battle-help"><span>목표·조작 안내</span></button><button data-action="journal"><span>대화와 장부 기록</span></button><button data-action="fullscreen">${fa('expand',17)}<span>전체화면</span></button><button data-action="retry">${fa('rotateRight',17)}<span>처음부터</span></button>${!this.debugMode&&G.HonroSplitCampaign.locked(this.profile)?'':`<button data-action="rest">${fa('map',17)}<span>길 위의 쉼터</span></button>`}<button data-action="map"><span>여정첩</span></button></div>`,'pause-dialog'); }
        defend() { if(!this.canInput()) return; this.cancelInput(); if(this.engine.active.retreat){this.engine.finishAction(true);this.updateHUD(true);return;} const u=this.engine.active; u.shield=Math.max(u.shield,Math.round(u.maxHp*.12));u.shieldUntil=this.engine.b.teamEnds[1]+1;u.hp=Math.min(u.maxHp,u.hp+Math.round(u.maxHp*.04));u.focus=Math.min(u.maxFocus,u.focus+Math.max(u.regen,Math.round(u.maxFocus*.12)));this.engine.fx('ring',u.x,u.y-u.h*.5,'#b8c999',60);this.engine.fx('text',u.x,u.y-u.h-16,'#d8d0a8',14,'방어');this.engine.message(`${u.name} · 숨을 고르며 방어`);this.engine.finishAction();this.updateHUD(true); }
        displayAngle(u) { return u.facing >= 0 ? u.angle : 180 - u.angle; }
        adjustAngle(u, v) { if (u.facing >= 0)
            u.angle = clamp(u.angle + v, C.AIM_MIN || -85, 90);
        else
            u.angle = 180 - clamp(this.displayAngle(u) + v, C.AIM_MIN || -85, 90); }
        canInput() { return this.engine && this.engine.canAct() && !this.modal.classList.contains('open') && !this.dialogue && !G.HonroStory.turnPaused(this) && !this.done; }
        beginCharge() { if(this.charging||this.engine?.active?.retreat)return false; if(!this.modal.classList.contains('open')&&!this.dialogue&&(this.engine?.detonateIceGourd()||this.engine?.manualDive()||this.engine?.turnArrow(this.scene?.turnTarget))){this.updateHUD(true);return false;} if (!this.canInput() || !this.engine.grounded(this.engine.active))
            return false; let u = this.engine.active, sk = S[this.selected]; if (!sk || sk.passive || !this.engine.skillAllowed(sk,u) || u.focus < this.engine.manaCost(sk, u,0) || this.engine.cooldownLeft(u, sk.id) > 0)
            return false; this.charging = true; this.chargeAt = performance.now(); this.power = 0; return true; }
        chargePower(now=performance.now()) { return this.engine.chargePower(this.engine.active,S[this.selected],Math.max(0,now-this.chargeAt)/1000); }
        playbackSpeed() { return clamp(Number(this.engine.b.side===1?this.profile.settings.speed:this.profile.settings.playerSpeed)||1,1,4); }
        releaseCharge() { if (!this.charging)
            return; this.charging = false; if (this.canInput()) {
            let u = this.engine.active;
            this.power = this.chargePower();
            u.lastPower = this.power;
            this.scene.turnTarget=undefined;this.engine.fire(this.selected, u.angle, this.power);
            this.scene.manual = false;
        } }
        jump() { if (this.canInput()) {
            this.engine.jump();
            this.scene.manual = false;
        } }
        cancelInput() { this.keys.clear(); this.charging = false; this.stick = { x: 0, y: 0 }; this.contacts.clear(); this.firePointer = null; const k = $('stick-knob'); if (k)
            k.style.transform = 'translate(0,0)'; }
        inputs() {
            const stick = $('joystick'), fire = $('fire'), jump = $('jump'), cv = $('battlecanvas');
            let sid = null;
            stick.onpointerdown = e => { e.preventDefault(); if (!this.canInput() || sid !== null)
                return; sid = e.pointerId; stick.setPointerCapture(sid); this.updateStick(e, stick); };
            stick.onpointermove = e => { if (e.pointerId === sid) {
                e.preventDefault();
                this.updateStick(e, stick);
            } };
            const endStick = e => { if (e.pointerId === sid) {
                sid = null;
                this.stick = { x: 0, y: 0 };
                $('stick-knob').style.transform = 'translate(0,0)';
            } };
            stick.onpointerup = endStick;
            stick.onpointercancel = endStick;
            stick.onlostpointercapture = endStick;
            fire.onpointerdown = e => { e.preventDefault(); if (this.beginCharge()) {
                this.firePointer = e.pointerId;
                fire.setPointerCapture(e.pointerId);
            } };
            fire.onpointerup = e => { if (e.pointerId === this.firePointer) {
                e.preventDefault();
                this.firePointer = null;
                this.releaseCharge();
            } };
            const cancelFire = e => { if(this.firePointer===e.pointerId){this.charging=false;this.firePointer=null;} };
            fire.onpointercancel = fire.onlostpointercapture = cancelFire;
            jump.onpointerdown = e => { e.preventDefault(); this.jump(); };
            G.HonroUnitInfo.bind(this);
            let lastPair = null, start = null, moved = false;
            const pos = e => { let r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }, pair = () => { const ps = [...this.contacts.values()]; return ps.length > 1 ? { x: (ps[0].x + ps[1].x) / 2, y: (ps[0].y + ps[1].y) / 2, d: Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y) } : null; };
            cv.onpointerdown = e => { e.preventDefault(); let p = pos(e);if(!this.modal.classList.contains('open')&&!this.dialogue&&this.engine?.turnArrow(this.scene.world(p.x,p.y))){this.updateHUD(true);return;} this.contacts.set(e.pointerId, p); cv.setPointerCapture(e.pointerId); if (this.contacts.size === 1) {
                start = p;
                moved = false;
            }
            else {
                lastPair = pair();
                G.HonroUnitInfo.close(this);
                moved = true;
            } };
            cv.onpointermove = e => { if(this.scene&&this.engine?.b.phase==='flight'&&e.pointerType!=='touch'){const q=pos(e);this.scene.turnTarget=this.scene.world(q.x,q.y);} if (!this.contacts.has(e.pointerId) || !this.scene)
                return; let p = pos(e), old = this.contacts.get(e.pointerId); this.contacts.set(e.pointerId, p); if (this.contacts.size > 1) {
                let q = pair();
                if (q && lastPair) {
                    this.scene.zoom(q.d / Math.max(1, lastPair.d), q.x, q.y);
                    this.scene.x -= (q.x - lastPair.x) / this.scene.scale;
                    this.scene.y -= (q.y - lastPair.y) / this.scene.scale;
                }
                lastPair = q;
                moved = true;
            }
            else {
                if (start && Math.hypot(p.x - start.x, p.y - start.y) > 7)
                    moved = true;
                if (moved) {
                    G.HonroUnitInfo.close(this);
                    this.scene.manual = true;
                    this.scene.x -= (p.x - old.x) / this.scene.scale;
                    this.scene.y -= (p.y - old.y) / this.scene.scale;
                }
            } };
            cv.onpointerup = e => { if (!moved && this.contacts.size === 1 && this.engine) {
                if(G.HonroUnitInfo.tap(this,pos(e),e.pointerType==='touch')){this.contacts.delete(e.pointerId);lastPair=null;return;}
                let p = pos(e), v = this.scene.world(p.x, p.y), u = this.engine.b.units.find(u => u.side === 0 && !u.summoned && !u.dead && Math.hypot(u.x - v.x, u.y - u.h * .5 - v.y) < u.h);
                if (u && this.canInput() && this.engine.select(u.id)) {
                    this.cancelInput();
                    this.selected = u.loadout.find(id => !S[id].passive) || this.selected;
                    this.scene.manual = false;
                    this.updateHUD(true);
                }
            } this.contacts.delete(e.pointerId); lastPair = null; };
            cv.onpointercancel = e => { this.contacts.delete(e.pointerId); lastPair = null; moved = true; };
            cv.addEventListener('wheel', e => { e.preventDefault(); let p = pos(e); this.scene.zoom(Math.exp(-e.deltaY * .0014), p.x, p.y); }, { passive: false });
            const minimap=$('minimap');let mapPointer=null;
            const panMap=e=>{if(this.dialogue||this.modal.classList.contains('open'))return;const r=minimap.getBoundingClientRect();this.scene.x=clamp((e.clientX-r.left)/r.width,0,1)*this.engine.b.width;this.scene.y=clamp((e.clientY-r.top)/r.height,0,1)*this.engine.b.height;this.scene.manual=true;};
            minimap.onpointerdown=e=>{if(e.button!==0||mapPointer!==null||this.dialogue)return;e.preventDefault();mapPointer=e.pointerId;minimap.setPointerCapture(mapPointer);panMap(e);};
            minimap.onpointermove=e=>{if(e.pointerId===mapPointer){e.preventDefault();panMap(e);}};
            const endMap=e=>{if(e.pointerId!==mapPointer)return;mapPointer=null;if(minimap.hasPointerCapture(e.pointerId))minimap.releasePointerCapture(e.pointerId);};
            minimap.onpointerup=minimap.onpointercancel=minimap.onlostpointercapture=endMap;
        }
        updateStick(e, el) { const r = el.getBoundingClientRect(), dx = (e.clientX - r.left - r.width / 2) / (r.width * .41), dy = (r.top + r.height / 2 - e.clientY) / (r.height * .41), len = Math.max(1, Math.hypot(dx, dy)); let x = dx / len, y = dy / len; const threshold = Math.abs(y) > .60 ? .50 : Math.abs(y) > .35 ? .28 : .15; this.stick.x = Math.abs(x) < threshold ? 0 : Math.sign(x) * (Math.abs(x) - threshold) / (1 - threshold); this.stick.y = Math.abs(y) < .12 ? 0 : Math.sign(y) * (Math.abs(y) - .12) / .88; $('stick-knob').style.transform = `translate(${x * r.width * .25}px,${-y * r.height * .25}px)`; }
        updateChargeDisplay(){
            const e=this.engine,u=(e?.active?.side===0&&!e.active.summoned?e.active:null)||e?.b.units.find(v=>v.side===0&&!v.summoned&&!v.dead),button=$('fire');if(!u||!button)return;
            const previous=this.engine.b.lastShots?.[u.id]?.power||0,power=this.charging?this.power:0;
            button.style.setProperty('--charge',power*100);button.style.setProperty('--previous',previous*100);button.style.setProperty('--charge-color',H.hero[u.cls]?.color||'#c8b17c');
            button.dataset.character=u.id;button.dataset.previous=previous;button.classList.toggle('charging',this.charging);
            const label=button.querySelector('.fire-label');if(label)label.textContent=this.engine.iceGourdReady()?'폭발':this.charging?Math.round(power*100)+'%':'발사';
            if(!button.disabled)button.title=previous?'이전 발사 '+Math.round(previous*100)+'%':'누른 채 충전, 손을 떼어 발사';
        }
        updateHUD(force = false) {
            const active=this.engine?.active;
            if(active){const remembered=this.selectedByUnit[active.id];if(remembered&&G.HonroStakeCrossing.skills(this.engine.b,active).includes(remembered))this.selected=remembered;if(!this.selectedByUnit[active.id])this.selectedByUnit[active.id]=this.selected||active.loadout.find(id=>!S[id]?.passive);}
            if (!this.engine || this.screen !== 'battle') return;
            const e=this.engine,b=e.b,u=(e.active?.side===0&&!e.active.summoned?e.active:null)||b.units.find(v=>v.side===0&&!v.summoned&&!v.dead)||b.units[0];
            if(!u)return;
            const id=G.HonroStakeCrossing.skills(b,u).includes(this.selected)?this.selected:u.loadout.find(id=>!S[id]?.passive);if(!this.charging)this.selected=id||this.selected;
            if(u.meleeFollow==='ready'&&!e.skillAllowed(S[this.selected],u))this.selected='S00';
            const combatSkills=u.meleeFollow==='ready'&&!u.loadout.includes('S00')?['S00',...u.loadout]:u.loadout;
            const sk=S[this.selected],cost=sk?e.manaCost(sk,u,this.power):0,cd=sk?e.cooldownLeft(u,sk.id):0;
            const players=b.units.filter(v=>v.side===0&&!v.summoned),sig=players.map(v=>[v.id,Math.round(v.hp),Math.round(v.focus),v.acted,v.dead].join(':')).join('|')+'|'+u.id+'|'+this.selected+'|'+b.round+'|'+u.meleeFollow+'|'+u.jucheonReady+'|'+u.harmony;
            if(force||sig!==this.hudSig){
                this.hudSig=sig;
                $('hero-switches').innerHTML=players.map(v=>`<button class="ally-chip player-chip ${v.id===b.active?'active':''} ${v.acted?'acted':''}" data-action="select-hero" data-id="${v.id}" ${v.dead?'disabled':''}>${this.portrait(v.cls)}<span><strong>${H.hero[v.cls].name}</strong><small>${Math.round(Math.max(0,v.hp)/v.maxHp*100)}%</small></span></button>`).join('');
                $('combat-skills').innerHTML=[0,1,2,3].map(i=>{const s=S[combatSkills[i]],r=s?e.cooldownLeft(u,s.id):0;return s?`<button class="skill-button ${s.id===this.selected?'selected':''} ${u.focus<e.manaCost(s,u)||r?'unaffordable':''}" style="--skill:${s.color}" data-action="combat-skill" data-skill="${s.id}" aria-label="${s.name}" ${e.skillAllowed(s,u)?'':'disabled title="파진연격 · 검술만 가능"'}><span class="key">${i+1}</span><span class="mana-cost">${r?r+'회':e.manaCost(s,u)||''}</span>${this.sig(s.id)}<span class="skill-name">${s.name}</span><span class="rank-tiny">${s.basic?'기본':s.capstone?'비기 '+(u.ranks?.[s.id]||1):s.ultimate?'비기':u.ranks?.[s.id]?'+'+u.ranks[s.id]:''}</span></button>`:`<button class="skill-button empty" disabled>—</button>`;}).join('');
                G.HonroStakeCrossing.refresh(this);
                this.drawPortraits();
            }
            const hero=b.heroes?.[u.cls],xp=$('hud-xp-fill'),xpBar=xp?.parentElement;if(hero&&xp){xp.style.width=(C.xpFraction(hero)*100)+'%';const level=C.levelOf(hero);xpBar.title=H.hero[u.cls].name+' · 경지 '+level+' · 경험치 '+Math.round(C.xpFraction(hero)*100)+'%';xpBar.setAttribute('aria-label',xpBar.title);xpBar.setAttribute('aria-valuenow',String(Math.round(C.xpFraction(hero)*100)));}
            $('hp-fill').style.width=(Math.max(0,u.hp)/u.maxHp*100)+'%';$('hp-label').textContent=Math.round(Math.max(0,u.hp))+' / '+u.maxHp;
            $('mp-fill').style.width=(u.focus/u.maxFocus*100)+'%';$('mp-label').textContent=Math.round(u.focus)+' / '+u.maxFocus;
            $('move-fill').style.width=(u.maxMove>0?clamp(u.moveLeft/u.maxMove*100,0,100):0)+'%';$('move-label').textContent=Math.round(Math.max(0,u.moveLeft))+' / '+Math.round(u.maxMove);
            const allies=b.units.filter(v=>v.honroAlly&&!v.dead),alSig=allies.map(v=>v.id+':'+Math.round(v.hp)+':'+Math.round(v.maxHp)).join('|');
            if(this.allySig!==alSig){this.allySig=alSig;$('allied-roster').innerHTML=allies.map(v=>`<span class="allied-chip" title="${v.name} · 동맹"><i></i><span>${v.name}</span><b style="--ally-hp:${Math.max(0,v.hp)/v.maxHp*100}%"></b><small>${Math.round(Math.max(0,v.hp))}</small></span>`).join('');}
            $('read-aim').textContent=`${Math.round(this.displayAngle(u))}° · ${Math.round(this.power*100)}%`;
            const turnLabel=G.HonroStory.turnLabel(b);$('turn-text').textContent=b.round+'턴'+(turnLabel?' · '+turnLabel:'');
            const wind=Math.max(-30,Math.min(30,b.wind)),fraction=Math.abs(wind)/30*50;
            $('wind-left').style.width=(wind<0?fraction:0)+'%';$('wind-right').style.width=(wind>0?fraction:0)+'%';$('wind-value').textContent=`바람 ${Math.abs(Math.round(b.wind))}`;$('joystick').querySelector('.wind-gauge').setAttribute('aria-valuenow',String(b.wind));
            const steering=e.iceGourdReady()||b.phase==='flight'&&b.projectiles.some(p=>p.skill==='A09'&&!p.turned&&!p.followup||p.owner===u.id&&p.mode==='warriorDive'&&!p.dived);
            $('fire').disabled=!steering&&(u.retreat||!e.skillAllowed(sk,u)||!this.canInput()||!e.grounded(e.active)||u.focus<e.manaCost(sk,u,0)||cd>0);$('fire').style.setProperty('--power',Math.round(this.power*100)+'%');$('fire').classList.toggle('charging',this.charging);
            this.updateChargeDisplay();
            $('jump').disabled=u.meleeFollow==='ready'||!this.canInput()||!e.grounded(e.active)||e.active.moveLeft<e.jumpCost(e.active);$('joystick').style.opacity=this.canInput()&&u.meleeFollow!=='ready'?1:.4;const defend=document.querySelector('[data-action=defend]');if(defend)defend.disabled=!this.canInput();
            G.HonroObjectives.refresh(this);
            G.HonroInteractions?.refresh(this);
            G.HonroCombatStatus.refresh(this,u);G.HonroCombatStatus.passives(this,u);
            this.tickBanter();const ev=$('event');ev.hidden=performance.now()>this.eventUntil;if(!ev.hidden)ev.textContent=this.eventText;
            // RC12: minimap draws the exact authored polygon geometry at the world aspect ratio.
            if(!this.minimapVisible)return;
            const mc=$('minimap'),ratio=b.width/b.height,mobile=innerWidth<620,maxW=mobile?118:152,maxH=innerHeight<550?86:(mobile?108:132);let cssW,cssH;
            if(ratio>=1){cssW=maxW;cssH=maxW/ratio;}else{cssH=maxH;cssW=maxH*ratio;}
            mc.style.setProperty('width',Math.round(cssW)+'px','important');mc.style.setProperty('height',Math.round(cssH)+'px','important');mc.style.aspectRatio=String(b.width)+' / '+String(b.height);const mw=mc.clientWidth||cssW,mh=mc.clientHeight||cssH,dpr=2;
            if(mc.width!==Math.round(mw*dpr)||mc.height!==Math.round(mh*dpr)){mc.width=Math.round(mw*dpr);mc.height=Math.round(mh*dpr);}
            const ctx=mc.getContext('2d'),cave=!!b.honroCaveEnvelope;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,mw,mh);ctx.fillStyle=cave?'#08090b':'#091b25d8';ctx.fillRect(0,0,mw,mh);
            const sx=mw/b.width,sy=mh/b.height;ctx.fillStyle=cave?'#4a4b50':'#435e58';
            for(const t of b.terrain){if(t.broken||t.mat==='barrel'||t.mat==='support')continue;const pts=t.vertices?.length?t.vertices:[{x:t.x,y:t.y},{x:t.x+t.w,y:t.y+(t.slope||0)},{x:t.x+t.w,y:t.y+t.h},{x:t.x,y:t.y+t.h}];ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x*sx,p.y*sy):ctx.moveTo(p.x*sx,p.y*sy));ctx.closePath();ctx.fill();}
            for(const v of b.units)if(!v.dead&&(!G.HonroAct2||G.HonroAct2.visible(b,v))){const side=this.engine.allegiance(v),player=side===0&&!v.summoned&&!v.enthrall&&!v.honroAlly&&v.side===0,ally=side===0||side===2,col=player?'#66cf8a':ally?'#e2bd5d':'#e15d57',rad=v.boss?3.8:v.elite?3.1:player?2.5:1.7;ctx.save();if(v.elite||v.boss){ctx.shadowColor=col;ctx.shadowBlur=v.boss?8:5;}ctx.fillStyle=col;ctx.beginPath();ctx.arc(v.x*sx,(v.y-v.h*.45)*sy,rad,0,Math.PI*2);ctx.fill();ctx.restore();}
            G.HonroObjectives.minimap(this,ctx,sx,sy);
            if(this.scene){const cv=$('battlecanvas'),viewW=cv.getBoundingClientRect().width/this.scene.scale,viewH=cv.getBoundingClientRect().height/this.scene.scale,x=(this.scene.x-viewW/2)*sx,y=(this.scene.y-viewH/2)*sy,w=viewW*sx,h=viewH*sy;ctx.strokeStyle='#ead39acc';ctx.lineWidth=1;ctx.strokeRect(x,y,Math.max(5,w),Math.max(5,h));}
        }
        async fullscreen() { try {
            if (!document.fullscreenElement)
                await document.documentElement.requestFullscreen?.({ navigationUI: 'hide' });
            else
                await document.exitFullscreen?.();
        }
        catch {
            this.notify('이 브라우저에서는 전체화면 전환이 제한돼.');
        } this.applyOrientation(); }
        async applyOrientation() { let pref = this.profile.settings.orientation; try {
            if (pref === 'auto')
                screen.orientation?.unlock?.();
            else
                await screen.orientation?.lock?.(pref);
        }
        catch { /* Unsupported orientation lock must not block gameplay or cover the settings. */ } }
        updateAudio(){
            // The battlefield owns its theme until we actually leave it, including
            // outro/result screens and ESC. Combat phase is not a navigation state.
            const b=this.engine?.b,inBattle=this.screen==='battle'&&!!b;
            const session=inBattle?(this.training?(this.trainingMusicSession||b.session):b.session):undefined;
            if(inBattle&&this.musicSession!==session){this.musicSession=session;this.bossMusicSeen=false;}
            if(inBattle&&!this.training&&b.honroStage===10&&b.units.some(u=>u.side===1&&!u.dead&&u.hp>0&&(u.boss||u.honroMidboss||u.honroFinalBoss)&&(u.awake||u.honroFinalBoss)))this.bossMusicSeen=true;
            this.audio?.update(inBattle?(this.bossMusicSeen?'boss':'battle'):'main',document.hidden,session);
            this.updateMusicLabel();
        }
        updateMusicLabel(){
            const label=this.musicLabel||(this.musicLabel=$('bgm-now-playing')),music=this.audio?.music;
            if(!label)return;
            // Report the audible stream, including the old track while the next one loads.
            const audio=music?.enabled&&!music.paused&&music.volume>0
                ?[music.current,music.outgoing].find(a=>a&&!a.paused&&!a.ended&&!a.muted&&!a.error&&a.readyState>=2&&a.volume>0):null;
            if(!audio){if(!label.hidden)label.hidden=true;return;}
            const source=audio.currentSrc||audio.src;
            if(source!==this.musicLabelSource){
                let name=source.split('/').pop().split(/[?#]/)[0];
                try{name=decodeURIComponent(name);}catch{/* Keep a malformed filename readable. */}
                label.textContent=`BGM · ${name.replace(/\.mp3$/i,'')}`;
                this.musicLabelSource=source;
            }
            if(label.hidden)label.hidden=false;
        }
        bind() {
            window.addEventListener('resize',()=>{if(this.screen==='rest')G.HonroRestJourney?.layoutRest();});
            document.addEventListener('visibilitychange',()=>this.updateAudio());
            // Game text is UI, not a document. Cancel selection, dragging and long-press menus throughout the app.
            for(const type of ['selectstart','dragstart','contextmenu'])document.addEventListener(type,e=>{if(e.target?.closest?.('#app,#modal'))e.preventDefault();},{capture:true,passive:false});
            document.addEventListener('selectionchange',()=>{const selection=window.getSelection();if(selection&&!selection.isCollapsed&&(this.root.contains(selection.anchorNode)||this.modal.contains(selection.anchorNode)))selection.removeAllRanges();});
            document.addEventListener('pointerdown', () => { this.audio?.configure(this.profile.settings); void this.audio?.wake?.(); }, { capture: true });
            document.addEventListener('keydown', e => { void this.audio?.wake?.(); if(this.dialogue){G.HonroStory.key(this,e);return;} if(this.screen==='title'&&!this.modal.classList.contains('open')&&(e.code==='ArrowDown'||e.code==='ArrowUp')){const buttons=[...this.root.querySelectorAll('.title-actions button:not([disabled])')],index=buttons.indexOf(document.activeElement);if(buttons.length){e.preventDefault();const next=index<0?(e.code==='ArrowDown'?0:buttons.length-1):(index+(e.code==='ArrowDown'?1:-1)+buttons.length)%buttons.length;buttons[next].focus({preventScroll:true});}return;} if (this.screen !== 'battle'&&!this.modal.classList.contains('open'))
                return; if (e.code === 'Escape') {
                e.preventDefault();
                if(this.scene?.inspectUnitId){G.HonroUnitInfo.close(this);return;}
                this.modal.classList.contains('open') ? this.close() : this.pause();
                return;
            } if(this.modal.classList.contains('open')){
                // Let focused dialog controls receive Space/Enter and scrolling
                // keys. Only wrap Tab at the dialog edges; do not run combat.
                if(e.code==='Tab'){
                    const items=[...this.modal.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')].filter(node=>!node.hidden&&node.getClientRects().length),i=items.indexOf(document.activeElement);
                    if(items.length&&(i<0||e.shiftKey&&i===0||!e.shiftKey&&i===items.length-1)){e.preventDefault();items[e.shiftKey?items.length-1:0].focus({preventScroll:true});}
                }
                return;
            } if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyE', 'ControlLeft', 'ControlRight', 'Space', 'Tab'].includes(e.code))e.preventDefault();
            if (this.dialogue) {
                if (e.code === 'Space' && !e.repeat)
                    this.nextDialogue();
                return;
            }
            if(e.code==='KeyF'){
                if(e.ctrlKey||e.altKey||e.metaKey||e.isComposing||e.target.isContentEditable)return;
                e.preventDefault();
                if(!e.repeat&&this.canInput()){this.cancelInput();this.defend();}
                return;
            }
            if(e.code==='KeyE'&&G.HonroInteractions?.key(this,e))return; this.keys.add(e.code); if (!e.repeat && e.code === 'Space')
                this.beginCharge(); if (!e.repeat && e.code.startsWith('Control'))
                this.jump(); if (!e.repeat && e.code === 'Tab') {
                let arr = this.engine.b.units.filter(u => u.side === 0 && !u.summoned && !u.dead && !u.acted), i = arr.findIndex(u => u.id === this.engine.b.active);
                if (arr.length)
                    this.selectHero(arr[(i + 1) % arr.length].id);
            } if (/^Digit[1-5]$/.test(e.code)) {
                let u = this.engine.active, id = e.code==='Digit5'&&G.HonroStakeCrossing.available(this.engine.b,u)?'M09':u?.loadout[+e.code.slice(-1) - 1];
                if (id) { this.cancelInput(); this.selected = id; this.selectedByUnit[u.id] = id; }
            } });
            document.addEventListener('keyup', e => { this.keys.delete(e.code); if (e.code === 'Space' && this.firePointer == null)
                this.releaseCharge(); });
            document.addEventListener('visibilitychange', () => { this.cancelInput(); if (document.hidden && this.engine && !this.done && !this.dialogue) {
                this.pause();
                this.dirty = true;
            } });
            window.addEventListener('blur', () => { this.cancelInput(); });
            document.addEventListener('click', e => { let el = e.target.closest('[data-action]'); if (!el || el.disabled)
                return; if(this.dialogue&&!['dialogue-next','dialogue-skip'].includes(el.dataset.action))return; const a = el.dataset.action, id = el.dataset.id, sk = el.dataset.skill;  switch (a) {
                case 'title':
                    this.showTitle();
                    break;

                case 'rest':
                    this.showRest();
                    break;
                case 'journey-book':
                    G.HonroRestJourney.showBook(this);
                    break;
                case 'journey-select':
                    G.HonroRestJourney.selectBook(this,id);
                    break;
                case 'journey-layer':
                    G.HonroRestJourney.showBook(this,this.journeySelection,el.dataset.layer);
                    break;
                case 'rest-talk':
                    G.HonroRestJourney.talk(this,el.dataset.class);
                    break;
                case 'journey-enter':
                    G.HonroRestJourney.requestLaunch(this,+id,'next');
                    break;
                case 'journey-replay':
                    G.HonroRestJourney.requestLaunch(this,+id,'replay');
                    break;
                case 'confirm-journey-launch':
                    G.HonroRestJourney.confirmLaunch(this);
                    break;
                case 'cancel-journey-launch':
                    this.pendingJourneyLaunch=null;this.close();
                    break;
                case 'result-continue':
                    if(this.customMap)this.showRest();else G.HonroRestJourney.resultContinue(this);
                    break;
                case 'map':
                    this.showMap();
                    break;
                case 'continue':
                    this.continue();
                    break;
                case 'camp':
                    this.showCamp();
                    break;
                case 'training':
                    if(!G.HonroSplitCampaign.allowLaunch(this,1,true))break;
                    this.trainingClass = 'archer';
                    this.trainingSkill = 'A01';
                    this.launch(1, true, 'A01');
                    G.HonroTraining.open(this);
                    break;
                case 'launch':
                    this.launch();
                    break;
                case 'hero':
                    this.showCamp(el.dataset.class);
                    break;
                case 'branch':
                    this.branch = +id;
                    this.showCamp();
                    break;
                case 'talent':
                    this.talent(sk);
                    break;
                case 'rank-plus':
                    this.changeRank(sk, 1, false);
                    break;
                case 'rank-minus':
                    this.changeRank(sk, -1, false);
                    break;
                case 'invest-stat':
                case 'refund-stat': {
                    const scroll=$('armory')?.scrollTop||0;
                    if(C.investStat(this.profile.heroes[this.cls],this.cls,a==='invest-stat'?1:-1)){
                        this.saveCampAllocation();this.showCamp(this.cls);if($('armory'))$('armory').scrollTop=scroll;
                    }
                    break;
                }
                case 'train':
                case 'rank-plus-detail':
                    this.changeRank(sk, 1, true);
                    break;
                case 'rank-minus-detail':
                    this.changeRank(sk, -1, true);
                    break;
                case 'autotrain':
                    C.autoTrain(this.profile.heroes[this.cls], this.cls);
                    C.sanitizeLoadout(this.profile, this.cls);
                    this.saveCampAllocation();
                    this.showCamp();
                    break;
                case 'reset-talents':
                    C.resetTalents(this.profile.heroes[this.cls], this.cls);
                    C.sanitizeLoadout(this.profile, this.cls);
                    this.saveCampAllocation();
                    this.showCamp();
                    break;
                case 'slot':
                    this.slotIndex = +el.dataset.slot;
                    this.open(`<h2>갖출 기예</h2><div class="slots">${C.knownSkills(this.profile.heroes[this.cls], this.cls).filter(id => !S[id].passive && id !== C.baseSkill(this.cls)).map(id => `<button class="slot filled" data-action="slot-choose" data-skill="${id}"><span class="sigil" style="--skill:${S[id].color}">${this.sig(id)}</span><div><strong>${S[id].name}</strong><small class="muted">기예</small></div></button>`).join('')}</div>`);
                    break;
                case 'slot-choose':
                    this.equipIncoming = sk;
                    this.equipConfirm(this.slotIndex);
                    break;
                case 'equip':
                    this.equip(sk);
                    break;
                case 'equip-confirm':
                    this.equipConfirm(+el.dataset.slot);
                    break;
                case 'close':
                    this.close();
                    break;
                case 'battle-help':
                    this.battleHelp();
                    break;
                case 'pause':
                    this.pause();
                    break;
                case 'defend':
                    this.defend();
                    break;
                case 'wait':
                    this.close();
                    this.defend();
                    break;
                case 'stake-retry':
                    G.HonroStakeCrossing.retry(this,'출발 상태로 다시 준비합니다.');break;
                case 'retry':
                    if(G.HonroStakeCrossing.active(this.engine?.b)&&!this.done){G.HonroStakeCrossing.retry(this,'현재 물길의 출발 상태로 다시 준비합니다.');break;}
                    if(this.engine&&!this.training&&!this.done){G.HonroProgression.syncRoster(this.profile,this.engine.b);this.persist();}
                    // Practice owns no campaign snapshot; restarting it must keep the suspended journey.
                    if(!this.training)this.profile.honroBattle = null;
                    this.engine = null;
                    this.launch(this.stageId, this.training, this.trainingSkill);
                    break;
                case 'result-map':
                    this.engine = null;
                    this.profile.honroBattle = null;
                    this.showMap();
                    break;
                case 'journal':
                    this.journal();
                    break;
                case 'settings':
                    this.settings();
                    break;
                case 'sound-test':
                    this.audio?.configure(this.profile.settings); this.audio?.wake?.(); this.audio?.play('boom');
                    break;
                case 'fullscreen':
                    this.fullscreen();
                    break;
                case 'export':
                    this.export();
                    break;
                case 'import':
                    if(this.debugMode)break;
                    $('file-import').click();
                    break;
                case 'import-map':
                    $('map-import').click();
                    break;
                case 'newgame':
                    if(this.debugMode)break;
                    this.open('<h2>새 여정</h2><p>이 작품의 현재 기록을 지우고 설오의 첫 길에서 다시 시작한다.</p><div class="actions"><button data-action="close">돌아가기</button><button class="primary" data-action="confirm-newgame">시작</button></div>');
                    break;
                case 'confirm-newgame':
                    if(this.debugMode)break;
                    this.engine = null;
                    this.stopBattle();
                    this.profile = fresh();
                    this.normalProfile = this.profile;
                    this.persist();
                    this.showTitle();
                    break;
                case 'select-hero':
                    this.selectHero(id);
                    break;
                case 'combat-skill':
                    // Battle HUD taps only select a skill. Detail modals belong to the camp/training UI.
                    this.cancelInput();
                    this.selected = sk;
                    if (this.engine?.active) {
                        this.selectedByUnit ??= {};
                        this.selectedByUnit[this.engine.active.id] = sk;
                    }
                    this.updateHUD(true);
                    break;
                case 'training-info':
                    this.talent(this.selected);
                    break;
                case 'training-reset':
                    this.launch(1, true, this.trainingSkill);
                    break;
                case 'dialogue-next':
                    this.nextDialogue();
                    break;
                case 'dialogue-skip':
                    G.HonroStory.finish(this);
                    break;

                case 'tuning':this.open('<h2>조율</h2><input type="range" min="0" max="1" step="0.05" id="tune" value="'+this.profile.tuning[this.cls]+'">');break;
            } });
            document.addEventListener('change', async (e) => { let el = e.target; if(el.id==='tune'){this.profile.tuning[this.cls]=+el.value;this.persist();} else if (el.dataset.setting) {
                let k = el.dataset.setting, v = el.type === 'checkbox' ? el.checked : el.type === 'range' ? +el.value : el.value;
                if(k==='debugMode'){this.setDebugMode(v);return;}
                if(k==='minimapVisible'){this.setMinimapVisible(v);return;}
                if (k === 'speed' || k === 'playerSpeed')
                    v = +v;
                this.profile.settings[k] = v;
                this.audio?.configure(this.profile.settings);
                if ((k === 'sound'||k === 'music') && v)
                    this.audio?.wake?.(); 
                if (k === 'difficulty' && this.engine && C.setDifficulty)
                    C.setDifficulty(this.engine.b, v);
                if (k === 'orientation')
                    this.applyOrientation();
                this.persist();
            }
            else if (el.id === 'map-import' && el.files[0]) {
                try {const project=JSON.parse(await el.files[0].text());this.launchMap(project,project.activeStageId);}
                catch(err){this.notify(err.message||'맵을 읽을 수 없습니다.');}
                el.value='';
            }
            else if (el.id === 'file-import' && el.files[0]) {
                try {
                    if(this.debugMode)throw Error('디버그 모드를 끈 뒤 기록을 가져오세요.');
                    let data = JSON.parse(await el.files[0].text());
                    if (data.game !== 'honro' || ![1,2,3,4].includes(data.schema) || !data.heroes || !Array.isArray(data.recruited) || !data.recruited.includes('archer'))
                        throw Error('혼로의 기록 파일이 아니야.');
                    this.engine = null;
                    const migrated=fresh(); Object.assign(migrated,data); migrated.schema=4; migrated.settings={...fresh().settings,...data.settings}; if(migrated.honroBattle?.honroRevision!==20)migrated.honroBattle=null; C.migrateSkills(migrated);
                    // Imported normal progress replaces the session, including
                    // any pending custom return owner, before persistence resumes.
                    this.stopBattle();
                    this.profile = migrated;
                    this.normalProfile = migrated;
                    G.HonroProgression.repairRecruits(this.profile);
                    G.HonroProgression.reconcileCampAllocations(this.profile);
                    this.persist();
                    this.showTitle();
                    this.notify('기록을 불러왔어.');
                }
                catch (err) {
                    this.notify(err.message || '기록을 읽을 수 없어.');
                }
                el.value = '';
            } });
        }
        selectHero(id) { const candidate=this.engine?.unit(id);if(candidate?.acted&&!candidate.dead){const status=G.HonroCombatStatus.effects(this.engine.b,candidate).join(' / ');this.notify(candidate.name+' · '+(candidate.stunnedRound===this.engine.b.round?status:'행동 완료 · '+(status||'다음 아군 턴에 행동할 수 있습니다')));return;} if (this.canInput() && this.engine.select(id)) {
            this.cancelInput();
            const u = this.engine.active;
            this.selected = u.loadout.includes(this.selectedByUnit[u.id]) ? this.selectedByUnit[u.id] : u.loadout.find(id => !S[id].passive); this.selectedByUnit[u.id]=this.selected;
            this.power = u.lastPower || .58;
            this.scene.manual = false;
            this.updateHUD(true);
        } }
        equipConfirm(i) { let id = this.equipIncoming, l = this.profile.loadouts[this.cls], j = l.indexOf(id), old = l[i]; l[i] = id; if (j >= 0 && j !== i) {
            if (old)
                l[j] = old;
            else
                l.splice(j, 1);
        } C.sanitizeLoadout(this.profile, this.cls); this.saveCampAllocation(); this.showCamp(); }
        nextDialogue(){G.HonroStory.next(this);}
        export() { if (this.engine && !this.training && !this.debugMode && !this.done) {
            G.HonroProgression.syncRoster(this.profile,this.engine.b);
            this.profile.honroBattle = clone(this.engine.b);
            G.HonroProgression.persist(this);
        } const blob = new Blob([JSON.stringify(this.debugMode?this.normalProfile:this.profile)], { type: 'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = '혼로_기록_' + new Date().toISOString().slice(0, 10) + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
        frame(now) {
            this.updateAudio();
            try {
                const dt = Math.min(.06, Math.max(0, (now - this.prev) / 1000));
                this.prev = now; G.HonroStory.tick(this,now);
                G.HonroRestJourney?.frame(this,dt);
                if(this.preview)G.HonroSkillPreview.tick(this,this.preview,dt);
                if (this.engine && this.scene && this.screen === 'battle') {
                    const e = this.engine;let simulated=0;
                    if(!this.modal.classList.contains('open')&&!this.dialogue&&['aim','enemy','ally','summon'].includes(e.b.phase))G.HonroStory.turn(this);
                    if (!this.modal.classList.contains('open') && !this.dialogue && !G.HonroStory.turnPaused(this,now) && !this.done) {
                        if (e.canAct()) {
                            let a = clamp((this.keys.has('ArrowUp') ? 1 : 0) - (this.keys.has('ArrowDown') ? 1 : 0) + this.stick.y, -1, 1);
                            if (a)
                                this.adjustAngle(e.active, a * dt * 62);
                            if (this.charging)
                                this.power = this.chargePower(now);
                        }
                        this.acc += dt * this.playbackSpeed();
                        // .06s frame cap × 4 speed × 120Hz needs up to 29 substeps.
                        e.planningBudget(4);
                        try{
                        for (let k = 0; k < 32 && this.acc >= 1 / 120; k++) {
                            if (e.canAct()) {
                                let x = clamp(((this.keys.has('ArrowRight')||this.keys.has('KeyD')) ? 1 : 0) - ((this.keys.has('ArrowLeft')||this.keys.has('KeyA')) ? 1 : 0) + this.stick.x, -1, 1);
                                if (Math.abs(x) > .01) {
                                    e.move(x, 1 / 120);
                                    this.scene.manual = false;
                                }
                            }
                            e.tick(1 / 120);
                            simulated+=1/120;
                            if(!this.dialogue)this.missionTick(1 / 120);
                            this.acc -= 1 / 120;
                            if(['aim','enemy','ally','summon'].includes(e.b.phase))G.HonroStory.turn(this);
                            if (this.dialogue||G.HonroStory.turnPaused(this)||['won', 'lost'].includes(e.b.phase)){this.acc=0;break;}
                        }
                        }finally{e.planningBudget();}
                        if (['won', 'lost'].includes(e.b.phase) && !this.training&&!this.dialogue)
                            this.outcome();
                    }
                    else
                        this.acc = 0;
                    const frozen=this.dialogue||G.HonroStory.turnPaused(this,now)||this.modal.classList.contains('open');
                    this.scene.render(e,this.dialogue||this.modal.classList.contains('open')?0:dt,this.selected,this.power,this.charging,frozen?0:this.charging?dt:simulated);
                    G.HonroUnitInfo.tick(this);
                    this.updateChargeDisplay();
                    this.uiAge += dt;
                    if (this.uiAge > .11) {
                        this.updateHUD();
                        this.uiAge = 0;
                    }
                    if (this.dirty && !this.training && !this.done && now - (this.lastSave || 0) > 1200) {
                        this.lastSave = now;
                        this.dirty = false;
                        G.HonroProgression.syncRoster(this.profile,e.b);
                        if (!this.done)
                            this.profile.honroBattle = clone(e.b);
                        this.persist();
                    }
                }
            }
            catch (err) {
                this.lastError = String(err.stack || err);
                console.error(err);
                if (!this.crashShown) {
                    this.crashShown = true;
                    this.notify('진행을 멈췄어. 오류 기록과 함께 새로고침해줘.');
                }
            }
            requestAnimationFrame(t => this.frame(t));
        }
    }
    G.HonroApp = new App();
    G.HONRO_TOOLS = { makeWorld, fresh, content: H, core: C };
})(globalThis);
