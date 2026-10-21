import ts from '../../game/node_modules/typescript/lib/typescript.js';
import {readFile,readdir,writeFile} from 'node:fs/promises';
const calls=[],captions=[];
for(const file of (await readdir('shared/runtime')).filter(x=>x.endsWith('.js')).sort()){
 const source=await readFile('shared/runtime/'+file,'utf8'),ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 function visit(n){
  if(ts.isCallExpression(n)&&ts.isPropertyAccessExpression(n.expression)){
   const method=n.expression.name.text,receiver=n.expression.expression.getText(ast),code=n.getText(ast);
   if(['app','this','G.HonroStory','G.HonroStoryStaging'].includes(receiver)&&['event','say','sayLines','notify','start','queue'].includes(method))calls.push({file,line:ast.getLineAndCharacterOfPosition(n.getStart()).line+1,receiver,method,classification:method==='notify'?'operational-notice':method==='event'?/kind\s*:\s*['"]narration/.test(code)?'manual-or-conditional-narration':'tactical-or-forwarded-event':receiver.startsWith('G.')?'reader-or-staging-api':'character-dialogue',source:code,historical:file.includes('-v0')});
  }
  if(ts.isPropertyAssignment(n)&&n.name.getText(ast)==='caption'&&ts.isStringLiteral(n.initializer))captions.push({file,line:ast.getLineAndCharacterOfPosition(n.getStart()).line+1,text:n.initializer.text});
  ts.forEachChild(n,visit);
 }visit(ast);
}
await writeFile('_local/reports/story-framing/source-calls.json',JSON.stringify({calls,captions,scope:'Source references, not execution coverage. Historical V0 and internal reader calls are labeled. Native scenario execution is recorded separately.'},null,2));console.log(JSON.stringify({calls:calls.length,captions:captions.length}));
