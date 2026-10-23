(function(G){'use strict';
// Row identities, not rewritten text or elapsed wall time, own the hand staging.
const A=G.HonroAct2,rank={gripping:0,weak:1,released:2,bound:3},release='18.beats.keeper:49ba953239';
const active=app=>app.engine?.b.honroStage===18&&!app.engine.b.honroCustom;
function memory(app){const b=app.engine.b;b.honroState.keeperStaging??={version:1,pose:'gripping'};return b.honroState.keeperStaging;}
function pose(app,value){const s=memory(app);if(rank[value]>rank[s.pose])s.pose=value;app.dirty=true;}
function start(app){if(!active(app))return;const line=app.dialogue?.lines[app.dialogue.index],id=line?.[2]?.rowId||'',s=memory(app);
 if(id.startsWith('18.beats.keeper:'))pose(app,'weak');
 if(id.startsWith('18.outro:')&&app.engine.unit('act2-keeper')?.honroSubdued)pose(app,'bound');
 if(['18.story:f34141f034','18.story:a7e89092ab','18.story:e84e4946a0'].includes(id)&&s.cue!==id){s.cue=id;app.audio?.play('qiRebound');}
}
const lineStart=G.HonroStoryStaging.lineStart;G.HonroStoryStaging.lineStart=function(app,...args){const out=lineStart?.(app,...args);start(app);return out;};
const lineEnd=G.HonroStoryStaging.lineEnd;G.HonroStoryStaging.lineEnd=function(app,...args){if(active(app)){const id=app.dialogue?.lines[app.dialogue.index]?.[2]?.rowId;if(id===release)pose(app,'released');delete memory(app).cue;}return lineEnd?.(app,...args);};
const finish=G.HonroStoryStaging.finish;G.HonroStoryStaging.finish=function(app,...args){const out=finish?.(app,...args);if(!out&&active(app)&&app.dialogue?.lines.some(l=>l[2]?.rowId===release)){pose(app,'released');delete memory(app).cue;if(app.dialogue.lines.some(l=>l[2]?.rowId?.startsWith('18.outro:')))pose(app,'bound');}return out;};
const attach=A.attach;A.attach=function(app,e){const out=attach(app,e);if(active(app)&&e.unit('act2-keeper')?.honroSubdued&&e.b.phase==='won'&&e.b.honroReport?.final)pose(app,'bound');return out;};
G.HonroKeeperRitualStaging={start,pose,memory};
})(globalThis);
