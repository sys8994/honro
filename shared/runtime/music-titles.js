(function(G){'use strict';
// Display metadata follows the attachment title, independently of MP3 ID3 tags.
const titles=Object.freeze(Object.fromEntries((G.HONRO_BGM_METADATA||[]).map(t=>[t.id,t.title])));
function titleFor(source){
 let name=String(source||'').split('/').pop().split(/[?#]/)[0];
 try{name=decodeURIComponent(name);}catch{/* Unknown external names remain readable. */}
 const id=name.replace(/\.mp3$/i,'');
 return titles[id]||id.replace(/^\[[^\]]*\]\s*\]?\s*/,'');
}
G.HonroMusicTitles=Object.freeze({titles,titleFor});
})(globalThis);
