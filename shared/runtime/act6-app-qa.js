    // This private closure is inserted into the normal App by the explicit QA
    // web emitter only. It is never in a stock OFF build, and is disabled in the embedded App.
    const qa51=(()=>{
      const descriptor=/* SIGNED_ASSET */;
      const active=new WeakMap(),inflight=new WeakMap(),permits=new WeakMap();
      const exact=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
      const require=(value,label)=>{if(!value)throw Error(label);};
      const hash=async bytes=>Array.from(new Uint8Array(await G.crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
      const ready=app=>{
        if(!G.isSecureContext||G.location.origin!==descriptor.origin||!['/HONRO.html','/index.html','/'].includes(G.location.pathname)||G.HONRO_EMBEDDED||G.HONRO_PROJECT_MODE==='full')return false;
        const p=app.profile;
        // This entry is a QA starting checkpoint, not a counterfeit clear.
        // Never mix its in-memory actor fixture with a carried user campaign.
        return app.screen==='title'&&!app.engine&&!app.debugMode&&!app.training&&!app.customMap&&!app.endingGallery&&!app.profileStore.locked&&
          p===app.normalProfile&&!p.honroBattle&&!p.honroActEnding&&!p.honroMapRestart&&!p.honroCampPending&&!(p.lastStage>1)&&Object.keys(p.cleared||{}).length===0;
      };
      const privateSession=app=>active.get(app);
      function offer(app){
        const bar=app.root.querySelector('.title-actions');
        if(!bar||!ready(app)||bar.querySelector('[data-act6-qa-entry]'))return;
        const button=document.createElement('button');
        button.type='button';button.dataset.act6QaEntry='';button.textContent='6막 1장 검수 시작';
        bar.append(button);
        button.addEventListener('click',async e=>{
          if(!e.isTrusted||e.currentTarget!==button||!button.isConnected||!ready(app)||inflight.has(app))return;
          const bind={profile:app.profile,node:app.root.firstElementChild,screen:app.screen,revision:app.profileImportSequence};
          const same=()=>button.isConnected&&ready(app)&&app.profile===bind.profile&&app.root.firstElementChild===bind.node&&app.screen===bind.screen&&app.profileImportSequence===bind.revision;
          let ticket;
          button.disabled=true;inflight.set(app,bind);
          try{
            const url=new URL(descriptor.path,G.location.origin);
            require(url.origin===descriptor.origin&&/^\/web\/data\/act6-qa-chapter-51\.[a-f0-9]{16}\.json$/.test(url.pathname),'Unexpected QA locator');
            const result=await G.fetch(url,{redirect:'error',cache:'no-store',credentials:'omit'});
            require(result.ok&&result.url===url.href,'QA chapter unavailable');
            const bytes=await result.arrayBuffer();
            require(bytes.byteLength===descriptor.bytes&&await hash(bytes)===descriptor.sha256,'QA chapter integrity mismatch');
            const packet=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
            require(packet.schema==='honro-act6-app-qa-51-r1'&&packet.map.id==='qa-act6-r4-01'&&exact(packet.map.metadata,{stageId:51,campaign:false,act:6,actStage:1}),'Wrong QA chapter');
            require(packet.trace.stageId===51&&packet.trace.authoredId===packet.map.id&&packet.trace.mapSHA256===descriptor.mapSHA256&&packet.trace.assetSHA256===descriptor.assetSHA256,'Wrong QA source identity');
            const c=G.HonroMaps.compile(packet.map,{library:packet.library});
            require(await hash(new TextEncoder().encode(JSON.stringify(c.terrain)))===packet.owner.colliderSHA256,'Physical map differs from authored replay');
            if(!same()||inflight.get(app)!==bind)return;
            ticket={};permits.set(app,{ticket,packet,compiled:c,profile:bind.profile,same});
            require(app.launch(51,false,null,ticket)===true,'51 could not mount');
          }catch(error){
            if(same()){app.notify('6막 검수 경로를 열지 못했습니다.');console.error(error);}
          }finally{
            if(permits.get(app)?.ticket===ticket)permits.delete(app);
            if(inflight.get(app)===bind)inflight.delete(app);
            button.disabled=false;
          }
        });
      }
      function enter(app,ticket){
        const grant=permits.get(app);
        if(!grant||grant.ticket!==ticket||!ready(app)||!grant.same()||grant.profile!==app.profile)return false;
        permits.delete(app);
        const {packet,compiled}=grant,m=packet.map,k=packet.owner.contract;
        const old={profile:app.profile,stage:app.stage,stageId:app.stageId,training:app.training,selectedByUnit:app.selectedByUnit,done:app.done};
        // Rebuild the authored starting state using stock battle/physics and
        // play ownership. These are initial actor definitions, not a clear save.
        const p=G.HonroProfileStore.fresh();p.recruited=['archer','mage','knight','occultist'];
        for(const cls of p.recruited)p.heroes[cls].xp=G.HonroProgression.xpAt(G.HonroProgression.plan(50).entryLevel);
        p.settings={...p.settings,music:false};
        const b=C.createBattle(1,structuredClone(p),'practice',{party:['archer']});
        const units=structuredClone(packet.owner.actors),finish='act6-test-complete';
        require(exact(m.units.map(x=>[x.id,x.kind,x.x,x.y]),units.map(x=>[x.id,x.cls,x.x,x.y])),'Actor source and authored positions disagree');
        const marks=k.marks.map(mark=>{
          const t=compiled.terrain.find(t=>t.id===mark.support);
          require(t&&t.x<=mark.x&&mark.x<=t.x+t.w,'Missing observed objective support');
          return {...mark,y:C.topAt(t,mark.x)};
        });
        require(marks.length===1&&marks[0].id==='overlook','Missing authorized goal');
        Object.assign(b,{
          stage:51,stageId:51,honroStage:51,mode:'act6-isolated',honroMapOrigin:'act6-qa',honroCanonical:true,honroCustom:false,honroAuthoredId:m.id,
          honroBackdrop:m.backdrop,width:m.width,height:m.height,terrain:compiled.terrain,honroWorldTerrain:compiled.worldTerrain,
          honroTerrainDomainVersion:1,honroTerrainBounds:m.terrainBounds,honroPlayBounds:m.playBounds,
          waters:[],drafts:[],decor:[],zones:[],landmarks:[],honroLandmarks:compiled.landmarks,honroElements:compiled.elements,honroSurfaceZones:compiled.materials,
          honroEnvironment:structuredClone(m.environment),wind:0,physics:C.makePhysics(),units,active:units[0].id,phase:'aim',queue:units.map(u=>u.id),side:0,items:[],events:[],round:1,teamEnds:[0,0],rewardGranted:false,
          honroActiveLimit:4,enemyLimit:4,honroObjectives:[{id:'51-lookout',type:'flag',flag:'act6-local-ui-won',label:marks[0].label}],honroMarkers:[],honroEvents:[],honroAuthoredEvents:[],
          honroState:{flags:{},collected:[],hold:0,lastRound:1,rescued:false,combatLog:[]},
        });
        const state={old,b,mark:marks[0],finish,rule:{id:0,local:0,region:0,outro:k.title,victoryRule:{kind:'scripted',target:finish},eventScript:[],wind:[0]}};
        app.close();
        active.set(app,state);
        Object.assign(app,{profile:p,stageId:51,training:false,selectedByUnit:{},
          stage:{...H.stages[0],id:51,act:6,actStage:1,name:k.title,goal:'네 사람과 함께 관찰대에 도착한 뒤 담허로 세 외부 자리 방향 확인',story:[],outro:[],objective:'authored',w:m.width,h:m.height,active:4}});
        try{
          app.mount(b,{freshReport:true,reportScope:'custom'});
          require(app.engine===state.e&&state.e?.b===b&&app.screen==='battle'&&app.scene&&app.root.querySelector('#battlecanvas'),'Normal App/Engine did not mount');
          const ui=app.root.querySelector('.battle-info');
          require(ui,'Normal battle objective owner is absent');
          const button=document.createElement('button');button.type='button';button.dataset.act6QaLookout='';button.textContent=state.mark.label;
          button.addEventListener('click',ev=>{if(ev.isTrusted)action(app,ev);});
          ui.append(button);
          return true;
        }catch(error){
          app.stopBattle();app.showTitle();throw error;
        }
      }
      function bind(app,e){
        const s=privateSession(app);if(!s||s.b!==e.b)return false;
        require(e instanceof C.Engine,'Not the normal Engine');s.e=e;
        Object.defineProperty(e,'stage',{configurable:true,get:()=>s.rule});
        e.checkEnd=C.Engine.prototype.checkEnd.bind(e);
        for(const u of e.b.units)require(e.grounded(u)&&C.validTerrainContactPose(e.b.terrain,u),'Illegal native spawn '+u.id);
        require(G.HonroTerrainDomain.active(e.b),'Terrain domain absent');
        return true;
      }
      function action(app,event){
        const s=privateSession(app);if(!s)return false;
        const {e,b,mark}=s,u=e?.active;
        if(!event.isTrusted||app.engine!==e||app.screen!=='battle'||app.done||app.dialogue||app.modal.classList.contains('open'))return true;
        const friends=b.units.filter(x=>x.side===0&&!x.summoned);
        const success=u&&u.side===0&&u.cls===mark.cls&&e.canAct()&&e.grounded(u)&&!u.dead&&Math.abs(u.x-mark.x)<=mark.radius&&Math.abs(u.y-mark.y)<=110&&e.contactSurface(u.x,u.y-4,u.y+4)?.t.id===mark.support&&
          b.units.find(t=>t.id==='crest-champion')?.dead&&friends.length===4&&friends.every(f=>!f.dead&&f.x>=b.width*.9&&C.validTerrainContactPose(b.terrain,f));
        if(!success){app.notify('경계암귀를 물리치고 네 사람이 관찰대에 도착한 뒤 담허 차례에 확인합니다.');return true;}
        if(b.honroState.flags['act6-local-ui-won'])return true;
        b.events.push('act6-local-objective:overlook','act6.threeSitesSighted','victory:'+s.finish);
        b.honroState.flags['act6-local-ui-won']=true;e.checkEnd();
        return true;
      }
      function outcome(app){
        const s=privateSession(app);if(!s)return false;
        if(s.b.phase!=='won'&&s.b.phase!=='lost')return true;
        app.done=true;app.cancelInput();
        app.notify(s.b.phase==='won'&&s.b.events.includes('act6.threeSitesSighted')?'6막 1장 검수 목표를 완료했습니다. 정식 진행과 보상은 기록하지 않습니다.':'6막 1장 검수를 마쳤습니다. 정식 기록은 바뀌지 않습니다.');
        return true;
      }
      function release(app){
        if(!active.has(app))return;
        const {old}=active.get(app);active.delete(app);Object.assign(app,old,{dirty:false});
      }
      const safeActions=new Set(['title','close','battle-help','pause','drop','defend','wait','select-hero','inspect-hero','combat-skill','fullscreen']);
      return Object.freeze({offer,enter,active:app=>active.has(app),bind,action,outcome,release,keepAction:(app,name)=>!active.has(app)||safeActions.has(name)});
    })();
