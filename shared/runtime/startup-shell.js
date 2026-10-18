(function(G){'use strict';
// This controller neither reads a save nor queues a game action. It never consumes input/audio gestures.
let ready=false;
const host=document.getElementById('app');
G.HonroStartup={
 ready(){ready=true;document.documentElement.dataset.honroReady='true';},
 failed(){const title=host.querySelector('.honro-title');if(!title)return;title.removeAttribute('aria-busy');title.querySelector('.title-actions').innerHTML='<button type="button" class="primary" data-startup-retry>다시 시도</button>';},
 async firstPaint(){if(G.HONRO_EMBEDDED)return;const images=[...host.querySelectorAll('.title-painting img,.honro-logo')];await Promise.race([Promise.all(images.map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});}))),new Promise(resolve=>setTimeout(resolve,1200))]);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));}
};
document.addEventListener('click',event=>{const button=event.target.closest?.('[data-startup-start],[data-startup-retry]');if(!button)return;if(button.hasAttribute('data-startup-retry'))location.reload();else if(!ready)button.textContent='준비 중';});
})(globalThis);
