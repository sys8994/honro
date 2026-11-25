      // Read-only cartography over the real campaign/checkpoint owner.
      const act6Journal=(()=>{
        const map=Object.freeze({...descriptor.journeyMap,
          url:urlAt(descriptor.journeyMap.path).href});
        const stageIds=map.stages.map(r=>r.stageNumber);
        const view=app=>{
          if(app?.debugMode){
            return typeof debugJourneyAllowed==='function'&&debugJourneyAllowed(app)?{debug:true,current:null,through:60,finished:false,readable:true}:null;
          }
          if(!app||!runtime(app)||app.profile!==app.normalProfile||!app.profile.cleared?.[50]||
             app.profile.honroBattle||app.profile.honroActEnding||app.profile.honroPendingResult||app.profile.honroPendingOutcome)return null;
          const run=app.profile.equipment?.runId;
          if(typeof run!=='string'||!/^[a-zA-Z0-9_-]{8,80}$/.test(run))return null;
          if(normal60Surface?.completed(app))return {current:null,through:60,finished:true,readable:true};
          if(app.profile.honroFlags?.['act6.endingCompleted']===true)return null;
          try{
            const slot='honro-campaign-act6-boundary-v2:'+run;
            const raw=G.localStorage.getItem(slot);
            if(raw===null)return {current:51,through:51,finished:false,readable:true};
            const stamp=raw.length<=160000&&JSON.parse(raw)?.[markerKey],x=stamp?.body;
            if(x&&stageIds.includes(x.to)&&boundaryAllowed(x.to)&&x.from===x.to-1&&x.slot===slot&&x.runId===run&&
               JSON.stringify(x.pin)===JSON.stringify(routePins(x.to))&&x.terminal?.stage===x.from&&
               sha256Boundary(JSON.stringify(x))===stamp.sha)
              return {current:x.to,through:x.to,finished:false,readable:true};
          }catch{}
          // A damaged/stale record never reveals story or mounts a battle.
          return {current:null,through:51,finished:false,readable:false};
        };
        return Object.freeze({map,view,debugBattle:app=>typeof stageDebug!=='undefined'&&stageDebug.has(app)});
      })();
      G.HonroAct6Journey=act6Journal;
