(function(G){'use strict';
// PhaseA's extraction actor is a visual attachment, never a 1HP combat target.
// Keep the real actor and its separation state; paint it without debug IDs/bars.
const S=G.HonroScene.prototype,unit=S.unit,body=S.unitBody;
function attached(scene,u){return G.HonroAct23V4Chapter26Reviewed?.active(scene.battle)&&u.id==='v4.workshop-spirit';}
function spirit(scene,c,u){if(u.dead||u.hp<=0)return;c.save();c.translate(u.x,u.y);c.fillStyle='#a8c4b84d';c.strokeStyle='#bbd0c1';c.lineWidth=2;c.beginPath();c.ellipse(0,5,17,32,.15,0,Math.PI*2);c.fill();c.stroke();c.beginPath();c.moveTo(-15,23);c.bezierCurveTo(-30,43,25,35,8,57);c.stroke();c.restore();}
S.unit=function(c,u,...args){if(attached(this,u)){spirit(this,c,u);return;}return unit.call(this,c,u,...args);};S.unitBody=function(c,u,...args){if(attached(this,u)){spirit(this,c,u);return;}return body.call(this,c,u,...args);};
})(globalThis);
