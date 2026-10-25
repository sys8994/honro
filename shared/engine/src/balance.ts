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
/** Ordinary campaign attacks only. Stored base and current attack migrate together. */
export const CAMPAIGN_ENEMY_DAMAGE = 1.35;
export function migrateCampaignEnemyDamage(u:Unit){
 const v=u as any;
 if(u.side!==1||u.summoned||u.enthrall||u.boss||u.honroMidboss||v.honroFinalBoss||u.honroObjectiveTarget||u.role==='dummy'||v.honroEnemyDamageRevision===1)return;
 u.attack*=CAMPAIGN_ENEMY_DAMAGE;
 if(Number.isFinite(u.combatBaseAttack))u.combatBaseAttack!*=CAMPAIGN_ENEMY_DAMAGE;
 v.honroEnemyDamageRevision=1;
}
export function migrateCampaignActionBudget(b:Battle){
 const v=b as any;
 if(b.mode!=='campaign'||!v.honroStage||v.honroStage===19||v.honroCustom||v.honroMapOrigin==='workshop'||v.honroActionBudgetRevision===1)return;
 const limit=v.honroActiveLimit??b.enemyLimit;
 // Six is the existing scripted finale ceiling. Noncombat zero stays zero.
 if(limit>0&&limit<6&&!(v.honroStage===10&&v.honroState?.sodanCoop))v.honroActiveLimit=Math.min(6,limit+1);
 else v.honroActiveLimit=limit;
 b.enemyLimit=v.honroActiveLimit;v.honroActionBudgetRevision=1;
}
export const MANA_COST_MULTIPLIER = 1.95;
/** Damheo's offensive cast budget; applied once before descendants inherit damage. */
export const PLAYER_MAGE_DAMAGE_MULTIPLIER = 1.20;
/** Additional player-only tuning; legacy side-zero NPC budgets stay at 1.20. */
export const PLAYER_MAGE_OFFENSE_BOOST = 1.18;
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
 migrateCampaignActionBudget(b);
 b.difficulty=difficulty;b.enemyLimit=(b as any).honroActiveLimit??DIFFICULTIES[difficulty].active;
 for(const u of b.units){
  if(u.honroObjectiveTarget||u.side!==1||u.role==='dummy')continue;
  if(b.mode==='campaign'&&(b as any).honroStage&&!(b as any).honroCustom&&(b as any).honroMapOrigin!=='workshop')migrateCampaignEnemyDamage(u);
  const oldMax=u.maxHp, fraction=oldMax>0?u.hp/oldMax:0;
  // A resumed old battle retains its original stats until the next battlefield is entered.
  if(u.combatBaseHp===undefined||u.combatBaseAttack===undefined)continue;
  u.maxHp=Math.round(u.combatBaseHp*DIFFICULTIES[difficulty].hp);
  u.hp=u.dead?0:Math.min(u.maxHp,Math.max(u.hp>0?1:0,Math.floor(fraction*u.maxHp+1e-8)));
  u.attack=u.combatBaseAttack*DIFFICULTIES[difficulty].damage;
 }
}
export function makeElite(u:Unit){
 if(u.honroObjectiveTarget||u.side!==1||u.boss||u.role==='dummy'||u.elite)return u;
 u.elite=true;u.name='정예 '+u.name;u.r*=1.25;u.h*=1.25;
 u.maxHp=u.hp=Math.round(u.maxHp*1.75);u.attack*=1.30;
 u.armor=Math.min(.55,u.armor+.04);u.maxMove*=1.08;u.moveLeft=u.maxMove;
 u.xpBudget=Math.round(u.xpBudget*1.55);
 return u;
}
