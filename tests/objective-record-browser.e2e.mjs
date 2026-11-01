import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// Chrome headless réel, moteur Mélange natif et page de démo sous serveur HTTP local.
// AUCUN JWT / Supabase / compte élève. Ne prouve pas le crédit XP authentifié.
const host='http://127.0.0.1:8123/essai-objectif-record-3-vies.html';
const mobileUA='Mozilla/5.0 (Linux; Android 14; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
test('Mélange : 2 modes, aucun XP en libre, 7 sélections distinctes en aperçu simulé',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:850}});
  const network=[];
  page.on('request',req=>{if(/supabase\.co/.test(req.url()))network.push(req.url())});
  await page.goto(host,{waitUntil:'domcontentloaded'});
  const frame=page.frameLocator('#game');
  await frame.locator('#startThreeLives').waitFor({timeout:20000});
  assert.equal(await frame.locator('#startThreeLives').count(),1);
  assert.equal(await frame.locator('#suddenBtn').count(),1);
  assert.equal(await frame.locator('#menuScreen .countBtn[data-count]').count(),3);
  assert.equal(await frame.locator('.classic-xp-remaining').count(),0);
  await page.locator('#xpMode').selectOption('fake');
  await frame.locator('.classic-xp-remaining').first().waitFor();
  const all=await frame.locator('.classic-xp-remaining').allTextContents();
  assert.equal(all.length,3);
  assert.ok(all.every(x=>/^Reste \d+ XP$/.test(x)));
  const prev=await frame.locator('.countBtn[data-count="4"] .classic-xp-remaining').textContent();
  // Changer vraiment les opérations cochées, sans dériver de l'ancienne sélection.
  await frame.locator('#opsSelector [data-op="mul"]').click();
  const two=await frame.locator('.countBtn[data-count="4"] .classic-xp-remaining').textContent();
  assert.notEqual(prev,two);
  // Vérifier les sept choix réellement cochés, sans confondre deux couples
  // ayant la même taille ; montants fictifs de l'aperçu, jamais droits serveur.
  const combinations=[
   ['add'],['sub'],['mul'],['add','sub'],['add','mul'],['sub','mul'],['add','sub','mul']
  ];
  // Valeurs d'aperçu fictives du niveau 1, jamais les droits XP Connect.
  const expected4={'add':7,'sub':6,'mul':8,'add,sub':14,'add,mul':15,'sub,mul':16,'add,sub,mul':28};
  const observed=new Map();
  for(const wanted of combinations){
   // Activer d'abord toutes les opérations voulues : jamais zéro opération.
   for(const op of wanted){
    const button=frame.locator('#opsSelector [data-op="'+op+'"]');
    if(!await button.evaluate(el=>el.classList.contains('active')))await button.click();
   }
   for(const op of ['add','sub','mul'].filter(op=>!wanted.includes(op))){
    const button=frame.locator('#opsSelector [data-op="'+op+'"]');
    if(await button.evaluate(el=>el.classList.contains('active')))await button.click();
   }
   const selected=await frame.locator('#opsSelector .op-toggle.active').evaluateAll(nodes=>
    nodes.map(el=>el.dataset.op).sort().join(','));
   assert.equal(selected,wanted.join(','),'Les opérations cochées doivent correspondre');
   // Le parent actualise l'aperçu par setTimeout(0) après le clic dans l'iframe.
   // Une lecture immédiate attrape parfois la valeur précédente (CI flaky).
   const key=wanted.join(',');
   await frame.locator('.countBtn[data-count="4"] .classic-xp-remaining')
    .filter({hasText:'Reste '+expected4[key]+' XP'}).waitFor({timeout:3000});
   const shown=await frame.locator('.countBtn[data-count="4"] .classic-xp-remaining').textContent();
   assert.equal(shown,'Reste '+expected4[key]+' XP');
   observed.set(key,shown);
  }
  assert.equal(observed.size,7);
  assert.notEqual(observed.get('add,sub'),observed.get('add,mul'));
  assert.notEqual(observed.get('add'),observed.get('sub'));
  // Les trois niveaux changent l'aperçu, via le véritable sélecteur visible.
  for(const level of [1,2,3]){
   await frame.locator('#levelBtn').click();
   await frame.locator('#levelMenu .level-option:not(.hard)').nth(level-1).click();
   const displayed=await frame.locator('.countBtn[data-count="20"] .classic-xp-remaining').textContent();
   assert.match(displayed,/^Reste \d+ XP$/);
  }
  await page.locator('#xpMode').selectOption('zero');
  assert.deepEqual(await frame.locator('.classic-xp-remaining').allTextContents(),['Reste 0 XP','Reste 0 XP','Reste 0 XP']);
  await page.locator('#xpMode').selectOption('free');
  assert.equal(await frame.locator('.classic-xp-remaining').count(),0);
  assert.deepEqual(network,[]);
 }finally{await browser.close()}
});
test('Mélange : moteur réel, 3 cœurs dans le bandeau, PC et téléphone 320 px',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const mobile of [false,true]){
   const page=await browser.newPage({viewport:mobile?{width:320,height:650}:{width:1440,height:900},
     ...(mobile?{isMobile:true,hasTouch:true,userAgent:mobileUA}:{}),reducedMotion:'reduce'});
   await page.goto(host,{waitUntil:'domcontentloaded'});
   const frame=page.frameLocator('#game');
   await frame.locator('#startThreeLives').waitFor({timeout:20000});
   const left=await frame.locator('#startThreeLives').boundingBox();
   const right=await frame.locator('#suddenBtn').boundingBox();
   assert.ok(left&&right,'Les 2 boutons doivent être visibles');
   assert.ok(left.x+left.width<=right.x+2,'Les 2 boutons ne doivent pas se chevaucher');
   await frame.locator('#startThreeLives').click();
   await frame.locator('#threeLivesHud .demo-heart').first().waitFor({timeout:15000});
   assert.equal(await frame.locator('#threeLivesHud .demo-heart').count(),3);
   assert.equal(await frame.locator('#threeLivesHud').getAttribute('hidden'),null);
   const mode=await frame.locator('#sessionMode').textContent();
   assert.match(mode,/❤️/);
   await page.close();
  }
 }finally{await browser.close()}
});
