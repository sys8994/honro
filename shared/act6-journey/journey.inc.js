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
            const session=boundarySession(app),raw=session?.stored();
            if(raw===null)return {current:51,through:51,finished:false,readable:true};
            const state=typeof raw==='string'&&raw.length<=160000?session.port?.inspect(app):null;
            if(state?.kind==='retired')return {current:51,through:51,finished:false,readable:true};
            if(state?.kind==='restorable'&&stageIds.includes(state.to))
              return {current:state.to,through:state.to,finished:false,readable:true};
          }catch{}
          // A damaged/stale record never reveals story or mounts a battle.
          return {current:null,through:51,finished:false,readable:false};
        };
        return Object.freeze({map,view,debugBattle:app=>typeof stageDebug!=='undefined'&&stageDebug.has(app)});
      })();
      G.HonroAct6Journey=act6Journal;
