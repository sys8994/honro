      // This browser trial is opt-in. Bind the stock codec to an independent,
      // run-specific physical key; do not race or write the legacy campaign key.
      const boundarySessions=new WeakMap(), boundaryButton=new WeakMap();
      const boundaryAllowed=id=>Number.isInteger(id)&&id>=52&&id<=60;
      const nativeKey='honro-first-act-profile-1', markerKey='honroAct6ChapterBoundary';
      const routePins=id=>{
        const layout=id<=54?descriptor.boundary?.layout?.[id]:
          ({55:D55.shape,56:owner56,57:descriptor57,58:descriptor58,59:D59,60:D60})[id];
        if(!boundaryAllowed(id)||!layout)return null;
        return {from:id-1,to:id,build:descriptor.boundary.build,fromPacket:descriptor.rows[id-1].sha256,toPacket:descriptor.rows[id].sha256,
          owner:descriptor.boundary.owner[id],play:layout.playSHA,world:layout.worldSHA};
      };
      function boundarySession(app){
        if(!descriptor.boundary||!runtime(app)||app.profile!==app.normalProfile||app.profileStore.locked||!G.navigator?.locks||!app.normalProfile.cleared?.[50])return null;
        const run=app.normalProfile.equipment?.runId;
        if(typeof run!=='string'||!/^[a-zA-Z0-9_-]{8,80}$/.test(run))return null;
        const store=app.profileStore,normal=store.original()?.text,rev=app.profileImportSequence, profile=app.profile;
        if(typeof normal!=='string'||G.localStorage.getItem(nativeKey)!==normal)return null;
        const normalize=G.HonroProfileStore.migrate, base=JSON.stringify(normalize(normal)),slot=(descriptor.releaseEnabled?'honro-campaign-act6-boundary-v2:':'honro-act6-qa-boundary-v2:')+run;
        const cached=boundarySessions.get(app);
        if(cached?.owned())return cached;
        const owned=()=>runtime(app)&&app.profileStore===store&&!store.locked&&app.profile===profile&&app.profile===app.normalProfile&&
          app.profileImportSequence===rev&&store.original()?.text===normal&&G.localStorage.getItem(nativeKey)===normal;
        let locked=false,tx=null,cold=null;
        const stored=()=>G.localStorage.getItem(slot);
        const proxy={get length(){return 1},key:i=>i===0?nativeKey:null,getItem:k=>k===nativeKey?(stored()??base):null,
          setItem(k,v){if(k!==nativeKey||!locked||!tx||!owned())throw Error('Boundary transaction not owned');G.localStorage.setItem(slot,v);},
          removeItem(){throw Error('Chapter boundary cannot replace or remove existing history');}};
        const shadow=stockSlot60Factory(G,proxy).create();
        if(shadow.locked)return null;
        const port=createChapterBoundary({slot,key:nativeKey,storage:proxy,normalize,hash:sha256Boundary,releasePin:routePins,
          verifyRelay54:r=>verifyStage54Relay(C,relaySill54,r,true),
          verifyBridge:(id,r)=>validBrokenRailCrossing(brokenRail,id,r),
          verifyEave:validTornEave,
          verifyReturn:verifyReturnGate,
          ownedStore:(a,w)=>a===app&&w===shadow&&owned(),originalProfile:a=>a===app&&owned()?normalize(normal):null,
          locks:{request(lock,options,f){return G.navigator.locks.request(lock,options,async()=>{
            if(locked||!owned())return {ok:false,reason:'stale-slot'};locked=true;try{return await f();}finally{locked=false;}
          });}},
          verifyOwner(a,e,t,to){const s=active.get(a);return a===app&&owned()&&tx?.to===to&&tx.owns()&&
            a.engine===e&&s?.engine===e&&s.b===e.b&&s.normal51&&s.terminal===t&&eligible(a,to);},
          verifyCold(a,w,to){return a===app&&owned()&&w===shadow&&cold?.id===to&&cold.still()&&!a.engine&&a.screen==='rest';}
        });
        const item={owned,stored,proxy,shadow,port,transact(spec){tx=spec;},restoring(spec){cold=spec;},slot};
        boundarySessions.set(app,item);return item;
      }
      async function beforeBoundaryAdvance(app,id,grant,owns){
        if(!descriptor.boundary||!boundaryAllowed(id))return true;
        const session=boundarySession(app),s=active.get(app),e=s?.engine;
        if(!session?.port||!e||!s.terminal||!owns())return false;
        const pin=routePins(id),known=grant.known;
        if(!pin||known[0]?.[1]!==pin.play||known[1]?.[1]!==pin.world)return false;
        const markup=s.button?.closest('[data-act6-qa-controls]');
        const source={app,engine:e,store:session.shadow,terminal:s.terminal,upstream:s.previous,
          physical:id===60?s.owner59.boundaryProof(s.terminal):undefined,stageSeed:e.stage,budget:normal51Provider.budget(e.b),
          to:id,pin,expectedRaw:session.proxy.getItem(nativeKey)};
        session.transact({to:id,owns});
        try{
          const result=await session.port.checkpoint(source);
          if(!result.ok){G.console.warn('Act6 checkpoint held',id,result.reason);return false;}
          if(markup?.dataset)markup.dataset.act6SavedBoundary=String(id);
          return true;
        }finally{session.transact(null);}
      }
      function restoreBoundaryMount(app,grant,body,stays){
        const q={};
        switch(body.to){
         case 52:cold52.add(q);return mountCold52(app,grant,body,stays,q);
         case 53:coldIssuers.add(q);return coldBoundary53(app,grant,body,stays,q);
         case 54:cold54.add(q);return mountCold54(app,grant,body,stays,q);
         case 55:cold55.add(q);return mountCold55(app,grant,body,stays,q);
         case 56:cold56.set(q,{});return mountCold56(app,grant,body,stays,q);
         case 57:cold57.set(q,{});return mountCold57(app,grant,body,stays,q);
         case 58:cold58.add(q);return mountCold58(app,grant,body,stays,q);
         case 59:cold59.add(q);return mountCold59(app,grant,body,stays,q);
         case 60:cold60.add(q);return mountCold60(app,grant,body,stays,q);
         default:return false;
        }
      }
      function ready60EndingBoundary(a,e,proof){
        if(!descriptor.releaseEnabled)return true;
        try{
          const cx=boundarySession(a),raw=cx?.stored();if(!raw||raw.length>160000||a.engine!==e)return false;
          const stamp=JSON.parse(raw)[markerKey],v=stamp?.body;
          return !!(v&&v.to===60&&v.from===59&&v.runId===proof.runId&&(v.pin.build===descriptor.boundary.build||v.pin.fromPacket===descriptor.rows[59]?.sha256)&&
            v.terminalSHA===proof.rawSHA&&sha256Boundary(JSON.stringify(v.terminal))===proof.rawSHA&&sha256Boundary(JSON.stringify(v))===stamp.sha);
        }catch{return false;}
      }
      function offerBoundaryRest(app){
        if(!descriptor.boundary||app.screen!=='rest'||app.engine)return false;
        if(descriptor.releaseEnabled){
          const completed=normal60Surface?.completed(app);
          if(completed){
            const target=app.root.querySelector('.rest-actions .rest-next[disabled]');
            if(target){target.textContent='6막 여정 완료';target.setAttribute('aria-label','6막 여정 완료. 방패선의 기록이 보존되어 있습니다.');}
            return true;
          }
        }
        const cx=boundarySession(app),raw=cx?.stored();if(!raw)return false;
        // A stamp from a revised source chapter is retired: offer Act 6 chapter 1 again.
        if(cx.port?.status?.()==='retired'){
          const note=app.root.querySelector('.rest-actions [data-act6-boundary-retired]');
          if(!note){const n=document.createElement('p');n.dataset.act6BoundaryRetired='';n.className='rest-note';n.textContent='6막이 개정되어 이전 장 기록은 이어갈 수 없습니다. 성장과 장비는 그대로이며 6막 1장부터 다시 걷습니다.';app.root.querySelector('.rest-actions')?.prepend(n);}
          return false;
        }
        const place=app.root.querySelector('.rest-actions .rest-next[disabled]');
        if(!place||boundaryButton.get(app)?.isConnected)return true;
        let id;try{id=JSON.parse(raw)[markerKey]?.body?.to;}catch{}
        if(!boundaryAllowed(id)){place.setAttribute('aria-label','이전 기록을 확인할 수 없습니다');return true;}
        const button=document.createElement('button');button.type='button';button.className='primary rest-next';
        button.textContent='6막 '+(id-50)+'장 이어가기 →';
        button.dataset.act6BoundaryResume=String(id);boundaryButton.set(app,button);place.replaceWith(button);
        button.addEventListener('click',async event=>{
          const still=()=>cx.owned()&&cx.stored()===raw&&app.screen==='rest'&&!app.engine&&button.isConnected&&boundaryButton.get(app)===button&&!app.dialogue;
          if(event.isTrusted!==true||event.currentTarget!==button||button.disabled||!still())return;
          button.disabled=true;
          cx.restoring({id,still});
          try{
            const grant=await prepareExact(id),pin=routePins(id);
            if(!still()||!pin||grant.known[0][1]!==pin.play||grant.known[1][1]!==pin.world)return;
            const r=await cx.port.restore({app,store:cx.shadow,to:id,pin,enter:(body,stays)=>restoreBoundaryMount(app,grant,body,stays)});
            if(!r.ok&&still())throw Error('이어가기 '+r.reason);
          }catch(err){if(still())app.notify('6막 기록을 열지 못했습니다. 기존 기록은 그대로입니다.');G.console.warn(err);}
          finally{cx.restoring(null);button.disabled=false;}
        });
        return true;
      }
