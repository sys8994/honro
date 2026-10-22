/** Production S.shift fixture, matching the existing Stage18 traversal setup.
 * This does not test safe-boundary eligibility or a normal battle descent. */
(function(G){G.HonroStage18BellRenderFixture=function(input,phase){
 if(input.honroStage!==18||!['suspended','lowering','settled'].includes(phase))throw Error('Stage18 phase fixture only');
 const b=structuredClone(input),S=G.HonroStage18Bell,m=S.memory(b),distance=b.honroBellDescent.distance;
 if((m.offset||0)!==0)throw Error('Render fixture requires original hanging state');
 if(phase!=='suspended'){
  // Explicit render status, not an actor movement or artificial geometry patch.
  m.status=phase;m.count=phase==='settled'?1:0;m.startOffset=0;m.duration=.9;m.elapsed=phase==='lowering'?.45:.9;
  b.sceneVersion=(b.sceneVersion||0)+1;S.shift(b,distance*(phase==='lowering'?.5:1));
 }
 return{battle:b,scope:'Forced '+phase+' render using production bell shift; original actors exact. No prerequisite, sweep occupancy, safe-boundary, combat or save-completion claim.'};
};})(globalThis);
