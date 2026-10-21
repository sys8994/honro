(function(G){'use strict';
// Stable numeric asset IDs keep cached MP3 URLs independent of display titles.
const titles=Object.freeze({
 '01':'떠나지 못한 이들을 위해',
 '02':'고갯길의 징조',
 '03':'머리 위의 불길',
 '04':'재가 흩날리는 밤',
 '05':'산 자와 남은 자'
});
function titleFor(source){
 let name=String(source||'').split('/').pop().split(/[?#]/)[0];
 try{name=decodeURIComponent(name);}catch{/* Unknown external names remain readable. */}
 const id=name.match(/^(\d{2})(?:\s|$)/)?.[1];
 return titles[id]||name.replace(/\.mp3$/i,'').replace(/^\d+\s*/,'').replace(/^(?:(?:boss\s+)?battle|main)\s+theme\s*-\s*/i,'');
}
G.HonroMusicTitles=Object.freeze({titles,titleFor});
})(globalThis);
