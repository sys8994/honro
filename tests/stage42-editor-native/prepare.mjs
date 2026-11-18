import fs from 'node:fs';
import {installEditor} from './patch.mjs';
const files=fs.readdirSync('web/runtime').filter(x=>/^workshop-app\..+\.js$/.test(x));
if(files.length!==1)throw Error('Unexpected workshop runtime count: '+files.length);
const file='web/runtime/'+files[0];
fs.writeFileSync(file,installEditor(fs.readFileSync(file,'utf8')));
