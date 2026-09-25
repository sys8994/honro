/** Enemy tuning is centralized. Difficulty scales stats once, never damage a second time. */
import type { Battle, Unit } from './types';
import { clamp } from './math';
export const GAME_NAME = 'ARCFALL';
export const GAME_NAME_KO = '아크폴';
export const ACTION_REVIEW_SECONDS = .65;
export const CHARGE_ACCELERATION = 480;
export const MAX_CHARGE_SECONDS = 5;
export const VOLLEY_INTERVAL = .5;
export const VOLLEY_SPREAD = 2;
export const ENEMY_DENSITY = 1;
export const ENEMY_GLOBAL_STAT = .85;
export const MANA_COST_MULTIPLIER = 1.95;
export const DIFFICULTIES = {
 explorer: {name:'탐험', hp:.90, damage:.78, active:6, aim:4.4},
 story: {name:'원정', hp:1.05, damage:.92, active:8, aim:3.4},
 normal: {name:'전술', hp:1.30, damage:1.16, active:10, aim:2.25},
 veteran: {name:'숙련', hp:1.55, damage:1.38, active:10, aim:1.25},
 nightmare: {name:'결전', hp:1.82, damage:1.62, active:10, aim:.62}
} as const;
export function stageStrength(id:number){const n=clamp(id,1,36)-1;return {hp:1+.022*n+.00035*n*n,damage:1+.018*n+.00022*n*n};}
export const enlargedGroup=(old:number)=>Math.ceil(old*ENEMY_DENSITY);
/** Campaign headcount deliberately rises before quality takes over. */
export function campaignEnemyCount(stage:number){const id=clamp(Math.round(stage),1,36);return id<=18?Math.round(8+(id-1)*(22/17)):30;}
export function campaignEliteShare(stage:number){const id=clamp(Math.round(stage),1,36);return .10+Math.max(0,id-12)/24*.10;}

/** Keep damage taken in fractional-health terms; repeatedly changing settings cannot heal. */
export function setDifficulty(b:Battle,difficulty:Battle['difficulty']){
 b.difficulty=difficulty;b.enemyLimit=(b as any).honroActiveLimit??DIFFICULTIES[difficulty].active;
 for(const u of b.units){
  if(u.side!==1||u.role==='dummy')continue;
  const oldMax=u.maxHp, fraction=oldMax>0?u.hp/oldMax:0;
  // A resumed old battle retains its original stats until the next battlefield is entered.
  if(u.combatBaseHp===undefined||u.combatBaseAttack===undefined)continue;
  u.maxHp=Math.round(u.combatBaseHp*DIFFICULTIES[difficulty].hp);
  u.hp=u.dead?0:Math.min(u.maxHp,Math.max(u.hp>0?1:0,Math.floor(fraction*u.maxHp+1e-8)));
  u.attack=u.combatBaseAttack*DIFFICULTIES[difficulty].damage;
 }
}
export function makeElite(u:Unit){
 if(u.side!==1||u.boss||u.role==='dummy'||u.elite)return u;
 u.elite=true;u.name='정예 '+u.name;u.r*=1.25;u.h*=1.25;
 u.maxHp=u.hp=Math.round(u.maxHp*1.75);u.attack*=1.30;
 u.armor=Math.min(.55,u.armor+.04);u.maxMove*=1.08;u.moveLeft=u.maxMove;
 u.xpBudget=Math.round(u.xpBudget*1.55);
 return u;
}
