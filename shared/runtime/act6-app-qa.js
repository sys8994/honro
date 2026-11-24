    // Inserted only in the disposable ON web build. No browser global,
    // user-save authority, Workshop map, or externally callable permit issuer.
    const qa51=(()=>{
      /* FIRST_OWNER */
      const descriptor=/* SIGNED_ASSET */;
      const stages=new Set([51,52,53]),active=new WeakMap(),inflight=new WeakMap(),permits=new WeakMap(),mounted=new WeakMap();
      const fingerprints=new Map(), manifest={rows:Object.create(null)};
      const owner=createFirstMissionOwner({C,manifest,fingerprint:value=>fingerprints.get(JSON.stringify(value)),
        verifyMounted:(app,e,source,d)=>{const s=active.get(app);return s?.b===e.b&&mounted.get(e)===source&&s.packet.mission===d;}});
      const thirdManifest=Object.create(null);
      let third,actions53;
      function verifyThird(app,e,source,d){const s=active.get(app);return s?.b===e.b&&mounted.get(e)===source&&s.packet.mission===d&&d.id===53&&s.b.honroAuthoredId===d.authoredAlias;}
      function verifyThirdActions(app,e,source){const s=active.get(app);return !!s&&verifyThird(app,e,source,s.packet.mission);}
      function incomingThird(app,e,source){return verifyThirdActions(app,e,source)?source.incoming:null;}
      function chartThird(app,e,frame){const s=active.get(app);return frame==='hall'&&s?.b===e.b&&fingerprints.get(JSON.stringify(e.b.terrain))===s.packet.mission.playSHA&&fingerprints.get(JSON.stringify(e.b.honroWorldTerrain))===s.packet.mission.worldSHA;}
      /* THIRD_OWNER */
      /* THIRD_ACTIONS */
      const same=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
      const check=(value,label)=>{if(!value)throw Error(label);};
      const sha=async bytes=>Array.from(new Uint8Array(await G.crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
      const runtime=app=>G.isSecureContext&&G.location.origin===descriptor.origin&&['/HONRO.html','/index.html','/'].includes(G.location.pathname)&&!G.HONRO_EMBEDDED&&G.HONRO_PROJECT_MODE!=='full'&&!app.debugMode&&!app.training&&!app.customMap&&!app.endingGallery&&!app.profileStore.locked;
      function eligible(app,id){
        if(!runtime(app)||!stages.has(id))return false;
        const p=app.profile;
        if(id===51)return app.screen==='title'&&!app.engine&&p===app.normalProfile&&!p.honroBattle&&!p.honroActEnding&&!p.honroMapRestart&&!p.honroCampPending&&!(p.lastStage>1)&&Object.keys(p.cleared||{}).length===0;
        const s=active.get(app);
        return app.screen==='battle'&&!!s&&s.b.honroStage===id-1&&app.engine===s.engine&&s.b.phase==='won'&&app.done&&s.terminal?.stage===id-1&&
          (id===52?s.terminal.flags['act6.threeSitesSighted']===true:s.terminal.flags['act6.outerSitesPrepared']===true&&s.terminal.flags['act6.darmheoInTemple']===true);
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
      function issue(app,button,id){
        button.addEventListener('click',async event=>{
          if(!event.isTrusted||event.currentTarget!==button||!button.isConnected||!eligible(app,id)||inflight.has(app))return;
          const original={profile:app.profile,node:app.root.firstElementChild,screen:app.screen,revision:app.profileImportSequence,engine:app.engine};
          const owns=()=>button.isConnected&&eligible(app,id)&&app.profile===original.profile&&app.root.firstElementChild===original.node&&app.screen===original.screen&&app.profileImportSequence===original.revision&&app.engine===original.engine;
          let ticket;
          button.disabled=true;inflight.set(app,original);
          try{
            const pin=descriptor.rows[id],url=new URL(pin.path,G.location.origin);
            check(url.origin===descriptor.origin&&new RegExp('^/web/data/act6-qa-chapter-'+id+'\\.[a-f0-9]{16}\\.json$').test(url.pathname),'Unexpected QA locator');
            const response=await G.fetch(url,{redirect:'error',cache:'no-store',credentials:'omit'});check(response.ok&&response.url===url.href,'QA chapter unavailable');
            const bytes=await response.arrayBuffer();check(bytes.byteLength===pin.bytes&&await sha(bytes)===pin.sha256,'QA chapter integrity mismatch');
            const packet=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)),idName=id===53?'contact-q-03':'qa-act6-r4-0'+(id-50);
            check(packet.schema==='honro-act6-app-owner-integrated-packet-r1'&&packet.map.id===idName&&same(packet.map.metadata,{stageId:id,campaign:false,act:6,actStage:id-50}),'Wrong QA chapter');
            check(packet.trace.stageId===id&&packet.trace.authoredId===idName&&packet.trace.mapSHA256===pin.mapSHA256&&packet.trace.assetSHA256===pin.assetSHA256&&packet.mission.runtimeReleaseEnabled===false,'Wrong QA source identity');
            const compiled=G.HonroMaps.compile(packet.map,{library:packet.library});
            const known=[];
            for(const [role,value] of [['playSHA',compiled.terrain],['worldSHA',compiled.worldTerrain]]){
              const serial=JSON.stringify(value),hash=await sha(new TextEncoder().encode(serial));
              check(hash===packet.mission.shape[role],'Physical map differs from authored replay: '+role);
              known.push([serial,hash]);
            }
            if(!owns()||inflight.get(app)!==original)return;
            ticket={};permits.set(app,{ticket,id,packet,compiled,known,owns});
            check(app.launch(id,false,null,ticket)===true,'Author-signed chapter did not mount');
          }catch(error){
            if(owns())app.notify('검수 장을 열지 못했습니다.');
            console.error(error);
          }finally{
            if(permits.get(app)?.ticket===ticket)permits.delete(app);
            if(inflight.get(app)===original)inflight.delete(app);
            button.disabled=false;
          }
        });
      }
      function offer(app){
        const bar=app.root.querySelector('.title-actions');
        if(!bar||!eligible(app,51)||bar.querySelector('[data-act6-qa-entry]'))return;
        const button=document.createElement('button');button.type='button';button.dataset.act6QaEntry='';button.textContent='6막 1장 검수 시작';
        bar.append(button);issue(app,button,51);
      }
      const carryFields=['id','cls','hp','maxHp','focus','maxFocus','shield','level','loadout','tune','ranks','h','r','equipmentState','dead'];
      function enter(app,id,ticket){
        const grant=permits.get(app);if(!grant||grant.ticket!==ticket||grant.id!==id||!grant.owns()||!eligible(app,id))return false;
        permits.delete(app);
        const {packet,compiled,known}=grant,m=packet.map,d=packet.mission;
        const incomingApp=id===51?null:active.get(app), previous=incomingApp?.terminal??null;
        const p=previous?structuredClone(app.profile):G.HonroProfileStore.fresh();
        const units=id===53?thirdUnits(m,packet,compiled,incomingApp):structuredClone(packet.owner.actors);
        if(id!==53)check(same(m.units.map(x=>[x.id,x.kind,x.x,x.y]),units.map(x=>[x.id,x.cls,x.x,x.y])),'Actor source and authored positions disagree');
        if(previous&&id!==53){
          check(previous.actors.length===4&&previous.actors.every(old=>units.some(u=>u.side===0&&u.id===old.id&&u.cls===old.cls&&old.dead!==true&&old.hp>0)),'Carry body mismatch');
          for(const u of units.filter(x=>x.side===0)){
            const old=previous.actors.find(r=>r.id===u.id);
            for(const field of carryFields){if(old[field]===undefined)delete u[field];else u[field]=structuredClone(old[field]);}
          }
        }else if(id===51){
          p.recruited=['archer','mage','knight','occultist'];for(const cls of p.recruited)p.heroes[cls].xp=G.HonroProgression.xpAt(G.HonroProgression.plan(50).entryLevel);
        }
        p.settings={...p.settings,music:false};
        const b=C.createBattle(1,structuredClone(p),'practice',{party:['archer']});
        Object.assign(b,{
          stage:id,stageId:id,honroStage:id,mode:'act6-isolated',honroMapOrigin:'act6-qa',honroCanonical:true,honroCustom:false,honroAuthoredId:m.id,seed:id===53?19388:423041,rng:id===53?19388:423041,
          honroBackdrop:m.backdrop,width:m.width,height:m.height,terrain:compiled.terrain,honroWorldTerrain:compiled.worldTerrain,
          honroTerrainDomainVersion:1,honroTerrainBounds:m.terrainBounds,honroPlayBounds:m.playBounds,
          waters:[],drafts:[],decor:[],zones:[],landmarks:[],honroLandmarks:compiled.landmarks,honroElements:compiled.elements,honroSurfaceZones:compiled.materials,
          honroEnvironment:structuredClone(m.environment),wind:0,physics:C.makePhysics(),units,active:units[0].id,phase:'aim',queue:units.map(u=>u.id),side:0,items:[],events:[],round:1,teamEnds:[0,0],rewardGranted:false,
          honroActiveLimit:4,enemyLimit:4,honroObjectives:[],honroMarkers:[],honroEvents:[],honroAuthoredEvents:[],honroState:{flags:{},collected:[],hold:0,lastRound:1,rescued:false,combatLog:[]},
        });
        delete b.honroGrowth;delete b.volley;
        if(previous)app.stopBattle(); // releases previous isolated owner without saving
        const old={profile:app.profile,stage:app.stage,stageId:app.stageId,training:app.training,selectedByUnit:app.selectedByUnit,done:app.done};
        const state={old,b,packet,previous,terminal:null};
        app.close();active.set(app,state);
        if(id===53)thirdManifest[id]=d;else manifest.rows[id]=d;
        for(const [source,hash] of known)fingerprints.set(source,hash);
        Object.assign(app,{profile:p,stageId:id,training:false,selectedByUnit:{},
          stage:{...H.stages[0],id,act:6,actStage:id-50,name:d.name,goal:id===53?'남은 진목을 따라 안으로 들어가십시오.':d.marks[0].label,story:[],outro:[],objective:d.objective,w:m.width,h:m.height,active:4}});
        try{
          app.mount(b,{freshReport:true,reportScope:'custom'});
          check(app.engine===state.engine&&app.engine.b===b&&app.screen==='battle'&&app.scene&&app.root.querySelector('#battlecanvas'),'Normal App/Engine did not mount');
          const ui=appUI(app);check(ui,'Normal battle objective owner is absent');
          const button=document.createElement('button');button.type='button';button.dataset.act6QaLookout='';styleAction(button);
          button.addEventListener('click',event=>{if(event.isTrusted)action(app,event);});
          state.button=button;button.textContent=id===53?'남은 진목 사이 건너기':d.marks[0].label;ui.append(button);
          return true;
        }catch(error){app.stopBattle();app.showTitle();throw error;}
      }
      function bind(app,e){
        const s=active.get(app);if(!s||s.b!==e.b)return false;
        const source=Object.freeze({kind:'isolated-authored-engine',incoming:s.previous});mounted.set(e,source);
        if(e.b.honroStage===53){
          source.incoming; // lexical verified predecessor; no replacement profile
          const rows=s.previous.actors;
          const fields=Object.fromEntries(carryFields.map(k=>[k,e.active[k]]));
          const prior=rows.find(r=>r.cls==='mage');
          for(const k of carryFields)check(same(fields[k],prior[k]),'Stage53 lost Mage carry '+k);
          const innerGrant=Object.freeze({kind:'isolated-authored-engine',incoming:{stage:52,won:true,flags:s.previous.flags,mage:fields,external:Object.fromEntries(rows.filter(r=>r.cls!=='mage').map(r=>[r.cls,r]))}});
          mounted.set(e,innerGrant);
          check(third.mount(app,e,innerGrant)&&actions53.mount(app,e,innerGrant),'Stage53 native owner refused');
        }else check(owner.mount(app,e,source),'Signed native objective owner refused this engine');
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
      function goalState(app,e){return active.get(app)?.b.honroStage===53?third.project(app,e):owner.project(app,e);}
      function withContextSkill(app,u,ids){
        const e=app.engine;
        return active.get(app)?.b.honroStage===53&&e?.active===u&&actions53.aim(app,e)&&!ids.includes('M09')&&ids.length<4?[...ids,'M09']:ids;
      }
      function releaseContextSkill(app,u){
        const e=app.engine;
        if(active.get(app)?.b.honroStage!==53||app.selected!=='M09'||e?.active!==u)return false;
        return castContext(app,u.angle,app.power),true;
      }
      function castContext(app,angle,power){
        const e=app.engine,result=actions53.cast(app,e,angle,power);
        if(!result.ok)app.notify(result.reason);
        app.updateHUD(true);
        return result.ok;
      }
      function thirdUnits(m,packet,compiled,incomingApp){
        check(incomingApp?.terminal?.stage===52&&incomingApp.b.honroStage===52,'No actual 52 owner');
        const before=incomingApp.b.units.find(u=>u.cls==='mage'&&u.side===0&&u.hp>0&&!u.dead);
        const p=incomingApp.terminal.actors.find(r=>r.cls==='mage');
        check(before&&p?.id===before.id&&p.id==='p-mage','Exact actual actor ID must not be relabelled');
        for(const k of carryFields)check(same(p[k],before[k]),'Untrusted carry '+k);
        const maps={'draft-lower-lane-guard':'a5-foe-7','draft-upper-side-guard':'a5-foe-13'};
        const placed=[],spawnWorld={terrain:compiled.terrain,units:placed,waters:[],width:m.width,height:m.height};
        return m.units.map(row=>{
          const carry=row.team==='player';
          const old=carry?Object.fromEntries([...carryFields,'attack','armor','maxMove','walkSpeed','regen','name','hero'].map(k=>[k,structuredClone(before[k])]).filter(([,v])=>v!==undefined)):packet.donor[maps[row.id]];
          check(old,'Exact temporary encounter source only');
          const u=C.makeUnit(carry?'mage':'archer',carry?0:1,row.x,row.y,{...old,id:carry?p.id:row.id,facing:row.facing});
          if(carry)for(const k of carryFields){if(p[k]===undefined)delete u[k];else u[k]=structuredClone(p[k]);}
          const pose=G.HonroTerrain.place(spawnWorld,u,{flying:false,maxDistance:3,accept:(x,y)=>x===row.x&&Math.abs(y-row.y)<=3&&C.validTerrainContactPose(compiled.terrain,{...u,x,y})});
          check(pose,'Stock candidate spawn must stay on authored footing');
          Object.assign(u,pose,{spawnX:pose.x,spawnY:pose.y,vx:0,vy:0});
          placed.push(u);return u;
        });
      }
      function action(app,event){
        const s=active.get(app);if(!s)return false;
        const e=app.engine;
        if(!event.isTrusted||s.engine!==e||app.screen!=='battle'||app.done||app.dialogue||app.modal.classList.contains('open'))return true;
        if(s.b.honroStage===53){
          const q=actions53.usePassage(app,e);if(!q.ok)app.notify(q.reason);else {s.button.disabled=true;app.notify('문지방 안쪽 받침에 축지진목을 놓으십시오.');}
          e.checkEnd();app.updateHUD(true);return true;
        }
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
        const terminal=s.b.honroStage===53?third.terminal(app,s.engine):owner.terminal(app,s.engine);
        if(terminal)s.terminal=terminal;
        app.done=true;app.cancelInput();
        if(terminal?.stage===51||terminal?.stage===52){
          const next=terminal.stage+1;
          const button=document.createElement('button');button.type='button';button.dataset.act6QaNext=String(next);styleAction(button);button.textContent=next===52?'같은 동행으로 6막 2장 검수':'담허가 문지방을 넘는다';
          appUI(app)?.append(button);issue(app,button,next);
        }
        app.notify(terminal?'저작 목표를 완료했습니다. 이 검수 결과는 정식 기록에 쓰지 않습니다.':'6막 검수를 마쳤습니다. 정식 기록은 바뀌지 않습니다.');
        return true;
      }
      function release(app){const s=active.get(app);if(!s)return;active.delete(app);Object.assign(app,s.old,{dirty:false});}
      const safeActions=new Set(['title','close','battle-help','pause','drop','defend','wait','select-hero','inspect-hero','combat-skill','fullscreen']);
      return Object.freeze({offer,enter,active:app=>active.has(app),bind,goalState,action,outcome,release,withContextSkill,releaseContextSkill,keepAction:(app,name)=>!active.has(app)||safeActions.has(name)});
    })();
