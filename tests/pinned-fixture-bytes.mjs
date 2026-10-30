/** Storage compression never changes a pinned fixture's canonical identity or hash. */
import {existsSync,readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
const filename=p=>p instanceof URL?fileURLToPath(p):p;
export function pinnedFixtureExists(p){const f=filename(p);return existsSync(f)||existsSync(f+'.gz');}
export function readPinnedFixtureBytes(p){
 const f=filename(p);
 // A present raw file is authoritative; do not hide read errors behind fallback.
 return existsSync(f)?readFileSync(f):gunzipSync(readFileSync(f+'.gz'));
}
