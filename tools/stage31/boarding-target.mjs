/** Read the current authored objective; never reuse an old-map pixel target. */
export function boardingTarget(b){
 const c=b?.honroAct4Design?.boarding;
 if(!c||!['boardX1','boardX2','deckY'].every(k=>Number.isFinite(c[k]))||c.boardX1>=c.boardX2)throw Error('Current authored boarding geometry required');
 return {left:c.boardX1,right:c.boardX2,x:(c.boardX1+c.boardX2)/2,y:c.deckY};
}
