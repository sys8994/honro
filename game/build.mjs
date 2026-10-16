import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {buildWeb} from '../shared/web-build.mjs';

export const buildGame=options=>buildWeb(options);
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await buildGame();
