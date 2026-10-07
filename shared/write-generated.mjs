import {readFile,writeFile,rename,unlink} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';

// Publish complete generated files together. In particular, a failed write in
// a cloud-synced workspace must not truncate the previous playable HTML.
export async function writeGenerated(file,data){
  try{if(await readFile(file,'utf8')===data)return;}catch(error){if(error.code!=='ENOENT')throw error;}
  const temporary=file+'.build-'+randomUUID();
  try{await writeFile(temporary,data);await rename(temporary,file);}
  finally{try{await unlink(temporary);}catch(error){if(error.code!=='ENOENT')throw error;}}
}
