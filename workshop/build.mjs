import {buildWeb} from '../shared/web-build.mjs';
const args=process.argv.slice(2);if(args.length && (args.length!==2||args[0]!=='--preview'))throw Error('Use --preview <isolated-name> for unpublished QA');
await buildWeb(args.length?{preview:args[1]}:{});
console.log('Built Game, Workshop and the direct Playtest document with shared external modules');
