(function(G){'use strict';
// Embedded/full pages already execute these scripts in their original order.
// Game requests them only on use; an unsuccessful module URL needs a new retry
// query because browsers remember failed dynamic imports for that exact URL.
const pending=new Map(),failures=new Map();
G.HonroOptionalRuntime={load(name){
 const entry=G.HONRO_OPTIONAL_MODULES[name];
 if(!entry)return Promise.reject(Error('Unknown optional runtime '+name));
 if(G[entry.global])return Promise.resolve(G[entry.global]);
 if(pending.has(name))return pending.get(name);
 const url=new URL(entry.url),attempt=failures.get(name)||0;
 if(attempt)url.searchParams.set('honroRetry',attempt);
 const task=import(url.href).then(()=>{
  if(!G[entry.global])throw Error('Optional runtime did not register '+name);
  return G[entry.global];
 }).catch(error=>{if(pending.get(name)===task)pending.delete(name);failures.set(name,attempt+1);throw error;});
 pending.set(name,task);return task;
}};
})(globalThis);
