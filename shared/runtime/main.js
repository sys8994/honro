(function (G) {
    'use strict';
    const C = G.HONRO_CORE, H = G.HONRO_CONTENT, $ = id => document.getElementById(id), clone = x => JSON.parse(JSON.stringify(x)), clamp = (v, a, b) => Math.max(a, Math.min(b, v)), esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const KEY = 'honro-first-act-profile-1', ROSTER = ['archer', 'mage', 'knight', 'occultist'], BASE = C.STAGES.map(clone);
    const S = C.SKILLS, FA = G.HonroFA;
    // Display values own their DOM writes; unchanged values keep existing nodes.
    const setText=(node,value)=>{if(node.textContent!==String(value))node.textContent=value;};
    const setStyle=(node,name,value,priority='')=>{value=String(value);if(node.style.getPropertyValue(name)!==value||node.style.getPropertyPriority(name)!==priority)node.style.setProperty(name,value,priority);};
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
        C.sanitizeLoadout(p, c); p.saved = null; p.cleared = {}; p.party = ['archer']; p.recruited = ['archer']; p.lastStage = 1; p.mapNode = 1; p.schema = 4; p.game = 'honro'; p.seen = {}; p.record = []; p.honroFlags = {}; p.settings = { ...p.settings, orientation: 'auto', music: true, musicVolume: .65, speed: 1.5, playerSpeed: 1.5, sound: true, volume: .55, minimapVisible: true, debugTerrainOutline: false }; return p; }
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
            C.migrateSkills(p);
            migrateGrowth(p,x.revision||12);
            G.HonroCampaignMapRevision.discard(p);
            G.HonroProgression.repairRecruits(p);
            G.HonroProgression.reconcileCampAllocations(p);
            return p;
        }
    }
    catch { } return fresh(); }
    // Debug clones every campaign-owned value so
    // story, growth, allocations and a suspended battle use normal semantics.
    // This clone is session-only; only the normal profile is ever exported/saved.
    function debugProfile(normal) { return clone(normal); }
    function save(p) { if(G.HONRO_EMBEDDED)return false; try {
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
        constructor() { this.root = $('app'); this.modal = $('modal'); this.normalProfile = load(); this.debugMode = !!this.normalProfile.settings.debugMode && !G.HONRO_EMBEDDED; this.profile = this.debugMode ? debugProfile(this.normalProfile) : this.normalProfile; this.engine = null; this.scene = null; this.screen = 'title'; this.stageId = this.profile.lastStage || 1; this.cls = this.profile.recruited[0]; this.branch = 0; this.selectedByUnit = {}; this.selected = 'A01'; this.charging = false; this.power = .58; this.keys = new Set(); this.stick = { x: 0, y: 0 }; this.contacts = new Map(); this.audio = C.AudioEngine ? new G.HonroAudio() : null; this.audio?.configure(this.profile.settings); this.prev = performance.now(); this.acc = 0; this.uiAge = 0; this.dirty = false; this.dialogue = null; this.preview = null; this.trainingClass = 'archer'; this.trainingSkill = 'A01'; this.trainingPassives = {}; this.trainingRanks = {}; this.eventText = ''; this.eventUntil = 0; this.banterQueue=[]; this.banterCurrent=null; this.banterUntil=0; this.bind(); }
        persist() { if(G.HONRO_EMBEDDED||this.customMap)return; G.HonroMukjongAudio?.observe(this); G.HonroProgression.persist(this); G.HonroSplitCampaign?.persist(this); this.profile.party = [...this.profile.recruited]; if(this.debugMode)return; this.normalProfile=this.profile; if (!save(this.profile) && !this.storageWarned) {
            this.storageWarned = true;
            this.notify('이 환경에서는 자동 기록이 제한돼. 설정에서 기록 파일을 보관해줘.');
        } }
        notify(text) { let n = $('notice'); n.textContent = text; n.hidden = false; clearTimeout(this.noti); this.noti = setTimeout(() => n.hidden = true, 3200); }
        top(title, back = 'title') { return `<header class="top"><button class="icon ghost" data-action="${back}" aria-label="뒤로">${fa('chevronUp',17,'back-icon')}</button><h2>${esc(title)}</h2>${this.debugMode?'<span class="debug-badge">디버그 · 기록 분리</span>':''}<span class="grow"></span><button class="icon ghost" data-action="settings" aria-label="설정">${fa('gear',18)}</button></header>`; }
        portrait(cls, size = 1) { return G.HonroPortraits.markup(cls,'icon'); }
        drawPortraits() { for(const host of document.querySelectorAll('[data-portrait-host]')){const cls=host.dataset.portraitHost;G.HonroPortraits.mount(host,null,cls,{identity:H.hero[cls]?.name,surface:'hud',framing:host.dataset.portraitFraming||'icon',slot:host.dataset.portraitSlot});}for(const cv of document.querySelectorAll('canvas[data-portrait]'))G.HonroPortraits.draw(cv,null,cv.dataset.portrait,{identity:H.hero[cv.dataset.portrait]?.name,surface:'hud',framing:'icon'}); }
        showTitle() { this.stopBattle(); this.close(); this.screen = 'title'; G.HonroTitleMarkup.mount(this.root,{scene:G.HONRO_TITLE_SCENE,logo:G.HONRO_TITLE_LOGO,hanja:G.HONRO_TITLE_HANJA,profile:this.profile,debugMode:this.debugMode,splitLocked:G.HonroSplitCampaign.locked(this.profile),settingsIcon:fa('gear',19)}); }
        stopBattle() { this.audio?.skills?.stopAll();this.cancelOptionalWork();G.HonroCampaignEntry?.cancel(this); G.HonroAct3Void?.abort(this); G.HonroRestJourney?.stopMotion(this); if (this.engine && !this.training && !this.done) {
            G.HonroProgression.syncRoster(this.profile,this.engine.b);
            this.profile.honroBattle = clone(this.engine.b);
            this.persist();
        } this.engine = null; this.scene = null; this.keys.clear(); this.releaseStick(); this.charging = false; this.dialogue = null; this.banterQueue=[];this.banterCurrent=null; this.turnNotice=null;this.lastTurnNotice=null;this.storyCamera=null;document.body.classList.remove('story-lock');
          if(this.customMap){this.profile=this.customMap.returnProfile;this.stageId=this.customMap.returnStageId;this.customMap=null;}
        }
        isOpen(st) { return this.debugMode || st.requires.every(id => this.profile.cleared[id]); }
        showRest(){return G.HonroRestJourney.showRest(this);}
        showMap(){return G.HonroRestJourney.showBook(this);}

        prepareDebugCamp(){
            if(!this.debugMode||this.customMap||G.HONRO_EMBEDDED)return;
            this.profile.recruited=[...ROSTER];
            for(const cls of ROSTER){
                const h=this.profile.heroes[cls];
                if(!h.honroDebugSkills)for(const t of C.TALENTS.filter(t=>t.cls===cls))h.ranks[t.id]=Math.max(1,h.ranks[t.id]||0);
                h.honroDebugSkills=true;
                G.HonroProgression.markCampAllocation(this.profile,cls);
            }
        }

        showCamp(cls=this.cls){if(!G.HonroRestJourney.state(this.profile).restStageId&&G.HonroSplitCampaign?.redirectRest(this))return;const y=$('armory')?.scrollTop||0,details=this.root.querySelector('[data-camp-details="training"]')?.open;this.stopBattle();this.close();this.screen='camp';this.prepareDebugCamp();if(!this.profile.recruited.includes(cls))cls=this.profile.recruited[0];this.cls=cls;let html=G.HonroUI.camp(this.profile,cls,this.top('모닥불','rest'),this.branch).replace('id="camp-scroll"','id="armory"');if(this.debugMode)html=html.replace('</nav>','</nav>'+this.debugLevelMarkup(cls));if(G.HonroSkillImages)G.HonroSkillImages.patch(this.root,html);else this.root.innerHTML=html;this.drawPortraits();$('armory').scrollTop=y;const training=this.root.querySelector('[data-camp-details="training"]');if(training)training.open=!!details;G.HonroPlayerTurnOrder?.camp(this);}


        debugLevelMarkup(cls){const level=C.levelOf(this.profile.heroes[cls]);return `<div class="camp-resume-note debug-level-control"><label for="debug-hero-level">디버그 · ${esc(H.hero[cls].name)} 경지</label> <select id="debug-hero-level" data-debug-level="${cls}">${Array.from({length:C.levelOf(Number.MAX_SAFE_INTEGER)},(_,i)=>`<option value="${i+1}" ${level===i+1?'selected':''}>경지 ${i+1}</option>`).join('')}</select><p>기예는 자유롭게 선택합니다. 경지를 낮추면 능력치 수련을 해당 경지의 수련점 한도로 맞춥니다. 준비는 새 진입·다시 걷기에 적용됩니다.</p></div>`;}
        setDebugLevel(cls,value){
            if(!this.debugMode||this.customMap||G.HONRO_EMBEDDED||!ROSTER.includes(cls))return;
            const level=Number(value),max=C.levelOf(Number.MAX_SAFE_INTEGER);if(!Number.isInteger(level)||level<1||level>max)return;
            this.prepareDebugCamp();const h=this.profile.heroes[cls];h.xp=C.xpAtLevel(level);h.statTraining=Math.min(C.statTrainingRank(h),3+(level-1)*2);delete h.statRanks;
            this.saveCampAllocation(cls);this.showCamp(cls);
        }

        saveCampAllocation(cls=this.cls){G.HonroProgression.markCampAllocation(this.profile,cls);this.persist();}

        sig(id){return C.icon('skill:'+id,'',28);}

        open(html, kind = '') { G.HonroUnitInfo?.portraitClosed?.(this);this.cancelOptionalWork();G.HonroCampaignEntry?.cancel(this);this.modalKind=kind;this.cancelInput(); if(!this.modal.classList.contains('open')){const active=document.activeElement;this.modalReturnFocus=active?.matches?.('button,input,select,textarea,a[href],[tabindex]')?active:this.root?.querySelector('button');} const close=`<button class="close" data-action="close" aria-label="닫기">${fa('xmark',18)}</button>`;this.modal.innerHTML = `<section class="dialog ${kind}" role="dialog" aria-modal="true"${kind==='clear-report'?' aria-labelledby="clear-report-title"':html.includes('class="menu-fixed"')?' aria-labelledby="menu-title"':''}>${html.includes('class="skill-modal-title"')?html.replace('<div class="skill-modal-title">','<div class="skill-modal-title">'+close):html.includes('class="menu-fixed"')||html.includes('class="report-shell"')?html:close+html}</section>`; this.modal.classList.add('open'); this.drawPortraits(); this.updateAudio(); this.modal.querySelector('[data-action="close"]')?.focus({preventScroll:true}); }
        close() { G.HonroUnitInfo?.portraitClosed?.(this);this.cancelOptionalWork();G.HonroCampaignEntry?.cancel(this);this.modalKind='';this.pendingJourneyLaunch=null;const wasOpen=this.modal.classList.contains('open'),previous=this.modalReturnFocus;this.modal.classList.remove('open'); this.modal.innerHTML = ''; this.preview = null; this.last = performance.now();this.modalReturnFocus=null;if(wasOpen)(previous?.isConnected?previous:this.root?.querySelector('[data-action="pause"],button'))?.focus?.({preventScroll:true}); if(this.engine)this.updateAudio(); }
        dismissModal(){if(this.modalKind==='clear-report'){G.HonroClearReportUI.close(this);return;}if(this.modalKind==='journey-confirm'&&this.pendingJourneyLaunch){const returnMenu=this.pendingJourneyLaunch.returnMenu;this.pendingJourneyLaunch=null;if(returnMenu==='pause')this.pause();else this.close();return;}if(['settings-dialog','settings-help','pause-retry','menu-confirm'].includes(this.modalKind)){G.HonroMenuUI.back(this);return;}if(this.modalKind==='result')this.resultContinue();else if(this.equipReturn){const context=this.equipReturn;this.equipReturn=null;this.restoreTalent(context);}else this.close();}
        resultContinue(){if(this.resultDismissed||!this.modal.classList.contains('open'))return;if(G.HonroCampaignEntry?.defer(this,G.HonroCampaignEntry.next(this),()=>this.resultContinue()))return;this.resultDismissed=true;this.close();if(this.customMap)this.showRest();else G.HonroRestJourney.resultContinue(this);}
        talentContext(id){const dialog=this.modal.querySelector('.skill-modal-body')||this.modal.querySelector('.dialog');return {id,scroll:dialog?.scrollTop||0,armory:$('armory')?.scrollTop||0,canvas:$('previewcanvas'),preview:this.preview,action:document.activeElement?.dataset?.action};}
        restoreTalent(context){this.talent(context.id,context);const dialog=this.modal.querySelector('.skill-modal-body')||this.modal.querySelector('.dialog');if(dialog)dialog.scrollTop=context.scroll;if($('armory'))$('armory').scrollTop=context.armory;if(context.action)this.modal.querySelector(`[data-action="${context.action}"]`)?.focus({preventScroll:true});}
        cancelOptionalWork(){this.previewRequest=null;this.preview=null;this.trainingRequest?.node.remove();this.trainingRequest=null;}
        deferTraining(run){
            if(G.HonroTraining)return false;
            const prior=this.trainingRequest;
            if(prior?.running){prior.run=run;return true;}
            prior?.node.remove();
            const node=document.createElement('aside');node.className='campaign-loading';node.setAttribute('role','status');node.dataset.trainingLoad='';
            const request={node,run,profile:this.profile,screen:this.screen,root:this.root.firstElementChild,modal:this.modal.firstElementChild,running:false};this.trainingRequest=request;
            (this.modal.querySelector('.dialog')||document.body).append(node);
            const owns=()=>this.trainingRequest===request&&this.profile===request.profile&&this.screen===request.screen&&this.root.firstElementChild===request.root&&this.modal.firstElementChild===request.modal;
            const cancel=()=>{if(this.trainingRequest===request)this.trainingRequest=null;node.remove();};
            const start=()=>{if(!owns()){cancel();return;}request.running=true;node.replaceChildren(document.createTextNode('허공터를 준비하고 있습니다… '));const back=document.createElement('button');back.textContent='취소';back.onclick=cancel;node.append(back);
                G.HonroOptionalRuntime.load('training').then(()=>{if(!owns()){cancel();return;}cancel();request.run();},()=>{
                    if(!owns()){cancel();return;}request.running=false;node.replaceChildren(document.createTextNode('허공터를 불러오지 못했습니다. '));const retry=document.createElement('button');retry.textContent='다시 시도';retry.onclick=start;node.append(retry,back);
                });
            };start();return true;
        }
        startTraining(){
            if(!G.HonroSplitCampaign.allowLaunch(this,1,true))return;
            if(this.deferTraining(()=>this.startTraining()))return;
            this.trainingClass='archer';this.trainingSkill='A01';
            this.launch(1,true,'A01');G.HonroTraining.open(this);
        }
        prepareSkillPreview(id,h,canvas){
            if(!canvas)return;
            const request={id,canvas,dialog:this.modal.firstElementChild,profile:this.profile};this.previewRequest=request;
            const owns=()=>this.previewRequest===request&&this.profile===request.profile&&this.detailSkill===id&&this.modal.classList.contains('open')&&this.modal.firstElementChild===request.dialog&&canvas.isConnected&&$('previewcanvas')===canvas;
            const setup=()=>{if(!owns())return;this.previewRequest=null;this.preview=G.HonroSkillPreview.setup(this,id,h,canvas);};
            if(G.HonroSkillPreview){setup();return;}
            const status=document.createElement('p');status.dataset.previewLoad='';status.setAttribute('role','status');canvas.after(status);
            const start=()=>{if(!owns())return;status.textContent='미리보기 준비 중…';
                G.HonroOptionalRuntime.load('skill-preview').then(()=>{if(!owns())return;status.remove();setup();},()=>{
                    if(!owns())return;status.replaceChildren(document.createTextNode('미리보기를 불러오지 못했습니다. '));const retry=document.createElement('button');retry.textContent='다시 시도';retry.onclick=start;status.append(retry);
                });
            };start();
        }
        talent(id,context=null){const sk=S[id];if(!sk)return;const cls=sk.cls;this.cls=cls;const roster=this.training&&this.engine?{...this.profile,heroes:this.engine.b.heroes}:this.profile;const h=roster.heroes[cls];this.open(G.HonroUI.talent(roster,id),'detail '+(sk.ultimate?'ultimate-dialog':'talent-dialog'));
            this.detailSkill=id;
            const canvas=$('previewcanvas');
            if(context?.preview&&context.canvas&&canvas){canvas.replaceWith(context.canvas);this.preview=context.preview;this.preview.h=clone(h);return;}
            this.prepareSkillPreview(id,h,canvas);
        }
        canEquip(id){const s=S[id];return !!s&&s.cls===this.cls&&!s.passive&&!s.basic&&!s.enemyOnly&&C.knownSkills(this.profile.heroes[this.cls],this.cls).includes(id);}
        equip(id,slot){if(!this.canEquip(id))return;if(!this.equipReturn)this.equipReturn=this.modal.querySelector('.talent-dialog,.ultimate-dialog')?this.talentContext(id):null;this.equipIncoming=id;this.slotIndex=Number.isInteger(slot)&&slot>0&&slot<4?slot:Math.max(1,this.profile.loadouts[this.cls].indexOf(id));this.open(G.HonroUI.equipChoice(this.profile,this.cls,id,this.slotIndex),'equip-dialog');}
        chooseSlot(i,selected=''){if(!Number.isInteger(i)||i<0||i>3)return;if(i===0){this.talent(C.baseSkill(this.cls));return;}this.slotIndex=i;this.open(G.HonroUI.slotLibrary(this.profile,this.cls,i,selected),'equip-dialog');}
        unequip(i){if(!Number.isInteger(i)||i<1||i>3||!this.profile.loadouts[this.cls][i])return;const id=this.profile.loadouts[this.cls][i],context=this.equipReturn||(this.modal.querySelector('.talent-dialog,.ultimate-dialog')?this.talentContext(id):null);this.profile.loadouts[this.cls][i]='';C.sanitizeLoadout(this.profile,this.cls);this.saveCampAllocation();this.equipReturn=null;this.showCamp();if(context)this.restoreTalent(context);}
        changeRank(id, delta, detail) { let h = this.profile.heroes[S[id].cls]; if (delta > 0) {
            if (!C.train(h, id))
                return;
        }
        else if (!C.untrain?.(h, id))
            return; C.sanitizeLoadout(this.profile, S[id].cls); this.saveCampAllocation(S[id].cls); if (detail) {
            const context=this.talentContext(id);this.cls = S[id].cls;
            this.showCamp(this.cls);
            this.restoreTalent(context);
        }
        else {
            let y = $('armory')?.scrollTop || 0;
            this.showCamp(this.cls);
            $('armory').scrollTop = y;
        }  }
        settings(page='root') { G.HonroMenuUI.settings(this,page); }
        setDebugTerrainOutline(enabled) {
            if(!this.debugMode)return;
            const visible=!!enabled;this.profile.settings.debugTerrainOutline=visible;
            if(this.scene){this.scene.viewOptions??={};this.scene.viewOptions.debugTerrainOutline=visible;
                if(this.engine)this.scene.render(this.engine,0,this.selected,this.power,this.charging,0,true);}
            // Match minimap preference persistence without storing debug battles.
            if(!G.HONRO_EMBEDDED&&!this.customMap){
                this.normalProfile.settings.debugTerrainOutline=visible;
                if(!save(this.normalProfile))this.notify('지형 윤곽선 설정을 저장하지 못했습니다.');
            }else this.persist();
        }
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
            this.debugRestStage=null;
            this.journeySelection=null;
            this.journeyLayer=null;this.journeyAct=null;
            this.showRest();
            this.notify(enabled?'디버그 모드 · 모든 스테이지를 검수할 수 있습니다.':'일반 여정으로 돌아왔습니다.');
        }
        battleTitleMarkup() {
            if(this.training)return '<b>허공터</b>';
            const map=this.customMap?.project.stages.find(s=>s.id===this.customMap.stageId);
            const st=H.stages[this.stageId-1], campaign=!this.customMap||map?.metadata.campaign;
            const label=campaign&&st?`<small class="battle-chapter">${esc(st.act||1)}막 ${esc(st.actStage||st.id)}장</small>`:'';
            return `<span class="battle-stage-heading" title="${esc(this.stage.name)}">${label}<b>${esc(this.stage.name)}</b></span>`;
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
            G.HonroStageRules.sanitizeStageBattle(battle);this.mount(battle,{freshReport:true,reportScope:'custom'});
            if(options.story!==false&&map.metadata.campaign)G.HonroRestJourney?G.HonroRestJourney.startEntry(this,map.name):G.HonroStory.start(this,G.HonroObjectives.entry(this),{title:map.name,after:'entry'});
            return this.engine;
        }
        launch(id = this.stageId, training = false, skill = null) {
            if(this.customMap&&!training&&id===this.stageId)return this.launchMap(this.customMap.project,this.customMap.stageId);
            if(!G.HonroSplitCampaign.allowLaunch(this,id,training))return;
            if(training&&this.deferTraining(()=>this.launch(id,training,skill)))return;
            // Changing a training loadout rebuilds combat, but stays in the same musical session.
            const trainingMusic=training&&this.training&&this.engine&&this.screen==='battle'?(this.trainingMusicSession||this.engine.b.session):null;
            const st = G.HonroSplitCampaign.content(this.profile,id)||H.stages[id - 1];
            if(!st||!training&&!G.HONRO_PROJECT.stages.some(m=>m.metadata?.stageId===st.id)){this.notify('아직 준비되지 않은 길입니다.');return;}
            if(!training&&G.HonroCampaignEntry?.defer(this,id,()=>this.launch(id,training,skill)))return;
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
            if(!training){if(!this.customMap)G.HonroProgression.recruitAtEntry(this.profile,st.id);if(st.act===2)G.HonroAct2.recruit(this.profile);G.HonroProgression.repairRecruits(this.profile);}
            const p = clone(this.profile);
            if(!training&&this.honroRouteRetry){p._honroRouteRetry=clone(this.honroRouteRetry);this.honroRouteRetry=null;}
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
            if(!training&&battle.honroEntryVariant)delete this.profile.honroRouteHandoff;
            if(!training)battle.honroJourneyReplay=!!this.profile.cleared[st.id];
            if(!training){delete this.profile.honroCampPending;delete this.profile.honroMapRestart;}
            this.trainingMusicSession=training?(trainingMusic||battle.session):null;
            // 0.6.8 settles the campaign spawn once at creation and again at mount.
            // Preserve both passes: stage 5 contains overlapping terrain supports.
            if(!training)G.HonroStageRules.sanitizeStageBattle(battle);
            if(!training)delete this.profile.honroReportNotice;this.mount(battle,{freshReport:true,reportScope:training?'practice':this.debugMode?'debug':'campaign'});
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
        mount(b,{freshReport=false,reportScope}={}) { C.initializePlayerTurnOrder(b,this.profile,false); G.HonroAct3Void?.recover(b); this.stage=G.HonroObjectiveRevision?.contentFor(b,this.stage)||this.stage; G.HonroStageRules.sanitizeStageBattle(b); G.HonroEncounters.configure(b);G.HonroProgression.initialize(b,this.profile);C.applySpBalanceMigration(b);G.HonroClearReport.begin(b,{fresh:freshReport,scope:reportScope||G.HonroClearReport.scopeOf(this)});b.honroActiveLimit??=H.stages[(b.honroStage||1)-1].active;b.enemyLimit=b.honroActiveLimit;G.HonroStage19Farewell?.prepare(b);this.screen = 'battle'; this.contacts.clear(); this.acc = 0; this.engine = new C.Engine(b, ev => { if(this.engine?.b===b&&(ev.type==='change'||ev.type==='save'))G.HonroMukjongAudio?.observe(this);if(this.scene?._pausedBattleFrame)this.scene._pausedBattleFrame=null;this.scene?.event(ev); if (ev.type === 'sound')
            {if(ev.skillAudio)this.audio?.skills?.event(ev.skillAudio);else if(ev.name==='mukjongKeeper')G.HonroMukjongAudio?.keeper(this);else this.audio?.play(ev.name);} if (ev.type === 'save')
            this.dirty = true; }, false); const e = this.engine; G.HonroMukjongAudio?.attach(this,b,{fresh:freshReport}); G.HonroAllies.attach(this,e); G.HonroEncounters.attach(this,e); G.HonroAct2.attach(this,e); G.HonroAct3.attach(this,e); G.HonroSplitCampaign.attach(this,e); G.HonroStakeCrossing.attach(this,e); if (!this.training) {
            e.checkEnd = () => this.checkMission(e);
            const orig = e.hurt.bind(e);
            e.hurt = (u, amount, ...args) => {
                if(args[0]&&!e.projectileDamage(args[2])){const src=e.unit(args[0]);if(src?.honroAlly&&(u.side===0||u.side===2))return;if(u.honroAlly&&src?.side===0)return;}
                if (u.id === 'boss' && G.HonroQuestTargets.records(e.b).some(t => t.honroSeal && !t.broken)) amount *= .20;
                if(e.b.honroStage===10&&u.id==='boss'&&!e.b.honroState?.sodanCoop){const floor=Math.ceil(u.maxHp*.36);amount=Math.min(amount,Math.max(0,u.hp-floor));}
                const before=u.hp,out=orig(u,amount,...args);if(e.b.honroStage===10&&u.id==='boss'&&!e.b.honroState?.sodanCoop&&u.hp<=0){u.hp=1;u.dead=false;}
                if(u.hp<before&&!u.eaterCapturedBy)this.scene?.focusUnit?.(u.id,720,false); return out;
            };
        } G.HonroNarrativeRevision?.attach(this,e); G.HonroAct3Void?.attach(this,e); this.selected = e.active&&G.HonroStakeCrossing.skills(b,e.active).includes(this.selectedByUnit[e.active.id]) ? this.selectedByUnit[e.active.id] : e.active?.loadout?.find(id => !S[id]?.passive) || 'A01'; if(e.active)this.selectedByUnit[e.active.id]=this.selected; this.power = e.active?.lastPower || .58; this.done = false; this.minimapVisible=this.profile.settings.minimapVisible!==false; this.root.innerHTML = `<main class="battle battle-screen" data-vertical="${b.height>b.width*1.08}"><div class="battle-view"><canvas id="battlecanvas"></canvas></div><header class="battle-head"><button class="icon" data-action="pause" aria-label="잠시 멈춤">${fa('pause',18)}</button><div class="battle-info"><div class="battle-title-row">${this.battleTitleMarkup()}${this.debugMode?'<span class="debug-badge">디버그 · 기록 분리</span>':''}</div><div class="battle-objective-row"><span id="turn-text"></span><button type="button" id="objective-text" class="mission-help" data-action="battle-help" aria-haspopup="dialog" title="눌러서 목표·조작 안내">${this.training ? '적은 반격합니다 · 아군은 쓰러지지 않습니다' : this.stage.goal}</button></div><span id="objective-end-text" class="mission-end"></span></div></header><div class="minimap-dock" id="minimap-dock" ${this.minimapVisible?'':'hidden'}><canvas class="mini" id="minimap" aria-label="전장 미니맵"></canvas></div><div class="allied-roster" id="allied-roster" aria-label="동맹"></div><div class="banter" id="banter" hidden></div>${this.training ? G.HonroTraining.toolbar(this) : ''}${G.HonroUI.bottom()}<div id="dialogue-root"></div></main>`; this.scene = new G.HonroScene($('battlecanvas')); const u = e.active; this.scene.x = u?.x || 400; this.scene.y = (u?.y || 1000) - 170; this.scene.scale = innerWidth < 600 ? .82 : .94; if(b.height>b.width*1.08)this.scene.scale=Math.min(this.scene.scale,innerWidth<760?.68:.82); G.HonroAct3Void?.restoreRecoveredCamera(this); G.HonroReinforcementCamera?.prime(this.scene,b); G.HonroAttackCamera?.attach(this,e); this.inputs();this.audio?.skills?.prepareParty(b.units); G.HonroInteractions?.mount(this); this.updateAudio(); this.updateHUD(true); if(b.honroStory){G.HonroSodanWithdrawal.prepareWorldOutro(this);if(b.honroStory.after==='outcome')b.honroStory.lines=G.HonroSodanWithdrawal.outro(b,b.honroStory.lines);G.HonroStory.start(this,b.honroStory.lines,b.honroStory);} }
        routeContinue() {
            const target=G.HonroRouteBranches?.handoff(this.engine?.b)?.toStage;
            if(!this.done||!target)return;
            if(G.HonroCampaignEntry?.defer(this,target,()=>this.routeContinue()))return;
            if(G.HonroRouteBranches?.continueFrom(this,{replay:true})){const next=this.engine.b.honroRouteSpec.toStage;this.engine=null;this.profile.honroBattle=null;this.launch(next);}
        }
        retry() {
            if(!this.training&&G.HonroCampaignEntry?.defer(this,this.stageId,()=>this.retry()))return;
            if(!this.training)G.HonroRouteBranches?.retry(this);
            if(this.engine&&!this.training&&!this.done){G.HonroProgression.syncRoster(this.profile,this.engine.b);this.persist();}
            // Practice owns no campaign snapshot; restarting it keeps the suspended journey.
            if(!this.training)this.profile.honroBattle=null;
            this.engine=null;
            this.launch(this.stageId,this.training,this.trainingSkill);
        }
        continue() {
            if(G.HonroActEndings?.show(this))return;
            const target=G.HonroCampaignLoader?.destination(this.profile);
            if(target&&G.HonroCampaignEntry?.defer(this,target,()=>this.continue()))return;
            G.HonroCampaignMapRevision.discard(this.profile);
            const restart=this.profile.honroMapRestart;
            if(restart){this.engine=null;this.persist();this.launch(restart);this.notify('지형이 개편되어 현재 장 입구에서 다시 시작합니다. 성장과 장착은 유지됩니다.');return;}
            if(!this.profile.honroBattle){this.showRest();return;}
            const b=clone(this.profile.honroBattle);
            this.stageId=b.honroStage||1;
            this.stage=G.HonroSplitCampaign.content(this.profile,this.stageId)||H.stages[this.stageId-1];
            this.training=false;this.mount(b);
        }
        checkMission(e) {
            if(G.HonroAct3Void?.blocked(this)||G.HonroBellAnomaly?.blocked(this))return false;
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
                b.winnerReason = G.HonroNarrativeCatalogue.summary(b,st) || '길을 확보했다.';
                this.dirty = true;
                return true;
            }
            return false;
        }
        missionTick(dt){if(G.HonroAct3Void?.blocked(this)||G.HonroBellAnomaly?.blocked(this))return;G.HonroStakeCrossing.tick(this);if(G.HonroLayouts.upgrade(this.engine.b)){this.scene.manual=false;this.updateHUD(true);this.profile.honroBattle=clone(this.engine.b);this.persist();}G.HonroAllies.missionTick(this,dt);}

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
        // Tactical messages retain their last text for encounter deduplication,
        // but never create a toast/ack queue. Narration keeps the Story route.
        event(text,options={}) { if(!text)return;if(options.kind==='narration'&&this.engine&&!this.training){G.HonroStory.event(this,text,options);return;}this.eventText=text;this.eventUntil=0;this.dirty=true; }
        speakerUnits(who){return[...(this.engine?.b.units||[]),...(this.engine?.b.honroConvoyActors||[])].filter(v=>(v.side===0||v.honroAlly||v.honroCivilian)&&(v.name===who||v.side===0&&H.hero[v.cls]?.name===who));}
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
            // Guard before outro: completed saves must never reopen or resave.
            if(this.done||!this.engine)return;
            if(this.engine.b.phase==='won'&&!this.engine.b.honroReport?.final)G.HonroClearReport.finish(this);
            if(!afterStory&&this.engine?.b.phase==='won'&&!this.dialogue){G.HonroSodanWithdrawal.prepareWorldOutro(this);G.HonroActEndings?.preload(this,this.stage.id);this.cancelInput();if(G.HonroStory.start(this,G.HonroSodanWithdrawal.outro(this.engine.b,(G.HonroObjectiveRevision?.contentFor(this.engine.b,this.stage)||this.stage).outro),{title:this.stage.name,after:'outcome'}))return;}
            if (this.done || !this.engine)
                return;
            this.done = true;this.resultDismissed=false;
            this.cancelInput();
            const b = this.engine.b, won = b.phase === 'won', st = G.HonroObjectiveRevision?.contentFor(b,this.stage)||this.stage;this.resultJoined=[];
            // The immutable report settled XP before the outro; presentation never settles again.
            if(won&&!b.honroReport?.final)G.HonroProgression.complete(b);
            if(won&&!b.honroJourneyReplay){const handoff=G.HonroRouteBranches?.handoff(b);if(handoff)this.profile.honroRouteHandoff=handoff;}
            G.HonroProgression.syncRoster(this.profile,b);
            delete this.profile.honroCampPending;
            this.profile.honroBattle = null;
            if (won) {
                const first = !this.profile.cleared[st.id];
                G.HonroActEndings?.prepare(this,b,first);
                this.profile.cleared[st.id] = { visits: (this.profile.cleared[st.id]?.visits || 0) + 1, rounds: b.round, ...(G.HonroRouteBranches?.handoff(b)?{route:G.HonroRouteBranches.handoff(b)}:{}) };
                if (first) {
                    this.profile.record.push({ place: st.name, text: st.outro.filter(x=>G.HonroStory.allowed(this,x[0])).map(x => x.slice(0,2).join(' · ')).join('\n') });
                }
                const previousRecruits=new Set(this.profile.recruited);this.recruit(st);this.resultJoined=this.profile.recruited.filter(cls=>!previousRecruits.has(cls)).map(cls=>({cls,level:C.levelOf(this.profile.heroes[cls])}));
                this.profile.honroFlags['cleared-' + st.id] = true;
            }
            G.HonroSplitCampaign.outcome(this,won);
            G.HonroRestJourney?.recordOutcome(this,won);
            this.persist();
            if(won&&G.HonroActEndings?.show(this)){this.audio?.play('win');return;}
            this.open(`<header class="result-fixed"><div class="result-title">${won ? '길이 열렸다' : '길에서 물러났다'}</div></header><div class="result-body"><p>${won ? esc(b.winnerReason || st.storySummary || '길을 확보했다.') : esc(b.winnerReason || '얻은 경험은 남는다.')}</p>${won?G.HonroClearReportUI.summary(b.honroReport?.final,this.resultJoined):`<div class="result-team">${this.profile.recruited.map(c => `<div><strong>${H.hero[c].name}</strong><small>경지 ${C.levelOf(this.profile.heroes[c])}</small></div>`).join('')}</div>`}${won && st.id === 10 ? '<p>첫째 막 끝 · 북쪽 산길에서 둘째 막이 이어집니다.</p>' : won && st.id===20 ? '<p>둘째 막 끝 · 다음 목적지는 저문골·무명사 기록을 찾을 읍성 문서고입니다. 셋째 막으로 이어집니다.</p>' : won && st.id===30 ? '<p>셋째 막 끝 · 끊긴 옛 운송로와 장례길을 따라 무명사로 향합니다. 넷째 막은 준비 중입니다.</p>' : !won && st.act>=2 ? '<p>이 장을 다시 시작할 수 있습니다. 획득한 경험은 유지됩니다.</p>' : ''}</div><div class="actions result-actions"><button data-action="retry">다시 걷기</button>${won?'<button data-action="clear-report">상세 보고서</button>':''}${won&&b.honroJourneyReplay&&G.HonroRouteBranches?.handoff(b)?'<button data-action="route-continue">선택한 길로 다음 장</button>':''}<button class="primary" data-action="result-continue">${G.HonroRestJourney?.resultLabel(this)||'다음 쉼터로'}</button></div>`, 'result');
            this.audio?.play(won ? 'win' : 'lose');
        }
        battleHelp(fromSettings=false) {
            if(!this.engine||this.screen!=='battle'||this.dialogue)return;
            const help=G.HonroObjectives.help(this),hold=G.HonroAct2.active(this.engine.b)&&G.HonroAct2Art?.holdGuide(this.engine.b,G.HonroAct2.current(this.engine.b)),holdView=hold?'<button data-action="view-hold-zone">수비 범위 보기</button>':'';
            const html=`<h2>목표·조작 안내</h2><section class="battle-help-goal">${holdView}<h3>${esc(this.training?'허공터':this.stage.name)}</h3><p class="battle-help-current">${esc(help.summary)}</p>${help.guide&&help.guide!==help.summary?`<p>${esc(help.guide)}</p>`:''}</section>${help.checklist?.length?`<section><h3>지금까지의 목표</h3><ol class="mission-checklist">${help.checklist.map(q=>`<li${q.done?' class="complete"':''}>${q.done?'✓ ':q.current?'현재 · ':''}${esc(q.text)}</li>`).join('')}</ol></section>`:''}${help.failureText?`<section><h3>실패 조건</h3><p>${esc(help.failureText)}</p></section>`:''}<section><h3>화면 둘러보기</h3><p>빈 전장을 드래그해 화면을 옮깁니다. 마우스 휠 또는 두 손가락 오므리기·벌리기로 축소·확대합니다. 미니맵을 누르거나 드래그하면 그 위치를 봅니다. 행동 가능한 동행 초상을 누르면 다시 따라갑니다.</p></section><section><h3>키보드</h3><p>← → / A D 이동 · ↑ ↓ 조준 각도 · Ctrl 도약<br>Space 누른 채 충전, 떼어 발사 · F 방어<br>Tab 행동 가능한 동행 전환 · 1–4 기예 선택 · E 상호작용</p></section><section><h3>발판과 사격</h3><p>투사체와 폭발은 동행·동맹·보호 대상에게도 피해를 줍니다. 유도탄은 적을 추적하지만 앞을 가로막은 아군에게 맞을 수 있습니다. 회복·부적의 특수 효과는 기존 대상에게만 적용됩니다.</p><p>아래 화살표는 통과 가능한 발판 위에서만 사용할 수 있습니다. 잠깐 몸을 낮춘 뒤 아래층으로 내려갑니다. 단단한 땅에서는 사용할 수 없습니다.</p><p>발판은 아래·옆으로 쏜 탄을 통과시키고, 위에서 내려오는 탄을 막습니다. 진목·소환탄도 윗면에 닿으면 놓입니다. 벽과 동굴 천장은 모든 방향의 탄을 막으며, 반사 기예는 막힌 면에서 튕깁니다.</p></section><section><h3>터치</h3><p>왼쪽 조이스틱을 처음 위·아래 중심 ±20°로 밀면 제자리에서 조준합니다. 그 범위를 벗어나면 이동하며, 다시 들어오면 제자리에서 조준합니다. 크게 좌우로 밀면 바라보는 방향도 바뀝니다. 다른 방향으로 시작하면 계속 이동하며 조준합니다. 발사 버튼을 누른 채 충전하고 떼면 발사합니다. 도약·아래로 내려가기·방어·동행·기예·상호작용은 화면의 해당 버튼을 누릅니다.</p></section><div class="actions"><button data-action="pause">일시정지 메뉴</button><button class="primary" data-action="close">돌아가기</button></div>`;
            if(fromSettings)G.HonroMenuUI.shell(this,'목표·조작 안내',html.replace('<h2>목표·조작 안내</h2>','').replace(/<div class="actions">[\s\S]*$/, ''),{back:'settings-back',kind:'settings-help'});else this.open(html,'battle-help-dialog');
        }
        pause() { if(G.HonroAct3Void?.pause(this))return; this.audio?.music?.clearDucking?.();this.cancelInput(); G.HonroMenuUI.pause(this); }
        defend() { if(this.engine?.noncombatWalk())return; if(!this.canInput()||this.engine.active.platformDrop&&this.engine.active.platformDrop.phase!=='land') return; this.cancelInput(); if(this.engine.active.retreat){this.engine.finishAction(true);this.updateHUD(true);return;} const u=this.engine.active,hpBefore=u.hp,shieldBefore=u.shield; u.shield=Math.max(u.shield,Math.round(u.maxHp*.12));u.shieldUntil=this.engine.b.teamEnds[1]+1;u.hp=Math.min(u.maxHp,u.hp+Math.round(u.maxHp*.04));G.HonroClearReport.heal(this.engine.b,u,u.id,u.hp-hpBefore,'action:defend');G.HonroProgression.recordHeal(this.engine.b,u,u.id,u.hp-hpBefore);G.HonroProgression.shieldAdded(this.engine.b,u,u.id,shieldBefore);u.focus=Math.min(u.maxFocus,u.focus+Math.max(u.regen,Math.round(u.maxFocus*.12)));this.engine.fx('ring',u.x,u.y-u.h*.5,'#b8c999',60);this.engine.fx('text',u.x,u.y-u.h-16,'#d8d0a8',14,'방어');this.engine.message(`${u.name} · 숨을 고르며 방어`);this.engine.finishAction();this.updateHUD(true); }
        displayAngle(u) { return u.facing >= 0 ? u.angle : 180 - u.angle; }
        adjustAngle(u, v) { if(this.engine?.noncombatWalk())return; if (u.facing >= 0)
            u.angle = clamp(u.angle + v, C.AIM_MIN || -85, 90);
        else
            u.angle = 180 - clamp(this.displayAngle(u) + v, C.AIM_MIN || -85, 90); }
        canInput() { return !G.HonroAct3Void?.blocked(this) && !G.HonroBellAnomaly?.blocked(this) && this.engine && this.engine.canAct() && !this.modal.classList.contains('open') && !this.dialogue && !G.HonroStory.turnPaused(this) && !this.done; }
        beginCharge() { if(this.engine?.noncombatWalk())return false; if(this.charging||this.engine?.active?.retreat)return false; if(!this.modal.classList.contains('open')&&!this.dialogue&&(this.engine?.detonateIceGourd()||this.engine?.manualDive()||this.engine?.turnArrow(this.scene?.turnTarget))){this.updateHUD(true);return false;} if (!this.canInput() || !this.engine.grounded(this.engine.active))
            return false; let u = this.engine.active, sk = S[this.selected]; if (!sk || sk.passive || !this.engine.skillAllowed(sk,u) || u.focus < this.engine.manaCost(sk, u,0) || this.engine.cooldownLeft(u, sk.id) > 0)
            return false; this.charging = true; this.chargeAt = performance.now(); this.power = 0;this.audio?.skills?.startCharge(u,this.selected); return true; }
        chargePower(now=performance.now()) { return this.engine.chargePower(this.engine.active,S[this.selected],Math.max(0,now-this.chargeAt)/1000); }
        playbackSpeed() { return clamp(Number(this.engine.b.side===1?this.profile.settings.speed:this.profile.settings.playerSpeed)||1,1,4); }
        releaseCharge() { this.audio?.skills?.stopCharge();if(this.engine?.noncombatWalk()){this.charging=false;return;} if (!this.charging)
            return; this.charging = false; if (this.canInput()) {
            let u = this.engine.active;
            this.power = this.chargePower();
            u.lastPower = this.power;
            this.scene.turnTarget=undefined;this.engine.fire(this.selected, u.angle, this.power);
        } }
        jump() { if (this.canInput()) {
            if(this.engine.jump())G.HonroAttackCamera?.resume(this.scene);
        } }
        drop() { if(this.canInput()&&this.engine.canDrop()){this.cancelInput();if(this.engine.drop()){G.HonroAttackCamera?.resume(this.scene);this.updateHUD(true);}} }
        cancelInput() { this.audio?.skills?.stopCharge();this.restMotion?.scene?._restCamera?.cancel(); this.keys.clear(); this.charging = false; this.releaseStick(); this.contacts.clear(); this.firePointer = null; const k = $('stick-knob'); if (k)
            k.style.transform = 'translate(0,0)'; }
        inputs() {
            const stick = $('joystick'), fire = $('fire'), jump = $('jump'), cv = $('battlecanvas');
            stick.onpointerdown = e => {
                e.preventDefault();
                if (!this.canInput() || this.stickPointer) return;
                const r=stick.getBoundingClientRect();
                this.stickPointer={id:e.pointerId,originX:e.clientX,originY:e.clientY,
                    range:Math.min(r.width,r.height)*.41,unit:this.engine.active,round:this.engine.b.round};
                this.stick=C.joystickGesture(0,0,this.stickPointer.range);
                stick.setPointerCapture(e.pointerId);
                this.updateStick(e,stick);
            };
            stick.onpointermove = e => { if (e.pointerId === this.stickPointer?.id) {
                e.preventDefault(); this.updateStick(e,stick);
            } };
            const endStick = e => { if (e.pointerId === this.stickPointer?.id) this.releaseStick(); };
            stick.onpointerup = stick.onpointercancel = stick.onlostpointercapture = endStick;
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
                    this.scene.zoom(q.d / Math.max(1, lastPair.d), q.x, q.y, true);
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
                    G.HonroReinforcementCamera?.cancel(this.scene,true);
                    this.scene.manual = true;
                    this.scene.x -= (p.x - old.x) / this.scene.scale;
                    this.scene.y -= (p.y - old.y) / this.scene.scale;
                }
            } };
            cv.onpointerup = e => { if (!moved && this.contacts.size === 1 && this.engine) {
                if(G.HonroUnitInfo.tap(this,pos(e),e.pointerType==='touch')){this.contacts.delete(e.pointerId);lastPair=null;return;}
                let p = pos(e), v = this.scene.world(p.x, p.y), u = this.engine.b.units.find(u => u.side === 0 && !u.summoned && !u.dead && Math.hypot(u.x - v.x, u.y - u.h * .5 - v.y) < u.h);
                if (u) { this.selectHero(u.id); G.HonroUnitInfo.show(this,u); }
            } this.contacts.delete(e.pointerId); if(!this.contacts.size)G.HonroAttackCamera?.endGesture(this.scene); lastPair = null; };
            cv.onpointercancel = e => { this.contacts.delete(e.pointerId); if(!this.contacts.size)G.HonroAttackCamera?.endGesture(this.scene); lastPair = null; moved = true; };
            cv.addEventListener('wheel', e => { e.preventDefault(); let p = pos(e); this.scene.zoom(Math.exp(-e.deltaY * .0014), p.x, p.y); }, { passive: false });
            const minimap=$('minimap');let mapPointer=null;
            const panMap=e=>{if(this.dialogue||this.modal.classList.contains('open'))return;G.HonroReinforcementCamera?.cancel(this.scene,true);const r=minimap.getBoundingClientRect();this.scene.x=clamp((e.clientX-r.left)/r.width,0,1)*this.engine.b.width;this.scene.y=clamp((e.clientY-r.top)/r.height,0,1)*this.engine.b.height;this.scene.manual=true;};
            minimap.onpointerdown=e=>{if(e.button!==0||mapPointer!==null||this.dialogue)return;e.preventDefault();mapPointer=e.pointerId;minimap.setPointerCapture(mapPointer);panMap(e);};
            minimap.onpointermove=e=>{if(e.pointerId===mapPointer){e.preventDefault();panMap(e);}};
            const endMap=e=>{if(e.pointerId!==mapPointer)return;mapPointer=null;G.HonroAttackCamera?.endGesture(this.scene);if(minimap.hasPointerCapture(e.pointerId))minimap.releasePointerCapture(e.pointerId);};
            minimap.onpointerup=minimap.onpointercancel=minimap.onlostpointercapture=endMap;
        }
        releaseStick() {
            const pointer=this.stickPointer;
            this.stickPointer=null; this.stick={x:0,y:0};
            const el=$('joystick'),knob=$('stick-knob');
            if(knob)knob.style.transform='translate(0,0)';
            const label=el?.querySelector('.stick-mode');if(label)label.textContent='MOVE / AIM';
            if(pointer&&el?.hasPointerCapture?.(pointer.id))el.releasePointerCapture(pointer.id);
        }
        validateStick() {
            const p=this.stickPointer;
            if(p&&(!this.canInput()||this.engine.active!==p.unit||this.engine.b.round!==p.round))this.releaseStick();
        }
        updateStick(e, el) {
            this.validateStick();
            const p=this.stickPointer;if(!p||p.id!==e.pointerId)return;
            const previous=this.stick;
            this.stick=C.joystickGesture(e.clientX-p.originX,p.originY-e.clientY,p.range,previous);
            if(this.stick.facingIntent&&this.stick.facingIntent!==previous.facingIntent)
                this.engine.face(this.stick.facingIntent);
            const r=el.getBoundingClientRect();
            $('stick-knob').style.transform=`translate(${this.stick.visualX*r.width*.25}px,${-this.stick.visualY*r.height*.25}px)`;
            const label=el.querySelector('.stick-mode');
            if(label)label.textContent=this.stick.intent==='aimOnly'&&!this.stick.moving?'조준':this.stick.intent!=='undecided'?'MOVE-AIM':'MOVE / AIM';
        }
        updateChargeDisplay(){
            const e=this.engine,u=(e?.active?.side===0&&!e.active.summoned?e.active:null)||e?.b.units.find(v=>v.side===0&&!v.summoned&&!v.dead),button=$('fire');if(!u||!button)return;
            const previous=this.engine.b.lastShots?.[u.id]?.power||0,power=this.charging?this.power:0;
            setStyle(button,'--charge',power*100);setStyle(button,'--previous',previous*100);setStyle(button,'--charge-color',H.hero[u.cls]?.color||'#c8b17c');
            if(button.dataset.character!==u.id)button.dataset.character=u.id;if(button.dataset.previous!==String(previous))button.dataset.previous=previous;button.classList.toggle('charging',this.charging);
            const label=button.querySelector('.fire-label');if(label)setText(label,this.engine.iceGourdReady()?'폭발':this.charging?Math.round(power*100)+'%':'발사');
        }
        renderBattleFrame(e,dt,effectDt,paused){
            const scene=this.scene,canvas=scene.canvas,now=performance.now();
            // Only the ordinary pause menu owns a motionless base battlefield.
            // Dialogue/camera staging, previews, training and loading keep rendering.
            const stablePause=this.modalKind==='pause-dialog'&&this.modal.classList.contains('open')&&!this.dialogue&&!this.preview&&!this.training&&!this.customMap&&!this.done&&!G.HonroPaintedPresentation?.forBattle(e.b)&&
                !G.HonroReinforcementCamera?.active(scene)&&!scene.storyFrame&&!scene.storyTween&&!scene.storyFrozen&&!scene.goalFocus&&!scene.editorView&&!scene.skillPreview&&
                !(scene.focusUntil>now)&&!(scene.speakerUntil>now)&&dt===0&&effectDt===0&&paused&&
                G.HonroAuthoredFarArt?.ready(e.b.honroStage)&&document.fonts?.status==='loaded'&&!scene.ctx.isContextLost?.();
            const paint=()=>scene.render(e,dt,this.selected,this.power,this.charging,effectDt,paused);
            if(!stablePause){scene._pausedBattleFrame=null;return paint();}
            if(!scene._pauseContextListener){scene._pauseContextListener=true;for(const name of ['contextlost','contextrestored'])canvas.addEventListener(name,()=>{scene._pausedBattleFrame=null;});}
            const key=()=>{const r=canvas.getBoundingClientRect(),hud=document.querySelector('.honro-compact-hud')?.getBoundingClientRect(),mini=$('minimap')?.getBoundingClientRect();return [r.left,r.top,r.width,r.height,canvas.width,canvas.height,devicePixelRatio,innerWidth,innerHeight,hud?.top,mini?.left,mini?.top,mini?.bottom,scene.x,scene.y,scene.scale,scene.manual,scene.time,scene.walkTime,scene.hoverUnitId,scene.inspectUnitId,JSON.stringify(scene.missionTargets),
                e.b.active,e.b.phase,e.b.sceneVersion,scene._worldCacheKey(e.b,r.width),G.HonroVisualStyle?.key(),scene.viewOptions?.debugTerrainOutline,this.selected,this.power,this.charging].join('|');};
            const signature=key(),old=scene._pausedBattleFrame;
            if(old?.engine===e&&old.battle===e.b&&old.modal===this.modal.firstElementChild&&old.key===signature&&old.stable)return;
            paint();
            // Give normal raster/feedback preparation two matching paints before
            // retaining the existing canvas. No extra image/canvas is allocated.
            const next=key();scene._pausedBattleFrame={engine:e,battle:e.b,modal:this.modal.firstElementChild,key:next,stable:old?.engine===e&&old.battle===e.b&&old.modal===this.modal.firstElementChild&&old.key===signature&&signature===next};
        }
        updateSkillButtons(u,ids){
            const root=$('combat-skills'),e=this.engine,unused=new Set(root.children);
            ids=Array.from({length:4},(_,i)=>ids[i]);
            const states=ids.map(id=>{const s=S[id];return s?[id,s.name,s.color,e.cooldownLeft(u,id),e.manaCost(s,u),e.skillAllowed(s,u),u.focus<e.manaCost(s,u),id===this.selected]:[id];});
            const signature=JSON.stringify(states);if(root._skillSignature===signature&&root.children.length===4)return;root._skillSignature=signature;
            ids.forEach((id,i)=>{const s=S[id],key=s?.id||'empty-'+i;let button=[...root.children].find(n=>n.dataset.skillKey===key);
                if(!button){button=document.createElement('button');button.dataset.skillKey=key;button.className='skill-button';if(s)button.innerHTML='<span class="key"></span><span class="mana-cost"></span>'+this.sig(id)+'<span class="skill-name"></span>';else button.textContent='—';}
                unused.delete(button);if(root.children[i]!==button)root.insertBefore(button,root.children[i]||null);
                if(!s){button.className='skill-button empty';button.disabled=true;return;}
                const r=e.cooldownLeft(u,id),selected=id===this.selected,allowed=e.skillAllowed(s,u);
                button.classList.toggle('selected',selected);button.classList.toggle('unaffordable',!!(u.focus<e.manaCost(s,u)||r));
                const attr=(name,value)=>{if(button.getAttribute(name)!==value)button.setAttribute(name,value);};
                attr('data-action','combat-skill');attr('data-skill',id);attr('aria-label',s.name);attr('aria-pressed',String(selected));
                if(button.disabled===allowed)button.disabled=!allowed;if(!allowed)attr('title','파진연격 · 검술만 가능');else if(button.hasAttribute('title'))button.removeAttribute('title');
                if(button.style.getPropertyValue('--skill')!==s.color)button.style.setProperty('--skill',s.color);
                for(const [selector,value] of [['.key',String(i+1)],['.mana-cost',String(r?r+'회':e.manaCost(s,u)||'')],['.skill-name',s.name]]){const node=button.querySelector(selector);if(node.textContent!==value)node.textContent=value;}
            });for(const button of unused)button.remove();
        }
        updateHUD(force = false) {
            const active=this.engine?.active;
            if(active){const remembered=this.selectedByUnit[active.id];if(remembered&&G.HonroStakeCrossing.skills(this.engine.b,active).includes(remembered))this.selected=remembered;if(!this.selectedByUnit[active.id])this.selectedByUnit[active.id]=this.selected||active.loadout.find(id=>!S[id]?.passive);}
            if (!this.engine || this.screen !== 'battle') return;
            const e=this.engine,b=e.b;this.root.querySelector('.battle')?.classList.toggle('noncombat-walk',e.noncombatWalk());const u=(e.active?.side===0&&!e.active.summoned?e.active:null)||b.units.find(v=>v.side===0&&!v.summoned&&!v.dead)||b.units[0];
            if(!u)return;
            const id=G.HonroStakeCrossing.skills(b,u).includes(this.selected)?this.selected:u.loadout.find(id=>!S[id]?.passive);if(!this.charging)this.selected=id||this.selected;
            if(u.meleeFollow==='ready'&&!e.skillAllowed(S[this.selected],u))this.selected='S00';
            const combatSkills=u.meleeFollow==='ready'&&!u.loadout.includes('S00')?['S00',...u.loadout]:u.loadout;
            const sk=S[this.selected],cost=sk?e.manaCost(sk,u,this.power):0,cd=sk?e.cooldownLeft(u,sk.id):0;
            const players=b.units.filter(v=>v.side===0&&!v.summoned),sig=players.map(v=>[v.id,Math.round(v.hp),Math.round(v.focus),v.acted,v.dead].join(':')).join('|')+'|'+u.id+'|'+this.selected+'|'+b.round+'|'+u.meleeFollow+'|'+u.jucheonReady+'|'+u.harmony;
            if(force||sig!==this.hudSig){
                this.hudSig=sig;
                const heroSig=players.map(v=>[v.id,v.cls,Math.round(v.hp/v.maxHp*100),v.acted,v.dead,v.id===b.active].join(':')).join('|');if(this.heroSig!==heroSig||!$('hero-switches').children.length){this.heroSig=heroSig;$('hero-switches').innerHTML=players.map(v=>`<button class="ally-chip player-chip ${v.id===b.active?'active':''} ${v.acted||v.dead?'acted':''}" data-action="select-hero" data-id="${v.id}" aria-label="${H.hero[v.cls].name}${v.dead?' · 전투불능':''} · 선택">${this.portrait(v.cls)}<span><strong>${H.hero[v.cls].name}</strong><small>${Math.round(Math.max(0,v.hp)/v.maxHp*100)}%</small></span></button>`).join('');
                this.drawPortraits();}
            }
            this.updateSkillButtons(u,combatSkills);
            setStyle($('hp-fill'),'width',(Math.max(0,u.hp)/u.maxHp*100)+'%');setText($('hp-label'),Math.round(Math.max(0,u.hp))+' / '+u.maxHp);
            setStyle($('mp-fill'),'width',(u.focus/u.maxFocus*100)+'%');setText($('mp-label'),Math.round(u.focus)+' / '+u.maxFocus);
            setStyle($('move-fill'),'width',(u.maxMove>0?clamp(u.moveLeft/u.maxMove*100,0,100):0)+'%');setText($('move-label'),Math.round(Math.max(0,u.moveLeft))+' / '+Math.round(u.maxMove));
            const allies=b.units.filter(v=>v.honroAlly&&!v.dead),alSig=allies.map(v=>v.id+':'+Math.round(v.hp)+':'+Math.round(v.maxHp)).join('|');
            if(this.allySig!==alSig){this.allySig=alSig;$('allied-roster').innerHTML=allies.map(v=>`<span class="allied-chip" title="${v.name} · 동맹"><i></i><span>${v.name}</span><b style="--ally-hp:${Math.max(0,v.hp)/v.maxHp*100}%"></b><small>${Math.round(Math.max(0,v.hp))}</small></span>`).join('');}
            setText($('read-aim'),`${Math.round(this.displayAngle(u))}° · ${Math.round(this.power*100)}%`);
            const turnLabel=e.noncombatWalk()?'이동 · 대화':G.HonroStory.turnLabel(b);setText($('turn-text'),e.noncombatWalk()?turnLabel:b.round+'턴'+(turnLabel?' · '+turnLabel:''));
            const wind=Math.max(-30,Math.min(30,b.wind)),fraction=Math.abs(wind)/30*50;
            setStyle($('wind-left'),'width',(wind<0?fraction:0)+'%');setStyle($('wind-right'),'width',(wind>0?fraction:0)+'%');setText($('wind-value'),`바람 ${Math.abs(Math.round(b.wind))}`);$('joystick').querySelector('.wind-gauge').setAttribute('aria-valuenow',String(b.wind));
            const steering=e.iceGourdReady()||b.phase==='flight'&&b.projectiles.some(p=>p.skill==='A09'&&!p.turned&&!p.followup||p.owner===u.id&&p.mode==='warriorDive'&&!p.dived);
            $('fire').disabled=!steering&&(u.retreat||!e.skillAllowed(sk,u)||!this.canInput()||!e.grounded(e.active)||u.focus<e.manaCost(sk,u,0)||cd>0);setStyle($('fire'),'--power',Math.round(this.power*100)+'%');$('fire').classList.toggle('charging',this.charging);
            this.updateChargeDisplay();
            $('jump').disabled=u.meleeFollow==='ready'||!this.canInput()||!e.grounded(e.active)||e.active.moveLeft<e.jumpCost(e.active);$('joystick').style.opacity=this.canInput()?1:.4;const defend=document.querySelector('[data-action=defend]');if(defend)defend.disabled=!this.canInput()||!!u.platformDrop&&u.platformDrop.phase!=='land';const drop=$('drop');if(drop)drop.disabled=!this.canInput()||!e.canDrop(u);
            if(e.noncombatWalk()){setText($('move-left'),'이동');const mode=$('joystick').querySelector('.stick-mode');if(mode)setText(mode,'MOVE');$('joystick').setAttribute('aria-label','이동');}
            G.HonroObjectives.refresh(this);
            G.HonroInteractions?.refresh(this);
            G.HonroCombatStatus.refresh(this,u);G.HonroCombatStatus.passives(this,u);
            this.tickBanter();
            // RC12: minimap draws the exact authored polygon geometry at the world aspect ratio.
            if(!this.minimapVisible)return;
            const mc=$('minimap'),ratio=b.width/b.height,mobile=innerWidth<620,maxW=mobile?118:152,maxH=innerHeight<550?86:(mobile?108:132);let cssW,cssH;
            if(ratio>=1){cssW=maxW;cssH=maxW/ratio;}else{cssH=maxH;cssW=maxH*ratio;}
            setStyle(mc,'width',Math.round(cssW)+'px','important');setStyle(mc,'height',Math.round(cssH)+'px','important');setStyle(mc,'aspect-ratio',String(b.width)+' / '+String(b.height));const mw=mc.clientWidth||cssW,mh=mc.clientHeight||cssH,dpr=2;
            if(mc.width!==Math.round(mw*dpr)||mc.height!==Math.round(mh*dpr)){mc.width=Math.round(mw*dpr);mc.height=Math.round(mh*dpr);}
            const ctx=mc.getContext('2d'),cave=!!b.honroCaveEnvelope;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,mw,mh);ctx.fillStyle=cave?'#08090b':'#091b25d8';ctx.fillRect(0,0,mw,mh);
            const sx=mw/b.width,sy=mh/b.height;ctx.fillStyle=cave?'#4a4b50':'#435e58';
            for(const t of b.terrain){if(t.broken||t.mat==='barrel'||t.mat==='support')continue;const pts=t.vertices?.length?t.vertices:[{x:t.x,y:t.y},{x:t.x+t.w,y:t.y+(t.slope||0)},{x:t.x+t.w,y:t.y+t.h},{x:t.x,y:t.y+t.h}];ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x*sx,p.y*sy):ctx.moveTo(p.x*sx,p.y*sy));ctx.closePath();ctx.fill();}
            for(const v of b.units)if(!v.dead&&!v.eaterCapturedBy&&(!G.HonroAct2||G.HonroAct2.visible(b,v))){const side=this.engine.allegiance(v),player=side===0&&!v.summoned&&!v.enthrall&&!v.honroAlly&&v.side===0,ally=side===0||side===2,col=G.HonroNarrativeRevision?.bodyBound(b,v)?'#dac08d':player?'#66cf8a':ally?'#e2bd5d':'#e15d57',rad=v.boss?3.8:v.elite?3.1:player?2.5:1.7;ctx.save();if(v.elite||v.boss){ctx.shadowColor=col;ctx.shadowBlur=v.boss?8:5;}ctx.fillStyle=col;ctx.beginPath();ctx.arc(v.x*sx,(v.y-v.h*.45)*sy,rad,0,Math.PI*2);ctx.fill();ctx.restore();}
            G.HonroObjectives.minimap(this,ctx,sx,sy);
            if(this.scene){const rect=$('battlecanvas').getBoundingClientRect(),viewW=rect.width/this.scene.scale,viewH=rect.height/this.scene.scale,x=(this.scene.x-viewW/2)*sx,y=(this.scene.y-viewH/2)*sy,w=viewW*sx,h=viewH*sy;ctx.strokeStyle='#ead39acc';ctx.lineWidth=1;ctx.strokeRect(x,y,Math.max(5,w),Math.max(5,h));}
        }
        refreshFullscreen() { const label=this.modal.querySelector('[data-fullscreen-label]');if(label)label.textContent=document.fullscreenElement?'나가기':'켜기'; }
        async fullscreen() { const status=this.modal.querySelector('[data-fullscreen-status]');try {
            if (!document.fullscreenElement) {
                if(!document.documentElement.requestFullscreen)throw Error('unsupported');
                await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
            } else await G.HonroFullscreenInput.exit();
            if(status)status.textContent='';
            await this.applyOrientation();
        } catch { if(status)status.textContent='이 브라우저에서는 전체화면 전환이 제한됩니다.';else this.notify('이 브라우저에서는 전체화면 전환이 제한됩니다.'); }
            this.refreshFullscreen();
        }
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
            const b=this.engine?.b,inBattle=(this.endingGallery?.debug?.screen||this.screen)==='battle'&&!!b;
            const session=inBattle?(this.training?(this.trainingMusicSession||b.session):b.session):undefined;
            const stage=Number(b?.honroStage||this.stageId),act=stage>=11&&stage<=20?2:1;
            this.audio?.update(inBattle&&!this.engine.noncombatWalk()?'battle':'main',document.hidden||!!G.HonroAct3Void?.blocked(this),session,inBattle&&(stage===9||stage===10)?3:undefined,act);
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
                label.textContent='배경음 - '+G.HonroMusicTitles.titleFor(source);
                this.musicLabelSource=source;
            }
            if(label.hidden)label.hidden=false;
        }
        bind() {
            document.addEventListener('fullscreenchange',()=>this.refreshFullscreen());
            document.addEventListener('input',e=>{const k=e.target.dataset?.setting;if(k==='volume'||k==='musicVolume'){const output=this.modal.querySelector(`[data-volume-for="${k}"]`);if(output)output.textContent=Math.round(Number(e.target.value)*100)+'%';}});
            window.addEventListener('resize',()=>{if(this.screen==='rest')G.HonroRestJourney?.layoutRest();if(this.screen==='journey')document.querySelector('.journey-map-scroll')?._journeyResize?.();});
            document.addEventListener('visibilitychange',()=>{this.reportClock=null;if(document.hidden)this.cancelInput();this.updateAudio();});
            window.addEventListener('pagehide',()=>this.cancelInput());
            // Game text is UI, not a document. Cancel selection, dragging and long-press menus throughout the app.
            for(const type of ['selectstart','dragstart','contextmenu'])document.addEventListener(type,e=>{if(e.target?.closest?.('#app,#modal'))e.preventDefault();},{capture:true,passive:false});
            document.addEventListener('selectionchange',()=>{const selection=window.getSelection();if(selection&&!selection.isCollapsed&&(this.root.contains(selection.anchorNode)||this.modal.contains(selection.anchorNode)))selection.removeAllRanges();});
            // Touch/pen activate media on release, not pointerdown. Keep mouse startup
            // early and retry on click for keyboard/assistive and older touch paths.
            const wakeAudio=()=>{this.audio?.configure(this.profile.settings);void this.audio?.wake?.(true);void G.HonroMukjongAudio?.warm(this);};
            document.addEventListener('pointerdown', e => {if(e.pointerType==='mouse')wakeAudio();}, {capture:true});
            document.addEventListener('pointerup', e => {if(e.pointerType!=='mouse')wakeAudio();}, {capture:true});
            document.addEventListener('touchend', wakeAudio, {capture:true,passive:true});
            document.addEventListener('click', wakeAudio, {capture:true});
            document.addEventListener('keydown', e => { const records=this.screen==='journey'&&this.root.querySelector('.journey-records[open]');if(e.code==='Escape'&&records&&!this.modal.classList.contains('open')){e.preventDefault();records.open=false;records.querySelector('summary')?.focus();return;} if(this.modal.querySelector('.training-dialog'))return; if(G.HonroAct3Void?.key(this,e))return; void this.audio?.wake?.(true); if(this.dialogue){G.HonroStory.key(this,e);return;} if(this.screen==='title'&&!this.modal.classList.contains('open')&&(e.code==='ArrowDown'||e.code==='ArrowUp')){const buttons=[...this.root.querySelectorAll('.title-actions button:not([disabled])')],index=buttons.indexOf(document.activeElement);if(buttons.length){e.preventDefault();const next=index<0?(e.code==='ArrowDown'?0:buttons.length-1):(index+(e.code==='ArrowDown'?1:-1)+buttons.length)%buttons.length;buttons[next].focus({preventScroll:true});}return;} if (this.screen !== 'battle'&&!this.modal.classList.contains('open'))
                return; if (e.code === 'Escape') {
                e.preventDefault();
                if(this.scene?.inspectUnitId){G.HonroUnitInfo.close(this);return;}
                this.modal.classList.contains('open') ? this.dismissModal() : this.pause();
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
            } if (!this.engine.noncombatWalk()&&/^Digit[1-4]$/.test(e.code)) {
                let u = this.engine.active, id = u?.loadout[+e.code.slice(-1) - 1];
                if (id) { this.cancelInput(); this.selected = id;this.audio?.skills?.prepareSkill(id); this.selectedByUnit[u.id] = id; }
            } });
            document.addEventListener('keyup', e => { this.keys.delete(e.code); if (e.code === 'Space' && this.firePointer == null)
                this.releaseCharge(); });
            document.addEventListener('visibilitychange', () => { this.cancelInput(); if (document.hidden && this.engine && !this.done && !this.dialogue && !this.endingGallery?.debug) {
                this.pause();
                this.dirty = true;
            } });
            window.addEventListener('blur', () => { this.cancelInput(); });
            document.addEventListener('click', e => { if(e.target===this.modal)return; let el = e.target.closest('[data-action]'); if (!el || el.disabled)
                return; if(this.dialogue&&!['dialogue-prev','dialogue-next','dialogue-skip'].includes(el.dataset.action))return; const a = el.dataset.action, id = el.dataset.id, sk = el.dataset.skill; if(e.isTrusted&&((e.detail>0&&performance.now()<(this.journeyInputAfter||0))||(e.detail>1&&['journey-book','journey-travel','journey-enter','journey-replay','rest','confirm-journey-launch'].includes(a))))return; if(G.HonroPlayerTurnOrder?.handle(this,el,e))return; switch (a) {
                case 'title':
                    this.showTitle();
                    break;

                case 'rest':
                    G.HonroRestJourney.requestRest(this);
                    break;
                case 'act-ending-replay':
                    this.root.querySelector('.journey-records')?.removeAttribute('open');
                    G.HonroActEndings?.replay(this,Number(id));
                    break;
                case 'debug-act-ending-preview':
                    G.HonroActEndings?.previewDebug(this,Number(id));
                    break;
                case 'debug-journal-ending-preview':
                    G.HonroActEndings?.previewJournal(this,Number(id));
                    break;
                case 'journey-book':
                    G.HonroRestJourney.showBook(this);
                    break;
                case 'journey-select':
                    G.HonroRestJourney.selectBook(this,id);
                    break;
                case 'journey-act':
                    if(G.HonroRestJourney.actOpen(this.profile,+id,this.debugMode))G.HonroRestJourney.showBook(this,null,null,+id);
                    break;
                case 'journey-travel':
                    G.HonroRestJourney.travel(this,id);
                    break;
                case 'journey-image-retry':G.HonroJourneyImages.retry(this);break;
                case 'journey-fit':G.HonroRestJourney.fitBook(this);break;
                case 'journey-center':G.HonroRestJourney.revealBook(this);break;
                case 'journey-zoom': {const r=document.querySelector('.journey-map-scroll')?.getBoundingClientRect();if(r)G.HonroRestJourney.zoomBook(this,(this.journeyZoom||1)*(id==='in'?1.2:1/1.2),r.left+r.width/2,r.top+r.height/2);break;}
                case 'journey-layer':
                    G.HonroRestJourney.showBook(this,this.journeySelection,el.dataset.layer,this.journeyAct);
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
                    {const returnMenu=this.pendingJourneyLaunch?.returnMenu;this.pendingJourneyLaunch=null;if(returnMenu==='pause')this.pause();else this.close();}
                    break;
                case 'clear-report':
                    this.root.querySelector('.journey-records')?.removeAttribute('open');
                    G.HonroClearReportUI.open(this,id);
                    break;
                case 'result-continue':
                    this.resultContinue();
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
                    this.startTraining();
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
                    this.equipReturn=null;this.chooseSlot(+el.dataset.slot);
                    break;
                case 'slot-choose':
                case 'equip-select-skill':
                    this.chooseSlot(+(el.dataset.slot??this.slotIndex),sk);
                    break;
                case 'equip':
                    this.equip(sk);
                    break;
                case 'equip-select-slot':
                    this.equip(sk,+el.dataset.slot);
                    break;
                case 'equip-apply':
                    if(this.canEquip(sk)){this.equipIncoming=sk;this.equipConfirm(+el.dataset.slot);}
                    break;
                case 'equip-confirm':
                    this.equipConfirm(+el.dataset.slot);
                    break;
                case 'unequip-slot':
                    this.unequip(+el.dataset.slot);
                    break;
                case 'unequip-skill':
                    this.unequip(this.profile.loadouts[this.cls].indexOf(sk));
                    break;
                case 'close':
                    if(this.modalKind==='settings-dialog'||this.modalKind==='settings-help'){G.HonroMenuUI.closeSettings(this);break;}
                    if(this.modalKind==='pause-retry'){this.pause();break;}
                    if(this.modalKind==='menu-confirm'){G.HonroMenuUI.cancel(this);break;}
                    this.dismissModal();
                    break;
                case 'view-hold-zone':
                    this.close();G.HonroAct2Art.focusHold(this);break;
                case 'battle-help':
                    this.battleHelp();
                    break;
                case 'void-skip':
                    G.HonroAct3Void?.skip(this);
                    break;
                case 'void-leave':
                    G.HonroAct3Void?.abort(this);this.showTitle();
                    break;
                case 'pause':
                    this.pause();
                    break;
                case 'drop':
                    this.drop();
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
                    this.retry();
                    break;
                case 'route-continue':
                    this.routeContinue();
                    break;
                case 'result-map':
                    this.engine = null;
                    this.profile.honroBattle = null;
                    this.showMap();
                    break;
                case 'journal':
                    this.journal();
                    break;
                case 'settings-page':this.settings(id);break;
                case 'settings-back':G.HonroMenuUI.back(this);break;
                case 'settings-help':this.battleHelp(true);break;
                case 'retry-menu':G.HonroMenuUI.retry(this);break;
                case 'retry-confirm':G.HonroMenuUI.confirm(this,id);break;
                case 'menu-cancel':G.HonroMenuUI.cancel(this);break;
                case 'menu-confirm': {
                    const type=this.menuConfirmation?.type;this.menuConfirmation=null;
                    if(type==='import'){this.settings('records');$('file-import').click();}
                    else if(type==='newgame'){this.engine=null;this.stopBattle();this.profile=fresh();this.normalProfile=this.profile;this.persist();this.showTitle();}
                    else if(type==='segment')G.HonroStakeCrossing.retry(this,'출발 상태로 다시 준비합니다.');
                    else if(type==='battle')this.retry();
                    break;
                }
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
                    G.HonroMenuUI.confirm(this,'import');
                    break;
                case 'import-map':
                    $('map-import').click();
                    break;
                case 'newgame':
                    if(this.debugMode)break;
                    G.HonroMenuUI.confirm(this,'newgame');
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
                    G.HonroUnitInfo.close(this);
                    this.selectHero(id);
                    break;
                case 'inspect-hero':
                    this.cancelInput();
                    G.HonroUnitInfo.show(this,this.engine?.unit(id));
                    break;
                case 'combat-skill':
                    if(this.engine?.noncombatWalk())break;
                    // Battle HUD taps only select a skill. Detail modals belong to the camp/training UI.
                    this.cancelInput();
                    this.selected = sk;this.audio?.skills?.prepareSkill(sk);
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
                case 'dialogue-prev':
                    G.HonroStory.previous(this);
                    break;
                case 'dialogue-next':
                    this.nextDialogue();
                    break;
                case 'dialogue-skip':
                    G.HonroStory.finish(this);
                    break;

                case 'tuning':this.open('<h2>조율</h2><input type="range" min="0" max="1" step="0.05" id="tune" value="'+this.profile.tuning[this.cls]+'">');break;
            } });
            document.addEventListener('change', async (e) => { let el = e.target; if(el.dataset.debugLevel){this.setDebugLevel(el.dataset.debugLevel,el.value);} else if(el.id==='tune'){this.profile.tuning[this.cls]=+el.value;this.persist();} else if (el.dataset.setting) {
                let k = el.dataset.setting, v = el.type === 'checkbox' ? el.checked : el.type === 'range' ? +el.value : el.value;
                if(k==='debugMode'){this.setDebugMode(v);return;}
                if(k==='minimapVisible'){this.setMinimapVisible(v);return;}
                if(k==='debugTerrainOutline'){this.setDebugTerrainOutline(v);return;}
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
                const output=this.modal.querySelector(`[data-volume-for="${k}"]`);if(output)output.textContent=Math.round(v*100)+'%';
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
                    const migrated=fresh(); Object.assign(migrated,data); migrated.schema=4; migrated.settings={...fresh().settings,...data.settings}; C.migrateSkills(migrated); migrateGrowth(migrated,data.revision||12); G.HonroCampaignMapRevision.discard(migrated);
                    G.HonroProgression.repairRecruits(migrated);
                    G.HonroProgression.reconcileCampAllocations(migrated);
                    // Imported normal progress replaces the session, including
                    // any pending custom return owner, before persistence resumes.
                    this.stopBattle();
                    this.engine = null;
                    this.profile = migrated;
                    this.normalProfile = migrated;
                    this.persist();
                    this.showTitle();
                    this.notify('기록을 불러왔어.');
                }
                catch (err) {
                    this.notify(this.debugMode?'디버그 모드를 끈 뒤 기록을 가져오세요.':'기록 파일을 읽을 수 없습니다. 혼로에서 내보낸 JSON 파일인지 확인해 주세요.');
                }
                el.value = '';
            } });
        }
        selectHero(id) { const candidate=this.engine?.unit(id);if(candidate?.acted&&!candidate.dead){const status=G.HonroCombatStatus.effects(this.engine.b,candidate).join(' / ');this.notify(candidate.name+' · '+(candidate.stunnedRound===this.engine.b.round?status:'행동 완료 · '+(status||'다음 아군 턴에 행동할 수 있습니다')));return;} if (this.canInput() && this.engine.select(id)) {
            this.cancelInput();
            const u = this.engine.active;
            this.selected = G.HonroStakeCrossing.skills(this.engine.b,u).includes(this.selectedByUnit[u.id]) ? this.selectedByUnit[u.id] : u.loadout.find(id => !S[id].passive); this.selectedByUnit[u.id]=this.selected;
            this.power = u.lastPower || .58;
            G.HonroAttackCamera?.resume(this.scene);
            this.updateHUD(true);
        } }
        equipConfirm(i) {const id=this.equipIncoming;if(!Number.isInteger(i)||i<1||i>3||!this.canEquip(id))return;const l=this.profile.loadouts[this.cls],j=l.indexOf(id),old=l[i];if(j===i)return;l[i]=id;if(j>0)l[j]=old||'';C.sanitizeLoadout(this.profile,this.cls);this.saveCampAllocation();const context=this.equipReturn;this.equipReturn=null;this.showCamp();if(context)this.restoreTalent(context);}
        nextDialogue(){G.HonroStory.next(this);}
        export() { if (this.engine && !this.training && !this.debugMode && !this.done) {
            G.HonroProgression.syncRoster(this.profile,this.engine.b);
            this.profile.honroBattle = clone(this.engine.b);
            G.HonroProgression.persist(this);
        } const blob = new Blob([JSON.stringify(this.debugMode?this.normalProfile:this.profile)], { type: 'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = '혼로_기록_' + new Date().toISOString().slice(0, 10) + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
        frame(now) {
            if(this.endingGallery?.debug){this.prev=now;requestAnimationFrame(t=>this.frame(t));return;}
            this.updateAudio();
            try {
                const dt = Math.min(.06, Math.max(0, (now - this.prev) / 1000));
                this.prev = now;G.HonroClearReport.time(this,now);
                this.validateStick();
                if(G.HonroAct3Void?.blocked(this)){this.acc=0;G.HonroAct3Void.frame(this,dt);requestAnimationFrame(t=>this.frame(t));return;}
                if(G.HonroSodanWithdrawal.frame(this,dt)){requestAnimationFrame(t=>this.frame(t));return;}
                G.HonroStory.tick(this,now);
                G.HonroMukjongAudio?.update(this);
                G.HonroMukjongPitchDialogue?.tick(this);
                G.HonroRestJourney?.frame(this,dt);
                if(this.preview?.canvas.isConnected&&this.modal.classList.contains('open'))G.HonroSkillPreview.tick(this,this.preview,dt);
                if (this.engine && this.scene && this.screen === 'battle') {
                    const e = this.engine;let simulated=0;
                    if(!this.modal.classList.contains('open')&&!this.dialogue&&['aim','enemy','ally','summon'].includes(e.b.phase))G.HonroStory.turn(this);
                    if (!this.modal.classList.contains('open') && !this.dialogue && !G.HonroStory.turnPaused(this,now) && !this.done) {
                        if (e.canAct()) {
                            let a = clamp((this.keys.has('ArrowUp') ? 1 : 0) - (this.keys.has('ArrowDown') ? 1 : 0) + this.stick.y, -1, 1);
                            if (a)
                                this.adjustAngle(e.active, a * dt * 62);
                            if (this.charging)
                                {this.power = this.chargePower(now);this.audio?.skills?.updateCharge(this.engine.active,this.selected,(now-this.chargeAt)/1000,this.canInput());}
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
                                    if(e.active?.meleeFollow!=='ready')G.HonroAttackCamera?.resume(this.scene);
                                }
                            }
                            e.tick(1 / 120);
                            this.validateStick();
                            simulated+=1/120;
                            if(!this.dialogue&&!G.HonroAct3Void?.blocked(this))this.missionTick(1 / 120);
                            this.acc -= 1 / 120;
                            if(!G.HonroAct3Void?.blocked(this)&&['aim','enemy','ally','summon'].includes(e.b.phase))G.HonroStory.turn(this);
                            if (G.HonroAct3Void?.blocked(this)||this.dialogue||G.HonroStory.turnPaused(this)||['won', 'lost'].includes(e.b.phase)){this.acc=0;break;}
                        }
                        }finally{e.planningBudget();}
                        if (['won', 'lost'].includes(e.b.phase) && !this.training&&!this.dialogue)
                            this.outcome();
                    }
                    else
                        this.acc = 0;
                    const frozen=this.dialogue||G.HonroStory.turnPaused(this,now)||this.modal.classList.contains('open');
                    this.scene.viewOptions??={};this.scene.viewOptions.debugTerrainOutline=!!this.debugMode&&this.profile.settings.debugTerrainOutline===true;
                    this.renderBattleFrame(e,this.dialogue||this.modal.classList.contains('open')?0:dt,frozen?0:this.charging?dt:simulated,!!frozen||!!this.done);
                    G.HonroUnitInfo.tick(this);
                    this.uiAge += dt;
                    if (this.uiAge > .11) {
                        this.updateHUD();
                        this.uiAge = 0;
                    }else this.updateChargeDisplay();
                    if (this.dirty && !this.pendingJourneyLaunch && !this.training && !this.done && now - (this.lastSave || 0) > 1200) {
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
    const app=new App(),loader=G.HonroCampaignLoader,target=loader?.destination(app.profile);
    const finish=()=>{app.showTitle();G.HonroApp=app;requestAnimationFrame(t=>app.frame(t));loader?.prewarmNext(target);};
    // App.load/migrations above are authoritative; a read-only startup hint may
    // have selected a different chapter. Never enable the title until it agrees.
    G.HONRO_APP_READY=loader&&!loader.has(target)?loader.ensureStage(target).then(finish):Promise.resolve(finish());
    G.HONRO_TOOLS = { makeWorld, fresh, content: H, core: C };
})(globalThis);
