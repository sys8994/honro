import assert from 'node:assert/strict';
export const escapeScript=s=>s.replace(/<\/script/gi,match=>'<\\/'+match.slice(2));
export function renderCatalogTemplate(template,sections){
 // Callback replacement inserts source literally: JS often contains $', $& or $$.
 const html=template.replace(/\/\* CATALOG_(STYLE|RUNTIME|DATA|ADAPTER|APP) \*\//g,(_,key)=>{
  assert.equal(typeof sections[key],'string','Missing catalog section '+key);
  return key==='STYLE'?sections[key]:escapeScript(sections[key]);
 });
 assert(!/\/\* CATALOG_[A-Z]+ \*\//.test(html),'Unfilled catalog template marker');
 assert.equal((html.match(/<body(?:\s|>)/gi)||[]).length,1,'Catalog must contain one body');
 assert.equal((html.match(/<\/body\s*>/gi)||[]).length,1,'Catalog must close one body');
 return html;
}
