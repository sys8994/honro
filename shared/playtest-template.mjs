/** Keep one literal copy of shared runtime inside the standalone Workshop. */
import assert from 'node:assert/strict';
export const SHARED_BEGIN='/* HONRO_SHARED_RUNTIME_BEGIN */\n';
export const SHARED_END='\n/* HONRO_SHARED_RUNTIME_END */';
export const escapeScript=source=>source.replace(/<\/script/gi,'<\\/script');
export function packPlaytestTemplate(game,commonParts){
 const common=commonParts.join('\n'),escaped=escapeScript(common);
 assert(common&&!common.includes(SHARED_BEGIN)&&!common.includes(SHARED_END),'Shared runtime markers must be unique');
 const at=game.indexOf(escaped);assert(at>=0&&at===game.lastIndexOf(escaped),'Game must contain exactly one identical shared runtime');
 const prefix=game.slice(0,at),suffix=game.slice(at+escaped.length);
 const restore=`globalThis.HONRO_PLAYTEST_HTML=(()=>{const node=document.currentScript;if(!node)throw new Error('Workshop inline runtime is unavailable');const text=node.textContent,begin=${JSON.stringify(SHARED_BEGIN)},end=${JSON.stringify(SHARED_END)},start=text.indexOf(begin),stop=text.indexOf(end,start+begin.length);if(start<0||stop<start)throw new Error('Workshop shared runtime markers are missing');return ${JSON.stringify(prefix)}+text.slice(start+begin.length,stop)+${JSON.stringify(suffix)};})();`;
 return {shared:SHARED_BEGIN+common+SHARED_END,restore,sharedBytes:Buffer.byteLength(escaped),prefix,suffix};
}
