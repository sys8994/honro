    // Inserted only in the disposable ON web build. No browser global,
    // user-save authority, Workshop map, or externally callable permit issuer.
    const qa51=(()=>{
      /* FIRST_OWNER */
      /* FIFTY_OWNER */
      const descriptor=/* SIGNED_ASSET */;
      const stages=new Set([51,52]),active=new WeakMap(),inflight=new WeakMap(),permits=new WeakMap(),mounted=new WeakMap();
      const fingerprints=new Map(), manifest={rows:Object.create(null)};
      const owner=createFirstMissionOwner({C,manifest,fingerprint:value=>fingerprints.get(JSON.stringify(value)),
        verifyMounted:(app,e,source,d)=>{const s=active.get(app);return s?.b===e.b&&mounted.get(e)===source&&s.packet.mission===d;}});
      const same=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
      const check=(value,label)=>{if(!value)throw Error(label);};
      const sha=async bytes=>Array.from(new Uint8Array(await G.crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
      const routeBase=descriptor.basePath??'/',rtPath=Object.freeze([routeBase,routeBase+'HONRO.html',routeBase+'index.html']);
      function pathAt(path){return (descriptor.basePath??'/')+String(path).replace(/^\//,'');}
      const urlAt=(path)=>new URL(pathAt(path),descriptor.origin);
      const runtime=app=>G.isSecureContext&&G.location.origin===descriptor.origin&&rtPath.includes(G.location.pathname)&&!G.HONRO_EMBEDDED&&G.HONRO_PROJECT_MODE!=='full'&&!app.debugMode&&!app.training&&!app.customMap&&!app.endingGallery&&!app.profileStore.locked;
      function eligible(app,id){
        if(!runtime(app)||!stages.has(id))return false;
        const p=app.profile;
        if(id===51)return app.screen==='title'&&!app.engine&&p===app.normalProfile&&!p.honroBattle&&!p.honroActEnding&&!p.honroMapRestart&&!p.honroCampPending&&!(p.lastStage>1)&&Object.keys(p.cleared||{}).length===0;
        const s=active.get(app);
        return app.screen==='battle'&&!!s&&s.b.honroStage===51&&app.engine===s.engine&&s.b.phase==='won'&&app.done&&s.terminal?.stage===51&&s.terminal.flags['act6.threeSitesSighted']===true;
      }
      // The native battle-info is a 2-row, overflow:hidden status card,
      // not an action slot. Anchor these QA-only controls to its real header.
      function appUI(app){
        const head=app.root.querySelector('.battle-head');
        if(!head)return null;
        const old=head.querySelector('[data-act6-qa-controls]');
        if(old)return old;
        const controls=document.createElement('div');
        controls.dataset.act6QaControls='';
        controls.style.cssText='position:absolute;top:calc(100% + 8px);left:0;max-width:min(70vw,22rem);display:grid;gap:6px;pointer-events:none;';
        head.append(controls);
        return controls;
      }
      function styleAction(button){
        button.style.cssText='pointer-events:auto;min-width:0;min-height:40px;padding:6px 12px;line-height:1.35;text-align:left;white-space:normal;';
      }
      async function prepareExact(id){
      const pin=descriptor.rows[id],url=urlAt(pin.path);
      check(url.origin===descriptor.origin&&new RegExp('^'+routeBase+'web/data/act6-qa-chapter-'+id+'\\.[a-f0-9]{16}\\.json$').test(url.pathname),'Unexpected QA locator');
      const response=await G.fetch(url,{redirect:'error',cache:'no-store',credentials:'omit'});check(response.ok&&response.url===url.href,'QA chapter unavailable');
      const bytes=await response.arrayBuffer();check(bytes.byteLength===pin.bytes&&await sha(bytes)===pin.sha256,'QA chapter integrity mismatch');
      const packet=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)),idName='qa-act6-r4-0'+(id-50);
      check(packet.schema==='honro-act6-app-owner-integrated-packet-r1'&&packet.map.id===idName&&same(packet.map.metadata,{stageId:id,campaign:false,act:6,actStage:id-50}),'Wrong QA chapter');
      check(packet.trace.stageId===id&&packet.trace.authoredId===idName&&packet.trace.mapSHA256===pin.mapSHA256&&packet.trace.assetSHA256===pin.assetSHA256&&packet.mission.runtimeReleaseEnabled===false,'Wrong QA source identity');
      const compiled=G.HonroMaps.compile(packet.map,{library:packet.library});
      const known=[];
      for(const [role,value] of [['playSHA',compiled.terrain],['worldSHA',compiled.worldTerrain]]){
        const serial=JSON.stringify(value),hash=await sha(new TextEncoder().encode(serial));
        check(hash===packet.mission.shape[role],'Physical map differs from authored replay: '+role);
        known.push([serial,hash]);
      }
        return {packet,compiled,known};
      }
      const restToken=Symbol('act6-rest-51-isolated'),preparedRows=new WeakMap(),restGrants=new WeakMap();
      const fiftyGate=createFiftyRestAdmission({
        enabled:true,privateToken:restToken,issuerReady:()=>!!descriptor.rows[51],
        normalScope:runtime,restOwner:app=>app.root.querySelector('.rest-screen .rest-actions')!==null,
        verifyPacket:(candidate,id)=>id===51&&preparedRows.has(candidate),
        buildRestEntry:(candidate,profile)=>buildPartyFromNormalRest(G,candidate,profile)
      });
      const fiftyUI=bindOrdinaryFiftyRestUI({
        gate:fiftyGate,privateToken:restToken,document,
        preparePacket:async id=>{
          const grant=await prepareExact(id),map=grant.packet.map;
          // This shadow is used solely by the stock party constructor. The
          // committed map, runtime IDs and normal 50-entry catalog are unchanged.
          const candidate={stage:{...map,id:'stage-51',metadata:{...map.metadata,campaign:true}},compiled:grant.compiled};
          preparedRows.set(candidate,grant);return candidate;
        },
        mountPrepared:(app,carried)=>{
          const grant=preparedRows.get(carried.packet);preparedRows.delete(carried.packet);
          if(!grant)return false;
          restGrants.set(app,{grant,carried});
          try{return enter(app,51,null);}finally{restGrants.delete(app);}
        },
        onError:(app,error)=>{app.notify(descriptor.releaseEnabled?'다음 장을 열지 못했습니다. 기록은 보존됩니다.':'검수 장을 열지 못했습니다.');console.error(error);}
      });
      function issue(app,button,id){
        button.addEventListener('click',event=>{
          if(event.isTrusted&&event.currentTarget===button)void advance(app,button,id);
        });
      }
      async function advance(app,button,id){
          if(!button.isConnected||!eligible(app,id)||inflight.has(app))return;
          const original={profile:app.profile,node:app.root.firstElementChild,screen:app.screen,revision:app.profileImportSequence,engine:app.engine};
          const owns=()=>button.isConnected&&eligible(app,id)&&app.profile===original.profile&&app.root.firstElementChild===original.node&&app.screen===original.screen&&app.profileImportSequence===original.revision&&app.engine===original.engine;
          let ticket;
          button.disabled=true;inflight.set(app,original);
          try{
            const {packet,compiled,known}=await prepareExact(id);
            if(!owns()||inflight.get(app)!==original)return;
            ticket={};permits.set(app,{ticket,id,packet,compiled,known,owns});
            check(app.launch(id,false,null,ticket)===true,'Author-signed chapter did not mount');
          }catch(error){
            if(owns())app.notify(descriptor.releaseEnabled?'다음 장을 열지 못했습니다. 기록은 보존됩니다.':'검수 장을 열지 못했습니다.');
            console.error(error);
          }finally{
            if(permits.get(app)?.ticket===ticket)permits.delete(app);
            if(inflight.get(app)===original)inflight.delete(app);
            button.disabled=false;
          }
      }
      function offer(app){
        if(descriptor.previewBuildShape===true)return; // No fresh-title developer entry in this Pages-shaped build.
        const bar=app.root.querySelector('.title-actions');
        if(!bar||!eligible(app,51)||bar.querySelector('[data-act6-qa-entry]'))return;
        const button=document.createElement('button');button.type='button';button.dataset.act6QaEntry='';button.textContent='6막 1장 검수 시작';
        bar.append(button);issue(app,button,51);
      }
      const carryFields=['id','cls','hp','maxHp','focus','maxFocus','shield','level','loadout','tune','ranks','h','r','equipmentState','dead'];
      function enter(app,id,ticket){
        const rest=restGrants.get(app),grant=rest?.grant??permits.get(app);
        if(!grant||(!rest&&(grant.ticket!==ticket||grant.id!==id||!grant.owns()||!eligible(app,id))))return false;
        permits.delete(app);
        const {packet,compiled,known}=grant,m=packet.map,d=packet.mission;
        const previous=id===52?active.get(app).terminal:null;
        const p=previous||rest?structuredClone(app.profile):G.HonroProfileStore.fresh();
        const units=structuredClone(packet.owner.actors);
        check(same(m.units.map(x=>[x.id,x.kind,x.x,x.y]),units.map(x=>[x.id,x.cls,x.x,x.y])),'Actor source and authored positions disagree');
        if(previous){
          check(previous.actors.length===4&&previous.actors.every(old=>units.some(u=>u.side===0&&u.id===old.id&&u.cls===old.cls&&old.dead!==true&&old.hp>0)),'Carry body mismatch');
          for(const u of units.filter(x=>x.side===0)){
            const old=previous.actors.find(r=>r.id===u.id);
            for(const field of carryFields){if(old[field]===undefined)delete u[field];else u[field]=structuredClone(old[field]);}
          }
        }else if(rest){
          for(let i=0;i<units.length;i++)if(units[i].side===0){
            const entry=rest.carried.actors.find(u=>u.id===units[i].id&&u.cls===units[i].cls);
            check(entry&&entry.x===units[i].x&&entry.y===units[i].y,'Normal rest starter/body mismatch');
            units[i]=entry;
          }
        }else{
          p.recruited=['archer','mage','knight','occultist'];for(const cls of p.recruited)p.heroes[cls].xp=G.HonroProgression.xpAt(G.HonroProgression.plan(50).entryLevel);
        }
        p.settings={...p.settings,music:false};
        const b=C.createBattle(1,structuredClone(p),'practice',{party:['archer']});
        Object.assign(b,{
          stage:id,stageId:id,honroStage:id,mode:'act6-isolated',honroMapOrigin:'act6-qa',honroCanonical:true,honroCustom:false,honroAuthoredId:m.id,seed:423041,rng:423041,
          honroBackdrop:m.backdrop,width:m.width,height:m.height,terrain:compiled.terrain,honroWorldTerrain:compiled.worldTerrain,
          honroTerrainDomainVersion:1,honroTerrainBounds:m.terrainBounds,honroPlayBounds:m.playBounds,
          waters:[],drafts:[],decor:[],zones:[],landmarks:[],honroLandmarks:compiled.landmarks,honroElements:compiled.elements,honroSurfaceZones:compiled.materials,
          honroEnvironment:structuredClone(m.environment),wind:0,physics:C.makePhysics(),units,active:units[0].id,phase:'aim',queue:units.map(u=>u.id),side:0,items:[],events:[],round:1,teamEnds:[0,0],rewardGranted:false,
          honroActiveLimit:4,enemyLimit:4,honroObjectives:[],honroMarkers:[],honroEvents:[],honroAuthoredEvents:[],honroState:{flags:{},collected:[],hold:0,lastRound:1,rescued:false,combatLog:[]},
        });
        delete b.honroGrowth;delete b.volley;
        if(previous)app.stopBattle(); // releases previous isolated owner without saving
        const old={profile:app.profile,stage:app.stage,stageId:app.stageId,training:app.training,selectedByUnit:app.selectedByUnit,done:app.done};
        const state={old,b,packet,previous,terminal:null,ordinaryRest:!!rest};
        app.close();active.set(app,state);
        manifest.rows[id]=d;
        for(const [source,hash] of known)fingerprints.set(source,hash);
        Object.assign(app,{profile:p,stageId:id,training:false,selectedByUnit:{},
          stage:{...H.stages[0],id,act:6,actStage:id-50,name:d.name,goal:d.marks[0].label,story:[],outro:[],objective:d.objective,w:m.width,h:m.height,active:4}});
        try{
          app.mount(b,{freshReport:true,reportScope:'custom'});
          check(app.engine===state.engine&&app.engine.b===b&&app.screen==='battle'&&app.scene&&app.root.querySelector('#battlecanvas'),'Normal App/Engine did not mount');
          const ui=appUI(app);check(ui,'Normal battle objective owner is absent');
          const button=document.createElement('button');button.type='button';button.dataset.act6QaLookout='';styleAction(button);
          button.addEventListener('click',event=>{if(event.isTrusted)action(app,event);});
          state.button=button;button.textContent=d.marks[0].label;ui.append(button);
          return true;
        }catch(error){app.stopBattle();app.showTitle();throw error;}
      }
      function bind(app,e){
        const s=active.get(app);if(!s||s.b!==e.b)return false;
        const source=Object.freeze({kind:'isolated-authored-engine',incoming:s.previous});mounted.set(e,source);
        check(owner.mount(app,e,source),'Signed native objective owner refused this engine');
        if(e.b.honroStage===52){
          // Exact original 02 actor owner: an unrelated actor/arrow cannot
          // eat the single required target before its authored archer enters.
          const stone=e.unit('cliff-stone'),hurt=e.hurt.bind(e);
          e.hurt=(u,amount,from,direct,projectile,...tail)=>{
            if(u===stone&&!(projectile&&e.unit(from)?.side===0&&e.unit(from)?.cls==='archer'))return;
            return hurt(u,amount,from,direct,projectile,...tail);
          };
        }
        // Existing Engine's legacy descriptor table stops before 51. Supply
        // only the same private descriptor as the author's pinned local replay.
        // Actual win remains on stock App.checkMission and the mounted owner.
        const rule=Object.freeze({id:0,local:0,region:0,outro:s.packet.mission.name,victoryRule:{kind:'scripted',target:'act6-test-complete'},eventScript:[],wind:[0]});
        Object.defineProperty(e,'stage',{configurable:true,get:()=>rule});
        s.engine=e;e.checkEnd=()=>app.checkMission(e);
        return true;
      }
      function goalState(app,e){return owner.project(app,e);}
      function action(app,event){
        const s=active.get(app);if(!s)return false;
        const e=app.engine;
        if(!event.isTrusted||s.engine!==e||app.screen!=='battle'||app.done||app.dialogue||app.modal.classList.contains('open'))return true;
        const id=owner.project(app,e)?.targets?.[0]?.id;
        if(!id)return true;
        const result=owner.interact(app,e,id);
        app.notify(result.ok?result.label:result.reason);
        if(result.ok){
          const goal=owner.project(app,e);
          if(s.button){s.button.textContent=goal.summary;s.button.disabled=goal.complete;}
          e.checkEnd();app.updateHUD(true);
        }
        return true;
      }
      function outcome(app){
        const s=active.get(app);if(!s)return false;
        if(s.b.phase!=='won'&&s.b.phase!=='lost')return true;
        const terminal=owner.terminal(app,s.engine);
        if(terminal)s.terminal=terminal;
        app.done=true;app.cancelInput();
        if(terminal?.stage===51&&!s.ordinaryRest){
          const button=document.createElement('button');button.type='button';button.dataset.act6QaNext='52';styleAction(button);button.textContent='같은 동행으로 6막 2장 검수';
          appUI(app)?.append(button);issue(app,button,52);
        }
        app.notify(terminal?(descriptor.releaseEnabled?'다음 길이 열렸습니다.':'저작 목표를 완료했습니다. 이 검수 결과는 정식 기록에 쓰지 않습니다.'):(descriptor.releaseEnabled?'쉬었다 다시 나아갈 수 있습니다.':'6막 검수를 마쳤습니다. 정식 기록은 바뀌지 않습니다.'));
        return true;
      }
      function release(app){const s=active.get(app);if(!s)return;active.delete(app);Object.assign(app,s.old,{dirty:false});}
      const safeActions=new Set(['title','close','battle-help','pause','drop','defend','wait','select-hero','inspect-hero','combat-skill','fullscreen']);
      return Object.freeze({offer,offerRest:app=>fiftyUI.offer(app),launch:(app,id,ticket)=>fiftyUI.launch(app,id,ticket)??enter(app,id,ticket),active:app=>active.has(app),bind,goalState,action,outcome,release,keepAction:(app,name)=>!active.has(app)||safeActions.has(name)});
    })();
