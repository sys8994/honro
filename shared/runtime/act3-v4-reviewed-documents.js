(function(G){'use strict';
// A quoted document inside approved spoken text is one visible presentation,
// not a second reader, collection goal or physical progression gate.
function bind(app,node){const meta=app.dialogue?.lines?.[app.dialogue.index]?.[2],R=G.HonroAct3V4ReviewedCore?.providers.get(meta?.reviewedStage),id=R?.config.documents?.[meta.rowId],r=id&&R.row(id),p=node.querySelector?.('#story-line');if(!r||!p||!G.document?.createTextNode||!p.textContent.includes(r.text))return;const text=p.textContent,index=text.indexOf(r.text),span=document.createElement('span');span.dataset.reviewedDocumentRow=id;span.dataset.reviewedDocument=JSON.stringify(r);span.textContent=r.text;p.replaceChildren(document.createTextNode(text.slice(0,index)),span,document.createTextNode(text.slice(index+r.text.length)));}
G.HonroAct3V4ReviewedDocuments={bind};
})(globalThis);
