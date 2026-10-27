(function(G){'use strict';
// Chapter 14 binds only the parent-reviewed manuscript to Phase A's physical
// house, warning, separation and short refuge walk. No dialogue invents proof.
const P=G.HonroAct23V4ReviewedChapters,V=G.HonroAct23V4,C=G.HONRO_CORE,S=G.HonroAct23V4Act2Scenes;
if(!P||G.HonroAct23V4Reviewed14)return;
const unit=(b,id)=>b.units.find(u=>u.id===id),gil=b=>unit(b,'14.gilchan'),physical=b=>S.memory(b),base=b=>S.base.memory(b),mem=b=>P.memory(b),done=(b,key)=>P.done(b,key);
const home=b=>V.marker(b,'14.house'),refuge=b=>V.marker(b,'14.refuge');
const nearHome=b=>V.heroes(b).some(u=>V.near(u,home(b),430));
const foes=(b,p,r)=>b.units.filter(u=>u.side===1&&V.alive(u)&&!u.honroObjectiveTarget&&V.near(u,p,r));
const father=p=>!!p?.cleared?.[13]||['13.release','13.party-pass'].every(id=>p?.honroAct23V4History?.stages?.[13]?.steps?.includes(id));
const clearDoor=b=>!!V.mem(b).done['14.door-threat'];
const separated=b=>!!base(b).proof['14.extract']&&V.alive(gil(b))&&gil(b).honroResolved&&!gil(b).honroHypnotized&&!V.alive(unit(b,'resident-spirit-1'));
function sheltered(b){const u=gil(b),s=physical(b);return separated(b)&&!!s.proof['14.refuge']&&!!s.walks['14.refuge']?.arrived&&V.near(u,refuge(b),50)&&C.validTerrainContactPose(b.terrain,u)&&!foes(b,refuge(b),560).length;}
function optional(profile,row){const b=profile.honroBattle;if(b?.honroStage!==14)return true;
 if(['EDGE.OPTIONAL_14_ARCHER_0','EDGE.OPTIONAL_14_KNIGHT_1'].includes(row.id))return !mem(b).events.news;
 if(row.id==='EDGE.OPTIONAL_14_OCCULTIST_0')return !clearDoor(b);
 return true;
}
function allow(app,row){const b=app.engine?.b,id=row.id;if(row.channel==='optional'||id.startsWith('EDGE.OPTIONAL_'))return optional({...app.profile,honroBattle:b},row);
 if(!b)return false;const q=mem(b),s=physical(b),a=base(b),u=gil(b);
 if(id==='EDGE.ARRIVALS_14_0')return !a.houseOpen;
 if(id==='A2.S14.FAIL.01')return b.phase==='lost';
 if(!V.alive(u)||['won','lost'].includes(b.phase))return false;
 if(id==='A2.S14.INTRO.01')return nearHome(b)&&!a.houseOpen;
 if(/^A2\.S14\.INTRO\.0[234]$/.test(id))return done(b,'voice')&&nearHome(b)&&father(app.profile)&&!a.houseOpen;
 if(id==='A2.S14.MID.01')return done(b,'news')&&!!q.approach&&!a.houseOpen;
 if(id==='A2.S14.MID.02')return done(b,'news')&&nearHome(b)&&!a.houseOpen;
 if(id==='A2.S14.MID.03')return done(b,'news')&&clearDoor(b)&&!a.houseOpen;
 if(['A2.S14.MID.04','A2.S14.MID.05'].includes(id))return !!a.houseOpen&&!s.hypnosis?.struck;
 if(['A2.S14.MID.06','A2.S14.POPUP.01'].includes(id))return !!s.hypnosis?.struck&&(s.walks['14.hypnosis']?.distance||0)>=b.honroV4Hypnosis.minimumDistance&&!separated(b);
 if(id==='A2.S14.MID.07')return !!s.hypnosisWarning&&!separated(b);
 if(id==='A2.S14.MID.08')return done(b,'warning')&&!separated(b)&&V.heroes(b).some(h=>h.cls==='mage'&&V.near(h,u,650));
 if(['A2.S14.MID.09','A2.S14.MID.10','A2.S14.MID.11'].includes(id))return separated(b);
 if(/^A2\.S14\.COMPLETE\./.test(id)||id==='A2.S14.JOURNAL.01')return sheltered(b);
 return id==='A2.S14.OBJECTIVE.01'||id==='A2.S14.OBJECTIVE.02';
}
function observe(b){const q=mem(b),p=home(b);q.positions??={};for(const u of foes(b,p,1000)){const d=Math.hypot(u.x-p.x,u.y-p.y),old=q.positions[u.id];q.positions[u.id]={x:u.x,y:u.y,d};if(!q.approach&&old&&d<old.d-1&&Math.hypot(u.x-old.x,u.y-old.y)>1)q.approach={actor:u.id,from:old,to:{x:u.x,y:u.y},distance:old.d-d};}}
function drive(app,api){const b=app.engine.b,q=api.memory(b),s=physical(b),a=base(b);observe(b);if(!api.safe(app))return;
 const begin=(key,ids,proof={})=>api.begin(app,key,ids,proof);
 if(!q.events.arrival){begin('arrival',['EDGE.ARRIVALS_14_0']);return;}
 if(nearHome(b)&&!q.events.voice){begin('voice',['A2.S14.INTRO.01'],{insideHouse:true});return;}
 if(done(b,'voice')&&!q.events.news&&father(app.profile)){begin('news',['A2.S14.INTRO.02','A2.S14.INTRO.03','A2.S14.INTRO.04'],{masonRescued:true});return;}
 if(done(b,'news')&&!q.events.approach&&(q.approach||clearDoor(b))){begin('approach',['A2.S14.MID.01','A2.S14.MID.02'],q.approach||{alreadyCleared:true});return;}
 if(done(b,'news')&&clearDoor(b)&&done(b,'approach')&&!q.events.invite){begin('invite',['A2.S14.MID.03'],{doorClear:true});return;}
 if(a.houseOpen&&!q.events.door){begin('door',['A2.S14.MID.04','A2.S14.MID.05'],a.proof['14.house']);return;}
 if(s.proof['14.bell']&&!q.events.hypnosis){begin('hypnosis',['A2.S14.MID.06','A2.S14.POPUP.01'],s.proof['14.bell']);return;}
 if(s.hypnosisWarning&&done(b,'hypnosis')&&!q.events.warning){begin('warning',['A2.S14.MID.07'],s.hypnosisWarning);return;}
 if(done(b,'warning')&&!q.events.separate&&allow(app,{id:'A2.S14.MID.08'})){begin('separate',['A2.S14.MID.08'],{mage:api.actor(b,'담허')?.id});return;}
 if(separated(b)&&!q.events.recovery){begin('recovery',['A2.S14.MID.09','A2.S14.MID.10','A2.S14.MID.11'],a.proof['14.extract']);return;}
 if(sheltered(b)&&done(b,'recovery')&&!q.events.refuge){begin('refuge',['A2.S14.COMPLETE.01','A2.S14.COMPLETE.02','A2.S14.COMPLETE.03'],s.proof['14.refuge']);return;}
 if(sheltered(b)&&done(b,'refuge'))api.journal(app,'A2.S14.JOURNAL.01');
}
function before(app,api){const b=app.engine.b,q=api.memory(b),a=base(b),s=physical(b);
 if(!done(b,'news'))return false;
 if(clearDoor(b)&&!done(b,'invite'))return false;
 if(a.houseOpen&&!done(b,'door'))return false;
 if(s.proof['14.bell']&&!done(b,'hypnosis'))return false;
 if(s.hypnosisWarning&&!done(b,'warning'))return false;
 if(separated(b)&&!done(b,'recovery'))return false;
 return true;
}
P.register(14,{mapRevision:514,actors:{'길찬':'14.gilchan'},allow,drive,before,optional,
 camera(app,key,ids,proof){const b=app.engine.b,targets=[{actor:'14.gilchan'}];
  if(['arrival','voice','news','invite','door'].includes(key))targets.push({marker:'14.house'});
  if(key==='approach')targets.push(proof.actor?{actor:proof.actor}:{marker:'14.house'});
  if(['hypnosis','warning','separate'].includes(key))targets.push({...b.honroV4Hypnosis.warningPoint});
  if(['recovery','refuge'].includes(key))targets.push({marker:'14.refuge'});
  return{id:'14.reviewed.'+key,intent:'situation',targets,padding:80,maxScale:.72};
 },
 objective:b=>base(b).houseOpen?'A2.S14.OBJECTIVE.02':'A2.S14.OBJECTIVE.01',
 failure:b=>b.phase==='lost'||S.failure(b)?'A2.S14.FAIL.01':null,
 complete:b=>sheltered(b)&&done(b,'refuge')&&!!mem(b).journal,
 prepare(b){const u=gil(b);if(u&&!physical(b).hypnosis&&!base(b).proof['14.extract'])u.honroHypnotized=false;},
 use(app,m,s){const b=app.engine.b;if(s.id==='14.house'&&!done(b,'invite'))return false;if(s.id==='14.extract'&&(!done(b,'hypnosis')||!done(b,'warning')||!done(b,'separate')))return false;return undefined;}
});
G.HonroAct23V4Reviewed14={sheltered,separated};
})(globalThis);
