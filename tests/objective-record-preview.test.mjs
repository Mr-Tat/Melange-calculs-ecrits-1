import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';

// Test de transformation du VRAI moteur, sans WebDriver ni session Supabase.
// N'atteste PAS la jouabilité au clavier, le serveur ni une validation authentifiée.
const preview=readFileSync(new URL('../essai-objectif-record-3-vies.html',import.meta.url),'utf8');
const native=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const loaderSource=preview.match(/<script>([\s\S]*?)<\/script>/)?.[1]?.trim();
const labV2=readFileSync(new URL('../lab-objectif-record-v2.js',import.meta.url),'utf8');

async function compilePreview(motor=native){
 assert.ok(loaderSource,'Le chargeur de la démo doit être présent');
 const state={textContent:'',removed:false,remove(){this.removed=true}};
 const frame={srcdoc:'',hidden:false,contentDocument:null,addEventListener(){}};
 const select={value:'free',addEventListener(){}};
 const doc={getElementById:id=>{
  if(id==='state')return state;
  if(id==='game')return frame;
  return select;
 }};
 const labWindow={};
 new Function('window',labV2)(labWindow);
 await new Function('document','fetch','window','return '+loaderSource)(doc,async()=>({ok:true,text:async()=>motor}),labWindow);
 return {state,frame};
}
test('essai isolé : carte, trois vies, sous-titre et bonus sans crédit serveur',async()=>{
 assert.match(preview,/Réseau désactivé|Réseau désactivé dans cet essai/);
 assert.match(preview,/Storage\.prototype\.setItem/);
 assert.match(preview,/Sans trophée/);
 assert.match(preview,/Deux façons de marquer un gros score\./);
 assert.match(preview,/\+20 % de points/);
 assert.doesNotMatch(preview,/50 % des XP|100 % des XP|XP et bonus présentés à titre indicatif/);
 const {state,frame}=await compilePreview();
 assert.equal(state.textContent,'');
 assert.equal(state.removed,true);
 assert.ok(frame.srcdoc.length>native.length);
 assert.match(frame.srcdoc,/threeLivesHud/);
 assert.match(frame.srcdoc,/session\.hearts/);
 assert.match(frame.srcdoc,/startSession\('three-lives'\)/);
 assert.match(frame.srcdoc,/prefers-reduced-motion/);
 assert.match(frame.srcdoc,/fill="#303540"/);
 assert.match(frame.srcdoc,/Objectif record/);
 assert.match(frame.srcdoc,/Reste|classic-xp-remaining/); // CSS du faux aperçu, aucune authentification.
});
test('chaque script injecté et natif reste syntaxiquement compilable',async()=>{
 const {frame}=await compilePreview();
 const scripts=[...frame.srcdoc.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
 assert.ok(scripts.length>15);
 for(const [i,match] of scripts.entries()){
  if(/type=["']module/.test(match[1])||/src=/.test(match[1]))continue;
  assert.doesNotThrow(()=>new Script(match[2]),'Script invalide '+i);
 }
});
test('nouveaux essais : score visible, 3 vies HARD et trophées sans compte réel',async()=>{
 const {frame}=await compilePreview();
 assert.match(frame.srcdoc,/MathasLabV2Update/);
 assert.match(frame.srcdoc,/mlab-pair/);
 assert.match(frame.srcdoc,/mlab-cup/);
 assert.match(frame.srcdoc,/hardSession\.hearts/);
 assert.doesNotMatch(labV2,/connect-results|supabase\.co|fetch\(/i);
});
test('ancrages exacts : un moteur inconnu fait échouer la démo sans affichage fallacieux',async()=>{
 const {state,frame}=await compilePreview('<html><head></head><body>Mauvais moteur</body></html>');
 assert.equal(frame.srcdoc,'');
 assert.equal(frame.hidden,true);
 assert.match(state.textContent,/moteur|Moteur|Essai/);
});
