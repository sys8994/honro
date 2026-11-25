      // The existing journey map opens the native chapter in a disposable profile.
      const stageDebug=new WeakMap(),stageDebugBusy=new WeakSet();
      const debugStageIds=Array.from({length:10},(_,i)=>51+i);
      let debugFixturesPromise=null;
      function debugJourneyAllowed(a){
        return descriptor.releaseEnabled&&descriptor.debugFixtures&&G.isSecureContext&&G.location.origin===descriptor.origin&&rtPath.includes(G.location.pathname)&&
          !G.HONRO_EMBEDDED&&!a.endingGallery&&!a.customMap&&a.debugMode===true&&!a.profileStore.locked&&!stageDebug.has(a);
      }
      async function debugFixtures(){
        if(!debugFixturesPromise){
          debugFixturesPromise=(async()=>{
            const pin=descriptor.debugFixtures,url=urlAt(pin.path);
            check(url.origin===descriptor.origin&&/\/web\/data\/act6-debug-stages\.[a-f0-9]{16}\.json$/.test(url.pathname),'Unexpected debug fixture origin');
            const res=await G.fetch(url,{redirect:'error',credentials:'omit'});check(res.ok&&res.url===url.href,'Debug fixtures unavailable');
            const raw=await res.arrayBuffer();check(raw.byteLength===pin.bytes&&await sha(raw)===pin.sha256,'Debug fixture integrity mismatch');
            const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));
            check(data.schema===1&&JSON.stringify(Object.keys(data.rows))===JSON.stringify(debugStageIds.slice(1).map(String)),'Wrong debug fixture manifest');
            return data;
          })().catch(error=>{debugFixturesPromise=null;throw error;});
        }
        return debugFixturesPromise;
      }
      function restoreDebug(a,force=false){
        const s=stageDebug.get(a);
        if(!s||s.mounting&&!force)return false;
        stageDebug.delete(a);Object.assign(a,s.real,{dirty:false});return true;
      }
      async function launchDebugStage(a,id,still){
        if(stageDebugBusy.has(a)||!debugJourneyAllowed(a)||!debugStageIds.includes(id)||!still())return false;
        stageDebugBusy.add(a);
        let s;
        try{
          const [fixture,grant]=await Promise.all([debugFixtures(),prepareExact(id)]);
          if(!still()||!debugJourneyAllowed(a))return false;
          const selected=fixture.rows[id===51?52:id];
          const profile=structuredClone(selected.profile), body=structuredClone(selected.body);
          check(profile?.cleared?.[50]&&profile?.equipment?.runId===body.runId,'Wrong debug practice roster');
          if(id!==51){
            const pin=routePins(id);
            check(pin&&body.to===id&&body.from===id-1&&['fromPacket','toPacket','play','world','owner'].every(k=>pin[k]===body.pin[k])&&
              grant.known[0]?.[1]===pin.play&&grant.known[1]?.[1]===pin.world,'Stale debug checkpoint');
          }
          const keys=['normalProfile','profile','profileStore','debugMode','debugRestStage','stageId','stage','training','done','selectedByUnit'];
          a.stopBattle();
          const real=Object.fromEntries(keys.map(k=>[k,a[k]]));
          const isolatedStore=Object.freeze({locked:false,initial:profile,original:()=>({ok:false}),save:()=>false});
          s={real,profile,isolatedStore,mounting:true,id};
          stageDebug.set(a,s);
          Object.assign(a,{profile,normalProfile:profile,profileStore:isolatedStore,debugMode:false,debugRestStage:null});
          const owns=()=>stageDebug.get(a)===s&&a.profile===profile&&a.normalProfile===profile&&a.profileStore===isolatedStore;
          let ok;
          if(id===51){
            const candidate={stage:{...grant.packet.map,id:'stage-51',metadata:{...grant.packet.map.metadata,campaign:true}},compiled:grant.compiled};
            const party=buildPartyFromNormalRest(G,candidate,profile);check(party,'Debug opening roster unavailable');
            ok=enterNormal51(a,grant,{...party,profile});
          }else ok=await restoreBoundaryMount(a,grant,body,owns);
          check(ok&&owns()&&a.engine?.b?.honroStage===id&&a.scene,'Debug chapter did not mount');
          s.mounting=false;
          return true;
        }catch(error){
          if(s&&stageDebug.get(a)===s){s.mounting=false;returnDebugStage(a);}
          a.notify('6막 검수 전투를 열지 못했습니다. 일반 기록은 그대로입니다.');G.console.warn(error);return false;
        }finally{stageDebugBusy.delete(a);}
      }
      function travelDebug(a,id,event,button){
        if(!event.isTrusted||!button||!a.root.contains(button)||a.screen!=='journey'||a.journeyAct!==6||
           a.journeySelection!==id||button.dataset.action!=='journey-travel'||Number(button.dataset.id)!==id||!debugJourneyAllowed(a))return false;
        const profile=a.profile, book=a.root.firstElementChild;
        const still=()=>a.profile===profile&&a.screen==='journey'&&a.journeyAct===6&&a.journeySelection===id&&a.root.firstElementChild===book&&a.root.contains(button);
        button.disabled=true;
        launchDebugStage(a,id,still).finally(()=>{button.disabled=false;});
        return true;
      }
      function returnDebugStage(a){
        const s=stageDebug.get(a);
        if(!s||s.mounting)return false;
        a.stopBattle();
        G.HonroRestJourney.showBook(a,s.id,null,6);
        return true;
      }
      function debugStageOutcome(a){
        const s=stageDebug.get(a),phase=a.engine?.b?.phase;
        if(!s||s.mounting||!['won','lost'].includes(phase))return false;
        a.done=true;a.resultDismissed=false;a.cancelInput();
        a.open('<h2>'+(phase==='won'?'전투 완료':'전투 패배')+'</h2><div class="actions"><button class="primary" data-action="result-continue">여정첩으로</button></div>','result');
        return true;
      }
