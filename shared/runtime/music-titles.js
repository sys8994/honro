(function(G){'use strict';
// Display metadata follows the attachment title, independently of MP3 ID3 tags.
const catalog=G.HONRO_BGM_METADATA||[];
const titles=Object.freeze(Object.fromEntries(catalog.map(t=>[t.id,t.title])));
const byFile=new Map(catalog.map(t=>[t.file,t.title]));
function titleFor(source){
 let name=String(source||'').split('/').pop().split(/[?#]/)[0];
 try{name=decodeURIComponent(name);}catch{/* Unknown external names remain readable. */}
 const id=name.replace(/\.mp3$/i,'');
 return byFile.get(name)||titles[id]||id.replace(/^\[[^\]]*\]\s*\]?\s*/,'');
}
G.HonroMusicTitles=Object.freeze({titles,titleFor});
})(globalThis);
