/** Formation uses only current observed units/supports and visible tide state. */
export function tideRetreatRequired(b,u){const t=b.honroAct4PreviewState?.tide,cfg=b.honroAct4Design?.tide;return !!t&&!!cfg&&u.y>=cfg.high-50&&(t.phase==='high'||t.phase==='rising'&&b.round>=t.highRound-1);}
export function tideRefuge(cls){return {knight:1550,occultist:1670,mage:1820,archer:1960}[cls]||1800;}
export function finaleDeckGoal(u,{b,support,foes,surface}){
 const danger=tideRetreatRequired(b,u),t=b.honroAct4PreviewState?.tide;
 if((danger||t?.phase==='high')&&support==='approved40-departure-stair')return{x:tideRefuge(u.cls),kind:'visible-tide-refuge',hold:true};
 if(u.cls==='knight')return null;
 if(support==='approved40-dock-stair')return{x:1800,kind:'front-team-descend'};
 if(support==='approved40-dock'){
  const front=foes.filter(v=>surface(v)===support&&v.x>=1450&&Math.abs(v.y-u.y)<500).sort((a,z)=>Math.abs(a.x-u.x)-Math.abs(z.x-u.x));
  if(front.length){const v=front[0],spacing=u.cls==='occultist'?360:300;return{x:Math.max(1600,v.x+(v.x>=u.x?-spacing:spacing)),target:v.id,kind:'front-dock-clear'};}
  return{x:2200,drop:true,driftRight:true,kind:'ordinary-deck-drop'};
 }
 if(support==='a4-return-deck')return{x:{mage:2480,archer:2800,occultist:2260}[u.cls],kind:'wide-deck-firing-lane',hold:true};
 if(['approved40-departure-stair','approved40-departure-ramp'].includes(support))return{x:2480,kind:'join-wide-deck'};
 return null;
}
