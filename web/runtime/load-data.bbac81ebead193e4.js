const root=new URL('../../',import.meta.url);
const requests=new Map();
function request(file,text=false){const url=new URL(file,root).href,key=url+'|'+text;if(!requests.has(key))requests.set(key,fetch(url).then(response=>{if(!response.ok)throw Error('Load failed: '+response.status+' '+url);return text?response.text():response.json();}));return requests.get(key);}
async function hydrate(value){if(!value||typeof value!=='object')return value;if(value.$honroAsset){const url=new URL(value.$honroAsset,root).href;if(value.$honroAsset.endsWith('.svg')){globalThis.HONRO_SVG_SOURCES??=Object.create(null);globalThis.HONRO_SVG_SOURCES[url]=await request(value.$honroAsset,true);}return url;}if(Array.isArray(value))return Promise.all(value.map(hydrate));return Object.fromEntries(await Promise.all(Object.entries(value).map(async([k,v])=>[k,await hydrate(v)])));}
export async function loadData(file){return hydrate(await request(file));}
export async function loadProject(file){const manifest=await request(file);const [base,library,stages]=await Promise.all([loadData(manifest.base),loadData(manifest.library),Promise.all(manifest.stages.map(loadData))]);return {...base,library,stages};}
